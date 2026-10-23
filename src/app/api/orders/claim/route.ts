import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customerAuth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "MISSING_TOKEN", message: "Token de reclamo no proporcionado." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { claimToken: token },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_OR_EXPIRED",
          message: "Este enlace de pedido no es válido o ya fue canjeado previamente.",
        },
        { status: 404 }
      );
    }

    if (order.isRedeemed) {
      return NextResponse.json(
        {
          success: false,
          error: "ALREADY_REDEEMED",
          message: "Este pedido ya fue canjeado e inscrito en una cuenta de usuario.",
        },
        { status: 410 }
      );
    }

    let items = [];
    try {
      items = JSON.parse(order.itemsJson || "[]");
    } catch {
      items = [];
    }

    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        serviceType: order.serviceType,
        totalCRC: order.totalCRC,
        partsSubtotalCRC: order.partsSubtotalCRC,
        installationCostCRC: order.installationCostCRC,
        shippingCostCRC: order.shippingCostCRC,
        pickupCostCRC: order.pickupCostCRC,
        discountType: order.discountType,
        discountValue: order.discountValue,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        shippingAddress: order.shippingAddress,
        items,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("[ORDER_CLAIM_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "Error al consultar el pedido." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "AUTH_REQUIRED", message: "Debes iniciar sesión con tu cuenta para canjear el pedido." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "MISSING_TOKEN", message: "Token de canje no proporcionado." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { claimToken: token },
    });

    if (!order || order.isRedeemed) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_OR_REDEEMED",
          message: "El enlace ya no es válido o el pedido ya fue canjeado por otro usuario.",
        },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "USER_NOT_FOUND", message: "Usuario no encontrado." },
        { status: 404 }
      );
    }

    // Redeem and link order atomically with race-condition guard
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { claimToken: token },
      });

      if (!existing || existing.isRedeemed) {
        return null;
      }

      // Guarded atomic update ensuring token hasn't been redeemed concurrently
      const updateResult = await tx.order.updateMany({
        where: {
          id: existing.id,
          claimToken: token,
          isRedeemed: false,
        },
        data: {
          userId: targetUser.id,
          customerName: targetUser.displayName || targetUser.email,
          guestEmail: targetUser.email,
          isRedeemed: true,
          redeemedAt: new Date(),
          claimToken: null, // Invalidate token permanently
        },
      });

      if (updateResult.count === 0) {
        return null;
      }

      return existing;
    });

    if (!updatedOrder) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_OR_REDEEMED",
          message: "El enlace ya no es válido o el pedido ya fue canjeado por otro usuario.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "¡Pedido canjeado e inscrito exitosamente en tu cuenta!",
      orderNumber: updatedOrder.orderNumber,
    });
  } catch (error) {
    console.error("[ORDER_CLAIM_POST_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "SERVER_ERROR", message: "Error al canjear el pedido." },
      { status: 500 }
    );
  }
}
