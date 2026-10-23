import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStealthSession } from "@/lib/stealthAuth";

export const dynamic = "force-dynamic";

// Default fallback configuration
const DEFAULT_CONFIG = {
  id: "rates-config",
  pickupRatePerKmCRC: 1500,
  deliveryRatePerKmCRC: 800,
  homeInstallationRatePerKmCRC: 2000,
  pickupBaseFeeCRC: 10000,
  deliveryBaseFeeCRC: 3000,
  homeInstallationBaseFeeCRC: 15000,
  pickupServiceEnabled: true,
  garageAddress: "Calle 34, Pozos, Santa Ana, San José, Costa Rica",
  garageLatitude: 9.9482,
  garageLongitude: -84.1967,
};

async function readPickupServiceEnabled(): Promise<boolean> {
  try {
    const config = await prisma.logisticsRateConfig.findUnique({
      where: { id: "rates-config" },
      select: { pickupServiceEnabled: true },
    });
    if (config && config.pickupServiceEnabled !== undefined && config.pickupServiceEnabled !== null) {
      return Boolean(config.pickupServiceEnabled);
    }
  } catch (e) {
    console.warn("Could not read pickupServiceEnabled:", e);
  }
  return true;
}

/**
 * GET /api/logistics/config
 * Public endpoint to fetch current rates per kilometer, garage coordinates, and Pick-Up service availability.
 */
