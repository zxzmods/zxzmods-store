import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { fetchLiveSupplierAvailability } from "@/lib/supplierAvailability";
import { ensureDealerBrandRegistered } from "@/lib/dealerBrands";
import { normalizeAudioUrl, normalizeVideoUrl, cleanDescriptionText } from "@/lib/products";

export async function POST(request: Request) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const {
      sku,
      slug,
      nameEs,
      nameEn,
      categoryId = null,
      priceCRC = 0,
      installationPriceCRC = 0,
      warrantyCategory = "PARTS_ONLY",
      descriptionEs = "",
      descriptionEn = "",
      imageUrl = "/images/products/placeholder.webp",
      stockStatus = "IN_STOCK_US",
      featured = false,
      homeInstallationAvailable = true,
      isInstallationIncluded = true,
      brandName = "Bikeman Performance",
      requirements = "",
      additionalImagesJson = "[]",
      audioUrl = "",
      videoUrl = "",
      modelYearCompatibilityJson = "[]",
      compatibilities = [],
    } = body;

    if (!sku || !nameEs || !nameEn) {
      return NextResponse.json(
        { success: false, error: "SKU, Spanish name, and English name are required" },
        { status: 400 }
      );
    }

    const cleanSlug =
      slug ||
      nameEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const pD = body.processingPriceD !== undefined ? body.processingPriceD : body.price?.P_price_D;
    const pCRC = body.processingPriceCRC !== undefined ? body.processingPriceCRC : body.price?.P_price;
    const sCRC = body.shippingPriceCRC !== undefined ? body.shippingPriceCRC : body.price?.S_price;
    const prof = body.profitCRC !== undefined ? body.profitCRC : body.price?.profit;
    const tD = body.totalPriceD !== undefined ? body.totalPriceD : body.price?.T_price_D;

    const compArr = body.comp !== undefined ? (Array.isArray(body.comp) ? body.comp : [body.comp]) : ["zforce-z10"];
    const catArr = body.category !== undefined ? (Array.isArray(body.category) ? body.category : [body.category]) : ["performance"];
    const brandArr = body.brand !== undefined ? (Array.isArray(body.brand) ? body.brand : [body.brand]) : [brandName || "Bikeman Performance"];
    const explicitImageUrl = typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : (typeof body.imageUrl === "string" && body.imageUrl.trim() ? body.imageUrl.trim() : null);
    let rawImgs = body.imgs !== undefined ? (Array.isArray(body.imgs) ? body.imgs : [body.imgs]) : (explicitImageUrl ? [explicitImageUrl] : ["/images/logo.png"]);
    rawImgs = rawImgs.map((s: any) => (typeof s === "string" ? s.trim() : "")).filter(Boolean);
    if (explicitImageUrl) {
      rawImgs = [explicitImageUrl, ...rawImgs.filter((u: string) => u !== explicitImageUrl)];
    }
    const imgsArr = rawImgs.length > 0 ? rawImgs : ["/images/logo.png"];
    const finalImageUrl = explicitImageUrl || imgsArr[0] || "/images/logo.png";
    const vidsArr = (body.vids !== undefined ? (Array.isArray(body.vids) ? body.vids : [body.vids]) : (videoUrl ? [videoUrl] : []))
      .map(normalizeVideoUrl)
      .filter(Boolean);
    const audsArr = (body.audios !== undefined ? (Array.isArray(body.audios) ? body.audios : [body.audios]) : (audioUrl ? [audioUrl] : []))
      .map(normalizeAudioUrl)
      .filter(Boolean);
    const ymArr = body.year_compatability !== undefined ? (Array.isArray(body.year_compatability) ? body.year_compatability : []) : (body.modelYearCompatibility || []);

    // Automatic supplier availability verification on product creation
    let supplierPlatform = body.supplierPlatform || null;
    let supplierStockStatus = body.supplierStockStatus || "IN_STOCK";
    let supplierStockCount = body.supplierStockCount !== undefined && body.supplierStockCount !== null ? Number(body.supplierStockCount) : null;
    let supplierStockMessageEs = body.supplierStockMessageEs || null;
    let supplierStockMessageEn = body.supplierStockMessageEn || null;
    let supplierStockCheckedAt = body.supplierStockCheckedAt ? new Date(body.supplierStockCheckedAt) : null;
    let supplierLeadDaysMin = Number(body.supplierLeadDaysMin) || 7;
    let supplierLeadDaysMax = Number(body.supplierLeadDaysMax) || 12;
    let supplierLastPriceUSD = body.supplierLastPriceUSD !== undefined && body.supplierLastPriceUSD !== null ? Number(body.supplierLastPriceUSD) : null;

    if (body.supplierUrl && !supplierStockCheckedAt) {
      try {
        const live = await fetchLiveSupplierAvailability(body.supplierUrl);
        if (live.success) {
          supplierPlatform = live.platform;
          supplierStockStatus = live.status;
          supplierStockCount = live.stockCount;
          supplierStockMessageEs = live.messageEs;
          supplierStockMessageEn = live.messageEn;
          supplierStockCheckedAt = new Date();
          supplierLeadDaysMin = live.leadDaysMin;
          supplierLeadDaysMax = live.leadDaysMax;
          if (live.supplierPriceUSD) supplierLastPriceUSD = live.supplierPriceUSD;
        }
      } catch (checkErr) {
        console.error("[AUTO_SUPPLIER_CHECK_ON_CREATE_ERROR]:", checkErr);
      }
    }

    // Calculate installation breakdown & costs
    const installLabour = body.installLabourCostCRC !== undefined
      ? Math.round(Number(body.installLabourCostCRC) || 0)
      : Math.round(Number(body.price?.I_price?.I_price || installationPriceCRC) || 0);
    const installProfit = body.installProfitCRC !== undefined ? Math.round(Number(body.installProfitCRC) || 0) : 0;
    const extraPartsJson = body.installExtraParts !== undefined
      ? JSON.stringify(body.installExtraParts)
      : typeof body.installExtraPartsJson === "string"
      ? body.installExtraPartsJson
      : "[]";
    let extraPartsSum = 0;
    try {
      const parsedParts = JSON.parse(extraPartsJson);
      if (Array.isArray(parsedParts)) {
        extraPartsSum = parsedParts.reduce((acc: number, pt: any) => acc + (Math.round(Number(pt.priceCRC)) || 0), 0);
      }
    } catch {}
    const calculatedInstallPrice = installLabour + extraPartsSum + installProfit;
    const finalInstallPrice = calculatedInstallPrice > 0
      ? calculatedInstallPrice
      : Math.round(Number(body.price?.I_price?.I_price || installationPriceCRC) || 0);

    // Calculate true price including 13% IVA
    const ivaRate = body.ivaPercent !== undefined ? Math.max(0, Number(body.ivaPercent)) : 13;
    const pCost = Math.round(Number(pCRC) || 0);
    const sCost = Math.round(Number(sCRC) || 0);
    const profCost = Math.round(Number(prof) || 0);
    const isInstInc = Boolean(body.price?.I_price?.includes !== undefined ? body.price?.I_price?.includes : isInstallationIncluded);
    const instCost = isInstInc ? finalInstallPrice : 0;
    const baseSubtotal = pCost + sCost + profCost + instCost;
    const discountPct = Math.max(0, Math.min(100, Math.round(Number(body.discountPercent) || 0)));
    const discountedSubtotal = discountPct > 0 ? Math.round(baseSubtotal * (1 - discountPct / 100)) : baseSubtotal;
    const computedIvaCRC = Math.round(discountedSubtotal * (ivaRate / 100));
    const computedTPrice = discountedSubtotal + computedIvaCRC;
    const computedOrigPrice = Math.round(baseSubtotal * (1 + ivaRate / 100));

    const finalPriceCRC = computedTPrice > 0 ? computedTPrice : Math.round(Number(body.price?.T_price || priceCRC) || 0);
    const finalOriginalPriceCRC = computedOrigPrice > 0 ? computedOrigPrice : Math.round(Number(body.originalPriceCRC || body.price?.originalPriceCRC || finalPriceCRC) || 0);
    const finalIvaCRC = computedIvaCRC > 0 ? computedIvaCRC : (body.ivaCRC !== undefined ? Math.round(Number(body.ivaCRC)) : Math.round((finalPriceCRC * 13) / 113));

    const newProduct = await prisma.product.create({
      data: {
        sku,
        slug: cleanSlug,
        nameEs: body.p_title || nameEs,
        nameEn,
        categoryId: categoryId || null,
        priceCRC: finalPriceCRC,
        originalPriceCRC: finalOriginalPriceCRC,
        discountPercent: discountPct,
        installationPriceCRC: finalInstallPrice,
        installationDurationMinutes: Math.max(15, Math.round(Number(body.installationDurationMinutes) || 60)),
        installLabourCostCRC: installLabour,
        installProfitCRC: installProfit,
        installExtraPartsJson: extraPartsJson,
        installationBreakdownJson: JSON.stringify({
          labourCostCRC: installLabour,
          extraPartsTotalCRC: extraPartsSum,
          profitCRC: installProfit,
          totalCostCRC: finalInstallPrice,
        }),
        processingPriceD: Number(pD) || 0,
        processingPriceCRC: pCost,
        shippingPriceCRC: sCost,
        profitCRC: profCost,
        ivaPercent: ivaRate,
        ivaCRC: finalIvaCRC,
        totalPriceD: tD ? String(tD) : "calculate in checkout with the selling value of dolar to colones",
        warrantyCategory,
        descriptionEs: cleanDescriptionText(descriptionEs),
        descriptionEn: cleanDescriptionText(descriptionEn),
        imageUrl: finalImageUrl,
        stockStatus,
        featured: Boolean(featured),
        homeInstallationAvailable: Boolean(body.inHome_install !== undefined ? body.inHome_install : homeInstallationAvailable),
        isInstallationIncluded: Boolean(body.price?.I_price?.includes !== undefined ? body.price?.I_price?.includes : isInstallationIncluded),
        brandName: brandArr[0] || brandName || "Bikeman Performance",
        requirements: requirements || null,
        reviews: typeof body.reviews === "string" ? body.reviews : "",
        compJson: JSON.stringify(compArr),
        categoryJson: JSON.stringify(catArr),
        brandJson: JSON.stringify(brandArr),
        imagesJson: JSON.stringify(imgsArr),
        videosJson: JSON.stringify(vidsArr),
        audiosJson: JSON.stringify(audsArr),
        additionalImagesJson: typeof additionalImagesJson === "string" ? additionalImagesJson : JSON.stringify(additionalImagesJson),
        audioUrl: audsArr[0] || audioUrl || null,
        videoUrl: vidsArr[0] || videoUrl || null,
        modelYearCompatibilityJson: JSON.stringify(ymArr),
        parametersJson: body.parameters !== undefined
          ? JSON.stringify(body.parameters)
          : (typeof body.parametersJson === "string" ? body.parametersJson : JSON.stringify(body.parametersJson || [])),
        voidsWarranty: Boolean(body.voidsWarranty),
        relatedProductIdsJson: Array.isArray(body.relatedProductIds)
          ? JSON.stringify(body.relatedProductIds)
          : (typeof body.relatedProductIdsJson === "string" ? body.relatedProductIdsJson : "[]"),
        suggestedProductIdsJson: Array.isArray(body.suggestedProductIds)
          ? JSON.stringify(body.suggestedProductIds)
          : (typeof body.suggestedProductIdsJson === "string" ? body.suggestedProductIdsJson : "[]"),
        suggestedComboIdsJson: Array.isArray(body.suggestedComboIds)
          ? JSON.stringify(body.suggestedComboIds)
          : (typeof body.suggestedComboIdsJson === "string" ? body.suggestedComboIdsJson : "[]"),
        supplierUrl: body.supplierUrl || null,
        supplierPlatform,
        supplierStockStatus,
        supplierStockCount,
        supplierStockMessageEs,
        supplierStockMessageEn,
        supplierStockCheckedAt,
        supplierLeadDaysMin,
        supplierLeadDaysMax,
        supplierLastPriceUSD,
        compatibilities: {
          create: Array.isArray(compatibilities) && compatibilities.length > 0
            ? compatibilities
                .filter((c: any) => c.modelSlug && c.modelSlug !== "all" && !c.modelSlug.includes("universal"))
                .map((c: any) => ({
                  brandSlug: c.brandSlug || "general",
                  modelSlug: c.modelSlug,
                  yearFrom: Number(c.yearFrom) || 2020,
                  yearTo: Number(c.yearTo) || 2027,
                }))
            : Array.isArray(compArr)
            ? compArr
                .filter((slug: string) => slug && slug !== "all" && !slug.includes("universal"))
                .map((slug: string) => {
                  const brandSlug = slug.includes("can-am") || slug.includes("x3") ? "can-am" : slug.includes("villain") ? "segway" : "cfmoto";
                  return {
                    brandSlug,
                    modelSlug: slug,
                    yearFrom: 2022,
                    yearTo: 2027,
                  };
                })
            : [],
        },
      },
      include: {
        category: true,
        compatibilities: true,
      },
    });

    // Auto-register brand in DealerBrand table
    try {
      const allBrandsToRegister = Array.from(
        new Set([newProduct.brandName, ...brandArr].filter(Boolean) as string[])
      );
      for (const b of allBrandsToRegister) {
        await ensureDealerBrandRegistered(b, imgsArr[0] || newProduct.imageUrl);
      }
    } catch (dealerErr) {
      console.error("[AUTO_REGISTER_DEALER_BRAND_ON_PRODUCT_CREATE_ERROR]:", dealerErr);
    }

    // Synchronize newly created product to src/data/products.json
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const productsJsonPath = path.join(process.cwd(), "src", "data", "products.json");
      const rawData = await fs.readFile(productsJsonPath, "utf-8");
      const productsArray = JSON.parse(rawData);

      const exists = productsArray.some(
        (p: any) =>
          p.id?.toLowerCase() === newProduct.sku.toLowerCase() ||
          p.slug?.toLowerCase() === newProduct.slug.toLowerCase()
      );

      if (!exists) {
        const jsonFormattedProduct = {
          id: newProduct.sku,
          slug: newProduct.slug,
          comp: compArr,
          category: catArr,
          brand: brandArr,
          price: {
            P_price_D: newProduct.processingPriceD,
            P_price: newProduct.processingPriceCRC,
            S_price: newProduct.shippingPriceCRC,
            I_price: {
              includes: Boolean(newProduct.isInstallationIncluded),
              I_price: newProduct.installationPriceCRC,
            },
            installationDurationMinutes: newProduct.installationDurationMinutes ?? 60,
            profit: newProduct.profitCRC,
            T_price: newProduct.priceCRC,
            T_price_D: newProduct.totalPriceD,
          },
          discountPercent: newProduct.discountPercent || 0,
          originalPriceCRC: newProduct.originalPriceCRC || newProduct.priceCRC,
          imgs: imgsArr,
          vids: vidsArr,
          audios: audsArr,
          p_title: newProduct.nameEs,
          description: {
            es: [
              {
                title: "Descripción",
                content: cleanDescriptionText(newProduct.descriptionEs),
              },
            ],
            en: [
              {
                title: "Description",
                content: cleanDescriptionText(newProduct.descriptionEn),
              },
            ],
          },
          requirements: newProduct.requirements || null,
          reviews: newProduct.reviews || "",
          homeInstallation: Boolean(newProduct.homeInstallationAvailable),
          inHome_install: Boolean(newProduct.homeInstallationAvailable),
          modelYearCompatibility: ymArr,
          supplierUrl: newProduct.supplierUrl,
          supplierPlatform: newProduct.supplierPlatform,
          supplierStockStatus: newProduct.supplierStockStatus,
          supplierStockCount: newProduct.supplierStockCount,
          supplierStockMessageEs: newProduct.supplierStockMessageEs,
          supplierStockMessageEn: newProduct.supplierStockMessageEn,
          supplierLeadDaysMin: newProduct.supplierLeadDaysMin,
          supplierLeadDaysMax: newProduct.supplierLeadDaysMax,
          supplierLastPriceUSD: newProduct.supplierLastPriceUSD,
          supplierStockCheckedAt: newProduct.supplierStockCheckedAt ? newProduct.supplierStockCheckedAt.toISOString() : null,
        };

        productsArray.unshift(jsonFormattedProduct);
        if (process.env.VERCEL !== "1" && process.env.NODE_ENV !== "production") {
          await fs.writeFile(productsJsonPath, JSON.stringify(productsArray, null, 2), "utf-8");
        }
      }
    } catch (syncErr) {
      console.warn("[SYS_PRODUCT_CREATE_JSON_SYNC_WARN]:", syncErr);
    }

    await recordAuditLog({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: "CREATE_PRODUCT",
      entityType: "PRODUCT",
      entityId: newProduct.id,
      newData: {
        sku: newProduct.sku,
        nameEn: newProduct.nameEn,
        priceCRC: newProduct.priceCRC,
        installationPriceCRC: newProduct.installationPriceCRC,
      },
      details: `Product ${newProduct.sku} created by ${auth.session.role} ${auth.session.email}`,
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    console.error("[SYS_PRODUCT_CREATE_ERROR]:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "A product with this SKU or slug already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create product" },
      { status: 500 }
    );
  }
}
