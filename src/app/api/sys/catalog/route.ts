import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { calculateComboAvailability } from "@/lib/comboAvailability";
import { normalizeAudioUrl, normalizeVideoUrl, cleanDescriptionText, extractAndCleanDescription } from "@/lib/products";
import { computeProductLivePricing } from "@/lib/productPricing";
import { getLiveExchangeRate } from "@/lib/exchangeRate";

export async function GET() {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const [products, combos, categories, brands, dealerBrands, ratesConfig] = await Promise.all([
      prisma.product.findMany({
        include: {
          category: true,
          compatibilities: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.combo.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.findMany(),
      prisma.brand.findMany({
        include: { models: true },
      }),
      prisma.dealerBrand.findMany({
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      }),
      prisma.logisticsRateConfig.findUnique({
        where: { id: "rates-config" },
      }),
    ]);

    const liveRateInfo = await getLiveExchangeRate().catch(() => ({ rate: 455.21 }));
    const sellRate =
      ratesConfig?.useManualExchangeRate && ratesConfig?.manualExchangeRateCRC
        ? ratesConfig.manualExchangeRateCRC
        : liveRateInfo.rate || ratesConfig?.cachedExchangeRateCRC || 455.21;

    let productsJsonMap: Record<string, any> = {};
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const pPath = path.join(process.cwd(), "src", "data", "products.json");
      const raw = await fs.readFile(pPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((item: any) => {
          if (item.id) productsJsonMap[item.id.toLowerCase()] = item;
          if (item.slug) productsJsonMap[item.slug.toLowerCase()] = item;
        });
      }
    } catch (e) {
      console.warn("[SYS_CATALOG_JSON_READ_WARN]:", e);
    }

    const enrichedProducts = products.map((p) => {
      const jsonP = productsJsonMap[p.sku.toLowerCase()] || productsJsonMap[p.slug.toLowerCase()] || null;

      let comp: string[] = [];
      if (p.compJson) {
        try {
          const parsed = JSON.parse(p.compJson);
          if (Array.isArray(parsed) && parsed.length > 0) comp = parsed;
        } catch {}
      } else if (jsonP?.comp && Array.isArray(jsonP.comp)) {
        comp = jsonP.comp;
      }
      if (comp.length === 0 && Array.isArray(p.compatibilities) && p.compatibilities.length > 0) {
        comp = p.compatibilities.map((c: any) => c.modelSlug);
      }
      if (comp.length === 0) comp = ["zforce-z10"];

      let category: string[] = ["performance"];
      if (p.categoryJson) {
        try {
          const parsed = JSON.parse(p.categoryJson);
          if (Array.isArray(parsed) && parsed.length > 0) category = parsed;
        } catch {}
      } else if (p.category?.slug) {
        category = [p.category.slug];
      } else if (jsonP?.category && Array.isArray(jsonP.category)) {
        category = jsonP.category;
      }

      let brand: string[] = [p.brandName || "Bikeman Performance"];
      if (p.brandJson) {
        try {
          const parsed = JSON.parse(p.brandJson);
          if (Array.isArray(parsed) && parsed.length > 0) brand = parsed;
        } catch {}
      } else if (jsonP?.brand && Array.isArray(jsonP.brand)) {
        brand = jsonP.brand;
      }

      let imgs: string[] = [];
      if (p.imagesJson) {
        try {
          const parsed = JSON.parse(p.imagesJson);
          if (Array.isArray(parsed)) {
            parsed.forEach((img: any) => {
              const s = typeof img === "string" ? img.trim() : "";
              if (s && !imgs.includes(s)) imgs.push(s);
            });
          }
        } catch {}
      }
      const primaryImg = typeof p.imageUrl === "string" && p.imageUrl.trim() ? p.imageUrl.trim() : "";
      if (imgs.length === 0 && primaryImg) imgs.push(primaryImg);
      if (imgs.length === 0 && jsonP?.imgs && Array.isArray(jsonP.imgs)) {
        jsonP.imgs.forEach((img: string) => {
          const s = typeof img === "string" ? img.trim() : "";
          if (s && !imgs.includes(s)) imgs.push(s);
        });
      }
      if (imgs.length === 0) imgs = ["/images/logo.png"];

      let vids: string[] = [];
      let hasDbVids = false;
      if (p.videosJson) {
        try {
          const parsed = JSON.parse(p.videosJson);
          if (Array.isArray(parsed)) {
            vids = parsed;
            hasDbVids = true;
          }
        } catch {}
      }
      if (!hasDbVids && p.videoUrl) {
        vids = [p.videoUrl];
      } else if (!hasDbVids && jsonP?.vids && Array.isArray(jsonP.vids)) {
        vids = jsonP.vids;
      }
      vids = (Array.isArray(vids) ? vids : []).map((v) => normalizeVideoUrl(v)).filter((s): s is string => Boolean(s));

      let audios: string[] = [];
      let hasDbAudios = false;
      if (p.audiosJson) {
        try {
          const parsed = JSON.parse(p.audiosJson);
          if (Array.isArray(parsed)) {
            audios = parsed;
            hasDbAudios = true;
          }
        } catch {}
      }
      if (!hasDbAudios && p.audioUrl) {
        audios = [p.audioUrl];
      } else if (!hasDbAudios && jsonP?.audios && Array.isArray(jsonP.audios)) {
        audios = jsonP.audios;
      }
      audios = (Array.isArray(audios) ? audios : []).map((a) => normalizeAudioUrl(a)).filter((s): s is string => Boolean(s));

      let year_compatability: any[] = [];
      if (p.modelYearCompatibilityJson) {
        try {
          const parsed = JSON.parse(p.modelYearCompatibilityJson);
          if (Array.isArray(parsed) && parsed.length > 0) year_compatability = parsed;
        } catch {}
      } else if (jsonP?.modelYearCompatibility && Array.isArray(jsonP.modelYearCompatibility)) {
        year_compatability = jsonP.modelYearCompatibility;
      }

      const livePricing = computeProductLivePricing(
        {
          ...p,
          shippingPriceD: (p as any).shippingPriceD ?? jsonP?.price?.S_price_D,
          lockedExchangeRate: (p as any).lockedExchangeRate,
        },
        sellRate
      );

      return {
        ...p,
        shippingPriceD: livePricing.sPriceUSD,
        lockedExchangeRate: livePricing.lockedExchangeRate,
        livePricing,
        effectiveProfitCRC: livePricing.effectiveProfitCRC,
        hasProfitAlert: livePricing.hasProfitAlert,
        profitLossPercent: livePricing.profitLossPercent,
        comp,
        category,
        brand,
        p_title: p.nameEs || jsonP?.p_title,
        descriptionEs: cleanDescriptionText(p.descriptionEs || (jsonP?.description ? extractAndCleanDescription(jsonP.description, "es") : "")),
        descriptionEn: cleanDescriptionText(p.descriptionEn || (jsonP?.description ? extractAndCleanDescription(jsonP.description, "en") : "")),
        description: {
          es: [{ title: "Descripción", content: cleanDescriptionText(p.descriptionEs || (jsonP?.description ? extractAndCleanDescription(jsonP.description, "es") : "")) }],
          en: [{ title: "Description", content: cleanDescriptionText(p.descriptionEn || (jsonP?.description ? extractAndCleanDescription(jsonP.description, "en") : "")) }],
        },
        requirements: p.requirements || jsonP?.requirements || "",
        reviews: p.reviews || (typeof jsonP?.reviews === "string" ? jsonP.reviews : "") || "",
        inHome_install: Boolean(p.homeInstallationAvailable),
        homeInstallation: Boolean(p.homeInstallationAvailable),
        year_compatability,
        modelYearCompatibility: year_compatability,
        imgs,
        vids,
        audios,
        price: {
          P_price_D: livePricing.pPriceUSD,
          P_price: p.processingPriceCRC || jsonP?.price?.P_price || 0,
          S_price_D: livePricing.sPriceUSD,
          S_price: p.shippingPriceCRC || jsonP?.price?.S_price || 0,
          I_price: {
            includes: p.isInstallationIncluded !== undefined ? p.isInstallationIncluded : (jsonP?.price?.I_price?.includes ?? true),
            I_price: p.installationPriceCRC,
          },
          profit: p.profitCRC || jsonP?.price?.profit || 0,
          effectiveProfitCRC: livePricing.effectiveProfitCRC,
          iva: {
            rate: p.ivaPercent ?? 13,
            amount: p.ivaCRC ?? Math.round((p.priceCRC || 0) * (13 / 113)),
          },
          T_price: p.priceCRC,
          T_price_D: p.totalPriceD || jsonP?.price?.T_price_D || "calculate in checkout with the selling value of dolar to colones",
        },
        ivaPercent: p.ivaPercent ?? 13,
        ivaCRC: p.ivaCRC ?? Math.round((p.priceCRC || 0) * (13 / 113)),
        discountPercent: (p as any).discountPercent || 0,
        originalPriceCRC: (p as any).originalPriceCRC || p.priceCRC,
        installLabourCostCRC: p.installLabourCostCRC || (p.installationPriceCRC && !p.installProfitCRC && (!p.installExtraPartsJson || p.installExtraPartsJson === "[]") ? p.installationPriceCRC : 0),
        installProfitCRC: p.installProfitCRC || 0,
        installExtraParts: (() => {
          if (p.installExtraPartsJson) {
            try {
              const parsed = JSON.parse(p.installExtraPartsJson);
              if (Array.isArray(parsed)) return parsed;
            } catch {}
          }
          return [];
        })(),
        installExtraPartsJson: p.installExtraPartsJson || "[]",
        installationBreakdownJson: p.installationBreakdownJson || null,
        installationDurationMinutes: p.installationDurationMinutes ?? 60,
        parameters: (() => {
          if (p.parametersJson) {
            try {
              const parsed = JSON.parse(p.parametersJson);
              if (Array.isArray(parsed)) return parsed;
            } catch {}
          }
          return [];
        })(),
      };
    });

    const enrichedCombos = combos.map((c) => {
      const availability = calculateComboAvailability(c.itemsJson, products);
      return {
        ...c,
        descriptionEs: cleanDescriptionText(c.descriptionEs),
        descriptionEn: cleanDescriptionText(c.descriptionEn),
        installLabourCostCRC: c.installLabourCostCRC || (c.installationPriceCRC && !c.installProfitCRC && (!c.installExtraPartsJson || c.installExtraPartsJson === "[]") ? c.installationPriceCRC : 0),
        installProfitCRC: c.installProfitCRC || 0,
        installExtraParts: (() => {
          if (c.installExtraPartsJson) {
            try {
              const parsed = JSON.parse(c.installExtraPartsJson);
              if (Array.isArray(parsed)) return parsed;
            } catch {}
          }
          return [];
        })(),
        installExtraPartsJson: c.installExtraPartsJson || "[]",
        installationBreakdownJson: c.installationBreakdownJson || null,
        parameters: (() => {
          if (c.parametersJson) {
            try {
              const parsed = JSON.parse(c.parametersJson);
              if (Array.isArray(parsed)) return parsed;
            } catch {}
          }
          return [];
        })(),
        uniqueProduct: (() => {
          if ((c as any).uniqueProductJson) {
            try {
              const parsed = JSON.parse((c as any).uniqueProductJson);
              if (parsed && typeof parsed === "object") return parsed;
            } catch {}
          }
          return null;
        })(),
        availability,
        stockStatus: availability.status,
        isAvailable: availability.available,
        leadDaysMin: availability.leadDaysMin,
        leadDaysMax: availability.leadDaysMax,
      };
    });

    const profitAlertProducts = enrichedProducts
      .filter((p) => !p.isArchived && p.hasProfitAlert)
      .map((p) => ({
        id: p.id,
        sku: p.sku,
        slug: p.slug,
        nameEs: p.nameEs,
        nameEn: p.nameEn,
        imageUrl: p.imageUrl,
        lockedTPriceCRC: p.livePricing.lockedTPriceCRC,
        initialProfitCRC: p.livePricing.initialProfitCRC,
        effectiveProfitCRC: p.livePricing.effectiveProfitCRC,
        profitDeltaCRC: p.livePricing.profitDeltaCRC,
        profitLossPercent: p.livePricing.profitLossPercent,
        alertThresholdProfitCRC: p.livePricing.alertThresholdProfitCRC,
        suggestedTPriceCRC: p.livePricing.suggestedTPriceCRC,
        pPriceUSD: p.livePricing.pPriceUSD,
        sPriceUSD: p.livePricing.sPriceUSD,
        livePPriceCRC: p.livePricing.livePPriceCRC,
        liveSPriceCRC: p.livePricing.liveSPriceCRC,
      }));

    return NextResponse.json({
      success: true,
      exchangeRate: sellRate,
      profitAlertProducts,
      products: enrichedProducts,
      combos: enrichedCombos,
      categories,
      brands,
      dealerBrands,
    });
  } catch (error) {
    console.error("[SYS_CATALOG_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load catalog data" },
      { status: 500 }
    );
  }
}
