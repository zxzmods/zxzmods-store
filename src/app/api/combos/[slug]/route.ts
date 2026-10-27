import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateComboAvailability } from "@/lib/comboAvailability";

export const dynamic = "force-dynamic";

function extractComboImages(combo: any, catalogProducts: any[]) {
  const imgs: string[] = [];
  if (combo.imageUrl && typeof combo.imageUrl === "string" && combo.imageUrl.trim()) {
    imgs.push(combo.imageUrl.trim());
  }

  // Parse combo's own imagesJson
  if (combo.imagesJson) {
    try {
      const parsed = JSON.parse(combo.imagesJson);
      if (Array.isArray(parsed)) {
        parsed.forEach((img: any) => {
          const s = typeof img === "string" ? img.trim() : "";
          if (s && !imgs.includes(s)) imgs.push(s);
        });
      }
    } catch {}
  }

  // Parse combo parameters for option images
  if (combo.parametersJson) {
    try {
      const params = JSON.parse(combo.parametersJson);
      if (Array.isArray(params)) {
        params.forEach((param: any) => {
          if (Array.isArray(param.options)) {
            param.options.forEach((opt: any) => {
              const optImg = typeof opt.imageUrl === "string" ? opt.imageUrl.trim() : "";
              if (optImg && !imgs.includes(optImg)) imgs.push(optImg);
            });
          }
        });
      }
    } catch {}
  }

  // Parse combo included items and find matching products to inherit their images
  if (combo.itemsJson) {
    try {
      const items = JSON.parse(combo.itemsJson);
      if (Array.isArray(items)) {
        items.forEach((rawItem: any) => {
          if (typeof rawItem !== "string") return;
          const match = rawItem.match(/\[([A-Za-z0-9\-_]+)\]/);
          const sku = match ? match[1].toLowerCase() : null;
          const matchedProd = catalogProducts.find((p) => {
            if (sku && (p.sku?.toLowerCase() === sku || p.slug?.toLowerCase() === sku || p.id.toLowerCase() === sku)) return true;
            const rawLower = rawItem.toLowerCase();
            if (p.nameEs && rawLower.includes(p.nameEs.toLowerCase())) return true;
            if (p.nameEn && rawLower.includes(p.nameEn.toLowerCase())) return true;
            return false;
          });

          if (matchedProd) {
            if (matchedProd.imageUrl && typeof matchedProd.imageUrl === "string") {
              const s = matchedProd.imageUrl.trim();
              if (s && !imgs.includes(s)) imgs.push(s);
            }
            if (matchedProd.imagesJson) {
              try {
                const parsed = JSON.parse(matchedProd.imagesJson);
                if (Array.isArray(parsed)) {
                  parsed.forEach((img: any) => {
                    const s = typeof img === "string" ? img.trim() : "";
                    if (s && !imgs.includes(s)) imgs.push(s);
                  });
                }
              } catch {}
            }
            if (matchedProd.additionalImagesJson) {
              try {
                const parsed = JSON.parse(matchedProd.additionalImagesJson);
                if (Array.isArray(parsed)) {
                  parsed.forEach((img: any) => {
                    const s = typeof img === "string" ? img.trim() : "";
                    if (s && !imgs.includes(s)) imgs.push(s);
                  });
                }
              } catch {}
            }
          }
        });
      }
    } catch {}
  }

  if (imgs.length === 0) imgs.push("/images/sxs/z10_front.png");
  return imgs;
}

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
          imageUrl: true,
          imagesJson: true,
          additionalImagesJson: true,
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
    const comboImgs = extractComboImages(combo, catalogProducts);

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
          imgs: comboImgs,
          images: comboImgs,
          items: JSON.parse(combo.itemsJson || "[]") as string[],
          parameters: (() => {
            if (combo.parametersJson) {
              try {
                const p = JSON.parse(combo.parametersJson);
                if (Array.isArray(p)) return p;
              } catch {}
            }
            return [];
          })(),
          suggestedProductIds: sugProdIds,
          suggestedComboIds: sugComboIds,
          suggestedProducts,
          suggestedCombos,
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
  } catch (error) {
    console.error("Error fetching combo by slug:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch combo" },
      { status: 500 }
    );
  }
}
