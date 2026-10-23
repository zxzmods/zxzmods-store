import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const documents = await prisma.legalDocument.findMany({
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
    });

    const formatted = documents.map((doc) => ({
      ...doc,
      applicableLaws: (() => {
        try {
          return JSON.parse(doc.applicableLawsJson || "[]");
        } catch {
          return [];
        }
      })(),
    }));

    const response = NextResponse.json({ success: true, documents: formatted });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
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
