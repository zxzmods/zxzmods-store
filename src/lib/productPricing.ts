/**
 * Centralized USD-to-CRC Product Pricing, Locked T_price, Live Profit Fluctuation,
 * and 15% Profit Loss Precaution System.
 *
 * Rules:
 * 1. Staff enters P_price_D (Acquisition in USD) and S_price_D (Shipping in USD).
 * 2. When a product is saved (on creation or edit), P_price (CRC) and S_price (CRC)
 *    are translated using the active BCCR exchange rate and T_price (with IVA) is LOCKED.
 * 3. As the USD exchange rate fluctuates over time, T_price remains locked for customers,
 *    and the cost fluctuation is deducted from (or added to) the product's profit:
 *      effectiveProfitCRC = initialProfitCRC - ((livePPriceCRC + liveSPriceCRC) - (savedPPriceCRC + savedSPriceCRC))
 * 4. If a product loses 15% or more of its initial set profit (effectiveProfitCRC <= initialProfitCRC * 0.85),
 *    the Precaution System flags the product and alerts staff to adjust the price.
 * 5. All analytics/stats endpoints project effectiveProfitCRC (real dollar-fluctuated profit),
 *    never the theoretical initial profit.
 */

export const LEGACY_SHIPPING_CONVERSION_RATE = 456.23;
export const PROFIT_LOSS_ALERT_THRESHOLD_PERCENT = 15;

export interface ProductPricingInput {
  priceCRC?: number | null; // Locked T_price (with IVA)
  processingPriceD?: number | null; // P_price_D in USD
  processingPriceCRC?: number | null; // P_price in CRC locked at save time
  shippingPriceD?: number | null; // S_price_D in USD
  shippingPriceCRC?: number | null; // S_price in CRC locked at save time
  lockedExchangeRate?: number | null; // Exchange rate when T_price was locked
  profitCRC?: number | null; // Initial set profit in CRC
  installationPriceCRC?: number | null;
  isInstallationIncluded?: boolean | null;
  discountPercent?: number | null;
  ivaPercent?: number | null;
  price?: {
    P_price_D?: number;
    P_price?: number;
    S_price_D?: number;
    S_price?: number;
    profit?: number;
    T_price?: number;
    I_price?: {
      includes?: boolean;
      I_price?: number;
    };
  } | null;
}

export interface ProductLivePricingProjection {
  /** Locked customer-facing total price (with IVA) */
  lockedTPriceCRC: number;
  /** Hardware acquisition cost in USD */
  pPriceUSD: number;
  /** Shipping & customs cost in USD */
  sPriceUSD: number;
  /** Saved hardware cost in CRC when T_price was locked */
  savedPPriceCRC: number;
  /** Saved shipping cost in CRC when T_price was locked */
  savedSPriceCRC: number;
  /** Live translated hardware cost in CRC at currentExchangeRate */
  livePPriceCRC: number;
  /** Live translated shipping cost in CRC at currentExchangeRate */
  liveSPriceCRC: number;
  /** Total saved USD-backed cost in CRC (savedPPriceCRC + savedSPriceCRC) */
  savedBaseCostCRC: number;
  /** Total live USD-backed cost in CRC (livePPriceCRC + liveSPriceCRC) */
  liveBaseCostCRC: number;
  /** Cost difference due to dollar fluctuation: liveBaseCostCRC - savedBaseCostCRC */
  costFluctuationCRC: number;
  /** Initial theoretical profit set when product was saved */
  initialProfitCRC: number;
  /** Real profit after deducting/adding dollar fluctuation */
  effectiveProfitCRC: number;
  /** Profit difference: effectiveProfitCRC - initialProfitCRC */
  profitDeltaCRC: number;
  /** Percentage change in profit (negative when profit decreased, positive when profit increased) */
  profitChangePercent: number;
  /** Positive percentage of profit lost (0 if profit increased) */
  profitLossPercent: number;
  /** Profit threshold (85% of initialProfitCRC) at or below which staff is alerted */
  alertThresholdProfitCRC: number;
  /** True when product has lost 15% or more of its initial profit due to USD fluctuation */
  hasProfitAlert: boolean;
  /** Suggested new T_price (with IVA) to restore initialProfitCRC at currentExchangeRate */
  suggestedTPriceCRC: number;
  /** Exchange rate used for this live projection */
  currentExchangeRate: number;
  /** Exchange rate at which the product was originally locked */
  lockedExchangeRate: number;
}

export function resolveShippingUSD(
  shippingPriceD?: number | null,
  shippingPriceCRC?: number | null
): number {
  const usd = Number(shippingPriceD);
  if (Number.isFinite(usd) && usd > 0) {
    return Number(usd.toFixed(2));
  }
  const crc = Number(shippingPriceCRC);
  if (Number.isFinite(crc) && crc > 0) {
    return Number((crc / LEGACY_SHIPPING_CONVERSION_RATE).toFixed(2));
  }
  return 0;
}

