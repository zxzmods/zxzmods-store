import { NextResponse } from "next/server";
import { requireStealthSession, verifyMasterElevationPassword } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { syncMonthlyClosure } from "@/lib/monthlyFinance";
import { shouldSkipInstallationPayment, isServiceRequiringInstallation } from "@/lib/orderWorkflow";
import { sendOrderReceiptEmail } from "@/lib/email";
import {
  sendOrderStepNotificationEmail,
  resolveProfileEmail,
  resolveOrderLanguage,
} from "@/lib/orderStepEmails";
import { COMPANY_CONFIG } from "@/config/company";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const orderId = params.id;
    const body = await request.json().catch(() => ({}));
    const {
      status,
      partsStatus,
      supplierNotes,
      staffNotes,
      itemsJson,
      totalCRC,
      partsSubtotalCRC,
      laborSubtotalCRC,
      customerName,
      customerPhone,
      guestEmail,
      shippingAddress,
      serviceType,
      installationCostCRC,
      shippingCostCRC,
      pickupCostCRC,
      discountType,
      discountValue,
      discountReason,
      notes,
      commentsJson,
      paidCurrency,
    } = body;

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (status !== undefined) {
      const targetUpper = String(status).toUpperCase();
      const currentUpper = String(existingOrder.status).toUpperCase();
      const requiresInstall = isServiceRequiringInstallation(existingOrder.serviceType);
      const skipInstallationPayment = shouldSkipInstallationPayment(
        existingOrder,
        existingOrder.installationCostCRC,
        existingOrder.laborSubtotalCRC
      );

      let isInstPaymentConfirmed = false;
      if (skipInstallationPayment || body.confirmInstallationPayment === true) {
        isInstPaymentConfirmed = true;
      } else if (existingOrder.serviceDocumentsJson) {
        try {
          const parsed =
            typeof existingOrder.serviceDocumentsJson === "string"
              ? JSON.parse(existingOrder.serviceDocumentsJson)
              : existingOrder.serviceDocumentsJson;
          if (parsed?.installationPaymentConfirmed) {
            isInstPaymentConfirmed = true;
          }
        } catch {}
      }

      // RULE 1: Can't advance without order payment in 'confirmacion de pago' state
      if (
        currentUpper === "PAYMENT_CONFIRMATION" &&
        targetUpper !== "PAYMENT_CONFIRMATION" &&
        targetUpper !== "PAYMENT_REJECTED" &&
        targetUpper !== "CANCELLED"
      ) {
        const effectiveOrderProof = (
          body.paymentProofUrl !== undefined
            ? body.paymentProofUrl
            : body.bacAuthorizationCode
            ? `BAC_COMPRA_CLICK_AUTH: ${body.bacAuthorizationCode}`
            : existingOrder.paymentProofUrl
        );
        if (!effectiveOrderProof || !String(effectiveOrderProof).trim()) {
          return NextResponse.json(
            {
              success: false,
              error: "No se puede avanzar el pedido desde 'Confirmación de Pago': se requiere adjuntar el comprobante de pago de la orden o autorización BAC Compra Click.",
            },
            { status: 400 }
          );
        }
      }

      // RULE BUY PROOF: Can't advance from 'NEED_TO_GET_ORDER' without supplier purchase proof images (*un)
      if (
        currentUpper === "NEED_TO_GET_ORDER" &&
        targetUpper !== "NEED_TO_GET_ORDER" &&
        targetUpper !== "PAYMENT_REJECTED" &&
        targetUpper !== "CANCELLED"
      ) {
        let hasPurchaseProof = false;
        if (Array.isArray(body.purchaseProofUrls) && body.purchaseProofUrls.length > 0) {
          hasPurchaseProof = body.purchaseProofUrls.some((u: any) => typeof u === "string" && u.trim().length > 0);
        } else if (body.addPurchaseProofUrl && typeof body.addPurchaseProofUrl === "string" && body.addPurchaseProofUrl.trim().length > 0) {
          hasPurchaseProof = true;
        } else if (existingOrder.serviceDocumentsJson) {
          try {
            const parsed = typeof existingOrder.serviceDocumentsJson === "string" ? JSON.parse(existingOrder.serviceDocumentsJson) : existingOrder.serviceDocumentsJson;
            if (Array.isArray(parsed?.purchaseProofUrls) && parsed.purchaseProofUrls.length > 0) {
              hasPurchaseProof = parsed.purchaseProofUrls.some((u: any) => typeof u === "string" && u.trim().length > 0);
            }
          } catch {}
        }

        if (!hasPurchaseProof) {
          return NextResponse.json(
            {
              success: false,
              error: "No se puede avanzar el pedido desde 'Por Ordenar Piezas (*un)': se requiere adjuntar al menos un comprobante de compra de repuestos (proveedor).",
            },
            { status: 400 }
          );
        }
      }

      // RULE 2: Can't advance without service payment proof in 'confirmar pago de servicio' state
      if (
        currentUpper === "CONFIRM_SERVICE_PAYMENT" &&
        targetUpper !== "CONFIRM_SERVICE_PAYMENT" &&
        targetUpper !== "CANCELLED"
      ) {
        const effectiveServiceProof = (body.servicePaymentProofUrl !== undefined ? body.servicePaymentProofUrl : existingOrder.servicePaymentProofUrl);
        if (!effectiveServiceProof || !String(effectiveServiceProof).trim()) {
          return NextResponse.json(
            {
              success: false,
              error: "No se puede avanzar el pedido desde 'Confirmar Pago de Servicio': se requiere adjuntar el comprobante de pago de servicio.",
            },
            { status: 400 }
          );
        }
      }

      // RULE 3: In any service that requires installation, installation payment is a requirement.
      // - Pickup service: installation payment goes after 'instalando piezas' (advancing past INSTALLATION_PAYMENT requires payment)
      // - Only installation: payment can be done during 'listo para retiro' or 'pago de instalacion', and 'pago de instalacion' goes after. If paid during 'listo para retiro' it can advance to COMPLETED, otherwise must pass through INSTALLATION_PAYMENT.
      // - In any service requiring installation, advancing to COMPLETED strictly requires confirmed installation payment.
      const isTargetRequiringInstallPayment =
        requiresInstall &&
        !skipInstallationPayment &&
        (
          targetUpper === "COMPLETED" ||
          targetUpper === "READY_TO_SET_RETURN_DATE" ||
          (currentUpper === "INSTALLATION_PAYMENT" && targetUpper !== "INSTALLATION_PAYMENT" && targetUpper !== "CANCELLED")
        );

      if (isTargetRequiringInstallPayment) {
        const effectiveInstallProof = (body.installationPaymentProofUrl !== undefined ? body.installationPaymentProofUrl : existingOrder.installationPaymentProofUrl);
        if (!effectiveInstallProof || !String(effectiveInstallProof).trim()) {
          return NextResponse.json(
            {
              success: false,
              error: "No se puede avanzar el pedido: se requiere adjuntar el comprobante de pago de instalación para este servicio.",
            },
            { status: 400 }
          );
        }

        if (!isInstPaymentConfirmed) {
          return NextResponse.json(
            {
              success: false,
              error:
                "No se puede avanzar el pedido: el pago de mano de obra de instalación debe ser confirmado por el staff.",
            },
            { status: 400 }
          );
        }
      }
      updateData.status = status;
    }
    if (partsStatus !== undefined) updateData.partsStatus = partsStatus;
    if (supplierNotes !== undefined) updateData.supplierNotes = supplierNotes;
    if (staffNotes !== undefined) updateData.staffNotes = staffNotes;
    if (itemsJson !== undefined) updateData.itemsJson = typeof itemsJson === "string" ? itemsJson : JSON.stringify(itemsJson);
    if (totalCRC !== undefined) updateData.totalCRC = Math.round(Number(totalCRC) || 0);
    if (partsSubtotalCRC !== undefined) updateData.partsSubtotalCRC = Math.round(Number(partsSubtotalCRC) || 0);
    if (laborSubtotalCRC !== undefined) updateData.laborSubtotalCRC = Math.round(Number(laborSubtotalCRC) || 0);
    if (customerName !== undefined) updateData.customerName = customerName;
    if (customerPhone !== undefined) updateData.customerPhone = customerPhone;
    if (guestEmail !== undefined) updateData.guestEmail = guestEmail;
    if (shippingAddress !== undefined) updateData.shippingAddress = shippingAddress;
    if (serviceType !== undefined) updateData.serviceType = serviceType;
    if (paidCurrency !== undefined) {
      updateData.paidCurrency = paidCurrency ? (String(paidCurrency).toUpperCase() === "USD" ? "USD" : "CRC") : null;
    }
    if (body.paymentProofUrl !== undefined) {
      updateData.paymentProofUrl = body.paymentProofUrl ? String(body.paymentProofUrl) : null;
    } else if (body.bacAuthorizationCode) {
      updateData.paymentProofUrl = `BAC_COMPRA_CLICK_AUTH: ${String(body.bacAuthorizationCode).trim()}`;
    }
    if (body.servicePaymentProofUrl !== undefined) {
      updateData.servicePaymentProofUrl = body.servicePaymentProofUrl ? String(body.servicePaymentProofUrl) : null;
    }
    if (body.installationPaymentProofUrl !== undefined) {
      updateData.installationPaymentProofUrl = body.installationPaymentProofUrl ? String(body.installationPaymentProofUrl) : null;
    }
    if (body.paymentRejectionReason !== undefined) {
      updateData.paymentRejectionReason = body.paymentRejectionReason ? String(body.paymentRejectionReason) : null;
    } else if (body.rejectionReason) {
      updateData.paymentRejectionReason = String(body.rejectionReason);
    } else if (status && status !== "PAYMENT_REJECTED" && existingOrder.paymentRejectionReason) {
      updateData.paymentRejectionReason = null;
    }

    if (installationCostCRC !== undefined) updateData.installationCostCRC = Math.round(Number(installationCostCRC) || 0);
    if (shippingCostCRC !== undefined) updateData.shippingCostCRC = Math.round(Number(shippingCostCRC) || 0);
    if (pickupCostCRC !== undefined) updateData.pickupCostCRC = Math.round(Number(pickupCostCRC) || 0);
    if (discountType !== undefined) updateData.discountType = discountType;
    if (discountValue !== undefined) {
      const numDisc = Math.round(Number(discountValue) || 0);
      updateData.discountValue = numDisc;

      // STRICT USER REQUIREMENT: Applying a discount requires Master password authorization with rate limiting
      if (numDisc > 0 && numDisc !== existingOrder.discountValue) {
        const forwarded = request.headers.get("x-forwarded-for");
        const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

        const elevation = await verifyMasterElevationPassword({
          ip,
          password: body.masterPassword,
          actorId: auth.session.userId,
          actorEmail: auth.session.email,
          actionDescription: `Autorización de descuento de ₡${numDisc} en pedido ${existingOrder.orderNumber}`,
        });

        if (!elevation.success) {
          return NextResponse.json(
            { success: false, error: elevation.error, retryAfterSeconds: elevation.retryAfterSeconds },
            { status: elevation.status }
          );
        }

        updateData.discountAppliedBy = auth.session.email;
      }
    }
    if (discountReason !== undefined) updateData.discountReason = discountReason;
    if (notes !== undefined) updateData.notes = notes;
    if (commentsJson !== undefined) updateData.commentsJson = typeof commentsJson === "string" ? commentsJson : JSON.stringify(commentsJson);

    if (body.serviceDocumentsJson !== undefined) {
      updateData.serviceDocumentsJson = typeof body.serviceDocumentsJson === "string" 
        ? body.serviceDocumentsJson 
        : JSON.stringify(body.serviceDocumentsJson);
    }
    if (body.confirmServicePayment === true) {
      let currentDocs: any = {};
      try {
        const baseDoc = updateData.serviceDocumentsJson || existingOrder.serviceDocumentsJson;
        currentDocs = typeof baseDoc === "string" ? JSON.parse(baseDoc) : (baseDoc || {});
      } catch {}
      currentDocs.servicePaymentConfirmed = true;
      currentDocs.servicePaymentConfirmedAt = new Date().toISOString();
      currentDocs.servicePaymentConfirmedBy = auth.session.email || auth.session.role;
      currentDocs.servicePaymentRejected = false;
      updateData.serviceDocumentsJson = JSON.stringify(currentDocs);
    }
    if (body.confirmInstallationPayment === true) {
      let currentDocs: any = {};
      try {
        const baseDoc = updateData.serviceDocumentsJson || existingOrder.serviceDocumentsJson;
        currentDocs = typeof baseDoc === "string" 
          ? JSON.parse(baseDoc) 
          : (baseDoc || {});
      } catch {}
      currentDocs.installationPaymentConfirmed = true;
      currentDocs.installationPaymentConfirmedAt = new Date().toISOString();
      currentDocs.installationPaymentConfirmedBy = auth.session.email || auth.session.role;
      currentDocs.installationPaymentRejected = false;
      updateData.serviceDocumentsJson = JSON.stringify(currentDocs);
    }
    if (body.rejectPaymentType === "SERVICE") {
      let currentDocs: any = {};
      try {
        const baseDoc = updateData.serviceDocumentsJson || existingOrder.serviceDocumentsJson;
        currentDocs = typeof baseDoc === "string" ? JSON.parse(baseDoc) : (baseDoc || {});
      } catch {}
      currentDocs.servicePaymentRejected = true;
      currentDocs.servicePaymentRejectedAt = new Date().toISOString();
      currentDocs.servicePaymentRejectedBy = auth.session.email || auth.session.role;
      currentDocs.servicePaymentRejectionReason = body.paymentRejectionReason || "";
      currentDocs.servicePaymentConfirmed = false;
      currentDocs.paymentCorrected = false;
      currentDocs.hasNewProofToReview = false;
      currentDocs.preRejectionStatus = existingOrder.status !== "PAYMENT_REJECTED" ? existingOrder.status : (currentDocs.preRejectionStatus || "CONFIRM_SERVICE_PAYMENT");
      currentDocs.rejectionPaymentType = "SERVICE";
      updateData.serviceDocumentsJson = JSON.stringify(currentDocs);
      updateData.status = "PAYMENT_REJECTED";
      if (body.paymentRejectionReason) {
        updateData.paymentRejectionReason = `[Servicio Rechazado]: ${body.paymentRejectionReason}`;
      }
    } else if (body.rejectPaymentType === "INSTALLATION") {
      let currentDocs: any = {};
      try {
        const baseDoc = updateData.serviceDocumentsJson || existingOrder.serviceDocumentsJson;
        currentDocs = typeof baseDoc === "string" ? JSON.parse(baseDoc) : (baseDoc || {});
      } catch {}
      currentDocs.installationPaymentRejected = true;
      currentDocs.installationPaymentRejectedAt = new Date().toISOString();
      currentDocs.installationPaymentRejectedBy = auth.session.email || auth.session.role;
      currentDocs.installationPaymentRejectionReason = body.paymentRejectionReason || "";
      currentDocs.installationPaymentConfirmed = false;
      currentDocs.paymentCorrected = false;
      currentDocs.hasNewProofToReview = false;
      currentDocs.preRejectionStatus = existingOrder.status !== "PAYMENT_REJECTED" ? existingOrder.status : (currentDocs.preRejectionStatus || "INSTALLATION_PAYMENT");
      currentDocs.rejectionPaymentType = "INSTALLATION";
      updateData.serviceDocumentsJson = JSON.stringify(currentDocs);
      updateData.status = "PAYMENT_REJECTED";
      if (body.paymentRejectionReason) {
        updateData.paymentRejectionReason = `[Instalación Rechazada]: ${body.paymentRejectionReason}`;
      }
    } else if (body.status === "PAYMENT_REJECTED" || body.rejectPaymentType === "ORDER") {
      let currentDocs: any = {};
      try {
        const baseDoc = updateData.serviceDocumentsJson || existingOrder.serviceDocumentsJson;
        currentDocs = typeof baseDoc === "string" ? JSON.parse(baseDoc) : (baseDoc || {});
      } catch {}
      currentDocs.orderPaymentRejected = true;
      currentDocs.orderPaymentRejectedAt = new Date().toISOString();
      currentDocs.orderPaymentRejectedBy = auth.session.email || auth.session.role;
      currentDocs.orderPaymentRejectionReason = body.paymentRejectionReason || "";
      currentDocs.paymentCorrected = false;
      currentDocs.hasNewProofToReview = false;
      if (!currentDocs.preRejectionStatus || existingOrder.status !== "PAYMENT_REJECTED") {
        currentDocs.preRejectionStatus = existingOrder.status !== "PAYMENT_REJECTED" ? existingOrder.status : (currentDocs.preRejectionStatus || "PAYMENT_CONFIRMATION");
      }
      currentDocs.rejectionPaymentType = "ORDER";
      updateData.serviceDocumentsJson = JSON.stringify(currentDocs);
      updateData.status = "PAYMENT_REJECTED";
    }

    if (status && status !== "PAYMENT_REJECTED" && existingOrder.status === "PAYMENT_REJECTED") {
      let currentDocs: any = {};
      try {
        const baseDoc = updateData.serviceDocumentsJson || existingOrder.serviceDocumentsJson;
        currentDocs = typeof baseDoc === "string" ? JSON.parse(baseDoc) : (baseDoc || {});
      } catch {}
      currentDocs.orderPaymentRejected = false;
      currentDocs.servicePaymentRejected = false;
      currentDocs.installationPaymentRejected = false;
      currentDocs.paymentCorrected = false;
      currentDocs.hasNewProofToReview = false;
      updateData.serviceDocumentsJson = JSON.stringify(currentDocs);
      updateData.paymentRejectionReason = null;
    }

    const prevStatusUpper = String(existingOrder.status || "").toUpperCase();
    const targetStatusUpper = status !== undefined ? String(status).toUpperCase() : prevStatusUpper;

    const isConfirmingOrderPayment =
      (prevStatusUpper === "PAYMENT_CONFIRMATION" &&
        targetStatusUpper !== "PAYMENT_CONFIRMATION" &&
        targetStatusUpper !== "PAYMENT_REJECTED" &&
        targetStatusUpper !== "CANCELLED") ||
      body.confirmOrderPayment === true;

    let shouldSendReceiptEmail = false;
    if (isConfirmingOrderPayment) {
      let currentDocs: any = {};
      try {
        const baseDoc = updateData.serviceDocumentsJson || existingOrder.serviceDocumentsJson;
        currentDocs = typeof baseDoc === "string" ? JSON.parse(baseDoc) : (baseDoc || {});
      } catch {}
      if (!currentDocs.receiptEmailSent) {
        currentDocs.receiptEmailSent = true;
        currentDocs.receiptEmailSentAt = new Date().toISOString();
        updateData.serviceDocumentsJson = JSON.stringify(currentDocs);
        shouldSendReceiptEmail = true;
      }
    }
    if (body.orderPartsCostCRC !== undefined) {
      let currentDocs: any = {};
      try {
        const baseDoc = updateData.serviceDocumentsJson || existingOrder.serviceDocumentsJson;
        currentDocs = typeof baseDoc === "string" ? JSON.parse(baseDoc) : (baseDoc || {});
      } catch {}
      currentDocs.orderPartsCostCRC = Math.max(0, Math.round(Number(body.orderPartsCostCRC) || 0));
      updateData.serviceDocumentsJson = JSON.stringify(currentDocs);
    }
    if (body.purchaseProofUrls !== undefined) {
      let currentDocs: any = {};
      try {
        const baseDoc = updateData.serviceDocumentsJson || existingOrder.serviceDocumentsJson;
        currentDocs = typeof baseDoc === "string" ? JSON.parse(baseDoc) : (baseDoc || {});
      } catch {}
      const urls = Array.isArray(body.purchaseProofUrls)
        ? body.purchaseProofUrls.filter((u: any) => typeof u === "string" && u.trim().length > 0)
        : [];
      currentDocs.purchaseProofUrls = urls;
      currentDocs.purchaseProofsCount = urls.length;
      currentDocs.purchaseProofsUpdatedAt = new Date().toISOString();
      currentDocs.purchaseProofsUpdatedBy = auth.session.email || auth.session.role;
      updateData.serviceDocumentsJson = JSON.stringify(currentDocs);
    }
    if (body.addPurchaseProofUrl) {
      let currentDocs: any = {};
      try {
        const baseDoc = updateData.serviceDocumentsJson || existingOrder.serviceDocumentsJson;
        currentDocs = typeof baseDoc === "string" ? JSON.parse(baseDoc) : (baseDoc || {});
      } catch {}
      const existingUrls: string[] = Array.isArray(currentDocs.purchaseProofUrls) ? [...currentDocs.purchaseProofUrls] : [];
      if (!existingUrls.includes(body.addPurchaseProofUrl)) {
        existingUrls.push(body.addPurchaseProofUrl);
      }
      currentDocs.purchaseProofUrls = existingUrls;
      currentDocs.purchaseProofsCount = existingUrls.length;
      currentDocs.purchaseProofsUpdatedAt = new Date().toISOString();
      currentDocs.purchaseProofsUpdatedBy = auth.session.email || auth.session.role;
      updateData.serviceDocumentsJson = JSON.stringify(currentDocs);
    }
    if (body.removePurchaseProofUrl) {
      let currentDocs: any = {};
      try {
        const baseDoc = updateData.serviceDocumentsJson || existingOrder.serviceDocumentsJson;
        currentDocs = typeof baseDoc === "string" ? JSON.parse(baseDoc) : (baseDoc || {});
      } catch {}
      const existingUrls: string[] = Array.isArray(currentDocs.purchaseProofUrls) ? currentDocs.purchaseProofUrls : [];
      currentDocs.purchaseProofUrls = existingUrls.filter((u: string) => u !== body.removePurchaseProofUrl);
      currentDocs.purchaseProofsCount = currentDocs.purchaseProofUrls.length;
      currentDocs.purchaseProofsUpdatedAt = new Date().toISOString();
      currentDocs.purchaseProofsUpdatedBy = auth.session.email || auth.session.role;
      updateData.serviceDocumentsJson = JSON.stringify(currentDocs);
    }
    if (body.isCertified !== undefined) {
      updateData.isCertified = Boolean(body.isCertified);
    }
    if (body.zxzCertificationJson !== undefined) {
      updateData.zxzCertificationJson = typeof body.zxzCertificationJson === "string"
        ? body.zxzCertificationJson
        : JSON.stringify(body.zxzCertificationJson);
    }

    // AUTOMATIC ZXZ CERTIFICATION PRODUCT:
    // Timing rule: attached only strictly AFTER the state 'en taller para revision' (IN_WAREHOUSE_CHECK)
    const stagesAfterWarehouseCheck = [
      "PROGRAM_SERVICE",
      "CONFIRM_SERVICE_PAYMENT",
      "WAITING_ON_DELIVERY",
      "PICKUP_DATE_SET",
      "HOME_INSTALL_SET",
      "INSTALLING",
      "INSTALLATION_PAYMENT",
      "READY_TO_SET_RETURN_DATE",
      "READY_FOR_PICKUP",
      "READY_TO_PICK_UP",
      "COMPLETED"
    ];

    const isTargetAfterWarehouseCheck = status && stagesAfterWarehouseCheck.includes(String(status).toUpperCase());
    const shouldAutoAttachCert = (!existingOrder.isCertified || !existingOrder.zxzCertificationJson) && (isTargetAfterWarehouseCheck || body.attachCertification === true);

    if (shouldAutoAttachCert) {
      let itemsList: any[] = [];
      try {
        const raw = existingOrder.itemsJson || itemsJson;
        itemsList = typeof raw === "string" ? JSON.parse(raw) : (raw || []);
      } catch {}

      const certNumber = `ZXZ-CERT-${existingOrder.orderNumber.replace(/[^A-Za-z0-9]/g, "")}`;
      const certData = {
        certificationNumber: certNumber,
        certifiedAt: new Date().toISOString(),
        certifiedBy: auth.session.email || "Staff Técnico ZxZ Mods",
        inspectorRole: auth.session.role,
        status: "VERIFIED_OK",
        warehouseLocation: "Taller & Bodega Central ZxZ Mods, Alajuela, Costa Rica",
        inspectionSummary: "Mercadería recibida de importación e inspeccionada en bodega técnica. Se verificó la integridad física de los componentes, sellos de fábrica, códigos de parte y accesorios de montaje. Certificado de conformidad aprobado sin defectos.",
        itemsVerified: Array.isArray(itemsList) ? itemsList.map((it: any) => ({
          name: it.title || it.name || "Pieza / Componente ZxZ",
          sku: it.sku || "N/A",
          quantity: it.quantity || 1,
          condition: "EXCELLENT_NEW",
          sealed: true,
          verified: true,
        })) : [],
      };

      updateData.isCertified = true;
      updateData.zxzCertificationJson = JSON.stringify(certData);
    }

    updateData.updatedAt = new Date();

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
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
      action: "UPDATE_ORDER_STATUS",
      entityType: "ORDER",
      entityId: orderId,
      oldData: {
        status: existingOrder.status,
        totalCRC: existingOrder.totalCRC,
        notes: existingOrder.notes,
      },
      newData: {
        status: updatedOrder.status,
        totalCRC: updatedOrder.totalCRC,
        notes: updatedOrder.notes,
      },
      details: `Order #${existingOrder.orderNumber} updated by ${auth.session.role} ${auth.session.email}`,
    });

    if (
      body.confirmServicePayment === true ||
      (existingOrder.status === "CONFIRM_SERVICE_PAYMENT" && status && status !== "CONFIRM_SERVICE_PAYMENT")
    ) {
      await prisma.serviceSchedule.updateMany({
        where: {
          OR: [{ orderId: existingOrder.id }, { orderId: existingOrder.orderNumber }],
        },
        data: {
          paymentStatus: "PAID",
        },
      });
    }

    let userVehicle: any = null;
    if (updatedOrder.userId) {
      userVehicle =
        (await prisma.garageVehicle.findFirst({
          where: { userId: updatedOrder.userId, isActive: true },
        })) ||
        (await prisma.garageVehicle.findFirst({
          where: { userId: updatedOrder.userId },
        }));
    }

    const currentSchedule = await prisma.serviceSchedule.findFirst({
      where: {
        OR: [{ orderId: updatedOrder.id }, { orderId: updatedOrder.orderNumber }],
        status: { not: "CANCELLED" },
      },
      orderBy: { createdAt: "desc" },
    });

    let isInstallationPaymentConfirmed = false;
    let purchaseProofUrls: string[] = [];
    const finalDocJson = updateData.serviceDocumentsJson || updatedOrder.serviceDocumentsJson;
    if (finalDocJson) {
      try {
        const parsed = typeof finalDocJson === "string" ? JSON.parse(finalDocJson) : finalDocJson;
        if (parsed?.installationPaymentConfirmed) {
          isInstallationPaymentConfirmed = true;
        }
        if (Array.isArray(parsed?.purchaseProofUrls)) {
          purchaseProofUrls = parsed.purchaseProofUrls;
        }
      } catch {}
    }

    // Automatically re-sync monthly financial closure for the order's month/year
    const orderMonth = updatedOrder.createdAt.getUTCMonth() + 1;
    const orderYear = updatedOrder.createdAt.getUTCFullYear();
    await syncMonthlyClosure(orderMonth, orderYear).catch((err) => {
      console.error("[SYS_ORDER_UPDATE_SYNC_CLOSURE_ERROR]:", err);
    });

    // -------------------------------------------------------------
    // AUTOMATIC ORDER STEP NOTIFICATIONS & CONFIRMATION RECEIPT
    // -------------------------------------------------------------
    const newStatusUpper = String(updatedOrder.status || "").toUpperCase();
    const orderLang = resolveOrderLanguage(updatedOrder);

    // 1. Primary order payment confirmed -> Send receipt + confirmation email
    if (isConfirmingOrderPayment) {
      void resolveProfileEmail(updatedOrder).then((profileEmail) => {
        if (profileEmail) {
          void sendOrderReceiptEmail({
            to: profileEmail,
            order: updatedOrder,
            lang: orderLang,
            receiptType: "ORDER",
          }).catch((err) => console.error("[CONFIRMATION_RECEIPT_EMAIL_ERR]:", err));
        }
      });
      void sendOrderStepNotificationEmail({
        step: "ORDER_PAYMENT_CONFIRMED",
        order: updatedOrder,
        lang: orderLang,
      }).catch((err) => console.error("[STEP_EMAIL_ORDER_PAY_CONFIRM_ERR]:", err));
    }

    // 2. Service payment confirmed -> Send service payment receipt + step email
    const isConfirmingServicePayment =
      body.confirmServicePayment === true ||
      (prevStatusUpper === "CONFIRM_SERVICE_PAYMENT" &&
        newStatusUpper !== "CONFIRM_SERVICE_PAYMENT" &&
        newStatusUpper !== "PAYMENT_REJECTED" &&
        newStatusUpper !== "CANCELLED");

    if (isConfirmingServicePayment && !isConfirmingOrderPayment) {
      void resolveProfileEmail(updatedOrder).then((profileEmail) => {
        if (profileEmail) {
          void sendOrderReceiptEmail({
            to: profileEmail,
            order: updatedOrder,
            lang: orderLang,
            receiptType: "SERVICE",
          }).catch((err) => console.error("[CONFIRMATION_SRV_RECEIPT_ERR]:", err));
        }
      });
      void sendOrderStepNotificationEmail({
        step: "SERVICE_PAYMENT_CONFIRMED",
        order: updatedOrder,
        lang: orderLang,
      }).catch((err) => console.error("[STEP_EMAIL_SRV_PAY_CONFIRM_ERR]:", err));
    }

    // 3. Installation payment confirmed -> Send installation payment receipt + step email
    const isConfirmingInstallationPayment =
      body.confirmInstallationPayment === true ||
      (prevStatusUpper === "INSTALLATION_PAYMENT" &&
        newStatusUpper !== "INSTALLATION_PAYMENT" &&
        newStatusUpper !== "PAYMENT_REJECTED" &&
        newStatusUpper !== "CANCELLED");

    if (isConfirmingInstallationPayment && !isConfirmingOrderPayment) {
      void resolveProfileEmail(updatedOrder).then((profileEmail) => {
        if (profileEmail) {
          void sendOrderReceiptEmail({
            to: profileEmail,
            order: updatedOrder,
            lang: orderLang,
            receiptType: "INSTALLATION",
          }).catch((err) => console.error("[CONFIRMATION_INST_RECEIPT_ERR]:", err));
        }
      });
      void sendOrderStepNotificationEmail({
        step: "INSTALLATION_PAYMENT_CONFIRMED",
        order: updatedOrder,
        lang: orderLang,
      }).catch((err) => console.error("[STEP_EMAIL_INST_PAY_CONFIRM_ERR]:", err));
    }

    // 4. Payment rejected (every payment rejected)
    if (newStatusUpper === "PAYMENT_REJECTED" && (prevStatusUpper !== "PAYMENT_REJECTED" || Boolean(body.rejectPaymentType))) {
      let rejType: "ORDER" | "SERVICE" | "INSTALLATION" = "ORDER";
      if (body.rejectPaymentType === "SERVICE") rejType = "SERVICE";
      else if (body.rejectPaymentType === "INSTALLATION") rejType = "INSTALLATION";
      else {
        try {
          const doc = typeof updatedOrder.serviceDocumentsJson === "string" ? JSON.parse(updatedOrder.serviceDocumentsJson) : updatedOrder.serviceDocumentsJson;
          if (doc?.rejectionPaymentType) rejType = doc.rejectionPaymentType;
        } catch {}
      }

      void sendOrderStepNotificationEmail({
        step: "PAYMENT_REJECTED",
        order: updatedOrder,
        lang: orderLang,
        rejectionReason: body.paymentRejectionReason,
        rejectionType: rejType,
      }).catch((err) => console.error("[STEP_EMAIL_REJECT_ERR]:", err));
    }

    // 5. Program service
    if (newStatusUpper === "PROGRAM_SERVICE" && prevStatusUpper !== "PROGRAM_SERVICE") {
      void sendOrderStepNotificationEmail({
        step: "PROGRAM_SERVICE",
        order: updatedOrder,
        lang: orderLang,
      }).catch((err) => console.error("[STEP_EMAIL_PROGRAM_SRV_ERR]:", err));
    }

    // 6. Ready for pick-up
    if (
      (newStatusUpper === "READY_FOR_PICKUP" || newStatusUpper === "READY_TO_PICK_UP") &&
      prevStatusUpper !== "READY_FOR_PICKUP" &&
      prevStatusUpper !== "READY_TO_PICK_UP"
    ) {
      void sendOrderStepNotificationEmail({
        step: "READY_FOR_PICKUP",
        order: updatedOrder,
        lang: orderLang,
      }).catch((err) => console.error("[STEP_EMAIL_READY_PICKUP_ERR]:", err));
    }

    // 7. Pick up date set
    if (newStatusUpper === "PICK_UP_DATE_SET" && prevStatusUpper !== "PICK_UP_DATE_SET") {
      void sendOrderStepNotificationEmail({
        step: "PICK_UP_DATE_SET",
        order: updatedOrder,
        lang: orderLang,
        pickupDate: currentSchedule?.date,
        pickupTime: currentSchedule?.time,
        pickupAddress: currentSchedule?.destinationAddress || updatedOrder.shippingAddress,
      }).catch((err) => console.error("[STEP_EMAIL_PICKUP_DATE_SET_ERR]:", err));
    }

    // 8. Completed (optional redirect link to review zxz mods in google maps)
    if (newStatusUpper === "COMPLETED" && prevStatusUpper !== "COMPLETED") {
      void sendOrderStepNotificationEmail({
        step: "COMPLETED",
        order: updatedOrder,
        lang: orderLang,
        mapsReviewUrl: COMPANY_CONFIG.location.googleMapsUrl || "https://maps.app.goo.gl/CT6yAuDJ7m1sCP5g6",
      }).catch((err) => console.error("[STEP_EMAIL_COMPLETED_ERR]:", err));
    }

    // 9. Installation payment stage reached
    if (newStatusUpper === "INSTALLATION_PAYMENT" && prevStatusUpper !== "INSTALLATION_PAYMENT") {
      void sendOrderStepNotificationEmail({
        step: "INSTALLATION_PAYMENT",
        order: updatedOrder,
        lang: orderLang,
      }).catch((err) => console.error("[STEP_EMAIL_INST_PAYMENT_STAGE_ERR]:", err));
    }

    return NextResponse.json({
      success: true,
      order: {
        ...updatedOrder,
        garageVehicle: userVehicle,
        serviceSchedule: currentSchedule,
        isInstallationPaymentConfirmed,
        purchaseProofUrls,
      },
    });
  } catch (error) {
    console.error("[SYS_ORDER_UPDATE_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const orderId = params.id;
    const body = await request.json().catch(() => ({}));
    const { masterPassword } = body;

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ success: false, error: "Pedido no encontrado" }, { status: 404 });
    }

    // If order is beyond "COTIZACION", deletion STRICTLY requires Master password verification with brute-force defense
    const isQuotation = existingOrder.status === "COTIZACION" || existingOrder.status === "cotizacion";
    if (!isQuotation) {
      const forwarded = request.headers.get("x-forwarded-for");
      const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

      const elevation = await verifyMasterElevationPassword({
        ip,
        password: masterPassword,
        actorId: auth.session.userId,
        actorEmail: auth.session.email,
        actionDescription: `Eliminación de pedido confirmado ${existingOrder.orderNumber}`,
      });

      if (!elevation.success) {
        return NextResponse.json(
          {
            success: false,
            error: elevation.error,
            requiresMasterPassword: true,
            retryAfterSeconds: elevation.retryAfterSeconds,
          },
          { status: elevation.status }
        );
      }
    }

    const orderMonth = existingOrder.createdAt.getUTCMonth() + 1;
    const orderYear = existingOrder.createdAt.getUTCFullYear();

    // Delete linked transactions if any exist
    await prisma.transaction.deleteMany({
      where: { orderId },
    }).catch(() => {});

    // Delete linked service schedules if any exist
    await prisma.serviceSchedule.deleteMany({
      where: { orderId },
    }).catch(() => {});

    // Delete order
    await prisma.order.delete({
      where: { id: orderId },
    });

    // Record audit log
    await recordAuditLog({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: "DELETE_ORDER",
      entityType: "ORDER",
      entityId: orderId,
      oldData: {
        orderNumber: existingOrder.orderNumber,
        status: existingOrder.status,
        totalCRC: existingOrder.totalCRC,
      },
      details: `Order #${existingOrder.orderNumber} (status: ${existingOrder.status}) permanently deleted by ${auth.session.role} ${auth.session.email}`,
    });

    // Automatically re-sync monthly financial closure for the deleted order's month/year
    await syncMonthlyClosure(orderMonth, orderYear).catch((err) => {
      console.error("[SYS_ORDER_DELETE_SYNC_CLOSURE_ERROR]:", err);
    });

    return NextResponse.json({
      success: true,
      message: `Pedido #${existingOrder.orderNumber} eliminado correctamente.`,
    });
  } catch (error) {
    console.error("[SYS_ORDER_DELETE_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error del servidor al eliminar el pedido" },
      { status: 500 }
    );
  }
}
