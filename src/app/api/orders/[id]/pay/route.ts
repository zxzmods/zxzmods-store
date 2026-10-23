import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customerAuth";
import { getStealthSession } from "@/lib/stealthAuth";
import { checkRateLimit, createRateLimitResponse, getClientIp } from "@/lib/rateLimit";
import { checkAndAcquireIdempotency, completeIdempotency, releaseIdempotency } from "@/lib/idempotency";
import { isValidStorageUrl, sanitizePlainText } from "@/lib/security/inputSanitizer";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ip = getClientIp(request);
  const rate = checkRateLimit({
    key: `pay_${ip}`,
    maxRequests: 20,
    windowMs: 60 * 1000,
  });
  if (!rate.success) return createRateLimitResponse(rate.resetMs);

  let idempotencyKey: string | null = request.headers.get("Idempotency-Key");

  try {
    const orderId = params.id;
    const body = await request.json().catch(() => ({}));
    if (!idempotencyKey && body.idempotencyKey) {
      idempotencyKey = String(body.idempotencyKey);
    }

    if (idempotencyKey) {
      const idemp = checkAndAcquireIdempotency(idempotencyKey);
      if (idemp.state === "IN_PROGRESS") return idemp.conflictResponse;
      if (idemp.state === "CACHED") return idemp.cachedResponse;
    }
    const {
      paymentMethod = "BANK_TRANSFER",
      referenceNumber = "",
      customerPhone = "",
      notes = "",
      paidCurrency = "CRC",
      paymentProofUrl,
      claimToken,
    } = body;

    if (paymentProofUrl && !isValidStorageUrl(paymentProofUrl)) {
      return NextResponse.json(
        { success: false, error: "El comprobante de pago debe provenir de un almacenamiento seguro válido." },
        { status: 400 }
      );
    }

    const sanitizedReference = sanitizePlainText(referenceNumber, 60);
    const sanitizedPhone = sanitizePlainText(customerPhone, 30);
    const sanitizedNotes = sanitizePlainText(notes, 500);

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    const customerSession = await getCustomerSession();
    const stealthSession = await getStealthSession();
    const isStaff = Boolean(stealthSession && (stealthSession.role === "MASTER" || stealthSession.role === "STAFF"));
    const isOwner = Boolean(customerSession && order.userId === customerSession.userId);
    const hasValidClaimToken = Boolean(claimToken && order.claimToken === claimToken);
    const isGuestOrder = !order.userId;

    if (!isOwner && !isStaff && !hasValidClaimToken && !isGuestOrder) {
      return NextResponse.json(
        { success: false, error: "No autorizado para registrar pagos en esta orden" },
        { status: 403 }
      );
    }

    let existingComments: any[] = [];
    try {
      existingComments = JSON.parse((order as any).commentsJson || "[]");
      if (!Array.isArray(existingComments)) existingComments = [];
    } catch {
      existingComments = [];
    }

    // Sanitize any past comments mentioning SINPE Movil
    existingComments = existingComments.map((c: any) => {
      if (c && typeof c.text === "string" && c.text.includes("SINPE")) {
        return {
          ...c,
          text: c.text.replace(/SINPE M[oó]vil/gi, "Transferencia Bancaria").replace(/SINPE/gi, "Transferencia Bancaria"),
        };
      }
      return c;
    });

    const methodNameLabel =
      paymentMethod === "CARD"
        ? "Tarjeta Débito/Crédito"
        : "Transferencia Bancaria (IBAN)";

    const normalizedCurrency = String(paidCurrency || "CRC").toUpperCase() === "USD" ? "USD" : "CRC";

    const systemPaymentComment = {
      id: `cmt-pay-${Date.now()}`,
      authorRole: "SYSTEM",
      authorName: "Sistema ZxZ Mods",
      text: `Pago registrado mediante ${methodNameLabel} (${normalizedCurrency === "USD" ? "USD ($)" : "CRC (₡)"}).${
        sanitizedReference ? ` Comprobante / Ref: #${sanitizedReference}.` : ""
      }${sanitizedPhone ? ` Teléfono: ${sanitizedPhone}.` : ""}${sanitizedNotes ? ` Nota: ${sanitizedNotes}` : ""} Estado actualizado a comprobante en verificación.`,
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [...existingComments, systemPaymentComment];

    // PM-02: Support linear resumption after payment rejection
    let serviceDocs: any = {};
    if (order.serviceDocumentsJson) {
      try {
        serviceDocs =
          typeof order.serviceDocumentsJson === "string"
            ? JSON.parse(order.serviceDocumentsJson)
            : order.serviceDocumentsJson;
      } catch {}
    }

    const isCurrentRejected = (order.status || "").toUpperCase() === "PAYMENT_REJECTED";
    const rejectionType = serviceDocs.rejectionPaymentType;
    let targetStatus = "PAYMENT_CONFIRMATION";
    const updatePayload: any = {
      paidCurrency: normalizedCurrency,
      commentsJson: JSON.stringify(updatedComments),
      customerPhone: sanitizedPhone || order.customerPhone,
      notes: sanitizedNotes ? (order.notes ? `${order.notes} | ${sanitizedNotes}` : sanitizedNotes) : order.notes,
      paymentRejectionReason: null,
      updatedAt: new Date(),
    };

    if (rejectionType === "SERVICE") {
      targetStatus = "CONFIRM_SERVICE_PAYMENT";
      serviceDocs.servicePaymentRejected = false;
      serviceDocs.servicePaymentReceiptUrl = paymentProofUrl ? String(paymentProofUrl) : order.servicePaymentProofUrl;
      updatePayload.servicePaymentProofUrl = serviceDocs.servicePaymentReceiptUrl;
    } else if (rejectionType === "INSTALLATION") {
      targetStatus = "INSTALLATION_PAYMENT";
      serviceDocs.installationPaymentRejected = false;
      serviceDocs.installationPaymentReceiptUrl = paymentProofUrl ? String(paymentProofUrl) : order.installationPaymentProofUrl;
      updatePayload.installationPaymentProofUrl = serviceDocs.installationPaymentReceiptUrl;
    } else {
      // Primary order payment retry
      serviceDocs.orderPaymentRejected = false;
      updatePayload.paymentProofUrl =
        paymentProofUrl !== undefined ? (paymentProofUrl ? String(paymentProofUrl) : null) : order.paymentProofUrl;
    }

    if (isCurrentRejected) {
      // Keep order in PAYMENT_REJECTED with paymentCorrected flag so staff sees the bullet point in Rejected Payment state
      serviceDocs.paymentCorrected = true;
      serviceDocs.paymentCorrectedAt = new Date().toISOString();
      serviceDocs.hasNewProofToReview = true;
      if (!serviceDocs.preRejectionStatus) {
        serviceDocs.preRejectionStatus = targetStatus;
      }
      updatePayload.status = "PAYMENT_REJECTED";
    } else {
      updatePayload.status = targetStatus;
    }

    updatePayload.serviceDocumentsJson = JSON.stringify(serviceDocs);

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: updatePayload,
    });

    const responsePayload = {
      success: true,
      order: updatedOrder,
      message: "Pago registrado exitosamente. La orden ha sido confirmada.",
    };

    if (idempotencyKey) {
      completeIdempotency(idempotencyKey, responsePayload, 200);
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    if (idempotencyKey) {
      releaseIdempotency(idempotencyKey);
    }
    console.error("Error in POST /api/orders/[id]/pay:", error);
    return NextResponse.json(
      { success: false, error: "Error al procesar el pago de la orden" },
      { status: 500 }
    );
  }
}
