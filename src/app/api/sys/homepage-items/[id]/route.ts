import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireStealthSession("MASTER");
  if (!auth.authorized) return auth.response;

  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.homePageItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Elemento de inicio no encontrado" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (body.type !== undefined) {
      updateData.type = String(body.type).toUpperCase() === "VIDEO" ? "VIDEO" : "PRODUCT";
    }
    if (body.titleEs !== undefined) updateData.titleEs = String(body.titleEs).trim();
    if (body.titleEn !== undefined) updateData.titleEn = String(body.titleEn).trim();
    if (body.category !== undefined) updateData.category = String(body.category).trim();
    if (body.descriptionEs !== undefined) updateData.descriptionEs = String(body.descriptionEs).trim();
    if (body.descriptionEn !== undefined) updateData.descriptionEn = String(body.descriptionEn).trim();
    if (body.redirectUrl !== undefined) updateData.redirectUrl = String(body.redirectUrl).trim();
    if (body.mediaUrl !== undefined) updateData.mediaUrl = String(body.mediaUrl).trim();
    if (body.videoUrl !== undefined) updateData.videoUrl = body.videoUrl ? String(body.videoUrl).trim() : null;
    if (body.relatedItemsJson !== undefined) updateData.relatedItemsJson = body.relatedItemsJson ? String(body.relatedItemsJson).trim() : null;
    if (body.order !== undefined) updateData.order = Number(body.order) || 0;
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);

    const updated = await prisma.homePageItem.update({
      where: { id },
      data: updateData,
    });

    await recordAuditLog({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: "UPDATE_HOMEPAGE_ITEM",
      entityType: "HOMEPAGE_ITEM",
      entityId: updated.id,
      oldData: existing,
      newData: updated,
      details: `Updated home page ${updated.type}: "${updated.titleEs}" by ${auth.session.role} ${auth.session.email}`,
    });

    return NextResponse.json({
      success: true,
      item: updated,
    });
  } catch (error: any) {
    console.error("[SYS_HOMEPAGE_ITEMS_PATCH_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update homepage item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireStealthSession("MASTER");
  if (!auth.authorized) return auth.response;

  try {
    const { id } = params;

    const existing = await prisma.homePageItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Elemento de inicio no encontrado" },
        { status: 404 }
      );
    }

    await prisma.homePageItem.delete({
      where: { id },
    });

    await recordAuditLog({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: "DELETE_HOMEPAGE_ITEM",
      entityType: "HOMEPAGE_ITEM",
      entityId: id,
      oldData: existing,
      details: `Deleted home page ${existing.type}: "${existing.titleEs}" by ${auth.session.role} ${auth.session.email}`,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("[SYS_HOMEPAGE_ITEMS_DELETE_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete homepage item" },
      { status: 500 }
    );
  }
}
