import { NextResponse } from "next/server";
import { getStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getStealthSession();

    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    // Fetch fresh database record
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        role: true,
        displayName: true,
        permissionsJson: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    let parsedPermissions: Record<string, boolean> = {};
    try {
      if (user.permissionsJson) {
        parsedPermissions = JSON.parse(user.permissionsJson);
      }
    } catch {
      parsedPermissions = {};
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        permissions: parsedPermissions,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (error) {
    console.error("[STEALTH_ME_ERROR]:", error);
    return NextResponse.json(
      { authenticated: false, error: "Failed to verify session" },
      { status: 500 }
    );
  }
}
