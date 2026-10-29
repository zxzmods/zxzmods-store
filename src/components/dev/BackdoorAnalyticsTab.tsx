"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  ArrowUpRight,
  BarChart3,
  Layers,
  DollarSign,
  Wrench,
  Truck,
  Package,
  ShoppingBag,
  Clock,
  Calendar,
  Activity,
  CheckCircle2,
  Percent,
  Sparkles,
  RefreshCw,
  FileText,
  Users,
  Car,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  AnimatedStatNumber,
  VertixHatchedProgressBar,
  VertixLineChart,
  type LineChartDatum,
  type CapsuleBarDatum,
} from "./BackdoorAnimatedPrimitives";
import type { AnalyticsPayload } from "./BackdoorOverviewTab";
import type { TimeBucketStat } from "@/app/api/sys/analytics/route";

interface BackdoorAnalyticsTabProps {
  analytics: AnalyticsPayload | null;
  loading: boolean;
  currency: "CRC" | "USD";
  onToggleCurrency: () => void;
  onRefresh: () => void;
}

type TimeframeKey = "months" | "days" | "hours";

type StatMetricKey =
  | "total_profit"
  | "parts_cost_vs_profit"
  | "gross_orders"
  | "orders_profit"
  | "parts_cost"
  | "gross_service"
  | "gross_install"
  | "total_gross"
  | "orders_in_progress"
  | "orders_completed"
  | "units_sold";

