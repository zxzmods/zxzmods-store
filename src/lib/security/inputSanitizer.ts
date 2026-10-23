/**
 * ==============================================================================
 * ZxZ MODS - Enterprise Input Sanitizer & Injection Defense Utility
 * Protects against:
 * - SQL Injection & SQL Probing ("SQL Promping")
 * - Cross-Site Scripting (XSS) & Stored Script Injection
 * - NoSQL / Prisma Query Filter Object Injection
 * - Path Traversal & Malicious URL Schemes
 * ==============================================================================
 */

// Known SQL probing and injection signatures (case-insensitive)
const SQL_PROBING_PATTERNS = [
  /(\b(union(\s+all)?)\b\s+select)/i,
  /(\bor\b\s+['"]?1['"]?\s*=\s*['"]?1)/i,
  /(\band\b\s+['"]?1['"]?\s*=\s*['"]?1)/i,
  /(\bselect\b.+\bfrom\b)/i,
  /(\binsert\b.+\binto\b)/i,
  /(\bdelete\b.+\bfrom\b)/i,
  /(\bdrop\b\s+(table|database|view|column))/i,
  /(\bupdate\b.+\bset\b)/i,
  /(\bexec(ute)?\b\s*\()/i,
  /(\bxp_cmdshell\b)/i,
  /(\bwaitfor\s+delay\b)/i,
  /(\bsleep\s*\(\s*\d+\s*\))/i,
  /(\bbenchmark\s*\(\s*\d+)/i,
  /(--|\/\*|\*\/|@@version|char\s*\(|concat\s*\()/i,
];

// Dangerous HTML / JavaScript injection signatures
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /on\w+\s*=/gi, // onload=, onerror=, onclick=, onmouseover=
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
];

/**
 * Checks if a string contains known SQL probing or injection patterns.
 */
export function containsSqlProbing(input: unknown): boolean {
  if (typeof input !== "string") return false;
  const str = input.trim();
  return SQL_PROBING_PATTERNS.some((pattern) => pattern.test(str));
}

/**
 * Validates and sanitizes a search query string.
 * Strips dangerous characters and enforces strict length bounds.
 */
export function sanitizeSearchQuery(query: unknown, maxLength: number = 80): string {
  if (!query || typeof query !== "string") return "";
  
  // Reject obvious SQL probing attempts immediately by returning empty
  if (containsSqlProbing(query)) {
    return "";
  }

  return query
    .slice(0, maxLength)
    .replace(/[<>'"\\;\0]/g, "") // remove SQL and HTML delimiter characters
    .trim();
}

/**
 * Sanitizes user-entered text (comments, notes, customer names, addresses)
 * Strips executable HTML/script tags and normalizes whitespace.
 */
export function sanitizePlainText(input: unknown, maxLength: number = 1000): string {
  if (!input || typeof input !== "string") return "";

  let cleaned = input.slice(0, maxLength);

  // Strip known XSS patterns
  for (const pattern of XSS_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Escape basic HTML characters to prevent rendering attacks
  cleaned = cleaned
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();

  return cleaned;
}

/**
 * Validates an ID or slug parameter against safe alphanumeric patterns.
 * Prevents path traversal, SQL injection, and malformed identifiers.
 */
export function isValidIdentifier(id: unknown): boolean {
  if (typeof id !== "string") return false;
  const trimmed = id.trim();
  if (trimmed.length < 1 || trimmed.length > 128) return false;
  // Allows CUID, UUID, standard slugs, and order numbers e.g. "ZXZ-20261021-1234"
  return /^[a-zA-Z0-9_\-\.]+$/.test(trimmed);
}

/**
 * Validates that an uploaded payment slip or media URL is strictly from trusted sources.
 * Rejects javascript:, external untrusted origins, data: URIs, or SSRF targets.
 */
export function isValidStorageUrl(url: unknown): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();

  // Trusted local upload path
  if (trimmed.startsWith("/uploads/") && !trimmed.includes("..")) {
    return true;
  }

  // Trusted Google Cloud Storage URLs
  if (
    trimmed.startsWith("https://storage.googleapis.com/") ||
    trimmed.startsWith("https://firebasestorage.googleapis.com/")
  ) {
    return true;
  }

  // Relative image paths inside public directory
  if (trimmed.startsWith("/images/") && !trimmed.includes("..")) {
    return true;
  }

  // Check canonical domain if configured
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://zxzmods.com";
  try {
    const parsed = new URL(trimmed);
    const parsedApp = new URL(appUrl);
    if (parsed.hostname === parsedApp.hostname && (parsed.pathname.startsWith("/uploads/") || parsed.pathname.startsWith("/images/"))) {
      return true;
    }
  } catch {}

  return false;
}

/**
 * Ensures an incoming parameter is strictly a primitive string.
 * Prevents object injection into Prisma filters (e.g. { id: { not: null } }).
 */
export function ensureSafeString(value: unknown, fallback: string = ""): string {
  if (typeof value === "string") {
    // If the string contains SQL probing, fallback to safe default
    if (containsSqlProbing(value)) return fallback;
    return value.trim();
  }
  return fallback;
}

/**
 * Ensures an incoming parameter is strictly a safe integer within bounds.
 */
export function ensureSafeInt(value: unknown, min: number = 0, max: number = 1000000000, fallback: number = 0): number {
  if (typeof value === "number" && !isNaN(value) && isFinite(value)) {
    return Math.max(min, Math.min(max, Math.round(value)));
  }
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && isFinite(parsed)) {
      return Math.max(min, Math.min(max, parsed));
    }
  }
  return fallback;
}
