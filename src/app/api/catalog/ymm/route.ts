import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sortVehicleBrands, sortVehicleModels } from "@/lib/sxsBrands";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        models: true,
      },
    });

    const allYearsSet = new Set<number>();

    // Filter brands with registered models and sort using canonical brand priority
    const activeBrands = sortVehicleBrands(brands.filter((b) => b.models && b.models.length > 0));

    const structuredBrands = activeBrands.map((b) => {
      const sortedModels = sortVehicleModels(
        b.models.map((m) => {
          let years: number[] = [];
          try {
            years = (JSON.parse(m.yearsJson || "[]") as number[]).sort((x, y) => y - x);
            years.forEach((y) => allYearsSet.add(y));
          } catch {
            years = [];
          }
          return {
            slug: m.slug,
            code: m.code,
            name: m.name,
            category: m.category,
            modelCategory: m.modelCategory || null,
            imageUrl: m.imageUrl,
            pickupServiceAvailable: m.pickupServiceAvailable ?? true,
            years,
            brandSlug: b.slug,
            brandName: b.name,
          };
        })
      );

      return {
        slug: b.slug,
        name: b.name,
        logoUrl: b.logoUrl,
        defaultVehicleImageUrl: b.defaultVehicleImageUrl,
        models: sortedModels,
      };
    });

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
