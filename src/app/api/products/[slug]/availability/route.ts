import { NextResponse } from "next/server";
import { syncProductAvailability, isAvailabilityStale } from "@/lib/supplierAvailability";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const { searchParams } = new URL(request.url);
    const forceFresh = searchParams.get("fresh") === "true";

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Identificador de producto requerido" },
        { status: 400 }
      );
    }

    // Attempt sync / check with 8-hour freshness policy
    const syncRes = await syncProductAvailability(slug, forceFresh);

    if (!syncRes.success || !syncRes.product) {
      // Check if product exists without supplier URL
      const prod = await prisma.product.findFirst({
        where: {
          OR: [{ slug }, { sku: slug }, { id: slug }],
        },
      });

      if (!prod) {
        return NextResponse.json(
          { success: false, error: "Producto no encontrado" },
          { status: 404 }
        );
      }

      // Return default US warehouse status if no supplier URL linked
      return NextResponse.json({
        success: true,
        availability: {
          status: prod.supplierStockStatus || "IN_STOCK",
          available: prod.supplierStockStatus !== "OUT_OF_STOCK" && prod.supplierStockStatus !== "UNAVAILABLE",
          stockCount: prod.supplierStockCount || null,
          platform: "MANUAL",
          messageEs: prod.supplierStockMessageEs || "Disponible para entrega o importación inmediata",
          messageEn: prod.supplierStockMessageEn || "In stock ready for immediate delivery or import",
          leadDaysMin: prod.supplierLeadDaysMin || 7,
          leadDaysMax: prod.supplierLeadDaysMax || 12,
          supplierUrl: prod.supplierUrl || null,
          supplierPriceUSD: prod.supplierLastPriceUSD || null,
          checkedAt: prod.supplierStockCheckedAt ? new Date(prod.supplierStockCheckedAt).toISOString() : new Date().toISOString(),
          isStale: false,
        },
      });
    }

    const p = syncRes.product;
    const isStale = isAvailabilityStale(p.supplierStockCheckedAt);

    return NextResponse.json({
      success: true,
      availability: {
        status: p.supplierStockStatus || "IN_STOCK",
        available: p.supplierStockStatus !== "OUT_OF_STOCK" && p.supplierStockStatus !== "UNAVAILABLE",
        stockCount: p.supplierStockCount || null,
        platform: p.supplierPlatform || "SHOPIFY",
        messageEs: p.supplierStockMessageEs || "Disponible para entrega o importación inmediata",
        messageEn: p.supplierStockMessageEn || "In stock ready for immediate delivery or import",
        leadDaysMin: p.supplierLeadDaysMin || 7,
        leadDaysMax: p.supplierLeadDaysMax || 12,
        supplierUrl: p.supplierUrl || null,
        supplierPriceUSD: p.supplierLastPriceUSD || null,
        checkedAt: p.supplierStockCheckedAt ? new Date(p.supplierStockCheckedAt).toISOString() : new Date().toISOString(),
        isStale,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/products/[slug]/availability:", error);
    return NextResponse.json(
      { success: false, error: "Error al consultar disponibilidad de proveedor" },
      { status: 500 }
    );
  }
}
