"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Award,
  Sparkles,
  TrendingUp,
  Percent,
  Layers,
  ShoppingBag,
  RefreshCw,
  Tag,
  DollarSign,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  BarChart3,
  CheckCircle2,
  Package,
  Calendar,
  PieChart,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { formatCRC, formatUSD } from "@/lib/i18n";

interface CategoryMetric {
  id: string;
  slug: string;
  nameEs: string;
  nameEn: string;
  unitsSold: number;
  totalRevenueCRC: number;
  ordersCount: number;
  unitsSharePct: number;
  revenueSharePct: number;
}

interface ProductAnalysisData {
  totalConfirmedOrders: number;
  totalUnitsSold: number;
  totalRevenueCRC: number;
  averageItemPriceCRC: number;
  timeframe: string;
  metrics: {
    mostSoldBrand: {
      brandName: string;
      unitsSold: number;
      totalRevenueCRC: number;
      ordersCount: number;
      marketSharePct: number;
    } | null;
    mostSoldItem: {
      id: string;
      sku: string;
      nameEs: string;
      nameEn: string;
      imageUrl: string;
      unitsSold: number;
      totalRevenueCRC: number;
      brandName: string;
      categoryNameEs: string;
    } | null;
    mostSoldCombo: {
      id: string;
      slug: string;
      titleEs: string;
      titleEn: string;
      unitsSold: number;
      totalRevenueCRC: number;
      badgeEs?: string;
      categoryNameEs: string;
    } | null;
    highestMarginProduct: {
      id: string;
      sku: string;
      slug: string;
      nameEs: string;
      nameEn: string;
      brandName: string;
      priceCRC: number;
      profitCRC: number;
      marginPct: number;
      imageUrl: string;
      type: "product";
    } | null;
    highestMarginCombo: {
      id: string;
      slug: string;
      titleEs: string;
      titleEn: string;
      badgeEs: string;
      badgeEn: string;
      priceCRC: number;
      profitCRC: number;
      marginPct: number;
      imageUrl: string;
      type: "combo";
    } | null;
    highestMarginOverall: {
      id: string;
      sku: string;
      slug: string;
      nameEs: string;
      nameEn: string;
      brandName: string;
      priceCRC: number;
      profitCRC: number;
      marginPct: number;
      imageUrl: string;
      type: "product" | "combo";
      isProduct: boolean;
    } | null;
  };
  rankings: {
    top5Categories: CategoryMetric[];
    allCategoriesRanked: CategoryMetric[];
    topBrands: Array<{
      brandName: string;
      unitsSold: number;
      totalRevenueCRC: number;
      ordersCount: number;
      marketSharePct: number;
    }>;
    topItems: Array<{
      id: string;
      sku: string;
      nameEs: string;
      nameEn: string;
      imageUrl: string;
      unitsSold: number;
      totalRevenueCRC: number;
      brandName: string;
      categoryNameEs: string;
    }>;
    topCombos: Array<{
      id: string;
      slug: string;
      titleEs: string;
      titleEn: string;
      unitsSold: number;
      totalRevenueCRC: number;
      badgeEs?: string;
      categoryNameEs: string;
    }>;
    topMarginProducts: Array<{
      id: string;
      sku: string;
      slug: string;
      nameEs: string;
      nameEn: string;
      brandName: string;
      priceCRC: number;
      profitCRC: number;
      marginPct: number;
      imageUrl: string;
      type: "product";
    }>;
    topMarginCombos: Array<{
      id: string;
      slug: string;
      titleEs: string;
      titleEn: string;
      badgeEs: string;
      badgeEn: string;
      priceCRC: number;
      profitCRC: number;
      marginPct: number;
      imageUrl: string;
      type: "combo";
    }>;
  };
}

interface ProductsAnalysisTabProps {
  currency?: "CRC" | "USD";
  onToggleCurrency?: () => void;
}

type TimeframeOption = "all" | "month" | "30days";
type RankingTabOption = "categories" | "items" | "brands" | "combos" | "margins";

