import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const brands = await prisma.brand.findMany({
      include: {
        models: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { name: "asc" },
    });

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
        models: b.models,
        createdAt: b.createdAt,
      })),
      totalBrands: brands.length,
    });
  } catch (error) {
    console.error("[SYS_BRANDS_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load vehicle brands" },
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
      name,
      slug,
      logoUrl,
      defaultVehicleImageUrl,
      descriptionEs,
      descriptionEn,
      featured = false,
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json(
        { success: false, error: "Brand name is required" },
        { status: 400 }
      );
    }

    const cleanName = String(name).trim();
    let cleanSlug = (slug || cleanName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    if (!cleanSlug) {
      cleanSlug = `brand-${Date.now().toString(36)}`;
    }

    const existingSlug = await prisma.brand.findUnique({
      where: { slug: cleanSlug },
    });

    if (existingSlug) {
      cleanSlug = `${cleanSlug}-${Date.now().toString(36).slice(-4)}`;
    }

    const descEs = descriptionEs?.trim() || `Vehículos y repuestos de alto rendimiento ${cleanName}.`;
    const descEn = descriptionEn?.trim() || `High performance vehicles and upgrades for ${cleanName}.`;

    const newBrand = await prisma.brand.create({
      data: {
        slug: cleanSlug,
        name: cleanName,
        logoUrl: logoUrl?.trim() || null,
        defaultVehicleImageUrl: defaultVehicleImageUrl?.trim() || null,
        descriptionEs: descEs,
        descriptionEn: descEn,
        featured: Boolean(featured),
      },
    });

    return NextResponse.json({
      success: true,
      brand: {
        id: newBrand.id,
        slug: newBrand.slug,
        name: newBrand.name,
        logoUrl: newBrand.logoUrl,
        defaultVehicleImageUrl: newBrand.defaultVehicleImageUrl,
        descriptionEs: newBrand.descriptionEs,
        descriptionEn: newBrand.descriptionEn,
        featured: newBrand.featured,
        modelsCount: 0,
        createdAt: newBrand.createdAt,
      },
    });
  } catch (error: any) {
    console.error("[SYS_BRANDS_POST_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create vehicle brand" },
      { status: 500 }
    );
  }
}
