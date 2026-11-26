"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { formatCRC } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Tag,
  ArrowDownCircle,
  XCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  History,
  Loader2,
} from "lucide-react";

export interface PriceDecreaseAlertItem {
  id: string;
  productId: string;
  productSku: string;
  productNameEs: string;
  productNameEn: string;
  productImageUrl: string;
  brandName?: string | null;
  supplierUrl?: string | null;
  status: string;
  oldSupplierPriceUSD: number;
  newSupplierPriceUSD: number;
  dealerDiscountPercent: number;
  oldPPriceD: number;
  newPPriceD: number;
  oldPPriceCRC: number;
  newPPriceCRC: number;
  oldTPriceCRC: number;
  proposedTPriceCRC: number;
  proposedIvaCRC: number;
  computedDiscountPercent: number;
  exchangeRateUsed: number;
  resolutionType?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  detectedAt: string;
}

interface AutoIncreaseItem {
  id: string;
  productId: string;
  createdAt: string;
  actorEmail: string;
  sku: string;
  nameEs: string;
  oldPPriceD: number;
  newPPriceD: number;
  oldTPriceCRC: number;
  newTPriceCRC: number;
}

interface LastRunSummary {
  createdAt: string;
  runDateCR?: string;
  triggeredBy?: string;
  totalChecked?: number;
  autoIncreasedCount?: number;
  decreaseQueuedCount?: number;
  unchangedCount?: number;
  failedCount?: number;
}

