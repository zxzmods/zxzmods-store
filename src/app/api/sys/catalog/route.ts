import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { calculateComboAvailability } from "@/lib/comboAvailability";
import { normalizeAudioUrl, normalizeVideoUrl, cleanDescriptionText, extractAndCleanDescription } from "@/lib/products";

export async function GET() {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const [products, combos, categories, brands, dealerBrands] = await Promise.all([
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
    ]);

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

      let comp: string[] = ["z10", "z10-4"];
      if (p.compJson) {
        try {
          const parsed = JSON.parse(p.compJson);
          if (Array.isArray(parsed) && parsed.length > 0) comp = parsed;
        } catch {}
      } else if (jsonP?.comp && Array.isArray(jsonP.comp)) {
        comp = jsonP.comp;
      }

      let category: string[] = ["performance"];
      if (jsonP?.category && Array.isArray(jsonP.category)) category = jsonP.category;
      else if (p.categoryJson) {
        try { category = JSON.parse(p.categoryJson); } catch {}
      } else if (p.category?.slug) {
        category = [p.category.slug];
      }

      let brand: string[] = [p.brandName || "Bikeman Performance"];
      if (jsonP?.brand && Array.isArray(jsonP.brand)) brand = jsonP.brand;
      else if (p.brandJson) {
        try { brand = JSON.parse(p.brandJson); } catch {}
      }

      let imgs: string[] = [p.imageUrl || "/images/logo.png"];
      if (jsonP?.imgs && Array.isArray(jsonP.imgs) && jsonP.imgs.length > 0) imgs = jsonP.imgs;
      else if (p.imagesJson) {
        try { imgs = JSON.parse(p.imagesJson); } catch {}
      }

      let vids: string[] = [];
      if (p.videosJson) {
        try { vids = JSON.parse(p.videosJson); } catch {}
      } else if (jsonP?.vids && Array.isArray(jsonP.vids)) {
        vids = jsonP.vids;
      } else if (p.videoUrl) {
        vids = [p.videoUrl];
      }
      vids = (Array.isArray(vids) ? vids : []).map((v) => normalizeVideoUrl(v)).filter((s): s is string => Boolean(s));

      let audios: string[] = [];
      if (p.audiosJson) {
        try { audios = JSON.parse(p.audiosJson); } catch {}
      } else if (jsonP?.audios && Array.isArray(jsonP.audios)) {
        audios = jsonP.audios;
      } else if (p.audioUrl) {
        audios = [p.audioUrl];
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

      return {
        ...p,
        comp,
        category,
        brand,
        p_title: jsonP?.p_title || p.nameEs,
        descriptionEs: cleanDescriptionText(p.descriptionEs || (jsonP?.description ? extractAndCleanDescription(jsonP.description, "es") : "")),
        descriptionEn: cleanDescriptionText(p.descriptionEn || (jsonP?.description ? extractAndCleanDescription(jsonP.description, "en") : "")),
        description: jsonP?.description || {
          es: [{ title: "Descripción", content: p.descriptionEs }],
          en: [{ title: "Description", content: p.descriptionEn }],
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
          P_price_D: p.processingPriceD || jsonP?.price?.P_price_D || 0,
          P_price: p.processingPriceCRC || jsonP?.price?.P_price || 0,
          S_price: p.shippingPriceCRC || jsonP?.price?.S_price || 0,
          I_price: {
            includes: p.isInstallationIncluded !== undefined ? p.isInstallationIncluded : (jsonP?.price?.I_price?.includes ?? true),
            I_price: p.installationPriceCRC,
          },
          profit: p.profitCRC || jsonP?.price?.profit || 0,
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
        availability,
        stockStatus: availability.status,
        isAvailable: availability.available,
        leadDaysMin: availability.leadDaysMin,
        leadDaysMax: availability.leadDaysMax,
      };
    });

    return NextResponse.json({
      success: true,
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
