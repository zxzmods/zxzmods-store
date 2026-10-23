import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { code, partsSubtotalCRC = 0 } = body;

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { valid: false, error: "Por favor ingresa un código de descuento válido." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "");

    const discount = await prisma.discountCode.findUnique({
      where: { code: cleanCode },
    });

    if (!discount) {
      return NextResponse.json(
        { valid: false, error: `El código "${cleanCode}" no existe o es inválido.` },
        { status: 404 }
      );
    }

    if (!discount.isActive) {
      return NextResponse.json(
        { valid: false, error: `El código "${cleanCode}" no está disponible o ha sido desactivado.` },
        { status: 400 }
      );
    }

    if (discount.expiresAt && new Date() > new Date(discount.expiresAt)) {
      return NextResponse.json(
        { valid: false, error: `El código "${cleanCode}" ha expirado.` },
        { status: 400 }
      );
    }

    if (discount.maxUses !== null && discount.timesUsed >= discount.maxUses) {
      return NextResponse.json(
        { valid: false, error: `El código "${cleanCode}" ha alcanzado su límite máximo de usos disponibles.` },
        { status: 400 }
      );
    }

    const subtotal = Math.max(0, parseInt(partsSubtotalCRC, 10) || 0);

    if (discount.minOrderCRC > 0 && subtotal < discount.minOrderCRC) {
      return NextResponse.json(
        {
          valid: false,
          error: `El código "${cleanCode}" requiere un subtotal mínimo de piezas de ₡${discount.minOrderCRC.toLocaleString("es-CR")}. Tu subtotal actual es de ₡${subtotal.toLocaleString("es-CR")}.`,
        },
        { status: 400 }
      );
    }

    // Calculate discount amount
    let discountCRC = 0;
    if (discount.discountType === "PERCENTAGE") {
      const rawDiscount = Math.round(subtotal * (discount.discountValue / 100));
      discountCRC = discount.maxDiscountCRC ? Math.min(rawDiscount, discount.maxDiscountCRC) : rawDiscount;
    } else {
      // FIXED amount
      discountCRC = Math.min(subtotal, discount.discountValue);
    }

    const finalTotalCRC = Math.max(0, subtotal - discountCRC);

    return NextResponse.json({
      valid: true,
      code: discount.code,
      description: discount.description,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      discountCRC,
      finalTotalCRC,
      message: `¡Código "${discount.code}" aplicado con éxito!`,
    });
  } catch (error: any) {
    console.error("[CHECKOUT_VALIDATE_DISCOUNT_ERROR]:", error);
    return NextResponse.json(
      { valid: false, error: "Error al validar código de descuento en el servidor." },
      { status: 500 }
    );
  }
}
