import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export interface StealthSessionPayload {
  userId: string;
  email: string;
  role: "MASTER" | "STAFF";
  displayName: string | null;
  permissions: Record<string, boolean>;
  issuedAt: number;
  expiresAt: number;
}

const SESSION_COOKIE_NAME = "zxz_sys_session";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

function getStealthSecret(): string {
  const secret = process.env.STEALTH_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[SECURITY_CRITICAL] STEALTH_SESSION_SECRET must be set and at least 32 characters in production.");
    }
    return "zxz_mods_dev_stealth_secret_minimum_32_characters_long_ok";
  }
  return secret;
}

// In-memory rate limiting defense for failed attempts (per IP)
interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCK_TIME_MS = 30 * 60 * 1000; // 30 minutes lock

/**
 * Checks and records rate limiting for an IP address.
 */
export function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if locked
  if (record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
  }

  // Check if window expired
  if (now - record.firstAttemptAt > WINDOW_MS) {
    rateLimitMap.delete(ip);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  return {
    allowed: record.attempts < MAX_ATTEMPTS,
    remainingAttempts: Math.max(0, MAX_ATTEMPTS - record.attempts),
  };
}

/**
 * Registers a failed login attempt for an IP.
 */
export function registerFailedAttempt(ip: string): { locked: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { attempts: 0, firstAttemptAt: now, lockedUntil: 0 };

  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCK_TIME_MS;
    rateLimitMap.set(ip, record);
    return { locked: true, retryAfterSeconds: Math.ceil(LOCK_TIME_MS / 1000) };
  }

  rateLimitMap.set(ip, record);
  return { locked: false };
}

/**
 * Resets rate limit on successful authentication.
 */
export function resetRateLimit(ip: string): void {
  rateLimitMap.delete(ip);
}

/**
 * Cryptographically hashes a password using scrypt with a unique random salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifies a password against the stored salt:hash using timing-safe comparison.
 */
export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, key] = combinedHash.split(":");
    if (!salt || !key) return false;

    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);

    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch (err) {
    console.error("[STEALTH_AUTH] Password verification failure:", err);
    return false;
  }
}

/**
 * Centralized, brute-force protected verification for actions requiring Master password elevation
 * (e.g., deleting orders, authorizing discounts, eliminating catalog products or combos).
 */
export async function verifyMasterElevationPassword(params: {
  ip: string;
  password: unknown;
  actorEmail?: string;
  actorId?: string;
  actionDescription: string;
}): Promise<{ success: true } | { success: false; error: string; status: number; retryAfterSeconds?: number }> {
  const { ip, password, actorEmail, actorId, actionDescription } = params;

  // 1. Check IP rate limits
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return {
      success: false,
      error: `Terminal bloqueada por intentos fallidos excesivos. Reintente en ${rate.retryAfterSeconds}s.`,
      status: 429,
      retryAfterSeconds: rate.retryAfterSeconds,
    };
  }

  // 2. Validate password presence and type
  if (!password || typeof password !== "string" || !password.trim()) {
    return {
      success: false,
      error: "Contraseña Master requerida para autorizar esta operación.",
      status: 400,
    };
  }

  // 3. Retrieve root Master record
  const masterUser = await prisma.user.findFirst({
    where: { role: "MASTER", isActive: true },
  });

  if (!masterUser || !masterUser.passwordHash) {
    return {
      success: false,
      error: "Cuenta Master no configurada para autorizar esta acción.",
      status: 500,
    };
  }

  // 4. Verify password with timing-safe scrypt
  const isValid = verifyPassword(password, masterUser.passwordHash);
  if (!isValid) {
    const failStatus = registerFailedAttempt(ip);

    // Log security failure
    try {
      const { recordAuditLog } = await import("@/lib/audit");
      await recordAuditLog({
        actorId: actorId || "unknown",
        actorEmail: actorEmail || "unknown",
        actorRole: "STAFF",
        action: "SYS_ALERT" as any,
        entityType: "SYSTEM",
        entityId: masterUser.id,
        details: `Intento fallido de elevación Master para '${actionDescription}' desde IP ${ip}${failStatus.locked ? " [IP BLOQUEADA]" : ""}`,
        ipAddress: ip,
      });
    } catch {}

    return {
      success: false,
      error: failStatus.locked
        ? "Contraseña Master incorrecta. Terminal bloqueada por 30 minutos por seguridad."
        : "Contraseña Master incorrecta. Operación no autorizada.",
      status: 401,
      retryAfterSeconds: failStatus.retryAfterSeconds,
    };
  }

  // 5. Success: reset rate limit & log elevation
  resetRateLimit(ip);

  try {
    const { recordAuditLog } = await import("@/lib/audit");
    await recordAuditLog({
      actorId: actorId || masterUser.id,
      actorEmail: actorEmail || masterUser.email,
      actorRole: "MASTER",
      action: "UPDATE_SYSTEM" as any,
      entityType: "SYSTEM",
      entityId: masterUser.id,
      details: `Autorización Master concedida exitosamente para '${actionDescription}' desde IP ${ip}`,
      ipAddress: ip,
    });
  } catch {}

  return { success: true };
}

