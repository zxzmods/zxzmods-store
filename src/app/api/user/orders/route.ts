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

    // Hydrate any legacy/custom quotation items missing title or imageUrl in a single batched DB lookup
    const parsedItemsByOrderId = new Map<string, any[]>();
    const missingMetaIdentifiers = new Set<string>();
    orders.forEach((o) => {
      try {
        const parsed = typeof o.itemsJson === "string" ? JSON.parse(o.itemsJson) : [];
        if (Array.isArray(parsed)) {
          parsedItemsByOrderId.set(o.id, parsed);
          parsed.forEach((it: any) => {
            if (!it?.title || !it?.imageUrl || it.imageUrl === "/images/logo.png") {
              if (typeof it?.id === "string" && it.id.trim()) missingMetaIdentifiers.add(it.id.trim());
              if (typeof it?.sku === "string" && it.sku.trim()) missingMetaIdentifiers.add(it.sku.trim());
              if (typeof it?.slug === "string" && it.slug.trim()) missingMetaIdentifiers.add(it.slug.trim());
            }
          });
        }
      } catch {}
    });

    const itemMetaMap = new Map<string, { title: string; nameEs: string; nameEn: string; slug: string; sku?: string; imageUrl: string; type: "PRODUCT" | "COMBO" }>();
    if (missingMetaIdentifiers.size > 0) {
      const idsArr = Array.from(missingMetaIdentifiers);
      const [dbProds, dbCmbs] = await Promise.all([
        prisma.product.findMany({
          where: { OR: [{ id: { in: idsArr } }, { sku: { in: idsArr } }, { slug: { in: idsArr } }] },
          select: { id: true, sku: true, slug: true, nameEs: true, nameEn: true, imageUrl: true, imagesJson: true },
        }),
        prisma.combo.findMany({
          where: { OR: [{ id: { in: idsArr } }, { slug: { in: idsArr } }] },
          select: { id: true, slug: true, titleEs: true, titleEn: true, imageUrl: true, imagesJson: true },
        }),
      ]);
      const pickImg = (primary?: string | null, imagesJson?: string | null) => {
        if (primary && primary.trim()) return primary.trim();
        if (imagesJson) {
          try {
            const p = JSON.parse(imagesJson);
            if (Array.isArray(p) && typeof p[0] === "string" && p[0].trim()) return p[0].trim();
          } catch {}
        }
        return "/images/logo.png";
      };
      dbProds.forEach((p) => {
        const meta = {
          title: p.nameEs || p.nameEn,
          nameEs: p.nameEs || p.nameEn,
          nameEn: p.nameEn || p.nameEs,
          slug: p.slug || p.sku,
          sku: p.sku,
          imageUrl: pickImg(p.imageUrl, p.imagesJson),
          type: "PRODUCT" as const,
        };
        itemMetaMap.set(p.id, meta);
        if (p.sku) itemMetaMap.set(p.sku, meta);
        if (p.slug) itemMetaMap.set(p.slug, meta);
      });
      dbCmbs.forEach((c) => {
        const meta = {
          title: c.titleEs || c.titleEn,
          nameEs: c.titleEs || c.titleEn,
          nameEn: c.titleEn || c.titleEs,
          slug: c.slug,
          sku: c.slug,
          imageUrl: pickImg(c.imageUrl, c.imagesJson),
          type: "COMBO" as const,
        };
        itemMetaMap.set(c.id, meta);
        if (c.slug) itemMetaMap.set(c.slug, meta);
      });
    }

    const enrichedOrders = orders.map((o) => {
      let hydratedItemsJson = o.itemsJson;
      const orderItems = parsedItemsByOrderId.get(o.id);
      if (orderItems && orderItems.length > 0) {
        const hydrated = orderItems.map((it: any) => {
          const meta =
            itemMetaMap.get(it?.id) ||
            (it?.sku ? itemMetaMap.get(it.sku) : undefined) ||
            (it?.slug ? itemMetaMap.get(it.slug) : undefined);
          const resolvedTitle = it?.title || it?.nameEs || it?.name || meta?.title || it?.nameEn || "Artículo";
          return {
            ...it,
            slug: it?.slug || meta?.slug || it?.sku,
            sku: it?.sku || meta?.sku,
            title: resolvedTitle,
            name: it?.name || resolvedTitle,
            nameEs: it?.nameEs || meta?.nameEs || resolvedTitle,
            nameEn: it?.nameEn || meta?.nameEn || resolvedTitle,
            imageUrl:
              it?.imageUrl && it.imageUrl !== "/images/logo.png"
                ? it.imageUrl
                : meta?.imageUrl || it?.imageUrl || "/images/logo.png",
            type: it?.type || meta?.type,
          };
        });
        hydratedItemsJson = JSON.stringify(hydrated);
      }
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
        itemsJson: hydratedItemsJson,
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
            installationAvailable: true,
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
          select: { id: true, slug: true, priceCRC: true, installationPriceCRC: true, installationAvailable: true },
        }),
      ]);

      const priceMap = new Map<
        string,
        { priceCRC: number; installCRC: number; isFreeInstall: boolean; installationAvailable: boolean; basePriceUSD?: number; supplierUrl?: string | null }
      >();
      dbProducts.forEach((p) => {
        const isDeliveryOnly = p.installationAvailable === false;
        const isFree = !isDeliveryOnly && Boolean(p.isInstallationIncluded);
        const entry = {
          priceCRC: p.priceCRC,
          installCRC: isDeliveryOnly || isFree ? 0 : p.installationPriceCRC,
          isFreeInstall: isFree,
          installationAvailable: !isDeliveryOnly,
          basePriceUSD: p.processingPriceD || p.supplierLastPriceUSD || 0,
          supplierUrl: p.supplierUrl || null,
        };
        priceMap.set(p.id, entry);
        priceMap.set(p.sku, entry);
        priceMap.set(p.slug, entry);
      });
      dbCombos.forEach((c) => {
        const comboIncludesInstall = c.installationAvailable !== false;
        const entry = {
          priceCRC: c.priceCRC,
          installCRC: 0,
          isFreeInstall: comboIncludesInstall,
          installationAvailable: comboIncludesInstall,
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
        const isDeliveryOnly = dbItem
          ? dbItem.installationAvailable === false
          : it.installationAvailable === false;
        const isFree = !isDeliveryOnly && Boolean(
          dbItem?.isFreeInstall ||
          it.freeInstallation === true ||
          it.isInstallationIncluded === true ||
          it.type === "COMBO"
        );
        const paramDeltaCRC = Array.isArray(it.selectedParameters)
          ? it.selectedParameters.reduce((acc: number, p: any) => acc + (Number(p?.priceDeltaCRC) || 0), 0)
          : 0;
        const unitPrice = dbItem ? dbItem.priceCRC + paramDeltaCRC : Math.max(0, Number(it.priceCRC) || 0);
        const installPrice = isDeliveryOnly || isFree ? 0 : (dbItem ? dbItem.installCRC : Math.max(0, Number(it.installationPriceCRC) || 0));
        calculatedPartsCRC += unitPrice * qty;

        const needsInstall = isDeliveryOnly ? false : (isFree ? true : Boolean(it.withInstallation));
        if (needsInstall && !isFree) {
          calculatedLaborCRC += installPrice * qty;
        }

        const variantSupplierUrl = Array.isArray(it.selectedParameters)
          ? it.selectedParameters.find((p: any) => p?.supplierUrl)?.supplierUrl
          : undefined;

        return {
          ...it,
          priceCRC: unitPrice,
          installationPriceCRC: installPrice,
          installationAvailable: !isDeliveryOnly,
          freeInstallation: isFree,
          withInstallation: needsInstall,
          homeInstallation: isDeliveryOnly ? false : it.homeInstallation,
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
