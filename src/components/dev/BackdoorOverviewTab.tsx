"use client";

import React, { useState, useMemo } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  SlidersHorizontal,
  TrendingUp,
  Wallet,
  Wrench,
  Truck,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  BarChart3,
  Activity,
  Layers,
  DollarSign,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  AnimatedStatNumber,
  VertixLineChart,
  VertixHatchedProgressBar,
  type LineChartDatum,
  type CapsuleBarDatum,
} from "./BackdoorAnimatedPrimitives";
import type { TimeBucketStat } from "@/app/api/sys/analytics/route";

export interface AnalyticsPayload {
  exchangeRate: number;
  kpis: {
    grossOrdersIncomeCRC: number;
    ordersProfitCRC: number;
    totalPartsCostCRC: number;
    grossServiceIncomeCRC: number;
    grossInstallationIncomeCRC: number;
    totalProfitCRC: number;
    totalConsolidatedGrossCRC: number;
    totalTaxCRC: number;
    totalDiscountCRC: number;
    averageOrderValueCRC: number;
    profitMarginPercent: number;
    monthGrowthPercent: number;
    ordersInProgressCount: number;
    ordersCompletedCount: number;
    ordersPendingPaymentCount: number;
    ordersCancelledCount: number;
    totalOrdersCount: number;
    scheduledServicesCount: number;
    electronicInvoicesCount: number;
    totalUnitsSold: number;
    usersCount: number;
    vehiclesCount: number;
    activeProductsCount: number;
    activeCombosCount: number;
    packagesCount: number;
  };
  statusDistribution: Record<string, number>;
  serviceTypeDistribution: Record<string, { count: number; revenueCRC: number }>;
  series: {
    months: TimeBucketStat[];
    days: TimeBucketStat[];
    hours: TimeBucketStat[];
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    status: string;
    serviceType: string;
    grossOrdersCRC: number;
    ordersProfitCRC: number;
    grossServiceCRC: number;
    grossInstallationCRC: number;
    totalGrossCRC: number;
    totalProfitCRC: number;
    itemsCount: number;
    firstItemTitle: string;
    createdAt: string;
    updatedAt: string;
    isInstallationPaymentConfirmed: boolean;
  }>;
  recentAuditLogs: any[];
}

type TimeframeOption = "months" | "days" | "hours";
type StatChartOption =
  | "profit_vs_gross"
  | "parts_vs_profit"
  | "gross_orders"
  | "orders_profit"
  | "gross_service"
  | "gross_installation"
  | "orders_in_progress";

interface BackdoorOverviewTabProps {
  analytics: AnalyticsPayload | null;
  loading: boolean;
  currency: "CRC" | "USD";
  onToggleCurrency: () => void;
  onNavigateTab: (tab: any) => void;
}

