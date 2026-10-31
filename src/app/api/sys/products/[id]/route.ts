import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog, AuditAction } from "@/lib/audit";
import { ensureDealerBrandRegistered } from "@/lib/dealerBrands";
import { normalizeAudioUrl, normalizeVideoUrl, cleanDescriptionText } from "@/lib/products";
import { cleanupRemovedMediaUrls } from "@/lib/storage";
import { fetchLiveSupplierAvailability } from "@/lib/supplierAvailability";

function collectProductMediaUrls(p: any): string[] {
  if (!p) return [];
  const urls: string[] = [];
  const pushUrl = (u: any) => {
    if (typeof u === "string" && u.trim()) urls.push(u.trim());
  };
  pushUrl(p.imageUrl);
  pushUrl(p.videoUrl);
  pushUrl(p.audioUrl);
  for (const field of [p.imagesJson, p.additionalImagesJson, p.videosJson, p.audiosJson]) {
    if (typeof field === "string" && field.trim()) {
      try {
        const parsed = JSON.parse(field);
        if (Array.isArray(parsed)) parsed.forEach(pushUrl);
      } catch {}
    }
  }
  if (typeof p.parametersJson === "string" && p.parametersJson.trim()) {
    try {
      const params = JSON.parse(p.parametersJson);
      if (Array.isArray(params)) {
        params.forEach((param: any) => {
          if (Array.isArray(param?.options)) {
            param.options.forEach((opt: any) => pushUrl(opt?.imageUrl));
          }
        });
      }
    } catch {}
  }
  return urls;
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const productId = params.id;
    const body = await request.json().catch(() => ({}));

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (body.nameEs !== undefined) updateData.nameEs = body.nameEs;
    if (body.nameEn !== undefined) updateData.nameEn = body.nameEn;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId || null;
    if (body.warrantyCategory !== undefined) updateData.warrantyCategory = body.warrantyCategory;
    if (body.descriptionEs !== undefined) updateData.descriptionEs = cleanDescriptionText(body.descriptionEs);
    if (body.descriptionEn !== undefined) updateData.descriptionEn = cleanDescriptionText(body.descriptionEn);
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.stockStatus !== undefined) updateData.stockStatus = body.stockStatus;
    if (body.featured !== undefined) updateData.featured = Boolean(body.featured);
    if (body.homeInstallationAvailable !== undefined) updateData.homeInstallationAvailable = Boolean(body.homeInstallationAvailable);
    if (body.isInstallationIncluded !== undefined) updateData.isInstallationIncluded = Boolean(body.isInstallationIncluded);
    if (body.isArchived !== undefined) updateData.isArchived = Boolean(body.isArchived);
    if (body.brandName !== undefined) updateData.brandName = body.brandName;
    if (body.requirements !== undefined) updateData.requirements = body.requirements;
    if (body.audioUrl !== undefined) updateData.audioUrl = body.audioUrl;
    if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl;
    if (body.additionalImagesJson !== undefined) {
      updateData.additionalImagesJson = typeof body.additionalImagesJson === "string" ? body.additionalImagesJson : JSON.stringify(body.additionalImagesJson);
    }
    if (body.modelYearCompatibilityJson !== undefined) {
      updateData.modelYearCompatibilityJson = typeof body.modelYearCompatibilityJson === "string" ? body.modelYearCompatibilityJson : JSON.stringify(body.modelYearCompatibilityJson);
    }
    if (body.voidsWarranty !== undefined) {
      updateData.voidsWarranty = Boolean(body.voidsWarranty);
    }
    if (body.relatedProductIds !== undefined) {
      updateData.relatedProductIdsJson = Array.isArray(body.relatedProductIds) ? JSON.stringify(body.relatedProductIds) : String(body.relatedProductIds);
    } else if (body.relatedProductIdsJson !== undefined) {
      updateData.relatedProductIdsJson = typeof body.relatedProductIdsJson === "string" ? body.relatedProductIdsJson : JSON.stringify(body.relatedProductIdsJson);
    }
    if (body.requiredProductIds !== undefined) {
      updateData.requiredProductIdsJson = Array.isArray(body.requiredProductIds) ? JSON.stringify(body.requiredProductIds) : String(body.requiredProductIds);
    } else if (body.requiredProductIdsJson !== undefined) {
      updateData.requiredProductIdsJson = typeof body.requiredProductIdsJson === "string" ? body.requiredProductIdsJson : JSON.stringify(body.requiredProductIdsJson);
    }
    if (body.suggestedProductIds !== undefined) {
      updateData.suggestedProductIdsJson = Array.isArray(body.suggestedProductIds) ? JSON.stringify(body.suggestedProductIds) : String(body.suggestedProductIds);
    } else if (body.suggestedProductIdsJson !== undefined) {
      updateData.suggestedProductIdsJson = typeof body.suggestedProductIdsJson === "string" ? body.suggestedProductIdsJson : JSON.stringify(body.suggestedProductIdsJson);
    }
    if (body.suggestedComboIds !== undefined) {
      updateData.suggestedComboIdsJson = Array.isArray(body.suggestedComboIds) ? JSON.stringify(body.suggestedComboIds) : String(body.suggestedComboIds);
    } else if (body.suggestedComboIdsJson !== undefined) {
      updateData.suggestedComboIdsJson = typeof body.suggestedComboIdsJson === "string" ? body.suggestedComboIdsJson : JSON.stringify(body.suggestedComboIdsJson);
    }

    // Price breakdown extraction (USD inputs P_price_D and S_price_D translated & locked on save)
    const activeRate =
      Number(body.lockedExchangeRate) > 300
        ? Number(body.lockedExchangeRate)
        : (existingProduct as any).lockedExchangeRate && Number((existingProduct as any).lockedExchangeRate) > 300
        ? Number((existingProduct as any).lockedExchangeRate)
        : 455.21;

    const pD = body.processingPriceD !== undefined ? body.processingPriceD : body.price?.P_price_D;
    if (pD !== undefined) updateData.processingPriceD = Number(pD) || 0;

    const pCRC = body.processingPriceCRC !== undefined ? body.processingPriceCRC : body.price?.P_price;
    if (pCRC !== undefined) {
      updateData.processingPriceCRC = Math.round(Number(pCRC) || 0);
    } else if (pD !== undefined && Number(pD) > 0) {
      updateData.processingPriceCRC = Math.round(Number(pD) * activeRate);
    }

    const sD = body.shippingPriceD !== undefined ? body.shippingPriceD : body.price?.S_price_D;
    if (sD !== undefined) updateData.shippingPriceD = Number(Number(sD || 0).toFixed(2));

    const sCRC = body.shippingPriceCRC !== undefined ? body.shippingPriceCRC : body.price?.S_price;
    if (sD !== undefined && Number(sD) >= 0) {
      updateData.shippingPriceCRC = Math.round(Number(sD) * activeRate);
    } else if (sCRC !== undefined) {
      updateData.shippingPriceCRC = Math.round(Number(sCRC) || 0);
      if (sD === undefined && Number(sCRC) > 0) {
        updateData.shippingPriceD = Number((Number(sCRC) / activeRate).toFixed(2));
      }
    }

    const prof = body.profitCRC !== undefined ? body.profitCRC : body.price?.profit;
    if (prof !== undefined) updateData.profitCRC = Math.round(Number(prof) || 0);

    const hasPricingPayload =
      pD !== undefined ||
      pCRC !== undefined ||
      sD !== undefined ||
      sCRC !== undefined ||
      prof !== undefined ||
      body.priceCRC !== undefined ||
      body.price?.T_price !== undefined ||
      body.discountPercent !== undefined ||
      body.ivaPercent !== undefined ||
      body.recalculateLockedPrice === true;

    if (hasPricingPayload) {
      updateData.lockedExchangeRate = activeRate;
      if (body.recalculateLockedPrice === true) {
        const effPD = updateData.processingPriceD ?? existingProduct.processingPriceD ?? 0;
        const effSD = updateData.shippingPriceD ?? (existingProduct as any).shippingPriceD ?? 0;
        if (effPD > 0) updateData.processingPriceCRC = Math.round(effPD * activeRate);
        if (effSD > 0) updateData.shippingPriceCRC = Math.round(effSD * activeRate);
      }
    }

    const tD = body.totalPriceD !== undefined ? body.totalPriceD : body.price?.T_price_D;
    if (tD !== undefined) updateData.totalPriceD = String(tD);

    // Arrays & rich json
    if (body.comp !== undefined) {
      updateData.compJson = Array.isArray(body.comp) ? JSON.stringify(body.comp) : String(body.comp);
    } else if (body.compJson !== undefined) {
      updateData.compJson = typeof body.compJson === "string" ? body.compJson : JSON.stringify(body.compJson);
    }

    if (body.category !== undefined) {
      updateData.categoryJson = Array.isArray(body.category) ? JSON.stringify(body.category) : String(body.category);
    } else if (body.categoryJson !== undefined) {
      updateData.categoryJson = typeof body.categoryJson === "string" ? body.categoryJson : JSON.stringify(body.categoryJson);
    }

    if (body.brand !== undefined) {
      const bArray = Array.isArray(body.brand) ? body.brand : [body.brand];
      updateData.brandJson = JSON.stringify(bArray);
      updateData.brandName = bArray[0] || updateData.brandName;
    } else if (body.brandJson !== undefined) {
      updateData.brandJson = typeof body.brandJson === "string" ? body.brandJson : JSON.stringify(body.brandJson);
    }

    const explicitImageUrl = typeof body.imageUrl === "string" && body.imageUrl.trim() ? body.imageUrl.trim() : null;

    if (body.imgs !== undefined) {
      const imgsArray = (Array.isArray(body.imgs) ? body.imgs : [body.imgs])
        .map((s: any) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean);
      updateData.imagesJson = JSON.stringify(imgsArray);
      updateData.imageUrl = imgsArray[0] || explicitImageUrl || "/images/logo.png";
      updateData.additionalImagesJson = JSON.stringify(imgsArray.slice(1));
    } else if (body.imagesJson !== undefined) {
      let imgsArray: string[] = [];
      try {
        const parsed = typeof body.imagesJson === "string" ? JSON.parse(body.imagesJson) : body.imagesJson;
        if (Array.isArray(parsed)) {
          imgsArray = parsed.map((s: any) => (typeof s === "string" ? s.trim() : "")).filter(Boolean);
        }
      } catch {}
      updateData.imagesJson = JSON.stringify(imgsArray);
      updateData.imageUrl = imgsArray[0] || explicitImageUrl || "/images/logo.png";
      updateData.additionalImagesJson = JSON.stringify(imgsArray.slice(1));
    } else if (explicitImageUrl) {
      updateData.imageUrl = explicitImageUrl;
    }

    if (body.vids !== undefined) {
      const vidsArray = (Array.isArray(body.vids) ? body.vids : [body.vids]).map(normalizeVideoUrl).filter(Boolean);
      updateData.videosJson = JSON.stringify(vidsArray);
      updateData.videoUrl = vidsArray[0] || null;
    } else if (body.videosJson !== undefined) {
      try {
        const parsed = typeof body.videosJson === "string" ? JSON.parse(body.videosJson) : body.videosJson;
        if (Array.isArray(parsed)) {
          const vidsArray = parsed.map(normalizeVideoUrl).filter(Boolean);
          updateData.videosJson = JSON.stringify(vidsArray);
          updateData.videoUrl = vidsArray[0] || null;
        }
      } catch {
        updateData.videosJson = typeof body.videosJson === "string" ? body.videosJson : JSON.stringify(body.videosJson);
      }
    } else if (body.videoUrl !== undefined) {
      const norm = normalizeVideoUrl(body.videoUrl);
      updateData.videoUrl = norm || null;
      updateData.videosJson = JSON.stringify(norm ? [norm] : []);
    }

    if (body.audios !== undefined) {
      const audsArray = (Array.isArray(body.audios) ? body.audios : [body.audios]).map(normalizeAudioUrl).filter(Boolean);
      updateData.audiosJson = JSON.stringify(audsArray);
      updateData.audioUrl = audsArray[0] || null;
    } else if (body.audiosJson !== undefined) {
      try {
        const parsed = typeof body.audiosJson === "string" ? JSON.parse(body.audiosJson) : body.audiosJson;
        if (Array.isArray(parsed)) {
          const audsArray = parsed.map(normalizeAudioUrl).filter(Boolean);
          updateData.audiosJson = JSON.stringify(audsArray);
          updateData.audioUrl = audsArray[0] || null;
        }
      } catch {
        updateData.audiosJson = typeof body.audiosJson === "string" ? body.audiosJson : JSON.stringify(body.audiosJson);
      }
    } else if (body.audioUrl !== undefined) {
      const norm = normalizeAudioUrl(body.audioUrl);
      updateData.audioUrl = norm || null;
      updateData.audiosJson = JSON.stringify(norm ? [norm] : []);
    }

    if (body.reviews !== undefined) {
      updateData.reviews = typeof body.reviews === "string" ? body.reviews : JSON.stringify(body.reviews);
    }

    if (body.supplierUrl !== undefined) updateData.supplierUrl = body.supplierUrl || null;
    if (body.supplierPlatform !== undefined) updateData.supplierPlatform = body.supplierPlatform || null;
    if (body.supplierStockStatus !== undefined) updateData.supplierStockStatus = body.supplierStockStatus || "IN_STOCK";
    if (body.supplierStockCount !== undefined) updateData.supplierStockCount = body.supplierStockCount !== null ? Number(body.supplierStockCount) : null;
    if (body.supplierStockMessageEs !== undefined) updateData.supplierStockMessageEs = body.supplierStockMessageEs;
    if (body.supplierStockMessageEn !== undefined) updateData.supplierStockMessageEn = body.supplierStockMessageEn;
    if (body.supplierLeadDaysMin !== undefined) updateData.supplierLeadDaysMin = Number(body.supplierLeadDaysMin) || 7;
    if (body.supplierLeadDaysMax !== undefined) updateData.supplierLeadDaysMax = Number(body.supplierLeadDaysMax) || 12;
    if (body.supplierLastPriceUSD !== undefined) updateData.supplierLastPriceUSD = body.supplierLastPriceUSD !== null ? Number(body.supplierLastPriceUSD) : null;
    if (body.supplierStockCheckedAt !== undefined) updateData.supplierStockCheckedAt = body.supplierStockCheckedAt ? new Date(body.supplierStockCheckedAt) : null;

    // Auto-fetch supplier price & availability if supplierUrl changed and wasn't just checked
    if (
      body.supplierUrl &&
      body.supplierUrl !== existingProduct.supplierUrl &&
      !body.supplierLastPriceUSD
    ) {
      try {
        const live = await fetchLiveSupplierAvailability(body.supplierUrl);
        if (live.success) {
          updateData.supplierPlatform = live.platform;
          updateData.supplierStockStatus = live.status;
          updateData.supplierStockCount = live.stockCount;
          updateData.supplierStockMessageEs = live.messageEs;
          updateData.supplierStockMessageEn = live.messageEn;
          updateData.supplierStockCheckedAt = new Date();
          updateData.supplierLeadDaysMin = live.leadDaysMin;
          updateData.supplierLeadDaysMax = live.leadDaysMax;
          if (live.supplierPriceUSD && live.supplierPriceUSD > 0) {
            updateData.supplierLastPriceUSD = live.supplierPriceUSD;
            updateData.processingPriceD = live.supplierPriceUSD;
          }
        }
      } catch (checkErr) {
        console.warn("[AUTO_SUPPLIER_CHECK_ON_PATCH_WARN]:", checkErr);
      }
    } else if (
      updateData.supplierLastPriceUSD &&
      updateData.supplierLastPriceUSD > 0 &&
      (!updateData.processingPriceD || updateData.processingPriceD === existingProduct.processingPriceD)
    ) {
      updateData.processingPriceD = updateData.supplierLastPriceUSD;
    }

    const homeInst = body.inHome_install !== undefined ? body.inHome_install : body.homeInstallation !== undefined ? body.homeInstallation : body.homeInstallationAvailable;
    if (homeInst !== undefined) updateData.homeInstallationAvailable = Boolean(homeInst);

    const instInc = body.isInstallationIncluded !== undefined ? body.isInstallationIncluded : body.price?.I_price?.includes;
    if (instInc !== undefined) updateData.isInstallationIncluded = Boolean(instInc);

    const yearCompat = body.year_compatability !== undefined ? body.year_compatability : body.modelYearCompatibility !== undefined ? body.modelYearCompatibility : body.modelYearCompatibilityJson;
    if (yearCompat !== undefined) {
      updateData.modelYearCompatibilityJson = typeof yearCompat === "string" ? yearCompat : JSON.stringify(yearCompat);
    }

    if (body.parameters !== undefined) {
      updateData.parametersJson = JSON.stringify(body.parameters);
    } else if (body.parametersJson !== undefined) {
      updateData.parametersJson = typeof body.parametersJson === "string" ? body.parametersJson : JSON.stringify(body.parametersJson);
    }

    if (body.p_title) {
      updateData.nameEs = body.p_title;
    }

    // Installation Breakdown extraction
    let hasInstallUpdate = false;
    let installLabour = existingProduct.installLabourCostCRC ?? 0;
    if (body.installLabourCostCRC !== undefined) {
      installLabour = Math.round(Number(body.installLabourCostCRC) || 0);
      updateData.installLabourCostCRC = installLabour;
      hasInstallUpdate = true;
    }
    let installProfit = existingProduct.installProfitCRC ?? 0;
    if (body.installProfitCRC !== undefined) {
      installProfit = Math.round(Number(body.installProfitCRC) || 0);
      updateData.installProfitCRC = installProfit;
      hasInstallUpdate = true;
    }
    let extraPartsJson = existingProduct.installExtraPartsJson ?? "[]";
    if (body.installExtraParts !== undefined) {
      extraPartsJson = JSON.stringify(body.installExtraParts);
      updateData.installExtraPartsJson = extraPartsJson;
      hasInstallUpdate = true;
    } else if (body.installExtraPartsJson !== undefined) {
      extraPartsJson = typeof body.installExtraPartsJson === "string" ? body.installExtraPartsJson : JSON.stringify(body.installExtraPartsJson);
      updateData.installExtraPartsJson = extraPartsJson;
      hasInstallUpdate = true;
    }

    let extraPartsSum = 0;
    try {
      const parsedParts = JSON.parse(extraPartsJson);
      if (Array.isArray(parsedParts)) {
        extraPartsSum = parsedParts.reduce((acc: number, pt: any) => acc + (Math.round(Number(pt.priceCRC)) || 0), 0);
      }
    } catch {}

    const calculatedInstallPrice = installLabour + extraPartsSum + installProfit;

    if (body.installationDurationMinutes !== undefined) {
      updateData.installationDurationMinutes = Math.max(15, Math.round(Number(body.installationDurationMinutes) || 60));
    }

    if (body.installationPriceCRC !== undefined) {
      updateData.installationPriceCRC = Math.round(Number(body.installationPriceCRC) || 0);
    } else if (body.price?.I_price?.I_price !== undefined) {
      updateData.installationPriceCRC = Math.round(Number(body.price.I_price.I_price) || 0);
    } else if (hasInstallUpdate) {
      updateData.installationPriceCRC = calculatedInstallPrice;
    }

    if (hasInstallUpdate || updateData.installationPriceCRC !== undefined) {
      updateData.installationBreakdownJson = JSON.stringify({
        labourCostCRC: installLabour,
        extraPartsTotalCRC: extraPartsSum,
        profitCRC: installProfit,
        totalCostCRC: updateData.installationPriceCRC !== undefined ? updateData.installationPriceCRC : calculatedInstallPrice,
      });
    }

    // Calculate true price including 13% IVA
    const ivaRate = body.ivaPercent !== undefined ? Math.max(0, Math.round(Number(body.ivaPercent))) : (updateData.ivaPercent ?? existingProduct.ivaPercent ?? 13);
    updateData.ivaPercent = ivaRate;

    const pCost = updateData.processingPriceCRC !== undefined ? updateData.processingPriceCRC : (existingProduct.processingPriceCRC || 0);
    const sCost = updateData.shippingPriceCRC !== undefined ? updateData.shippingPriceCRC : (existingProduct.shippingPriceCRC || 0);
    const profCost = updateData.profitCRC !== undefined ? updateData.profitCRC : (existingProduct.profitCRC || 0);
    const isInstInc = updateData.isInstallationIncluded !== undefined ? updateData.isInstallationIncluded : (existingProduct.isInstallationIncluded ?? true);
    const instCost = isInstInc ? (updateData.installationPriceCRC !== undefined ? updateData.installationPriceCRC : (existingProduct.installationPriceCRC || 0)) : 0;
    const baseSubtotal = pCost + sCost + profCost + instCost;
    const discountPct = body.discountPercent !== undefined ? Math.max(0, Math.min(100, Math.round(Number(body.discountPercent) || 0))) : ((existingProduct as any).discountPercent || 0);
    updateData.discountPercent = discountPct;

    const discountedSubtotal = discountPct > 0 ? Math.round(baseSubtotal * (1 - discountPct / 100)) : baseSubtotal;
    const computedIvaCRC = Math.round(discountedSubtotal * (ivaRate / 100));
    const computedTPrice = discountedSubtotal + computedIvaCRC;
    const computedOrigPrice = Math.round(baseSubtotal * (1 + ivaRate / 100));

    // Lock T_price (priceCRC) on creation or edit whenever pricing fields are saved
    const reqPriceCRC = body.priceCRC !== undefined ? body.priceCRC : body.price?.T_price;
    if (hasPricingPayload || hasInstallUpdate) {
      if (computedTPrice > 0) {
        updateData.priceCRC = computedTPrice;
        updateData.originalPriceCRC = computedOrigPrice;
        updateData.ivaCRC = computedIvaCRC;
      } else if (reqPriceCRC !== undefined) {
        updateData.priceCRC = Math.round(Number(reqPriceCRC));
        updateData.ivaCRC = Math.round((Number(updateData.priceCRC) || 0) * (ivaRate / (100 + ivaRate)));
      }
    }

    if (body.originalPriceCRC !== undefined) {
      updateData.originalPriceCRC = Math.round(Number(body.originalPriceCRC) || 0);
    }

    if (body.ivaCRC !== undefined && updateData.ivaCRC === undefined) {
      updateData.ivaCRC = Math.round(Number(body.ivaCRC));
    }

    const previousMediaUrls = collectProductMediaUrls(existingProduct);

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    // Eliminate any replaced or removed media files from cloud/local storage
    try {
      const nextMediaUrls = collectProductMediaUrls(updatedProduct);
      await cleanupRemovedMediaUrls(previousMediaUrls, nextMediaUrls);
    } catch (cleanErr) {
      console.warn("[PRODUCT_MEDIA_CLEANUP_WARN]:", cleanErr);
    }

    // Synchronize relational ProductCompatibility records
    if (body.compatibilities !== undefined || body.comp !== undefined) {
      try {
        await prisma.productCompatibility.deleteMany({
          where: { productId },
        });

        const compItemsToCreate: Array<{ brandSlug: string; modelSlug: string; yearFrom: number; yearTo: number }> = [];

        if (Array.isArray(body.compatibilities) && body.compatibilities.length > 0) {
          body.compatibilities.forEach((c: any) => {
            if (c.modelSlug && c.modelSlug !== "all" && !c.modelSlug.includes("universal")) {
              compItemsToCreate.push({
                brandSlug: c.brandSlug || "general",
                modelSlug: c.modelSlug,
                yearFrom: Number(c.yearFrom) || 2020,
                yearTo: Number(c.yearTo) || 2027,
              });
            }
          });
        } else if (Array.isArray(body.comp)) {
          body.comp.forEach((slug: string) => {
            if (slug && slug !== "all" && !slug.includes("universal")) {
              const brandSlug = slug.includes("can-am") || slug.includes("x3") ? "can-am" : slug.includes("villain") ? "segway" : "cfmoto";
              compItemsToCreate.push({
                brandSlug,
                modelSlug: slug,
                yearFrom: 2022,
                yearTo: 2027,
              });
            }
          });
        }

        if (compItemsToCreate.length > 0) {
          await prisma.productCompatibility.createMany({
            data: compItemsToCreate.map((item) => ({
              productId,
              brandSlug: item.brandSlug,
              modelSlug: item.modelSlug,
              yearFrom: item.yearFrom,
              yearTo: item.yearTo,
            })),
          });
        }
      } catch (compErr) {
        console.error("[AUTO_SYNC_PRODUCT_COMPATIBILITY_ERROR]:", compErr);
      }
    }

    // Auto-register brand in DealerBrand table if added or updated
    try {
      const brandToRegister =
        updatedProduct.brandName ||
        (body.brand && (Array.isArray(body.brand) ? body.brand[0] : body.brand)) ||
        body.brandName;
      if (brandToRegister) {
        await ensureDealerBrandRegistered(brandToRegister, updatedProduct.imageUrl);
      }
    } catch (dealerErr) {
      console.error("[AUTO_REGISTER_DEALER_BRAND_ON_PRODUCT_UPDATE_ERROR]:", dealerErr);
    }

    // Synchronize updates directly to src/data/products.json
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const productsJsonPath = path.join(process.cwd(), "src", "data", "products.json");
      const rawData = await fs.readFile(productsJsonPath, "utf-8");
      const productsArray = JSON.parse(rawData);

      const targetIdx = productsArray.findIndex(
        (p: any) =>
          p.id?.toLowerCase() === updatedProduct.sku.toLowerCase() ||
          p.slug?.toLowerCase() === updatedProduct.slug.toLowerCase() ||
          p.id?.toLowerCase() === updatedProduct.id.toLowerCase()
      );

      if (targetIdx !== -1) {
        const target = productsArray[targetIdx];

        // 1. comp
        if (body.comp !== undefined) {
          target.comp = Array.isArray(body.comp) ? body.comp : [body.comp];
        } else if (updatedProduct.compJson) {
          try { target.comp = JSON.parse(updatedProduct.compJson); } catch {}
        }

        // 2. category
        if (body.category !== undefined) {
          target.category = Array.isArray(body.category) ? body.category : [body.category];
        } else if (updatedProduct.categoryJson) {
          try { target.category = JSON.parse(updatedProduct.categoryJson); } catch {}
        }

        // 3. brand
        if (body.brand !== undefined) {
          target.brand = Array.isArray(body.brand) ? body.brand : [body.brand];
        } else if (updatedProduct.brandName) {
          target.brand = [updatedProduct.brandName];
        }

        // 4. price hierarchy
        if (!target.price) target.price = {};
        target.price.P_price_D = updatedProduct.processingPriceD ?? target.price.P_price_D ?? 0;
        target.price.P_price = updatedProduct.processingPriceCRC ?? target.price.P_price ?? 0;
        target.price.S_price = updatedProduct.shippingPriceCRC ?? target.price.S_price ?? 0;
        target.price.I_price = {
          includes: Boolean(updatedProduct.isInstallationIncluded),
          I_price: updatedProduct.installationPriceCRC ?? 0,
        };
        target.price.profit = updatedProduct.profitCRC ?? target.price.profit ?? 0;
        target.installationDurationMinutes = updatedProduct.installationDurationMinutes ?? 60;
        target.price.T_price = updatedProduct.priceCRC;
        target.price.T_price_D = updatedProduct.totalPriceD || "calculate in checkout with the selling value of dolar to colones";
        target.discountPercent = updatedProduct.discountPercent || 0;
        target.originalPriceCRC = updatedProduct.originalPriceCRC || updatedProduct.priceCRC;

        // 5. imgs
        if (body.imgs !== undefined) {
          target.imgs = Array.isArray(body.imgs) ? body.imgs : [body.imgs];
        } else if (updatedProduct.imagesJson) {
          try { target.imgs = JSON.parse(updatedProduct.imagesJson); } catch {}
        } else if (updatedProduct.imageUrl) {
          if (!Array.isArray(target.imgs)) target.imgs = [];
          if (!target.imgs.includes(updatedProduct.imageUrl)) target.imgs.unshift(updatedProduct.imageUrl);
        }

        // 6. vids
        if (body.vids !== undefined) {
          target.vids = Array.isArray(body.vids) ? body.vids : [body.vids];
        } else if (updatedProduct.videosJson) {
          try { target.vids = JSON.parse(updatedProduct.videosJson); } catch {}
        }

        // 7. audios
        if (body.audios !== undefined) {
          target.audios = Array.isArray(body.audios) ? body.audios : [body.audios];
        } else if (updatedProduct.audiosJson) {
          try { target.audios = JSON.parse(updatedProduct.audiosJson); } catch {}
        }

        // 8. p_title
        target.p_title = body.p_title || updatedProduct.nameEs || target.p_title;

        // 9. description
        if (body.description !== undefined) {
          target.description = body.description;
        } else if (updatedProduct.descriptionEs) {
          const cleanEs = cleanDescriptionText(updatedProduct.descriptionEs);
          const cleanEn = cleanDescriptionText(updatedProduct.descriptionEn || "");
          target.description = {
            es: [{ title: "Descripción", content: cleanEs }],
            en: [{ title: "Description", content: cleanEn }],
          };
        }

        // 10. requirements
        if (updatedProduct.requirements !== undefined) target.requirements = updatedProduct.requirements;

        // 11. reviews
        if (updatedProduct.reviews !== undefined) target.reviews = updatedProduct.reviews;

        // 12. inHome_install / homeInstallation
        target.homeInstallation = updatedProduct.homeInstallationAvailable;
        target.inHome_install = updatedProduct.homeInstallationAvailable;

        // 13. year_compatability / modelYearCompatibility
        if (body.year_compatability !== undefined) {
          target.modelYearCompatibility = Array.isArray(body.year_compatability) ? body.year_compatability : [];
        } else if (updatedProduct.modelYearCompatibilityJson) {
          try { target.modelYearCompatibility = JSON.parse(updatedProduct.modelYearCompatibilityJson); } catch {}
        }

        // 14. Supplier tracking & availability
        if (updatedProduct.supplierUrl !== undefined) target.supplierUrl = updatedProduct.supplierUrl;
        if (updatedProduct.supplierStockStatus !== undefined) target.supplierStockStatus = updatedProduct.supplierStockStatus;
        if (updatedProduct.supplierPlatform !== undefined) target.supplierPlatform = updatedProduct.supplierPlatform;
        if (updatedProduct.supplierStockCount !== undefined) target.supplierStockCount = updatedProduct.supplierStockCount;
        if (updatedProduct.supplierStockMessageEs !== undefined) target.supplierStockMessageEs = updatedProduct.supplierStockMessageEs;
        if (updatedProduct.supplierStockMessageEn !== undefined) target.supplierStockMessageEn = updatedProduct.supplierStockMessageEn;
        if (updatedProduct.supplierLeadDaysMin !== undefined) target.supplierLeadDaysMin = updatedProduct.supplierLeadDaysMin;
        if (updatedProduct.supplierLeadDaysMax !== undefined) target.supplierLeadDaysMax = updatedProduct.supplierLeadDaysMax;
        if (updatedProduct.supplierLastPriceUSD !== undefined) target.supplierLastPriceUSD = updatedProduct.supplierLastPriceUSD;
        if (updatedProduct.supplierStockCheckedAt) target.supplierStockCheckedAt = updatedProduct.supplierStockCheckedAt.toISOString();

        if (body.voidsWarranty !== undefined) target.voidsWarranty = Boolean(body.voidsWarranty);
        else if (updatedProduct.voidsWarranty !== undefined) target.voidsWarranty = Boolean(updatedProduct.voidsWarranty);

        if (body.relatedProductIds !== undefined) {
          target.relatedProductIds = Array.isArray(body.relatedProductIds) ? body.relatedProductIds : [];
        } else if (updatedProduct.relatedProductIdsJson) {
          try { target.relatedProductIds = JSON.parse(updatedProduct.relatedProductIdsJson); } catch {}
        }

        if (body.requiredProductIds !== undefined) {
          target.requiredProductIds = Array.isArray(body.requiredProductIds) ? body.requiredProductIds : [];
        } else if ((updatedProduct as any).requiredProductIdsJson) {
          try { target.requiredProductIds = JSON.parse((updatedProduct as any).requiredProductIdsJson); } catch {}
        }

        if (body.suggestedProductIds !== undefined) {
          target.suggestedProductIds = Array.isArray(body.suggestedProductIds) ? body.suggestedProductIds : [];
        } else if ((updatedProduct as any).suggestedProductIdsJson) {
          try { target.suggestedProductIds = JSON.parse((updatedProduct as any).suggestedProductIdsJson); } catch {}
        }

        if (body.suggestedComboIds !== undefined) {
          target.suggestedComboIds = Array.isArray(body.suggestedComboIds) ? body.suggestedComboIds : [];
        } else if ((updatedProduct as any).suggestedComboIdsJson) {
          try { target.suggestedComboIds = JSON.parse((updatedProduct as any).suggestedComboIdsJson); } catch {}
        }

        if (body.parameters !== undefined) {
          target.parameters = body.parameters;
        } else if (updatedProduct.parametersJson) {
          try { target.parameters = JSON.parse(updatedProduct.parametersJson); } catch {}
        }

        productsArray[targetIdx] = target;
        if (process.env.VERCEL !== "1" && process.env.NODE_ENV !== "production") {
          await fs.writeFile(productsJsonPath, JSON.stringify(productsArray, null, 2), "utf-8");
        }
      }
    } catch (syncErr) {
      console.warn("[SYS_PRODUCT_SYNC_JSON_WARN]:", syncErr);
    }

    // Determine audit action type
    let auditAction: AuditAction = "UPDATE_PRODUCT";
    if (body.priceCRC !== undefined && body.priceCRC !== existingProduct.priceCRC) {
      auditAction = "UPDATE_PRODUCT_PRICE";
    } else if (
      (body.installationPriceCRC !== undefined &&
        body.installationPriceCRC !== existingProduct.installationPriceCRC) ||
      (body.isInstallationIncluded !== undefined &&
        body.isInstallationIncluded !== existingProduct.isInstallationIncluded)
    ) {
      auditAction = "UPDATE_INSTALLATION_COST";
    }

    await recordAuditLog({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: auditAction,
      entityType: "PRODUCT",
      entityId: productId,
      oldData: {
        priceCRC: existingProduct.priceCRC,
        installationPriceCRC: existingProduct.installationPriceCRC,
        isInstallationIncluded: existingProduct.isInstallationIncluded,
        stockStatus: existingProduct.stockStatus,
        isArchived: existingProduct.isArchived,
      },
      newData: {
        priceCRC: updatedProduct.priceCRC,
        installationPriceCRC: updatedProduct.installationPriceCRC,
        isInstallationIncluded: updatedProduct.isInstallationIncluded,
        stockStatus: updatedProduct.stockStatus,
        isArchived: updatedProduct.isArchived,
      },
      details: `Product ${existingProduct.sku} updated by ${auth.session.role} ${auth.session.email}`,
    });

    // Bidirectional sync for product linking parameters
    try {
      let paramsArr: any[] = [];
      if (body.parameters && Array.isArray(body.parameters)) paramsArr = body.parameters;
      else if (typeof body.parametersJson === "string") {
        try { paramsArr = JSON.parse(body.parametersJson); } catch {}
      }

      for (const p of paramsArr) {
        const isPLink = p.type === "product_linking" || p.type === "product_link" || p.options?.some((o: any) => Boolean(o.linkedProductId));
        if (!isPLink || !Array.isArray(p.options)) continue;

        // Find this product's self option
        const thisProductOpt = p.options.find((o: any) => {
          if (!o.linkedProductId) return true;
          const lid = String(o.linkedProductId).toLowerCase().trim();
          return lid === updatedProduct.id.toLowerCase() || lid === updatedProduct.sku.toLowerCase() || lid === (updatedProduct.slug || "").toLowerCase();
        });
        const thisOptLabelEs = thisProductOpt?.labelEs || "2 Seater";
        const thisOptLabelEn = thisProductOpt?.labelEn || thisOptLabelEs;

        // For each linked product option:
        for (const opt of p.options) {
          if (!opt.linkedProductId) continue;
          const targetId = String(opt.linkedProductId).trim();
          if (targetId.toLowerCase() === updatedProduct.id.toLowerCase() || targetId.toLowerCase() === updatedProduct.sku.toLowerCase() || targetId.toLowerCase() === (updatedProduct.slug || "").toLowerCase()) continue;

          const targetProd = await prisma.product.findFirst({
            where: {
              OR: [
                { id: targetId },
                { sku: targetId },
                { slug: targetId },
              ],
              isArchived: false,
            },
          });
          if (!targetProd) continue;

          let targetParams: any[] = [];
          if (targetProd.parametersJson) {
            try { targetParams = JSON.parse(targetProd.parametersJson); } catch {}
          }
          if (!Array.isArray(targetParams)) targetParams = [];

          let targetLinkParam = targetParams.find((tp: any) => tp.type === "product_linking" || tp.type === "product_link" || tp.nameEs === p.nameEs);
          if (!targetLinkParam) {
            targetLinkParam = {
              id: `param-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              nameEs: p.nameEs || "Versión / Edición",
              nameEn: p.nameEn || "Edition / Version",
              type: "product_linking",
              options: [],
            };
            targetParams.push(targetLinkParam);
          }
          if (!Array.isArray(targetLinkParam.options)) targetLinkParam.options = [];

          // Option in target product pointing back to this product
          const recipLid = updatedProduct.slug || updatedProduct.sku || updatedProduct.id;
          const recipDelta = opt.priceDeltaCRC ? -opt.priceDeltaCRC : (Math.round((updatedProduct.priceCRC || 0) - (targetProd.priceCRC || 0)));
          const recipOpt = targetLinkParam.options.find((to: any) => {
            const l = String(to.linkedProductId || "").toLowerCase().trim();
            return l === updatedProduct.id.toLowerCase() || l === updatedProduct.sku.toLowerCase() || l === (updatedProduct.slug || "").toLowerCase();
          });

          if (recipOpt) {
            recipOpt.labelEs = thisOptLabelEs;
            recipOpt.labelEn = thisOptLabelEn;
            recipOpt.priceDeltaCRC = recipDelta;
            recipOpt.linkedProductId = recipLid;
          } else {
            targetLinkParam.options.push({
              id: `opt-${Date.now()}-recip`,
              labelEs: thisOptLabelEs,
              labelEn: thisOptLabelEn,
              priceDeltaCRC: recipDelta,
              linkedProductId: recipLid,
            });
          }

          // Option in target product representing target product itself
          const targetSelfOpt = targetLinkParam.options.find((to: any) => !to.linkedProductId || to.linkedProductId === targetProd.id || to.linkedProductId === targetProd.sku || to.linkedProductId === targetProd.slug);
          const targetSelfLabel = opt.labelEs || "4 Seater";
          if (targetSelfOpt) {
            targetSelfOpt.labelEs = targetSelfLabel;
            targetSelfOpt.labelEn = opt.labelEn || targetSelfLabel;
            targetSelfOpt.priceDeltaCRC = 0;
          } else {
            targetLinkParam.options.unshift({
              id: `opt-${Date.now()}-self`,
              labelEs: targetSelfLabel,
              labelEn: opt.labelEn || targetSelfLabel,
              priceDeltaCRC: 0,
              linkedProductId: "",
            });
          }

          await prisma.product.update({
            where: { id: targetProd.id },
            data: { parametersJson: JSON.stringify(targetParams) },
          });
        }
      }
    } catch (syncErr) {
      console.error("[AUTO_SYNC_PRODUCT_LINKING_ERROR]:", syncErr);
    }

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error("[SYS_PRODUCT_PATCH_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const productId = params.id;
    const body = await request.json().catch(() => ({}));
    const action = body.action || "eliminate";

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const fs = await import("fs/promises");
    const path = await import("path");
    const productsJsonPath = path.join(process.cwd(), "src", "data", "products.json");

    if (action === "archive" || action === "unarchive") {
      const isArchived = action === "archive";
      const updated = await prisma.product.update({
        where: { id: productId },
        data: { isArchived },
      });

      // Sync isArchived to products.json
      try {
        const fileContent = await fs.readFile(productsJsonPath, "utf-8");
        const productsArray = JSON.parse(fileContent);
        if (Array.isArray(productsArray)) {
          const idx = productsArray.findIndex(
            (p: any) =>
              p.id?.toLowerCase() === existing.sku.toLowerCase() ||
              p.slug?.toLowerCase() === existing.slug.toLowerCase() ||
              p.sku?.toLowerCase() === existing.sku.toLowerCase()
          );
          if (idx !== -1) {
            productsArray[idx].isArchived = isArchived;
            if (process.env.VERCEL !== "1" && process.env.NODE_ENV !== "production") {
              await fs.writeFile(productsJsonPath, JSON.stringify(productsArray, null, 2), "utf-8");
            }
          }
        }
      } catch (jsonErr) {
        console.error("[SYS_PRODUCT_JSON_ARCHIVE_WARN]:", jsonErr);
      }

      await recordAuditLog({
        actorId: auth.session.userId,
        actorEmail: auth.session.email,
        actorRole: auth.session.role,
        action: "UPDATE_PRODUCT",
        entityType: "PRODUCT",
        entityId: productId,
        oldData: { sku: existing.sku, isArchived: existing.isArchived },
        newData: { sku: existing.sku, isArchived },
        details: `Product ${existing.sku} ${isArchived ? "archived" : "unarchived"} by ${auth.session.role} ${auth.session.email}`,
      });

      return NextResponse.json({ success: true, product: updated, isArchived });
    }

    // ELIMINATION: Strictly requires Master user password with brute-force defense
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    const { verifyMasterElevationPassword } = await import("@/lib/stealthAuth");
    const elevation = await verifyMasterElevationPassword({
      ip,
      password: body.masterPassword,
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actionDescription: `Eliminación permanente del producto ${existing.slug || existing.sku || existing.id}`,
    });

    if (!elevation.success) {
      return NextResponse.json(
        { success: false, error: elevation.error, retryAfterSeconds: elevation.retryAfterSeconds },
        { status: elevation.status }
      );
    }

    // Cascade delete compatibilities
    await prisma.productCompatibility.deleteMany({ where: { productId } });

    const mediaToEliminate = collectProductMediaUrls(existing);

    // Hard delete from database
    await prisma.product.delete({ where: { id: productId } });

    // Hard delete associated media from storage
    try {
      await cleanupRemovedMediaUrls(mediaToEliminate, []);
    } catch (cleanErr) {
      console.warn("[PRODUCT_DELETE_MEDIA_CLEANUP_WARN]:", cleanErr);
    }

    // Hard delete from products.json
    try {
      const fileContent = await fs.readFile(productsJsonPath, "utf-8");
      const productsArray = JSON.parse(fileContent);
      if (Array.isArray(productsArray)) {
        const filtered = productsArray.filter(
          (p: any) =>
            p.id?.toLowerCase() !== existing.sku.toLowerCase() &&
            p.slug?.toLowerCase() !== existing.slug.toLowerCase() &&
            p.sku?.toLowerCase() !== existing.sku.toLowerCase()
        );
        if (process.env.VERCEL !== "1" && process.env.NODE_ENV !== "production") {
          await fs.writeFile(productsJsonPath, JSON.stringify(filtered, null, 2), "utf-8");
        }
      }
    } catch (jsonErr) {
      console.warn("[SYS_PRODUCT_JSON_DELETE_WARN]:", jsonErr);
    }

    await recordAuditLog({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: "DELETE_PRODUCT",
      entityType: "PRODUCT",
      entityId: productId,
      oldData: { sku: existing.sku, nameEs: existing.nameEs },
      newData: null,
      details: `Product ${existing.sku} permanently eliminated with Master authorization by ${auth.session.role} ${auth.session.email}`,
    });

    return NextResponse.json({ success: true, eliminated: true, productId });
  } catch (error) {
    console.error("[SYS_PRODUCT_DELETE_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al procesar la eliminación del producto." },
      { status: 500 }
    );
  }
}
