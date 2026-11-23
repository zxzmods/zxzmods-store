export type PaymentPlanType = "FULL_100" | "SPLIT_70_30";

/** Minimum parts/products total in CRC required to enable the 70% / 30% split payment option */
export const SPLIT_PAYMENT_MIN_PRODUCTS_CRC = 80000;

export function isEligibleForSplitPayment(productsTotalCRC: number): boolean {
  return Math.round(Number(productsTotalCRC) || 0) >= SPLIT_PAYMENT_MIN_PRODUCTS_CRC;
}

export interface SplitPaymentData {
  enabled: true;
  plan: "SPLIT_70_30";
  depositPercent: 70;
  remainingPercent: 30;
  totalOrderCRC: number;
  initial70AmountCRC: number;
  remaining30AmountCRC: number;
  initial70Confirmed?: boolean;
  initial70ConfirmedAt?: string | null;
  initial70ConfirmedBy?: string | null;
  remaining30ProofUrl?: string | null;
  remaining30PaidAt?: string | null;
  remaining30Currency?: "CRC" | "USD" | null;
  remaining30Reference?: string | null;
  remaining30Confirmed?: boolean;
  remaining30ConfirmedAt?: string | null;
  remaining30ConfirmedBy?: string | null;
  remaining30Rejected?: boolean;
  remaining30RejectedAt?: string | null;
  remaining30RejectedBy?: string | null;
  remaining30RejectionReason?: string | null;
  remaining30ReceiptEmailSent?: boolean;
  remaining30ReceiptEmailSentAt?: string | null;
}

export function computeSplitPaymentAmounts(totalCRC: number): {
  totalOrderCRC: number;
  initial70AmountCRC: number;
  remaining30AmountCRC: number;
} {
  const safeTotal = Math.max(0, Math.round(Number(totalCRC) || 0));
  const initial70AmountCRC = Math.round(safeTotal * 0.7);
  const remaining30AmountCRC = Math.max(0, safeTotal - initial70AmountCRC);
  return {
    totalOrderCRC: safeTotal,
    initial70AmountCRC,
    remaining30AmountCRC,
  };
}

export function createInitialSplitPaymentData(totalCRC: number): SplitPaymentData {
  const { totalOrderCRC, initial70AmountCRC, remaining30AmountCRC } =
    computeSplitPaymentAmounts(totalCRC);
  return {
    enabled: true,
    plan: "SPLIT_70_30",
    depositPercent: 70,
    remainingPercent: 30,
    totalOrderCRC,
    initial70AmountCRC,
    remaining30AmountCRC,
    initial70Confirmed: false,
    remaining30ProofUrl: null,
    remaining30Confirmed: false,
    remaining30Rejected: false,
  };
}

