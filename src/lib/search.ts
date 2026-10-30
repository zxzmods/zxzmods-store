import {
  DEFAULT_DEALER_BRAND_CODES,
  resolveDefaultDealerBrandCode,
} from "@/lib/dealerBrands";
import {
  detectVehiclePlatform,
  isPlatformOrVehicleMatch,
  isUniversalFit,
  extractDescriptionText,
  detectProductVehicleBrands,
} from "@/lib/products";
import { SXS_BRAND_PLATFORMS } from "@/lib/sxsBrands";

export const TECHNICAL_UNITS_AND_STOPWORDS = new Set([
  "rpm", "rpms", "psi", "hp", "mph", "bar", "cc", "mm", "cm", "db", "dba",
  "cfm", "volt", "volts", "amp", "amps", "ah", "lb", "lbs", "oz", "kg",
  "oem", "kit", "fits", "fit", "universal", "all", "para", "for", "with", "con",
  "and", "the", "del", "las", "los", "por"
]);

export interface DealerBrandSearchRef {
  code?: string | null;
  name: string;
  slug?: string | null;
  aliases?: string[];
}

export interface SearchEvaluationResult {
  matches: boolean;
  score: number;
}

/**
 * Normalizes text for accent-insensitive, case-insensitive, and clean comparison.
 */
