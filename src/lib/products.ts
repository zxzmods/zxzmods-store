import rawProductsData from "@/data/products.json";
import { SXS_BRANDS, SXS_BRAND_PLATFORMS, getBrandLogo } from "@/lib/sxsBrands";
import { evaluateProductSearch } from "@/lib/search";

export interface ProductPrice {
  P_price_D: number; // processing-price in dollars
  P_price: number;   // processing-price in colones
  S_price: number;   // shipping price in colones
  I_price: {
    includes: boolean; // if total price includes installation
    I_price: number;   // installation price in colones
  };
  profit: number;    // profit on product in colones
  iva?: {
    rate: number;    // IVA percentage rate (default 13%)
    amount: number;  // calculated IVA amount in CRC included in T_price
  };
  T_price: number;   // total price in colones (with IVA included)
  T_price_D?: number | string; // total price in dollars
}

export interface DescriptionSection {
  title: string;
  content: string;
  bullets?: string[];
}

export type ProductDescription =
  | string
  | DescriptionSection[]
  | { es: DescriptionSection[]; en: DescriptionSection[] };

export interface ModelYearFitment {
  make?: string;
  model: string;
  years: string;
  yearFrom?: number;
  yearTo?: number;
  trim?: string;
  fitmentType?: string;
  notes?: string;
}

export interface ProductItem {
  id: string;
  slug: string;
  sku?: string;
  comp: string[];       // compatibility array: ["z10", "z10-4"] or ["all"]
  category: string[];   // categories array: ["performance", "exhaust"]
  brand: string[];      // brands array: normalized brand names
  price: ProductPrice;
  priceCRC?: number;    // Convenience top-level accessor for price.T_price
  discountPercent?: number; // Optional percentage discount (e.g. 15 for 15% OFF)
  originalPriceCRC?: number; // Original base price before discount
  ivaPercent?: number; // IVA percentage (default 13%)
  ivaCRC?: number; // Calculated IVA amount in CRC included in price
  imgs: string[];       // images array
  imageUrl?: string;    // primary image URL
  vids: string[];       // videos array
  audios: string[];     // audio samples array
  p_title: string;      // product title
  nameEs?: string;      // explicit Spanish name
  nameEn?: string;      // explicit English name
  description: ProductDescription; // structured description
  requirements?: string | null;// requirements reminder
  reviews?: {
    stars: number;
    count?: number;
  } | null;
  homeInstallation?: boolean; // qualifies for home installation
  modelYearCompatibility?: ModelYearFitment[]; // Dedicated model & year compatibility list
  supplierUrl?: string | null;
  supplierPlatform?: string | null;
  supplierStockStatus?: string; // IN_STOCK, PRE_ORDER, LOW_STOCK, OUT_OF_STOCK, UNAVAILABLE
  supplierStockCount?: number | null;
  supplierStockMessageEs?: string | null;
  supplierStockMessageEn?: string | null;
  supplierStockCheckedAt?: string | null;
  supplierLeadDaysMin?: number;
  supplierLeadDaysMax?: number;
  supplierLastPriceUSD?: number | null;
  parameters?: ConfigurableParameter[];
  voidsWarranty?: boolean;
  installationDurationMinutes?: number;
  relatedProductIds?: string[];
  relatedProducts?: ProductItem[];
  suggestedProductIds?: string[];
  suggestedComboIds?: string[];
  suggestedProducts?: ProductItem[];
  suggestedCombos?: any[];
}

export interface ParameterOption {
  id: string;
  labelEs: string;
  labelEn?: string;
  priceDeltaCRC: number; // Price difference in CRC (e.g. 0, 5000, -2000)
  priceDeltaUSD?: number; // Price difference in USD (e.g. 0, 10, 20)
  colorHex?: string;     // Color hex code (e.g. "#EA580C" for orange, "#18181B" for black, "#2563EB" for blue)
  imageUrl?: string;     // Dedicated image URL for this specific option/variant to visualize
  images?: string[];     // Multiple dedicated image URLs for this specific option/variant
  supplierUrl?: string;  // Dedicated supplier URL for this specific variant option (User Requirement 1)
  linkedProductId?: string; // ID, SKU or slug of the linked product for product linking (User Requirement 3)
  isDefault?: boolean;
  isCurrentProduct?: boolean;
}

export interface ComboUniqueProductField {
  id: string;
  nameEs: string;
  nameEn?: string;
  type: "text" | "number" | "select";
  options?: string[];
  required: boolean;
  placeholderEs?: string;
  placeholderEn?: string;
}

export interface ComboUniqueProduct {
  enabled: boolean;
  titleEs: string;
  titleEn?: string;
  badgeEs?: string;
  badgeEn?: string;
  descriptionEs?: string;
  descriptionEn?: string;
  priceCRC?: number;
  imageUrl?: string;
  fields: ComboUniqueProductField[];
}

export const SUSPENSION_ADJUST_UNIQUE_PRODUCT_TEMPLATE: ComboUniqueProduct = {
  enabled: true,
  titleEs: "Ajuste y Valvulado Completo de Suspensión Personalizado",
  titleEn: "Full Custom Suspension Valving & Tuning",
  badgeEs: "SERVICIO EXCLUSIVO DE AJUSTE",
  badgeEn: "EXCLUSIVE TUNING SERVICE",
  descriptionEs: "Calibración técnica de compresión, rebote y precarga de resortes calculada a medida según tu estilo de manejo, peso del piloto y accesorios instalados.",
  descriptionEn: "Technical calibration of compression, rebound and spring preload tailored to your ride style, rider weight and installed accessories.",
  priceCRC: 0,
  imageUrl: "/images/sxs/z10_front.png",
  fields: [
    {
      id: "ride_style",
      nameEs: "Estilo de Manejo / Terreno Principal",
      nameEn: "Riding Style / Main Terrain",
      type: "select",
      options: ["Paseo Familiar / Trail", "Dunas / Arena", "Rocas / Crawling", "Barro / Mud Extremo", "Carreras / Alta Velocidad", "Mixto / All-Around"],
      required: true,
    },
    {
      id: "rider_weight",
      nameEs: "Peso Total (Piloto + Pasajeros)",
      nameEn: "Total Weight (Rider + Passengers)",
      type: "text",
      placeholderEs: "ej: 85 kg piloto + 60 kg copiloto",
      placeholderEn: "e.g.: 185 lbs rider + 140 lbs passenger",
      required: true,
    },
    {
      id: "accessories",
      nameEs: "Accesorios Instalados (Carga Extra)",
      nameEn: "Installed Accessories (Extra Load)",
      type: "text",
      placeholderEs: "ej: Winch 4500lbs, jaula antivuelco, hielera, llanta de repuesto",
      placeholderEn: "e.g.: 4500lbs winch, roll cage, cooler, spare tire",
      required: false,
    },
    {
      id: "feel_notes",
      nameEs: "Sensación Deseada o Notas de Ajuste",
      nameEn: "Desired Feel or Tuning Notes",
      type: "text",
      placeholderEs: "ej: Mayor suavidad en baches pequeños sin fondear en saltos",
      placeholderEn: "e.g.: Plush on small bumps without bottoming out on jumps",
      required: false,
    },
  ],
};

export interface ConfigurableParameter {
  id: string;
  nameEs: string;
  nameEn?: string;
  type?: "color" | "button" | "select" | "product_linking" | "product_link";
  supplierUrl?: string;
  options: ParameterOption[];
}

export interface SelectedParameterItem {
  parameterId: string;
  parameterName: string;
  optionId: string;
  optionLabel: string;
  priceDeltaCRC: number;
  priceDeltaUSD?: number;
  colorHex?: string;
  imageUrl?: string;
  images?: string[];
  supplierUrl?: string;
  linkedProductId?: string;
}

/**
 * Automatically maps common color names in Spanish and English to hex codes
 * when explicit colorHex is not provided.
 */