export function parseOrderDocs(orderOrDocs: any): Record<string, any> {
  if (!orderOrDocs) return {};
  if (typeof orderOrDocs === "string") {
    try {
      const parsed = JSON.parse(orderOrDocs);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  if (typeof orderOrDocs === "object") {
    if ("serviceDocumentsJson" in orderOrDocs) {
      return parseOrderDocs(orderOrDocs.serviceDocumentsJson);
    }
    return orderOrDocs;
  }
  return {};
}

export function extractSplitPayment(orderOrDocs: any): SplitPaymentData | null {
  if (!orderOrDocs) return null;
  const docs = parseOrderDocs(orderOrDocs);
  const rawSp = docs?.splitPayment;
  const isSplit =
    rawSp?.enabled === true ||
    rawSp?.plan === "SPLIT_70_30" ||
    docs?.paymentPlan === "SPLIT_70_30";

  if (!isSplit) return null;

  // Resolve base parts net total if amounts were not yet populated
  let fallbackTotal = Number(rawSp?.totalOrderCRC) || 0;
  if (fallbackTotal <= 0 && typeof orderOrDocs === "object" && orderOrDocs !== null) {
    const partsSub = Number(orderOrDocs.partsSubtotalCRC) || 0;
    const disc = Number(orderOrDocs.discountCRC) || 0;
    const total = Number(orderOrDocs.totalCRC) || 0;
    fallbackTotal = partsSub > 0 ? Math.max(0, partsSub - disc) : Math.max(0, total);
  }

  const computed = computeSplitPaymentAmounts(fallbackTotal);
  const initial70 =
    typeof rawSp?.initial70AmountCRC === "number" && rawSp.initial70AmountCRC > 0
      ? Math.round(rawSp.initial70AmountCRC)
      : computed.initial70AmountCRC;
  const remaining30 =
    typeof rawSp?.remaining30AmountCRC === "number" && rawSp.remaining30AmountCRC > 0
      ? Math.round(rawSp.remaining30AmountCRC)
      : computed.remaining30AmountCRC;
  const totalOrder =
    typeof rawSp?.totalOrderCRC === "number" && rawSp.totalOrderCRC > 0
      ? Math.round(rawSp.totalOrderCRC)
      : initial70 + remaining30;

  return {
    enabled: true,
    plan: "SPLIT_70_30",
    depositPercent: 70,
    remainingPercent: 30,
    totalOrderCRC: totalOrder,
    initial70AmountCRC: initial70,
    remaining30AmountCRC: remaining30,
    initial70Confirmed: Boolean(rawSp?.initial70Confirmed),
    initial70ConfirmedAt: rawSp?.initial70ConfirmedAt || null,
    initial70ConfirmedBy: rawSp?.initial70ConfirmedBy || null,
    remaining30ProofUrl: rawSp?.remaining30ProofUrl || null,
    remaining30PaidAt: rawSp?.remaining30PaidAt || null,
    remaining30Currency:
      rawSp?.remaining30Currency === "USD"
        ? "USD"
        : rawSp?.remaining30Currency === "CRC"
        ? "CRC"
        : null,
    remaining30Reference: rawSp?.remaining30Reference || null,
    remaining30Confirmed: Boolean(rawSp?.remaining30Confirmed),
    remaining30ConfirmedAt: rawSp?.remaining30ConfirmedAt || null,
    remaining30ConfirmedBy: rawSp?.remaining30ConfirmedBy || null,
    remaining30Rejected: Boolean(rawSp?.remaining30Rejected),
    remaining30RejectedAt: rawSp?.remaining30RejectedAt || null,
    remaining30RejectedBy: rawSp?.remaining30RejectedBy || null,
    remaining30RejectionReason: rawSp?.remaining30RejectionReason || null,
    remaining30ReceiptEmailSent: Boolean(rawSp?.remaining30ReceiptEmailSent),
    remaining30ReceiptEmailSentAt: rawSp?.remaining30ReceiptEmailSentAt || null,
  };
}

export function isSplitPaymentOrder(orderOrDocs: any): boolean {
  return extractSplitPayment(orderOrDocs) !== null;
}

export function hasRemaining30Proof(orderOrDocs: any): boolean {
  const sp = extractSplitPayment(orderOrDocs);
  return Boolean(sp?.remaining30ProofUrl && sp.remaining30ProofUrl.trim().length > 0);
}

export function isRemaining30Confirmed(orderOrDocs: any): boolean {
  const sp = extractSplitPayment(orderOrDocs);
  return Boolean(sp?.remaining30Confirmed === true);
}

export function isRemaining30PendingReview(orderOrDocs: any): boolean {
  const sp = extractSplitPayment(orderOrDocs);
  if (!sp) return false;
  return Boolean(
    sp.remaining30ProofUrl &&
      sp.remaining30ProofUrl.trim().length > 0 &&
      !sp.remaining30Confirmed &&
      !sp.remaining30Rejected
  );
}

/**
 * Determines whether the customer can currently pay / upload the 30% remaining balance.
 * Requires:
 *  - Split 70/30 order
 *  - 30% not yet confirmed
 *  - Order is in REMAINING_30_PAYMENT stage, OR rejected specifically for REMAINING_30,
 *    OR has the ZxZ Check Certificate attached and initial 70% payment already confirmed.
 */
export function canPayRemaining30(order: any): boolean {
  if (!order) return false;
  const sp = extractSplitPayment(order);
  if (!sp || sp.remaining30Confirmed) return false;

  const statusUpper = String(order.status || "").toUpperCase();
  if (
    statusUpper === "CANCELLED" ||
    statusUpper === "COTIZACION" ||
    statusUpper === "PENDING" ||
    statusUpper === "PAYMENT_CONFIRMATION"
  ) {
    return false;
  }

  if (statusUpper === "REMAINING_30_PAYMENT") return true;

  const docs = parseOrderDocs(order);
  if (statusUpper === "PAYMENT_REJECTED" && docs?.rejectionPaymentType === "REMAINING_30") {
    return true;
  }

  const hasCert = Boolean(order.isCertified || order.zxzCertificationJson);
  if (hasCert && statusUpper !== "PAYMENT_REJECTED") {
    return true;
  }

  return false;
}

export function mergeSplitPaymentIntoDocsJson(
  existingDocsJson: string | Record<string, any> | null | undefined,
  patch: Partial<SplitPaymentData>
): string {
  const docs = { ...parseOrderDocs(existingDocsJson) };
  const prevSp = docs.splitPayment && typeof docs.splitPayment === "object" ? docs.splitPayment : {};
  docs.paymentPlan = "SPLIT_70_30";
  docs.splitPayment = {
    enabled: true,
    plan: "SPLIT_70_30",
    depositPercent: 70,
    remainingPercent: 30,
    ...prevSp,
    ...patch,
  };
  return JSON.stringify(docs);
}
