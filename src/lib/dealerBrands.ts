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

const SUPPLIER_DOMAIN_TO_BRAND_CODE: Record<string, string> = {
  "evopowersports.com": "EVP",
  "rpmsxs.com": "RPM",
  "bikemanperformance.com": "BMP",
  "drtmotorsports.com": "DRT",
  "teammscdealers.com": "MSC",
  "ggbexhaust.com": "GGB",
  "shocktherapyst.com": "SHK",
  "rngperformance.net": "RNG",
  "elektricoffroad.com": "EOD",
  "dynojet.com": "DJT",
  "trinityracing.com": "TRN",
};

function extractRootDomain(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  try {
    const parsed = new URL(rawUrl.trim().startsWith("http") ? rawUrl.trim() : `https://${rawUrl.trim()}`);
    const parts = parsed.hostname.toLowerCase().replace(/^www\./, "").split(".").filter(Boolean);
    if (parts.length >= 2) {
      return parts.slice(-2).join(".");
    }
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

export interface DealerBrandDiscountRef {
  name?: string | null;
  slug?: string | null;
  code?: string | null;
  redirectUrl?: string | null;
  dealerDiscountPercent?: number | null;
}

/**
 * Resolves the effective dealer discount (%) for a product using:
 * 1. Explicit product-level dealerDiscountPercent (> 0)
 * 2. Case-insensitive / alias / code match against DealerBrand (e.g. "Evolution Powersports" <-> "EVP")
 * 3. Supplier URL domain match (e.g. dealers.evopowersports.com -> EVP even if product brandName is "TAPP" or "STM")
 */
export function resolveEffectiveDealerDiscount(
  dealerBrands: DealerBrandDiscountRef[],
  opts: {
    productDealerDiscount?: number | null;
    brandName?: string | null;
    supplierUrl?: string | null;
  }
): number {
  const explicit = Math.max(0, Math.min(100, Number(opts.productDealerDiscount) || 0));
  if (explicit > 0) return explicit;

  const activeBrands = (dealerBrands || []).filter(
    (b) => b && Number(b.dealerDiscountPercent) > 0
  );
  if (activeBrands.length === 0) return 0;

  const cleanBrand = (opts.brandName || "").trim().toLowerCase();
  const targetBrandCode = cleanBrand ? resolveDefaultDealerBrandCode(cleanBrand) : "";

  // 1. Direct case-insensitive name / slug / code match
  if (cleanBrand) {
    const directMatch = activeBrands.find((b) => {
      const bName = (b.name || "").trim().toLowerCase();
      const bSlug = (b.slug || "").trim().toLowerCase();
      const bCode = (b.code || "").trim().toUpperCase() || resolveDefaultDealerBrandCode(bName);
      return (
        bName === cleanBrand ||
        bSlug === cleanBrand ||
        (targetBrandCode && bCode === targetBrandCode)
      );
    });
    if (directMatch && Number(directMatch.dealerDiscountPercent) > 0) {
      return Math.max(0, Math.min(100, Number(directMatch.dealerDiscountPercent)));
    }
  }

  // 2. Supplier URL root domain match (e.g. dealers.evopowersports.com -> evopowersports.com -> EVP)
  const urlDomain = extractRootDomain(opts.supplierUrl);
  if (urlDomain) {
    const mappedCode = SUPPLIER_DOMAIN_TO_BRAND_CODE[urlDomain] || "";
    const domainMatch = activeBrands.find((b) => {
      const bName = (b.name || "").trim().toLowerCase();
      const bCode = (b.code || "").trim().toUpperCase() || resolveDefaultDealerBrandCode(bName);
      const bRedirectDomain = extractRootDomain(b.redirectUrl);
      return (
        (bRedirectDomain && bRedirectDomain === urlDomain) ||
        (mappedCode && bCode === mappedCode) ||
        (mappedCode === "EVP" && (bName.includes("evp") || bName.includes("evolution powersports")))
      );
    });
    if (domainMatch && Number(domainMatch.dealerDiscountPercent) > 0) {
      return Math.max(0, Math.min(100, Number(domainMatch.dealerDiscountPercent)));
    }
  }

  return 0;
}

/**
 * Computes the effective USD acquisition cost (`P_price_D`) given retail MSRP,
 * dealer discount %, and optional active retail automatic sale price (e.g. Black Friday):
 * takes the lower of `MSRP * (1 - dealerDiscount/100)` vs `saleRetailUSD`
 * so dealer discounts are applied accurately without double-stacking non-stackable retail coupons,
 * while still capturing retail flash sales that beat dealer cost or apply to 0%-discount brands.
 */
export function computeEffectiveDealerCostUSD(
  baseRetailUSD: number,
  dealerDiscountPercent: number = 0,
  saleRetailUSD?: number | null
): number {
  const retail = Number(baseRetailUSD) || 0;
  if (retail <= 0) return 0;
  const disc = Math.max(0, Math.min(100, Number(dealerDiscountPercent) || 0));
  const dealerCost = disc > 0 ? Number((retail * (1 - disc / 100)).toFixed(2)) : Number(retail.toFixed(2));
  const sale = typeof saleRetailUSD === "number" && Number.isFinite(saleRetailUSD) && saleRetailUSD > 0
    ? Number(saleRetailUSD.toFixed(2))
    : null;
  if (sale !== null && sale < dealerCost) {
    return sale;
  }
  return dealerCost;
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
