import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { getBarrialCrConfig, getBarrialCrRides, DEFAULT_BARRIALCR_CONFIG } from "@/lib/barrialcr";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const [config, rides] = await Promise.all([
      getBarrialCrConfig(),
      getBarrialCrRides(),
    ]);
    return NextResponse.json({
      success: true,
      config,
      rides,
    });
  } catch (error) {
    console.error("[SYS_BARRIALCR_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load BarrialCR config" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const {
      title,
      subtitleEs,
      subtitleEn,
      descriptionEs,
      descriptionEn,
      videoUrl,
      posterImageUrl,
      logoUrl,
      whatsappGroupLink,
      whatsappBtnTextEs,
      whatsappBtnTextEn,
      isActive,
    } = body;

    const dataToUpdate: Record<string, any> = {};

    if (title !== undefined) dataToUpdate.title = String(title).trim() || "BarrialCR";
    if (subtitleEs !== undefined) dataToUpdate.subtitleEs = String(subtitleEs).trim();
    if (subtitleEn !== undefined) dataToUpdate.subtitleEn = String(subtitleEn).trim();
    if (descriptionEs !== undefined) dataToUpdate.descriptionEs = String(descriptionEs).trim();
    if (descriptionEn !== undefined) dataToUpdate.descriptionEn = String(descriptionEn).trim();
    if (videoUrl !== undefined) dataToUpdate.videoUrl = String(videoUrl).trim();
    if (posterImageUrl !== undefined) dataToUpdate.posterImageUrl = String(posterImageUrl).trim();
    if (logoUrl !== undefined) dataToUpdate.logoUrl = String(logoUrl).trim();
    if (whatsappGroupLink !== undefined) dataToUpdate.whatsappGroupLink = String(whatsappGroupLink).trim();
    if (whatsappBtnTextEs !== undefined) dataToUpdate.whatsappBtnTextEs = String(whatsappBtnTextEs).trim();
    if (whatsappBtnTextEn !== undefined) dataToUpdate.whatsappBtnTextEn = String(whatsappBtnTextEn).trim();
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);

    const updated = await prisma.barrialCrConfig.upsert({
      where: { id: "barrialcr-main" },
      update: dataToUpdate,
      create: {
        ...DEFAULT_BARRIALCR_CONFIG,
        ...dataToUpdate,
        id: "barrialcr-main",
      },
    });

    return NextResponse.json({
      success: true,
      config: updated,
    });
  } catch (error) {
    console.error("[SYS_BARRIALCR_PUT_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update BarrialCR configuration" },
      { status: 500 }
    );
  }
}