export function resolveOptionColorHex(label: string, explicitColorHex?: string): string | null {
  if (explicitColorHex && explicitColorHex.trim()) {
    return explicitColorHex.trim();
  }
  if (!label) return null;
  const l = label.toLowerCase();
  if (l.includes("naranj") || l.includes("orang")) return "#EA580C"; // Orange
  if (l.includes("negr") || l.includes("black")) return "#18181B"; // Black
  if (l.includes("azul") || l.includes("blue")) return "#2563EB"; // Blue
  if (l.includes("roj") || l.includes("red")) return "#DC2626"; // Red
  if (l.includes("blanc") || l.includes("white")) return "#F8FAFC"; // White
  if (l.includes("gris") || l.includes("grey") || l.includes("gray") || l.includes("titani") || l.includes("plata") || l.includes("silver")) return "#94A3B8"; // Titanium / Silver
  if (l.includes("amarill") || l.includes("yellow") || l.includes("oro") || l.includes("gold")) return "#EAB308"; // Yellow / Gold
  if (l.includes("verd") || l.includes("green")) return "#16A34A"; // Green
  if (l.includes("morad") || l.includes("purpl")) return "#9333EA"; // Purple
  if (l.includes("rosad") || l.includes("pink")) return "#EC4899"; // Pink
  if (l.includes("bronce") || l.includes("bronze") || l.includes("café") || l.includes("brown")) return "#78350F"; // Bronze
  return null;
}


export function normalizeBrandName(brandName: string): string {
  const lower = brandName.toLowerCase().trim();
  if (lower === "bikeman" || lower === "bikeman performance") {
    return "Bikeman Performance";
  }
  return brandName;
}

export function normalizeBrandList(brands: string[]): string[] {
  const normalized = brands.map(normalizeBrandName);
  return Array.from(new Set(normalized));
}

export function extractDescriptionText(desc: any): string {
  if (!desc) return "";
  if (typeof desc === "string") return desc;
  if (Array.isArray(desc)) {
    return desc
      .map((d) => `${d.title || ""} ${d.content || ""} ${(d.bullets || []).join(" ")}`)
      .join(" ");
  }
  if (typeof desc === "object") {
    return `${extractDescriptionText(desc.es)} ${extractDescriptionText(desc.en)}`;
  }
  return "";
}

/**
 * Strips repetitive leading titles (e.g. "Descripción", "Description", markdown titles)
 * and eliminates duplicate consecutive or repeated paragraph blocks.
 */