/**
 * Signs and creates a tamper-proof session token.
 */
export function createSessionToken(payload: Omit<StealthSessionPayload, "issuedAt" | "expiresAt">): string {
  const now = Date.now();
  const fullPayload: StealthSessionPayload = {
    ...payload,
    issuedAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  };

  const payloadString = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getStealthSecret())
    .update(payloadString)
    .digest("base64url");

  return `${payloadString}.${signature}`;
}

/**
 * Decrypts, verifies signature, and ensures token expiration is valid.
 */
export function verifySessionToken(token: string): StealthSessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadString, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", getStealthSecret())
      .update(payloadString)
      .digest("base64url");

    // Timing safe comparison to prevent forgery
    const sigA = Buffer.from(signature);
    const sigB = Buffer.from(expectedSignature);
    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
      return null;
    }

    const payload: StealthSessionPayload = JSON.parse(
      Buffer.from(payloadString, "base64url").toString("utf8")
    );

    // Verify expiration
    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Server-side helper to retrieve current backdoor session.
 */
export async function getStealthSession(): Promise<StealthSessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  // Verify against database to check if user was revoked or de-activated
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, isActive: true, role: true, permissionsJson: true },
  });

  if (!user || !user.isActive || (user.role !== "MASTER" && user.role !== "STAFF")) {
    return null;
  }

  let dbPerms: Record<string, boolean> = {};
  try {
    if (user.permissionsJson) dbPerms = JSON.parse(user.permissionsJson);
  } catch {}

  return {
    ...payload,
    role: user.role as "MASTER" | "STAFF",
    permissions: dbPerms,
  };
}

/**
 * Server-side security guard that blocks unauthorized calls and returns 404/403.
 * Supports:
 * - "ROOT_MASTER": strictly reserved for root master (e.g. staff and credentials management)
 * - "MASTER": accessible by root master or staff profiles granted master permissions
 */
export async function requireStealthSession(requiredRole?: "MASTER" | "ROOT_MASTER"): Promise<
  | { authorized: true; session: StealthSessionPayload }
  | { authorized: false; response: NextResponse }
> {
  const session = await getStealthSession();

  if (!session) {
    // Return standard 404 to mimic non-existent route to scanners
    return {
      authorized: false,
      response: NextResponse.json({ error: "Not Found" }, { status: 404 }),
    };
  }

  if (requiredRole === "ROOT_MASTER") {
    if (session.role !== "MASTER") {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Forbidden: Root Master privileges required for staff management" },
          { status: 403 }
        ),
      };
    }
  } else if (requiredRole === "MASTER") {
    const hasMasterPerms =
      session.role === "MASTER" ||
      Boolean(session.permissions?.hasMasterPermissions) ||
      Boolean(session.permissions?.isMaster);

    if (!hasMasterPerms) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "Forbidden: Master permissions required" },
          { status: 403 }
        ),
      };
    }
  }

  return { authorized: true, session };
}

export { SESSION_COOKIE_NAME, SESSION_DURATION_MS };
