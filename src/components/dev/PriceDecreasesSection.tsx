"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { formatCRC } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Tag,
  ArrowDownCircle,
  ArrowUpCircle,
  XCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  History,
  Loader2,
  CheckSquare,
  Square,
  ArrowUpDown,
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
  changeDirection?: "INCREASE" | "DECREASE" | string;
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

interface LastRunSummary {
  createdAt: string;
  runDateCR?: string;
  triggeredBy?: string;
  totalChecked?: number;
  autoIncreasedCount?: number;
  increaseQueuedCount?: number;
  decreaseQueuedCount?: number;
  unchangedCount?: number;
  failedCount?: number;
}

type BatchAction =
  | "DISCOUNT"
  | "PRICE_DECREASE"
  | "PRICE_INCREASE"
  | "APPROVE_AS_DISCOUNT"
  | "APPROVE_REGULAR"
  | "DISMISSED";

function isAlertIncrease(alert: PriceDecreaseAlertItem): boolean {
  return (
    alert.changeDirection === "INCREASE" ||
    alert.proposedTPriceCRC > alert.oldTPriceCRC ||
    alert.newPPriceD > alert.oldPPriceD
  );
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
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [subView, setSubView] = useState<"pending" | "history">("pending");
  const [directionFilter, setDirectionFilter] = useState<"ALL" | "DECREASE" | "INCREASE">("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<PriceDecreaseAlertItem[]>([]);
  const [resolved, setResolved] = useState<PriceDecreaseAlertItem[]>([]);
  const [lastRun, setLastRun] = useState<LastRunSummary | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/sys/catalog/price-decreases", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.success) {
        const nextPending: PriceDecreaseAlertItem[] = Array.isArray(data.pending) ? data.pending : [];
        setPending(nextPending);
        setResolved(Array.isArray(data.resolved) ? data.resolved : []);
        setLastRun(data.lastRun || null);
        // Clean up any selected IDs that are no longer pending
        const validSet = new Set(nextPending.map((p) => p.id));
        setSelectedIds((prev) => {
          const next = new Set<string>();
          prev.forEach((id) => {
            if (validSet.has(id)) next.add(id);
          });
          return next;
        });
        if (onPendingCountChange) onPendingCountChange(nextPending.length);
      }
    } catch (err) {
      console.error("Failed to fetch price changes:", err);
    } finally {
      setLoading(false);
    }
  }, [onPendingCountChange]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const decreasesCount = useMemo(
    () => pending.filter((a) => !isAlertIncrease(a)).length,
    [pending]
  );
  const increasesCount = useMemo(
    () => pending.filter((a) => isAlertIncrease(a)).length,
    [pending]
  );

  const visiblePending = useMemo(() => {
    if (directionFilter === "INCREASE") return pending.filter((a) => isAlertIncrease(a));
    if (directionFilter === "DECREASE") return pending.filter((a) => !isAlertIncrease(a));
    return pending;
  }, [pending, directionFilter]);

  const selectedAlerts = useMemo(
    () => pending.filter((a) => selectedIds.has(a.id)),
    [pending, selectedIds]
  );
  const selectedIncreasesCount = useMemo(
    () => selectedAlerts.filter((a) => isAlertIncrease(a)).length,
    [selectedAlerts]
  );
  const selectedDecreasesCount = useMemo(
    () => selectedAlerts.filter((a) => !isAlertIncrease(a)).length,
    [selectedAlerts]
  );

  const allVisibleSelected =
    visiblePending.length > 0 && visiblePending.every((a) => selectedIds.has(a.id));

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visiblePending.forEach((a) => next.delete(a.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visiblePending.forEach((a) => next.add(a.id));
        return next;
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

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
          const incCount = s.increaseQueuedCount ?? 0;
          const decCount = s.decreaseQueuedCount ?? 0;
          setFeedback({
            type: "success",
            msg: isEs
              ? `Revisión completada: ${s.totalChecked} productos revisados · ${incCount} alzas pendientes · ${decCount} bajas pendientes de aprobación.`
              : `Check completed: ${s.totalChecked} products checked · ${incCount} increases pending · ${decCount} decreases pending approval.`,
          });
          await fetchAlerts();
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
    action: "DISCOUNT" | "PRICE_DECREASE" | "PRICE_INCREASE" | "DISMISSED"
  ) => {
    if (processingId || batchProcessing) return;
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
        const title = isEs ? alert.productNameEs : (alert.productNameEn || alert.productNameEs);
        let msg = "";
        if (action === "PRICE_INCREASE") {
          msg = isEs
            ? `Alza de precio aprobada para ${title} (${formatCRC(alert.proposedTPriceCRC)}). P_price_D y T_price actualizados.`
            : `Price increase approved for ${title} (${formatCRC(alert.proposedTPriceCRC)}). P_price_D & T_price updated.`;
        } else if (action === "DISCOUNT") {
          msg = isEs
            ? `Descuento (-${alert.computedDiscountPercent}% OFF) aplicado a ${title}. P_price_D y T_price actualizados.`
            : `Discount (-${alert.computedDiscountPercent}% OFF) applied to ${title}. P_price_D & T_price updated.`;
        } else if (action === "PRICE_DECREASE") {
          msg = isEs
            ? `Baja de precio aplicada a ${title} (${formatCRC(alert.proposedTPriceCRC)}) sin etiqueta de descuento.`
            : `Regular price decrease applied to ${title} (${formatCRC(alert.proposedTPriceCRC)}) without discount badge.`;
        } else {
          msg = isEs
            ? `Cambio de precio rechazado para ${title}. El precio actual se mantiene sin cambios.`
            : `Price change declined for ${title}. Current price kept unchanged.`;
        }
        setFeedback({ type: "success", msg });
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(alert.id);
          return next;
        });
        await fetchAlerts();
        if (action !== "DISMISSED" && onCatalogMutated) {
          await onCatalogMutated();
        }
      } else {
        setFeedback({
          type: "error",
          msg: data.error || (isEs ? "No se pudo procesar la solicitud." : "Failed to process request."),
        });
      }
    } catch (err) {
      console.error("Resolve alert error:", err);
      setFeedback({
        type: "error",
        msg: isEs ? "Error de conexión al resolver el cambio de precio." : "Connection error while resolving price change.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleResolveBatch = async (action: BatchAction) => {
    if (batchProcessing || processingId || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    setBatchProcessing(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/sys/catalog/price-decreases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertIds: ids, action }),
      });
      const data = await res.json();

      if (res.ok && data.success && data.batch) {
        const b = data.batch;
        const msg =
          action === "DISMISSED"
            ? isEs
              ? `${b.dismissedCount} cambio(s) de precio rechazados correctamente. Los precios actuales se mantuvieron sin cambios.`
              : `${b.dismissedCount} price change(s) declined. Current prices remain unchanged.`
            : isEs
            ? `Lote aprobado: ${b.processedCount} producto(s) actualizados (${b.approvedDecreases} baja(s), ${b.approvedIncreases} alza(s))${b.failedCount > 0 ? ` · ${b.failedCount} con error` : ""}.`
            : `Batch approved: ${b.processedCount} product(s) updated (${b.approvedDecreases} decrease(s), ${b.approvedIncreases} increase(s))${b.failedCount > 0 ? ` · ${b.failedCount} failed` : ""}.`;
        setFeedback({ type: "success", msg });
        setSelectedIds(new Set());
        await fetchAlerts();
        if (action !== "DISMISSED" && b.processedCount > 0 && onCatalogMutated) {
          await onCatalogMutated();
        }
      } else {
        setFeedback({
          type: "error",
          msg: data.error || (isEs ? "No se pudo procesar el lote seleccionado." : "Failed to process selected batch."),
        });
      }
    } catch (err) {
      console.error("Batch resolve error:", err);
      setFeedback({
        type: "error",
        msg: isEs ? "Error de conexión al procesar los productos seleccionados." : "Connection error while processing selected items.",
      });
    } finally {
      setBatchProcessing(false);
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
    if (status === "APPROVED_PRICE_INCREASE") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <ArrowUpCircle className="w-3 h-3" />
          <span>{t.priceDropsStatusIncrease}</span>
        </span>
      );
    }
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
          <RefreshCw className="w-3 h-3" />
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
              <Skeleton className="h-5 w-72 rounded-lg bg-slate-200" />
              <Skeleton className="h-3.5 w-full max-w-2xl rounded bg-slate-100" />
            </div>
            <Skeleton className="h-10 w-44 rounded-xl bg-slate-200 shrink-0" />
          </div>
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <Skeleton className="h-8 w-36 rounded-lg bg-slate-100" />
            <Skeleton className="h-8 w-32 rounded-lg bg-slate-100" />
            <Skeleton className="h-8 w-32 rounded-lg bg-slate-100" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
              <Skeleton className="w-5 h-5 rounded bg-slate-200 shrink-0" />
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
              <span className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-2xs shrink-0">
                <ArrowUpDown className="w-4 h-4" />
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
                  {(lastRun.increaseQueuedCount ?? lastRun.autoIncreasedCount ?? 0)}{" "}
                  {isEs ? "alzas" : "increases"} ·{" "}
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
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>{t.priceDropsPendingSubtab}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  subView === "pending"
                    ? "bg-white/25 text-white"
                    : pending.length > 0
                    ? "bg-rose-100 text-[#C02030]"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {pending.length}
              </span>
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

      {/* VIEW 1: Pending Price Changes (Increases & Decreases) with Multi-Select */}
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
            {/* Direction Filter + Multi-Select Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setDirectionFilter("ALL")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      directionFilter === "ALL"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {t.priceDropsFilterAll} ({pending.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirectionFilter("DECREASE")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
                      directionFilter === "DECREASE"
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>{t.priceDropsFilterDecreases} ({decreasesCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirectionFilter("INCREASE")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
                      directionFilter === "INCREASE"
                        ? "bg-amber-600 text-white"
                        : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{t.priceDropsFilterIncreases} ({increasesCount})</span>
                  </button>
                </div>

                {/* Select All / Clear Selection */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={visiblePending.length === 0 || batchProcessing}
                    onClick={handleToggleSelectAllVisible}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    {allVisibleSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-[#C02030]" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>
                      {allVisibleSelected ? t.priceDropsDeselectAll : t.priceDropsSelectAll} ({visiblePending.length})
                    </span>
                  </button>
                  {selectedIds.size > 0 && (
                    <button
                      type="button"
                      disabled={batchProcessing}
                      onClick={handleClearSelection}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                    >
                      {t.priceDropsDeselectAll}
                    </button>
                  )}
                </div>
              </div>

              {/* Active Multi-Select Batch Action Bar */}
              {selectedIds.size > 0 && (
                <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-slate-50/80 -mx-3.5 -mb-3.5 px-3.5 py-3 rounded-b-2xl">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white font-mono font-bold text-[11px]">
                      {selectedIds.size} {t.priceDropsSelectedCount}
                    </span>
                    <span className="text-[11px] text-slate-600 font-medium">
                      {selectedDecreasesCount > 0 && (
                        <span className="text-emerald-700 font-bold">
                          {selectedDecreasesCount} {isEs ? "baja(s)" : "decrease(s)"}
                        </span>
                      )}
                      {selectedDecreasesCount > 0 && selectedIncreasesCount > 0 && " · "}
                      {selectedIncreasesCount > 0 && (
                        <span className="text-amber-700 font-bold">
                          {selectedIncreasesCount} {isEs ? "alza(s)" : "increase(s)"}
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      disabled={batchProcessing}
                      onClick={() => handleResolveBatch("DISMISSED")}
                      className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                    >
                      {batchProcessing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      <span>{t.priceDropsBatchDeclineBtn} ({selectedIds.size})</span>
                    </button>

                    {/* Only Increases Selected */}
                    {selectedIncreasesCount > 0 && selectedDecreasesCount === 0 && (
                      <button
                        type="button"
                        disabled={batchProcessing}
                        onClick={() => handleResolveBatch("PRICE_INCREASE")}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
                      >
                        {batchProcessing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <ArrowUpCircle className="w-3.5 h-3.5" />
                        )}
                        <span>{t.priceDropsBatchApproveIncreaseBtn} ({selectedIncreasesCount})</span>
                      </button>
                    )}

                    {/* Only Decreases Selected */}
                    {selectedDecreasesCount > 0 && selectedIncreasesCount === 0 && (
                      <>
                        <button
                          type="button"
                          disabled={batchProcessing}
                          onClick={() => handleResolveBatch("PRICE_DECREASE")}
                          className="px-3.5 py-2 rounded-xl border border-slate-900 bg-white hover:bg-slate-900 hover:text-white text-slate-900 text-xs font-bold inline-flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                        >
                          {batchProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ArrowDownCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{t.priceDropsBatchApproveRegularBtn} ({selectedDecreasesCount})</span>
                        </button>
                        <button
                          type="button"
                          disabled={batchProcessing}
                          onClick={() => handleResolveBatch("DISCOUNT")}
                          className="px-4 py-2 rounded-xl bg-[#C02030] hover:bg-[#a31826] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
                        >
                          {batchProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Tag className="w-3.5 h-3.5" />
                          )}
                          <span>{t.priceDropsBatchApproveDiscountBtn} ({selectedDecreasesCount})</span>
                        </button>
                      </>
                    )}

                    {/* Mixed Increases + Decreases Selected */}
                    {selectedDecreasesCount > 0 && selectedIncreasesCount > 0 && (
                      <>
                        <button
                          type="button"
                          disabled={batchProcessing}
                          onClick={() => handleResolveBatch("APPROVE_REGULAR")}
                          className="px-3.5 py-2 rounded-xl border border-slate-900 bg-white hover:bg-slate-900 hover:text-white text-slate-900 text-xs font-bold inline-flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                        >
                          {batchProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>{t.priceDropsBatchApproveMixedRegularBtn}</span>
                        </button>
                        <button
                          type="button"
                          disabled={batchProcessing}
                          onClick={() => handleResolveBatch("APPROVE_AS_DISCOUNT")}
                          className="px-4 py-2 rounded-xl bg-[#C02030] hover:bg-[#a31826] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
                        >
                          {batchProcessing ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Tag className="w-3.5 h-3.5" />
                          )}
                          <span>{t.priceDropsBatchApproveMixedDiscountBtn}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {visiblePending.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                {directionFilter === "INCREASE"
                  ? isEs
                    ? "No hay alzas de precio pendientes en este momento."
                    : "No pending price increases at this time."
                  : isEs
                  ? "No hay bajas de precio pendientes en este momento."
                  : "No pending price decreases at this time."}
              </div>
            ) : (
              visiblePending.map((alert) => {
                const isInc = isAlertIncrease(alert);
                const isBusy = processingId === alert.id || batchProcessing;
                const isSelected = selectedIds.has(alert.id);
                const deltaCRC = alert.proposedTPriceCRC - alert.oldTPriceCRC;
                const prodTitle = isEs ? alert.productNameEs : (alert.productNameEn || alert.productNameEs);

                return (
                  <div
                    key={alert.id}
                    className={`bg-white rounded-2xl border p-4 shadow-2xs space-y-3.5 transition ${
                      isSelected
                        ? isInc
                          ? "border-amber-500 ring-2 ring-amber-200/70"
                          : "border-[#C02030] ring-2 ring-rose-200/70"
                        : isInc
                        ? "border-amber-200/90"
                        : "border-emerald-200/90"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Checkbox + Product Info */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(alert.id)}
                          disabled={batchProcessing}
                          aria-label={isEs ? "Seleccionar producto" : "Select product"}
                          className="mt-1 p-0.5 rounded text-slate-400 hover:text-slate-900 transition cursor-pointer shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare
                              className={`w-5 h-5 ${isInc ? "text-amber-600" : "text-[#C02030]"}`}
                            />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>

                        <img
                          src={alert.productImageUrl || "/images/logo.png"}
                          alt={prodTitle}
                          className="w-16 h-16 rounded-xl object-contain bg-slate-50 border border-slate-200 p-1 shrink-0"
                        />
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isInc ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                <TrendingUp className="w-3 h-3" />
                                <span>{t.priceDropsBadgeIncrease}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                                <TrendingDown className="w-3 h-3" />
                                <span>{t.priceDropsBadgeDecrease}</span>
                              </span>
                            )}
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {alert.productSku}
                            </span>
                            {alert.brandName && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                                {alert.brandName}
                              </span>
                            )}
                            {!isInc && alert.computedDiscountPercent > 0 && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-[#C02030] border border-rose-200 font-mono">
                                -{alert.computedDiscountPercent}% OFF ({isEs ? "sobre T_price" : "on T_price"})
                              </span>
                            )}
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

                        <div
                          className={`p-2.5 rounded-xl border text-center ${
                            isInc
                              ? "bg-amber-50 border-amber-200"
                              : "bg-emerald-50 border-emerald-200"
                          }`}
                        >
                          <span
                            className={`text-[9px] font-bold uppercase block ${
                              isInc ? "text-amber-700" : "text-emerald-700"
                            }`}
                          >
                            {t.priceDropsTPriceLabel}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 line-through block">
                            {formatCRC(alert.oldTPriceCRC)}
                          </span>
                          <span
                            className={`text-xs font-mono font-black ${
                              isInc ? "text-amber-900" : "text-emerald-800"
                            }`}
                          >
                            {formatCRC(alert.proposedTPriceCRC)}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-bold block ${
                              isInc ? "text-amber-700" : "text-emerald-700"
                            }`}
                          >
                            {deltaCRC >= 0 ? `+${formatCRC(deltaCRC)}` : `-${formatCRC(Math.abs(deltaCRC))}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Individual Staff Approval Action Bar */}
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

                      {isInc ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleResolveAlert(alert, "PRICE_INCREASE")}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition disabled:opacity-50 cursor-pointer"
                        >
                          {isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ArrowUpCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{t.priceDropsApproveIncreaseBtn}</span>
                        </button>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )
      )}

      {/* VIEW 2: Resolved Price Changes History */}
      {subView === "history" && (
        resolved.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
            {isEs
              ? "Aún no hay historial de cambios de precio resueltos."
              : "No resolved price changes in history yet."}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="divide-y divide-slate-100">
              {resolved.map((item) => {
                const isInc = isAlertIncrease(item);
                return (
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
                        <span className={`font-black ${isInc ? "text-amber-700" : "text-emerald-700"}`}>
                          {formatCRC(item.oldTPriceCRC)} → {formatCRC(item.proposedTPriceCRC)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      )}
    </div>
  );
}
