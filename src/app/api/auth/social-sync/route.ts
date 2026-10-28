import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyFirebaseIdToken } from "@/lib/firebaseAdmin";
import {
  createCustomerSessionToken,
  CUSTOMER_COOKIE_NAME,
  CUSTOMER_SESSION_DURATION_MS,
} from "@/lib/customerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { provider = "google", idToken, uid, email, displayName, photoUrl, phoneNumber } = body;

    let verifiedUid = uid;
    let verifiedEmail = email;

    // Zero-trust verification: If idToken is provided, verify against Firebase Admin
    if (idToken) {
      const decoded = await verifyFirebaseIdToken(idToken);
      if (!decoded) {
        console.error("[SOCIAL_SYNC_ERROR] verifyFirebaseIdToken failed or returned null for token");
        return NextResponse.json(
          { success: false, error: "Token de autenticación inválido o expirado" },
          { status: 401 }
        );
      }
      verifiedUid = decoded.uid;
      verifiedEmail = decoded.email || verifiedEmail;
    } else {
      // In production, reject unverified social logins without an ID token
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { success: false, error: "Se requiere token criptográfico de autenticación en producción" },
          { status: 401 }
        );
      }
    }

    if (!verifiedUid || !verifiedEmail) {
      return NextResponse.json(
        { success: false, error: "UID y email requeridos para autenticación social" },
        { status: 400 }
      );
    }

    const cleanEmail = verifiedEmail.trim().toLowerCase();

    // Check if user is banned
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { isBanned: true, bannedReason: true },
    });
    if (existing?.isBanned) {
      return NextResponse.json(
        {
          success: false,
          error: "Esta cuenta ha sido suspendida por el administrador.",
          isBanned: true,
          banReason: existing.bannedReason,
        },
        { status: 403 }
      );
    }

    // Upsert user in database (preserving default avatar)
    const user = await prisma.user.upsert({
      where: { email: cleanEmail },
      update: {
        firebaseUid: verifiedUid,
        displayName: displayName || undefined,
        phoneNumber: phoneNumber || undefined,
      },
      create: {
        firebaseUid: verifiedUid,
        email: cleanEmail,
        displayName: displayName || null,
        photoUrl: null,
        phoneNumber: phoneNumber || null,
        role: "CUSTOMER",
      },
    });

    // Associate garage vehicles from cookie session to user
    try {
      const cookieStore = cookies();
      const garageSessionId = cookieStore.get("zxz_garage_session")?.value;
      if (garageSessionId) {
        await prisma.garageVehicle.updateMany({
          where: { sessionId: garageSessionId, userId: null },
          data: { userId: user.id },
        });
      }
    } catch (garageErr) {
      console.warn("[SOCIAL_SYNC_GARAGE_LINK_WARNING]:", garageErr);
    }

    // Generate cryptographically signed session token
    const sessionToken = createCustomerSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      provider,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });

    response.cookies.set(CUSTOMER_COOKIE_NAME, sessionToken, {
      path: "/",
      maxAge: Math.floor(CUSTOMER_SESSION_DURATION_MS / 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Error in /api/auth/social-sync:", error);
    return NextResponse.json(
      { success: false, error: "Error al sincronizar autenticación social" },
      { status: 500 }
    );
  }
}
