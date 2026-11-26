import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { generateSecureClaimToken, generateOrderNumber } from "@/lib/orders";
import { createInitialSplitPaymentData, PaymentPlanType } from "@/lib/splitPayment";

export async function POST(request: Request) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const {
      userId = null,
      customerName = null,
      customerEmail = null,
      customerPhone = null,
      shippingAddress = null,
      serviceType = "STORE_PICKUP",
      items = [],
      partsSubtotalCRC = 0,
      installationCostCRC = 0,
      shippingCostCRC = 0,
      pickupCostCRC = 0,
      discountType = "NONE",
      discountValue = 0,
      discountReason = null,
      notes = null,
      staffNotes = null,
      paidCurrency = null,
      paymentPlan = "FULL_100",
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one item is required in the order" },
        { status: 400 }
      );
    }

    // Role-based discount threshold enforcement
    const numDiscountValue = Math.max(0, Number(discountValue) || 0);
    if (auth.session.role === "STAFF" && discountType === "PERCENTAGE" && numDiscountValue > 15) {
      return NextResponse.json(
        {
          success: false,
          error: "DISCOUNT_LIMIT_EXCEEDED",
          message: "Staff accounts cannot apply discounts greater than 15%. Master authorization required.",
        },
        { status: 403 }
      );
    }

    const computedItemsSubtotal = items.reduce(
      (acc: number, it: any) =>
        acc + Math.max(0, Math.round(Number(it?.priceCRC) || 0)) * Math.max(1, parseInt(String(it?.quantity || 1), 10) || 1),
      0
    );
    const numParts =
      computedItemsSubtotal > 0
        ? computedItemsSubtotal
        : Math.max(0, Math.round(Number(partsSubtotalCRC) || 0));
    const numInstall = Math.max(0, Math.round(Number(installationCostCRC) || 0));
    const numShipping = Math.max(0, Math.round(Number(shippingCostCRC) || 0));
    const numPickup = Math.max(0, Math.round(Number(pickupCostCRC) || 0));

    // Quotation total reflects the exact quoted product/combo prices (+ any explicit shipping/pickup),
    // never silently adding separate installation fees onto the quoted item prices.
    const grossSubtotal = numParts + numShipping + numPickup;

    let discountCRC = 0;
    if (discountType === "PERCENTAGE") {
      discountCRC = Math.round((grossSubtotal * numDiscountValue) / 100);
    } else if (discountType === "FIXED") {
      discountCRC = Math.round(numDiscountValue);
    }

    const finalTotalCRC = Math.max(0, grossSubtotal - discountCRC);

    const requestedStatusUpper = String(body.status || "").toUpperCase();
    const hasInitialPaymentProof = Boolean(
      typeof body.paymentProofUrl === "string" && body.paymentProofUrl.trim().length > 0
    );
    // Orders created by staff for client review/claim MUST start in COTIZACION unless a payment proof is explicitly attached
    const targetStatus =
      !requestedStatusUpper ||
      (requestedStatusUpper === "PAYMENT_CONFIRMATION" && !hasInitialPaymentProof)
        ? "COTIZACION"
        : body.status;
    const isQuotation = String(targetStatus).toUpperCase() === "COTIZACION";

    // Generate unique order number and high-entropy claim token
    const orderNumber = generateOrderNumber(isQuotation);
    const claimToken = generateSecureClaimToken();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zxzmods.com";
    const claimUrl = `${baseUrl.replace(/\/+$/, "")}/pedidos/reclamar/${claimToken}`;

    let targetUserId = userId || null;
    let registeredUser = null;

    if (targetUserId) {
      registeredUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    } else if (customerEmail) {
      registeredUser = await prisma.user.findUnique({
        where: { email: customerEmail.toLowerCase().trim() },
      });
      if (registeredUser) targetUserId = registeredUser.id;
    }

    let finalCustomerName = customerName || null;
    let finalCustomerEmail = customerEmail || null;
    let finalCustomerPhone = customerPhone || null;
    let finalNotes = notes || null;

    if (registeredUser) {
      targetUserId = registeredUser.id;
      finalCustomerName = registeredUser.displayName || customerName || registeredUser.email;
      finalCustomerEmail = registeredUser.email;
      finalCustomerPhone = registeredUser.phoneNumber || customerPhone || null;

      const userVehicle = await prisma.garageVehicle.findFirst({
        where: { userId: registeredUser.id },
        orderBy: { updatedAt: "desc" },
      });
      if (userVehicle) {
        const vehicleTag = `[Vehículo Registrado: ${userVehicle.year} ${userVehicle.brandName} ${userVehicle.modelName}${userVehicle.color ? ` (${userVehicle.color})` : ""}]`;
        finalNotes = finalNotes ? `${finalNotes}\n${vehicleTag}` : vehicleTag;
      }
    }

    // Hydrate quoted items with canonical product/combo metadata (title, nameEs/nameEn, slug, sku, imageUrl, brand)
    const itemIdentifiers = Array.from(
      new Set(
        items
          .flatMap((it: any) => [it?.id, it?.sku, it?.slug])
          .map((v: any) => (typeof v === "string" ? v.trim() : ""))
          .filter(Boolean)
      )
    );
    const [dbProducts, dbCombos] = itemIdentifiers.length > 0
      ? await Promise.all([
          prisma.product.findMany({
            where: {
              OR: [
                { id: { in: itemIdentifiers } },
                { sku: { in: itemIdentifiers } },
                { slug: { in: itemIdentifiers } },
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
              installationAvailable: true,
              isInstallationIncluded: true,
              homeInstallationAvailable: true,
            },
          }),
          prisma.combo.findMany({
            where: {
              OR: [
                { id: { in: itemIdentifiers } },
                { slug: { in: itemIdentifiers } },
              ],
            },
            select: {
              id: true,
              slug: true,
              titleEs: true,
              titleEn: true,
              imageUrl: true,
              imagesJson: true,
              installationAvailable: true,
              homeInstallationAvailable: true,
            },
          }),
        ])
      : [[], []];

    const resolveFirstImg = (primary?: string | null, imagesJson?: string | null) => {
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

    const prodLookup = new Map<string, any>();
    dbProducts.forEach((p) => {
      prodLookup.set(p.id, p);
      if (p.sku) prodLookup.set(p.sku, p);
      if (p.slug) prodLookup.set(p.slug, p);
    });
    const comboLookup = new Map<string, any>();
    dbCombos.forEach((c) => {
      comboLookup.set(c.id, c);
      if (c.slug) comboLookup.set(c.slug, c);
    });

    const enrichedItems = items.map((it: any) => {
      const matchedProd =
        prodLookup.get(it?.id) ||
        (it?.sku ? prodLookup.get(it.sku) : undefined) ||
        (it?.slug ? prodLookup.get(it.slug) : undefined);
      const matchedCombo =
        comboLookup.get(it?.id) ||
        (it?.slug ? comboLookup.get(it.slug) : undefined) ||
        (it?.sku ? comboLookup.get(it.sku) : undefined);

      if (matchedProd) {
        const resolvedTitle = it.title || it.nameEs || matchedProd.nameEs || matchedProd.nameEn || it.name || "Producto";
        const isDeliveryOnly = matchedProd.installationAvailable === false;
        const isFreeInstall = !isDeliveryOnly && Boolean(matchedProd.isInstallationIncluded);
        return {
          ...it,
          id: matchedProd.id,
          slug: it.slug || matchedProd.slug || matchedProd.sku,
          sku: it.sku || matchedProd.sku,
          title: resolvedTitle,
          name: it.name || resolvedTitle,
          nameEs: it.nameEs || matchedProd.nameEs || resolvedTitle,
          nameEn: it.nameEn || matchedProd.nameEn || resolvedTitle,
          brand: it.brand || matchedProd.brandName || undefined,
          imageUrl: it.imageUrl && it.imageUrl !== "/images/logo.png" ? it.imageUrl : resolveFirstImg(matchedProd.imageUrl, matchedProd.imagesJson),
          installationAvailable: !isDeliveryOnly,
          freeInstallation: isFreeInstall,
          homeInstallation: isDeliveryOnly ? false : (it.homeInstallation ?? matchedProd.homeInstallationAvailable ?? true),
          type: it.type || "PRODUCT",
        };
      }

      if (matchedCombo) {
        const resolvedTitle = it.title || it.nameEs || matchedCombo.titleEs || matchedCombo.titleEn || it.name || "Combo";
        const comboIncludesInstall = matchedCombo.installationAvailable !== false;
        return {
          ...it,
          id: matchedCombo.id,
          slug: it.slug || matchedCombo.slug,
          sku: it.sku || matchedCombo.slug,
          title: resolvedTitle,
          name: it.name || resolvedTitle,
          nameEs: it.nameEs || matchedCombo.titleEs || resolvedTitle,
          nameEn: it.nameEn || matchedCombo.titleEn || resolvedTitle,
          brand: it.brand || "ZxZ Mods",
          imageUrl: it.imageUrl && it.imageUrl !== "/images/logo.png" ? it.imageUrl : resolveFirstImg(matchedCombo.imageUrl, matchedCombo.imagesJson),
          installationPriceCRC: 0,
          installationAvailable: comboIncludesInstall,
          freeInstallation: comboIncludesInstall,
          homeInstallation: comboIncludesInstall ? (it.homeInstallation ?? matchedCombo.homeInstallationAvailable ?? true) : false,
          type: it.type || "COMBO",
        };
      }

      const fallbackTitle = it?.title || it?.nameEs || it?.name || it?.nameEn || "Artículo";
      return {
        ...it,
        title: fallbackTitle,
        name: it?.name || fallbackTitle,
        nameEs: it?.nameEs || fallbackTitle,
        nameEn: it?.nameEn || fallbackTitle,
      };
    });

    const normalizedPaymentPlan: PaymentPlanType =
      String(paymentPlan || "").toUpperCase() === "SPLIT_70_30" ? "SPLIT_70_30" : "FULL_100";

    const initialServiceDocs: Record<string, any> = {
      paymentPlan: normalizedPaymentPlan,
      staffSelectedPaymentPlan: true,
      ...(normalizedPaymentPlan === "SPLIT_70_30"
        ? { splitPayment: createInitialSplitPaymentData(finalTotalCRC) }
        : {}),
    };

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        userId: targetUserId,
        guestEmail: finalCustomerEmail,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        shippingAddress: shippingAddress || null,
        serviceType: serviceType || "STORE_PICKUP",
        status: targetStatus,
        paidCurrency: paidCurrency ? (String(paidCurrency).toUpperCase() === "USD" ? "USD" : "CRC") : null,
        partsStatus: "PENDING",
        totalCRC: finalTotalCRC,
        partsSubtotalCRC: numParts,
        laborSubtotalCRC: 0,
        installationCostCRC: numInstall,
        shippingCostCRC: numShipping,
        pickupCostCRC: numPickup,
        discountCRC,
        discountType: discountType || "NONE",
        discountValue: numDiscountValue,
        discountReason: discountReason || null,
        discountAppliedBy: auth.session.email,
        assignedStaffId: auth.session.userId,
        itemsJson: JSON.stringify(enrichedItems),
        serviceDocumentsJson: JSON.stringify(initialServiceDocs),
        notes: finalNotes,
        staffNotes: staffNotes || null,
        claimToken,
        isRedeemed: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            phoneNumber: true,
          },
        },
      },
    });

    // Record audit trail
    await recordAuditLog({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: "CREATE_ORDER",
      entityType: "ORDER",
      entityId: newOrder.id,
      newData: {
        orderNumber: newOrder.orderNumber,
        userId: newOrder.userId,
        totalCRC: newOrder.totalCRC,
        serviceType: newOrder.serviceType,
        installationCostCRC: newOrder.installationCostCRC,
        shippingCostCRC: newOrder.shippingCostCRC,
        discountType: newOrder.discountType,
        discountValue: newOrder.discountValue,
        paymentPlan: normalizedPaymentPlan,
      },
      details: `Custom order #${newOrder.orderNumber} created by ${auth.session.role} ${auth.session.email}`,
    });

    return NextResponse.json({ success: true, orderNumber: newOrder.orderNumber, order: newOrder, claimToken, claimUrl });
  } catch (error) {
    console.error("[SYS_ORDER_CREATE_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create custom order" },
      { status: 500 }
    );
  }
}
