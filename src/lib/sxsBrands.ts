export interface SxsBrand {
  id: string;
  slug: string;
  title: string;
  exploreLink: string;
  sxsImageUrl: string;
  models: string[];
  descriptionEs: string;
  descriptionEn: string;
  isPaused?: boolean;
  hasIntroAnimation?: boolean;
}

export const SXS_BRANDS: SxsBrand[] = [
  {
    id: "cfmoto",
    slug: "cfmoto",
    title: "CFMOTO",
    exploreLink: "/productos?sxs=cfmoto&intro=true",
    sxsImageUrl: "/images/sxs/cfmoto_sxs.png",
    models: [],
    descriptionEs: "Especialidad principal de ZxZ Mods. Repuestos de alto flujo, escapes deportivos y calibraciones.",
    descriptionEn: "ZxZ Mods primary specialty. High-flow exhausts, sport upgrades, and custom tuning.",
    hasIntroAnimation: true,
  },
  {
    id: "can-am",
    slug: "can-am",
    title: "CAN-AM",
    exploreLink: "/productos?sxs=can-am&intro=true",
    sxsImageUrl: "/images/sxs/canam_sxs.png",
    models: [],
    descriptionEs: "Plataformas Maverick X3, Maverick R y Defender. Escapes, fajas de alto rendimiento y accesorios.",
    descriptionEn: "Maverick X3, Maverick R, and Defender platforms. Exhausts, high-performance belts, and upgrades.",
    hasIntroAnimation: true,
  },
  {
    id: "polaris",
    slug: "polaris",
    title: "POLARIS",
    exploreLink: "/productos?sxs=polaris&intro=true",
    sxsImageUrl: "/images/sxs/polaris_sxs.png",
    models: [],
    descriptionEs: "RZR Pro R, Turbo R y Pro XP. Modificaciones de potencia, suspensión y enfriamiento.",
    descriptionEn: "RZR Pro R, Turbo R, and Pro XP. Power modifications, suspension, and cooling components.",
    hasIntroAnimation: true,
  },
  {
    id: "honda",
    slug: "honda",
    title: "HONDA",
    exploreLink: "/productos?sxs=honda",
    sxsImageUrl: "/images/sxs/honda_sxs.png",
    models: [],
    descriptionEs: "Talon 1000 y Pioneer 1000. Suspensión, iluminación y accesorios de trabajo y recreación.",
    descriptionEn: "Talon 1000 and Pioneer 1000. Suspension, lighting, and performance recreation accessories.",
  },
  {
    id: "yamaha",
    slug: "yamaha",
    title: "YAMAHA",
    exploreLink: "/productos?sxs=yamaha",
    sxsImageUrl: "/images/sxs/yamaha_sxs.png",
    models: [],
    descriptionEs: "YXZ1000R y Wolverine RMAX. Componentes de alto régimen, escapes y protección integral.",
    descriptionEn: "YXZ1000R and Wolverine RMAX. High-revving components, exhausts, and complete protection.",
  },
  {
    id: "segway",
    slug: "segway",
    title: "SEGWAY",
    exploreLink: "/productos?sxs=segway",
    sxsImageUrl: "/images/sxs/segway_sxs.png",
    models: [],
    descriptionEs: "Villain SX10 y Fugleman UT10. Mejoras deportivas, iluminación y piezas especializadas.",
    descriptionEn: "Villain SX10 and Fugleman UT10. Sport performance upgrades, lighting, and specialized parts.",
  },
  {
    id: "kawasaki",
    slug: "kawasaki",
    title: "KAWASAKI",
    exploreLink: "/productos?sxs=kawasaki",
    sxsImageUrl: "/images/sxs/kawasaki_sxs.png",
    models: [],
    descriptionEs: "Gama Teryx KRX 1000 y KRX4 1000. Suspensión reforzada, escapes deportivos y accesorios de alto desempeño.",
    descriptionEn: "Teryx KRX 1000 and KRX4 1000 lineup. Heavy-duty suspension, sport exhausts, and high-performance upgrades.",
  },
];

