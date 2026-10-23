import { type Transporter } from "nodemailer";
import { prisma } from "@/lib/prisma";
import { COMPANY_CONFIG } from "@/config/company";
import { formatCRC, formatUSD, convertCRCToUSD } from "@/lib/i18n";
import { getServiceTypeLabel } from "@/lib/orderReceipt";
import { getTransporter, checkDailyLimit, incrementDailyCount, sendEmailSafely } from "@/lib/email";

export type OrderNotificationStep =
  | "ORDER_PAYMENT_CONFIRMED"
  | "SERVICE_PAYMENT_CONFIRMED"
  | "INSTALLATION_PAYMENT_CONFIRMED"
  | "PAYMENT_REJECTED"
  | "PROGRAM_SERVICE"
  | "READY_FOR_PICKUP"
  | "PICK_UP_DATE_SET"
  | "COMPLETED"
  | "INSTALLATION_PAYMENT";

export interface SendOrderStepNotificationParams {
  order: any;
  step: OrderNotificationStep;
  to?: string | null;
  lang?: "es" | "en";
  rejectionReason?: string | null;
  rejectionType?: "ORDER" | "SERVICE" | "INSTALLATION";
  pickupDate?: string | null;
  pickupTime?: string | null;
  pickupAddress?: string | null;
  mapsReviewUrl?: string;
}

/**
 * Resolves the primary profile email of the user/customer who placed the order.
 */
export async function resolveProfileEmail(order: any): Promise<string | null> {
  if (!order) return null;

  // 1. Check user relation if already populated
  if (order.user?.email && typeof order.user.email === "string" && order.user.email.includes("@")) {
    return order.user.email.trim();
  }

  // 2. Check guestEmail
  if (order.guestEmail && typeof order.guestEmail === "string" && order.guestEmail.includes("@")) {
    return order.guestEmail.trim();
  }

  // 3. Check customerEmail
  if (order.customerEmail && typeof order.customerEmail === "string" && order.customerEmail.includes("@")) {
    return order.customerEmail.trim();
  }

  // 4. Query user from database via userId
  if (order.userId) {
    try {
      const u = await prisma.user.findUnique({
        where: { id: order.userId },
        select: { email: true },
      });
      if (u?.email && u.email.includes("@")) {
        return u.email.trim();
      }
    } catch (err) {
      console.warn("[RESOLVE_PROFILE_EMAIL_ERR]:", err);
    }
  }

  return null;
}

/**
 * Resolves order language, falling back to Spanish as main system language.
 */
export function resolveOrderLanguage(order: any, explicitLang?: "es" | "en"): "es" | "en" {
  if (explicitLang === "en" || explicitLang === "es") {
    return explicitLang;
  }
  if (order?.serviceDocumentsJson) {
    try {
      const docs =
        typeof order.serviceDocumentsJson === "string"
          ? JSON.parse(order.serviceDocumentsJson)
          : order.serviceDocumentsJson;
      if (docs?.language === "en" || docs?.lang === "en") return "en";
    } catch {}
  }
  return "es";
}

/**
 * Generates the responsive HTML email template for an order step notification.
 */
