import { COMPANY_CONFIG } from "@/config/company";
import { formatCRC, formatUSD, convertCRCToUSD } from "@/lib/i18n";

export interface ReceiptItem {
  id?: string;
  sku?: string;
  slug?: string;
  title?: string;
  nameEs?: string;
  nameEn?: string;
  quantity?: number;
  priceCRC?: number;
  price?: number;
  unitPriceCRC?: number;
  installationPriceCRC?: number;
  withInstallation?: boolean;
  freeInstallation?: boolean;
  selectedParameters?: Array<{ name: string; value: string }>;
}

export interface ReceiptOrderData {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string | Date;
  customerName?: string | null;
  customerPhone?: string | null;
  guestEmail?: string | null;
  shippingAddress?: string | null;
  serviceType?: string;
  notes?: string | null;
  paidCurrency?: string | null;
  totalCRC: number;
  partsSubtotalCRC: number;
  laborSubtotalCRC: number;
  shippingCostCRC?: number;
  installationCostCRC?: number;
  pickupCostCRC?: number;
  discountType?: string;
  discountValue?: number;
  discountReason?: string | null;
  discountCRC?: number;
  taxCRC?: number;
  paymentProofUrl?: string | null;
  servicePaymentProofUrl?: string | null;
  installationPaymentProofUrl?: string | null;
  isInstallationPaymentConfirmed?: boolean;
  items?: ReceiptItem[];
  itemsJson?: string;
  serviceDocumentsJson?: string | Record<string, any> | null;
  user?: {
    email?: string | null;
    displayName?: string | null;
    phoneNumber?: string | null;
  } | null;
}

export type ReceiptPaymentType = "ORDER" | "INSTALLATION" | "SERVICE" | "COMPLETE";

export interface GenerateReceiptOptions {
  isEmail?: boolean;
  receiptType?: ReceiptPaymentType;
}

/**
 * Checks whether the primary order payment is confirmed.
 */
export function isOrderPaymentConfirmed(order: ReceiptOrderData): boolean {
  const s = String(order.status || "").toUpperCase();
  const unconfirmed = ["COTIZACION", "PENDING", "PAYMENT_CONFIRMATION", "PAYMENT_REJECTED", "CANCELLED"];
  return !unconfirmed.includes(s);
}

/**
 * Checks whether installation payment is confirmed.
 */
export function isInstallationPaymentConfirmed(order: ReceiptOrderData): boolean {
  if (order.isInstallationPaymentConfirmed) return true;
  if (order.serviceDocumentsJson) {
    try {
      const d = typeof order.serviceDocumentsJson === "string" ? JSON.parse(order.serviceDocumentsJson) : order.serviceDocumentsJson;
      if (d?.installationPaymentConfirmed) return true;
    } catch {}
  }
  return false;
}

/**
 * Checks whether logistics/transport service payment is confirmed.
 */
export function isServicePaymentConfirmed(order: ReceiptOrderData): boolean {
  if (order.serviceDocumentsJson) {
    try {
      const d = typeof order.serviceDocumentsJson === "string" ? JSON.parse(order.serviceDocumentsJson) : order.serviceDocumentsJson;
      if (d?.servicePaymentConfirmed) return true;
    } catch {}
  }
  return false;
}

/**
 * Checks whether at least one payment has been officially confirmed.
 */
export function hasAnyConfirmedPayment(order: ReceiptOrderData): boolean {
  return isOrderPaymentConfirmed(order) || isInstallationPaymentConfirmed(order) || isServicePaymentConfirmed(order);
}

/**
 * Extracts and normalizes order items safely from array or JSON string.
 */
