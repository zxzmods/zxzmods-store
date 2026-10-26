import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "VIDEO" | "PRODUCT" | null

    const whereClause: any = {
      isActive: true,
    };

    if (type) {
      whereClause.type = type.toUpperCase();
    }

    const items = await prisma.homePageItem.findMany({
      where: whereClause,
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error: any) {
    console.error("[HOMEPAGE_ITEMS_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch homepage items", items: [] },
      { status: 500 }
    );
  }
}
