import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customerAuth";
import { checkReviewEligibility, syncAggregateRating } from "@/lib/reviews";
import { checkRateLimit, createRateLimitResponse, getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const productSlug = searchParams.get("productSlug");
    const comboId = searchParams.get("comboId");
    const comboSlug = searchParams.get("comboSlug");

    // Resolve target item
    let resolvedProductId = productId;
    let resolvedComboId = comboId;

    if (!resolvedProductId && productSlug) {
      const prod = await prisma.product.findUnique({
        where: { slug: productSlug },
        select: { id: true },
      });
      if (prod) resolvedProductId = prod.id;
    }

    if (!resolvedProductId && !resolvedComboId && comboSlug) {
      const cmb = await prisma.combo.findUnique({
        where: { slug: comboSlug },
        select: { id: true },
      });
      if (cmb) resolvedComboId = cmb.id;
    }

    if (!resolvedProductId && !resolvedComboId) {
      return NextResponse.json(
        { success: false, error: "Identificador de producto o combo requerido" },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: {
        ...(resolvedProductId ? { productId: resolvedProductId } : { comboId: resolvedComboId }),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        orderId: true,
        productId: true,
        comboId: true,
        rating: true,
        title: true,
        comment: true,
        userName: true,
        verified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const totalCount = reviews.length;
    let averageRating = 0;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (totalCount > 0) {
      const sum = reviews.reduce((acc, r) => {
        const roundedStar = Math.max(1, Math.min(5, Math.round(r.rating)));
        distribution[roundedStar] = (distribution[roundedStar] || 0) + 1;
        return acc + r.rating;
      }, 0);
      averageRating = Math.round((sum / totalCount) * 10) / 10;
    }

    return NextResponse.json({
      success: true,
      reviews,
      stats: {
        totalCount,
        averageRating,
        distribution,
      },
    });
  } catch (error) {
    console.error("[GET_REVIEWS_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener reseñas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = checkRateLimit({
    key: `review_${ip}`,
    maxRequests: 5,
    windowMs: 5 * 60 * 1000,
  });
  if (!rate.success) return createRateLimitResponse(rate.resetMs);

  try {
    const session = await getCustomerSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Debes iniciar sesión para publicar una reseña",
          code: "NOT_AUTHENTICATED",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      productId,
      productSlug,
      comboId,
      comboSlug,
      rating,
      title,
      comment,
    } = body;

    const numericRating = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));
    const trimmedComment = typeof comment === "string" ? comment.trim() : "";

    if (!trimmedComment || trimmedComment.length < 3) {
      return NextResponse.json(
        { success: false, error: "El comentario de la reseña debe contener al menos 3 caracteres" },
        { status: 400 }
      );
    }

    // STRICT PURCHASE VERIFICATION
    const eligibility = await checkReviewEligibility({
      userId: session.userId,
      productId,
      productSlug,
      comboId,
      comboSlug,
    });

    if (!eligibility.eligible || !eligibility.completedOrderId) {
      return NextResponse.json(
        {
          success: false,
          error:
            eligibility.reason === "ORDER_NOT_COMPLETED"
              ? "Tu pedido aún no se encuentra completado y entregado. Podrás calificar una vez que recibas tus piezas."
              : "Solo clientes con una orden completada pueden calificar este artículo.",
          reason: eligibility.reason,
        },
        { status: 403 }
      );
    }

    // Fetch user profile for display name
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { displayName: true, email: true },
    });

    const displayName =
      user?.displayName?.trim() ||
      user?.email?.split("@")[0]?.trim() ||
      "Cliente Verificado";

    const targetProductId = eligibility.targetProduct?.id || null;
    const targetComboId = eligibility.targetCombo?.id || null;

    // Check if user already submitted a review for this item (Edit mode)
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: session.userId,
        ...(targetProductId ? { productId: targetProductId } : { comboId: targetComboId }),
      },
    });

    let savedReview;
    if (existingReview) {
      savedReview = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: numericRating,
          title: title ? String(title).trim() : null,
          comment: trimmedComment,
          userName: displayName,
          orderId: eligibility.completedOrderId,
          verified: true,
        },
      });
    } else {
      savedReview = await prisma.review.create({
        data: {
          userId: session.userId,
          orderId: eligibility.completedOrderId,
          productId: targetProductId,
          comboId: targetComboId,
          rating: numericRating,
          title: title ? String(title).trim() : null,
          comment: trimmedComment,
          userName: displayName,
          verified: true,
        },
      });
    }

    // Recompute and persist aggregate rating
    const stats = await syncAggregateRating({
      productId: targetProductId,
      comboId: targetComboId,
    });

    return NextResponse.json({
      success: true,
      review: savedReview,
      stats,
      message: "Reseña guardada exitosamente",
    });
  } catch (error) {
    console.error("[POST_REVIEW_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al guardar la reseña" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("id");

    if (!reviewId) {
      return NextResponse.json({ success: false, error: "ID de reseña requerido" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ success: false, error: "Reseña no encontrada" }, { status: 404 });
    }

    // Must be review author or master/staff
    if (review.userId !== session.userId && session.role !== "MASTER" && session.role !== "STAFF") {
      return NextResponse.json({ success: false, error: "Permiso denegado" }, { status: 403 });
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    await syncAggregateRating({
      productId: review.productId,
      comboId: review.comboId,
    });

    return NextResponse.json({ success: true, message: "Reseña eliminada" });
  } catch (error) {
    console.error("[DELETE_REVIEW_ERROR]:", error);
    return NextResponse.json({ success: false, error: "Error al eliminar reseña" }, { status: 500 });
  }
}