export function BackdoorOverviewTab({
  analytics,
  loading,
  currency,
  onToggleCurrency,
  onNavigateTab,
}: BackdoorOverviewTabProps) {
  const { lang } = useLanguage();

  const [timeframe, setTimeframe] = useState<TimeframeOption>("months");
  const [chartMetric, setChartMetric] = useState<StatChartOption>("profit_vs_gross");
  const [activitySearch, setActivitySearch] = useState("");
  const [activityStatusFilter, setActivityStatusFilter] = useState<string>("ALL");

  const rate = analytics?.exchangeRate || 515;
  const isUSD = currency === "USD";
  const currencyPrefix = isUSD ? "$" : "₡";
  const decimals = isUSD ? 2 : 0;

  const convertVal = (crc: number): number => {
    if (!isUSD) return crc;
    return Number((crc / rate).toFixed(2));
  };

  const kpis = analytics?.kpis || {
    grossOrdersIncomeCRC: 0,
    ordersProfitCRC: 0,
    totalPartsCostCRC: 0,
    grossServiceIncomeCRC: 0,
    grossInstallationIncomeCRC: 0,
    totalProfitCRC: 0,
    totalConsolidatedGrossCRC: 0,
    totalTaxCRC: 0,
    totalDiscountCRC: 0,
    averageOrderValueCRC: 0,
    profitMarginPercent: 0,
    monthGrowthPercent: 0,
    ordersInProgressCount: 0,
    ordersCompletedCount: 0,
    ordersPendingPaymentCount: 0,
    ordersCancelledCount: 0,
    totalOrdersCount: 0,
    scheduledServicesCount: 0,
    electronicInvoicesCount: 0,
    totalUnitsSold: 0,
    usersCount: 0,
    vehiclesCount: 0,
    activeProductsCount: 0,
    activeCombosCount: 0,
    packagesCount: 0,
  };

  // Build chart data based on selected timeframe (months / days / hours) & stat metric
  const chartConfig = useMemo(() => {
    const rawSeries = analytics?.series?.[timeframe] || [];
    // For overview compactness: show 8 recent months, 8 recent days, or 8 active 3-hour/peak hour slots
    let slicedSeries = rawSeries;
    if (timeframe === "months") {
      const curMonth = new Date().getMonth();
      const start = Math.max(0, Math.min(4, curMonth - 6));
      slicedSeries = rawSeries.slice(start, start + 8);
    } else if (timeframe === "days") {
      slicedSeries = rawSeries.slice(-8);
    } else if (timeframe === "hours") {
      // Show hours that have data or standard business hours (08:00 to 23:00 step 2)
      const activeHours = rawSeries.filter((h, i) => h.totalGrossCRC > 0 || h.ordersCount > 0 || (i >= 8 && i <= 22 && i % 2 === 0));
      slicedSeries = activeHours.slice(0, 8);
    }

    const data: CapsuleBarDatum[] = slicedSeries.map((b) => {
      const label = lang === "es" ? b.labelEs : b.labelEn;
      if (chartMetric === "profit_vs_gross") {
        return {
          key: b.key,
          label,
          subLabel: b.subLabel,
          primaryValue: convertVal(b.totalProfitCRC),
          secondaryValue: convertVal(b.partsCostCRC || Math.max(0, b.totalGrossCRC - b.totalProfitCRC)),
          tooltipPrimaryLabel: lang === "es" ? "Ganancia Total" : "Total Profit",
          tooltipSecondaryLabel: lang === "es" ? "Costo Base" : "Base Cost",
        };
      }
      if (chartMetric === "parts_vs_profit") {
        return {
          key: b.key,
          label,
          subLabel: b.subLabel,
          primaryValue: convertVal(b.ordersProfitCRC),
          secondaryValue: convertVal(b.partsCostCRC),
          tooltipPrimaryLabel: lang === "es" ? "Ganancia de Órdenes" : "Orders Profit",
          tooltipSecondaryLabel: lang === "es" ? "Costo Base Piezas" : "Parts Base Cost",
        };
      }
      if (chartMetric === "gross_orders") {
        return {
          key: b.key,
          label,
          subLabel: b.subLabel,
          primaryValue: convertVal(b.grossOrdersCRC),
          secondaryValue: convertVal(b.ordersProfitCRC),
          tooltipPrimaryLabel: lang === "es" ? "Ingreso Bruto Órdenes" : "Gross Orders Income",
          tooltipSecondaryLabel: lang === "es" ? "Ganancia Órdenes" : "Orders Profit",
        };
      }
      if (chartMetric === "orders_profit") {
        return {
          key: b.key,
          label,
          subLabel: b.subLabel,
          primaryValue: convertVal(b.ordersProfitCRC),
          secondaryValue: convertVal(b.partsCostCRC),
          tooltipPrimaryLabel: lang === "es" ? "Ganancia Órdenes" : "Orders Profit",
          tooltipSecondaryLabel: lang === "es" ? "Costo Proveedor" : "Supplier Cost",
        };
      }
      if (chartMetric === "gross_service") {
        return {
          key: b.key,
          label,
          subLabel: b.subLabel,
          primaryValue: convertVal(b.grossServiceCRC),
          secondaryValue: convertVal(b.grossInstallationCRC),
          tooltipPrimaryLabel: lang === "es" ? "Ingreso Servicios" : "Gross Service",
          tooltipSecondaryLabel: lang === "es" ? "Ingreso Instalación" : "Gross Install",
        };
      }
      if (chartMetric === "gross_installation") {
        return {
          key: b.key,
          label,
          subLabel: b.subLabel,
          primaryValue: convertVal(b.grossInstallationCRC),
          secondaryValue: convertVal(b.grossServiceCRC),
          tooltipPrimaryLabel: lang === "es" ? "Ingreso Instalación" : "Gross Installation",
          tooltipSecondaryLabel: lang === "es" ? "Ingreso Servicios" : "Gross Service",
        };
      }
      // orders_in_progress
      return {
        key: b.key,
        label,
        subLabel: b.subLabel,
        primaryValue: b.ordersInProgress,
        secondaryValue: b.ordersCompleted,
        tooltipPrimaryLabel: lang === "es" ? "En Progreso" : "In Progress",
        tooltipSecondaryLabel: lang === "es" ? "Completadas" : "Completed",
      };
    });

    const legends: Record<StatChartOption, { title: string; primary: string; secondary?: string; isCount?: boolean }> = {
      profit_vs_gross: {
        title: lang === "es" ? "Ganancia vs Costo" : "Profit and Cost",
        primary: lang === "es" ? "Ganancia" : "Profit",
        secondary: lang === "es" ? "Costo" : "Cost",
      },
      parts_vs_profit: {
        title: lang === "es" ? "Costo Piezas vs Ganancia" : "Cost vs Profit",
        primary: lang === "es" ? "Ganancia Órdenes" : "Orders Profit",
        secondary: lang === "es" ? "Costo Piezas" : "Parts Cost",
      },
      gross_orders: {
        title: lang === "es" ? "Órdenes: Bruto vs Ganancia" : "Orders: Gross vs Profit",
        primary: lang === "es" ? "Bruto" : "Gross",
        secondary: lang === "es" ? "Ganancia" : "Profit",
      },
      orders_profit: {
        title: lang === "es" ? "Ganancia de Órdenes" : "Orders Profit",
        primary: lang === "es" ? "Ganancia" : "Profit",
        secondary: lang === "es" ? "Costo" : "Cost",
      },
      gross_service: {
        title: lang === "es" ? "Servicios vs Instalación" : "Service vs Install",
        primary: lang === "es" ? "Servicios" : "Service",
        secondary: lang === "es" ? "Instalación" : "Install",
      },
      gross_installation: {
        title: lang === "es" ? "Ingreso Instalación" : "Installation Income",
        primary: lang === "es" ? "Instalación" : "Install",
        secondary: lang === "es" ? "Servicios" : "Service",
      },
      orders_in_progress: {
        title: lang === "es" ? "Órdenes en Progreso" : "Orders in Progress",
        primary: lang === "es" ? "En Progreso" : "Active",
        secondary: lang === "es" ? "Completadas" : "Done",
        isCount: true,
      },
    };

    return {
      data,
      meta: legends[chartMetric],
    };
  }, [analytics, timeframe, chartMetric, lang, isUSD, rate]);

  // Filter Recent Activities (Orders)
  const filteredActivities = useMemo(() => {
    const list = analytics?.recentOrders || [];
    return list.filter((ord) => {
      if (activityStatusFilter !== "ALL") {
        if (activityStatusFilter === "IN_PROGRESS") {
          const s = ord.status.toUpperCase();
          if (s === "COMPLETED" || s === "DELIVERED" || s === "CANCELLED" || s === "REJECTED") {
            return false;
          }
        } else if (ord.status.toUpperCase() !== activityStatusFilter) {
          return false;
        }
      }
      if (activitySearch.trim()) {
        const q = activitySearch.toLowerCase();
        return (
          ord.orderNumber.toLowerCase().includes(q) ||
          ord.customerName.toLowerCase().includes(q) ||
          ord.firstItemTitle.toLowerCase().includes(q) ||
          ord.status.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [analytics?.recentOrders, activitySearch, activityStatusFilter]);

  if (loading && !analytics) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 h-[360px] bg-white rounded-[28px] p-6" />
          <div className="lg:col-span-4 h-[360px] bg-white rounded-[28px] p-6" />
          <div className="lg:col-span-4 h-[360px] bg-white rounded-[28px] p-6" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4 h-56 bg-white rounded-[28px] p-6" />
          <div className="lg:col-span-8 h-56 bg-white rounded-[28px] p-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ===================================================================== */}
      {/* TOP BENTO ROW (3 Main Cards matching Vertix Screenshot)              */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* 1. LEFT BENTO CARD: Total Consolidated Revenue + 3 Stream Wallets */}
        <div className="lg:col-span-4 bg-white rounded-[28px] p-6 shadow-[0_2px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div>
            {/* Card Header with Currency Selector Pill */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-neutral-600 block">
                  {lang === "es" ? "Facturación Bruta Total" : "Total Gross Balance"}
                </span>
                <span className="text-[10px] text-neutral-400 font-normal">
                  {lang === "es" ? "Total cobrado en comprobantes (con 13% IVA)" : "Total collected on receipts (incl. 13% VAT)"}
                </span>
              </div>

              <button
                type="button"
                onClick={onToggleCurrency}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-neutral-200/80 text-xs font-bold text-[#141414] transition cursor-pointer"
                title={lang === "es" ? "Cambiar moneda (CRC / USD)" : "Switch currency (CRC / USD)"}
              >
                <span className="text-sm leading-none">{isUSD ? "🇺🇸" : "🇨🇷"}</span>
                <span>{currency}</span>
                <span className="text-[10px] text-neutral-400">▾</span>
              </button>
            </div>

            {/* Huge Rising Headline Number */}
            <div className="mt-2">
              <AnimatedStatNumber
                value={convertVal(kpis.totalConsolidatedGrossCRC)}
                prefix={currencyPrefix}
                decimals={decimals}
                className="text-3xl sm:text-[34px] font-extrabold tracking-tight text-[#141414] block leading-tight"
              />
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold">
                  ↑ {Math.max(0, kpis.monthGrowthPercent)}%
                </span>
                <span className="text-xs text-neutral-400">
                  {lang === "es" ? "vs mes anterior" : "than last month"}
                </span>
              </div>
              <div className="mt-1.5 text-[11px] text-neutral-500 font-medium">
                {lang === "es"
                  ? `Subtotal sin IVA: ${currencyPrefix}${Math.round(convertVal(kpis.totalConsolidatedGrossCRC / 1.13)).toLocaleString()} (Base Cierre)`
                  : `Net of VAT: ${currencyPrefix}${Math.round(convertVal(kpis.totalConsolidatedGrossCRC / 1.13)).toLocaleString()} (Net Base)`}
              </div>
            </div>

            {/* Dual Action Pills (Transfer / Request style from screenshot) */}
            <div className="grid grid-cols-2 gap-3 my-5">
              <button
                type="button"
                onClick={() => onNavigateTab("create_order")}
                className="py-2.5 px-4 rounded-full bg-[#141414] hover:bg-neutral-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{lang === "es" ? "Crear Orden" : "New Order"}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab("analytics")}
                className="py-2.5 px-4 rounded-full bg-[#F5F5F7] hover:bg-neutral-200/80 text-[#141414] text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>{lang === "es" ? "Ver Gráficas" : "Full Graphs"}</span>
              </button>
            </div>
          </div>

          {/* Wallets / Revenue Streams Box (3 vertical sub-cards inside gray container) */}
          <div className="bg-[#F6F6F8] rounded-[22px] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-[#141414]">
                  {lang === "es" ? "Flujos" : "Streams"}
                </span>
                <span className="text-neutral-300">|</span>
                <span className="text-neutral-500 text-[11px]">
                  {lang === "es" ? "3 divisiones de ingreso" : "Total 3 income streams"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Stream 1: Gross Orders Income */}
              <button
                type="button"
                onClick={() => setChartMetric("gross_orders")}
                className={`bg-white rounded-2xl p-2.5 text-left transition border cursor-pointer ${
                  chartMetric === "gross_orders"
                    ? "border-[#F05526] shadow-xs"
                    : "border-transparent hover:border-neutral-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-orange-100 text-[#F05526] flex items-center justify-center text-[9px] font-black">
                      O
                    </span>
                    <span className="text-[10px] font-bold text-neutral-600">ORD</span>
                  </div>
                  <MoreHorizontal className="w-3 h-3 text-neutral-300" />
                </div>
                <AnimatedStatNumber
                  value={convertVal(kpis.grossOrdersIncomeCRC)}
                  prefix={currencyPrefix}
                  decimals={decimals}
                  className="text-xs font-extrabold text-[#141414] block truncate"
                />
                <span className="text-[9px] text-neutral-400 block truncate mt-0.5">
                  {lang === "es" ? "Bruto Órdenes" : "Gross Orders"}
                </span>
                <span className="text-[9.5px] font-bold text-emerald-600 block mt-1">
                  {lang === "es" ? "Activo" : "Active"}
                </span>
              </button>

              {/* Stream 2: Gross Service Income */}
              <button
                type="button"
                onClick={() => setChartMetric("gross_service")}
                className={`bg-white rounded-2xl p-2.5 text-left transition border cursor-pointer ${
                  chartMetric === "gross_service"
                    ? "border-[#F05526] shadow-xs"
                    : "border-transparent hover:border-neutral-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[9px] font-black">
                      S
                    </span>
                    <span className="text-[10px] font-bold text-neutral-600">SRV</span>
                  </div>
                  <MoreHorizontal className="w-3 h-3 text-neutral-300" />
                </div>
                <AnimatedStatNumber
                  value={convertVal(kpis.grossServiceIncomeCRC)}
                  prefix={currencyPrefix}
                  decimals={decimals}
                  className="text-xs font-extrabold text-[#141414] block truncate"
                />
                <span className="text-[9px] text-neutral-400 block truncate mt-0.5">
                  {lang === "es" ? "Bruto Servicios" : "Gross Service"}
                </span>
                <span className="text-[9.5px] font-bold text-emerald-600 block mt-1">
                  {lang === "es" ? "Activo" : "Active"}
                </span>
              </button>

              {/* Stream 3: Gross Installation Income */}
              <button
                type="button"
                onClick={() => setChartMetric("gross_installation")}
                className={`bg-white rounded-2xl p-2.5 text-left transition border cursor-pointer ${
                  chartMetric === "gross_installation"
                    ? "border-[#F05526] shadow-xs"
                    : "border-transparent hover:border-neutral-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[9px] font-black">
                      I
                    </span>
                    <span className="text-[10px] font-bold text-neutral-600">INS</span>
                  </div>
                  <MoreHorizontal className="w-3 h-3 text-neutral-300" />
                </div>
                <AnimatedStatNumber
                  value={convertVal(kpis.grossInstallationIncomeCRC)}
                  prefix={currencyPrefix}
                  decimals={decimals}
                  className="text-xs font-extrabold text-[#141414] block truncate"
                />
                <span className="text-[9px] text-neutral-400 block truncate mt-0.5">
                  {lang === "es" ? "Bruto Instalación" : "Gross Install"}
                </span>
                <span className="text-[9.5px] font-bold text-emerald-600 block mt-1">
                  {lang === "es" ? "Activo" : "Active"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. CENTER BENTO CARD: 2x2 Grid of 4 Stat Cards (Orange Hero Card + 3 Gray Cards) */}
        <div className="lg:col-span-4 bg-white rounded-[28px] p-4 sm:p-5 shadow-[0_2px_20px_rgba(0,0,0,0.03)] grid grid-cols-2 gap-3.5">
          {/* Top-Left: TOTAL PROFIT (Vibrant Orange-Red Gradient Card) */}
          <div
            onClick={() => setChartMetric("profit_vs_gross")}
            className="rounded-[22px] p-4 flex flex-col justify-between min-h-[164px] text-white cursor-pointer transition-transform hover:scale-[1.01] shadow-md shadow-[#F05526]/20"
            style={{
              background: "linear-gradient(145deg, #FF7340 0%, #EE4D20 55%, #D93412 100%)",
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium text-white/90 leading-snug">
                {lang === "es" ? "Ganancia Total" : "Total Profit"}
              </span>
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="my-2">
              <AnimatedStatNumber
                value={convertVal(kpis.totalProfitCRC)}
                prefix={currencyPrefix}
                decimals={decimals}
                className="text-xl sm:text-2xl font-extrabold tracking-tight text-white block truncate"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                ↑ {kpis.profitMarginPercent}%
              </span>
              <span className="text-[10.5px] text-white/85 truncate">
                {lang === "es" ? "Margen neto" : "Net margin"}
              </span>
            </div>
          </div>

          {/* Top-Right: ORDERS PROFIT */}
          <div
            onClick={() => setChartMetric("orders_profit")}
            className="bg-[#F6F6F8] hover:bg-[#EFEFF3] rounded-[22px] p-4 flex flex-col justify-between min-h-[164px] cursor-pointer transition"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium text-neutral-600 leading-snug">
                {lang === "es" ? "Ganancia Órdenes" : "Orders Profit"}
              </span>
              <div className="w-8 h-8 rounded-full bg-white text-neutral-700 flex items-center justify-center shadow-2xs shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div className="my-2">
              <AnimatedStatNumber
                value={convertVal(kpis.ordersProfitCRC)}
                prefix={currencyPrefix}
                decimals={decimals}
                className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#141414] block truncate"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-[#E04819] text-[10px] font-bold">
                {kpis.totalOrdersCount} {lang === "es" ? "órd." : "ord."}
              </span>
              <span className="text-[10.5px] text-neutral-400 truncate">
                {lang === "es" ? "Neto piezas" : "Parts profit"}
              </span>
            </div>
          </div>

          {/* Bottom-Left: GROSS ORDERS INCOME */}
          <div
            onClick={() => setChartMetric("gross_orders")}
            className="bg-[#F6F6F8] hover:bg-[#EFEFF3] rounded-[22px] p-4 flex flex-col justify-between min-h-[164px] cursor-pointer transition"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium text-neutral-600 leading-snug">
                {lang === "es" ? "Bruto Órdenes" : "Gross Orders"}
              </span>
              <div className="w-8 h-8 rounded-full bg-white text-neutral-700 flex items-center justify-center shadow-2xs shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>

            <div className="my-2">
              <AnimatedStatNumber
                value={convertVal(kpis.grossOrdersIncomeCRC)}
                prefix={currencyPrefix}
                decimals={decimals}
                className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#141414] block truncate"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-700 text-[10px] font-bold">
                ↑ {kpis.totalUnitsSold} u.
              </span>
              <span className="text-[10.5px] text-neutral-400 truncate">
                {lang === "es" ? "Este período" : "This period"}
              </span>
            </div>
          </div>

          {/* Bottom-Right: GROSS INSTALLATION + SERVICE INCOME */}
          <div
            onClick={() => setChartMetric("gross_installation")}
            className="bg-[#F6F6F8] hover:bg-[#EFEFF3] rounded-[22px] p-4 flex flex-col justify-between min-h-[164px] cursor-pointer transition"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-medium text-neutral-600 leading-snug">
                {lang === "es" ? "Bruto Instalación" : "Gross Install"}
              </span>
              <div className="w-8 h-8 rounded-full bg-white text-neutral-700 flex items-center justify-center shadow-2xs shrink-0">
                <Wrench className="w-4 h-4" />
              </div>
            </div>

            <div className="my-2">
              <AnimatedStatNumber
                value={convertVal(kpis.grossInstallationIncomeCRC)}
                prefix={currencyPrefix}
                decimals={decimals}
                className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#141414] block truncate"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-700 text-[10px] font-bold">
                + {currencyPrefix}
                {convertVal(kpis.grossServiceIncomeCRC).toLocaleString("es-CR")}
              </span>
              <span className="text-[10.5px] text-neutral-400 truncate">
                {lang === "es" ? "en servicios" : "in services"}
              </span>
            </div>
          </div>
        </div>

        {/* 3. RIGHT BENTO CARD: Total Income / Profit & Loss Stacked Capsule Bar Chart */}
        <div className="lg:col-span-4 bg-white rounded-[28px] p-5 sm:p-6 shadow-[0_2px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
            <div>
              <h3 className="text-base font-extrabold text-[#141414] tracking-tight">
                {lang === "es" ? "Ingresos y Comparativa" : "Total Income"}
              </h3>
              <p className="text-[11px] text-neutral-400">
                {lang === "es"
                  ? "Compara meses, días y horas en cada métrica"
                  : "Compare months, days & hours across every stat"}
              </p>
            </div>

            {/* Granularity Pills: Months / Days / Hours */}
            <div className="inline-flex items-center bg-[#F5F5F7] rounded-full p-1 self-start">
              {(["months", "days", "hours"] as TimeframeOption[]).map((tf) => {
                const active = timeframe === tf;
                const label =
                  tf === "months"
                    ? lang === "es"
                      ? "Meses"
                      : "Months"
                    : tf === "days"
                    ? lang === "es"
                      ? "Días"
                      : "Days"
                    : lang === "es"
                    ? "Horas"
                    : "Hours";
                return (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                      active
                        ? "bg-[#141414] text-white shadow-2xs"
                        : "text-neutral-500 hover:text-[#141414]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Metric Quick-Selector Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-1 no-scrollbar">
            {[
              { id: "profit_vs_gross", es: "Ganancia Total", en: "Total Profit" },
              { id: "parts_vs_profit", es: "Costo vs Ganancia", en: "Cost vs Profit" },
              { id: "gross_orders", es: "Bruto Órdenes", en: "Orders Gross" },
              { id: "orders_profit", es: "Ganancia Órdenes", en: "Orders Profit" },
              { id: "gross_service", es: "Bruto Servicios", en: "Service Gross" },
              { id: "gross_installation", es: "Bruto Instalación", en: "Install Gross" },
              { id: "orders_in_progress", es: "En Progreso", en: "In Progress" },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setChartMetric(chip.id as StatChartOption)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition cursor-pointer ${
                  chartMetric === chip.id
                    ? "bg-[#F05526]/10 text-[#F05526] border border-[#F05526]/30"
                    : "bg-[#F6F6F8] text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {lang === "es" ? chip.es : chip.en}
              </button>
            ))}
          </div>

          {/* Vertix Line Graph with Smooth Curves & Rising Entrance Animation */}
          <div className="flex-1">
            <VertixLineChart
              data={chartConfig.data}
              title={chartConfig.meta.title}
              primaryLegendLabel={chartConfig.meta.primary}
              secondaryLegendLabel={chartConfig.meta.secondary}
              currencyPrefix={currencyPrefix}
              isCountMetric={chartConfig.meta.isCount}
              animTriggerKey={`${timeframe}-${chartMetric}-${currency}`}
              heightClass="h-48"
            />
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* BOTTOM BENTO ROW: Pipeline Capacity Bar (Left) + Recent Activities   */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Bottom-Left: Orders in Progress & Workshop Pipeline Capacity (matches "Monthly Spending Limit" card) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-[28px] p-6 shadow-[0_2px_20px_rgba(0,0,0,0.03)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-[#141414]">
                  {lang === "es" ? "Órdenes en Progreso" : "Orders in Progress"}
                </h3>
                <p className="text-[11px] text-neutral-400">
                  {lang === "es"
                    ? "Capacidad operativa activa del taller"
                    : "Active workshop operational load"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab("orders")}
                className="px-3 py-1 rounded-full bg-[#F5F5F7] hover:bg-neutral-200 text-[11px] font-bold text-[#141414] transition cursor-pointer"
              >
                {lang === "es" ? "Gestionar" : "Manage"} →
              </button>
            </div>

            {/* Exact Hatched Orange Progress Bar from Screenshot */}
            <VertixHatchedProgressBar
              current={kpis.ordersInProgressCount}
              max={Math.max(10, kpis.totalOrdersCount)}
              animKey={`progress-${kpis.ordersInProgressCount}-${currency}`}
            />

            <div className="flex items-center justify-between text-xs pt-0.5">
              <div>
                <AnimatedStatNumber
                  value={kpis.ordersInProgressCount}
                  className="font-extrabold text-[#141414]"
                />{" "}
                <span className="text-neutral-400">
                  {lang === "es" ? "órdenes en progreso" : "orders in progress"}
                </span>
              </div>
              <span className="font-extrabold text-[#141414]">
                {kpis.totalOrdersCount} {lang === "es" ? "totales" : "total"}
              </span>
            </div>

            {/* Extra Mini Stat Pills */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-100">
              <div className="bg-[#F6F6F8] rounded-2xl p-2.5 text-center">
                <AnimatedStatNumber
                  value={kpis.ordersPendingPaymentCount}
                  className="text-base font-extrabold text-[#F05526] block"
                />
                <span className="text-[10px] font-medium text-neutral-500">
                  {lang === "es" ? "Por Confirmar" : "Pending Pay"}
                </span>
              </div>
              <div className="bg-[#F6F6F8] rounded-2xl p-2.5 text-center">
                <AnimatedStatNumber
                  value={kpis.scheduledServicesCount}
                  className="text-base font-extrabold text-[#141414] block"
                />
                <span className="text-[10px] font-medium text-neutral-500">
                  {lang === "es" ? "En Agenda" : "Scheduled"}
                </span>
              </div>
              <div className="bg-[#F6F6F8] rounded-2xl p-2.5 text-center">
                <AnimatedStatNumber
                  value={kpis.ordersCompletedCount}
                  className="text-base font-extrabold text-emerald-600 block"
                />
                <span className="text-[10px] font-medium text-neutral-500">
                  {lang === "es" ? "Completadas" : "Completed"}
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Summary Card: Gross Services + Average Ticket */}
          <div className="bg-white rounded-[28px] p-6 shadow-[0_2px_20px_rgba(0,0,0,0.03)] space-y-3">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
              {lang === "es" ? "Desglose Operativo Adicional" : "Additional Operational Stats"}
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F6F6F8] rounded-2xl p-3.5">
                <span className="text-[10.5px] font-medium text-neutral-500 block">
                  {lang === "es" ? "Ingreso Bruto Servicios" : "Gross Service Income"}
                </span>
                <AnimatedStatNumber
                  value={convertVal(kpis.grossServiceIncomeCRC)}
                  prefix={currencyPrefix}
                  decimals={decimals}
                  className="text-base font-extrabold text-[#141414] mt-1 block"
                />
              </div>
              <div className="bg-[#F6F6F8] rounded-2xl p-3.5">
                <span className="text-[10.5px] font-medium text-neutral-500 block">
                  {lang === "es" ? "Ticket Promedio" : "Avg. Order Ticket"}
                </span>
                <AnimatedStatNumber
                  value={convertVal(kpis.averageOrderValueCRC)}
                  prefix={currencyPrefix}
                  decimals={decimals}
                  className="text-base font-extrabold text-[#141414] mt-1 block"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom-Right: Recent Activities Table (matches screenshot's Recent Activities) */}
        <div className="lg:col-span-8 bg-white rounded-[28px] p-6 shadow-[0_2px_20px_rgba(0,0,0,0.03)]">
          {/* Header with Search & Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h3 className="text-base font-extrabold text-[#141414] tracking-tight">
              {lang === "es" ? "Actividad Reciente y Órdenes" : "Recent Activities"}
            </h3>

            <div className="flex items-center gap-2.5">
              {/* Search Pill */}
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  placeholder={lang === "es" ? "Buscar orden o cliente..." : "Search"}
                  className="w-full pl-9 pr-4 py-2 rounded-full bg-[#F6F6F8] text-xs font-medium text-[#141414] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
                />
              </div>

              {/* Filter Select Pill */}
              <div className="relative">
                <select
                  value={activityStatusFilter}
                  onChange={(e) => setActivityStatusFilter(e.target.value)}
                  className="appearance-none bg-[#F6F6F8] hover:bg-neutral-200/70 rounded-full pl-3.5 pr-8 py-2 text-xs font-semibold text-[#141414] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">{lang === "es" ? "Filtro: Todas" : "Filter: All"}</option>
                  <option value="IN_PROGRESS">
                    {lang === "es" ? "En Progreso" : "In Progress"}
                  </option>
                  <option value="PROGRAM_SERVICE">
                    {lang === "es" ? "Programar Servicio" : "Program Service"}
                  </option>
                  <option value="INSTALLING">
                    {lang === "es" ? "Instalando Piezas" : "Installing"}
                  </option>
                  <option value="COMPLETED">
                    {lang === "es" ? "Completadas" : "Completed"}
                  </option>
                </select>
                <SlidersHorizontal className="w-3 h-3 text-neutral-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F6F6F8] text-[11px] font-semibold text-neutral-500">
                  <th className="py-3 pl-4 pr-2 rounded-l-2xl w-8">
                    <span className="w-3.5 h-3.5 rounded border border-neutral-300 inline-block bg-white" />
                  </th>
                  <th className="py-3 px-3">{lang === "es" ? "Orden ID" : "Order ID"}</th>
                  <th className="py-3 px-3">{lang === "es" ? "Actividad / Producto" : "Activity"}</th>
                  <th className="py-3 px-3">{lang === "es" ? "Bruto / Ganancia" : "Price / Profit"}</th>
                  <th className="py-3 px-3">{lang === "es" ? "Estado" : "Status"}</th>
                  <th className="py-3 px-3">{lang === "es" ? "Fecha" : "Date"}</th>
                  <th className="py-3 pl-2 pr-4 rounded-r-2xl text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-neutral-400">
                      {lang === "es"
                        ? "No se encontraron órdenes con este filtro."
                        : "No activities match the current filter."}
                    </td>
                  </tr>
                ) : (
                  filteredActivities.slice(0, 8).map((ord) => {
                    const isCompleted =
                      ord.status === "COMPLETED" || ord.status === "DELIVERED";
                    const isCancelled =
                      ord.status === "CANCELLED" || ord.status === "REJECTED";
                    const dateFormatted = new Date(ord.createdAt).toLocaleString(
                      lang === "es" ? "es-CR" : "en-US",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    );

                    return (
                      <tr
                        key={ord.id}
                        onClick={() => onNavigateTab("orders")}
                        className="hover:bg-[#F9F9FB] transition cursor-pointer group"
                      >
                        <td className="py-3.5 pl-4 pr-2">
                          <span className="w-3.5 h-3.5 rounded border border-neutral-300 inline-block bg-white group-hover:border-[#141414]" />
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-[#141414] whitespace-nowrap">
                          #{ord.orderNumber}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0 ${
                                ord.serviceType?.includes("PICKUP")
                                  ? "bg-[#F05526]"
                                  : ord.serviceType?.includes("HOME")
                                  ? "bg-amber-500"
                                  : "bg-blue-600"
                              }`}
                            >
                              {ord.serviceType?.includes("PICKUP") ? (
                                <Truck className="w-3.5 h-3.5" />
                              ) : (
                                <Wrench className="w-3.5 h-3.5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[#141414] truncate max-w-[210px]">
                                {ord.firstItemTitle}
                              </p>
                              <p className="text-[10.5px] text-neutral-400 truncate">
                                {ord.customerName} • {ord.itemsCount} u.
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <p className="font-extrabold text-[#141414]">
                            {currencyPrefix}
                            {convertVal(ord.totalGrossCRC).toLocaleString("es-CR", {
                              minimumFractionDigits: decimals,
                              maximumFractionDigits: decimals,
                            })}
                          </p>
                          <p className="text-[10px] font-bold text-emerald-600">
                            +{currencyPrefix}
                            {convertVal(ord.totalProfitCRC).toLocaleString("es-CR", {
                              minimumFractionDigits: decimals,
                              maximumFractionDigits: decimals,
                            })}{" "}
                            {lang === "es" ? "ganancia" : "profit"}
                          </p>
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${
                              isCompleted
                                ? "text-emerald-600"
                                : isCancelled
                                ? "text-red-500"
                                : "text-[#F05526]"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isCompleted
                                  ? "bg-emerald-500"
                                  : isCancelled
                                  ? "bg-red-500"
                                  : "bg-[#F05526]"
                              }`}
                            />
                            <span>{ord.status.replace(/_/g, " ")}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-[11px] text-neutral-500 whitespace-nowrap">
                          {dateFormatted}
                        </td>
                        <td className="py-3.5 pl-2 pr-4 text-right">
                          <MoreHorizontal className="w-4 h-4 text-neutral-400 inline-block group-hover:text-[#141414]" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
