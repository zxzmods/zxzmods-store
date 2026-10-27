import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PublicLegalDocView, LegalDocPayload } from "@/components/documents/PublicLegalDocView";
import { GLOBAL_CEDULA_JURIDICA, GLOBAL_LEGAL_NAME } from "@/config/company";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms and Conditions of Service | ZxZ Mods Costa Rica",
  description:
    "Official Terms and Conditions of service, parts purchase, and platform use for ZxZ Mods Costa Rica S.A. Corporate Tax ID 3-101-436132.",
  alternates: {
    canonical: "https://www.zxzmods.com/terms",
  },
};

export default async function TermsEnglishPage() {
  const [docFromDb, workshop] = await Promise.all([
    prisma.legalDocument.findUnique({
      where: { slug: "terminos-condiciones" },
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
        slug: "terminos-condiciones",
        order: 1,
        category: "GENERAL",
        titleEs: "Términos y Condiciones Generales de Uso de Plataforma y Venta",
        titleEn: "General Terms and Conditions of Platform Use and Sale",
        badgeEs: "Uso y Contratación",
        badgeEn: "Terms of Service",
        summaryEs:
          "Governs commercial relations, orders, payments, dispatch and workshop service usage of ZxZ Mods Costa Rica.",
        summaryEn:
          "Governs commercial relations, orders, payments, dispatch and workshop service usage of ZxZ Mods Costa Rica.",
        contentEs: "Loading terms and conditions...",
        contentEn: "Loading terms and conditions...",
        jurisdiction: "San José, Costa Rica",
        lastUpdated: "Octubre 2026",
        applicableLaws: ["Commerce Code of Costa Rica", "Consumer Protection Law No. 7472"],
        cedulaJuridica: activeCedula,
        legalName: activeLegalName,
      };

  return <PublicLegalDocView document={documentPayload} defaultLang="en" isPrivacyPolicy={false} />;
}
