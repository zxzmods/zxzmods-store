import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customerAuth";
import { getStealthSession } from "@/lib/stealthAuth";
import { getCustomerOrderStepIndex, getWorkflowStatusBadge, isOrderInProgramServiceStage } from "@/lib/orderWorkflow";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const customerSession = await getCustomerSession();
    const stealthSession = await getStealthSession();
    const isStaff = Boolean(stealthSession && (stealthSession.role === "MASTER" || stealthSession.role === "STAFF"));

    const { searchParams } = new URL(request.url);
    const orderIdsParam = searchParams.get("orderIds");

    const orderIdList = orderIdsParam
      ? orderIdsParam
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

    const orConditions: any[] = [];
    if (customerSession) {
      orConditions.push({ userId: customerSession.userId });
    }
    if (orderIdList.length > 0) {
      orConditions.push({ id: { in: orderIdList } });
      orConditions.push({ orderNumber: { in: orderIdList } });
    }

    if (orConditions.length === 0) {
      return NextResponse.json({ success: true, orders: [] });
    }

    const orders = await prisma.order.findMany({
      where: { OR: orConditions },
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        status: true,
        serviceType: true,
        totalCRC: true,
        paidCurrency: true,
        paymentRejectionReason: true,
        paymentProofUrl: true,
        serviceDocumentsJson: true,
        updatedAt: true,
        createdAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 25,
    });

    const enrichedOrders = orders.map((o) => {
      const isOwner = Boolean(customerSession && o.userId === customerSession.userId);
      const canViewSensitive = isOwner || isStaff;

      const isPaymentRejected = o.status.toUpperCase() === "PAYMENT_REJECTED";
      const stepIndex = getCustomerOrderStepIndex(o.status, o.serviceType, false, o.serviceDocumentsJson);
      const badgeEs = getWorkflowStatusBadge(o.status, "es");
      const badgeEn = getWorkflowStatusBadge(o.status, "en");

      let hasScheduledDate = false;
      if (o.serviceDocumentsJson) {
        try {
          const doc = typeof o.serviceDocumentsJson === "string" ? JSON.parse(o.serviceDocumentsJson) : o.serviceDocumentsJson;
          hasScheduledDate = Boolean(doc?.scheduledDate);
        } catch {}
      }
      const statusUpper = (o.status || "").toUpperCase();
      const isProgramStage = statusUpper === "PROGRAM_SERVICE" || stepIndex === 5 || isOrderInProgramServiceStage(o.status, o.serviceType);
      const isTerminalOrRejected = statusUpper === "CANCELLED" || statusUpper === "PAYMENT_REJECTED" || statusUpper === "REJECTED" || statusUpper === "COMPLETED";
      const needsServiceProgramming = isProgramStage && !hasScheduledDate && !isTerminalOrRejected;

      return {
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        serviceType: o.serviceType,
        totalCRC: canViewSensitive ? o.totalCRC : undefined,
        paidCurrency: canViewSensitive ? o.paidCurrency : undefined,
        paymentRejectionReason: canViewSensitive ? o.paymentRejectionReason : undefined,
        paymentProofUrl: canViewSensitive ? o.paymentProofUrl : undefined,
        isPaymentRejected: canViewSensitive ? isPaymentRejected : false,
        needsServiceProgramming,
        stepIndex,
        stageLabelEs: badgeEs.label,
        stageLabelEn: badgeEn.label,
        updatedAt: o.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      orders: enrichedOrders,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in GET /api/orders/updates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch order updates" },
      { status: 500 }
    );
  }
}
