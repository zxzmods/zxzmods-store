import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

// In-memory sliding window rate limiter for email dispatch (per email & per IP)
interface RateLimitEntry {
  count: number;
  lastSentAt: number;
}
const emailRateLimitMap = new Map<string, RateLimitEntry>();
const ipRateLimitMap = new Map<string, RateLimitEntry>();

const MIN_INTERVAL_MS = process.env.NODE_ENV === "production" ? 60 * 1000 : 2000; // 2s in dev for easy testing
const MAX_PER_WINDOW = 5; // Max 5 requests per 15 minutes
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Formato de solicitud inválido" },
        { status: 400 }
      );
    }

    const { email, lang = "es" } = body || {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Correo electrónico no válido" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const now = Date.now();

    // 1. Check IP rate limit
    const ipRecord = ipRateLimitMap.get(ip);
    if (ipRecord) {
      if (now - ipRecord.lastSentAt > WINDOW_MS) {
        ipRateLimitMap.set(ip, { count: 1, lastSentAt: now });
      } else if (ipRecord.count >= 15) {
        return NextResponse.json(
          {
            success: false,
            error: "Demasiadas solicitudes desde esta dirección IP. Intenta más tarde.",
          },
          { status: 429 }
        );
      } else {
        ipRecord.count += 1;
      }
    } else {
      ipRateLimitMap.set(ip, { count: 1, lastSentAt: now });
    }

    // 2. Check Email rate limit
    const emailRecord = emailRateLimitMap.get(cleanEmail);
    if (emailRecord) {
      if (now - emailRecord.lastSentAt < MIN_INTERVAL_MS) {
        const waitSeconds = Math.ceil((MIN_INTERVAL_MS - (now - emailRecord.lastSentAt)) / 1000);
        return NextResponse.json(
          {
            success: false,
            error: `Espera ${waitSeconds} segundos antes de solicitar otro código.`,
          },
          { status: 429 }
        );
      }
      if (now - emailRecord.lastSentAt > WINDOW_MS) {
        emailRateLimitMap.set(cleanEmail, { count: 1, lastSentAt: now });
      } else if (emailRecord.count >= MAX_PER_WINDOW) {
        return NextResponse.json(
          {
            success: false,
            error: "Has excedido el límite de códigos para este correo. Intenta de nuevo en 15 minutos.",
          },
          { status: 429 }
        );
      } else {
        emailRecord.count += 1;
        emailRecord.lastSentAt = now;
      }
    } else {
      emailRateLimitMap.set(cleanEmail, { count: 1, lastSentAt: now });
    }

    // 3. Check if user is banned
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { isBanned: true, bannedReason: true },
    });
    if (existingUser?.isBanned) {
      return NextResponse.json(
        {
          success: false,
          error: "Esta cuenta se encuentra suspendida por el administrador.",
          isBanned: true,
          banReason: existingUser.bannedReason,
        },
        { status: 403 }
      );
    }

    // 4. Invalidate existing unused codes for this email
    await prisma.verificationCode.updateMany({
      where: { email: cleanEmail, used: false },
      data: { used: true },
    });

    // 4. Generate verification code (using temporary test code '616161' for test and access)
    const TEMPORARY_TEST_CODE = "616161";
    const code = TEMPORARY_TEST_CODE;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry for test code

    await prisma.verificationCode.create({
      data: {
        email: cleanEmail,
        code,
        expiresAt,
        used: false,
      },
    });

    // 5. Send the branded email
    const emailResult = await sendVerificationEmail({
      to: cleanEmail,
      code,
      lang: lang === "en" ? "en" : "es",
    });

    return NextResponse.json({
      success: true,
      message: "Código de verificación generado y enviado",
      previewUrl: emailResult.previewUrl,
      devCode: code,
    });
  } catch (error) {
    console.error("Error in /api/auth/send-code:", error);
    return NextResponse.json(
      { success: false, error: "Error al enviar el código de verificación" },
      { status: 500 }
    );
  }
}
