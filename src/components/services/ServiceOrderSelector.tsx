"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PackageCheck,
  CheckCircle2,
  Clock,
  Search,
  LogIn,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  ShoppingBag,
} from "lucide-react";
import { useAuth, UserOrder } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface ServiceOrderSelectorProps {
  selectedOrders?: UserOrder[];
  onToggleOrder?: (order: UserOrder) => void;
  onClearOrders?: () => void;
  selectedService?: string;
  selectedOrder?: UserOrder | null;
  onSelectOrder?: (order: UserOrder | null) => void;
  ineligibleHomeInstallKeys?: string[];
  isOrderIneligibleForHomeInstall?: (order: UserOrder) => boolean;
}

export function ServiceOrderSelector({
  selectedOrders: propSelectedOrders,
  onToggleOrder,
  onClearOrders,
  selectedService = "delivery",
  selectedOrder,
  onSelectOrder,
  ineligibleHomeInstallKeys,
  isOrderIneligibleForHomeInstall: propIsOrderIneligible,
}: ServiceOrderSelectorProps) {
  const { user, orders, openAuthModal } = useAuth();
  const { lang, t } = useLanguage();

  const [searchOrderNumber, setSearchOrderNumber] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Normalize selected orders array
  const activeOrders: UserOrder[] =
    propSelectedOrders !== undefined
      ? propSelectedOrders
      : selectedOrder
      ? [selectedOrder]
      : [];

  const isMultiOrderAllowed =
    selectedService === "delivery" || selectedService === "shop_installation";

  // Helper to determine if an order cannot be selected due to pending installation, in-progress installation, or already in service payment confirmation
  const getOrderServiceBlockReason = (ord: UserOrder): string | null => {
    const s = (ord.status || "").toUpperCase();
    if (s === "CONFIRM_SERVICE_PAYMENT") {
      return (
        t.serviceOrderAlreadyInConfirmation ||
        (lang === "es"
          ? "Esta orden ya se encuentra en confirmación de pago de servicio. No se puede seleccionar para otro servicio."
          : "This order is already in service payment confirmation. It cannot be selected for another service.")
      );
    }
    if (s === "INSTALLING" && (selectedService === "pickup" || selectedService === "delivery")) {
      return lang === "es"
        ? "Vehículo en proceso de instalación técnica. La entrega se programará una vez finalizada."
        : "Vehicle under technical installation. Delivery can be scheduled once completed.";
    }
    if (s === "READY_TO_SET_RETURN_DATE" && !ord.isInstallationPaymentConfirmed) {
      return lang === "es"
        ? "Pago de mano de obra de instalación pendiente. Debe cancelar la instalación antes de coordinar la entrega."
        : "Installation payment pending. Labor fee must be paid before scheduling return delivery.";
    }
    return null;
  };

  const handleOrderClick = (ord: UserOrder) => {
    const blockReason = getOrderServiceBlockReason(ord);
    if (blockReason) {
      setSearchError(blockReason);
      return;
    }

    if (onToggleOrder) {
      onToggleOrder(ord);
    } else if (onSelectOrder) {
      // Toggle logic for single-order fallback
      if (selectedOrder?.id === ord.id) {
        onSelectOrder(null);
      } else {
        onSelectOrder(ord);
      }
    }
  };

  // User Rule: Transport service can ONLY be selected AFTER payment confirmation
  const isAfterPaymentConfirmation = (status: string) => {
    const s = (status || "").toUpperCase();
    return [
      "NEED_TO_GET_ORDER",
      "SHIPPING_IN_US",
      "SHIPPING_TO_CR",
      "IN_COSTA_RICA",
      "IN_WAREHOUSE_CHECK",
      "PROGRAM_SERVICE",
      "WAITING_ON_DELIVERY",
      "PICKUP_DATE_SET",
      "INSTALLING",
      "READY_TO_SET_RETURN_DATE",
      "HOME_INSTALL_SET",
      "READY_FOR_PICKUP",
      "READY_TO_PICK_UP",
      "READY_FOR_INSTALL",
      "COMPLETED",
      "PAID",
      "CONFIRMED",
    ].includes(s);
  };

  // Filter qualifying orders (must be after payment confirmation and not cancelled)
  const qualifyingOrders = orders.filter(
    (o) =>
      o.status !== "CANCELLED" &&
      o.status !== "cancelado" &&
      isAfterPaymentConfirmation(o.status)
  );

  // Handle guest / direct order search
  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchOrderNumber.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(query)}`);
      const json = await res.json();
      if (res.ok && json.success && json.order) {
        if ((json.order.status || "").toUpperCase() === "CONFIRM_SERVICE_PAYMENT") {
          setSearchError(
            t.serviceOrderAlreadyInConfirmation ||
              (lang === "es"
                ? "Esta orden ya se encuentra en confirmación de pago de servicio. No se puede seleccionar para otro servicio."
                : "This order is already in service payment confirmation. It cannot be selected for another service.")
          );
          return;
        }
        if (!isAfterPaymentConfirmation(json.order.status)) {
          setSearchError(
            lang === "es"
              ? "El servicio de transporte solo puede seleccionarse después de la confirmación de pago de la orden."
              : "Transport service can only be scheduled after payment confirmation."
          );
          return;
        }
        handleOrderClick(json.order);
        setSearchError(null);
      } else {
        setSearchError(
          json.error || (lang === "es" ? "Orden no encontrada" : "Order not found")
        );
      }
    } catch (err) {
      console.error("Error searching order:", err);
      setSearchError(lang === "es" ? "Error al buscar la orden" : "Search error");
    } finally {
      setIsSearching(false);
    }
  };

  const parseItemSummary = (itemsJson: string): string => {
    try {
      const parsed = JSON.parse(itemsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return (
          parsed
            .slice(0, 2)
            .map((i: any) => i.name || i.title || "Producto")
            .join(", ") + (parsed.length > 2 ? ` (+${parsed.length - 2})` : "")
        );
      }
    } catch {}
    return lang === "es" ? "Servicio / Repuestos ZxZ" : "ZxZ Parts & Upgrades";
  };

  const checkOrderIneligible = (ord: UserOrder): boolean => {
    if (propIsOrderIneligible) return propIsOrderIneligible(ord);
    if (!ord.itemsJson) return false;
    try {
      const items = JSON.parse(ord.itemsJson);
      if (Array.isArray(items)) {
        const keys = ineligibleHomeInstallKeys || [];
        return items.some((item: any) => {
          if (item.homeInstallation === false) return true;
          if (item.homeInstallationAvailable === false) return true;
          if (item.inHome_install === false) return true;
          if (item.inHomeInstallEligible === false) return true;
          if (item.id && keys.includes(item.id)) return true;
          if (item.sku && keys.includes(item.sku)) return true;
          return false;
        });
      }
    } catch {}
    return false;
  };

  return (
    <div className="w-full rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">
              {t.serviceOrdersTitle}
            </h2>
            <p className="text-[11px] text-gray-500">
              {isMultiOrderAllowed
                ? t.serviceOrdersMultiAllowed
                : t.serviceOrdersSingleOnly}
            </p>
          </div>
        </div>

        {/* Selected Orders Badges with De-selection controls */}
        {activeOrders.length === 1 && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {t.serviceOrdersSelectedOrder}: #{activeOrders[0].orderNumber}
            </span>
            <button
              type="button"
              onClick={() => handleOrderClick(activeOrders[0])}
              className="text-[10px] text-red-600 hover:text-red-800 font-bold underline ml-1"
              title={t.serviceOrdersDeselect}
            >
              {t.serviceOrdersDeselect}
            </button>
          </div>
        )}

        {activeOrders.length > 1 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold self-start sm:self-auto flex-wrap">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              {activeOrders.length} {t.serviceMultipleOrdersCount}:
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {activeOrders.map((ord) => (
                <span
                  key={ord.id}
                  className="inline-flex items-center gap-1 bg-white border border-emerald-300 rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-900"
                >
                  #{ord.orderNumber}
                  <button
                    type="button"
                    onClick={() => handleOrderClick(ord)}
                    className="text-red-500 hover:text-red-700 ml-0.5 font-sans font-black"
                    title={t.serviceOrdersDeselect}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            {onClearOrders && (
              <button
                type="button"
                onClick={onClearOrders}
                className="text-[10px] text-red-600 hover:text-red-800 font-bold underline ml-1"
              >
                {t.serviceOrdersDeselectAll}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Orders List or Auth Prompt */}
      {user ? (
        qualifyingOrders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {qualifyingOrders.map((ord) => {
              const isSelected = activeOrders.some((o) => o.id === ord.id);
              const isIneligible = checkOrderIneligible(ord);
              const blockReason = getOrderServiceBlockReason(ord);
              const isBlocked = Boolean(blockReason);
              const dateStr = new Date(ord.createdAt).toLocaleDateString(
                lang === "es" ? "es-CR" : "en-US",
                { day: "numeric", month: "short", year: "numeric" }
              );

              return (
                <div
                  key={ord.id}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2 ${
                    isBlocked
                      ? "bg-slate-100/90 border-slate-300/80 opacity-90 shadow-2xs"
                      : isSelected
                      ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500/30 cursor-pointer"
                      : "bg-gray-50/70 border-gray-200 hover:border-gray-300 hover:bg-gray-100/60 cursor-pointer"
                  }`}
                  onClick={() => !isBlocked && handleOrderClick(ord)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                            isBlocked
                              ? "text-slate-600"
                              : isSelected
                              ? "text-red-400"
                              : "text-[#C02030]"
                          }`}
                        >
                          #{ord.orderNumber}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-mono text-emerald-400 font-bold">
                            ✓ {lang === "es" ? "Lista" : "Ready"}
                          </span>
                        )}
                        {isIneligible && !isBlocked && (
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                              isSelected
                                ? "bg-amber-400/20 text-amber-300 border-amber-400/30"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                            title={t.serviceHomeInstallIneligibleReason}
                          >
                            {t.serviceHomeInstallOrderTag}
                          </span>
                        )}
                        {isBlocked && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1">
                            <AlertCircle className="w-2.5 h-2.5 text-purple-700" />
                            <span>
                              {ord.status === "CONFIRM_SERVICE_PAYMENT"
                                ? (lang === "es" ? "Pago Servicio en Revisión" : "Service Payment Under Review")
                                : ord.status === "INSTALLING"
                                ? (lang === "es" ? "En Instalación" : "Installing")
                                : (lang === "es" ? "Pago Instalación Pendiente" : "Install Payment Pending")}
                            </span>
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs font-bold line-clamp-1 mt-0.5 ${
                          isSelected ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {parseItemSummary(ord.itemsJson)}
                      </p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isBlocked
                          ? "border-slate-300 bg-slate-200 text-slate-500"
                          : isSelected
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                    </div>
                  </div>

                  {/* Block Reason & Link to Pay Installation */}
                  {isBlocked && (
                    <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-[10.5px] text-purple-950 space-y-1">
                      <p className="leading-tight">{blockReason}</p>
                      {ord.status === "READY_TO_SET_RETURN_DATE" && !ord.isInstallationPaymentConfirmed && (
                        <Link
                          href={`/pedidos/${ord.id}/pagar-instalacion`}
                          className="inline-flex items-center gap-1 text-[10px] font-extrabold text-purple-800 hover:text-purple-950 underline pt-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>{lang === "es" ? "Pagar instalación aquí →" : "Pay installation here →"}</span>
                        </Link>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-200/40">
                    <span className={isSelected ? "text-slate-400" : "text-gray-400"}>
                      {dateStr}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-mono font-bold ${
                          isSelected ? "text-white" : "text-gray-900"
                        }`}
                      >
                        ₡{ord.totalCRC.toLocaleString("es-CR")}
                      </span>
                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrderClick(ord);
                          }}
                          className="text-[9px] text-red-300 hover:text-white underline"
                        >
                          {t.serviceOrdersDeselect}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-gray-400" />
              <span>{t.serviceOrdersNoneFound}</span>
            </div>
            <Link
              href="/combos"
              className="px-3.5 py-1.5 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-xs self-start sm:self-auto transition"
            >
              {lang === "es" ? "Explorar Combos" : "Explore Combos"}
            </Link>
          </div>
        )
      ) : (
        /* Guest & Unauthenticated View */
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-bold text-gray-800">
              {t.serviceOrdersLoginPrompt}
            </p>
            <p className="text-[11px] text-gray-500">
              {t.serviceOrdersRequiredNotice}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search by Order Number Form */}
            <form onSubmit={handleSearchOrder} className="flex items-center gap-1.5">
              <input
                type="text"
                value={searchOrderNumber}
                onChange={(e) => setSearchOrderNumber(e.target.value)}
                placeholder={t.serviceOrdersSearchPlaceholder}
                className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono uppercase text-gray-900 focus:outline-none focus:border-black w-36 sm:w-40"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-3 py-2 rounded-xl bg-black hover:bg-gray-800 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {isSearching ? "..." : t.serviceOrdersSearchBtn}
              </button>
            </form>

            <span className="text-xs text-gray-400 text-center sm:text-left">{lang === "es" ? "o" : "or"}</span>

            {/* Login Modal Button */}
            <button
              type="button"
              onClick={() => openAuthModal("Inicia sesión para vincular tu orden")}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-xs font-bold text-gray-800 transition shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5 text-[#C02030]" />
              <span>{lang === "es" ? "Iniciar Sesión" : "Sign In"}</span>
            </button>
          </div>
        </div>
      )}

      {searchError && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{searchError}</span>
        </div>
      )}
    </div>
  );
}
