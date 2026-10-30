import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        models: true,
      },
      orderBy: { name: "asc" },
    });

    const allYearsSet = new Set<number>();

    // Filter brands with registered models and ensure CFMOTO is always first
    const activeBrands = brands.filter((b) => b.models && b.models.length > 0);
    activeBrands.sort((a, b) => {
      const aIsCfmoto = a.slug.toLowerCase() === "cfmoto";
      const bIsCfmoto = b.slug.toLowerCase() === "cfmoto";
      if (aIsCfmoto) return -1;
      if (bIsCfmoto) return 1;
      return a.name.localeCompare(b.name);
    });

    const structuredBrands = activeBrands.map((b) => ({
      slug: b.slug,
      name: b.name,
      logoUrl: b.logoUrl,
      defaultVehicleImageUrl: b.defaultVehicleImageUrl,
      models: b.models.map((m) => {
        const years = JSON.parse(m.yearsJson || "[]") as number[];
        years.forEach((y) => allYearsSet.add(y));
        return {
          slug: m.slug,
          name: m.name,
          category: m.category,
          modelCategory: m.modelCategory || null,
          imageUrl: m.imageUrl,
          pickupServiceAvailable: m.pickupServiceAvailable ?? true,
          years: years.sort((a, b) => b - a),
        };
      }),
    }));

    const sortedYears = Array.from(allYearsSet).sort((a, b) => b - a);

    return NextResponse.json(
      {
        success: true,
        data: {
          years: sortedYears,
          brands: structuredBrands,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching YMM data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch YMM data" },
      { status: 500 }
    );
  }
}
