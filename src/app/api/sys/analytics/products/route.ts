import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStealthSession } from "@/lib/stealthAuth";
import { computeProductLivePricing } from "@/lib/productPricing";
import { getLiveExchangeRate } from "@/lib/exchangeRate";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getStealthSession();
    if (!session || (session.role !== "MASTER" && session.role !== "STAFF")) {
      return NextResponse.json(
        { success: false, error: "No autorizado. Acceso exclusivo para personal autorizado." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get("timeframe") || "all").toLowerCase();

    // Determine timeframe filter dates
    const now = new Date();
    let startDate: Date | undefined;
    if (timeframe === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeframe === "30days") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // 1. Fetch catalog products, categories, combos, confirmed orders, and exchange rate config
    const [products, combos, categories, confirmedOrders, ratesConfig] = await Promise.all([
      prisma.product.findMany({
        select: {
          id: true,
          sku: true,
          slug: true,
          nameEs: true,
          nameEn: true,
          brandName: true,
          priceCRC: true,
          profitCRC: true,
          processingPriceD: true,
          processingPriceCRC: true,
          shippingPriceD: true,
          shippingPriceCRC: true,
          lockedExchangeRate: true,
          installationPriceCRC: true,
          isInstallationIncluded: true,
          discountPercent: true,
          ivaPercent: true,
          imageUrl: true,
          isArchived: true,
          categoryId: true,
          category: {
            select: {
              id: true,
              slug: true,
              nameEs: true,
              nameEn: true,
            },
          },
        },
      }),
      prisma.combo.findMany({
        select: {
          id: true,
          slug: true,
          titleEs: true,
          titleEn: true,
          badgeEs: true,
          badgeEn: true,
          priceCRC: true,
          originalPriceCRC: true,
          category: true,
          installProfitCRC: true,
          imageUrl: true,
          itemsJson: true,
        },
      }),
      prisma.category.findMany({
        select: {
          id: true,
          slug: true,
          nameEs: true,
          nameEn: true,
        },
      }),
      prisma.order.findMany({
        where: {
          status: {
            notIn: ["CANCELLED", "PENDING", "PAYMENT_REJECTED", "COTIZACION"],
          },
          NOT: {
            orderNumber: { startsWith: "GAR-" },
          },
          ...(startDate ? { createdAt: { gte: startDate } } : {}),
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          itemsJson: true,
          totalCRC: true,
          createdAt: true,
        },
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

    // Build fast lookup maps
    const productBySkuOrSlug = new Map<string, typeof products[0]>();
    products.forEach((p) => {
      if (p.id) productBySkuOrSlug.set(p.id.toLowerCase(), p);
      if (p.sku) productBySkuOrSlug.set(p.sku.toLowerCase(), p);
      if (p.slug) productBySkuOrSlug.set(p.slug.toLowerCase(), p);
    });

    const comboBySlug = new Map<string, typeof combos[0]>();
    combos.forEach((c) => {
      if (c.id) comboBySlug.set(c.id.toLowerCase(), c);
      if (c.slug) comboBySlug.set(c.slug.toLowerCase(), c);
    });

    const categoryBySlug = new Map<string, typeof categories[0]>();
    categories.forEach((cat) => {
      if (cat.slug) categoryBySlug.set(cat.slug.toLowerCase(), cat);
      if (cat.id) categoryBySlug.set(cat.id.toLowerCase(), cat);
    });

    // Aggregation buckets
    const brandSalesMap = new Map<
      string,
      { brandName: string; unitsSold: number; totalRevenueCRC: number; ordersCount: Set<string> }
    >();
    const itemSalesMap = new Map<
      string,
      {
        id: string;
        sku: string;
        nameEs: string;
        nameEn: string;
        imageUrl: string;
        unitsSold: number;
        totalRevenueCRC: number;
        brandName: string;
        categoryNameEs: string;
      }
    >();
    const comboSalesMap = new Map<
      string,
      {
        id: string;
        slug: string;
        titleEs: string;
        titleEn: string;
        unitsSold: number;
        totalRevenueCRC: number;
        badgeEs?: string;
        categoryNameEs: string;
      }
    >();
    const categorySalesMap = new Map<
      string,
      {
        id: string;
        slug: string;
        nameEs: string;
        nameEn: string;
        unitsSold: number;
        totalRevenueCRC: number;
        ordersCount: Set<string>;
      }
    >();

    let totalUnitsSold = 0;
    let totalRevenueCRC = 0;

    for (const order of confirmedOrders) {
      if (!order.itemsJson) continue;
      let itemsList: any[] = [];
      try {
        itemsList = typeof order.itemsJson === "string" ? JSON.parse(order.itemsJson) : order.itemsJson;
      } catch {
        continue;
      }
      if (!Array.isArray(itemsList)) continue;

      for (const it of itemsList) {
        const qty = Math.max(1, Number(it.quantity) || 1);
        const itemPrice = Math.max(0, Number(it.priceCRC) || 0);
        const revenue = itemPrice * qty;

        totalUnitsSold += qty;
        totalRevenueCRC += revenue;

        const isCombo =
          it.type === "combo" ||
          it.isCombo === true ||
          String(it.id || "").toLowerCase().startsWith("combo-");

        if (isCombo) {
          const rawComboId = String(it.id || "").replace(/^combo-/i, "");
          const dbCombo = comboBySlug.get(rawComboId.toLowerCase()) || comboBySlug.get(String(it.slug || "").toLowerCase());
          const comboKey = dbCombo?.slug || rawComboId;
          const comboTitle = dbCombo?.titleEs || it.title || it.name || "Combo Especial";
          const comboTitleEn = dbCombo?.titleEn || it.titleEn || comboTitle;

          // Resolve category for combo
          let catKey = "combos";
          let catNameEs = "Combos Especiales";
          let catNameEn = "Special Combos";

          const rawCat = (dbCombo?.category || "combos").toLowerCase();
          if (rawCat.includes("perform") || rawCat.includes("rend")) {
            catKey = "exhaust-tuning";
            catNameEs = "Escapes & Reprogramaciones ECU";
            catNameEn = "Exhaust & ECU Remapping";
          } else if (rawCat.includes("ring") || rawCat.includes("aro") || rawCat.includes("llanta")) {
            catKey = "rings-wheels";
            catNameEs = "Aros Beadlock & Llantas";
            catNameEn = "Beadlock Wheels & Tires";
          } else if (rawCat.includes("light") || rawCat.includes("luz") || rawCat.includes("electr")) {
            catKey = "lighting-electrical";
            catNameEs = "Iluminación LED & Eléctrico";
            catNameEn = "LED Lighting & Electrical";
          } else if (rawCat.includes("clutch") || rawCat.includes("faja")) {
            catKey = "clutch-belts";
            catNameEs = "Clutch & Fajas Reforzadas";
            catNameEn = "Clutching & Belts";
          } else if (rawCat.includes("suspens") || rawCat.includes("brazo")) {
            catKey = "suspension-brakes";
            catNameEs = "Suspensión & Brazos";
            catNameEn = "Suspension & Control Arms";
          }

          const existingCombo = comboSalesMap.get(comboKey) || {
            id: comboKey,
            slug: comboKey,
            titleEs: comboTitle,
            titleEn: comboTitleEn,
            unitsSold: 0,
            totalRevenueCRC: 0,
            badgeEs: dbCombo?.badgeEs || "Pack Especial",
            categoryNameEs: catNameEs,
          };
          existingCombo.unitsSold += qty;
          existingCombo.totalRevenueCRC += revenue;
          comboSalesMap.set(comboKey, existingCombo);

          // Category aggregation for combos
          const existingCat = categorySalesMap.get(catKey) || {
            id: catKey,
            slug: catKey,
            nameEs: catNameEs,
            nameEn: catNameEn,
            unitsSold: 0,
            totalRevenueCRC: 0,
            ordersCount: new Set<string>(),
          };
          existingCat.unitsSold += qty;
          existingCat.totalRevenueCRC += revenue;
          existingCat.ordersCount.add(order.id);
          categorySalesMap.set(catKey, existingCat);
        } else {
          // Regular product item (Handle parameterized options, composite IDs like EVP-Z10-01__param-...)
          const rawId = String(it.productId || it.id || "");
          const baseId = rawId.split("__")[0].trim().toLowerCase();
          const rawSku = String(it.sku || "").split("__")[0].trim().toLowerCase();
          const rawSlug = String(it.slug || "").trim().toLowerCase();

          const dbProduct =
            (rawSku ? productBySkuOrSlug.get(rawSku) : undefined) ||
            (baseId ? productBySkuOrSlug.get(baseId) : undefined) ||
            (rawSlug ? productBySkuOrSlug.get(rawSlug) : undefined) ||
            productBySkuOrSlug.get(rawId.toLowerCase());

          const itemKey = dbProduct?.sku || dbProduct?.slug || baseId || "item";
          const itemNameEs = dbProduct?.nameEs || it.name || it.title || "Repuesto";
          const itemNameEn = dbProduct?.nameEn || it.nameEn || itemNameEs;
          const brandName = dbProduct?.brandName || it.brand || it.brandName || "ZxZ Performance";
          const imageUrl = dbProduct?.imageUrl || it.imageUrl || it.image || "/images/placeholder.png";

          const productCat = dbProduct?.category;
          const catKey = productCat?.slug || "general";
          const catNameEs = productCat?.nameEs || "Accesorios Generales";
          const catNameEn = productCat?.nameEn || "General Accessories";

          const existingItem = itemSalesMap.get(itemKey) || {
            id: itemKey,
            sku: dbProduct?.sku || it.sku || "",
            nameEs: itemNameEs,
            nameEn: itemNameEn,
            imageUrl,
            unitsSold: 0,
            totalRevenueCRC: 0,
            brandName,
            categoryNameEs: catNameEs,
          };
          existingItem.unitsSold += qty;
          existingItem.totalRevenueCRC += revenue;
          itemSalesMap.set(itemKey, existingItem);

          // Brand aggregation
          const brandKey = brandName.trim() || "ZxZ Performance";
          const existingBrand = brandSalesMap.get(brandKey) || {
            brandName: brandKey,
            unitsSold: 0,
            totalRevenueCRC: 0,
            ordersCount: new Set<string>(),
          };
          existingBrand.unitsSold += qty;
          existingBrand.totalRevenueCRC += revenue;
          existingBrand.ordersCount.add(order.id);
          brandSalesMap.set(brandKey, existingBrand);

          // Category aggregation
          const existingCat = categorySalesMap.get(catKey) || {
            id: catKey,
            slug: catKey,
            nameEs: catNameEs,
            nameEn: catNameEn,
            unitsSold: 0,
            totalRevenueCRC: 0,
            ordersCount: new Set<string>(),
          };
          existingCat.unitsSold += qty;
          existingCat.totalRevenueCRC += revenue;
          existingCat.ordersCount.add(order.id);
          categorySalesMap.set(catKey, existingCat);
        }
      }
    }

    // Sort rankings
    const topBrands = Array.from(brandSalesMap.values())
      .map((b) => ({
        brandName: b.brandName,
        unitsSold: b.unitsSold,
        totalRevenueCRC: b.totalRevenueCRC,
        ordersCount: b.ordersCount.size,
        marketSharePct: totalUnitsSold > 0 ? Math.round((b.unitsSold / totalUnitsSold) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold);

    const topItems = Array.from(itemSalesMap.values()).sort((a, b) => b.unitsSold - a.unitsSold);
    const topCombos = Array.from(comboSalesMap.values()).sort((a, b) => b.unitsSold - a.unitsSold);

    // Categories sorted by units sold
    const allCategoriesRanked = Array.from(categorySalesMap.values())
      .map((c) => ({
        id: c.id,
        slug: c.slug,
        nameEs: c.nameEs,
        nameEn: c.nameEn,
        unitsSold: c.unitsSold,
        totalRevenueCRC: c.totalRevenueCRC,
        ordersCount: c.ordersCount.size,
        unitsSharePct: totalUnitsSold > 0 ? Math.round((c.unitsSold / totalUnitsSold) * 1000) / 10 : 0,
        revenueSharePct: totalRevenueCRC > 0 ? Math.round((c.totalRevenueCRC / totalRevenueCRC) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold);

    // Enrich allCategoriesRanked so top 5 comparison always renders up to 5 categories cleanly
    const rankedCategorySlugs = new Set(allCategoriesRanked.map((c) => c.slug.toLowerCase()));
    for (const cat of categories) {
      if (allCategoriesRanked.length >= 5) break;
      if (!rankedCategorySlugs.has(cat.slug.toLowerCase())) {
        allCategoriesRanked.push({
          id: cat.id,
          slug: cat.slug,
          nameEs: cat.nameEs,
          nameEn: cat.nameEn,
          unitsSold: 0,
          totalRevenueCRC: 0,
          ordersCount: 0,
          unitsSharePct: 0,
          revenueSharePct: 0,
        });
        rankedCategorySlugs.add(cat.slug.toLowerCase());
      }
    }

    const top5Categories = allCategoriesRanked.slice(0, 5);

    // Highest Profit Margin product among active catalog products (Projected with live USD fluctuation, NOT theoretical initial profit)
    const activeProductsWithMargin = products
      .filter((p) => !p.isArchived && p.priceCRC > 0)
      .map((p) => {
        const livePricing = computeProductLivePricing(p, sellRate);
        const effectiveProfit = livePricing.effectiveProfitCRC;
        const marginPct = Math.round((effectiveProfit / p.priceCRC) * 1000) / 10;
        return {
          id: p.id,
          sku: p.sku,
          slug: p.slug,
          nameEs: p.nameEs,
          nameEn: p.nameEn,
          brandName: p.brandName || "ZxZ Performance",
          priceCRC: p.priceCRC,
          profitCRC: effectiveProfit,
          profitDeltaCRC: livePricing.profitDeltaCRC,
          profitChangePercent: livePricing.profitChangePercent,
          profitLossPercent: livePricing.profitLossPercent,
          hasProfitAlert: livePricing.hasProfitAlert,
          suggestedTPriceCRC: livePricing.suggestedTPriceCRC,
          marginPct,
          imageUrl: p.imageUrl,
          type: "product" as const,
        };
      })
      .sort((a, b) => b.marginPct - a.marginPct || b.profitCRC - a.profitCRC);

    const profitAlertProducts = activeProductsWithMargin.filter((p) => p.hasProfitAlert);

    const highestMarginProduct = activeProductsWithMargin[0] || null;

    // Highest Profit Margin combo among combos
    const combosWithMargin = combos
      .filter((c) => c.priceCRC > 0)
      .map((c) => {
        // Estimated or actual combo gross profit (from installProfitCRC and package margin)
        const baseEstimatedProfit = Math.max(c.installProfitCRC || 0, Math.round(c.priceCRC * 0.28));
        const marginPct = Math.round((baseEstimatedProfit / c.priceCRC) * 1000) / 10;
        return {
          id: c.id,
          slug: c.slug,
          titleEs: c.titleEs,
          titleEn: c.titleEn,
          badgeEs: c.badgeEs,
          badgeEn: c.badgeEn,
          priceCRC: c.priceCRC,
          profitCRC: baseEstimatedProfit,
          marginPct,
          imageUrl: c.imageUrl,
          type: "combo" as const,
        };
      })
      .sort((a, b) => b.marginPct - a.marginPct || b.profitCRC - a.profitCRC);

    const highestMarginCombo = combosWithMargin[0] || null;

    // Highest Margin Overall (Product or Combo)
    const highestMarginOverall =
      highestMarginProduct && highestMarginCombo
        ? highestMarginProduct.marginPct >= highestMarginCombo.marginPct
          ? { ...highestMarginProduct, isProduct: true }
          : {
              id: highestMarginCombo.id,
              sku: highestMarginCombo.slug,
              slug: highestMarginCombo.slug,
              nameEs: highestMarginCombo.titleEs,
              nameEn: highestMarginCombo.titleEn,
              brandName: "ZxZ Performance Pack",
              priceCRC: highestMarginCombo.priceCRC,
              profitCRC: highestMarginCombo.profitCRC,
              marginPct: highestMarginCombo.marginPct,
              imageUrl: highestMarginCombo.imageUrl,
              type: "combo" as const,
              isProduct: false,
            }
        : highestMarginProduct
        ? { ...highestMarginProduct, isProduct: true }
        : highestMarginCombo
        ? {
            id: highestMarginCombo.id,
            sku: highestMarginCombo.slug,
            slug: highestMarginCombo.slug,
            nameEs: highestMarginCombo.titleEs,
            nameEn: highestMarginCombo.titleEn,
            brandName: "ZxZ Performance Pack",
            priceCRC: highestMarginCombo.priceCRC,
            profitCRC: highestMarginCombo.profitCRC,
            marginPct: highestMarginCombo.marginPct,
            imageUrl: highestMarginCombo.imageUrl,
            type: "combo" as const,
            isProduct: false,
          }
        : null;

    // Resolve top metrics without mock data fallbacks (Rule 2: Zero Mock Data Policy)
    const mostSoldBrand = topBrands[0] || (products[0] ? {
      brandName: products[0].brandName || "ZxZ Performance",
      unitsSold: 0,
      totalRevenueCRC: 0,
      ordersCount: 0,
      marketSharePct: 0,
    } : null);

    const mostSoldItem = topItems[0] || (products[0] ? {
      id: products[0].id,
      sku: products[0].sku || "",
      nameEs: products[0].nameEs,
      nameEn: products[0].nameEn,
      imageUrl: products[0].imageUrl || "/images/placeholder.png",
      unitsSold: 0,
      totalRevenueCRC: 0,
      brandName: products[0].brandName || "",
      categoryNameEs: products[0].category?.nameEs || "Accesorios",
    } : null);

    const mostSoldCombo = topCombos[0] || (combos[0] ? {
      id: combos[0].id,
      slug: combos[0].slug,
      titleEs: combos[0].titleEs,
      titleEn: combos[0].titleEn,
      unitsSold: 0,
      totalRevenueCRC: 0,
      badgeEs: combos[0].badgeEs,
      categoryNameEs: combos[0].category || "Combos Especiales",
    } : null);

    return NextResponse.json({
      success: true,
      timeframe,
      exchangeRate: sellRate,
      data: {
        exchangeRate: sellRate,
        profitAlertProducts,
        totalConfirmedOrders: confirmedOrders.length,
        totalUnitsSold,
        totalRevenueCRC,
        averageItemPriceCRC: totalUnitsSold > 0 ? Math.round(totalRevenueCRC / totalUnitsSold) : 0,
        metrics: {
          mostSoldBrand,
          mostSoldItem,
          mostSoldCombo,
          highestMarginProduct,
          highestMarginCombo,
          highestMarginOverall,
        },
        rankings: {
          top5Categories,
          allCategoriesRanked,
          topBrands: topBrands.slice(0, 10),
          topItems: topItems.slice(0, 10),
          topCombos: topCombos.slice(0, 10),
          topMarginProducts: activeProductsWithMargin.slice(0, 10),
          topMarginCombos: combosWithMargin.slice(0, 10),
        },
      },
    });
  } catch (error: any) {
    console.error("[SYS_ANALYTICS_PRODUCTS_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al calcular el análisis de productos." },
      { status: 500 }
    );
  }
}
