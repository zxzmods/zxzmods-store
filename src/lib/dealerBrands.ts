import { prisma } from "@/lib/prisma";

export const VEHICLE_BRAND_SLUGS = [
  "cfmoto",
  "can-am",
  "canam",
  "can am",
  "polaris",
  "honda",
  "yamaha",
  "segway",
  "kawasaki",
  "speed utv",
  "speedutv",
  "arctic cat",
  "arcticcat",
  "textron",
  "suzuki",
];

/**
 * Checks whether a brand name or slug is a vehicle manufacturer brand
 * (e.g. CFMOTO, Can-Am, Polaris, Honda, Yamaha, Segway) rather than an aftermarket dealer brand.
 */
export function isVehicleBrand(nameOrSlug: string): boolean {
  if (!nameOrSlug) return false;
  const clean = nameOrSlug.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  return VEHICLE_BRAND_SLUGS.some((vb) => {
    const vbClean = vb.replace(/[^a-z0-9]/g, "");
    return clean === vbClean || clean === `${vbClean}offroad` || clean === `${vbClean}racing`;
  });
}

export const DEFAULT_DEALER_BRAND_CODES: Record<string, string> = {
  "bikeman performance": "BMP",
  "bikeman": "BMP",
  "bmp": "BMP",
  "rpm powersports": "RPM",
  "rpm": "RPM",
  "evp": "EVP",
  "evolution powersports": "EVP",
  "drt motorsports": "DRT",
  "drt": "DRT",
  "shock therapy": "SHK",
  "ggb exhaust": "GGB",
  "ggb": "GGB",
  "team msc": "MSC",
  "msc": "MSC",
  "rng performance": "RNG",
  "rng": "RNG",
  "elektric offroad designs": "EOD",
  "eod": "EOD",
  "dynojet": "DJT",
  "agency power": "AP",
  "trinity racing": "TRN",
};

export function resolveDefaultDealerBrandCode(name: string): string {
  if (!name) return "";
  const clean = name.trim().toLowerCase();
  if (DEFAULT_DEALER_BRAND_CODES[clean]) {
    return DEFAULT_DEALER_BRAND_CODES[clean];
  }
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    const initials = words.map((w) => w[0]).join("").toUpperCase();
    if (initials.length >= 2 && initials.length <= 4) return initials;
  }
  return name.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();
}

/**
 * Automatically calculates a product SKU following the official pattern:
 * 'the dealer brand sku' + '-' + 'compatible vehicle sku (all compatable vehicles, just separate them by '-')' + '-' + 'number of that dealer brand product (if brands has 3 products then it will be '04')'
 */
