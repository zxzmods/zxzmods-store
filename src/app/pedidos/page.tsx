"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { GarageModal } from "@/components/garage/GarageModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingConcierge } from "@/components/home/FloatingConcierge";
import { ProfileDrawer } from "@/components/profile/ProfileDrawer";
import { useAuth, UserOrder } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { getWhatsAppUrl } from "@/config/company";
import { formatCRC, formatUSD, convertCRCToUSD } from "@/lib/i18n";
import {
  CUSTOMER_ORDER_STAGES,
  COTIZACION_STAGES,
  getCustomerOrderStages,
  getCustomerOrderStepIndex,
  shouldSkipInstallationPayment,
  isPaymentConfirmedOrMore,
  getWorkflowStatusBadge,
  getServiceParamFromOrder,
  isOrderInProgramServiceStage,
  isOrderInInstallationPaymentStage,
  isInstallationPaymentPaidOrConfirmed,
  isRejectedPaymentCorrected,
} from "@/lib/orderWorkflow";
import {
  ShoppingBag,
  ShoppingCart,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Wrench,
  MapPin,
  MessageCircle,
  ArrowLeft,
  ChevronRight,
  User,
  Package,
  Calendar,
  Sparkles,
  ClipboardList,
  CreditCard,
  Plane,
  Layers,
  Star,
  Eye,
  X,
  ExternalLink,
  Search,
} from "lucide-react";
import { getOrderPendingInstallationCost } from "@/lib/orderServices";

