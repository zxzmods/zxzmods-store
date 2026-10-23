import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncAllKnownBrandsToDealerBrands, isVehicleBrand } from "@/lib/dealerBrands";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let rawBrands = await prisma.dealerBrand.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    if (rawBrands.length === 0) {
      await syncAllKnownBrandsToDealerBrands();
      rawBrands = await prisma.dealerBrand.findMany({
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      });
    }

    // Filter out any vehicle manufacturer brand (e.g. CFMOTO, Can-Am, Polaris, Honda, Yamaha)
    const brands = rawBrands.filter(
      (b) => !isVehicleBrand(b.name) && !isVehicleBrand(b.slug || "")
    );

    const response = NextResponse.json({
      success: true,
      brands,
    });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=120, stale-while-revalidate=300"
    );
    return response;
  } catch (error) {
    console.error("[DEALER_BRANDS_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dealer brands", brands: [] },
      { status: 500 }
    );
  }
}
