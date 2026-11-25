import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateComboAvailability } from "@/lib/comboAvailability";
import {
  deriveComboCompatibilityFromProducts,
  formatCompListWithYears,
  getRecommendedFillerProducts,
  getRecommendedFillerCombos,
  hydrateComboChoiceParameters,
  extractInheritedComboProductParameters,
} from "@/lib/products";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    const [combo, rawCatalogProducts] = await Promise.all([
      prisma.combo.findUnique({
        where: { slug },
      }),
      prisma.product.findMany({
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
          isInstallationIncluded: true,
          installationPriceCRC: true,
          imageUrl: true,
          imagesJson: true,
          additionalImagesJson: true,
          brandName: true,
          brandJson: true,
          categoryJson: true,
          compJson: true,
          modelYearCompatibilityJson: true,
          supplierStockStatus: true,
          stockStatus: true,
          isArchived: true,
          supplierLeadDaysMin: true,
          supplierLeadDaysMax: true,
          parametersJson: true,
        },
      }),
    ]);

    if (!combo || combo.isArchived) {
      return NextResponse.json(
        { success: false, error: "Combo not found" },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
    }

    const catalogProducts = rawCatalogProducts.map((p: any) => {
      const comp: string[] = (() => {
        if (p.compJson) {
          try {
            const parsed = JSON.parse(p.compJson);
            if (Array.isArray(parsed)) return parsed;
          } catch {}
        }
        return [];
      })();
      const category: string[] = (() => {
        if (p.categoryJson) {
          try {
            const parsed = JSON.parse(p.categoryJson);
            if (Array.isArray(parsed)) return parsed;
          } catch {}
        }
        return [];
      })();
      const brand: string[] = (() => {
        const list: string[] = [];
        if (p.brandName) list.push(p.brandName);
        if (p.brandJson) {
          try {
            const parsed = JSON.parse(p.brandJson);
            if (Array.isArray(parsed)) {
              parsed.forEach((b: string) => {
                if (b && !list.includes(b)) list.push(b);
              });
            }
          } catch {}
        }
        return list;
      })();
      const imgs: string[] = [];
      if (p.imageUrl && typeof p.imageUrl === "string" && p.imageUrl.trim()) {
        imgs.push(p.imageUrl.trim());
      }
      if (p.imagesJson) {
        try {
          const parsed = JSON.parse(p.imagesJson);
          if (Array.isArray(parsed)) {
            parsed.forEach((img: string) => {
              if (typeof img === "string" && img.trim() && !imgs.includes(img.trim())) {
                imgs.push(img.trim());
              }
            });
          }
        } catch {}
      }
      const modelYearCompatibility: any[] = (() => {
        if (p.modelYearCompatibilityJson) {
          try {
            const parsed = JSON.parse(p.modelYearCompatibilityJson);
            if (Array.isArray(parsed)) return parsed;
          } catch {}
        }
        return [];
      })();
      return {
        ...p,
        comp,
        compDisplay: formatCompListWithYears(comp),
        category,
        brand,
        modelYearCompatibility,
        imgs: imgs.length > 0 ? imgs : ["/images/sxs/z10_front.png"],
        price: {
          T_price: p.priceCRC || 0,
          I_price: {
            includes: p.isInstallationIncluded ?? true,
            I_price: p.installationPriceCRC || 0,
          },
        },
      };
    });

    const availability = calculateComboAvailability(combo.itemsJson, catalogProducts);
    const comboImgs = extractComboImages(combo, catalogProducts);
    const comboComp = deriveComboCompatibilityFromProducts(combo, catalogProducts);
    const comboCompDisplay = formatCompListWithYears(comboComp);
    const comboWithComp = {
      ...combo,
      comp: comboComp,
      compDisplay: comboCompDisplay,
    };

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

    // ONLY explicitly attached suggested/prevention products
    let explicitProducts: any[] = [];
    const seenProdIds = new Set<string>();

    if (sugProdIds.length > 0) {
      const idSet = new Set(sugProdIds.map((s) => s.toLowerCase()));
      for (const p of catalogProducts) {
        if (idSet.has(p.id.toLowerCase()) || idSet.has(p.sku.toLowerCase()) || idSet.has(p.slug.toLowerCase())) {
          if (!seenProdIds.has(p.id)) {
            seenProdIds.add(p.id);
            explicitProducts.push(p);
          }
        }
      }
    }

    // Related products matching compatible vehicle and category
    const relatedProducts = getRecommendedFillerProducts(
      comboWithComp,
      catalogProducts as any[],
      10,
      []
    );

    const allDbCombos = await prisma.combo.findMany({
      where: { isArchived: false },
    });
    const parsedCombos = allDbCombos.map((c) => {
      const cComp = deriveComboCompatibilityFromProducts(c, catalogProducts);
      return {
        ...c,
        comp: cComp,
        compDisplay: formatCompListWithYears(cComp),
        imgs: extractComboImages(c, catalogProducts),
        items: (() => {
          try { return JSON.parse(c.itemsJson || "[]"); } catch { return []; }
        })(),
      };
    });

    let explicitCombos: any[] = [];
    if (sugComboIds.length > 0) {
      const cIdSet = new Set(sugComboIds.map((s) => s.toLowerCase()));
      explicitCombos = parsedCombos.filter((c) => cIdSet.has(c.id.toLowerCase()) || cIdSet.has(c.slug.toLowerCase()));
    }

    const relatedCombos = getRecommendedFillerCombos(
      comboWithComp,
      parsedCombos,
      catalogProducts as any[],
      4,
      []
    );

    const rawComboParams = (() => {
      if (combo.parametersJson) {
        try {
          const p = JSON.parse(combo.parametersJson);
          if (Array.isArray(p)) return p;
        } catch {}
      }
      return [];
    })();
    const hydratedChoiceInfo = hydrateComboChoiceParameters(
      rawComboParams,
      catalogProducts,
      combo.discountPercent || 0
    );
    const inheritedInfo = extractInheritedComboProductParameters(combo, catalogProducts);
    const effectiveStockStatus = hydratedChoiceInfo.allChoicesOutOfStock
      ? "OUT_OF_STOCK"
      : availability.status;
    const effectiveIsAvailable = hydratedChoiceInfo.allChoicesOutOfStock
      ? false
      : availability.available;

    return NextResponse.json({
      success: true,
      data: {
        combo: {
          ...combo,
          installationAvailable: (combo as any).installationAvailable !== false,
          isInstallationIncluded: (combo as any).installationAvailable !== false,
          freeInstallation: (combo as any).installationAvailable !== false,
          comp: comboComp,
          compDisplay: comboCompDisplay,
          imgs: comboImgs,
          images: comboImgs,
          items: JSON.parse(combo.itemsJson || "[]") as string[],
          parameters: hydratedChoiceInfo.parameters,
          inheritedProductParameters: inheritedInfo.inheritedParameters,
          suggestedProductIds: sugProdIds,
          suggestedComboIds: sugComboIds,
          suggestedProducts: explicitProducts,
          relatedProducts,
          suggestedCombos: explicitCombos,
          relatedCombos,
          availability,
          stockStatus: effectiveStockStatus,
          isAvailable: effectiveIsAvailable,
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
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
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