export const SXS_BRAND_PLATFORMS: Record<string, string[]> = {
  cfmoto: ["cfmoto", "cf moto", "z10", "z10-4", "zforce", "cforce", "uforce"],
  "can-am": ["can-am", "canam", "can am", "maverick", "x3", "defender", "can-am commander", "maverick r"],
  polaris: ["polaris", "rzr", "pro r", "rzr turbo r", "pro xp", "ranger", "polaris general", "rzr pro", "general xp"],
  honda: ["honda", "talon", "honda pioneer", "pioneer 1000", "pioneer 700", "pioneer 500"],
  yamaha: ["yamaha", "yxz", "yxz1000r", "wolverine", "rmax"],
  segway: ["segway", "villain", "fugleman"],
  kawasaki: ["kawasaki", "krx", "krx 1000", "krx4", "teryx", "mule", "brute force 750", "kawasaki brute force"],
};

export const BRAND_LOGOS: Record<string, string> = {
  polaris: "/images/logos/polaris.png",
  "can-am": "/images/logos/can-am.png",
  segway: "/images/logos/segway.png",
  honda: "/images/logos/honda.png",
  yamaha: "/images/logos/yamaha.png",
  cfmoto: "/images/logos/cfmoto.png",
  kawasaki: "/images/logos/kawasaki.svg",
};

export function getBrandLogo(slug?: string | null): string {
  if (!slug) return "/images/logo.png";
  const s = slug.toLowerCase().trim();
  return BRAND_LOGOS[s] || "/images/logo.png";
}

export function getSxsBrandBySlug(slug?: string): SxsBrand | undefined {
  if (!slug) return undefined;
  const lower = slug.toLowerCase().trim();
  return SXS_BRANDS.find((b) => b.slug === lower || b.id === lower);
}

export const BRAND_DISPLAY_PRIORITY: Record<string, number> = {
  cfmoto: 1,
  "can-am": 2,
  polaris: 3,
  honda: 4,
  yamaha: 5,
  kawasaki: 6,
  segway: 7,
};

export const FAMILY_DISPLAY_PRIORITY: Record<string, number> = {
  // CFMOTO
  "zforce z10": 1,
  "z10": 1,
  "zforce 1000": 2,
  "zforce 950": 3,
  "zforce 800": 4,
  "zforce": 5,
  "uforce": 10,
  "cforce (atv)": 20,
  "cforce": 21,

  // CAN-AM
  "maverick x3": 1,
  "x3": 1,
  "maverick r": 2,
  "mav-r": 2,
  "defender": 10,
  "commander": 11,
  "maverick trail": 12,
  "maverick sport": 13,
  "renegade (atv)": 20,
  "renegade": 21,
  "outlander (atv)": 22,
  "outlander": 23,

  // POLARIS
  "rzr pro r": 1,
  "pro r": 1,
  "rzr turbo r": 2,
  "turbo r": 2,
  "rzr pro xp": 3,
  "pro xp": 3,
  "rzr xp 1000": 4,
  "rzr": 5,
  "ranger": 10,
  "general": 11,
  "general xp": 12,
  "sportsman (atv)": 20,
  "sportsman": 21,
  "scrambler (atv)": 22,
  "scrambler": 23,

  // KAWASAKI
  "teryx krx": 1,
  "krx 1000": 1,
  "krx": 1,
  "teryx": 10,
  "mule": 11,
  "brute force (atv)": 20,
  "brute force": 21,

  // HONDA
  "talon": 1,
  "talon 1000": 1,
  "pioneer": 10,
  "fourtrax (atv)": 20,

  // YAMAHA
  "yxz": 1,
  "yxz1000r": 1,
  "wolverine": 10,
  "viking": 11,
  "grizzly (atv)": 20,

  // SEGWAY
  "villain": 1,
  "villain sx10": 1,
  "fugleman": 10,
  "snarler (atv)": 20,
};

