import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { syncAllKnownBrandsToDealerBrands, isVehicleBrand, resolveDefaultDealerBrandCode } from "@/lib/dealerBrands";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    // Auto-sync dealer brands (and purge any vehicle brands)
    await syncAllKnownBrandsToDealerBrands();

    const allBrands = await prisma.dealerBrand.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    // Strictly ensure no vehicle manufacturer brands (CFMOTO, Can-Am, Polaris, etc.) are returned
    const brands = allBrands.filter(
      (b) => !isVehicleBrand(b.name) && !isVehicleBrand(b.slug || "")
    );

    return NextResponse.json({
      success: true,
      brands,
    });
  } catch (error: any) {
    console.error("[SYS_DEALER_BRANDS_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al cargar marcas distribuidoras" },
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
      code,
      logoUrl,
      redirectUrl = "",
      order = 0,
      isActive = true,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: "El nombre de la marca distribuidora es requerido" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Strictly prevent vehicle brands (CFMOTO, Can-Am, Polaris, etc.) from being added to Dealer Brands
    if (isVehicleBrand(trimmedName) || isVehicleBrand(slug)) {
      return NextResponse.json(
        {
          success: false,
          error: "Las marcas de vehículos (CFMOTO, Can-Am, Polaris, Honda, Yamaha, etc.) pertenecen a compatibilidad de vehículos y no a Marcas Distribuidoras (aftermarket parts). Por favor utiliza únicamente marcas distribuidoras de repuestos (ej: EVP, RPM Powersports, Bikeman, Dynojet, etc.).",
        },
        { status: 400 }
      );
    }

    if (!logoUrl?.trim()) {
      return NextResponse.json(
        { success: false, error: "El logo o imagen de la marca es requerido" },
        { status: 400 }
      );
    }

    const finalRedirectUrl = redirectUrl?.trim() || `/productos?brand=${encodeURIComponent(trimmedName)}`;
    const finalCode = (code?.trim() || resolveDefaultDealerBrandCode(trimmedName)).toUpperCase() || null;

    const newBrand = await prisma.dealerBrand.create({
      data: {
        name: trimmedName,
        slug,
        code: finalCode,
        logoUrl: logoUrl.trim(),
        redirectUrl: finalRedirectUrl,
        order: Number(order) || 0,
        isActive: Boolean(isActive),
      },
    });

    await recordAuditLog({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: "CREATE_DEALER_BRAND",
      entityType: "DEALER_BRAND",
      entityId: newBrand.id,
      newData: {
        name: newBrand.name,
        code: newBrand.code,
        logoUrl: newBrand.logoUrl,
        redirectUrl: newBrand.redirectUrl,
        order: newBrand.order,
        isActive: newBrand.isActive,
      },
      details: `Created dealer brand "${newBrand.name}" (${newBrand.code || "NO_CODE"}) by ${auth.session.role} ${auth.session.email}`,
    });

    return NextResponse.json({
      success: true,
      brand: newBrand,
    });
  } catch (error: any) {
    console.error("[SYS_DEALER_BRANDS_POST_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al crear marca distribuidora" },
      { status: 500 }
    );
  }
}