export function normalizeSearchTerm(str: string): string {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Builds a comprehensive lookup list of dealer brands combining default codes and database records.
 */
export function buildDealerBrandSearchRefs(dbDealerBrands?: any[]): DealerBrandSearchRef[] {
  const brandMap = new Map<string, DealerBrandSearchRef>();

  // 1. Defaults from DEFAULT_DEALER_BRAND_CODES
  for (const [nameKey, code] of Object.entries(DEFAULT_DEALER_BRAND_CODES)) {
    const normCode = code.toUpperCase();
    if (!brandMap.has(normCode)) {
      brandMap.set(normCode, {
        code: normCode,
        name: nameKey,
        aliases: [normCode.toLowerCase()],
      });
    }
    const ref = brandMap.get(normCode)!;
    const normKey = normalizeSearchTerm(nameKey);
    if (!ref.aliases!.includes(normKey)) ref.aliases!.push(normKey);
    const stripped = normKey
      .replace(/\s+(powersports|exhaust|performance|motorsports|designs|racing|offroad)\b/g, "")
      .trim();
    if (stripped && !ref.aliases!.includes(stripped)) ref.aliases!.push(stripped);
  }

  // 2. Database records from DealerBrand table
  if (dbDealerBrands && Array.isArray(dbDealerBrands)) {
    for (const db of dbDealerBrands) {
      const code = (db.code || resolveDefaultDealerBrandCode(db.name)).toUpperCase();
      if (!brandMap.has(code)) {
        brandMap.set(code, {
          code,
          name: db.name,
          slug: db.slug || undefined,
          aliases: [code.toLowerCase()],
        });
      }
      const ref = brandMap.get(code)!;
      const normName = normalizeSearchTerm(db.name);
      if (!ref.aliases!.includes(normName)) ref.aliases!.push(normName);
      if (db.slug) {
        const normSlug = normalizeSearchTerm(db.slug);
        if (!ref.aliases!.includes(normSlug)) ref.aliases!.push(normSlug);
      }
      const stripped = normName
        .replace(/\s+(powersports|exhaust|performance|motorsports|designs|racing|offroad)\b/g, "")
        .trim();
      if (stripped && !ref.aliases!.includes(stripped)) ref.aliases!.push(stripped);
    }
  }

  return Array.from(brandMap.values());
}

/**
 * Evaluates whether a product matches a search query and calculates its relevance score.
 * - Prevents cross-brand description pollution (e.g. searching 'rpm' will NEVER return GGB products).
 * - Excludes technical units and stopwords from matching on description body alone.
 * - Enforces vehicle brand and vehicle platform boundaries.
 * - Prioritizes direct entity matches (SKU, Brand, Title) with relevance scoring.
 */
export function evaluateProductSearch(
  product: any,
  query?: string,
  options?: {
    dealerBrands?: DealerBrandSearchRef[];
    vehicleBrands?: Array<{ slug: string; title: string }>;
  }
): SearchEvaluationResult {
  if (!query || !query.trim()) {
    return { matches: true, score: 0 };
  }

  const qClean = normalizeSearchTerm(query).trim();
  const searchTerms = qClean.split(/\s+/).filter(Boolean);
  if (searchTerms.length === 0) {
    return { matches: true, score: 0 };
  }

  // Pre-check: If full search query targets a specific vehicle platform (e.g. "z10", "z1000", "maverick-r", "x3")
  const searchPlat = detectVehiclePlatform(qClean);
  if (searchPlat) {
    const isUniversal = isUniversalFit(product.comp);
    if (!isUniversal && product.comp && product.comp.length > 0) {
      const matchesPlat = product.comp.some((c: string) => isPlatformOrVehicleMatch(c, qClean));
      if (!matchesPlat) return { matches: false, score: 0 };
    }
  }

  const dealerBrandRefs = options?.dealerBrands || buildDealerBrandSearchRefs();

  // Primary fields extraction
  const pId = normalizeSearchTerm(product.id || "");
  const pSku = normalizeSearchTerm(product.sku || "");
  const pTitle = normalizeSearchTerm(product.p_title || `${product.nameEs || ""} ${product.nameEn || ""}`);
  const pReqs = normalizeSearchTerm(product.requirements || "");
  const pCats: string[] = (Array.isArray(product.category) ? product.category : []).map((c: any) => normalizeSearchTerm(String(c)));
  const pBrands: string[] = (Array.isArray(product.brand) ? product.brand : (product.brandName ? [product.brandName] : [])).map((b: any) => normalizeSearchTerm(String(b)));
  const pComps: string[] = (Array.isArray(product.comp) ? product.comp : []).map((c: any) => normalizeSearchTerm(String(c)));

  const primarySearchableText = [
    pId,
    pSku,
    pTitle,
    pReqs,
    ...pCats,
    ...pBrands,
    ...pComps,
  ].join(" ");

  const descRaw = extractDescriptionText(product.description || product.descriptionJson || "");
  const descText = normalizeSearchTerm(descRaw);

  // Identify which dealer brand this product belongs to (if any)
  const productDealerBrand = dealerBrandRefs.find((dRef) => {
    const codeLower = (dRef.code || "").toLowerCase();
    if (codeLower && (pSku.startsWith(`${codeLower}-`) || pSku.startsWith(`${codeLower}_`))) {
      return true;
    }
    return pBrands.some((pb: string) => {
      if (codeLower && (pb === codeLower || pb.startsWith(`${codeLower} `))) return true;
      return dRef.aliases?.some((alias) => pb === alias || pb.includes(alias) || alias.includes(pb));
    });
  });

  const productVehicleBrands = detectProductVehicleBrands(product).map((vb) => vb.toLowerCase());
  const isUniversal = isUniversalFit(product.comp);

  const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

  for (const term of searchTerms) {
    // 1. Vehicle Platform check on individual term if term is a known vehicle platform (e.g. in "exhaust z10")
    const termPlat = detectVehiclePlatform(term);
    if (termPlat && !isUniversal) {
      if (product.comp && product.comp.length > 0) {
        const matchesPlat = product.comp.some((c: string) => isPlatformOrVehicleMatch(c, term));
        if (!matchesPlat) return { matches: false, score: 0 };
      }
    }

    // 2. Vehicle Brand check on individual term (e.g. "polaris", "can-am", "cfmoto")
    for (const [brandSlug] of Object.entries(SXS_BRAND_PLATFORMS)) {
      const slugNorm = normalizeSearchTerm(brandSlug);
      const isVehicleBrandTerm = term === slugNorm || term.replace(/[^a-z0-9]/g, "") === slugNorm.replace(/[^a-z0-9]/g, "");
      if (isVehicleBrandTerm) {
        if (!isUniversal && !productVehicleBrands.includes(slugNorm)) {
          return { matches: false, score: 0 };
        }
      }
    }

    // 3. Primary fields check (SKU, title, brand, category, comp, requirements)
    let inPrimary = false;
    if (term.length === 1) {
      inPrimary = new RegExp(`(^|[\\s\\-_/])${escapeRegex(term)}($|[\\s\\-_/])`, "i").test(primarySearchableText);
    } else {
      inPrimary =
        primarySearchableText.includes(term) ||
        pComps.some((c: string) => isPlatformOrVehicleMatch(c, term));
    }

    if (inPrimary) {
      continue;
    }

    // 4. Dealer brand conflict check:
    // If the term refers to a dealer brand (like "rpm", "ggb", "evp", "bmp", "drt"):
    const matchedDealerBrand = dealerBrandRefs.find((dRef) => {
      const codeLower = (dRef.code || "").toLowerCase();
      return (codeLower && codeLower === term) || dRef.aliases?.some((alias) => alias === term || alias.startsWith(term));
    });

    if (matchedDealerBrand) {
      // The search query targets a specific brand.
      // If the product belongs to a different dealer brand, or doesn't match this brand:
      // it MUST NOT match via description!
      if (!productDealerBrand || productDealerBrand.code !== matchedDealerBrand.code) {
        return { matches: false, score: 0 };
      }
    }

    // 5. Technical units and stopwords rejection in description
    if (TECHNICAL_UNITS_AND_STOPWORDS.has(term)) {
      return { matches: false, score: 0 };
    }

    // 6. Secondary fallback: check description text using word boundaries (NEVER loose substring)
    const wordRegex = new RegExp(`(^|[^a-z0-9])${escapeRegex(term)}([^a-z0-9]|$)`, "i");
    if (!wordRegex.test(descText)) {
      return { matches: false, score: 0 };
    }
  }

  // Calculate search relevance score
  let score = 0;
  if (pSku === qClean) score += 1000;
  else if (pSku.startsWith(qClean)) score += 500;
  else if (pSku.includes(qClean)) score += 200;

  if (pBrands.some((b: string) => b === qClean || b.startsWith(qClean))) score += 400;
  else if (pBrands.some((b: string) => b.includes(qClean))) score += 150;

  if (pTitle.includes(qClean)) score += 300;
  else if (searchTerms.every((t) => pTitle.includes(t))) score += 200;

  if (pCats.some((c: string) => c.includes(qClean))) score += 100;
  if (pComps.some((c: string) => c.includes(qClean))) score += 80;

  return { matches: true, score: Math.max(score, 10) };
}

/**
 * Evaluates whether a combo matches a search query and calculates its relevance score.
 */
export function evaluateComboSearch(
  combo: any,
  query?: string,
  options?: {
    dealerBrands?: DealerBrandSearchRef[];
    vehicleBrands?: Array<{ slug: string; title: string }>;
  }
): SearchEvaluationResult {
  if (!query || !query.trim()) {
    return { matches: true, score: 0 };
  }

  const qClean = normalizeSearchTerm(query).trim();
  const searchTerms = qClean.split(/\s+/).filter(Boolean);
  if (searchTerms.length === 0) {
    return { matches: true, score: 0 };
  }

  const dealerBrandRefs = options?.dealerBrands || buildDealerBrandSearchRefs();

  const cId = normalizeSearchTerm(combo.id || "");
  const cSlug = normalizeSearchTerm(combo.slug || "");
  const cTitle = normalizeSearchTerm(`${combo.titleEs || ""} ${combo.titleEn || ""}`);
  const cBadge = normalizeSearchTerm(`${combo.badgeEs || ""} ${combo.badgeEn || ""}`);
  const cItems = normalizeSearchTerm(Array.isArray(combo.items) ? combo.items.join(" ") : "");
  const cVBrands: string[] = (Array.isArray(combo.vehicleBrands) ? combo.vehicleBrands : []).map((vb: any) => normalizeSearchTerm(String(vb)));
  const cDBrands: string[] = (Array.isArray(combo.distributorBrands) ? combo.distributorBrands : []).map((db: any) => normalizeSearchTerm(String(db)));

  const primarySearchableText = [
    cId,
    cSlug,
    cTitle,
    cBadge,
    cItems,
    ...cVBrands,
    ...cDBrands,
  ].join(" ");

  const descText = normalizeSearchTerm(`${combo.descriptionEs || ""} ${combo.descriptionEn || ""}`);

  // Identify dealer brand(s) of this combo
  const comboDealerBrands = dealerBrandRefs.filter((dRef) => {
    const codeLower = (dRef.code || "").toLowerCase();
    return cDBrands.some((cb: string) => {
      if (codeLower && (cb === codeLower || cb.startsWith(`${codeLower} `))) return true;
      return dRef.aliases?.some((alias) => cb === alias || cb.includes(alias) || alias.includes(cb));
    });
  });

  const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

  for (const term of searchTerms) {
    // 1. Vehicle brand check
    for (const [brandSlug] of Object.entries(SXS_BRAND_PLATFORMS)) {
      const slugNorm = normalizeSearchTerm(brandSlug);
      const isVehicleBrandTerm = term === slugNorm || term.replace(/[^a-z0-9]/g, "") === slugNorm.replace(/[^a-z0-9]/g, "");
      if (isVehicleBrandTerm) {
        if (!cVBrands.includes(slugNorm)) {
          return { matches: false, score: 0 };
        }
      }
    }

    // 2. Primary check
    let inPrimary = false;
    if (term.length === 1) {
      inPrimary = new RegExp(`(^|[\\s\\-_/])${escapeRegex(term)}($|[\\s\\-_/])`, "i").test(primarySearchableText);
    } else {
      inPrimary = primarySearchableText.includes(term);
    }

    if (inPrimary) {
      continue;
    }

    // 3. Dealer brand conflict check
    const matchedDealerBrand = dealerBrandRefs.find((dRef) => {
      const codeLower = (dRef.code || "").toLowerCase();
      return (codeLower && codeLower === term) || dRef.aliases?.some((alias) => alias === term || alias.startsWith(term));
    });

    if (matchedDealerBrand) {
      if (comboDealerBrands.length > 0 && !comboDealerBrands.some((cdb) => cdb.code === matchedDealerBrand.code)) {
        return { matches: false, score: 0 };
      }
    }

    // 4. Technical units and stopwords rejection in description
    if (TECHNICAL_UNITS_AND_STOPWORDS.has(term)) {
      return { matches: false, score: 0 };
    }

    // 5. Description whole-word regex
    const wordRegex = new RegExp(`(^|[^a-z0-9])${escapeRegex(term)}([^a-z0-9]|$)`, "i");
    if (!wordRegex.test(descText)) {
      return { matches: false, score: 0 };
    }
  }

  let score = 0;
  if (cTitle.includes(qClean)) score += 300;
  else if (searchTerms.every((t) => cTitle.includes(t))) score += 200;

  if (cDBrands.some((b: string) => b === qClean || b.startsWith(qClean))) score += 400;
  else if (cDBrands.some((b: string) => b.includes(qClean))) score += 150;

  if (cVBrands.some((vb: string) => vb.includes(qClean))) score += 80;

  return { matches: true, score: Math.max(score, 10) };
}
