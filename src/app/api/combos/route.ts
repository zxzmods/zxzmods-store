import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateComboAvailability } from "@/lib/comboAvailability";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    // Fetch all catalog products for live stock calculations
    const catalogProducts = await prisma.product.findMany({
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
    });

    if (slug) {
      const combo = await prisma.combo.findUnique({
        where: { slug },
      });

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
        const fullProds = await prisma.product.findMany({
          where: { isArchived: false },
          select: {
            id: true,
            sku: true,
            slug: true,
            nameEs: true,
            nameEn: true,
            priceCRC: true,
            originalPriceCRC: true,
            discountPercent: true,
            imageUrl: true,
            supplierStockStatus: true,
            stockStatus: true,
          },
        });
        suggestedProducts = fullProds.filter((p) =>
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
            parameters: (() => {
              if (combo.parametersJson) {
                try {
                  const p = JSON.parse(combo.parametersJson);
                  if (Array.isArray(p)) return p;
                } catch {}
              }
              return [];
            })(),
            availability,
            stockStatus: availability.status,
            isAvailable: availability.available,
            leadDaysMin: availability.leadDaysMin,
            leadDaysMax: availability.leadDaysMax,
            reviews: (() => {
              if (combo.reviews) {
                try {
                  const parsed = JSON.parse(combo.reviews);
                  if (parsed && typeof parsed.stars === "number") return parsed;
                } catch {}
              }
              return null;
            })(),
          },
        },
      });
    }

    const includeArchived = searchParams.get("includeArchived") === "true";

    const whereClause: any = {};
    if (!includeArchived) {
      whereClause.isArchived = false;
    }

    if (category && category !== "all") {
      whereClause.category = category;
    }

    if (search && search.trim() !== "") {
      const q = search.trim();
      whereClause.OR = [
        { titleEs: { contains: q } },
        { titleEn: { contains: q } },
        { descriptionEs: { contains: q } },
        { descriptionEn: { contains: q } },
        { badgeEs: { contains: q } },
        { badgeEn: { contains: q } },
      ];
    }

    const combos = await prisma.combo.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    const formattedCombos = combos.map((c) => {
      const availability = calculateComboAvailability(c.itemsJson, catalogProducts);
      return {
        ...c,
        items: JSON.parse(c.itemsJson || "[]") as string[],
        suggestedProductIds: (() => {
          if ((c as any).suggestedProductIdsJson) {
            try {
              const p = JSON.parse((c as any).suggestedProductIdsJson);
              if (Array.isArray(p)) return p;
            } catch {}
          }
          return [];
        })(),
        suggestedComboIds: (() => {
          if ((c as any).suggestedComboIdsJson) {
            try {
              const p = JSON.parse((c as any).suggestedComboIdsJson);
              if (Array.isArray(p)) return p;
            } catch {}
          }
          return [];
        })(),
        parameters: (() => {
          if (c.parametersJson) {
            try {
              const p = JSON.parse(c.parametersJson);
              if (Array.isArray(p)) return p;
            } catch {}
          }
          return [];
        })(),
        availability,
        stockStatus: availability.status,
        isAvailable: availability.available,
        leadDaysMin: availability.leadDaysMin,
        leadDaysMax: availability.leadDaysMax,
        reviews: (() => {
          if (c.reviews) {
            try {
              const parsed = JSON.parse(c.reviews);
              if (parsed && typeof parsed.stars === "number") return parsed;
            } catch {}
          }
          return null;
        })(),
      };
    });

    // Extract dynamic unique categories directly from loaded combos
    const uniqueCategories = Array.from(
      new Set(combos.map((c) => c.category).filter(Boolean))
    );

    const response = NextResponse.json({
      success: true,
      data: {
        combos: formattedCombos,
        categories: uniqueCategories,
      },
    });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );
    return response;
  } catch (error) {
    console.error("Error fetching combos:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch combos" },
      { status: 500 }
    );
  }
}
