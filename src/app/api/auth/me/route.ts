import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession, CUSTOMER_COOKIE_NAME } from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCustomerSession();

    if (!session) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!user || !user.isActive || user.isBanned) {
      const response = NextResponse.json({
        authenticated: false,
        user: null,
        isBanned: Boolean(user?.isBanned),
        banReason: user?.bannedReason || null,
      });
      response.cookies.delete(CUSTOMER_COOKIE_NAME);
      return response;
    }

    // Also fetch any garage vehicles associated with this user
    const vehicles = await prisma.garageVehicle.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
        phoneNumber: user.phoneNumber,
        role: user.role,
        createdAt: user.createdAt,
      },
      orders: user.orders,
      vehicles,
    });
  } catch (error) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json(
      { authenticated: false, error: "Failed to check session" },
      { status: 500 }
    );
  }
}