export function getBrandPriority(slug?: string | null): number {
  if (!slug) return 99;
  const s = slug.toLowerCase().trim();
  return BRAND_DISPLAY_PRIORITY[s] ?? 99;
}

export function getFamilyPriority(family?: string | null): number {
  if (!family) return 50;
  const f = family.toLowerCase().trim();
  if (FAMILY_DISPLAY_PRIORITY[f] !== undefined) return FAMILY_DISPLAY_PRIORITY[f];
  for (const [key, prio] of Object.entries(FAMILY_DISPLAY_PRIORITY)) {
    if (f.includes(key) || key.includes(f)) return prio;
  }
  if (f.includes("atv") || f.includes("quad")) return 25;
  return 50;
}

/**
 * Resolves the display family name for a model (e.g. "Maverick X3", "ZForce Z10", "Defender").
 */
export function getModelFamilyName(model: any): string {
  if (!model) return "Otros";
  if (model.modelCategory && typeof model.modelCategory === "string" && model.modelCategory.trim()) {
    return model.modelCategory.trim();
  }
  const name = (model.name || "").trim();
  const slug = (model.slug || "").toLowerCase().trim();

  // Can-Am fallbacks
  if (slug.includes("x3") || name.toLowerCase().includes("x3")) return "Maverick X3";
  if (slug.includes("mav-r") || slug.includes("maverick-r") || name.toLowerCase().includes("maverick r")) return "Maverick R";
  if (slug.includes("defender") || name.toLowerCase().includes("defender")) return "Defender";
  if (slug.includes("commander") || name.toLowerCase().includes("commander")) return "Commander";
  if (slug.includes("outlander") || name.toLowerCase().includes("outlander")) return "Outlander (ATV)";
  if (slug.includes("renegade") || name.toLowerCase().includes("renegade")) return "Renegade (ATV)";

  // CFMOTO fallbacks
  if (slug.includes("z10") || name.toLowerCase().includes("z10")) return "ZForce Z10";
  if (slug.includes("950") || name.toLowerCase().includes("950")) return "ZForce 950";
  if (slug.includes("1000") && (slug.includes("zforce") || name.toLowerCase().includes("zforce"))) return "ZForce 1000";
  if (slug.includes("uforce") || name.toLowerCase().includes("uforce")) return "UForce";
  if (slug.includes("cforce") || name.toLowerCase().includes("cforce")) return "CForce (ATV)";

  // Polaris fallbacks
  if (slug.includes("pro-r") || name.toLowerCase().includes("pro r")) return "RZR Pro R";
  if (slug.includes("turbo-r") || name.toLowerCase().includes("turbo r")) return "RZR Turbo R";
  if (slug.includes("pro-xp") || name.toLowerCase().includes("pro xp")) return "RZR Pro XP";
  if (slug.includes("sportsman") || name.toLowerCase().includes("sportsman")) return "Sportsman (ATV)";
  if (slug.includes("ranger") || name.toLowerCase().includes("ranger")) return "Ranger";
  if (slug.includes("general") || name.toLowerCase().includes("general")) return "General";

  // Kawasaki fallbacks
  if (slug.includes("krx") || name.toLowerCase().includes("krx")) return "Teryx KRX";
  if (slug.includes("brute-force") || name.toLowerCase().includes("brute force")) return "Brute Force (ATV)";

  // Segway fallbacks
  if (slug.includes("villain") || name.toLowerCase().includes("villain")) return "Villain SX10";
  if (slug.includes("fugleman") || name.toLowerCase().includes("fugleman")) return "Fugleman";

  return model.category ? `${model.category}` : "Otros";
}

/**
 * Sorts vehicle brands putting primary brands first (CFMOTO -> Can-Am -> Polaris -> Honda -> Yamaha -> Kawasaki -> Segway -> Alphabetical).
 */