export function computeAutoProductSku({
  dealerBrandName,
  selectedVehicles = [],
  existingProducts = [],
  dealerBrands = [],
  vehicleBrands = [],
  currentProductId,
}: {
  dealerBrandName: string;
  selectedVehicles?: string[];
  existingProducts?: Array<{ id: string; brandName?: string | null; brand?: string[] }>;
  dealerBrands?: Array<{ name: string; code?: string | null; slug?: string | null }>;
  vehicleBrands?: Array<{ models?: Array<{ slug: string; name: string; code?: string | null; id?: string }> }>;
  currentProductId?: string;
}): string {
  const cleanBrand = (dealerBrandName || "").trim();
  if (!cleanBrand) return "";

  // 1. Dealer Brand SKU
  let brandSku = "";
  const foundDb = dealerBrands.find(
    (db) =>
      db.name?.trim().toLowerCase() === cleanBrand.toLowerCase() ||
      db.slug?.trim().toLowerCase() === cleanBrand.toLowerCase()
  );
  if (foundDb?.code?.trim()) {
    brandSku = foundDb.code.trim().toUpperCase();
  } else {
    brandSku = resolveDefaultDealerBrandCode(cleanBrand);
  }

  // 2. Compatible Vehicle SKU(s)
  const vehicleSkuParts: string[] = [];
  const handled = new Set<string>();

  for (const rawSlug of selectedVehicles) {
    const v = (rawSlug || "").trim().toLowerCase();
    if (!v || handled.has(v)) continue;
    handled.add(v);

    if (v === "all") {
      vehicleSkuParts.push("ALL");
      continue;
    }

    let foundModel: { slug: string; name: string; code?: string | null; id?: string } | null = null;
    for (const vb of vehicleBrands) {
      if (vb.models && Array.isArray(vb.models)) {
        const m = vb.models.find(
          (mod) =>
            mod.slug?.toLowerCase() === v ||
            mod.name?.toLowerCase() === v ||
            mod.id === v
        );
        if (m) {
          foundModel = m;
          break;
        }
      }
    }

    if (foundModel?.code?.trim()) {
      vehicleSkuParts.push(foundModel.code.trim().toUpperCase());
    } else if (v === "z10" || v === "zforce-z10") {
      vehicleSkuParts.push("Z10");
    } else if (v === "z10-4" || v === "zforce-z10-4") {
      vehicleSkuParts.push("Z10-4");
    } else {
      const fallbackCode = v.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase();
      vehicleSkuParts.push(fallbackCode || "GEN");
    }
  }

  const vehiclesJoined = vehicleSkuParts.length > 0 ? vehicleSkuParts.join("-") : "GEN";

  // 3. Count products of that dealer brand
  // "number of that dealer brand product (if brands has 3 products then it will be '04')"
  const matchingProducts = existingProducts.filter((p) => {
    if (currentProductId && p.id === currentProductId) return false;
    const pBrandName = p.brandName?.trim().toLowerCase();
    if (pBrandName === cleanBrand.toLowerCase()) return true;
    if (Array.isArray(p.brand) && p.brand.some((b) => b && b.trim().toLowerCase() === cleanBrand.toLowerCase())) {
      return true;
    }
    return false;
  });

  const nextSeq = String(matchingProducts.length + 1).padStart(2, "0");

  return `${brandSku}-${vehiclesJoined}-${nextSeq}`;
}

/**
 * Ensures that an aftermarket/dealer brand is registered in the DealerBrand table.
 * Strictly ignores vehicle manufacturer brands (CFMOTO, Can-Am, etc.) to keep them separated.
 */
export async function ensureDealerBrandRegistered(
  rawName: string,
  logoUrl?: string,
  code?: string
): Promise<{ id: string; name: string; code?: string | null } | null> {
  if (!rawName || !rawName.trim()) return null;

  // STRICT SEPARATION: Vehicle brands must NEVER be in DealerBrand table
  if (isVehicleBrand(rawName)) {
    return null;
  }

  const name = rawName.trim();
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  if (isVehicleBrand(slug)) {
    return null;
  }

  try {
    const finalCode = (code?.trim() || resolveDefaultDealerBrandCode(name)).toUpperCase() || null;

    // 1. Check if already exists in DealerBrand (by name, slug, or matching SKU code)
    const existing = await prisma.dealerBrand.findFirst({
      where: {
        OR: [
          { name: { equals: name } },
          { slug: { equals: slug } },
          ...(finalCode ? [{ code: { equals: finalCode } }] : []),
        ],
      },
    });

    if (existing) {
      const updatePayload: any = {};
      if (logoUrl && logoUrl.trim() && (!existing.logoUrl || existing.logoUrl.includes("logo.png"))) {
        updatePayload.logoUrl = logoUrl.trim();
      }
      if (!existing.code && finalCode) {
        updatePayload.code = finalCode;
      }
      if (Object.keys(updatePayload).length > 0) {
        const updated = await prisma.dealerBrand.update({
          where: { id: existing.id },
          data: updatePayload,
        });
        return updated;
      }
      return existing;
    }

    // 2. Resolve logoUrl (do not use vehicle manufacturer logos)
    let finalLogo = logoUrl?.trim() || "";
    if (!finalLogo) {
      finalLogo = "/images/logo.png";
    }

    // 3. Determine order
    const count = await prisma.dealerBrand.count();

    // 4. Create DealerBrand with search redirect URL: /productos?brand=...
    const created = await prisma.dealerBrand.create({
      data: {
        name,
        slug,
        code: finalCode,
        logoUrl: finalLogo,
        redirectUrl: `/productos?brand=${encodeURIComponent(name)}`,
        order: count,
        isActive: true,
      },
    });

    return created;
  } catch (error) {
    console.error("[ENSURE_DEALER_BRAND_ERROR]:", error);
    return null;
  }
}