export async function GET() {
  try {
    let config = await prisma.logisticsRateConfig.findUnique({
      where: { id: "rates-config" },
    });

    if (!config) {
      const { pickupServiceEnabled: _ignore, ...createData } = DEFAULT_CONFIG;
      config = await prisma.logisticsRateConfig.create({
        data: createData,
      });
    }

    const pickupServiceEnabled = await readPickupServiceEnabled();

    // Dynamically query items in DB that do not qualify for home installation
    const [ineligibleProducts, ineligibleCombos, ineligiblePackages] = await Promise.all([
      prisma.product.findMany({
        where: { homeInstallationAvailable: false },
        select: { id: true, sku: true },
      }),
      prisma.combo.findMany({
        where: { homeInstallationAvailable: false },
        select: { id: true, slug: true },
      }),
      prisma.performancePackage.findMany({
        where: { homeInstallationAvailable: false },
        select: { id: true, slug: true },
      }),
    ]);

    const ineligibleHomeInstallKeys: string[] = [
      ...ineligibleProducts.flatMap((p) => [p.id, p.sku]),
      ...ineligibleCombos.flatMap((c) => [c.id, c.slug]),
      ...ineligiblePackages.flatMap((pkg) => [pkg.id, pkg.slug]),
    ];

    return NextResponse.json({
      success: true,
      data: {
        ...config,
        pickupServiceEnabled,
        ineligibleHomeInstallKeys,
      },
    });
  } catch (error) {
    console.error("Error fetching logistics config:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch logistics rates", data: DEFAULT_CONFIG },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/logistics/config
 * Protected endpoint for the backdoor console (/sys-control) to modify price per km variables
 * and (Master-only) enable/disable Pick-Up service.
 */
export async function PUT(request: Request) {
  try {
    const authCheck = await requireStealthSession();
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const session = authCheck.session;
    const body = await request.json();

    const {
      pickupRatePerKmCRC,
      deliveryRatePerKmCRC,
      homeInstallationRatePerKmCRC,
      pickupBaseFeeCRC,
      deliveryBaseFeeCRC,
      homeInstallationBaseFeeCRC,
      pickupServiceEnabled,
      garageAddress,
    } = body;

    const oldConfig = await prisma.logisticsRateConfig.findUnique({
      where: { id: "rates-config" },
    });
    const oldPickupEnabled = await readPickupServiceEnabled();

    if (
      pickupServiceEnabled !== undefined &&
      Boolean(pickupServiceEnabled) !== oldPickupEnabled &&
      session.role !== "MASTER"
    ) {
      return NextResponse.json(
        { success: false, error: "Only MASTER role can enable or disable the Pick-Up service." },
        { status: 403 }
      );
    }

    const updated = await prisma.logisticsRateConfig.upsert({
      where: { id: "rates-config" },
      create: {
        id: "rates-config",
        pickupRatePerKmCRC: Number(pickupRatePerKmCRC) || DEFAULT_CONFIG.pickupRatePerKmCRC,
        deliveryRatePerKmCRC: Number(deliveryRatePerKmCRC) || DEFAULT_CONFIG.deliveryRatePerKmCRC,
        homeInstallationRatePerKmCRC: Number(homeInstallationRatePerKmCRC) || DEFAULT_CONFIG.homeInstallationRatePerKmCRC,
        pickupBaseFeeCRC: Number(pickupBaseFeeCRC) ?? DEFAULT_CONFIG.pickupBaseFeeCRC,
        deliveryBaseFeeCRC: Number(deliveryBaseFeeCRC) ?? DEFAULT_CONFIG.deliveryBaseFeeCRC,
        homeInstallationBaseFeeCRC: Number(homeInstallationBaseFeeCRC) ?? DEFAULT_CONFIG.homeInstallationBaseFeeCRC,
        garageAddress: (garageAddress && String(garageAddress).trim()) || DEFAULT_CONFIG.garageAddress,
        garageLatitude: DEFAULT_CONFIG.garageLatitude,
        garageLongitude: DEFAULT_CONFIG.garageLongitude,
      },
      update: {
        pickupRatePerKmCRC: pickupRatePerKmCRC !== undefined ? Number(pickupRatePerKmCRC) || undefined : undefined,
        deliveryRatePerKmCRC: deliveryRatePerKmCRC !== undefined ? Number(deliveryRatePerKmCRC) || undefined : undefined,
        homeInstallationRatePerKmCRC:
          homeInstallationRatePerKmCRC !== undefined ? Number(homeInstallationRatePerKmCRC) || undefined : undefined,
        pickupBaseFeeCRC: pickupBaseFeeCRC !== undefined ? Number(pickupBaseFeeCRC) : undefined,
        deliveryBaseFeeCRC: deliveryBaseFeeCRC !== undefined ? Number(deliveryBaseFeeCRC) : undefined,
        homeInstallationBaseFeeCRC:
          homeInstallationBaseFeeCRC !== undefined ? Number(homeInstallationBaseFeeCRC) : undefined,
        garageAddress: (garageAddress && String(garageAddress).trim()) || undefined,
      },
    });

    let finalPickupEnabled = oldPickupEnabled;
    if (pickupServiceEnabled !== undefined && session.role === "MASTER") {
      finalPickupEnabled = Boolean(pickupServiceEnabled);
      await prisma.logisticsRateConfig.update({
        where: { id: "rates-config" },
        data: {
          pickupServiceEnabled: finalPickupEnabled,
        },
      });
    }

    // Also update WorkshopInfo if garageAddress changed
    if (garageAddress && String(garageAddress).trim()) {
      await prisma.workshopInfo.updateMany({
        where: { id: "zxz-hq" },
        data: {
          addressEs: String(garageAddress).trim(),
          addressEn: String(garageAddress).trim(),
        },
      });
    }

    // Log audit trail for rates / Pick-Up status modification
    try {
      await prisma.auditLog.create({
        data: {
          actorId: session.userId,
          actorEmail: session.email,
          actorRole: session.role,
          action: "UPDATE_KM_RATES",
          entityType: "SYSTEM",
          entityId: "rates-config",
          oldDataJson: oldConfig ? JSON.stringify({ ...oldConfig, pickupServiceEnabled: oldPickupEnabled }) : null,
          newDataJson: JSON.stringify({ ...updated, pickupServiceEnabled: finalPickupEnabled }),
          details: `Updated logistics config: Pick-up=${finalPickupEnabled ? "ENABLED" : "DISABLED"} (₡${updated.pickupRatePerKmCRC}/km), Delivery=₡${updated.deliveryRatePerKmCRC}/km, HomeInstall=₡${updated.homeInstallationRatePerKmCRC}/km`,
        },
      });
    } catch (auditErr) {
      console.warn("Audit logging warning for logistics update:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: "Rates updated successfully",
      data: {
        ...updated,
        pickupServiceEnabled: finalPickupEnabled,
      },
    });
  } catch (error) {
    console.error("Error updating logistics config:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update logistics config" },
      { status: 500 }
    );
  }
}