export function computeProductLivePricing(
  product: ProductPricingInput,
  currentExchangeRate: number
): ProductLivePricingProjection {
  const rate =
    Number.isFinite(currentExchangeRate) && currentExchangeRate > 300
      ? currentExchangeRate
      : 455.21;

  const lockedTPriceCRC = Math.round(
    Number(product.priceCRC ?? product.price?.T_price ?? 0) || 0
  );

  const pPriceUSD = Number(
    (
      Number(product.processingPriceD ?? product.price?.P_price_D ?? 0) || 0
    ).toFixed(2)
  );

  const rawSavedPPriceCRC = Math.round(
    Number(product.processingPriceCRC ?? product.price?.P_price ?? 0) || 0
  );
  const rawSavedSPriceCRC = Math.round(
    Number(product.shippingPriceCRC ?? product.price?.S_price ?? 0) || 0
  );

  const sPriceUSD = resolveShippingUSD(
    product.shippingPriceD ?? product.price?.S_price_D,
    rawSavedSPriceCRC
  );

  const inferredLockedRate =
    Number(product.lockedExchangeRate) && Number(product.lockedExchangeRate) > 300
      ? Number(product.lockedExchangeRate)
      : pPriceUSD > 0 && rawSavedPPriceCRC > 0
      ? Number((rawSavedPPriceCRC / pPriceUSD).toFixed(2))
      : LEGACY_SHIPPING_CONVERSION_RATE;

  const savedPPriceCRC =
    rawSavedPPriceCRC > 0
      ? rawSavedPPriceCRC
      : pPriceUSD > 0
      ? Math.round(pPriceUSD * inferredLockedRate)
      : 0;

  const savedSPriceCRC =
    rawSavedSPriceCRC > 0
      ? rawSavedSPriceCRC
      : sPriceUSD > 0
      ? Math.round(sPriceUSD * inferredLockedRate)
      : 0;

  const livePPriceCRC =
    pPriceUSD > 0 ? Math.round(pPriceUSD * rate) : savedPPriceCRC;
  const liveSPriceCRC =
    sPriceUSD > 0 ? Math.round(sPriceUSD * rate) : savedSPriceCRC;

  const savedBaseCostCRC = savedPPriceCRC + savedSPriceCRC;
  const liveBaseCostCRC = livePPriceCRC + liveSPriceCRC;

  // Fluctuation in USD-backed costs (positive when USD rate rose, negative when USD rate fell)
  const costFluctuationCRC = liveBaseCostCRC - savedBaseCostCRC;

  const initialProfitCRC = Math.round(
    Number(product.profitCRC ?? product.price?.profit ?? 0) || 0
  );

  // Fluctuation in price is deducted from the profit while T_price stays locked
  const effectiveProfitCRC = initialProfitCRC - costFluctuationCRC;
  const profitDeltaCRC = effectiveProfitCRC - initialProfitCRC;

  const profitChangePercent =
    initialProfitCRC > 0
      ? Number(((profitDeltaCRC / initialProfitCRC) * 100).toFixed(2))
      : 0;

  const profitLossCRC = Math.max(0, initialProfitCRC - effectiveProfitCRC);
  const profitLossPercent =
    initialProfitCRC > 0
      ? Number(((profitLossCRC / initialProfitCRC) * 100).toFixed(2))
      : 0;

  // 15% loss threshold: e.g. 100,000 CRC initial profit -> 85,000 CRC threshold
  const alertThresholdProfitCRC = Math.round(
    initialProfitCRC * (1 - PROFIT_LOSS_ALERT_THRESHOLD_PERCENT / 100)
  );

  const hasProfitAlert =
    initialProfitCRC > 0 &&
    (effectiveProfitCRC <= alertThresholdProfitCRC ||
      profitLossPercent >= PROFIT_LOSS_ALERT_THRESHOLD_PERCENT);

  // Calculate suggested T_price at current exchange rate to restore initialProfitCRC
  const isInstInc = Boolean(
    product.isInstallationIncluded ?? product.price?.I_price?.includes ?? true
  );
  const instCRC = isInstInc
    ? Math.round(
        Number(
          product.installationPriceCRC ?? product.price?.I_price?.I_price ?? 0
        ) || 0
      )
    : 0;
  const discountPct = Math.max(
    0,
    Math.min(100, Math.round(Number(product.discountPercent) || 0))
  );
  const ivaRate = Math.max(0, Number(product.ivaPercent ?? 13));

  const liveBaseSubtotal =
    livePPriceCRC + liveSPriceCRC + initialProfitCRC + instCRC;
  const liveDiscountedSubtotal =
    discountPct > 0
      ? Math.round(liveBaseSubtotal * (1 - discountPct / 100))
      : liveBaseSubtotal;
  const liveIvaCRC = Math.round(liveDiscountedSubtotal * (ivaRate / 100));
  const suggestedTPriceCRC = liveDiscountedSubtotal + liveIvaCRC;

  return {
    lockedTPriceCRC,
    pPriceUSD,
    sPriceUSD,
    savedPPriceCRC,
    savedSPriceCRC,
    livePPriceCRC,
    liveSPriceCRC,
    savedBaseCostCRC,
    liveBaseCostCRC,
    costFluctuationCRC,
    initialProfitCRC,
    effectiveProfitCRC,
    profitDeltaCRC,
    profitChangePercent,
    profitLossPercent,
    alertThresholdProfitCRC,
    hasProfitAlert,
    suggestedTPriceCRC,
    currentExchangeRate: rate,
    lockedExchangeRate: inferredLockedRate,
  };
}