/**
 * Synchronizes only aftermarket dealer brands (like RPM, EVP, Bikeman, etc.) to DealerBrand.
 * Purges any accidental vehicle brands so they never mix with dealer brands.
 * Strictly respects existing user modifications and never overrides custom data.
 */
export async function syncAllKnownBrandsToDealerBrands(): Promise<number> {
  try {
    // Clean up any vehicle brands from DealerBrand table
    await prisma.dealerBrand.deleteMany({
      where: {
        OR: [
          { slug: { in: VEHICLE_BRAND_SLUGS } },
          {
            name: {
              in: [
                "CFMOTO",
                "CAN-AM",
                "Can-Am",
                "Polaris",
                "Honda",
                "Yamaha",
                "Segway",
                "Kawasaki",
                "Speed UTV",
                "Arctic Cat",
                "Suzuki",
              ],
            },
          },
        ],
      },
    });

    // Check existing brands first to avoid re-creating or overriding modified brands
    const existingBrands = await prisma.dealerBrand.findMany({
      select: { id: true, name: true, slug: true, code: true },
    });
    const existingNames = new Set(existingBrands.map((b) => b.name?.trim().toLowerCase()).filter(Boolean));
    const existingSlugs = new Set(existingBrands.map((b) => b.slug?.trim().toLowerCase()).filter(Boolean));
    const existingCodes = new Set(existingBrands.map((b) => b.code?.trim().toUpperCase()).filter(Boolean));

    const brandNamesSet = new Set<string>();

    // 1. Scan products for aftermarket brands (only if NOT vehicle brand and not already known)
    const products = await prisma.product.findMany({
      select: { brandName: true, brandJson: true, imageUrl: true },
    });

    for (const p of products) {
      if (p.brandName && p.brandName.trim() && !isVehicleBrand(p.brandName)) {
        const cleanName = p.brandName.trim();
        const code = resolveDefaultDealerBrandCode(cleanName).toUpperCase();
        if (!existingNames.has(cleanName.toLowerCase()) && (!code || !existingCodes.has(code))) {
          brandNamesSet.add(cleanName);
        }
      }
      if (p.brandJson) {
        try {
          const parsed = JSON.parse(p.brandJson);
          if (Array.isArray(parsed)) {
            parsed.forEach((b: string) => {
              if (b && typeof b === "string" && b.trim() && !isVehicleBrand(b)) {
                const cleanName = b.trim();
                const code = resolveDefaultDealerBrandCode(cleanName).toUpperCase();
                if (!existingNames.has(cleanName.toLowerCase()) && (!code || !existingCodes.has(code))) {
                  brandNamesSet.add(cleanName);
                }
              }
            });
          }
        } catch {}
      }
    }

    // 2. Default prominent aftermarket dealer brands (only seed if not already registered)
    const defaultAftermarketBrands = [
      "Bikeman Performance",
      "RPM Powersports",
      "EVP",
      "DRT Motorsports",
      "Shock Therapy",
      "GGB Exhaust",
      "Team MSC",
      "RNG Performance",
      "Elektric Offroad Designs",
    ];

    for (const b of defaultAftermarketBrands) {
      const defSlug = b.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const defCode = resolveDefaultDealerBrandCode(b).toUpperCase();
      if (
        !existingNames.has(b.toLowerCase()) &&
        !existingSlugs.has(defSlug) &&
        (!defCode || !existingCodes.has(defCode))
      ) {
        brandNamesSet.add(b);
      }
    }

    let syncCount = 0;
    for (const name of Array.from(brandNamesSet)) {
      if (!isVehicleBrand(name)) {
        await ensureDealerBrandRegistered(name);
        syncCount++;
      }
    }

    return syncCount;
  } catch (error) {
    console.error("[SYNC_ALL_BRANDS_TO_DEALER_BRANDS_ERROR]:", error);
    return 0;
  }
}
