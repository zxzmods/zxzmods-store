import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleanExpiredQuotations, getQuotationDaysRemaining } from "@/lib/orders";
import { getCustomerSession } from "@/lib/customerAuth";
import { getStealthSession } from "@/lib/stealthAuth";
import { fetchOrderUpdatesResponse } from "@/lib/orderUpdates";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (params.id === "updates") {
      return fetchOrderUpdatesResponse(request);
    }

    await cleanExpiredQuotations();

    const orderId = params.id;
    const { searchParams } = new URL(request.url);
    const claimToken = searchParams.get("token");

    const customerSession = await getCustomerSession();
    const stealthSession = await getStealthSession();
    const isStaff = Boolean(stealthSession && (stealthSession.role === "MASTER" || stealthSession.role === "STAFF"));

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Orden o cotización no encontrada.",
        },
        { status: 404 }
      );
    }

    // IDOR Defense: Only the authenticated owner, staff, or bearer of claimToken (or guest order) can view
    const isOwner = Boolean(customerSession && order.userId === customerSession.userId);
    const hasValidToken = Boolean(claimToken && order.claimToken === claimToken);
    const isGuestOrder = !order.userId;

    if (!isOwner && !isStaff && !hasValidToken && !isGuestOrder) {
      return NextResponse.json(
        { success: false, error: "No autorizado para consultar esta orden" },
        { status: 403 }
      );
    }

    // Parse items & comments safely
    let items: any[] = [];
    try {
      items = JSON.parse(order.itemsJson);
    } catch {
      items = [];
    }

    let comments: any[] = [];
    try {
      comments = JSON.parse((order as any).commentsJson || "[]");
    } catch {
      comments = [];
    }

    comments = comments.map((c: any) => {
      if (c && typeof c.text === "string" && c.text.includes("SINPE")) {
        return {
          ...c,
          text: c.text.replace(/SINPE M[oó]vil/gi, "Transferencia Bancaria").replace(/SINPE/gi, "Transferencia Bancaria"),
        };
      }
      return c;
    });

    const isCotizacion = order.status.toUpperCase() === "COTIZACION";
    const daysRemaining = isCotizacion
      ? getQuotationDaysRemaining(order.updatedAt)
      : null;

    const schedule = await prisma.serviceSchedule.findFirst({
      where: {
        OR: [{ orderId: order.id }, { orderId: order.orderNumber }],
        status: { not: "CANCELLED" },
      },
    });
    const isServiceScheduled = Boolean(schedule);

    let garageVehicle = null;
    if (order.userId) {
      garageVehicle = await prisma.garageVehicle.findFirst({
        where: { userId: order.userId },
        orderBy: { isActive: "desc" },
      });
    }
    if (!garageVehicle && (order as any).serviceDocumentsJson) {
      try {
        const parsedDoc = typeof (order as any).serviceDocumentsJson === "string"
          ? JSON.parse((order as any).serviceDocumentsJson)
          : (order as any).serviceDocumentsJson;
        if (parsedDoc?.garageVehicle) {
          garageVehicle = parsedDoc.garageVehicle;
        }
      } catch {}
    }

    let isInstallationPaymentConfirmed = false;
    let installationPaymentProofUrl = order.installationPaymentProofUrl;
    let servicePaymentProofUrl = order.servicePaymentProofUrl;
    if (schedule?.paymentProofUrl && !servicePaymentProofUrl) {
      servicePaymentProofUrl = schedule.paymentProofUrl;
    }
    if ((order as any).serviceDocumentsJson) {
      try {
        const parsedDoc = typeof (order as any).serviceDocumentsJson === "string"
          ? JSON.parse((order as any).serviceDocumentsJson)
          : (order as any).serviceDocumentsJson;
        if (parsedDoc?.installationPaymentConfirmed) {
          isInstallationPaymentConfirmed = true;
        }
        if (parsedDoc?.installationPaymentProofUrl && !installationPaymentProofUrl) {
          installationPaymentProofUrl = parsedDoc.installationPaymentProofUrl;
        }
        if (parsedDoc?.receiptUrl && !installationPaymentProofUrl) {
          installationPaymentProofUrl = parsedDoc.receiptUrl;
        }
      } catch {}
    }

    // Dynamic resolution of installation price and canonical product/combo metadata
    let resolvedInstallationCost = order.installationCostCRC || order.laborSubtotalCRC || 0;
    const freeInstallMap = new Map<string, boolean>();
    const itemMetaMap = new Map<string, {
      id: string;
      slug: string;
      sku?: string;
      title: string;
      nameEs: string;
      nameEn: string;
      brand?: string;
      imageUrl: string;
      homeInstallation?: boolean;
      installationAvailable?: boolean;
      type: "PRODUCT" | "COMBO";
    }>();

    const resolveFirstImageUrl = (primary?: string | null, imagesJson?: string | null) => {
      if (primary && primary.trim()) return primary.trim();
      if (imagesJson) {
        try {
          const parsed = JSON.parse(imagesJson);
          if (Array.isArray(parsed) && typeof parsed[0] === "string" && parsed[0].trim()) {
            return parsed[0].trim();
          }
        } catch {}
      }
      return "/images/logo.png";
    };

    if (Array.isArray(items) && items.length > 0) {
      const identifiers = Array.from(
        new Set(
          items
            .flatMap((i: any) => [i?.id, i?.sku, i?.slug])
            .map((v: any) => (typeof v === "string" ? v.trim() : ""))
            .filter(Boolean)
        )
      );
      const [dbProducts, dbCombos] = identifiers.length > 0
        ? await Promise.all([
            prisma.product.findMany({
              where: {
                OR: [
                  { id: { in: identifiers } },
                  { sku: { in: identifiers } },
                  { slug: { in: identifiers } },
                ],
              },
              select: {
                id: true,
                sku: true,
                slug: true,
                nameEs: true,
                nameEn: true,
                brandName: true,
                imageUrl: true,
                imagesJson: true,
                installationPriceCRC: true,
                installationAvailable: true,
                isInstallationIncluded: true,
                homeInstallationAvailable: true,
              },
            }),
            prisma.combo.findMany({
              where: {
                OR: [
                  { id: { in: identifiers } },
                  { slug: { in: identifiers } },
                ],
              },
              select: {
                id: true,
                slug: true,
                titleEs: true,
                titleEn: true,
                imageUrl: true,
                imagesJson: true,
                installationPriceCRC: true,
                installationAvailable: true,
                homeInstallationAvailable: true,
              },
            }),
          ])
        : [[], []];

      const priceMap = new Map<string, number>();
      dbProducts.forEach((p) => {
        const isDeliveryOnly = p.installationAvailable === false;
        const isFree = !isDeliveryOnly && Boolean((p as any).isInstallationIncluded);
        const meta = {
          id: p.id,
          slug: p.slug || p.sku,
          sku: p.sku,
          title: p.nameEs || p.nameEn,
          nameEs: p.nameEs || p.nameEn,
          nameEn: p.nameEn || p.nameEs,
          brand: p.brandName || undefined,
          imageUrl: resolveFirstImageUrl(p.imageUrl, p.imagesJson),
          homeInstallation: isDeliveryOnly ? false : (p.homeInstallationAvailable ?? true),
          installationAvailable: !isDeliveryOnly,
          type: "PRODUCT" as const,
        };
        itemMetaMap.set(p.id, meta);
        if (p.sku) itemMetaMap.set(p.sku, meta);
        if (p.slug) itemMetaMap.set(p.slug, meta);

        if (isFree || isDeliveryOnly) {
          if (isFree) {
            freeInstallMap.set(p.id, true);
            if (p.sku) freeInstallMap.set(p.sku, true);
            if (p.slug) freeInstallMap.set(p.slug, true);
          }
          priceMap.set(p.id, 0);
          if (p.sku) priceMap.set(p.sku, 0);
          if (p.slug) priceMap.set(p.slug, 0);
        } else {
          priceMap.set(p.id, p.installationPriceCRC);
          if (p.sku) priceMap.set(p.sku, p.installationPriceCRC);
          if (p.slug) priceMap.set(p.slug, p.installationPriceCRC);
        }
      });
      dbCombos.forEach((c) => {
        const comboIncludesInstall = c.installationAvailable !== false;
        const meta = {
          id: c.id,
          slug: c.slug,
          sku: c.slug,
          title: c.titleEs || c.titleEn,
          nameEs: c.titleEs || c.titleEn,
          nameEn: c.titleEn || c.titleEs,
          brand: "ZxZ Mods",
          imageUrl: resolveFirstImageUrl(c.imageUrl, c.imagesJson),
          homeInstallation: comboIncludesInstall ? (c.homeInstallationAvailable ?? true) : false,
          installationAvailable: comboIncludesInstall,
          type: "COMBO" as const,
        };
        itemMetaMap.set(c.id, meta);
        if (c.slug) itemMetaMap.set(c.slug, meta);
        // Combo installation is already included in T_price (₡0 extra)
        if (comboIncludesInstall) {
          freeInstallMap.set(c.id, true);
          if (c.slug) freeInstallMap.set(c.slug, true);
        }
        priceMap.set(c.id, 0);
        if (c.slug) priceMap.set(c.slug, 0);
      });

      if (resolvedInstallationCost === 0) {
        let sum = 0;
        for (const it of items) {
          const key = it.id || it.sku || it.slug;
          const qty = Math.max(1, Number(it.quantity) || 1);
          const isFree = Boolean(
            it.freeInstallation ||
            it.isFreeInstall ||
            it.isInstallationIncluded ||
            freeInstallMap.get(key)
          );
          if (isFree) continue;
          const installPrice = priceMap.has(key)
            ? (priceMap.get(key) || 0)
            : Math.max(0, Number(it.installationPriceCRC) || 0);
          sum += installPrice * qty;
        }
        if (sum > 0) {
          resolvedInstallationCost = sum;
        }
      }
    }

    const sanitizedItems = Array.isArray(items)
      ? items.map((it: any) => {
          const meta =
            itemMetaMap.get(it?.id) ||
            (it?.sku ? itemMetaMap.get(it.sku) : undefined) ||
            (it?.slug ? itemMetaMap.get(it.slug) : undefined);
          const key = it.id || it.sku || it.slug;
          const isFree = Boolean(
            it.freeInstallation ||
            it.isFreeInstall ||
            it.isInstallationIncluded ||
            freeInstallMap.get(key)
          );
          const resolvedTitle = it.title || it.nameEs || it.name || meta?.title || it.nameEn || "Artículo";
          const hydrated = {
            ...it,
            slug: it.slug || meta?.slug || it.sku,
            sku: it.sku || meta?.sku,
            title: resolvedTitle,
            name: it.name || resolvedTitle,
            nameEs: it.nameEs || meta?.nameEs || resolvedTitle,
            nameEn: it.nameEn || meta?.nameEn || resolvedTitle,
            brand: it.brand || meta?.brand,
            imageUrl:
              it.imageUrl && it.imageUrl !== "/images/logo.png"
                ? it.imageUrl
                : meta?.imageUrl || it.imageUrl || "/images/logo.png",
            homeInstallation: it.homeInstallation !== undefined ? it.homeInstallation : meta?.homeInstallation,
            installationAvailable:
              it.installationAvailable !== undefined ? it.installationAvailable : meta?.installationAvailable,
            type: it.type || meta?.type,
          };
          if (isFree) {
            return {
              ...hydrated,
              installationPriceCRC: 0,
              freeInstallation: true,
              isInstallationIncluded: true,
            };
          }
          return hydrated;
        })
      : items;

    // PRIVACY / SECURITY: Purchase proof is internal to staff only (un*)
    let finalServiceDocumentsJson = order.serviceDocumentsJson;
    let purchaseProofUrls: string[] = [];
    if (order.serviceDocumentsJson) {
      try {
        const parsedDoc = typeof order.serviceDocumentsJson === "string" ? JSON.parse(order.serviceDocumentsJson) : (order.serviceDocumentsJson || {});
        if (isStaff) {
          purchaseProofUrls = Array.isArray(parsedDoc?.purchaseProofUrls) ? parsedDoc.purchaseProofUrls : [];
        } else {
          delete parsedDoc.purchaseProofUrls;
          delete parsedDoc.purchaseProofs;
          delete parsedDoc.purchaseProofsCount;
          delete parsedDoc.purchaseProofsUpdatedAt;
          delete parsedDoc.purchaseProofsUpdatedBy;
          finalServiceDocumentsJson = JSON.stringify(parsedDoc);
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        serviceDocumentsJson: finalServiceDocumentsJson,
        items: sanitizedItems,
        comments,
        isCotizacion,
        daysRemaining,
        isServiceScheduled,
        serviceSchedule: schedule,
        garageVehicle,
        installationCostCRC: resolvedInstallationCost,
        laborSubtotalCRC: order.laborSubtotalCRC || 0,
        paymentProofUrl: order.paymentProofUrl || null,
        installationPaymentProofUrl,
        servicePaymentProofUrl,
        isInstallationPaymentConfirmed,
        ...(isStaff ? { purchaseProofUrls } : {}),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/orders/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Error al consultar la orden" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await request.json().catch(() => ({}));
    const { notes, shippingAddress, customerName, customerPhone, serviceType, paidCurrency } = body;

    const customerSession = await getCustomerSession();
    const stealthSession = await getStealthSession();
    const isStaff = Boolean(stealthSession && (stealthSession.role === "MASTER" || stealthSession.role === "STAFF"));

    const existingOrder = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
    });

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const isOwner = Boolean(customerSession && existingOrder.userId === customerSession.userId);

    if (!isOwner && !isStaff) {
      return NextResponse.json(
        { success: false, error: "No autorizado para modificar esta orden" },
        { status: 403 }
      );
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (notes !== undefined) updateData.notes = typeof notes === "string" ? notes.trim() : null;
    if (shippingAddress !== undefined) updateData.shippingAddress = typeof shippingAddress === "string" ? shippingAddress.trim() : null;
    if (customerName !== undefined) updateData.customerName = typeof customerName === "string" ? customerName.trim() : null;
    if (customerPhone !== undefined) updateData.customerPhone = typeof customerPhone === "string" ? customerPhone.trim() : null;

    // Only staff or pending state allows changing serviceType
    if (serviceType !== undefined && (isStaff || existingOrder.status === "PENDING" || existingOrder.status === "COTIZACION")) {
      updateData.serviceType = serviceType;
    }

    if (paidCurrency !== undefined) {
      updateData.paidCurrency = paidCurrency ? (String(paidCurrency).toUpperCase() === "USD" ? "USD" : "CRC") : null;
    }

    // Payment proof URL attachments
    if (body.paymentProofUrl !== undefined) {
      updateData.paymentProofUrl = body.paymentProofUrl ? String(body.paymentProofUrl) : null;
    }
    if (body.servicePaymentProofUrl !== undefined) {
      updateData.servicePaymentProofUrl = body.servicePaymentProofUrl ? String(body.servicePaymentProofUrl) : null;
    }
    if (body.installationPaymentProofUrl !== undefined && isStaff) {
      updateData.installationPaymentProofUrl = body.installationPaymentProofUrl ? String(body.installationPaymentProofUrl) : null;
    }

    const updated = await prisma.order.update({
      where: { id: existingOrder.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error("Error in PATCH /api/orders/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar la orden" },
      { status: 500 }
    );
  }
}
