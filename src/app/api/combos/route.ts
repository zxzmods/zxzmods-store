import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateComboAvailability } from "@/lib/comboAvailability";
import { detectProductVehicleBrands, normalizeBrandName, detectVehiclePlatform } from "@/lib/products";
import { SXS_BRAND_PLATFORMS, SXS_BRANDS } from "@/lib/sxsBrands";

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

function detectComboVehicleBrands(combo: any, catalogProducts: any[]): string[] {
  const matchedSlugs = new Set<string>();

  // 1. Check included products
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
            let comp: string[] = [];
            if (matchedProd.compJson) {
              try { comp = JSON.parse(matchedProd.compJson); } catch {}
            }
            const prodBrands = detectProductVehicleBrands({
              comp,
              nameEs: matchedProd.nameEs,
              nameEn: matchedProd.nameEn,
            });
            prodBrands.forEach((b) => matchedSlugs.add(b));
          }
        });
      }
    } catch {}
  }

  // 2. Check combo title and description
  const text = `${combo.titleEs || ""} ${combo.titleEn || ""} ${combo.descriptionEs || ""} ${combo.descriptionEn || ""}`.toLowerCase();
  for (const [brandSlug, platforms] of Object.entries(SXS_BRAND_PLATFORMS)) {
    const match = platforms.some((plat) => {
      const regex = new RegExp(`(^|[\\s\\-_/])${plat.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}($|[\\s\\-_/])`, "i");
      return regex.test(text);
    });
    if (match) matchedSlugs.add(brandSlug);
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
    const vehicleModel = searchParams.get("vehicleModel") || undefined;
    const vehicleYear = searchParams.get("vehicleYear") || undefined;
    const distributorBrand = searchParams.get("distributorBrand") || searchParams.get("brand");
    const inStock = searchParams.get("inStock") === "true" || searchParams.get("inStock") === "1";
    const discounted = searchParams.get("discounted") === "true" || searchParams.get("discounted") === "1";

    // Fetch all catalog products for live stock calculations and image resolution
    const catalogProducts = await prisma.product.findMany({
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
        priceCRC: true,
        originalPriceCRC: true,
        discountPercent: true,
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
      const seenProdIds = new Set<string>();

      if (sugProdIds.length > 0) {
        const idSet = new Set(sugProdIds.map((s) => s.toLowerCase()));
        for (const p of catalogProducts) {
          if (idSet.has(p.id.toLowerCase()) || idSet.has(p.sku.toLowerCase()) || idSet.has(p.slug.toLowerCase())) {
            if (!seenProdIds.has(p.id)) {
              seenProdIds.add(p.id);
              suggestedProducts.push(p);
            }
          }
        }
      }

      // Dynamically fill up to 10 with temporary products matching category or brand (without modifying DB)
      if (suggestedProducts.length < 10) {
        const comboCat = (combo.category || "performance").toLowerCase();

        // Priority A: Same category
        for (const p of catalogProducts) {
          if (suggestedProducts.length >= 10) break;
          if (seenProdIds.has(p.id)) continue;
          const pCats: string[] = (() => {
            if (p.categoryJson) {
              try {
                const parsed = JSON.parse(p.categoryJson);
                if (Array.isArray(parsed)) return parsed.map((c: string) => String(c).toLowerCase());
              } catch {}
            }
            return [];
          })();
          if (pCats.includes(comboCat) || pCats.some((c: string) => c.includes(comboCat))) {
            seenProdIds.add(p.id);
            suggestedProducts.push(p);
          }
        }

        // Priority B: Matching brand in combo title
        const comboTitle = (combo.titleEs + " " + combo.titleEn).toLowerCase();
        for (const p of catalogProducts) {
          if (suggestedProducts.length >= 10) break;
          if (seenProdIds.has(p.id)) continue;
          const pBrands: string[] = [];
          if (p.brandName) pBrands.push(p.brandName.toLowerCase());
          if (p.brandJson) {
            try {
              const parsed = JSON.parse(p.brandJson);
              if (Array.isArray(parsed)) parsed.forEach((b: string) => pBrands.push(String(b).toLowerCase()));
            } catch {}
          }
          const matchesBrand = pBrands.some((b: string) => comboTitle.includes(b));
          if (matchesBrand) {
            seenProdIds.add(p.id);
            suggestedProducts.push(p);
          }
        }

        // Priority C: Other active catalog products
        for (const p of catalogProducts) {
          if (suggestedProducts.length >= 10) break;
          if (!seenProdIds.has(p.id)) {
            seenProdIds.add(p.id);
            suggestedProducts.push(p);
          }
        }
      }

      suggestedProducts = suggestedProducts.slice(0, 10);

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

      const comboImgs = extractComboImages(combo, catalogProducts);

      return NextResponse.json({
        success: true,
        data: {
          combo: {
            ...combo,
            imgs: comboImgs,
            images: comboImgs,
            items: JSON.parse(combo.itemsJson || "[]") as string[],
            suggestedProductIds: sugProdIds,
            suggestedComboIds: sugComboIds,
            suggestedProducts,
            relatedProducts: suggestedProducts,
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
      });
    }

    const includeArchived = searchParams.get("includeArchived") === "true";

    const allCombos = await prisma.combo.findMany({
      where: includeArchived ? {} : { isArchived: false },
      orderBy: { createdAt: "desc" },
    });

    const formattedAllCombos = allCombos.map((c) => {
      const availability = calculateComboAvailability(c.itemsJson, catalogProducts);
      const cImgs = extractComboImages(c, catalogProducts);
      const vehicleBrands = detectComboVehicleBrands(c, catalogProducts);
      const distributorBrands = detectComboDistributorBrands(c, catalogProducts);
      return {
        ...c,
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

    // ONLY show vehicle brands present in combos
    const availableVehicleBrands = SXS_BRANDS.filter(
      (sb) => (vehicleBrandCounts[sb.slug.toLowerCase()] || 0) > 0
    ).map((sb) => ({
      slug: sb.slug,
      title: sb.title,
      count: vehicleBrandCounts[sb.slug.toLowerCase()] || 0,
    }));

    // ONLY show distributor brands present in combos
    const availableDistributorBrands = Object.entries(distributorBrandCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Filter combos by active separated parameters
    const filteredCombos = formattedAllCombos.filter((c) => {
      // 1. Category
      if (category && category !== "all" && c.category !== category) {
        return false;
      }

      // 2. Search
      if (search && search.trim() !== "") {
        const q = search.toLowerCase().trim();
        const searchable = `${c.titleEs || ""} ${c.titleEn || ""} ${c.descriptionEs || ""} ${c.descriptionEn || ""} ${c.badgeEs || ""} ${c.badgeEn || ""}`.toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      // 3. Vehicle Brand
      if (vehicleBrand && vehicleBrand.toLowerCase() !== "all") {
        const targetVb = vehicleBrand.toLowerCase().trim();
        if (!c.vehicleBrands.map((b) => b.toLowerCase()).includes(targetVb)) {
          return false;
        }
      }

      // 3b. Vehicle Model & Platform
      if (vehicleModel) {
        const vPlatform = detectVehiclePlatform(vehicleModel);
        const comboText = `${c.titleEs || ""} ${c.titleEn || ""} ${c.badgeEs || ""} ${c.badgeEn || ""} ${c.descriptionEs || ""} ${(c.items || []).join(" ")}`.toLowerCase();
        const comboPlatform = detectVehiclePlatform(comboText);
        if (vPlatform && comboPlatform) {
          if (vPlatform !== comboPlatform) return false;
        } else if (vPlatform) {
          if (vPlatform === "z10" && (comboText.includes("1000") || comboText.includes("z1000") || comboText.includes("950") || comboText.includes("z10-4") || comboText.includes("z10 4"))) {
            return false;
          }
          if (vPlatform === "z10-4" && (comboText.includes("1000") || comboText.includes("z1000") || comboText.includes("950") || (!comboText.includes("z10-4") && !comboText.includes("z10 4")))) {
            return false;
          }
          if (vPlatform === "z1000" && (/\bz10(-4)?\b/i.test(comboText) || comboText.includes("950"))) {
            return false;
          }
          if (vPlatform === "z950" && (comboText.includes("1000") || comboText.includes("z1000") || /\bz10(-4)?\b/i.test(comboText))) {
            return false;
          }
        }
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

    const response = NextResponse.json({
      success: true,
      data: {
        combos: filteredCombos,
        categories: uniqueCategories,
        availableVehicleBrands,
        availableDistributorBrands,
        hasInStock: globalHasInStock,
        hasDiscounted: globalHasDiscounted,
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
