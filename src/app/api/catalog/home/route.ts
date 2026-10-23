import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [brands, combos, performancePackages, featuredProducts, workshop] =
      await Promise.all([
        prisma.brand.findMany({
          include: {
            models: true,
          },
          orderBy: { name: "asc" },
        }),
        prisma.combo.findMany({
          orderBy: { createdAt: "desc" },
        }),
        prisma.performancePackage.findMany({
          orderBy: { stageNumber: "asc" },
        }),
        prisma.product.findMany({
          include: {
            category: true,
            compatibilities: true,
          },
          where: { featured: true, isArchived: false },
          orderBy: { createdAt: "desc" },
        }),
        prisma.workshopInfo.findUnique({
          where: { id: "zxz-hq" },
        }),
      ]);

    // Parse JSON fields safely
    const formattedBrands = brands.map((b) => ({
      ...b,
      models: b.models.map((m) => ({
        ...m,
        years: JSON.parse(m.yearsJson || "[]") as number[],
      })),
    }));

    const formattedCombos = combos.map((c) => ({
      ...c,
      items: JSON.parse(c.itemsJson || "[]") as string[],
    }));

    const formattedPackages = performancePackages.map((p) => ({
      ...p,
      features: JSON.parse(p.featuresJson || "[]") as string[],
    }));

    const formattedWorkshop = workshop
      ? {
          ...workshop,
          hours: JSON.parse(workshop.hoursJson || "{}"),
        }
      : null;

    return NextResponse.json(
      {
        success: true,
        data: {
          brands: formattedBrands,
          combos: formattedCombos,
          performancePackages: formattedPackages,
          featuredProducts,
          workshop: formattedWorkshop,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching homepage catalog:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch homepage data" },
      { status: 500 }
    );
  }
}
