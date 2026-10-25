import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCustomerSession();
    if (!session || !session.userId) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        parts: [],
      });
    }

    // 1. Fetch confirmed orders for this user (EXCLUDING warranty service orders GAR- so products are never doubled)
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: session.userId },
          ...(session.email ? [{ guestEmail: session.email }] : []),
        ],
        status: {
          notIn: ["CANCELLED", "PAYMENT_REJECTED", "COTIZACION"],
        },
        NOT: {
          orderNumber: { startsWith: "GAR-" },
        },
      },
      select: {
        id: true,
        orderNumber: true,
        itemsJson: true,
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (orders.length === 0) {
      return NextResponse.json({
        success: true,
        authenticated: true,
        parts: [],
      });
    }

    // 2. Fetch all catalog products and combos to cross-check voidsWarranty, and active GAR orders to detect already-covered parts
    const [allProducts, allCombos, activeGarOrders] = await Promise.all([
      prisma.product.findMany({
        select: {
          id: true,
          sku: true,
          slug: true,
          nameEs: true,
          nameEn: true,
          imageUrl: true,
          installationPriceCRC: true,
          voidsWarranty: true,
        },
      }),
      prisma.combo.findMany({
        select: {
          id: true,
          slug: true,
          titleEs: true,
          titleEn: true,
          imageUrl: true,
          category: true,
          installationPriceCRC: true,
        },
      }),
      prisma.order.findMany({
        where: {
          OR: [
            { userId: session.userId },
            ...(session.email ? [{ guestEmail: session.email }] : []),
          ],
          orderNumber: { startsWith: "GAR-" },
          status: { notIn: ["CANCELLED", "cancelado", "PAYMENT_REJECTED", "COMPLETED"] },
        },
        select: { orderNumber: true, itemsJson: true },
      }),
    ]);

    // Build map of parts already covered by active GAR requests
    const activeGarPartMap = new Map<string, string>();
    for (const gar of activeGarOrders) {
      let gItems: any[] = [];
      try {
        gItems = typeof gar.itemsJson === "string" ? JSON.parse(gar.itemsJson) : gar.itemsJson;
      } catch {}
      if (Array.isArray(gItems)) {
        for (const git of gItems) {
          if (git.id) activeGarPartMap.set(String(git.id).toLowerCase(), gar.orderNumber);
          if (git.sku) activeGarPartMap.set(String(git.sku).toLowerCase(), gar.orderNumber);
          if (git.productId) activeGarPartMap.set(String(git.productId).toLowerCase(), gar.orderNumber);
          if (git.rawId) activeGarPartMap.set(String(git.rawId).toLowerCase(), gar.orderNumber);
        }
      }
    }

    // Build lookup maps
    const productLookup = new Map<string, typeof allProducts[0]>();
    allProducts.forEach((p) => {
      if (p.id) productLookup.set(p.id.toLowerCase(), p);
      if (p.sku) productLookup.set(p.sku.toLowerCase(), p);
      if (p.slug) productLookup.set(p.slug.toLowerCase(), p);
    });

    const comboLookup = new Map<string, typeof allCombos[0]>();
    allCombos.forEach((c) => {
      if (c.id) comboLookup.set(c.id.toLowerCase(), c);
      if (c.slug) comboLookup.set(c.slug.toLowerCase(), c);
    });

    const warrantyParts: Array<{
      id: string;
      rawId: string;
      productId?: string;
      sku: string;
      nameEs: string;
      nameEn: string;
      imageUrl: string;
      installationPriceCRC: number;
      deinstallReinstallCostCRC: number;
      orderId: string;
      orderNumber: string;
      purchasedAt: string;
      orderStatus: string;
      type: "PRODUCT" | "COMBO";
      isAlreadyInActiveGAR?: boolean;
      activeGAROrderNumber?: string | null;
    }> = [];

    const seenItemKeys = new Set<string>();

    for (const order of orders) {
      if (!order.itemsJson) continue;
      let itemsList: any[] = [];
      try {
        itemsList = typeof order.itemsJson === "string" ? JSON.parse(order.itemsJson) : order.itemsJson;
      } catch {
        continue;
      }
      if (!Array.isArray(itemsList)) continue;

      for (const it of itemsList) {
        const rawId = String(it.productId || it.id || "");
        const baseId = rawId.split("__")[0].replace(/^combo-/i, "").trim().toLowerCase();
        const rawSku = String(it.sku || "").split("__")[0].trim().toLowerCase();
        const rawSlug = String(it.slug || "").trim().toLowerCase();

        const dbProd =
          (rawSku ? productLookup.get(rawSku) : undefined) ||
          (baseId ? productLookup.get(baseId) : undefined) ||
          (rawSlug ? productLookup.get(rawSlug) : undefined) ||
          productLookup.get(rawId.toLowerCase());

        const dbCombo =
          comboLookup.get(baseId) ||
          (rawSlug ? comboLookup.get(rawSlug) : undefined) ||
          comboLookup.get(rawId.toLowerCase());

        // Check if item voids dealer warranty:
        // 1. Explicit item boolean flag
        // 2. Catalog product with voidsWarranty === true
        // 3. Performance category combo
        const isVoidWarranty =
          it.voidsWarranty === true ||
          Boolean(dbProd?.voidsWarranty) ||
          (dbCombo && dbCombo.category === "performance");

        if (!isVoidWarranty) continue;

        // Deduplicate by item SKU / ID so each unique piece is registered once
        const dedupeKey = String(dbProd?.id || dbProd?.sku || dbCombo?.id || it.sku || it.id || rawId).toLowerCase();
        if (seenItemKeys.has(dedupeKey)) continue;
        seenItemKeys.add(dedupeKey);

        const baseInstall = Math.max(
          10000,
          Number(it.installationPriceCRC) || Number(dbProd?.installationPriceCRC) || Number(dbCombo?.installationPriceCRC) || 20000
        );

        // Core Requirement: install & de-install cost [installation * 2]
        const deinstallReinstallCost = baseInstall * 2;

        const partFinalId = it.id || dbProd?.id || dbCombo?.id || rawId;
        const partSku = dbProd?.sku || it.sku || "";
        const activeGarNum =
          activeGarPartMap.get(String(partFinalId).toLowerCase()) ||
          (partSku ? activeGarPartMap.get(String(partSku).toLowerCase()) : undefined) ||
          activeGarPartMap.get(String(rawId).toLowerCase()) ||
          (partFinalId ? activeGarPartMap.get(`warr_${String(partFinalId).toLowerCase()}`) : undefined);

        warrantyParts.push({
          id: partFinalId,
          rawId,
          productId: dbProd?.id,
          sku: partSku,
          nameEs: dbProd?.nameEs || dbCombo?.titleEs || it.title || it.name || "Accesorio ZxZ",
          nameEn: dbProd?.nameEn || dbCombo?.titleEn || it.nameEn || it.title || "ZxZ Upgrade",
          imageUrl: it.imageUrl || dbProd?.imageUrl || dbCombo?.imageUrl || "/images/placeholder.png",
          installationPriceCRC: baseInstall,
          deinstallReinstallCostCRC: deinstallReinstallCost,
          orderId: order.id,
          orderNumber: order.orderNumber,
          purchasedAt: order.createdAt.toISOString(),
          orderStatus: order.status,
          type: dbCombo ? "COMBO" : "PRODUCT",
          isAlreadyInActiveGAR: Boolean(activeGarNum),
          activeGAROrderNumber: activeGarNum || null,
        });
      }
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      parts: warrantyParts,
    });
  } catch (error: any) {
    console.error("[GET_WARRANTY_PARTS_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al consultar las piezas de protección de garantía" },
      { status: 500 }
    );
  }
}
