import { prisma } from "@/lib/prisma";

export interface ReviewEligibilityResult {
  eligible: boolean;
  reason?: "NOT_AUTHENTICATED" | "NOT_PURCHASED" | "ORDER_NOT_COMPLETED" | "OK";
  completedOrderId?: string;
  orderNumber?: string;
  targetProduct?: { id: string; slug: string; sku: string; nameEs: string; nameEn: string } | null;
  targetCombo?: { id: string; slug: string; titleEs: string; titleEn: string } | null;
  existingReview?: {
    id: string;
    rating: number;
    title: string | null;
    comment: string;
    createdAt: string;
    updatedAt: string;
    userName: string | null;
    orderId: string;
  } | null;
}

/**
 * Checks whether an order item matches the specified product or combo.
 */
export function itemMatchesTarget(
  item: any,
  target: {
    productId?: string | null;
    productSlug?: string | null;
    productSku?: string | null;
    comboId?: string | null;
    comboSlug?: string | null;
  }
): boolean {
  if (!item || typeof item !== "object") return false;

  const itemId = String(item.id || "").trim();
  const itemSlug = String(item.slug || "").trim().toLowerCase();
  const itemSku = String(item.sku || "").trim().toLowerCase();

  // 1. Check Product match
  if (target.productId || target.productSlug || target.productSku) {
    if (target.productId && (itemId === target.productId || itemId.startsWith(target.productId))) {
      return true;
    }
    if (target.productSlug && itemSlug === target.productSlug.toLowerCase()) {
      return true;
    }
    if (target.productSku && itemSku && itemSku === target.productSku.toLowerCase()) {
      return true;
    }
  }

  // 2. Check Combo match
  if (target.comboId || target.comboSlug) {
    if (target.comboId && itemId === target.comboId) {
      return true;
    }
    if (target.comboSlug && itemSlug === target.comboSlug.toLowerCase()) {
      return true;
    }
    if (item.type === "combo" && (
      (target.comboId && itemId.includes(target.comboId)) ||
      (target.comboSlug && itemSlug.includes(target.comboSlug.toLowerCase()))
    )) {
      return true;
    }
  }

  return false;
}

/**
 * Verifies if a user is eligible to submit a review for a specific product or combo.
 * Must have an authenticated session and at least one order with status 'COMPLETED'
 * containing the target item.
 */
export async function checkReviewEligibility(params: {
  userId: string | null | undefined;
  productId?: string | null;
  comboId?: string | null;
  productSlug?: string | null;
  comboSlug?: string | null;
}): Promise<ReviewEligibilityResult> {
  const { userId, productId, comboId, productSlug, comboSlug } = params;

  if (!userId) {
    return { eligible: false, reason: "NOT_AUTHENTICATED" };
  }

  // Resolve target Product or Combo from DB
  let resolvedProduct: { id: string; slug: string; sku: string; nameEs: string; nameEn: string } | null = null;
  let resolvedCombo: { id: string; slug: string; titleEs: string; titleEn: string } | null = null;

  if (productId || productSlug) {
    resolvedProduct = await prisma.product.findFirst({
      where: {
        OR: [
          ...(productId ? [{ id: productId }] : []),
          ...(productSlug ? [{ slug: productSlug }] : []),
        ],
      },
      select: { id: true, slug: true, sku: true, nameEs: true, nameEn: true },
    });
  }

  if (!resolvedProduct && (comboId || comboSlug)) {
    resolvedCombo = await prisma.combo.findFirst({
      where: {
        OR: [
          ...(comboId ? [{ id: comboId }] : []),
          ...(comboSlug ? [{ slug: comboSlug }] : []),
        ],
      },
      select: { id: true, slug: true, titleEs: true, titleEn: true },
    });
  }

  if (!resolvedProduct && !resolvedCombo) {
    return { eligible: false, reason: "NOT_PURCHASED" };
  }

  // Look for any existing review submitted by this user for this product or combo
  const existingReview = await prisma.review.findFirst({
    where: {
      userId,
      ...(resolvedProduct ? { productId: resolvedProduct.id } : { comboId: resolvedCombo!.id }),
    },
    select: {
      id: true,
      rating: true,
      title: true,
      comment: true,
      createdAt: true,
      updatedAt: true,
      userName: true,
      orderId: true,
    },
  });

  const formattedExistingReview = existingReview
    ? {
        ...existingReview,
        createdAt: existingReview.createdAt.toISOString(),
        updatedAt: existingReview.updatedAt.toISOString(),
      }
    : null;

  // Fetch all orders for this user to inspect purchases
  const userOrders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      itemsJson: true,
    },
  });

  const targetCriteria = {
    productId: resolvedProduct?.id,
    productSlug: resolvedProduct?.slug,
    productSku: resolvedProduct?.sku,
    comboId: resolvedCombo?.id,
    comboSlug: resolvedCombo?.slug,
  };

  let matchingCompletedOrder: { id: string; orderNumber: string } | null = null;
  let hasIncompleteOrder = false;

  for (const order of userOrders) {
    let items: any[] = [];
    try {
      items = JSON.parse(order.itemsJson || "[]");
    } catch {
      items = [];
    }
    if (!Array.isArray(items)) items = [];

    const containsItem = items.some((it) => itemMatchesTarget(it, targetCriteria));
    if (containsItem) {
      const isCompleted = String(order.status || "").toUpperCase() === "COMPLETED";
      if (isCompleted) {
        if (!matchingCompletedOrder) {
          matchingCompletedOrder = { id: order.id, orderNumber: order.orderNumber };
        }
      } else {
        hasIncompleteOrder = true;
      }
    }
  }

  if (matchingCompletedOrder) {
    return {
      eligible: true,
      reason: "OK",
      completedOrderId: matchingCompletedOrder.id,
      orderNumber: matchingCompletedOrder.orderNumber,
      targetProduct: resolvedProduct,
      targetCombo: resolvedCombo,
      existingReview: formattedExistingReview,
    };
  }

  return {
    eligible: false,
    reason: hasIncompleteOrder ? "ORDER_NOT_COMPLETED" : "NOT_PURCHASED",
    targetProduct: resolvedProduct,
    targetCombo: resolvedCombo,
    existingReview: formattedExistingReview,
  };
}

/**
 * Recomputes aggregate review rating for a product or combo and syncs it to the database.
 */
export async function syncAggregateRating(target: {
  productId?: string | null;
  comboId?: string | null;
}): Promise<{ stars: number; count: number }> {
  const { productId, comboId } = target;

  if (!productId && !comboId) {
    return { stars: 0, count: 0 };
  }

  const reviews = await prisma.review.findMany({
    where: {
      ...(productId ? { productId } : { comboId: comboId! }),
    },
    select: { rating: true },
  });

  const count = reviews.length;
  let stars = 0;

  if (count > 0) {
    const total = reviews.reduce((acc, r) => acc + Math.max(1, Math.min(5, r.rating)), 0);
    stars = Math.round((total / count) * 10) / 10; // 1 decimal place e.g. 4.8
  }

  const reviewsPayload = count > 0 ? JSON.stringify({ stars, count }) : "";

  if (productId) {
    await prisma.product.update({
      where: { id: productId },
      data: { reviews: reviewsPayload },
    });
  } else if (comboId) {
    await prisma.combo.update({
      where: { id: comboId },
      data: { reviews: reviewsPayload },
    });
  }

  return { stars, count };
}