export function PriceDecreasesSection({
  onPendingCountChange,
  onCatalogMutated,
}: {
  onPendingCountChange?: (count: number) => void;
  onCatalogMutated?: () => Promise<void> | void;
}) {
  const { lang, t } = useLanguage();
  const isEs = lang === "es";

  const [loading, setLoading] = useState(true);
  const [runningCheck, setRunningCheck] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [subView, setSubView] = useState<"pending" | "history" | "increases">("pending");
  const [pending, setPending] = useState<PriceDecreaseAlertItem[]>([]);
  const [resolved, setResolved] = useState<PriceDecreaseAlertItem[]>([]);
  const [autoIncreases, setAutoIncreases] = useState<AutoIncreaseItem[]>([]);
  const [lastRun, setLastRun] = useState<LastRunSummary | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/sys/catalog/price-decreases", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success) {
        const nextPending = Array.isArray(data.pending) ? data.pending : [];
        setPending(nextPending);
        setResolved(Array.isArray(data.resolved) ? data.resolved : []);
        setAutoIncreases(Array.isArray(data.autoIncreases) ? data.autoIncreases : []);
        setLastRun(data.lastRun || null);
        if (onPendingCountChange) onPendingCountChange(nextPending.length);
      }
    } catch (err) {
      console.error("Failed to fetch price decreases:", err);
    } finally {
      setLoading(false);
    }
  }, [onPendingCountChange]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleRunCheckNow = async () => {
    if (runningCheck) return;
    setRunningCheck(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/sys/catalog/price-decreases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RUN_CHECK" }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.summary) {
        const s = data.summary;
        if (s.skippedAlreadyRunning) {
          setFeedback({
            type: "error",
            msg: isEs
              ? "Ya hay una verificación de precios en curso. Intenta nuevamente en unos segundos."
              : "A price check is already running. Please try again in a moment.",
          });
        } else {
          setFeedback({
            type: "success",
            msg: isEs
              ? `Revisión completada: ${s.totalChecked} productos revisados · ${s.autoIncreasedCount} aumentos aplicados automáticamente · ${s.decreaseQueuedCount} bajas en cola de aprobación.`
              : `Check completed: ${s.totalChecked} products checked · ${s.autoIncreasedCount} increases auto-applied · ${s.decreaseQueuedCount} decreases queued for approval.`,
          });
          await fetchAlerts();
          if (s.autoIncreasedCount > 0 && onCatalogMutated) {
            await onCatalogMutated();
          }
        }
      } else {
        setFeedback({
          type: "error",
          msg: data.error || (isEs ? "Error al verificar los precios del catálogo." : "Failed to check catalog prices."),
        });
      }
    } catch (err) {
      console.error("Run price check error:", err);
      setFeedback({
        type: "error",
        msg: isEs ? "Error de conexión al verificar precios." : "Connection error while checking prices.",
      });
    } finally {
      setRunningCheck(false);
    }
  };

  const handleResolveAlert = async (
    alert: PriceDecreaseAlertItem,
    action: "DISCOUNT" | "PRICE_DECREASE" | "DISMISSED"
  ) => {
    if (processingId) return;
    setProcessingId(alert.id);
    setFeedback(null);

    try {
      const res = await fetch("/api/sys/catalog/price-decreases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId: alert.id, action }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          msg:
            action === "DISCOUNT"
              ? isEs
                ? `Descuento (-${alert.computedDiscountPercent}% OFF) aplicado a ${alert.productNameEs}. P_price_D y T_price actualizados.`
                : `Discount (-${alert.computedDiscountPercent}% OFF) applied to ${alert.productNameEn || alert.productNameEs}. P_price_D & T_price updated.`
              : action === "PRICE_DECREASE"
              ? isEs
                ? `Baja de precio aplicada a ${alert.productNameEs} (${formatCRC(alert.proposedTPriceCRC)}) sin etiqueta de descuento.`
                : `Regular price decrease applied to ${alert.productNameEn || alert.productNameEs} (${formatCRC(alert.proposedTPriceCRC)}) without discount badge.`
              : isEs
              ? `Baja de precio descartada para ${alert.productNameEs}. El precio actual se mantiene sin cambios.`
              : `Price decrease dismissed for ${alert.productNameEn || alert.productNameEs}. Current price kept unchanged.`,
        });
        await fetchAlerts();
        if (action !== "DISMISSED" && onCatalogMutated) {
          await onCatalogMutated();
        }
      } else {
        setFeedback({
          type: "error",
          msg: data.error || (isEs ? "No se pudo procesar la aprobación." : "Failed to process approval."),
        });
      }
    } catch (err) {
      console.error("Resolve alert error:", err);
      setFeedback({
        type: "error",
        msg: isEs ? "Error de conexión al aprobar la baja de precio." : "Connection error while resolving alert.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString(isEs ? "es-CR" : "en-US", {
        timeZone: "America/Costa_Rica",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "APPROVED_DISCOUNT") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-[#C02030] border border-rose-200">
          <Tag className="w-3 h-3" />
          <span>{t.priceDropsStatusDiscount}</span>
        </span>
      );
    }
    if (status === "APPROVED_PRICE_DECREASE") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ArrowDownCircle className="w-3 h-3" />
          <span>{t.priceDropsStatusRegular}</span>
        </span>
      );
    }
    if (status === "SUPERSEDED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <TrendingUp className="w-3 h-3" />
          <span>{t.priceDropsStatusSuperseded}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
        <XCircle className="w-3 h-3" />
        <span>{t.priceDropsStatusDismissed}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-64 rounded-lg bg-slate-200" />
              <Skeleton className="h-3.5 w-full max-w-xl rounded bg-slate-100" />
            </div>
            <Skeleton className="h-10 w-44 rounded-xl bg-slate-200 shrink-0" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-xl bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-56 rounded bg-slate-200" />
                <Skeleton className="h-3 w-80 rounded bg-slate-100" />
              </div>
              <Skeleton className="h-9 w-36 rounded-xl bg-slate-200 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                <TrendingDown className="w-4 h-4" />
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                {t.priceDropsTitle}
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white font-mono">
                <Clock className="w-3 h-3" />
                <span>{t.priceDropsScheduleBadge}</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              {t.priceDropsSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRunCheckNow}
            disabled={runningCheck}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold shadow-xs transition shrink-0 cursor-pointer"
          >
            {runningCheck ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{runningCheck ? t.priceDropsRunningBtn : t.priceDropsRunNowBtn}</span>
          </button>
        </div>

        {/* Last Run Status & Sub-View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            {lastRun ? (
              <span>
                <strong className="text-slate-700">{t.priceDropsLastRunLabel}:</strong>{" "}
                {formatDate(lastRun.createdAt)} ·{" "}
                <span className="font-mono">
                  {lastRun.totalChecked ?? 0} {isEs ? "revisados" : "checked"} ·{" "}
                  {lastRun.autoIncreasedCount ?? 0} {isEs ? "aumentos" : "increases"} ·{" "}
                  {lastRun.decreaseQueuedCount ?? 0} {isEs ? "bajas" : "decreases"}
                </span>
              </span>
            ) : (
              <span>{t.priceDropsNeverRunLabel}</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setSubView("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                subView === "pending"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>{t.priceDropsPendingSubtab}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  subView === "pending"
                    ? "bg-white/25 text-white"
                    : pending.length > 0
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {pending.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSubView("increases")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                subView === "increases"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{t.priceDropsAutoIncreasesSubtab} ({autoIncreases.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSubView("history")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                subView === "history"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{t.priceDropsHistorySubtab} ({resolved.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 ${
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
            <span>{feedback.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold px-2 py-0.5 rounded hover:bg-black/5 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* VIEW 1: Pending Price Decreases Queue */}
      {subView === "pending" && (
        pending.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900">{t.priceDropsEmptyPendingTitle}</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {t.priceDropsEmptyPendingDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((alert) => {
              const isBusy = processingId === alert.id;
              const savingsCRC = Math.max(0, alert.oldTPriceCRC - alert.proposedTPriceCRC);
              const prodTitle = isEs ? alert.productNameEs : (alert.productNameEn || alert.productNameEs);

              return (
                <div
                  key={alert.id}
                  className="bg-white rounded-2xl border border-emerald-200/90 p-4 shadow-2xs space-y-3.5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Product Info */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <img
                        src={alert.productImageUrl || "/images/logo.png"}
                        alt={prodTitle}
                        className="w-16 h-16 rounded-xl object-contain bg-slate-50 border border-slate-200 p-1 shrink-0"
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {alert.productSku}
                          </span>
                          {alert.brandName && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                              {alert.brandName}
                            </span>
                          )}
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-[#C02030] border border-rose-200 font-mono">
                            -{alert.computedDiscountPercent}% OFF ({isEs ? "sobre T_price" : "on T_price"})
                          </span>
                          {alert.supplierUrl && (
                            <a
                              href={alert.supplierUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline"
                            >
                              <span>{isEs ? "Ver proveedor" : "View dealer"}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                          {prodTitle}
                        </h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                          <span>{t.priceDropsShippingProfitLockedNote}</span>
                          <span>•</span>
                          <span>
                            {isEs ? "Detectado:" : "Detected:"} {formatDate(alert.detectedAt)}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Price Comparison Grid */}
                    <div className="grid grid-cols-3 gap-2 shrink-0">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                        <span className="text-[9px] font-bold uppercase text-slate-500 block">
                          {t.priceDropsDealerPriceLabel}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 line-through block">
                          ${alert.oldSupplierPriceUSD.toFixed(2)}
                        </span>
                        <span className="text-xs font-mono font-black text-slate-900">
                          ${alert.newSupplierPriceUSD.toFixed(2)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-center">
                        <span className="text-[9px] font-bold uppercase text-blue-700 block">
                          {t.priceDropsPPriceLabel}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 line-through block">
                          ${alert.oldPPriceD.toFixed(2)}
                        </span>
                        <span className="text-xs font-mono font-black text-blue-900">
                          ${alert.newPPriceD.toFixed(2)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                        <span className="text-[9px] font-bold uppercase text-emerald-700 block">
                          {t.priceDropsTPriceLabel}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 line-through block">
                          {formatCRC(alert.oldTPriceCRC)}
                        </span>
                        <span className="text-xs font-mono font-black text-emerald-800">
                          {formatCRC(alert.proposedTPriceCRC)}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-emerald-700 block">
                          -{formatCRC(savingsCRC)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Staff Approval Action Bar */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleResolveAlert(alert, "DISMISSED")}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{t.priceDropsDismissBtn}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleResolveAlert(alert, "PRICE_DECREASE")}
                      className="px-4 py-2 rounded-xl border border-slate-900 bg-white hover:bg-slate-900 hover:text-white text-slate-900 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                    >
                      {isBusy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ArrowDownCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{t.priceDropsApproveRegularBtn}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleResolveAlert(alert, "DISCOUNT")}
                      className="px-4 py-2 rounded-xl bg-[#C02030] hover:bg-[#a31826] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {isBusy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Tag className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {t.priceDropsApproveDiscountBtn} (-{alert.computedDiscountPercent}%)
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* VIEW 2: Recent Automatic Price Increases */}
      {subView === "increases" && (
        autoIncreases.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            {isEs
              ? "Aún no se han registrado aumentos automáticos de precio por proveedor."
              : "No automatic supplier price increases recorded yet."}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="divide-y divide-slate-100">
              {autoIncreases.map((inc) => (
                <div
                  key={inc.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        {inc.sku}
                      </span>
                      <span className="font-bold text-slate-900 truncate">{inc.nameEs}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {formatDate(inc.createdAt)} · {inc.actorEmail}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 font-mono shrink-0">
                    <div className="text-right">
                      <span className="text-[9px] uppercase text-slate-400 block">P_price_D</span>
                      <span className="text-amber-700 font-bold">
                        ${inc.oldPPriceD.toFixed(2)} → ${inc.newPPriceD.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase text-slate-400 block">T_price</span>
                      <span className="text-slate-900 font-black">
                        {formatCRC(inc.oldTPriceCRC)} → {formatCRC(inc.newTPriceCRC)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* VIEW 3: Resolved Decreases History */}
      {subView === "history" && (
        resolved.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            {isEs
              ? "Aún no hay historial de bajas de precio resueltas."
              : "No resolved price decreases in history yet."}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="divide-y divide-slate-100">
              {resolved.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.productSku}
                      </span>
                      <span className="font-bold text-slate-900 truncate">
                        {isEs ? item.productNameEs : (item.productNameEn || item.productNameEs)}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      {formatDate(item.resolvedAt || item.detectedAt)}
                      {item.resolvedBy ? ` · ${item.resolvedBy}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 font-mono shrink-0">
                    <div className="text-right">
                      <span className="text-[9px] uppercase text-slate-400 block">P_price_D</span>
                      <span className="text-slate-700 font-bold">
                        ${item.oldPPriceD.toFixed(2)} → ${item.newPPriceD.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase text-slate-400 block">T_price</span>
                      <span className="text-emerald-700 font-black">
                        {formatCRC(item.oldTPriceCRC)} → {formatCRC(item.proposedTPriceCRC)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
