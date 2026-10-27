import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PublicLegalDocView, LegalDocPayload } from "@/components/documents/PublicLegalDocView";
import { GLOBAL_CEDULA_JURIDICA, GLOBAL_LEGAL_NAME } from "@/config/company";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Política de Privacidad y Protección de Datos | ZxZ Mods Costa Rica",
  description:
    "Política de Privacidad oficial y tratamiento de datos personales de ZxZ Mods Costa Rica S.A. Cumplimiento estricto con la Ley N° 8968 y la Google API Services User Data Policy.",
  alternates: {
    canonical: "https://www.zxzmods.com/privacidad",
  },
};

export default async function PrivacidadPage() {
  const [docFromDb, workshop] = await Promise.all([
    prisma.legalDocument.findUnique({
      where: { slug: "privacidad-datos" },
    }).catch(() => null),
    prisma.workshopInfo.findUnique({ where: { id: "zxz-hq" } }).catch(() => null),
  ]);

  const activeCedula = workshop?.cedulaJuridica || GLOBAL_CEDULA_JURIDICA || "3-101-436132";
  const activeLegalName = workshop?.legalName || GLOBAL_LEGAL_NAME || "ZxZ Mods Costa Rica S.A.";

  const documentPayload: LegalDocPayload = docFromDb
    ? {
        slug: docFromDb.slug,
        order: docFromDb.order,
        category: docFromDb.category,
        titleEs: docFromDb.titleEs,
        titleEn: docFromDb.titleEn,
        badgeEs: docFromDb.badgeEs,
        badgeEn: docFromDb.badgeEn,
        summaryEs: docFromDb.summaryEs,
        summaryEn: docFromDb.summaryEn,
        contentEs: docFromDb.contentEs,
        contentEn: docFromDb.contentEn,
        jurisdiction: docFromDb.jurisdiction,
        lastUpdated: docFromDb.lastUpdated,
        applicableLaws: (() => {
          try {
            return JSON.parse(docFromDb.applicableLawsJson || "[]");
          } catch {
            return [];
          }
        })(),
        cedulaJuridica: activeCedula,
        legalName: activeLegalName,
      }
    : {
        slug: "privacidad-datos",
        order: 4,
        category: "PRIVACY",
        titleEs: "Política de Privacidad y Tratamiento de Datos Personales (Google OAuth Compliant)",
        titleEn: "Privacy Policy and Personal Data Protection (Google OAuth Compliant)",
        badgeEs: "Privacidad y Datos",
        badgeEn: "Privacy & Data",
        summaryEs:
          "Política oficial de privacidad de ZxZ Mods Costa Rica. Regula la recopilación, almacenamiento, uso de Google OAuth 2.0 y protección de datos personales de acuerdo con la Ley N° 8968 y la Google API Services User Data Policy.",
        summaryEn:
          "Official ZxZ Mods Costa Rica privacy policy. Regulates collection, storage, Google OAuth 2.0 usage, and personal data protection in compliance with Law No. 8968 and the Google API Services User Data Policy.",
        contentEs: "Cargando política de privacidad oficial...",
        contentEn: "Loading official privacy policy...",
        jurisdiction: "San José, Costa Rica",
        lastUpdated: "Octubre 2026",
        applicableLaws: [
          "Ley N° 8968 de Costa Rica",
          "Política de Datos de Usuario de los Servicios de API de Google (Limited Use)",
        ],
        cedulaJuridica: activeCedula,
        legalName: activeLegalName,
      };

  return <PublicLegalDocView document={documentPayload} defaultLang="es" isPrivacyPolicy={true} />;
}
