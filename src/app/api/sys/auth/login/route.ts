import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  registerFailedAttempt,
  resetRateLimit,
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
} from "@/lib/stealthAuth";
import { recordAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    // Determine client IP for brute-force defense
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // 1. Rate limiting check
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "TOO_MANY_ATTEMPTS",
          message: `Terminal locked due to excessive failed attempts. Try again in ${rateCheck.retryAfterSeconds}s.`,
          retryAfterSeconds: rateCheck.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "INVALID_PAYLOAD", message: "Missing email or password." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Find user in database
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Check role, activity status, and password
    if (
      !user ||
      !user.isActive ||
      user.isBanned ||
      (user.role !== "MASTER" && user.role !== "STAFF") ||
      !user.passwordHash
    ) {
      const failStatus = registerFailedAttempt(ip);
      return NextResponse.json(
        {
          success: false,
          error: "AUTH_FAILED",
          message: failStatus.locked
            ? "Authentication failure. Terminal locked for 30 minutes."
            : "Invalid credentials or unauthorized terminal access.",
        },
        { status: 401 }
      );
    }

    // 3. Verify password hash using timing-safe comparison
    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      const failStatus = registerFailedAttempt(ip);
      return NextResponse.json(
        {
          success: false,
          error: "AUTH_FAILED",
          message: failStatus.locked
            ? "Authentication failure. Terminal locked for 30 minutes."
            : "Invalid credentials or unauthorized terminal access.",
        },
        { status: 401 }
      );
    }

    // 4. Authentication success: reset rate limiter
    resetRateLimit(ip);

    // Update lastLoginAt timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Parse granular permissions
    let parsedPermissions: Record<string, boolean> = {};
    try {
      if (user.permissionsJson) {
        parsedPermissions = JSON.parse(user.permissionsJson);
      }
    } catch {
      parsedPermissions = {};
    }

    // Record audit trail entry
    await recordAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role as "MASTER" | "STAFF",
      action: "ACTOR_LOGIN" as any,
      entityType: "USER",
      entityId: user.id,
      details: `Successful stealth dev-console login from IP ${ip}`,
      ipAddress: ip,
      userAgent,
    });

    // 5. Generate secure cryptographically signed session token
    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role as "MASTER" | "STAFF",
      displayName: user.displayName,
      permissions: parsedPermissions,
    });

    // 6. Set secure HttpOnly cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        permissions: parsedPermissions,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
    });

    return response;
  } catch (error) {
    console.error("[STEALTH_LOGIN_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Server error processing authentication." },
      { status: 500 }
    );
  }
}
