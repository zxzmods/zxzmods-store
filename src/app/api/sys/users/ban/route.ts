import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStealthSession } from "@/lib/stealthAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/sys/users/ban?email=user@example.com
 * Master-only lookup endpoint.
 * STRICT REQUIREMENT: Only queries the database when an email is typed.
 */
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireStealthSession("MASTER");
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const { searchParams } = new URL(request.url);
    const emailParam = searchParams.get("email")?.trim() || "";

    // If no email was provided or too short to be a valid query, DO NOT query the database
    if (!emailParam || emailParam.length < 3) {
      return NextResponse.json({
        success: true,
        user: null,
        message: "No query executed: type a user email to search.",
      });
    }

    const cleanEmail = emailParam.toLowerCase();

    // Query exact match for the typed email to minimize load
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: cleanEmail,
        },
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        photoUrl: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        isBanned: true,
        bannedAt: true,
        bannedReason: true,
        bannedBy: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        user: null,
        searchedEmail: cleanEmail,
      });
    }

    // Fetch garage vehicles count for profile context
    const vehiclesCount = await prisma.garageVehicle.count({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isActive: user.isActive,
        isBanned: user.isBanned,
        bannedAt: user.bannedAt ? user.bannedAt.toISOString() : null,
        bannedReason: user.bannedReason,
        bannedBy: user.bannedBy,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        ordersCount: user._count.orders,
        vehiclesCount,
      },
    });
  } catch (error) {
    console.error("[SYS_USERS_BAN_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al consultar usuario por correo." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sys/users/ban
 * Master-only action to Ban or Unban a user profile.
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireStealthSession("MASTER");
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const { session } = authCheck;
    const body = await request.json().catch(() => ({}));
    const { email, action, reason } = body;

    if (!email || typeof email !== "string" || !["BAN", "UNBAN"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Email y acción válida ('BAN' o 'UNBAN') son requeridos." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Look up target user
    const targetUser = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail } },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: `No se encontró ningún usuario con el correo: ${cleanEmail}` },
        { status: 404 }
      );
    }

    // Safety 1: Master cannot ban themselves
    if (session.email.toLowerCase() === targetUser.email.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "Acción bloqueada: No puedes suspender tu propia cuenta de Master." },
        { status: 400 }
      );
    }

    // Safety 2: Cannot ban other Master accounts
    if (targetUser.role === "MASTER") {
      return NextResponse.json(
        { success: false, error: "Acción bloqueada: No se pueden suspender cuentas de nivel MASTER." },
        { status: 403 }
      );
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "unknown";

    if (action === "BAN") {
      const banReasonClean = (reason && typeof reason === "string" && reason.trim())
        ? reason.trim()
        : "Suspensión administrativa por Master";

      const updatedUser = await prisma.user.update({
        where: { id: targetUser.id },
        data: {
          isBanned: true,
          bannedAt: new Date(),
          bannedReason: banReasonClean,
          bannedBy: session.email,
          isActive: false,
        },
      });

      // Audit Log entry
      await prisma.auditLog.create({
        data: {
          actorId: session.userId,
          actorEmail: session.email,
          actorRole: session.role,
          action: "BAN_USER",
          entityType: "USER",
          entityId: targetUser.id,
          oldDataJson: JSON.stringify({ isBanned: targetUser.isBanned, isActive: targetUser.isActive }),
          newDataJson: JSON.stringify({ isBanned: true, bannedReason: banReasonClean, bannedBy: session.email, isActive: false }),
          details: `Usuario ${targetUser.email} (${targetUser.displayName || "Sin nombre"}) fue suspendido por Master (${session.email}). Motivo: ${banReasonClean}`,
          ipAddress: ip,
          userAgent,
        },
      });

      return NextResponse.json({
        success: true,
        message: `El usuario ${targetUser.email} ha sido suspendido/baneado exitosamente.`,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          displayName: updatedUser.displayName,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
          isBanned: updatedUser.isBanned,
          bannedAt: updatedUser.bannedAt ? updatedUser.bannedAt.toISOString() : null,
          bannedReason: updatedUser.bannedReason,
          bannedBy: updatedUser.bannedBy,
        },
      });
    } else {
      // action === "UNBAN"
      const updatedUser = await prisma.user.update({
        where: { id: targetUser.id },
        data: {
          isBanned: false,
          bannedAt: null,
          bannedReason: null,
          bannedBy: null,
          isActive: true,
        },
      });

      // Audit Log entry
      await prisma.auditLog.create({
        data: {
          actorId: session.userId,
          actorEmail: session.email,
          actorRole: session.role,
          action: "UNBAN_USER",
          entityType: "USER",
          entityId: targetUser.id,
          oldDataJson: JSON.stringify({ isBanned: targetUser.isBanned, bannedReason: targetUser.bannedReason }),
          newDataJson: JSON.stringify({ isBanned: false, bannedReason: null, bannedBy: null, isActive: true }),
          details: `Suspensión levantada para usuario ${targetUser.email} por Master (${session.email}).`,
          ipAddress: ip,
          userAgent,
        },
      });

      return NextResponse.json({
        success: true,
        message: `La suspensión de ${targetUser.email} ha sido levantada exitosamente.`,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          displayName: updatedUser.displayName,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
          isBanned: updatedUser.isBanned,
          bannedAt: null,
          bannedReason: null,
          bannedBy: null,
        },
      });
    }
  } catch (error) {
    console.error("[SYS_USERS_BAN_POST_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al procesar la acción de baneo." },
      { status: 500 }
    );
  }
}
