import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getCustomerSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: "Debe iniciar sesión para solicitar el Servicio de Protección de Garantía." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { selectedPartIds = [], customerPhone, customerName, notes } = body;

    if (!Array.isArray(selectedPartIds) || selectedPartIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Debe seleccionar al menos una pieza para desinstalación y reinstalación." },
        { status: 400 }
      );
    }

    // 1. Fetch user's confirmed orders to verify ownership ("Only ZxZ parts can be uninstall")
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
        customerName: true,
        customerPhone: true,
        shippingAddress: true,
      },
    });

    const [allProducts, allCombos] = await Promise.all([
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
    ]);

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

    // Gather valid warranty items that belong to the user
    const eligibleItemsMap = new Map<
      string,
      {
        id: string;
        sku: string;
        nameEs: string;
        nameEn: string;
        imageUrl: string;
        installationPriceCRC: number;
        deinstallReinstallCostCRC: number;
        originalOrderNumber: string;
      }
    >();

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

        const isVoidWarranty =
          it.voidsWarranty === true ||
          Boolean(dbProd?.voidsWarranty) ||
          (dbCombo && dbCombo.category === "performance");

        if (!isVoidWarranty) continue;

        const baseInstall = Math.max(
          10000,
          Number(it.installationPriceCRC) || Number(dbProd?.installationPriceCRC) || Number(dbCombo?.installationPriceCRC) || 20000
        );

        // Core Requirement: de-installation & re-installation cost [installation * 2]
        const deinstallReinstallCost = baseInstall * 2;

        const itemKey = it.id || dbProd?.id || dbCombo?.id || rawId;
        eligibleItemsMap.set(itemKey, {
          id: itemKey,
          sku: dbProd?.sku || it.sku || "",
          nameEs: dbProd?.nameEs || dbCombo?.titleEs || it.title || it.name || "Accesorio ZxZ",
          nameEn: dbProd?.nameEn || dbCombo?.titleEn || it.nameEn || it.title || "ZxZ Upgrade",
          imageUrl: it.imageUrl || dbProd?.imageUrl || dbCombo?.imageUrl || "/images/placeholder.png",
          installationPriceCRC: baseInstall,
          deinstallReinstallCostCRC: deinstallReinstallCost,
          originalOrderNumber: order.orderNumber,
        });

        if (it.sku) eligibleItemsMap.set(it.sku, eligibleItemsMap.get(itemKey)!);
        if (dbProd?.id) eligibleItemsMap.set(dbProd.id, eligibleItemsMap.get(itemKey)!);
      }
    }

    // Filter requested parts
    const validatedParts: Array<ReturnType<typeof eligibleItemsMap.get> & object> = [];
    for (const partId of selectedPartIds) {
      const match = eligibleItemsMap.get(partId);
      if (match && !validatedParts.some((p) => p.id === match.id)) {
        validatedParts.push(match);
      }
    }

    if (validatedParts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Solo piezas legítimas adquiridas en ZxZ Mods pueden ser desinstaladas y reinstaladas bajo este servicio.",
        },
        { status: 400 }
      );
    }

    // Strict Requirement: Prevent duplicate GAR creation if user already has an active GAR with the same parts
    const existingGarOrders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: session.userId },
          ...(session.email ? [{ guestEmail: session.email }] : []),
        ],
        orderNumber: { startsWith: "GAR-" },
        status: {
          notIn: ["CANCELLED", "cancelado", "PAYMENT_REJECTED", "COMPLETED"],
        },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        itemsJson: true,
      },
    });

    for (const gar of existingGarOrders) {
      let garItems: any[] = [];
      try {
        garItems = typeof gar.itemsJson === "string" ? JSON.parse(gar.itemsJson) : gar.itemsJson;
      } catch {}
      if (!Array.isArray(garItems)) continue;

      const activePartKeys = new Set<string>();
      for (const item of garItems) {
        if (item.id) activePartKeys.add(String(item.id).toLowerCase());
        if (item.rawId) activePartKeys.add(String(item.rawId).toLowerCase());
        if (item.productId) activePartKeys.add(String(item.productId).toLowerCase());
        if (item.sku) activePartKeys.add(String(item.sku).toLowerCase());
        if (item.originalSku) activePartKeys.add(String(item.originalSku).toLowerCase());
      }

      for (const p of validatedParts) {
        const checkKeys = [p.id, p.sku].filter(Boolean).map((k) => String(k).toLowerCase());
        const hasConflict = checkKeys.some(
          (k) => activePartKeys.has(k) || activePartKeys.has(`warr_${k}`)
        );
        if (hasConflict) {
          return NextResponse.json(
            {
              success: false,
              error: `Ya existe una solicitud de protección de garantía activa (#${gar.orderNumber}) que incluye la pieza "${p.nameEs}". No es posible generar otra solicitud con las mismas piezas mientras esté en proceso.`,
            },
            { status: 409 }
          );
        }
      }
    }

    // Calculate total de-installation & re-installation fee
    const totalLaborCRC = validatedParts.reduce((acc, p) => acc + p.deinstallReinstallCostCRC, 0);

    // Build order items JSON
    const serviceItems = validatedParts.map((part) => ({
      type: "WARRANTY_DEINSTALL_REINSTALL",
      id: `warr_${part.id}`,
      sku: part.sku,
      title: `Protección Garantía: Desinstalación & Reinstalación de ${part.nameEs}`,
      nameEs: `Desinstalación & Reinstalación: ${part.nameEs}`,
      nameEn: `De-installation & Re-installation: ${part.nameEn}`,
      imageUrl: part.imageUrl,
      priceCRC: part.deinstallReinstallCostCRC,
      quantity: 1,
      installation: true,
      withInstallation: true,
      freeInstallation: false,
      installationPriceCRC: part.deinstallReinstallCostCRC,
      isWarrantyService: true,
      originalOrderNumber: part.originalOrderNumber,
      baseInstallationPriceCRC: part.installationPriceCRC,
      deinstallReinstallCostCRC: part.deinstallReinstallCostCRC,
    }));

    // Generate unique order number
    const orderNumber = `GAR-${Math.floor(100000 + Math.random() * 900000)}`;

    const lastOrderWithAddress = orders.find((o) => o.shippingAddress);
    const resolvedAddress = lastOrderWithAddress?.shippingAddress || null;
    const resolvedPhone = customerPhone || orders.find((o) => o.customerPhone)?.customerPhone || null;
    const resolvedName = customerName || orders.find((o) => o.customerName)?.customerName || session.email;

    // Create the order in the database
    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        userId: session.userId,
        customerName: resolvedName,
        customerPhone: resolvedPhone,
        shippingAddress: resolvedAddress,
        status: "PROGRAM_SERVICE",
        serviceType: "STORE_PICKUP",
        totalCRC: totalLaborCRC,
        partsSubtotalCRC: 0,
        laborSubtotalCRC: totalLaborCRC,
        installationCostCRC: totalLaborCRC,
        notes: notes || "Servicio de Protección de Garantía de Agencia (Desinstalación y Reinstalación de piezas ZxZ)",
        itemsJson: JSON.stringify(serviceItems),
      },
    });

    return NextResponse.json({
      success: true,
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      totalLaborCRC,
      redirectUrl: `/servicios?orderId=${newOrder.id}&service=shop_installation`,
    });
  } catch (error: any) {
    console.error("[CREATE_WARRANTY_SERVICE_ORDER_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al generar la orden de servicio de garantía" },
      { status: 500 }
    );
  }
}
