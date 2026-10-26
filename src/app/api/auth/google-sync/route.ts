import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyFirebaseIdToken } from "@/lib/firebaseAdmin";
import {
  createCustomerSessionToken,
  CUSTOMER_COOKIE_NAME,
  CUSTOMER_SESSION_DURATION_MS,
} from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { idToken, uid, email, displayName, photoUrl, phoneNumber } = body;

    let verifiedUid = uid;
    let verifiedEmail = email;

    if (idToken) {
      const decoded = await verifyFirebaseIdToken(idToken);
      if (!decoded) {
        return NextResponse.json(
          { success: false, error: "Token de Google inválido o expirado" },
          { status: 401 }
        );
      }
      verifiedUid = decoded.uid;
      verifiedEmail = decoded.email || verifiedEmail;
    } else if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, error: "Token requerido en producción" },
        { status: 401 }
      );
    }

    if (!verifiedUid || !verifiedEmail) {
      return NextResponse.json(
        { success: false, error: "UID y email requeridos para autenticación de Google" },
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
    const cookieStore = cookies();
    const garageSessionId = cookieStore.get("zxz_garage_session")?.value;
    if (garageSessionId) {
      await prisma.garageVehicle.updateMany({
        where: { sessionId: garageSessionId, userId: null },
        data: { userId: user.id },
      });
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

    response.cookies.set(CUSTOMER_COOKIE_NAME, sessionToken, {
      path: "/",
      maxAge: Math.floor(CUSTOMER_SESSION_DURATION_MS / 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Error in /api/auth/google-sync:", error);
    return NextResponse.json(
      { success: false, error: "Error al sincronizar usuario de Google" },
      { status: 500 }
    );
  }
}
