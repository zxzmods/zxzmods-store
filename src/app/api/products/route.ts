import { NextResponse } from "next/server";
import {
  ProductItem,
  normalizeBrandName,
  extractDescriptionText,
  isPlatformOrVehicleMatch,
  detectVehiclePlatform,
  isUniversalFit,
  normalizeAudioUrl,
  normalizeVideoUrl,
  detectProductVehicleBrands,
} from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { SXS_BRAND_PLATFORMS, SXS_BRANDS, getBrandLogo } from "@/lib/sxsBrands";
import { getStealthSession } from "@/lib/stealthAuth";
import { sanitizeSearchQuery } from "@/lib/security/inputSanitizer";
import { evaluateProductSearch, buildDealerBrandSearchRefs } from "@/lib/search";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  // Image list (Database imagesJson is authoritative; only fall back if empty)
  let imgs: string[] = [];
  if (dbProd.imagesJson) {
    try {
      const parsed = JSON.parse(dbProd.imagesJson);
      if (Array.isArray(parsed)) {
        parsed.forEach((img: any) => {
          const s = typeof img === "string" ? img.trim() : "";
          if (s && !imgs.includes(s)) imgs.push(s);
        });
      }
    } catch (e) {}
  }
  if (imgs.length === 0 && dbProd.imageUrl && typeof dbProd.imageUrl === "string" && dbProd.imageUrl.trim()) {
    imgs.push(dbProd.imageUrl.trim());
  }
  if (imgs.length === 0 && jsonProd?.imgs && Array.isArray(jsonProd.imgs)) {
    jsonProd.imgs.forEach((img: string) => {
      const s = typeof img === "string" ? img.trim() : "";
      if (s && !imgs.includes(s)) imgs.push(s);
    });
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
  if (comp.length === 0 && modelYearCompatibility.length > 0) {
    comp = Array.from(new Set(modelYearCompatibility.map((m: any) => m.model).filter(Boolean)));
  }
  if (comp.length === 0) comp = [];

  // Audio & Video (Database audiosJson & videosJson are authoritative)
  let rawAudios: string[] = [];
  let hasDbAudiosJson = false;
  if (dbProd.audiosJson) {
    try {
      const parsed = JSON.parse(dbProd.audiosJson);
      if (Array.isArray(parsed)) {
        rawAudios = parsed;
        hasDbAudiosJson = true;
      }
    } catch {}
  }
  if (!hasDbAudiosJson && dbProd.audioUrl) {
    rawAudios = [dbProd.audioUrl];
  }
  if (!hasDbAudiosJson && rawAudios.length === 0 && jsonProd?.audios && jsonProd.audios.length > 0) {
    rawAudios = jsonProd.audios;
  }
  const audios: string[] = rawAudios.map((a: string) => normalizeAudioUrl(a)).filter((s): s is string => Boolean(s));

  let rawVids: string[] = [];
  let hasDbVideosJson = false;
  if (dbProd.videosJson) {
    try {
      const parsed = JSON.parse(dbProd.videosJson);
      if (Array.isArray(parsed)) {
        rawVids = parsed;
        hasDbVideosJson = true;
      }
    } catch {}
  }
  if (!hasDbVideosJson && dbProd.videoUrl) {
    rawVids = [dbProd.videoUrl];
  }
  if (!hasDbVideosJson && rawVids.length === 0 && jsonProd?.vids && jsonProd.vids.length > 0) {
    rawVids = jsonProd.vids;
  }
  const vids: string[] = rawVids.map((v: string) => normalizeVideoUrl(v)).filter((s): s is string => Boolean(s));

  return {
    id,
    slug,
    sku: dbProd.sku || jsonProd?.sku || id,
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
    imageUrl: dbProd.imageUrl || imgs[0],
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
    requiredProductIds: (() => {
      if ((dbProd as any).requiredProductIdsJson) {
        try {
          const parsed = JSON.parse((dbProd as any).requiredProductIdsJson);
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

    // Vehicle Brand parameter (separated, e.g. "cfmoto", "can-am", "polaris", "kawasaki")
    const vehicleBrand = searchParams.get("vehicleBrand") || searchParams.get("sxs") || undefined;
    const modelCategory = searchParams.get("modelCategory") || searchParams.get("vehicleCategory") || undefined;

    // Distributor Brand parameter (separated, e.g. "Shock Therapy", "EVP")
    let distributorBrand = searchParams.get("distributorBrand") || searchParams.get("brand") || searchParams.get("marca") || undefined;
    if (!distributorBrand) {
      searchParams.forEach((v, k) => {
        if (
          k &&
          !v &&
          !distributorBrand &&
          !["q", "category", "sxs", "vehicleBrand", "distributorBrand", "inStock", "discounted", "sort", "intro", "comp", "vehicleModel", "modelCategory", "vehicleCategory", "slug", "id"].includes(k)
        ) {
          distributorBrand = k;
        }
      });
    }
    if (distributorBrand) {
      distributorBrand = distributorBrand.trim();
      if (distributorBrand.startsWith("(") && distributorBrand.endsWith(")")) {
        distributorBrand = distributorBrand.slice(1, -1).trim();
      }
      try {
        distributorBrand = decodeURIComponent(distributorBrand);
      } catch {}
    }

    // In Stock filter (separated toggle: "true" or "1")
    const inStock = searchParams.get("inStock") === "true" || searchParams.get("inStock") === "1";

    // Discounted filter (separated toggle: "true" or "1")
    const discounted = searchParams.get("discounted") === "true" || searchParams.get("discounted") === "1";

    const comp = searchParams.get("comp") || undefined;
    const vehicleModel = searchParams.get("vehicleModel") || undefined;
    const vehicleYearStr = searchParams.get("vehicleYear") || undefined;
    const vehicleYear = vehicleYearStr ? parseInt(vehicleYearStr, 10) : undefined;
    const sort = (searchParams.get("sort") as any) || undefined;

    // Fast-path: Single product fetch by slug or ID with direct indexed lookup
    if (slug || id) {
      const targetQuery = (slug || id!).trim();
      const targetLower = targetQuery.toLowerCase();
      const targetUpper = targetQuery.toUpperCase();

      const dbProd = await prisma.product.findFirst({
        where: {
          OR: [
            { slug: targetQuery },
            { slug: targetLower },
            { slug: targetUpper },
            { sku: targetQuery },
            { sku: targetLower },
            { sku: targetUpper },
            { id: targetQuery },
            { id: targetLower },
            { id: targetUpper },
          ],
        },
        include: {
          category: true,
          compatibilities: true,
        },
      });

      if (!dbProd || dbProd.isArchived) {
        return NextResponse.json(
          { success: false, error: dbProd?.isArchived ? "Product is archived" : "Product not found" },
          { status: 404 }
        );
      }

      const finalProduct = dbProductToProductItem(dbProd, null, isStaff);

      // Enrich and resolve product linking variants (Amazon-style)
      if (finalProduct.parameters && Array.isArray(finalProduct.parameters)) {
        const currentProdKeys = [
          (finalProduct.id || "").toLowerCase(),
          (finalProduct.sku || "").toLowerCase(),
          (finalProduct.slug || "").toLowerCase(),
        ].filter(Boolean);

        for (const param of finalProduct.parameters) {
          const isLinkedParam =
            (param as any).type === "product_linking" ||
            (param as any).type === "product_link" ||
            (param as any).options?.some((o: any) => Boolean(o.linkedProductId));

          if (!isLinkedParam) continue;

          // Collect all linked product targets in this parameter
          const targetIds = ((param as any).options || [])
            .map((o: any) => (o.linkedProductId ? String(o.linkedProductId).trim() : ""))
            .filter(Boolean);

          let linkedDbProds: any[] = [];
          if (targetIds.length > 0) {
            linkedDbProds = await prisma.product.findMany({
              where: {
                OR: [
                  { id: { in: targetIds } },
                  { sku: { in: targetIds } },
                  { slug: { in: targetIds } },
                ],
                isArchived: false,
              },
              select: {
                id: true,
                sku: true,
                slug: true,
                nameEs: true,
                nameEn: true,
                priceCRC: true,
                parametersJson: true,
                imageUrl: true,
              },
            });
          }

          // Check if any linked product contains a reciprocal label for finalProduct
          let reciprocalLabelEs = "";
          let reciprocalLabelEn = "";

          for (const lp of linkedDbProds) {
            if (lp.parametersJson) {
              try {
                const parsed = JSON.parse(lp.parametersJson);
                if (Array.isArray(parsed)) {
                  for (const p of parsed) {
                    const match = p.options?.find((o: any) => {
                      if (!o.linkedProductId) return false;
                      const l = String(o.linkedProductId).trim().toLowerCase();
                      return currentProdKeys.includes(l);
                    });
                    if (match && (match.labelEs || match.labelEn)) {
                      reciprocalLabelEs = match.labelEs || match.labelEn || "";
                      reciprocalLabelEn = match.labelEn || match.labelEs || "";
                      break;
                    }
                  }
                }
              } catch {}
            }
            if (reciprocalLabelEs) break;
          }

          // Check if current product is a 2-seater or 4-seater SXS edition
          const curTitleLower = `${finalProduct.nameEs || ""} ${finalProduct.nameEn || ""} ${finalProduct.p_title || ""} ${finalProduct.sku || ""}`.toLowerCase();
          const hasLinked4 = linkedDbProds.some((lp) => {
            const s = `${lp.nameEs || ""} ${lp.nameEn || ""} ${lp.sku || ""}`.toLowerCase();
            return s.includes("z10-4") || /\b4[- ]?(seater|seat|plazas)\b/i.test(s);
          });

          const is4Seater = curTitleLower.includes("z10-4") || /\b4[- ]?(seater|seat|plazas)\b/i.test(curTitleLower);
          const is2Seater = !is4Seater && (hasLinked4 || curTitleLower.includes("z10") || /\b2[- ]?(seater|seat|plazas)\b/i.test(curTitleLower));

          const cleanSelfLabelEs = reciprocalLabelEs || (is4Seater ? "Z10-4" : is2Seater ? "2 Seater" : (finalProduct.nameEs || finalProduct.p_title || "Base"));
          const cleanSelfLabelEn = reciprocalLabelEn || (is4Seater ? "Z10-4" : is2Seater ? "2 Seater" : (finalProduct.nameEn || cleanSelfLabelEs));

          // Ensure options list contains the current viewing product
          const opts: any[] = [...((param as any).options || [])];
          let selfOpt = opts.find((o: any) => {
            if (o.isCurrentProduct) return true;
            if (!o.linkedProductId) return true;
            const l = String(o.linkedProductId).trim().toLowerCase();
            return currentProdKeys.includes(l);
          });

          if (!selfOpt) {
            selfOpt = {
              id: `self-${finalProduct.id}`,
              labelEs: cleanSelfLabelEs,
              labelEn: cleanSelfLabelEn,
              priceDeltaCRC: 0,
              linkedProductId: finalProduct.slug || finalProduct.sku || finalProduct.id,
              imageUrl: finalProduct.imageUrl || undefined,
              isCurrentProduct: true,
            };
            opts.unshift(selfOpt);
          } else {
            // Clean up self option label if it was empty or matched the full product title
            const fullTitle = (finalProduct.nameEs || finalProduct.p_title || "").toLowerCase();
            const currLabel = (selfOpt.labelEs || "").toLowerCase();
            if (!selfOpt.labelEs || currLabel === fullTitle || currLabel.includes("skid plate") || currLabel.includes("hdpe") || currLabel === "estándar / base") {
              selfOpt.labelEs = cleanSelfLabelEs;
              selfOpt.labelEn = cleanSelfLabelEn;
            }
            selfOpt.priceDeltaCRC = 0;
            selfOpt.isCurrentProduct = true;
          }

          // Dynamically compute real price delta for linked products relative to this product
          for (const opt of opts) {
            if (opt === selfOpt || !opt.linkedProductId || currentProdKeys.includes(String(opt.linkedProductId).trim().toLowerCase())) {
              opt.priceDeltaCRC = 0;
              opt.isCurrentProduct = true;
              continue;
            }
            const matchRow = linkedDbProds.find((lp) => {
              const lid = String(opt.linkedProductId).trim().toLowerCase();
              return lp.id.toLowerCase() === lid || lp.sku?.toLowerCase() === lid || lp.slug?.toLowerCase() === lid;
            });
            if (matchRow) {
              const targetPrice = matchRow.priceCRC || 0;
              const currentPrice = finalProduct.price?.T_price || finalProduct.priceCRC || 0;
              if (targetPrice > 0 && currentPrice > 0) {
                opt.priceDeltaCRC = Math.round(targetPrice - currentPrice);
              }
              // Clean up linked option label if it was full title
              const rowTitle = (matchRow.nameEs || matchRow.nameEn || "").toLowerCase();
              const optL = (opt.labelEs || "").toLowerCase();
              if (optL === rowTitle || optL.includes("skid plate") || optL.includes("hdpe")) {
                if (rowTitle.includes("z10-4") || /\b4[- ]?(seater|seat|plazas)\b/i.test(rowTitle)) {
                  opt.labelEs = "Z10-4";
                  opt.labelEn = "Z10-4";
                } else if (rowTitle.includes("z10") || /\b2[- ]?(seater|seat|plazas)\b/i.test(rowTitle)) {
                  opt.labelEs = "2 Seater";
                  opt.labelEn = "2 Seater";
                }
              }
            }
          }

          (param as any).options = opts;
        }
      }

      // 1. Explicit related products from configured IDs
      let explicitRelated: ProductItem[] = [];
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
        explicitRelated = relDb.map((p) =>
          dbProductToProductItem(p, null, isStaff)
        );
      }

      // 2. Dynamically fill related products up to 10 with temporary products matching category or brand
      // NOTE: Do not mutate or add to database array, only attach to the response
      const relatedMap = new Map<string, ProductItem>();
      const currentKeys = new Set([
        (finalProduct.id || "").toLowerCase(),
        (finalProduct.sku || "").toLowerCase(),
        (finalProduct.slug || "").toLowerCase(),
      ]);

      // Seed explicit items first
      explicitRelated.forEach((p) => {
        if (!currentKeys.has(p.id.toLowerCase())) {
          relatedMap.set(p.id, p);
        }
      });

      if (relatedMap.size < 10) {
        const primaryCat = finalProduct.category?.[0];
        const primaryBrand = finalProduct.brand?.[0];

        const candidateRows = await prisma.product.findMany({
          where: {
            isArchived: false,
            id: { not: dbProd.id },
          },
          include: { category: true, compatibilities: true },
          take: 40,
        });
        const candidates = candidateRows.map((p) => dbProductToProductItem(p, null, isStaff));

        // Priority A: Same category AND compatible with vehicle platform
        for (const cand of candidates) {
          if (relatedMap.size >= 10) break;
          if (relatedMap.has(cand.id)) continue;
          const sameCat = primaryCat && cand.category?.some((c) => c.toLowerCase() === primaryCat.toLowerCase());
          const samePlat = finalProduct.comp?.some((c) =>
            cand.comp?.some((candC) => isPlatformOrVehicleMatch(candC, c))
          );
          if (sameCat && samePlat) {
            relatedMap.set(cand.id, cand);
          }
        }

        // Priority B: Same category
        for (const cand of candidates) {
          if (relatedMap.size >= 10) break;
          if (relatedMap.has(cand.id)) continue;
          const sameCat = primaryCat && cand.category?.some((c) => c.toLowerCase() === primaryCat.toLowerCase());
          if (sameCat) {
            relatedMap.set(cand.id, cand);
          }
        }

        // Priority C: Same brand
        for (const cand of candidates) {
          if (relatedMap.size >= 10) break;
          if (relatedMap.has(cand.id)) continue;
          const sameBrand = primaryBrand && cand.brand?.some((b) => b.toLowerCase() === primaryBrand.toLowerCase());
          if (sameBrand) {
            relatedMap.set(cand.id, cand);
          }
        }

        // Priority D: Same vehicle platform
        for (const cand of candidates) {
          if (relatedMap.size >= 10) break;
          if (relatedMap.has(cand.id)) continue;
          const samePlat = finalProduct.comp?.some((c) =>
            cand.comp?.some((candC) => isPlatformOrVehicleMatch(candC, c))
          );
          if (samePlat) {
            relatedMap.set(cand.id, cand);
          }
        }

        // Priority E: Other active catalog products
        for (const cand of candidates) {
          if (relatedMap.size >= 10) break;
          if (!relatedMap.has(cand.id)) {
            relatedMap.set(cand.id, cand);
          }
        }
      }

      finalProduct.relatedProducts = Array.from(relatedMap.values()).slice(0, 10);

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
          dbProductToProductItem(p, null, isStaff)
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

      if (finalProduct.requiredProductIds && finalProduct.requiredProductIds.length > 0) {
        const reqIds = finalProduct.requiredProductIds;
        const reqDb = await prisma.product.findMany({
          where: {
            OR: [
              { id: { in: reqIds } },
              { sku: { in: reqIds } },
              { slug: { in: reqIds } },
            ],
            isArchived: false,
          },
          include: { category: true, compatibilities: true },
        });
        finalProduct.requiredProducts = reqDb.map((p) =>
          dbProductToProductItem(p, null, isStaff)
        );
      } else {
        finalProduct.requiredProducts = [];
      }

      return NextResponse.json({ success: true, product: finalProduct });
    }

    // Load active DB products and brands (Zero Mock Data: strictly live database)
    const [activeDbProducts, dbBrands, dbDealerBrands] = await Promise.all([
      prisma.product.findMany({
        where: { isArchived: false },
        include: {
          category: true,
          compatibilities: true,
        },
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
    for (const b of dbBrands) {
      sxsBrandModels[b.slug.toLowerCase()] = b.models.map((m) => ({
        id: m.id,
        name: m.name,
        code: m.code,
        slug: m.slug,
        category: m.category,
        modelCategory: m.modelCategory || null,
        imageUrl: m.imageUrl && m.imageUrl !== "null" && m.imageUrl !== "undefined" ? m.imageUrl.trim() : null,
      }));
    }

    const unifiedProducts: ProductItem[] = activeDbProducts.map((dbProd) =>
      dbProductToProductItem(dbProd, null, isStaff)
    );

    // Dynamic computation of parameters present across active catalog products
    // (Strict Zero Mock Data: only include options that actually exist!)
    const vehicleBrandCounts: Record<string, number> = {};
    const distributorBrandCounts: Record<string, number> = {};
    let globalHasInStock = false;
    let globalHasDiscounted = false;

    unifiedProducts.forEach((p) => {
      // Vehicle brands
      const pVehicleBrands = detectProductVehicleBrands(p);
      pVehicleBrands.forEach((vb) => {
        vehicleBrandCounts[vb.toLowerCase()] = (vehicleBrandCounts[vb.toLowerCase()] || 0) + 1;
      });

      // Distributor brands
      p.brand.forEach((b) => {
        const norm = normalizeBrandName(b.trim());
        if (norm) {
          distributorBrandCounts[norm] = (distributorBrandCounts[norm] || 0) + 1;
        }
      });

      // Stock
      const isAvailable =
        p.supplierStockStatus !== "OUT_OF_STOCK" &&
        p.supplierStockStatus !== "UNAVAILABLE";
      if (isAvailable) globalHasInStock = true;

      // Discounted
      const isDiscounted =
        (p.discountPercent !== undefined && p.discountPercent > 0) ||
        (p.originalPriceCRC !== undefined && p.originalPriceCRC !== null && p.originalPriceCRC > p.price.T_price);
      if (isDiscounted) globalHasDiscounted = true;
    });

    // ONLY show vehicle brands present in products (e.g. if no Yamaha products, Yamaha is NOT shown)
    // Dynamic mapping from live dbBrands with fallback to SXS_BRANDS
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

    // ONLY show distributor brands present in products
    const availableDistributorBrands = Object.entries(distributorBrandCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const productSearchScoreMap = new Map<string, number>();

    // Filter by text search (q), comp, vehicleModel, vehicle brand, distributor brand, inStock, discounted, and category
    const filteredProducts = unifiedProducts.filter((product) => {
      // 1. Text Search (q) with brand disambiguation, unit exclusion, and relevance scoring
      if (q && q.trim()) {
        const searchRes = evaluateProductSearch(product, q, {
          dealerBrands: dealerBrandSearchRefs,
        });
        if (!searchRes.matches) return false;
        productSearchScoreMap.set(product.id, searchRes.score);
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
        const vehicleLower = vehicleModel.toLowerCase().trim();
        const isUniversal = isUniversalFit(product.comp);

        if (!isUniversal) {
          let matchesVehicle = false;

          // A. If product has structured modelYearCompatibility
          if (product.modelYearCompatibility && product.modelYearCompatibility.length > 0) {
            matchesVehicle = product.modelYearCompatibility.some((m) => {
              const fitModel = (m.model || "").toLowerCase().trim();
              const fitMake = (m.make || "").toLowerCase().trim();

              if (fitModel === "all" || fitModel.includes("universal")) return true;

              // If make is specified, verify vehicle brand doesn't contradict
              if (vehicleBrand && vehicleBrand.toLowerCase() !== "all" && fitMake && fitMake !== "all" && !fitMake.includes("universal")) {
                const brandMatches =
                  isPlatformOrVehicleMatch(fitMake, vehicleBrand) ||
                  fitMake.includes(vehicleBrand.toLowerCase()) ||
                  vehicleBrand.toLowerCase().includes(fitMake);
                if (!brandMatches) return false;
              }

              // Model match: vehicle model MUST match fit.model
              const modelMatches = isPlatformOrVehicleMatch(fitModel, vehicleLower);
              if (!modelMatches) return false;

              // Year check: if vehicleYear is provided, it must be within range
              if (vehicleYear && !isNaN(vehicleYear)) {
                if (m.yearFrom && vehicleYear < m.yearFrom) return false;
                if (m.yearTo && vehicleYear > m.yearTo) return false;
              }

              return true;
            });
          }

          // B. Fallback to product.comp array
          if (!matchesVehicle && product.comp && product.comp.length > 0) {
            matchesVehicle = product.comp.some((c) => isPlatformOrVehicleMatch(c, vehicleLower));
          }

          if (!matchesVehicle) return false;
        }
      }

      // 3.1 Model Category filter (e.g. "Maverick X3", "Maverick R", "Defender", "Commander", "Outlander (ATV)", etc.)
      if (modelCategory && modelCategory.toLowerCase() !== "all") {
        const targetCategoryNorm = modelCategory.toLowerCase().trim();
        const isUniversal = isUniversalFit(product.comp);

        if (!isUniversal) {
          // Gather models under this category
          const tokensToMatch = new Set<string>();
          tokensToMatch.add(targetCategoryNorm);
          const cleanToken = targetCategoryNorm.replace(/\([^)]*\)/g, "").trim();
          if (cleanToken) tokensToMatch.add(cleanToken);

          // Check if any registered brand model matches this modelCategory
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

          const matchesCategory = Array.from(tokensToMatch).some((tok) => {
            if (product.comp && product.comp.some((c) => isPlatformOrVehicleMatch(c, tok))) return true;
            if (product.modelYearCompatibility && product.modelYearCompatibility.some((myc) => isPlatformOrVehicleMatch(myc.model, tok))) return true;
            return false;
          });

          if (!matchesCategory) return false;
        }
      }

      // 4. Vehicle Brand Filter (Separated parameter: e.g. "cfmoto", "can-am", "polaris", "kawasaki")
      if (vehicleBrand && vehicleBrand.toLowerCase() !== "all") {
        const targetVehicleBrand = vehicleBrand.toLowerCase().trim();
        const isUniversal = isUniversalFit(product.comp);
        const pVehicleBrands = detectProductVehicleBrands(product);
        const matchesVehicleBrand = pVehicleBrands.includes(targetVehicleBrand);
        if (!isUniversal && !matchesVehicleBrand) return false;
      }

      // 5. Distributor / Parts Manufacturer Brand Filter (Separated parameter: e.g. "Shock Therapy", "EVP")
      if (distributorBrand && distributorBrand.toLowerCase() !== "all") {
        let cleanTarget = distributorBrand.trim();
        if (cleanTarget.startsWith("(") && cleanTarget.endsWith(")")) {
          cleanTarget = cleanTarget.slice(1, -1).trim();
        }
        const targetBrand = cleanTarget.toLowerCase();
        const targetAlpha = targetBrand.replace(/[^a-z0-9]/g, "");
        const normalizedTarget = normalizeBrandName(cleanTarget).toLowerCase();

        const matchesDistributorBrand = product.brand.some((b) => {
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

        if (!matchesDistributorBrand) return false;
      }

      // 6. In Stock Filter (Separated parameter)
      if (inStock) {
        const isAvailable =
          product.supplierStockStatus !== "OUT_OF_STOCK" &&
          product.supplierStockStatus !== "UNAVAILABLE";
        if (!isAvailable) return false;
      }

      // 7. Discounted Filter (Separated parameter)
      if (discounted) {
        const hasDiscount =
          (product.discountPercent !== undefined && product.discountPercent > 0) ||
          (product.originalPriceCRC !== undefined && product.originalPriceCRC !== null && product.originalPriceCRC > product.price.T_price);
        if (!hasDiscount) return false;
      }

      // 8. Category filter
      if (category && category.toLowerCase() !== "all") {
        const targetCat = category.toLowerCase();
        const matchesCat = product.category.some((c) => {
          const cLower = c.toLowerCase();
          if (targetCat === "skit plates" || targetCat === "skid plates") {
            return cLower.includes("skit") || cLower.includes("skid");
          }
          return cLower === targetCat || cLower.includes(targetCat);
        });
        if (!matchesCat) return false;
      }

      return true;
    });

    // Dynamically compute categories that exist ONLY in active products
    const matchingCategorySet = new Set<string>();
    unifiedProducts.forEach((p) => {
      p.category.forEach((cat) => matchingCategorySet.add(cat.trim()));
    });
    const categories = Array.from(matchingCategorySet);

    // Sort
    const filtered = [...filteredProducts];
    if (sort === "price-asc") {
      filtered.sort((a, b) => a.price.T_price - b.price.T_price);
    } else if (sort === "price-desc") {
      filtered.sort((a, b) => b.price.T_price - a.price.T_price);
    } else if (sort === "stars") {
      filtered.sort(
        (a, b) => ((b.reviews as any)?.stars || 0) - ((a.reviews as any)?.stars || 0)
      );
    } else if (q && q.trim()) {
      filtered.sort(
        (a, b) => (productSearchScoreMap.get(b.id) || 0) - (productSearchScoreMap.get(a.id) || 0)
      );
    }

    return NextResponse.json({
      success: true,
      products: filtered,
      total: filtered.length,
      categories,
      brands: availableDistributorBrands.map((b) => b.name),
      availableVehicleBrands,
      availableDistributorBrands,
      hasInStock: globalHasInStock,
      hasDiscounted: globalHasDiscounted,
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
