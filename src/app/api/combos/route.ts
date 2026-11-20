import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateComboAvailability } from "@/lib/comboAvailability";
import {
  detectProductVehicleBrands,
  normalizeBrandName,
  detectVehiclePlatform,
  is4SeaterToken,
  is2SeaterToken,
  getRecommendedFillerProducts,
  getRecommendedFillerCombos,
  sortVehicleBrands,
  sortVehicleModels,
  deriveComboCompatibilityFromProducts,
  formatCompListWithYears,
  isPlatformOrVehicleMatch,
  isUniversalFit,
} from "@/lib/products";
import { SXS_BRAND_PLATFORMS, SXS_BRANDS, getBrandLogo } from "@/lib/sxsBrands";
import { evaluateComboSearch, buildDealerBrandSearchRefs } from "@/lib/search";

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

function formatCatalogProductForCombo(p: any) {
  const comp: string[] = (() => {
    if (Array.isArray(p.comp)) return p.comp;
    if (p.compJson) {
      try {
        const parsed = JSON.parse(p.compJson);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  })();

  const category: string[] = (() => {
    if (Array.isArray(p.category)) return p.category;
    if (p.categoryJson) {
      try {
        const parsed = JSON.parse(p.categoryJson);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  })();

  const brand: string[] = (() => {
    if (Array.isArray(p.brand)) return p.brand;
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

  const modelYearCompatibility: any[] = (() => {
    if (Array.isArray(p.modelYearCompatibility)) return p.modelYearCompatibility;
    if (p.modelYearCompatibilityJson) {
      try {
        const parsed = JSON.parse(p.modelYearCompatibilityJson);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
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
}

function isUniversalCompToken(c: string): boolean {
  const s = (c || "").toLowerCase().trim();
  return !s || s === "all" || s.includes("universal");
}

function detectComboVehicleBrands(combo: any, catalogProducts: any[], derivedComp?: string[]): string[] {
  const matchedSlugs = new Set<string>();

  const compToUse = Array.isArray(derivedComp) && derivedComp.length > 0
    ? derivedComp
    : deriveComboCompatibilityFromProducts(combo, catalogProducts);

  const nonUniversalComp = compToUse.filter((c) => !isUniversalCompToken(c));
  if (nonUniversalComp.length > 0) {
    const prodBrands = detectProductVehicleBrands({
      comp: nonUniversalComp,
      nameEs: "",
      nameEn: "",
    });
    prodBrands.forEach((b) => matchedSlugs.add(b));
  }

  // Fallback to combo title/description ONLY IF no listed products provided authoritative vehicle fitment
  if (matchedSlugs.size === 0 && nonUniversalComp.length === 0) {
    const text = `${combo.titleEs || ""} ${combo.titleEn || ""} ${combo.descriptionEs || ""} ${combo.descriptionEn || ""}`.toLowerCase();
    for (const [brandSlug, platforms] of Object.entries(SXS_BRAND_PLATFORMS)) {
      const match = platforms.some((plat) => {
        const regex = new RegExp(`(^|[\\s\\-_/])${plat.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}($|[\\s\\-_/])`, "i");
        return regex.test(text);
      });
      if (match) matchedSlugs.add(brandSlug);
    }
  }

  return Array.from(matchedSlugs);
}

function detectComboDistributorBrands(combo: any, catalogProducts: any[]): string[] {
  const brands = new Set<string>();
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
            return false;
          });
          if (matchedProd) {
            if (matchedProd.brandName) {
              brands.add(normalizeBrandName(matchedProd.brandName));
            }
            if (matchedProd.brandJson) {
              try {
                const bArr = JSON.parse(matchedProd.brandJson);
                if (Array.isArray(bArr)) {
                  bArr.forEach((b: string) => brands.add(normalizeBrandName(b)));
                }
              } catch {}
            }
          }
        });
      }
    } catch {}
  }
  return Array.from(brands).filter(Boolean);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const category = searchParams.get("category");
    const search = searchParams.get("search") || searchParams.get("q");
    const vehicleBrand = searchParams.get("vehicleBrand") || searchParams.get("sxs");
    const modelCategory = searchParams.get("modelCategory") || searchParams.get("vehicleCategory");
    const vehicleModel = searchParams.get("vehicleModel") || undefined;
    const vehicleYear = searchParams.get("vehicleYear") || undefined;
    const distributorBrand = searchParams.get("distributorBrand") || searchParams.get("brand");
    const inStock = searchParams.get("inStock") === "true" || searchParams.get("inStock") === "1";
    const discounted = searchParams.get("discounted") === "true" || searchParams.get("discounted") === "1";

    // Fetch all catalog products for live stock calculations and image resolution
    const rawCatalogProducts = await prisma.product.findMany({
      where: { isArchived: false },
      select: {
        id: true,
        sku: true,
        slug: true,
        nameEs: true,
        nameEn: true,
        brandName: true,
        brandJson: true,
        categoryJson: true,
        compJson: true,
        modelYearCompatibilityJson: true,
        priceCRC: true,
        originalPriceCRC: true,
        discountPercent: true,
        isInstallationIncluded: true,
        installationPriceCRC: true,
        imageUrl: true,
        imagesJson: true,
        additionalImagesJson: true,
        supplierStockStatus: true,
        stockStatus: true,
        isArchived: true,
        supplierLeadDaysMin: true,
        supplierLeadDaysMax: true,
      },
    });

    const catalogProducts = rawCatalogProducts.map(formatCatalogProductForCombo);

    const includeArchived = searchParams.get("includeArchived") === "true";

    if (slug) {
      const combo = await prisma.combo.findUnique({
        where: { slug },
      });

      if (!combo || (combo.isArchived && !includeArchived)) {
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

      const availability = calculateComboAvailability(combo.itemsJson, catalogProducts);
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

      // 1. Explicit suggested/prevention products (ONLY items explicitly attached in backdoor!)
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

      // 2. Dynamically fill related products strictly matching compatible vehicle and category
      const relatedProducts = getRecommendedFillerProducts(
        comboWithComp,
        catalogProducts as any[],
        10,
        []
      );

      // 3. Recommended combos strictly prioritizing vehicle compatibility and category
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

      const comboImgs = extractComboImages(combo, catalogProducts);

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
            suggestedProductIds: sugProdIds,
            suggestedComboIds: sugComboIds,
            suggestedProducts: explicitProducts,
            relatedProducts,
            suggestedCombos: explicitCombos,
            relatedCombos,
            parameters: (() => {
              if (combo.parametersJson) {
                try {
                  const p = JSON.parse(combo.parametersJson);
                  if (Array.isArray(p)) return p;
                } catch {}
              }
              return [];
            })(),
            uniqueProduct: (() => {
              if ((combo as any).uniqueProductJson) {
                try {
                  const p = JSON.parse((combo as any).uniqueProductJson);
                  if (p && typeof p === "object") return p;
                } catch {}
              }
              return null;
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
      }, {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      });
    }

    const [allCombos, dbBrands, dbDealerBrands] = await Promise.all([
      prisma.combo.findMany({
        where: includeArchived ? {} : { isArchived: false },
        orderBy: { createdAt: "desc" },
      }),
      prisma.brand.findMany({
        include: {
          models: {
            orderBy: { name: "asc" },
          },
        },
      }),
      prisma.dealerBrand.findMany({
        where: { isActive: true },
      }),
    ]);

    const dealerBrandSearchRefs = buildDealerBrandSearchRefs(dbDealerBrands);

    const sxsBrandModels: Record<
      string,
      Array<{
        id: string;
        name: string;
        code?: string | null;
        slug: string;
        category?: string | null;
        modelCategory?: string | null;
        imageUrl?: string | null;
      }>
    > = {};
    for (const b of sortVehicleBrands(dbBrands)) {
      sxsBrandModels[b.slug.toLowerCase()] = sortVehicleModels(
        b.models.map((m) => ({
          id: m.id,
          name: m.name,
          code: m.code,
          slug: m.slug,
          category: m.category,
          modelCategory: m.modelCategory || null,
          imageUrl: m.imageUrl && m.imageUrl !== "null" && m.imageUrl !== "undefined" ? m.imageUrl.trim() : null,
          brandSlug: b.slug,
          brandName: b.name,
        }))
      );
    }

    const formattedAllCombos = allCombos.map((c) => {
      const availability = calculateComboAvailability(c.itemsJson, catalogProducts);
      const cImgs = extractComboImages(c, catalogProducts);
      const comp = deriveComboCompatibilityFromProducts(c, catalogProducts);
      const compDisplay = formatCompListWithYears(comp);
      const vehicleBrands = detectComboVehicleBrands(c, catalogProducts, comp);
      const distributorBrands = detectComboDistributorBrands(c, catalogProducts);
      return {
        ...c,
        installationAvailable: (c as any).installationAvailable !== false,
        isInstallationIncluded: (c as any).installationAvailable !== false,
        freeInstallation: (c as any).installationAvailable !== false,
        comp,
        compDisplay,
        imgs: cImgs,
        images: cImgs,
        vehicleBrands,
        distributorBrands,
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
        uniqueProduct: (() => {
          if ((c as any).uniqueProductJson) {
            try {
              const p = JSON.parse((c as any).uniqueProductJson);
              if (p && typeof p === "object") return p;
            } catch {}
          }
          return null;
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

    // Compute dynamic parameters present across all active combos
    const vehicleBrandCounts: Record<string, number> = {};
    const distributorBrandCounts: Record<string, number> = {};
    let globalHasInStock = false;
    let globalHasDiscounted = false;

    formattedAllCombos.forEach((c) => {
      c.vehicleBrands.forEach((vb) => {
        vehicleBrandCounts[vb.toLowerCase()] = (vehicleBrandCounts[vb.toLowerCase()] || 0) + 1;
      });
      c.distributorBrands.forEach((db) => {
        distributorBrandCounts[db] = (distributorBrandCounts[db] || 0) + 1;
      });
      if (c.isAvailable) globalHasInStock = true;
      if ((c.originalPriceCRC && c.originalPriceCRC > c.priceCRC) || c.discountPercent > 0) {
        globalHasDiscounted = true;
      }
    });

    // ONLY show vehicle brands present in combos with dynamic database fields
    const availableVehicleBrands: Array<{
      slug: string;
      title: string;
      logoUrl?: string | null;
      defaultVehicleImageUrl?: string | null;
      count: number;
    }> = [];

    dbBrands.forEach((b) => {
      const cnt = vehicleBrandCounts[b.slug.toLowerCase()] || 0;
      if (cnt > 0) {
        const known = SXS_BRANDS.find((sb) => sb.slug.toLowerCase() === b.slug.toLowerCase());
        availableVehicleBrands.push({
          slug: b.slug,
          title: b.name || known?.title || b.slug.toUpperCase(),
          logoUrl: b.logoUrl || getBrandLogo(b.slug) || null,
          defaultVehicleImageUrl: b.defaultVehicleImageUrl || known?.sxsImageUrl || null,
          count: cnt,
        });
      }
    });

    SXS_BRANDS.forEach((sb) => {
      if (!availableVehicleBrands.some((av) => av.slug.toLowerCase() === sb.slug.toLowerCase())) {
        const cnt = vehicleBrandCounts[sb.slug.toLowerCase()] || 0;
        if (cnt > 0) {
          availableVehicleBrands.push({
            slug: sb.slug,
            title: sb.title,
            logoUrl: getBrandLogo(sb.slug),
            defaultVehicleImageUrl: sb.sxsImageUrl,
            count: cnt,
          });
        }
      }
    });

    availableVehicleBrands.sort((a, b) => {
      const aIsCf = a.slug.toLowerCase() === "cfmoto";
      const bIsCf = b.slug.toLowerCase() === "cfmoto";
      if (aIsCf) return -1;
      if (bIsCf) return 1;
      return a.title.localeCompare(b.title);
    });

    // ONLY show distributor brands present in combos
    const availableDistributorBrands = Object.entries(distributorBrandCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const comboSearchScoreMap = new Map<string, number>();

    // Filter combos by active separated parameters
    const filteredCombos = formattedAllCombos.filter((c) => {
      // 1. Category
      if (category && category !== "all" && c.category !== category) {
        return false;
      }

      // 2. Search
      if (search && search.trim() !== "") {
        const searchRes = evaluateComboSearch(c, search, {
          dealerBrands: dealerBrandSearchRefs,
        });
        if (!searchRes.matches) return false;
        comboSearchScoreMap.set(c.id, searchRes.score);
      }

      // 3. Vehicle Brand
      if (vehicleBrand && vehicleBrand.toLowerCase() !== "all") {
        const targetVb = vehicleBrand.toLowerCase().trim();
        if (!c.vehicleBrands.map((b) => b.toLowerCase()).includes(targetVb)) {
          return false;
        }
      }

      // 3b. Vehicle Model & Platform (checked against inherited comp tags from listed products)
      if (vehicleModel) {
        const nonUniversalComp = (c.comp || []).filter((tok: string) => !isUniversalCompToken(tok));
        if (nonUniversalComp.length > 0) {
          const matchesComp = nonUniversalComp.some((tok: string) =>
            isPlatformOrVehicleMatch(tok, vehicleModel)
          );
          if (!matchesComp) return false;
        } else if (!isUniversalFit(c.comp)) {
          const vPlatform = detectVehiclePlatform(vehicleModel);
          const comboText = `${c.titleEs || ""} ${c.titleEn || ""} ${c.badgeEs || ""} ${c.badgeEn || ""} ${c.descriptionEs || ""} ${(c.items || []).join(" ")}`.toLowerCase();

          if ((is4SeaterToken(vehicleModel) && is2SeaterToken(comboText)) || (is2SeaterToken(vehicleModel) && is4SeaterToken(comboText))) {
            return false;
          }

          const comboPlatform = detectVehiclePlatform(comboText);
          if (vPlatform && comboPlatform && vPlatform !== comboPlatform) {
            return false;
          }
        }
      }

      // 3c. Model Category filter (e.g. "Maverick X3", "Maverick R", "Defender", "Commander", "Outlander (ATV)", etc.)
      if (modelCategory && modelCategory.toLowerCase() !== "all") {
        const targetCategoryNorm = modelCategory.toLowerCase().trim();
        const comboText = `${c.titleEs || ""} ${c.titleEn || ""} ${c.badgeEs || ""} ${c.badgeEn || ""} ${c.descriptionEs || ""} ${(c.items || []).join(" ")}`.toLowerCase();

        const tokensToMatch = new Set<string>();
        tokensToMatch.add(targetCategoryNorm);
        const cleanToken = targetCategoryNorm.replace(/\([^)]*\)/g, "").trim();
        if (cleanToken) tokensToMatch.add(cleanToken);

        for (const [_, bModels] of Object.entries(sxsBrandModels)) {
          for (const m of bModels) {
            const catMatch =
              (m.modelCategory && m.modelCategory.toLowerCase() === targetCategoryNorm) ||
              (m.category && m.category.toLowerCase() === targetCategoryNorm);
            if (catMatch) {
              tokensToMatch.add(m.slug.toLowerCase());
              tokensToMatch.add(m.name.toLowerCase());
              if (m.code) tokensToMatch.add(m.code.toLowerCase());
            }
          }
        }

        const nonUniversalComp = (c.comp || []).filter((tok: string) => !isUniversalCompToken(tok));
        let matchesCat = false;
        if (nonUniversalComp.length > 0) {
          matchesCat = Array.from(tokensToMatch).some((tok) =>
            nonUniversalComp.some((compTok: string) => isPlatformOrVehicleMatch(compTok, tok))
          );
        } else {
          matchesCat = Array.from(tokensToMatch).some((tok) => {
            if (comboText.includes(tok)) return true;
            const tokPlat = detectVehiclePlatform(tok);
            const comboPlat = detectVehiclePlatform(comboText);
            if (tokPlat && comboPlat && tokPlat === comboPlat) return true;
            return false;
          });
        }

        if (!matchesCat) return false;
      }

      // 4. Distributor Brand
      if (distributorBrand && distributorBrand.toLowerCase() !== "all") {
        const targetDb = distributorBrand.toLowerCase().trim();
        if (!c.distributorBrands.some((b) => b.toLowerCase() === targetDb || b.toLowerCase().includes(targetDb))) {
          return false;
        }
      }

      // 5. In Stock
      if (inStock && !c.isAvailable) {
        return false;
      }

      // 6. Discounted
      if (discounted) {
        const hasDiscount = (c.originalPriceCRC && c.originalPriceCRC > c.priceCRC) || c.discountPercent > 0;
        if (!hasDiscount) return false;
      }

      return true;
    });

    // Extract dynamic unique categories directly from loaded combos
    const uniqueCategories = Array.from(
      new Set(allCombos.map((c) => c.category).filter(Boolean))
    );

    if (search && search.trim()) {
      filteredCombos.sort(
        (a, b) => (comboSearchScoreMap.get(b.id) || 0) - (comboSearchScoreMap.get(a.id) || 0)
      );
    }

    const response = NextResponse.json({
      success: true,
      data: {
        combos: filteredCombos,
        categories: uniqueCategories,
        availableVehicleBrands,
        availableDistributorBrands,
        sxsBrandModels,
        hasInStock: globalHasInStock,
        hasDiscounted: globalHasDiscounted,
      },
    });
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
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
