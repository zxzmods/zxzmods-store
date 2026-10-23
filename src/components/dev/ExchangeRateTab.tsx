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

  // Form states
  const [mode, setMode] = useState<"AUTO" | "MANUAL">("AUTO");
  const [formRate, setFormRate] = useState<string>("");
  const [formBuyRate, setFormBuyRate] = useState<string>("");
  const [formNotes, setFormNotes] = useState<string>("");

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 text-purple-900">
              <DollarSign className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{t.backdoorExchangeRateTitle}</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">{t.backdoorExchangeRateSubtitle}</p>
        </div>

        <button
          type="button"
          onClick={handleSyncLive}
          disabled={syncing || saving}
          className="px-4 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
          <span>{syncing ? (lang === "es" ? "Sincronizando..." : "Syncing...") : t.backdoorExchangeRateSyncNowBtn}</span>
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
            className="text-slate-400 hover:text-slate-700 text-sm font-bold"
          >
            ×
          </button>
        </div>
      )}

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
    </div>
  );
}
