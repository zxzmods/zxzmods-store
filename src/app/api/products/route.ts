import { NextResponse } from "next/server";
import {
  getAllProducts,
  ProductItem,
  normalizeBrandName,
  extractDescriptionText,
  isPlatformOrVehicleMatch,
  detectVehiclePlatform,
  isUniversalFit,
  normalizeAudioUrl,
  normalizeVideoUrl,
} from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { SXS_BRAND_PLATFORMS } from "@/lib/sxsBrands";
import { getStealthSession } from "@/lib/stealthAuth";
import { sanitizeSearchQuery } from "@/lib/security/inputSanitizer";

function dbProductToProductItem(dbProd: any, jsonProd?: ProductItem | null, isStaff: boolean = false): ProductItem {
  const id = dbProd.sku || dbProd.slug || dbProd.id;
  const slug = dbProd.slug || dbProd.sku;

  // Dedicated Model & Year Compatibility list
  let modelYearCompatibility = jsonProd?.modelYearCompatibility || [];
  if (dbProd.modelYearCompatibilityJson) {
    try {
      const parsed = JSON.parse(dbProd.modelYearCompatibilityJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        modelYearCompatibility = parsed;
      }
    } catch (e) {}
  }

  // Image list
  let imgs = jsonProd?.imgs ? [...jsonProd.imgs] : [];
  if (dbProd.imageUrl) {
    if (!imgs.includes(dbProd.imageUrl)) {
      imgs = [dbProd.imageUrl, ...imgs.filter((i) => i !== dbProd.imageUrl)];
    }
  }
  if (dbProd.additionalImagesJson) {
    try {
      const addImgs = JSON.parse(dbProd.additionalImagesJson);
      if (Array.isArray(addImgs)) {
        addImgs.forEach((img: string) => {
          if (!imgs.includes(img)) imgs.push(img);
        });
      }
    } catch (e) {}
  }
  if (imgs.length === 0) imgs = ["/images/logo.png"];

  // Category array (supports multiple categories)
  let category: string[] = [];
  if (dbProd.categoryJson) {
    try {
      const parsed = JSON.parse(dbProd.categoryJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        category = parsed.map((c: any) => String(c).trim()).filter(Boolean);
      }
    } catch {}
  }
  if (category.length === 0 && dbProd.category?.slug) {
    category = [dbProd.category.slug];
  }
  if (category.length === 0) {
    category = jsonProd?.category || ["performance"];
  }

  // Compatibility array
  let comp = jsonProd?.comp || [];
  if (dbProd.compJson) {
    try {
      const parsed = JSON.parse(dbProd.compJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        comp = parsed;
      }
    } catch {}
  }
  if (comp.length === 0 && Array.isArray(dbProd.compatibilities) && dbProd.compatibilities.length > 0) {
    comp = dbProd.compatibilities.map((c: any) => c.modelSlug);
  }
  if (comp.length === 0) comp = ["z10", "z10-4"];

  // Audio & Video
  let rawAudios: string[] = [];
  if (dbProd.audiosJson) {
    try {
      const parsed = JSON.parse(dbProd.audiosJson);
      if (Array.isArray(parsed) && parsed.length > 0) rawAudios = parsed;
    } catch {}
  }
  if (rawAudios.length === 0 && dbProd.audioUrl) {
    rawAudios = [dbProd.audioUrl];
  }
  if (rawAudios.length === 0 && jsonProd?.audios && jsonProd.audios.length > 0) {
    rawAudios = jsonProd.audios;
  }
  const audios: string[] = rawAudios.map((a: string) => normalizeAudioUrl(a)).filter((s): s is string => Boolean(s));

  let rawVids: string[] = [];
  if (dbProd.videosJson) {
    try {
      const parsed = JSON.parse(dbProd.videosJson);
      if (Array.isArray(parsed) && parsed.length > 0) rawVids = parsed;
    } catch {}
  }
  if (rawVids.length === 0 && dbProd.videoUrl) {
    rawVids = [dbProd.videoUrl];
  }
  if (rawVids.length === 0 && jsonProd?.vids && jsonProd.vids.length > 0) {
    rawVids = jsonProd.vids;
  }
  const vids: string[] = rawVids.map((v: string) => normalizeVideoUrl(v)).filter((s): s is string => Boolean(s));

  return {
    id,
    slug,
    p_title: dbProd.nameEs || jsonProd?.p_title || dbProd.nameEn,
    nameEs: dbProd.nameEs || jsonProd?.p_title || "",
    nameEn: dbProd.nameEn || jsonProd?.p_title || dbProd.nameEs || "",
    brand: [dbProd.brandName || jsonProd?.brand?.[0] || "Bikeman Performance"],
    comp,
    category,
    price: {
      P_price_D: isStaff ? (dbProd.processingPriceD || jsonProd?.price?.P_price_D || 0) : 0,
      P_price: isStaff ? (dbProd.processingPriceCRC || jsonProd?.price?.P_price || dbProd.priceCRC) : 0,
      S_price: isStaff ? (dbProd.shippingPriceCRC || jsonProd?.price?.S_price || 0) : 0,
      I_price: (() => {
        const isInc =
          dbProd.isInstallationIncluded !== undefined && dbProd.isInstallationIncluded !== null
            ? Boolean(dbProd.isInstallationIncluded)
            : (jsonProd?.price?.I_price?.includes ?? true);
        return {
          includes: isInc,
          I_price: isInc ? 0 : (Number(dbProd.installationPriceCRC) || 0),
        };
      })(),
      profit: isStaff ? (jsonProd?.price?.profit || dbProd.profitCRC || 0) : 0,
      iva: {
        rate: dbProd.ivaPercent ?? 13,
        amount: dbProd.ivaCRC ?? Math.round((dbProd.priceCRC || 0) * (13 / 113)),
      },
      T_price: dbProd.priceCRC,
      T_price_D: jsonProd?.price?.T_price_D || "calculate in checkout",
    },
    priceCRC: dbProd.priceCRC,
    ivaPercent: dbProd.ivaPercent ?? 13,
    ivaCRC: dbProd.ivaCRC ?? Math.round((dbProd.priceCRC || 0) * (13 / 113)),
    discountPercent: (dbProd as any).discountPercent || 0,
    originalPriceCRC: (dbProd as any).originalPriceCRC || dbProd.priceCRC,
    imgs,
    vids,
    audios,
    description: jsonProd?.description || {
      es: [{ title: "Descripción", content: dbProd.descriptionEs || "" }],
      en: [{ title: "Description", content: dbProd.descriptionEn || "" }],
    },
    requirements: dbProd.requirements !== undefined ? dbProd.requirements : jsonProd?.requirements || null,
    reviews: (() => {
      if (dbProd.reviews) {
        try {
          const parsed = JSON.parse(dbProd.reviews);
          if (parsed && typeof parsed.stars === "number") return parsed;
        } catch {}
      }
      return jsonProd?.reviews || null;
    })(),
    homeInstallation: Boolean(dbProd.homeInstallationAvailable),
    installationDurationMinutes: dbProd.installationDurationMinutes ?? 60,
    modelYearCompatibility,
    supplierUrl: dbProd.supplierUrl || null,
    supplierPlatform: dbProd.supplierPlatform || null,
    supplierStockStatus: dbProd.supplierStockStatus || "IN_STOCK",
    supplierStockCount: dbProd.supplierStockCount ?? null,
    supplierStockMessageEs: dbProd.supplierStockMessageEs || null,
    supplierStockMessageEn: dbProd.supplierStockMessageEn || null,
    supplierStockCheckedAt: dbProd.supplierStockCheckedAt ? new Date(dbProd.supplierStockCheckedAt).toISOString() : null,
    supplierLeadDaysMin: dbProd.supplierLeadDaysMin ?? 7,
    supplierLeadDaysMax: dbProd.supplierLeadDaysMax ?? 12,
    supplierLastPriceUSD: dbProd.supplierLastPriceUSD ?? null,
    parameters: (() => {
      if (dbProd.parametersJson) {
        try {
          const parsed = JSON.parse(dbProd.parametersJson);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
      return [];
    })(),
    voidsWarranty: Boolean((dbProd as any).voidsWarranty),
    relatedProductIds: (() => {
      if ((dbProd as any).relatedProductIdsJson) {
        try {
          const parsed = JSON.parse((dbProd as any).relatedProductIdsJson);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
      return [];
    })(),
    suggestedProductIds: (() => {
      if ((dbProd as any).suggestedProductIdsJson) {
        try {
          const parsed = JSON.parse((dbProd as any).suggestedProductIdsJson);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
      if ((jsonProd as any)?.suggestedProductIds && Array.isArray((jsonProd as any).suggestedProductIds)) {
        return (jsonProd as any).suggestedProductIds;
      }
      return [];
    })(),
    suggestedComboIds: (() => {
      if ((dbProd as any).suggestedComboIdsJson) {
        try {
          const parsed = JSON.parse((dbProd as any).suggestedComboIdsJson);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
      if ((jsonProd as any)?.suggestedComboIds && Array.isArray((jsonProd as any).suggestedComboIds)) {
        return (jsonProd as any).suggestedComboIds;
      }
      return [];
    })(),
  };
}

export async function GET(request: Request) {
  try {
    const session = await getStealthSession();
    const isStaff = Boolean(session && (session.role === "MASTER" || session.role === "STAFF"));

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const id = searchParams.get("id");
    const rawQ = searchParams.get("q") || undefined;
    const q = rawQ ? sanitizeSearchQuery(rawQ) : undefined;
    const category = searchParams.get("category") || undefined;
    let brand = searchParams.get("brand") || searchParams.get("marca") || undefined;
    if (!brand) {
      searchParams.forEach((v, k) => {
        if (
          k &&
          !v &&
          !brand &&
          !["q", "category", "sxs", "sort", "intro", "comp", "vehicleModel", "slug", "id"].includes(k)
        ) {
          brand = k;
        }
      });
    }
    if (brand) {
      brand = brand.trim();
      if (brand.startsWith("(") && brand.endsWith(")")) {
        brand = brand.slice(1, -1).trim();
      }
      try {
        brand = decodeURIComponent(brand);
      } catch {}
    }
    const comp = searchParams.get("comp") || undefined;
    const sxs = searchParams.get("sxs") || undefined;
    const vehicleModel = searchParams.get("vehicleModel") || undefined;
    const sort = (searchParams.get("sort") as any) || undefined;

    // Fast-path: Single product fetch by slug or ID with direct indexed lookup
    if (slug || id) {
      const targetQuery = (slug || id!).toLowerCase();

      const dbProd = await prisma.product.findFirst({
        where: {
          OR: [
            { slug: targetQuery },
            { sku: targetQuery },
            { id: targetQuery },
          ],
        },
        include: {
          category: true,
          compatibilities: true,
        },
      });

      if (dbProd?.isArchived) {
        return NextResponse.json(
          { success: false, error: "Product is archived" },
          { status: 404 }
        );
      }

      const jsonProducts = await getAllProducts();
      const jsonMap = new Map<string, ProductItem>();
      jsonProducts.forEach((p) => {
        jsonMap.set(p.id.toLowerCase(), p);
        jsonMap.set(p.slug.toLowerCase(), p);
      });

      const jsonProd = jsonMap.get(targetQuery) || (dbProd ? jsonMap.get(dbProd.sku.toLowerCase()) : null);

      if (!dbProd && !jsonProd) {
        return NextResponse.json(
          { success: false, error: "Product not found" },
          { status: 404 }
        );
      }

      const finalProduct = dbProd
        ? dbProductToProductItem(dbProd, jsonProd, isStaff)
        : {
            ...jsonProd!,
            price: {
              ...jsonProd!.price,
              profit: isStaff ? jsonProd!.price.profit : 0,
              P_price_D: isStaff ? jsonProd!.price.P_price_D : 0,
              P_price: isStaff ? jsonProd!.price.P_price : 0,
              S_price: isStaff ? jsonProd!.price.S_price : 0,
            },
          };

      if (finalProduct.relatedProductIds && finalProduct.relatedProductIds.length > 0) {
        const relIds = finalProduct.relatedProductIds;
        const relDb = await prisma.product.findMany({
          where: {
            OR: [
              { id: { in: relIds } },
              { sku: { in: relIds } },
              { slug: { in: relIds } },
            ],
            isArchived: false,
          },
          include: { category: true, compatibilities: true },
        });
        finalProduct.relatedProducts = relDb.map((p) =>
          dbProductToProductItem(p, jsonMap.get(p.sku.toLowerCase()) || jsonMap.get(p.slug.toLowerCase()), isStaff)
        );
      }

      if (finalProduct.suggestedProductIds && finalProduct.suggestedProductIds.length > 0) {
        const sugIds = finalProduct.suggestedProductIds;
        const sugDb = await prisma.product.findMany({
          where: {
            OR: [
              { id: { in: sugIds } },
              { sku: { in: sugIds } },
              { slug: { in: sugIds } },
            ],
            isArchived: false,
          },
          include: { category: true, compatibilities: true },
        });
        finalProduct.suggestedProducts = sugDb.map((p) =>
          dbProductToProductItem(p, jsonMap.get(p.sku.toLowerCase()) || jsonMap.get(p.slug.toLowerCase()), isStaff)
        );
      } else {
        finalProduct.suggestedProducts = [];
      }

      if (finalProduct.suggestedComboIds && finalProduct.suggestedComboIds.length > 0) {
        const sugComboIds = new Set(finalProduct.suggestedComboIds.map((r: string) => r.toLowerCase()));
        const dbCombos = await prisma.combo.findMany({
          where: { isArchived: false },
        });
        finalProduct.suggestedCombos = dbCombos
          .filter((c) => sugComboIds.has(c.id.toLowerCase()) || sugComboIds.has(c.slug.toLowerCase()))
          .map((c) => ({
            ...c,
            items: (() => {
              try { return JSON.parse(c.itemsJson || "[]"); } catch { return []; }
            })(),
          }));
      } else {
        finalProduct.suggestedCombos = [];
      }

      return NextResponse.json({ success: true, product: finalProduct });
    }

    // Load active DB products, archived SKU set, json products, and brands
    const [activeDbProducts, archivedDbProducts, jsonProducts, dbBrands] = await Promise.all([
      prisma.product.findMany({
        where: { isArchived: false },
        include: {
          category: true,
          compatibilities: true,
        },
      }),
      prisma.product.findMany({
        where: { isArchived: true },
        select: { sku: true, slug: true, id: true },
      }),
      getAllProducts(),
      prisma.brand.findMany({
        include: {
          models: {
            orderBy: { name: "asc" },
          },
        },
      }),
    ]);

    const archivedSkus = new Set(
      archivedDbProducts.flatMap((p) => [p.sku.toLowerCase(), p.slug.toLowerCase(), p.id.toLowerCase()])
    );

    const sxsBrandModels: Record<string, Array<{ id: string; name: string; code?: string | null; slug: string }>> = {};
    for (const b of dbBrands) {
      sxsBrandModels[b.slug.toLowerCase()] = b.models.map((m) => ({
        id: m.id,
        name: m.name,
        code: m.code,
        slug: m.slug,
      }));
    }

    const jsonMap = new Map<string, ProductItem>();
    jsonProducts.forEach((p) => {
      jsonMap.set(p.id.toLowerCase(), p);
      jsonMap.set(p.slug.toLowerCase(), p);
    });

    // Combine active DB products with any non-archived json products
    const processedSkus = new Set<string>();
    const unifiedProducts: ProductItem[] = [];

    for (const dbProd of activeDbProducts) {
      const jsonProd = jsonMap.get(dbProd.sku.toLowerCase()) || jsonMap.get(dbProd.slug.toLowerCase());
      const item = dbProductToProductItem(dbProd, jsonProd, isStaff);
      unifiedProducts.push(item);
      processedSkus.add(dbProd.sku.toLowerCase());
      processedSkus.add(dbProd.slug.toLowerCase());
      processedSkus.add(dbProd.id.toLowerCase());
    }

    for (const jProd of jsonProducts) {
      if (!processedSkus.has(jProd.id.toLowerCase()) && !processedSkus.has(jProd.slug.toLowerCase()) && !archivedSkus.has(jProd.id.toLowerCase())) {
        const safeJProd = isStaff
          ? jProd
          : {
              ...jProd,
              price: {
                ...jProd.price,
                profit: 0,
                P_price_D: 0,
                P_price: 0,
                S_price: 0,
              },
            };
        unifiedProducts.push(safeJProd);
      }
    }

    // Filter by text search (q), comp, vehicleModel, sxs brand, and brand
    const queryMatchedProducts = unifiedProducts.filter((product) => {
      // 1. Text Search (q)
      if (q && q.trim()) {
        const qClean = q.trim();
        const searchPlat = detectVehiclePlatform(qClean);

        // If the search query explicitly targets a specific vehicle platform (e.g. Z1000 vs Z10):
        if (searchPlat) {
          const isUniversal = isUniversalFit(product.comp);
          if (!isUniversal) {
            // Check if this product has defined compatibility
            if (product.comp && product.comp.length > 0) {
              const matchesPlat = product.comp.some((c) => isPlatformOrVehicleMatch(c, qClean));
              if (!matchesPlat) return false;
            }
          }
        }

        const searchTerms = qClean
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .split(/\s+/)
          .filter(Boolean);

        const descText = extractDescriptionText(product.description);
        const searchableText = [
          product.id,
          product.p_title,
          descText,
          product.requirements || "",
          ...product.category,
          ...product.brand,
          ...product.comp,
        ]
          .join(" ")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

        const matchesAllTerms = searchTerms.every((term) => {
          if (term.length === 1) {
            return new RegExp(`(^|[\\s\\-_/])${escapeRegex(term)}($|[\\s\\-_/])`, "i").test(searchableText);
          }
          return (
            searchableText.includes(term) ||
            product.comp.some((c) => isPlatformOrVehicleMatch(c, term))
          );
        });
        if (!matchesAllTerms) return false;
      }

      // 2. Compatibility filter (SXS)
      if (comp && comp.toLowerCase() !== "all") {
        const targetComp = comp.toLowerCase();
        const isUniversal = product.comp.some((c) => c.toLowerCase() === "all");
        const matchesSxs = product.comp.some((c) =>
          c.toLowerCase().includes(targetComp)
        );
        if (!isUniversal && !matchesSxs) return false;
      }

      // 3. Active Vehicle Compatibility
      if (vehicleModel) {
        const vehicleLower = vehicleModel.toLowerCase();
        const isUniversal = isUniversalFit(product.comp);
        const matchesVehicle =
          (product.comp && product.comp.some((c) => isPlatformOrVehicleMatch(c, vehicleLower))) ||
          (product.modelYearCompatibility && product.modelYearCompatibility.some((m) =>
            isPlatformOrVehicleMatch(m.model, vehicleLower) || (m.make && isPlatformOrVehicleMatch(m.make, vehicleLower))
          ));
        if (!isUniversal && !matchesVehicle) return false;
      }

      // 4. Special by SxS Brand Filter
      if (sxs && sxs.toLowerCase() !== "all") {
        const targetSxs = sxs.toLowerCase().trim();
        const platforms = SXS_BRAND_PLATFORMS[targetSxs] || [targetSxs];
        const isUniversal = isUniversalFit(product.comp);

        const descText = extractDescriptionText(product.description).toLowerCase();
        const titleLower = product.p_title.toLowerCase();
        const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

        const matchesSxs = platforms.some((plat) => {
          const platLower = plat.toLowerCase();
          const compMatch = product.comp && product.comp.some((c) =>
            isPlatformOrVehicleMatch(c, platLower)
          );
          if (compMatch) return true;

          const myCompMatch = product.modelYearCompatibility && product.modelYearCompatibility.some((m) =>
            isPlatformOrVehicleMatch(m.model, platLower) || (m.make && isPlatformOrVehicleMatch(m.make, platLower))
          );
          if (myCompMatch) return true;

          // ONLY fallback to title/desc if product has ZERO compatibility defined anywhere
          if ((!product.comp || product.comp.length === 0) && (!product.modelYearCompatibility || product.modelYearCompatibility.length === 0)) {
            const platRegex = new RegExp(
              `(^|[\\s\\-_/])${escapeRegex(platLower)}($|[\\s\\-_/])`,
              "i"
            );
            if (platRegex.test(titleLower) || platRegex.test(descText)) return true;
          }
          return false;
        });

        if (!isUniversal && !matchesSxs) return false;
      }

      // 5. Brand filter
      if (brand && brand.toLowerCase() !== "all") {
        let cleanTarget = brand.trim();
        if (cleanTarget.startsWith("(") && cleanTarget.endsWith(")")) {
          cleanTarget = cleanTarget.slice(1, -1).trim();
        }
        const targetBrand = cleanTarget.toLowerCase();
        const targetAlpha = targetBrand.replace(/[^a-z0-9]/g, "");
        const normalizedTarget = normalizeBrandName(cleanTarget).toLowerCase();

        // 5a. Direct brand name match in product.brand (partial, exact, or alphanumeric match)
        const matchesBrandName = product.brand.some((b) => {
          const bNorm = normalizeBrandName(b).toLowerCase();
          const bRaw = b.toLowerCase();
          const bAlpha = bRaw.replace(/[^a-z0-9]/g, "");
          return (
            bNorm === normalizedTarget ||
            bRaw === targetBrand ||
            bRaw.includes(targetBrand) ||
            targetBrand.includes(bRaw) ||
            bNorm.includes(normalizedTarget) ||
            normalizedTarget.includes(bNorm) ||
            (targetAlpha.length >= 3 && (bAlpha.includes(targetAlpha) || targetAlpha.includes(bAlpha)))
          );
        });

        // 5b. Vehicle manufacturer / platform match (e.g. Polaris, Can-Am, CFMOTO, Honda, Yamaha, Segway)
        const platforms =
          SXS_BRAND_PLATFORMS[targetBrand] ||
          SXS_BRAND_PLATFORMS[normalizedTarget] ||
          [targetBrand];

        const isUniversal = product.comp.some((c) => c.toLowerCase() === "all");
        const matchesVehicleBrand = platforms.some((plat) => {
          const platLower = plat.toLowerCase();
          return product.comp.some((c) => isPlatformOrVehicleMatch(c, platLower));
        });

        // 5c. Title / Description match
        const titleLower = product.p_title.toLowerCase();
        const descLower = extractDescriptionText(product.description).toLowerCase();
        const titleAlpha = titleLower.replace(/[^a-z0-9]/g, "");
        const descAlpha = descLower.replace(/[^a-z0-9]/g, "");

        const matchesText =
          titleLower.includes(targetBrand) ||
          descLower.includes(targetBrand) ||
          (targetAlpha.length >= 3 && (titleAlpha.includes(targetAlpha) || descAlpha.includes(targetAlpha)));

        if (!matchesBrandName && !matchesVehicleBrand && !matchesText && !isUniversal) {
          return false;
        }
      }

      return true;
    });

    // Dynamically compute categories that exist ONLY in the matching products
    const matchingCategorySet = new Set<string>();
    queryMatchedProducts.forEach((p) => {
      p.category.forEach((cat) => matchingCategorySet.add(cat.trim()));
    });
    const categories = Array.from(matchingCategorySet);

    // Dynamically compute brands that exist ONLY in the matching products
    const matchingBrandsSet = new Set<string>();
    queryMatchedProducts.forEach((p) => {
      p.brand.forEach((b) => matchingBrandsSet.add(normalizeBrandName(b.trim())));
    });
    if (brand && brand.toLowerCase() !== "all") {
      let cleanBrand = brand.trim();
      if (cleanBrand.startsWith("(") && cleanBrand.endsWith(")")) {
        cleanBrand = cleanBrand.slice(1, -1).trim();
      }
      matchingBrandsSet.add(cleanBrand);
    }
    const brands = Array.from(matchingBrandsSet);

    // Apply category filter if specified
    let filtered = queryMatchedProducts;
    if (category && category.toLowerCase() !== "all") {
      const targetCat = category.toLowerCase();
      filtered = filtered.filter((product) => {
        return product.category.some((c) => {
          const cLower = c.toLowerCase();
          if (targetCat === "skit plates" || targetCat === "skid plates") {
            return cLower.includes("skit") || cLower.includes("skid");
          }
          return cLower === targetCat || cLower.includes(targetCat);
        });
      });
    }

    // Sort
    if (sort === "price-asc") {
      filtered.sort((a, b) => a.price.T_price - b.price.T_price);
    } else if (sort === "price-desc") {
      filtered.sort((a, b) => b.price.T_price - a.price.T_price);
    } else if (sort === "stars") {
      filtered.sort(
        (a, b) => ((b.reviews as any)?.stars || 0) - ((a.reviews as any)?.stars || 0)
      );
    }

    return NextResponse.json({
      success: true,
      products: filtered,
      total: filtered.length,
      categories,
      brands,
      sxsBrandModels,
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