export function BackdoorAnalyticsTab({
  analytics,
  loading,
  currency,
  onToggleCurrency,
  onRefresh,
}: BackdoorAnalyticsTabProps) {
  const { lang } = useLanguage();
  const [timeframe, setTimeframe] = useState<TimeframeKey>("months");
  const [selectedStat, setSelectedStat] = useState<StatMetricKey>("total_profit");
  const [animReplayKey, setAnimReplayKey] = useState(0);

  const exchangeRate = analytics?.exchangeRate || 455.21;

  const convertVal = (crc: number) => {
    if (currency === "USD") {
      return Math.round(crc / exchangeRate);
    }
    return Math.round(crc);
  };

  const currencySymbol = currency === "USD" ? "$" : "₡";

  const formatMoney = (crc: number) => {
    const val = convertVal(crc);
    return `${currencySymbol}${val.toLocaleString("en-US")}`;
  };

  const statCatalog: {
    key: StatMetricKey;
    labelEs: string;
    labelEn: string;
    descEs: string;
    descEn: string;
    isMonetary: boolean;
    icon: React.ComponentType<{ className?: string }>;
    getTotalCRC: () => number;
    getBucketPrimary: (b: TimeBucketStat) => number;
    getBucketSecondary: (b: TimeBucketStat) => number;
    primaryNameEs: string;
    primaryNameEn: string;
    secondaryNameEs: string;
    secondaryNameEn: string;
  }[] = useMemo(
    () => [
      {
        key: "total_profit",
        labelEs: "Ganancia Total (Total Profit)",
        labelEn: "Total Profit",
        descEs: "Ganancia neta de piezas + instalación + servicios",
        descEn: "Net orders profit + installation + services",
        isMonetary: true,
        icon: TrendingUp,
        getTotalCRC: () => analytics?.kpis.totalProfitCRC || 0,
        getBucketPrimary: (b) => convertVal(b.totalProfitCRC),
        getBucketSecondary: (b) => convertVal(b.partsCostCRC),
        primaryNameEs: "Ganancia Total",
        primaryNameEn: "Total Profit",
        secondaryNameEs: "Costo Base Piezas",
        secondaryNameEn: "Parts Base Cost",
      },
      {
        key: "parts_cost_vs_profit",
        labelEs: "Costo Piezas vs Ganancia Órdenes",
        labelEn: "Parts Cost vs Orders Profit",
        descEs: "Comparativa directa: Ganancia neta en órdenes frente al costo base de compra a proveedores",
        descEn: "Direct comparison: Net orders profit vs supplier parts base cost",
        isMonetary: true,
        icon: Activity,
        getTotalCRC: () => analytics?.kpis.ordersProfitCRC || 0,
        getBucketPrimary: (b) => convertVal(b.ordersProfitCRC),
        getBucketSecondary: (b) => convertVal(b.partsCostCRC),
        primaryNameEs: "Ganancia de Órdenes",
        primaryNameEn: "Orders Profit",
        secondaryNameEs: "Costo Base Piezas",
        secondaryNameEn: "Parts Base Cost",
      },
      {
        key: "gross_orders",
        labelEs: "Ingreso Bruto Órdenes",
        labelEn: "Gross Orders Income",
        descEs: "Facturación bruta en venta de repuestos y combos",
        descEn: "Gross billing from parts and combos sales",
        isMonetary: true,
        icon: ShoppingBag,
        getTotalCRC: () => analytics?.kpis.grossOrdersIncomeCRC || 0,
        getBucketPrimary: (b) => convertVal(b.grossOrdersCRC),
        getBucketSecondary: (b) => convertVal(b.ordersProfitCRC),
        primaryNameEs: "Ingreso Bruto Órdenes",
        primaryNameEn: "Gross Orders Income",
        secondaryNameEs: "Ganancia Órdenes",
        secondaryNameEn: "Orders Profit",
      },
      {
        key: "orders_profit",
        labelEs: "Ganancia de Órdenes",
        labelEn: "Orders Profit",
        descEs: "Utilidad neta de productos descontando costo proveedor",
        descEn: "Net product profit after supplier cost",
        isMonetary: true,
        icon: DollarSign,
        getTotalCRC: () => analytics?.kpis.ordersProfitCRC || 0,
        getBucketPrimary: (b) => convertVal(b.ordersProfitCRC),
        getBucketSecondary: (b) => convertVal(b.partsCostCRC),
        primaryNameEs: "Ganancia Órdenes",
        primaryNameEn: "Orders Profit",
        secondaryNameEs: "Costo Proveedor",
        secondaryNameEn: "Supplier Cost",
      },
      {
        key: "gross_service",
        labelEs: "Ingreso Bruto Servicios",
        labelEn: "Gross Service Income",
        descEs: "Agenda de citas + logística Pick-Up a domicilio",
        descEn: "Scheduled appointments + home Pick-Up logistics",
        isMonetary: true,
        icon: Truck,
        getTotalCRC: () => analytics?.kpis.grossServiceIncomeCRC || 0,
        getBucketPrimary: (b) => convertVal(b.grossServiceCRC),
        getBucketSecondary: (b) => convertVal(b.grossInstallationCRC),
        primaryNameEs: "Ingreso Servicios",
        primaryNameEn: "Service Income",
        secondaryNameEs: "Ingreso Instalación",
        secondaryNameEn: "Install Income",
      },
      {
        key: "gross_install",
        labelEs: "Ingreso Bruto Instalación",
        labelEn: "Gross Installation Income",
        descEs: "Mano de obra de taller e instalación a domicilio",
        descEn: "Workshop labor and home installation",
        isMonetary: true,
        icon: Wrench,
        getTotalCRC: () => analytics?.kpis.grossInstallationIncomeCRC || 0,
        getBucketPrimary: (b) => convertVal(b.grossInstallationCRC),
        getBucketSecondary: (b) => convertVal(b.grossServiceCRC),
        primaryNameEs: "Ingreso Instalación",
        primaryNameEn: "Installation Income",
        secondaryNameEs: "Servicios / Pick-Up",
        secondaryNameEn: "Services / Pick-Up",
      },
      {
        key: "total_gross",
        labelEs: "Ingreso Bruto Consolidado",
        labelEn: "Total Consolidated Gross",
        descEs: "Suma total de órdenes + instalaciones + servicios",
        descEn: "Total sum of orders + installations + services",
        isMonetary: true,
        icon: BarChart3,
        getTotalCRC: () => analytics?.kpis.totalConsolidatedGrossCRC || 0,
        getBucketPrimary: (b) => convertVal(b.totalGrossCRC),
        getBucketSecondary: (b) => convertVal(b.totalProfitCRC),
        primaryNameEs: "Ingreso Bruto Total",
        primaryNameEn: "Total Gross Income",
        secondaryNameEs: "Ganancia Neta Total",
        secondaryNameEn: "Total Net Profit",
      },
      {
        key: "orders_in_progress",
        labelEs: "Órdenes en Progreso",
        labelEn: "Orders in Progress",
        descEs: "Pedidos actualmente activos en flujo de taller",
        descEn: "Orders currently active in workshop pipeline",
        isMonetary: false,
        icon: Layers,
        getTotalCRC: () => analytics?.kpis.ordersInProgressCount || 0,
        getBucketPrimary: (b) => b.ordersInProgress,
        getBucketSecondary: (b) => b.ordersCompleted,
        primaryNameEs: "En Progreso",
        primaryNameEn: "In Progress",
        secondaryNameEs: "Completadas",
        secondaryNameEn: "Completed",
      },
      {
        key: "orders_completed",
        labelEs: "Órdenes Completadas",
        labelEn: "Completed Orders",
        descEs: "Órdenes entregadas y cerradas satisfactoriamente",
        descEn: "Orders delivered and closed",
        isMonetary: false,
        icon: CheckCircle2,
        getTotalCRC: () => analytics?.kpis.ordersCompletedCount || 0,
        getBucketPrimary: (b) => b.ordersCompleted,
        getBucketSecondary: (b) => b.ordersCount,
        primaryNameEs: "Completadas",
        primaryNameEn: "Completed",
        secondaryNameEs: "Total Creadas",
        secondaryNameEn: "Total Created",
      },
      {
        key: "units_sold",
        labelEs: "Piezas / Unidades Vendidas",
        labelEn: "Units / Pieces Sold",
        descEs: "Volumen físico de accesorios y piezas vendidas",
        descEn: "Physical volume of accessories and parts sold",
        isMonetary: false,
        icon: Package,
        getTotalCRC: () => analytics?.kpis.totalUnitsSold || 0,
        getBucketPrimary: (b) => b.unitsSold,
        getBucketSecondary: (b) => b.ordersCount,
        primaryNameEs: "Piezas Vendidas",
        primaryNameEn: "Units Sold",
        secondaryNameEs: "Órdenes",
        secondaryNameEn: "Orders",
      },
      {
        key: "parts_cost",
        labelEs: "Costo Base Proveedores",
        labelEn: "Supplier Parts Base Cost",
        descEs: "Inversión base en compra de piezas a proveedores",
        descEn: "Base investment in purchasing parts from suppliers",
        isMonetary: true,
        icon: Activity,
        getTotalCRC: () => analytics?.kpis.totalPartsCostCRC || 0,
        getBucketPrimary: (b) => convertVal(b.partsCostCRC),
        getBucketSecondary: (b) => convertVal(b.ordersProfitCRC),
        primaryNameEs: "Costo Proveedores",
        primaryNameEn: "Supplier Cost",
        secondaryNameEs: "Ganancia Órdenes",
        secondaryNameEn: "Orders Profit",
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analytics, currency, exchangeRate]
  );

  const activeStatDef = useMemo(
    () => statCatalog.find((s) => s.key === selectedStat) || statCatalog[0],
    [statCatalog, selectedStat]
  );

  const buildChartSeries = (
    tf: TimeframeKey,
    statDef = activeStatDef,
    maxBars?: number
  ): CapsuleBarDatum[] => {
    const raw: TimeBucketStat[] = analytics?.series?.[tf] || [];
    let list: TimeBucketStat[] = raw;
    if (maxBars && raw.length > maxBars) {
      if (tf === "months") {
        const curM = new Date().getMonth();
        const start = Math.max(0, Math.min(12 - maxBars, curM - Math.floor(maxBars / 2)));
        list = raw.slice(start, start + maxBars);
      } else if (tf === "days") {
        list = raw.slice(-maxBars);
      } else if (tf === "hours") {
        const filtered = raw.filter(
          (h: TimeBucketStat, idx: number) =>
            h.totalGrossCRC > 0 ||
            h.ordersCount > 0 ||
            (idx >= 8 && idx <= 20 && idx % 2 === 0)
        );
        list = filtered.slice(0, maxBars);
      }
    }

    return list.map((b: TimeBucketStat) => ({
      key: `${b.key}-${animReplayKey}`,
      label: lang === "es" ? b.labelEs : b.labelEn,
      subLabel: b.subLabel,
      primaryValue: statDef.getBucketPrimary(b),
      secondaryValue: statDef.getBucketSecondary(b),
      tooltipPrimaryLabel: lang === "es" ? statDef.primaryNameEs : statDef.primaryNameEn,
      tooltipSecondaryLabel: lang === "es" ? statDef.secondaryNameEs : statDef.secondaryNameEn,
    }));
  };

  const mainChartData = useMemo(() => {
    if (timeframe === "hours") {
      const raw: TimeBucketStat[] = analytics?.series?.hours || [];
      const activeOrDay = raw.filter(
        (h: TimeBucketStat, idx: number) =>
          h.totalGrossCRC > 0 || h.ordersCount > 0 || (idx >= 7 && idx <= 22)
      );
      return activeOrDay.slice(0, 14).map((b: TimeBucketStat) => ({
        key: `${b.key}-${animReplayKey}`,
        label: lang === "es" ? b.labelEs : b.labelEn,
        subLabel: b.subLabel,
        primaryValue: activeStatDef.getBucketPrimary(b),
        secondaryValue: activeStatDef.getBucketSecondary(b),
        tooltipPrimaryLabel: lang === "es" ? activeStatDef.primaryNameEs : activeStatDef.primaryNameEn,
        tooltipSecondaryLabel: lang === "es" ? activeStatDef.secondaryNameEs : activeStatDef.secondaryNameEn,
      }));
    }
    return buildChartSeries(timeframe, activeStatDef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analytics, timeframe, activeStatDef, lang, currency, animReplayKey]);

  const monthsMiniData = useMemo(
    () => buildChartSeries("months", activeStatDef, 6),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analytics, activeStatDef, lang, currency, animReplayKey]
  );

  const daysMiniData = useMemo(
    () => buildChartSeries("days", activeStatDef, 7),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analytics, activeStatDef, lang, currency, animReplayKey]
  );

  const hoursMiniData = useMemo(
    () => buildChartSeries("hours", activeStatDef, 7),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analytics, activeStatDef, lang, currency, animReplayKey]
  );

  if (loading && !analytics) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-[24px] p-5 h-[135px] animate-pulse border border-black/[0.04]" />
          ))}
        </div>
        <div className="bg-white rounded-[28px] p-6 h-[420px] animate-pulse border border-black/[0.04]" />
      </div>
    );
  }

  const s = analytics?.kpis || {
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

  return (
    <div className="space-y-5">
      {/* =====================================================================
          HEADER BAR: CONTROLS, CURRENCY, REPLAY ANIMATION
         ===================================================================== */}
      <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-black/[0.04] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#141414] text-white flex items-center justify-center shrink-0 shadow-sm">
            <BarChart3 className="w-5 h-5 text-[#F05526]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-[#141414] tracking-tight">
                {lang === "es"
                  ? "Centro de Estadísticas y Comparativa Temporal"
                  : "Statistics & Time-Series Comparison Studio"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FFF0EB] text-[#F05526] text-[10px] font-bold">
                {lang === "es" ? "Meses · Días · Horas" : "Months · Days · Hours"}
              </span>
            </div>
            <p className="text-xs text-[#71717A] mt-0.5">
              {lang === "es"
                ? "Compara ingresos brutos, ganancias netas, instalaciones, servicios y órdenes en progreso por Meses, Días y Horas."
                : "Compare gross income, net profit, installations, services, and orders in progress across Months, Days, and Hours."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Replay Rising Animations Button */}
          <button
            type="button"
            onClick={() => {
              setAnimReplayKey((prev) => prev + 1);
              onRefresh();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#F6F6F8] hover:bg-[#ECECEF] text-[#141414] text-xs font-semibold transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#F05526]" />
            <span>{lang === "es" ? "Recargar y Animar" : "Reload & Animate"}</span>
          </button>

          {/* Currency Switcher */}
          <button
            type="button"
            onClick={onToggleCurrency}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#141414] text-white text-xs font-semibold hover:bg-black/85 transition cursor-pointer"
          >
            <DollarSign className="w-3.5 h-3.5 text-[#F05526]" />
            <span>
              {lang === "es" ? "Moneda:" : "Currency:"} {currency}
            </span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          ALL RISING STATS GRID (6 PRIMARY REQUIRED STATS + 6 OPERATIONAL KPIS)
         ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Total Profit (Vibrant Orange Card) */}
        <button
          type="button"
          onClick={() => setSelectedStat("total_profit")}
          className={`text-left rounded-[24px] p-5 text-white relative overflow-hidden transition-all cursor-pointer shadow-[0_10px_24px_rgba(240,85,38,0.22)] ${
            selectedStat === "total_profit" ? "ring-2 ring-[#141414] ring-offset-2" : "hover:scale-[1.01]"
          }`}
          style={{
            background: "linear-gradient(145deg, #FF7340 0%, #EE4D20 55%, #D93412 100%)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-white/90">
              {lang === "es" ? "Ganancia Total" : "Total Profit"}
            </span>
            <span className="w-7 h-7 rounded-full bg-white text-[#141414] flex items-center justify-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold tracking-tight">
            <AnimatedStatNumber
              key={`tp-${animReplayKey}-${currency}`}
              value={convertVal(s.totalProfitCRC)}
              prefix={currencySymbol}
              durationMs={1250}
            />
          </div>
          <p className="text-[10px] text-white/80 mt-2">
            {lang === "es" ? "Margen neto:" : "Net margin:"} {s.profitMarginPercent}%
          </p>
        </button>

        {/* 2. Gross Orders Income */}
        <button
          type="button"
          onClick={() => setSelectedStat("gross_orders")}
          className={`text-left bg-white rounded-[24px] p-5 border transition-all cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.02)] ${
            selectedStat === "gross_orders"
              ? "border-[#141414] ring-2 ring-[#141414]/10"
              : "border-black/[0.05] hover:border-black/20"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#52525B]">
              {lang === "es" ? "Ingreso Bruto Órdenes" : "Gross Orders Income"}
            </span>
            <span className="w-7 h-7 rounded-full bg-[#141414] text-white flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#141414] tracking-tight">
            <AnimatedStatNumber
              key={`go-${animReplayKey}-${currency}`}
              value={convertVal(s.grossOrdersIncomeCRC)}
              prefix={currencySymbol}
              durationMs={1250}
            />
          </div>
          <p className="text-[10px] text-[#71717A] mt-2">
            {s.totalOrdersCount} {lang === "es" ? "órdenes contabilizadas" : "valid orders"}
          </p>
        </button>

        {/* 3. Orders Profit */}
        <button
          type="button"
          onClick={() => setSelectedStat("orders_profit")}
          className={`text-left bg-white rounded-[24px] p-5 border transition-all cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.02)] ${
            selectedStat === "orders_profit"
              ? "border-[#141414] ring-2 ring-[#141414]/10"
              : "border-black/[0.05] hover:border-black/20"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#52525B]">
              {lang === "es" ? "Ganancia de Órdenes" : "Orders Profit"}
            </span>
            <span className="w-7 h-7 rounded-full bg-[#141414] text-white flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#141414] tracking-tight">
            <AnimatedStatNumber
              key={`op-${animReplayKey}-${currency}`}
              value={convertVal(s.ordersProfitCRC)}
              prefix={currencySymbol}
              durationMs={1250}
            />
          </div>
          <p className="text-[10px] text-[#71717A] mt-2">
            {lang === "es" ? "Descontando costo base" : "After supplier base cost"}
          </p>
        </button>

        {/* 4. Gross Service Income */}
        <button
          type="button"
          onClick={() => setSelectedStat("gross_service")}
          className={`text-left bg-white rounded-[24px] p-5 border transition-all cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.02)] ${
            selectedStat === "gross_service"
              ? "border-[#141414] ring-2 ring-[#141414]/10"
              : "border-black/[0.05] hover:border-black/20"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#52525B]">
              {lang === "es" ? "Ingreso Bruto Servicios" : "Gross Service Income"}
            </span>
            <span className="w-7 h-7 rounded-full bg-[#141414] text-white flex items-center justify-center">
              <Truck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#141414] tracking-tight">
            <AnimatedStatNumber
              key={`gs-${animReplayKey}-${currency}`}
              value={convertVal(s.grossServiceIncomeCRC)}
              prefix={currencySymbol}
              durationMs={1250}
            />
          </div>
          <p className="text-[10px] text-[#71717A] mt-2">
            {lang === "es" ? "Citas + logística Pick-Up" : "Agenda + Pick-Up logistics"}
          </p>
        </button>

        {/* 5. Gross Installation Income */}
        <button
          type="button"
          onClick={() => setSelectedStat("gross_install")}
          className={`text-left bg-white rounded-[24px] p-5 border transition-all cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.02)] ${
            selectedStat === "gross_install"
              ? "border-[#141414] ring-2 ring-[#141414]/10"
              : "border-black/[0.05] hover:border-black/20"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#52525B]">
              {lang === "es" ? "Ingreso Instalación" : "Gross Install Income"}
            </span>
            <span className="w-7 h-7 rounded-full bg-[#141414] text-white flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#141414] tracking-tight">
            <AnimatedStatNumber
              key={`gi-${animReplayKey}-${currency}`}
              value={convertVal(s.grossInstallationIncomeCRC)}
              prefix={currencySymbol}
              durationMs={1250}
            />
          </div>
          <p className="text-[10px] text-[#71717A] mt-2">
            {lang === "es" ? "Mano de obra taller/domicilio" : "Workshop & home labor"}
          </p>
        </button>

        {/* 6. Number of Orders in Progress */}
        <button
          type="button"
          onClick={() => setSelectedStat("orders_in_progress")}
          className={`text-left bg-white rounded-[24px] p-5 border transition-all cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.02)] ${
            selectedStat === "orders_in_progress"
              ? "border-[#141414] ring-2 ring-[#141414]/10"
              : "border-black/[0.05] hover:border-black/20"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#52525B]">
              {lang === "es" ? "Órdenes en Progreso" : "Orders in Progress"}
            </span>
            <span className="w-7 h-7 rounded-full bg-[#F05526] text-white flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold text-[#141414] tracking-tight">
            <AnimatedStatNumber
              key={`oip-${animReplayKey}`}
              value={s.ordersInProgressCount}
              durationMs={1000}
            />
          </div>
          <p className="text-[10px] text-[#F05526] font-semibold mt-2">
            {s.ordersPendingPaymentCount} {lang === "es" ? "por verificar pago" : "awaiting payment check"}
          </p>
        </button>
      </div>

      {/* =====================================================================
          SECOND ROW OF STATS (EXTENDED KPIS)
         ===================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <button
          type="button"
          onClick={() => setSelectedStat("total_gross")}
          className={`text-left bg-[#F6F6F8] hover:bg-white rounded-2xl p-4 border transition cursor-pointer ${
            selectedStat === "total_gross" ? "border-[#141414] bg-white" : "border-black/[0.04]"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-[#71717A] mb-1">
            <span>{lang === "es" ? "Ingreso Consolidado" : "Total Consolidated"}</span>
            <BarChart3 className="w-3.5 h-3.5 text-[#141414]" />
          </div>
          <div className="text-lg font-bold text-[#141414]">
            <AnimatedStatNumber
              key={`tcg-${animReplayKey}-${currency}`}
              value={convertVal(s.totalConsolidatedGrossCRC)}
              prefix={currencySymbol}
              durationMs={1200}
            />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStat("parts_cost")}
          className={`text-left bg-[#F6F6F8] hover:bg-white rounded-2xl p-4 border transition cursor-pointer ${
            selectedStat === "parts_cost" ? "border-[#141414] bg-white" : "border-black/[0.04]"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-[#71717A] mb-1">
            <span>{lang === "es" ? "Costo Base Piezas" : "Parts Base Cost"}</span>
            <Activity className="w-3.5 h-3.5 text-[#141414]" />
          </div>
          <div className="text-lg font-bold text-[#141414]">
            <AnimatedStatNumber
              key={`pbc-${animReplayKey}-${currency}`}
              value={convertVal(s.totalPartsCostCRC)}
              prefix={currencySymbol}
              durationMs={1200}
            />
          </div>
        </button>

        <div className="bg-[#F6F6F8] rounded-2xl p-4 border border-black/[0.04]">
          <div className="flex items-center justify-between text-[11px] text-[#71717A] mb-1">
            <span>{lang === "es" ? "Ticket Promedio" : "Avg. Order Ticket"}</span>
            <Sparkles className="w-3.5 h-3.5 text-[#F05526]" />
          </div>
          <div className="text-lg font-bold text-[#141414]">
            <AnimatedStatNumber
              key={`aot-${animReplayKey}-${currency}`}
              value={convertVal(s.averageOrderValueCRC)}
              prefix={currencySymbol}
              durationMs={1200}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSelectedStat("orders_completed")}
          className={`text-left bg-[#F6F6F8] hover:bg-white rounded-2xl p-4 border transition cursor-pointer ${
            selectedStat === "orders_completed" ? "border-[#141414] bg-white" : "border-black/[0.04]"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-[#71717A] mb-1">
            <span>{lang === "es" ? "Órdenes Completadas" : "Completed Orders"}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-[#141414]">
            <AnimatedStatNumber
              key={`oc-${animReplayKey}`}
              value={s.ordersCompletedCount}
              durationMs={1000}
            />
          </div>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStat("units_sold")}
          className={`text-left bg-[#F6F6F8] hover:bg-white rounded-2xl p-4 border transition cursor-pointer ${
            selectedStat === "units_sold" ? "border-[#141414] bg-white" : "border-black/[0.04]"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-[#71717A] mb-1">
            <span>{lang === "es" ? "Piezas Vendidas" : "Units Sold"}</span>
            <Package className="w-3.5 h-3.5 text-[#141414]" />
          </div>
          <div className="text-lg font-bold text-[#141414]">
            <AnimatedStatNumber
              key={`us-${animReplayKey}`}
              value={s.totalUnitsSold}
              durationMs={1000}
            />
          </div>
        </button>

        <div className="bg-[#F6F6F8] rounded-2xl p-4 border border-black/[0.04]">
          <div className="flex items-center justify-between text-[11px] text-[#71717A] mb-1">
            <span>{lang === "es" ? "Margen de Ganancia" : "Profit Margin"}</span>
            <Percent className="w-3.5 h-3.5 text-[#F05526]" />
          </div>
          <div className="text-lg font-bold text-[#141414]">
            <AnimatedStatNumber
              key={`pm-${animReplayKey}`}
              value={s.profitMarginPercent}
              decimals={1}
              suffix="%"
              durationMs={1100}
            />
          </div>
        </div>
      </div>

      {/* =====================================================================
          MAIN FULL-WIDTH INTERACTIVE RISING BAR CHART (MONTHS / DAYS / HOURS)
         ===================================================================== */}
      <div className="bg-white rounded-[28px] p-6 sm:p-7 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-black/[0.04]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#F05526]" />
              <h3 className="text-lg font-bold text-[#141414]">
                {lang === "es" ? activeStatDef.labelEs : activeStatDef.labelEn}
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#F6F6F8] text-[#141414]">
                {activeStatDef.isMonetary ? (
                  <AnimatedStatNumber
                    key={`main-hdr-${selectedStat}-${currency}-${animReplayKey}`}
                    value={convertVal(activeStatDef.getTotalCRC())}
                    prefix={currencySymbol}
                    durationMs={1100}
                  />
                ) : (
                  <AnimatedStatNumber
                    key={`main-hdr-${selectedStat}-${animReplayKey}`}
                    value={activeStatDef.getTotalCRC()}
                    durationMs={1000}
                  />
                )}
              </span>
            </div>
            <p className="text-xs text-[#71717A] mt-1">
              {lang === "es" ? activeStatDef.descEs : activeStatDef.descEn} —{" "}
              <span className="font-semibold text-[#141414]">
                {timeframe === "months"
                  ? lang === "es"
                    ? "Comparativa Mensual (Enero - Diciembre)"
                    : "Monthly Comparison (Jan - Dec)"
                  : timeframe === "days"
                  ? lang === "es"
                    ? "Comparativa Diaria (Últimos 14 Días)"
                    : "Daily Comparison (Last 14 Days)"
                  : lang === "es"
                  ? "Comparativa por Horas del Día (00:00 - 23:00)"
                  : "Hourly Distribution (00:00 - 23:00)"}
              </span>
            </p>
          </div>

          {/* Timeframe Selector Pills (Months / Days / Hours) */}
          <div className="flex items-center bg-[#F6F6F8] p-1 rounded-full border border-black/[0.05] self-start lg:self-auto">
            {(
              [
                {
                  id: "months",
                  es: "Por Meses (12M)",
                  en: "By Months (12M)",
                  icon: Calendar,
                },
                {
                  id: "days",
                  es: "Por Días (14D)",
                  en: "By Days (14D)",
                  icon: Activity,
                },
                {
                  id: "hours",
                  es: "Por Horas (24H)",
                  en: "By Hours (24H)",
                  icon: Clock,
                },
              ] as {
                id: TimeframeKey;
                es: string;
                en: string;
                icon: React.ComponentType<{ className?: string }>;
              }[]
            ).map((tf) => {
              const Icon = tf.icon;
              return (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setTimeframe(tf.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    timeframe === tf.id
                      ? "bg-[#141414] text-white shadow-sm"
                      : "text-[#71717A] hover:text-[#141414]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{lang === "es" ? tf.es : tf.en}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stat Metric Selector Pills (All 10 Compare Modes) */}
        <div className="flex flex-wrap items-center gap-1.5 pb-5 mb-5 border-b border-black/[0.05]">
          {statCatalog.map((item) => {
            const Icon = item.icon;
            const active = selectedStat === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedStat(item.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                  active
                    ? "bg-[#F05526] text-white shadow-sm"
                    : "bg-[#F6F6F8] text-[#52525B] hover:bg-[#ECECEF] hover:text-[#141414]"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{lang === "es" ? item.labelEs : item.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Rising Curve Line Graph */}
        <VertixLineChart
          data={mainChartData}
          title=""
          primaryLegendLabel={lang === "es" ? activeStatDef.primaryNameEs : activeStatDef.primaryNameEn}
          secondaryLegendLabel={lang === "es" ? activeStatDef.secondaryNameEs : activeStatDef.secondaryNameEn}
          currencyPrefix={currencySymbol}
          isCountMetric={!activeStatDef.isMonetary}
          animTriggerKey={`main-${timeframe}-${selectedStat}-${currency}-${animReplayKey}`}
          heightClass="h-64"
        />
      </div>

      {/* =====================================================================
          3-COLUMN SIMULTANEOUS COMPARISON: MONTHS vs DAYS vs HOURS
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Column 1: Months Comparison */}
        <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-black/[0.04] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#F6F6F8] flex items-center justify-center text-[#141414]">
                <Calendar className="w-4 h-4 text-[#F05526]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#141414]">
                  {lang === "es" ? "Comparativa por Meses" : "Comparison by Months"}
                </h4>
                <p className="text-[11px] text-[#71717A]">
                  {lang === "es" ? activeStatDef.labelEs : activeStatDef.labelEn}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTimeframe("months")}
              className="text-[11px] font-semibold text-[#F05526] hover:underline cursor-pointer"
            >
              {lang === "es" ? "Expandir 12M" : "Expand 12M"}
            </button>
          </div>
          <VertixLineChart
            data={monthsMiniData}
            title=""
            primaryLegendLabel={lang === "es" ? activeStatDef.primaryNameEs : activeStatDef.primaryNameEn}
            secondaryLegendLabel={lang === "es" ? activeStatDef.secondaryNameEs : activeStatDef.secondaryNameEn}
            currencyPrefix={currencySymbol}
            isCountMetric={!activeStatDef.isMonetary}
            animTriggerKey={`mini-m-${selectedStat}-${currency}-${animReplayKey}`}
            heightClass="h-44"
          />
        </div>

        {/* Column 2: Days Comparison */}
        <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-black/[0.04] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#F6F6F8] flex items-center justify-center text-[#141414]">
                <Activity className="w-4 h-4 text-[#F05526]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#141414]">
                  {lang === "es" ? "Comparativa por Días" : "Comparison by Days"}
                </h4>
                <p className="text-[11px] text-[#71717A]">
                  {lang === "es" ? "Últimos 7 días activos" : "Last 7 active days"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTimeframe("days")}
              className="text-[11px] font-semibold text-[#F05526] hover:underline cursor-pointer"
            >
              {lang === "es" ? "Expandir 14D" : "Expand 14D"}
            </button>
          </div>
          <VertixLineChart
            data={daysMiniData}
            title=""
            primaryLegendLabel={lang === "es" ? activeStatDef.primaryNameEs : activeStatDef.primaryNameEn}
            secondaryLegendLabel={lang === "es" ? activeStatDef.secondaryNameEs : activeStatDef.secondaryNameEn}
            currencyPrefix={currencySymbol}
            isCountMetric={!activeStatDef.isMonetary}
            animTriggerKey={`mini-d-${selectedStat}-${currency}-${animReplayKey}`}
            heightClass="h-44"
          />
        </div>

        {/* Column 3: Hours Comparison */}
        <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-black/[0.04] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#F6F6F8] flex items-center justify-center text-[#141414]">
                <Clock className="w-4 h-4 text-[#F05526]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#141414]">
                  {lang === "es" ? "Comparativa por Horas" : "Comparison by Hours"}
                </h4>
                <p className="text-[11px] text-[#71717A]">
                  {lang === "es" ? "Horas pico de actividad" : "Peak activity hours"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTimeframe("hours")}
              className="text-[11px] font-semibold text-[#F05526] hover:underline cursor-pointer"
            >
              {lang === "es" ? "Expandir 24H" : "Expand 24H"}
            </button>
          </div>
          <VertixLineChart
            data={hoursMiniData}
            title=""
            primaryLegendLabel={lang === "es" ? activeStatDef.primaryNameEs : activeStatDef.primaryNameEn}
            secondaryLegendLabel={lang === "es" ? activeStatDef.secondaryNameEs : activeStatDef.secondaryNameEn}
            currencyPrefix={currencySymbol}
            isCountMetric={!activeStatDef.isMonetary}
            animTriggerKey={`mini-h-${selectedStat}-${currency}-${animReplayKey}`}
            heightClass="h-44"
          />
        </div>
      </div>

      {/* =====================================================================
          BOTTOM SECTION: REVENUE COMPOSITION BARS + ECOSYSTEM STATS
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 Cols: Revenue & Profit Composition Progress Bars */}
        <div className="lg:col-span-7 bg-white rounded-[28px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-black/[0.04] space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#141414]">
                {lang === "es"
                  ? "Proporción de Ingresos y Ganancias"
                  : "Revenue & Profit Proportions"}
              </h3>
              <p className="text-xs text-[#71717A]">
                {lang === "es"
                  ? "Carga porcentual respecto al ingreso bruto consolidado"
                  : "Percentage share relative to consolidated gross income"}
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F6F6F8] text-[#141414]">
              {formatMoney(s.totalConsolidatedGrossCRC)}
            </span>
          </div>

          <div className="space-y-4">
            {[
              {
                labelEs: "Ingreso Bruto de Órdenes (Piezas y Combos)",
                labelEn: "Gross Orders Income (Parts & Combos)",
                valCRC: s.grossOrdersIncomeCRC,
                maxCRC: Math.max(1, s.totalConsolidatedGrossCRC),
                pct:
                  s.totalConsolidatedGrossCRC > 0
                    ? Math.round((s.grossOrdersIncomeCRC / s.totalConsolidatedGrossCRC) * 100)
                    : 0,
              },
              {
                labelEs: "Ganancia Neta Total (Total Profit)",
                labelEn: "Total Net Profit",
                valCRC: s.totalProfitCRC,
                maxCRC: Math.max(1, s.totalConsolidatedGrossCRC),
                pct:
                  s.totalConsolidatedGrossCRC > 0
                    ? Math.round((s.totalProfitCRC / s.totalConsolidatedGrossCRC) * 100)
                    : 0,
              },
              {
                labelEs: "Ganancia Neta de Órdenes (Orders Profit)",
                labelEn: "Net Orders Profit",
                valCRC: s.ordersProfitCRC,
                maxCRC: Math.max(1, s.grossOrdersIncomeCRC),
                pct:
                  s.grossOrdersIncomeCRC > 0
                    ? Math.round((s.ordersProfitCRC / s.grossOrdersIncomeCRC) * 100)
                    : 0,
              },
              {
                labelEs: "Ingreso Bruto de Instalación",
                labelEn: "Gross Installation Income",
                valCRC: s.grossInstallationIncomeCRC,
                maxCRC: Math.max(1, s.totalConsolidatedGrossCRC),
                pct:
                  s.totalConsolidatedGrossCRC > 0
                    ? Math.round(
                        (s.grossInstallationIncomeCRC / s.totalConsolidatedGrossCRC) * 100
                      )
                    : 0,
              },
              {
                labelEs: "Ingreso Bruto de Servicios (Citas + Pick-Up)",
                labelEn: "Gross Service Income (Agenda + Pick-Up)",
                valCRC: s.grossServiceIncomeCRC,
                maxCRC: Math.max(1, s.totalConsolidatedGrossCRC),
                pct:
                  s.totalConsolidatedGrossCRC > 0
                    ? Math.round((s.grossServiceIncomeCRC / s.totalConsolidatedGrossCRC) * 100)
                    : 0,
              },
            ].map((row, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#141414]">
                    {lang === "es" ? row.labelEs : row.labelEn}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#141414]">
                      <AnimatedStatNumber
                        key={`bar-val-${idx}-${currency}-${animReplayKey}`}
                        value={convertVal(row.valCRC)}
                        prefix={currencySymbol}
                        durationMs={1200}
                      />
                    </span>
                    <span className="text-[11px] font-bold text-[#F05526] w-10 text-right">
                      {row.pct}%
                    </span>
                  </div>
                </div>
                <VertixHatchedProgressBar
                  current={row.valCRC}
                  max={row.maxCRC}
                  animKey={`bar-prog-${idx}-${animReplayKey}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 Cols: Platform & Workshop Ecosystem Counters */}
        <div className="lg:col-span-5 bg-white rounded-[28px] p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-black/[0.04] flex flex-col justify-between space-y-5">
          <div>
            <h3 className="text-base font-bold text-[#141414]">
              {lang === "es" ? "Métricas Operativas del Taller" : "Workshop Operational Metrics"}
            </h3>
            <p className="text-xs text-[#71717A]">
              {lang === "es"
                ? "Indicadores adicionales en tiempo real de la base de datos"
                : "Real-time database operational indicators"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-[#F6F6F8] rounded-2xl p-4 border border-black/[0.03]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-[#71717A]">
                  {lang === "es" ? "Clientes Registrados" : "Registered Clients"}
                </span>
                <Users className="w-4 h-4 text-[#141414]" />
              </div>
              <div className="text-2xl font-bold text-[#141414]">
                <AnimatedStatNumber
                  key={`cust-${animReplayKey}`}
                  value={s.usersCount}
                  durationMs={1000}
                />
              </div>
            </div>

            <div className="bg-[#F6F6F8] rounded-2xl p-4 border border-black/[0.03]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-[#71717A]">
                  {lang === "es" ? "Vehículos en Garaje" : "Garage Vehicles"}
                </span>
                <Car className="w-4 h-4 text-[#141414]" />
              </div>
              <div className="text-2xl font-bold text-[#141414]">
                <AnimatedStatNumber
                  key={`veh-${animReplayKey}`}
                  value={s.vehiclesCount}
                  durationMs={1000}
                />
              </div>
            </div>

            <div className="bg-[#F6F6F8] rounded-2xl p-4 border border-black/[0.03]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-[#71717A]">
                  {lang === "es" ? "Citas de Servicio" : "Service Appointments"}
                </span>
                <Calendar className="w-4 h-4 text-[#F05526]" />
              </div>
              <div className="text-2xl font-bold text-[#141414]">
                <AnimatedStatNumber
                  key={`srv-cnt-${animReplayKey}`}
                  value={s.scheduledServicesCount}
                  durationMs={1000}
                />
              </div>
            </div>

            <div className="bg-[#F6F6F8] rounded-2xl p-4 border border-black/[0.03]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-[#71717A]">
                  {lang === "es" ? "Facturas Electrónicas" : "Electronic Invoices"}
                </span>
                <FileText className="w-4 h-4 text-[#141414]" />
              </div>
              <div className="text-2xl font-bold text-[#141414]">
                <AnimatedStatNumber
                  key={`inv-cnt-${animReplayKey}`}
                  value={s.electronicInvoicesCount}
                  durationMs={1000}
                />
              </div>
            </div>
          </div>

          {/* Service & Catalog Summary Pill */}
          <div className="bg-[#141414] text-white rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-white/60 block">
                {lang === "es" ? "Catálogo Activo" : "Active Catalog"}
              </span>
              <div className="flex items-center gap-4 mt-1 text-xs">
                <span>
                  <strong className="text-[#F05526]">{s.activeProductsCount}</strong>{" "}
                  {lang === "es" ? "Productos" : "Products"}
                </span>
                <span>
                  <strong className="text-emerald-400">{s.activeCombosCount}</strong>{" "}
                  {lang === "es" ? "Combos" : "Combos"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-white/60 block">
                {lang === "es" ? "Servicios" : "Services"}
              </span>
              <span className="text-sm font-bold text-white">
                {formatMoney(s.grossServiceIncomeCRC)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
