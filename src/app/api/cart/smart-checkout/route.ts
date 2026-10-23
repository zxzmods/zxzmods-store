import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAllProducts, ProductItem, isPlatformOrVehicleMatch } from "@/lib/products";
import { findProductForComboItem } from "@/lib/comboAvailability";

export interface ComboSwapOpportunity {
  comboId: string;
  comboSlug: string;
  comboTitleEs: string;
  comboTitleEn: string;
  comboBadgeEs: string;
  comboBadgeEn: string;
  comboPriceCRC: number;
  comboOriginalPriceCRC: number;
  discountPercent: number;
  imageUrl: string;
  matchingCartItemIds: string[];
  matchingCartItemTitles: string[];
  totalComponentsCount: number;
  matchingComponentsCount: number;
  missingComponentsTitles: string[];
  cartMatchingCostCRC: number;
  savingsCRC: number;
  isCompleteMatch: boolean;
  recommendationReasonEs: string;
  recommendationReasonEn: string;
}

export interface RelatedPartSuggestion {
  product: ProductItem;
  reasonEs: string;
  reasonEn: string;
  relatedCartItemTitles: string[];
}

export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const { items = [] } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: true,
        hasOptimization: false,
        comboSuggestions: [],
        relatedSuggestions: [],
      });
    }

    // 1. Fetch catalog products and active Combos
    const [allProducts, combos] = await Promise.all([
      getAllProducts(),
      prisma.combo.findMany({
        where: { isArchived: false },
      }),
    ]);

    // Map cart product identifiers
    const cartProductTokens = new Map<string, any>(); // key: normalized ID/SKU/slug -> cartItem
    items.forEach((item) => {
      const rawId = String(item.id).split("__")[0].toLowerCase();
      cartProductTokens.set(rawId, item);
      if (item.sku) cartProductTokens.set(String(item.sku).toLowerCase(), item);
      if (item.slug) cartProductTokens.set(String(item.slug).toLowerCase(), item);
    });

    // 2. Evaluate Combo Swaps
    const comboSuggestions: ComboSwapOpportunity[] = [];

    combos.forEach((combo) => {
      let components: string[] = [];
      try {
        components = JSON.parse(combo.itemsJson || "[]");
      } catch {
        components = [];
      }
      if (components.length === 0) return;

      const matchedCartItems: any[] = [];
      const missingComponents: string[] = [];

      components.forEach((compItem) => {
        const matchedProduct = findProductForComboItem(compItem, allProducts);
        let foundInCart: any = null;

        if (matchedProduct) {
          const mId = matchedProduct.id.toLowerCase();
          const mSku = (matchedProduct.sku || "").toLowerCase();
          const mSlug = (matchedProduct.slug || "").toLowerCase();

          foundInCart =
            cartProductTokens.get(mId) ||
            cartProductTokens.get(mSku) ||
            cartProductTokens.get(mSlug);
        }

        // If not matched by product object, test direct string match with cart item title or ID
        if (!foundInCart) {
          const cleanText = String(compItem).toLowerCase();
          for (const item of items) {
            const itemTitle = (item.title || "").toLowerCase();
            const itemId = (item.id || "").toLowerCase();
            if (cleanText.includes(itemTitle) || itemTitle.includes(cleanText) || cleanText.includes(itemId)) {
              foundInCart = item;
              break;
            }
          }
        }

        if (foundInCart) {
          if (!matchedCartItems.some((m) => m.id === foundInCart.id)) {
            matchedCartItems.push(foundInCart);
          }
        } else {
          missingComponents.push(typeof compItem === "string" ? compItem : (compItem as any)?.name || "Pieza del combo");
        }
      });

      // User rule: "if the user goes to checkout and has many parts that relate or that are in a combo,
      // suggest the user to change those parts for the combo"
      const totalComponents = components.length;
      const matchCount = matchedCartItems.length;

      // Qualified if user has 2+ parts of the combo, OR has >= 50% of the combo components
      const isQualified = matchCount >= 2 || (totalComponents <= 2 && matchCount >= 1);

      if (isQualified) {
        const cartMatchingCost = matchedCartItems.reduce(
          (sum, i) => sum + (Number(i.priceCRC) || 0) * (Number(i.quantity) || 1),
          0
        );

        const isComplete = matchCount === totalComponents;
        const savings = Math.max(0, cartMatchingCost - combo.priceCRC);

        const reasonEs = isComplete
          ? `¡Tienes todas las ${matchCount} piezas de este combo en tu carrito! Cámbialas por el combo oficial y ahorra ₡${savings.toLocaleString()} CRC.`
          : `Tienes ${matchCount} de las ${totalComponents} piezas que componen este combo. ¡Cámbialas por el combo completo para llevarte las piezas faltantes con descuento especial!`;

        const reasonEn = isComplete
          ? `You have all ${matchCount} items of this combo in your cart! Swap them for the official combo bundle and save ₡${savings.toLocaleString()} CRC.`
          : `You have ${matchCount} of the ${totalComponents} items included in this combo. Swap them for the complete bundle to get remaining items with bundle discount!`;

        comboSuggestions.push({
          comboId: combo.id,
          comboSlug: combo.slug,
          comboTitleEs: combo.titleEs,
          comboTitleEn: combo.titleEn,
          comboBadgeEs: combo.badgeEs,
          comboBadgeEn: combo.badgeEn,
          comboPriceCRC: combo.priceCRC,
          comboOriginalPriceCRC: combo.originalPriceCRC,
          discountPercent: combo.discountPercent,
          imageUrl: combo.imageUrl || "/images/sxs/z10_front.png",
          matchingCartItemIds: matchedCartItems.map((i) => i.id),
          matchingCartItemTitles: matchedCartItems.map((i) => i.title),
          totalComponentsCount: totalComponents,
          matchingComponentsCount: matchCount,
          missingComponentsTitles: missingComponents,
          cartMatchingCostCRC: cartMatchingCost,
          savingsCRC: savings,
          isCompleteMatch: isComplete,
          recommendationReasonEs: reasonEs,
          recommendationReasonEn: reasonEn,
        });
      }
    });

    // Sort combos by highest match count, then highest savings
    comboSuggestions.sort((a, b) => {
      if (b.isCompleteMatch !== a.isCompleteMatch) {
        return b.isCompleteMatch ? 1 : -1;
      }
      return b.savingsCRC - a.savingsCRC;
    });

    // 3. Evaluate Related Parts Cross-Sell
    // "or if to many parts related to add the product"
    const cartProductIds = new Set<string>();
    items.forEach((item) => {
      cartProductIds.add(String(item.id).split("__")[0].toLowerCase());
      if (item.sku) cartProductIds.add(String(item.sku).toLowerCase());
      if (item.slug) cartProductIds.add(String(item.slug).toLowerCase());
    });

    const relatedCandidates = new Map<string, { product: ProductItem; relatedBy: string[]; score: number }>();

    items.forEach((item) => {
      const rawId = String(item.id).split("__")[0].toLowerCase();
      const catalogItem = allProducts.find(
        (p) =>
          p.id.toLowerCase() === rawId ||
          p.slug.toLowerCase() === rawId ||
          ((p as any).sku && String((p as any).sku).toLowerCase() === rawId)
      );

      if (catalogItem?.relatedProductIds && Array.isArray(catalogItem.relatedProductIds)) {
        catalogItem.relatedProductIds.forEach((relId) => {
          const rNormalized = String(relId).toLowerCase();
          if (cartProductIds.has(rNormalized)) return; // Already in cart

          const targetCandidate = allProducts.find(
            (p) =>
              p.id.toLowerCase() === rNormalized ||
              p.slug.toLowerCase() === rNormalized ||
              ((p as any).sku && String((p as any).sku).toLowerCase() === rNormalized)
          );

          if (targetCandidate && !cartProductIds.has(targetCandidate.id.toLowerCase())) {
            const candidateKey = targetCandidate.id.toLowerCase();
            if (!relatedCandidates.has(candidateKey)) {
              relatedCandidates.set(candidateKey, {
                product: targetCandidate,
                relatedBy: [item.title],
                score: 10,
              });
            } else {
              const existing = relatedCandidates.get(candidateKey)!;
              if (!existing.relatedBy.includes(item.title)) {
                existing.relatedBy.push(item.title);
                existing.score += 15; // Higher score if multiple items in cart relate to it!
              }
            }
          }
        });
      }
    });

    // Convert map to array and sort
    const relatedSuggestions: RelatedPartSuggestion[] = Array.from(relatedCandidates.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ product, relatedBy }) => {
        const titleList = relatedBy.slice(0, 2).join(" y ");
        return {
          product,
          relatedCartItemTitles: relatedBy,
          reasonEs: `Pieza altamente recomendada para acompañar: ${titleList}`,
          reasonEn: `Highly recommended complementary part for: ${titleList}`,
        };
      });

    const hasOptimization = comboSuggestions.length > 0 || relatedSuggestions.length > 0;

    return NextResponse.json({
      success: true,
      hasOptimization,
      comboSuggestions,
      relatedSuggestions,
    });
  } catch (error: any) {
    console.error("Smart checkout API error:", error);
    return NextResponse.json(
      { success: false, error: "Error evaluating cart optimizations" },
      { status: 500 }
    );
  }
}
