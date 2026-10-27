import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { cleanDescriptionText } from "@/lib/products";

export async function POST(request: Request) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const {
      slug,
      category = "performance",
      titleEs,
      titleEn,
      badgeEs = "COMBO ESPECIAL",
      badgeEn = "SPECIAL COMBO",
      descriptionEs = "",
      descriptionEn = "",
      priceCRC = 0,
      originalPriceCRC = 0,
      installationPriceCRC = 0,
      discountPercent = 0,
      itemsJson = "[]",
      imageUrl = "/images/combos/placeholder.webp",
      featured = true,
      homeInstallationAvailable = true,
    } = body;

    if (!titleEs || !titleEn) {
      return NextResponse.json(
        { success: false, error: "Combo Spanish and English titles are required" },
        { status: 400 }
      );
    }

    const cleanSlug =
      slug ||
      titleEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const installLabour = body.installLabourCostCRC !== undefined
      ? Math.round(Number(body.installLabourCostCRC) || 0)
      : Math.round(Number(installationPriceCRC) || 0);
    const installProfit = body.installProfitCRC !== undefined ? Math.round(Number(body.installProfitCRC) || 0) : 0;
    const extraPartsJson = body.installExtraParts !== undefined
      ? JSON.stringify(body.installExtraParts)
      : typeof body.installExtraPartsJson === "string"
      ? body.installExtraPartsJson
      : "[]";

    let extraPartsSum = 0;
    try {
      const parsedParts = JSON.parse(extraPartsJson);
      if (Array.isArray(parsedParts)) {
        extraPartsSum = parsedParts.reduce((acc: number, pt: any) => acc + (Math.round(Number(pt.priceCRC)) || 0), 0);
      }
    } catch {}

    const calculatedInstallPrice = installLabour + extraPartsSum + installProfit;
    const finalInstallPrice = body.installationPriceCRC !== undefined
      ? Math.round(Number(body.installationPriceCRC) || 0)
      : calculatedInstallPrice > 0 ? calculatedInstallPrice : 0;

    const newCombo = await prisma.combo.create({
      data: {
        slug: cleanSlug,
        category,
        titleEs,
        titleEn,
        badgeEs,
        badgeEn,
        descriptionEs: cleanDescriptionText(descriptionEs),
        descriptionEn: cleanDescriptionText(descriptionEn),
        priceCRC: Math.round(Number(priceCRC) || 0),
        originalPriceCRC: Math.round(Number(originalPriceCRC) || 0),
        installationPriceCRC: finalInstallPrice,
        installationDurationMinutes: Math.max(15, Math.round(Number(body.installationDurationMinutes) || 60)),
        installLabourCostCRC: installLabour,
        installProfitCRC: installProfit,
        installExtraPartsJson: extraPartsJson,
        installationBreakdownJson: JSON.stringify({
          labourCostCRC: installLabour,
          extraPartsTotalCRC: extraPartsSum,
          profitCRC: installProfit,
          totalCostCRC: finalInstallPrice,
        }),
        discountPercent: Math.round(Number(discountPercent) || 0),
        itemsJson: typeof itemsJson === "string" ? itemsJson : JSON.stringify(itemsJson),
        parametersJson: body.parameters !== undefined
          ? JSON.stringify(body.parameters)
          : (typeof body.parametersJson === "string" ? body.parametersJson : JSON.stringify(body.parametersJson || [])),
        suggestedProductIdsJson: Array.isArray(body.suggestedProductIds)
          ? JSON.stringify(body.suggestedProductIds)
          : (typeof body.suggestedProductIdsJson === "string" ? body.suggestedProductIdsJson : "[]"),
        suggestedComboIdsJson: Array.isArray(body.suggestedComboIds)
          ? JSON.stringify(body.suggestedComboIds)
          : (typeof body.suggestedComboIdsJson === "string" ? body.suggestedComboIdsJson : "[]"),
        imageUrl,
        imagesJson: body.imagesJson !== undefined
          ? (typeof body.imagesJson === "string" ? body.imagesJson : JSON.stringify(body.imagesJson))
          : (Array.isArray(body.imgs) ? JSON.stringify(body.imgs) : (Array.isArray(body.images) ? JSON.stringify(body.images) : "[]")),
        uniqueProductJson: body.uniqueProduct !== undefined
          ? JSON.stringify(body.uniqueProduct)
          : (typeof body.uniqueProductJson === "string" ? body.uniqueProductJson : "{}"),
        featured: Boolean(featured),
        homeInstallationAvailable: Boolean(homeInstallationAvailable),
      },
    });

    await recordAuditLog({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: "CREATE_COMBO",
      entityType: "COMBO",
      entityId: newCombo.id,
      newData: {
        slug: newCombo.slug,
        titleEn: newCombo.titleEn,
        priceCRC: newCombo.priceCRC,
        installationPriceCRC: newCombo.installationPriceCRC,
      },
      details: `Combo ${newCombo.slug} created by ${auth.session.role} ${auth.session.email}`,
    });

    return NextResponse.json({ success: true, combo: newCombo });
  } catch (error: any) {
    console.error("[SYS_COMBO_CREATE_ERROR]:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "A combo with this slug already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create combo" },
      { status: 500 }
    );
  }
}
