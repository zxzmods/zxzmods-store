import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireStealthSession("MASTER");
  if (!auth.authorized) return auth.response;

  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.discountCode.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Código de descuento no encontrado" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (body.code !== undefined) {
      const cleanCode = String(body.code).trim().toUpperCase().replace(/\s+/g, "");
      if (!cleanCode || !/^[A-Z0-9_-]+$/.test(cleanCode)) {
        return NextResponse.json(
          { success: false, error: "El código solo puede contener letras, números, guiones y guiones bajos." },
          { status: 400 }
        );
      }
      if (cleanCode !== existing.code) {
        const duplicate = await prisma.discountCode.findUnique({
          where: { code: cleanCode },
        });
        if (duplicate) {
          return NextResponse.json(
            { success: false, error: `Ya existe otro código de descuento con el nombre "${cleanCode}".` },
            { status: 400 }
          );
        }
      }
      updateData.code = cleanCode;
    }

    if (body.description !== undefined) {
      updateData.description = body.description ? String(body.description).trim() : null;
    }

    if (body.discountType !== undefined) {
      updateData.discountType = body.discountType === "FIXED" ? "FIXED" : "PERCENTAGE";
    }

    if (body.discountValue !== undefined) {
      const num = parseInt(body.discountValue, 10);
      if (isNaN(num) || num <= 0) {
        return NextResponse.json(
          { success: false, error: "El valor del descuento debe ser mayor a 0." },
          { status: 400 }
        );
      }
      const effectiveType = updateData.discountType || existing.discountType;
      if (effectiveType === "PERCENTAGE" && num > 100) {
        return NextResponse.json(
          { success: false, error: "El porcentaje de descuento no puede ser superior al 100%." },
          { status: 400 }
        );
      }
      updateData.discountValue = num;
    }

    if (body.minOrderCRC !== undefined) {
      updateData.minOrderCRC = Math.max(0, parseInt(body.minOrderCRC, 10) || 0);
    }

    if (body.maxDiscountCRC !== undefined) {
      updateData.maxDiscountCRC = body.maxDiscountCRC ? Math.max(0, parseInt(body.maxDiscountCRC, 10) || 0) : null;
    }

    if (body.maxUses !== undefined) {
      updateData.maxUses = body.maxUses ? Math.max(1, parseInt(body.maxUses, 10) || 0) : null;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    if (body.expiresAt !== undefined) {
      updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    }

    const updated = await prisma.discountCode.update({
      where: { id },
      data: updateData,
    });

    await recordAuditLog({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: "UPDATE_DISCOUNT_CODE",
      entityType: "DISCOUNT_CODE",
      entityId: updated.id,
      oldData: existing as any,
      newData: updated as any,
      details: `Updated discount code "${updated.code}" by Master ${auth.session.email}`,
    });

    return NextResponse.json({
      success: true,
      discountCode: updated,
    });
  } catch (error: any) {
    console.error("[SYS_DISCOUNT_CODES_PATCH_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar código de descuento" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireStealthSession("MASTER");
  if (!auth.authorized) return auth.response;

  try {
    const { id } = params;

    const existing = await prisma.discountCode.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Código de descuento no encontrado" },
        { status: 404 }
      );
    }

    await prisma.discountCode.delete({
      where: { id },
    });

    await recordAuditLog({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: "DELETE_DISCOUNT_CODE",
      entityType: "DISCOUNT_CODE",
      entityId: id,
      oldData: existing as any,
      details: `Deleted discount code "${existing.code}" by Master ${auth.session.email}`,
    });

    return NextResponse.json({
      success: true,
      message: "Código de descuento eliminado correctamente",
    });
  } catch (error: any) {
    console.error("[SYS_DISCOUNT_CODES_DELETE_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar código de descuento" },
      { status: 500 }
    );
  }
}
