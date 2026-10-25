import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  createCustomerSessionToken,
  CUSTOMER_COOKIE_NAME,
  CUSTOMER_SESSION_DURATION_MS,
} from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

// In-memory failed verification tracking per email
interface FailedAttemptRecord {
  attempts: number;
  lockedUntil: number;
}
const failedVerificationMap = new Map<string, FailedAttemptRecord>();
const MAX_VERIFY_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Formato de solicitud inválido" },
        { status: 400 }
      );
    }

    const { email, code, name } = body || {};

    if (!email || !code || typeof email !== "string" || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "Email y código son requeridos" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();
    const cleanName = typeof name === "string" && name.trim().length > 0 ? name.trim() : null;
    const now = Date.now();

    // Master test code bypass - STRICTLY prohibited unless explicitly enabled in local development
    const allowTestAuth =
      process.env.NODE_ENV === "development" &&
      process.env.ALLOW_TEST_AUTH === "true";
    const TEMPORARY_TEST_CODE = "616161";
    const isMasterTestCode = allowTestAuth && cleanCode === TEMPORARY_TEST_CODE;

    let validCode: any = null;

    if (!isMasterTestCode) {
      // 1. Check brute force lockout
      const failedRecord = failedVerificationMap.get(cleanEmail);
      if (failedRecord && failedRecord.lockedUntil > now) {
        const waitMinutes = Math.ceil((failedRecord.lockedUntil - now) / 60000);
        return NextResponse.json(
          {
            success: false,
            error: `Cuenta temporalmente bloqueada por múltiples intentos fallidos. Intenta en ${waitMinutes} minutos.`,
          },
          { status: 429 }
        );
      }

      // 2. Verify code in database
      validCode = await prisma.verificationCode.findFirst({
        where: {
          email: cleanEmail,
          code: cleanCode,
          used: false,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!validCode) {
        // Record failed attempt
        const attempts = (failedRecord?.attempts || 0) + 1;
        if (attempts >= MAX_VERIFY_ATTEMPTS) {
          failedVerificationMap.set(cleanEmail, {
            attempts,
            lockedUntil: now + LOCKOUT_MS,
          });

          // Invalidate active codes on max attempts
          await prisma.verificationCode.updateMany({
            where: { email: cleanEmail, used: false },
            data: { used: true },
          });

          return NextResponse.json(
            {
              success: false,
              error: "Has excedido el número máximo de intentos. Solicita un nuevo código.",
            },
            { status: 429 }
          );
        } else {
          failedVerificationMap.set(cleanEmail, {
            attempts,
            lockedUntil: 0,
          });
          const remaining = MAX_VERIFY_ATTEMPTS - attempts;
          return NextResponse.json(
            {
              success: false,
              error: `Código incorrecto o expirado. ${remaining} intento(s) restante(s).`,
            },
            { status: 401 }
          );
        }
      }

    }

    // Success: Clear failed attempts memory
    failedVerificationMap.delete(cleanEmail);

    const cookieStore = cookies();
    const garageSessionId = cookieStore.get("zxz_garage_session")?.value;

    // Atomic interactive transaction: mark code used, retrieve/create user, and associate garage vehicles
    const user = await prisma.$transaction(async (tx) => {
      if (validCode) {
        await tx.verificationCode.update({
          where: { id: validCode.id },
          data: { used: true },
        });
      }

      let existingUser = await tx.user.findUnique({
        where: { email: cleanEmail },
      });

      if (!existingUser) {
        existingUser = await tx.user.create({
          data: {
            firebaseUid: `email_${cleanEmail.replace(/[^a-zA-Z0-9]/g, "_")}`,
            email: cleanEmail,
            displayName: cleanName || null,
            role: "CUSTOMER",
            isActive: true,
            isBanned: false,
          },
        });
      } else if (cleanName && (!existingUser.displayName || existingUser.displayName !== cleanName)) {
        existingUser = await tx.user.update({
          where: { id: existingUser.id },
          data: { displayName: cleanName },
        });
      }

      // If user has a name, backfill any prior orders or service schedules that lacked a customerName
      const resolvedName = cleanName || existingUser.displayName;
      if (resolvedName) {
        await tx.order.updateMany({
          where: {
            userId: existingUser.id,
            customerName: null,
          },
          data: {
            customerName: resolvedName,
          },
        });
        await tx.serviceSchedule.updateMany({
          where: {
            userId: existingUser.id,
            clientName: null,
          },
          data: {
            clientName: resolvedName,
          },
        });
      }

      if (garageSessionId) {
        await tx.garageVehicle.updateMany({
          where: { sessionId: garageSessionId, userId: null },
          data: { userId: existingUser.id },
        });
      }

      return existingUser;
    });

    if (user && user.isBanned) {
      return NextResponse.json(
        {
          success: false,
          error: "Esta cuenta ha sido suspendida. Contacta a soporte para más detalles.",
          isBanned: true,
          banReason: user.bannedReason,
        },
        { status: 403 }
      );
    }

    // Generate signed customer session token
    const sessionToken = createCustomerSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });

    // Set secure signed cookie
    response.cookies.set(CUSTOMER_COOKIE_NAME, sessionToken, {
      path: "/",
      maxAge: Math.floor(CUSTOMER_SESSION_DURATION_MS / 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Error in /api/auth/verify-code:", error);
    return NextResponse.json(
      { success: false, error: "Error al verificar el código" },
      { status: 500 }
    );
  }
}
