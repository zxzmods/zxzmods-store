import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { generateSecureClaimToken, generateOrderNumber } from "@/lib/orders";

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

    const numParts = Math.max(0, Math.round(Number(partsSubtotalCRC) || 0));
    const numInstall = Math.max(0, Math.round(Number(installationCostCRC) || 0));
    const numShipping = Math.max(0, Math.round(Number(shippingCostCRC) || 0));
    const numPickup = Math.max(0, Math.round(Number(pickupCostCRC) || 0));

    const grossSubtotal = numParts + numInstall + numShipping + numPickup;

    let discountCRC = 0;
    if (discountType === "PERCENTAGE") {
      discountCRC = Math.round((grossSubtotal * numDiscountValue) / 100);
    } else if (discountType === "FIXED") {
      discountCRC = numDiscountValue;
    }

    const finalTotalCRC = Math.max(0, grossSubtotal - discountCRC);

    const targetStatus = body.status || "COTIZACION";
    const isQuotation = targetStatus === "COTIZACION" || targetStatus === "cotizacion";

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
        laborSubtotalCRC: numInstall,
        installationCostCRC: numInstall,
        shippingCostCRC: numShipping,
        pickupCostCRC: numPickup,
        discountType: discountType || "NONE",
        discountValue: numDiscountValue,
        discountReason: discountReason || null,
        discountAppliedBy: auth.session.email,
        assignedStaffId: auth.session.userId,
        itemsJson: JSON.stringify(items),
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
