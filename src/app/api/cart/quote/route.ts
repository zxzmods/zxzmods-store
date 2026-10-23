import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Cuerpo de solicitud inválido" },
        { status: 400 }
      );
    }

    const { items = [], vehicle } = body || {};

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: "Items must be an array" },
        { status: 400 }
      );
    }

    // 1. Fetch live sell rate from our internal exchange rate service
    let sellRate = 457.03;
    try {
      const rateRes = await fetch(
        new URL("/api/exchange-rate", request.url).toString()
      );
      if (rateRes.ok) {
        const rateData = await rateRes.json();
        if (rateData?.data?.rate && typeof rateData.data.rate === "number") {
          sellRate = rateData.data.rate;
        }
      }
    } catch (rateErr) {
      console.warn("Could not fetch live rate internally, using reference:", rateErr);
    }

    // 2. Query Prisma database to verify products and vehicle fitment
    const productIds = items
      .filter((i: any) => i.type === "PRODUCT" && i.id)
      .map((i: any) => i.id);

    const dbProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      include: {
        compatibilities: true,
      },
    });

    const dbProductMap = new Map(dbProducts.map((p) => [p.id, p]));

    // 3. Process items and verify prices
    let partsSubtotalCRC = 0;
    let laborSubtotalCRC = 0;
    let installedItemCount = 0;

    const validatedItems = items.map((item: any) => {
      const dbProd = dbProductMap.get(item.id);
      const isFreeInstall = Boolean((dbProd as any)?.isInstallationIncluded || item.isFreeInstall || item.freeInstallation);
      const priceCRC = dbProd?.priceCRC ?? (Number(item.priceCRC) || 0);
      const rawInstallPriceCRC =
        dbProd?.installationPriceCRC ?? (Number(item.installationPriceCRC) || 0);
      const installationPriceCRC = isFreeInstall ? 0 : rawInstallPriceCRC;
      const quantity = Math.max(1, Number(item.quantity) || 1);
      const withInstallation = Boolean(item.withInstallation);

      partsSubtotalCRC += priceCRC * quantity;
      if (withInstallation) {
        laborSubtotalCRC += installationPriceCRC * quantity;
        // Fix: products that have free installation do NOT count towards the 5% labor discount
        if (installationPriceCRC > 0) {
          installedItemCount += quantity;
        }
      }

      // Check fitment if vehicle info provided
      let isCompatibleWithVehicle = true;
      if (vehicle?.brandSlug && vehicle?.modelSlug && dbProd) {
        if (dbProd.compatibilities.length > 0) {
          const match = dbProd.compatibilities.some(
            (c) =>
              c.brandSlug.toLowerCase() === vehicle.brandSlug.toLowerCase() &&
              c.modelSlug.toLowerCase() === vehicle.modelSlug.toLowerCase()
          );
          isCompatibleWithVehicle = match;
        }
      }

      const priceUSD = Number((priceCRC / sellRate).toFixed(2));
      const installationPriceUSD = Number(
        (installationPriceCRC / sellRate).toFixed(2)
      );

      const isHomeInstallation = (dbProd as any)?.homeInstallationAvailable ?? Boolean(item.homeInstallation ?? true);

      return {
        ...item,
        priceCRC,
        installationPriceCRC,
        priceUSD,
        installationPriceUSD,
        quantity,
        withInstallation,
        isCompatibleWithVehicle,
        homeInstallation: isHomeInstallation,
        isInstallationIncluded: isFreeInstall,
        freeInstallation: isFreeInstall,
      };
    });

    // 4. Labor discount logic: disabled (0 discount)
    const isEligibleForLaborDiscount = false;
    const laborDiscountCRC = 0;
    const finalLaborSubtotalCRC = laborSubtotalCRC;
    const totalCRC = partsSubtotalCRC + finalLaborSubtotalCRC;

    // USD Conversions
    const partsSubtotalUSD = Number((partsSubtotalCRC / sellRate).toFixed(2));
    const laborSubtotalUSD = Number((laborSubtotalCRC / sellRate).toFixed(2));
    const laborDiscountUSD = 0;
    const finalLaborSubtotalUSD = laborSubtotalUSD;
    const totalUSD = Number((totalCRC / sellRate).toFixed(2));

    return NextResponse.json({
      success: true,
      data: {
        items: validatedItems,
        summary: {
          partsSubtotalCRC,
          laborSubtotalCRC,
          laborDiscountCRC,
          finalLaborSubtotalCRC,
          totalCRC,
          partsSubtotalUSD,
          laborSubtotalUSD,
          laborDiscountUSD,
          finalLaborSubtotalUSD,
          totalUSD,
          installedItemCount,
          isEligibleForLaborDiscount,
          sellRate,
          rateDate: new Date().toISOString().slice(0, 10),
          currencyBase: "CRC",
          currencyConverted: "USD",
        },
      },
    });
  } catch (error: any) {
    console.error("Cart quote API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal error processing cart quote" },
      { status: 500 }
    );
  }
}
