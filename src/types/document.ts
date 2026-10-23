export interface LegalDocumentItem {
  id: string;
  slug: string;
  order: number;
  category: "GENERAL" | "PAYMENTS" | "WARRANTIES" | "PRIVACY" | "LOGISTICS" | "SAFETY" | "TUNING";
  titleEs: string;
  titleEn: string;
  badgeEs: string;
  badgeEn: string;
  summaryEs: string;
  summaryEn: string;
  contentEs?: string;
  contentEn?: string;
  jurisdiction: string;
  lastUpdated: string;
  applicableLawsJson: string;
  isPublished: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LegalDocumentDetail extends LegalDocumentItem {
  contentEs: string;
  contentEn: string;
  applicableLaws: string[];
}

export const OFFICIAL_LEGAL_DOCS = [
  {
    slug: "terminos-condiciones",
    titleEs: "Términos y Condiciones",
    titleEn: "Terms & Conditions",
    badgeEs: "Venta & Plataforma",
    badgeEn: "Sales & Terms",
  },
  {
    slug: "acuerdos-pago",
    titleEs: "Acuerdos de Pago",
    titleEn: "Payment Agreements",
    badgeEs: "Solo Transferencias Bancarias (Sin SINPE)",
    badgeEn: "Bank Transfers Only (No SINPE)",
  },
  {
    slug: "poliza-garantia",
    titleEs: "Póliza de Garantía",
    titleEn: "Warranty Policy",
    badgeEs: "Cero Devoluciones • Solo Fallos de Fábrica",
    badgeEn: "Zero Returns • Factory Defects Only",
  },
  {
    slug: "privacidad-datos",
    titleEs: "Privacidad de Datos",
    titleEn: "Privacy Policy",
    badgeEs: "Ley N° 8968 PRODHAB",
    badgeEn: "Costa Rica Law No. 8968",
  },
  {
    slug: "importacion-aduanas",
    titleEs: "Importación & Aduanas",
    titleEn: "Importation & Customs",
    badgeEs: "7-21 Días • Desalmacenaje",
    badgeEn: "7-21 Days • Customs Clearance",
  },
  {
    slug: "descargo-responsabilidad",
    titleEs: "Descargo de Responsabilidad",
    titleEn: "Liability Waiver",
    badgeEs: "Garantía de Agencia & Off-Road",
    badgeEn: "Dealer Warranty & Off-Road",
  },
  {
    slug: "taller-domicilio-remolque",
    titleEs: "Taller Móvil & Remolque",
    titleEn: "Mobile Service & Towing",
    badgeEs: "Inspección 360° • Terreno Seguro",
    badgeEn: "360° Inspection • Safe Terrain",
  },
  {
    slug: "reprogramacion-ecu",
    titleEs: "Reprogramación ECU",
    titleEn: "ECU Tuning",
    badgeEs: "Software de por Vida • Cero Motor Físico",
    badgeEn: "Lifetime Software • Engine Exclusion",
  },
] as const;
