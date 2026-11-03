import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Trims a product SKU for clean rendering in printable PDF documents,
 * receipts, inspection forms, and service orders so long SKUs don't
 * expand table columns or blow up document dimensions.
 */
export function trimDocSku(sku?: string | null, maxLength = 18): string {
  if (!sku) return "ZXZ-ACC";
  const clean = String(sku).trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, Math.max(1, maxLength - 2))}…`;
}

