import { prisma } from "@/lib/prisma";

export const DEFAULT_HOMEPAGE_ITEMS = [
  // Videos (Hero section)
  {
    type: "VIDEO",
    titleEs: "Z10 ZxZ Performance Package",
    titleEn: "Z10 ZxZ Performance Package",
    category: "CFMOTO Specialty",
    descriptionEs: "Paquete de alto rendimiento con reprogramación de ECU, faja reforzada y suspensión de alta exigencia.",
    descriptionEn: "High-performance package with ECU flash, heavy-duty belt, and heavy-duty suspension.",
    redirectUrl: "/cotizar?marca=cfmoto",
    mediaUrl: "/images/sxs/z10_front.png",
    videoUrl: "",
    order: 0,
    isActive: true,
  },
  {
    type: "VIDEO",
    titleEs: "Maverick R 240 HP Package",
    titleEn: "Maverick R 240 HP Package",
    category: "Can-Am Off-Road",
    descriptionEs: "Setup de competición con escape deportivo de acero inoxidable y aros beadlock.",
    descriptionEn: "Competition setup with stainless sport exhaust and beadlock wheels.",
    redirectUrl: "/cotizar?marca=can-am",
    mediaUrl: "/images/sxs/canam_sxs.png",
    videoUrl: "",
    order: 1,
    isActive: true,
  },
  {
    type: "VIDEO",
    titleEs: "Pro R DYNAMIX Setup",
    titleEn: "Pro R DYNAMIX Setup",
    category: "Polaris Racing",
    descriptionEs: "Protección tubular extrema y transmisión optimizada para carreras.",
    descriptionEn: "Extreme tubular chassis protection and race-tuned drivetrain.",
    redirectUrl: "/cotizar?marca=polaris",
    mediaUrl: "/images/sxs/polaris_pror_front.png",
    videoUrl: "",
    order: 2,
    isActive: true,
  },
  // Products (Product Showcase Section)
  {
    type: "PRODUCT",
    titleEs: "Reprogramación ECU Stage 1",
    titleEn: "Stage 1 ECU Reprogramming",
    category: "Software & Potencia",
    descriptionEs: "Calibración precisa en dinamómetro para UTVs. Elimina limitadores de velocidad y optimiza la curva de combustible para trillo pesado.",
    descriptionEn: "Precise dyno calibration for UTVs. Eliminates speed limiters and optimizes fuel curve for heavy mud.",
    redirectUrl: "/performance",
    mediaUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    videoUrl: null,
    order: 0,
    isActive: true,
  },
  {
    type: "PRODUCT",
    titleEs: "Faja Reforzada G-Boost",
    titleEn: "G-Boost Heavy Duty Belt",
    category: "Transmisión & Drivetrain",
    descriptionEs: "Compuesto de polímero con cordón de aramida diseñado para soportar calor extremo en barro espeso y tracción continua de alta exigencia.",
    descriptionEn: "Polymer compound with aramid cord built to withstand extreme heat in deep mud and heavy load.",
    redirectUrl: "/productos?slug=faja-reforzada-cfmoto-zforce-950",
    mediaUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1200&q=80",
    videoUrl: null,
    order: 1,
    isActive: true,
  },
  {
    type: "PRODUCT",
    titleEs: "Bikeman Sport Exhaust",
    titleEn: "Bikeman Sport Exhaust",
    category: "Escapes & Potencia",
    descriptionEs: "Sistema de escape de acero inoxidable T304 con supresor de chispas desmontable y ganancia de flujo probada en dinamómetro.",
    descriptionEn: "T304 stainless steel exhaust system with removable spark arrestor and dyno-proven high flow.",
    redirectUrl: "/productos?slug=escape-bikeman-sport",
    mediaUrl: "/products/z10_bikeman_exhaust.webp",
    videoUrl: null,
    order: 2,
    isActive: true,
  },
  {
    type: "PRODUCT",
    titleEs: "Brazos High-Clearance",
    titleEn: "High-Clearance A-Arms",
    category: "Chasis & Suspensión",
    descriptionEs: "Tubería estructural cédula 40 soldada TIG. Permite montar llantas más grandes y protege los ejes CV de troncos y piedras en la ruta.",
    descriptionEn: "TIG-welded structural schedule 40 tubing. Allows larger tires and shields CV axles from trail logs and rocks.",
    redirectUrl: "/productos?slug=brazos-high-clearance",
    mediaUrl: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80",
    videoUrl: null,
    order: 3,
    isActive: true,
  },
  {
    type: "PRODUCT",
    titleEs: "Aros Beadlock 15\"",
    titleEn: "15\" Beadlock Wheels",
    category: "Ruedas & Neumáticos",
    descriptionEs: "Ruedas probadas en los trillos más exigentes de Costa Rica. Permiten bajar hasta 6 PSI para máxima huella sobre barro y piedra suelta.",
    descriptionEn: "Wheels tested on the toughest Costa Rican trails. Allows running down to 6 PSI for maximum footprint.",
    redirectUrl: "/combos",
    mediaUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80",
    videoUrl: null,
    order: 4,
    isActive: true,
  },
];

/**
 * Ensures initial default home page items exist in the database.
 */
export async function ensureDefaultHomePageItems() {
  const count = await prisma.homePageItem.count();
  if (count === 0) {
    await prisma.homePageItem.createMany({
      data: DEFAULT_HOMEPAGE_ITEMS,
    });
  }
}