export default function PedidosPage() {
  const { user, orders, loading: authLoading, openAuthModal } = useAuth();
  const { items, currency, sellRate, activeQuotation, clearActiveQuotation } = useCart();
  const { t, lang } = useLanguage();

  const [ordersList, setOrdersList] = useState<UserOrder[]>(orders || []);
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL" | "ORDERS" | "QUOTES">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);

  // Sync with context orders or re-fetch from dedicated API endpoint
  useEffect(() => {
    if (user) {
      setFetching(true);
      fetch("/api/user/orders")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.orders)) {
            setOrdersList(data.orders);
            // If the user's active quotation is present in their orders list and is no longer COTIZACION, clear cart advert
            if (activeQuotation) {
              const matchedQuote = data.orders.find(
                (o: any) => o.id === activeQuotation.id || o.orderNumber === activeQuotation.orderNumber
              );
              if (matchedQuote && String(matchedQuote.status || "").toUpperCase() !== "COTIZACION") {
                clearActiveQuotation();
              }
            }

            try {
              const ids = data.orders.map((o: any) => o.id);
              const nums = data.orders.map((o: any) => o.orderNumber);
              const stored = JSON.parse(localStorage.getItem("zxz_tracked_orders") || "[]");
              const list = Array.isArray(stored) ? stored : [];
              const updated = Array.from(new Set([...ids, ...nums, ...list])).slice(0, 50);
              localStorage.setItem("zxz_tracked_orders", JSON.stringify(updated));
            } catch {}
          } else {
            setOrdersList(orders || []);
          }
        })
        .catch((err) => {
          console.error("Error fetching orders:", err);
          setOrdersList(orders || []);
        })
        .finally(() => setFetching(false));
    } else {
      setOrdersList([]);
    }
  }, [user, orders]);

  const isLoading = authLoading || fetching;

  const quotesCount = useMemo(
    () => ordersList.filter((o) => o.status?.toUpperCase() === "COTIZACION").length,
    [ordersList]
  );
  const ordersCount = useMemo(
    () => ordersList.filter((o) => o.status?.toUpperCase() !== "COTIZACION").length,
    [ordersList]
  );

  const displayedOrders = useMemo(() => {
    let list = ordersList;
    if (activeTab === "QUOTES") {
      list = ordersList.filter((o) => o.status?.toUpperCase() === "COTIZACION");
    } else if (activeTab === "ORDERS") {
      list = ordersList.filter((o) => o.status?.toUpperCase() !== "COTIZACION");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((o) => {
        const num = (o.orderNumber || "").toLowerCase();
        const custName = ((o as any).customerName || user?.displayName || "").toLowerCase();
        const custPhone = ((o as any).customerPhone || user?.phoneNumber || "").toLowerCase();
        const stat = (o.status || "").toLowerCase();
        let itemMatch = false;
        try {
          const itms = typeof o.itemsJson === "string" ? JSON.parse(o.itemsJson) : o.itemsJson;
          if (Array.isArray(itms)) {
            itemMatch = itms.some((it: any) =>
              (it.name || it.title || it.slug || "").toLowerCase().includes(q)
            );
          }
        } catch {}
        return num.includes(q) || custName.includes(q) || custPhone.includes(q) || stat.includes(q) || itemMatch;
      });
    }

    return list;
  }, [ordersList, activeTab, searchQuery, user]);

  const getServiceTypeBadge = (serviceType: string) => {
    switch (serviceType) {
      case "HOME_SERVICE":
        return {
          label: lang === "es" ? "Instalación a Domicilio" : "At-Home Installation",
          icon: Wrench,
        };
      case "UTV_PICKUP":
        return {
          label: lang === "es" ? "Recogida y Entrega de UTV" : "UTV Pick-up Service",
          icon: Truck,
        };
      case "STORE_PICKUP":
      default:
        return {
          label: lang === "es" ? "Retiro en Taller ZxZ (Santa Ana)" : "ZxZ Workshop Pickup (Santa Ana)",
          icon: MapPin,
        };
    }
  };

  const formatPrice = (amountCRC: number) => {
    if (currency === "USD") {
      return formatUSD(convertCRCToUSD(amountCRC, sellRate));
    }
    return formatCRC(amountCRC);
  };

  const formatOrderPrice = (amountCRC: number, orderItem?: any) => {
    if (orderItem?.paidCurrency) {
      if (String(orderItem.paidCurrency).toUpperCase() === "USD") {
        return formatUSD(convertCRCToUSD(amountCRC, sellRate));
      }
      return formatCRC(amountCRC);
    }
    if (orderItem?.status && String(orderItem.status).toUpperCase() !== "COTIZACION") {
      return formatCRC(amountCRC);
    }
    return formatPrice(amountCRC);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#111827] flex flex-col justify-between antialiased">
      <NotificationBanner />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 w-full">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <Link
            href="/"
            className="hover:text-black flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === "es" ? "Inicio" : "Home"}</span>
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">{t.ordersPageTitle}</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 mb-6 border-b border-gray-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0052CC]/10 border border-[#0052CC]/20 text-[11px] font-bold text-[#0052CC] uppercase tracking-wider mb-2">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{lang === "es" ? "Historial & Seguimiento" : "History & Tracking"}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              {t.ordersPageTitle}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5 max-w-2xl">
              {t.ordersPageSubtitle}
            </p>
          </div>

          {user && !isLoading && (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/servicios/programados"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-200 bg-white hover:border-[#C02030] hover:text-[#C02030] text-xs font-bold text-gray-700 transition shadow-2xs"
              >
                <Calendar className="w-3.5 h-3.5 text-[#C02030]" />
                <span>{t.scheduledServicesTitle}</span>
              </Link>

              <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-gray-200 shadow-2xs text-xs font-mono">
                <span className="text-gray-500">{lang === "es" ? "Total registros:" : "Total records:"}</span>
                <span className="font-bold text-[#0052CC]">{ordersList.length}</span>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar & Filter Navigation Tabs (Differentiating placed orders vs cotizaciones) */}
        {user && !isLoading && ordersList.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "ALL"
                    ? "bg-[#111827] text-white shadow-xs"
                    : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{lang === "es" ? "Todos" : "All"}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === "ALL" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}>
                  {ordersList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("ORDERS")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "ORDERS"
                    ? "bg-[#0052CC] text-white shadow-xs"
                    : "bg-white text-gray-600 hover:text-[#0052CC] border border-gray-200"
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>{lang === "es" ? "Pedidos en Firme" : "Placed Orders"}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === "ORDERS" ? "bg-white/20 text-white" : "bg-blue-50 text-[#0052CC]"
                }`}>
                  {ordersCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("QUOTES")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "QUOTES"
                    ? "bg-purple-700 text-white shadow-xs"
                    : "bg-white text-gray-600 hover:text-purple-700 border border-gray-200"
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>{lang === "es" ? "Cotizaciones Proforma" : "Proforma Quotations"}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === "QUOTES" ? "bg-white/20 text-white" : "bg-purple-50 text-purple-700"
                }`}>
                  {quotesCount}
                </span>
              </button>
            </div>

            {/* Quick Search Input */}
            <div className="relative w-full sm:w-72 shrink-0">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.ordersSearchPlaceholder}
                className="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-7 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#C02030] transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Real Loading Skeleton (Rule 7: Mandatory Animated Skeleton Loaders) */}
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-44" />
                    <div className="h-3 bg-gray-200 rounded w-32" />
                  </div>
                  <div className="h-7 bg-gray-200 rounded-full w-36" />
                </div>

                <div className="h-16 bg-gray-100 rounded-2xl" />

                <div className="space-y-3">
                  <div className="h-14 bg-gray-50 rounded-xl" />
                  <div className="h-14 bg-gray-50 rounded-xl" />
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="h-6 bg-gray-200 rounded w-32" />
                  <div className="h-10 bg-gray-200 rounded-xl w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : !user ? (
          /* Auth Required State */
          <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 text-center max-w-md mx-auto shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#0052CC] flex items-center justify-center mx-auto">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {t.ordersAuthRequiredTitle}
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              {t.ordersAuthRequiredSubtitle}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => openAuthModal()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#111827] hover:bg-[#0052CC] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
              >
                <span>{t.ordersSignInBtn}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : ordersList.length === 0 ? (
          /* Empty Orders State */
          <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-14 text-center max-w-lg mx-auto shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {t.profileNoOrders}
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
              {t.profileNoOrdersDesc}
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-3">
              {items.length > 0 && (
                <Link
                  href="/carrito"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0052CC] hover:bg-[#0043A6] text-white text-xs font-bold transition-colors shadow-sm"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{t.profileViewCart}</span>
                </Link>
              )}
              <Link
                href="/combos"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-colors shadow-sm"
              >
                <span>{t.navCombos}</span>
              </Link>
              <Link
                href="/productos"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
              >
                <span>{t.profileExploreParts}</span>
              </Link>
            </div>
          </div>
        ) : displayedOrders.length === 0 ? (
          /* Empty Filter State */
          <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 text-center max-w-md mx-auto shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">
              {lang === "es" ? "No hay registros en esta categoría" : "No records in this category"}
            </h3>
            <p className="text-xs text-gray-500">
              {lang === "es"
                ? "Cambia de filtro para visualizar tus otros pedidos o cotizaciones."
                : "Switch filter tabs to view other orders or quotations."}
            </p>
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className="mt-2 text-xs font-bold text-[#0052CC] hover:underline"
            >
              {lang === "es" ? "Ver todos los registros" : "View all records"}
            </button>
          </div>
        ) : (
          /* Orders Cards List */
          <div className="space-y-6">
            {displayedOrders.map((order) => {
              const isQuote = order.status?.toUpperCase() === "COTIZACION";
              const isRejected = order.status?.toUpperCase() === "PAYMENT_REJECTED";
              const statusInfo = getWorkflowStatusBadge(order.status, lang);
              const StatusIcon = statusInfo.icon;
              const serviceInfo = getServiceTypeBadge(order.serviceType);
              const ServiceIcon = serviceInfo.icon;

              let orderItems: any[] = [];
              try {
                orderItems = JSON.parse(order.itemsJson);
              } catch (e) {
                orderItems = [];
              }

              // Active step calculation
              const skipInstallationPayment = shouldSkipInstallationPayment(
                order,
                (order as any).installationCostCRC,
                (order as any).laborSubtotalCRC
              );
              const isPaidInstallation = isInstallationPaymentPaidOrConfirmed(order);
              const currentStepIndex = isQuote
                ? 1 // Cotizaciones start at step 1
                : getCustomerOrderStepIndex(order.status, order.serviceType, skipInstallationPayment, (order as any).serviceDocumentsJson, isPaidInstallation);

              // Program service check (Step 5)
              const isProgramService = !isQuote && !isRejected && order.status?.toUpperCase() !== "CONFIRM_SERVICE_PAYMENT" && (
                order.status?.toUpperCase() === "PROGRAM_SERVICE" ||
                currentStepIndex === 5
              );

              // Payment confirmation status check
              const isPaidOrBeyond = isPaymentConfirmedOrMore(order.status);
              const isPaymentStatusUpdated = Boolean(
                (order.paymentProofUrl && order.paymentProofUrl.trim().length > 0) ||
                isPaidOrBeyond ||
                order.status === "PAYMENT_CONFIRMATION" ||
                (order as any).isInstallationPaymentConfirmed
              );
              // "Proceder al Pago" only appears when payment is pending (never when payment confirmation or more)
              const canProceedToPay = !isPaidOrBeyond && !isRejected && (isQuote || order.status?.toUpperCase() === "PENDING");

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-3xl border transition-all shadow-xs overflow-hidden ${
                    isRejected
                      ? "border-rose-300 hover:border-rose-400 border-t-4 border-t-rose-600 bg-rose-50/10"
                      : isQuote
                      ? "border-purple-200 hover:border-purple-300 border-t-4 border-t-purple-600"
                      : "border-gray-200/90 hover:border-blue-300 border-t-4 border-t-[#0052CC]"
                  }`}
                >
                  {/* Differentiated Top Banner */}
                  {isRejected ? (
                    (() => {
                      const isCorrected = isRejectedPaymentCorrected(order);
                      return isCorrected ? (
                        <div className="bg-gradient-to-r from-emerald-50/90 via-emerald-50/40 to-white border-b border-emerald-100 px-6 py-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-emerald-800 font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping shrink-0" />
                            <span className="tracking-wide">
                              ● {t.orderRejectedCorrectedCustomerTitle || (lang === "es" ? "COMPROBANTE EN REVISIÓN" : "RECEIPT UNDER REVIEW")}
                            </span>
                            <span className="text-emerald-300">•</span>
                            <span className="text-[11px] text-emerald-700 font-medium">
                              {lang === "es" ? "Comprobante corregido enviado al taller" : "Corrected receipt submitted to workshop"}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono font-semibold text-emerald-700">
                            #{order.orderNumber}
                          </span>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-r from-rose-50/90 via-rose-50/40 to-white border-b border-rose-100 px-6 py-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-rose-800 font-bold">
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            <span className="tracking-wide">
                              {lang === "es" ? "PAGO RECHAZADO" : "PAYMENT REJECTED"}
                            </span>
                            <span className="text-rose-300">•</span>
                            <span className="text-[11px] text-rose-600 font-normal">
                              {lang === "es" ? "Comprobante rechazado. Requiere corrección" : "Receipt rejected. Action required"}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono font-semibold text-rose-700">
                            #{order.orderNumber}
                          </span>
                        </div>
                      );
                    })()
                  ) : isQuote ? (
                    <div className="bg-gradient-to-r from-purple-50 via-purple-50/50 to-white border-b border-purple-100 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-purple-950 font-bold">
                        <div className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                          <ClipboardList className="w-3.5 h-3.5" />
                        </div>
                        <span className="tracking-wide">
                          {lang === "es" ? "COTIZACIÓN PROFORMA" : "PROFORMA QUOTATION"}
                        </span>
                        <span className="text-purple-300 hidden sm:inline">•</span>
                        <span className="text-[11px] text-purple-700 font-normal">
                          {t.orderCotizacionStaffNotice}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-purple-800 bg-purple-100/80 px-2.5 py-0.5 rounded-full font-bold whitespace-nowrap self-start sm:self-auto border border-purple-200/80">
                        <Clock className="w-3 h-3 text-purple-600" />
                        <span>{lang === "es" ? "Vence en 60 días sin actividad" : "Expires in 60 days without activity"}</span>
                      </span>
                    </div>
                  ) : (
                    <div className={`border-b px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                      isProgramService && !(order as any).isServiceScheduled
                        ? "bg-gradient-to-r from-blue-100/70 via-blue-50/40 to-white border-blue-200"
                        : "bg-gradient-to-r from-blue-50/60 via-blue-50/20 to-white border-blue-100/60"
                    }`}>
                      <div className="flex items-center gap-2 text-[#0052CC] font-bold">
                        {isProgramService && !(order as any).isServiceScheduled ? (
                          <Calendar className="w-4 h-4 text-[#0052CC] flex-shrink-0" />
                        ) : (
                          <Package className="w-4 h-4 text-[#0052CC] flex-shrink-0" />
                        )}
                        <span className="tracking-wide">
                          {isProgramService && !(order as any).isServiceScheduled
                            ? t.orderScheduleServiceBannerTitle
                            : lang === "es"
                            ? "PEDIDO EN FIRME"
                            : "PLACED ORDER"}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-[11px] text-gray-500 font-normal">
                          {isProgramService && !(order as any).isServiceScheduled
                            ? t.orderScheduleServiceBannerSubtitle
                            : lang === "es"
                            ? "Seguimiento directo en taller"
                            : "Direct workshop tracking"}
                        </span>
                      </div>
                      {isProgramService && !(order as any).isServiceScheduled ? (
                        <Link
                          href={`/servicios?orderId=${order.id}&orderNumber=${order.orderNumber}&service=${getServiceParamFromOrder(order.serviceType)}`}
                          className="inline-flex items-center gap-1.5 font-bold text-[#0052CC] hover:underline text-xs self-start sm:self-auto bg-white px-2.5 py-1 rounded-full border border-blue-200 shadow-2xs"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{t.orderScheduleServiceBtn}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <span className="text-[11px] font-mono font-semibold text-gray-400">
                          ZxZ Performance
                        </span>
                      )}
                    </div>
                  )}

                  {/* Order Top Bar Header */}
                  <div className="p-6 sm:p-7 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/40">
                    <div className="flex flex-wrap items-center gap-3">
                      <div>
                        <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                          {isQuote
                            ? (lang === "es" ? "Cotización #" : "Quotation #")
                            : t.orderNumberLabel}
                        </span>
                        <Link
                          href={`/pedidos/${order.id}`}
                          className={`text-base sm:text-lg font-black font-mono transition-colors tracking-tight block ${
                            isRejected
                              ? "text-rose-950 hover:text-rose-700"
                              : isQuote
                              ? "text-purple-950 hover:text-purple-600"
                              : "text-gray-900 hover:text-[#0052CC]"
                          }`}
                        >
                          #{order.orderNumber}
                        </Link>
                      </div>

                      <div className="hidden sm:block h-8 w-px bg-gray-200 mx-1" />

                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>
                          {new Date(order.createdAt).toLocaleDateString(
                            lang === "es" ? "es-CR" : "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </span>
                      </div>

                      {/* Service Type Tag */}
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-medium text-gray-700 shadow-2xs">
                        <ServiceIcon className={`w-3.5 h-3.5 ${isQuote ? "text-purple-600" : "text-[#0052CC]"}`} />
                        <span>{serviceInfo.label}</span>
                      </div>
                    </div>

                    {/* Status Badge & Payment Proof Link */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {order.paymentProofUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewProofUrl(order.paymentProofUrl || null)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-gray-100 border border-gray-300 text-xs font-bold text-gray-800 shadow-2xs transition cursor-pointer"
                          title={lang === "es" ? "Ver comprobante de pago subido" : "View uploaded payment receipt"}
                        >
                          <Eye className="w-3.5 h-3.5 text-[#0052CC]" />
                          <span>{lang === "es" ? "Ver Comprobante" : "View Receipt"}</span>
                        </button>
                      )}

                      <span
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${statusInfo.bg}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Workflow Tracker / Stepper */}
                  <div className="px-6 sm:px-8 py-5 border-b border-gray-100 bg-white">
                    {!isQuote && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                          {lang === "es" ? "Estado del Flujo" : "Workflow Status"}
                        </span>
                        {/* OM-01: Bullet point for Payment Confirmation in order status tracking */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs shadow-2xs">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isPaymentStatusUpdated ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                          <span className="font-semibold text-slate-600">
                            {lang === "es" ? "Confirmación de Pago:" : "Payment Confirmation:"}
                          </span>
                          {isPaymentStatusUpdated ? (
                            <span className="font-black text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide border border-emerald-300">
                              {lang === "es" ? "Actualizado" : "Updated"}
                            </span>
                          ) : (
                            <span className="font-medium text-slate-500 text-[11px]">
                              {lang === "es" ? "Pendiente" : "Pending"}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {isQuote ? (
                      /* Quotation 3-Stage Progress */
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {COTIZACION_STAGES.map((step) => {
                          const isDone = currentStepIndex > step.stepNum;
                          const isCurrent = currentStepIndex === step.stepNum;
                          const StepIcon = step.icon;

                          return (
                            <div
                              key={step.stepNum}
                              className={`p-3.5 rounded-2xl border transition-all ${
                                isCurrent
                                  ? "bg-purple-50/70 border-purple-300 ring-1 ring-purple-200"
                                  : isDone
                                  ? "bg-purple-50/30 border-purple-100"
                                  : "bg-gray-50/50 border-gray-100 opacity-60"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <div
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                    isDone
                                      ? "bg-purple-600 text-white"
                                      : isCurrent
                                      ? "bg-purple-700 text-white ring-2 ring-purple-200"
                                      : "bg-gray-200 text-gray-500"
                                  }`}
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  ) : (
                                    <span>{step.stepNum}</span>
                                  )}
                                </div>
                                <span
                                  className={`text-[10px] font-extrabold uppercase tracking-wider truncate ${
                                    isCurrent ? "text-purple-700" : isDone ? "text-purple-900" : "text-gray-400"
                                  }`}
                                >
                                  {lang === "es" ? `Etapa ${step.stepNum}` : `Stage ${step.stepNum}`}
                                </span>
                              </div>
                              <p
                                className={`text-xs font-bold leading-tight ${
                                  isCurrent ? "text-purple-950 font-black" : isDone ? "text-purple-900" : "text-gray-400"
                                }`}
                              >
                                {lang === "es" ? step.labelEs : step.labelEn}
                              </p>
                              <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                                {lang === "es" ? step.subEs : step.subEn}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Placed Order Stepper (Progressive reveal up to Programar Servicio until scheduled) */
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-flow-col lg:auto-cols-fr gap-3">
                        {(() => {
                          const isServiceProgrammed = Boolean((order as any).isServiceScheduled || currentStepIndex > 5);
                          const stagesForOrder = getCustomerOrderStages(order.serviceType, isServiceProgrammed, skipInstallationPayment, isPaidInstallation);
                          return stagesForOrder.map((step) => {
                            const isDone = currentStepIndex > step.stepNum;
                            const isCurrent = currentStepIndex === step.stepNum;
                            const isCurrentRejected = isRejected && isCurrent;

                            return (
                              <div
                                key={step.id}
                                className={`p-3 rounded-2xl border transition-all ${
                                  isCurrentRejected
                                    ? "bg-rose-50 border-rose-300 ring-1 ring-rose-200 text-rose-950 shadow-2xs"
                                    : isCurrent
                                    ? "bg-blue-50/70 border-[#0052CC]/40 ring-1 ring-[#0052CC]/20"
                                    : isDone
                                    ? "bg-emerald-50/40 border-emerald-200/70"
                                    : "bg-gray-50/50 border-gray-100 opacity-60"
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1.5">
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                      isDone
                                        ? "bg-emerald-600 text-white"
                                        : isCurrentRejected
                                        ? "bg-rose-600 text-white animate-pulse"
                                        : isCurrent
                                        ? "bg-[#0052CC] text-white ring-2 ring-blue-200"
                                        : "bg-gray-200 text-gray-500"
                                    }`}
                                  >
                                    {isDone ? (
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    ) : (
                                      <span>{step.stepNum}</span>
                                    )}
                                  </div>
                                  <span
                                    className={`text-[10px] font-extrabold uppercase tracking-wider truncate ${
                                      isCurrentRejected
                                        ? "text-rose-700"
                                        : isCurrent
                                        ? "text-[#0052CC]"
                                        : isDone
                                        ? "text-emerald-800"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {lang === "es" ? `Paso ${step.stepNum}` : `Step ${step.stepNum}`}
                                  </span>
                                </div>
                                <p
                                  className={`text-xs font-bold leading-tight ${
                                    isCurrentRejected
                                      ? "text-rose-950 font-black"
                                      : isCurrent
                                      ? "text-gray-950 font-black"
                                      : isDone
                                      ? "text-gray-800"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {lang === "es" ? step.labelEs : step.labelEn}
                                </p>
                                <p
                                  className={`text-[10px] mt-0.5 truncate ${
                                    isCurrentRejected ? "text-rose-700 font-medium" : "text-gray-400"
                                  }`}
                                >
                                  {isCurrentRejected
                                    ? (lang === "es" ? "Comprobante rechazado" : "Receipt rejected")
                                    : (lang === "es" ? step.subEs : step.subEn)}
                                </p>
                                {step.stepNum === 1 && isPaymentStatusUpdated && !isCurrentRejected && (
                                  <span className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase tracking-wider border border-emerald-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                    <span>{lang === "es" ? "Actualizado" : "Updated"}</span>
                                  </span>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Order Items & Summary Body */}
                  <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Items Column */}
                    <div className="lg:col-span-7 space-y-3">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-3">
                        {t.ordersItemsLabel} ({orderItems.length})
                      </h3>

                      <div className="space-y-2.5">
                        {orderItems.map((item, idx) => {
                          const itemPrice = item.priceCRC || 0;
                          const qty = item.quantity || 1;
                          const lineTotal = itemPrice * qty;

                          return (
                            <div
                              key={idx}
                              className="p-3.5 rounded-2xl bg-gray-50/70 border border-gray-100 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 overflow-hidden flex-shrink-0 relative flex items-center justify-center">
                                  {item.imageUrl ? (
                                    <Image
                                      src={item.imageUrl}
                                      alt={item.title || "Item"}
                                      fill
                                      className="object-contain p-1"
                                    />
                                  ) : (
                                    <Package className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-xs font-bold text-gray-900 truncate">
                                    {item.title}
                                  </h4>
                                  <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                                    <span className="font-mono">Cant: {qty}</span>
                                    {item.withInstallation && (
                                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded text-[10px] font-semibold">
                                        + {lang === "es" ? "Instalación" : "Installation"}
                                      </span>
                                    )}
                                  </div>
                                  {order.status?.toUpperCase() === "COMPLETED" && (item.id || item.slug) && (
                                    <div className="mt-2">
                                      <Link
                                        href={
                                          item.type === "combo"
                                            ? `/combos/${item.slug || item.id}#reviews-section`
                                            : `/productos/${item.slug || item.id}#reviews-section`
                                        }
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-bold transition-all shadow-2xs"
                                      >
                                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                        <span>{t.orderLeaveReviewBtn}</span>
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="text-right flex-shrink-0">
                                <span className="text-xs font-bold font-mono text-gray-900 block">
                                  {formatOrderPrice(lineTotal, order)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Notes / Shipping address if any */}
                      {(order.shippingAddress || order.notes) && (
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 space-y-1 mt-3">
                          {order.shippingAddress && (
                            <p>
                              <strong className="text-gray-800">
                                {lang === "es" ? "Dirección:" : "Address:"}
                              </strong>{" "}
                              {order.shippingAddress}
                            </p>
                          )}
                          {order.notes && (
                            <p>
                              <strong className="text-gray-800">
                                {lang === "es" ? "Notas:" : "Notes:"}
                              </strong>{" "}
                              {order.notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Financial Summary & Actions Column */}
                    <div className="lg:col-span-5 bg-gray-50/70 rounded-2xl p-5 border border-gray-100 flex flex-col justify-between space-y-5">
                      <div className="space-y-3">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                          {t.ordersSummaryLabel}
                        </h3>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between text-gray-600">
                            <span>{t.cartPartsSubtotal}</span>
                            <span className="font-mono font-bold text-gray-900">
                              {formatOrderPrice(order.partsSubtotalCRC || order.totalCRC, order)}
                            </span>
                          </div>

                          {/* Discount Line */}
                          {(() => {
                            const disc = typeof (order as any).discountCRC === "number" && (order as any).discountCRC > 0
                              ? (order as any).discountCRC
                              : 0;
                            if (disc > 0) {
                              return (
                                <div className="flex justify-between text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg font-medium">
                                  <span>{t.orderDiscountApplied || "Descuento:"}</span>
                                  <span className="font-mono font-bold">
                                    -{formatOrderPrice(disc, order)}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {/* Factura Electrónica Line (IVA 13% incluido) */}
                          {Boolean((order as any).requiresElectronicInvoice || ((order as any).taxCRC && (order as any).taxCRC > 0)) && (
                            <div className="flex justify-between text-[#0052CC] bg-blue-50 px-2 py-1 rounded-lg font-medium">
                              <span>{t.orderFacturaTaxLabel || "IVA 13% (incluido):"}</span>
                              <span className="font-mono font-bold">
                                {formatOrderPrice((order as any).taxCRC || Math.round(((order.partsSubtotalCRC || 0) * (13 / 113))), order)}
                              </span>
                            </div>
                          )}

                          <div className="pt-2 border-t border-gray-200/80 flex justify-between items-baseline">
                            <span className="text-sm font-extrabold text-gray-900">
                              {t.orderTotalLabel}
                            </span>
                            <span
                              className={`text-xl font-black font-mono ${
                                isRejected
                                  ? "text-rose-600"
                                  : isQuote
                                  ? "text-purple-700"
                                  : "text-[#0052CC]"
                              }`}
                            >
                              {formatOrderPrice(order.totalCRC, order)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2 pt-2">
                        <Link
                          href={`/pedidos/${order.id}`}
                          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-2xs ${
                            isRejected
                              ? "bg-rose-900 hover:bg-rose-950"
                              : isQuote
                              ? "bg-purple-700 hover:bg-purple-800"
                              : "bg-[#111827] hover:bg-[#0052CC]"
                          }`}
                        >
                          <span>{t.orderViewDetailsBtn}</span>
                          <ChevronRight className="w-4 h-4" />
                        </Link>

                        {/* Programar Servicio: shown when order is in 'programar servicio' step (Step 5) */}
                        {isProgramService && (
                          <Link
                            href={`/servicios?orderId=${order.id}&orderNumber=${order.orderNumber}&service=${getServiceParamFromOrder(order.serviceType)}`}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0052CC] hover:bg-[#0043A6] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg ring-2 ring-blue-300"
                          >
                            <Calendar className="w-4 h-4" />
                            <span>
                              {(order as any).isServiceScheduled
                                ? t.orderRescheduleServiceBtn
                                : t.orderScheduleServiceBtn}
                            </span>
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        )}

                        {/* Pagar Instalación: shown when order is ready to pay installation in order preview */}
                        {(() => {
                          const s = (order.status || "").toUpperCase();
                          const installCost = getOrderPendingInstallationCost(order) || order.laborSubtotalCRC || 0;
                          const isPending = !order.isInstallationPaymentConfirmed;
                          const isReadyForInstallationPayment =
                            installCost > 0 &&
                            isPending &&
                            !order.installationPaymentProofUrl &&
                            isOrderInInstallationPaymentStage(s);

                          if (!isReadyForInstallationPayment) return null;

                          return (
                            <Link
                              href={`/pedidos/${order.id}/pagar-instalacion`}
                              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg ring-2 ring-purple-300"
                            >
                              <CreditCard className="w-4 h-4" />
                              <span>{lang === "es" ? "Pagar Instalación" : "Pay Installation"}</span>
                              <span className="font-mono text-[11px] bg-purple-900/60 px-2 py-0.5 rounded-full ml-1">
                                {formatOrderPrice(installCost, order)}
                              </span>
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          );
                        })()}

                        {/* Corregir Pago: ONLY shown when status is PAYMENT_REJECTED */}
                        {isRejected && (
                          <Link
                            href={`/pedidos/${order.id}?action=pay`}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-2xs"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>{lang === "es" ? "Corregir Pago" : "Fix Payment"}</span>
                          </Link>
                        )}

                        {/* Proceder al Pago: ONLY shown when payment is pending, NEVER when confirmed or more */}
                        {canProceedToPay && (
                          <Link
                            href={`/pedidos/${order.id}?action=pay`}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0052CC] hover:bg-[#0043A6] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-2xs"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>{t.orderProceedToPay}</span>
                          </Link>
                        )}

                        {/* Reassuring badge when payment is already submitted or confirmed */}
                        {isPaidOrBeyond && !isRejected && (
                          <div className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-50/80 border border-blue-200/80 text-blue-900 text-xs font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-[#0052CC] flex-shrink-0" />
                            <span>
                              {order.status?.toUpperCase() === "PAYMENT_CONFIRMATION"
                                ? (lang === "es" ? "Comprobante en verificación" : "Receipt in verification")
                                : (lang === "es" ? "Pago confirmado • En gestión técnica" : "Payment confirmed • In workshop process")}
                            </span>
                          </div>
                        )}

                        <a
                          href={getWhatsAppUrl(
                            `¡Hola ZxZ Mods! Quiero consultar sobre el estado de mi ${
                              isQuote ? "cotización" : "pedido"
                            } #${order.orderNumber}`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-2xs"
                        >
                          <MessageCircle className="w-4 h-4 fill-black" />
                          <span>{t.ordersContactWhatsApp}</span>
                        </a>

                        {order.serviceType === "STORE_PICKUP" && (
                          <Link
                            href="/ubicacion"
                            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold transition-colors"
                          >
                            <MapPin className="w-3.5 h-3.5 text-[#0052CC]" />
                            <span>
                              {lang === "es"
                                ? "Ver Ubicación del Taller"
                                : "View Workshop Location"}
                            </span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Fullscreen Proof Modal for Client in Orders List */}
      {previewProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setPreviewProofUrl(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-2xl w-full p-5 shadow-2xl border border-gray-200 z-10 space-y-4 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="font-bold text-xs text-gray-900">
                {lang === "es" ? "Comprobante de Pago Adjunto" : "Attached Payment Receipt"}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                  title={lang === "es" ? "Abrir en nueva pestaña" : "Open in new tab"}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewProofUrl(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 bg-gray-950 rounded-2xl p-2 flex items-center justify-center overflow-auto border border-gray-800">
              <img
                src={previewProofUrl}
                alt="Comprobante"
                className="max-h-[65vh] max-w-full object-contain rounded-lg"
              />
            </div>
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
