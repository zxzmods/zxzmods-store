import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const QUOTATION_STATUS = "COTIZACION";
export const QUOTATION_EXPIRATION_DAYS = 60; // 2 months

let lastCleanupTimestamp = 0;
const CLEANUP_THROTTLE_MS = 60 * 60 * 1000; // Throttle to at most once per hour

/**
 * Erases orders with status 'COTIZACION' if they haven't been updated or paid in 2 months (60 days).
 */
export async function cleanExpiredQuotations(): Promise<number> {
  const now = Date.now();
  if (now - lastCleanupTimestamp < CLEANUP_THROTTLE_MS) {
    return 0;
  }
  lastCleanupTimestamp = now;

  try {
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - QUOTATION_EXPIRATION_DAYS);

    const result = await prisma.order.deleteMany({
      where: {
        status: { in: ["COTIZACION", "cotizacion"] },
        updatedAt: { lt: twoMonthsAgo },
      },
    });

    if (result.count > 0) {
      console.log(`[QUOTATION_CLEANUP] Deleted ${result.count} expired quotations older than 60 days.`);
    }

    return result.count;
  } catch (error) {
    console.error("[QUOTATION_CLEANUP_ERROR]:", error);
    return 0;
  }
}

/**
 * Returns remaining days before a quotation expires.
 */
export function getQuotationDaysRemaining(updatedAt: Date | string): number {
  const updatedDate = new Date(updatedAt);
  const expiryDate = new Date(updatedDate);
  expiryDate.setDate(expiryDate.getDate() + QUOTATION_EXPIRATION_DAYS);
  const diffMs = expiryDate.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Formats order number, e.g. COT-123456 or ZXZ-123456 using cryptographically secure random integers.
 */
export function generateOrderNumber(isQuotation = false): string {
  const prefix = isQuotation ? "COT" : "ZXZ";
  const randomSuffix = crypto.randomInt(100000, 1000000);
  return `${prefix}-${randomSuffix}`;
}

/**
 * Generates a high-entropy cryptographically secure claim token for orders.
 */
export function generateSecureClaimToken(): string {
  return `claim_${crypto.randomBytes(24).toString("hex")}`;
}