export function generateOrderStepEmailHtml(params: {
  order: any;
  step: OrderNotificationStep;
  lang: "es" | "en";
  rejectionReason?: string | null;
  rejectionType?: "ORDER" | "SERVICE" | "INSTALLATION";
  pickupDate?: string | null;
  pickupTime?: string | null;
  pickupAddress?: string | null;
  mapsReviewUrl?: string;
}): { subject: string; html: string } {
  const {
    order,
    step,
    lang,
    rejectionReason,
    rejectionType = "ORDER",
    pickupDate,
    pickupTime,
    pickupAddress,
    mapsReviewUrl = COMPANY_CONFIG.location.googleMapsUrl || "https://maps.app.goo.gl/CT6yAuDJ7m1sCP5g6",
  } = params;

  const isEs = lang === "es";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://zxzmods.com";
  const orderUrl = `${baseUrl}/pedidos/${order.id || order.orderNumber}`;
  const payInstallUrl = `${baseUrl}/pedidos/${order.id || order.orderNumber}/pagar-instalacion`;
  const scheduleServiceUrl = `${baseUrl}/pedidos/${order.id || order.orderNumber}/programar-servicio`;

  const customerName =
    order.customerName ||
    order.user?.displayName ||
    (isEs ? "Cliente Estimado" : "Valued Customer");

  // Extract vehicle if stored in service documents
  let vehicleStr = "";
  let docs: any = {};
  if (order.serviceDocumentsJson) {
    try {
      docs =
        typeof order.serviceDocumentsJson === "string"
          ? JSON.parse(order.serviceDocumentsJson)
          : order.serviceDocumentsJson;
      if (docs?.vehicle) {
        vehicleStr = `${docs.vehicle.make || ""} ${docs.vehicle.model || ""} ${docs.vehicle.year || ""}`.trim();
      }
    } catch {}
  }

  const deliveryMode = getServiceTypeLabel(order.serviceType, lang);

  // Configure step details: subject, badge, title, description, accent colors
  let subject = "";
  let badgeText = "";
  let badgeBg = "#ecfdf5";
  let badgeColor = "#065f46";
  let badgeBorder = "#a7f3d0";
  let headline = "";
  let message = "";
  let actionBtnText = isEs ? "Ver Estado de Mi Pedido" : "View My Order Status";
  let actionBtnUrl = orderUrl;
  let customSectionHtml = "";

  switch (step) {
    case "ORDER_PAYMENT_CONFIRMED":
      subject = isEs
        ? `Pago Confirmado - Pedido #${order.orderNumber} • ZxZ Mods`
        : `Payment Confirmed - Order #${order.orderNumber} • ZxZ Mods`;
      badgeText = isEs ? "● PAGO CONFIRMADO" : "● PAYMENT CONFIRMED";
      badgeBg = "#ecfdf5";
      badgeColor = "#065f46";
      badgeBorder = "#6ee7b7";
      headline = isEs ? "¡Tu Pago ha sido Confirmado!" : "Your Payment has been Confirmed!";
      message = isEs
        ? `El equipo técnico y administrativo de ZxZ Mods ha verificado exitosamente tu comprobante de pago para el pedido <strong>#${order.orderNumber}</strong>. Hemos comenzado la preparación y gestión de tus piezas en taller.`
        : `The ZxZ Mods technical and administrative team has successfully verified your payment receipt for order <strong>#${order.orderNumber}</strong>. We have started preparing and procuring your parts.`;
      customSectionHtml = `
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:16px 20px; margin:20px 0; text-align:left;">
          <div style="font-weight:700; color:#166534; font-size:13px; margin-bottom:4px;">
            ${isEs ? "✓ Comprobante Oficial Generado" : "✓ Official Receipt Generated"}
          </div>
          <div style="font-size:12px; color:#15803d; line-height:1.5;">
            ${isEs 
              ? "Tu comprobante oficial de compra ha sido emitido y enviado a tu correo. También puedes descargarlo en cualquier momento desde tu panel de pedidos." 
              : "Your official purchase receipt has been issued and sent to your email. You can also download it at any time from your orders panel."}
          </div>
        </div>
      `;
      break;

    case "SERVICE_PAYMENT_CONFIRMED":
      subject = isEs
        ? `Pago de Servicio Confirmado - Pedido #${order.orderNumber} • ZxZ Mods`
        : `Service Payment Confirmed - Order #${order.orderNumber} • ZxZ Mods`;
      badgeText = isEs ? "● PAGO DE SERVICIO CONFIRMADO" : "● SERVICE PAYMENT CONFIRMED";
      badgeBg = "#ecfdf5";
      badgeColor = "#065f46";
      badgeBorder = "#6ee7b7";
      headline = isEs ? "Pago de Servicio Validado Exitosamente" : "Service Payment Successfully Verified";
      message = isEs
        ? `Hemos confirmado el pago de tu servicio de transporte y logística para el pedido <strong>#${order.orderNumber}</strong>. Continuamos con el cronograma técnico de tu vehículo.`
        : `We have confirmed your transport and logistics service payment for order <strong>#${order.orderNumber}</strong>. We are continuing with the technical schedule for your vehicle.`;
      break;

    case "INSTALLATION_PAYMENT_CONFIRMED":
      subject = isEs
        ? `Pago de Instalación Confirmado - Pedido #${order.orderNumber} • ZxZ Mods`
        : `Installation Payment Confirmed - Order #${order.orderNumber} • ZxZ Mods`;
      badgeText = isEs ? "● PAGO DE INSTALACIÓN CONFIRMADO" : "● INSTALLATION PAYMENT CONFIRMED";
      badgeBg = "#ecfdf5";
      badgeColor = "#065f46";
      badgeBorder = "#6ee7b7";
      headline = isEs ? "Mano de Obra e Instalación Confirmada" : "Labor & Installation Payment Confirmed";
      message = isEs
        ? `El pago de mano de obra e instalación para el pedido <strong>#${order.orderNumber}</strong> ha sido verificado y aprobado. Los componentes han quedado montados e inspeccionados con la máxima rigurosidad técnica.`
        : `The labor and installation payment for order <strong>#${order.orderNumber}</strong> has been verified and approved. All components have been installed and inspected to the highest technical standards.`;
      break;

    case "PAYMENT_REJECTED":
      const rejLabel =
        rejectionType === "SERVICE"
          ? isEs ? "Pago de Servicio" : "Service Payment"
          : rejectionType === "INSTALLATION"
          ? isEs ? "Pago de Instalación" : "Installation Payment"
          : isEs ? "Pago de la Orden" : "Order Payment";

      subject = isEs
        ? `Atención: Comprobante de Pago Rechazado - Pedido #${order.orderNumber}`
        : `Action Required: Payment Receipt Rejected - Order #${order.orderNumber}`;
      badgeText = isEs ? "● ACCIÓN REQUERIDA: PAGO RECHAZADO" : "● ACTION REQUIRED: PAYMENT REJECTED";
      badgeBg = "#fff1f2";
      badgeColor = "#9f1239";
      badgeBorder = "#fecdd3";
      headline = isEs ? "Tu Comprobante no Pudo ser Validado" : "Your Payment Receipt Could Not be Validated";
      message = isEs
        ? `Revisamos el comprobante de <strong>${rejLabel}</strong> adjunto a tu pedido <strong>#${order.orderNumber}</strong>, pero no fue posible validar los fondos bancarios correspondientes.`
        : `We reviewed the <strong>${rejLabel}</strong> receipt attached to your order <strong>#${order.orderNumber}</strong>, but we were unable to validate the wire transfer funds.`;
      
      const reasonText =
        rejectionReason ||
        (isEs
          ? "El comprobante no es legible o el número de referencia no coincide con los registros bancarios."
          : "The receipt was unreadable or the reference number did not match bank records.");

      customSectionHtml = `
        <div style="background:#fff1f2; border:2px dashed #f43f5e; border-radius:12px; padding:18px 20px; margin:22px 0; text-align:left;">
          <div style="font-size:11px; font-weight:800; color:#9f1239; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px;">
            ${isEs ? "Motivo indicado por el taller:" : "Reason noted by workshop:"}
          </div>
          <div style="font-size:13px; font-weight:600; color:#881337; line-height:1.5;">
            ${reasonText}
          </div>
          <div style="margin-top:10px; font-size:11px; color:#9f1239;">
            ${isEs 
              ? "Por favor realiza el pago nuevamente o adjunta un comprobante bancario claro y legible para continuar con tu pedido." 
              : "Please resubmit payment or attach a clear, valid wire receipt to proceed with your order."}
          </div>
        </div>
      `;
      actionBtnText = isEs ? "Corregir y Subir Nuevo Comprobante" : "Correct and Re-upload Receipt";
      actionBtnUrl = orderUrl;
      break;

    case "PROGRAM_SERVICE":
      subject = isEs
        ? `Servicio Listo para Programar - Pedido #${order.orderNumber} • ZxZ Mods`
        : `Ready to Schedule Service - Order #${order.orderNumber} • ZxZ Mods`;
      badgeText = isEs ? "● SERVICIO LISTO PARA PROGRAMAR" : "● READY TO SCHEDULE SERVICE";
      badgeBg = "#eef2ff";
      badgeColor = "#3730a3";
      badgeBorder = "#c7d2fe";
      headline = isEs ? "Tus Piezas están Listas: Elige tu Cita" : "Your Parts are Ready: Schedule Your Slot";
      message = isEs
        ? `Tus componentes para el pedido <strong>#${order.orderNumber}</strong> han superado la inspección técnica de calidad en bodega. Ya puedes ingresar al sistema para coordinar la fecha y hora de tu instalación o entrega de vehículo.`
        : `Your components for order <strong>#${order.orderNumber}</strong> have passed our warehouse quality inspection. You may now log in to coordinate the date and time for your installation or vehicle handoff.`;
      actionBtnText = isEs ? "Programar Fecha de Servicio" : "Schedule Service Date";
      actionBtnUrl = scheduleServiceUrl;
      break;

    case "READY_FOR_PICKUP":
      subject = isEs
        ? `¡Tu Pedido / Vehículo está Listo para Retiro! - #${order.orderNumber} • ZxZ Mods`
        : `Your Order / Vehicle is Ready for Pick-up! - #${order.orderNumber} • ZxZ Mods`;
      badgeText = isEs ? "● LISTO PARA RETIRO EN TALLER" : "● READY FOR PICK-UP AT WORKSHOP";
      badgeBg = "#ecfdf5";
      badgeColor = "#065f46";
      badgeBorder = "#6ee7b7";
      headline = isEs ? "Tu Vehículo / Piezas Listas para Retiro" : "Your Vehicle / Parts are Ready for Pick-up";
      message = isEs
        ? `Todo el trabajo técnico para el pedido <strong>#${order.orderNumber}</strong> ha finalizado con éxito. Tu vehículo o repuestos ya están listos para retiro en nuestro Taller Central ZxZ Mods.`
        : `All technical work for order <strong>#${order.orderNumber}</strong> has completed successfully. Your vehicle or parts are now ready for pick-up at our Central Workshop ZxZ Mods.`;
      
      customSectionHtml = `
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:18px 20px; margin:22px 0; text-align:left;">
          <div style="font-size:12px; font-weight:800; color:#0f172a; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">
            📍 ${isEs ? "Ubicación del Taller ZxZ Mods:" : "ZxZ Mods Workshop Location:"}
          </div>
          <div style="font-size:13px; font-weight:600; color:#334155; line-height:1.5;">
            ${COMPANY_CONFIG.location.address}
          </div>
          <div style="font-size:12px; color:#64748b; margin-top:6px;">
            🕒 <strong>${isEs ? "Horario de Atención:" : "Business Hours:"}</strong> ${COMPANY_CONFIG.hours.es}
          </div>
          <div style="font-size:12px; color:#64748b; margin-top:4px;">
            📞 <strong>${isEs ? "Teléfono de Taller:" : "Workshop Phone:"}</strong> ${COMPANY_CONFIG.contact.phone}
          </div>
          <div style="margin-top:12px;">
            <a href="${mapsReviewUrl}" target="_blank" style="display:inline-block; font-size:12px; font-weight:700; color:#0052CC; text-decoration:none;">
              ➔ ${isEs ? "Abrir en Google Maps" : "Open in Google Maps"}
            </a>
          </div>
        </div>
      `;
      break;

    case "PICK_UP_DATE_SET":
      subject = isEs
        ? `Fecha de Recolección Programada - Pedido #${order.orderNumber} • ZxZ Mods`
        : `Pick-up Date Confirmed - Order #${order.orderNumber} • ZxZ Mods`;
      badgeText = isEs ? "● FECHA DE RECOLECCIÓN PROGRAMADA" : "● PICK-UP DATE CONFIRMED";
      badgeBg = "#ecfeff";
      badgeColor = "#155e75";
      badgeBorder = "#a5f3fc";
      headline = isEs ? "Cita de Recolección Confirmada" : "Pick-up Appointment Confirmed";
      message = isEs
        ? `Hemos coordinado exitosamente la recolección de tu vehículo para el pedido <strong>#${order.orderNumber}</strong>. Nuestro equipo de transporte especializado se pondrá en contacto contigo previo a la llegada.`
        : `We have successfully coordinated the vehicle pick-up date for order <strong>#${order.orderNumber}</strong>. Our specialized transport crew will contact you prior to arrival.`;

      const pDate = pickupDate || docs?.pickupDate || docs?.scheduledDate || (isEs ? "Fecha coordinada en sistema" : "Scheduled in system");
      const pTime = pickupTime || docs?.pickupTime || docs?.timeSlot || "8:00 AM - 12:00 MD";
      const pAddress = pickupAddress || order.shippingAddress || docs?.pickupOriginAddress || (isEs ? "Dirección registrada" : "Registered address");

      customSectionHtml = `
        <div style="background:#f0fdfa; border:1px solid #99f6e4; border-radius:12px; padding:18px 20px; margin:22px 0; text-align:left;">
          <div style="font-size:12px; font-weight:800; color:#115e59; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px;">
            🚛 ${isEs ? "Detalles del Transporte ZxZ:" : "ZxZ Transport Details:"}
          </div>
          <div style="font-size:13px; color:#134e4a; line-height:1.6;">
            <strong>${isEs ? "Fecha:" : "Date:"}</strong> ${pDate}<br>
            <strong>${isEs ? "Horario Estimado:" : "Estimated Window:"}</strong> ${pTime}<br>
            <strong>${isEs ? "Punto de Recolección:" : "Pick-up Address:"}</strong> ${pAddress}
          </div>
        </div>
      `;
      break;

    case "COMPLETED":
      subject = isEs
        ? `¡Pedido Completado y Entregado! - #${order.orderNumber} • ZxZ Mods`
        : `Order Completed & Delivered! - #${order.orderNumber} • ZxZ Mods`;
      badgeText = isEs ? "★ PEDIDO COMPLETADO Y ENTREGADO" : "★ ORDER COMPLETED & DELIVERED";
      badgeBg = "#fefce8";
      badgeColor = "#854d0e";
      badgeBorder = "#fde047";
      headline = isEs ? "¡Gracias por Confiar en ZxZ Mods!" : "Thank You for Trusting ZxZ Mods!";
      message = isEs
        ? `Tu pedido <strong>#${order.orderNumber}</strong> ha sido completado y entregado satisfactoriamente. Ha sido un honor trabajar en tu máquina. Esperamos que disfrutes al máximo cada ruta, duna y recorrido con tus nuevas mejoras de rendimiento.`
        : `Your order <strong>#${order.orderNumber}</strong> has been successfully completed and delivered. It has been a true pleasure working on your machine. We hope you enjoy every trail, dune, and ride with your new performance upgrades.`;

      // Requirement: "Completed (optional redirect link to review zxz mods in google maps)"
      customSectionHtml = `
        <div style="background:linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border:2px solid #f59e0b; border-radius:16px; padding:24px 20px; margin:26px 0; text-align:center; box-shadow:0 4px 14px rgba(245, 158, 11, 0.12);">
          <div style="font-size:22px; color:#f59e0b; margin-bottom:6px; letter-spacing:4px;">
            ★★★★★
          </div>
          <div style="font-size:15px; font-weight:800; color:#78350f; margin-bottom:6px;">
            ${isEs ? "¿Cómo fue tu experiencia en ZxZ Mods?" : "How was your experience with ZxZ Mods?"}
          </div>
          <div style="font-size:12px; color:#92400e; line-height:1.5; max-width:440px; margin:0 auto 16px;">
            ${isEs 
              ? "Tu opinión es clave para nuestra comunidad. Califícanos en Google Maps y comparte fotos de tu vehículo para ayudar a otros apasionados del powersports." 
              : "Your feedback is essential to our community. Review us on Google Maps and share photos of your vehicle to inspire fellow powersports enthusiasts."}
          </div>
          <a href="${mapsReviewUrl}" target="_blank" style="display:inline-block; background:#0f172a; color:#ffffff; font-size:13px; font-weight:800; text-decoration:none; padding:12px 26px; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.15);">
            ⭐ ${isEs ? "Calificar en Google Maps" : "Review us on Google Maps"}
          </a>
        </div>
      `;
      break;

    case "INSTALLATION_PAYMENT":
      subject = isEs
        ? `Pago de Instalación Pendiente - Pedido #${order.orderNumber} • ZxZ Mods`
        : `Installation Payment Pending - Order #${order.orderNumber} • ZxZ Mods`;
      badgeText = isEs ? "● PAGO DE INSTALACIÓN REQUERIDO" : "● INSTALLATION PAYMENT REQUIRED";
      badgeBg = "#faf5ff";
      badgeColor = "#6b21a8";
      badgeBorder = "#d8b4fe";
      headline = isEs ? "Etapa de Pago de Instalación" : "Installation Payment Stage";
      message = isEs
        ? `Tu pedido <strong>#${order.orderNumber}</strong> ha alcanzado la etapa de Pago de Instalación. Ya puedes proceder a realizar el pago correspondiente a la mano de obra del taller para continuar con el retiro o entrega de tu vehículo.`
        : `Your order <strong>#${order.orderNumber}</strong> has reached the Installation Payment stage. You may now proceed with the workshop labor payment to complete the delivery of your vehicle.`;

      const laborCRC = order.laborSubtotalCRC || order.installationCostCRC || 0;
      const ivaCRC = Math.round(laborCRC * 0.13);
      const totalInstallCRC = laborCRC + ivaCRC;

      customSectionHtml = `
        <div style="background:#faf5ff; border:1px solid #e9d5ff; border-radius:12px; padding:18px 20px; margin:22px 0; text-align:left;">
          <div style="font-size:12px; font-weight:800; color:#581c87; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:10px;">
            🔧 ${isEs ? "Desglose de Mano de Obra en Taller:" : "Workshop Labor Breakdown:"}
          </div>
          <table style="width:100%; font-size:13px; color:#3b0764; border-collapse:collapse;">
            <tr>
              <td style="padding:4px 0;">${isEs ? "Mano de Obra Especializada:" : "Specialized Labor:"}</td>
              <td style="padding:4px 0; text-align:right; font-weight:600;">${formatCRC(laborCRC)}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;">${isEs ? "IVA (13%):" : "VAT (13%):"}</td>
              <td style="padding:4px 0; text-align:right; font-weight:600;">${formatCRC(ivaCRC)}</td>
            </tr>
            <tr style="border-top:1px dashed #d8b4fe;">
              <td style="padding:8px 0 2px; font-weight:800; color:#581c87;">${isEs ? "Total Mano de Obra:" : "Total Installation Labor:"}</td>
              <td style="padding:8px 0 2px; text-align:right; font-weight:800; color:#581c87; font-size:15px;">${formatCRC(totalInstallCRC)}</td>
            </tr>
          </table>
        </div>
      `;
      actionBtnText = isEs ? "Pagar Instalación en Línea" : "Pay Installation Online";
      actionBtnUrl = payInstallUrl;
      break;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { margin: 0; padding: 16px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 18px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.06); }
        .header { background: #0f172a; padding: 26px 28px; text-align: center; }
        .header h1 { margin: 0; font-size: 19px; font-weight: 900; letter-spacing: 0.12em; color: #ffffff; text-transform: uppercase; }
        .header h1 span { color: #C02030; }
        .header p { margin: 5px 0 0; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.14em; }
        .content { padding: 32px 28px; text-align: center; }
        .badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; border: 1px solid ${badgeBorder}; background-color: ${badgeBg}; color: ${badgeColor}; margin-bottom: 18px; }
        .title { font-size: 21px; font-weight: 900; color: #0f172a; margin-bottom: 12px; letter-spacing: -0.02em; line-height: 1.3; }
        .message { font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px; text-align: left; }
        .order-meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; text-align: left; margin-bottom: 24px; }
        .order-meta-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .order-meta-table td { padding: 5px 0; color: #475569; }
        .order-meta-table td.label { font-weight: 700; color: #1e293b; width: 40%; }
        .order-meta-table td.value { font-weight: 600; color: #0f172a; text-align: right; }
        .btn-primary { display: inline-block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 32px; border-radius: 12px; margin: 12px 0 24px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25); text-align: center; }
        .btn-primary:hover { background-color: #1e293b; }
        .footer { background: #f8fafc; padding: 24px 28px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b; line-height: 1.6; }
        .footer strong { color: #334155; }
        .footer a { color: #0052CC; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <h1>ZXZ <span>MODS</span> COSTA RICA</h1>
          <p>Centro de Alto Rendimiento Powersports • CFMOTO Specialists</p>
        </div>

        <div class="content">
          <div class="badge">${badgeText}</div>
          <div class="title">${headline}</div>
          
          <div class="message">
            ${isEs ? `Estimado(a) <strong>${customerName}</strong>:` : `Dear <strong>${customerName}</strong>:`}<br><br>
            ${message}
          </div>

          <div class="order-meta-box">
            <table class="order-meta-table">
              <tr>
                <td class="label">${isEs ? "Número de Pedido:" : "Order Number:"}</td>
                <td class="value"><span style="font-family:monospace; font-weight:800; font-size:13px; color:#0052CC;">#${order.orderNumber}</span></td>
              </tr>
              <tr>
                <td class="label">${isEs ? "Servicio / Modalidad:" : "Service Type:"}</td>
                <td class="value">${deliveryMode}</td>
              </tr>
              ${vehicleStr ? `
              <tr>
                <td class="label">${isEs ? "Vehículo Asociado:" : "Associated Vehicle:"}</td>
                <td class="value"><strong>${vehicleStr}</strong></td>
              </tr>
              ` : ""}
              <tr>
                <td class="label">${isEs ? "Total de la Orden:" : "Order Total:"}</td>
                <td class="value" style="font-weight:800; color:#0f172a;">${formatCRC(order.totalCRC || 0)}</td>
              </tr>
            </table>
          </div>

          ${customSectionHtml}

          <div>
            <a href="${actionBtnUrl}" class="btn-primary" target="_blank">
              ${actionBtnText} →
            </a>
          </div>

          <p style="font-size:12px; color:#94a3b8; margin:0;">
            ${isEs 
              ? "Si tienes alguna consulta sobre tu pedido, puedes responder directamente a este correo o contactarnos por WhatsApp." 
              : "If you have any questions regarding your order, you can reply directly to this email or reach out via WhatsApp."}
          </p>
        </div>

        <div class="footer">
          <p style="margin:0 0 6px;">
            <strong>${COMPANY_CONFIG.legalName}</strong>${COMPANY_CONFIG.cedulaJuridica ? ` • Cédula Jurídica: ${COMPANY_CONFIG.cedulaJuridica}` : ""}<br>
            ${isEs ? (COMPANY_CONFIG.location.addressEs || COMPANY_CONFIG.location.address) : (COMPANY_CONFIG.location.addressEn || COMPANY_CONFIG.location.address)}<br>
            ${isEs ? "Teléfono:" : "Phone:"} ${COMPANY_CONFIG.contact.phone} • WhatsApp: ${COMPANY_CONFIG.contact.whatsapp}
          </p>
          <p style="margin:0; font-size:10px; color:#94a3b8;">
            © ${new Date().getFullYear()} ${COMPANY_CONFIG.name}. ${isEs ? "Todos los derechos reservados. Notificación automática del sistema de órdenes." : "All rights reserved. Automated order system notification."}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

/**
 * Dispatches an order step notification email asynchronously to the customer's profile email.
 */
export async function sendOrderStepNotificationEmail(
  params: SendOrderStepNotificationParams
): Promise<{ success: boolean; previewUrl?: string; error?: any }> {
  try {
    const { order, step, to, lang, rejectionReason, rejectionType, pickupDate, pickupTime, pickupAddress, mapsReviewUrl } = params;

    // 1. Resolve recipient profile email
    const recipientEmail = to || (await resolveProfileEmail(order));
    if (!recipientEmail || !recipientEmail.includes("@")) {
      console.warn(`[ORDER_STEP_EMAIL_SKIP]: No valid profile email found for order #${order?.orderNumber}. Suppressing dispatch.`);
      return { success: false, error: "No valid profile email found" };
    }

    // 2. Spend & flood protection
    if (!checkDailyLimit(recipientEmail)) {
      return { success: false, error: "Daily email limit reached" };
    }

    // 3. Resolve language
    const effectiveLang = resolveOrderLanguage(order, lang);

    // Ensure legal entity and cedula juridica reflect the backdoor database in real time
    try {
      const workshop = await prisma.workshopInfo.findUnique({
        where: { id: "zxz-hq" },
      });
      if (workshop) {
        if (workshop.legalName) COMPANY_CONFIG.legalName = workshop.legalName;
        if (workshop.cedulaJuridica !== undefined && workshop.cedulaJuridica !== null) {
          COMPANY_CONFIG.cedulaJuridica = workshop.cedulaJuridica;
        }
        if (workshop.phone) COMPANY_CONFIG.contact.phone = workshop.phone;
        if (workshop.whatsapp) COMPANY_CONFIG.contact.whatsapp = workshop.whatsapp;
        if (workshop.addressEs) COMPANY_CONFIG.location.addressEs = workshop.addressEs;
        if (workshop.addressEn) COMPANY_CONFIG.location.addressEn = workshop.addressEn;
      }
    } catch (err) {
      console.warn("[WORKSHOP_SYNC_EMAIL_WARN]:", err);
    }

    // 4. Generate email template
    const { subject, html } = generateOrderStepEmailHtml({
      order,
      step,
      lang: effectiveLang,
      rejectionReason,
      rejectionType,
      pickupDate,
      pickupTime,
      pickupAddress,
      mapsReviewUrl,
    });

    const smtpFrom = process.env.SMTP_FROM_SALES || '"ZxZ Mods Costa Rica" <ventas@zxzmods.com>';

    return await sendEmailSafely({
      from: smtpFrom,
      to: recipientEmail,
      subject,
      html,
    });
  } catch (error) {
    console.error("[ORDER_STEP_EMAIL_ERROR]: Failed to dispatch step notification email:", error);
    return { success: false, error };
  }
}
