import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    const document = await prisma.legalDocument.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        isPublished: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: "Documento legal no encontrado" },
        { status: 404 }
      );
    }

    const formatted = {
      ...document,
      applicableLaws: (() => {
        try {
          return JSON.parse(document.applicableLawsJson || "[]");
        } catch {
          return [];
        }
      })(),
    };

    return NextResponse.json({ success: true, document: formatted });
  } catch (error) {
    console.error("Error al obtener detalle de documento legal:", error);
    return NextResponse.json(
      { success: false, error: "Error al procesar la solicitud del documento" },
      { status: 500 }
    );
  }
}
