"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  DollarSign,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Clock,
  Server,
  Activity,
  ArrowRight,
  TrendingUp,
  Settings2,
  Info,
  Check,
  Scale,
  Box,
  Truck,
  Calculator,
} from "lucide-react";

interface ProviderDiagnostic {
  name: string;
  url: string;
  status: "ONLINE" | "OFFLINE" | "ERROR";
  sellRate?: number;
  buyRate?: number;
  date?: string;
  latencyMs: number;
  error?: string;
}

export interface ShippingRatesConfig {
  ratePerLbUSD: number;
  ratePerCubicFootUSD: number;
  ratePerLbCRC: number;
  ratePerCubicFootCRC: number;
  updatedAt?: string | null;
}

interface ExchangeRateData {
  rate: number;
  buyRate: number;
  currency: string;
  baseCurrency: string;
  source: string;
  date: string;
  override: boolean;
  cached?: boolean;
  updatedAt: string;
  notes?: string;
  lastSyncAt?: string;
  diagnostics?: ProviderDiagnostic[];
  shippingRates?: ShippingRatesConfig;
}

interface ExchangeRateTabProps {
  userRole?: "MASTER" | "STAFF";
}

export function ExchangeRateTab({ userRole = "MASTER" }: ExchangeRateTabProps) {
  const { t, lang } = useLanguage();
  const [data, setData] = useState<ExchangeRateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Sub-tab state: Exchange Rate USD vs Freight Rates (lb & cu ft)
  const [activeSubTab, setActiveSubTab] = useState<"EXCHANGE_USD" | "SHIPPING_RATES">("EXCHANGE_USD");

  // USD Exchange Rate Form states
  const [mode, setMode] = useState<"AUTO" | "MANUAL">("AUTO");
  const [formRate, setFormRate] = useState<string>("");
  const [formBuyRate, setFormBuyRate] = useState<string>("");
  const [formNotes, setFormNotes] = useState<string>("");

  // Shipping Rates Form states
  const [shippingCurrency, setShippingCurrency] = useState<"USD" | "CRC">("USD");
  const [formLbRate, setFormLbRate] = useState<string>("4.50");
  const [formCuFtRate, setFormCuFtRate] = useState<string>("15.00");
  const [savingShipping, setSavingShipping] = useState<boolean>(false);

  // Simulator state for freight rates
  const [simWeight, setSimWeight] = useState<string>("10");
  const [simVolume, setSimVolume] = useState<string>("2");

  const fetchData = useCallback(async (withDiagnostics = true, forceFresh = false) => {
    try {
      const url = `/api/exchange-rate?fresh=${forceFresh ? "true" : "false"}&diagnostics=${withDiagnostics ? "true" : "false"}`;
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setData(json.data);
        setMode(json.data.override ? "MANUAL" : "AUTO");
        setFormRate(json.data.rate.toString());
        setFormBuyRate(json.data.buyRate.toString());
        setFormNotes(json.data.notes || "");

        if (json.data.shippingRates) {
          setFormLbRate(json.data.shippingRates.ratePerLbUSD.toString());
          setFormCuFtRate(json.data.shippingRates.ratePerCubicFootUSD.toString());
        }
      }
    } catch (err) {
      console.error("Error fetching exchange rate data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true, false);
  }, [fetchData]);

  const handleSyncLive = async () => {
    setSyncing(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/exchange-rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_live" }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setData(json.data);
        setMode("AUTO");
        setFormRate(json.data.rate.toString());
        setFormBuyRate(json.data.buyRate.toString());
        setFeedback({
          type: "success",
          message:
            lang === "es"
              ? `Sincronización en vivo exitosa con el BCCR: ₡${json.data.rate}`
              : `Successfully synced live with BCCR: ₡${json.data.rate}`,
        });
      } else {
        setFeedback({
          type: "error",
          message: json.error || (lang === "es" ? "Error al sincronizar con el BCCR." : "Failed to sync with BCCR."),
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || (lang === "es" ? "Error de red al sincronizar." : "Network error during sync."),
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveManual = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedRate = parseFloat(formRate);
    if (isNaN(parsedRate) || parsedRate < 300 || parsedRate > 1500) {
      setFeedback({
        type: "error",
        message:
          lang === "es"
            ? "El valor de venta debe ser un número válido entre 300 y 1500 colones."
            : "Sell rate must be a valid number between 300 and 1500 colones.",
      });
      return;
    }

    const parsedBuy = formBuyRate ? parseFloat(formBuyRate) : undefined;
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/exchange-rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          override: true,
          rate: parsedRate,
          buyRate: parsedBuy,
          notes: formNotes.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setData(json.data);
        setMode("MANUAL");
        setFeedback({
          type: "success",
          message:
            lang === "es"
              ? `Valor manual del dólar guardado correctamente (₡${json.data.rate}).`
              : `Manual USD rate successfully saved (₡${json.data.rate}).`,
        });
      } else {
        setFeedback({
          type: "error",
          message: json.error || (lang === "es" ? "Error al guardar el valor." : "Failed to save rate."),
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || (lang === "es" ? "Error de red al guardar." : "Network error while saving."),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreAuto = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/exchange-rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_live" }),
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setData(json.data);
        setMode("AUTO");
        setFormRate(json.data.rate.toString());
        setFormBuyRate(json.data.buyRate.toString());
        setFeedback({
          type: "success",
          message:
            lang === "es"
              ? `Modo automático BCCR restablecido exitosamente (₡${json.data.rate}).`
              : `Automatic BCCR mode successfully restored (₡${json.data.rate}).`,
        });
      } else {
        setFeedback({
          type: "error",
          message: json.error || (lang === "es" ? "Error al restablecer modo automático." : "Failed to restore auto mode."),
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || (lang === "es" ? "Error de conexión." : "Connection error."),
      });
    } finally {
      setSaving(false);
    }
  };

  // Toggle shipping rate currency input between USD and CRC
  const handleToggleShippingCurrency = (newCurrency: "USD" | "CRC") => {
    if (newCurrency === shippingCurrency) return;
    const activeRate = data?.rate || 515;
    const currentLb = parseFloat(formLbRate) || 0;
    const currentCuFt = parseFloat(formCuFtRate) || 0;

    if (newCurrency === "CRC") {
      setFormLbRate(Math.round(currentLb * activeRate).toString());
      setFormCuFtRate(Math.round(currentCuFt * activeRate).toString());
    } else {
      setFormLbRate(Number((currentLb / activeRate).toFixed(2)).toString());
      setFormCuFtRate(Number((currentCuFt / activeRate).toFixed(2)).toString());
    }
    setShippingCurrency(newCurrency);
  };

  // Save Freight Rates (Master Only)
  const handleSaveShippingRates = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (userRole !== "MASTER") {
      setFeedback({
        type: "error",
        message: lang === "es" ? "Solo cuentas Master pueden modificar las tarifas de flete." : "Only Master accounts can modify freight rates.",
      });
      return;
    }

    const valLb = parseFloat(formLbRate);
    const valCuFt = parseFloat(formCuFtRate);
    if (isNaN(valLb) || valLb <= 0 || isNaN(valCuFt) || valCuFt <= 0) {
      setFeedback({
        type: "error",
        message: lang === "es" ? "Por favor ingresa valores válidos mayores a cero para libra y pie cúbico." : "Please enter valid values greater than zero for pound and cubic foot.",
      });
      return;
    }

    setSavingShipping(true);
    setFeedback(null);
    try {
      const activeRate = data?.rate || 515;
      const payload =
        shippingCurrency === "USD"
          ? { action: "update_shipping_rates", ratePerLbUSD: valLb, ratePerCubicFootUSD: valCuFt }
          : { action: "update_shipping_rates", ratePerLbCRC: valLb, ratePerCubicFootCRC: valCuFt };

      const res = await fetch("/api/exchange-rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setData(json.data);
        if (json.data.shippingRates) {
          if (shippingCurrency === "USD") {
            setFormLbRate(json.data.shippingRates.ratePerLbUSD.toString());
            setFormCuFtRate(json.data.shippingRates.ratePerCubicFootUSD.toString());
          } else {
            setFormLbRate(json.data.shippingRates.ratePerLbCRC.toString());
            setFormCuFtRate(json.data.shippingRates.ratePerCubicFootCRC.toString());
          }
        }
        setFeedback({
          type: "success",
          message: t.backdoorShippingRatesSaveSuccess,
        });
      } else {
        setFeedback({
          type: "error",
          message: json.error || (lang === "es" ? "Error al guardar tarifas de flete." : "Failed to save freight rates."),
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.message || (lang === "es" ? "Error de conexión." : "Connection error."),
      });
    } finally {
      setSavingShipping(false);
    }
  };

  // Rule 7: Animated Skeleton Screen on the exact same layout
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-md" />
          </div>
          <Skeleton className="h-10 w-44 rounded-xl" />
        </div>

        {/* Sub-tab switcher skeleton */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 max-w-md">
          <Skeleton className="h-9 flex-1 rounded-xl" />
          <Skeleton className="h-9 flex-1 rounded-xl" />
        </div>

        {/* KPI Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-8 w-32 rounded-lg" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>
          ))}
        </div>

        {/* Configuration Card Skeleton */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
          <Skeleton className="h-6 w-48 rounded-md" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const isManual = data?.override === true;

  // Active rate helper for conversions
  const activeRate = data?.rate || 515;

  // Parsed shipping values for simulator
  const activeLbUSD = data?.shippingRates?.ratePerLbUSD ?? 4.5;
  const activeCuFtUSD = data?.shippingRates?.ratePerCubicFootUSD ?? 15.0;
  const simWeightNum = Math.max(0, parseFloat(simWeight) || 0);
  const simVolumeNum = Math.max(0, parseFloat(simVolume) || 0);
  const simWeightCostUSD = Number((simWeightNum * activeLbUSD).toFixed(2));
  const simWeightCostCRC = Math.round(simWeightCostUSD * activeRate);
  const simVolumeCostUSD = Number((simVolumeNum * activeCuFtUSD).toFixed(2));
  const simVolumeCostCRC = Math.round(simVolumeCostUSD * activeRate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-900">
              {activeSubTab === "EXCHANGE_USD" ? (
                <DollarSign className="w-5 h-5" />
              ) : (
                <Truck className="w-5 h-5" />
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {activeSubTab === "EXCHANGE_USD"
                ? t.backdoorExchangeRateTitle
                : t.backdoorShippingRatesTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {activeSubTab === "EXCHANGE_USD"
              ? t.backdoorExchangeRateSubtitle
              : t.backdoorShippingRatesSubtitle}
          </p>
        </div>

        {activeSubTab === "EXCHANGE_USD" && (
          <button
            type="button"
            onClick={handleSyncLive}
            disabled={syncing || saving}
            className="px-4 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? (lang === "es" ? "Sincronizando..." : "Syncing...") : t.backdoorExchangeRateSyncNowBtn}</span>
          </button>
        )}
      </div>

      {/* Sub-tab Switcher: USD Exchange Rate vs Freight Rates */}
      <div className="flex items-center p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200 max-w-lg shadow-inner">
        <button
          type="button"
          onClick={() => setActiveSubTab("EXCHANGE_USD")}
          className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === "EXCHANGE_USD"
              ? "bg-purple-900 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>{t.backdoorExchangeRateSubTabUSD}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("SHIPPING_RATES")}
          className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === "SHIPPING_RATES"
              ? "bg-purple-900 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>{t.backdoorExchangeRateSubTabShipping}</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 shadow-xs ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* TAB 1: EXCHANGE RATE USD (BCCR) */}
      {activeSubTab === "EXCHANGE_USD" && (
        <>
          {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Sell Rate */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>{t.backdoorExchangeRateLiveLabel}</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl font-black text-slate-900">₡{data?.rate?.toFixed(2)}</span>
            <span className="text-xs text-slate-400 font-semibold font-mono">/ USD</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isManual
                  ? "bg-amber-100 text-amber-900 border border-amber-200"
                  : "bg-emerald-100 text-emerald-900 border border-emerald-200"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isManual ? "bg-amber-600" : "bg-emerald-600"}`} />
              {isManual ? t.backdoorExchangeRateStatusOverride : t.backdoorExchangeRateStatusActive}
            </span>
          </div>
        </div>

        {/* KPI 2: Buy Rate */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>{t.backdoorExchangeRateBuyLabel}</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-3xl font-black text-slate-900">₡{data?.buyRate?.toFixed(2)}</span>
            <span className="text-xs text-slate-400 font-semibold font-mono">/ USD</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            {lang === "es" ? "Margen BCCR:" : "BCCR Spread:"}{" "}
            <strong className="text-slate-600 font-mono font-semibold">
              ₡{((data?.rate ?? 0) - (data?.buyRate ?? 0)).toFixed(2)}
            </strong>
          </p>
        </div>

        {/* KPI 3: Operational Mode */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>{lang === "es" ? "Modo Activo" : "Active Mode"}</span>
            <Settings2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-2 mb-1">
            {isManual ? (lang === "es" ? "Valor Manual Fijo" : "Fixed Manual Rate") : (lang === "es" ? "BCCR Oficial" : "Official BCCR")}
          </div>
          <p className="text-[10px] text-slate-500">
            {isManual
              ? lang === "es"
                ? "Prevalece valor establecido por Master"
                : "Master custom override in effect"
              : lang === "es"
              ? "Actualizado diariamente desde BCCR"
              : "Updated daily from official feeds"}
          </p>
        </div>

        {/* KPI 4: Last Sync Date */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>{t.backdoorExchangeRateLastSync}</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-2 mb-1 font-mono">
            {data?.date || "—"}
          </div>
          <p className="text-[10px] text-slate-400 truncate" title={data?.source}>
            {data?.source || "Banco Central de Costa Rica"}
          </p>
        </div>
      </div>

      {/* Main Configuration Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-900" />
            <span>{lang === "es" ? "Control y Modificación del Tipo de Cambio" : "Exchange Rate Control & Override"}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {lang === "es"
              ? "Selecciona si deseas que el tipo de cambio se mantenga sincronizado automáticamente con el Banco Central o fijar un valor manual específico."
              : "Select whether you want the exchange rate automatically synced with Central Bank or set a fixed manual rate."}
          </p>
        </div>

        {/* Mode Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card A: Auto Mode */}
          <div
            onClick={() => setMode("AUTO")}
            className={`p-5 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
              mode === "AUTO"
                ? "border-emerald-600 bg-emerald-50/50 shadow-xs"
                : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                mode === "AUTO" ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"
              }`}
            >
              {mode === "AUTO" && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <span>{t.backdoorExchangeRateAutoMode}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                  {lang === "es" ? "Recomendado" : "Recommended"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {t.backdoorExchangeRateAutoDesc}
              </p>
            </div>
          </div>

          {/* Card B: Manual Mode */}
          <div
            onClick={() => setMode("MANUAL")}
            className={`p-5 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
              mode === "MANUAL"
                ? "border-purple-600 bg-purple-50/50 shadow-xs"
                : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                mode === "MANUAL" ? "border-purple-600 bg-purple-600 text-white" : "border-slate-300"
              }`}
            >
              {mode === "MANUAL" && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">{t.backdoorExchangeRateManualMode}</div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                {t.backdoorExchangeRateManualDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Manual Form (Visible when mode === MANUAL) */}
        {mode === "MANUAL" && (
          <form onSubmit={handleSaveManual} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t.backdoorExchangeRateInputLabel} *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₡</span>
                  <input
                    type="number"
                    step="0.01"
                    min="300"
                    max="1500"
                    value={formRate}
                    onChange={(e) => setFormRate(e.target.value)}
                    required
                    placeholder="457.03"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-2xs"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {lang === "es"
                    ? "Tasa de venta oficial para calcular precios y cotizaciones en USD."
                    : "Selling rate used to calculate USD quotes and cart conversions."}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t.backdoorExchangeRateBuyInputLabel}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₡</span>
                  <input
                    type="number"
                    step="0.01"
                    min="300"
                    max="1500"
                    value={formBuyRate}
                    onChange={(e) => setFormBuyRate(e.target.value)}
                    placeholder="450.00"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-2xs"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {lang === "es"
                    ? "Tasa de compra del dólar (opcional para referencia cambiaria)."
                    : "USD buy rate (optional for exchange reference)."}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.backdoorExchangeRateNotesLabel}
              </label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder={t.backdoorExchangeRateNotesPlaceholder}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-2xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{saving ? (lang === "es" ? "Guardando..." : "Saving...") : t.backdoorExchangeRateSaveManualBtn}</span>
              </button>

              {isManual && (
                <button
                  type="button"
                  onClick={handleRestoreAuto}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.backdoorExchangeRateRestoreAutoBtn}</span>
                </button>
              )}
            </div>
          </form>
        )}

        {/* When in AUTO mode, show confirmation and sync action */}
        {mode === "AUTO" && isManual && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-amber-900 font-semibold">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {lang === "es"
                  ? "Actualmente el sistema está en modo manual. Haz clic en aplicar para volver al modo automático con el BCCR."
                  : "The system is currently in manual override. Click to re-enable automatic sync with BCCR."}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRestoreAuto}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shrink-0 cursor-pointer"
            >
              {lang === "es" ? "Aplicar Sincronización Automática" : "Apply Automatic Sync"}
            </button>
          </div>
        )}
      </div>

      {/* Diagnostics & BCCR Providers */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-900" />
              <span>{t.backdoorExchangeRateDiagnosticsTitle}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {lang === "es"
                ? "Estado y latencia en vivo de los servidores y feeds oficiales del Banco Central de Costa Rica."
                : "Real-time health status and latency of official Central Bank of Costa Rica feeds."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchData(true, true)}
            className="text-xs font-bold text-purple-900 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>{lang === "es" ? "Probar APIs" : "Test APIs"}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Proveedor / Feed</th>
                <th className="py-2.5 px-3">URL del Endpoint</th>
                <th className="py-2.5 px-3">Estado</th>
                <th className="py-2.5 px-3">Tasa Venta</th>
                <th className="py-2.5 px-3">Tasa Compra</th>
                <th className="py-2.5 px-3">Latencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.diagnostics && data.diagnostics.length > 0 ? (
                data.diagnostics.map((diag, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-bold text-slate-900">{diag.name}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500 truncate max-w-xs">{diag.url}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          diag.status === "ONLINE"
                            ? "bg-emerald-100 text-emerald-900"
                            : "bg-rose-100 text-rose-900"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${diag.status === "ONLINE" ? "bg-emerald-600" : "bg-rose-600"}`} />
                        {diag.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {diag.sellRate !== undefined ? `₡${diag.sellRate.toFixed(2)}` : "—"}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {diag.buyRate !== undefined ? `₡${diag.buyRate.toFixed(2)}` : "—"}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">
                      {diag.latencyMs} ms
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-400">
                    {lang === "es" ? "Haz clic en 'Probar APIs' para consultar el diagnóstico en vivo." : "Click 'Test APIs' to run live diagnostics."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* TAB 2: FREIGHT RATES (LB & CUBIC FEET) */}
      {activeSubTab === "SHIPPING_RATES" && (
        <div className="space-y-6">
          {/* Freight KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Rate per Lb */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t.backdoorShippingRateLbLabel}
                </span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-900">
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">
                  ${activeLbUSD.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-slate-400">USD / lb</span>
              </div>
              <div className="mt-2 text-[11px] font-semibold text-purple-800">
                ≈ ₡{Math.round(activeLbUSD * activeRate).toLocaleString("es-CR")} CRC / lb
              </div>
            </div>

            {/* KPI 2: Rate per Cubic Foot */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t.backdoorShippingRateCuFtLabel}
                </span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-900">
                  <Box className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">
                  ${activeCuFtUSD.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-slate-400">USD / ft³</span>
              </div>
              <div className="mt-2 text-[11px] font-semibold text-purple-800">
                ≈ ₡{Math.round(activeCuFtUSD * activeRate).toLocaleString("es-CR")} CRC / ft³
              </div>
            </div>

            {/* KPI 3: Active Exchange Rate applied */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {lang === "es" ? "Tipo de Cambio de Flete" : "Freight Conversion Rate"}
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">
                  ₡{activeRate.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-slate-400">CRC</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 truncate">
                {lang === "es" ? "Calculado en tiempo real" : "Real-time conversion"}
              </div>
            </div>

            {/* KPI 4: Last Updated */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {t.backdoorExchangeRateLastSync}
                </span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 text-base font-bold text-slate-900 truncate">
                {data?.shippingRates?.updatedAt
                  ? new Date(data.shippingRates.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : lang === "es"
                  ? "Tarifa Base"
                  : "Base Rate"}
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                {data?.shippingRates?.updatedAt
                  ? new Date(data.shippingRates.updatedAt).toLocaleDateString()
                  : lang === "es"
                  ? "Inicializado"
                  : "Initialized"}
              </div>
            </div>
          </div>

          {/* Master Form Card: Configure Rates */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-purple-900" />
                  <span>
                    {lang === "es"
                      ? "Ajuste de Tarifas Base de Flete (Master)"
                      : "Base Freight Rates Settings (Master)"}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === "es"
                    ? "Elige la moneda en la que prefieres ingresar las tarifas. El sistema las convertirá automáticamente."
                    : "Choose the currency to enter the rates. The system will convert them automatically."}
                </p>
              </div>

              {/* Currency Toggle Switcher (USD vs CRC) */}
              <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 shadow-inner">
                <button
                  type="button"
                  onClick={() => handleToggleShippingCurrency("USD")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    shippingCurrency === "USD"
                      ? "bg-purple-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t.backdoorShippingRatesCurrencyToggleUSD}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleShippingCurrency("CRC")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    shippingCurrency === "CRC"
                      ? "bg-purple-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t.backdoorShippingRatesCurrencyToggleCRC}
                </button>
              </div>
            </div>

            {/* Inputs Form */}
            <form onSubmit={handleSaveShippingRates} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Field 1: Rate per Lb */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-purple-900" />
                      <span>{t.backdoorShippingRateLbLabel}</span>
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900">
                      {shippingCurrency} / lb
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{t.backdoorShippingRateLbDesc}</p>
                  <div className="relative pt-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      {shippingCurrency === "USD" ? "$" : "₡"}
                    </span>
                    <input
                      type="number"
                      step={shippingCurrency === "USD" ? "0.01" : "1"}
                      min="0.01"
                      value={formLbRate}
                      onChange={(e) => setFormLbRate(e.target.value)}
                      required
                      disabled={userRole !== "MASTER" || savingShipping}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-2xs disabled:bg-slate-100"
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {shippingCurrency === "USD" ? (
                      <span>
                        ≈ ₡{Math.round((parseFloat(formLbRate) || 0) * activeRate).toLocaleString("es-CR")} CRC
                      </span>
                    ) : (
                      <span>
                        ≈ ${((parseFloat(formLbRate) || 0) / activeRate).toFixed(2)} USD
                      </span>
                    )}
                  </div>
                </div>

                {/* Field 2: Rate per Cubic Foot */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-purple-900" />
                      <span>{t.backdoorShippingRateCuFtLabel}</span>
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900">
                      {shippingCurrency} / ft³
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{t.backdoorShippingRateCuFtDesc}</p>
                  <div className="relative pt-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      {shippingCurrency === "USD" ? "$" : "₡"}
                    </span>
                    <input
                      type="number"
                      step={shippingCurrency === "USD" ? "0.01" : "1"}
                      min="0.01"
                      value={formCuFtRate}
                      onChange={(e) => setFormCuFtRate(e.target.value)}
                      required
                      disabled={userRole !== "MASTER" || savingShipping}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600 shadow-2xs disabled:bg-slate-100"
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {shippingCurrency === "USD" ? (
                      <span>
                        ≈ ₡{Math.round((parseFloat(formCuFtRate) || 0) * activeRate).toLocaleString("es-CR")} CRC
                      </span>
                    ) : (
                      <span>
                        ≈ ${((parseFloat(formCuFtRate) || 0) / activeRate).toFixed(2)} USD
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <div>
                  {userRole !== "MASTER" && (
                    <span className="text-xs font-semibold text-rose-600">
                      {lang === "es"
                        ? "Solo cuentas con rol MASTER pueden editar las tarifas de flete."
                        : "Only MASTER accounts can modify freight rates."}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={userRole !== "MASTER" || savingShipping}
                  className="px-5 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {savingShipping
                      ? lang === "es"
                        ? "Guardando tarifas..."
                        : "Saving rates..."
                      : t.backdoorShippingRatesSaveBtn}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Interactive Live Simulator */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-100 text-purple-900">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {lang === "es" ? "Simulador en Vivo de Costos de Flete (S_price)" : "Live Freight Cost Simulator (S_price)"}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === "es"
                    ? "Comprueba cómo calculará el sistema el costo de envío para cualquier peso o volumen."
                    : "Check how the system will compute the shipping price for any weight or volume."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Weight Sim Card */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-purple-900" />
                    <span>{lang === "es" ? "Prueba por Peso (Libras)" : "Weight Test (Pounds)"}</span>
                  </span>
                  <span className="text-[10px] font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-full">
                    ${activeLbUSD.toFixed(2)} / lb
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={simWeight}
                    onChange={(e) => setSimWeight(e.target.value)}
                    placeholder="10"
                    className="w-28 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold bg-white"
                  />
                  <span className="text-xs font-bold text-slate-600">lb</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 mx-1" />
                  <div className="font-mono text-xs font-bold text-slate-900">
                    ${simWeightCostUSD.toFixed(2)} USD
                    <span className="block text-[11px] text-purple-800 font-semibold">
                      ₡{simWeightCostCRC.toLocaleString("es-CR")} CRC
                    </span>
                  </div>
                </div>
              </div>

              {/* Volume Sim Card */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-purple-900" />
                    <span>{lang === "es" ? "Prueba por Volumen (Pies Cúbicos)" : "Volume Test (Cubic Feet)"}</span>
                  </span>
                  <span className="text-[10px] font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-full">
                    ${activeCuFtUSD.toFixed(2)} / ft³
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={simVolume}
                    onChange={(e) => setSimVolume(e.target.value)}
                    placeholder="2"
                    className="w-28 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold bg-white"
                  />
                  <span className="text-xs font-bold text-slate-600">ft³</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 mx-1" />
                  <div className="font-mono text-xs font-bold text-slate-900">
                    ${simVolumeCostUSD.toFixed(2)} USD
                    <span className="block text-[11px] text-purple-800 font-semibold">
                      ₡{simVolumeCostCRC.toLocaleString("es-CR")} CRC
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