export function cleanDescriptionText(raw: any): string {
  if (!raw || typeof raw !== "string") return "";

  let text = raw.trim();

  // 1. Remove leading repeated "Descripción", "Description", "Descripción:", markdown headers, etc.
  const leadingDescRegex = /^(?:(?:\*{1,2}|#{1,6}\s*)?(?:descripci[oó]n|description)\s*[:\-–—]?\s*(?:\*{1,2})?[\r\n\s]*)+/i;
  while (leadingDescRegex.test(text)) {
    const next = text.replace(leadingDescRegex, "").trim();
    if (next === text) break;
    text = next;
  }

  // 2. Normalize newlines
  text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");

  // 3. Deduplicate duplicate paragraphs/blocks
  const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const seenParagraphs = new Set<string>();
  const dedupedParagraphs: string[] = [];

  for (const p of paragraphs) {
    const normKey = p.toLowerCase().replace(/\s+/g, " ");
    if (!seenParagraphs.has(normKey)) {
      seenParagraphs.add(normKey);
      dedupedParagraphs.push(p);
    }
  }

  let result = dedupedParagraphs.join("\n\n").trim();
  result = result.replace(leadingDescRegex, "").trim();
  return result;
}

/**
 * Extracts and cleans a human-editable description string from various input structures:
 * structured DescriptionSection[], language object { es, en }, string, or fallback string.
 * Ensures no duplicate "Descripción" prefix is injected and no duplicate sections exist.
 */
export function extractAndCleanDescription(
  desc: any,
  lang: "es" | "en",
  fallbackStr?: string
): string {
  let rawText = "";

  if (typeof desc === "object" && desc !== null) {
    const sections: any[] | null = Array.isArray(desc)
      ? desc
      : Array.isArray(desc[lang])
      ? desc[lang]
      : Array.isArray(desc.es) && lang === "es"
      ? desc.es
      : Array.isArray(desc.en) && lang === "en"
      ? desc.en
      : null;

    if (sections && Array.isArray(sections)) {
      rawText = sections
        .map((sec) => {
          const title = (sec.title || "").trim();
          const content = (sec.content || "").trim();
          const isGenericTitle = !title || /^(descripci[oó]n|description)$/i.test(title);
          const contentStartsWithTitle = Boolean(title && content.toLowerCase().startsWith(title.toLowerCase()));

          const header = !isGenericTitle && !contentStartsWithTitle ? `${title}\n` : "";
          const bullets = Array.isArray(sec.bullets)
            ? sec.bullets
                .filter((b: string) => b && !content.includes(b))
                .map((b: string) => (b.startsWith("-") ? b : `- ${b}`))
                .join("\n")
            : "";

          return `${header}${content}${bullets ? `\n${bullets}` : ""}`.trim();
        })
        .filter(Boolean)
        .join("\n\n");
    } else if (typeof desc === "string") {
      rawText = desc;
    }
  } else if (typeof desc === "string") {
    rawText = desc;
  }

  if (!rawText.trim() && fallbackStr) {
    rawText = fallbackStr;
  }

  return cleanDescriptionText(rawText);
}

/**
 * Evaluates whether a product's compatibility list represents universal fit (fits all makes and models).
 * This includes "all", "universal", or an explicit universal token.
 */
export function isUniversalFit(comp?: string[] | null): boolean {
  if (!comp || comp.length === 0) return false;
  return comp.some((c) => {
    if (!c) return false;
    const cl = c.toLowerCase().trim();
    return (
      cl === "all" ||
      cl === "all sxs" ||
      cl === "universal" ||
      cl.includes("universal") ||
      cl === "todos" ||
      cl === "todas" ||
      cl === "ajuste directo / universal"
    );
  });
}

/**
 * Evaluates whether a vehicle or compatibility token denotes a 4-seater / MAX / multi-passenger chassis.
 * Covers Can-Am MAX, Polaris 4/Crew, CFMOTO -4, Kawasaki KRX4/Teryx4, Honda Talon-4, etc.
 */
export function is4SeaterToken(token: string): boolean {
  if (!token) return false;
  const t = token.toLowerCase().trim();
  if (t === "all" || t.includes("universal") || t === "todas" || t === "todos") return false;

  // 1. Explicit MAX (Can-Am)
  if (/\bmax\b/i.test(t) || t.includes("-max-") || t.endsWith("-max") || t.startsWith("max-") || t.includes(" max ")) {
    return true;
  }

  // 2. Explicit 4-seater / 4-passenger tokens
  if (
    /\b(4[-_\s]?seater|4[-_\s]?plazas|4[-_\s]?pasajeros|4p)\b/i.test(t) ||
    /\b(crew|xl)\b/i.test(t)
  ) {
    return true;
  }

  // 3. CFMOTO 4-seater models (Z10-4, 950-4, etc.)
  if (
    /\bz10[-_\s]?4\b/i.test(t) ||
    t.includes("z10-4") ||
    t.includes("zforce-z10-4") ||
    /\b950[-_\s]?(sport[-_\s]?)?4\b/i.test(t) ||
    t.includes("sport-4") ||
    t.includes("sport 4")
  ) {
    return true;
  }

  // 4. Polaris 4-seater models (Pro R 4, Pro XP 4, Turbo R 4, RZR 4, XP 4)
  if (
    /\b(pro[-_\s]?r|pro[-_\s]?xp|turbo[-_\s]?r|rzr|xp)[-_\s]?4\b/i.test(t) ||
    t.includes("pro-r-4") ||
    t.includes("pro-xp-4") ||
    t.includes("turbo-r-4")
  ) {
    return true;
  }

  // 5. Kawasaki / Honda 4-seaters (KRX4, Teryx4, Talon-4)
  if (
    /\bkrx[-_\s]?4\b/i.test(t) ||
    /\bteryx[-_\s]?4\b/i.test(t) ||
    /\btalon[-_\s]?(1000[a-z0-9]*)?[-_\s]?4\b/i.test(t)
  ) {
    return true;
  }

  // 6. Generic trailing -4 or " 4" when preceded by model name
  if (/[-_\s]4($|[-_\s])/i.test(t) && !t.includes("4x4") && !t.includes("4wd") && !t.includes("stage-4") && !t.includes("stage 4")) {
    return true;
  }

  return false;
}

/**
 * Evaluates whether a vehicle or compatibility token denotes a 2-seater chassis.
 * Covers 2-seater models belonging to platforms that also have 4-seater variants.
 */
export function is2SeaterToken(token: string): boolean {
  if (!token) return false;
  const t = token.toLowerCase().trim();
  if (t === "all" || t.includes("universal") || t === "todas" || t === "todos") return false;

  // If it's a 4-seater token, it cannot be a 2-seater token
  if (is4SeaterToken(t)) return false;

  // Explicit 2-seater / 2-passenger tokens
  if (/\b(2[-_\s]?seater|2[-_\s]?plazas|2[-_\s]?pasajeros|2p)\b/i.test(t)) {
    return true;
  }

  // Models that belong to platforms that have both 2-seater and 4-seater variants:
  // Can-Am Maverick R (non-MAX): maverick-r, maverick-r-x, maverick-r-x-rs, etc.
  if (/\bmaverick[-_\s]?r\b/i.test(t) || t.includes("maverick-r") || t.includes("maverick r")) {
    return true;
  }

  // Can-Am Maverick X3 (non-MAX): maverick-x3, x3, etc.
  if (
    t === "x3" ||
    t === "can-amx3" ||
    t === "maverick-x3" ||
    t === "maverick x3" ||
    t.startsWith("maverick-x3-") ||
    t.startsWith("x3-") ||
    /\b(can-am\s+)?(maverick[-_\s]?)?x3\b/i.test(t)
  ) {
    return true;
  }

  // CFMOTO Z10 (non-4): zforce-z10, z10, cfmoto z10
  if (
    t === "z10" ||
    t === "zforce-z10" ||
    t === "zforce z10" ||
    t === "cfmoto z10" ||
    /\b(zforce\s+)?z10\b/i.test(t)
  ) {
    return true;
  }

  // CFMOTO Z950 (non-4): zforce-950-sport, z950
  if (
    t === "z950" ||
    t === "zforce-950-sport" ||
    t === "zforce 950" ||
    t === "zforce 950 sport" ||
    /\bz950\b/i.test(t)
  ) {
    return true;
  }

  // Polaris Pro R, Pro XP, Turbo R (non-4):
  if (
    t === "pro-r" || t === "rzr-pro-r" || /\bpro\s*r\b/i.test(t) ||
    t === "pro-xp" || t === "rzr-pro-xp" || /\bpro\s*xp\b/i.test(t) ||
    t === "turbo-r" || t === "rzr-turbo-r" || /\bturbo\s*r\b/i.test(t)
  ) {
    return true;
  }

  // Kawasaki KRX 1000 (non-4):
  if (t === "krx" || t === "krx-1000" || t === "krx 1000" || /\bkrx(\s*1000)?\b/i.test(t)) {
    return true;
  }

  // Honda Talon (non-4):
  if (t === "talon" || t === "talon-1000" || t === "talon 1000" || /\btalon(\s*1000)?\b/i.test(t)) {
    return true;
  }

  return false;
}

/**
 * Detects the canonical vehicle platform family from a vehicle name, code, or compatibility token.
 * Strictly separates CFMOTO Z10 (2026+ Turbo) from ZForce 1000 Sport R (z1000), ZForce 950 (z950), and Can-Am X3.
 * Strictly separates 2-seater and 4-seater (MAX) platforms.
 */
export function detectVehiclePlatform(token: string): string | null {
  const t = token.toLowerCase().trim();
  if (!t || t === "all" || t.includes("universal")) return null;

  // 1. Z1000 / ZForce 1000 Sport R (Check 1000 first so "1000" is never mistaken for "10"!)
  if (
    t === "z1000" ||
    t === "zforce-1000" ||
    t === "zforce 1000" ||
    t === "zforce 1000 sport r" ||
    t.includes("1000 sport r") ||
    t.includes("zforce 1000") ||
    /\bz1000\b/i.test(t)
  ) {
    return "z1000";
  }

  // 2a. Z950-4 / ZForce 950 Sport-4 (4-seater)
  if (
    t === "zforce-950-sport-4" ||
    t === "z950-4" ||
    t === "zforce 950 4" ||
    t.includes("950-4") ||
    t.includes("950 sport-4") ||
    t.includes("950 sport 4")
  ) {
    return "z950-4";
  }

  // 2b. Z950 / ZForce 950 Sport (2-seater)
  if (
    t === "z950" ||
    t === "zforce-950-sport" ||
    t === "zforce 950" ||
    t === "zforce 950 sport" ||
    t.includes("zforce 950") ||
    /\bz950\b/i.test(t)
  ) {
    return "z950";
  }

  // 3. Z10-4 / ZForce Z10-4 (4-seater)
  // Must check Z10-4 before Z10 so 4-seater is never merged into 2-seater platform!
  if (
    t === "z10-4" ||
    t === "z10 4" ||
    t === "zforce-z10-4" ||
    t === "zforce z10-4" ||
    t === "zforce z10 4" ||
    t === "cfmoto z10-4" ||
    t === "cfmoto z10 4" ||
    t.includes("zforce-z10-4") ||
    t.includes("zforce z10-4") ||
    t.includes("zforce z10 4") ||
    t.includes("z10-4") ||
    /\b(zforce\s+)?z10[-_\s]?4\b/i.test(t) ||
    /\bcfmoto\s+z10[-_\s]?4\b/i.test(t)
  ) {
    return "z10-4";
  }

  // 4. Z10 / ZForce Z10 (2-seater)
  if (
    (t === "z10" ||
      t === "zforce-z10" ||
      t === "zforce z10" ||
      t === "cfmoto z10" ||
      t.includes("zforce-z10") ||
      t.includes("zforce z10") ||
      /\b(zforce\s+)?z10\b/i.test(t) ||
      /\bcfmoto\s+z10\b/i.test(t)) &&
    !t.includes("-4") &&
    !t.includes(" 4") &&
    !/\bz10[-_\s]?4\b/i.test(t)
  ) {
    return "z10";
  }

  // 4a. Can-Am Maverick R MAX (4-seater 2024+)
  // Must check MAX before 2-seater Maverick R!
  if (
    (t.includes("maverick-r") || t.includes("maverick r") || /\bmaverick[-_\s]?r\b/i.test(t)) &&
    (/\bmax\b/i.test(t) || t.includes("-max-") || t.endsWith("-max") || t.startsWith("max-") || t.includes(" max ") || t.includes("max"))
  ) {
    return "maverick-r-max";
  }

  // 4b. Can-Am Maverick R (2-seater 2024+)
  if (
    t === "maverick-r" ||
    t === "maverick r" ||
    t === "maverickr" ||
    t === "can-am-maverick-r" ||
    t === "canam-maverick-r" ||
    t.startsWith("maverick-r-") ||
    t.startsWith("maverick r ") ||
    t.includes("maverick-r") ||
    t.includes("maverick r") ||
    /\bmaverick[-_\s]?r\b/i.test(t)
  ) {
    return "maverick-r";
  }

  // 4c. Can-Am Maverick X3 MAX (4-seater)
  // Must check MAX before 2-seater X3!
  if (
    !t.includes("maverick-r") &&
    !t.includes("maverick r") &&
    !/\bmaverick[-_\s]?r\b/i.test(t) &&
    (/\bmax\b/i.test(t) || t.includes("-max-") || t.endsWith("-max") || t.includes("max")) &&
    (
      t.includes("x3") ||
      t.includes("maverick-x3") ||
      t.includes("maverick x3") ||
      /\b(can-am\s+)?(maverick[-_\s]?)?x3\b/i.test(t)
    )
  ) {
    return "x3-max";
  }

  // 4d. Can-Am Maverick X3 (2-seater)
  if (
    !t.includes("maverick-r") &&
    !t.includes("maverick r") &&
    !/\bmaverick[-_\s]?r\b/i.test(t) &&
    (
      t === "can-amx3" ||
      t === "x3" ||
      t === "maverick x3" ||
      t === "maverick-x3" ||
      t.includes("maverick x3") ||
      t.includes("maverick-x3") ||
      t.startsWith("maverick-x3") ||
      t.startsWith("x3-") ||
      t.includes("x3ds") ||
      t.includes("x3rs") ||
      t.includes("x3m") ||
      /\b(can-am\s+)?(maverick[-_\s]?)?x3\b/i.test(t)
    )
  ) {
    return "x3";
  }

  // 4e. Can-Am Defender / Traxter
  if (
    t === "defender" ||
    t === "can-am defender" ||
    t === "traxter" ||
    t.includes("defender") ||
    t.includes("traxter") ||
    /\bdefender\b/i.test(t)
  ) {
    return "defender";
  }

  // 4f. Can-Am Commander
  if (
    (t === "commander" || t === "can-am commander" || t.includes("can-am commander") || t.startsWith("commander-")) &&
    !t.includes("power commander")
  ) {
    return "commander";
  }

  // 5. Segway Villain
  if (
    t === "villain-sx10" ||
    t === "villain sx10" ||
    t === "sx10" ||
    t === "segway villain" ||
    /\bvillain(\s*sx10)?\b/i.test(t)
  ) {
    return "villain";
  }

  // 6a. Polaris RZR Pro R 4 (4-seater)
  if (
    !t.includes("maverick") &&
    !t.includes("can-am") &&
    (
      t === "rzr-pro-r-4" ||
      t === "pro-r-4" ||
      t === "pro r 4" ||
      t.includes("pro-r-4") ||
      t.includes("pro r 4") ||
      /\bpro\s*r\s*4\b/i.test(t)
    )
  ) {
    return "pror-4";
  }

  // 6b. Polaris RZR Pro R (2-seater)
  if (
    !t.includes("maverick") &&
    !t.includes("can-am") &&
    (
      t === "rzr-pro-r" ||
      t === "pro-r" ||
      t === "pro r" ||
      t.includes("pro r") ||
      /\bpro\s*r\b/i.test(t)
    )
  ) {
    return "pror";
  }

  // 7a. Polaris RZR Pro XP 4 (4-seater)
  if (
    !t.includes("maverick") &&
    !t.includes("can-am") &&
    (
      t === "rzr-pro-xp-4" ||
      t === "pro-xp-4" ||
      t === "pro xp 4" ||
      t.includes("pro-xp-4") ||
      t.includes("pro xp 4") ||
      /\bpro\s*xp\s*4\b/i.test(t)
    )
  ) {
    return "proxp-4";
  }

  // 7b. Polaris RZR Pro XP (2-seater)
  if (
    !t.includes("maverick") &&
    !t.includes("can-am") &&
    (
      t === "rzr-pro-xp" ||
      t === "pro-xp" ||
      t === "pro xp" ||
      t.includes("pro xp") ||
      /\bpro\s*xp\b/i.test(t)
    )
  ) {
    return "proxp";
  }

  // 8a. Polaris Turbo R 4 (4-seater)
  if (
    !t.includes("maverick") &&
    !t.includes("can-am") &&
    !t.includes("canam") &&
    (
      t === "rzr-turbo-r-4" ||
      t === "polaris-turbo-r-4" ||
      t === "turbo-r-4" ||
      t === "turbo r 4" ||
      t.includes("turbo r 4") ||
      t.includes("turbo-r-4") ||
      /\brzr(\s*turbo\s*r\s*4)\b/i.test(t)
    )
  ) {
    return "turbor-4";
  }

  // 8b. Polaris Turbo R (2-seater)
  if (
    !t.includes("maverick") &&
    !t.includes("can-am") &&
    !t.includes("canam") &&
    (
      t === "rzr-turbo-r" ||
      t === "polaris-turbo-r" ||
      t === "turbo-r" ||
      t === "turbo r" ||
      t.includes("rzr turbo r") ||
      t.includes("polaris turbo r") ||
      /\brzr(\s*turbo\s*r)?\b/i.test(t)
    )
  ) {
    return "turbor";
  }

  // 9a. Kawasaki KRX4 1000 (4-seater)
  if (
    t === "krx4" ||
    t === "krx-4" ||
    t === "krx 4" ||
    t.includes("krx4") ||
    /\bkrx[-_\s]?4\b/i.test(t)
  ) {
    return "krx4";
  }

  // 9b. Kawasaki KRX 1000 (2-seater)
  if (
    t === "krx" ||
    t === "krx-1000" ||
    t === "krx 1000" ||
    t.includes("krx 1000") ||
    /\bkrx(\s*1000)?\b/i.test(t)
  ) {
    return "krx1000";
  }

  // 10. Honda Talon
  if (
    t === "talon" ||
    t === "talon-1000" ||
    t === "talon 1000" ||
    t.includes("talon") ||
    /\btalon(\s*1000)?\b/i.test(t)
  ) {
    return "talon";
  }

  return null;
}

/**
 * Standardized vehicle and platform compatibility matcher.
 * Uses canonical platform aliases and whole-token matching to strictly prevent false
 * cross-brand, cross-platform, or 2-seater vs 4-seater collisions.
 */
export function isPlatformOrVehicleMatch(compItem: string, targetToken: string): boolean {
  const c = compItem.toLowerCase().trim();
  const target = targetToken.toLowerCase().trim();
  if (!c || !target) return false;
  if (c === "all" || target === "all") return true;
  if (c.includes("universal") || target.includes("universal")) return true;
  if (c === target) return true;

  // STRICT SEPARATION: 2-Seater vs 4-Seater (MAX / Crew / -4)
  // A product built specifically for a 2-seater must NEVER match a 4-seater target vehicle, and vice versa.
  if (
    (is4SeaterToken(c) && is2SeaterToken(target)) ||
    (is2SeaterToken(c) && is4SeaterToken(target))
  ) {
    return false;
  }

  // STRICT SEPARATION: Can-Am Maverick R vs Can-Am Maverick X3
  // Products designed for Maverick X3 do NOT fit Maverick R, and vice-versa.
  const isMaverickR = (s: string) =>
    s === "maverick-r" ||
    s === "maverick r" ||
    s.includes("maverick-r") ||
    s.includes("maverick r") ||
    /\bmaverick[-_\s]?r\b/i.test(s);

  const isMaverickX3 = (s: string) =>
    !isMaverickR(s) &&
    (
      s === "x3" ||
      s === "can-amx3" ||
      s === "maverick-x3" ||
      s === "maverick x3" ||
      s.includes("x3") ||
      s.includes("maverick-x3") ||
      s.includes("maverick x3") ||
      /\b(can-am\s+)?(maverick[-_\s]?)?x3\b/i.test(s)
    );

  if ((isMaverickR(c) && isMaverickX3(target)) || (isMaverickX3(c) && isMaverickR(target))) {
    return false;
  }

  // STRICT SEPARATION: Z10 (2-seater) vs Z10-4 (4-seater)
  // A product that fits Z10 does NOT automatically fit Z10-4, and vice-versa.
  const isZ10_4 = (s: string) =>
    s === "z10-4" ||
    s === "zforce-z10-4" ||
    s === "zforce z10-4" ||
    s.includes("z10-4") ||
    s.includes("zforce-z10-4") ||
    s.includes("zforce z10-4") ||
    /\b(zforce\s+)?z10[-_\s]?4\b/i.test(s);

  const isZ10_2 = (s: string) =>
    (s === "z10" ||
      s === "zforce-z10" ||
      s === "zforce z10" ||
      s.includes("zforce-z10") ||
      s.includes("zforce z10") ||
      /\b(zforce\s+)?z10\b/i.test(s)) &&
    !isZ10_4(s);

  if ((isZ10_4(c) && isZ10_2(target)) || (isZ10_2(c) && isZ10_4(target))) {
    return false;
  }

  const platC = detectVehiclePlatform(c);
  const platTarget = detectVehiclePlatform(target);

  // If both have recognized platform families:
  if (platC && platTarget) {
    return platC === platTarget;
  }

  // Cross-platform negative check: if one is explicitly one platform and other explicitly mentions an incompatible one
  if (platC && !platTarget) {
    if (platC.startsWith("maverick-r") && (target.includes("x3") || isMaverickX3(target))) {
      return false;
    }
    if (platC.startsWith("x3") && (target.includes("maverick-r") || isMaverickR(target))) {
      return false;
    }
    if (platC === "z10" && (target.includes("1000") || target.includes("z1000") || target.includes("950") || target.includes("x3") || isZ10_4(target))) {
      return false;
    }
    if (platC === "z10-4" && (target.includes("1000") || target.includes("z1000") || target.includes("950") || target.includes("x3") || isZ10_2(target))) {
      return false;
    }
    if (platC === "z1000" && (/\bz10(-4)?\b/i.test(target) || target.includes("950") || target.includes("x3"))) {
      return false;
    }
    if (platC === "z950" && (target.includes("1000") || target.includes("z1000") || /\bz10(-4)?\b/i.test(target) || target.includes("x3"))) {
      return false;
    }
  }

  if (platTarget && !platC) {
    if (platTarget.startsWith("maverick-r") && (c.includes("x3") || isMaverickX3(c))) {
      return false;
    }
    if (platTarget.startsWith("x3") && (c.includes("maverick-r") || isMaverickR(c))) {
      return false;
    }
    if (platTarget === "z10" && (c.includes("1000") || c.includes("z1000") || c.includes("950") || c.includes("x3") || isZ10_4(c))) {
      return false;
    }
    if (platTarget === "z10-4" && (c.includes("1000") || c.includes("z1000") || c.includes("950") || c.includes("x3") || isZ10_2(c))) {
      return false;
    }
    if (platTarget === "z1000" && (/\bz10(-4)?\b/i.test(c) || c.includes("950") || c.includes("x3"))) {
      return false;
    }
    if (platTarget === "z950" && (c.includes("1000") || c.includes("z1000") || /\bz10(-4)?\b/i.test(c) || c.includes("x3"))) {
      return false;
    }
  }

  const cNorm = c.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  const targetNorm = target.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (cNorm === targetNorm) return true;

  // Protect against generic single-character or short substring collisions (e.g. standalone "x" or "r")
  if (cNorm.length <= 2 || targetNorm.length <= 2) {
    return cNorm === targetNorm;
  }

  const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const targetInComp = new RegExp(`(^|[\\s\\-_/])${escapeRegex(targetNorm)}($|[\\s\\-_/])`, "i").test(cNorm);
  if (targetInComp) return true;

  const compInTarget = new RegExp(`(^|[\\s\\-_/])${escapeRegex(cNorm)}($|[\\s\\-_/])`, "i").test(targetNorm);
  if (compInTarget) return true;

  return false;
}

/**
 * Format model and year fitment cleanly (e.g. CFMOTO ZForce Z10 (2026+), Can-Am Maverick X3 (2019-2027)).
 */
export function formatModelWithYear(compToken: string): string {
  const token = compToken.toLowerCase().trim();
  if (
    token === "all" ||
    token === "universal" ||
    token.includes("universal")
  ) {
    return "Universal";
  }
  if (token === "zforce-z10-4" || token === "z10-4" || token === "cfmoto z10-4") {
    return "CFMOTO ZForce Z10-4 (2026+)";
  }
  if (token === "zforce-z10" || token === "z10" || token === "cfmoto z10") {
    return "CFMOTO ZForce Z10 (2026+)";
  }
  if (
    token === "maverick-r-max" ||
    token.includes("maverick-r-max") ||
    token.includes("maverick r max") ||
    /\bmaverick[-_\s]?r[-_\s]?max\b/i.test(token)
  ) {
    return "Can-Am Maverick R MAX (2024+)";
  }
  if (token === "maverick-r" || token.includes("maverick-r") || token.includes("maverick r") || /\bmaverick[-_\s]?r\b/i.test(token)) {
    return "Can-Am Maverick R (2024+)";
  }
  if (
    token === "x3-max" ||
    token.includes("x3-max") ||
    token.includes("x3 max") ||
    token.includes("maverick x3 max") ||
    token.includes("maverick-x3-max")
  ) {
    return "Can-Am Maverick X3 MAX (2017-2027)";
  }
  if (token === "can-amx3" || token === "x3" || token.includes("maverick x3") || token === "maverick-x3") {
    return "Can-Am Maverick X3 (2017-2027)";
  }
  if (token === "zforce-950-sport-4" || token === "z950-4") {
    return "CFMOTO ZForce 950 Sport-4 (2023-2027)";
  }
  if (token === "zforce-950-sport" || token === "z950") {
    return "CFMOTO ZForce 950 Sport (2023-2027)";
  }
  if (token === "zforce-1000" || token === "z1000") {
    return "CFMOTO ZForce 1000 Sport R (2022-2026)";
  }
  if (token === "villain-sx10" || token === "sx10") {
    return "Segway Villain SX10 (2022-2027)";
  }
  return compToken;
}

/**
 * Format a full compatibility array cleanly.
 */
export function formatCompListWithYears(compList?: string[]): string {
  if (!compList || compList.length === 0) return "Universal";
  const list = compList.map((c) => c.toLowerCase().trim());
  if (list.includes("all") || list.some((c) => c === "universal" || c.includes("universal"))) {
    return "Universal";
  }
  const hasZ10 = list.some((c) => c === "z10" || c === "zforce-z10");
  const hasZ10_4 = list.some((c) => c === "z10-4" || c === "zforce-z10-4");
  if (hasZ10 && hasZ10_4) {
    return "CFMOTO ZForce Z10 & Z10-4 (2026+)";
  }
  if (hasZ10) {
    return "CFMOTO ZForce Z10 (2026+)";
  }
  if (hasZ10_4) {
    return "CFMOTO ZForce Z10-4 (2026+)";
  }

  const hasMavR = list.some((c) => is2SeaterToken(c) && (c.includes("maverick-r") || c.includes("maverick r") || /\bmaverick[-_\s]?r\b/i.test(c)));
  const hasMavRMax = list.some((c) => is4SeaterToken(c) && (c.includes("maverick-r") || c.includes("maverick r") || /\bmaverick[-_\s]?r\b/i.test(c)));
  if (hasMavR && hasMavRMax) {
    return "Can-Am Maverick R & Maverick R MAX (2024+)";
  }
  if (hasMavRMax) {
    return "Can-Am Maverick R MAX (2024+)";
  }
  if (hasMavR) {
    return "Can-Am Maverick R (2024+)";
  }

  const hasX3 = list.some((c) => is2SeaterToken(c) && (c === "can-amx3" || c === "x3" || c.includes("maverick-x3") || c.includes("maverick x3") || c.startsWith("x3") || /\bx3\b/i.test(c)));
  const hasX3Max = list.some((c) => is4SeaterToken(c) && (c.includes("x3") || c.includes("maverick-x3") || c.includes("maverick x3")));
  if (hasX3 && hasX3Max) {
    return "Can-Am Maverick X3 & Maverick X3 MAX (2017-2027)";
  }
  if (hasX3Max) {
    return "Can-Am Maverick X3 MAX (2017-2027)";
  }
  if (hasX3) {
    return "Can-Am Maverick X3 (2017-2027)";
  }

  return compList.map(formatModelWithYear).join(", ");
}

/**
 * Normalizes an audio path to ensure it is absolute and properly prefixed.
 */
export function normalizeAudioUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  if (trimmed.startsWith("audio/")) return `/${trimmed}`;
  if (trimmed.startsWith("uploads/")) return `/${trimmed}`;
  return `/audio/${trimmed}`;
}

/**
 * Normalizes a video path to ensure it is absolute and properly prefixed.
 */
export function normalizeVideoUrl(url: string | null | undefined): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  if (trimmed.startsWith("videos/")) return `/${trimmed}`;
  if (trimmed.startsWith("uploads/")) return `/${trimmed}`;
  return `/videos/${trimmed}`;
}

