import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customerAuth";
import { cleanExpiredQuotations, generateOrderNumber } from "@/lib/orders";

export async function GET() {
  try {
    // Automatically erase quotations older than 2 months (60 days) with no activity
    await cleanExpiredQuotations();

    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ success: false, orders: [] }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });

    const orderIds = orders.map((o) => o.id);
    const orderNumbers = orders.map((o) => o.orderNumber);

    const schedules = await prisma.serviceSchedule.findMany({
      where: {
        OR: [
          { orderId: { in: orderIds } },
          { orderId: { in: orderNumbers } },
        ],
        status: { not: "CANCELLED" },
      },
      select: { orderId: true },
    });

    const scheduledSet = new Set(schedules.map((s) => s.orderId));

    const enrichedOrders = orders.map((o) => {
      let isInstallationPaymentConfirmed = false;
      let installationPaymentProofUrl = o.installationPaymentProofUrl;
      let servicePaymentProofUrl = o.servicePaymentProofUrl;
      let userSafeServiceDocumentsJson = o.serviceDocumentsJson;
      if (o.serviceDocumentsJson) {
        try {
          const doc = typeof o.serviceDocumentsJson === "string" ? JSON.parse(o.serviceDocumentsJson) : (o.serviceDocumentsJson || {});
          if (doc?.installationPaymentConfirmed) {
            isInstallationPaymentConfirmed = true;
          }
          if (doc?.installationPaymentProofUrl && !installationPaymentProofUrl) {
            installationPaymentProofUrl = doc.installationPaymentProofUrl;
          }
          if (doc?.receiptUrl && !installationPaymentProofUrl) {
            installationPaymentProofUrl = doc.receiptUrl;
          }
          // PRIVACY: purchase proofs are internal to staff only (*un)
          delete doc.purchaseProofUrls;
          delete doc.purchaseProofs;
          delete doc.purchaseProofsCount;
          delete doc.purchaseProofsUpdatedAt;
          delete doc.purchaseProofsUpdatedBy;
          userSafeServiceDocumentsJson = JSON.stringify(doc);
        } catch {}
      }

      return {
        ...o,
        serviceDocumentsJson: userSafeServiceDocumentsJson,
        isServiceScheduled: scheduledSet.has(o.id) || scheduledSet.has(o.orderNumber),
        isInstallationPaymentConfirmed,
        installationPaymentProofUrl,
        servicePaymentProofUrl,
      };
    });

    return NextResponse.json({ success: true, orders: enrichedOrders });
  } catch (error) {
    console.error("Error in /api/user/orders GET:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await cleanExpiredQuotations();

    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      items = [],
      serviceType = "STORE_PICKUP",
      shippingAddress = null,
      notes = null,
      customerName = null,
      customerPhone = null,
      status: requestedStatus,
      isQuotation = false,
    } = body;

    const isBacRequested =
      body.paymentMethod === "BAC_COMPRA_CLICK" ||
      body.requestedBacLink === true;

    const isQuote = isBacRequested || isQuotation || requestedStatus === "COTIZACION" || requestedStatus === "cotizacion";
    let status = isQuote ? "COTIZACION" : "PENDING";
    if (requestedStatus === "PAYMENT_CONFIRMATION" && !isBacRequested) status = "PAYMENT_CONFIRMATION";

    if (!isQuote && (!Array.isArray(items) || items.length === 0)) {
      return NextResponse.json(
        { success: false, error: "El pedido debe contener al menos un artículo" },
        { status: 400 }
      );
    }

    // Authoritative Server-Side Price Recalculation against Database Models
    let calculatedPartsCRC = 0;
    let calculatedLaborCRC = 0;
    let sanitizedItems: any[] = Array.isArray(items) ? items : [];

    if (Array.isArray(items) && items.length > 0) {
      const identifiers = Array.from(
        new Set(
          items
            .flatMap((i: any) => {
              const rawId = String(i.id || "").split("__")[0].replace(/^combo-/i, "");
              return [i.id, rawId, i.sku, i.slug];
            })
            .filter(Boolean)
        )
      );

      const [dbProducts, dbCombos] = await Promise.all([
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
            priceCRC: true,
            installationPriceCRC: true,
            isInstallationIncluded: true,
            processingPriceD: true,
            supplierLastPriceUSD: true,
            supplierUrl: true,
          },
        }),
        prisma.combo.findMany({
          where: {
            OR: [
              { id: { in: identifiers } },
              { slug: { in: identifiers } },
            ],
          },
          select: { id: true, slug: true, priceCRC: true, installationPriceCRC: true },
        }),
      ]);

      const priceMap = new Map<
        string,
        { priceCRC: number; installCRC: number; isFreeInstall: boolean; basePriceUSD?: number; supplierUrl?: string | null }
      >();
      dbProducts.forEach((p) => {
        const isFree = Boolean(p.isInstallationIncluded);
        const entry = {
          priceCRC: p.priceCRC,
          installCRC: isFree ? 0 : p.installationPriceCRC,
          isFreeInstall: isFree,
          basePriceUSD: p.processingPriceD || p.supplierLastPriceUSD || 0,
          supplierUrl: p.supplierUrl || null,
        };
        priceMap.set(p.id, entry);
        priceMap.set(p.sku, entry);
        priceMap.set(p.slug, entry);
      });
      dbCombos.forEach((c) => {
        const isComboFree = (c.installationPriceCRC || 0) === 0;
        const entry = {
          priceCRC: c.priceCRC,
          installCRC: isComboFree ? 0 : c.installationPriceCRC,
          isFreeInstall: isComboFree,
        };
        priceMap.set(c.id, entry);
        priceMap.set(c.slug, entry);
      });

      sanitizedItems = items.map((it: any) => {
        const qty = Math.max(1, parseInt(it.quantity) || 1);
        const rawId = String(it.id || "").split("__")[0].replace(/^combo-/i, "");
        const dbItem =
          priceMap.get(it.id) ||
          priceMap.get(rawId) ||
          (it.sku ? priceMap.get(it.sku) : undefined) ||
          (it.slug ? priceMap.get(it.slug) : undefined);
        const isFree = Boolean(
          dbItem?.isFreeInstall ||
          it.freeInstallation === true ||
          it.isInstallationIncluded === true
        );
        const paramDeltaCRC = Array.isArray(it.selectedParameters)
          ? it.selectedParameters.reduce((acc: number, p: any) => acc + (Number(p?.priceDeltaCRC) || 0), 0)
          : 0;
        const unitPrice = dbItem ? dbItem.priceCRC + paramDeltaCRC : Math.max(0, Number(it.priceCRC) || 0);
        const installPrice = isFree ? 0 : (dbItem ? dbItem.installCRC : Math.max(0, Number(it.installationPriceCRC) || 0));
        calculatedPartsCRC += unitPrice * qty;

        if (it.withInstallation && !isFree) {
          calculatedLaborCRC += installPrice * qty;
        }

        const variantSupplierUrl = Array.isArray(it.selectedParameters)
          ? it.selectedParameters.find((p: any) => p?.supplierUrl)?.supplierUrl
          : undefined;

        return {
          ...it,
          priceCRC: unitPrice,
          installationPriceCRC: installPrice,
          freeInstallation: isFree,
          withInstallation: isFree ? true : Boolean(it.withInstallation),
          basePriceUSD: it.basePriceUSD ?? dbItem?.basePriceUSD ?? undefined,
          supplierUrl: variantSupplierUrl || it.supplierUrl || dbItem?.supplierUrl || undefined,
        };
      });
    }

    // Quotation duplicate check
    if (isQuote) {
      const existingQuotes = await prisma.order.findMany({
        where: {
          userId: session.userId,
          status: "COTIZACION",
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      const getKey = (it: any) =>
        `${it.id || it.sku || it.slug || it.title || it.nameEs || ""}_${it.quantity || 1}_${it.withInstallation ? 1 : 0}`;
      const incomingKeys = Array.isArray(items) ? [...items].map(getKey).sort() : [];

      for (const eq of existingQuotes) {
        try {
          const eqItems = JSON.parse(eq.itemsJson || "[]");
          if (Array.isArray(eqItems) && eqItems.length === incomingKeys.length) {
            const eqKeys = eqItems.map(getKey).sort();
            const isIdentical = eqKeys.every((val, idx) => val === incomingKeys[idx]);
            if (isIdentical) {
              return NextResponse.json({
                success: true,
                order: eq,
                message: "Cotización activa existente con el mismo carrito",
                isDuplicate: true,
              });
            }
          }
        } catch {}
      }
    }

    const orderNumber = generateOrderNumber(isQuote);

    const initialComments = notes
      ? JSON.stringify([
          {
            id: `cmt-${Date.now()}`,
            authorRole: "CUSTOMER",
            authorName: customerName || "Cliente",
            text: notes,
            createdAt: new Date().toISOString(),
          },
        ])
      : "[]";

    const resolvedPartsSubtotal = calculatedPartsCRC;
    const resolvedLabor = isQuote ? calculatedLaborCRC : 0;
    const resolvedTotal = resolvedPartsSubtotal + resolvedLabor;

    let docObj: any = {};
    if (body.garageVehicle) {
      docObj = {
        vehicleMake: body.garageVehicle.make || body.garageVehicle.brandName || "",
        vehicleModel: body.garageVehicle.model || body.garageVehicle.modelName || "",
        vehicleYear: String(body.garageVehicle.year || ""),
        vehicleColor: body.garageVehicle.color || "",
      };
    }

    let finalNotes = notes || null;
    if (isBacRequested) {
      docObj.paymentMethod = "BAC_COMPRA_CLICK";
      docObj.requestedBacLink = true;
      docObj.bacRequestedAt = new Date().toISOString();
      const bacTag = "[BAC Compra Click Solicitado - Enlace de pago pendiente por WhatsApp]";
      if (!finalNotes) {
        finalNotes = bacTag;
      } else if (!finalNotes.includes("BAC Compra Click")) {
        finalNotes = `${finalNotes} | ${bacTag}`;
      }
    }

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        user: { connect: { id: session.userId } },
        status,
        totalCRC: resolvedTotal,
        partsSubtotalCRC: resolvedPartsSubtotal,
        laborSubtotalCRC: resolvedLabor,
        itemsJson: JSON.stringify(sanitizedItems),
        commentsJson: initialComments,
        serviceType: serviceType || "STORE_PICKUP",
        shippingAddress: shippingAddress || null,
        notes: finalNotes,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        paymentProofUrl: body.paymentProofUrl ? String(body.paymentProofUrl) : null,
        serviceDocumentsJson: Object.keys(docObj).length > 0 ? JSON.stringify(docObj) : null,
      },
    });

    if (customerPhone) {
      await prisma.user.update({
        where: { id: session.userId },
        data: { phoneNumber: customerPhone },
      });
    }

    return NextResponse.json({
      success: true,
      order: newOrder,
    });
  } catch (error) {
    console.error("Error creating order in /api/user/orders POST:", error);
    return NextResponse.json(
      { success: false, error: "Error al registrar el pedido" },
      { status: 500 }
    );
  }
}
