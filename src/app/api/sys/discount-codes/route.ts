import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStealthSession("MASTER");
  if (!auth.authorized) return auth.response;

  try {
    const discountCodes = await prisma.discountCode.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      discountCodes,
    });
  } catch (error: any) {
    console.error("[SYS_DISCOUNT_CODES_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al cargar códigos de descuento" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireStealthSession("MASTER");
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const {
      code,
      description = null,
      discountType = "PERCENTAGE",
      discountValue,
      minOrderCRC = 0,
      maxDiscountCRC = null,
      maxUses = null,
      isActive = true,
      expiresAt = null,
    } = body;

    // Validation
    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { success: false, error: "El código de descuento es obligatorio." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "");
    if (!/^[A-Z0-9_-]+$/.test(cleanCode)) {
      return NextResponse.json(
        { success: false, error: "El código solo puede contener letras, números, guiones y guiones bajos." },
        { status: 400 }
      );
    }

    // Check uniqueness
    const existing = await prisma.discountCode.findUnique({
      where: { code: cleanCode },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Ya existe un código de descuento con el nombre "${cleanCode}".` },
        { status: 400 }
      );
    }

    const numValue = parseInt(discountValue, 10);
    if (isNaN(numValue) || numValue <= 0) {
      return NextResponse.json(
        { success: false, error: "El valor del descuento debe ser un número entero mayor a 0." },
        { status: 400 }
      );
    }

    if (discountType === "PERCENTAGE" && numValue > 100) {
      return NextResponse.json(
        { success: false, error: "El porcentaje de descuento no puede ser superior al 100%." },
        { status: 400 }
      );
    }

    const cleanMinOrder = Math.max(0, parseInt(minOrderCRC, 10) || 0);
    const cleanMaxDiscount = maxDiscountCRC ? Math.max(0, parseInt(maxDiscountCRC, 10) || 0) : null;
    const cleanMaxUses = maxUses ? Math.max(1, parseInt(maxUses, 10) || 0) : null;
    const cleanExpiresAt = expiresAt ? new Date(expiresAt) : null;

    const created = await prisma.discountCode.create({
      data: {
        code: cleanCode,
        description: description ? String(description).trim() : null,
        discountType: discountType === "FIXED" ? "FIXED" : "PERCENTAGE",
        discountValue: numValue,
        minOrderCRC: cleanMinOrder,
        maxDiscountCRC: cleanMaxDiscount,
        maxUses: cleanMaxUses,
        isActive: Boolean(isActive),
        expiresAt: cleanExpiresAt,
        createdBy: auth.session.email,
      },
    });

    await recordAuditLog({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: "CREATE_DISCOUNT_CODE",
      entityType: "DISCOUNT_CODE",
      entityId: created.id,
      newData: created as any,
      details: `Created discount code "${created.code}" (${created.discountType === "PERCENTAGE" ? created.discountValue + "%" : "₡" + created.discountValue}) by Master ${auth.session.email}`,
    });

    return NextResponse.json({
      success: true,
      discountCode: created,
    });
  } catch (error: any) {
    console.error("[SYS_DISCOUNT_CODES_POST_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear código de descuento" },
      { status: 500 }
    );
  }
}
