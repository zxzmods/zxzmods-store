"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { GarageModal } from "@/components/garage/GarageModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingConcierge } from "@/components/home/FloatingConcierge";
import { ProfileDrawer } from "@/components/profile/ProfileDrawer";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";
import { formatCRC } from "@/lib/i18n";
import { COMPANY_CONFIG, getWhatsAppUrl } from "@/config/company";
import {
  Calendar,
  Clock,
  Wrench,
  Truck,
  Car,
  MapPin,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronRight,
  ArrowLeft,
  Send,
  X,
  Phone,
  Package,
  CalendarCheck2,
  CalendarX,
  Info,
  User,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

export interface ScheduledServiceComment {
  id: string;
  authorRole: "CUSTOMER" | "STAFF" | "SYSTEM";
  authorName: string;
  text: string;
  createdAt: string;
}

export interface ScheduledServiceItem {
  id: string;
  appointmentCode: string | null;
  orderId: string | null;
  serviceType: string;
  date: string;
  time: string;
  timeMinutes: number;
  durationMinutes: number;
  travelDurationMin: number;
  destinationAddress: string | null;
  clientName: string | null;
  clientPhone: string | null;
  status: string;
  costCRC: number;
  paymentStatus: string;
  paymentProofUrl: string | null;
  canEdit: boolean;
  diffHours: number;
  hoursRemaining: number;
  comments: ScheduledServiceComment[];
  order: {
    id: string;
    orderNumber: string;
    status: string;
    totalCRC: number;
    shippingAddress: string | null;
    itemsJson: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function ScheduledServicesPage() {
  const router = useRouter();
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const { t, lang } = useLanguage();
  const { theme } = useTheme();

  const [services, setServices] = useState<ScheduledServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reschedule Modal State
  const [reschedulingItem, setReschedulingItem] = useState<ScheduledServiceItem | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("10:00");
  const [submittingReschedule, setSubmittingReschedule] = useState(false);
  const [rescheduleFeedback, setRescheduleFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Comment Box State per service (map serviceId -> string)
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingCommentId, setSubmittingCommentId] = useState<string | null>(null);

  // Fetch user scheduled services
  const loadServices = useCallback(async () => {
    if (!user) {
      setServices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/user/services");
      const data = await res.json();
      if (data.success && Array.isArray(data.services)) {
        setServices(data.services);
      } else {
        setError(data.error || "No se pudieron cargar los servicios");
        setServices([]);
      }
    } catch (err) {
      console.error("Error fetching scheduled services:", err);
      setError("Error de conexión al cargar la agenda");
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Minimum allowed date for rescheduling: exactly 48 hours + 1 day buffer from now
  const minRescheduleDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 3); // 72 hours safety minimum
    return d.toISOString().split("T")[0];
  })();

  const handleOpenRescheduleModal = (item: ScheduledServiceItem) => {
    setReschedulingItem(item);
    setNewDate(item.date);
    setNewTime(item.time || "10:00");
    setRescheduleFeedback(null);
  };

  const handleCloseRescheduleModal = () => {
    setReschedulingItem(null);
    setNewDate("");
    setNewTime("10:00");
    setRescheduleFeedback(null);
  };

  const handleConfirmReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingItem) return;

    if (!newDate || !newTime) {
      setRescheduleFeedback({
        type: "error",
        msg: lang === "es" ? "Por favor selecciona fecha y hora válidas" : "Please select a valid date and time",
      });
      return;
    }

    setSubmittingReschedule(true);
    setRescheduleFeedback(null);

    try {
      const res = await fetch(`/api/user/services/${reschedulingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newDate, newTime }),
      });

      const data = await res.json();

      if (data.success) {
        setRescheduleFeedback({
          type: "success",
          msg: t.scheduledServicesRescheduleSuccess,
        });

        // Update local item in list
        setServices((prev) =>
          prev.map((s) => (s.id === reschedulingItem.id ? { ...s, ...data.service } : s))
        );

        setTimeout(() => {
          handleCloseRescheduleModal();
        }, 1500);
      } else {
        setRescheduleFeedback({
          type: "error",
          msg: data.error || t.scheduledServicesRescheduleError48h,
        });
      }
    } catch (err) {
      console.error("Error rescheduling service:", err);
      setRescheduleFeedback({
        type: "error",
        msg: lang === "es" ? "Error al procesar la reprogramación" : "Error processing reschedule request",
      });
    } finally {
      setSubmittingReschedule(false);
    }
  };

  const handleAddComment = async (serviceId: string) => {
    const text = (commentInputs[serviceId] || "").trim();
    if (!text) return;

    setSubmittingCommentId(serviceId);

    try {
      const res = await fetch(`/api/user/services/${serviceId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (data.success && data.comments) {
        // Clear input
        setCommentInputs((prev) => ({ ...prev, [serviceId]: "" }));
        // Update service comments in state
        setServices((prev) =>
          prev.map((s) => (s.id === serviceId ? { ...s, comments: data.comments } : s))
        );
      }
    } catch (err) {
      console.error("Error submitting service comment:", err);
    } finally {
      setSubmittingCommentId(null);
    }
  };

  const getServiceTypeInfo = (type: string) => {
    switch (type) {
      case "installation":
        return {
          title: lang === "es" ? "Instalación a Domicilio" : "Home Installation",
          icon: Wrench,
          bg: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "delivery":
        return {
          title: lang === "es" ? "Envío / Entrega Programada" : "Scheduled Delivery",
          icon: Truck,
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
      case "pickup":
        return {
          title: lang === "es" ? "Recolección de Vehículo / UTV" : "Vehicle / UTV Pick-up",
          icon: Car,
          bg: "bg-amber-50 text-amber-700 border-amber-200",
        };
      case "shop_installation":
      default:
        return {
          title: lang === "es" ? "Instalación en Taller ZxZ" : "ZxZ Workshop Installation",
          icon: Wrench,
          bg: "bg-red-50 text-[#C02030] border-red-200",
        };
    }
  };

  const formatScheduledDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString(lang === "es" ? "es-CR" : "en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const isLoading = authLoading || loading;

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-[#C02030] selection:text-white">
      {/* Top Banner & Header */}
      <div>
        <NotificationBanner />
        <Navbar />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
          {/* Header & Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-zinc-800">
            <div>
              <Link
                href="/pedidos"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-zinc-400 hover:text-[#C02030] transition-colors mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{lang === "es" ? "Volver a Mis Pedidos" : "Back to My Orders"}</span>
              </Link>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                {t.scheduledServicesTitle}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-1 max-w-2xl">
                {t.scheduledServicesSubtitle}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/servicios"
                className="px-4 py-2.5 rounded-xl bg-[#C02030] hover:bg-[#A01825] text-white text-xs font-bold uppercase tracking-wider transition shadow-sm flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4" />
                <span>{t.scheduledServicesBookBtn}</span>
              </Link>

              <button
                type="button"
                onClick={loadServices}
                className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white transition shadow-2xs"
                title={lang === "es" ? "Actualizar servicios" : "Refresh services"}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Loading Skeleton (Rule 7: Mandatory Animated Skeleton Loaders) */}
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              {[1, 2].map((idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6 shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
                    <div className="space-y-2">
                      <div className="h-5 bg-gray-200 dark:bg-zinc-800 rounded w-48" />
                      <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-32" />
                    </div>
                    <div className="h-7 bg-gray-200 dark:bg-zinc-800 rounded-full w-40" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="h-20 bg-gray-100 dark:bg-zinc-800 rounded-2xl" />
                    <div className="h-20 bg-gray-100 dark:bg-zinc-800 rounded-2xl" />
                    <div className="h-20 bg-gray-100 dark:bg-zinc-800 rounded-2xl" />
                  </div>
                  <div className="h-32 bg-gray-50 dark:bg-zinc-800/60 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : !user ? (
            /* Auth Required State */
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-8 sm:p-14 text-center max-w-md mx-auto shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-[#C02030] flex items-center justify-center mx-auto">
                <User className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {t.scheduledServicesAuthRequired}
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                {t.scheduledServicesAuthDesc}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => openAuthModal()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#111827] hover:bg-[#C02030] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                >
                  <span>{t.ordersSignInBtn}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : services.length === 0 ? (
            /* Zero Services Empty State */
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-8 sm:p-14 text-center max-w-lg mx-auto shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-zinc-800 text-gray-400 flex items-center justify-center mx-auto">
                <CalendarX className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {t.scheduledServicesNoItems}
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
                {t.scheduledServicesNoItemsDesc}
              </p>
              <div className="pt-2">
                <Link
                  href="/servicios"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#C02030] hover:bg-[#A01825] text-white text-xs font-bold uppercase tracking-wider transition shadow-sm"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{t.scheduledServicesBookBtn}</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Scheduled Services List */
            <div className="space-y-6">
              {services.map((item) => {
                const typeInfo = getServiceTypeInfo(item.serviceType);
                const IconComponent = typeInfo.icon;

                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 overflow-hidden shadow-xs transition-all hover:shadow-md"
                  >
                    {/* Header Bar */}
                    <div className="p-6 sm:p-7 border-b border-gray-100 dark:border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 dark:bg-zinc-900/50">
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-[#111827] text-white flex items-center justify-center shrink-0 shadow-sm">
                          <IconComponent className="w-6 h-6 text-[#C02030]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono text-xs font-extrabold text-gray-900 dark:text-white">
                              {item.appointmentCode || `#SRV-${item.id.slice(-6)}`}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeInfo.bg}`}>
                              {typeInfo.title}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 capitalize font-medium">
                            {formatScheduledDate(item.date)} • {item.time || "10:00"}
                          </p>
                        </div>
                      </div>

                      {/* 48-Hour Eligibility Indicator Badge */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
                        {item.canEdit ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                            <CalendarCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>{t.scheduledServicesBadgeCanEdit}</span>
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                              ({Math.floor(item.hoursRemaining)}h {t.scheduledServicesHoursRemaining})
                            </span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold">
                            <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>{t.scheduledServicesBadgeLocked}</span>
                            <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400">
                              ({Math.max(0, Math.floor(item.hoursRemaining))}h)
                            </span>
                          </div>
                        )}

                        {/* Reschedule Button */}
                        {item.canEdit ? (
                          <button
                            type="button"
                            onClick={() => handleOpenRescheduleModal(item)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#111827] hover:bg-[#C02030] text-white text-xs font-bold transition shadow-2xs flex items-center gap-1.5"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>{t.scheduledServicesEditDateTime}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="px-3.5 py-1.5 rounded-xl bg-gray-200 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600 text-xs font-bold cursor-not-allowed flex items-center gap-1.5"
                            title={t.scheduledServicesLockedNotice}
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>{t.scheduledServicesEditDateTime}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notice Banner */}
                    <div className="px-6 py-3 bg-gray-50/80 dark:bg-zinc-900/80 border-b border-gray-100 dark:border-zinc-800 text-xs flex items-start gap-2">
                      <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <p className="text-gray-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                        {item.canEdit ? t.scheduledServicesCanEditNotice : t.scheduledServicesLockedNotice}
                      </p>
                    </div>

                    {/* Service Details Grid */}
                    <div className="p-6 sm:p-7 grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Destination / Location Card */}
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                          <MapPin className="w-3.5 h-3.5 text-[#C02030]" />
                          <span>
                            {item.serviceType === "shop_installation"
                              ? t.scheduledServicesWorkshopAddressLabel
                              : t.scheduledServicesDestinationLabel}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200 leading-snug">
                          {item.destinationAddress || COMPANY_CONFIG.location.shortAddress}
                        </p>
                        {item.clientPhone && (
                          <p className="text-[11px] text-gray-500 font-mono pt-1">
                            {lang === "es" ? "Contacto:" : "Contact:"} {item.clientPhone}
                          </p>
                        )}
                      </div>

                      {/* Linked Order Card */}
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                          <Package className="w-3.5 h-3.5 text-[#C02030]" />
                          <span>{t.scheduledServicesLinkedOrderLabel}</span>
                        </div>
                        {item.order ? (
                          <div>
                            <Link
                              href={`/pedidos/${item.order.id}`}
                              className="text-xs font-bold text-[#C02030] hover:underline flex items-center gap-1 font-mono"
                            >
                              <span>#{item.order.orderNumber}</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                            <p className="text-[11px] text-gray-500 mt-1">
                              {lang === "es" ? "Monto pedido:" : "Order total:"} {formatCRC(item.order.totalCRC)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 font-medium">
                            {lang === "es" ? "Servicio independiente" : "Standalone appointment"}
                          </p>
                        )}
                      </div>

                      {/* Pricing & Workshop WhatsApp CTA */}
                      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-800 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500 font-medium">{lang === "es" ? "Costo:" : "Cost:"}</span>
                            <span className="font-mono font-bold text-gray-900 dark:text-white">
                              {item.costCRC > 0 ? formatCRC(item.costCRC) : lang === "es" ? "Incluido" : "Included"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-gray-500 font-medium">{lang === "es" ? "Estado pago:" : "Payment:"}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                              {item.paymentStatus === "PAID" ? (lang === "es" ? "Pagado / Confirmado" : "Paid") : item.paymentStatus}
                            </span>
                          </div>
                        </div>

                        <a
                          href={getWhatsAppUrl(
                            `¡Hola ZxZ Mods! Tengo una consulta sobre mi cita programada ${
                              item.appointmentCode || `#SRV-${item.id.slice(-6)}`
                            } del ${item.date} a las ${item.time}.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black font-bold text-[11px] uppercase tracking-wider transition shadow-2xs flex items-center justify-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-black" />
                          <span>{t.ordersContactWhatsApp}</span>
                        </a>
                      </div>
                    </div>

                    {/* Comments & Communication Section (Regardless of 48h limit) */}
                    <div className="p-6 sm:p-7 border-t border-gray-100 dark:border-zinc-800/80 bg-gray-50/30 dark:bg-zinc-900/30 space-y-4">
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-[#C02030]" />
                          <span>{t.scheduledServicesCommentsTitle}</span>
                        </h3>
                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                          {t.scheduledServicesCommentsSubtitle}
                        </p>
                      </div>

                      {/* Comments Timeline */}
                      {item.comments && item.comments.length > 0 ? (
                        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                          {item.comments.map((cmt) => {
                            const isSystem = cmt.authorRole === "SYSTEM";
                            const isStaff = cmt.authorRole === "STAFF";

                            return (
                              <div
                                key={cmt.id}
                                className={`p-3 rounded-xl text-xs space-y-1 ${
                                  isSystem
                                    ? "bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-blue-900 dark:text-blue-200"
                                    : isStaff
                                    ? "bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-900 dark:text-red-200"
                                    : "bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-800 dark:text-zinc-200 shadow-2xs"
                                }`}
                              >
                                <div className="flex items-center justify-between text-[11px]">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold">{cmt.authorName}</span>
                                    <span
                                      className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                                        isSystem
                                          ? "bg-blue-200 text-blue-900"
                                          : isStaff
                                          ? "bg-red-200 text-red-900"
                                          : "bg-gray-200 text-gray-700"
                                      }`}
                                    >
                                      {isSystem ? "Sistema" : isStaff ? "Personal ZxZ" : "Cliente"}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    {new Date(cmt.createdAt).toLocaleDateString(lang === "es" ? "es-CR" : "en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <p className="text-xs leading-relaxed whitespace-pre-wrap">{cmt.text}</p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          {lang === "es"
                            ? "No hay comentarios aún en este servicio. Puedes agregar notas e indicaciones abajo."
                            : "No comments yet on this service. You can add notes or special instructions below."}
                        </p>
                      )}

                      {/* Add Comment Input (Always active, regardless of 48h limit!) */}
                      <div className="flex gap-2 items-center pt-2">
                        <input
                          type="text"
                          value={commentInputs[item.id] || ""}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment(item.id);
                            }
                          }}
                          placeholder={t.scheduledServicesAddCommentPlaceholder}
                          className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#C02030]"
                        />

                        <button
                          type="button"
                          onClick={() => handleAddComment(item.id)}
                          disabled={submittingCommentId === item.id || !(commentInputs[item.id] || "").trim()}
                          className="px-4 py-2.5 rounded-xl bg-[#C02030] hover:bg-[#A01825] disabled:opacity-50 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{t.scheduledServicesPostComment}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Reschedule Modal (Only opens if > 48 hours to service) */}
      {reschedulingItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-md w-full border border-gray-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/50 text-[#C02030] flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    {t.scheduledServicesModalTitle}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-mono">
                    {reschedulingItem.appointmentCode || `#SRV-${reschedulingItem.id.slice(-6)}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseRescheduleModal}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {rescheduleFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  rescheduleFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {rescheduleFeedback.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{rescheduleFeedback.msg}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReschedule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  {t.scheduledServicesSelectDate}
                </label>
                <input
                  type="date"
                  min={minRescheduleDate}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#C02030]"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  {lang === "es"
                    ? "* Por políticas de taller, la fecha debe ser con al menos 48 horas de anticipación."
                    : "* Per workshop policy, the new date must be at least 48 hours in advance."}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-zinc-300 mb-1">
                  {t.scheduledServicesSelectTime}
                </label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:border-[#C02030]"
                >
                  <option value="08:00">08:00 AM</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="13:00">01:00 PM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="15:00">03:00 PM</option>
                  <option value="16:00">04:00 PM</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseRescheduleModal}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
                >
                  {lang === "es" ? "Cancelar" : "Cancel"}
                </button>

                <button
                  type="submit"
                  disabled={submittingReschedule}
                  className="px-5 py-2.5 rounded-xl bg-[#C02030] hover:bg-[#A01825] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider transition shadow-sm"
                >
                  {submittingReschedule ? (lang === "es" ? "Guardando..." : "Saving...") : t.scheduledServicesSaveSchedule}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Modals & Drawers */}
      <GarageModal />
      <CartDrawer />
      <FloatingConcierge />
      <ProfileDrawer />
    </div>
  );
}
