import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCustomerSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: "No autorizado", services: [] },
        { status: 401 }
      );
    }

    const userId = session.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalCRC: true,
            customerName: true,
            customerPhone: true,
            shippingAddress: true,
            itemsJson: true,
            serviceType: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado", services: [] },
        { status: 404 }
      );
    }

    const userOrderIds = (user.orders || []).map((o) => o.id);
    const orderMap = new Map((user.orders || []).map((o) => [o.id, o]));

    // Query all service schedules matching this user
    const orConditions: any[] = [{ userId }];
    if (userOrderIds.length > 0) {
      orConditions.push({ orderId: { in: userOrderIds } });
    }
    if (user.phoneNumber) {
      orConditions.push({ clientPhone: user.phoneNumber });
    }

    const schedules = await prisma.serviceSchedule.findMany({
      where: {
        OR: orConditions,
      },
      orderBy: [{ date: "asc" }, { timeMinutes: "asc" }],
    });

    const now = new Date();

    const enriched = schedules.map((s) => {
      // Calculate hours to delivery / service
      // Time format: "HH:mm" (e.g. "10:00")
      const timeStr = s.time || "10:00";
      const scheduledDateTime = new Date(`${s.date}T${timeStr}:00`);
      const diffMs = scheduledDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // Can edit ONLY if more than 48 hours until delivery/service
      const canEdit = diffHours > 48 && s.status !== "CANCELLED" && s.status !== "COMPLETED";
      const hoursRemaining = Math.max(0, Math.round(diffHours * 10) / 10);

      let comments: any[] = [];
      try {
        comments = JSON.parse(s.commentsJson || "[]");
        if (!Array.isArray(comments)) comments = [];
      } catch {
        comments = [];
      }

      const linkedOrder = s.orderId ? orderMap.get(s.orderId) || null : null;

      return {
        ...s,
        canEdit,
        diffHours,
        hoursRemaining,
        comments,
        order: linkedOrder,
      };
    });

    return NextResponse.json({
      success: true,
      services: enriched,
    });
  } catch (error) {
    console.error("Error in GET /api/user/services:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener los servicios programados" },
      { status: 500 }
    );
  }
}
