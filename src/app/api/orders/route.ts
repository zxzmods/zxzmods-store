import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleanExpiredQuotations, generateOrderNumber, generateSecureClaimToken } from "@/lib/orders";
import { getCustomerSession } from "@/lib/customerAuth";
import { getStealthSession } from "@/lib/stealthAuth";
import { checkRateLimit, createRateLimitResponse, getClientIp } from "@/lib/rateLimit";
import { checkAndAcquireIdempotency, completeIdempotency, releaseIdempotency } from "@/lib/idempotency";
import { logger, getOrCreateRequestId } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    await cleanExpiredQuotations();

    const customerSession = await getCustomerSession();
    const stealthSession = await getStealthSession();
    const isStaff = Boolean(stealthSession && (stealthSession.role === "MASTER" || stealthSession.role === "STAFF"));

    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber");
    const claimToken = searchParams.get("token");

    if (orderNumber) {
      const order = await prisma.order.findUnique({
        where: { orderNumber },
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
        return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
      }

      // Authorization guard: Only the owner, authorized staff, or someone with the order's claimToken can view it
      const isOwner = Boolean(customerSession && order.userId === customerSession.userId);
      const hasValidClaimToken = Boolean(claimToken && order.claimToken === claimToken);

      if (!isOwner && !isStaff && !hasValidClaimToken) {
        return NextResponse.json(
          { success: false, error: "No autorizado para consultar esta orden" },
          { status: 403 }
        );
      }

      return NextResponse.json({ success: true, order });
    }

    if (!customerSession) {
      return NextResponse.json({ success: true, orders: [] });
    }

    const orders = await prisma.order.findMany({
      where: { userId: customerSession.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    console.error("Error in GET /api/orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateCheck = checkRateLimit({
    key: `orders_${ip}`,
    maxRequests: 12, // Max 12 order/quote requests per minute
    windowMs: 60 * 1000,
  });

  if (!rateCheck.success) {
    return createRateLimitResponse(rateCheck.resetMs);
  }

  // Decoupled background task: run quotation expiry asynchronously without blocking checkout
  void cleanExpiredQuotations().catch((err) =>
    console.warn("[BACKGROUND_CLEANUP_WARN]:", err)
  );

  let idempotencyKey: string | null = request.headers.get("Idempotency-Key");

  try {
    const customerSession = await getCustomerSession();
    const userId = customerSession?.userId || null;

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!idempotencyKey && body.idempotencyKey) {
      idempotencyKey = String(body.idempotencyKey);
    }

    // Check idempotency lock
    if (idempotencyKey) {
      const idemp = checkAndAcquireIdempotency(idempotencyKey);
      if (idemp.state === "IN_PROGRESS") return idemp.conflictResponse;
      if (idemp.state === "CACHED") return idemp.cachedResponse;
    }

    const {
      items = [],
      serviceType = "STORE_PICKUP",
      shippingAddress = null,
      notes = null,
      customerName = null,
      customerPhone = null,
      guestEmail = null,
      status: requestedStatus,
      isQuotation = false,
    } = body;

    let finalCustomerName = (typeof customerName === "string" && customerName.trim().length > 0) ? customerName.trim() : null;
    let finalCustomerPhone = (typeof customerPhone === "string" && customerPhone.trim().length > 0) ? customerPhone.trim() : null;
    let finalCustomerEmail = (typeof guestEmail === "string" && guestEmail.trim().length > 0) ? guestEmail.trim() : null;

    if (userId && (!finalCustomerName || !finalCustomerPhone || !finalCustomerEmail)) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { displayName: true, phoneNumber: true, email: true },
        });
        if (dbUser) {
          if (!finalCustomerName && dbUser.displayName) finalCustomerName = dbUser.displayName;
          if (!finalCustomerPhone && dbUser.phoneNumber) finalCustomerPhone = dbUser.phoneNumber;
          if (!finalCustomerEmail && dbUser.email) finalCustomerEmail = dbUser.email;
        }
      } catch (err) {
        console.warn("[RESOLVE_USER_FALLBACK_WARN]:", err);
      }
    }

    const isBacRequested =
      body.paymentMethod === "BAC_COMPRA_CLICK" ||
      body.requestedBacLink === true;

    const isQuote =
      isBacRequested ||
      isQuotation ||
      requestedStatus === "COTIZACION" ||
      requestedStatus === "cotizacion";

    let status = isQuote ? "COTIZACION" : "PENDING";
    if (requestedStatus === "PAYMENT_CONFIRMATION" && !isBacRequested) status = "PAYMENT_CONFIRMATION";

    if (!isQuote && (!Array.isArray(items) || items.length === 0)) {
      return NextResponse.json(
        { success: false, error: "El pedido debe contener al menos un artículo" },
        { status: 400 }
      );
    }

    // Server-Side Price Verification against Database Models
    let calculatedPartsCRC = 0;
    let calculatedLaborCRC = 0;
    let totalProductsInstallationCRC = 0;
    let totalInstallationMinutes = 0;
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
            installationDurationMinutes: true,
            processingPriceD: true,
            supplierLastPriceUSD: true,
            supplierUrl: true,
            voidsWarranty: true,
          },
        }),
        prisma.combo.findMany({
          where: {
            OR: [
              { id: { in: identifiers } },
              { slug: { in: identifiers } },
            ],
          },
          select: { id: true, slug: true, priceCRC: true, installationPriceCRC: true, installationDurationMinutes: true, category: true },
        }),
      ]);

      const priceMap = new Map<
        string,
        { priceCRC: number; installCRC: number; durationMin: number; isFreeInstall: boolean; basePriceUSD?: number; supplierUrl?: string | null; voidsWarranty?: boolean }
      >();
      dbProducts.forEach((p) => {
        const isFree = Boolean(p.isInstallationIncluded);
        const durationMin = Number(p.installationDurationMinutes) > 0 ? Number(p.installationDurationMinutes) : 60;
        const entry = {
          priceCRC: p.priceCRC,
          installCRC: isFree ? 0 : p.installationPriceCRC,
          durationMin,
          isFreeInstall: isFree,
          basePriceUSD: p.processingPriceD || p.supplierLastPriceUSD || 0,
          supplierUrl: p.supplierUrl || null,
          voidsWarranty: Boolean(p.voidsWarranty),
        };
        priceMap.set(p.id, entry);
        priceMap.set(p.sku, entry);
        priceMap.set(p.slug, entry);
      });
      dbCombos.forEach((c) => {
        const isComboFree = (c.installationPriceCRC || 0) === 0;
        const durationMin = Number(c.installationDurationMinutes) > 0 ? Number(c.installationDurationMinutes) : 60;
        const entry = {
          priceCRC: c.priceCRC,
          installCRC: isComboFree ? 0 : c.installationPriceCRC,
          durationMin,
          isFreeInstall: isComboFree,
          voidsWarranty: c.category === "performance",
        };
        priceMap.set(c.id, entry);
        priceMap.set(c.slug, entry);
      });

      let totalInstallationMinutes = 0;

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
        const itemDuration = dbItem?.durationMin ?? (Number(it.installationDurationMinutes) || 60);

        calculatedPartsCRC += unitPrice * qty;
        totalProductsInstallationCRC += installPrice * qty;

        const needsInstall = isFree ? true : Boolean(it.withInstallation);
        if (needsInstall) {
          totalInstallationMinutes += itemDuration * qty;
        }

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
          installationDurationMinutes: itemDuration,
          freeInstallation: isFree,
          withInstallation: isFree ? true : Boolean(it.withInstallation),
          basePriceUSD: it.basePriceUSD ?? dbItem?.basePriceUSD ?? undefined,
          supplierUrl: variantSupplierUrl || it.supplierUrl || dbItem?.supplierUrl || undefined,
          voidsWarranty: dbItem?.voidsWarranty ?? it.voidsWarranty ?? false,
        };
      });
    }

    // Quotation duplicate check
    if (isQuote) {
      const existingQuotes = await prisma.order.findMany({
        where: {
          status: "COTIZACION",
          ...(userId
            ? { userId }
            : guestEmail
            ? { guestEmail }
            : customerPhone
            ? { customerPhone }
            : {}),
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
    const claimToken = generateSecureClaimToken();

    const initialComments = notes
      ? JSON.stringify([
          {
            id: `cmt-${Date.now()}`,
            authorRole: "CUSTOMER",
            authorName: finalCustomerName || "Cliente",
            text: notes,
            createdAt: new Date().toISOString(),
          },
        ])
      : "[]";

    const resolvedPartsSubtotal = calculatedPartsCRC;
    const resolvedLabor = isQuote ? calculatedLaborCRC : 0;
    let discountCRC = 0;
    let appliedDiscountType = "NONE";
    let appliedDiscountValue = 0;
    let appliedDiscountReason: string | null = null;
    let appliedDiscountBy: string | null = null;

    let pendingDiscountId: string | null = null;

    if (body.discountCode) {
      const cleanCode = String(body.discountCode).trim().toUpperCase();
      try {
        const discountRecord = await prisma.discountCode.findUnique({
          where: { code: cleanCode },
        });

        if (
          discountRecord &&
          discountRecord.isActive &&
          (!discountRecord.expiresAt || new Date() <= new Date(discountRecord.expiresAt)) &&
          (discountRecord.maxUses === null || discountRecord.timesUsed < discountRecord.maxUses) &&
          (discountRecord.minOrderCRC === 0 || resolvedPartsSubtotal >= discountRecord.minOrderCRC)
        ) {
          appliedDiscountType = discountRecord.discountType;
          appliedDiscountValue = discountRecord.discountValue;
          appliedDiscountReason = discountRecord.code;
          appliedDiscountBy = `DISCOUNT_CODE:${discountRecord.code}`;

          if (discountRecord.discountType === "PERCENTAGE") {
            const rawDiscount = Math.round(resolvedPartsSubtotal * (discountRecord.discountValue / 100));
            discountCRC = discountRecord.maxDiscountCRC
              ? Math.min(rawDiscount, discountRecord.maxDiscountCRC)
              : rawDiscount;
          } else {
            discountCRC = Math.min(resolvedPartsSubtotal, discountRecord.discountValue);
          }

          // Stage for atomic increment inside transaction
          pendingDiscountId = discountRecord.id;
        }
      } catch (discErr) {
        console.warn("[ORDER_DISCOUNT_CODE_WARN]:", discErr);
      }
    }

    const requiresElectronicInvoice = Boolean(body.requiresElectronicInvoice || body.electronicInvoice);
    let electronicInvoiceJson: string | null = null;
    if (requiresElectronicInvoice) {
      if (typeof body.electronicInvoice === "object" && body.electronicInvoice !== null) {
        electronicInvoiceJson = JSON.stringify(body.electronicInvoice);
      } else if (typeof body.electronicInvoiceJson === "string") {
        electronicInvoiceJson = body.electronicInvoiceJson;
      }
    }

    const subtotalAfterDiscount = Math.max(0, resolvedPartsSubtotal - discountCRC + resolvedLabor);
    // 13% IVA is already included in product prices (No extra surcharge for Factura Electrónica)
    const taxCRC = requiresElectronicInvoice ? Math.round(subtotalAfterDiscount - (subtotalAfterDiscount / 1.13)) : 0;
    const resolvedTotal = subtotalAfterDiscount;

    // Financial spend & fraud protection: alert on client price disparity
    const requestId = getOrCreateRequestId(request);
    if (body.clientClaimedTotalCRC !== undefined && Number.isFinite(Number(body.clientClaimedTotalCRC))) {
      const clientTotal = Number(body.clientClaimedTotalCRC);
      const diff = Math.abs(clientTotal - resolvedTotal);
      if (diff > 500 && diff / (resolvedTotal || 1) > 0.02) {
        logger.warn(
          "ORDER_PRICE_DISPARITY_ALERT",
          {
            orderNumber,
            clientClaimedTotalCRC: clientTotal,
            serverCalculatedTotalCRC: resolvedTotal,
            disparityCRC: diff,
          },
          requestId
        );
      }
    }

    const orderData: any = {
      orderNumber,
      status,
      totalCRC: resolvedTotal,
      partsSubtotalCRC: resolvedPartsSubtotal,
      laborSubtotalCRC: resolvedLabor,
      installationCostCRC: totalProductsInstallationCRC,
      discountType: appliedDiscountType,
      discountValue: appliedDiscountValue,
      discountReason: appliedDiscountReason,
      discountAppliedBy: appliedDiscountBy,
      discountCRC,
      taxCRC,
      requiresElectronicInvoice,
      electronicInvoiceJson,
      itemsJson: JSON.stringify(Array.isArray(sanitizedItems) ? sanitizedItems : []),
      commentsJson: initialComments,
      serviceType: serviceType || "STORE_PICKUP",
      shippingAddress: shippingAddress || null,
      notes: notes || null,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      guestEmail: finalCustomerEmail,
      claimToken,
      paymentProofUrl: body.paymentProofUrl ? String(body.paymentProofUrl) : null,
      paidCurrency: body.paidCurrency
        ? String(body.paidCurrency).toUpperCase() === "USD"
          ? "USD"
          : "CRC"
        : status === "PAYMENT_CONFIRMATION"
        ? "CRC"
        : null,
    };

    let initialVehicle = body.garageVehicle || null;
    if (!initialVehicle && userId) {
      const gv = (await prisma.garageVehicle.findFirst({
        where: { userId, isActive: true },
      })) || (await prisma.garageVehicle.findFirst({
        where: { userId },
      }));
      if (gv) {
        initialVehicle = {
          make: gv.brandName,
          model: gv.modelName,
          year: gv.year,
          color: gv.color || "",
          nickname: gv.nickname || "",
        };
      }
    }

    let docObj: any = {};
    if (initialVehicle) {
      docObj = {
        vehicleMake: initialVehicle.make || initialVehicle.brandName || "",
        vehicleModel: initialVehicle.model || initialVehicle.modelName || "",
        vehicleYear: String(initialVehicle.year || ""),
        vehicleColor: initialVehicle.color || "",
      };
    }

    if (isBacRequested) {
      docObj.paymentMethod = "BAC_COMPRA_CLICK";
      docObj.requestedBacLink = true;
      docObj.bacRequestedAt = new Date().toISOString();
      const bacTag = "[BAC Compra Click Solicitado - Enlace de pago pendiente por WhatsApp]";
      if (!orderData.notes) {
        orderData.notes = bacTag;
      } else if (!orderData.notes.includes("BAC Compra Click")) {
        orderData.notes = `${orderData.notes} | ${bacTag}`;
      }
    }

    const orderLanguage = body.language === "en" ? "en" : "es";
    docObj.language = orderLanguage;

    if (totalInstallationMinutes > 0) {
      docObj.installationDurationMinutes = totalInstallationMinutes;
      docObj.estimatedInstallationHours = Number((totalInstallationMinutes / 60).toFixed(1));
    }

    if (Object.keys(docObj).length > 0) {
      orderData.serviceDocumentsJson = JSON.stringify(docObj);
    }

    if (userId) {
      orderData.user = { connect: { id: userId } };
    }

    // Atomic interactive transaction: guard coupon increment, create order, and update profile
    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Guarded atomic discount usage check & increment
      if (pendingDiscountId) {
        const guardedCoupon = await tx.discountCode.updateMany({
          where: {
            id: pendingDiscountId,
            isActive: true,
            OR: [
              { maxUses: null },
              { timesUsed: { lt: (await tx.discountCode.findUnique({ where: { id: pendingDiscountId } }))?.maxUses ?? 999999 } },
            ],
          },
          data: { timesUsed: { increment: 1 } },
        });

        if (guardedCoupon.count === 0) {
          throw new Error("COUPON_LIMIT_REACHED");
        }
      }

      // 2. Create the order
      const createdOrder = await tx.order.create({
        data: orderData,
      });

      // 3. Update customer phone if provided
      if (userId && customerPhone) {
        await tx.user.update({
          where: { id: userId },
          data: { phoneNumber: customerPhone },
        });
      }

      return createdOrder;
    });

    const responsePayload = {
      success: true,
      order: newOrder,
    };

    if (idempotencyKey) {
      completeIdempotency(idempotencyKey, responsePayload, 200);
    }

    return NextResponse.json(responsePayload);
  } catch (error: any) {
    if (idempotencyKey) {
      releaseIdempotency(idempotencyKey);
    }
    console.error("Error in POST /api/orders:", error);
    if (error?.message === "COUPON_LIMIT_REACHED") {
      return NextResponse.json(
        {
          success: false,
          error: "El código de descuento ingresado ya ha alcanzado el límite de usos permitidos.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error?.message || "Error al registrar orden o cotización" },
      { status: 500 }
    );
  }
}
