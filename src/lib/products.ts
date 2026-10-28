import rawProductsData from "@/data/products.json";

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
  colorHex?: string;     // Color hex code (e.g. "#EA580C" for orange, "#18181B" for black, "#2563EB" for blue)
  imageUrl?: string;     // Dedicated image URL for this specific option/variant to visualize
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
  colorHex?: string;
  imageUrl?: string;
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
 * Detects the canonical vehicle platform family from a vehicle name, code, or compatibility token.
 * Strictly separates CFMOTO Z10 (2026+ Turbo) from ZForce 1000 Sport R (z1000), ZForce 950 (z950), and Can-Am X3.
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

  // 2. Z950 / ZForce 950 Sport
  if (
    t === "z950" ||
    t === "zforce-950-sport" ||
    t === "zforce 950" ||
    t === "zforce 950 sport" ||
    t === "zforce 950 sport-4" ||
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

  // 4. Can-Am Maverick X3
  if (
    t === "can-amx3" ||
    t === "x3" ||
    t === "maverick x3" ||
    t === "maverick-x3" ||
    t.includes("maverick x3") ||
    /\b(can-am\s+)?(maverick\s+)?x3\b/i.test(t)
  ) {
    return "x3";
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

  return null;
}

/**
 * Standardized vehicle and platform compatibility matcher.
 * Uses canonical platform aliases and whole-token matching to strictly prevent false
 * cross-brand or cross-model collisions (e.g. CFMOTO Z10 must NEVER match CFMOTO ZForce 1000 Sport R).
 */
export function isPlatformOrVehicleMatch(compItem: string, targetToken: string): boolean {
  const c = compItem.toLowerCase().trim();
  const target = targetToken.toLowerCase().trim();
  if (!c || !target) return false;
  if (c === "all" || target === "all") return true;
  if (c.includes("universal") || target.includes("universal")) return true;
  if (c === target) return true;

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
  if (token === "can-amx3" || token === "x3" || token.includes("maverick x3") || token === "maverick-x3") {
    return "Can-Am Maverick X3 (2019-2027)";
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
  if (list.some((c) => c === "can-amx3" || c === "x3" || c.includes("maverick"))) {
    return "Can-Am Maverick X3 (2019-2027)";
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
            if (p.imageUrl && typeof p.imageUrl === "string" && p.imageUrl.trim()) {
              imgs.push(p.imageUrl.trim());
            }
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
            if (p.additionalImagesJson) {
              try {
                const parsed = JSON.parse(p.additionalImagesJson);
                if (Array.isArray(parsed)) {
                  parsed.forEach((img: any) => {
                    const s = typeof img === "string" ? img.trim() : "";
                    if (s && !imgs.includes(s)) imgs.push(s);
                  });
                }
              } catch {}
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

import { SXS_BRAND_PLATFORMS } from "@/lib/sxsBrands";

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
    // 1. Text Search (q)
    if (options.q && options.q.trim()) {
      const searchTerms = options.q
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .split(/\s+/)
        .filter(Boolean);

      const descText = extractDescriptionText(product.description);
      const searchableText = [
        product.id,
        product.p_title,
        descText,
        product.requirements || "",
        ...product.category,
        ...product.brand,
        ...product.comp,
      ]
        .join(" ")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const matchesAllTerms = searchTerms.every((term) =>
        searchableText.includes(term)
      );

      if (!matchesAllTerms) return false;
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
      const vehicleLower = options.vehicleModel.toLowerCase();
      const isUniversal = isUniversalFit(product.comp);
      const matchesVehicle = product.comp.some((c) =>
        isPlatformOrVehicleMatch(c, vehicleLower)
      );
      if (!isUniversal && !matchesVehicle) return false;
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

/**
 * Dynamically detects matching vehicle brand slugs (e.g. "cfmoto", "can-am", "polaris")
 * for any product based on compatibility list, model-year matrix, and platform keywords.
 */
export function detectProductVehicleBrands(product: any): string[] {
  const matchedSlugs = new Set<string>();

  for (const [brandSlug, platforms] of Object.entries(SXS_BRAND_PLATFORMS)) {
    // 1. Check comp array
    if (product.comp && Array.isArray(product.comp)) {
      const matchComp = product.comp.some((c: string) => {
        const cLower = typeof c === "string" ? c.toLowerCase().trim() : "";
        return platforms.some((plat) => isPlatformOrVehicleMatch(cLower, plat.toLowerCase()));
      });
      if (matchComp) {
        matchedSlugs.add(brandSlug);
        continue;
      }
    }

    // 2. Check modelYearCompatibility
    if (product.modelYearCompatibility && Array.isArray(product.modelYearCompatibility)) {
      const matchMY = product.modelYearCompatibility.some((m: any) => {
        const make = (m.make || "").toLowerCase().trim();
        const model = (m.model || "").toLowerCase().trim();
        return platforms.some(
          (plat) =>
            isPlatformOrVehicleMatch(make, plat.toLowerCase()) ||
            isPlatformOrVehicleMatch(model, plat.toLowerCase())
        );
      });
      if (matchMY) {
        matchedSlugs.add(brandSlug);
        continue;
      }
    }

    // 3. Check compatibilities array
    if (product.compatibilities && Array.isArray(product.compatibilities)) {
      const matchRel = product.compatibilities.some((rel: any) => {
        const vm = (rel.vehicleModel || "").toLowerCase().trim();
        return platforms.some((plat) => isPlatformOrVehicleMatch(vm, plat.toLowerCase()));
      });
      if (matchRel) {
        matchedSlugs.add(brandSlug);
        continue;
      }
    }

    // 4. Fallback to title / description
    const title = (product.p_title || product.nameEs || product.nameEn || "").toLowerCase();
    const desc = (
      typeof product.description === "string"
        ? product.description
        : (product.descriptionEs || product.descriptionEn || "")
    ).toLowerCase();
    const matchesText = platforms.some((plat) => {
      const platLower = plat.toLowerCase();
      const regex = new RegExp(`(^|[\\s\\-_/])${platLower.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}($|[\\s\\-_/])`, "i");
      return regex.test(title) || regex.test(desc);
    });
    if (matchesText) {
      matchedSlugs.add(brandSlug);
    }
  }

  return Array.from(matchedSlugs);
}

