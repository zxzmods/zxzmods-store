import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { isRejectedPaymentCorrected } from "@/lib/orderWorkflow";
import { normalizeSearchTerm } from "@/lib/search";

export async function GET(request: Request) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const orderType = searchParams.get("type") || "STANDARD"; // STANDARD | WARRANTY | ALL
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30")));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Standard orders pipeline must NOT include or count GAR- (warranty service) orders
    if (orderType === "WARRANTY") {
      where.orderNumber = { startsWith: "GAR-" };
    } else if (orderType !== "ALL") {
      where.NOT = { orderNumber: { startsWith: "GAR-" } };
    }

    if (status && status !== "ALL") {
      if (status === "READY_FOR_PICKUP" || status === "READY_TO_PICK_UP") {
        where.status = { in: ["READY_FOR_PICKUP", "READY_TO_PICK_UP"] };
      } else {
        where.status = status;
      }
    }

    const trimmedSearch = (search || "").trim();
    const searchTokens = trimmedSearch
      ? normalizeSearchTerm(trimmedSearch).split(/\s+/).filter(Boolean)
      : [];

    let rawOrders: any[] = [];
    let total = 0;

    const [fetchedOrders, dbCount, rejectedOrders] = await Promise.all([
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
        ...(searchTokens.length > 0 ? {} : { take: limit, skip }),
      }),
      searchTokens.length > 0 ? Promise.resolve(0) : prisma.order.count({ where }),
      prisma.order.findMany({
        where: {
          status: "PAYMENT_REJECTED",
          ...(orderType === "WARRANTY"
            ? { orderNumber: { startsWith: "GAR-" } }
            : orderType !== "ALL"
            ? { NOT: { orderNumber: { startsWith: "GAR-" } } }
            : {}),
        },
        select: { id: true, status: true, serviceDocumentsJson: true },
      }),
    ]);

    if (searchTokens.length > 0) {
      const matched = fetchedOrders.filter((o) => {
        const haystack = normalizeSearchTerm(
          [
            o.orderNumber,
            o.customerName,
            o.customerPhone,
            o.guestEmail,
            o.user?.email,
            o.user?.displayName,
            o.user?.phoneNumber,
            o.itemsJson,
            o.notes,
            o.staffNotes,
          ]
            .filter(Boolean)
            .join(" ")
        );
        return searchTokens.every((tok) => haystack.includes(tok));
      });
      total = matched.length;
      rawOrders = matched.slice(skip, skip + limit);
    } else {
      rawOrders = fetchedOrders;
      total = dbCount;
    }

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
      const resolvedCustomerName = order.customerName || order.user?.displayName || null;
      const resolvedCustomerPhone = order.customerPhone || order.user?.phoneNumber || null;
      const resolvedGuestEmail = order.guestEmail || order.user?.email || null;
      const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://zxzmods.com").replace(/\/+$/, "");
      const claimUrl =
        order.claimToken && !order.isRedeemed
          ? `${baseUrl}/pedidos/reclamar/${order.claimToken}`
          : null;

      return {
        ...order,
        customerName: resolvedCustomerName,
        customerPhone: resolvedCustomerPhone,
        guestEmail: resolvedGuestEmail,
        claimUrl,
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
