import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { isRejectedPaymentCorrected } from "@/lib/orderWorkflow";

export async function GET(request: Request) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30")));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status && status !== "ALL") {
      if (status === "READY_FOR_PICKUP" || status === "READY_TO_PICK_UP") {
        where.status = { in: ["READY_FOR_PICKUP", "READY_TO_PICK_UP"] };
      } else {
        where.status = status;
      }
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
        { guestEmail: { contains: search } },
        { user: { email: { contains: search } } },
      ];
    }

    const [rawOrders, total, rejectedOrders] = await Promise.all([
      prisma.order.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.order.count({ where }),
      prisma.order.findMany({
        where: { status: "PAYMENT_REJECTED" },
        select: { id: true, status: true, serviceDocumentsJson: true },
      }),
    ]);

    const correctedRejectedCount = rejectedOrders.filter((o) => isRejectedPaymentCorrected(o)).length;

    const orderIds = rawOrders.map((o) => o.id);
    const orderNumbers = rawOrders.map((o) => o.orderNumber);
    const userIds = rawOrders.map((o) => o.userId).filter(Boolean) as string[];
    const [garageVehicles, serviceSchedules] = await Promise.all([
      userIds.length > 0
        ? prisma.garageVehicle.findMany({
            where: { userId: { in: userIds } },
            orderBy: { isActive: "desc" },
          })
        : Promise.resolve([]),
      prisma.serviceSchedule.findMany({
        where: {
          OR: [
            { orderId: { in: orderIds } },
            { orderId: { in: orderNumbers } },
          ],
          status: { not: "CANCELLED" },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const orders = rawOrders.map((order) => {
      const userVehicles = garageVehicles.filter((v) => v.userId === order.userId);
      const activeVehicle = userVehicles.find((v) => v.isActive) || userVehicles[0] || null;
      const sched = serviceSchedules.find((s) => s.orderId === order.id || s.orderId === order.orderNumber) || null;
      let isInstallationPaymentConfirmed = false;
      let purchaseProofUrls: string[] = [];
      if (order.serviceDocumentsJson) {
        try {
          const parsedDoc = typeof order.serviceDocumentsJson === "string" ? JSON.parse(order.serviceDocumentsJson) : order.serviceDocumentsJson;
          if (parsedDoc?.installationPaymentConfirmed) {
            isInstallationPaymentConfirmed = true;
          }
          if (Array.isArray(parsedDoc?.purchaseProofUrls)) {
            purchaseProofUrls = parsedDoc.purchaseProofUrls;
          }
        } catch {}
      }
      return {
        ...order,
        garageVehicle: activeVehicle,
        serviceSchedule: sched,
        isInstallationPaymentConfirmed,
        purchaseProofUrls,
      };
    });

    return NextResponse.json({
      success: true,
      orders,
      correctedRejectedCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[SYS_ORDERS_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
