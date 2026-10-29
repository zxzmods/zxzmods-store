"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Info,
  ShieldCheck,
  PlusCircle,
  RefreshCw,
  Calendar,
  Layers,
  FileText,
  Receipt,
  Truck,
  Wrench,
  Percent,
  X,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Wallet,
  Trash2,
  User,
  Fuel,
  CheckCircle2,
  Package,
  TrendingDown,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import {
  AnimatedStatNumber,
  VertixLineChart,
  LineChartDatum,
} from "./BackdoorAnimatedPrimitives";
import { FinancialDashboardSkeleton } from "./FinancialDashboardSkeleton";

export interface TransactionItem {
  id: string;
  date: string;
  type: "EXPENSE_LOGISTICS" | "EXPENSE_OPERATIONAL" | "INCOME_SALE" | "INCOME_SERVICE";
  totalAmount: number;
  subtotal: number;
  ivaAmount: number;
  electronicInvoiceKey: string | null;
  description: string | null;
  incurredBy?: string | null;
  onlyVatCredit?: boolean;
  orderId?: string | null;
  isAutoSystemExpense?: boolean;
  createdAt?: string;
}

export interface MonthlyClosureData {
  monthYear: string;
  totalSalesSubtotal: number;
  totalCogsSubtotal: number;
  netIvaPayable: number;
  netProfitBeforeTax: number;
  incomeTaxProvision: number;
  partnerDistributableCash: number;
}

export interface DistributableHistoryItem {
  month: number;
  monthKey: string;
  labelEs: string;
  labelEn: string;
  partnerDistributableCash: number;
  grossProfit?: number;
  netProfitBeforeTax: number;
  incomeTaxProvision: number;
  totalSalesSubtotal: number;
  totalCogsSubtotal: number;
}

export interface OrderPartsBreakdownItem {
  orderId: string;
  orderNumber: string;
  customerName: string;
  itemsCount: number;
  firstItemTitle: string;
  partsSaleGrossCRC: number;
  partsSaleSubtotalCRC: number;
  partsCostCRC: number;
  isCustomCost: boolean;
  profitCRC: number;
  createdAt: string;
}

export interface FinancialStatusPayload {
  success: boolean;
  closure: MonthlyClosureData;
  metrics: {
    monthYear: string;
    month: number;
    year: number;
    totalSalesSubtotal: number;
    totalCogsSubtotal: number;
    grossProfit?: number;
    partsCostSubtotal?: number;
    partsCogsSubtotal?: number;
    manualExpensesSubtotal?: number;
    incomeIvaTotal: number;
    expenseIvaTotal: number;
    netIvaPayable: number;
    isTaxCredit: boolean;
    taxCreditAmount: number;
    netProfitBeforeTax: number;
    incomeTaxProvision: number;
    partnerDistributableCash: number;
    grossIncomeWithVat: number;
    grossExpenseWithVat: number;
    totalDiscountsCRC?: number;
    rawNetIva?: number;
    isCloseTo15th: boolean;
    daysUntil15th: number;
    totalPickupGasExpenseCRC?: number;
  };
  transactions: TransactionItem[];
  ordersPartsBreakdown?: OrderPartsBreakdownItem[];
  distributableCashHistory: DistributableHistoryItem[];
  flowBreakdown: {
    totalIncomeSubtotal: number;
    grossIncomeWithVat?: number;
    grossProfit?: number;
    partsCostSubtotal?: number;
    manualExpensesSubtotal?: number;
    cogsSubtotal: number;
    netVatPayable: number;
    taxReserve: number;
    distributableCash: number;
    isTaxCredit: boolean;
    taxCreditAmount: number;
  };
}

interface FinancialDashboardTabProps {
  currency?: "CRC" | "USD";
  onToggleCurrency?: () => void;
  currentUser?: {
    displayName?: string | null;
    email: string;
    role?: string;
  } | null;
}

const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre",
];

