"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { GarageModal } from "@/components/garage/GarageModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingConcierge } from "@/components/home/FloatingConcierge";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useGarage } from "@/context/GarageContext";
import { formatCRC, formatUSD, convertCRCToUSD } from "@/lib/i18n";
import {
  Search,
  X,
  Car,
  ArrowLeft,
  ChevronRight,
  MessageCircle,
  Package,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Calendar,
} from "lucide-react";

interface ComboItem {
  id: string;
  slug: string;
  category: string;
  titleEs: string;
  titleEn: string;
  badgeEs: string;
  badgeEn: string;
  descriptionEs: string;
  descriptionEn: string;
  priceCRC: number;
  originalPriceCRC: number;
  installationPriceCRC: number;
  discountPercent: number;
  items: string[];
  imageUrl: string;
  homeInstallationAvailable?: boolean;
  availability?: any;
  stockStatus?: string;
  isAvailable?: boolean;
  leadDaysMin?: number;
  leadDaysMax?: number;
}

export default function CombosPage() {
  const { t, lang } = useLanguage();
  const { currency, sellRate } = useCart();
  const { vehicle, openModal } = useGarage();
  const router = useRouter();

  const [combos, setCombos] = useState<ComboItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/combos")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setCombos(res.data.combos || []);
          setCategories(res.data.categories || []);
        }
      })
      .catch((err) => console.error("Error loading combos:", err))
      .finally(() => setLoading(false));
  }, []);

  // Helper to get friendly bilingual label for any category (dynamic)
  const getCategoryLabel = (cat: string) => {
    if (cat === "all") return t.combosAllCategories;
    if (cat === "performance") return t.combosCategoryPerformance;
    if (cat === "rings") return t.combosCategoryRings;
    if (cat === "lights") return t.combosCategoryLights;
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  // Filter combos based on active category & search query
  const filteredCombos = useMemo(() => {
    return combos.filter((combo) => {
      const matchesCategory =
        selectedCategory === "all" || combo.category === selectedCategory;

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const title = (lang === "es" ? combo.titleEs : combo.titleEn).toLowerCase();
      const desc = (lang === "es" ? combo.descriptionEs : combo.descriptionEn).toLowerCase();
      const badge = (lang === "es" ? combo.badgeEs : combo.badgeEn).toLowerCase();
      const itemsText = (combo.items || []).join(" ").toLowerCase();

      return (
        title.includes(q) ||
        desc.includes(q) ||
        badge.includes(q) ||
        itemsText.includes(q)
      );
    });
  }, [combos, selectedCategory, searchQuery, lang]);

  // Compute counts per category dynamically
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: combos.length };
    combos.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return counts;
  }, [combos]);

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#111827] flex flex-col justify-between antialiased">
      <NotificationBanner />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 w-full">
        {/* Minimalist Top Bar: Breadcrumb + Sleek Vehicle Fitment Chip */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link
              href="/"
              className="hover:text-black flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === "es" ? "Inicio" : "Home"}</span>
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-semibold">{t.comboBreadcrumb}</span>
          </div>

          {/* Minimalist Vehicle Indicator (Blue circle replacement) */}
          <div className="flex items-center">
            {vehicle ? (
              <button
                onClick={() => openModal()}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-xs text-gray-700 shadow-sm transition-all"
                title={t.combosChangeVehicle}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                <span className="font-medium text-gray-900">
                  {vehicle.year} {vehicle.brandName} {vehicle.modelName}
                </span>
                <span className="text-[11px] text-[#C02030] font-semibold group-hover:underline pl-1 border-l border-gray-200">
                  {t.combosChangeVehicle}
                </span>
              </button>
            ) : (
              <button
                onClick={() => openModal()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-xs text-gray-600 shadow-sm transition-all"
              >
                <Car className="w-3.5 h-3.5 text-gray-500" />
                <span>{t.combosSelectVehicle}</span>
                <span className="text-[11px] text-[#C02030] font-semibold pl-1 border-l border-gray-200">
                  +
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Minimalist Search & Dynamic Category Filter Section */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-sm mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.combosSearchPlaceholder}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 focus:border-black text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Results count indicator */}
            {!loading && (
              <div className="hidden sm:flex items-center text-xs text-gray-500 font-mono whitespace-nowrap pl-2">
                <span>{filteredCombos.length}</span>
                <span className="ml-1">
                  {filteredCombos.length === 1 ? "combo" : "combos"}
                </span>
              </div>
            )}
          </div>

          {/* Dynamic Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar scroll-smooth">
            {["all", ...categories].map((cat) => {
              const isActive = selectedCategory === cat;
              const count = categoryCounts[cat] ?? 0;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-[#111827] text-white shadow-sm"
                      : "bg-gray-100/80 text-gray-600 hover:bg-gray-200 hover:text-gray-900 border border-transparent"
                  }`}
                >
                  <span>{getCategoryLabel(cat)}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Real Loading Skeleton (Rule 7: Mandatory Animated Skeleton Loaders) */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-3xl overflow-hidden p-5 space-y-4 animate-pulse shadow-sm"
              >
                <div className="w-full h-56 bg-gray-200 rounded-2xl" />
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-5 bg-gray-200 rounded w-4/5" />
                </div>
                <div className="h-6 bg-gray-200 rounded w-1/3" />
                <div className="h-11 bg-gray-200 rounded-2xl w-full" />
              </div>
            ))}
          </div>
        ) : filteredCombos.length === 0 ? (
          /* Empty Search / Filter State */
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-1">
              {t.combosNoResults}
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              {lang === "es"
                ? "Prueba cambiando el término de búsqueda o selecciona otra categoría."
                : "Try modifying your search term or select another category."}
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-800 transition-colors"
            >
              {lang === "es" ? "Restablecer Filtros" : "Reset Filters"}
            </button>
          </div>
        ) : (
          /* Simplified Minimalist Combo Cards (Click to Redirect) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCombos.map((combo) => {
              const displayPrice =
                currency === "USD"
                  ? formatUSD(convertCRCToUSD(combo.priceCRC, sellRate))
                  : formatCRC(combo.priceCRC);

              const displayOriginalPrice =
                currency === "USD"
                  ? formatUSD(convertCRCToUSD(combo.originalPriceCRC, sellRate))
                  : formatCRC(combo.originalPriceCRC);

              return (
                <div
                  key={combo.id}
                  onClick={() => router.push(`/combos/${combo.slug}`)}
                  className="group bg-white rounded-3xl border border-gray-200/90 hover:border-gray-400 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Minimalist Image Showcase */}
                    <div className="relative w-full h-56 bg-[#F4F5F7] overflow-hidden flex items-center justify-center p-4">
                      <Image
                        src={combo.imageUrl}
                        alt={lang === "es" ? combo.titleEs : combo.titleEn}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />

                      {/* Clean Badge & Discount Tags */}
                      <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 flex-wrap">
                        <span className="bg-black/85 backdrop-blur-md text-white text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full">
                          {getCategoryLabel(combo.category)}
                        </span>
                        {/* Dynamic Stock Status Chip based on listed products */}
                        {combo.stockStatus === "OUT_OF_STOCK" || combo.isAvailable === false ? (
                          <span className="bg-rose-600/90 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                            <AlertCircle className="w-2.5 h-2.5" />
                            <span>{t.devComboStockOutOfStock}</span>
                          </span>
                        ) : combo.stockStatus === "PRE_ORDER" ? (
                          <span className="bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                            <Calendar className="w-2.5 h-2.5" />
                            <span>{t.devComboStockPreOrder}</span>
                          </span>
                        ) : combo.stockStatus === "LOW_STOCK" ? (
                          <span className="bg-amber-600/90 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>{t.devComboStockLowStock}</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>{t.devComboStockInStock}</span>
                          </span>
                        )}
                      </div>

                      {combo.discountPercent > 0 && (
                        <div className="absolute top-3.5 right-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full backdrop-blur-md">
                          -{combo.discountPercent}%
                        </div>
                      )}
                    </div>

                    {/* Product Details (Removed boxed items per request) */}
                    <div className="p-5">
                      <div className="mb-2">
                        <span className="text-[11px] font-bold text-[#C02030] tracking-wide uppercase">
                          {lang === "es" ? combo.badgeEs : combo.badgeEn}
                        </span>
                        <h2 className="text-base font-bold text-gray-900 tracking-tight leading-snug mt-0.5 group-hover:text-[#C02030] transition-colors">
                          {lang === "es" ? combo.titleEs : combo.titleEn}
                        </h2>
                      </div>

                      {/* Clean Price Block */}
                      <div className="pt-2 mb-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-extrabold font-mono text-gray-900">
                            {displayPrice}
                          </span>
                          {combo.originalPriceCRC > combo.priceCRC && (
                            <span className="text-xs text-gray-400 line-through font-mono">
                              {displayOriginalPrice}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Minimalist CTA Section - Entices User to Click and Redirect */}
                  <div className="p-5 pt-0 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/combos/${combo.slug}`);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 px-4 rounded-2xl bg-[#111827] hover:bg-[#C02030] text-white font-bold text-xs tracking-wider uppercase transition-colors shadow-sm group-hover:bg-[#C02030]"
                    >
                      <span>{t.comboViewDetails}</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <Link
                      href={`/cotizar?tipo=combo&id=${combo.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                      title={
                        lang === "es"
                          ? "Cotizar por WhatsApp o consultar"
                          : "Inquire or custom quote"
                      }
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Global Modals & Drawers */}
      <GarageModal />
      <CartDrawer />
      <FloatingConcierge />
    </div>
  );
}
