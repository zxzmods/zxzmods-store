"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldAlert, Plus, Check, ShoppingCart, Layers, Package } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { formatCRC, formatUSD, convertCRCToUSD } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ProductItem } from "@/lib/products";

export interface SuggestedSectionProps {
  suggestedProducts?: ProductItem[];
  suggestedCombos?: any[];
  isLoading?: boolean;
}

export function SuggestedSection({
  suggestedProducts = [],
  suggestedCombos = [],
  isLoading = false,
}: SuggestedSectionProps) {
  const { t, lang } = useLanguage();
  const { items, addItem, currency, sellRate } = useCart();
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="mt-6 pt-5 border-t border-gray-200 space-y-3 animate-pulse">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-6 h-6 rounded-lg bg-gray-200" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-48 rounded bg-gray-200" />
            <Skeleton className="h-3 w-64 rounded bg-gray-200" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-20 w-full rounded-2xl bg-gray-100" />
          <Skeleton className="h-20 w-full rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  const hasSuggestions = suggestedProducts.length > 0 || suggestedCombos.length > 0;
  if (!hasSuggestions) return null;

  const formatPrice = (crc: number) => {
    if (currency === "USD") {
      return formatUSD(convertCRCToUSD(crc, sellRate));
    }
    return formatCRC(crc);
  };

  const handleAddProduct = (p: ProductItem) => {
    const isIncluded = Boolean(p.price?.I_price?.includes ?? true);
    const pTitle = (p as any).nameEs || p.p_title || (lang === "es" ? "Producto Sugerido" : "Suggested Product");
    const imgUrl = (p as any).imageUrl || (Array.isArray(p.imgs) && p.imgs[0]) || "/images/logo.png";
    const brandName = (p as any).brandName || (Array.isArray(p.brand) ? p.brand[0] : "ZxZ");
    addItem({
      type: "PRODUCT",
      id: p.id,
      sku: (p as any).sku || p.id,
      title: pTitle,
      brand: brandName,
      comp: p.comp || ["all"],
      priceCRC: (p as any).priceCRC || p.price?.T_price || 0,
      installationPriceCRC: p.price?.I_price?.I_price || 0,
      withInstallation: isIncluded,
      imageUrl: imgUrl,
      supplierStockStatus: p.supplierStockStatus || "IN_STOCK",
      supplierLeadDaysMin: p.supplierLeadDaysMin || 7,
      supplierLeadDaysMax: p.supplierLeadDaysMax || 12,
    });
    setJustAddedId(p.id);
    setTimeout(() => setJustAddedId(null), 3000);
  };

  const handleAddCombo = (c: any) => {
    const title = lang === "es" ? c.titleEs : (c.titleEn || c.titleEs);
    addItem({
      type: "COMBO",
      id: `combo-${c.id}`,
      sku: c.slug || c.id,
      title,
      brand: "ZxZ Performance",
      comp: ["all"],
      priceCRC: Number(c.priceCRC) || 0,
      installationPriceCRC: Number(c.installationPriceCRC) || 0,
      withInstallation: true,
      imageUrl: c.imageUrl || (Array.isArray(c.images) ? c.images[0] : "/images/combos/placeholder.webp"),
      supplierStockStatus: c.stockStatus || "IN_STOCK",
      supplierLeadDaysMin: c.leadDaysMin || 7,
      supplierLeadDaysMax: c.leadDaysMax || 12,
    });
    setJustAddedId(`combo-${c.id}`);
    setTimeout(() => setJustAddedId(null), 3000);
  };

  return (
    <section className="mt-6 pt-5 border-t border-gray-200 space-y-3.5">
      {/* Section Header */}
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-xl bg-red-50 border border-red-200/80 flex items-center justify-center text-[#C02030] shrink-0 mt-0.5">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 leading-tight">
            {t.productSuggestionsSectionTitle}
          </h4>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5">
            {t.productSuggestionsSectionSubtitle}
          </p>
        </div>
      </div>

      {/* Suggested Items List */}
      <div className="space-y-2.5">
        {/* Suggested Products */}
        {suggestedProducts.map((p) => {
          const isAdded = items.some(
            (it) => it.id.split("__")[0].toLowerCase() === p.id.toLowerCase() ||
                    ((p as any).sku && it.sku && it.sku.toLowerCase() === (p as any).sku.toLowerCase())
          );
          const title = (p as any).nameEs || p.p_title;
          const priceVal = (p as any).priceCRC || p.price?.T_price || 0;
          const imgUrl = (p as any).imageUrl || (Array.isArray(p.imgs) ? p.imgs[0] : "/images/logo.png");

          return (
            <div
              key={`sug-prod-${p.id}`}
              className="p-3 sm:p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-red-200/80 hover:shadow-xs transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Link
                  href={`/productos/${p.slug || p.id}`}
                  className="relative w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/80 overflow-hidden flex-shrink-0 group block"
                >
                  <Image
                    src={imgUrl}
                    alt={title}
                    fill
                    className="object-contain p-1 group-hover:scale-105 transition-transform"
                    sizes="48px"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200/80 px-1.5 py-0.2 rounded-md font-mono flex items-center gap-1">
                      <Package className="w-2.5 h-2.5" />
                      <span>{t.suggestionTypeProduct}</span>
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400">
                      • {t.suggestionBadge}
                    </span>
                  </div>

                  <Link
                    href={`/productos/${p.slug || p.id}`}
                    className="text-xs font-bold text-slate-900 hover:text-[#C02030] transition-colors truncate block mt-0.5"
                    title={title}
                  >
                    {title}
                  </Link>

                  <div className="mt-0.5">
                    <span className="text-xs font-mono font-extrabold text-[#C02030]">
                      {formatPrice(priceVal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Add Button */}
              <div className="shrink-0">
                {isAdded ? (
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t.suggestionInCart}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAddProduct(p)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-[#C02030] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t.suggestionAddToCart}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Suggested Combos */}
        {suggestedCombos.map((c) => {
          const comboCartId = `combo-${c.id}`;
          const isAdded = items.some(
            (it) => it.id.toLowerCase() === comboCartId.toLowerCase() ||
                    (c.slug && it.sku && it.sku.toLowerCase() === c.slug.toLowerCase())
          );
          const title = lang === "es" ? c.titleEs : (c.titleEn || c.titleEs);
          const priceVal = Number(c.priceCRC) || 0;
          const imgUrl = c.imageUrl || (Array.isArray(c.images) ? c.images[0] : "/images/combos/placeholder.webp");

          return (
            <div
              key={`sug-combo-${c.id}`}
              className="p-3 sm:p-3.5 rounded-2xl bg-white border border-gray-200 hover:border-amber-200 hover:shadow-xs transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Link
                  href={`/combos/${c.slug || c.id}`}
                  className="relative w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/80 overflow-hidden flex-shrink-0 group block"
                >
                  <Image
                    src={imgUrl}
                    alt={title}
                    fill
                    className="object-contain p-1 group-hover:scale-105 transition-transform"
                    sizes="48px"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.2 rounded-md font-mono flex items-center gap-1">
                      <Layers className="w-2.5 h-2.5" />
                      <span>{t.suggestionTypeCombo}</span>
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400">
                      • {t.suggestionBadge}
                    </span>
                  </div>

                  <Link
                    href={`/combos/${c.slug || c.id}`}
                    className="text-xs font-bold text-slate-900 hover:text-[#C02030] transition-colors truncate block mt-0.5"
                    title={title}
                  >
                    {title}
                  </Link>

                  <div className="mt-0.5">
                    <span className="text-xs font-mono font-extrabold text-[#C02030]">
                      {formatPrice(priceVal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Add Button */}
              <div className="shrink-0">
                {isAdded ? (
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t.suggestionInCart}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAddCombo(c)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-[#C02030] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t.suggestionAddToCart}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
