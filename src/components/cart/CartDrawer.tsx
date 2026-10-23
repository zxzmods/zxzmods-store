"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useGarage } from "@/context/GarageContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatCRC, formatUSD } from "@/lib/i18n";
import {
  X,
  Trash2,
  Wrench,
  Percent,
  MessageCircle,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Home,
  FileText,
  Calendar,
  AlertTriangle,
  CreditCard,
  Landmark,
} from "lucide-react";

export function CartDrawer() {
  const {
    items,
    isOpen,
    setIsOpen,
    removeItem,
    toggleInstallation,
    updateQuantity,
    lastAddedItem,
    clearLastAddedItem,
    currency,
    setCurrency,
    sellRate,
    exchangeRate,
    isRateLoading,
    partsSubtotal,
    laborSubtotal,
    installedItemCount,
    finalLaborSubtotal,
    totalCRC,
    partsSubtotalUSD,
    laborSubtotalUSD,
    finalLaborSubtotalUSD,
    totalUSD,
    formatPrice,
    generateWhatsAppLink,
    createOrderFromCart,
    activeQuotation,
    createQuotationOrder,
    createBacCompraClickOrder,
  } = useCart();
  const { vehicle } = useGarage();
  const { lang, t } = useLanguage();
  const router = useRouter();
  const [itemPendingRemoval, setItemPendingRemoval] = useState<any>(null);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [submittingBac, setSubmittingBac] = useState(false);

  const getItemUrl = (item: { type?: string; id?: string; sku?: string }) => {
    if (item.type === "COMBO") {
      return `/combos/${(item.id || "").replace("combo-", "")}`;
    }
    if (item.type === "PACKAGE") {
      return `/performance`;
    }
    return `/productos/${item.sku || item.id || ""}`;
  };

  const handleItemClick = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    const targetUrl = getItemUrl(item);
    router.push(targetUrl);
  };

  if (!isOpen) return null;

  const vehicleLabel = vehicle
    ? `${vehicle.year} ${vehicle.brandName} ${vehicle.modelName}`
    : undefined;

  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in transition-all">
      {/* Backdrop click to close */}
      <div
        className="fixed inset-0"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md bg-white border-l border-gray-200 text-[#1A1A1D] flex flex-col h-full shadow-2xl z-10">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base sm:text-lg font-bold tracking-tight text-[#111827]">
              {t.cartTitle}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200 text-gray-700 font-semibold">
              {totalQuantity}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Currency Pill Switcher: Colones vs Dólares */}
            <div className="flex items-center rounded-lg bg-gray-100 p-0.5 border border-gray-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCurrency("CRC")}
                className={`px-2 py-1 rounded-md transition-all ${
                  currency === "CRC"
                    ? "bg-white text-[#C02030] shadow-sm font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                title={lang === "es" ? "Mostrar precios en Colones costarricenses (₡)" : "Show prices in Costa Rican Colones (₡)"}
              >
                ₡ CRC
              </button>
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`px-2 py-1 rounded-md transition-all ${
                  currency === "USD"
                    ? "bg-white text-[#C02030] shadow-sm font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                title={lang === "es" ? "Mostrar precios en Dólares americanos ($)" : "Show prices in US Dollars ($)"}
              >
                $ USD
              </button>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-black p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={t.ariaCloseCart}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live USD Sell Exchange Rate Bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-5 py-2 flex items-center justify-between text-[11px] text-gray-600">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{t.cartLiveRateLabel}</span>
            <span className="font-mono font-bold text-gray-900">
              ₡{sellRate.toFixed(2)}
            </span>
          </div>
          <span className="text-[10px] text-gray-500 font-medium">
            {exchangeRate?.source || "Oficial BCCR"}
          </span>
        </div>

        {/* 
          NEWLY ADDED PRODUCT NOTIFICATION CARD (Highlighted callout when user adds an item)
        */}
        {lastAddedItem && (
          <div className="bg-emerald-50/90 border-b border-emerald-200 p-4 transition-all animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{t.cartProductAddedTitle}</span>
              </span>
              <button
                onClick={clearLastAddedItem}
                className="text-emerald-700/60 hover:text-emerald-900 text-xs p-0.5"
                title="Ocultar aviso"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div
              onClick={(e) => handleItemClick(e, lastAddedItem)}
              className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-2.5 border border-emerald-200/70 cursor-pointer hover:border-emerald-400 group transition-all"
            >
              <div
                className="relative w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-200 flex-shrink-0 group-hover:opacity-90 transition-opacity"
                title={lastAddedItem.title}
              >
                <Image
                  src={lastAddedItem.imageUrl || "/images/logo.png"}
                  alt={lastAddedItem.title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div
                  className="text-xs font-bold text-[#111827] truncate block group-hover:text-[#C02030] transition-colors cursor-pointer"
                >
                  {lastAddedItem.title}
                </div>
                {lastAddedItem.selectedParameters && lastAddedItem.selectedParameters.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {lastAddedItem.selectedParameters.map((p, idx) => (
                      <span key={idx} className="text-[10px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                        <strong className="text-gray-900">{p.parameterName}:</strong> {p.optionLabel}
                        {p.priceDeltaCRC !== 0 && (
                          <span className="text-[#C02030] ml-1 font-mono">
                            ({p.priceDeltaCRC > 0 ? `+${formatPrice(p.priceDeltaCRC)}` : `-${formatPrice(Math.abs(p.priceDeltaCRC))}`})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono font-bold text-[#C02030]">
                    {formatPrice(lastAddedItem.priceCRC)}
                  </span>
                  {lastAddedItem.withInstallation && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                      <Wrench className="w-2.5 h-2.5" />
                      <span>
                        {lastAddedItem.freeInstallation || lastAddedItem.installationPriceCRC === 0
                          ? (lastAddedItem.type === "COMBO" ? t.comboInstallationBadge : t.cartItemFreeInstallation)
                          : (lang === "es" ? "Con taller" : "With workshop")}
                      </span>
                    </span>
                  )}
                  {lastAddedItem.supplierStockStatus === "PRE_ORDER" && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded">
                      <Calendar className="w-2.5 h-2.5" />
                      <span>{t.supplierCartPreOrderChip}</span>
                    </span>
                  )}
                  {(lastAddedItem.supplierStockStatus === "OUT_OF_STOCK" || lastAddedItem.supplierStockStatus === "UNAVAILABLE") && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100/80 px-1.5 py-0.5 rounded">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>{t.supplierCartOutOfStockChip}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {/* Active Quotation Banner */}
          {activeQuotation && String(activeQuotation.status || "").toUpperCase() === "COTIZACION" && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <div className="truncate">
                  <span className="font-bold text-amber-900 block truncate">
                    Cotización #{activeQuotation.orderNumber}
                  </span>
                  <span className="text-[10px] text-amber-700">En revisión / Editable</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push(`/pedidos/${activeQuotation.id}`);
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] whitespace-nowrap cursor-pointer transition-colors"
              >
                Ver Detalle
              </button>
            </div>
          )}

          {/* Out of stock US Supplier warning banner */}
          {items.some((i) => i.supplierStockStatus === "OUT_OF_STOCK" || i.supplierStockStatus === "UNAVAILABLE") && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-900 shadow-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-snug">
                <span className="font-bold text-rose-950 block">{t.supplierStockOutOfStock}</span>
                <span className="text-[11px] text-rose-800">{t.supplierCartOutOfStockWarning}</span>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-500 font-medium">
                {t.cartEmpty}
              </p>
              <Link
                href="/productos"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C02030] text-white text-xs font-bold hover:bg-[#9A1624] transition-colors"
              >
                <span>{t.cartContinueShopping}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.id}-${item.withInstallation}`}
                className="bg-[#F8F9FA] border border-gray-200 rounded-2xl p-3.5 flex flex-col gap-2.5 transition-all hover:border-gray-300"
              >
                <div
                  onClick={(e) => handleItemClick(e, item)}
                  className="flex gap-3 cursor-pointer group"
                >
                  <div
                    className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-200 flex-shrink-0 group-hover:opacity-90 transition-opacity block cursor-pointer"
                    title={item.title}
                  >
                    <Image
                      src={item.imageUrl || "/images/logo.png"}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-bold text-[#111827] truncate block group-hover:text-[#C02030] transition-colors cursor-pointer"
                    >
                      {item.title}
                    </div>

                    {/* Configurable Parameters Badges */}
                    {item.selectedParameters && item.selectedParameters.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.selectedParameters.map((p, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200"
                          >
                            <span className="font-semibold text-gray-900">{p.parameterName}:</span>&nbsp;{p.optionLabel}
                            {p.priceDeltaCRC !== 0 && (
                              <span className="ml-1 text-[#C02030] font-mono font-semibold">
                                ({p.priceDeltaCRC > 0 ? `+${formatPrice(p.priceDeltaCRC)}` : `-${formatPrice(Math.abs(p.priceDeltaCRC))}`})
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Live US Supplier Availability Chip */}
                    {item.supplierStockStatus && (
                      <div className="flex items-center gap-1.5 my-1">
                        {item.supplierStockStatus === "PRE_ORDER" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                            <Calendar className="w-2.5 h-2.5 text-blue-600" />
                            <span>{t.supplierCartPreOrderChip}</span>
                          </span>
                        ) : item.supplierStockStatus === "OUT_OF_STOCK" || item.supplierStockStatus === "UNAVAILABLE" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                            <span>{t.supplierCartOutOfStockChip}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>
                              {t.supplierCartInStockChip
                                .replace("{min}", String(item.supplierLeadDaysMin || 7))
                                .replace("{max}", String(item.supplierLeadDaysMax || 12))}
                            </span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Price in active currency */}
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-xs text-[#C02030] font-mono font-bold">
                        {formatPrice(item.priceCRC)}
                      </span>
                      {currency === "USD" && (
                        <span className="text-[10px] text-gray-400 font-mono">
                          (₡{formatCRC(item.priceCRC)})
                        </span>
                      )}
                    </div>

                    {/* Quantity controls */}
                    <div
                      className="flex items-center gap-2 mt-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center border border-gray-300 rounded-lg bg-white shadow-sm">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.quantity === 1) {
                              setItemPendingRemoval(item);
                            } else {
                              updateQuantity(item.id, item.quantity - 1);
                            }
                          }}
                          className="p-1 hover:text-black text-gray-500 cursor-pointer"
                          aria-label={t.ariaDecreaseQty}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-mono font-bold text-gray-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, item.quantity + 1);
                          }}
                          className="p-1 hover:text-black text-gray-500"
                          aria-label={t.ariaIncreaseQty}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.id);
                        }}
                        className="text-gray-400 hover:text-red-600 p-1 transition-colors ml-auto"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Installation Indicator / Selector & Home Installation Tag (Side to Side) */}
                <div
                  className="flex items-center justify-between gap-2 pt-1 border-t border-gray-200/60"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.freeInstallation || item.installationPriceCRC === 0 || item.type === "COMBO" ? (
                    <div
                      className="flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs select-none"
                      title={lang === "es" ? "Instalación gratis incluida con la pieza" : "Free installation included with item"}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Wrench className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                        <span className="truncate">{lang === "es" ? "Instalación" : "Installation"}</span>
                      </span>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded ml-1.5 flex-shrink-0">
                        {item.type === "COMBO" ? t.comboInstallationIncluded : (lang === "es" ? "Gratis" : "Free")}
                      </span>
                    </div>
                  ) : (
                    <div
                      className="flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 select-none"
                      title={lang === "es" ? "La instalación se selecciona y cancela en el agendamiento de servicios" : "Installation is chosen and paid during service booking"}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <Wrench className="w-3.5 h-3.5 flex-shrink-0 text-[#0052CC]" />
                        <span className="truncate text-[11px] text-slate-700 font-medium">
                          {t.cartItemPaidInServices}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* House Icon: Green or Red based on eligibility with hover popup tooltip */}
                  <div className="relative group inline-flex items-center justify-center flex-shrink-0">
                    <div
                      tabIndex={0}
                      role="note"
                      aria-label={
                        item.homeInstallation !== false
                          ? t.cartHomeInstallationEligible
                          : t.cartHomeInstallationIneligible
                      }
                      className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all cursor-help ${
                        item.homeInstallation !== false
                          ? "bg-emerald-50 border-emerald-300 text-emerald-600 hover:bg-emerald-100"
                          : "bg-rose-50 border-rose-300 text-rose-600 hover:bg-rose-100"
                      }`}
                    >
                      <Home className="w-3.5 h-3.5" />
                    </div>

                    {/* Hover popup tooltip */}
                    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex group-focus-within:flex flex-col items-end z-30 pointer-events-none transition-all duration-200">
                      <div className="bg-gray-900 text-white text-[11px] font-semibold py-1.5 px-2.5 rounded-xl shadow-xl whitespace-nowrap border border-gray-700/60 flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.homeInstallation !== false ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                        />
                        <span>
                          {item.homeInstallation !== false
                            ? t.cartHomeInstallationEligible
                            : t.cartHomeInstallationIneligible}
                        </span>
                      </div>
                      <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1 mr-2.5 border-r border-b border-gray-700/60" />
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer & Totals */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-gray-200 bg-[#FAFAFC] space-y-3">
            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>{t.cartPartsSubtotal} <span className="text-[10px] text-gray-500 font-semibold">({lang === "es" ? "IVA incluido" : "VAT included"})</span></span>
                <span className="font-mono font-semibold text-gray-900">
                  {formatPrice(partsSubtotal)}
                </span>
              </div>

              {items.some((i) => i.withInstallation) && (
                <div className="flex justify-between text-xs text-gray-600 bg-gray-100/70 p-2 rounded-xl">
                  <span className="flex items-center gap-1 font-medium">
                    <Wrench className="w-3.5 h-3.5 text-[#C02030]" />
                    <span>{lang === "es" ? "Instalación:" : "Installation:"}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-[#C02030]">
                    {lang === "es" ? "Se abona en Servicios" : "Billed in Services"}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-base font-extrabold text-[#111827] pt-2 border-t border-gray-200">
                <span>{t.cartTotal}</span>
                <div className="text-right">
                  <div className="font-mono text-[#C02030]">
                    {formatPrice(partsSubtotal)}
                  </div>
                  {currency === "USD" ? (
                    <div className="text-[11px] text-gray-500 font-mono font-normal">
                      ≈ ₡{formatCRC(partsSubtotal)}
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-500 font-mono font-normal">
                      ≈ ${formatUSD(partsSubtotalUSD)} USD
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Minimalist Home Installation Badge in Checkout */}
            {items.some((i) => i.withInstallation && i.homeInstallation !== false) && (
              <div className="px-3 py-2 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
                <Home className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="text-[11px] font-semibold flex-1 leading-tight">
                  {lang === "es"
                    ? "Instalación a domicilio disponible"
                    : "Home installation available"}
                </span>
              </div>
            )}

            {/* CTAs: Primary Checkout (Transfer) + Secondary BAC & WhatsApp */}
            <div className="space-y-2 pt-1">
              <Link
                href="/carrito"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-between py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#D32335] via-[#C02030] to-[#9E1422] hover:from-[#E02639] hover:to-[#B01A28] text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-red-600/30 hover:shadow-red-600/40 hover:-translate-y-0.5 transition-all group border border-red-400/30"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/20 border border-white/25 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                    <Landmark className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-black tracking-wide text-white">{t.cartCheckout}</span>
                </div>
                <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center group-hover:translate-x-1 group-hover:bg-white/20 transition flex-shrink-0">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>
              </Link>

              <button
                type="button"
                onClick={async () => {
                  setSubmittingBac(true);
                  try {
                    const res = await createBacCompraClickOrder(vehicleLabel);
                    if (res.success && res.order) {
                      if (res.waUrl) {
                        window.open(res.waUrl, "_blank", "noopener,noreferrer");
                      }
                      setIsOpen(false);
                      const targetUrl = res.order.claimToken
                        ? `/pedidos/${res.order.id}?token=${res.order.claimToken}`
                        : `/pedidos/${res.order.id}`;
                      router.push(targetUrl);
                    }
                  } catch (err) {
                    console.error("Error creating BAC order in CartDrawer:", err);
                  } finally {
                    setSubmittingBac(false);
                  }
                }}
                disabled={submittingBac}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white border border-slate-700/60 font-bold text-xs tracking-wider uppercase shadow-xs transition-all cursor-pointer disabled:opacity-60"
                title={t.cartPayWithCreditCardDesc}
              >
                {submittingBac ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-[#E01E26]" />
                    <span>{t.cartPayWithCreditCard}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={async () => {
                  setSubmittingOrder(true);
                  let orderNumber: string | undefined;
                  let targetOrderId: string | undefined;
                  const hasOutOfStockInCart = items.some(
                    (i) => i.supplierStockStatus === "OUT_OF_STOCK" || i.supplierStockStatus === "UNAVAILABLE"
                  );
                  try {
                    const quoteNote = hasOutOfStockInCart
                      ? "Cotización de Reserva para productos agotados"
                      : undefined;
                    const res = await createQuotationOrder(quoteNote);
                    if (res.success && res.order) {
                      orderNumber = res.order.orderNumber;
                      targetOrderId = res.order.id;
                    }
                  } catch (err) {
                    console.warn("Could not create quotation:", err);
                  } finally {
                    setSubmittingOrder(false);
                  }
                  const waUrl = generateWhatsAppLink(vehicleLabel, orderNumber);
                  window.open(waUrl, "_blank", "noopener,noreferrer");
                  if (targetOrderId) {
                    setIsOpen(false);
                    router.push(`/pedidos/${targetOrderId}`);
                  }
                }}
                disabled={submittingOrder}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs tracking-wider uppercase shadow-md transition-all cursor-pointer disabled:opacity-60 ${
                  items.some((i) => i.supplierStockStatus === "OUT_OF_STOCK" || i.supplierStockStatus === "UNAVAILABLE")
                    ? "bg-[#C02030] hover:bg-[#9A1624] text-white"
                    : "bg-[#25D366] hover:bg-[#20ba5a] text-black"
                }`}
              >
                {submittingOrder ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : items.some((i) => i.supplierStockStatus === "OUT_OF_STOCK" || i.supplierStockStatus === "UNAVAILABLE") ? (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>{t.supplierReserveQuotationBtn}</span>
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 fill-black" />
                    <span>{t.cartQuoteViaWhatsapp}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        {/* Remove confirmation popup when reducing quantity to zero */}
        {itemPendingRemoval && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl border border-gray-200 space-y-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-gray-900 leading-tight">
                    {t.cartRemoveConfirmTitle}
                  </h4>
                  <p className="text-[11px] text-gray-500 truncate max-w-[170px]">
                    {itemPendingRemoval.title}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                {t.cartRemoveConfirmMessage}
              </p>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setItemPendingRemoval(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  {t.cartRemoveConfirmCancel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeItem(itemPendingRemoval.id);
                    setItemPendingRemoval(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#C02030] hover:bg-[#9A1624] text-white shadow-xs cursor-pointer"
                >
                  {t.cartRemoveConfirmAction}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