/**
 * Resolves the display image for a vehicle registered in the garage.
 * If no vehicle-specific image exists, falls back to the official company logo as requested.
 */
export function resolveVehicleImage(v?: {
  imageUrl?: string | null;
  modelSlug?: string | null;
  modelName?: string | null;
  brandSlug?: string | null;
  brandName?: string | null;
  brandDefaultVehicleImageUrl?: string | null;
} | null): string {
  if (!v) return "/images/logo.png";

  // 1. Explicit valid vehicle image
  if (
    v.imageUrl &&
    typeof v.imageUrl === "string" &&
    v.imageUrl.trim() &&
    v.imageUrl !== "null" &&
    v.imageUrl !== "undefined"
  ) {
    return v.imageUrl.trim();
  }

  // 2. Explicit brand default vehicle image
  if (
    v.brandDefaultVehicleImageUrl &&
    typeof v.brandDefaultVehicleImageUrl === "string" &&
    v.brandDefaultVehicleImageUrl.trim() &&
    v.brandDefaultVehicleImageUrl !== "null" &&
    v.brandDefaultVehicleImageUrl !== "undefined"
  ) {
    return v.brandDefaultVehicleImageUrl.trim();
  }

  const slug = (v.modelSlug || "").toLowerCase().trim();
  const name = (v.modelName || "").toLowerCase().trim();
  const bSlug = (v.brandSlug || "").toLowerCase().trim();
  const bName = (v.brandName || "").toLowerCase().trim();

  // 3. Known SXS Model Front / Action Images
  // CFMOTO Z10 (2-seater and 4-seater)
  if (slug === "zforce-z10" || slug === "zforce-z10-4" || slug === "z10" || slug === "z10-4" || name.includes("z10")) {
    return "/images/sxs/z10_front.png";
  }

  // Can-Am Maverick X3
  if (slug === "can-amx3" || slug === "x3" || slug.includes("x3") || name.includes("x3") || name.includes("maverick")) {
    return "/images/sxs/canam_x3_front.png";
  }

  // Polaris RZR Pro R
  if (slug.includes("pro-r") || slug.includes("pror") || name.includes("pro r")) {
    return "/images/sxs/polaris_pror_front.png";
  }

  // Segway Villain
  if (slug.includes("villain") || slug.includes("sx10") || name.includes("villain")) {
    return "/images/sxs/segway_sxs.png";
  }

  // CFMOTO ZForce 1000 Sport R
  if (slug === "zforce-1000" || slug.includes("1000") || name.includes("1000")) {
    return "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80";
  }

  // CFMOTO ZForce 950 Sport
  if (slug === "zforce-950-sport" || slug.includes("950") || name.includes("950")) {
    return "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80";
  }

  // 4. Fallback to Brand default image in SXS_BRANDS
  const sxsBrand = SXS_BRANDS.find(
    (b) => b.slug === bSlug || b.id === bSlug || b.title.toLowerCase() === bName
  );
  if (sxsBrand?.sxsImageUrl) {
    return sxsBrand.sxsImageUrl;
  }

  // 5. Fallback to brand logo, then company logo
  const bLogo = getBrandLogo(bSlug);
  if (bLogo && bLogo !== "/images/logo.png") {
    return bLogo;
  }
  return "/images/logo.png";
}

