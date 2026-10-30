import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const brandId = params.id;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.brand.findUnique({
      where: { id: brandId },
      include: { models: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (body.name !== undefined) {
      updateData.name = String(body.name).trim();
    }

    if (body.slug !== undefined && String(body.slug).trim()) {
      const cleanSlug = String(body.slug)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      if (cleanSlug !== existing.slug) {
        const conflict = await prisma.brand.findUnique({
          where: { slug: cleanSlug },
        });
        if (conflict && conflict.id !== brandId) {
          return NextResponse.json(
            { success: false, error: "A brand with this slug already exists" },
            { status: 409 }
          );
        }
        updateData.slug = cleanSlug;
      }
    }

    if (body.logoUrl !== undefined) {
      updateData.logoUrl = body.logoUrl ? String(body.logoUrl).trim() : null;
    }

    if (body.defaultVehicleImageUrl !== undefined) {
      updateData.defaultVehicleImageUrl = body.defaultVehicleImageUrl
        ? String(body.defaultVehicleImageUrl).trim()
        : null;
    }

    if (body.descriptionEs !== undefined) {
      updateData.descriptionEs = String(body.descriptionEs).trim();
    }

    if (body.descriptionEn !== undefined) {
      updateData.descriptionEn = String(body.descriptionEn).trim();
    }

    if (body.featured !== undefined) {
      updateData.featured = Boolean(body.featured);
    }

    const updated = await prisma.brand.update({
      where: { id: brandId },
      data: updateData,
      include: {
        models: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      brand: {
        id: updated.id,
        slug: updated.slug,
        name: updated.name,
        logoUrl: updated.logoUrl,
        defaultVehicleImageUrl: updated.defaultVehicleImageUrl,
        descriptionEs: updated.descriptionEs,
        descriptionEn: updated.descriptionEn,
        featured: updated.featured,
        modelsCount: updated.models.length,
        models: updated.models,
        createdAt: updated.createdAt,
      },
    });
  } catch (error: any) {
    console.error("[SYS_BRANDS_PATCH_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update vehicle brand" },
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
    const brandId = params.id;
    const existing = await prisma.brand.findUnique({
      where: { id: brandId },
      include: { models: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Brand not found" },
        { status: 404 }
      );
    }

    // Cascade delete models or delete brand
    await prisma.brand.delete({
      where: { id: brandId },
    });

    return NextResponse.json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error: any) {
    console.error("[SYS_BRANDS_DELETE_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete vehicle brand" },
      { status: 500 }
    );
  }
}
