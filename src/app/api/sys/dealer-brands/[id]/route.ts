import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

import { isVehicleBrand } from "@/lib/dealerBrands";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.dealerBrand.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Marca distribuidora no encontrada" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (body.name !== undefined) {
      const trimmedName = String(body.name).trim();
      if (!trimmedName) {
        return NextResponse.json(
          { success: false, error: "El nombre de la marca no puede estar vacío" },
          { status: 400 }
        );
      }
      if (isVehicleBrand(trimmedName)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Las marcas de vehículos (CFMOTO, Can-Am, Polaris, Honda, Yamaha, etc.) pertenecen a compatibilidad de vehículos y no a Marcas Distribuidoras (aftermarket parts).",
          },
          { status: 400 }
        );
      }
      updateData.name = trimmedName;
      updateData.slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      // Cascade update to products using the previous brand name
      if (existing.name !== trimmedName) {
        try {
          await prisma.product.updateMany({
            where: { brandName: existing.name },
            data: { brandName: trimmedName },
          });
        } catch (cascadeErr) {
          console.warn("[CASCADE_PRODUCT_BRAND_NAME_WARN]:", cascadeErr);
        }
      }
    }

    if (body.logoUrl !== undefined) {
      updateData.logoUrl = String(body.logoUrl).trim();
    }

    if (body.code !== undefined) {
      updateData.code = body.code && String(body.code).trim()
        ? String(body.code).trim().toUpperCase()
        : null;
    }

    if (body.redirectUrl !== undefined) {
      updateData.redirectUrl = String(body.redirectUrl).trim();
    }

    if (body.order !== undefined) {
      updateData.order = Number(body.order) || 0;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    const updated = await prisma.dealerBrand.update({
      where: { id },
      data: updateData,
    });

    await recordAuditLog({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: "UPDATE_DEALER_BRAND",
      entityType: "DEALER_BRAND",
      entityId: updated.id,
      oldData: existing,
      newData: updated,
      details: `Updated dealer brand "${updated.name}" by ${auth.session.role} ${auth.session.email}`,
    });

    return NextResponse.json({
      success: true,
      brand: updated,
    });
  } catch (error: any) {
    console.error("[SYS_DEALER_BRANDS_PATCH_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar marca distribuidora" },
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
    const { id } = params;

    const existing = await prisma.dealerBrand.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Marca distribuidora no encontrada" },
        { status: 404 }
      );
    }

    await prisma.dealerBrand.delete({
      where: { id },
    });

    await recordAuditLog({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: "DELETE_DEALER_BRAND",
      entityType: "DEALER_BRAND",
      entityId: id,
      oldData: existing,
      details: `Deleted dealer brand "${existing.name}" by ${auth.session.role} ${auth.session.email}`,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("[SYS_DEALER_BRANDS_DELETE_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar marca distribuidora" },
      { status: 500 }
    );
  }
}
