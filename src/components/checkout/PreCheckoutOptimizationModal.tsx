"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { ComboSwapOpportunity, RelatedPartSuggestion } from "@/app/api/cart/smart-checkout/route";
import { ProductItem } from "@/lib/products";
import {
  Sparkles,
  ArrowRight,
  Check,
  CheckCircle2,
  X,
  Package,
  Layers,
  TrendingDown,
  Plus,
  ShieldCheck,
  Tag,
} from "lucide-react";

interface PreCheckoutOptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
  comboSuggestions: ComboSwapOpportunity[];
  relatedSuggestions: RelatedPartSuggestion[];
  isLoading: boolean;
}

export function PreCheckoutOptimizationModal({
  isOpen,
  onClose,
  onProceedToCheckout,
  comboSuggestions,
  relatedSuggestions,
  isLoading,
}: PreCheckoutOptimizationModalProps) {
  const { swapItemsForCombo, addItemSilently, formatPrice, currency } = useCart();
  const { t, lang } = useLanguage();

  const [appliedComboIds, setAppliedComboIds] = useState<Set<string>>(new Set());
  const [addedProductIds, setAddedProductIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleApplyComboSwap = (comboOp: ComboSwapOpportunity) => {
    swapItemsForCombo(
      {
        id: comboOp.comboId,
        slug: comboOp.comboSlug,
        titleEs: comboOp.comboTitleEs,
        titleEn: comboOp.comboTitleEn,
        priceCRC: comboOp.comboPriceCRC,
        imageUrl: comboOp.imageUrl,
      },
      comboOp.matchingCartItemIds
    );

    setAppliedComboIds((prev) => new Set(prev).add(comboOp.comboId));
  };

  const handleAddRelatedProduct = (product: ProductItem) => {
    addItemSilently({
      id: product.id,
      title: product.p_title,
      priceCRC: product.price.T_price,
      basePriceCRC: product.price.T_price,
      type: "PRODUCT",
      imageUrl: product.imgs?.[0] || "/images/sxs/z10_front.png",
      category: product.category,
      brand: product.brand?.[0],
      withInstallation: false,
      installationPriceCRC: 0,
      freeInstallation: product.price.I_price?.includes || false,
      homeInstallation: product.homeInstallation,
      supplierStockStatus: product.supplierStockStatus || "IN_STOCK",
      supplierLeadDaysMin: product.supplierLeadDaysMin ?? 2,
      supplierLeadDaysMax: product.supplierLeadDaysMax ?? 5,
    });

    setAddedProductIds((prev) => new Set(prev).add(product.id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-fade-in">
      {/* Backdrop */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-white to-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0052CC]/10 text-[#0052CC] flex items-center justify-center flex-shrink-0 shadow-xs border border-[#0052CC]/20">
              <Sparkles className="w-5 h-5 text-[#0052CC]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                {t.smartCheckoutModalTitle}
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-tight mt-0.5">
                {t.smartCheckoutModalSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 divide-y divide-slate-100">
          
          {/* Skeleton Loader during analysis */}
          {isLoading ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <Skeleton className="h-5 w-1/3 rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            </div>
          ) : (
            <>
              {/* 1. Combo Swap Opportunities */}
              {comboSuggestions.length > 0 && (
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#0052CC]">
                    <Tag className="w-4 h-4" />
                    <span>{t.smartCheckoutComboBadge}</span>
                  </div>

                  <div className="space-y-4">
                    {comboSuggestions.map((combo) => {
                      const isSwapped = appliedComboIds.has(combo.comboId);

                      return (
                        <div
                          key={combo.comboId}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                            isSwapped
                              ? "bg-emerald-50/60 border-emerald-200"
                              : "bg-blue-50/30 border-[#0052CC]/25 shadow-xs"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3.5 flex-1 min-w-0">
                              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 shadow-xs">
                                <Image
                                  src={combo.imageUrl || "/images/sxs/z10_front.png"}
                                  alt={lang === "es" ? combo.comboTitleEs : combo.comboTitleEn}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#0052CC] text-white">
                                    {lang === "es" ? combo.comboBadgeEs : combo.comboBadgeEn}
                                  </span>
                                  {combo.savingsCRC > 0 && (
                                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 font-mono">
                                      <TrendingDown className="w-3 h-3" />
                                      {t.smartCheckoutYouSave} {formatPrice(combo.savingsCRC)}
                                    </span>
                                  )}
                                </div>

                                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mt-1 leading-snug">
                                  {lang === "es" ? combo.comboTitleEs : combo.comboTitleEn}
                                </h4>

                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                  {lang === "es"
                                    ? combo.recommendationReasonEs
                                    : combo.recommendationReasonEn}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Components Detail List */}
                          <div className="mt-3.5 pt-3 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80">
                              <span className="font-bold text-slate-700 block mb-1">
                                {t.smartCheckoutCurrentParts}
                              </span>
                              <ul className="space-y-0.5 text-slate-600">
                                {combo.matchingCartItemTitles.map((title, i) => (
                                  <li key={i} className="flex items-center gap-1.5 truncate">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                    <span className="truncate">{title}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                              <div>
                                <span className="font-bold text-slate-700 block mb-1">
                                  {t.smartCheckoutComboPrice}
                                </span>
                                <div className="flex items-baseline gap-2">
                                  <span className="text-base font-black font-mono text-[#0052CC]">
                                    {formatPrice(combo.comboPriceCRC)}
                                  </span>
                                  {combo.cartMatchingCostCRC > 0 && (
                                    <span className="text-xs font-mono text-slate-400 line-through">
                                      {formatPrice(combo.cartMatchingCostCRC)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Apply Swap Button */}
                              <div className="mt-2">
                                {isSwapped ? (
                                  <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold py-1.5">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>{t.smartCheckoutComboSwappedSuccess}</span>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleApplyComboSwap(combo)}
                                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#0052CC] hover:bg-[#0040A8] text-white text-xs font-extrabold uppercase tracking-wide transition-all shadow-sm cursor-pointer"
                                  >
                                    <Layers className="w-3.5 h-3.5" />
                                    <span>{t.smartCheckoutComboSwapBtn}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Related Products Suggestions */}
              {relatedSuggestions.length > 0 && (
                <div className="pt-5 space-y-3.5">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-700" />
                      <span>{t.smartCheckoutRelatedTitle}</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {t.smartCheckoutRelatedDesc}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {relatedSuggestions.map(({ product, reasonEs, reasonEn }) => {
                      const isAdded = addedProductIds.has(product.id);

                      return (
                        <div
                          key={product.id}
                          className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-[#0052CC]/30 transition-all flex flex-col justify-between gap-3 shadow-xs"
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                              <Image
                                src={product.imgs?.[0] || "/images/sxs/z10_front.png"}
                                alt={product.p_title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                                {product.p_title}
                              </h5>
                              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                {lang === "es" ? reasonEs : reasonEn}
                              </p>
                              <div className="mt-1 font-extrabold font-mono text-xs text-[#0052CC]">
                                {formatPrice(product.price.T_price)}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddRelatedProduct(product)}
                            disabled={isAdded}
                            className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              isAdded
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                                : "bg-slate-900 hover:bg-[#0052CC] text-white shadow-xs"
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>{t.cartAddedModalAdded}</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>{t.cartAddedModalAddToCart}</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer CTAs */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onProceedToCheckout}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer text-center sm:text-left"
          >
            {t.smartCheckoutSkipBtn}
          </button>

          <button
            type="button"
            onClick={onProceedToCheckout}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0052CC] hover:bg-[#0040A8] text-white text-xs font-extrabold uppercase tracking-wider transition-all shadow-md shadow-[#0052CC]/25 cursor-pointer"
          >
            <span>{t.smartCheckoutContinueBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
