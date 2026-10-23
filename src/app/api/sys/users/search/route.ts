import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim();

    if (!query) {
      return NextResponse.json({ success: true, users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: query } },
          { displayName: { contains: query } },
          { phoneNumber: { contains: query } },
        ],
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
      },
      take: 15,
    });

    const userIds = users.map((u) => u.id);
    const garageVehicles = await prisma.garageVehicle.findMany({
      where: { userId: { in: userIds } },
    });

    const enrichedUsers = users.map((u) => {
      const userVehicles = garageVehicles.filter((v) => v.userId === u.id);
      return {
        ...u,
        vehicles: userVehicles,
      };
    });

    return NextResponse.json({ success: true, users: enrichedUsers });
  } catch (error) {
    console.error("[SYS_USER_SEARCH_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search users" },
      { status: 500 }
    );
  }
}
