"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductItem } from "@/lib/products";
import {
  Check,
  X,
  ShoppingCart,
  ArrowRight,
  Sparkles,
  Plus,
} from "lucide-react";

export function AddToCartModal() {
  const {
    isAddedModalOpen,
    closeAddedModal,
    addedModalItem,
    items,
    partsSubtotal,
    formatPrice,
    addItemSilently,
    removeItem,
  } = useCart();
  const { t, lang } = useLanguage();

  const [recommendations, setRecommendations] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch up to 5 related or most bought together products when modal opens
  useEffect(() => {
    if (!isAddedModalOpen || !addedModalItem) return;

    let isMounted = true;
    setIsLoading(true);

    const cartIds = items
      .map((i) => i.id.split("__")[0])
      .filter(Boolean)
      .join(",");

    const targetId = addedModalItem.id.split("__")[0];

    fetch(`/api/cart/recommendations?productId=${encodeURIComponent(targetId)}&cartProductIds=${encodeURIComponent(cartIds)}&limit=5`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.products)) {
          setRecommendations(data.products.slice(0, 5));
        }
      })
      .catch((err) => {
        console.error("Failed to fetch recommendations in AddToCartModal:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAddedModalOpen, addedModalItem?.id]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAddedModalOpen) {
        closeAddedModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAddedModalOpen, closeAddedModal]);

  if (!isAddedModalOpen || !addedModalItem) return null;

  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Live item lookup so quantity/price reflect latest cart state
  const liveAddedItem =
    items.find((i) => i.id === addedModalItem.id) || addedModalItem;

  const handleToggleRecommendation = (product: ProductItem) => {
    const existingCartItem = items.find(
      (i) => i.id.split("__")[0].toLowerCase() === product.id.toLowerCase()
    );

    if (existingCartItem) {
      removeItem(existingCartItem.id);
      return;
    }

    const isFreeInstall = Boolean(
      product.price?.I_price?.includes || (product as any).isInstallationIncluded
    );
    const installPrice = isFreeInstall
      ? 0
      : Number(product.price?.I_price?.I_price) || 0;

    addItemSilently({
      id: product.id,
      sku: product.id.toUpperCase(),
      title: product.p_title,
      priceCRC: product.price.T_price,
      basePriceCRC: product.price.T_price,
      type: "PRODUCT",
      imageUrl: product.imgs?.[0] || "/images/sxs/z10_front.png",
      category: product.category,
      brand: product.brand?.[0],
      comp: product.comp,
      withInstallation: isFreeInstall,
      installationPriceCRC: installPrice,
      freeInstallation: isFreeInstall,
      homeInstallation: product.homeInstallation !== false,
      supplierStockStatus: product.supplierStockStatus || "IN_STOCK",
      supplierLeadDaysMin: product.supplierLeadDaysMin ?? 2,
      supplierLeadDaysMax: product.supplierLeadDaysMax ?? 5,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={closeAddedModal} aria-hidden="true" />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
        
        {/* Header: Success Confirmation Banner */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 shadow-xs">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                {t.cartAddedModalTitle}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {lang === "es"
                  ? `Tienes ${totalCartCount} artículo${totalCartCount === 1 ? "" : "s"} en tu carrito`
                  : `You have ${totalCartCount} item${totalCartCount === 1 ? "" : "s"} in your cart`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeAddedModal}
            className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 divide-y divide-slate-100">
          
          {/* Section 1: The Product Just Added */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                <Image
                  src={liveAddedItem.imageUrl || "/images/sxs/z10_front.png"}
                  alt={liveAddedItem.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                  {liveAddedItem.title}
                </h4>
                {liveAddedItem.parametersSummary && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {liveAddedItem.parametersSummary}
                  </p>
                )}
                <div className="flex items-center gap-2.5 mt-1.5">
                  <span className="text-sm sm:text-base font-extrabold font-mono text-[#0052CC]">
                    {formatPrice(liveAddedItem.priceCRC)}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold font-mono">
                    Cant: {liveAddedItem.quantity}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Frequently Bought Together */}
          {(isLoading || recommendations.length > 0) && (
            <div className="pt-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    {t.cartAddedModalFrequentlyBought}
                  </h4>
                </div>
                {!isLoading && recommendations.length > 0 && (
                  <span className="text-[11px] text-slate-600 font-semibold">
                    {lang === "es"
                      ? `${recommendations.length} ${recommendations.length === 1 ? "sugerencia clave" : "sugerencias clave"}`
                      : `${recommendations.length} ${recommendations.length === 1 ? "key suggestion" : "key suggestions"}`}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                {t.cartAddedModalFrequentlyBoughtDesc}
              </p>

              {/* Recommendations Grid / Skeleton */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                  {[1, 2, 3].map((idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl border border-slate-200 bg-white flex flex-col gap-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-3 w-3/4 rounded" />
                          <Skeleton className="h-3 w-1/2 rounded" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-full rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={`grid gap-3 pt-1 ${
                    recommendations.length === 1
                      ? "grid-cols-1"
                      : recommendations.length === 2
                      ? "grid-cols-1 sm:grid-cols-2"
                      : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
                  }`}
                >
                  {recommendations.map((rec) => {
                    const isAdded = items.some(
                      (i) => i.id.split("__")[0].toLowerCase() === rec.id.toLowerCase()
                    );
                    return (
                      <div
                        key={rec.id}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-[#0052CC]/40 hover:shadow-sm transition-all flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                            <Image
                              src={rec.imgs?.[0] || "/images/sxs/z10_front.png"}
                              alt={rec.p_title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                              {rec.p_title}
                            </h5>
                            <div className="flex items-center justify-between gap-1.5 mt-1.5 flex-wrap">
                              <span className="text-xs font-extrabold font-mono text-[#0052CC]">
                                {formatPrice(rec.price.T_price)}
                              </span>
                              <span className="text-[10px] text-emerald-600 font-semibold whitespace-nowrap">
                                ✓ {lang === "es" ? "En Stock" : "In Stock"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Add / Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleRecommendation(rec)}
                          className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isAdded
                              ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : "bg-slate-900 hover:bg-[#0052CC] text-white shadow-xs"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                              <span>{t.cartAddedModalAdded}</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                              <span>{t.cartAddedModalAddToCart}</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer: Order Total + Unified Action Buttons */}
        <div className="p-4 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center justify-between sm:block">
            <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
              {t.cartTotal}
            </span>
            <span className="text-base sm:text-lg font-black font-mono text-slate-900">
              {formatPrice(partsSubtotal)}
            </span>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <button
              type="button"
              onClick={closeAddedModal}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all cursor-pointer text-center whitespace-nowrap"
            >
              {t.cartAddedModalContinue}
            </button>

            <Link
              href="/carrito"
              onClick={closeAddedModal}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all shadow-2xs text-center whitespace-nowrap"
            >
              <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
              <span>{t.cartAddedModalViewCart}</span>
            </Link>

            <Link
              href="/checkout"
              onClick={closeAddedModal}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0052CC] hover:bg-[#0040A8] text-white text-xs font-extrabold uppercase tracking-wide transition-all shadow-md shadow-[#0052CC]/20 text-center whitespace-nowrap"
            >
              <span>{t.cartAddedModalCheckout}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