export async function getAllProducts(): Promise<ProductItem[]> {
  try {
    if (typeof window === "undefined") {
      try {
        const { prisma } = await import("@/lib/prisma");
        const rows = await prisma.product.findMany({
          where: { isArchived: false },
          include: { category: true },
        });

        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((p) => {
            let comp: string[] = [];
            if (p.compJson) {
              try {
                comp = JSON.parse(p.compJson);
              } catch {}
            }
            if (comp.length === 0) comp = ["all"];

            let cat: string[] = [];
            if (p.categoryJson) {
              try {
                cat = JSON.parse(p.categoryJson);
              } catch {}
            } else if (p.category?.slug) {
              cat = [p.category.slug];
            } else if (p.category?.nameEs) {
              cat = [p.category.nameEs];
            }
            if (cat.length === 0) cat = ["performance"];

            let imgs: string[] = [];
            if (p.imagesJson) {
              try {
                const parsed = JSON.parse(p.imagesJson);
                if (Array.isArray(parsed)) {
                  parsed.forEach((img: any) => {
                    const s = typeof img === "string" ? img.trim() : "";
                    if (s && !imgs.includes(s)) imgs.push(s);
                  });
                }
              } catch {}
            }
            if (imgs.length === 0 && p.imageUrl && typeof p.imageUrl === "string" && p.imageUrl.trim()) {
              imgs.push(p.imageUrl.trim());
            }
            if (p.parametersJson) {
              try {
                const params = JSON.parse(p.parametersJson);
                if (Array.isArray(params)) {
                  params.forEach((param: any) => {
                    if (Array.isArray(param.options)) {
                      param.options.forEach((opt: any) => {
                        const optImg = typeof opt.imageUrl === "string" ? opt.imageUrl.trim() : "";
                        if (optImg && !imgs.includes(optImg)) imgs.push(optImg);
                      });
                    }
                  });
                }
              } catch {}
            }
            if (imgs.length === 0) imgs = ["/images/logo.png"];

            let modelYearCompatibility: ModelYearFitment[] = [];
            if (p.modelYearCompatibilityJson) {
              try {
                modelYearCompatibility = JSON.parse(p.modelYearCompatibilityJson);
              } catch {}
            }

            const includesInstall = p.isInstallationIncluded ?? true;
            return {
              id: p.sku || p.slug || p.id,
              slug: p.slug || p.sku,
              sku: p.sku,
              p_title: p.nameEs || p.nameEn,
              nameEs: p.nameEs,
              nameEn: p.nameEn,
              description: {
                es: [{ title: "Descripción", content: p.descriptionEs || "" }],
                en: [{ title: "Description", content: p.descriptionEn || "" }],
              },
              price: {
                P_price_D: Number(p.processingPriceD) || 0,
                P_price: Number(p.processingPriceCRC) || 0,
                S_price: Number(p.shippingPriceCRC) || 0,
                I_price: {
                  includes: includesInstall,
                  I_price: includesInstall ? 0 : (Number(p.installationPriceCRC) || 0),
                },
                profit: Number(p.profitCRC) || 0,
                T_price: Number(p.priceCRC) || 0,
                T_price_D: p.totalPriceD || "calculate in checkout",
                iva: {
                  rate: Number(p.ivaPercent) || 13,
                  amount: Number(p.ivaCRC) || 0,
                },
              },
              priceCRC: Number(p.priceCRC) || 0,
              comp,
              category: cat,
              brand: [p.brandName || "ZxZ Performance"],
              imgs,
              imageUrl: p.imageUrl || imgs[0],
              vids: [],
              audios: [],
              requirements: p.requirements,
              homeInstallation: p.homeInstallationAvailable !== false,
              modelYearCompatibility,
            } as ProductItem;
          });
        }
      } catch (dbErr) {
        console.error("Error querying products from Prisma in getAllProducts:", dbErr);
      }
    }

    const products: any[] = (rawProductsData || []) as any[];
    
    if (!Array.isArray(products) || products.length === 0) return [];

    return products.map((item, idx) => {
      const id = item.id || `prod-${idx + 1}`;
      const slug = item.slug || id;

      // Normalize string or array for imgs
      const rawImgs = Array.isArray(item.imgs)
        ? item.imgs
        : typeof item.imgs === "string" && item.imgs.trim()
        ? [item.imgs.trim()]
        : [];
      const imgs = rawImgs.map((img: string) => {
        if (img.startsWith("/") || img.startsWith("http")) return img;
        return `/products/${img}`;
      });

      // Normalize string or array for audios
      const rawAudios = Array.isArray(item.audios)
        ? item.audios
        : typeof item.audios === "string" && item.audios.trim()
        ? [item.audios.trim()]
        : [];
      const audios: string[] = rawAudios.map((aud: string) => normalizeAudioUrl(aud)).filter(Boolean);

      // Normalize string or array for vids
      const rawVids = Array.isArray(item.vids)
        ? item.vids
        : typeof item.vids === "string" && item.vids.trim()
        ? [item.vids.trim()]
        : [];
      const vids: string[] = rawVids.map((v: string) => normalizeVideoUrl(v)).filter(Boolean);

      // Normalize price
      const priceObj = item.price || {};
      const includesInstall =
        priceObj.I_price?.includes === true ||
        priceObj.I_price?.includes === "true";

      const normalizedPrice: ProductPrice = {
        P_price_D: Number(priceObj.P_price_D) || 0,
        P_price: Number(priceObj.P_price) || 0,
        S_price: Number(priceObj.S_price) || 0,
        I_price: {
          includes: includesInstall,
          I_price: includesInstall ? 0 : (Number(priceObj.I_price?.I_price) || 0),
        },
        profit: Number(priceObj.profit) || 0,
        T_price: Number(priceObj.T_price) || 0,
        T_price_D: priceObj.T_price_D,
      };

      // Reviews: if empty or no reviews submitted, set to null so stars render empty
      let reviewsObj: { stars: number; count?: number } | null = null;
      if (
        typeof item.reviews === "object" &&
        item.reviews !== null &&
        typeof item.reviews.stars === "number" &&
        item.reviews.stars > 0
      ) {
        reviewsObj = {
          stars: item.reviews.stars,
          count: item.reviews.count,
        };
      }

      // Brand normalization: always normalize Bikeman to Bikeman Performance
      const rawBrands = Array.isArray(item.brand)
        ? item.brand
        : typeof item.brand === "string"
        ? [item.brand]
        : [];
      const brand = normalizeBrandList(rawBrands);

      // Model & Year Compatibility list
      let modelYearCompatibility: ModelYearFitment[] = [];
      const rawFitments = item.modelYearCompatibility || item.yearCompatibility || item.compatibilities;
      if (Array.isArray(rawFitments) && rawFitments.length > 0) {
        modelYearCompatibility = rawFitments.map((fit: any) => ({
          make: fit.make || fit.brand || fit.brandSlug || undefined,
          model: fit.model || fit.modelSlug || fit.name || "",
          years: fit.years || (fit.yearFrom && fit.yearTo ? (fit.yearFrom === fit.yearTo ? String(fit.yearFrom) : `${fit.yearFrom} - ${fit.yearTo}`) : ""),
          yearFrom: fit.yearFrom ? Number(fit.yearFrom) : undefined,
          yearTo: fit.yearTo ? Number(fit.yearTo) : undefined,
          trim: fit.trim || fit.version || undefined,
          fitmentType: fit.fitmentType || fit.type || "Direct Bolt-On",
          notes: fit.notes || undefined,
        }));
      } else if (Array.isArray(item.comp) && item.comp.length > 0) {
        if (item.comp.includes("all")) {
          modelYearCompatibility = [
            {
              make: "Universal",
              model: "Todos los modelos SXS / All SXS Models",
              years: "Todos los Años / All Years",
              fitmentType: "Universal Fit",
              notes: "Compatible con plataformas UTV, SXS y ATV",
            },
          ];
        } else {
          modelYearCompatibility = item.comp.map((c: string) => {
            const cLower = c.toLowerCase().trim();
            if (cLower.includes("z10")) {
              return {
                make: "CFMOTO",
                model: cLower.includes("4") ? "ZForce Z10-4" : "ZForce Z10",
                years: "2026+",
                yearFrom: 2026,
                fitmentType: "Direct Bolt-On",
                notes: "Calce directo sin modificaciones",
              };
            }
            if (cLower.includes("x3")) {
              return {
                make: "CAN-AM",
                model: "Maverick X3",
                years: "2016-2022",
                yearFrom: 2016,
                yearTo: 2022,
                fitmentType: "Direct Bolt-On",
                notes: "Calce directo",
              };
            }
            return {
              make: "SXS",
              model: c.toUpperCase(),
              years: "2020 - 2026",
              fitmentType: "Direct Fit",
            };
          });
        }
      }

      return {
        ...item,
        id,
        slug,
        comp: Array.isArray(item.comp)
          ? item.comp
          : typeof item.comp === "string"
          ? [item.comp]
          : [],
        category: Array.isArray(item.category)
          ? item.category
          : typeof item.category === "string"
          ? [item.category]
          : [],
        brand,
        imgs,
        vids,
        audios,
        price: normalizedPrice,
        requirements:
          item.requirements === "null" || !item.requirements
            ? null
            : item.requirements,
        reviews: reviewsObj,
        homeInstallation: item.homeInstallation !== false,
        modelYearCompatibility,
      };
    });
  } catch (err) {
    console.error("Error reading products.json:", err);
    return [];
  }
}

