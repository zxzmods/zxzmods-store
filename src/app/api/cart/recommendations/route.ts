import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAllProducts, ProductItem, isPlatformOrVehicleMatch } from "@/lib/products";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId")?.trim() || "";
    const cartProductIdsParam = searchParams.get("cartProductIds") || "";
    const limit = Math.max(1, Math.min(10, Number(searchParams.get("limit")) || 5));

    // Parse excluded product IDs (current item + items in cart)
    const excludedIds = new Set<string>();
    if (productId) {
      excludedIds.add(productId.toLowerCase());
    }
    if (cartProductIdsParam) {
      cartProductIdsParam
        .split(",")
        .map((id) => id.trim().toLowerCase())
        .filter(Boolean)
        .forEach((id) => excludedIds.add(id));
    }

    // 1. Fetch catalog products (DB products merged with JSON catalog)
    const allProducts = await getAllProducts();

    // Find reference product if productId was passed
    const targetProduct = productId
      ? allProducts.find(
          (p) =>
            p.id.toLowerCase() === productId.toLowerCase() ||
            p.slug.toLowerCase() === productId.toLowerCase() ||
            ((p as any).sku && String((p as any).sku).toLowerCase() === productId.toLowerCase())
        )
      : null;

    if (targetProduct) {
      excludedIds.add(targetProduct.id.toLowerCase());
      if (targetProduct.slug) excludedIds.add(targetProduct.slug.toLowerCase());
      if ((targetProduct as any).sku) excludedIds.add(String((targetProduct as any).sku).toLowerCase());
    }

    // 2. Score candidates
    const scoredCandidates = allProducts
      .filter((candidate) => {
        const cId = candidate.id.toLowerCase();
        const cSlug = candidate.slug ? candidate.slug.toLowerCase() : "";
        const cSku = (candidate as any).sku ? String((candidate as any).sku).toLowerCase() : "";
        return !excludedIds.has(cId) && !excludedIds.has(cSlug) && !excludedIds.has(cSku);
      })
      .map((candidate) => {
        let score = 0;

        // A. Target Product explicit relatedProductIds match
        if (targetProduct?.relatedProductIds && Array.isArray(targetProduct.relatedProductIds)) {
          const isExplicit = targetProduct.relatedProductIds.some((relId) => {
            const r = String(relId).toLowerCase();
            return (
              r === candidate.id.toLowerCase() ||
              r === candidate.slug?.toLowerCase() ||
              r === String((candidate as any).sku || "").toLowerCase()
            );
          });
          if (isExplicit) score += 100;
        }

        // B. Reverse check: does candidate relate to target product?
        if (candidate.relatedProductIds && Array.isArray(candidate.relatedProductIds) && targetProduct) {
          const isReverseExplicit = candidate.relatedProductIds.some((relId) => {
            const r = String(relId).toLowerCase();
            return (
              r === targetProduct.id.toLowerCase() ||
              r === targetProduct.slug?.toLowerCase() ||
              r === String((targetProduct as any).sku || "").toLowerCase()
            );
          });
          if (isReverseExplicit) score += 80;
        }

        // C. Common category synergy
        if (targetProduct?.category && candidate.category) {
          const commonCat = targetProduct.category.some((c) => candidate.category.includes(c));
          if (commonCat) score += 40;
        }

        // D. Vehicle compatibility match
        if (targetProduct?.comp && candidate.comp) {
          const sharesVehicle = targetProduct.comp.some((tComp) =>
            candidate.comp.some((cComp) => isPlatformOrVehicleMatch(tComp, cComp))
          );
          if (sharesVehicle) score += 30;
        }

        // E. In Stock bonus
        if (
          candidate.supplierStockStatus === "IN_STOCK" ||
          candidate.supplierStockStatus === "IN_STOCK_US" ||
          candidate.supplierStockStatus === "IN_STOCK_CR"
        ) {
          score += 15;
        }

        return { candidate, score };
      });

    // 3. Sort by score descending and take top N
    scoredCandidates.sort((a, b) => b.score - a.score);
    const recommended = scoredCandidates.slice(0, limit).map((sc) => sc.candidate);

    return NextResponse.json({
      success: true,
      count: recommended.length,
      products: recommended,
    });
  } catch (error: any) {
    console.error("Cart recommendations API error:", error);
    return NextResponse.json(
      { success: false, error: "Error fetching recommendations", products: [] },
      { status: 500 }
    );
  }
}
