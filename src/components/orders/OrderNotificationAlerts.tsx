"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Sparkles, 
  X,
  CreditCard,
  Calendar
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { translations } from "@/lib/i18n";

interface OrderAlertItem {
  id: string; // unique toast ID
  orderId: string;
  orderNumber: string;
  type: "advanced" | "updated" | "rejected" | "program_service";
  title: string;
  description: string;
  rejectionReason?: string | null;
  stageLabel?: string;
  createdAt: number;
  orderUpdatedAt?: string;
  durationMs?: number; // 5000 for updated/advanced/program_service, undefined for rejected
  redirectUrl: string;
}

interface FetchedOrder {
  id: string;
  orderNumber: string;
  status: string;
  serviceType: string;
  totalCRC: number;
  paidCurrency?: string | null;
  paymentRejectionReason?: string | null;
  paymentProofUrl?: string | null;
  updatedAt: string;
  createdAt: string;
  isPaymentRejected: boolean;
  needsServiceProgramming?: boolean;
  stepIndex: number;
  stageLabelEs: string;
  stageLabelEn: string;
}

interface CachedOrderState {
  status: string;
  stepIndex: number;
  updatedAt: string;
  isPaymentRejected: boolean;
}

const STORAGE_CACHE_KEY = "zxz_order_states_v1";
const STORAGE_DISMISSED_REJECTIONS_KEY = "zxz_dismissed_rejections_v1";
const TRACKED_ORDERS_KEY = "zxz_tracked_orders";
const POLL_INTERVAL_MS = 10000; // 10 seconds

