import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStealthSession("MASTER");
  if (!auth.authorized) return auth.response;

  try {
    const items = await prisma.homePageItem.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error: any) {
    console.error("[SYS_HOMEPAGE_ITEMS_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load homepage items" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireStealthSession("MASTER");
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const {
      type = "PRODUCT",
      titleEs,
      titleEn,
      category,
      descriptionEs = "",
      descriptionEn = "",
      redirectUrl,
      mediaUrl,
      videoUrl = "",
      relatedItemsJson = null,
      order = 0,
      isActive = true,
    } = body;

    if (!titleEs?.trim()) {
      return NextResponse.json(
        { success: false, error: "El título en español es requerido" },
        { status: 400 }
      );
    }

    if (!category?.trim()) {
      return NextResponse.json(
        { success: false, error: "La categoría es requerida" },
        { status: 400 }
      );
    }

    if (!redirectUrl?.trim()) {
      return NextResponse.json(
        { success: false, error: "La URL de redirección es requerida" },
        { status: 400 }
      );
    }

    if (!mediaUrl?.trim()) {
      return NextResponse.json(
        { success: false, error: "La URL del recurso multimedia (imagen/video) es requerida" },
        { status: 400 }
      );
    }

    const cleanType = String(type).toUpperCase() === "VIDEO" ? "VIDEO" : "PRODUCT";

    const newItem = await prisma.homePageItem.create({
      data: {
        type: cleanType,
        titleEs: titleEs.trim(),
        titleEn: (titleEn || titleEs).trim(),
        category: category.trim(),
        descriptionEs: descriptionEs.trim(),
        descriptionEn: (descriptionEn || descriptionEs).trim(),
        redirectUrl: redirectUrl.trim(),
        mediaUrl: mediaUrl.trim(),
        videoUrl: videoUrl ? videoUrl.trim() : null,
        relatedItemsJson: relatedItemsJson ? String(relatedItemsJson).trim() : null,
        order: Number(order) || 0,
        isActive: Boolean(isActive),
      },
    });

    await recordAuditLog({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: "CREATE_HOMEPAGE_ITEM",
      entityType: "HOMEPAGE_ITEM",
      entityId: newItem.id,
      newData: {
        type: newItem.type,
        titleEs: newItem.titleEs,
        category: newItem.category,
        redirectUrl: newItem.redirectUrl,
      },
      details: `Created home page ${newItem.type}: "${newItem.titleEs}" by ${auth.session.role} ${auth.session.email}`,
    });

    return NextResponse.json({
      success: true,
      item: newItem,
    });
  } catch (error: any) {
    console.error("[SYS_HOMEPAGE_ITEMS_POST_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create homepage item" },
      { status: 500 }
    );
  }
}
