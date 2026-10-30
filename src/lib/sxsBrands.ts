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

