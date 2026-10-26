import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    // Only include brands with registered models and ensure CFMOTO is always first
    const activeBrands = brands.filter((b) => b.models && b.models.length > 0);
    activeBrands.sort((a, b) => {
      const aIsCfmoto = a.slug.toLowerCase() === "cfmoto";
      const bIsCfmoto = b.slug.toLowerCase() === "cfmoto";
      if (aIsCfmoto) return -1;
      if (bIsCfmoto) return 1;
      return a.name.localeCompare(b.name);
    });

    // Parse JSON fields safely
    const formattedBrands = activeBrands.map((b) => ({
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
          "Cache-Control": "no-store, no-cache, must-revalidate",
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