export async function getProductBySlug(slugOrId: string): Promise<ProductItem | null> {
  const products = await getAllProducts();
  return (
    products.find(
      (p) =>
        p.slug.toLowerCase() === slugOrId.toLowerCase() ||
        p.id.toLowerCase() === slugOrId.toLowerCase()
    ) || null
  );
}


export interface FilterOptions {
  q?: string;
  category?: string;
  brand?: string;
  comp?: string;
  sxs?: string;
  vehicleModel?: string;
  sort?: "price-asc" | "price-desc" | "stars" | "relevant";
}

export async function searchAndFilterProducts(options: FilterOptions = {}): Promise<{
  products: ProductItem[];
  total: number;
  categories: string[];
  brands: string[];
}> {
  const allProducts = await getAllProducts();

  // Extract all unique categories present in the products
  const categorySet = new Set<string>();
  allProducts.forEach((p) => {
    p.category.forEach((cat) => categorySet.add(cat.trim()));
  });
  const categories = Array.from(categorySet);

  // Filter products by search query, category, comp, and vehicleModel FIRST
  // to dynamically compute matching brands for the current search
  const queryMatchedProducts = allProducts.filter((product) => {
    // 1. Text Search (q) with brand disambiguation, unit exclusion, and relevance scoring
    if (options.q && options.q.trim()) {
      const searchRes = evaluateProductSearch(product, options.q);
      if (!searchRes.matches) return false;
    }

    // 2. Category filter
    if (options.category && options.category.toLowerCase() !== "all") {
      const targetCat = options.category.toLowerCase();
      const hasCategory = product.category.some((c) => {
        const cLower = c.toLowerCase();
        if (targetCat === "skit plates" || targetCat === "skid plates") {
          return cLower.includes("skit") || cLower.includes("skid");
        }
        return cLower === targetCat || cLower.includes(targetCat);
      });
      if (!hasCategory) return false;
    }

    // 3. Compatibility filter (SXS)
    if (options.comp && options.comp.toLowerCase() !== "all") {
      const targetComp = options.comp.toLowerCase();
      const isUniversal = isUniversalFit(product.comp);
      const matchesSxs = product.comp.some((c) =>
        c.toLowerCase().includes(targetComp)
      );
      if (!isUniversal && !matchesSxs) return false;
    }

    // 4. Active Vehicle Compatibility
    if (options.vehicleModel) {
      const vehicleLower = options.vehicleModel.toLowerCase().trim();
      const isUniversal = isUniversalFit(product.comp);

      if (!isUniversal) {
        let matchesVehicle = false;
        if (product.modelYearCompatibility && product.modelYearCompatibility.length > 0) {
          matchesVehicle = product.modelYearCompatibility.some((m) => {
            const fitModel = (m.model || "").toLowerCase().trim();
            if (fitModel === "all" || fitModel.includes("universal")) return true;
            return isPlatformOrVehicleMatch(fitModel, vehicleLower);
          });
        }
        if (!matchesVehicle && product.comp && product.comp.length > 0) {
          matchesVehicle = product.comp.some((c) => isPlatformOrVehicleMatch(c, vehicleLower));
        }
        if (!matchesVehicle) return false;
      }
    }

    // 5. Special by SxS Brand Filter
    if (options.sxs && options.sxs.toLowerCase() !== "all") {
      const targetSxs = options.sxs.toLowerCase().trim();
      const platforms = SXS_BRAND_PLATFORMS[targetSxs] || [targetSxs];
      const isUniversal = isUniversalFit(product.comp);

      const descText = extractDescriptionText(product.description).toLowerCase();
      const titleLower = product.p_title.toLowerCase();

      const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

      const matchesSxs = platforms.some((plat) => {
        const platLower = plat.toLowerCase();
        const compMatch = product.comp && product.comp.some((c) =>
          isPlatformOrVehicleMatch(c, platLower)
        );
        if (compMatch) return true;

        const myCompMatch = product.modelYearCompatibility && product.modelYearCompatibility.some((m) =>
          isPlatformOrVehicleMatch(m.model, platLower) || (m.make && isPlatformOrVehicleMatch(m.make, platLower))
        );
        if (myCompMatch) return true;

        // ONLY fallback to title/desc if product has NO compatibility defined anywhere
        if ((!product.comp || product.comp.length === 0) && (!product.modelYearCompatibility || product.modelYearCompatibility.length === 0)) {
          const platRegex = new RegExp(
            `(^|[\\s\\-_/])${escapeRegex(platLower)}($|[\\s\\-_/])`,
            "i"
          );
          if (platRegex.test(titleLower) || platRegex.test(descText)) return true;
        }
        return false;
      });

      if (!isUniversal && !matchesSxs) return false;
    }

    return true;
  });

  // Dynamically compute brands that exist in the matching products
  const matchingBrandsSet = new Set<string>();
  queryMatchedProducts.forEach((p) => {
    p.brand.forEach((b) => matchingBrandsSet.add(normalizeBrandName(b.trim())));
  });
  const brands = Array.from(matchingBrandsSet);

  // Apply brand filter if specified
  let filtered = queryMatchedProducts;
  if (options.brand && options.brand.toLowerCase() !== "all") {
    const targetBrand = normalizeBrandName(options.brand).toLowerCase();
    filtered = filtered.filter((product) =>
      product.brand.some(
        (b) =>
          normalizeBrandName(b).toLowerCase() === targetBrand ||
          b.toLowerCase().includes(targetBrand)
      )
    );
  }

  // Sort
  if (options.sort === "price-asc") {
    filtered.sort((a, b) => a.price.T_price - b.price.T_price);
  } else if (options.sort === "price-desc") {
    filtered.sort((a, b) => b.price.T_price - a.price.T_price);
  } else if (options.sort === "stars") {
    filtered.sort(
      (a, b) => ((b.reviews as any)?.stars || 0) - ((a.reviews as any)?.stars || 0)
    );
  }

  return {
    products: filtered,
    total: filtered.length,
    categories,
    brands,
  };
}

