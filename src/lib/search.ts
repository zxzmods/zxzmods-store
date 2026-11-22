import {
  DEFAULT_DEALER_BRAND_CODES,
  resolveDefaultDealerBrandCode,
} from "@/lib/dealerBrands";
import {
  detectVehiclePlatform,
  getVehicleFamily,
  isPlatformOrVehicleMatch,
  isUniversalFit,
  extractDescriptionText,
  detectProductVehicleBrands,
  normalizeBrandName,
} from "@/lib/products";
import { SXS_BRAND_PLATFORMS } from "@/lib/sxsBrands";
import { getCategoryLabel } from "@/lib/i18n";

export const TECHNICAL_UNITS_AND_STOPWORDS = new Set([
  "rpms", "psi", "hp", "mph", "bar", "cc", "mm", "cm", "db", "dba",
  "cfm", "volt", "volts", "amp", "amps", "ah", "lb", "lbs", "oz", "kg",
  "oem", "fits", "fit", "universal", "all", "para", "for", "with", "con",
  "and", "the", "del", "las", "los", "por", "de", "la", "el", "en", "un", "una",
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

export interface SmartSearchVehicleModelRef {
  id: string;
  name: string;
  code?: string | null;
  slug: string;
  category?: string | null;
  modelCategory?: string | null;
}

export interface SmartSearchCatalogContext {
  distributorBrands?: Array<{ name: string; count?: number; code?: string | null; slug?: string | null }>;
  vehicleBrands?: Array<{ slug: string; title: string; count?: number }>;
  sxsBrandModels?: Record<string, SmartSearchVehicleModelRef[]>;
  categories?: string[];
  dealerBrandRefs?: DealerBrandSearchRef[];
}

export interface SmartSearchIntentResult {
  distributorBrand?: string;
  vehicleBrand?: string;
  modelCategory?: string;
  vehicleModel?: string;
  category?: string;
  remainingQuery: string;
  matchedLabels: Array<{ kind: "brand" | "vehicle" | "category"; label: string }>;
  hasDetectedFilters: boolean;
}

export interface SmartSearchSuggestion {
  id: string;
  kind: "combined" | "brand" | "vehicle" | "category";
  label: string;
  sublabel?: string;
  apply: {
    distributorBrand?: string;
    vehicleBrand?: string;
    modelCategory?: string;
    vehicleModel?: string;
    category?: string;
    remainingQuery?: string;
  };
}

/**
 * Bilingual ES <-> EN automotive / SXS / UTV part & category synonyms.
 * Each group contains equivalent normalized keywords so searching in Spanish or English
 * always finds matching products & categories.
 */
const BILINGUAL_SYNONYM_GROUPS: string[][] = [
  ["escape", "escapes", "exhaust", "exhausts", "muffler", "mufflers", "silenciador", "slip-on", "slipon", "downpipe", "mufla", "muflas", "tubo"],
  ["suspension", "amortiguador", "amortiguadores", "shock", "shocks", "spring", "springs", "resorte", "resortes", "coilover", "sway", "a-arm", "horquilla", "bushing"],
  ["clutch", "embrague", "faja", "fajas", "belt", "belts", "correa", "correas", "helix", "primario", "secundario", "cvt", "variador"],
  ["luz", "luces", "light", "lights", "lighting", "iluminacion", "led", "barra", "farol", "faroles", "whip", "whips", "antena"],
  ["techo", "techos", "roof", "roofs", "capota"],
  ["parabrisas", "vidrio", "windshield", "windshields", "glass", "ventana"],
  ["puerta", "puertas", "door", "doors"],
  ["defensa", "defensas", "bumper", "bumpers", "parachoques", "mataburros"],
  ["llanta", "llantas", "neumatico", "neumaticos", "tire", "tires", "aro", "aros", "rin", "rines", "wheel", "wheels"],
  ["freno", "frenos", "brake", "brakes", "pastilla", "pastillas", "disco", "discos", "pad", "pads"],
  ["skid", "skidplate", "placa", "placas", "protector", "proteccion", "protection", "armor", "blindaje", "rock", "slider", "sliders"],
  ["audio", "sonido", "sound", "parlante", "parlantes", "bocina", "bocinas", "speaker", "speakers", "subwoofer", "radio", "estéreo", "estereo"],
  ["winch", "winches", "rescate", "recovery", "cabrestante", "eslinga", "tow", "remolque"],
  ["admision", "intake", "filtro", "filtros", "filter", "filters", "aire", "air", "snorkel", "bov", "blowoff", "valvula", "intercooler", "charge", "turbo"],
  ["combustible", "fuel", "inyector", "inyectores", "injector", "bomba", "pump"],
  ["enfriamiento", "cooling", "radiador", "radiator", "ventilador", "fan", "fans", "manguera", "mangueras"],
  ["rendimiento", "performance", "repro", "tune", "tuner", "ecu", "flash", "potencia", "stage", "etapa"],
  ["espejo", "espejos", "mirror", "mirrors", "retrovisor"],
  ["asiento", "asientos", "seat", "seats", "arnes", "arneses", "harness", "cinturon"],
  ["volante", "steering", "manivela", "timon"],
  ["almacenamiento", "storage", "caja", "maletero", "cargo", "bolso", "bag", "rack", "porta", "cooler"],
  ["espaciador", "espaciadores", "spacer", "spacers", "separador"],
  ["eje", "ejes", "axle", "axles", "flecha", "flechas", "drivetrain", "motriz", "diferencial"],
  ["electrico", "electrical", "bateria", "battery", "alternador", "switch", "interruptor", "relay", "cable"],
  ["mantenimiento", "maintenance", "aceite", "oil", "grasa", "grease", "servicio", "service"],
  ["herramienta", "herramientas", "tool", "tools", "llave", "extractor", "puller"],
  ["combo", "combos", "paquete", "paquetes", "bundle", "bundles"],
  ["accesorio", "accesorios", "accessory", "accessories"],
  ["interior", "cabina", "cabin", "consola", "dash", "tablero"],
  ["exterior", "carroceria", "body", "fender", "fenders", "guardabarros", "capo", "hood"],
  ["seguridad", "safety", "extintor", "jaula", "cage", "rollcage"],
  ["motor", "engine", "piston", "pistones", "biela", "empaque", "gasket", "cabeza", "cam"],
];

const SYNONYM_LOOKUP = new Map<string, string[]>();
for (const group of BILINGUAL_SYNONYM_GROUPS) {
  for (const word of group) {
    const existing = SYNONYM_LOOKUP.get(word) || [];
    for (const candidate of group) {
      if (!existing.includes(candidate)) existing.push(candidate);
    }
    SYNONYM_LOOKUP.set(word, existing);
  }
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
 * Generates lightweight singular/plural variants for ES & EN search terms.
 */
export function getStemVariants(term: string): string[] {
  const clean = normalizeSearchTerm(term).trim();
  if (!clean || clean.length < 3) return [clean].filter(Boolean);
  const variants = new Set<string>([clean]);

  if (clean.endsWith("ces") && clean.length > 4) {
    variants.add(clean.slice(0, -3) + "z"); // luces -> luz
  }
  if (clean.endsWith("ies") && clean.length > 4) {
    variants.add(clean.slice(0, -3) + "y"); // accessories -> accessory
  }
  if (clean.endsWith("es") && clean.length > 4) {
    variants.add(clean.slice(0, -2)); // amortiguadores -> amortiguador
    variants.add(clean.slice(0, -1)); // escapes -> escape
  } else if (clean.endsWith("s") && !clean.endsWith("ss") && clean.length > 3) {
    variants.add(clean.slice(0, -1)); // puertas -> puerta, belts -> belt
  }

  return Array.from(variants);
}

/**
 * Expands a single token into its stem variants + bilingual synonyms.
 */
export function expandSearchTermVariants(term: string): string[] {
  const stems = getStemVariants(term);
  const expanded = new Set<string>(stems);
  for (const s of stems) {
    const syns = SYNONYM_LOOKUP.get(s);
    if (syns) {
      for (const syn of syns) expanded.add(syn);
    }
  }
  return Array.from(expanded);
}

/**
 * Pre-normalizes common multi-word brand/vehicle phrases into canonical tokens
 * before splitting into individual search terms.
 */
function preprocessMultiWordPhrases(normQuery: string): string {
  let out = ` ${normQuery} `;
  out = out.replace(/\bcan\s+am\b/g, "can-am");
  out = out.replace(/\bcanam\b/g, "can-am");
  out = out.replace(/\bcf\s+moto\b/g, "cfmoto");
  out = out.replace(/\bspeed\s+utv\b/g, "speed-utv");
  out = out.replace(/\barctic\s+cat\b/g, "arctic-cat");
  out = out.replace(/\bskid\s+plates?\b/g, "skid-plates");
  out = out.replace(/\bpro\s+r\b/g, "pro-r");
  out = out.replace(/\bpro\s+xp\b/g, "pro-xp");
  out = out.replace(/\bturbo\s+r\b/g, "turbo-r");
  out = out.replace(/\bmaverick\s+r\b/g, "maverick-r");
  out = out.replace(/\bmaverick\s+x3\b/g, "maverick-x3");
  out = out.replace(/\bzforce\s+z10\s*4\b/g, "zforce-z10-4");
  out = out.replace(/\bzforce\s+z10\b/g, "zforce-z10");
  out = out.replace(/\bz10\s+4\b/g, "z10-4");
  out = out.replace(/\bkrx\s+1000\b/g, "krx-1000");
  out = out.replace(/\bkrx4\s+1000\b/g, "krx4-1000");
  return out.trim();
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
      .replace(/\s+(powersports|exhaust|performance|motorsports|designs|racing|offroad|utv)\b/g, "")
      .trim();
    if (stripped && !ref.aliases!.includes(stripped)) ref.aliases!.push(stripped);
  }

  // 2. Database records from DealerBrand table
  if (dbDealerBrands && Array.isArray(dbDealerBrands)) {
    for (const db of dbDealerBrands) {
      if (!db?.name) continue;
      const code = (db.code || resolveDefaultDealerBrandCode(db.name)).toUpperCase();
      const mapKey = code || normalizeSearchTerm(db.name);
      if (!brandMap.has(mapKey)) {
        brandMap.set(mapKey, {
          code,
          name: db.name,
          slug: db.slug || undefined,
          aliases: code ? [code.toLowerCase()] : [],
        });
      }
      const ref = brandMap.get(mapKey)!;
      // Prefer real DB display name over lowercase default key
      if (db.name && db.name.trim()) {
        ref.name = db.name.trim();
      }
      const normName = normalizeSearchTerm(db.name);
      if (!ref.aliases!.includes(normName)) ref.aliases!.push(normName);
      if (db.slug) {
        const normSlug = normalizeSearchTerm(db.slug);
        if (!ref.aliases!.includes(normSlug)) ref.aliases!.push(normSlug);
      }
      const stripped = normName
        .replace(/\s+(powersports|exhaust|performance|motorsports|designs|racing|offroad|utv)\b/g, "")
        .trim();
      if (stripped && !ref.aliases!.includes(stripped)) ref.aliases!.push(stripped);
    }
  }

  return Array.from(brandMap.values());
}

/**
 * Resolves the primary alphabetical distributor brand name for Patch 2.0 catalog ordering.
 */
export function getPrimarySortBrand(product: any): string {
  const rawBrand = Array.isArray(product?.brand)
    ? product.brand[0]
    : typeof product?.brand === "string"
    ? product.brand
    : product?.brandName || "";
  const normalized = normalizeBrandName(String(rawBrand || "").trim());
  return normalized || "ZZZ";
}

/**
 * Patch 2.0 Master Catalog Sorter (Fix 1 + Fix 2):
 * - Universal compatibility products are ALWAYS placed at the very end when:
 *   (a) using default/relevance order (browsing, category, compatibility, brand, or text search), OR
 *   (b) any compatibility filter is active even with manual Price/Rating sorting.
 * - Default order sorts alphabetically by Distributor Brand (A -> Z, numeric-aware:
 *   e.g. 3 Star UTV, Agency Power, Bikeman Performance, DRT Motorsports, ...),
 *   with combos mixed alongside products by their brand.
 * - Manual Price/Rating sort respects the user's chosen order (still pushing Universal last when compatibility is filtered).
 */
export function sortCatalogProductsByBrandAndUniversal<T extends Record<string, any>>(
  items: T[],
  options?: {
    sort?: "relevant" | "price-asc" | "price-desc" | "stars" | string;
    hasCompatibilityFilter?: boolean;
    scoreMap?: Map<string, number>;
  }
): T[] {
  const sortMode = options?.sort || "relevant";
  const hasCompFilter = Boolean(options?.hasCompatibilityFilter);
  const scoreMap = options?.scoreMap;
  const copy = [...items];

  const getPrice = (p: any): number =>
    Number(p?.price?.T_price ?? p?.priceCRC ?? 0) || 0;
  const getStars = (p: any): number =>
    Number((p?.reviews as any)?.stars ?? 0) || 0;
  const getTitle = (p: any): string =>
    String(p?.p_title || p?.nameEs || p?.titleEs || p?.nameEn || "").trim();

  copy.sort((a, b) => {
    const aUniv = isUniversalFit(a?.comp) ? 1 : 0;
    const bUniv = isUniversalFit(b?.comp) ? 1 : 0;

    // Fix 1 & Fix 2: Universal products ALWAYS go at the very end in default view,
    // AND whenever a specific compatibility filter is active (even on Price/Rating sort).
    if (sortMode === "relevant" || !sortMode || hasCompFilter) {
      if (aUniv !== bUniv) return aUniv - bUniv;
    }

    // Explicit manual sorts selected in dropdown
    if (sortMode === "price-asc") {
      const diff = getPrice(a) - getPrice(b);
      if (diff !== 0) return diff;
    } else if (sortMode === "price-desc") {
      const diff = getPrice(b) - getPrice(a);
      if (diff !== 0) return diff;
    } else if (sortMode === "stars") {
      const diff = getStars(b) - getStars(a);
      if (diff !== 0) return diff;
    }

    // Fix 2: Always order alphabetically by distributor brand (A -> Z, numeric-aware)
    const brandA = getPrimarySortBrand(a);
    const brandB = getPrimarySortBrand(b);
    const brandCmp = brandA.localeCompare(brandB, "es", {
      sensitivity: "base",
      numeric: true,
    });
    if (brandCmp !== 0) return brandCmp;

    // Within the same brand: prioritize higher search relevance score if searching
    if (scoreMap && scoreMap.size > 0) {
      const scoreDiff = (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0);
      if (scoreDiff !== 0) return scoreDiff;
    }

    // Deterministic title tie-breaker
    return getTitle(a).localeCompare(getTitle(b), "es", {
      sensitivity: "base",
      numeric: true,
    });
  });

  return copy;
}

/**
 * Helper to match a phrase or token against known vehicle brands, model categories (lineups),
 * and specific vehicle models from the live database catalog.
 */
interface VehicleMatchEntry {
  vehicleBrand: string;
  vehicleBrandTitle: string;
  modelCategory?: string;
  vehicleModel?: string;
  displayLabel: string;
  aliases: string[];
  specificity: number; // higher = prefer over shorter/broader match
}

function buildVehicleMatchIndex(context: SmartSearchCatalogContext): VehicleMatchEntry[] {
  const entries: VehicleMatchEntry[] = [];
  const vehicleBrands = context.vehicleBrands || [];
  const sxsBrandModels = context.sxsBrandModels || {};

  const brandTitleMap = new Map<string, string>();
  for (const vb of vehicleBrands) {
    brandTitleMap.set(vb.slug.toLowerCase(), vb.title);
  }
  const allBrandSlugs = new Set<string>([
    ...vehicleBrands.map((b) => b.slug.toLowerCase()),
    ...Object.keys(sxsBrandModels).map((k) => k.toLowerCase()),
  ]);

  // 1. Vehicle Brands themselves (e.g. cfmoto, can-am, polaris, kawasaki, honda, yamaha, segway)
  for (const bSlug of Array.from(allBrandSlugs)) {
    const title = brandTitleMap.get(bSlug) || bSlug.toUpperCase();
    const aliases = new Set<string>([
      normalizeSearchTerm(bSlug),
      normalizeSearchTerm(title),
      normalizeSearchTerm(bSlug).replace(/[^a-z0-9]/g, ""),
      normalizeSearchTerm(title).replace(/[^a-z0-9]/g, ""),
    ]);
    if (bSlug === "can-am") {
      aliases.add("can am");
      aliases.add("canam");
      aliases.add("can-am");
    }
    if (bSlug === "cfmoto") {
      aliases.add("cf moto");
      aliases.add("cfmoto");
    }
    entries.push({
      vehicleBrand: bSlug,
      vehicleBrandTitle: title,
      displayLabel: title,
      aliases: Array.from(aliases).filter((a) => a.length >= 2),
      specificity: 10,
    });

    const models = sxsBrandModels[bSlug] || [];

    // 2. Model Categories / Lineups (e.g. "Maverick X3", "ZForce Z10", "Maverick R", "RZR Pro R")
    const seenCategories = new Set<string>();
    for (const m of models) {
      const rawCat = (m.modelCategory && m.modelCategory.trim()) || (m.category && m.category.trim()) || "";
      if (!rawCat || seenCategories.has(rawCat.toLowerCase())) continue;
      seenCategories.add(rawCat.toLowerCase());

      const catNorm = normalizeSearchTerm(rawCat);
      const catClean = catNorm.replace(/\([^)]*\)/g, "").trim();
      const aliases = new Set<string>([catNorm, catClean]);

      // Add natural shorthand aliases for popular lineups
      if (catClean.includes("maverick x3") || catClean === "x3") {
        aliases.add("x3");
        aliases.add("maverick x3");
        aliases.add("maverick-x3");
        aliases.add("can-am x3");
        aliases.add("can am x3");
        aliases.add("canam x3");
      }
      if (catClean.includes("maverick r") && !catClean.includes("x3")) {
        aliases.add("maverick r");
        aliases.add("maverick-r");
        aliases.add("mav r");
        aliases.add("mav-r");
      }
      if (catClean.includes("zforce z10") || catClean === "z10") {
        aliases.add("z10");
        aliases.add("zforce z10");
        aliases.add("zforce-z10");
        aliases.add("cfmoto z10");
      }
      if (catClean.includes("zforce 950")) {
        aliases.add("z950");
        aliases.add("zforce 950");
        aliases.add("950");
      }
      if (catClean.includes("zforce 1000")) {
        aliases.add("z1000");
        aliases.add("zforce 1000");
      }
      if (catClean.includes("zforce 800")) {
        aliases.add("z800");
        aliases.add("zforce 800");
      }
      if (catClean.includes("krx")) {
        aliases.add("krx");
        aliases.add("krx 1000");
        aliases.add("krx-1000");
        aliases.add("teryx krx");
      }
      if (catClean.includes("pro r")) {
        aliases.add("pro r");
        aliases.add("pro-r");
        aliases.add("rzr pro r");
      }
      if (catClean.includes("turbo r")) {
        aliases.add("turbo r");
        aliases.add("turbo-r");
        aliases.add("rzr turbo r");
      }
      if (catClean.includes("pro xp")) {
        aliases.add("pro xp");
        aliases.add("pro-xp");
        aliases.add("rzr pro xp");
      }
      if (catClean.includes("xp 1000")) {
        aliases.add("xp 1000");
        aliases.add("rzr 1000");
        aliases.add("rzr xp 1000");
      }
      if (catClean.includes("defender")) aliases.add("defender");
      if (catClean.includes("commander")) aliases.add("commander");
      if (catClean.includes("talon")) aliases.add("talon");
      if (catClean.includes("pioneer")) aliases.add("pioneer");
      if (catClean.includes("yxz")) aliases.add("yxz");
      if (catClean.includes("rmax")) aliases.add("rmax");
      if (catClean.includes("wolverine")) aliases.add("wolverine");
      if (catClean.includes("villain")) aliases.add("villain");
      if (catClean.includes("fugleman")) aliases.add("fugleman");
      if (catClean.includes("cforce")) aliases.add("cforce");
      if (catClean.includes("uforce")) aliases.add("uforce");
      if (catClean.includes("outlander")) aliases.add("outlander");
      if (catClean.includes("renegade")) aliases.add("renegade");
      if (catClean.includes("ranger")) aliases.add("ranger");
      if (catClean.includes("general")) aliases.add("general");

      // Also include "<brand> <catClean>" conjunctions
      aliases.add(`${normalizeSearchTerm(title)} ${catClean}`);
      aliases.add(`${bSlug} ${catClean}`);

      entries.push({
        vehicleBrand: bSlug,
        vehicleBrandTitle: title,
        modelCategory: rawCat,
        displayLabel: `${title} • ${rawCat}`,
        aliases: Array.from(aliases).filter((a) => a.length >= 2),
        specificity: 25,
      });
    }

    // 3. Specific Models (e.g. "ZForce Z10-4", "ZForce Z10", "Maverick X3 X RS", "Maverick R MAX")
    for (const m of models) {
      const modName = normalizeSearchTerm(m.name);
      const modSlug = normalizeSearchTerm(m.slug);
      const modCode = m.code ? normalizeSearchTerm(m.code) : "";
      const modCat = (m.modelCategory && m.modelCategory.trim()) || (m.category && m.category.trim()) || undefined;
      const aliases = new Set<string>([modName, modSlug, modSlug.replace(/-/g, " ")]);
      if (modCode && modCode.length >= 2) aliases.add(modCode);

      // Strip brand prefix from model name as alias (e.g. "CFMOTO ZForce Z10-4" -> "zforce z10-4", "z10-4")
      const withoutBrand = modName
        .replace(new RegExp(`^(${normalizeSearchTerm(title)}|${bSlug}|can\\s*am|cf\\s*moto)\\s+`, "i"), "")
        .trim();
      if (withoutBrand && withoutBrand.length >= 2) {
        aliases.add(withoutBrand);
      }

      if (modSlug.includes("z10-4") || modName.includes("z10-4")) {
        aliases.add("z10-4");
        aliases.add("z10 4");
        aliases.add("zforce z10-4");
        aliases.add("cfmoto z10-4");
      } else if (modSlug === "zforce-z10" || modSlug === "z10" || modName.endsWith("z10")) {
        // Only bind generic "z10" to specific model if no ZForce Z10 modelCategory exists
        if (!seenCategories.has("zforce z10") && !seenCategories.has("z10")) {
          aliases.add("z10");
          aliases.add("cfmoto z10");
        }
      }

      if (modSlug.includes("maverick-r-max") || (modName.includes("maverick r") && modName.includes("max"))) {
        aliases.add("maverick r max");
        aliases.add("maverick-r-max");
        aliases.add("mav r max");
      }
      if (modSlug.includes("krx4") || modName.includes("krx4")) {
        aliases.add("krx4");
        aliases.add("krx4 1000");
      }

      entries.push({
        vehicleBrand: bSlug,
        vehicleBrandTitle: title,
        modelCategory: modCat,
        vehicleModel: m.slug,
        displayLabel: `${title} • ${m.name}`,
        aliases: Array.from(aliases).filter((a) => a.length >= 2),
        specificity: modSlug.includes("z10-4") || modName.includes("max") || modSlug.includes("krx4") ? 35 : 20,
      });
    }
  }

  return entries;
}

interface BrandMatchEntry {
  brandName: string;
  aliases: string[];
}

function buildDistributorBrandMatchIndex(context: SmartSearchCatalogContext): BrandMatchEntry[] {
  const entries: BrandMatchEntry[] = [];
  const dealerRefs = context.dealerBrandRefs || buildDealerBrandSearchRefs();

  for (const db of context.distributorBrands || []) {
    const rawName = (db.name || "").trim();
    if (!rawName) continue;
    const normName = normalizeSearchTerm(rawName);
    const aliases = new Set<string>([normName, normName.replace(/[^a-z0-9]/g, "")]);

    const stripped = normName
      .replace(/\s+(powersports|exhaust|performance|motorsports|motorsport|designs|racing|offroad|off-road|utv)\b/g, "")
      .trim();
    if (stripped && stripped.length >= 2) {
      aliases.add(stripped);
      aliases.add(stripped.replace(/[^a-z0-9]/g, ""));
    }

    if (db.code) {
      const c = normalizeSearchTerm(db.code);
      if (c.length >= 2) aliases.add(c);
    }
    if (db.slug) {
      const s = normalizeSearchTerm(db.slug);
      if (s.length >= 2) aliases.add(s);
    }

    // Match against default dealer brand codes & aliases (e.g. DRT -> DRT Motorsports, EVP -> Evolution Powersports, BMP -> Bikeman Performance)
    const defaultCode = resolveDefaultDealerBrandCode(rawName);
    if (defaultCode && defaultCode.length >= 2) {
      aliases.add(defaultCode.toLowerCase());
    }
    for (const ref of dealerRefs) {
      const refNorm = normalizeSearchTerm(ref.name);
      const refCode = (ref.code || "").toLowerCase();
      const matchesRef =
        refNorm === normName ||
        refNorm.includes(normName) ||
        normName.includes(refNorm) ||
        (refCode && defaultCode && refCode === defaultCode.toLowerCase()) ||
        (ref.aliases || []).some((a) => a === normName || a === stripped);
      if (matchesRef) {
        if (refCode && refCode.length >= 2) aliases.add(refCode);
        for (const a of ref.aliases || []) {
          if (a.length >= 2) aliases.add(a);
        }
      }
    }

    // Special common shorthands
    if (normName.includes("3 star")) {
      aliases.add("3 star");
      aliases.add("3star");
      aliases.add("3 star utv");
    }
    if (normName.includes("shock therapy")) {
      aliases.add("shock therapy");
      aliases.add("shocktherapy");
    }
    if (normName.includes("agency power")) {
      aliases.add("agency power");
      aliases.add("agency");
    }
    if (normName.includes("trinity")) {
      aliases.add("trinity");
      aliases.add("trinity racing");
    }
    if (normName.includes("gboost")) {
      aliases.add("gboost");
      aliases.add("g-boost");
    }
    if (normName.includes("assault")) {
      aliases.add("assault");
      aliases.add("assault industries");
    }
    if (normName.includes("superatv")) {
      aliases.add("superatv");
      aliases.add("super atv");
    }
    if (normName.includes("tusk")) {
      aliases.add("tusk");
    }

    entries.push({
      brandName: rawName,
      aliases: Array.from(aliases).filter((a) => a.length >= 2),
    });
  }

  return entries;
}

interface CategoryMatchEntry {
  categoryKey: string;
  labelEs: string;
  labelEn: string;
  aliases: string[];
}

function buildCategoryMatchIndex(context: SmartSearchCatalogContext): CategoryMatchEntry[] {
  const entries: CategoryMatchEntry[] = [];
  const seen = new Set<string>();

  for (const cat of context.categories || []) {
    if (!cat || seen.has(cat.toLowerCase())) continue;
    seen.add(cat.toLowerCase());

    const normKey = normalizeSearchTerm(cat);
    const labelEs = getCategoryLabel(cat, "es");
    const labelEn = getCategoryLabel(cat, "en");
    const normEs = normalizeSearchTerm(labelEs);
    const normEn = normalizeSearchTerm(labelEn);

    const aliases = new Set<string>([normKey, normKey.replace(/[-_]+/g, " "), normEs, normEn]);

    // Add each word from the category label + its singular/plural + bilingual synonyms
    const baseWords = [normKey, normKey.replace(/[-_]+/g, " "), normEs, normEn]
      .flatMap((s) => s.split(/[\s&/,-]+/))
      .filter((w) => w.length >= 3 && !TECHNICAL_UNITS_AND_STOPWORDS.has(w));

    for (const w of baseWords) {
      for (const variant of getStemVariants(w)) {
        aliases.add(variant);
      }
      // Also map direct synonyms for well-known single-topic categories
      const syns = SYNONYM_LOOKUP.get(w);
      if (syns) {
        for (const syn of syns) {
          if (syn.length >= 4 || syn === "led" || syn === "luz") {
            aliases.add(syn);
          }
        }
      }
    }

    entries.push({
      categoryKey: cat,
      labelEs,
      labelEn,
      aliases: Array.from(aliases).filter((a) => a.length >= 3),
    });
  }

  return entries;
}

/**
 * Checks whether a phrase appears on word boundaries inside a normalized query string,
 * and returns the remaining query with that phrase removed if matched.
 */
function consumePhraseFromQuery(
  queryStr: string,
  phrase: string
): { matched: boolean; rest: string } {
  const cleanPhrase = normalizeSearchTerm(phrase).trim();
  if (!cleanPhrase) return { matched: false, rest: queryStr };
  const escaped = cleanPhrase.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&").replace(/\s+/g, "\\s+");
  const regex = new RegExp(`(^|[\\s,/]+)${escaped}(?=$|[\\s,/]+)`, "i");
  if (!regex.test(queryStr)) return { matched: false, rest: queryStr };
  const rest = queryStr.replace(regex, " ").replace(/\s+/g, " ").trim();
  return { matched: true, rest };
}

/**
 * Patch 2.0 Smart Search Intent Parser (Fix 3):
 * Extracts Distributor Brand, Vehicle Brand, Vehicle Lineup/Model, and Category filters
 * from natural user queries like:
 * - "DRT" -> distributorBrand: "DRT Motorsports"
 * - "cfmoto" -> vehicleBrand: "cfmoto"
 * - "x3" -> vehicleBrand: "can-am", modelCategory: "Maverick X3"
 * - "cfmoto z10" or "z10" -> vehicleBrand: "cfmoto", modelCategory: "ZForce Z10" (or vehicleModel)
 * - "drt z10" -> distributorBrand: "DRT Motorsports", vehicleBrand: "cfmoto", Z10
 * - "escapes x3" -> category: "exhaust", vehicleBrand: "can-am", Maverick X3
 */
export function parseSmartSearchQuery(
  rawQuery: string,
  context: SmartSearchCatalogContext,
  lang: "es" | "en" = "es"
): SmartSearchIntentResult {
  const normRaw = normalizeSearchTerm(rawQuery || "").replace(/\s+/g, " ").trim();
  if (!normRaw) {
    return { remainingQuery: "", matchedLabels: [], hasDetectedFilters: false };
  }

  let working = normRaw;
  let distributorBrand: string | undefined;
  let vehicleBrand: string | undefined;
  let modelCategory: string | undefined;
  let vehicleModel: string | undefined;
  let category: string | undefined;
  const matchedLabels: Array<{ kind: "brand" | "vehicle" | "category"; label: string }> = [];

  // 1. Match Distributor / Parts Brand (longest alias first so "DRT Motorsports" beats "DRT")
  const brandIndex = buildDistributorBrandMatchIndex(context);
  const brandCandidates: Array<{ brandName: string; alias: string }> = [];
  for (const b of brandIndex) {
    for (const a of b.aliases) {
      brandCandidates.push({ brandName: b.brandName, alias: a });
    }
  }
  brandCandidates.sort((a, b) => b.alias.length - a.alias.length);

  for (const cand of brandCandidates) {
    // Avoid matching "rpm" when preceded by a number like "8000 rpm"
    if (cand.alias === "rpm" && /\d+\s*rpm\b/i.test(working)) continue;
    const res = consumePhraseFromQuery(working, cand.alias);
    if (res.matched) {
      distributorBrand = cand.brandName;
      working = res.rest;
      matchedLabels.push({ kind: "brand", label: cand.brandName });
      break;
    }
  }

  // 2. Match Vehicle Brand + Lineup/Model (prefer higher specificity + longer aliases)
  const vehicleIndex = buildVehicleMatchIndex(context);
  const vehicleCandidates: Array<{ entry: VehicleMatchEntry; alias: string }> = [];
  for (const entry of vehicleIndex) {
    for (const alias of entry.aliases) {
      vehicleCandidates.push({ entry, alias });
    }
  }
  vehicleCandidates.sort((a, b) => {
    if (b.alias.length !== a.alias.length) return b.alias.length - a.alias.length;
    return b.entry.specificity - a.entry.specificity;
  });

  // First pass: check for specific model or lineup/modelCategory match (e.g. "cfmoto z10", "z10", "x3", "z10-4", "maverick r")
  for (const cand of vehicleCandidates) {
    if (!cand.entry.modelCategory && !cand.entry.vehicleModel) continue;
    const res = consumePhraseFromQuery(working, cand.alias);
    if (res.matched) {
      vehicleBrand = cand.entry.vehicleBrand;
      if (cand.entry.modelCategory) modelCategory = cand.entry.modelCategory;
      if (cand.entry.vehicleModel) vehicleModel = cand.entry.vehicleModel;
      working = res.rest;
      // Also strip redundant vehicle brand word if user typed e.g. "cfmoto z10" and only "z10" was consumed
      const vbEntry = vehicleIndex.find(
        (e) => e.vehicleBrand === cand.entry.vehicleBrand && !e.modelCategory && !e.vehicleModel
      );
      if (vbEntry && working) {
        for (const vbAlias of [...vbEntry.aliases].sort((a, b) => b.length - a.length)) {
          const stripRes = consumePhraseFromQuery(working, vbAlias);
          if (stripRes.matched) {
            working = stripRes.rest;
            break;
          }
        }
      }
      matchedLabels.push({ kind: "vehicle", label: cand.entry.displayLabel });
      break;
    }
  }

  // Second pass: if no specific model/lineup matched, check Vehicle Brand alone (e.g. "cfmoto", "can am", "polaris")
  if (!vehicleBrand) {
    for (const cand of vehicleCandidates) {
      if (cand.entry.modelCategory || cand.entry.vehicleModel) continue;
      const res = consumePhraseFromQuery(working, cand.alias);
      if (res.matched) {
        vehicleBrand = cand.entry.vehicleBrand;
        working = res.rest;
        matchedLabels.push({ kind: "vehicle", label: cand.entry.displayLabel });
        break;
      }
    }
  }

  // 3. Match Category (e.g. "escapes", "exhaust", "suspension", "clutch", "luces", "combos")
  if (working) {
    const catIndex = buildCategoryMatchIndex(context);
    const catCandidates: Array<{ entry: CategoryMatchEntry; alias: string }> = [];
    for (const entry of catIndex) {
      for (const alias of entry.aliases) {
        catCandidates.push({ entry, alias });
      }
    }
    catCandidates.sort((a, b) => b.alias.length - a.alias.length);

    for (const cand of catCandidates) {
      const res = consumePhraseFromQuery(working, cand.alias);
      if (res.matched) {
        category = cand.entry.categoryKey;
        working = res.rest;
        matchedLabels.push({
          kind: "category",
          label: lang === "es" ? cand.entry.labelEs : cand.entry.labelEn,
        });
        break;
      }
    }
  }

  // Clean leftover connector stopwords if filters were already extracted (e.g. "escape para z10" -> remaining "")
  let remainingQuery = working.trim();
  if (matchedLabels.length > 0 && remainingQuery) {
    const leftoverTokens = remainingQuery
      .split(/\s+/)
      .filter((tok) => tok && !["para", "for", "de", "del", "con", "with", "la", "el", "los", "las", "y", "and"].includes(tok));
    remainingQuery = leftoverTokens.join(" ").trim();
  }

  return {
    distributorBrand,
    vehicleBrand,
    modelCategory,
    vehicleModel,
    category,
    remainingQuery,
    matchedLabels,
    hasDetectedFilters: matchedLabels.length > 0,
  };
}

/**
 * Generates instant clickable smart suggestion pills while the user types in the search bar.
 */
export function buildSmartSearchSuggestions(
  rawQuery: string,
  context: SmartSearchCatalogContext,
  lang: "es" | "en" = "es"
): SmartSearchSuggestion[] {
  const norm = normalizeSearchTerm(rawQuery || "").replace(/\s+/g, " ").trim();
  if (!norm || norm.length < 2) return [];

  const suggestions: SmartSearchSuggestion[] = [];
  const seenKeys = new Set<string>();
  const pushUnique = (s: SmartSearchSuggestion) => {
    if (seenKeys.has(s.id)) return;
    seenKeys.add(s.id);
    suggestions.push(s);
  };

  // 1. Top combined smart intent if query already resolves to one or more filters
  const parsed = parseSmartSearchQuery(rawQuery, context, lang);
  if (parsed.hasDetectedFilters && parsed.matchedLabels.length >= 2) {
    const labelParts = parsed.matchedLabels.map((m) => m.label);
    if (parsed.remainingQuery) labelParts.push(`"${parsed.remainingQuery}"`);
    pushUnique({
      id: `combined:${parsed.distributorBrand || ""}:${parsed.vehicleBrand || ""}:${parsed.modelCategory || ""}:${parsed.vehicleModel || ""}:${parsed.category || ""}:${parsed.remainingQuery}`,
      kind: "combined",
      label: labelParts.join(" + "),
      sublabel: lang === "es" ? "Filtro inteligente combinado" : "Smart combined filter",
      apply: {
        distributorBrand: parsed.distributorBrand,
        vehicleBrand: parsed.vehicleBrand,
        modelCategory: parsed.modelCategory,
        vehicleModel: parsed.vehicleModel,
        category: parsed.category,
        remainingQuery: parsed.remainingQuery,
      },
    });
  }

  // 2. Prefix / partial matches for Distributor Brands
  const brandIndex = buildDistributorBrandMatchIndex(context);
  for (const b of brandIndex) {
    const exactOrPrefix = b.aliases.some((a) => a === norm || a.startsWith(norm) || (norm.length >= 3 && a.includes(norm)));
    if (exactOrPrefix) {
      pushUnique({
        id: `brand:${b.brandName.toLowerCase()}`,
        kind: "brand",
        label: b.brandName,
        sublabel: lang === "es" ? "Marca / Fabricante" : "Brand / Manufacturer",
        apply: { distributorBrand: b.brandName, remainingQuery: "" },
      });
    }
    if (suggestions.length >= 4) break;
  }

  // 3. Prefix / partial matches for Vehicle Brands, Lineups & Specific Models
  const vehicleIndex = buildVehicleMatchIndex(context);
  const scoredVehicles: Array<{ entry: VehicleMatchEntry; score: number }> = [];
  for (const v of vehicleIndex) {
    let score = 0;
    for (const a of v.aliases) {
      if (a === norm) score = Math.max(score, 100 + v.specificity);
      else if (a.startsWith(norm)) score = Math.max(score, 70 + v.specificity);
      else if (norm.length >= 2 && a.includes(norm)) score = Math.max(score, 40 + v.specificity);
    }
    if (score > 0) scoredVehicles.push({ entry: v, score });
  }
  scoredVehicles.sort((a, b) => b.score - a.score);
  for (const sv of scoredVehicles.slice(0, 4)) {
    pushUnique({
      id: `vehicle:${sv.entry.vehicleBrand}:${sv.entry.modelCategory || ""}:${sv.entry.vehicleModel || ""}`,
      kind: "vehicle",
      label: sv.entry.displayLabel,
      sublabel: sv.entry.modelCategory || sv.entry.vehicleModel
        ? (lang === "es" ? "Compatibilidad de Vehículo" : "Vehicle Compatibility")
        : (lang === "es" ? "Marca de Vehículo SXS" : "SXS Vehicle Brand"),
      apply: {
        vehicleBrand: sv.entry.vehicleBrand,
        modelCategory: sv.entry.modelCategory,
        vehicleModel: sv.entry.vehicleModel,
        remainingQuery: "",
      },
    });
  }

  // 4. Prefix / partial matches for Categories (ES & EN)
  const catIndex = buildCategoryMatchIndex(context);
  for (const c of catIndex) {
    const matchesCat = c.aliases.some((a) => a === norm || a.startsWith(norm) || (norm.length >= 3 && a.includes(norm)));
    if (matchesCat) {
      pushUnique({
        id: `cat:${c.categoryKey.toLowerCase()}`,
        kind: "category",
        label: lang === "es" ? c.labelEs : c.labelEn,
        sublabel: lang === "es" ? "Categoría" : "Category",
        apply: { category: c.categoryKey, remainingQuery: "" },
      });
    }
  }

  return suggestions.slice(0, 6);
}

/**
 * Evaluates whether a product matches a search query and calculates its relevance score.
 * Patch 2.0 Upgrades:
 * - Multi-word vehicle brand & platform awareness ("cfmoto z10", "can am x3", "maverick r", etc.)
 * - Bilingual Spanish <-> English category & part synonym matching + singular/plural stemming
 * - Dealer brand code/alias matching ("DRT" -> DRT Motorsports, "EVP" -> Evolution Powersports, etc.)
 * - Prevents cross-brand description pollution (e.g. searching 'rpm' will NEVER return GGB products)
 * - Compact alphanumeric SKU matching
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

  const rawNorm = normalizeSearchTerm(query).trim();
  const qClean = preprocessMultiWordPhrases(rawNorm);
  const searchTerms = qClean
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => Boolean(t) && !["para", "for", "de", "del", "con", "with", "la", "el", "los", "las"].includes(t));

  if (searchTerms.length === 0) {
    return { matches: true, score: 0 };
  }

  const isUniversal = isUniversalFit(product.comp);

  // Pre-check: If full search query targets a specific vehicle platform (e.g. "z10", "z1000", "maverick-r", "x3")
  const searchPlat = detectVehiclePlatform(rawNorm);
  if (searchPlat && !isUniversal) {
    const compsArr: string[] = Array.isArray(product.comp) ? product.comp : [];
    const mycArr: any[] = Array.isArray(product.modelYearCompatibility) ? product.modelYearCompatibility : [];
    if (compsArr.length > 0 || mycArr.length > 0) {
      const matchesPlat =
        compsArr.some((c: string) => isPlatformOrVehicleMatch(c, rawNorm)) ||
        mycArr.some((m: any) => isPlatformOrVehicleMatch(m?.model || "", rawNorm));
      if (!matchesPlat) return { matches: false, score: 0 };
    }
  }

  const dealerBrandRefs = options?.dealerBrands || buildDealerBrandSearchRefs();

  // Primary fields extraction (including bilingual category labels & vehicle compatibility!)
  const pId = normalizeSearchTerm(product.id || "");
  const pSku = normalizeSearchTerm(product.sku || "");
  const pSlug = normalizeSearchTerm(product.slug || "");
  const pSkuCompact = pSku.replace(/[^a-z0-9]/g, "");
  const pTitle = normalizeSearchTerm(
    `${product.p_title || ""} ${product.nameEs || ""} ${product.nameEn || ""}`
  );
  const pReqs = normalizeSearchTerm(product.requirements || "");

  const rawCats: string[] = Array.isArray(product.category)
    ? product.category.map((c: any) => String(c || ""))
    : typeof product.category === "string" && product.category
    ? [product.category]
    : product.category?.slug
    ? [product.category.slug]
    : [];

  const pCatsExpanded: string[] = [];
  for (const c of rawCats) {
    if (!c) continue;
    const normC = normalizeSearchTerm(c);
    pCatsExpanded.push(normC, normC.replace(/[-_]+/g, " "));
    const esLbl = normalizeSearchTerm(getCategoryLabel(c, "es"));
    const enLbl = normalizeSearchTerm(getCategoryLabel(c, "en"));
    if (esLbl) pCatsExpanded.push(esLbl);
    if (enLbl) pCatsExpanded.push(enLbl);
  }

  const pBrands: string[] = (
    Array.isArray(product.brand) && product.brand.length > 0
      ? product.brand
      : product.brandName
      ? [product.brandName]
      : []
  ).map((b: any) => normalizeSearchTerm(String(b)));

  const pComps: string[] = (Array.isArray(product.comp) ? product.comp : []).map((c: any) =>
    normalizeSearchTerm(String(c))
  );
  const pMycModels: string[] = (
    Array.isArray(product.modelYearCompatibility) ? product.modelYearCompatibility : []
  ).map((m: any) => normalizeSearchTerm(`${m?.make || ""} ${m?.model || ""}`));

  const productVehicleBrands = detectProductVehicleBrands(product).map((vb) => normalizeSearchTerm(vb));

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

  const dealerAliasesText = productDealerBrand
    ? [productDealerBrand.code?.toLowerCase() || "", ...(productDealerBrand.aliases || [])].join(" ")
    : "";

  const primarySearchableText = [
    pId,
    pSku,
    pSlug,
    pTitle,
    pReqs,
    ...pCatsExpanded,
    ...pBrands,
    dealerAliasesText,
    ...pComps,
    ...pMycModels,
    ...productVehicleBrands,
  ].join(" ");

  const descRaw =
    extractDescriptionText(product.description || product.descriptionJson || "") +
    " " +
    (product.descriptionEs || "") +
    " " +
    (product.descriptionEn || "");
  const descText = normalizeSearchTerm(descRaw);

  const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

  for (const term of searchTerms) {
    const termSpace = term.replace(/-/g, " ");
    const termCompact = term.replace(/[^a-z0-9]/g, "");

    // 1. Vehicle Brand check on individual term (e.g. "polaris", "can-am", "cfmoto")
    let matchedAsVehicleBrand = false;
    for (const [brandSlug] of Object.entries(SXS_BRAND_PLATFORMS)) {
      const slugNorm = normalizeSearchTerm(brandSlug);
      const isVehicleBrandTerm =
        term === slugNorm ||
        termCompact === slugNorm.replace(/[^a-z0-9]/g, "");
      if (isVehicleBrandTerm) {
        if (!isUniversal && !productVehicleBrands.includes(slugNorm)) {
          return { matches: false, score: 0 };
        }
        matchedAsVehicleBrand = true;
        break;
      }
    }
    if (matchedAsVehicleBrand) {
      continue;
    }

    // 2. Vehicle Platform / Family check (e.g. "z10", "x3", "maverick-r", "pro-r", "krx")
    const termPlat = detectVehiclePlatform(termSpace) || detectVehiclePlatform(term);
    const termFam = getVehicleFamily(termSpace) || getVehicleFamily(term);
    if (termPlat || termFam) {
      if (isUniversal) {
        continue;
      }
      const matchesVehicle =
        pComps.some((c) => isPlatformOrVehicleMatch(c, termSpace) || isPlatformOrVehicleMatch(c, term)) ||
        pMycModels.some((m) => isPlatformOrVehicleMatch(m, termSpace) || isPlatformOrVehicleMatch(m, term)) ||
        (termFam
          ? pComps.some((c) => getVehicleFamily(c) === termFam) ||
            pMycModels.some((m) => getVehicleFamily(m) === termFam)
          : false);
      if (matchesVehicle) {
        continue;
      }
      if (pComps.length > 0 || pMycModels.length > 0) {
        return { matches: false, score: 0 };
      }
    }

    // 3. Direct Dealer Brand match (e.g. "drt", "evp", "bmp", "rpm", "ggb")
    const matchedDealerBrand = dealerBrandRefs.find((dRef) => {
      const codeLower = (dRef.code || "").toLowerCase();
      return (
        (codeLower && codeLower === term) ||
        dRef.aliases?.some((alias) => alias === term || alias === termSpace || (term.length >= 3 && alias.startsWith(term)))
      );
    });

    if (matchedDealerBrand && productDealerBrand && productDealerBrand.code === matchedDealerBrand.code) {
      continue;
    }

    // 4. Primary fields check (exact token + compact SKU + stem & bilingual synonym expansion)
    let inPrimary = false;
    if (term.length === 1) {
      inPrimary = new RegExp(`(^|[\\s\\-_/])${escapeRegex(term)}($|[\\s\\-_/])`, "i").test(primarySearchableText);
    } else {
      const termVariants = expandSearchTermVariants(term);
      if (termSpace !== term) termVariants.push(termSpace);
      inPrimary =
        termVariants.some((v) => v.length >= 2 && primarySearchableText.includes(v)) ||
        (termCompact.length >= 4 && pSkuCompact.includes(termCompact)) ||
        pComps.some((c: string) => isPlatformOrVehicleMatch(c, termSpace));
    }

    if (inPrimary) {
      continue;
    }

    // 5. Dealer brand conflict guard: never let another brand's product match via description text
    if (matchedDealerBrand) {
      if (!productDealerBrand || productDealerBrand.code !== matchedDealerBrand.code) {
        return { matches: false, score: 0 };
      }
    }

    // 6. Technical units and stopwords rejection in description
    if (TECHNICAL_UNITS_AND_STOPWORDS.has(term)) {
      return { matches: false, score: 0 };
    }

    // 7. Secondary fallback: check description text using whole-word regex across stem + bilingual synonyms
    const descVariants = expandSearchTermVariants(term);
    const inDesc = descVariants.some((v) => {
      if (v.length < 2 || TECHNICAL_UNITS_AND_STOPWORDS.has(v)) return false;
      const wordRegex = new RegExp(`(^|[^a-z0-9])${escapeRegex(v)}([^a-z0-9]|$)`, "i");
      return wordRegex.test(descText);
    });
    if (!inDesc) {
      return { matches: false, score: 0 };
    }
  }

  // Calculate search relevance score
  let score = 0;
  if (pSku === rawNorm || (rawNorm.length >= 4 && pSkuCompact === rawNorm.replace(/[^a-z0-9]/g, ""))) score += 1000;
  else if (pSku.startsWith(rawNorm)) score += 500;
  else if (pSku.includes(rawNorm)) score += 200;

  if (pBrands.some((b: string) => b === rawNorm || b.startsWith(rawNorm))) score += 400;
  else if (pBrands.some((b: string) => b.includes(rawNorm))) score += 150;

  if (pTitle.includes(rawNorm)) score += 300;
  else if (searchTerms.every((t) => pTitle.includes(t) || pTitle.includes(t.replace(/-/g, " ")))) score += 200;

  if (pCatsExpanded.some((c: string) => c.includes(rawNorm))) score += 120;
  if (pComps.some((c: string) => c.includes(rawNorm))) score += 80;

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

  const rawNorm = normalizeSearchTerm(query).trim();
  const qClean = preprocessMultiWordPhrases(rawNorm);
  const searchTerms = qClean
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => Boolean(t) && !["para", "for", "de", "del", "con", "with", "la", "el", "los", "las"].includes(t));
  if (searchTerms.length === 0) {
    return { matches: true, score: 0 };
  }

  const dealerBrandRefs = options?.dealerBrands || buildDealerBrandSearchRefs();

  const cId = normalizeSearchTerm(combo.id || "");
  const cSlug = normalizeSearchTerm(combo.slug || "");
  const cTitle = normalizeSearchTerm(`${combo.titleEs || ""} ${combo.titleEn || ""}`);
  const cBadge = normalizeSearchTerm(`${combo.badgeEs || ""} ${combo.badgeEn || ""}`);
  const cItems = normalizeSearchTerm(
    Array.isArray(combo.items) ? combo.items.join(" ") : (combo.itemsJson || "")
  );
  const cCatRaw = String(combo.category || "");
  const cCatExpanded = cCatRaw
    ? [
        normalizeSearchTerm(cCatRaw),
        normalizeSearchTerm(getCategoryLabel(cCatRaw, "es")),
        normalizeSearchTerm(getCategoryLabel(cCatRaw, "en")),
        "combo",
        "combos",
      ]
    : ["combo", "combos"];
  const cComps: string[] = (Array.isArray(combo.comp) ? combo.comp : []).map((c: any) =>
    normalizeSearchTerm(String(c))
  );
  const cVBrands: string[] = (
    Array.isArray(combo.vehicleBrands) && combo.vehicleBrands.length > 0
      ? combo.vehicleBrands
      : detectProductVehicleBrands({
          p_title: combo.titleEs,
          nameEs: combo.titleEs,
          nameEn: combo.titleEn,
          slug: combo.slug,
          comp: cComps,
        })
  ).map((vb: any) => normalizeSearchTerm(String(vb)));
  const cDBrands: string[] = (Array.isArray(combo.distributorBrands) ? combo.distributorBrands : []).map((db: any) =>
    normalizeSearchTerm(String(db))
  );

  const primarySearchableText = [
    cId,
    cSlug,
    cTitle,
    cBadge,
    cItems,
    ...cCatExpanded,
    ...cComps,
    ...cVBrands,
    ...cDBrands,
  ].join(" ");

  const descText = normalizeSearchTerm(`${combo.descriptionEs || ""} ${combo.descriptionEn || ""}`);
  const isUniversal = isUniversalFit(cComps);

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
    const termSpace = term.replace(/-/g, " ");
    const termCompact = term.replace(/[^a-z0-9]/g, "");

    // 1. Vehicle brand check
    let matchedAsVBrand = false;
    for (const [brandSlug] of Object.entries(SXS_BRAND_PLATFORMS)) {
      const slugNorm = normalizeSearchTerm(brandSlug);
      const isVehicleBrandTerm =
        term === slugNorm || termCompact === slugNorm.replace(/[^a-z0-9]/g, "");
      if (isVehicleBrandTerm) {
        if (!isUniversal && !cVBrands.includes(slugNorm)) {
          return { matches: false, score: 0 };
        }
        matchedAsVBrand = true;
        break;
      }
    }
    if (matchedAsVBrand) continue;

    // 2. Primary check with stem & bilingual synonym expansion
    let inPrimary = false;
    if (term.length === 1) {
      inPrimary = new RegExp(`(^|[\\s\\-_/])${escapeRegex(term)}($|[\\s\\-_/])`, "i").test(primarySearchableText);
    } else {
      const termVariants = expandSearchTermVariants(term);
      if (termSpace !== term) termVariants.push(termSpace);
      inPrimary =
        termVariants.some((v) => v.length >= 2 && primarySearchableText.includes(v)) ||
        cComps.some((c: string) => isPlatformOrVehicleMatch(c, termSpace));
    }

    if (inPrimary) {
      continue;
    }

    // 3. Dealer brand conflict check
    const matchedDealerBrand = dealerBrandRefs.find((dRef) => {
      const codeLower = (dRef.code || "").toLowerCase();
      return (
        (codeLower && codeLower === term) ||
        dRef.aliases?.some((alias) => alias === term || alias === termSpace || (term.length >= 3 && alias.startsWith(term)))
      );
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

    // 5. Description whole-word regex across synonyms
    const descVariants = expandSearchTermVariants(term);
    const inDesc = descVariants.some((v) => {
      if (v.length < 2 || TECHNICAL_UNITS_AND_STOPWORDS.has(v)) return false;
      const wordRegex = new RegExp(`(^|[^a-z0-9])${escapeRegex(v)}([^a-z0-9]|$)`, "i");
      return wordRegex.test(descText);
    });
    if (!inDesc) {
      return { matches: false, score: 0 };
    }
  }

  let score = 0;
  if (cTitle.includes(rawNorm)) score += 300;
  else if (searchTerms.every((t) => cTitle.includes(t) || cTitle.includes(t.replace(/-/g, " ")))) score += 200;

  if (cDBrands.some((b: string) => b === rawNorm || b.startsWith(rawNorm))) score += 400;
  else if (cDBrands.some((b: string) => b.includes(rawNorm))) score += 150;

  if (cVBrands.some((vb: string) => vb.includes(rawNorm))) score += 80;

  return { matches: true, score: Math.max(score, 10) };
}
