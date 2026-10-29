"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { GarageModal } from "@/components/garage/GarageModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingConcierge } from "@/components/home/FloatingConcierge";
import { CatalogPagination } from "@/components/ui/CatalogPagination";
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
  Check,
  Percent,
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

  const ITEMS_PER_PAGE = 20; // 4 combos per row × 5 rows = 20 items max per page
  const [combos, setCombos] = useState<ComboItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedVehicleBrand, setSelectedVehicleBrand] = useState<string>("all");
  const [selectedDistributorBrand, setSelectedDistributorBrand] = useState<string>("all");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [discountedOnly, setDiscountedOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageDirection, setPageDirection] = useState<"next" | "prev">("next");
  const gridTopRef = useRef<HTMLDivElement>(null);

  const [availableVehicleBrands, setAvailableVehicleBrands] = useState<Array<{ slug: string; title: string; count: number }>>([]);
  const [availableDistributorBrands, setAvailableDistributorBrands] = useState<Array<{ name: string; count: number }>>([]);
  const [hasInStock, setHasInStock] = useState(false);
  const [hasDiscounted, setHasDiscounted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedVehicleBrand && selectedVehicleBrand !== "all") params.set("vehicleBrand", selectedVehicleBrand);
    if (selectedDistributorBrand && selectedDistributorBrand !== "all") params.set("distributorBrand", selectedDistributorBrand);
    if (inStockOnly) params.set("inStock", "true");
    if (discountedOnly) params.set("discounted", "true");

    fetch(`/api/combos?${params.toString()}`)
      .then((res) => res.json())
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setCombos(res.data.combos || []);
          if (Array.isArray(res.data.categories)) setCategories(res.data.categories);
          if (Array.isArray(res.data.availableVehicleBrands)) setAvailableVehicleBrands(res.data.availableVehicleBrands);
          if (Array.isArray(res.data.availableDistributorBrands)) setAvailableDistributorBrands(res.data.availableDistributorBrands);
          setHasInStock(Boolean(res.data.hasInStock));
          setHasDiscounted(Boolean(res.data.hasDiscounted));
        }
      })
      .catch((err) => console.error("Error loading combos:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [searchQuery, selectedCategory, selectedVehicleBrand, selectedDistributorBrand, inStockOnly, discountedOnly]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedVehicleBrand("all");
    setSelectedDistributorBrand("all");
    setInStockOnly(false);
    setDiscountedOnly(false);
  };

  // Helper to get friendly bilingual label for any category (dynamic)
  const getCategoryLabel = (cat: string) => {
    if (cat === "all") return t.combosAllCategories;
    if (cat === "performance") return t.combosCategoryPerformance;
    if (cat === "rings") return t.combosCategoryRings;
    if (cat === "lights") return t.combosCategoryLights;
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  // Filter combos based on active category & search query
  const filteredCombos = combos;

  // Reset pagination to page 1 when filters or search query change
  useEffect(() => {
    setCurrentPage(1);
    setPageDirection("next");
  }, [searchQuery, selectedCategory, selectedVehicleBrand, selectedDistributorBrand, inStockOnly, discountedOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredCombos.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedCombos = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredCombos.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredCombos, safeCurrentPage, ITEMS_PER_PAGE]);

  const handlePageChange = (newPage: number, direction: "next" | "prev") => {
    setPageDirection(direction);
    setCurrentPage(newPage);
    if (gridTopRef.current) {
      const yOffset = -100;
      const y = gridTopRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  };

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

      <main className="flex-1 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 w-full">
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

          {/* Secondary Controls: Separated Filter Parameters (Vehicle Brand, Distributor Brand, In Stock, Discounted) */}
          <div className="space-y-2.5 pt-2 border-t border-gray-100 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* 1. Vehicle Brand Selector (Strictly only brands present in combos) */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 shadow-xs max-w-full">
                <span className="text-gray-500 font-medium shrink-0">{t.productsFilterVehicleBrand}:</span>
                <select
                  value={selectedVehicleBrand}
                  onChange={(e) => setSelectedVehicleBrand(e.target.value)}
                  className="bg-transparent text-gray-900 font-bold outline-none cursor-pointer text-xs max-w-[150px] sm:max-w-none truncate"
                >
                  <option value="all">
                    {availableVehicleBrands.length === 0
                      ? t.productsAllVehicleBrands
                      : `${t.productsAllVehicleBrands} (${availableVehicleBrands.length})`}
                  </option>
                  {availableVehicleBrands.map((vb) => (
                    <option key={vb.slug} value={vb.slug}>
                      {vb.title} ({vb.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Distributor Brand Selector (Strictly only distributor brands present in combos) */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 shadow-xs max-w-full">
                <span className="text-gray-500 font-medium shrink-0">{t.productsFilterDistributorBrand}:</span>
                <select
                  value={selectedDistributorBrand}
                  onChange={(e) => setSelectedDistributorBrand(e.target.value)}
                  className="bg-transparent text-gray-900 font-bold outline-none cursor-pointer text-xs max-w-[150px] sm:max-w-none truncate"
                >
                  <option value="all">
                    {availableDistributorBrands.length === 0
                      ? t.productsAllDistributorBrands
                      : `${t.productsAllDistributorBrands} (${availableDistributorBrands.length})`}
                  </option>
                  {availableDistributorBrands.map((db) => (
                    <option key={db.name} value={db.name}>
                      {db.name} ({db.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. In Stock Filter Toggle */}
              {(hasInStock || inStockOnly) && (
                <button
                  type="button"
                  onClick={() => setInStockOnly(!inStockOnly)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                    inStockOnly
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t.productsFilterInStock}</span>
                </button>
              )}

              {/* 4. Discounted Filter Toggle */}
              {(hasDiscounted || discountedOnly) && (
                <button
                  type="button"
                  onClick={() => setDiscountedOnly(!discountedOnly)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                    discountedOnly
                      ? "bg-[#C02030] text-white border-[#C02030] shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>{t.productsFilterDiscounted}</span>
                </button>
              )}

              {/* Count indicator */}
              <div className="ml-auto text-xs text-gray-500 font-mono whitespace-nowrap">
                <span>{filteredCombos.length}</span>
                <span className="ml-1">
                  {filteredCombos.length === 1 ? "combo" : "combos"}
                </span>
              </div>
            </div>

            {/* Active Filter Pills Bar */}
            {(selectedVehicleBrand !== "all" ||
              selectedDistributorBrand !== "all" ||
              inStockOnly ||
              discountedOnly ||
              selectedCategory !== "all" ||
              searchQuery.trim() !== "") && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-gray-500 font-medium mr-1">
                  {lang === "es" ? "Filtros activos:" : "Active filters:"}
                </span>

                {/* Vehicle Brand Pill */}
                {selectedVehicleBrand !== "all" && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#111827] text-white text-[11px] font-semibold shadow-xs">
                    <span>
                      {t.productsFilterVehicleBrand}:{" "}
                      <strong className="text-white">
                        {availableVehicleBrands.find((b) => b.slug === selectedVehicleBrand)?.title || selectedVehicleBrand.toUpperCase()}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedVehicleBrand("all")}
                      className="p-0.5 hover:bg-white/20 rounded-full transition cursor-pointer"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}

                {/* Distributor Brand Pill */}
                {selectedDistributorBrand !== "all" && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#111827] text-white text-[11px] font-semibold shadow-xs">
                    <span>
                      {t.productsFilterDistributorBrand}:{" "}
                      <strong className="text-white">{selectedDistributorBrand}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedDistributorBrand("all")}
                      className="p-0.5 hover:bg-white/20 rounded-full transition cursor-pointer"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}

                {/* In Stock Pill */}
                {inStockOnly && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[11px] font-semibold shadow-xs">
                    <span>{t.productsFilterInStock}</span>
                    <button
                      type="button"
                      onClick={() => setInStockOnly(false)}
                      className="p-0.5 hover:bg-white/20 rounded-full transition cursor-pointer"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}

                {/* Discounted Pill */}
                {discountedOnly && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C02030] text-white text-[11px] font-semibold shadow-xs">
                    <span>{t.productsFilterDiscounted}</span>
                    <button
                      type="button"
                      onClick={() => setDiscountedOnly(false)}
                      className="p-0.5 hover:bg-white/20 rounded-full transition cursor-pointer"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}

                {/* Category Pill */}
                {selectedCategory !== "all" && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-700 text-white text-[11px] font-semibold shadow-xs">
                    <span>{getCategoryLabel(selectedCategory)}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("all")}
                      className="p-0.5 hover:bg-white/20 rounded-full transition cursor-pointer"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}

                {/* Search Query Pill */}
                {searchQuery.trim() !== "" && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-700 text-white text-[11px] font-semibold shadow-xs">
                    <span>&quot;{searchQuery}&quot;</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="p-0.5 hover:bg-white/20 rounded-full transition cursor-pointer"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}

                {/* Clear All Filters Button */}
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-[11px] text-[#C02030] hover:underline font-bold ml-1 cursor-pointer"
                >
                  {t.productsClearFilters}
                </button>
              </div>
            )}
          </div>
        </div>

        <div ref={gridTopRef} />

        {/* Real Loading Skeleton (Rule 7: Mandatory Animated Skeleton Loaders, 4 columns per row) */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-3xl overflow-hidden p-5 space-y-4 animate-pulse shadow-sm"
              >
                <div className="w-full h-48 bg-gray-200 rounded-2xl" />
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
          /* Simplified Minimalist Combo Cards: 4 combos per row, max 5 rows (20 items) per page */
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={`combos-page-${safeCurrentPage}`}
                initial={{
                  opacity: 0,
                  x: pageDirection === "next" ? 18 : -18,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: pageDirection === "next" ? -18 : 18,
                }}
                transition={{
                  duration: 0.25,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
              >
                {paginatedCombos.map((combo, idx) => {
                  const displayPrice =
                    currency === "USD"
                      ? formatUSD(convertCRCToUSD(combo.priceCRC, sellRate))
                      : formatCRC(combo.priceCRC);

                  const displayOriginalPrice =
                    currency === "USD"
                      ? formatUSD(convertCRCToUSD(combo.originalPriceCRC, sellRate))
                      : formatCRC(combo.originalPriceCRC);

                  return (
                    <motion.div
                      key={combo.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: Math.min(idx * 0.02, 0.3),
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      onClick={() => router.push(`/combos/${combo.slug}`)}
                      className="group bg-white rounded-3xl border border-gray-200/90 hover:border-gray-400 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer h-full"
                    >
                      <div>
                        {/* Minimalist Image Showcase */}
                        <div className="relative w-full h-48 bg-[#F4F5F7] overflow-hidden flex items-center justify-center p-4">
                          <Image
                            src={combo.imageUrl}
                            alt={lang === "es" ? combo.titleEs : combo.titleEn}
                            fill
                            className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          />

                          {/* Clean Badge & Discount Tags */}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
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
                            <div className="absolute top-3 right-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full backdrop-blur-md">
                              -{combo.discountPercent}%
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="p-4 sm:p-5">
                          <div className="mb-2">
                            <span className="text-[10px] font-bold text-[#C02030] tracking-wide uppercase">
                              {lang === "es" ? combo.badgeEs : combo.badgeEn}
                            </span>
                            <h2 className="text-base font-bold text-gray-900 tracking-tight leading-snug mt-0.5 group-hover:text-[#C02030] transition-colors line-clamp-2">
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
                      <div className="p-4 sm:p-5 pt-0 flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/combos/${combo.slug}`);
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-2xl bg-[#111827] hover:bg-[#C02030] text-white font-bold text-xs tracking-wider uppercase transition-colors shadow-sm group-hover:bg-[#C02030]"
                        >
                          <span>{t.comboViewDetails}</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </button>

                        <Link
                          href={`/cotizar?tipo=combo&id=${combo.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                          title={
                            lang === "es"
                              ? "Cotizar por WhatsApp o consultar"
                              : "Inquire or custom quote"
                          }
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            <CatalogPagination
              currentPage={safeCurrentPage}
              totalItems={filteredCombos.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
              layoutIdPrefix="combos-pagination"
            />
          </>
        )}
      </main>

      {/* Global Modals & Drawers */}
      <GarageModal />
      <CartDrawer />
      <FloatingConcierge />
    </div>
  );
}