export function normalizeMakeToBrandSlug(make?: string | null): string | null {
  if (!make) return null;
  const m = make.toLowerCase().trim();
  if (m === "can-am" || m === "canam" || m === "can am" || m === "brp") return "can-am";
  if (m === "polaris") return "polaris";
  if (m === "cfmoto" || m === "cf moto" || m === "cf-moto") return "cfmoto";
  if (m === "honda") return "honda";
  if (m === "yamaha") return "yamaha";
  if (m === "segway") return "segway";
  if (m === "kawasaki") return "kawasaki";
  return null;
}

export function normalizeModelSlugToBrandSlug(slug?: string | null): string | null {
  if (!slug) return null;
  const s = slug.toLowerCase().trim();
  if (
    s.startsWith("maverick") ||
    s.startsWith("can-am") ||
    s.startsWith("canam") ||
    s.startsWith("x3") ||
    s.includes("x3") ||
    s.includes("defender") ||
    s.includes("commander")
  ) {
    return "can-am";
  }
  if (
    s.startsWith("rzr") ||
    s.startsWith("polaris") ||
    s.startsWith("pro-r") ||
    s.startsWith("pro-xp") ||
    s.startsWith("turbo-r") ||
    s.includes("ranger") ||
    s.includes("general")
  ) {
    return "polaris";
  }
  if (
    s.startsWith("zforce") ||
    s.startsWith("cforce") ||
    s.startsWith("uforce") ||
    s.startsWith("z10") ||
    s.startsWith("z950") ||
    s.startsWith("z1000") ||
    s.includes("cfmoto")
  ) {
    return "cfmoto";
  }
  if (s.startsWith("talon") || s.startsWith("pioneer") || s.includes("honda")) {
    return "honda";
  }
  if (s.startsWith("yxz") || s.startsWith("wolverine") || s.startsWith("rmax") || s.includes("yamaha")) {
    return "yamaha";
  }
  if (s.startsWith("villain") || s.startsWith("fugleman") || s.includes("segway")) {
    return "segway";
  }
  if (s.startsWith("krx") || s.startsWith("teryx") || s.startsWith("mule") || s.includes("kawasaki")) {
    return "kawasaki";
  }
  return null;
}