export function OrderNotificationAlerts() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const [alerts, setAlerts] = useState<OrderAlertItem[]>([]);
  const alertsRef = useRef<OrderAlertItem[]>([]);
  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);
  const isFirstLoadRef = useRef(true);
  const isPollingRef = useRef(false);

  // Helper to get dismissed rejections from localStorage
  const getDismissedRejections = useCallback((): Set<string> => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(STORAGE_DISMISSED_REJECTIONS_KEY);
      if (stored) {
        const arr = JSON.parse(stored);
        return new Set(Array.isArray(arr) ? arr : []);
      }
    } catch {
      // ignore
    }
    return new Set();
  }, []);

  // Dismiss an alert
  const dismissAlert = useCallback((alertId: string, orderId?: string, updatedAt?: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));

    // If it's a rejected alert, save to dismissed rejections so it doesn't pop up again for this rejection
    if (orderId) {
      try {
        const dismissed = getDismissedRejections();
        if (updatedAt) {
          dismissed.add(`${orderId}_${updatedAt}`);
        }
        dismissed.add(`${orderId}_rejected_dismissed`);
        localStorage.setItem(
          STORAGE_DISMISSED_REJECTIONS_KEY,
          JSON.stringify(Array.from(dismissed))
        );
      } catch {
        // ignore
      }
    }
  }, [getDismissedRejections]);

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    if (typeof window === "undefined" || isPollingRef.current) return;
    isPollingRef.current = true;

    try {
      // Gather tracked order IDs
      let trackedOrderIds: string[] = [];
      try {
        const storedTracked = localStorage.getItem(TRACKED_ORDERS_KEY);
        if (storedTracked) {
          const parsed = JSON.parse(storedTracked);
          if (Array.isArray(parsed)) {
            trackedOrderIds = parsed.map((id) => String(id).trim()).filter(Boolean);
          }
        }
      } catch {
        // ignore
      }

      // If user is not logged in and no tracked orders in localStorage, skip
      if (!user && trackedOrderIds.length === 0) {
        isPollingRef.current = false;
        return;
      }

      const params = new URLSearchParams();
      if (trackedOrderIds.length > 0) {
        params.set("orderIds", trackedOrderIds.slice(0, 30).join(","));
      }

      const url = `/api/orders/updates${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        isPollingRef.current = false;
        return;
      }

      const data = await res.json();
      if (!data.success || !Array.isArray(data.orders)) {
        isPollingRef.current = false;
        return;
      }

      const orders: FetchedOrder[] = data.orders;

      // Read cached states
      let cache: Record<string, CachedOrderState> = {};
      try {
        const storedCache = localStorage.getItem(STORAGE_CACHE_KEY);
        if (storedCache) {
          cache = JSON.parse(storedCache) || {};
        }
      } catch {
        cache = {};
      }

      const dismissedRejections = getDismissedRejections();
      const newAlertsToAdd: OrderAlertItem[] = [];
      const updatedCache: Record<string, CachedOrderState> = { ...cache };

      for (const order of orders) {
        const prev = cache[order.id];
        const isRejected = order.isPaymentRejected;
        const currentStageLabel = lang === "es" ? order.stageLabelEs : order.stageLabelEn;

        // Condition 1: Payment Rejected
        // Requirement: Alert goes ONLY when user clicks on 'x' if an order got rejected payment.
        // Attach redirect to that order so that user can fix the payment.
        if (isRejected) {
          const rejectionKey = `${order.id}_${order.updatedAt}`;
          const isDismissed =
            dismissedRejections.has(rejectionKey) ||
            dismissedRejections.has(`${order.id}_rejected_dismissed`);

          // Suppress if the user is currently viewing this exact order page
          const isCurrentlyViewingThisOrder =
            typeof window !== "undefined" &&
            (window.location.pathname === `/pedidos/${order.id}` ||
              window.location.pathname === `/pedidos/${order.orderNumber}`);

          // Check if already in active alerts
          const alreadyInAlerts = alertsRef.current.some(
            (a) => a.orderId === order.id && a.type === "rejected"
          );

          if (!isDismissed && !alreadyInAlerts && !isCurrentlyViewingThisOrder) {
            newAlertsToAdd.push({
              id: `rejected-${order.id}-${order.updatedAt}`,
              orderId: order.id,
              orderNumber: order.orderNumber,
              type: "rejected",
              orderUpdatedAt: order.updatedAt,
              title: (t.orderAlertRejectedTitle || "Pago Rechazado en Pedido #{orderNumber}").replace(
                "{orderNumber}",
                order.orderNumber
              ),
              description:
                order.paymentRejectionReason ||
                t.orderAlertRejectedDesc ||
                "Tu comprobante de pago fue rechazado. Haz clic para corregir el pago y continuar.",
              rejectionReason: order.paymentRejectionReason,
              createdAt: Date.now(),
              durationMs: undefined, // Persistent! No auto-dismiss. Only closes when user clicks 'x'.
              redirectUrl: `/pedidos/${order.id}?action=pay`,
            });
          }
        } else {
          // If order is NO LONGER rejected (e.g. user fixed payment or staff approved),
          // dismiss any active rejection alert for this order.
          setAlerts((prevAlerts) => {
            if (!prevAlerts.some((a) => a.orderId === order.id && a.type === "rejected")) {
              return prevAlerts;
            }
            return prevAlerts.filter(
              (a) => !(a.orderId === order.id && a.type === "rejected")
            );
          });

          try {
            const dismissed = getDismissedRejections();
            if (dismissed.has(`${order.id}_rejected_dismissed`)) {
              dismissed.delete(`${order.id}_rejected_dismissed`);
              localStorage.setItem(
                STORAGE_DISMISSED_REJECTIONS_KEY,
                JSON.stringify(Array.from(dismissed))
              );
            }
          } catch {
            // ignore
          }

          // Condition 2: Order advanced or updated
          // Requirement: "Add a notification alert every time an order gets updated or advance, this alert goes after 5s."
          // OM-02: Fix system logic so that it no longer triggers a notification when clearing an 'un*' stage.
          if (prev) {
            const isPrevUnStage = Boolean(
              prev.status &&
              (prev.status.toUpperCase() === "NEED_TO_GET_ORDER" ||
                prev.status.toUpperCase() === "IN_COSTA_RICA" ||
                prev.status.toUpperCase().includes("*UN"))
            );

            if (!isPrevUnStage) {
              const hasAdvanced = order.stepIndex > prev.stepIndex;
              const hasStatusChanged = order.status !== prev.status;

              if (hasAdvanced) {
                newAlertsToAdd.push({
                  id: `advanced-${order.id}-${order.status}-${Date.now()}`,
                  orderId: order.id,
                  orderNumber: order.orderNumber,
                  type: "advanced",
                  title: (t.orderAlertAdvancedTitle || "Pedido #{orderNumber} Avanzó").replace(
                    "{orderNumber}",
                    order.orderNumber
                  ),
                  description: (
                    t.orderAlertAdvancedDesc || "Tu pedido avanzó a: {stage}"
                  ).replace("{stage}", currentStageLabel),
                  stageLabel: currentStageLabel,
                  createdAt: Date.now(),
                  durationMs: 5000, // 5s auto-dismiss
                  redirectUrl: `/pedidos/${order.id}`,
                });
              } else if (order.stepIndex > 0 && hasStatusChanged && order.stepIndex !== prev.stepIndex) {
                newAlertsToAdd.push({
                  id: `updated-${order.id}-${order.status}-${Date.now()}`,
                  orderId: order.id,
                  orderNumber: order.orderNumber,
                  type: "updated",
                  title: (t.orderAlertUpdatedTitle || "Pedido #{orderNumber} Actualizado").replace(
                    "{orderNumber}",
                    order.orderNumber
                  ),
                  description: (
                    t.orderAlertUpdatedDesc || "El estado de tu pedido ha cambiado."
                  ),
                  stageLabel: currentStageLabel,
                  createdAt: Date.now(),
                  durationMs: 5000, // 5s auto-dismiss
                  redirectUrl: `/pedidos/${order.id}`,
                });
              }
            }
          }
        }

        // Condition 3: 12-hour reminder to program service
        // User Requirement: "add reminder to client to program service every 12hrs that service is not program. Just make the same ui of the pop-up of when the order gets updated."
        if (order.needsServiceProgramming) {
          const reminderKey = `zxz_service_reminder_${order.id}`;
          let lastReminderTime = 0;
          try {
            lastReminderTime = Number(localStorage.getItem(reminderKey) || "0") || 0;
          } catch {}

          const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
          const now = Date.now();
          const timeSinceLastReminder = now - lastReminderTime;

          const isCurrentlyScheduling =
            typeof window !== "undefined" &&
            (window.location.pathname.startsWith("/servicios") ||
              window.location.pathname === `/pedidos/${order.id}`);

          const alreadyInAlerts = alertsRef.current.some(
            (a) => a.orderId === order.id && a.type === "program_service"
          );

          if (timeSinceLastReminder >= TWELVE_HOURS_MS && !isCurrentlyScheduling && !alreadyInAlerts) {
            newAlertsToAdd.push({
              id: `program-service-${order.id}-${now}`,
              orderId: order.id,
              orderNumber: order.orderNumber,
              type: "program_service",
              title: (t.orderAlertProgramServiceTitle || "¡Programa tu Servicio! - Pedido #{orderNumber}").replace(
                "{orderNumber}",
                order.orderNumber
              ),
              description:
                t.orderAlertProgramServiceDesc ||
                "Tus repuestos ya están listos en el taller. Por favor programa la fecha y hora de tu servicio para continuar.",
              createdAt: now,
              durationMs: 5000, // 5s auto-dismiss, same as updated pop-up
              redirectUrl: `/servicios?orderId=${order.id}&orderNumber=${order.orderNumber}`,
            });

            try {
              localStorage.setItem(reminderKey, String(now));
            } catch {}
          }
        }

        // Record state in cache
        updatedCache[order.id] = {
          status: order.status,
          stepIndex: order.stepIndex,
          updatedAt: order.updatedAt,
          isPaymentRejected: order.isPaymentRejected,
        };
      }

      // Save updated cache
      try {
        localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(updatedCache));
      } catch {
        // ignore
      }

      if (newAlertsToAdd.length > 0) {
        setAlerts((prev) => {
          // Avoid duplicate alerts
          const existingIds = new Set(prev.map((a) => a.id));
          const filteredNew = newAlertsToAdd.filter((a) => !existingIds.has(a.id));
          if (filteredNew.length === 0) return prev;
          return [...prev, ...filteredNew];
        });
      }

      isFirstLoadRef.current = false;
    } catch (err) {
      console.error("Error polling order updates:", err);
    } finally {
      isPollingRef.current = false;
    }
  }, [user, lang, t, getDismissedRejections]);

  // Initial fetch and interval polling
  useEffect(() => {
    checkForUpdates();

    const interval = setInterval(() => {
      // Only poll when page is visible
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        checkForUpdates();
      }
    }, POLL_INTERVAL_MS);

    // Recheck on visibility change (when tab is focused)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkForUpdates();
      }
    };

    // Custom event trigger if order is placed or updated in current window
    const handleOrderEvent = () => {
      checkForUpdates();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("zxz-order-updated", handleOrderEvent);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("zxz-order-updated", handleOrderEvent);
    };
  }, [checkForUpdates]);

  // Auto-dismiss handler for 5s alerts (type !== 'rejected')
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    alerts.forEach((alert) => {
      if (alert.durationMs && alert.durationMs > 0) {
        const remaining = alert.createdAt + alert.durationMs - Date.now();
        const delay = Math.max(0, remaining);

        const timer = setTimeout(() => {
          dismissAlert(alert.id);
        }, delay);

        timers.push(timer);
      }
    });

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [alerts, dismissAlert]);

  if (alerts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-18 left-3 right-3 sm:left-auto sm:right-6 sm:top-24 z-[9999] flex flex-col gap-3 sm:max-w-sm pointer-events-none select-none"
    >
      <AnimatePresence>
        {alerts.map((alert) => (
          <OrderAlertToast
            key={alert.id}
            alert={alert}
            onDismiss={() => dismissAlert(alert.id, alert.orderId, alert.orderUpdatedAt)}
            onNavigate={(url) => {
              dismissAlert(alert.id, alert.orderId, alert.orderUpdatedAt);
              router.push(url);
            }}
            t={t}
            lang={lang}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface OrderAlertToastProps {
  alert: OrderAlertItem;
  onDismiss: () => void;
  onNavigate: (url: string) => void;
  t: any;
  lang: string;
}

function OrderAlertToast({ alert, onDismiss, onNavigate, t, lang }: OrderAlertToastProps) {
  const isRejected = alert.type === "rejected";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.94, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 450, damping: 30 }}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl p-4 backdrop-blur-xl shadow-2xl border transition-colors ${
        isRejected
          ? "bg-rose-50/95 dark:bg-[#1A0B0E]/95 border-rose-300 dark:border-rose-900/80 text-rose-950 dark:text-rose-100 shadow-rose-950/20"
          : alert.type === "program_service"
          ? "bg-amber-50/95 dark:bg-[#1A1408]/95 border-amber-300 dark:border-amber-800/80 text-amber-950 dark:text-amber-100 shadow-amber-950/20"
          : alert.type === "advanced"
          ? "bg-white/95 dark:bg-[#121214]/95 border-emerald-300/80 dark:border-emerald-800/80 text-zinc-900 dark:text-zinc-100 shadow-black/15"
          : "bg-white/95 dark:bg-[#121214]/95 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-black/15"
      }`}
    >
      {/* 5s Countdown Progress Bar (Only for non-rejected alerts) */}
      {!isRejected && alert.durationMs && (
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: alert.durationMs / 1000, ease: "linear" }}
          className={`absolute top-0 left-0 h-1 ${
            alert.type === "program_service"
              ? "bg-amber-500"
              : alert.type === "advanced"
              ? "bg-emerald-500"
              : "bg-[#0052CC]"
          }`}
        />
      )}

      <div className="flex items-start gap-3">
        {/* Leading Icon */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
            isRejected
              ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
              : alert.type === "program_service"
              ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25"
              : alert.type === "advanced"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
              : "bg-[#0052CC] text-white shadow-md shadow-[#0052CC]/25"
          }`}
        >
          {isRejected ? (
            <AlertCircle className="w-5 h-5 animate-pulse" />
          ) : alert.type === "program_service" ? (
            <Calendar className="w-5 h-5" />
          ) : alert.type === "advanced" ? (
            <Sparkles className="w-5 h-5" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2">
            <h4
              className={`text-xs font-black uppercase tracking-wider ${
                isRejected
                  ? "text-rose-900 dark:text-rose-200"
                  : alert.type === "program_service"
                  ? "text-amber-900 dark:text-amber-200"
                  : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              {alert.title}
            </h4>
            {isRejected && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-200/80 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800">
                {lang === "es" ? "Acción Requerida" : "Action Required"}
              </span>
            )}
            {alert.type === "program_service" && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                {lang === "es" ? "Agendar Cita" : "Schedule"}
              </span>
            )}
          </div>

          <p
            className={`text-xs mt-1 leading-relaxed ${
              isRejected
                ? "text-rose-800 dark:text-rose-300/90 font-medium"
                : alert.type === "program_service"
                ? "text-amber-900/80 dark:text-amber-300/90 font-medium"
                : "text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {alert.description}
          </p>

          {/* Action CTAs */}
          <div className="mt-3 flex items-center gap-2">
            {isRejected ? (
              <button
                type="button"
                onClick={() => onNavigate(alert.redirectUrl)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{t.orderAlertFixPaymentBtn || "Corregir Pago"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : alert.type === "program_service" ? (
              <button
                type="button"
                onClick={() => onNavigate(alert.redirectUrl)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{t.orderAlertProgramServiceBtn || "Programar Servicio"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(alert.redirectUrl)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{t.orderAlertViewOrderBtn || "Ver Pedido"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Close Button ('x') */}
        {/* Requirement: Persistent rejected alert disappears ONLY when user clicks 'x' */}
        <button
          type="button"
          onClick={onDismiss}
          aria-label={t.orderAlertDismissBtn || "Cerrar"}
          className={`p-1.5 rounded-lg transition-colors flex-shrink-0 -mr-1 -mt-1 ${
            isRejected
              ? "text-rose-700 dark:text-rose-300 hover:bg-rose-200/60 dark:hover:bg-rose-900/50"
              : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
