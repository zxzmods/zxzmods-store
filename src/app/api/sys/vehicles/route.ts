import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { ensureDealerBrandRegistered } from "@/lib/dealerBrands";

export async function GET() {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const brands = await prisma.brand.findMany({
      include: {
        models: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    const flatModels = brands.flatMap((b) =>
      b.models.map((m) => {
        let years: number[] = [];
        try {
          years = (JSON.parse(m.yearsJson || "[]") as number[]).sort((x, y) => x - y);
        } catch {
          years = [];
        }
        return {
          id: m.id,
          brandId: m.brandId,
          brandName: b.name,
          brandSlug: b.slug,
          slug: m.slug,
          code: m.code,
          name: m.name,
          category: m.category,
          years,
          yearsJson: m.yearsJson,
          imageUrl: m.imageUrl,
          pickupServiceAvailable: m.pickupServiceAvailable ?? true,
          createdAt: m.createdAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      brands: brands.map((b) => ({
        id: b.id,
        slug: b.slug,
        name: b.name,
        logoUrl: b.logoUrl,
        defaultVehicleImageUrl: b.defaultVehicleImageUrl,
        descriptionEs: b.descriptionEs,
        descriptionEn: b.descriptionEn,
        featured: b.featured,
        modelsCount: b.models.length,
        createdAt: b.createdAt,
      })),
      models: flatModels,
      totalModels: flatModels.length,
    });
  } catch (error) {
    console.error("[SYS_VEHICLES_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load garage vehicles" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const {
      brandId,
      newBrandName,
      newBrandSlug,
      name,
      slug,
      code,
      category = "UTV",
      years,
      yearFrom,
      yearTo,
      imageUrl,
      pickupServiceAvailable = true,
    } = body;

    if (!name || (!brandId && !newBrandName)) {
      return NextResponse.json(
        {
          success: false,
          error: "Vehicle model name and brand are required",
        },
        { status: 400 }
      );
    }

    // Resolve or create Brand
    let targetBrandId = brandId;
    if (!targetBrandId && newBrandName) {
      const cleanBrandSlug =
        (newBrandSlug || newBrandName)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

      const existingBrand = await prisma.brand.findUnique({
        where: { slug: cleanBrandSlug },
      });

      if (existingBrand) {
        targetBrandId = existingBrand.id;
      } else {
        const createdBrand = await prisma.brand.create({
          data: {
            slug: cleanBrandSlug,
            name: newBrandName.trim(),
            descriptionEs: `Vehículos todoterreno ${newBrandName.trim()}`,
            descriptionEn: `All-terrain vehicles ${newBrandName.trim()}`,
            featured: false,
          },
        });
        targetBrandId = createdBrand.id;
      }
    }

    // Resolve years array
    let yearsArray: number[] = [];
    if (Array.isArray(years) && years.length > 0) {
      yearsArray = years.map(Number).filter((y) => !isNaN(y) && y > 1990 && y < 2050);
    } else if (yearFrom && yearTo) {
      const from = Math.min(Number(yearFrom), Number(yearTo));
      const to = Math.max(Number(yearFrom), Number(yearTo));
      for (let y = from; y <= to; y++) {
        yearsArray.push(y);
      }
    } else {
      // Default to 2024 to 2027 if none specified
      yearsArray = [2024, 2025, 2026, 2027];
    }

    yearsArray = Array.from(new Set(yearsArray)).sort((a, b) => a - b);
    const yearsJson = JSON.stringify(yearsArray);

    // Generate unique slug
    let cleanSlug =
      (slug || name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const slugConflict = await prisma.vehicleModel.findUnique({
      where: { slug: cleanSlug },
    });

    if (slugConflict) {
      cleanSlug = `${cleanSlug}-${Date.now().toString(36).slice(-4)}`;
    }

    const finalVehicleCode = (code?.trim() || cleanSlug.replace(/[^a-z0-9]/gi, "").slice(0, 6)).toUpperCase() || null;

    const newModel = await prisma.vehicleModel.create({
      data: {
        brandId: targetBrandId,
        slug: cleanSlug,
        code: finalVehicleCode,
        name: name.trim(),
        category: category || "UTV",
        yearsJson,
        imageUrl: imageUrl?.trim() || null,
        pickupServiceAvailable: Boolean(pickupServiceAvailable),
      },
      include: {
        brand: true,
      },
    });

    return NextResponse.json({
      success: true,
      model: {
        id: newModel.id,
        brandId: newModel.brandId,
        brandName: newModel.brand.name,
        brandSlug: newModel.brand.slug,
        slug: newModel.slug,
        code: newModel.code,
        name: newModel.name,
        category: newModel.category,
        years: yearsArray,
        yearsJson: newModel.yearsJson,
        imageUrl: newModel.imageUrl,
        pickupServiceAvailable: newModel.pickupServiceAvailable,
        createdAt: newModel.createdAt,
      },
    });
  } catch (error: any) {
    console.error("[SYS_VEHICLES_POST_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add vehicle model" },
      { status: 500 }
    );
  }
}
