import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GLOBAL_CEDULA_JURIDICA, GLOBAL_LEGAL_NAME } from "@/config/company";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [documents, workshop] = await Promise.all([
      prisma.legalDocument.findMany({
        where: { isPublished: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          slug: true,
          order: true,
          category: true,
          titleEs: true,
          titleEn: true,
          badgeEs: true,
          badgeEn: true,
          summaryEs: true,
          summaryEn: true,
          jurisdiction: true,
          lastUpdated: true,
          applicableLawsJson: true,
          isPublished: true,
          updatedAt: true,
        },
      }),
      prisma.workshopInfo.findUnique({ where: { id: "zxz-hq" } }).catch(() => null),
    ]);

    const activeCedula = workshop?.cedulaJuridica || GLOBAL_CEDULA_JURIDICA || "3-101-436132";
    const activeLegalName = workshop?.legalName || GLOBAL_LEGAL_NAME || "ZxZ Mods Costa Rica S.A.";

    const injectDynamicIdentity = (text: string) =>
      String(text || "")
        .replace(/3-101-XXXXXX/g, activeCedula)
        .replace(/3-101-436132/g, activeCedula);

    const formatted = documents.map((doc) => ({
      ...doc,
      summaryEs: injectDynamicIdentity(doc.summaryEs),
      summaryEn: injectDynamicIdentity(doc.summaryEn),
      applicableLaws: (() => {
        try {
          return JSON.parse(doc.applicableLawsJson || "[]");
        } catch {
          return [];
        }
      })(),
    }));

    const response = NextResponse.json({
      success: true,
      documents: formatted,
      company: {
        legalName: activeLegalName,
        cedulaJuridica: activeCedula,
      },
    });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120"
    );
    return response;
  } catch (error) {
    console.error("Error al obtener documentos legales:", error);
    return NextResponse.json(
      { success: false, error: "No se pudieron obtener los documentos legales" },
      { status: 500 }
    );
  }
}
