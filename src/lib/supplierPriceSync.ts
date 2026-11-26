import { prisma } from "@/lib/prisma";
import { fetchLiveSupplierAvailability } from "@/lib/supplierAvailability";
import { computeProductLivePricing } from "@/lib/productPricing";
import {
  resolveEffectiveDealerDiscount,
  computeEffectiveDealerCostUSD,
  isManualPriceSupplier,
} from "@/lib/dealerBrands";
import { getBccrSellRate } from "@/lib/exchangeRate";
import { recordAuditLog, AuditActorRole, AuditAction } from "@/lib/audit";

export type PriceChangeDirection = "INCREASE" | "DECREASE" | "UNCHANGED";
export type PriceDecreaseResolutionAction =
  | "DISCOUNT"
  | "PRICE_DECREASE"
  | "PRICE_INCREASE"
  | "APPROVE_AS_DISCOUNT"
  | "APPROVE_REGULAR"
  | "DISMISSED";

export interface DealerPriceCalcProductInput {
  id: string;
  priceCRC: number;
  originalPriceCRC?: number | null;
  discountPercent?: number | null;
  processingPriceD?: number | null;
  processingPriceCRC?: number | null;
  shippingPriceD?: number | null;
  shippingPriceCRC?: number | null;
  profitCRC?: number | null;
  installationPriceCRC?: number | null;
  isInstallationIncluded?: boolean | null;
  ivaPercent?: number | null;
  lockedExchangeRate?: number | null;
  supplierLastPriceUSD?: number | null;
  dealerDiscountPercent?: number | null;
}

export interface DealerPriceCalcResult {
  direction: PriceChangeDirection;
  oldSupplierPriceUSD: number;
  newSupplierPriceUSD: number;
  dealerDiscountPercent: number;
  oldPPriceD: number;
  newPPriceD: number;
  oldPPriceCRC: number;
  newPPriceCRC: number;
  oldTPriceCRC: number;
  updatedTPriceCRC: number;
  newIvaCRC: number;
  exchangeRateUsed: number;
  /** Discount % of oldTPriceCRC vs updatedTPriceCRC (NOT the dealer's discount %) */
  computedDiscountPercent: number;
  /** For automatic price increases: updated originalPriceCRC and discountPercent */
  nextOriginalPriceCRC: number;
  nextDiscountPercent: number;
}

let tableEnsured = false;
let isPriceCheckRunning = false;

/**
 * Ensures the SupplierPriceDecrease table exists in live PostgreSQL or SQLite
 * with zero downtime even if a container boots before `prisma db push`.
 */