/**
 * Dynamically detects matching vehicle brand slugs (e.g. "cfmoto", "can-am", "polaris")
 * for any product based on compatibility list, model-year matrix, and platform keywords.
 * Prioritizes explicit structured data (ground truth) over text searches to prevent cross-brand bleed.
 */
export function detectProductVehicleBrands(product: any): string[] {
  const matchedSlugs = new Set<string>();

  // 1. Structured modelYearCompatibility (HIGHEST PRIORITY / GROUND TRUTH)
  if (
    product.modelYearCompatibility &&
    Array.isArray(product.modelYearCompatibility) &&
    product.modelYearCompatibility.length > 0
  ) {
    for (const m of product.modelYearCompatibility) {
      const fromMake = normalizeMakeToBrandSlug(m.make);
      if (fromMake) matchedSlugs.add(fromMake);
      const fromModel = normalizeModelSlugToBrandSlug(m.model);
      if (fromModel) matchedSlugs.add(fromModel);
    }
    // If structured modelYearCompatibility gave verified brand(s), return immediately without text searching!
    if (matchedSlugs.size > 0) {
      return Array.from(matchedSlugs);
    }
  }

  // 2. Structured comp array (model slugs)
  if (product.comp && Array.isArray(product.comp) && product.comp.length > 0) {
    for (const c of product.comp) {
      const fromComp = normalizeModelSlugToBrandSlug(c);
      if (fromComp) {
        matchedSlugs.add(fromComp);
      } else {
        const cLower = typeof c === "string" ? c.toLowerCase().trim() : "";
        for (const [brandSlug, platforms] of Object.entries(SXS_BRAND_PLATFORMS)) {
          if (platforms.some((plat) => isPlatformOrVehicleMatch(cLower, plat.toLowerCase()))) {
            matchedSlugs.add(brandSlug);
          }
        }
      }
    }
    if (matchedSlugs.size > 0) {
      return Array.from(matchedSlugs);
    }
  }

  // 3. Structured compatibilities relation
  if (
    product.compatibilities &&
    Array.isArray(product.compatibilities) &&
    product.compatibilities.length > 0
  ) {
    for (const rel of product.compatibilities) {
      const fromRel = normalizeModelSlugToBrandSlug(rel.vehicleModel || rel.modelSlug);
      if (fromRel) {
        matchedSlugs.add(fromRel);
      } else {
        const vm = (rel.vehicleModel || "").toLowerCase().trim();
        for (const [brandSlug, platforms] of Object.entries(SXS_BRAND_PLATFORMS)) {
          if (platforms.some((plat) => isPlatformOrVehicleMatch(vm, plat.toLowerCase()))) {
            matchedSlugs.add(brandSlug);
          }
        }
      }
    }
    if (matchedSlugs.size > 0) {
      return Array.from(matchedSlugs);
    }
  }

  // 4. True Fallback: ONLY when NO structured fitments exist at all
  const title = (product.p_title || product.nameEs || product.nameEn || "").toLowerCase();
  const desc = (
    typeof product.description === "string"
      ? product.description
      : (product.descriptionEs || product.descriptionEn || "")
  ).toLowerCase();
  const fullText = `${title} ${desc}`;

  for (const [brandSlug, platforms] of Object.entries(SXS_BRAND_PLATFORMS)) {
    const matchesText = platforms.some((plat) => {
      const platLower = plat.toLowerCase();
      const regex = new RegExp(
        `(^|[\\s\\-_/])${platLower.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}($|[\\s\\-_/])`,
        "i"
      );
      return regex.test(fullText);
    });
    if (matchesText) {
      matchedSlugs.add(brandSlug);
    }
  }

  return Array.from(matchedSlugs);
}

