import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateComboAvailability } from "@/lib/comboAvailability";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const [combo, catalogProducts] = await Promise.all([
      prisma.combo.findUnique({
        where: { slug },
      }),
      prisma.product.findMany({
        select: {
          id: true,
          sku: true,
          slug: true,
          nameEs: true,
          nameEn: true,
          priceCRC: true,
          supplierStockStatus: true,
          stockStatus: true,
          isArchived: true,
          supplierLeadDaysMin: true,
          supplierLeadDaysMax: true,
        },
      }),
    ]);

    if (!combo) {
      return NextResponse.json(
        { success: false, error: "Combo not found" },
        { status: 404 }
      );
    }

    const availability = calculateComboAvailability(combo.itemsJson, catalogProducts);

    const sugProdIds: string[] = (() => {
      if ((combo as any).suggestedProductIdsJson) {
        try {
          const p = JSON.parse((combo as any).suggestedProductIdsJson);
          if (Array.isArray(p)) return p;
        } catch {}
      }
      return [];
    })();

    const sugComboIds: string[] = (() => {
      if ((combo as any).suggestedComboIdsJson) {
        try {
          const p = JSON.parse((combo as any).suggestedComboIdsJson);
          if (Array.isArray(p)) return p;
        } catch {}
      }
      return [];
    })();

    let suggestedProducts: any[] = [];
    if (sugProdIds.length > 0) {
      const idSet = new Set(sugProdIds.map((s) => s.toLowerCase()));
      suggestedProducts = catalogProducts.filter((p) =>
        idSet.has(p.id.toLowerCase()) || idSet.has(p.sku.toLowerCase()) || idSet.has(p.slug.toLowerCase())
      );
    }

    let suggestedCombos: any[] = [];
    if (sugComboIds.length > 0) {
      const cIdSet = new Set(sugComboIds.map((s) => s.toLowerCase()));
      const allDbCombos = await prisma.combo.findMany({
        where: { isArchived: false },
      });
      suggestedCombos = allDbCombos
        .filter((c) => cIdSet.has(c.id.toLowerCase()) || cIdSet.has(c.slug.toLowerCase()))
        .map((c) => ({
          ...c,
          items: (() => {
            try { return JSON.parse(c.itemsJson || "[]"); } catch { return []; }
          })(),
        }));
    }

    return NextResponse.json({
      success: true,
      data: {
        combo: {
          ...combo,
          items: JSON.parse(combo.itemsJson || "[]") as string[],
          suggestedProductIds: sugProdIds,
          suggestedComboIds: sugComboIds,
          suggestedProducts,
          suggestedCombos,
          availability,
          stockStatus: availability.status,
          isAvailable: availability.available,
          leadDaysMin: availability.leadDaysMin,
          leadDaysMax: availability.leadDaysMax,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching combo by slug:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch combo" },
      { status: 500 }
    );
  }
}