export async function ensureSupplierPriceDecreaseTable(): Promise<void> {
  if (tableEnsured) return;
  const dbUrl = (process.env.DATABASE_URL || "").toLowerCase();
  const isPostgres = dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://");

  try {
    if (isPostgres) {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "SupplierPriceDecrease" (
          "id" TEXT NOT NULL,
          "productId" TEXT NOT NULL,
          "productSku" TEXT NOT NULL,
          "productNameEs" TEXT NOT NULL,
          "productNameEn" TEXT NOT NULL DEFAULT '',
          "productImageUrl" TEXT NOT NULL DEFAULT '',
          "brandName" TEXT,
          "supplierUrl" TEXT,
          "changeDirection" TEXT NOT NULL DEFAULT 'DECREASE',
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "oldSupplierPriceUSD" DOUBLE PRECISION NOT NULL,
          "newSupplierPriceUSD" DOUBLE PRECISION NOT NULL,
          "dealerDiscountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "oldPPriceD" DOUBLE PRECISION NOT NULL,
          "newPPriceD" DOUBLE PRECISION NOT NULL,
          "oldPPriceCRC" INTEGER NOT NULL,
          "newPPriceCRC" INTEGER NOT NULL,
          "oldTPriceCRC" INTEGER NOT NULL,
          "proposedTPriceCRC" INTEGER NOT NULL,
          "proposedIvaCRC" INTEGER NOT NULL DEFAULT 0,
          "computedDiscountPercent" INTEGER NOT NULL DEFAULT 0,
          "exchangeRateUsed" DOUBLE PRECISION NOT NULL DEFAULT 455.21,
          "resolutionType" TEXT,
          "resolvedBy" TEXT,
          "resolvedAt" TIMESTAMP(3),
          "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "SupplierPriceDecrease_pkey" PRIMARY KEY ("id")
        );
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "SupplierPriceDecrease"
        ADD COLUMN IF NOT EXISTS "changeDirection" TEXT NOT NULL DEFAULT 'DECREASE';
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "SupplierPriceDecrease_productId_status_idx"
        ON "SupplierPriceDecrease"("productId", "status");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "SupplierPriceDecrease_status_detectedAt_idx"
        ON "SupplierPriceDecrease"("status", "detectedAt");
      `);
      // Enforce Row Level Security (RLS) in Supabase/PostgreSQL so PostgREST anon/authenticated roles cannot access internal pricing tables
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."SupplierPriceDecrease" ENABLE ROW LEVEL SECURITY;
      `);
      await prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
            EXECUTE 'REVOKE ALL ON TABLE "public"."SupplierPriceDecrease" FROM anon';
          END IF;
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
            EXECUTE 'REVOKE ALL ON TABLE "public"."SupplierPriceDecrease" FROM authenticated';
          END IF;
        END
        $$;
      `);
    } else {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "SupplierPriceDecrease" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "productId" TEXT NOT NULL,
          "productSku" TEXT NOT NULL,
          "productNameEs" TEXT NOT NULL,
          "productNameEn" TEXT NOT NULL DEFAULT '',
          "productImageUrl" TEXT NOT NULL DEFAULT '',
          "brandName" TEXT,
          "supplierUrl" TEXT,
          "changeDirection" TEXT NOT NULL DEFAULT 'DECREASE',
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "oldSupplierPriceUSD" REAL NOT NULL,
          "newSupplierPriceUSD" REAL NOT NULL,
          "dealerDiscountPercent" REAL NOT NULL DEFAULT 0,
          "oldPPriceD" REAL NOT NULL,
          "newPPriceD" REAL NOT NULL,
          "oldPPriceCRC" INTEGER NOT NULL,
          "newPPriceCRC" INTEGER NOT NULL,
          "oldTPriceCRC" INTEGER NOT NULL,
          "proposedTPriceCRC" INTEGER NOT NULL,
          "proposedIvaCRC" INTEGER NOT NULL DEFAULT 0,
          "computedDiscountPercent" INTEGER NOT NULL DEFAULT 0,
          "exchangeRateUsed" REAL NOT NULL DEFAULT 455.21,
          "resolutionType" TEXT,
          "resolvedBy" TEXT,
          "resolvedAt" DATETIME,
          "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "SupplierPriceDecrease_productId_status_idx"
        ON "SupplierPriceDecrease"("productId", "status");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "SupplierPriceDecrease_status_detectedAt_idx"
        ON "SupplierPriceDecrease"("status", "detectedAt");
      `);
      try {
        const cols: Array<{ name: string }> = await prisma.$queryRawUnsafe(
          `PRAGMA table_info("SupplierPriceDecrease");`
        );
        if (Array.isArray(cols) && !cols.some((c) => c.name === "changeDirection")) {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "SupplierPriceDecrease"
            ADD COLUMN "changeDirection" TEXT NOT NULL DEFAULT 'DECREASE';
          `);
        }
      } catch {}
    }
    tableEnsured = true;
  } catch (err) {
    console.warn("[ENSURE_SUPPLIER_PRICE_DECREASE_TABLE_WARN]:", err);
  }
}

/**
 * Returns Costa Rica (UTC-6, no DST) local clock parts & YYYY-MM-DD key.
 */
export function getCostaRicaClock(now: Date = new Date()): {
  dateKey: string;
  hour: number;
  minute: number;
} {
  // Costa Rica is strictly UTC-6 year-round (no daylight saving time)
  const crMs = now.getTime() - 6 * 60 * 60 * 1000;
  const cr = new Date(crMs);
  const yyyy = cr.getUTCFullYear();
  const mm = String(cr.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(cr.getUTCDate()).padStart(2, "0");
  return {
    dateKey: `${yyyy}-${mm}-${dd}`,
    hour: cr.getUTCHours(),
    minute: cr.getUTCMinutes(),
  };
}

/**
 * Pure calculation for a dealer price change:
 * - Updates ONLY P_price_D (and P_price CRC at the product's locked/active exchange rate).
 * - NEVER modifies shipping (S_price) or profit (profitCRC) or installation.
 * - Computes updated T_price (with IVA).
 * - Computes product discount strictly from `oldTPriceCRC` vs `updatedTPriceCRC` (NOT dealer discount %).
 */
export function calculateDealerPriceUpdate(
  product: DealerPriceCalcProductInput,
  newSupplierPriceUSD: number,
  effectiveDealerDiscountPercent: number,
  fallbackExchangeRate: number,
  newSupplierSalePriceUSD?: number | null
): DealerPriceCalcResult {
  const safeFallbackRate =
    Number.isFinite(fallbackExchangeRate) && fallbackExchangeRate > 300
      ? fallbackExchangeRate
      : 455.21;

  const dealerDisc = Math.max(
    0,
    Math.min(100, Number(effectiveDealerDiscountPercent) || 0)
  );
  const cleanNewSupplierUSD = Number((Number(newSupplierPriceUSD) || 0).toFixed(2));

  // Resolve current product P_price_D cleanly via centralized pricing logic
  const currentProjection = computeProductLivePricing(
    {
      ...product,
      dealerDiscountPercent: dealerDisc,
    },
    safeFallbackRate
  );

  const oldPPriceD = Number(currentProjection.pPriceUSD.toFixed(2));
  const oldSupplierPriceUSD =
    Number(product.supplierLastPriceUSD) > 0
      ? Number(Number(product.supplierLastPriceUSD).toFixed(2))
      : dealerDisc > 0 && dealerDisc < 100 && oldPPriceD > 0
      ? Number((oldPPriceD / (1 - dealerDisc / 100)).toFixed(2))
      : oldPPriceD;

  const newPPriceD = computeEffectiveDealerCostUSD(
    cleanNewSupplierUSD,
    dealerDisc,
    newSupplierSalePriceUSD
  );

  const rateToUse =
    Number(product.lockedExchangeRate) > 300
      ? Number(product.lockedExchangeRate)
      : currentProjection.lockedExchangeRate > 300
      ? currentProjection.lockedExchangeRate
      : safeFallbackRate;

  const oldPPriceCRC =
    Number(product.processingPriceCRC) > 0
      ? Math.round(Number(product.processingPriceCRC))
      : Math.round(oldPPriceD * rateToUse);

  const newPPriceCRC = Math.round(newPPriceD * rateToUse);

  // Keep shipping, profit, and installation 100% UNCHANGED
  const shippingCRC = Math.max(0, Math.round(Number(product.shippingPriceCRC) || 0));
  const profitCRC = Math.max(0, Math.round(Number(product.profitCRC) || 0));
  const isInstInc = Boolean(product.isInstallationIncluded ?? true);
  const instCRC = isInstInc ? Math.max(0, Math.round(Number(product.installationPriceCRC) || 0)) : 0;
  const ivaRate = Math.max(0, Number(product.ivaPercent ?? 13));

  const oldTPriceCRC = Math.max(0, Math.round(Number(product.priceCRC) || 0));
  const oldOriginalPriceCRC = Math.max(
    oldTPriceCRC,
    Math.round(Number(product.originalPriceCRC) || 0)
  );

  const unchangedResult: DealerPriceCalcResult = {
    direction: "UNCHANGED",
    oldSupplierPriceUSD,
    newSupplierPriceUSD: cleanNewSupplierUSD,
    dealerDiscountPercent: dealerDisc,
    oldPPriceD,
    newPPriceD,
    oldPPriceCRC,
    newPPriceCRC: oldPPriceCRC,
    oldTPriceCRC,
    updatedTPriceCRC: oldTPriceCRC,
    newIvaCRC: Math.round(oldTPriceCRC * (ivaRate / (100 + ivaRate))),
    exchangeRateUsed: rateToUse,
    computedDiscountPercent: Math.max(0, Math.round(Number(product.discountPercent) || 0)),
    nextOriginalPriceCRC: oldOriginalPriceCRC,
    nextDiscountPercent: Math.max(0, Math.round(Number(product.discountPercent) || 0)),
  };

  if (oldPPriceD <= 0 || newPPriceD <= 0 || cleanNewSupplierUSD <= 0 || oldTPriceCRC <= 0) {
    return unchangedResult;
  }

  const usdDiff = newPPriceD - oldPPriceD;
  if (Math.abs(usdDiff) < 0.05) {
    return unchangedResult;
  }

  // Compute updated T_price preserving shipping & profit exactly:
  // If product has standard breakdown matching oldTPriceCRC, rebuild directly from components;
  // if product had a legacy/custom T_price without explicit profitCRC, apply exact ΔP_price * (1 + IVA).
  const oldFormulaSubtotal = oldPPriceCRC + shippingCRC + profitCRC + instCRC;
  const oldFormulaTPrice =
    oldFormulaSubtotal + Math.round(oldFormulaSubtotal * (ivaRate / 100));
  const hasConsistentBreakdown =
    profitCRC > 0 && Math.abs(oldFormulaTPrice - oldTPriceCRC) <= Math.max(5000, Math.round(oldTPriceCRC * 0.03));

  let updatedTPriceCRC: number;
  let newIvaCRC: number;

  if (hasConsistentBreakdown) {
    const newSubtotal = newPPriceCRC + shippingCRC + profitCRC + instCRC;
    newIvaCRC = Math.round(newSubtotal * (ivaRate / 100));
    updatedTPriceCRC = newSubtotal + newIvaCRC;
  } else {
    const deltaPWithIva = Math.round((newPPriceCRC - oldPPriceCRC) * (1 + ivaRate / 100));
    updatedTPriceCRC = Math.max(0, oldTPriceCRC + deltaPWithIva);
    newIvaCRC = Math.round(updatedTPriceCRC * (ivaRate / (100 + ivaRate)));
  }

  const crcDiff = updatedTPriceCRC - oldTPriceCRC;

  if (usdDiff > 0 && crcDiff >= 100) {
    // Price INCREASED
    let nextOriginalPriceCRC = updatedTPriceCRC;
    let nextDiscountPercent = 0;

    if ((product.discountPercent || 0) > 0 && oldOriginalPriceCRC > updatedTPriceCRC) {
      nextOriginalPriceCRC = oldOriginalPriceCRC;
      nextDiscountPercent = Math.max(
        0,
        Math.min(99, Math.round(((oldOriginalPriceCRC - updatedTPriceCRC) / oldOriginalPriceCRC) * 100))
      );
    }

    return {
      direction: "INCREASE",
      oldSupplierPriceUSD,
      newSupplierPriceUSD: cleanNewSupplierUSD,
      dealerDiscountPercent: dealerDisc,
      oldPPriceD,
      newPPriceD,
      oldPPriceCRC,
      newPPriceCRC,
      oldTPriceCRC,
      updatedTPriceCRC,
      newIvaCRC,
      exchangeRateUsed: rateToUse,
      computedDiscountPercent: nextDiscountPercent,
      nextOriginalPriceCRC,
      nextDiscountPercent,
    };
  }

  if (usdDiff < 0 && crcDiff <= -100) {
    // Price DECREASED -> calculate discount strictly of T_price vs updated T_price (NOT dealer's %)
    const discountBaseCRC =
      (product.discountPercent || 0) > 0 && oldOriginalPriceCRC > oldTPriceCRC
        ? oldOriginalPriceCRC
        : oldTPriceCRC;

    const computedDiscountPercent =
      discountBaseCRC > updatedTPriceCRC
        ? Math.max(
            1,
            Math.min(95, Math.round(((discountBaseCRC - updatedTPriceCRC) / discountBaseCRC) * 100))
          )
        : 0;

    return {
      direction: "DECREASE",
      oldSupplierPriceUSD,
      newSupplierPriceUSD: cleanNewSupplierUSD,
      dealerDiscountPercent: dealerDisc,
      oldPPriceD,
      newPPriceD,
      oldPPriceCRC,
      newPPriceCRC,
      oldTPriceCRC,
      updatedTPriceCRC,
      newIvaCRC,
      exchangeRateUsed: rateToUse,
      computedDiscountPercent,
      nextOriginalPriceCRC: discountBaseCRC,
      nextDiscountPercent: computedDiscountPercent,
    };
  }

  return unchangedResult;
}

export interface DailyPriceCheckSummary {
  runDateCR: string;
  triggeredBy: string;
  startedAt: string;
  completedAt: string;
  totalChecked: number;
  autoIncreasedCount: number;
  increaseQueuedCount: number;
  decreaseQueuedCount: number;
  unchangedCount: number;
  failedCount: number;
  skippedAlreadyRunning?: boolean;
  autoIncreasedProducts: Array<{
    productId: string;
    sku: string;
    nameEs: string;
    oldPPriceD: number;
    newPPriceD: number;
    oldTPriceCRC: number;
    newTPriceCRC: number;
  }>;
  queuedIncreases: Array<{
    alertId: string;
    productId: string;
    sku: string;
    nameEs: string;
    oldPPriceD: number;
    newPPriceD: number;
    oldTPriceCRC: number;
    proposedTPriceCRC: number;
  }>;
  queuedDecreases: Array<{
    alertId: string;
    productId: string;
    sku: string;
    nameEs: string;
    oldPPriceD: number;
    newPPriceD: number;
    oldTPriceCRC: number;
    proposedTPriceCRC: number;
    computedDiscountPercent: number;
  }>;
}

/**
 * Checks if the daily 3:00 AM Costa Rica price check has already run for today's CR date.
 */
export async function hasDailyPriceCheckRunToday(dateKey?: string): Promise<boolean> {
  const targetDateKey = dateKey || getCostaRicaClock().dateKey;
  try {
    const recentRuns = await prisma.auditLog.findMany({
      where: { action: "DAILY_PRICE_CHECK_RUN" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { newDataJson: true, createdAt: true },
    });
    for (const run of recentRuns) {
      if (run.newDataJson) {
        try {
          const parsed = JSON.parse(run.newDataJson);
          if (parsed?.runDateCR === targetDateKey) return true;
        } catch {}
      }
      if (getCostaRicaClock(run.createdAt).dateKey === targetDateKey) return true;
    }
  } catch (err) {
    console.warn("[HAS_DAILY_PRICE_CHECK_RUN_WARN]:", err);
  }
  return false;
}

/**
 * Executes the full catalog supplier price check across all active products with a supplierUrl.
 * Any price change (INCREASE or DECREASE, for any reason — supplier revision, cost change, promo, etc.)
 * is queued in `SupplierPriceDecrease` for explicit staff approval (NEVER modifying live prices automatically
 * and NEVER modifying shipping or profit).
 */
export async function runDailySupplierPriceCheck(options?: {
  triggeredBy?: string;
}): Promise<DailyPriceCheckSummary> {
  const triggeredBy = options?.triggeredBy || "MANUAL";
  const startedAt = new Date().toISOString();
  const runDateCR = getCostaRicaClock().dateKey;

  if (isPriceCheckRunning) {
    return {
      runDateCR,
      triggeredBy,
      startedAt,
      completedAt: new Date().toISOString(),
      totalChecked: 0,
      autoIncreasedCount: 0,
      increaseQueuedCount: 0,
      decreaseQueuedCount: 0,
      unchangedCount: 0,
      failedCount: 0,
      skippedAlreadyRunning: true,
      autoIncreasedProducts: [],
      queuedIncreases: [],
      queuedDecreases: [],
    };
  }

  isPriceCheckRunning = true;
  try {
    await ensureSupplierPriceDecreaseTable();

    const [activeRate, products, dealerBrands, vehicleBrands] = await Promise.all([
      getBccrSellRate(),
      prisma.product.findMany({
        where: {
          supplierUrl: { not: null },
          isArchived: false,
        },
      }),
      prisma.dealerBrand.findMany({
        select: {
          name: true,
          slug: true,
          code: true,
          redirectUrl: true,
          dealerDiscountPercent: true,
        },
      }),
      prisma.brand.findMany({
        select: {
          name: true,
          slug: true,
          dealerDiscountPercent: true,
        },
      }),
    ]);

    const combinedBrandRefs = [...dealerBrands, ...vehicleBrands];

    const autoIncreasedProducts: DailyPriceCheckSummary["autoIncreasedProducts"] = [];
    const queuedIncreases: DailyPriceCheckSummary["queuedIncreases"] = [];
    const queuedDecreases: DailyPriceCheckSummary["queuedDecreases"] = [];
    let unchangedCount = 0;
    let failedCount = 0;
    let totalChecked = 0;

    // Process in gentle batches of 4 to avoid triggering dealer anti-bot/rate-limits
    const BATCH_SIZE = 4;
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (prod) => {
          const url = (prod.supplierUrl || "").trim();
          if (!url) return;

          // EVP products use manual staff pricing (dealers.evopowersports.com has login-gated B2B pricing)
          // Never auto-overwrite P_price_D / T_price or queue false retail price changes for EVP
          if (isManualPriceSupplier({ supplierUrl: url, brandName: prod.brandName })) {
            unchangedCount++;
            return;
          }

          totalChecked++;
          try {
            const live = await fetchLiveSupplierAvailability(url);
            const isReliablePrice =
              live.success &&
              !live.rawDetails?.fallback &&
              typeof live.supplierPriceUSD === "number" &&
              Number.isFinite(live.supplierPriceUSD) &&
              live.supplierPriceUSD > 0;

            if (!isReliablePrice || !live.supplierPriceUSD) {
              failedCount++;
              return;
            }

            const effectiveDealerDiscount = resolveEffectiveDealerDiscount(combinedBrandRefs, {
              productDealerDiscount: prod.dealerDiscountPercent,
              brandName: prod.brandName,
              supplierUrl: url,
            });

            const calc = calculateDealerPriceUpdate(
              prod,
              live.supplierPriceUSD,
              effectiveDealerDiscount,
              activeRate,
              live.supplierSalePriceUSD
            );

            if (calc.direction === "INCREASE" || calc.direction === "DECREASE") {
              // QUEUE BOTH PRICE INCREASES AND DECREASES FOR STAFF APPROVAL
              // (Never overwrite live product price automatically; change can come for any reason at the supplier)
              const existingPending = await prisma.supplierPriceDecrease.findFirst({
                where: { productId: prod.id, status: "PENDING" },
              });

              const alertData = {
                productSku: prod.sku,
                productNameEs: prod.nameEs,
                productNameEn: prod.nameEn || prod.nameEs,
                productImageUrl: prod.imageUrl || "/images/logo.png",
                brandName: prod.brandName || null,
                supplierUrl: url,
                changeDirection: calc.direction,
                oldSupplierPriceUSD: calc.oldSupplierPriceUSD,
                newSupplierPriceUSD: calc.newSupplierPriceUSD,
                dealerDiscountPercent: calc.dealerDiscountPercent,
                oldPPriceD: calc.oldPPriceD,
                newPPriceD: calc.newPPriceD,
                oldPPriceCRC: calc.oldPPriceCRC,
                newPPriceCRC: calc.newPPriceCRC,
                oldTPriceCRC: calc.oldTPriceCRC,
                proposedTPriceCRC: calc.updatedTPriceCRC,
                proposedIvaCRC: calc.newIvaCRC,
                computedDiscountPercent: calc.direction === "DECREASE" ? calc.computedDiscountPercent : 0,
                exchangeRateUsed: calc.exchangeRateUsed,
                detectedAt: new Date(),
              };

              const savedAlert = existingPending
                ? await prisma.supplierPriceDecrease.update({
                    where: { id: existingPending.id },
                    data: alertData,
                  })
                : await prisma.supplierPriceDecrease.create({
                    data: {
                      productId: prod.id,
                      status: "PENDING",
                      ...alertData,
                    },
                  });

              await prisma.product.update({
                where: { id: prod.id },
                data: { supplierStockCheckedAt: new Date() },
              });

              if (calc.direction === "INCREASE") {
                queuedIncreases.push({
                  alertId: savedAlert.id,
                  productId: prod.id,
                  sku: prod.sku,
                  nameEs: prod.nameEs,
                  oldPPriceD: calc.oldPPriceD,
                  newPPriceD: calc.newPPriceD,
                  oldTPriceCRC: calc.oldTPriceCRC,
                  proposedTPriceCRC: calc.updatedTPriceCRC,
                });
              } else {
                queuedDecreases.push({
                  alertId: savedAlert.id,
                  productId: prod.id,
                  sku: prod.sku,
                  nameEs: prod.nameEs,
                  oldPPriceD: calc.oldPPriceD,
                  newPPriceD: calc.newPPriceD,
                  oldTPriceCRC: calc.oldTPriceCRC,
                  proposedTPriceCRC: calc.updatedTPriceCRC,
                  computedDiscountPercent: calc.computedDiscountPercent,
                });
              }
            } else {
              // UNCHANGED
              unchangedCount++;
              await prisma.product.update({
                where: { id: prod.id },
                data: {
                  supplierStockCheckedAt: new Date(),
                  ...(!prod.supplierLastPriceUSD && live.supplierPriceUSD
                    ? { supplierLastPriceUSD: live.supplierPriceUSD }
                    : {}),
                },
              });
            }
          } catch (prodErr) {
            failedCount++;
            console.warn(`[DAILY_PRICE_CHECK_PRODUCT_WARN] ${prod.sku}:`, prodErr);
          }
        })
      );

      if (i + BATCH_SIZE < products.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    const completedAt = new Date().toISOString();
    const summary: DailyPriceCheckSummary = {
      runDateCR,
      triggeredBy,
      startedAt,
      completedAt,
      totalChecked,
      autoIncreasedCount: 0,
      increaseQueuedCount: queuedIncreases.length,
      decreaseQueuedCount: queuedDecreases.length,
      unchangedCount,
      failedCount,
      autoIncreasedProducts,
      queuedIncreases,
      queuedDecreases,
    };

    await recordAuditLog({
      actorId: triggeredBy === "CRON_3AM_CR" ? "SYSTEM_CRON_3AM" : triggeredBy,
      actorEmail: triggeredBy,
      actorRole: triggeredBy === "CRON_3AM_CR" ? "SYSTEM" : "STAFF",
      action: "DAILY_PRICE_CHECK_RUN",
      entityType: "CATALOG",
      entityId: runDateCR,
      newData: {
        runDateCR,
        triggeredBy,
        totalChecked: summary.totalChecked,
        autoIncreasedCount: 0,
        increaseQueuedCount: summary.increaseQueuedCount,
        decreaseQueuedCount: summary.decreaseQueuedCount,
        unchangedCount: summary.unchangedCount,
        failedCount: summary.failedCount,
        completedAt,
      },
      details: `Revisión diaria de precios (${runDateCR}): ${summary.totalChecked} revisados, ${summary.increaseQueuedCount} alzas pendientes de aprobación, ${summary.decreaseQueuedCount} bajas pendientes de aprobación.`,
    });

    return summary;
  } finally {
    isPriceCheckRunning = false;
  }
}

/**
 * Resolves a pending supplier price change alert (INCREASE or DECREASE) chosen by staff:
 * - For DECREASE:
 *   - "DISCOUNT" / "APPROVE_AS_DISCOUNT": updates P_price_D & T_price (no change to shipping/profit) and marks the T_price drop as a visible product discount.
 *   - "PRICE_DECREASE" / "APPROVE_REGULAR": updates P_price_D & T_price (no change to shipping/profit) as a regular lower price (discountPercent = 0).
 * - For INCREASE:
 *   - "PRICE_INCREASE" / "APPROVE_AS_DISCOUNT" / "APPROVE_REGULAR": updates P_price_D & T_price (no change to shipping/profit) to the new higher supplier cost.
 * - "DISMISSED": rejects this supplier price change and leaves the live product price completely untouched.
 */
export async function resolvePriceDecreaseAlert(params: {
  alertId: string;
  action: PriceDecreaseResolutionAction;
  actorId?: string | null;
  actorEmail: string;
  actorRole: AuditActorRole;
}): Promise<{
  success: boolean;
  error?: string;
  alert?: any;
  product?: any;
  direction?: "INCREASE" | "DECREASE";
}> {
  await ensureSupplierPriceDecreaseTable();

  const alert = await prisma.supplierPriceDecrease.findUnique({
    where: { id: params.alertId },
  });

  if (!alert) {
    return { success: false, error: "Alerta de cambio de precio no encontrada." };
  }

  if (alert.status !== "PENDING") {
    return { success: false, error: "Esta alerta ya fue procesada anteriormente." };
  }

  const isIncrease =
    alert.changeDirection === "INCREASE" ||
    alert.proposedTPriceCRC > alert.oldTPriceCRC ||
    alert.newPPriceD > alert.oldPPriceD;
  const direction: "INCREASE" | "DECREASE" = isIncrease ? "INCREASE" : "DECREASE";

  const product = await prisma.product.findUnique({
    where: { id: alert.productId },
  });

  if (!product) {
    await prisma.supplierPriceDecrease.update({
      where: { id: alert.id },
      data: {
        status: "DISMISSED",
        resolutionType: "DISMISSED",
        resolvedBy: params.actorEmail,
        resolvedAt: new Date(),
      },
    });
    return { success: false, error: "El producto asociado ya no existe en el catálogo." };
  }

  if (params.action === "DISMISSED") {
    const updatedAlert = await prisma.supplierPriceDecrease.update({
      where: { id: alert.id },
      data: {
        status: "DISMISSED",
        resolutionType: "DISMISSED",
        resolvedBy: params.actorEmail,
        resolvedAt: new Date(),
      },
    });

    await recordAuditLog({
      actorId: params.actorId || params.actorEmail,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
      action: isIncrease ? "DISMISS_PRICE_INCREASE" : "DISMISS_PRICE_DECREASE",
      entityType: "PRODUCT",
      entityId: product.id,
      oldData: { priceCRC: product.priceCRC, processingPriceD: product.processingPriceD },
      newData: { alertId: alert.id, changeDirection: direction, proposedTPriceCRC: alert.proposedTPriceCRC },
      details: isIncrease
        ? `Alza de precio rechazada para ${product.sku} por ${params.actorEmail}`
        : `Baja de precio rechazada para ${product.sku} por ${params.actorEmail}`,
    });

    return { success: true, alert: updatedAlert, product, direction };
  }

  // Recompute cleanly against current product state to ensure shipping & profit are NEVER altered
  const activeRate = await getBccrSellRate();
  const effectiveDealerDisc = Math.max(
    0,
    Math.min(100, Number(alert.dealerDiscountPercent ?? product.dealerDiscountPercent) || 0)
  );
  const freshCalc = calculateDealerPriceUpdate(
    product,
    alert.newSupplierPriceUSD,
    effectiveDealerDisc,
    alert.exchangeRateUsed > 300 ? alert.exchangeRateUsed : activeRate
  );

  const nextPPriceD = alert.newPPriceD > 0 ? alert.newPPriceD : freshCalc.newPPriceD;
  const nextPPriceCRC = alert.newPPriceCRC > 0 ? alert.newPPriceCRC : freshCalc.newPPriceCRC;
  const nextTPriceCRC = alert.proposedTPriceCRC > 0 ? alert.proposedTPriceCRC : freshCalc.updatedTPriceCRC;
  const nextIvaCRC = alert.proposedIvaCRC > 0 ? alert.proposedIvaCRC : freshCalc.newIvaCRC;

  let nextOriginalPriceCRC = nextTPriceCRC;
  let nextDiscountPercent = 0;
  let nextAlertStatus = "APPROVED_PRICE_DECREASE";
  let storedResolutionType: string = "PRICE_DECREASE";
  let auditAction: AuditAction = "APPROVE_PRICE_DECREASE_REGULAR";
  let auditDetails = "";

  if (isIncrease) {
    // Price INCREASE approved by staff (no changes to shipping or profit)
    const oldOriginal = Math.max(product.priceCRC || 0, product.originalPriceCRC || 0);
    if ((product.discountPercent || 0) > 0 && oldOriginal > nextTPriceCRC) {
      nextOriginalPriceCRC = oldOriginal;
      nextDiscountPercent = Math.max(
        0,
        Math.min(99, Math.round(((oldOriginal - nextTPriceCRC) / oldOriginal) * 100))
      );
    } else {
      nextOriginalPriceCRC = nextTPriceCRC;
      nextDiscountPercent = 0;
    }
    nextAlertStatus = "APPROVED_PRICE_INCREASE";
    storedResolutionType = "PRICE_INCREASE";
    auditAction = "APPROVE_PRICE_INCREASE";
    auditDetails = `Alza de precio aprobada en ${product.sku}: P_price_D $${product.processingPriceD} → $${nextPPriceD}, T_price ₡${product.priceCRC} → ₡${nextTPriceCRC}`;
  } else if (params.action === "DISCOUNT" || params.action === "APPROVE_AS_DISCOUNT") {
    // Reflect decrease as a discount of T_price vs updated T_price (NOT dealer discount %)
    nextOriginalPriceCRC = Math.max(
      product.originalPriceCRC || 0,
      alert.oldTPriceCRC,
      product.priceCRC || 0
    );
    nextDiscountPercent =
      nextOriginalPriceCRC > nextTPriceCRC
        ? Math.max(
            1,
            Math.min(
              95,
              Math.round(((nextOriginalPriceCRC - nextTPriceCRC) / nextOriginalPriceCRC) * 100)
            )
          )
        : 0;
    nextAlertStatus = "APPROVED_DISCOUNT";
    storedResolutionType = "DISCOUNT";
    auditAction = "APPROVE_PRICE_DECREASE_DISCOUNT";
    auditDetails = `Baja aprobada como DESCUENTO (-${nextDiscountPercent}%) en ${product.sku}: P_price_D $${product.processingPriceD} → $${nextPPriceD}, T_price ₡${product.priceCRC} → ₡${nextTPriceCRC}`;
  } else {
    nextAlertStatus = "APPROVED_PRICE_DECREASE";
    storedResolutionType = "PRICE_DECREASE";
    auditAction = "APPROVE_PRICE_DECREASE_REGULAR";
    auditDetails = `Baja aprobada como PRECIO REGULAR (sin descuento) en ${product.sku}: P_price_D $${product.processingPriceD} → $${nextPPriceD}, T_price ₡${product.priceCRC} → ₡${nextTPriceCRC}`;
  }

  const updatedProduct = await prisma.product.update({
    where: { id: product.id },
    data: {
      supplierLastPriceUSD: alert.newSupplierPriceUSD,
      processingPriceD: nextPPriceD,
      processingPriceCRC: nextPPriceCRC,
      priceCRC: nextTPriceCRC,
      originalPriceCRC: nextOriginalPriceCRC,
      discountPercent: nextDiscountPercent,
      ivaCRC: nextIvaCRC,
      lockedExchangeRate: alert.exchangeRateUsed > 300 ? alert.exchangeRateUsed : activeRate,
      updatedAt: new Date(),
    },
  });

  const updatedAlert = await prisma.supplierPriceDecrease.update({
    where: { id: alert.id },
    data: {
      status: nextAlertStatus,
      resolutionType: storedResolutionType,
      computedDiscountPercent: nextDiscountPercent,
      resolvedBy: params.actorEmail,
      resolvedAt: new Date(),
    },
  });

  await recordAuditLog({
    actorId: params.actorId || params.actorEmail,
    actorEmail: params.actorEmail,
    actorRole: params.actorRole,
    action: auditAction,
    entityType: "PRODUCT",
    entityId: product.id,
    oldData: {
      sku: product.sku,
      processingPriceD: product.processingPriceD,
      priceCRC: product.priceCRC,
      originalPriceCRC: product.originalPriceCRC,
      discountPercent: product.discountPercent,
    },
    newData: {
      sku: product.sku,
      processingPriceD: updatedProduct.processingPriceD,
      priceCRC: updatedProduct.priceCRC,
      originalPriceCRC: updatedProduct.originalPriceCRC,
      discountPercent: updatedProduct.discountPercent,
      changeDirection: direction,
      resolutionType: storedResolutionType,
    },
    details: auditDetails,
  });

  return { success: true, alert: updatedAlert, product: updatedProduct, direction };
}

/**
 * Batch resolves multiple pending supplier price change alerts (increases and/or decreases) in a single request.
 */
export async function resolvePriceAlertsBatch(params: {
  alertIds: string[];
  action: PriceDecreaseResolutionAction;
  actorId?: string | null;
  actorEmail: string;
  actorRole: AuditActorRole;
}): Promise<{
  success: boolean;
  processedCount: number;
  failedCount: number;
  approvedIncreases: number;
  approvedDecreases: number;
  dismissedCount: number;
  errors: Array<{ alertId: string; error: string }>;
}> {
  const uniqueIds = Array.from(
    new Set((params.alertIds || []).map((id) => String(id || "").trim()).filter(Boolean))
  );
  let processedCount = 0;
  let failedCount = 0;
  let approvedIncreases = 0;
  let approvedDecreases = 0;
  let dismissedCount = 0;
  const errors: Array<{ alertId: string; error: string }> = [];

  for (const alertId of uniqueIds) {
    const res = await resolvePriceDecreaseAlert({
      alertId,
      action: params.action,
      actorId: params.actorId,
      actorEmail: params.actorEmail,
      actorRole: params.actorRole,
    });
    if (res.success) {
      processedCount++;
      if (params.action === "DISMISSED") {
        dismissedCount++;
      } else if (res.direction === "INCREASE") {
        approvedIncreases++;
      } else {
        approvedDecreases++;
      }
    } else {
      failedCount++;
      errors.push({ alertId, error: res.error || "Error al procesar alerta" });
    }
  }

  return {
    success: processedCount > 0 || failedCount === 0,
    processedCount,
    failedCount,
    approvedIncreases,
    approvedDecreases,
    dismissedCount,
    errors,
  };
}
