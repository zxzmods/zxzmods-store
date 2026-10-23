import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customerAuth";
import { getStealthSession } from "@/lib/stealthAuth";
import { isOrderInInstallationPaymentStage, canPayInstallation } from "@/lib/orderWorkflow";
import { checkRateLimit, createRateLimitResponse, getClientIp } from "@/lib/rateLimit";
import { checkAndAcquireIdempotency, completeIdempotency, releaseIdempotency } from "@/lib/idempotency";
import { isValidStorageUrl, sanitizePlainText } from "@/lib/security/inputSanitizer";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const ip = getClientIp(request);
  const rate = checkRateLimit({
    key: `inst_pay_${ip}`,
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
    const customerSession = await getCustomerSession();
    const stealthSession = await getStealthSession();
    const isStaff = Boolean(
      stealthSession &&
        (stealthSession.role === "MASTER" || stealthSession.role === "STAFF")
    );

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Orden no encontrada." },
        { status: 404 }
      );
    }

    // Permission check: owner or staff
    const isOwner = Boolean(customerSession && order.userId === customerSession.userId);
    if (!isOwner && !isStaff) {
      return NextResponse.json(
        { success: false, error: "No autorizado para registrar pago en esta orden." },
        { status: 403 }
      );
    }

    // STATE ENFORCEMENT: Client can pay installation during 'INSTALLATION_PAYMENT' or 'READY_FOR_PICKUP' (in only installation)
    if (!canPayInstallation(order.status, order.serviceType, order.serviceDocumentsJson) && !isStaff) {
      return NextResponse.json(
        {
          success: false,
          error: "El pago de instalación solo puede realizarse cuando la orden se encuentra en el estado 'Pago de Instalación' o 'Listo para Retiro'.",
        },
        { status: 400 }
      );
    }

    // Check if already confirmed
    let isAlreadyConfirmed = false;
    if (order.serviceDocumentsJson) {
      try {
        const parsed = typeof order.serviceDocumentsJson === "string" ? JSON.parse(order.serviceDocumentsJson) : order.serviceDocumentsJson;
        if (parsed?.installationPaymentConfirmed) {
          isAlreadyConfirmed = true;
        }
      } catch {}
    }
    if (isAlreadyConfirmed && !isStaff) {
      return NextResponse.json(
        {
          success: false,
          error: "El pago de instalación ya se encuentra confirmado para esta orden.",
        },
        { status: 400 }
      );
    }

    const {
      receiptUrl,
      phone,
      paidCurrency = "CRC",
      paidAmountCRC,
      baseLaborCRC,
      ivaCRC,
      requiresElectronicInvoice = false,
      electronicInvoice = null,
      paymentMethod,
      requestedBacLink,
    } = body;

    const isBacRequested =
      paymentMethod === "BAC_COMPRA_CLICK" || requestedBacLink === true;

    if (!isBacRequested) {
      if (!receiptUrl || typeof receiptUrl !== "string" || !isValidStorageUrl(receiptUrl)) {
        return NextResponse.json(
          { success: false, error: "El comprobante de pago debe ser una URL de almacenamiento seguro válida." },
          { status: 400 }
        );
      }
    }

    const effectiveReceiptUrl = isBacRequested
      ? "BAC_COMPRA_CLICK_AUTH: PENDIENTE"
      : receiptUrl;

    const sanitizedPhone = sanitizePlainText(phone, 30);

    // Existing service documents JSON
    let docsData: any = {};
    if (order.serviceDocumentsJson) {
      try {
        docsData =
          typeof order.serviceDocumentsJson === "string"
            ? JSON.parse(order.serviceDocumentsJson)
            : order.serviceDocumentsJson;
      } catch {
        docsData = {};
      }
    }

    const effectiveBaseLabor = baseLaborCRC || order.installationCostCRC || order.laborSubtotalCRC || 0;
    const effectiveIva = ivaCRC !== undefined ? ivaCRC : Math.round(effectiveBaseLabor * 0.13);
    const installCost = paidAmountCRC || (effectiveBaseLabor + effectiveIva);

    docsData.installationPaymentSubmittedAt = new Date().toISOString();
    docsData.installationPaymentReceiptUrl = effectiveReceiptUrl;
    docsData.installationPaymentPhone = phone || order.customerPhone || "";
    docsData.installationPaymentPaidCurrency = paidCurrency;
    docsData.installationPaymentPaidAmountCRC = installCost;
    docsData.installationPaymentLaborCRC = effectiveBaseLabor;
    docsData.installationPaymentIvaCRC = effectiveIva;
    docsData.installationPaymentRequiresFactura = Boolean(requiresElectronicInvoice);
    if (isBacRequested) {
      docsData.installationPaymentMethod = "BAC_COMPRA_CLICK";
      docsData.installationRequestedBacLink = true;
      docsData.installationBacRequestedAt = new Date().toISOString();
    }
    if (requiresElectronicInvoice && electronicInvoice) {
      docsData.installationPaymentElectronicInvoice = electronicInvoice;
    }

    if ((order.status || "").toUpperCase() === "PAYMENT_REJECTED") {
      docsData.paymentCorrected = true;
      docsData.paymentCorrectedAt = new Date().toISOString();
      docsData.hasNewProofToReview = true;
      docsData.installationPaymentRejected = false;
    }

    // Parse existing comments
    let comments: any[] = [];
    if (order.commentsJson) {
      try {
        comments =
          typeof order.commentsJson === "string"
            ? JSON.parse(order.commentsJson)
            : order.commentsJson;
      } catch {
        comments = [];
      }
    }

    const authorName =
      order.customerName ||
      customerSession?.email ||
      "Cliente";

    const newComment = {
      id: `cmt-inst-${Date.now()}`,
      authorRole: isStaff ? "STAFF" : "CUSTOMER",
      authorName,
      text: isBacRequested
        ? `[BAC Compra Click Solicitado - Instalación]: Solicitud de enlace de pago con tarjeta para mano de obra por ₡${installCost.toLocaleString(
            "es-CR"
          )} (Mano de obra: ₡${effectiveBaseLabor.toLocaleString("es-CR")} + IVA 13%: ₡${effectiveIva.toLocaleString(
            "es-CR"
          )}) [${paidCurrency}]. Teléfono: ${phone || order.customerPhone || "N/A"}. Enlace pendiente de envío por WhatsApp.${
            requiresElectronicInvoice ? " [Factura Electrónica Solicitada]" : ""
          }`
        : `Comprobante de pago de instalación cargado por ₡${installCost.toLocaleString(
            "es-CR"
          )} (Mano de obra: ₡${effectiveBaseLabor.toLocaleString("es-CR")} + IVA 13%: ₡${effectiveIva.toLocaleString("es-CR")}) [${paidCurrency}]. Teléfono: ${phone || order.customerPhone || "N/A"}.${
            requiresElectronicInvoice ? " [Factura Electrónica Solicitada]" : ""
          }`,
      createdAt: new Date().toISOString(),
    };
    comments.push(newComment);

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        installationPaymentProofUrl: effectiveReceiptUrl,
        serviceDocumentsJson: JSON.stringify(docsData),
        commentsJson: JSON.stringify(comments),
        customerPhone: phone?.trim() || order.customerPhone,
      },
    });

    const responsePayload = {
      success: true,
      message: "Comprobante de instalación registrado exitosamente.",
      order: updatedOrder,
    };

    if (idempotencyKey) {
      completeIdempotency(idempotencyKey, responsePayload, 200);
    }

    return NextResponse.json(responsePayload);
  } catch (err: any) {
    if (idempotencyKey) {
      releaseIdempotency(idempotencyKey);
    }
    console.error("Error in installation payment route:", err);
    return NextResponse.json(
      { success: false, error: "Error de servidor al registrar pago de instalación." },
      { status: 500 }
    );
  }
}