export function ProductsAnalysisTab({
  currency = "CRC",
  onToggleCurrency,
}: ProductsAnalysisTabProps) {
  const { lang } = useLanguage();
  const [data, setData] = useState<ProductAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<TimeframeOption>("all");
  const [activeRankingTab, setActiveRankingTab] = useState<RankingTabOption>("categories");

  const [exchangeRate, setExchangeRate] = useState<number>(455.21);
  const currencyPrefix = currency === "USD" ? "$" : "₡";

  useEffect(() => {
    let mounted = true;
    fetch("/api/exchange-rate", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        if (mounted && res?.data?.rate && res.data.rate > 300) {
          setExchangeRate(Number(res.data.rate));
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const getI18n = useCallback(
    (esText?: string | null, enText?: string | null, fallback = "N/A") => {
      if (lang === "es") return esText || enText || fallback;
      return enText || esText || fallback;
    },
    [lang]
  );

  const formatVal = useCallback(
    (amountCRC: number | string | undefined | null) => {
      const num = Number(amountCRC) || 0;
      if (currency === "USD") {
        return Math.round((num / exchangeRate) * 100) / 100;
      }
      return num;
    },
    [currency, exchangeRate]
  );

  const fetchData = useCallback(
    async (isRefresh = false, selectedTimeframe = timeframe) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/sys/analytics/products?timeframe=${selectedTimeframe}`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          setData(json.data);
        } else {
          throw new Error(json.error || "Error al cargar análisis de productos");
        }
      } catch (err: any) {
        console.error("Error fetching product analytics:", err);
        setError(err.message || "No se pudo cargar la analítica de productos.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [timeframe]
  );

  useEffect(() => {
    fetchData(false, timeframe);
  }, [fetchData, timeframe]);

  // Animated Skeleton Loader (Rule 7: Continuous shimmer on the same layout)
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="bg-white rounded-3xl p-6 border border-black/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200 rounded-lg" />
            <div className="h-4 w-72 bg-gray-100 rounded-md" />
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-gray-200 rounded-xl" />
            <div className="h-9 w-20 bg-gray-200 rounded-xl" />
          </div>
        </div>

        {/* 4 Core Spotlight Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-black/[0.04] space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-gray-200 rounded" />
                <div className="w-8 h-8 rounded-xl bg-gray-200" />
              </div>
              <div className="h-7 w-40 bg-gray-300 rounded" />
              <div className="h-4 w-32 bg-gray-100 rounded" />
              <div className="pt-2 border-t border-gray-100 h-4 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>

        {/* Top 5 Categories Comparison Skeleton */}
        <div className="bg-white rounded-3xl p-6 border border-black/[0.04] space-y-4">
          <div className="h-6 w-64 bg-gray-200 rounded" />
          <div className="h-8 w-full bg-gray-100 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-28 bg-gray-50 rounded-2xl border border-gray-100" />
            ))}
          </div>
        </div>

        {/* Rankings Table Skeleton */}
        <div className="bg-white rounded-3xl p-6 border border-black/[0.04] h-72 bg-gray-50" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center border border-rose-200 space-y-4 max-w-lg mx-auto shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-gray-900">
          {lang === "es" ? "Error al cargar análisis de productos" : "Failed to load product analytics"}
        </h3>
        <p className="text-xs text-gray-500">{error}</p>
        <button
          type="button"
          onClick={() => fetchData()}
          className="px-4 py-2 rounded-xl bg-[#141414] text-white text-xs font-bold hover:bg-[#F05526] transition shadow-xs cursor-pointer"
        >
          {lang === "es" ? "Reintentar" : "Retry"}
        </button>
      </div>
    );
  }

  const { metrics, rankings } = data;
  const top5 = rankings.top5Categories || [];

  // Colors array for category comparison bars
  const categoryColors = [
    "from-orange-500 to-amber-500",
    "from-blue-600 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-purple-600 to-indigo-500",
    "from-rose-500 to-pink-500",
  ];

  const categoryBgPills = [
    "bg-orange-50 text-orange-800 border-orange-200",
    "bg-blue-50 text-blue-800 border-blue-200",
    "bg-emerald-50 text-emerald-800 border-emerald-200",
    "bg-purple-50 text-purple-800 border-purple-200",
    "bg-rose-50 text-rose-800 border-rose-200",
  ];

  return (
    <div className="space-y-6">
      {/* =====================================================================
          1. HEADER SECTION: TITLE, TIMEFRAME FILTER, REFRESH & CURRENCY TOGGLE
         ===================================================================== */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-black/[0.04] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[11px] font-bold text-[#F05526] uppercase tracking-wider mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{lang === "es" ? "Consola de Inteligencia de Catálogo" : "Catalog Intelligence Console"}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#141414] tracking-tight">
            {lang === "es" ? "Análisis de Productos & Ventas" : "Products & Sales Analysis"}
          </h1>
          <p className="text-xs text-[#71717A] max-w-2xl mt-0.5">
            {lang === "es"
              ? "Métricas en tiempo real disponibles para todo el equipo: marcas más vendidas, artículos líderes, combos con mayor rotación, comparativa de las 5 categorías más solicitadas y márgenes de ganancia."
              : "Real-time metrics for all staff: top-selling brands, best-selling items, high-rotation combos, top 5 category comparison, and profit margin leaders."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Timeframe Selector Pill Bar */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setTimeframe("all")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                timeframe === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {lang === "es" ? "Histórico Total" : "All Time"}
            </button>
            <button
              type="button"
              onClick={() => setTimeframe("month")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                timeframe === "month" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {lang === "es" ? "Este Mes" : "This Month"}
            </button>
            <button
              type="button"
              onClick={() => setTimeframe("30days")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                timeframe === "30days" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {lang === "es" ? "Últimos 30d" : "Last 30d"}
            </button>
          </div>

          {/* Currency Toggle */}
          {onToggleCurrency && (
            <button
              type="button"
              onClick={onToggleCurrency}
              className="px-3.5 py-1.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-mono font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
            >
              <span>{currency === "USD" ? "$ USD" : "₡ CRC"}</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchData(true, timeframe)}
            disabled={refreshing}
            className="p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition cursor-pointer shadow-2xs"
            title={lang === "es" ? "Actualizar Métricas" : "Refresh Metrics"}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-[#F05526]" : ""}`} />
          </button>
        </div>
      </section>

      {/* =====================================================================
          2. KPI SUMMARY QUICK STRIP (4 Micro KPIs)
         ===================================================================== */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-black/[0.04] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            {lang === "es" ? "Unidades Totales Vendidas" : "Total Units Sold"}
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
            {data.totalUnitsSold} <span className="text-xs font-normal text-slate-400">{lang === "es" ? "uds" : "units"}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-black/[0.04] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            {lang === "es" ? "Facturación de Catálogo" : "Total Catalog Revenue"}
          </span>
          <div className="text-xl sm:text-2xl font-black text-[#F05526] font-mono mt-1">
            {currencyPrefix}{Math.round(formatVal(data.totalRevenueCRC)).toLocaleString()}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-black/[0.04] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            {lang === "es" ? "Órdenes Confirmadas" : "Confirmed Orders"}
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
            {data.totalConfirmedOrders} <span className="text-xs font-normal text-slate-400">{lang === "es" ? "pedidos" : "orders"}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-black/[0.04] shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            {lang === "es" ? "Ticket Promedio por Pieza" : "Avg Revenue per Unit"}
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1">
            {currencyPrefix}{Math.round(formatVal(data.averageItemPriceCRC)).toLocaleString()}
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. 4 CORE SPOTLIGHT CARDS: Brand, Item, Combo, Profit Margin
         ===================================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Most Sold Brand */}
        <div className="bg-gradient-to-br from-amber-50/70 via-white to-orange-50/30 rounded-3xl p-5 border border-amber-200/90 shadow-2xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                {lang === "es" ? "Marca Más Vendida" : "Most Sold Brand"}
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-gray-900 mt-2 truncate">
              {metrics.mostSoldBrand?.unitsSold
                ? metrics.mostSoldBrand.brandName
                : (lang === "es" ? "Sin ventas registradas" : "No sales recorded")}
            </div>
            <div className="text-xs text-amber-800 font-semibold mt-0.5">
              {metrics.mostSoldBrand?.unitsSold || 0} {lang === "es" ? "unidades vendidas" : "units sold"}
              {metrics.mostSoldBrand?.marketSharePct ? ` (${metrics.mostSoldBrand.marketSharePct}% cuota)` : ""}
            </div>
          </div>
          <div className="pt-2 border-t border-amber-100 text-[11px] text-gray-600 flex justify-between items-center">
            <span>{lang === "es" ? "Ventas Totales:" : "Total Sales:"}</span>
            <span className="font-mono font-bold text-gray-900">
              {currencyPrefix}{Math.round(formatVal(metrics.mostSoldBrand?.totalRevenueCRC || 0)).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 2: Most Sold Item */}
        <div className="bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/30 rounded-3xl p-5 border border-blue-200/90 shadow-2xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                {lang === "es" ? "Artículo Más Vendido" : "Most Sold Item"}
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div
              className="text-lg font-black text-gray-900 mt-2 line-clamp-1"
              title={getI18n(metrics.mostSoldItem?.nameEs, metrics.mostSoldItem?.nameEn)}
            >
              {getI18n(
                metrics.mostSoldItem?.nameEs,
                metrics.mostSoldItem?.nameEn,
                lang === "es" ? "Sin artículos registrados" : "No items recorded"
              )}
            </div>
            <div className="text-xs text-blue-800 font-semibold mt-0.5">
              {metrics.mostSoldItem?.unitsSold || 0} {lang === "es" ? "unidades vendidas" : "units sold"}
            </div>
          </div>
          <div className="pt-2 border-t border-blue-100 text-[11px] text-gray-600 flex justify-between items-center">
            <span className="truncate max-w-[130px]">
              {metrics.mostSoldItem?.brandName || (lang === "es" ? "Sin marca" : "No brand")}
            </span>
            <span className="font-mono font-bold text-gray-900">
              {currencyPrefix}{Math.round(formatVal(metrics.mostSoldItem?.totalRevenueCRC || 0)).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 3: Most Sold Combo */}
        <div className="bg-gradient-to-br from-purple-50/70 via-white to-fuchsia-50/30 rounded-3xl p-5 border border-purple-200/90 shadow-2xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                {lang === "es" ? "Combo Más Vendido" : "Most Sold Combo"}
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div
              className="text-lg font-black text-gray-900 mt-2 line-clamp-1"
              title={getI18n(metrics.mostSoldCombo?.titleEs, metrics.mostSoldCombo?.titleEn)}
            >
              {getI18n(
                metrics.mostSoldCombo?.titleEs,
                metrics.mostSoldCombo?.titleEn,
                lang === "es" ? "Sin combos vendidos" : "No combos sold"
              )}
            </div>
            <div className="text-xs text-purple-800 font-semibold mt-0.5">
              {metrics.mostSoldCombo?.unitsSold || 0} {lang === "es" ? "paquetes vendidos" : "packs sold"}
            </div>
          </div>
          <div className="pt-2 border-t border-purple-100 text-[11px] text-gray-600 flex justify-between items-center">
            <span className="truncate max-w-[120px]">
              {metrics.mostSoldCombo?.badgeEs || (lang === "es" ? "Sin combo activo" : "No active combo")}
            </span>
            <span className="font-mono font-bold text-gray-900">
              {currencyPrefix}{Math.round(formatVal(metrics.mostSoldCombo?.totalRevenueCRC || 0)).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 4: Product or Combo with Highest Profit Margin */}
        <div className="bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 rounded-3xl p-5 border-2 border-emerald-300 shadow-xs flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300">
                {lang === "es" ? "Mayor Margen de Utilidad" : "Highest Profit Margin"}
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div
              className="text-lg font-black text-gray-900 mt-2 line-clamp-1"
              title={getI18n(metrics.highestMarginOverall?.nameEs, metrics.highestMarginOverall?.nameEn)}
            >
              {getI18n(
                metrics.highestMarginOverall?.nameEs,
                metrics.highestMarginOverall?.nameEn,
                lang === "es" ? "Sin datos de margen" : "No margin data"
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-black text-emerald-700 font-mono">
                {metrics.highestMarginOverall?.marginPct || 0}%
              </span>
              <span className="text-[11px] font-semibold text-emerald-800">
                {metrics.highestMarginOverall?.type === "combo" ? "Combo Pack" : (lang === "es" ? "Producto" : "Product")}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-emerald-100 text-[11px] text-gray-700 flex justify-between items-center">
            <span>{lang === "es" ? "Ganancia Unitaria:" : "Unit Profit:"}</span>
            <span className="font-mono font-bold text-emerald-800">
              +{currencyPrefix}{Math.round(formatVal(metrics.highestMarginOverall?.profitCRC || 0)).toLocaleString()}
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. COMPARISON OF TOP 5 MOST SOLD CATEGORIES (Core Requested Feature)
         ===================================================================== */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-black/[0.04] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.04] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-2">
              <PieChart className="w-3.5 h-3.5" />
              <span>{lang === "es" ? "Comparativa por Segmento" : "Segment Comparison"}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#141414] flex items-center gap-2">
              <span>{lang === "es" ? "Comparativa de las 5 Categorías Más Vendidas" : "Comparison of Top 5 Most Sold Categories"}</span>
            </h2>
            <p className="text-xs text-[#71717A] max-w-2xl mt-0.5">
              {lang === "es"
                ? "Distribución porcentual de unidades vendidas y volumen de facturación generado por las 5 categorías con mayor demanda en el taller y tienda."
                : "Percentage breakdown of units sold and gross revenue generated by the top 5 high-demand categories in the workshop and catalog."}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {lang === "es" ? "Total Unidades Analizadas:" : "Total Units Evaluated:"}
            </span>
            <span className="text-base font-black text-slate-900 font-mono">
              {data.totalUnitsSold} {lang === "es" ? "piezas" : "parts"}
            </span>
          </div>
        </div>

        {/* Visual Stacked Distribution Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>{lang === "es" ? "Distribución Porcentual de Unidades (Top 5):" : "Units Distribution Share (Top 5):"}</span>
            <span className="text-[11px] font-mono text-slate-500">
              {top5.reduce((acc, c) => acc + c.unitsSharePct, 0).toFixed(1)}% {lang === "es" ? "del volumen total" : "of total volume"}
            </span>
          </div>
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            {top5.map((cat, idx) => {
              const share = cat.unitsSharePct;
              if (share <= 0) return null;
              return (
                <div
                  key={cat.id || idx}
                  style={{ width: `${share}%` }}
                  className={`h-full bg-gradient-to-r ${categoryColors[idx % categoryColors.length]} transition-all duration-500`}
                  title={`${lang === "es" ? cat.nameEs : cat.nameEn}: ${share}% (${cat.unitsSold} uds)`}
                />
              );
            })}
          </div>
        </div>

        {/* Top 5 Comparison Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
          {top5.map((cat, idx) => {
            return (
              <div
                key={cat.id || idx}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-blue-300 transition-all shadow-2xs space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-mono font-black text-xs flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${categoryBgPills[idx % categoryBgPills.length]}`}>
                      {cat.unitsSharePct}% {lang === "es" ? "cuota" : "share"}
                    </span>
                  </div>

                  <h3 className="text-xs font-extrabold text-slate-900 line-clamp-2 leading-tight" title={lang === "es" ? cat.nameEs : cat.nameEn}>
                    {lang === "es" ? cat.nameEs : cat.nameEn}
                  </h3>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-200/80 text-[11px]">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>{lang === "es" ? "Unidades:" : "Units Sold:"}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {cat.unitsSold} uds
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>{lang === "es" ? "Ventas:" : "Revenue:"}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {currencyPrefix}{Math.round(formatVal(cat.totalRevenueCRC)).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>{lang === "es" ? "Pedidos:" : "Orders:"}</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {cat.ordersCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          5. RANKINGS & DEEP DIVE TABS (Categories, Items, Brands, Combos, Margins)
         ===================================================================== */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-black/[0.04] space-y-5">
        {/* Sub-tab navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.04] pb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setActiveRankingTab("categories")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeRankingTab === "categories"
                  ? "bg-[#141414] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              {lang === "es" ? "Todas las Categorías" : "All Categories"}
            </button>
            <button
              type="button"
              onClick={() => setActiveRankingTab("items")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeRankingTab === "items"
                  ? "bg-[#141414] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              {lang === "es" ? "Top Artículos" : "Top Items"}
            </button>
            <button
              type="button"
              onClick={() => setActiveRankingTab("brands")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeRankingTab === "brands"
                  ? "bg-[#141414] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              {lang === "es" ? "Top Marcas" : "Top Brands"}
            </button>
            <button
              type="button"
              onClick={() => setActiveRankingTab("combos")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeRankingTab === "combos"
                  ? "bg-[#141414] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              {lang === "es" ? "Combos Especiales" : "Special Combos"}
            </button>
            <button
              type="button"
              onClick={() => setActiveRankingTab("margins")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeRankingTab === "margins"
                  ? "bg-[#141414] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              }`}
            >
              {lang === "es" ? "Mayor Margen (%)" : "Highest Margins (%)"}
            </button>
          </div>

          <span className="text-xs text-slate-400 font-mono self-end sm:self-auto">
            {timeframe === "all" ? "Historial Completo" : timeframe === "month" ? "Mes Actual" : "Últimos 30 Días"}
          </span>
        </div>

        {/* Tab 1: All Categories Detailed Table */}
        {activeRankingTab === "categories" && (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pl-2">#</th>
                    <th className="pb-3">{lang === "es" ? "Categoría" : "Category"}</th>
                    <th className="pb-3 text-right">{lang === "es" ? "Uds Vendidas" : "Units Sold"}</th>
                    <th className="pb-3 text-right">{lang === "es" ? "% Cuota Uds" : "Units Share %"}</th>
                    <th className="pb-3 text-right">{lang === "es" ? "Facturación" : "Total Revenue"}</th>
                    <th className="pb-3 text-right pr-2">{lang === "es" ? "Órdenes" : "Orders"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rankings.allCategoriesRanked.map((cat, idx) => (
                    <tr key={cat.id || idx} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 pl-2 font-mono font-bold text-slate-400">#{idx + 1}</td>
                      <td className="py-3">
                        <span className="font-extrabold text-slate-900 text-xs block">
                          {lang === "es" ? cat.nameEs : cat.nameEn}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{cat.slug}</span>
                      </td>
                      <td className="py-3 text-right font-mono font-black text-slate-900">
                        {cat.unitsSold}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-blue-700">
                        {cat.unitsSharePct}%
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900">
                        {currencyPrefix}{Math.round(formatVal(cat.totalRevenueCRC)).toLocaleString()}
                      </td>
                      <td className="py-3 text-right pr-2 font-mono text-slate-500">
                        {cat.ordersCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Top Items Table */}
        {activeRankingTab === "items" && (
          <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
            {rankings.topItems.length > 0 ? (
              rankings.topItems.map((item, idx) => (
                <div key={item.id || idx} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl px-2.5 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-mono font-black text-xs shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-900 truncate">
                        {lang === "es" ? item.nameEs : item.nameEn}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2">
                        <span className="font-semibold text-slate-700">{item.brandName}</span>
                        <span>• {item.categoryNameEs}</span>
                        {item.sku && <span>• SKU: {item.sku}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-slate-900 font-mono">
                      {item.unitsSold} {lang === "es" ? "unidades" : "units"}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {currencyPrefix}{Math.round(formatVal(item.totalRevenueCRC)).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-10 text-center">
                {lang === "es" ? "No hay artículos registrados para este período." : "No item sales in this period."}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Top Brands Table */}
        {activeRankingTab === "brands" && (
          <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
            {rankings.topBrands.length > 0 ? (
              rankings.topBrands.map((brand, idx) => (
                <div key={brand.brandName || idx} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl px-2.5 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-mono font-black text-xs shrink-0">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-sm font-black text-slate-900">
                        {brand.brandName}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {brand.ordersCount} {lang === "es" ? "pedidos que incluyeron la marca" : "orders included this brand"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-amber-900 font-mono">
                      {brand.unitsSold} {lang === "es" ? "uds" : "units"} ({brand.marketSharePct}%)
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {currencyPrefix}{Math.round(formatVal(brand.totalRevenueCRC)).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-10 text-center">
                {lang === "es" ? "No hay marcas registradas con ventas en este período." : "No brand sales recorded in this period."}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Combos Table */}
        {activeRankingTab === "combos" && (
          <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
            {rankings.topCombos.length > 0 ? (
              rankings.topCombos.map((combo, idx) => (
                <div key={combo.id || idx} className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl px-2.5 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-mono font-black text-xs shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-900 truncate">
                        {lang === "es" ? combo.titleEs : combo.titleEn}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2">
                        <span className="font-semibold text-purple-700">{combo.badgeEs || "Pack Especial"}</span>
                        <span>• {combo.categoryNameEs}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-purple-900 font-mono">
                      {combo.unitsSold} {lang === "es" ? "paquetes" : "packs"}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {currencyPrefix}{Math.round(formatVal(combo.totalRevenueCRC)).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-10 text-center">
                {lang === "es" ? "No se registran ventas de combos en este período." : "No combo sales recorded in this period."}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Profit Margins (Products & Combos Comparison) */}
        {activeRankingTab === "margins" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Products by Margin */}
              <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-950 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{lang === "es" ? "Productos con Mayor Margen (%)" : "Top Margin Products (%)"}</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Catálogo Activo
                  </span>
                </div>
                <div className="divide-y divide-emerald-100/80 max-h-[350px] overflow-y-auto pr-1">
                  {rankings.topMarginProducts.length > 0 ? (
                    rankings.topMarginProducts.map((p, idx) => (
                      <div key={p.id || idx} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-slate-900 truncate">
                            {lang === "es" ? p.nameEs : p.nameEn}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {p.brandName} • {currencyPrefix}{Math.round(formatVal(p.priceCRC)).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-emerald-800 font-mono">
                            {p.marginPct}%
                          </div>
                          <div className="text-[10px] text-emerald-700 font-mono">
                            +{currencyPrefix}{Math.round(formatVal(p.profitCRC)).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 py-8 text-center">
                      {lang === "es" ? "No hay productos con margen registrados." : "No products found."}
                    </div>
                  )}
                </div>
              </div>

              {/* Combos by Margin */}
              <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-purple-950 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-purple-700" />
                    <span>{lang === "es" ? "Combos con Mayor Margen (%)" : "Top Margin Combos (%)"}</span>
                  </span>
                  <span className="text-[10px] font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                    Paquetes
                  </span>
                </div>
                <div className="divide-y divide-purple-100/80 max-h-[350px] overflow-y-auto pr-1">
                  {rankings.topMarginCombos.length > 0 ? (
                    rankings.topMarginCombos.map((c, idx) => (
                      <div key={c.id || idx} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-slate-900 truncate">
                            {lang === "es" ? c.titleEs : c.titleEn}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {c.badgeEs} • {currencyPrefix}{Math.round(formatVal(c.priceCRC)).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-purple-800 font-mono">
                            {c.marginPct}%
                          </div>
                          <div className="text-[10px] text-purple-700 font-mono">
                            +{currencyPrefix}{Math.round(formatVal(c.profitCRC)).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 py-8 text-center">
                      {lang === "es" ? "No hay combos registrados en catálogo." : "No combos found in catalog."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