export function sortVehicleBrands<T>(brands: T[], getSlug?: (b: T) => string, getName?: (b: T) => string): T[] {
  return [...brands].sort((a, b) => {
    const slugA = getSlug ? getSlug(a) : ((a as any).slug || (a as any).id || "");
    const slugB = getSlug ? getSlug(b) : ((b as any).slug || (b as any).id || "");
    const pA = getBrandPriority(slugA);
    const pB = getBrandPriority(slugB);
    if (pA !== pB) return pA - pB;
    const nameA = getName ? getName(a) : ((a as any).name || (a as any).title || slugA);
    const nameB = getName ? getName(b) : ((b as any).name || (b as any).title || slugB);
    return String(nameA).localeCompare(String(nameB));
  });
}

/**
 * Sorts vehicle models by:
 * 1. Brand priority (CFMOTO -> Can-Am -> Polaris...)
 * 2. Family priority (e.g. Maverick X3 before Maverick R before Defender before Outlander)
 * 3. 2-seater before 4-seater / MAX
 * 4. Alphabetical by model name
 */
export function sortVehicleModels<T>(models: T[]): T[] {
  const is4Seater = (str: string) => {
    const s = str.toLowerCase();
    return s.includes("-4") || s.includes(" 4") || s.includes("max") || s.includes("crew") || s.includes("xl");
  };

  return [...models].sort((a: any, b: any) => {
    // 1. Brand priority (if brandSlug or brand available)
    const brandA = a.brandSlug || a.brand?.slug || "";
    const brandB = b.brandSlug || b.brand?.slug || "";
    if (brandA && brandB) {
      const bPrioA = getBrandPriority(brandA);
      const bPrioB = getBrandPriority(brandB);
      if (bPrioA !== bPrioB) return bPrioA - bPrioB;
    }

    // 2. Family priority
    const famA = getModelFamilyName(a);
    const famB = getModelFamilyName(b);
    if (famA.toLowerCase() !== famB.toLowerCase()) {
      const fPrioA = getFamilyPriority(famA);
      const fPrioB = getFamilyPriority(famB);
      if (fPrioA !== fPrioB) return fPrioA - fPrioB;
      return famA.localeCompare(famB);
    }

    // 3. 2-seater before 4-seater / MAX
    const aIs4 = is4Seater((a.slug || "") + " " + (a.name || ""));
    const bIs4 = is4Seater((b.slug || "") + " " + (b.name || ""));
    if (aIs4 !== bIs4) return aIs4 ? 1 : -1;

    // 4. Model name
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

/**
 * Groups models by Brand and Family for organized selection.
 */
export function groupVehicleModelsByBrandAndFamily(models: any[]): Array<{
  brandSlug: string;
  brandName: string;
  families: Array<{
    family: string;
    code?: string | null;
    models: any[];
    slugs: string[];
  }>;
}> {
  const sorted = sortVehicleModels(models);
  const brandMap = new Map<string, { brandSlug: string; brandName: string; familyMap: Map<string, any[]> }>();

  sorted.forEach((m) => {
    const bSlug = (m.brandSlug || m.brand?.slug || "otros").toLowerCase();
    const bName = m.brandName || m.brand?.name || (bSlug.toUpperCase());
    if (!brandMap.has(bSlug)) {
      brandMap.set(bSlug, { brandSlug: bSlug, brandName: bName, familyMap: new Map() });
    }
    const bEntry = brandMap.get(bSlug)!;
    const fam = getModelFamilyName(m);
    if (!bEntry.familyMap.has(fam)) {
      bEntry.familyMap.set(fam, []);
    }
    bEntry.familyMap.get(fam)!.push(m);
  });

  const brandsList = Array.from(brandMap.values()).map((b) => {
    const families = Array.from(b.familyMap.entries()).map(([family, fModels]) => {
      const firstCode = fModels.find((m) => m.code)?.code || null;
      return {
        family,
        code: firstCode,
        models: fModels,
        slugs: fModels.map((m) => m.slug),
      };
    });
    return {
      brandSlug: b.brandSlug,
      brandName: b.brandName,
      families,
    };
  });

  return sortVehicleBrands(brandsList, (b) => b.brandSlug, (b) => b.brandName);
}

