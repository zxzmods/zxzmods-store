import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isPlatformOrVehicleMatch } from "@/lib/products";

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

    // A product is only universal if explicitly flagged universal or "all" in compJson
    let isUniversal = false;
    let parsedComp: string[] = [];
    if (product.compJson) {
      try {
        const parsed = JSON.parse(product.compJson);
        if (Array.isArray(parsed)) {
          parsedComp = parsed;
          if (parsed.some((c: string) => c.toLowerCase() === "all" || c.toLowerCase().includes("universal"))) {
            isUniversal = true;
          }
        }
      } catch {}
    }

    if (!isUniversal && parsedComp.length === 0 && product.compatibilities.length === 0) {
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
          (c.brandSlug.toLowerCase() === brandSlug.toLowerCase() || c.brandSlug === "general") &&
          isPlatformOrVehicleMatch(c.modelSlug, modelSlug) &&
          numYear >= c.yearFrom &&
          numYear <= c.yearTo
      );
    }

    if (!isMatched && parsedComp.length > 0) {
      isMatched = parsedComp.some((c) => isPlatformOrVehicleMatch(c, modelSlug));
    }

    if (!isMatched && product.modelYearCompatibilityJson) {
      try {
        const fitments = JSON.parse(product.modelYearCompatibilityJson);
        if (Array.isArray(fitments)) {
          isMatched = fitments.some((fit: any) => {
            const fitModel = (fit.model || "").toLowerCase();
            const fitMake = (fit.make || "").toLowerCase();
            if (fitModel === "all" || fitModel.includes("universal")) return true;

            if (fitMake && fitMake !== "all" && !fitMake.includes("universal")) {
              if (!isPlatformOrVehicleMatch(fitMake, brandSlug)) return false;
            }

            if (!isPlatformOrVehicleMatch(fitModel, modelSlug)) return false;

            if (fit.yearFrom && numYear < fit.yearFrom) return false;
            if (fit.yearTo && numYear > fit.yearTo) return false;
            return true;
          });
        }
      } catch {}
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
