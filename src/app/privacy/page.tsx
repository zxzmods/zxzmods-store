import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PublicLegalDocView, LegalDocPayload } from "@/components/documents/PublicLegalDocView";
import { GLOBAL_CEDULA_JURIDICA, GLOBAL_LEGAL_NAME } from "@/config/company";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy & Personal Data Protection | ZxZ Mods Costa Rica",
  description:
    "Official Privacy Policy and Google OAuth 2.0 User Data handling for ZxZ Mods Costa Rica S.A. Fully compliant with Google API Services User Data Policy and Costa Rican Law No. 8968.",
  alternates: {
    canonical: "https://www.zxzmods.com/privacy",
  },
};

export default async function PrivacyEnglishPage() {
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
          "Official ZxZ Mods Costa Rica privacy policy. Regulates collection, storage, Google OAuth 2.0 usage, and personal data protection in compliance with Law No. 8968 and the Google API Services User Data Policy.",
        summaryEn:
          "Official ZxZ Mods Costa Rica privacy policy. Regulates collection, storage, Google OAuth 2.0 usage, and personal data protection in compliance with Law No. 8968 and the Google API Services User Data Policy.",
        contentEs: "Loading official privacy policy...",
        contentEn: "Loading official privacy policy...",
        jurisdiction: "San José, Costa Rica",
        lastUpdated: "Octubre 2026",
        applicableLaws: [
          "Law No. 8968 of Costa Rica",
          "Google API Services User Data Policy (Limited Use Requirements)",
        ],
        cedulaJuridica: activeCedula,
        legalName: activeLegalName,
      };

  return <PublicLegalDocView document={documentPayload} defaultLang="en" isPrivacyPolicy={true} />;
}
