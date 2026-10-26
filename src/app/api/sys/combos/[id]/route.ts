import { NextResponse } from "next/server";
import { requireStealthSession, verifyMasterElevationPassword } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { cleanDescriptionText } from "@/lib/products";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const comboId = params.id;
    const body = await request.json().catch(() => ({}));

    const existingCombo = await prisma.combo.findUnique({
      where: { id: comboId },
    });

    if (!existingCombo) {
      return NextResponse.json({ success: false, error: "Combo not found" }, { status: 404 });
    }

    // Role check: Only MASTER can alter base priceCRC
    if (
      body.priceCRC !== undefined &&
      Math.round(Number(body.priceCRC)) !== existingCombo.priceCRC
    ) {
      if (auth.session.role !== "MASTER") {
        return NextResponse.json(
          {
            success: false,
            error: "UNAUTHORIZED_PRICE_MODIFICATION",
            message: "Only the Master profile can edit combo base prices.",
          },
          { status: 403 }
        );
      }
    }

    const updateData: any = {};
    if (body.titleEs !== undefined) updateData.titleEs = body.titleEs;
    if (body.titleEn !== undefined) updateData.titleEn = body.titleEn;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.badgeEs !== undefined) updateData.badgeEs = body.badgeEs;
    if (body.badgeEn !== undefined) updateData.badgeEn = body.badgeEn;
    if (body.descriptionEs !== undefined) updateData.descriptionEs = cleanDescriptionText(body.descriptionEs);
    if (body.descriptionEn !== undefined) updateData.descriptionEn = cleanDescriptionText(body.descriptionEn);
    if (body.originalPriceCRC !== undefined) updateData.originalPriceCRC = Math.round(Number(body.originalPriceCRC));
    if (body.discountPercent !== undefined) updateData.discountPercent = Math.round(Number(body.discountPercent));
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.imagesJson !== undefined) {
      updateData.imagesJson = typeof body.imagesJson === "string" ? body.imagesJson : JSON.stringify(body.imagesJson);
    } else if (body.imgs !== undefined) {
      updateData.imagesJson = JSON.stringify(Array.isArray(body.imgs) ? body.imgs : [body.imgs]);
    } else if (body.images !== undefined) {
      updateData.imagesJson = JSON.stringify(Array.isArray(body.images) ? body.images : [body.images]);
    }
    if (body.itemsJson !== undefined) {
      updateData.itemsJson = typeof body.itemsJson === "string" ? body.itemsJson : JSON.stringify(body.itemsJson);
    }
    if (body.parameters !== undefined) {
      updateData.parametersJson = JSON.stringify(body.parameters);
    } else if (body.parametersJson !== undefined) {
      updateData.parametersJson = typeof body.parametersJson === "string" ? body.parametersJson : JSON.stringify(body.parametersJson);
    }
    if (body.featured !== undefined) updateData.featured = Boolean(body.featured);
    if (body.homeInstallationAvailable !== undefined) updateData.homeInstallationAvailable = Boolean(body.homeInstallationAvailable);
    if (body.isArchived !== undefined) updateData.isArchived = Boolean(body.isArchived);

    if (body.suggestedProductIds !== undefined) {
      updateData.suggestedProductIdsJson = Array.isArray(body.suggestedProductIds) ? JSON.stringify(body.suggestedProductIds) : String(body.suggestedProductIds);
    } else if (body.suggestedProductIdsJson !== undefined) {
      updateData.suggestedProductIdsJson = typeof body.suggestedProductIdsJson === "string" ? body.suggestedProductIdsJson : JSON.stringify(body.suggestedProductIdsJson);
    }
    if (body.suggestedComboIds !== undefined) {
      updateData.suggestedComboIdsJson = Array.isArray(body.suggestedComboIds) ? JSON.stringify(body.suggestedComboIds) : String(body.suggestedComboIds);
    } else if (body.suggestedComboIdsJson !== undefined) {
      updateData.suggestedComboIdsJson = typeof body.suggestedComboIdsJson === "string" ? body.suggestedComboIdsJson : JSON.stringify(body.suggestedComboIdsJson);
    }

    if (body.priceCRC !== undefined && auth.session.role === "MASTER") {
      updateData.priceCRC = Math.round(Number(body.priceCRC));
    }

    // Installation Breakdown extraction
    let hasInstallUpdate = false;
    let installLabour = existingCombo.installLabourCostCRC ?? 0;
    if (body.installLabourCostCRC !== undefined) {
      installLabour = Math.round(Number(body.installLabourCostCRC) || 0);
      updateData.installLabourCostCRC = installLabour;
      hasInstallUpdate = true;
    }
    let installProfit = existingCombo.installProfitCRC ?? 0;
    if (body.installProfitCRC !== undefined) {
      installProfit = Math.round(Number(body.installProfitCRC) || 0);
      updateData.installProfitCRC = installProfit;
      hasInstallUpdate = true;
    }
    let extraPartsJson = existingCombo.installExtraPartsJson ?? "[]";
    if (body.installExtraParts !== undefined) {
      extraPartsJson = JSON.stringify(body.installExtraParts);
      updateData.installExtraPartsJson = extraPartsJson;
      hasInstallUpdate = true;
    } else if (body.installExtraPartsJson !== undefined) {
      extraPartsJson = typeof body.installExtraPartsJson === "string" ? body.installExtraPartsJson : JSON.stringify(body.installExtraPartsJson);
      updateData.installExtraPartsJson = extraPartsJson;
      hasInstallUpdate = true;
    }

    let extraPartsSum = 0;
    try {
      const parsedParts = JSON.parse(extraPartsJson);
      if (Array.isArray(parsedParts)) {
        extraPartsSum = parsedParts.reduce((acc: number, pt: any) => acc + (Math.round(Number(pt.priceCRC)) || 0), 0);
      }
    } catch {}

    const calculatedInstallPrice = installLabour + extraPartsSum + installProfit;

    if (body.installationDurationMinutes !== undefined) {
      updateData.installationDurationMinutes = Math.max(15, Math.round(Number(body.installationDurationMinutes) || 60));
    }

    // Staff and Master can both edit installationPriceCRC
    if (body.installationPriceCRC !== undefined) {
      updateData.installationPriceCRC = Math.round(Number(body.installationPriceCRC));
    } else if (hasInstallUpdate) {
      updateData.installationPriceCRC = calculatedInstallPrice;
    }

    if (hasInstallUpdate || updateData.installationPriceCRC !== undefined) {
      updateData.installationBreakdownJson = JSON.stringify({
        labourCostCRC: installLabour,
        extraPartsTotalCRC: extraPartsSum,
        profitCRC: installProfit,
        totalCostCRC: updateData.installationPriceCRC !== undefined ? updateData.installationPriceCRC : calculatedInstallPrice,
      });
    }

    const updatedCombo = await prisma.combo.update({
      where: { id: comboId },
      data: updateData,
    });

    await recordAuditLog({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: "UPDATE_COMBO",
      entityType: "COMBO",
      entityId: comboId,
      oldData: {
        priceCRC: existingCombo.priceCRC,
        installationPriceCRC: existingCombo.installationPriceCRC,
        isArchived: existingCombo.isArchived,
      },
      newData: {
        priceCRC: updatedCombo.priceCRC,
        installationPriceCRC: updatedCombo.installationPriceCRC,
        isArchived: updatedCombo.isArchived,
      },
      details: `Combo ${existingCombo.slug} updated by ${auth.session.role} ${auth.session.email}`,
    });

    return NextResponse.json({ success: true, combo: updatedCombo });
  } catch (error) {
    console.error("[SYS_COMBO_PATCH_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update combo" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const comboId = params.id;
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));
    const action = body.action || searchParams.get("action") || "eliminate";

    const existing = await prisma.combo.findUnique({ where: { id: comboId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Combo no encontrado." }, { status: 404 });
    }

    // ARCHIVE COMBO ACTION (Staff & Master)
    if (action === "archive") {
      const archived = await prisma.combo.update({
        where: { id: comboId },
        data: { isArchived: true },
      });

      await recordAuditLog({
        actorId: auth.session.userId,
        actorEmail: auth.session.email,
        actorRole: auth.session.role,
        action: "UPDATE_COMBO",
        entityType: "COMBO",
        entityId: comboId,
        oldData: { slug: existing.slug, isArchived: false },
        newData: { slug: existing.slug, isArchived: true },
        details: `Combo ${existing.slug} archivado por ${auth.session.role} ${auth.session.email}`,
      });

      return NextResponse.json({ success: true, archived: true, combo: archived });
    }

    // UNARCHIVE / RESTORE COMBO ACTION (Staff & Master)
    if (action === "unarchive") {
      const restored = await prisma.combo.update({
        where: { id: comboId },
        data: { isArchived: false },
      });

      await recordAuditLog({
        actorId: auth.session.userId,
        actorEmail: auth.session.email,
        actorRole: auth.session.role,
        action: "UPDATE_COMBO",
        entityType: "COMBO",
        entityId: comboId,
        oldData: { slug: existing.slug, isArchived: true },
        newData: { slug: existing.slug, isArchived: false },
        details: `Combo ${existing.slug} desarchivado por ${auth.session.role} ${auth.session.email}`,
      });

      return NextResponse.json({ success: true, unarchived: true, combo: restored });
    }

    // ELIMINATE COMBO PERMANENTLY ACTION (Requires Master Password with Brute-Force Defense)
    if (action === "eliminate") {
      const forwarded = request.headers.get("x-forwarded-for");
      const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

      const elevation = await verifyMasterElevationPassword({
        ip,
        password: body.masterPassword,
        actorId: auth.session.userId,
        actorEmail: auth.session.email,
        actionDescription: `Eliminación permanente del combo ${existing.slug}`,
      });

      if (!elevation.success) {
        return NextResponse.json(
          { success: false, error: elevation.error, retryAfterSeconds: elevation.retryAfterSeconds },
          { status: elevation.status }
        );
      }

      // Hard delete combo from database
      await prisma.combo.delete({ where: { id: comboId } });

      await recordAuditLog({
        actorId: auth.session.userId,
        actorEmail: auth.session.email,
        actorRole: auth.session.role,
        action: "DELETE_COMBO",
        entityType: "COMBO",
        entityId: comboId,
        oldData: { slug: existing.slug, titleEs: existing.titleEs, titleEn: existing.titleEn },
        newData: null,
        details: `Combo ${existing.slug} eliminado definitivamente del catálogo con contraseña Master por ${auth.session.role} ${auth.session.email}`,
      });

      return NextResponse.json({ success: true, eliminated: true, comboId });
    }

    return NextResponse.json(
      { success: false, error: "Acción no válida. Se esperaba 'archive', 'unarchive' o 'eliminate'." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[SYS_COMBO_DELETE_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al procesar la solicitud del combo." },
      { status: 500 }
    );
  }
}
