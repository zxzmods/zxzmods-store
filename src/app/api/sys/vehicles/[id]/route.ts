import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const modelId = params.id;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.vehicleModel.findUnique({
      where: { id: modelId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Vehicle model not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.brandId !== undefined) updateData.brandId = body.brandId;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.code !== undefined) {
      updateData.code = body.code ? String(body.code).trim().toUpperCase() : null;
    }
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl ? body.imageUrl.trim() : null;
    if (body.pickupServiceAvailable !== undefined) {
      updateData.pickupServiceAvailable = Boolean(body.pickupServiceAvailable);
    }

    if (body.slug !== undefined && body.slug.trim() !== existing.slug) {
      const cleanSlug = body.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const conflict = await prisma.vehicleModel.findUnique({ where: { slug: cleanSlug } });
      if (conflict && conflict.id !== modelId) {
        return NextResponse.json(
          { success: false, error: "A vehicle model with this slug already exists" },
          { status: 409 }
        );
      }
      updateData.slug = cleanSlug;
    }

    if (body.years !== undefined || (body.yearFrom && body.yearTo)) {
      let yearsArray: number[] = [];
      if (Array.isArray(body.years) && body.years.length > 0) {
        yearsArray = body.years.map(Number).filter((y: number) => !isNaN(y) && y > 1990 && y < 2050);
      } else if (body.yearFrom && body.yearTo) {
        const from = Math.min(Number(body.yearFrom), Number(body.yearTo));
        const to = Math.max(Number(body.yearFrom), Number(body.yearTo));
        for (let y = from; y <= to; y++) {
          yearsArray.push(y);
        }
      }
      if (yearsArray.length > 0) {
        updateData.yearsJson = JSON.stringify(Array.from(new Set(yearsArray)).sort((a, b) => a - b));
      }
    }

    const updated = await prisma.vehicleModel.update({
      where: { id: modelId },
      data: updateData,
      include: { brand: true },
    });

    let parsedYears: number[] = [];
    try {
      parsedYears = JSON.parse(updated.yearsJson || "[]");
    } catch {}

    return NextResponse.json({
      success: true,
      model: {
        id: updated.id,
        brandId: updated.brandId,
        brandName: updated.brand.name,
        brandSlug: updated.brand.slug,
        slug: updated.slug,
        code: updated.code,
        name: updated.name,
        category: updated.category,
        years: parsedYears,
        yearsJson: updated.yearsJson,
        imageUrl: updated.imageUrl,
        pickupServiceAvailable: updated.pickupServiceAvailable,
      },
    });
  } catch (error) {
    console.error("[SYS_VEHICLES_PATCH_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update vehicle model" },
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
    const modelId = params.id;
    const existing = await prisma.vehicleModel.findUnique({
      where: { id: modelId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Vehicle model not found" },
        { status: 404 }
      );
    }

    await prisma.vehicleModel.delete({
      where: { id: modelId },
    });

    return NextResponse.json({ success: true, message: "Vehicle model deleted" });
  } catch (error) {
    console.error("[SYS_VEHICLES_DELETE_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete vehicle model" },
      { status: 500 }
    );
  }
}
