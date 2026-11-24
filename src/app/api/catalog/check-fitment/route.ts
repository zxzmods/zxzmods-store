import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  isPlatformOrVehicleMatch,
  doVehicleMakesMatch,
  isProductCompatibleWithVehicle,
  isUniversalFit,
} from "@/lib/products";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, brandSlug, modelSlug, year } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { id: productId },
          { sku: productId },
          { slug: productId },
        ],
      },
      include: { compatibilities: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // A product is only universal if explicitly flagged universal or "all" in compJson (with no specific models)
    let isUniversal = false;
    let parsedComp: string[] = [];
    if (product.compJson) {
      try {
        const parsed = JSON.parse(product.compJson);
        if (Array.isArray(parsed)) {
          parsedComp = parsed;
          if (isUniversalFit(parsed)) {
            isUniversal = true;
          }
        }
      } catch {}
    }

    if (!isUniversal && parsedComp.length === 0 && product.compatibilities.length === 0 && !product.modelYearCompatibilityJson) {
      isUniversal = true;
    }

    if (isUniversal) {
      return NextResponse.json({
        success: true,
        data: {
          isCompatible: true,
          type: "UNIVERSAL",
          messageEs: "Accesorio de ajuste universal para todas las marcas y modelos.",
          messageEn: "Universal fit accessory for all makes and models.",
        },
      });
    }

    // If user has not selected vehicle yet
    if (!brandSlug || !modelSlug || !year) {
      return NextResponse.json({
        success: true,
        data: {
          isCompatible: false,
          type: "UNKNOWN",
          messageEs: "Selecciona tu vehículo en Mi Garaje para verificar el calce.",
          messageEn: "Select your vehicle in My Garage to verify fitment.",
        },
      });
    }

    const numYear = Number(year);
    let isMatched = false;

    if (product.compatibilities.length > 0) {
      isMatched = product.compatibilities.some(
        (c) =>
          (doVehicleMakesMatch(c.brandSlug, brandSlug) || c.brandSlug === "general") &&
          isPlatformOrVehicleMatch(c.modelSlug, modelSlug) &&
          numYear >= c.yearFrom &&
          numYear <= c.yearTo
      );
    }

    if (!isMatched) {
      let fitments: any[] = [];
      if (product.modelYearCompatibilityJson) {
        try {
          const parsed = JSON.parse(product.modelYearCompatibilityJson);
          if (Array.isArray(parsed)) fitments = parsed;
        } catch {}
      }

      isMatched = isProductCompatibleWithVehicle(
        { comp: parsedComp, modelYearCompatibility: fitments },
        {
          brandName: brandSlug,
          brandSlug,
          modelName: modelSlug,
          modelSlug,
          year: numYear,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        isCompatible: isMatched,
        type: isMatched ? "VERIFIED_FIT" : "INCOMPATIBLE",
        messageEs: isMatched
          ? `Compatible con tu vehículo (${year} ${brandSlug.toUpperCase()} ${modelSlug}).`
          : `Esta parte no es compatible con tu ${year} ${brandSlug.toUpperCase()} ${modelSlug}.`,
        messageEn: isMatched
          ? `Compatible with your ${year} ${brandSlug.toUpperCase()} ${modelSlug}.`
          : `This part does not fit your ${year} ${brandSlug.toUpperCase()} ${modelSlug}.`,
      },
    });
  } catch (error) {
    console.error("Error checking fitment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check fitment" },
      { status: 500 }
    );
  }
}