const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function FinancialDashboardTab({
  currency = "CRC",
  currentUser,
}: FinancialDashboardTabProps) {
  const { lang } = useLanguage();
  const now = useMemo(() => new Date(), []);

  // Default person who incurred the expense (auto-filled from current authenticated user)
  const defaultIncurredBy = useMemo(() => {
    return (
      currentUser?.displayName?.trim() ||
      currentUser?.email?.split("@")[0] ||
      "Master Admin"
    );
  }, [currentUser]);

  // State: Selected Month & Year (Header MonthYearSelector)
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Data fetching state
  const [data, setData] = useState<FinancialStatusPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [, setError] = useState<string | null>(null);

  // Table filters & pagination state
  const [tableTypeFilter, setTableTypeFilter] = useState<
    "ALL" | "EXPENSE_LOGISTICS" | "EXPENSE_OPERATIONAL"
  >("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // New Expense Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalForm, setModalForm] = useState({
    type: "EXPENSE_LOGISTICS" as "EXPENSE_LOGISTICS" | "EXPENSE_OPERATIONAL",
    totalAmount: "",
    date: new Date().toISOString().slice(0, 10),
    electronicInvoiceKey: "",
    description: "",
    incurredBy: defaultIncurredBy,
    onlyVatCredit: false,
  });

  // Sync incurredBy when currentUser changes or modal is triggered
  useEffect(() => {
    if (defaultIncurredBy) {
      setModalForm((prev) => ({
        ...prev,
        incurredBy: prev.incurredBy && prev.incurredBy !== "Master Admin" ? prev.incurredBy : defaultIncurredBy,
      }));
    }
  }, [defaultIncurredBy]);

  // Tooltip active state
  const [showTaxTooltip, setShowTaxTooltip] = useState(false);

  // Fetch monthly financial status
  const fetchFinancialStatus = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/finances/monthly-status?month=${selectedMonth}&year=${selectedYear}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
        const json: FinancialStatusPayload = await res.json();
        if (json.success) {
          setData(json);
          setCurrentPage(1);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err: unknown) {
        console.error("Failed to load monthly finances:", err);
        setError(
          lang === "es"
            ? "No se pudo cargar el estado financiero"
            : "Failed to load financial status"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedMonth, selectedYear, lang]
  );

  useEffect(() => {
    fetchFinancialStatus();
  }, [fetchFinancialStatus]);

  // Handle create new expense submit
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(modalForm.totalAmount);
    if (!amountNum || amountNum <= 0) return;

    setModalSubmitting(true);
    try {
      const res = await fetch("/api/finances/monthly-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: modalForm.type,
          totalAmount: amountNum,
          date: modalForm.date
            ? new Date(modalForm.date).toISOString()
            : new Date().toISOString(),
          electronicInvoiceKey: modalForm.electronicInvoiceKey,
          description: modalForm.description,
          incurredBy: modalForm.incurredBy || defaultIncurredBy,
          onlyVatCredit: modalForm.onlyVatCredit,
        }),
      });

      if (res.ok) {
        setModalOpen(false);
        setModalForm({
          type: "EXPENSE_LOGISTICS",
          totalAmount: "",
          date: new Date().toISOString().slice(0, 10),
          electronicInvoiceKey: "",
          description: "",
          incurredBy: defaultIncurredBy,
          onlyVatCredit: false,
        });
        await fetchFinancialStatus(true);
      } else {
        const errJson = await res.json();
        alert(errJson.error || "Error al registrar el gasto");
      }
    } catch (err) {
      console.error("Error creating expense:", err);
      alert("Error de red al guardar el gasto");
    } finally {
      setModalSubmitting(false);
    }
  };

  // Handle delete expense
  const handleDeleteExpense = async (id: string) => {
    const msg =
      lang === "es"
        ? "¿Seguro que deseas eliminar este gasto registrado?"
        : "Are you sure you want to delete this recorded expense?";
    if (!confirm(msg)) return;

    try {
      const res = await fetch(`/api/finances/monthly-status?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchFinancialStatus(true);
      } else {
        const errJson = await res.json();
        alert(errJson.error || "Error al eliminar el gasto");
      }
    } catch (err) {
      console.error("Error deleting expense:", err);
      alert("Error de conexión al eliminar el gasto");
    }
  };

  // Live Reverse VAT calculation preview in modal
  const modalLiveVat = useMemo(() => {
    const raw = parseFloat(modalForm.totalAmount) || 0;
    const subtotal = Math.round((raw / 1.13) * 100) / 100;
    const iva = Math.round((raw - subtotal) * 100) / 100;
    return { raw, subtotal, iva };
  }, [modalForm.totalAmount]);

  // Currency Formatter & Live Exchange Rate
  const currencyPrefix = currency === "CRC" ? "₡" : "$";
  const [exchangeRate, setExchangeRate] = useState<number>(455.21);

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

  const formatVal = useCallback(
    (crcVal: number) => {
      if (currency === "USD") {
        return crcVal / exchangeRate;
      }
      return crcVal;
    },
    [currency, exchangeRate]
  );

  // Filtered expense transactions
  const filteredTransactions = useMemo(() => {
    if (!data?.transactions) return [];
    return data.transactions.filter((tx) => {
      if (tableTypeFilter === "EXPENSE_LOGISTICS") {
        return tx.type === "EXPENSE_LOGISTICS";
      }
      if (tableTypeFilter === "EXPENSE_OPERATIONAL") {
        return tx.type === "EXPENSE_OPERATIONAL";
      }
      return true;
    });
  }, [data?.transactions, tableTypeFilter]);

  // Paginated transactions
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // Flow Percentages calculation
  const flowPercentages = useMemo(() => {
    const income = data?.flowBreakdown?.totalIncomeSubtotal || 0;
    if (income <= 0) {
      return { partsPct: 0, expensesPct: 0, cogsPct: 0, vatPct: 0, taxPct: 0, distPct: 0 };
    }
    const partsCost = data?.flowBreakdown?.partsCostSubtotal ?? data?.metrics?.partsCostSubtotal ?? data?.metrics?.partsCogsSubtotal ?? 0;
    const manualExpenses = data?.flowBreakdown?.manualExpensesSubtotal ?? data?.metrics?.manualExpensesSubtotal ?? 0;
    const partsPct = Math.min(100, Math.round((partsCost / income) * 100));
    const expensesPct = Math.min(100, Math.round((manualExpenses / income) * 100));
    const cogs = data?.flowBreakdown?.cogsSubtotal || 0;
    const vat = data?.flowBreakdown?.netVatPayable || 0;
    const tax = data?.flowBreakdown?.taxReserve || 0;
    const dist = Math.max(0, data?.flowBreakdown?.distributableCash || 0);

    return {
      partsPct,
      expensesPct,
      cogsPct: Math.min(100, Math.round((cogs / income) * 100)),
      vatPct: Math.min(100, Math.round((vat / income) * 100)),
      taxPct: Math.min(100, Math.round((tax / income) * 100)),
      distPct: Math.min(100, Math.round((dist / income) * 100)),
    };
  }, [data?.flowBreakdown, data?.metrics]);

  // Distributable Cash Line Chart Data (12 months of the selected year)
  // Comparison: Projected Profit (Gross Profit) vs. Distributable Cash
  const distributableLineData: LineChartDatum[] = useMemo(() => {
    if (!data?.distributableCashHistory || data.distributableCashHistory.length === 0) {
      return [];
    }
    return data.distributableCashHistory.map((item) => ({
      key: item.monthKey,
      label: lang === "es" ? item.labelEs : item.labelEn,
      subLabel: `${lang === "es" ? item.labelEs : item.labelEn} ${selectedYear}`,
      primaryValue: Math.round(formatVal(item.partnerDistributableCash)),
      secondaryValue: Math.round(formatVal(item.grossProfit !== undefined ? item.grossProfit : item.netProfitBeforeTax)),
      tooltipPrimaryLabel: lang === "es" ? "Efectivo Distribuible" : "Distributable Cash",
      tooltipSecondaryLabel: lang === "es" ? "Utilidad Proyectada (Bruta)" : "Projected Profit (Gross)",
    }));
  }, [data?.distributableCashHistory, lang, selectedYear, formatVal]);

  // Rule 7: Animated Skeleton Screen while loading
  if (loading && !data) {
    return <FinancialDashboardSkeleton />;
  }

  const metrics = data?.metrics;
  const isCloseTo15th = metrics?.isCloseTo15th ?? false;
  const currentGrossProfit = metrics?.grossProfit !== undefined
    ? metrics.grossProfit
    : Math.max(0, (metrics?.totalSalesSubtotal || 0) - (metrics?.partsCostSubtotal || 0));
  const currentDistributable = metrics?.partnerDistributableCash || 0;
  const deductionsTotal = Math.max(0, (metrics?.manualExpensesSubtotal || 0) + (metrics?.incomeTaxProvision || 0));
  const cashConversionPct = currentGrossProfit > 0
    ? Math.min(100, Math.max(0, Math.round((currentDistributable / currentGrossProfit) * 100)))
    : 0;

  return (
    <div className="space-y-6">
      {/* =====================================================================
          1. HEADER: MONTH-YEAR SELECTOR & ACTIONS
         ===================================================================== */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-black/[0.04]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title & Metadata */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-[#141414] text-white flex items-center justify-center shadow-xs">
                <Landmark className="w-4 h-4 text-[#F05526]" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#141414]">
                {lang === "es" ? "Cierre Financiero Mensual" : "Monthly Financial Dashboard"}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#71717A]">
              {lang === "es"
                ? "Automatización de cierres fiscales, pasivo de IVA (D-104), reserva de renta (D-101) y flujo neto distribuible a socios. Ingresos calculados estrictamente de pagos confirmados."
                : "Automated monthly closures, VAT liabilities, tax provisions, and partner distributable cash. Income strictly sourced from confirmed payments."}
            </p>
          </div>

          {/* MonthYearSelector Component */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Dropdown */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="h-10 pl-3 pr-8 rounded-full bg-[#F6F6F8] border border-black/[0.05] text-xs font-semibold text-[#141414] appearance-none cursor-pointer hover:bg-neutral-100 transition focus:outline-hidden focus:ring-2 focus:ring-[#141414]"
              >
                {(lang === "es" ? MONTH_NAMES_ES : MONTH_NAMES_EN).map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <Calendar className="w-3.5 h-3.5 text-[#71717A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Year Dropdown */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="h-10 pl-3 pr-8 rounded-full bg-[#F6F6F8] border border-black/[0.05] text-xs font-semibold text-[#141414] appearance-none cursor-pointer hover:bg-neutral-100 transition focus:outline-hidden focus:ring-2 focus:ring-[#141414]"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
              <Calendar className="w-3.5 h-3.5 text-[#71717A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quick "Current Month" button */}
            <button
              type="button"
              onClick={() => {
                setSelectedMonth(now.getMonth() + 1);
                setSelectedYear(now.getFullYear());
              }}
              className="h-10 px-3 rounded-full text-xs font-semibold bg-[#F6F6F8] text-[#71717A] hover:text-[#141414] hover:bg-neutral-200 transition cursor-pointer"
            >
              {lang === "es" ? "Mes Actual" : "Current Month"}
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => fetchFinancialStatus(true)}
              disabled={refreshing}
              title={lang === "es" ? "Refrescar datos" : "Refresh data"}
              className="w-10 h-10 rounded-full bg-[#F6F6F8] text-[#141414] flex items-center justify-center hover:bg-neutral-200 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#F05526]" : ""}`} />
            </button>

            {/* Register Expense Modal Trigger */}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="h-10 px-4 rounded-full bg-[#141414] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-black/85 transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#F05526]" />
              <span>{lang === "es" ? "Registrar Gasto" : "Add Expense"}</span>
            </button>
          </div>
        </div>

        {/* 15th of Month D-104 Alert Banner (Costa Rica Tax Filing) */}
        {isCloseTo15th && (
          <div className="mt-4 p-3.5 rounded-2xl bg-[#FEF2F2] border border-[#EF4444]/25 flex items-center justify-between gap-3 text-xs text-[#991B1B]">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#EF4444] text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
              <div>
                <span className="font-bold">
                  {lang === "es"
                    ? "¡Alerta de Vencimiento Fiscal Hacienda (D-104)!"
                    : "Tax Alert: Hacienda Filing Due (D-104)!"}
                </span>{" "}
                <span className="text-[#B91C1C]">
                  {lang === "es"
                    ? "Estamos cerca del día 15 del mes. Verifique la declaración y el pago de IVA correspondiente."
                    : "We are near the 15th of the month. Ensure your monthly VAT declaration and payment are settled."}
                </span>
              </div>
            </div>
            <span className="shrink-0 font-bold px-2.5 py-1 rounded-full bg-[#EF4444] text-white text-[11px]">
              {lang === "es" ? "Día 15 Clave" : "15th Deadline"}
            </span>
          </div>
        )}
      </section>

      {/* =====================================================================
          2. 6 KPI CARDS (Gross Income, Parts Cost, Operating Expenses, VAT, Tax Reserve, Distributable Cash)
         ===================================================================== */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Gross Income (No VAT) - Green Theme */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-emerald-500/20 relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between text-xs text-[#71717A] mb-2">
            <span className="font-semibold text-emerald-800">
              {lang === "es" ? "Ingresos Cobrados (Sin IVA)" : "Gross Income (No VAT)"}
            </span>
            <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#141414] tracking-tight">
            <AnimatedStatNumber
              value={formatVal(metrics?.totalSalesSubtotal || 0)}
              prefix={currencyPrefix}
              decimals={currency === "USD" ? 2 : 0}
            />
          </div>
          <div className="mt-2 text-[10px] text-[#71717A] flex items-center justify-between">
            <span className="truncate max-w-[170px]" title={lang === "es" ? "Total cobrado con IVA en comprobantes (Total Gross Balance del Overview)" : "Total collected with VAT on receipts (Overview Total Gross Balance)"}>
              {lang === "es"
                ? `Total c/IVA: ${currencyPrefix}${Math.round(formatVal(metrics?.grossIncomeWithVat || 0)).toLocaleString()}`
                : `Total w/VAT: ${currencyPrefix}${Math.round(formatVal(metrics?.grossIncomeWithVat || 0)).toLocaleString()}`}
            </span>
            <span className="font-semibold text-emerald-600 shrink-0 ml-1">100%</span>
          </div>
          <div className="mt-2.5 w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: "100%" }} />
          </div>
        </div>

        {/* Card 2: Order Parts Cost (Wholesale) - Indigo Theme */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-indigo-500/20 relative overflow-hidden group hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between text-xs text-[#71717A] mb-2">
            <span className="font-semibold text-indigo-900">
              {lang === "es" ? "Costo Piezas (Órdenes)" : "Order Parts Cost"}
            </span>
            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#141414] tracking-tight">
            <AnimatedStatNumber
              value={formatVal(metrics?.partsCostSubtotal ?? metrics?.partsCogsSubtotal ?? 0)}
              prefix={currencyPrefix}
              decimals={currency === "USD" ? 2 : 0}
            />
          </div>
          <div className="mt-2 text-[10px] text-[#71717A] flex items-center justify-between">
            <span className="truncate max-w-[170px]" title={lang === "es" ? "Costo mayorista de piezas de pedidos confirmados" : "Wholesale cost of parts in confirmed orders"}>
              {lang === "es" ? "Costo mayorista piezas" : "Wholesale parts cost"}
            </span>
            <span className="font-semibold text-indigo-600 shrink-0 ml-1">{flowPercentages.partsPct}%</span>
          </div>
          <div className="mt-2.5 w-full h-1 bg-indigo-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-700"
              style={{ width: `${flowPercentages.partsPct}%` }}
            />
          </div>
        </div>

        {/* Card 3: Operational Expenses & Logistics (No VAT) - Orange Theme */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-orange-500/20 relative overflow-hidden group hover:border-orange-500/40 transition">
          <div className="flex items-center justify-between text-xs text-[#71717A] mb-2">
            <span className="font-semibold text-orange-800">
              {lang === "es" ? "Gastos Operativos & Taller" : "Operating Expenses"}
            </span>
            <span className="w-6 h-6 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
              <Truck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#141414] tracking-tight">
            <AnimatedStatNumber
              value={formatVal(metrics?.manualExpensesSubtotal || 0)}
              prefix={currencyPrefix}
              decimals={currency === "USD" ? 2 : 0}
            />
          </div>
          <div className="mt-2 text-[10px] text-[#71717A] flex items-center justify-between">
            <span className="truncate max-w-[170px]" title={lang === "es" ? "Gastos registrados en tabla mensual" : "Registered expenses in monthly table"}>
              {lang === "es"
                ? `${data?.transactions?.length || 0} gastos en tabla`
                : `${data?.transactions?.length || 0} logged exp.`}
            </span>
            <span className="font-semibold text-orange-600 shrink-0 ml-1">{flowPercentages.expensesPct}%</span>
          </div>
          <div className="mt-2.5 w-full h-1 bg-orange-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-700"
              style={{ width: `${flowPercentages.expensesPct}%` }}
            />
          </div>
        </div>

        {/* Card 3: VAT Payable to Hacienda (13%) - Red Theme */}
        <div
          className={`bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] relative overflow-hidden transition ${
            isCloseTo15th
              ? "border-2 border-red-500 bg-red-50/20 ring-2 ring-red-500/20"
              : "border border-red-500/20 hover:border-red-500/40"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#71717A] mb-2">
            <span className="font-semibold text-red-800">
              {lang === "es" ? "IVA por Pagar (13%)" : "Net VAT (13%)"}
            </span>
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                isCloseTo15th ? "bg-red-500 text-white" : "bg-red-50 text-red-600"
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#141414] tracking-tight">
            {metrics?.isTaxCredit ? (
              <span className="text-emerald-600 text-lg sm:text-xl font-bold">
                {lang === "es" ? "Crédito a Favor" : "Tax Credit"}
              </span>
            ) : (
              <AnimatedStatNumber
                value={formatVal(metrics?.netIvaPayable || 0)}
                prefix={currencyPrefix}
                decimals={currency === "USD" ? 2 : 0}
              />
            )}
          </div>
          <div className="mt-2 text-[11px] text-[#71717A] flex items-center justify-between">
            <span>
              {metrics?.isTaxCredit
                ? `${currencyPrefix}${Math.round(formatVal(metrics.taxCreditAmount)).toLocaleString()} crédito`
                : lang === "es"
                ? "Declaración D-104"
                : "D-104 filing"}
            </span>
            <span className="font-semibold text-red-600">
              {metrics?.isTaxCredit ? "0%" : `${flowPercentages.vatPct}%`}
            </span>
          </div>
          <div className="mt-2.5 w-full h-1 bg-red-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-700"
              style={{ width: `${metrics?.isTaxCredit ? 0 : flowPercentages.vatPct}%` }}
            />
          </div>
        </div>

        {/* Card 4: Income Tax Reserve (30%) - Blue Theme */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-blue-500/20 relative overflow-hidden group hover:border-blue-500/40 transition">
          <div className="flex items-center justify-between text-xs text-[#71717A] mb-2">
            <span className="font-semibold text-blue-800">
              {lang === "es" ? "Reserva Renta (30%)" : "Tax Reserve (30%)"}
            </span>
            <div className="relative">
              <button
                type="button"
                onMouseEnter={() => setShowTaxTooltip(true)}
                onMouseLeave={() => setShowTaxTooltip(false)}
                onClick={() => setShowTaxTooltip((v) => !v)}
                className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center cursor-pointer hover:bg-blue-100 transition"
                aria-label="Info Reserva Renta"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              {/* Tooltip: Do not touch. Reserved for annual tax payment. */}
              {showTaxTooltip && (
                <div className="absolute right-0 bottom-full mb-2 w-56 p-2.5 bg-[#141414] text-white text-[11px] font-medium rounded-xl shadow-xl z-50 pointer-events-none leading-relaxed">
                  <div className="font-bold text-[#FF855D] mb-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{lang === "es" ? "Atención Socios" : "Partner Notice"}</span>
                  </div>
                  {lang === "es"
                    ? "No tocar. Reservado para pago anual de impuesto sobre la renta (D-101)."
                    : "Do not touch. Reserved for annual tax payment."}
                </div>
              )}
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#141414] tracking-tight">
            <AnimatedStatNumber
              value={formatVal(metrics?.incomeTaxProvision || 0)}
              prefix={currencyPrefix}
              decimals={currency === "USD" ? 2 : 0}
            />
          </div>
          <div className="mt-2 text-[11px] text-[#71717A] flex items-center justify-between">
            <span>{lang === "es" ? "Reserva legal anual" : "Annual legal reserve"}</span>
            <span className="font-semibold text-blue-600">{flowPercentages.taxPct}%</span>
          </div>
          <div className="mt-2.5 w-full h-1 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${flowPercentages.taxPct}%` }}
            />
          </div>
        </div>

        {/* Card 5: Distributable Cash (Partners) - Emerald Theme EMPHASIZED */}
        <div className="bg-gradient-to-br from-white via-white to-emerald-50/40 rounded-2xl p-4 shadow-[0_4px_20px_rgba(16,185,129,0.12)] border-2 border-emerald-500 relative overflow-hidden group hover:scale-[1.02] transition">
          <div className="flex items-center justify-between text-xs text-[#71717A] mb-2">
            <span className="font-bold text-emerald-900 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              {lang === "es" ? "Flujo Distribuible" : "Distributable Cash"}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider">
              {lang === "es" ? "Seguro" : "Safe"}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-700 tracking-tight">
            <AnimatedStatNumber
              value={formatVal(metrics?.partnerDistributableCash || 0)}
              prefix={currencyPrefix}
              decimals={currency === "USD" ? 2 : 0}
            />
          </div>
          <div className="mt-2 text-[11px] text-emerald-900/80 flex items-center justify-between font-medium">
            <span>{lang === "es" ? "Retiro seguro socios" : "Safe withdrawal amount"}</span>
            <span className="font-bold text-emerald-600">{flowPercentages.distPct}%</span>
          </div>
          <div className="mt-2.5 w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
              style={{ width: `${flowPercentages.distPct}%` }}
            />
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. LINE GRAPH: DISTRIBUTABLE CASH OVER THE MONTHS (VertixLineChart)
         ===================================================================== */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-black/[0.04] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#141414] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>
                {lang === "es"
                  ? `Flujo Distribuible a Socios por Mes (${selectedYear})`
                  : `Partner Distributable Cash Over Months (${selectedYear})`}
              </span>
            </h2>
            <p className="text-xs text-[#71717A]">
              {lang === "es"
                ? "Evolución mensual del efectivo líquido disponible para retiro seguro después de deducir IVA (13%) y reserva de renta (30%)."
                : "Monthly progression of safe distributable cash for partners after deducting 13% VAT and 30% income tax reserve."}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200 shrink-0">
            <span>{currencyPrefix}{Math.round(formatVal(metrics?.partnerDistributableCash || 0)).toLocaleString()}</span>
            <span className="text-[10px] font-semibold text-emerald-600">
              ({lang === "es" ? `${MONTH_NAMES_ES[selectedMonth - 1]}` : `${MONTH_NAMES_EN[selectedMonth - 1]}`})
            </span>
          </div>
        </div>

        <div className="pt-2">
          <VertixLineChart
            data={distributableLineData}
            primaryLegendLabel={lang === "es" ? "Efectivo Distribuible (Socios)" : "Distributable Cash (Partners)"}
            secondaryLegendLabel={lang === "es" ? "Utilidad Proyectada (Bruta)" : "Projected Profit (Gross)"}
            currencyPrefix={currencyPrefix}
            heightClass="h-72"
            animTriggerKey={`distributable-line-${selectedYear}-${selectedMonth}`}
          />
        </div>
      </section>

      {/* =====================================================================
          4. COMPARATIVE ANALYSIS: PROJECTED PROFIT (GROSS) VS. DISTRIBUTABLE CASH
         ===================================================================== */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-black/[0.04] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.04] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{lang === "es" ? "Comparativa Financiera Clave" : "Key Financial Comparison"}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#141414] flex items-center gap-2">
              <span>{lang === "es" ? "Utilidad Proyectada (Bruta) vs. Efectivo Distribuible" : "Projected Profit (Gross) vs. Distributable Cash"}</span>
            </h2>
            <p className="text-xs text-[#71717A] max-w-2xl mt-0.5">
              {lang === "es"
                ? "Contrasta el margen bruto comercial de las ventas (ingresos sin IVA menos costo de repuestos) contra el dinero líquido real que ingresa al bolsillo de los socios tras deducir gastos operativos y la reserva del 30% de renta de Hacienda."
                : "Compares gross operational margins (income excl. VAT minus wholesale parts COGS) against real liquid cash partners can safely withdraw after operating expenses and the 30% income tax provision."}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                  {lang === "es" ? "Conversión a Efectivo" : "Cash Conversion"}
                </span>
                <span className="text-base font-black text-indigo-950 font-mono">
                  {cashConversionPct}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Side-by-Side Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Utilidad Proyectada (Bruta) */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 border border-blue-200/80 relative overflow-hidden shadow-2xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100/80 text-blue-800 border border-blue-200">
                  {lang === "es" ? "Margen Bruto Comercial" : "Commercial Gross Margin"}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              </div>
              <div className="text-xs text-gray-500 font-semibold">
                {lang === "es" ? "Utilidad Proyectada (Bruta)" : "Projected Profit (Gross)"}
              </div>
              <div className="text-2xl font-black text-gray-900 font-mono mt-1">
                {currencyPrefix}{Math.round(formatVal(currentGrossProfit)).toLocaleString()}
              </div>
            </div>

            {/* FA-01: Key Financial Comparison Three Values: Original Profit, Profit Without Discount, Discount Amount */}
            <div className="p-2.5 rounded-xl bg-white/95 border border-blue-100 space-y-1.5 text-[11px] shadow-2xs">
              <div className="flex justify-between items-center text-gray-600">
                <span className="font-medium">{lang === "es" ? "1. Utilidad Original:" : "1. Original Profit:"}</span>
                <span className="font-mono font-bold text-gray-900">
                  {currencyPrefix}{Math.round(formatVal(currentGrossProfit)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-indigo-700">
                <span className="font-medium">{lang === "es" ? "2. Utilidad sin Descuento:" : "2. Profit w/o Discount:"}</span>
                <span className="font-mono font-bold">
                  {currencyPrefix}{Math.round(formatVal(currentGrossProfit + (metrics?.totalDiscountsCRC || 0))).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-amber-700">
                <span className="font-medium">{lang === "es" ? "3. Monto de Descuento:" : "3. Discount Deductions:"}</span>
                <span className="font-mono font-bold">
                  -{currencyPrefix}{Math.round(formatVal(metrics?.totalDiscountsCRC || 0)).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-blue-100 text-[11px] text-gray-600 space-y-1.5">
              <div className="flex justify-between">
                <span>{lang === "es" ? "Ventas Subtotal (Sin IVA):" : "Sales Subtotal (No VAT):"}</span>
                <span className="font-mono font-bold text-gray-900">
                  {currencyPrefix}{Math.round(formatVal(metrics?.totalSalesSubtotal || 0)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>{lang === "es" ? "(-) Costo Mayorista Piezas:" : "(-) Wholesale Parts Cost:"}</span>
                <span className="font-mono font-bold">
                  -{currencyPrefix}{Math.round(formatVal(metrics?.partsCostSubtotal || 0)).toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed italic pt-1 border-t border-blue-50">
              {lang === "es"
                ? "Ganancia bruta comercial antes de absorber costos operativos del taller y retenciones fiscales."
                : "Commercial gross profit before absorbing workshop operating costs and tax withholdings."}
            </p>
          </div>

          {/* Card 2: Operating & Tax Deductions Spread */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/60 via-white to-rose-50/40 border border-amber-200/80 relative overflow-hidden shadow-2xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100/80 text-amber-800 border border-amber-200">
                  {lang === "es" ? "Deducciones Operativas & Renta" : "Operating & Tax Deductions"}
                </span>
                <TrendingDown className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xs text-gray-500 font-semibold">
                {lang === "es" ? "Retenciones & Gastos Aplicados" : "Withholdings & Expenses"}
              </div>
              <div className="text-2xl font-black text-amber-900 font-mono mt-1">
                -{currencyPrefix}{Math.round(formatVal(deductionsTotal)).toLocaleString()}
              </div>
            </div>
            <div className="pt-3 border-t border-amber-100 text-[11px] text-gray-600 space-y-1.5">
              <div className="flex justify-between text-amber-800">
                <span>{lang === "es" ? "(-) Gastos Operativos Taller:" : "(-) Operating Expenses:"}</span>
                <span className="font-mono font-bold">
                  -{currencyPrefix}{Math.round(formatVal(metrics?.manualExpensesSubtotal || 0)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>{lang === "es" ? "(-) Reserva Renta (30% Hacienda):" : "(-) Income Tax (30%):"}</span>
                <span className="font-mono font-bold">
                  -{currencyPrefix}{Math.round(formatVal(metrics?.incomeTaxProvision || 0)).toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed italic pt-1 border-t border-amber-50">
              {lang === "es"
                ? "Deducciones indispensables para operar legalmente y proteger a los socios ante auditorías fiscales."
                : "Essential deductions to operate legally and safeguard partners during tax filings."}
            </p>
          </div>

          {/* Card 3: Efectivo Distribuible a Socios */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 border-2 border-emerald-300 relative overflow-hidden shadow-xs space-y-3 flex flex-col justify-between md:col-span-2 lg:col-span-1">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {lang === "es" ? "Flujo Líquido en Bolsillo" : "Liquid Cash in Pocket"}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xs text-emerald-800 font-semibold">
                {lang === "es" ? "Efectivo Distribuible (Socios)" : "Distributable Cash (Partners)"}
              </div>
              <div className="text-2xl font-black text-emerald-950 font-mono mt-1">
                {currencyPrefix}{Math.round(formatVal(currentDistributable)).toLocaleString()}
              </div>
            </div>
            <div className="pt-3 border-t border-emerald-100 text-[11px] text-gray-700 space-y-1.5">
              <div className="flex justify-between">
                <span>{lang === "es" ? "Tasa de Retención Líquida:" : "Liquid Retention Rate:"}</span>
                <span className="font-mono font-bold text-emerald-700">
                  {cashConversionPct}% {lang === "es" ? "de la Utilidad Bruta" : "of Gross Profit"}
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>{lang === "es" ? "Estado de Retiro:" : "Withdrawal Status:"}</span>
                <span className="font-bold text-emerald-800">
                  {currentDistributable > 0 ? (lang === "es" ? "Retiro 100% Seguro" : "100% Safe to Withdraw") : (lang === "es" ? "Sin Flujo Positivo" : "No Positive Flow")}
                </span>
              </div>
            </div>
            <p className="text-[10px] text-emerald-800/80 leading-relaxed italic pt-1 border-t border-emerald-50">
              {lang === "es"
                ? "Efectivo neto final blindado contra contingencias impositivas y deudas operativas."
                : "Final shielded net cash immune to tax contingencies and workshop debt."}
            </p>
          </div>
        </div>

        {/* Visual Progress / Conversion Bridge Bar */}
        <div className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-800">
            <span>{lang === "es" ? "Puente de Conversión: De Utilidad Bruta a Dinero en Mano" : "Conversion Bridge: From Gross Profit to Cash in Hand"}</span>
            <span className="font-mono text-indigo-700">
              {currencyPrefix}{Math.round(formatVal(currentGrossProfit)).toLocaleString()} ➔ {currencyPrefix}{Math.round(formatVal(currentDistributable)).toLocaleString()}
            </span>
          </div>
          <div className="h-3.5 w-full bg-neutral-200 rounded-full overflow-hidden flex">
            <div
              style={{
                width: `${currentGrossProfit > 0 ? Math.min(100, Math.max(0, (currentDistributable / currentGrossProfit) * 100)) : 0}%`,
              }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={lang === "es" ? "Efectivo Distribuible" : "Distributable Cash"}
            />
            <div
              style={{
                width: `${currentGrossProfit > 0 ? Math.min(100, Math.max(0, ((metrics?.manualExpensesSubtotal || 0) / currentGrossProfit) * 100)) : 0}%`,
              }}
              className="bg-amber-400 h-full transition-all duration-500"
              title={lang === "es" ? "Gastos Operativos" : "Operating Expenses"}
            />
            <div
              style={{
                width: `${currentGrossProfit > 0 ? Math.min(100, Math.max(0, ((metrics?.incomeTaxProvision || 0) / currentGrossProfit) * 100)) : 0}%`,
              }}
              className="bg-rose-400 h-full transition-all duration-500"
              title={lang === "es" ? "Reserva Renta" : "Income Tax Provision"}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#71717A] pt-1">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>{lang === "es" ? "Efectivo Distribuible" : "Distributable Cash"} ({currentGrossProfit > 0 ? Math.round((currentDistributable / currentGrossProfit) * 100) : 0}%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                <span>{lang === "es" ? "Gastos Operativos" : "Operating Expenses"} ({currentGrossProfit > 0 ? Math.round(((metrics?.manualExpensesSubtotal || 0) / currentGrossProfit) * 100) : 0}%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                <span>{lang === "es" ? "Reserva Renta 30%" : "Income Tax 30%"} ({currentGrossProfit > 0 ? Math.round(((metrics?.incomeTaxProvision || 0) / currentGrossProfit) * 100) : 0}%)</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4.5 FA-02: DEDICATED NET VAT AND TAX DEDUCTIONS SETTLEMENT
         ===================================================================== */}
      {(() => {
        const rawNetIva = metrics?.rawNetIva !== undefined 
          ? metrics.rawNetIva 
          : ((metrics?.incomeIvaTotal || 0) - (metrics?.expenseIvaTotal || 0));
        const isTaxPayable = rawNetIva > 0;
        const absNetIva = Math.abs(rawNetIva);

        return (
          <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-black/[0.04] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.04] pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-2">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>{lang === "es" ? "Liquidación Tributaria" : "Tax Settlement"}</span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#141414] flex items-center gap-2">
                  <span>{lang === "es" ? "Liquidación de IVA Neto y Deducciones Fiscales" : "Net VAT Settlement & Tax Deductions"}</span>
                </h2>
                <p className="text-xs text-[#71717A] max-w-2xl mt-0.5">
                  {lang === "es"
                    ? "Cálculo oficial del balance fiscal del período (IVA cobrado en ventas menos IVA soportado en gastos operativos y repuestos deducibles). Determina el saldo final obligatorio a pagar o el crédito fiscal a favor para el siguiente mes."
                    : "Official periodic tax balance (output VAT from sales minus deductible input VAT on expenses). Determines whether tax must be paid to the tax authority or carried over as a tax credit."}
                </p>
              </div>

              {/* Final Tax Balance Status Badge */}
              <div className="shrink-0">
                <div
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 shadow-2xs ${
                    isTaxPayable
                      ? "bg-rose-50/80 border-rose-200 text-rose-950"
                      : "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                      isTaxPayable ? "bg-rose-600" : "bg-emerald-600"
                    }`}
                  >
                    {isTaxPayable ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  </div>
                  <div>
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                        isTaxPayable ? "text-rose-700" : "text-emerald-700"
                      }`}
                    >
                      {isTaxPayable
                        ? (lang === "es" ? "Saldo Positivo: Impuesto por Pagar" : "Positive Balance: Tax to Pay")
                        : (lang === "es" ? "Saldo Negativo: Crédito Fiscal a Favor" : "Negative Balance: Tax Credit in Favor")}
                    </span>
                    <span className="text-lg font-black font-mono">
                      {isTaxPayable ? "+" : "-"}{currencyPrefix}{Math.round(formatVal(absNetIva)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net VAT Detailed Formula Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card A: IVA Cobrado (Débito Fiscal) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>{lang === "es" ? "IVA Cobrado en Ventas (13%)" : "VAT Collected on Sales (13%)"}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200/70 text-[10px] font-bold text-slate-700">
                    {lang === "es" ? "Débito Fiscal" : "Output VAT"}
                  </span>
                </div>
                <div className="text-xl font-black text-slate-900 font-mono">
                  {currencyPrefix}{Math.round(formatVal(metrics?.incomeIvaTotal || 0)).toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {lang === "es"
                    ? "Generado por ventas de repuestos, servicios y mano de obra con pago confirmado."
                    : "Generated from parts sales, services, and confirmed labor receipts."}
                </p>
              </div>

              {/* Card B: IVA Deducible (Crédito Fiscal de Compras/Gastos) */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
                  <span>{lang === "es" ? "(-) IVA Deducible en Gastos (13%)" : "(-) Deductible VAT on Expenses (13%)"}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200/70 text-[10px] font-bold text-amber-900">
                    {lang === "es" ? "Crédito Fiscal" : "Input VAT"}
                  </span>
                </div>
                <div className="text-xl font-black text-amber-950 font-mono">
                  -{currencyPrefix}{Math.round(formatVal(metrics?.expenseIvaTotal || 0)).toLocaleString()}
                </div>
                <p className="text-[10px] text-amber-800/80 leading-relaxed">
                  {lang === "es"
                    ? "IVA pagado a proveedores con comprobantes electrónicos respaldados en el sistema."
                    : "VAT paid to suppliers backed by registered expense invoices."}
                </p>
              </div>

              {/* Card C: Balance Final de IVA */}
              <div
                className={`p-4 rounded-2xl border space-y-2 ${
                  isTaxPayable
                    ? "bg-rose-50/50 border-rose-300"
                    : "bg-emerald-50/50 border-emerald-300"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className={isTaxPayable ? "text-rose-900" : "text-emerald-900"}>
                    {lang === "es" ? "(=) Balance Final de Impuesto" : "(=) Final Tax Balance"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      isTaxPayable
                        ? "bg-rose-200 text-rose-900"
                        : "bg-emerald-200 text-emerald-900"
                    }`}
                  >
                    {isTaxPayable ? (lang === "es" ? "Por Pagar" : "Payable") : (lang === "es" ? "A Favor" : "Credit")}
                  </span>
                </div>
                <div
                  className={`text-xl font-black font-mono ${
                    isTaxPayable ? "text-rose-950" : "text-emerald-950"
                  }`}
                >
                  {isTaxPayable ? "+" : "-"}{currencyPrefix}{Math.round(formatVal(absNetIva)).toLocaleString()}
                </div>
                <p
                  className={`text-[10px] leading-relaxed ${
                    isTaxPayable ? "text-rose-800" : "text-emerald-800"
                  }`}
                >
                  {isTaxPayable
                    ? (lang === "es"
                        ? "Monto positivo: Obligación tributaria líquida a pagar en la declaración D-104."
                        : "Positive amount: Net tax liability payable in tax filing D-104.")
                    : (lang === "es"
                        ? "Monto negativo: Crédito a favor disponible para compensar en períodos subsiguientes."
                        : "Negative amount: Credit available to offset against subsequent tax periods.")}
                </p>
              </div>
            </div>
          </section>
        );
      })()}

      {/* =====================================================================
          5. DATA VISUALIZATION: FINANCIAL FLOW (Income -> COGS -> Net VAT -> Tax Reserve -> Distributable Cash)
         ===================================================================== */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-black/[0.04] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#141414] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#F05526]" />
              <span>{lang === "es" ? "Flujo Financiero Mensual" : "Monthly Financial Flow"}</span>
            </h2>
            <p className="text-xs text-[#71717A]">
              {lang === "es"
                ? "Diagrama de distribución: Ingresos Totales ➔ Costos ➔ IVA Hacienda ➔ Reserva Renta ➔ Flujo Distribuible."
                : "Distribution flow: Total Income ➔ COGS ➔ Net VAT ➔ Tax Reserve ➔ Distributable Cash."}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-3 py-1 rounded-full bg-[#F6F6F8] text-[#141414]">
              {currencyPrefix}
              {Math.round(formatVal(metrics?.totalSalesSubtotal || 0)).toLocaleString()}{" "}
              {lang === "es" ? "Base Neta Cobrada" : "Net Paid Base"}
            </span>
          </div>
        </div>

        {/* Visual Flow Stages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 relative">
          {/* Node 1: Total Gross Income */}
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#71717A] mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                {lang === "es" ? "Paso 1: Ingreso" : "Step 1: Income"}
              </span>
              <span className="w-2 h-2 rounded-full bg-neutral-900" />
            </div>
            <div className="text-sm font-bold text-[#141414]">
              {lang === "es" ? "Ingresos Subtotal" : "Subtotal Income"}
            </div>
            <div className="text-base font-extrabold text-[#141414] mt-1">
              {currencyPrefix}
              {Math.round(formatVal(metrics?.totalSalesSubtotal || 0)).toLocaleString()}
            </div>
            <div className="text-[10px] text-[#71717A] mt-2 pt-2 border-t border-neutral-200 flex justify-between">
              <span>100% {lang === "es" ? "Total" : "Total"}</span>
              <span className="text-neutral-500 font-semibold">{lang === "es" ? "Sin IVA" : "Excl. VAT"}</span>
            </div>
          </div>

          {/* Node 2: Order Parts Cost (Wholesale) */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-indigo-900 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                {lang === "es" ? "Paso 2: Piezas" : "Step 2: Parts"}
              </span>
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
            </div>
            <div className="text-sm font-bold text-indigo-950">
              {lang === "es" ? "Costo Piezas (Órdenes)" : "Order Parts Cost"}
            </div>
            <div className="text-base font-extrabold text-indigo-700 mt-1">
              - {currencyPrefix}
              {Math.round(formatVal(metrics?.partsCostSubtotal ?? metrics?.partsCogsSubtotal ?? 0)).toLocaleString()}
            </div>
            <div className="text-[10px] text-indigo-800/80 mt-2 pt-2 border-t border-indigo-200 flex justify-between">
              <span>{flowPercentages.partsPct}% {lang === "es" ? "del ingreso" : "of income"}</span>
              <span className="font-semibold">{lang === "es" ? "Mayoreo" : "Wholesale"}</span>
            </div>
          </div>

          {/* Node 3: Operating Expenses & Logistics */}
          <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-orange-800 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                {lang === "es" ? "Paso 3: Gastos" : "Step 3: Expenses"}
              </span>
              <span className="w-2 h-2 rounded-full bg-orange-500" />
            </div>
            <div className="text-sm font-bold text-orange-950">
              {lang === "es" ? "Gastos Operativos & Taller" : "Operating Expenses"}
            </div>
            <div className="text-base font-extrabold text-orange-700 mt-1">
              - {currencyPrefix}
              {Math.round(formatVal(metrics?.manualExpensesSubtotal || 0)).toLocaleString()}
            </div>
            <div className="text-[10px] text-orange-800/80 mt-2 pt-2 border-t border-orange-200 flex justify-between">
              <span>{flowPercentages.expensesPct}% {lang === "es" ? "del ingreso" : "of income"}</span>
              <span className="font-semibold">{lang === "es" ? "Deducible" : "Deductible"}</span>
            </div>
          </div>

          {/* Node 4: Net VAT Payable */}
          <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-red-800 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                {lang === "es" ? "Paso 4: IVA" : "Step 4: VAT"}
              </span>
              <span className="w-2 h-2 rounded-full bg-red-500" />
            </div>
            <div className="text-sm font-bold text-red-950">
              {lang === "es" ? "IVA Neto (13%)" : "Net VAT (13%)"}
            </div>
            <div className="text-base font-extrabold text-red-700 mt-1">
              {metrics?.isTaxCredit ? (
                <span className="text-emerald-700 text-xs font-bold">{lang === "es" ? "Crédito a favor" : "Credit"}</span>
              ) : (
                `- ${currencyPrefix}${Math.round(formatVal(metrics?.netIvaPayable || 0)).toLocaleString()}`
              )}
            </div>
            <div className="text-[10px] text-red-800/80 mt-2 pt-2 border-t border-red-200 flex justify-between">
              <span>{metrics?.isTaxCredit ? "0%" : `${flowPercentages.vatPct}%`} {lang === "es" ? "del ingreso" : "of income"}</span>
              <span className="font-semibold">D-104</span>
            </div>
          </div>

          {/* Node 5: Income Tax Reserve */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-blue-800 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                {lang === "es" ? "Paso 5: Reserva" : "Step 5: Reserve"}
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <div className="text-sm font-bold text-blue-950">
              {lang === "es" ? "Reserva Renta 30%" : "Tax Reserve 30%"}
            </div>
            <div className="text-base font-extrabold text-blue-700 mt-1">
              - {currencyPrefix}
              {Math.round(formatVal(metrics?.incomeTaxProvision || 0)).toLocaleString()}
            </div>
            <div className="text-[10px] text-blue-800/80 mt-2 pt-2 border-t border-blue-200 flex justify-between">
              <span>{flowPercentages.taxPct}% {lang === "es" ? "del ingreso" : "of income"}</span>
              <span className="font-semibold">{lang === "es" ? "Intocable" : "Locked"}</span>
            </div>
          </div>

          {/* Node 6: Distributable Cash */}
          <div className="p-4 rounded-2xl bg-emerald-500 text-white flex flex-col justify-between shadow-md">
            <div className="flex items-center justify-between text-xs text-emerald-100 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                {lang === "es" ? "Paso 6: Socios" : "Step 6: Cash"}
              </span>
              <span className="w-2 h-2 rounded-full bg-white" />
            </div>
            <div className="text-sm font-bold text-white">
              {lang === "es" ? "Flujo Distribuible" : "Distributable Cash"}
            </div>
            <div className="text-base font-extrabold text-white mt-1">
              {currencyPrefix}
              {Math.round(formatVal(metrics?.partnerDistributableCash || 0)).toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-100 mt-2 pt-2 border-t border-emerald-400 flex justify-between font-semibold">
              <span>{flowPercentages.distPct}% {lang === "es" ? "Líquido" : "Liquid"}</span>
              <span>{lang === "es" ? "Seguro" : "Safe"}</span>
            </div>
          </div>
        </div>

        {/* Multi-Segment Distribution Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-[#71717A] font-semibold">
            <span>{lang === "es" ? "Distribución porcentual por colón recibido:" : "Percentage distribution per CRC earned:"}</span>
            <span>100% {lang === "es" ? "Ingreso Total Cobrado" : "Total Paid Revenue"}</span>
          </div>
          <div className="w-full h-4 rounded-full bg-neutral-100 overflow-hidden flex">
            {/* Parts Cost Segment */}
            <div
              className="h-full bg-indigo-500 transition-all duration-1000"
              style={{ width: `${flowPercentages.partsPct}%` }}
              title={`Costo Piezas: ${flowPercentages.partsPct}%`}
            />
            {/* Operating Expenses Segment */}
            <div
              className="h-full bg-orange-500 transition-all duration-1000"
              style={{ width: `${flowPercentages.expensesPct}%` }}
              title={`Gastos Taller/Operativos: ${flowPercentages.expensesPct}%`}
            />
            {/* Net VAT Segment */}
            <div
              className="h-full bg-red-500 transition-all duration-1000"
              style={{ width: `${metrics?.isTaxCredit ? 0 : flowPercentages.vatPct}%` }}
              title={`IVA Hacienda: ${flowPercentages.vatPct}%`}
            />
            {/* Tax Reserve Segment */}
            <div
              className="h-full bg-blue-500 transition-all duration-1000"
              style={{ width: `${flowPercentages.taxPct}%` }}
              title={`Reserva Renta 30%: ${flowPercentages.taxPct}%`}
            />
            {/* Distributable Cash Segment */}
            <div
              className="h-full bg-emerald-500 transition-all duration-1000"
              style={{ width: `${flowPercentages.distPct}%` }}
              title={`Flujo Socios: ${flowPercentages.distPct}%`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#71717A] pt-1">
            <span className="flex items-center gap-1.5 font-medium text-indigo-900">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>{lang === "es" ? "Costo Piezas" : "Parts Cost"}: {flowPercentages.partsPct}%</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-orange-900">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>{lang === "es" ? "Gastos Operativos" : "Operating Expenses"}: {flowPercentages.expensesPct}%</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-red-900">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>{lang === "es" ? "IVA D-104" : "VAT D-104"}: {metrics?.isTaxCredit ? "0% (Crédito)" : `${flowPercentages.vatPct}%`}</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-blue-900">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>{lang === "es" ? "Reserva Renta" : "Tax Reserve"}: {flowPercentages.taxPct}%</span>
            </span>
            <span className="flex items-center gap-1.5 font-bold text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>{lang === "es" ? "Distribuible Socios" : "Distributable Cash"}: {flowPercentages.distPct}%</span>
            </span>
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. SECTION: ORDER PARTS COST (Desglose de Costos de Piezas por Pedido)
         ===================================================================== */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-indigo-500/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#141414] flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              <span>{lang === "es" ? "Costo de Piezas por Pedido (Mercadería Órdenes)" : "Order Parts Cost Breakdown"}</span>
            </h2>
            <p className="text-xs text-[#71717A]">
              {lang === "es"
                ? "Costos mayoristas de los repuestos vendidos en los pedidos confirmados del mes. Separados de los gastos operativos."
                : "Wholesale costs of parts sold in confirmed orders of this month. Separated from operational expenses."}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-200 shrink-0">
            <span>{currencyPrefix}{Math.round(formatVal(metrics?.partsCostSubtotal ?? metrics?.partsCogsSubtotal ?? 0)).toLocaleString()}</span>
            <span className="text-[10px] text-indigo-600 font-normal">
              ({data?.ordersPartsBreakdown?.length || 0} {lang === "es" ? "pedidos con repuestos" : "orders with parts"})
            </span>
          </div>
        </div>

        {/* Table of Order Parts */}
        {data?.ordersPartsBreakdown && data.ordersPartsBreakdown.length > 0 ? (
          <div className="overflow-x-auto border border-neutral-200/70 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FBFBFB] border-b border-neutral-200/70 text-[#71717A] text-[11px] font-semibold">
                <tr>
                  <th className="py-2.5 px-3.5">Pedido / Orden</th>
                  <th className="py-2.5 px-3.5">Cliente</th>
                  <th className="py-2.5 px-3.5">Ítems / Repuestos</th>
                  <th className="py-2.5 px-3.5 text-right">Venta Bruta</th>
                  <th className="py-2.5 px-3.5 text-right">Costo Piezas</th>
                  <th className="py-2.5 px-3.5 text-right">Margen Bruto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium text-slate-800">
                {data.ordersPartsBreakdown.map((item) => (
                  <tr key={item.orderId} className="hover:bg-indigo-50/20 transition">
                    <td className="py-3 px-3.5 font-mono font-bold text-indigo-700">
                      #{item.orderNumber}
                    </td>
                    <td className="py-3 px-3.5 text-neutral-800">{item.customerName}</td>
                    <td className="py-3 px-3.5 text-neutral-600">
                      <span className="truncate max-w-[200px] block" title={item.firstItemTitle}>
                        {item.firstItemTitle} {item.itemsCount > 1 ? `(+${item.itemsCount - 1})` : ""}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-semibold text-neutral-900">
                      {currencyPrefix}{Math.round(formatVal(item.partsSaleGrossCRC)).toLocaleString()}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-indigo-700">
                      {currencyPrefix}{Math.round(formatVal(item.partsCostCRC)).toLocaleString()}
                      {item.isCustomCost && (
                        <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-indigo-100 text-indigo-800 font-sans font-bold">
                          Personalizado
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-600">
                      +{currencyPrefix}{Math.round(formatVal(item.profitCRC)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center rounded-2xl bg-neutral-50 border border-dashed border-neutral-200 text-neutral-500 text-xs">
            {lang === "es"
              ? "No hay pedidos con repuestos confirmados en este mes."
              : "No confirmed orders with parts recorded for this month."}
          </div>
        )}
      </section>

      {/* =====================================================================
          6. DATA TABLE: REGISTRO DE GASTOS DEL MES (Strictly Expenses)
         ===================================================================== */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_2px_16px_rgba(0,0,0,0.03)] border border-black/[0.04] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#141414] flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#F05526]" />
              <span>{lang === "es" ? "Registro de Gastos del Mes" : "Monthly Expenses Register"}</span>
            </h2>
            <p className="text-xs text-[#71717A]">
              {lang === "es"
                ? `${filteredTransactions.length} gastos registrados. Los ingresos se registran automáticamente con las órdenes pagadas.`
                : `${filteredTransactions.length} recorded expenses. Revenue is registered automatically from confirmed paid orders.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Buttons */}
            <div className="flex items-center bg-[#F6F6F8] p-1 rounded-full text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setTableTypeFilter("ALL");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  tableTypeFilter === "ALL" ? "bg-[#141414] text-white" : "text-[#71717A] hover:text-[#141414]"
                }`}
              >
                {lang === "es" ? "Todos los Gastos" : "All Expenses"} ({data?.transactions.length || 0})
              </button>
              <button
                type="button"
                onClick={() => {
                  setTableTypeFilter("EXPENSE_LOGISTICS");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  tableTypeFilter === "EXPENSE_LOGISTICS" ? "bg-[#141414] text-white" : "text-[#71717A] hover:text-[#141414]"
                }`}
              >
                {lang === "es" ? "Logística / Piezas" : "Logistics & Parts"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTableTypeFilter("EXPENSE_OPERATIONAL");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  tableTypeFilter === "EXPENSE_OPERATIONAL" ? "bg-[#141414] text-white" : "text-[#71717A] hover:text-[#141414]"
                }`}
              >
                {lang === "es" ? "Operativos / Taller" : "Operational"}
              </button>
            </div>

            {/* Prominent Add Expense Button */}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#141414] text-white text-xs font-semibold shadow-sm hover:bg-black/85 transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#F05526]" />
              <span>{lang === "es" ? "Registrar Gasto" : "Add Expense"}</span>
            </button>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black/[0.05] text-[#71717A] font-semibold">
                <th className="py-3 px-3">{lang === "es" ? "Fecha" : "Date"}</th>
                <th className="py-3 px-3">{lang === "es" ? "Tipo / Régimen" : "Type / Treatment"}</th>
                <th className="py-3 px-3">{lang === "es" ? "Detalle / Concepto" : "Description"}</th>
                <th className="py-3 px-3">{lang === "es" ? "Responsable" : "Incurred By"}</th>
                <th className="py-3 px-3 text-right">{lang === "es" ? "Total (Con IVA)" : "Total (With VAT)"}</th>
                <th className="py-3 px-3 text-right">{lang === "es" ? "Subtotal (Base)" : "Subtotal (Base)"}</th>
                <th className="py-3 px-3 text-right">{lang === "es" ? "IVA Deducible (13%)" : "Deductible VAT"}</th>
                <th className="py-3 px-3">{lang === "es" ? "Clave Factura / Referencia" : "Invoice / Reference"}</th>
                <th className="py-3 px-3 text-center">{lang === "es" ? "Acción" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03]">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#71717A]">
                    {lang === "es"
                      ? "No hay gastos registrados en este periodo. Utilice 'Registrar Gasto' para agregar costos deducibles."
                      : "No expenses recorded in this period. Use 'Add Expense' to record deductible costs."}
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const typeLabel =
                    tx.type === "EXPENSE_LOGISTICS"
                      ? lang === "es"
                        ? "Logística / Flete / Mercadería"
                        : "Logistics & COGS"
                      : lang === "es"
                      ? "Gasto Operativo / Taller"
                      : "Operational Expense";

                  const typeColor =
                    tx.type === "EXPENSE_LOGISTICS"
                      ? "bg-orange-50 text-orange-700 border-orange-200"
                      : "bg-red-50 text-red-700 border-red-200";

                  const txDateFormatted = new Date(tx.date).toLocaleDateString(
                    lang === "es" ? "es-CR" : "en-US",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }
                  );

                  return (
                    <tr key={tx.id} className="hover:bg-neutral-50/80 transition-colors">
                      {/* Date */}
                      <td className="py-3 px-3 text-[#141414] font-medium whitespace-nowrap">
                        {txDateFormatted}
                      </td>

                      {/* Type & Fiscal Treatment */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeColor}`}
                          >
                            {tx.isAutoSystemExpense && <Fuel className="w-3 h-3 text-[#F05526]" />}
                            {typeLabel}
                          </span>
                          {tx.onlyVatCredit ? (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                              title={
                                lang === "es"
                                  ? "Gasto personal con factura electrónica: Solo cuenta IVA a favor (13%), no rebaja utilidades de socios"
                                  : "Personal invoice: Only 13% VAT credit, does not reduce partner profit"
                              }
                            >
                              {lang === "es" ? "Solo IVA a Favor" : "VAT Credit Only"}
                            </span>
                          ) : tx.isAutoSystemExpense ? (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200"
                              title={
                                lang === "es"
                                  ? "Deducción automática de combustible de retiro UTV: ₡500 por km"
                                  : "Automatic pickup UTV fuel deduction: ₡500 per km"
                              }
                            >
                              {lang === "es" ? "Retiro ₡500/km" : "Pickup ₡500/km"}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-3 text-[#141414] max-w-xs truncate" title={tx.description || ""}>
                        {tx.description || (lang === "es" ? "Gasto registrado" : "Recorded expense")}
                      </td>

                      {/* Person Incurred By */}
                      <td className="py-3 px-3 text-[#141414] font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-[#71717A] shrink-0" />
                          <span className="text-xs">{tx.incurredBy || "Master Admin"}</span>
                        </div>
                      </td>

                      {/* Total with VAT */}
                      <td className="py-3 px-3 text-right font-bold text-red-600 whitespace-nowrap">
                        -{currencyPrefix}
                        {Math.round(formatVal(tx.totalAmount)).toLocaleString()}
                      </td>

                      {/* Subtotal */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span
                          className={`${
                            tx.onlyVatCredit ? "text-neutral-400 line-through" : "text-[#71717A]"
                          }`}
                        >
                          {currencyPrefix}
                          {Math.round(formatVal(tx.subtotal)).toLocaleString()}
                        </span>
                        {tx.onlyVatCredit && (
                          <span className="block text-[9px] text-neutral-400 italic">
                            {lang === "es" ? "No deduce renta" : "No profit deduction"}
                          </span>
                        )}
                      </td>

                      {/* VAT Amount */}
                      <td className="py-3 px-3 text-right text-emerald-600 font-bold whitespace-nowrap">
                        +{currencyPrefix}
                        {Math.round(formatVal(tx.ivaAmount)).toLocaleString()}
                      </td>

                      {/* Invoice Key / Reference */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {tx.electronicInvoiceKey ? (
                          <span
                            className="font-mono text-[10px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded select-all"
                            title={tx.electronicInvoiceKey}
                          >
                            {tx.electronicInvoiceKey.length > 20
                              ? `${tx.electronicInvoiceKey.slice(0, 10)}...${tx.electronicInvoiceKey.slice(-6)}`
                              : tx.electronicInvoiceKey}
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-400 italic">
                            {lang === "es" ? "Sin clave Hacienda" : "No invoice key"}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {tx.isAutoSystemExpense ? (
                          <span
                            className="text-[10px] font-semibold text-[#71717A] bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200"
                            title={
                              lang === "es"
                                ? "Calculado automáticamente por el servicio de retiro UTV (₡500/km)"
                                : "Automatically calculated from pickup service (₡500/km)"
                            }
                          >
                            {lang === "es" ? "Auto" : "Auto"}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(tx.id)}
                            title={lang === "es" ? "Eliminar este gasto" : "Delete this expense"}
                            className="w-7 h-7 rounded-full text-neutral-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-black/[0.04]">
            <span className="text-xs text-[#71717A]">
              {lang === "es"
                ? `Página ${currentPage} de ${totalPages}`
                : `Page ${currentPage} of ${totalPages}`}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded-full bg-[#F6F6F8] text-[#141414] flex items-center justify-center hover:bg-neutral-200 transition disabled:opacity-30 cursor-pointer"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 rounded-full bg-[#F6F6F8] text-[#141414] flex items-center justify-center hover:bg-neutral-200 transition disabled:opacity-30 cursor-pointer"
                title="Página siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* =====================================================================
          6. MODAL: REGISTRAR NUEVO GASTO DEDUCIBLE
         ===================================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-black/[0.05] space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#141414]">
                  {lang === "es" ? "Registrar Nuevo Gasto" : "Add New Expense"}
                </h3>
                <p className="text-xs text-[#71717A]">
                  {lang === "es"
                    ? "Cálculo inverso automático de IVA (13%) deducible para Hacienda Costa Rica."
                    : "Automatic 13% reverse VAT calculation for Costa Rica deductible expenses."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F6F6F8] text-[#71717A] hover:text-[#141414] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              {/* Type Selection (Expenses Only) */}
              <div>
                <label className="block text-xs font-semibold text-[#141414] mb-1.5">
                  {lang === "es" ? "Tipo de Gasto" : "Expense Type"}
                </label>
                <select
                  value={modalForm.type}
                  onChange={(e) =>
                    setModalForm({
                      ...modalForm,
                      type: e.target.value as any,
                    })
                  }
                  className="w-full h-11 px-3 rounded-xl bg-[#F6F6F8] border border-black/[0.06] text-xs font-semibold text-[#141414] focus:outline-hidden focus:ring-2 focus:ring-[#141414]"
                >
                  <option value="EXPENSE_LOGISTICS">
                    {lang === "es"
                      ? "Gasto Logístico / Mercadería / Fletes (EXPENSE_LOGISTICS)"
                      : "Logistics, Wholesale Parts & Freight (EXPENSE_LOGISTICS)"}
                  </option>
                  <option value="EXPENSE_OPERATIONAL">
                    {lang === "es"
                      ? "Gasto Operativo / Combustible / Mantenimiento Taller (EXPENSE_OPERATIONAL)"
                      : "Operational, Fuel & Workshop (EXPENSE_OPERATIONAL)"}
                  </option>
                </select>
              </div>

              {/* Person who incurred the expense (auto-filled) */}
              <div>
                <label className="block text-xs font-semibold text-[#141414] mb-1.5 flex items-center justify-between">
                  <span>
                    {lang === "es"
                      ? "Persona que realizó el gasto"
                      : "Person who incurred the expense"}
                  </span>
                  <span className="text-[10px] text-[#71717A] font-normal">
                    {lang === "es" ? "(Autocompletado del usuario)" : "(Auto-filled from user)"}
                  </span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#71717A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Nombre del responsable"
                    value={modalForm.incurredBy}
                    onChange={(e) => setModalForm({ ...modalForm, incurredBy: e.target.value })}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#F6F6F8] border border-black/[0.06] text-xs font-medium text-[#141414] focus:outline-hidden focus:ring-2 focus:ring-[#141414]"
                  />
                </div>
              </div>

              {/* Only VAT Credit In Favor Button / Toggle */}
              <div>
                <label className="block text-xs font-semibold text-[#141414] mb-1.5">
                  {lang === "es" ? "Tratamiento Fiscal del Gasto" : "Fiscal Treatment of Expense"}
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setModalForm((prev) => ({ ...prev, onlyVatCredit: !prev.onlyVatCredit }))
                  }
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                    modalForm.onlyVatCredit
                      ? "bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
                      : "bg-[#F6F6F8] border-black/[0.06] hover:bg-neutral-100"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                      modalForm.onlyVatCredit
                        ? "bg-emerald-600 text-white"
                        : "border-2 border-neutral-300 bg-white"
                    }`}
                  >
                    {modalForm.onlyVatCredit && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#141414]">
                        {lang === "es"
                          ? "Solo cuenta IVA a favor (Crédito Fiscal D-104)"
                          : "Only counts VAT credit in favor (D-104 Tax Credit)"}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          modalForm.onlyVatCredit
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-neutral-200 text-neutral-600"
                        }`}
                      >
                        {modalForm.onlyVatCredit
                          ? lang === "es"
                            ? "Activo: Solo IVA"
                            : "Active: VAT Only"
                          : lang === "es"
                          ? "Deducible Completo"
                          : "Fully Deductible"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#71717A] mt-1 leading-relaxed">
                      {lang === "es"
                        ? "Marcar si pediste factura electrónica para un consumo personal (ej. comida/restaurante). El 13% de IVA se reclama a favor en Hacienda, pero el subtotal NO se rebajará de las utilidades ni de la repartición a socios."
                        : "Select if you requested an electronic invoice for personal expenses (e.g. food/restaurant). 13% VAT is credited in Hacienda, but subtotal is NOT deducted from business profits or partner distribution."}
                    </p>
                  </div>
                </button>
              </div>

              {/* Total Amount (Includes 13% VAT) */}
              <div>
                <label className="block text-xs font-semibold text-[#141414] mb-1.5">
                  {lang === "es" ? "Monto Total Pagado (Con 13% IVA Incluido en ₡)" : "Total Amount Paid (With 13% VAT in ₡)"}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-[#71717A]">
                    ₡
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="Ej. 113000"
                    value={modalForm.totalAmount}
                    onChange={(e) => setModalForm({ ...modalForm, totalAmount: e.target.value })}
                    className="w-full h-11 pl-8 pr-4 rounded-xl bg-[#F6F6F8] border border-black/[0.06] text-sm font-bold text-[#141414] focus:outline-hidden focus:ring-2 focus:ring-[#141414]"
                  />
                </div>
              </div>

              {/* Real-time Reverse VAT Breakdown Box */}
              {modalLiveVat.raw > 0 && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                    modalForm.onlyVatCredit
                      ? "bg-emerald-50/50 border-emerald-200"
                      : "bg-neutral-50 border-neutral-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-neutral-700 text-[11px] uppercase tracking-wider">
                      {lang === "es" ? "Desglose Fiscal en Tiempo Real:" : "Real-Time Fiscal Breakdown:"}
                    </span>
                    {modalForm.onlyVatCredit && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {lang === "es" ? "IVA a Favor Exclusivo" : "Exclusive VAT Credit"}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between text-[#71717A]">
                    <span>
                      {modalForm.onlyVatCredit
                        ? lang === "es"
                          ? "Monto Personal (No deducible de utilidades):"
                          : "Personal Amount (Not deducted from profit):"
                        : lang === "es"
                        ? "Subtotal Base Deducible (/ 1.13):"
                        : "Deductible Base Subtotal (/ 1.13):"}
                    </span>
                    <span
                      className={`font-bold ${
                        modalForm.onlyVatCredit ? "text-neutral-500 line-through" : "text-[#141414]"
                      }`}
                    >
                      ₡{modalLiveVat.subtotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-[#71717A]">
                    <span>
                      {lang === "es"
                        ? "Crédito Fiscal IVA a Favor (13% D-104):"
                        : "VAT Credit In Favor (13% D-104):"}
                    </span>
                    <span className="font-bold text-emerald-600">
                      +₡{modalLiveVat.iva.toLocaleString()}
                    </span>
                  </div>

                  {modalForm.onlyVatCredit && (
                    <div className="pt-1.5 border-t border-emerald-200/60 text-[11px] text-emerald-800">
                      {lang === "es"
                        ? `✓ Este gasto reduce el IVA por pagar a Hacienda en ₡${modalLiveVat.iva.toLocaleString()} sin deducir ni castigar las utilidades de los socios.`
                        : `✓ This expense reduces VAT payable to Hacienda by ₡${modalLiveVat.iva.toLocaleString()} without deducting partner profits.`}
                    </div>
                  )}
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-[#141414] mb-1.5">
                  {lang === "es" ? "Fecha del Gasto" : "Expense Date"}
                </label>
                <input
                  type="date"
                  required
                  value={modalForm.date}
                  onChange={(e) => setModalForm({ ...modalForm, date: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl bg-[#F6F6F8] border border-black/[0.06] text-xs font-medium text-[#141414] focus:outline-hidden focus:ring-2 focus:ring-[#141414]"
                />
              </div>

              {/* Electronic Invoice Key */}
              <div>
                <label className="block text-xs font-semibold text-[#141414] mb-1.5">
                  {lang === "es"
                    ? "Clave Numérica Factura Electrónica (50 dígitos Hacienda, Opcional)"
                    : "Hacienda Electronic Invoice Key (50 digits, Optional)"}
                </label>
                <input
                  type="text"
                  maxLength={50}
                  placeholder="50624000000000010000000100000000011999999999"
                  value={modalForm.electronicInvoiceKey}
                  onChange={(e) => setModalForm({ ...modalForm, electronicInvoiceKey: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl bg-[#F6F6F8] border border-black/[0.06] text-xs font-mono text-[#141414] focus:outline-hidden focus:ring-2 focus:ring-[#141414]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#141414] mb-1.5">
                  {lang === "es" ? "Detalle / Concepto del Gasto" : "Description / Expense Concept"}
                </label>
                <input
                  type="text"
                  placeholder={lang === "es" ? "Ej. Factura repuestos proveedor US, Gasolina vehículo pickup, etc." : "e.g. US supplier invoice, pickup gasoline, etc."}
                  value={modalForm.description}
                  onChange={(e) => setModalForm({ ...modalForm, description: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl bg-[#F6F6F8] border border-black/[0.06] text-xs font-medium text-[#141414] focus:outline-hidden focus:ring-2 focus:ring-[#141414]"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-10 px-4 rounded-full text-xs font-semibold text-[#71717A] hover:bg-neutral-100 transition cursor-pointer"
                >
                  {lang === "es" ? "Cancelar" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting || !modalForm.totalAmount}
                  className="h-10 px-5 rounded-full bg-[#141414] text-white text-xs font-semibold shadow-sm hover:bg-black/85 transition cursor-pointer disabled:opacity-50"
                >
                  {modalSubmitting
                    ? lang === "es"
                      ? "Guardando..."
                      : "Saving..."
                    : lang === "es"
                    ? "Guardar Gasto"
                    : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
