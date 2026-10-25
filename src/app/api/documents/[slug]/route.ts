import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GLOBAL_CEDULA_JURIDICA, GLOBAL_LEGAL_NAME } from "@/config/company";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug?.trim();

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Identificador de documento no especificado" },
        { status: 400 }
      );
    }

    const [document, workshop] = await Promise.all([
      prisma.legalDocument.findFirst({
        where: {
          OR: [{ slug }, { id: slug }],
          isPublished: true,
        },
      }),
      prisma.workshopInfo.findUnique({ where: { id: "zxz-hq" } }).catch(() => null),
    ]);

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Documento legal no encontrado" },
        { status: 404 }
      );
    }

    const activeCedula = workshop?.cedulaJuridica || GLOBAL_CEDULA_JURIDICA || "3-101-436132";
    const activeLegalName = workshop?.legalName || GLOBAL_LEGAL_NAME || "ZxZ Mods Costa Rica S.A.";

    const injectDynamicIdentity = (text: string) =>
      String(text || "")
        .replace(/3-101-XXXXXX/g, activeCedula)
        .replace(/3-101-436132/g, activeCedula);

    const formatted = {
      ...document,
      summaryEs: injectDynamicIdentity(document.summaryEs),
      summaryEn: injectDynamicIdentity(document.summaryEn),
      contentEs: injectDynamicIdentity(document.contentEs),
      contentEn: injectDynamicIdentity(document.contentEn),
      cedulaJuridica: activeCedula,
      legalName: activeLegalName,
      applicableLaws: (() => {
        try {
          return JSON.parse(document.applicableLawsJson || "[]");
        } catch {
          return [];
        }
      })(),
    };

    return NextResponse.json({
      success: true,
      document: formatted,
      company: {
        legalName: activeLegalName,
        cedulaJuridica: activeCedula,
      },
    });
  } catch (error) {
    console.error("Error al obtener detalle de documento legal:", error);
    return NextResponse.json(
      { success: false, error: "Error al procesar la solicitud del documento" },
      { status: 500 }
    );
  }
}
