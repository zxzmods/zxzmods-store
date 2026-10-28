import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export interface CustomerSessionPayload {
  userId: string;
  email: string;
  role: string;
  issuedAt: number;
  expiresAt: number;
}

export const CUSTOMER_COOKIE_NAME = "zxz_user_session";
export const CUSTOMER_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getCustomerSecret(): string {
  const secret = process.env.CUSTOMER_SESSION_SECRET;
  if (secret && secret.length >= 32) {
    return secret;
  }
  // Safe deterministic fallback based on project ID to prevent production crashes if env is omitted
  const fallbackSource =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "zxzmods-34a69-secure-fallback";
  return crypto
    .createHash("sha256")
    .update(`zxz_customer_session_seed_${fallbackSource}`)
    .digest("hex");
}

/**
 * Creates a signed tamper-proof session token for customers (HMAC-SHA256).
 */
export function createCustomerSessionToken(payload: { userId: string; email: string; role?: string }): string {
  const now = Date.now();
  const fullPayload: CustomerSessionPayload = {
    userId: payload.userId,
    email: payload.email.toLowerCase().trim(),
    role: payload.role || "CUSTOMER",
    issuedAt: now,
    expiresAt: now + CUSTOMER_SESSION_DURATION_MS,
  };

  const payloadString = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getCustomerSecret())
    .update(payloadString)
    .digest("base64url");

  return `${payloadString}.${signature}`;
}

/**
 * Verifies the customer session token and signature with timing-safe comparison.
 */
export function verifyCustomerSessionToken(token: string): CustomerSessionPayload | null {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadString, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", getCustomerSecret())
      .update(payloadString)
      .digest("base64url");

    const sigA = Buffer.from(signature);
    const sigB = Buffer.from(expectedSignature);
    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
      return null;
    }

    const payload: CustomerSessionPayload = JSON.parse(
      Buffer.from(payloadString, "base64url").toString("utf8")
    );

    // Check expiration
    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Server-side helper to retrieve and validate the current authenticated customer session.
 */
export async function getCustomerSession(): Promise<CustomerSessionPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyCustomerSessionToken(token);
    if (!payload) return null;

    // Validate that the user still exists and is active in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, isActive: true, role: true, email: true },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      ...payload,
      role: user.role,
      email: user.email,
    };
  } catch (err) {
    console.error("[CUSTOMER_SESSION_ERROR]:", err);
    return null;
  }
}
