import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStealthSession } from "@/lib/stealthAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        orderBy: { date: "desc" },
        take: limit,
        skip,
      }),
      prisma.transaction.count(),
    ]);

    return NextResponse.json({
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: unknown) {
    console.error("Error fetching transactions:", err);
    return NextResponse.json(
      { error: "Internal server error fetching transactions" },
      { status: 500 }
    );
  }
}
