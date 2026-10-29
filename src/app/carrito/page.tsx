"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { GarageModal } from "@/components/garage/GarageModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingConcierge } from "@/components/home/FloatingConcierge";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";
import { useGarage } from "@/context/GarageContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatCRC, formatUSD } from "@/lib/i18n";
import { isPlatformOrVehicleMatch, formatModelWithYear, isUniversalFit } from "@/lib/products";
import { Skeleton } from "@/components/ui/Skeleton";
import { PreCheckoutOptimizationModal } from "@/components/checkout/PreCheckoutOptimizationModal";
import { ComboSwapOpportunity, RelatedPartSuggestion } from "@/app/api/cart/smart-checkout/route";
import {
  ShoppingCart,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  Wrench,
  Percent,
  CheckCircle2,
  AlertCircle,
  Car,
  MessageCircle,
  ShieldCheck,
  Truck,
  Sparkles,
  Tag,
  Info,
  Check,
  Home,
  FileText,
  CreditCard,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Landmark,
  ArrowRight,
} from "lucide-react";

export default function CartPage() {
  const {
    items,
    removeItem,
    toggleInstallation,
    updateQuantity,
    clearCart,
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

  const { vehicle, openModal } = useGarage();
  const { lang, t } = useLanguage();
  const router = useRouter();

  const [isClientReady, setIsClientReady] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [submittingBac, setSubmittingBac] = useState(false);
  const [creatingQuote, setCreatingQuote] = useState(false);
  const [itemPendingRemoval, setItemPendingRemoval] = useState<any>(null);

  // Pre-Checkout Smart Optimization State
  const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState(false);
  const [isCheckingOptimization, setIsCheckingOptimization] = useState(false);
  const [comboSuggestions, setComboSuggestions] = useState<ComboSwapOpportunity[]>([]);
  const [relatedSuggestions, setRelatedSuggestions] = useState<RelatedPartSuggestion[]>([]);

  const handleProceedToCheckout = async () => {
    if (items.length === 0) return;
    setIsCheckingOptimization(true);
    try {
      const res = await fetch("/api/cart/smart-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (
        data.success &&
        data.hasOptimization &&
        ((data.comboSuggestions && data.comboSuggestions.length > 0) ||
          (data.relatedSuggestions && data.relatedSuggestions.length > 0))
      ) {
        setComboSuggestions(data.comboSuggestions || []);
        setRelatedSuggestions(data.relatedSuggestions || []);
        setIsOptimizationModalOpen(true);
        return;
      }
    } catch (err) {
      console.warn("Could not check optimizations:", err);
    } finally {
      setIsCheckingOptimization(false);
    }
    router.push("/checkout");
  };

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const vehicleLabel = vehicle
    ? `${vehicle.year} ${vehicle.brandName} ${vehicle.modelName}`
    : undefined;

  const getItemUrl = (item: { type?: string; id?: string; sku?: string }) => {
    if (item.type === "COMBO") {
      return `/combos/${(item.id || "").replace("combo-", "")}`;
    }
    if (item.type === "PACKAGE") {
      return `/performance`;
    }
    return `/productos/${item.sku || item.id || ""}`;
  };

  const handleItemClick = (item: any) => {
    const targetUrl = getItemUrl(item);
    router.push(targetUrl);
  };

  // Real animated skeleton screen during initial load
  if (!isClientReady) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1D] flex flex-col justify-between selection:bg-[#C02030] selection:text-white">
        <NotificationBanner />
        <Navbar />

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-16 w-full">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-28" />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-44 rounded-xl" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-36 w-full rounded-2xl" />
              <Skeleton className="h-36 w-full rounded-2xl" />
              <Skeleton className="h-36 w-full rounded-2xl" />
            </div>

            <div className="lg:col-span-4 space-y-4">
              <Skeleton className="h-96 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
          </div>
        </main>

        <GarageModal />
        <CartDrawer />
        <FloatingConcierge />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1D] flex flex-col justify-between selection:bg-[#C02030] selection:text-white">
      <NotificationBanner />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-16 w-full">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Link
            href="/"
            className="hover:text-black flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === "es" ? "Inicio" : "Home"}</span>
          </Link>
          <span>/</span>
          <Link
            href="/productos"
            className="hover:text-black transition-colors"
          >
            <span>{lang === "es" ? "Productos" : "Products"}</span>
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-bold">{t.cartTitle}</span>
        </div>

        {/* Minimalist Page Header with Currency Toggle & Compact BCCR Live Rate */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-gray-200">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111827]">
            {t.cartTitle}
          </h1>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Minimalist Live BCCR Sell Rate Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span className="text-[11px] text-gray-500 font-medium">TC BCCR:</span>
              <span className="font-mono font-bold text-gray-900 text-xs">
                ₡{sellRate.toFixed(2)} / USD
              </span>
            </div>

            {/* Compact Currency Switcher */}
            <div className="flex items-center rounded-xl bg-gray-100 p-1 text-xs font-bold border border-gray-200">
              <button
                type="button"
                onClick={() => setCurrency("CRC")}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                  currency === "CRC"
                    ? "bg-white text-[#C02030] shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>₡ CRC</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrency("USD")}
                className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                  currency === "USD"
                    ? "bg-white text-[#C02030] shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>$ USD</span>
              </button>
            </div>
          </div>
        </div>

        {/* User Requirement: Active Quotation Banner shown in cart */}
        {activeQuotation && String(activeQuotation.status || "").toUpperCase() === "COTIZACION" && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-200/80 text-amber-800 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-900">
                    {t.orderActiveQuoteBanner}
                  </span>
                  <span className="font-mono text-[11px] font-black text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded">
                    #{activeQuotation.orderNumber}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/90 mt-0.5">
                  {lang === "es"
                    ? "Revisa el detalle de piezas, solicita modificaciones o procede a pagar tu orden."
                    : "Check proforma details, request modifications, or proceed to payment."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
              <Link
                href={`/pedidos/${activeQuotation.id}`}
                className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-amber-300 text-amber-950 text-xs font-bold transition-colors shadow-2xs"
              >
                {t.orderViewDetailsBtn}
              </Link>
              <Link
                href={`/pedidos/${activeQuotation.id}?action=pay`}
                className="px-4 py-2 rounded-xl bg-[#C02030] hover:bg-[#9A1624] text-white text-xs font-bold transition-colors shadow-2xs"
              >
                {t.orderProceedToPay}
              </Link>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="py-20 text-center max-w-md mx-auto space-y-4">
            <div className="w-20 h-20 rounded-3xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto text-gray-400">
              <ShoppingCart className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-[#111827]">
              {t.cartEmpty}
            </h2>
            <p className="text-xs text-gray-500">
              {lang === "es"
                ? "Explora nuestro catálogo de escapes, kits de clutch, suspensiones e iluminación especializada para SxS."
                : "Browse our catalog of performance exhausts, clutch kits, suspensions, and specialized lighting for SxS."}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/productos"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#C02030] hover:bg-[#9A1624] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
              >
                {lang === "es" ? "Explorar Productos" : "Explore Products"}
              </Link>
              <Link
                href="/combos"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold uppercase tracking-wider transition-colors border border-gray-300"
              >
                {lang === "es" ? "Ver Combos" : "View Kits"}
              </Link>
            </div>

            {/* User Requirement: Create quotation order with all products in cart (even if order empty) */}
            <div className="pt-3 flex flex-col items-center">
              <button
                type="button"
                onClick={async () => {
                  setCreatingQuote(true);
                  try {
                    const res = await createQuotationOrder(
                      lang === "es"
                        ? "Cotización personalizada solicitada con carrito vacío. Pendiente de revisión técnica."
                        : "Custom quotation requested with empty cart. Pending technical review."
                    );
                    if (res.success && res.order) {
                      router.push(`/pedidos/${res.order.id}`);
                    }
                  } catch (e) {
                    console.error("Error creating empty quotation:", e);
                  } finally {
                    setCreatingQuote(false);
                  }
                }}
                disabled={creatingQuote}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <FileText className="w-4 h-4" />
                <span>
                  {creatingQuote
                    ? (lang === "es" ? "Creando Cotización..." : "Creating Quotation...")
                    : (lang === "es" ? "Solicitar Cotización Personalizada (Carrito Vacío)" : "Request Custom Quotation (Empty Cart)")}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* Main 2-Column Content Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Cart Items List with Brand, Compatibility, Image, Price */}
            <div className="lg:col-span-8 space-y-4">
              {/* Out of stock US Supplier warning banner */}
              {items.some((i) => i.supplierStockStatus === "OUT_OF_STOCK" || i.supplierStockStatus === "UNAVAILABLE") && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-rose-900 shadow-xs mb-4">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">
                    <span className="font-extrabold text-sm text-rose-950 block">{t.supplierStockOutOfStock}</span>
                    <span className="text-rose-800">{t.supplierCartOutOfStockWarning}</span>
                  </div>
                </div>
              )}

              {/* Items Cards List */}
              <div className="space-y-4">
                {items.map((item) => {
                  const lineTotalParts = item.priceCRC * item.quantity;
                  const lineTotal = lineTotalParts;

                  // Evaluate compatibility against registered SxS if vehicle exists
                  const isItemUniversal = isUniversalFit(item.comp);
                  const isCompatibleWithGarage = vehicle
                    ? isItemUniversal ||
                      Boolean(
                        item.comp?.some(
                          (c) =>
                            isPlatformOrVehicleMatch(c, vehicle.modelName) ||
                            isPlatformOrVehicleMatch(c, vehicle.modelSlug) ||
                            isPlatformOrVehicleMatch(
                              c,
                              `${vehicle.brandName} ${vehicle.modelName}`
                            )
                        )
                      )
                    : null;

                  return (
                    <div
                      key={`${item.id}-${item.withInstallation}`}
                      onClick={() => handleItemClick(item)}
                      className="bg-white border border-gray-200 rounded-2xl px-3.5 py-3 sm:px-4 sm:py-3.5 shadow-sm hover:border-gray-400 transition-all flex flex-col md:flex-row gap-3.5 sm:gap-4 cursor-pointer group"
                    >
                      {/* 1. Main Image */}
                      <div
                        className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 flex-shrink-0 self-center md:self-start group-hover:opacity-90 transition-opacity"
                        title={item.title}
                      >
                        <Image
                          src={item.imageUrl || "/images/logo.png"}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* 2. Product Information */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              {/* 3. Product Brand */}
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                                  <Tag className="w-3 h-3 text-[#C02030]" />
                                  <span>{t.cartProductBrandLabel}</span>
                                  <span className="text-gray-900 font-extrabold">
                                    {item.brand || "Bikeman Performance"}
                                  </span>
                                </span>

                                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                                  {item.sku || item.type}
                                </span>
                              </div>

                              {/* 2. Product Title */}
                              <h3
                                className="text-sm sm:text-base font-extrabold text-[#111827] leading-snug group-hover:text-[#C02030] transition-colors"
                              >
                                {item.title}
                              </h3>

                              {/* Live US Supplier Availability Chip */}
                              {item.supplierStockStatus && (
                                <div className="flex items-center gap-1.5 my-1.5">
                                  {item.supplierStockStatus === "PRE_ORDER" ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                                      <Calendar className="w-3 h-3 text-blue-600" />
                                      <span>{t.supplierCartPreOrderChip}</span>
                                    </span>
                                  ) : item.supplierStockStatus === "OUT_OF_STOCK" || item.supplierStockStatus === "UNAVAILABLE" ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-lg">
                                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                                      <span>{t.supplierCartOutOfStockChip}</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
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
                            </div>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeItem(item.id);
                              }}
                              className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 cursor-pointer"
                              title={lang === "es" ? "Eliminar artículo" : "Remove item"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* 4. Compatibility (Both compatible models AND registered SxS) */}
                          <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200/80 space-y-1 text-xs">
                            {/* Compatible Models */}
                            <div className="flex items-start gap-1.5">
                              <span className="font-bold text-gray-700 flex-shrink-0">
                                {t.cartCompatibleModelsLabel}
                              </span>
                              <span className="text-gray-600 font-medium">
                                {isItemUniversal
                                  ? lang === "es"
                                    ? "Universal (Compatible con todas las marcas y modelos SXS)"
                                    : "Universal (Fits all SXS makes and models)"
                                  : item.comp && item.comp.length > 0
                                  ? item.comp.map(formatModelWithYear).join(", ")
                                  : lang === "es"
                                  ? "Ajuste directo / Universal"
                                  : "Direct Fit / Universal"}
                              </span>
                            </div>

                            {/* Compatibility with registered SxS in Garage */}
                            <div>
                              {vehicle ? (
                                isCompatibleWithGarage ? (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-100/80 border border-emerald-300 text-emerald-800 font-bold text-[11px]">
                                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                                    <span>
                                      {t.cartCompatibleWithGarage.replace(
                                        "{vehicle}",
                                        `${vehicle.year} ${vehicle.brandName} ${vehicle.modelName}`
                                      )}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-100/80 border border-amber-300 text-amber-900 font-semibold text-[11px]">
                                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                                    <span>
                                      {t.cartNotVerifiedForGarage.replace(
                                        "{vehicle}",
                                        `${vehicle.year} ${vehicle.brandName} ${vehicle.modelName}`
                                      )}
                                    </span>
                                  </div>
                                )
                              ) : (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-gray-500 pt-0.5 border-t border-gray-200/60">
                                  <span>{t.cartGarageAdvicePrompt}</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openModal();
                                    }}
                                    className="text-[#C02030] font-bold hover:underline self-start sm:self-auto cursor-pointer"
                                  >
                                    {t.cartGarageAdviceBtn} →
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 5. Price (Dual display with live BCR dollar sell rate) */}
                          <div className="flex items-baseline gap-2 mt-1.5">
                            <span className="text-base font-black font-mono text-[#C02030]">
                              {formatPrice(item.priceCRC)}
                            </span>
                            {currency === "USD" ? (
                              <span className="text-xs text-gray-400 font-mono">
                                (₡{formatCRC(item.priceCRC)})
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 font-mono">
                                (${formatUSD(item.priceCRC / sellRate)} USD)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity and Installation Controls (Side-by-side) */}
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mt-2.5 pt-2.5 border-t border-gray-100"
                        >
                          {/* Quantity Selector */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500">
                              {t.cartQuantity}:
                            </span>
                            <div className="flex items-center border border-gray-300 rounded-xl bg-gray-50 overflow-hidden shadow-inner">
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.quantity === 1) {
                                    setItemPendingRemoval(item);
                                  } else {
                                    updateQuantity(item.id, item.quantity - 1);
                                  }
                                }}
                                className="px-2.5 py-1 hover:bg-white text-gray-700 hover:text-black transition-colors cursor-pointer"
                                aria-label={t.ariaDecreaseQty}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-3 text-xs font-mono font-bold text-gray-900 bg-white py-1">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                className="px-2.5 py-1 hover:bg-white text-gray-700 hover:text-black transition-colors cursor-pointer"
                                aria-label={t.ariaIncreaseQty}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Side-by-side Installation and House Icon */}
                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            {/* Installation: Wrench icon and word 'Gratis' (or selectable button if paid) */}
                            {item.freeInstallation || item.installationPriceCRC === 0 || item.type === "COMBO" ? (
                              <div
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs select-none"
                                title={lang === "es" ? "Instalación gratis incluida con la pieza" : "Free installation included with item"}
                              >
                                <Wrench className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                <span>{item.type === "COMBO" ? t.comboInstallationIncluded : (lang === "es" ? "Gratis" : "Free")}</span>
                              </div>
                            ) : (
                              <div
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 select-none"
                                title={lang === "es" ? "La instalación se selecciona y cancela en el agendamiento de servicios" : "Installation is chosen and paid during service booking"}
                              >
                                <Wrench className="w-3.5 h-3.5 text-[#0052CC] flex-shrink-0" />
                                <span className="text-[11px] text-slate-700 font-medium">
                                  {t.cartItemPaidInServices}
                                </span>
                              </div>
                            )}

                            {/* House icon: Green or Red based on eligibility with hover popup tooltip */}
                            <div className="relative group inline-flex items-center justify-center">
                              <div
                                tabIndex={0}
                                role="note"
                                aria-label={
                                  item.homeInstallation !== false
                                    ? t.cartHomeInstallationEligible
                                    : t.cartHomeInstallationIneligible
                                }
                                className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all cursor-help ${
                                  item.homeInstallation !== false
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-600 hover:bg-emerald-100"
                                    : "bg-rose-50 border-rose-300 text-rose-600 hover:bg-rose-100"
                                }`}
                              >
                                <Home className="w-4 h-4" />
                              </div>

                              {/* Hover popup tooltip */}
                              <div className="absolute bottom-full right-0 sm:left-1/2 sm:-translate-x-1/2 mb-2 hidden group-hover:flex group-focus-within:flex flex-col items-center z-30 pointer-events-none transition-all duration-200">
                                <div className="bg-gray-900 text-white text-[11px] font-semibold py-1.5 px-3 rounded-xl shadow-xl whitespace-nowrap border border-gray-700/60 flex items-center gap-1.5">
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
                                <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1 border-r border-b border-gray-700/60" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions Row */}
              <div className="flex items-center justify-between pt-4">
                <Link
                  href="/productos"
                  className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-black transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t.cartContinueShopping}</span>
                </Link>

                {/* Clear Cart with Confirm */}
                <div>
                  {showClearConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600 font-semibold">
                        {lang === "es" ? "¿Seguro?" : "Sure?"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          clearCart();
                          setShowClearConfirm(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
                      >
                        {lang === "es" ? "Sí, vaciar" : "Yes, clear"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(false)}
                        className="px-2 py-1 rounded-lg bg-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-300 transition-colors"
                      >
                        {lang === "es" ? "Cancelar" : "Cancel"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(true)}
                      className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.cartClearAll}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary Card */}
            <div className="lg:col-span-4 sticky top-24 space-y-4">
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
                <h3 className="text-base font-bold text-[#111827] pb-3 border-b border-gray-100 flex items-center justify-between">
                  <span>{t.cartOrderSummary}</span>
                  <span className="text-xs font-mono font-normal text-gray-500">
                    {currency === "USD" ? "USD ($)" : "CRC (₡)"}
                  </span>
                </h3>

                {/* Subtotals Breakdown */}
                <div className="space-y-2.5 text-xs">
                  {/* Parts Subtotal */}
                  <div className="flex justify-between items-center text-gray-600">
                    <span>{t.cartPartsSubtotal} <span className="text-[10px] text-gray-400 font-semibold">({lang === "es" ? "IVA incluido" : "VAT included"})</span></span>
                    <span className="font-mono font-bold text-gray-900 text-sm">
                      {formatPrice(partsSubtotal)}
                    </span>
                  </div>

                  {/* Installation notice (never billed in cart) */}
                  {items.some((i) => i.withInstallation) && (
                    <div className="flex justify-between items-center text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                      <span className="flex items-center gap-1.5 font-medium text-gray-700">
                        <Wrench className="w-3.5 h-3.5 text-[#C02030]" />
                        <span>{lang === "es" ? "Instalación en Taller:" : "Workshop Installation:"}</span>
                      </span>
                      <span className="text-[11px] font-semibold text-[#C02030]">
                        {lang === "es" ? "Se abona en Servicios" : "Billed in Services"}
                      </span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-baseline">
                      <span className="text-base font-extrabold text-[#111827]">
                        {t.cartTotal}
                      </span>
                      <div className="text-right">
                        <div className="text-2xl font-black font-mono text-[#C02030]">
                          {formatPrice(partsSubtotal)}
                        </div>
                        {currency === "USD" ? (
                          <div className="text-xs text-gray-500 font-mono mt-0.5">
                            {lang === "es" ? "Equivalente en Colones: ₡" : "Equivalent in Colones: ₡"}{formatCRC(partsSubtotal)}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 font-mono mt-0.5">
                            {lang === "es" ? "Equivalente en Dólares: $" : "Equivalent in Dollars: $"}{formatUSD(partsSubtotalUSD)} USD
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Minimalist Checkout Home Installation Callout */}
                {items.some((i) => i.withInstallation && i.homeInstallation !== false) && (
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950">
                    <Home className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs font-semibold leading-tight flex-1">
                      {lang === "es"
                        ? "Instalación a domicilio disponible para esta orden"
                        : "Home installation service available for this order"}
                    </span>
                  </div>
                )}


                {/* Primary CTA: Checkout (Transferencia Bancaria / SINPE Móvil) */}
                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  disabled={isCheckingOptimization || items.length === 0}
                  className="w-full flex items-center justify-between py-4 px-5 rounded-2xl bg-gradient-to-r from-[#D32335] via-[#C02030] to-[#9E1422] hover:from-[#E02639] hover:via-[#D32335] hover:to-[#B01A28] text-white font-extrabold text-xs tracking-wider uppercase shadow-xl shadow-red-600/30 hover:shadow-2xl hover:shadow-red-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer text-left disabled:opacity-60 disabled:hover:translate-y-0 border border-red-400/30 group"
                >
                  <div className="flex items-center gap-3.5">
                    {isCheckingOptimization ? (
                      <RefreshCw className="w-5 h-5 animate-spin text-white flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center flex-shrink-0 group-hover:bg-white/30 group-hover:scale-105 transition shadow-sm backdrop-blur-xs">
                        <Landmark className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className="text-sm font-black tracking-wide leading-tight text-white drop-shadow-xs">
                      {t.cartCheckout}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center group-hover:bg-white/25 group-hover:translate-x-1 transition flex-shrink-0">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                </button>

                {/* Secondary Payment / Quotation Options: BAC Compra Click & WhatsApp */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      if (items.length === 0 || submittingBac) return;
                      setSubmittingBac(true);
                      try {
                        const res = await createBacCompraClickOrder(vehicleLabel);
                        if (res.success && res.order) {
                          if (res.waUrl) {
                            window.open(res.waUrl, "_blank", "noopener,noreferrer");
                          }
                          const targetUrl = res.order.claimToken
                            ? `/pedidos/${res.order.id}?token=${res.order.claimToken}`
                            : `/pedidos/${res.order.id}`;
                          router.push(targetUrl);
                        } else {
                          alert(res.error || (lang === "es" ? "Error al procesar solicitud BAC Compra Click" : "Error processing BAC Compra Click request"));
                        }
                      } catch (err) {
                        console.error("Error in BAC Compra Click payment:", err);
                      } finally {
                        setSubmittingBac(false);
                      }
                    }}
                    disabled={submittingBac || items.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 px-3 rounded-2xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs tracking-wider uppercase border border-slate-700/60 shadow-md hover:shadow-lg transition-all cursor-pointer text-center disabled:opacity-60"
                    title={t.cartPayWithCreditCardBac}
                  >
                    {submittingBac ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white flex-shrink-0" />
                    ) : (
                      <CreditCard className="w-4 h-4 text-[#E01E26] flex-shrink-0" />
                    )}
                    <span className="truncate">{t.cartPayWithCreditCard}</span>
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
                        console.warn("Could not create quotation in CartPage:", err);
                      } finally {
                        setSubmittingOrder(false);
                      }
                      const waUrl = generateWhatsAppLink(vehicleLabel, orderNumber);
                      window.open(waUrl, "_blank", "noopener,noreferrer");
                      if (targetOrderId) {
                        router.push(`/pedidos/${targetOrderId}`);
                      }
                    }}
                    disabled={submittingOrder}
                    className={`flex items-center justify-center gap-2 px-4 sm:px-5 py-4 rounded-2xl font-extrabold text-xs tracking-wider uppercase shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60 flex-shrink-0 ${
                      items.some((i) => i.supplierStockStatus === "OUT_OF_STOCK" || i.supplierStockStatus === "UNAVAILABLE")
                        ? "bg-[#C02030] hover:bg-[#9A1624] text-white"
                        : "bg-[#25D366] hover:bg-[#20ba5a] text-black"
                    }`}
                    title={
                      items.some((i) => i.supplierStockStatus === "OUT_OF_STOCK" || i.supplierStockStatus === "UNAVAILABLE")
                        ? t.supplierReserveQuotationBtn
                        : lang === "es"
                        ? "Cotizar por WhatsApp"
                        : "Quote via WhatsApp"
                    }
                  >
                    {submittingOrder ? (
                      <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    ) : items.some((i) => i.supplierStockStatus === "OUT_OF_STOCK" || i.supplierStockStatus === "UNAVAILABLE") ? (
                      <>
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                        <span className="hidden sm:inline">{t.supplierReserveQuotationBtn}</span>
                        <span className="sm:hidden">{lang === "es" ? "Reserva" : "Reserve"}</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-black flex-shrink-0" />
                        <span>WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Value & Trust Guarantees */}
                <div className="pt-4 border-t border-gray-100 space-y-2.5 text-[11px] text-gray-600">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#C02030] flex-shrink-0 mt-0.5" />
                    <span>{t.cartWarrantyPerk}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Wrench className="w-4 h-4 text-[#C02030] flex-shrink-0 mt-0.5" />
                    <span>{t.cartWorkshopPerk}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Truck className="w-4 h-4 text-[#C02030] flex-shrink-0 mt-0.5" />
                    <span>{t.cartShippingPerk}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal when reducing item quantity to zero */}
      {itemPendingRemoval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setItemPendingRemoval(null)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-200 z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  {t.cartRemoveConfirmTitle}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                  {itemPendingRemoval.title}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              {t.cartRemoveConfirmMessage}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setItemPendingRemoval(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {t.cartRemoveConfirmCancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  removeItem(itemPendingRemoval.id);
                  setItemPendingRemoval(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#C02030] hover:bg-[#9A1624] text-white transition-colors shadow-sm cursor-pointer"
              >
                {t.cartRemoveConfirmAction}
              </button>
            </div>
          </div>
        </div>
      )}

      <PreCheckoutOptimizationModal
        isOpen={isOptimizationModalOpen}
        onClose={() => setIsOptimizationModalOpen(false)}
        onProceedToCheckout={() => {
          setIsOptimizationModalOpen(false);
          router.push("/checkout");
        }}
        comboSuggestions={comboSuggestions}
        relatedSuggestions={relatedSuggestions}
        isLoading={false}
      />

      {/* Global Site Footer */}
      <Footer />

      <GarageModal />
      <CartDrawer />
      <FloatingConcierge />
    </div>
  );
}