export function extractReceiptItems(order: ReceiptOrderData): ReceiptItem[] {
  if (Array.isArray(order.items) && order.items.length > 0) {
    return order.items;
  }
  if (order.itemsJson) {
    try {
      const parsed = typeof order.itemsJson === "string" ? JSON.parse(order.itemsJson) : order.itemsJson;
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

/**
 * Formats delivery/service mode into friendly bilingual label.
 */
export function getServiceTypeLabel(serviceType?: string, lang: "es" | "en" = "es"): string {
  const isEs = lang === "es";
  switch (String(serviceType || "").toUpperCase()) {
    case "STORE_PICKUP":
      return isEs ? "Retiro en Taller (Santa Ana, Pozos)" : "Workshop Pickup (Santa Ana, Pozos)";
    case "HOME_SERVICE":
      return isEs ? "Instalación / Servicio a Domicilio" : "Home Installation / Mobile Service";
    case "UTV_PICKUP":
      return isEs ? "Recogida y Entrega de UTV en Plataforma" : "UTV Flatbed Pickup & Delivery";
    case "SHIPPING":
      return isEs ? "Envío Nacional por Encomienda" : "National Courier Shipping";
    default:
      return isEs ? "Atención en Taller ZxZ Mods" : "ZxZ Mods Workshop Service";
  }
}

/**
 * Generates an Amazon-style, minimalist, compact, low-attention formal receipt HTML.
 * Used for both email dispatch and printable browser view.
 */
export function generateReceiptHtml(
  order: ReceiptOrderData,
  lang: "es" | "en" = "es",
  options: GenerateReceiptOptions = {}
): string {
  const isEs = lang === "es";
  const isEmail = options.isEmail === true;
  const requestedType = options.receiptType || "ORDER";

  const orderPaid = isOrderPaymentConfirmed(order);
  const installPaid = isInstallationPaymentConfirmed(order);
  const servicePaid = isServicePaymentConfirmed(order);

  // If no payment confirmed at all, return the unconfirmed state notice
  if (!hasAnyConfirmedPayment(order)) {
    return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isEs ? "Comprobante Pendiente" : "Receipt Pending"} #${order.orderNumber} - ZxZ Mods</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; background: ${isEmail ? "#f4f5f7" : "#ffffff"}; margin: 0; padding: 20px; color: #111827; }
    .unconfirmed-card { max-width: 520px; margin: 40px auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px 24px; text-align: center; }
    .badge { font-size: 11px; font-weight: 700; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; padding: 3px 10px; border-radius: 999px; text-transform: uppercase; display: inline-block; margin-bottom: 12px; }
    h2 { font-size: 16px; margin: 0 0 8px 0; color: #111827; }
    p { font-size: 12px; color: #6b7280; line-height: 1.5; margin: 0 0 16px 0; }
  </style>
</head>
<body>
  <div class="unconfirmed-card">
    <span class="badge">${isEs ? "Pendiente de Validación" : "Pending Verification"}</span>
    <h2>${isEs ? "Comprobante Oficial No Disponible" : "Official Receipt Not Available Yet"}</h2>
    <p>${isEs 
      ? "El comprobante oficial de pago se generará y enviará automáticamente una vez que el taller valide y confirme la acreditación de tus fondos." 
      : "The official payment receipt will be generated and dispatched automatically once our workshop verifies and confirms your wire transfer funds."}</p>
    <div style="font-size: 11px; font-family: monospace; color: #9ca3af;">Orden: #${order.orderNumber}</div>
  </div>
</body>
</html>
    `.trim();
  }

  // Determine effective receipt type
  let effectiveType: ReceiptPaymentType = requestedType;
  if (requestedType === "ORDER" && !orderPaid && (installPaid || servicePaid)) {
    effectiveType = installPaid ? "INSTALLATION" : "SERVICE";
  }

  const currency = String(order.paidCurrency || "CRC").toUpperCase() === "USD" ? "USD" : "CRC";
  const sellRate = 520;

  const formatPrice = (crcAmount: number) => {
    if (currency === "USD") {
      return formatUSD(convertCRCToUSD(crcAmount, sellRate));
    }
    return formatCRC(crcAmount);
  };

  const secondaryPrice = (crcAmount: number) => {
    if (currency === "USD") {
      return formatCRC(crcAmount);
    }
    return `≈ ${formatUSD(convertCRCToUSD(crcAmount, sellRate))}`;
  };

  const dateStr = new Date(order.createdAt).toLocaleDateString(isEs ? "es-CR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const customerName =
    order.customerName ||
    order.user?.displayName ||
    (isEs ? "Cliente Estimado" : "Valued Customer");
  const customerEmail = order.guestEmail || order.user?.email || "N/A";
  const customerPhone = order.customerPhone || order.user?.phoneNumber || "N/A";
  const deliveryMode = getServiceTypeLabel(order.serviceType, lang);

  // Extract vehicle if stored in service documents
  let vehicleStr = "";
  let docsData: any = {};
  if (order.serviceDocumentsJson) {
    try {
      docsData =
        typeof order.serviceDocumentsJson === "string"
          ? JSON.parse(order.serviceDocumentsJson)
          : order.serviceDocumentsJson;
      if (docsData?.vehicle) {
        vehicleStr = `${docsData.vehicle.make || ""} ${docsData.vehicle.model || ""} ${docsData.vehicle.year || ""}`.trim();
      }
    } catch {}
  }

  // Configure receipt title & items based on effectiveType
  let receiptTitle = "";
  let paymentStatusLabel = "";
  let itemsRowsHtml = "";
  let summaryRowsHtml = "";
  let totalAmountCRC = 0;

  const items = extractReceiptItems(order);

  if (effectiveType === "INSTALLATION") {
    receiptTitle = isEs ? "COMPROBANTE DE INSTALACIÓN & MANO DE OBRA" : "LABOR & INSTALLATION RECEIPT";
    paymentStatusLabel = isEs ? "Pago de Mano de Obra Confirmado" : "Labor & Installation Payment Confirmed";

    const baseLabor = docsData.installationPaymentLaborCRC || order.installationCostCRC || order.laborSubtotalCRC || 0;
    const ivaCost = docsData.installationPaymentIvaCRC !== undefined ? docsData.installationPaymentIvaCRC : Math.round(baseLabor * 0.13);
    totalAmountCRC = docsData.installationPaymentPaidAmountCRC || (baseLabor + ivaCost);

    itemsRowsHtml = `
      <tr>
        <td>
          <div class="item-name">${isEs ? "Servicio Técnico Especializado - Instalación & Montaje" : "Specialized Technical Installation & Labor"}</div>
          <div class="item-sku">SKU: INST-SRV • ${isEs ? "Garantía de Taller: 60 días" : "Workshop Warranty: 60 days"}</div>
          ${vehicleStr ? `<div class="brand-subtitle">${isEs ? "Vehículo:" : "Vehicle:"} ${vehicleStr}</div>` : ""}
        </td>
        <td style="text-align: center; font-weight: 600;">1</td>
        <td style="text-align: right; font-family: monospace;">${formatPrice(baseLabor)}</td>
        <td style="text-align: right; font-weight: 700;">${formatPrice(baseLabor)}</td>
      </tr>
    `;

    summaryRowsHtml = `
      <div class="summary-row">
        <span>${isEs ? "Mano de Obra Neta:" : "Net Labor Cost:"}</span>
        <span>${formatPrice(baseLabor)}</span>
      </div>
      <div class="summary-row">
        <span>${isEs ? "IVA (13%):" : "VAT (13%):"}</span>
        <span>${formatPrice(ivaCost)}</span>
      </div>
      <div class="summary-row total">
        <span>${isEs ? "TOTAL INSTALACIÓN:" : "TOTAL INSTALLATION:"}</span>
        <span>${formatPrice(totalAmountCRC)}</span>
      </div>
      <div class="secondary-total">${secondaryPrice(totalAmountCRC)}</div>
    `;
  } else if (effectiveType === "SERVICE") {
    receiptTitle = isEs ? "COMPROBANTE DE SERVICIO DE TRANSPORTE" : "TRANSPORT & LOGISTICS RECEIPT";
    paymentStatusLabel = isEs ? "Pago de Servicio Confirmado" : "Transport Service Payment Confirmed";
    totalAmountCRC = order.shippingCostCRC || order.pickupCostCRC || 0;

    itemsRowsHtml = `
      <tr>
        <td>
          <div class="item-name">${deliveryMode}</div>
          <div class="item-sku">SKU: LOG-SRV • ${isEs ? "Logística Oficial ZxZ" : "Official ZxZ Logistics"}</div>
          ${order.shippingAddress ? `<div class="brand-subtitle">${order.shippingAddress}</div>` : ""}
        </td>
        <td style="text-align: center; font-weight: 600;">1</td>
        <td style="text-align: right; font-family: monospace;">${formatPrice(totalAmountCRC)}</td>
        <td style="text-align: right; font-weight: 700;">${formatPrice(totalAmountCRC)}</td>
      </tr>
    `;

    summaryRowsHtml = `
      <div class="summary-row total">
        <span>${isEs ? "TOTAL SERVICIO LOGÍSTICA:" : "TOTAL LOGISTICS SERVICE:"}</span>
        <span>${formatPrice(totalAmountCRC)}</span>
      </div>
      <div class="secondary-total">${secondaryPrice(totalAmountCRC)}</div>
    `;
  } else if (effectiveType === "COMPLETE") {
    receiptTitle = isEs ? "COMPROBANTE OFICIAL DE PAGO CONSOLIDADO" : "OFFICIAL CONSOLIDATED PAYMENT RECEIPT";
    paymentStatusLabel = isEs ? "Pagos Registrados y Confirmados" : "Payments Verified & Confirmed";
    totalAmountCRC = order.totalCRC;

    // Render all parts
    const partsRows = items.map((it, idx) => {
      const itemName = isEs ? it.nameEs || it.title || "Artículo" : it.nameEn || it.nameEs || it.title || "Item";
      const itemSku = it.sku || it.slug || (it.id ? String(it.id).slice(0, 10) : `ITM-${idx + 1}`);
      const qty = Math.max(1, Number(it.quantity) || 1);
      const unitCost = Number(it.unitPriceCRC || it.priceCRC || it.price || 0);
      const lineSubtotal = unitCost * qty;
      return `
        <tr>
          <td>
            <div class="item-name">${itemName}</div>
            <div class="item-sku">SKU: ${itemSku}</div>
          </td>
          <td style="text-align: center; font-weight: 600;">${qty}</td>
          <td style="text-align: right; font-family: monospace;">${formatPrice(unitCost)}</td>
          <td style="text-align: right; font-weight: 700;">${formatPrice(lineSubtotal)}</td>
        </tr>
      `;
    }).join("");

    // Add labor line if installed & confirmed
    const installRow = installPaid && (order.installationCostCRC || order.laborSubtotalCRC) ? `
      <tr style="background:#fcfcfc;">
        <td>
          <div class="item-name">${isEs ? "Mano de Obra de Instalación (Confirmado)" : "Installation Labor (Confirmed)"}</div>
          <div class="item-sku">SKU: INST-SRV</div>
        </td>
        <td style="text-align: center; font-weight: 600;">1</td>
        <td style="text-align: right; font-family: monospace;">${formatPrice(order.installationCostCRC || order.laborSubtotalCRC || 0)}</td>
        <td style="text-align: right; font-weight: 700;">${formatPrice(order.installationCostCRC || order.laborSubtotalCRC || 0)}</td>
      </tr>
    ` : "";

    itemsRowsHtml = partsRows + installRow;

    summaryRowsHtml = `
      <div class="summary-row">
        <span>${isEs ? "Partes / Repuestos:" : "Parts Subtotal:"}</span>
        <span>${formatPrice(order.partsSubtotalCRC || order.totalCRC)}</span>
      </div>
      ${(order.laborSubtotalCRC || 0) > 0 ? `
        <div class="summary-row">
          <span>${isEs ? "Mano de Obra:" : "Labor Subtotal:"}</span>
          <span>${formatPrice(order.laborSubtotalCRC)}</span>
        </div>
      ` : ""}
      ${(order.shippingCostCRC || 0) > 0 ? `
        <div class="summary-row">
          <span>${isEs ? "Logística / Envío:" : "Shipping:"}</span>
          <span>${formatPrice(order.shippingCostCRC || 0)}</span>
        </div>
      ` : ""}
      ${(order.discountCRC || 0) > 0 ? `
        <div class="summary-row" style="color: #059669; font-weight: 600;">
          <span>${isEs ? "Descuento:" : "Discount:"}</span>
          <span>-${formatPrice(order.discountCRC || 0)}</span>
        </div>
      ` : ""}
      <div class="summary-row total">
        <span>${isEs ? "TOTAL PAGADO:" : "TOTAL PAID:"}</span>
        <span>${formatPrice(order.totalCRC)}</span>
      </div>
      <div class="secondary-total">${secondaryPrice(order.totalCRC)}</div>
    `;
  } else {
    // Default ORDER payment receipt
    receiptTitle = isEs ? "COMPROBANTE OFICIAL DE COMPRA" : "OFFICIAL PURCHASE RECEIPT";
    paymentStatusLabel = isEs ? "Pago de Productos Confirmado" : "Products Payment Confirmed";
    totalAmountCRC = (order.partsSubtotalCRC || order.totalCRC) - (order.discountCRC || 0);

    itemsRowsHtml = items.length > 0 ? items.map((it, idx) => {
      const itemName = isEs ? it.nameEs || it.title || "Artículo" : it.nameEn || it.nameEs || it.title || "Item";
      const itemSku = it.sku || it.slug || (it.id ? String(it.id).slice(0, 10) : `ITM-${idx + 1}`);
      const qty = Math.max(1, Number(it.quantity) || 1);
      const unitCost = Number(it.unitPriceCRC || it.priceCRC || it.price || 0);
      const lineSubtotal = unitCost * qty;
      const paramsText = Array.isArray(it.selectedParameters) && it.selectedParameters.length > 0
        ? it.selectedParameters.map((p) => `${p.name}: ${p.value}`).join(" | ")
        : "";

      return `
        <tr>
          <td>
            <div class="item-name">${itemName}</div>
            <div class="item-sku">SKU: ${itemSku}${paramsText ? ` • ${paramsText}` : ""}</div>
            ${it.freeInstallation ? `<span class="item-badge">${isEs ? "Instalación Incluida" : "Installation Included"}</span>` : ""}
          </td>
          <td style="text-align: center; font-weight: 600;">${qty}</td>
          <td style="text-align: right; font-family: monospace;">${formatPrice(unitCost)}</td>
          <td style="text-align: right; font-weight: 700;">${formatPrice(lineSubtotal)}</td>
        </tr>
      `;
    }).join("") : `
      <tr>
        <td colspan="4" style="text-align: center; color: #9ca3af; padding: 14px;">
          ${isEs ? "Artículos de la orden confirmados." : "Confirmed order items."}
        </td>
      </tr>
    `;

    summaryRowsHtml = `
      <div class="summary-row">
        <span>${isEs ? "Subtotal de Partes:" : "Parts Subtotal:"}</span>
        <span>${formatPrice(order.partsSubtotalCRC || order.totalCRC)}</span>
      </div>
      ${(order.discountCRC || 0) > 0 ? `
        <div class="summary-row" style="color: #059669; font-weight: 600;">
          <span>${isEs ? "Descuento Aplicado:" : "Discount Applied:"}</span>
          <span>-${formatPrice(order.discountCRC || 0)}</span>
        </div>
      ` : ""}
      <div class="summary-row total">
        <span>${isEs ? "TOTAL COMPRA:" : "TOTAL PURCHASE:"}</span>
        <span>${formatPrice(totalAmountCRC)}</span>
      </div>
      <div class="secondary-total">${secondaryPrice(totalAmountCRC)}</div>
    `;
  }

  const paymentMethodLabel = isEs ? "Transferencia Bancaria (IBAN)" : "Bank Wire Transfer (IBAN)";

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${receiptTitle} #${order.orderNumber} - ZxZ Mods</title>
  <style>
    body {
      margin: 0;
      padding: ${isEmail ? "12px" : "0"};
      background-color: ${isEmail ? "#f4f5f7" : "#ffffff"};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #111827;
      line-height: 1.35;
      font-size: 11.5px;
      -webkit-font-smoothing: antialiased;
    }
    .receipt-wrapper {
      max-width: 620px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: ${isEmail ? "8px" : "0"};
      overflow: hidden;
      box-shadow: ${isEmail ? "0 1px 4px rgba(0, 0, 0, 0.05)" : "none"};
    }
    .receipt-header {
      padding: 14px 18px 12px 18px;
      border-bottom: 2px solid #111827;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-title {
      font-size: 15px;
      font-weight: 900;
      letter-spacing: -0.01em;
      color: #111827;
      margin: 0 0 2px 0;
      text-transform: uppercase;
    }
    .brand-title span {
      color: #C02030;
    }
    .brand-subtitle {
      font-size: 10px;
      color: #6b7280;
      margin: 0;
      line-height: 1.35;
    }
    .receipt-meta {
      text-align: right;
    }
    .receipt-badge {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      background: #ecfdf5;
      color: #065f46;
      padding: 2px 6px;
      border-radius: 3px;
      border: 1px solid #a7f3d0;
      display: inline-block;
      margin-bottom: 3px;
    }
    .order-number {
      font-size: 13px;
      font-weight: 800;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #111827;
      margin: 0;
    }
    .order-date {
      font-size: 10px;
      color: #6b7280;
      margin-top: 1px;
    }
    .info-grid {
      display: table;
      width: 100%;
      border-bottom: 1px solid #e5e7eb;
      background-color: #fafafa;
    }
    .info-col {
      display: table-cell;
      width: 50%;
      padding: 10px 18px;
      vertical-align: top;
      font-size: 11px;
    }
    .info-col:first-child {
      border-right: 1px solid #e5e7eb;
    }
    .info-title {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .info-line {
      margin-bottom: 2px;
      color: #1f2937;
      line-height: 1.35;
    }
    .info-label {
      color: #6b7280;
      font-weight: 500;
    }
    .info-value {
      font-weight: 600;
      color: #111827;
    }
    .table-container {
      padding: 10px 18px;
    }
    .table-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #374151;
      margin-bottom: 6px;
    }
    table.receipt-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    table.receipt-table th {
      background-color: #f9fafb;
      color: #4b5563;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.04em;
      padding: 6px 8px;
      border-top: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
    }
    table.receipt-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: top;
      color: #1f2937;
    }
    .item-name {
      font-weight: 700;
      color: #111827;
      margin-bottom: 1px;
    }
    .item-sku {
      font-size: 9px;
      font-family: ui-monospace, SFMono-Regular, monospace;
      color: #6b7280;
    }
    .item-badge {
      font-size: 8.5px;
      font-weight: 700;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      padding: 1px 4px;
      border-radius: 3px;
      display: inline-block;
      margin-top: 2px;
    }
    .summary-section {
      padding: 0 18px 8px 18px;
    }
    .summary-box {
      margin-left: auto;
      max-width: 260px;
      border-top: 1px solid #e5e7eb;
      padding-top: 6px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 3px;
      font-size: 11px;
      color: #4b5563;
    }
    .summary-row.total {
      margin-top: 5px;
      padding-top: 5px;
      border-top: 2px solid #111827;
      color: #111827;
      font-weight: 800;
      font-size: 13px;
    }
    .secondary-total {
      font-size: 10px;
      color: #6b7280;
      text-align: right;
      font-weight: 500;
      margin-top: 1px;
    }
    .terms-box {
      margin: 6px 18px 10px 18px;
      padding: 8px 12px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      font-size: 9.5px;
      color: #4b5563;
      line-height: 1.35;
    }
    .terms-heading {
      font-size: 9.5px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 4px 0;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .terms-item {
      margin-bottom: 3px;
    }
    .terms-item:last-child {
      margin-bottom: 0;
    }
    .receipt-footer {
      padding: 8px 18px;
      background-color: #ffffff;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 9.5px;
      color: #6b7280;
      line-height: 1.35;
    }
    @media print {
      body {
        padding: 0 !important;
        background-color: #ffffff !important;
      }
      .receipt-wrapper {
        border: none !important;
        box-shadow: none !important;
        max-width: 100% !important;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-wrapper">
    <!-- Header -->
    <div class="receipt-header">
      <div>
        <h1 class="brand-title">ZXZ <span>MODS</span> COSTA RICA</h1>
        <p class="brand-subtitle">${COMPANY_CONFIG.legalName}${COMPANY_CONFIG.cedulaJuridica ? ` • Cédula: ${COMPANY_CONFIG.cedulaJuridica}` : ""} • ${isEs ? "Centro Técnico Especializado" : "Specialized Performance Center"}</p>
        <p class="brand-subtitle">${isEs ? COMPANY_CONFIG.location.addressEs : COMPANY_CONFIG.location.addressEn}</p>
        <p class="brand-subtitle">${isEs ? "Email Oficial:" : "Official Email:"} ventas@zxzmods.com • ${isEs ? "Tel / WhatsApp:" : "Phone / WhatsApp:"} ${COMPANY_CONFIG.contact.phone}</p>
      </div>
      <div class="receipt-meta">
        <span class="receipt-badge">${paymentStatusLabel}</span>
        <div class="order-number">#${order.orderNumber}</div>
        <div class="order-date">${dateStr}</div>
      </div>
    </div>

    <!-- 2-Column Info: Buyer & Payment Details -->
    <div class="info-grid">
      <div class="info-col">
        <div class="info-title">${isEs ? "Comprador / Facturado A" : "Billed To / Buyer"}</div>
        <div class="info-line"><span class="info-label">${isEs ? "Nombre:" : "Name:"}</span> <span class="info-value">${customerName}</span></div>
        <div class="info-line"><span class="info-label">${isEs ? "Correo:" : "Email:"}</span> <span class="info-value">${customerEmail}</span></div>
        <div class="info-line"><span class="info-label">${isEs ? "Teléfono:" : "Phone:"}</span> <span class="info-value">${customerPhone}</span></div>
        ${vehicleStr ? `<div class="info-line"><span class="info-label">${isEs ? "Vehículo:" : "Vehicle:"}</span> <span class="info-value">${vehicleStr}</span></div>` : ""}
      </div>

      <div class="info-col">
        <div class="info-title">${isEs ? "Detalles del Pago & Entrega" : "Payment & Delivery Info"}</div>
        <div class="info-line"><span class="info-label">${isEs ? "Estado:" : "Status:"}</span> <span class="info-value">${paymentStatusLabel}</span></div>
        <div class="info-line"><span class="info-label">${isEs ? "Método de Pago:" : "Payment Method:"}</span> <span class="info-value">${paymentMethodLabel}</span></div>
        <div class="info-line"><span class="info-label">${isEs ? "Moneda de Pago:" : "Currency:"}</span> <span class="info-value">${currency === "USD" ? "Dólares ($ USD)" : "Colones (₡ CRC)"}</span></div>
        <div class="info-line"><span class="info-label">${isEs ? "Modalidad:" : "Delivery Mode:"}</span> <span class="info-value">${deliveryMode}</span></div>
        ${order.shippingAddress ? `<div class="info-line"><span class="info-label">${isEs ? "Dirección:" : "Address:"}</span> <span class="info-value">${order.shippingAddress}</span></div>` : ""}
      </div>
    </div>

    <!-- Table of Items -->
    <div class="table-container">
      <div class="table-title">${isEs ? "Detalle del Pago y Conceptos Acreditados" : "Breakdown of Paid & Confirmed Items"}</div>
      <table class="receipt-table">
        <thead>
          <tr>
            <th style="width: 52%;">${isEs ? "Descripción" : "Description"}</th>
            <th style="width: 10%; text-align: center;">${isEs ? "Cant." : "Qty"}</th>
            <th style="width: 18%; text-align: right;">${isEs ? "Precio Unit." : "Unit Price"}</th>
            <th style="width: 20%; text-align: right;">${isEs ? "Subtotal" : "Total"}</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRowsHtml}
        </tbody>
      </table>
    </div>

    <!-- Financial Breakdown -->
    <div class="summary-section">
      <div class="summary-box">
        ${summaryRowsHtml}
      </div>
    </div>

    <!-- Terms, Warranties & Conditions (Compact Box) -->
    <div class="terms-box">
      <div class="terms-heading">${isEs ? "TÉRMINOS Y CONDICIONES GENERALES" : "TERMS & CONDITIONS"}</div>
      <div class="terms-item">
        <strong>${isEs ? "1. Garantía Oficial ZxZ Mods:" : "1. Official Warranty:"}</strong>
        ${isEs ? "90 días en partes bolt-on y eléctricas; 60 días en mano de obra mecánica de taller; soporte de por vida en software ECU ZxZ." : "90 days warranty on bolt-on & electrical parts; 60 days on workshop mechanical labor; lifetime support on ZxZ ECU software."}
      </div>
      <div class="terms-item">
        <strong>${isEs ? "2. Tiempos de Entrega & Importación:" : "2. Delivery & Import Times:"}</strong>
        ${isEs ? "Repuestos de importación directa EE.UU.: plazo de 7 a 12 días hábiles en taller central. Piezas en inventario local: entrega coordinada de inmediato." : "US direct import parts: 7 to 12 business days to workshop. Local inventory: immediate delivery or installation."}
      </div>
      <div class="terms-item">
        <strong>${isEs ? "3. Atención al Cliente y Facturación:" : "3. Customer Support & Billing:"}</strong>
        ${isEs ? `Consultas a ventas@zxzmods.com o WhatsApp al ${COMPANY_CONFIG.contact.phone}. Ubicación: ${COMPANY_CONFIG.location.addressEs}.` : `Questions to ventas@zxzmods.com or WhatsApp at ${COMPANY_CONFIG.contact.phone}. Located at ${COMPANY_CONFIG.location.addressEn}.`}
      </div>
      <div class="terms-item">
        <strong>${isEs ? "4. Política de No Devoluciones:" : "4. No Return Policy:"}</strong>
        ${isEs ? "Todas las ventas son finales. No se aceptan devoluciones en componentes eléctricos, repuestos instalados ni órdenes especiales de importación una vez confirmados o entregados. Cobertura estricta bajo garantía por defectos de fábrica." : "All sales are final. No returns on electrical parts, installed parts, or direct import orders once placed or delivered. Strictly covered by warranty for manufacturing defects."}
      </div>
    </div>

    <!-- Receipt Footer -->
    <div class="receipt-footer">
      <div style="font-weight: 700; color: #111827;">${isEs ? "¡Gracias por confiar en ZxZ Mods Costa Rica!" : "Thank you for shopping with ZxZ Mods Costa Rica!"}</div>
      <div style="margin-top: 2px; color: #9ca3af;">
        ${isEs ? "Comprobante formal de pago generado automáticamente para registros del cliente." : "Formal payment receipt generated automatically for customer records."}
      </div>
      <div style="margin-top: 4px; color: #4b5563;">
        <span>${isEs ? "Soporte:" : "Support:"} <strong>${COMPANY_CONFIG.contact.phone}</strong></span>
        •
        <a href="${COMPANY_CONFIG.contact.social.facebook}" target="_blank" rel="noopener noreferrer" style="color: #4b5563; text-decoration: none; margin: 0 4px; font-weight: 600;">Facebook</a>
        •
        <a href="${COMPANY_CONFIG.contact.social.instagram}" target="_blank" rel="noopener noreferrer" style="color: #4b5563; text-decoration: none; margin: 0 4px; font-weight: 600;">Instagram</a>
        •
        <a href="${COMPANY_CONFIG.location.googleMapsLink}" target="_blank" rel="noopener noreferrer" style="color: #4b5563; text-decoration: none; margin: 0 4px; font-weight: 600;">Google Maps</a>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
