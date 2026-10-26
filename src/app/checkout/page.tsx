"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  FileImage,
  ArrowLeft,
  Loader2,
  Phone,
  Copy,
  Check,
  Lock,
  Wrench,
  Sparkles,
  ShoppingBag,
  Info,
  X,
  Building2,
  Shield,
  CreditCard,
  ExternalLink,
  Tag,
  RefreshCw,
  Layers,
  Receipt,
  FileText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCRC, formatUSD } from "@/lib/i18n";
import { OFFICIAL_LEGAL_DOCS } from "@/types/document";
import { COMPANY_CONFIG } from "@/config/company";
import { ComboSwapOpportunity, RelatedPartSuggestion } from "@/app/api/cart/smart-checkout/route";
import { useGarage } from "@/context/GarageContext";

function formatIbanDisplay(iban: string): string {
  if (!iban) return "";
  const clean = iban.replace(/\s+/g, "");
  return clean.match(/.{1,4}/g)?.join(" ") || clean;
}

export default function CheckoutPage() {
  const {
    items,
    currency,
    setCurrency,
    totalCRC,
    totalUSD,
    partsSubtotal,
    laborSubtotal,
    formatPrice,
    clearCart,
    clearActiveQuotation,
    sellRate,
    swapItemsForCombo,
    addItemSilently,
  } = useCart();
  const { lang, t } = useLanguage();
  const { user, openDocumentModal } = useAuth();
  const { vehicle, activeVehicle } = useGarage();
  const router = useRouter();

  // Smart Checkout Optimization State
  const [comboSuggestions, setComboSuggestions] = useState<ComboSwapOpportunity[]>([]);
  const [relatedSuggestions, setRelatedSuggestions] = useState<RelatedPartSuggestion[]>([]);
  const [appliedComboIds, setAppliedComboIds] = useState<Set<string>>(new Set());
  const [addedRelatedIds, setAddedRelatedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (items.length === 0) return;
    let isMounted = true;
    fetch("/api/cart/smart-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          setComboSuggestions(data.comboSuggestions || []);
          setRelatedSuggestions(data.relatedSuggestions || []);
        }
      })
      .catch((err) => console.warn("Checkout optimization check error:", err));

    return () => {
      isMounted = false;
    };
  }, [items.length]);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissionStep, setSubmissionStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Discount Code State
  const [discountInput, setDiscountInput] = useState("");
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    description: string | null;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    discountCRC: number;
    finalTotalCRC: number;
  } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountSuccess, setDiscountSuccess] = useState<string | null>(null);

  // Factura Electrónica State
  const [requestFactura, setRequestFactura] = useState(false);
  const [facturaCompanyName, setFacturaCompanyName] = useState("");
  const [facturaIdType, setFacturaIdType] = useState<"JURIDICA" | "FISICA" | "DIMEX" | "NITE">("JURIDICA");
  const [facturaIdNumber, setFacturaIdNumber] = useState("");
  const [facturaEmail, setFacturaEmail] = useState("");
  const [facturaPhone, setFacturaPhone] = useState("");
  const [facturaEconomicActivity, setFacturaEconomicActivity] = useState("");
  const [facturaDetails, setFacturaDetails] = useState("");

  // Real-time calculation of discount and final payable amounts
  const calculatedDiscountCRC = useMemo(() => {
    if (!appliedDiscount) return 0;
    if (appliedDiscount.discountType === "PERCENTAGE") {
      const raw = Math.round(partsSubtotal * (appliedDiscount.discountValue / 100));
      return appliedDiscount.discountCRC ? Math.min(raw, appliedDiscount.discountCRC) : raw;
    }
    return Math.min(partsSubtotal, appliedDiscount.discountValue);
  }, [appliedDiscount, partsSubtotal]);

  // Base after discounts
  const subtotalAfterDiscountCRC = Math.max(0, partsSubtotal - calculatedDiscountCRC);

  // 13% IVA portion included in the price (No additional surcharge)
  const facturaIncludedTaxCRC = requestFactura ? Math.round(subtotalAfterDiscountCRC - (subtotalAfterDiscountCRC / 1.13)) : 0;

  // Final payable amount (IVA is already included, so NO +13% is added to the total)
  const finalPayableCRC = subtotalAfterDiscountCRC;
  const finalPayableUSD = sellRate > 0 ? finalPayableCRC / sellRate : 0;

  const handleApplyDiscount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!discountInput.trim()) {
      setDiscountError(lang === "es" ? "Por favor ingresa un código de descuento." : "Please enter a discount code.");
      return;
    }
    setValidatingDiscount(true);
    setDiscountError(null);
    setDiscountSuccess(null);

    try {
      const res = await fetch("/api/checkout/validate-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: discountInput.trim(),
          partsSubtotalCRC: partsSubtotal,
        }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedDiscount({
          code: data.code,
          description: data.description,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountCRC: data.discountCRC,
          finalTotalCRC: data.finalTotalCRC,
        });
        setDiscountSuccess(data.message || (lang === "es" ? "¡Código de descuento aplicado!" : "Coupon applied successfully!"));
        setDiscountError(null);
      } else {
        setDiscountError(data.error || (lang === "es" ? "Código de descuento inválido o expirado." : "Invalid or expired coupon."));
        setDiscountSuccess(null);
      }
    } catch (err) {
      console.error("Discount validation error:", err);
      setDiscountError(lang === "es" ? "Error de conexión al validar código." : "Network error validating code.");
    } finally {
      setValidatingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountInput("");
    setDiscountSuccess(null);
    setDiscountError(null);
  };

  // Pre-fill phone from auth user or API profile
  useEffect(() => {
    if (user?.phoneNumber) {
      setPhone(user.phoneNumber);
    } else {
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user?.phoneNumber) {
            setPhone(data.user.phoneNumber);
          }
        })
        .catch((err) => console.warn("Error fetching profile phone:", err));
    }
  }, [user]);

  // Fetch dynamic bank accounts
  useEffect(() => {
    fetch("/api/payment/accounts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.accounts)) {
          setAccounts(data.accounts);
        }
      })
      .catch((err) => console.error("Error fetching bank accounts:", err))
      .finally(() => setLoadingAccounts(false));
  }, []);

  // Exit warning hook
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (items.length > 0 && !submitSuccess) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [items, submitSuccess]);

  const handleCopy = (text: string, id: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.type.startsWith("image/") && selected.type !== "application/pdf") {
        setError(
          lang === "es"
            ? "Por favor sube un archivo de imagen (JPG, PNG, WEBP) o PDF."
            : "Please upload an image file (JPG, PNG, WEBP) or PDF."
        );
        return;
      }
      if (selected.size > 100 * 1024 * 1024) {
        setError(
          lang === "es"
            ? "El archivo supera el límite de 100MB."
            : "File exceeds the 100MB limit."
        );
        return;
      }
      setFile(selected);
      if (selected.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(selected));
      } else {
        setPreview(null);
      }
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (selected.type.startsWith("image/") || selected.type === "application/pdf") {
        if (selected.size > 100 * 1024 * 1024) {
          setError(
            lang === "es"
              ? "El archivo supera el límite de 100MB."
              : "File exceeds the 100MB limit."
          );
          return;
        }
        setFile(selected);
        if (selected.type.startsWith("image/")) {
          setPreview(URL.createObjectURL(selected));
        } else {
          setPreview(null);
        }
        setError(null);
      } else {
        setError(
          lang === "es"
            ? "Por favor sube un archivo de imagen (JPG, PNG, WEBP) o PDF."
            : "Please upload an image file (JPG, PNG, WEBP) or PDF."
        );
      }
    }
  };

  const removeSelectedFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const handleSubmit = async () => {
    if (!phone.trim()) {
      setError(
        lang === "es"
          ? "Por favor ingresa un número de teléfono válido para contactarte."
          : "Please enter a valid phone number so we can contact you."
      );
      return;
    }
    if (requestFactura) {
      if (
        !facturaCompanyName.trim() ||
        !facturaIdNumber.trim() ||
        !facturaEmail.trim() ||
        !facturaPhone.trim() ||
        !facturaEconomicActivity.trim()
      ) {
        setError(t.checkoutFacturaRequiredError);
        return;
      }
      if (
        facturaPhone.trim().replace(/\D/g, "") &&
        phone.trim().replace(/\D/g, "") &&
        facturaPhone.trim().replace(/\D/g, "") === phone.trim().replace(/\D/g, "")
      ) {
        setError(t.checkoutFacturaSamePhoneError);
        return;
      }
    }
    if (!file) {
      setError(
        lang === "es"
          ? "Debes adjuntar el comprobante de transferencia bancaria."
          : "You must upload the bank transfer payment receipt."
      );
      return;
    }
    if (!agreed) {
      setError(
        lang === "es"
          ? "Debes leer y aceptar la totalidad de los 8 Documentos Legales y Pólizas Oficiales de ZxZ Mods para continuar."
          : "You must read and accept all 8 Official Legal Documents and Policies of ZxZ Mods to proceed."
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSubmissionStep(1);

    try {
      // Step 1: Upload proof image
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload/payment", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadData.success || !uploadData.url) {
        throw new Error(
          uploadData.error ||
            (lang === "es"
              ? "Error al subir la imagen del comprobante"
              : "Failed to upload payment receipt")
        );
      }

      setSubmissionStep(2);

      // Step 2: Create order with PAYMENT_CONFIRMATION status (never charge install in cart checkout)
      const orderBody = {
        items,
        totalCRC: finalPayableCRC,
        partsSubtotalCRC: partsSubtotal,
        laborSubtotalCRC: 0,
        status: "PAYMENT_CONFIRMATION",
        customerPhone: phone.trim(),
        garageVehicle: activeVehicle
          ? {
              make: activeVehicle.brandName,
              model: activeVehicle.modelName,
              year: activeVehicle.year,
              color: activeVehicle.color,
              nickname: activeVehicle.nickname,
            }
          : vehicle
          ? {
              make: vehicle.brandName,
              model: vehicle.modelName,
              year: vehicle.year,
            }
          : null,
        paymentProofUrl: uploadData.url,
        paidCurrency: currency,
        language: lang,
        discountCode: appliedDiscount?.code || null,
        discountCRC: calculatedDiscountCRC,
        taxCRC: facturaIncludedTaxCRC,
        requiresElectronicInvoice: requestFactura,
        electronicInvoice: requestFactura
          ? {
              companyName: facturaCompanyName.trim(),
              idType: facturaIdType,
              idNumber: facturaIdNumber.trim(),
              email: facturaEmail.trim(),
              phone: facturaPhone.trim(),
              economicActivity: facturaEconomicActivity.trim(),
              details: facturaDetails.trim() || null,
            }
          : null,
      };

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderBody),
      });
      const orderData = await orderRes.json();

      if (!orderData.success || !orderData.order) {
        throw new Error(
          orderData.error ||
            (lang === "es"
              ? "Error al registrar el pedido"
              : "Failed to register order")
        );
      }

      setSubmissionStep(3);
      setSubmitSuccess(true);
      clearCart();
      clearActiveQuotation();

      try {
        const stored = JSON.parse(localStorage.getItem("zxz_tracked_orders") || "[]");
        const list = Array.isArray(stored) ? stored : [];
        const updated = Array.from(new Set([orderData.order.id, orderData.order.orderNumber, ...list])).slice(0, 20);
        localStorage.setItem("zxz_tracked_orders", JSON.stringify(updated));
      } catch {}

      // Redirect after 3.2s
      setTimeout(() => {
        router.push(`/pedidos/${orderData.order.id}`);
      }, 3200);
    } catch (err: any) {
      setError(
        err.message ||
          (lang === "es"
            ? "Ocurrió un error inesperado al procesar el pago."
            : "An unexpected error occurred while processing payment.")
      );
      setIsSubmitting(false);
    }
  };

  // Filter bank accounts by current currency & STRICTLY eliminate SINPE
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // Eliminate SINPE
      const isSinpe =
        acc.isSinpe === true ||
        acc.type === "SINPE" ||
        acc.bankName?.toLowerCase().includes("sinpe");
      if (isSinpe) return false;

      if (currency === "USD") {
        return (
          acc.currency === "USD" ||
          acc.currency === "DOLAR" ||
          acc.currency === "DOLARES"
        );
      }
      return (
        acc.currency === "CRC" ||
        acc.currency === "COLON" ||
        acc.currency === "COLONES" ||
        !acc.currency
      );
    });
  }, [accounts, currency]);

  if (items.length === 0 && !submitSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 selection:bg-[#0052CC] selection:text-white">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#EBF3FC] text-[#0052CC] flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#0A2540] mb-2">
            {lang === "es" ? "Tu carrito está vacío" : "Your cart is empty"}
          </h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            {lang === "es"
              ? "Agrega productos o paquetes a tu carrito antes de proceder a la pantalla de pago."
              : "Add products or packages to your cart before proceeding to the checkout screen."}
          </p>
          <Link
            href="/productos"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0052CC] hover:bg-[#0040A8] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#0052CC]/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === "es" ? "Explorar Catálogo" : "Browse Catalog"}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-[#0052CC] selection:text-white pb-24">
      {/* Top Navigation & Brand Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/carrito"
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-[#0052CC] hover:bg-slate-100 transition-colors"
              title={lang === "es" ? "Volver al Carrito" : "Back to Cart"}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0052CC] tracking-wider uppercase flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#0052CC]" />
                  {lang === "es" ? "Portal de Pago Seguro" : "Secure Payment Portal"}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h1 className="text-base sm:text-lg font-extrabold text-[#0A2540] tracking-tight">
                {t.checkoutTitle || (lang === "es" ? "Confirmación de Pedido & Pago" : "Order Confirmation & Payment")}
              </h1>
            </div>
          </div>

          {/* Institutional Trust Guarantees Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF3FC] border border-[#C2DBFE] text-xs font-semibold text-[#0052CC]">
            <Lock className="w-3.5 h-3.5 text-[#0052CC]" />
            <span>
              {lang === "es"
                ? "Cifrado SSL 256-Bit • Transferencia Protegida"
                : "256-Bit SSL Encrypted • Protected Transfer"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Responsive Two-Column Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ========================================================================= */}
          {/* LEFT COLUMN: Detailed Price Summary & Redesigned Official Bank Accounts */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* 1. Itemized Detailed Price Summary Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#EBF3FC] text-[#0052CC] flex items-center justify-center font-bold">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#0A2540]">
                      {lang === "es"
                        ? "Desglose Completo de Productos"
                        : "Detailed Items & Price Breakdown"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {items.length}{" "}
                      {items.length === 1
                        ? lang === "es"
                          ? "artículo en orden"
                          : "item in order"
                        : lang === "es"
                        ? "artículos en orden"
                        : "items in order"}
                    </p>
                  </div>
                </div>

                {/* Compact Currency Switcher with Trust Blue Accent */}
                <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-bold border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCurrency("CRC")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      currency === "CRC"
                        ? "bg-[#0052CC] text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    ₡ CRC
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency("USD")}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      currency === "USD"
                        ? "bg-[#0052CC] text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    $ USD
                  </button>
                </div>
              </div>

              {/* Smart Checkout Combo Swap Recommendation Banner */}
              {comboSuggestions.length > 0 && (
                <div className="mb-4 space-y-3">
                  {comboSuggestions.map((combo) => {
                    const isSwapped = appliedComboIds.has(combo.comboId);
                    return (
                      <div
                        key={combo.comboId}
                        className={`p-4 rounded-2xl border transition-all ${
                          isSwapped
                            ? "bg-emerald-50/70 border-emerald-200"
                            : "bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white border-[#0052CC]/30 shadow-xs"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-[#0052CC] text-white flex items-center justify-center flex-shrink-0 shadow-xs mt-0.5">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#0052CC] text-white">
                                  {t.smartCheckoutComboBadge}
                                </span>
                                {combo.savingsCRC > 0 && (
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">
                                    {t.smartCheckoutYouSave} {formatPrice(combo.savingsCRC)}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-tight mt-1">
                                {lang === "es" ? combo.comboTitleEs : combo.comboTitleEn}
                              </h4>
                              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                                {lang === "es" ? combo.recommendationReasonEs : combo.recommendationReasonEn}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between gap-2 flex-wrap">
                          <div className="text-[11px]">
                            <span className="text-slate-500">{t.smartCheckoutComboPrice} </span>
                            <span className="font-extrabold font-mono text-[#0052CC]">
                              {formatPrice(combo.comboPriceCRC)}
                            </span>
                            {combo.cartMatchingCostCRC > 0 && (
                              <span className="text-slate-400 font-mono line-through ml-1.5">
                                {formatPrice(combo.cartMatchingCostCRC)}
                              </span>
                            )}
                          </div>

                          {isSwapped ? (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/60 px-3 py-1 rounded-xl">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{t.smartCheckoutComboSwappedSuccess}</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                swapItemsForCombo(
                                  {
                                    id: combo.comboId,
                                    slug: combo.comboSlug,
                                    titleEs: combo.comboTitleEs,
                                    titleEn: combo.comboTitleEn,
                                    priceCRC: combo.comboPriceCRC,
                                    imageUrl: combo.imageUrl,
                                  },
                                  combo.matchingCartItemIds
                                );
                                setAppliedComboIds((prev) => new Set(prev).add(combo.comboId));
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0052CC] hover:bg-[#0040A8] text-white text-xs font-extrabold uppercase tracking-wide shadow-sm transition-all cursor-pointer"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>{t.smartCheckoutComboSwapBtn}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Smart Checkout Related Product Suggestion */}
              {relatedSuggestions.length > 0 && (
                <div className="mb-4">
                  {relatedSuggestions.slice(0, 1).map(({ product, reasonEs, reasonEn }) => {
                    const isAdded = addedRelatedIds.has(product.id);
                    return (
                      <div
                        key={product.id}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 relative overflow-hidden flex-shrink-0">
                            <Image
                              src={product.imgs?.[0] || "/images/sxs/z10_front.png"}
                              alt={product.p_title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">
                              {t.smartCheckoutRelatedTitle}
                            </span>
                            <h5 className="font-bold text-slate-900 truncate max-w-[200px] sm:max-w-[300px]">
                              {product.p_title}
                            </h5>
                            <span className="font-mono text-[#0052CC] font-bold">
                              {formatPrice(product.price.T_price)}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isAdded}
                          onClick={() => {
                            addItemSilently({
                              id: product.id,
                              title: product.p_title,
                              priceCRC: product.price.T_price,
                              basePriceCRC: product.price.T_price,
                              type: "PRODUCT",
                              imageUrl: product.imgs?.[0] || "/images/sxs/z10_front.png",
                              category: product.category,
                              brand: product.brand?.[0],
                              withInstallation: false,
                              installationPriceCRC: 0,
                              freeInstallation: product.price.I_price?.includes || false,
                              homeInstallation: product.homeInstallation,
                              supplierStockStatus: product.supplierStockStatus || "IN_STOCK",
                              supplierLeadDaysMin: product.supplierLeadDaysMin ?? 2,
                              supplierLeadDaysMax: product.supplierLeadDaysMax ?? 5,
                            });
                            setAddedRelatedIds((prev) => new Set(prev).add(product.id));
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                            isAdded
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-900 hover:bg-[#0052CC] text-white cursor-pointer shadow-xs"
                          }`}
                        >
                          {isAdded ? `✓ ${t.cartAddedModalAdded}` : `+ ${t.cartAddedModalAddToCart}`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Items List */}
              <div className="divide-y divide-slate-100 my-4 max-h-[380px] overflow-y-auto pr-1">
                {items.map((item) => {
                  const linePartsPrice = item.priceCRC * item.quantity;
                  const totalLinePrice = linePartsPrice;

                  return (
                    <div
                      key={item.id}
                      className="py-4 first:pt-2 last:pb-2 flex items-start gap-3.5"
                    >
                      {/* Product Thumbnail */}
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200/70 overflow-hidden relative flex-shrink-0">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Product Info & Line Breakdown */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {item.brand && (
                                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#0052CC] bg-[#EBF3FC] px-1.5 py-0.5 rounded">
                                  {item.brand}
                                </span>
                              )}
                              <span className="text-[11px] text-slate-500 font-medium">
                                {lang === "es" ? "Cant:" : "Qty:"}{" "}
                                <b className="text-slate-900 font-mono">
                                  {item.quantity}
                                </b>
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                ({formatPrice(item.priceCRC)} c/u)
                              </span>
                            </div>
                          </div>

                          {/* Line Item Total (Only parts, never installation) */}
                          <div className="text-right flex-shrink-0">
                            <span className="text-sm font-bold font-mono text-slate-900">
                              {formatPrice(totalLinePrice)}
                            </span>
                          </div>
                        </div>

                        {/* Installation notice */}
                        <div className="mt-2 text-[11px] select-none">
                          {item.freeInstallation || item.installationPriceCRC === 0 || item.type === "COMBO" ? (
                            <div className="flex items-center justify-between w-full bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-2.5 py-1">
                              <div className="flex items-center gap-1.5">
                                <Wrench className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                <span className="font-semibold text-emerald-800">
                                  {lang === "es" ? "Instalación" : "Installation"}
                                </span>
                              </div>
                              <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded">
                                {item.type === "COMBO" ? t.comboInstallationIncluded : (lang === "es" ? "Gratis" : "Free")}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1">
                              <div className="flex items-center gap-1.5">
                                <Wrench className="w-3.5 h-3.5 text-[#0052CC] flex-shrink-0" />
                                <span className="text-[11px] text-slate-700 font-medium">
                                  {t.cartItemPaidInServices}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Discount Code Section */}
              <div className="pt-4 border-t border-slate-100">
                <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#0052CC]" />
                      <span>{t.checkoutDiscountTitle || (lang === "es" ? "¿Tienes un Código de Descuento?" : "Have a Discount Code?")}</span>
                    </span>
                    {appliedDiscount && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>{appliedDiscount.code}</span>
                      </span>
                    )}
                  </div>

                  {!appliedDiscount ? (
                    <form onSubmit={handleApplyDiscount} className="flex gap-2">
                      <input
                        type="text"
                        value={discountInput}
                        onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                        placeholder={t.checkoutDiscountPlaceholder || (lang === "es" ? "Ingresa tu código (ej: ZXZ10)" : "Enter coupon (e.g. ZXZ10)")}
                        className="flex-1 px-3 py-2 text-xs font-mono font-semibold uppercase tracking-wider bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent transition-all placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
                      />
                      <button
                        type="submit"
                        disabled={validatingDiscount || !discountInput.trim()}
                        className="px-3.5 py-2 text-xs font-bold bg-[#0052CC] hover:bg-[#0043A8] text-white rounded-xl shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                      >
                        {validatingDiscount ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>{t.checkoutDiscountApplying || (lang === "es" ? "Validando..." : "Validating...")}</span>
                          </>
                        ) : (
                          <span>{t.checkoutDiscountApplyBtn || (lang === "es" ? "Aplicar Cupón" : "Apply Coupon")}</span>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between bg-white border border-emerald-200 rounded-xl p-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                          %
                        </div>
                        <div>
                          <div className="text-xs font-bold text-emerald-900 font-mono">
                            {appliedDiscount.code}
                            <span className="ml-2 font-sans font-semibold text-emerald-700 text-[11px]">
                              ({appliedDiscount.discountType === "PERCENTAGE"
                                ? `${appliedDiscount.discountValue}% OFF`
                                : `-${formatPrice(appliedDiscount.discountValue)}`})
                            </span>
                          </div>
                          {appliedDiscount.description && (
                            <div className="text-[10px] text-slate-500">
                              {appliedDiscount.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveDiscount}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        {t.checkoutDiscountRemoveBtn || (lang === "es" ? "Quitar" : "Remove")}
                      </button>
                    </div>
                  )}

                  {discountError && (
                    <div className="text-[11px] font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-500" />
                      <span>{discountError}</span>
                    </div>
                  )}

                  {discountSuccess && (
                    <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                      <span>{discountSuccess}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Comprehensive Cost Calculation Breakdown */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
                {/* Parts Subtotal */}
                <div className="flex justify-between items-center">
                  <span>
                    {t.cartPartsSubtotal ||
                      (lang === "es" ? "Subtotal de Partes:" : "Parts Subtotal:")}
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatPrice(partsSubtotal)}
                  </span>
                </div>

                {/* Installation Notice (Billed in Services) */}
                <div className="flex justify-between items-center text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Wrench className="w-3.5 h-3.5 text-[#0052CC]" />
                    <span>{lang === "es" ? "Instalación de Piezas:" : "Parts Installation:"}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-[#0052CC]">
                    {lang === "es" ? "Se paga al seleccionar un servicio (₡0 en carrito)" : "Paid when selecting a service (₡0 in cart)"}
                  </span>
                </div>

                {/* Applied Discount Line */}
                {appliedDiscount && calculatedDiscountCRC > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t.checkoutDiscountRowLabel || (lang === "es" ? "Descuento Aplicado" : "Applied Discount")} ({appliedDiscount.code}):</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      -{formatPrice(calculatedDiscountCRC)}
                    </span>
                  </div>
                )}

                {/* Precios con IVA (13%) incluido notice */}
                <div className="flex justify-between items-center text-slate-500 text-[11px] px-1">
                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.checkoutPricesIncludeIvaNotice || (lang === "es" ? "Precios incluyen 13% de IVA" : "Prices include 13% VAT")}</span>
                  </span>
                </div>

                {/* Factura Electrónica (IVA 13% incluido en el total) Line */}
                {requestFactura && (
                  <div className="flex justify-between items-center text-[#0A2540] bg-[#EBF3FC] p-2.5 rounded-xl border border-[#C2DBFE] font-medium">
                    <span className="flex items-center gap-1.5 text-xs">
                      <FileText className="w-3.5 h-3.5 text-[#0052CC]" />
                      <span>{t.orderFacturaTaxLabel || (lang === "es" ? "IVA 13% (incluido en el total):" : "13% VAT (included in total):")}</span>
                    </span>
                    <span className="font-mono font-bold text-[#0052CC] text-xs">
                      {formatPrice(facturaIncludedTaxCRC)}
                    </span>
                  </div>
                )}

                {/* Total Line with highlight */}
                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <div>
                    <span className="text-base font-extrabold text-[#0A2540]">
                      {t.cartTotal ||
                        (lang === "es" ? "Total a Pagar:" : "Total Amount to Pay:")}
                    </span>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {currency === "USD"
                        ? `Equivalente en Colones: ₡${formatCRC(finalPayableCRC)} (TC: ₡${sellRate.toFixed(2)})`
                        : `Equivalente en Dólares: $${formatUSD(finalPayableUSD)} USD (TC: ₡${sellRate.toFixed(2)})`}
                    </div>
                  </div>
                  <div className="text-2xl font-black font-mono text-[#0052CC]">
                    {formatPrice(finalPayableCRC)}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Redesigned Premium Official Bank Accounts Section */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#EBF3FC] text-[#0052CC] flex items-center justify-center font-bold shadow-2xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#0A2540]">
                      {t.checkoutAccountsTitle ||
                        (lang === "es"
                          ? "Cuentas Bancarias Oficiales (Transferencia / IBAN)"
                          : "Official Bank Accounts (Wire / IBAN)")}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {lang === "es"
                        ? "Transfiere en la moneda seleccionada a nombre de ZxZ Mods Costa Rica S.A."
                        : "Transfer in selected currency to ZxZ Mods Costa Rica S.A."}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-[#0052CC] bg-[#EBF3FC] border border-[#C2DBFE] px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{lang === "es" ? "Cuentas Jurídicas Verificadas" : "Verified Corporate Accounts"}</span>
                </span>
              </div>

              {/* Step-by-Step Payment Procedure Guide */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-slate-50/70 to-blue-50/20 border border-slate-200/90 text-xs text-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-bold text-[#0A2540]">
                  <Info className="w-4 h-4 text-[#0052CC] flex-shrink-0" />
                  <span>{lang === "es" ? "Guía Rápida para Realizar tu Transferencia:" : "Quick Wire Transfer Guide:"}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-[#0052CC] text-white font-bold flex items-center justify-center text-[10px] mb-1">
                      1
                    </span>
                    <p className="font-semibold text-slate-800">
                      {lang === "es" ? "Copia el número IBAN" : "Copy the IBAN number"}
                    </p>
                    <p className="text-slate-500 text-[10px] mt-0.5">
                      {lang === "es" ? "Usa el botón de un clic abajo" : "Use the one-click button below"}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-[#0052CC] text-white font-bold flex items-center justify-center text-[10px] mb-1">
                      2
                    </span>
                    <p className="font-semibold text-slate-800">
                      {lang === "es" ? "Transfiere el monto exacto" : "Transfer exact amount"}
                    </p>
                    <p className="text-[#0052CC] font-mono font-bold text-[10px] mt-0.5">
                      {formatPrice(finalPayableCRC)}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-[#0052CC] text-white font-bold flex items-center justify-center text-[10px] mb-1">
                      3
                    </span>
                    <p className="font-semibold text-slate-800">
                      {lang === "es" ? "Adjunta el comprobante" : "Upload your receipt"}
                    </p>
                    <p className="text-slate-500 text-[10px] mt-0.5">
                      {lang === "es" ? "En la columna derecha al lado" : "In the right column"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Redesigned Bank Accounts Cards Grid */}
              <div className="grid grid-cols-1 gap-4">
                {loadingAccounts ? (
                  <>
                    <Skeleton className="h-44 rounded-3xl" />
                    <Skeleton className="h-44 rounded-3xl" />
                  </>
                ) : filteredAccounts.length > 0 ? (
                  filteredAccounts.map((acc, idx) => {
                    const accKey = `${acc.bankName}-${idx}`;
                    const rawIban = acc.iban || acc.accountNumber || "";
                    const isIbanCopied = copiedId === `${accKey}-iban`;
                    const isIdCopied = copiedId === `${accKey}-id`;

                    return (
                      <div
                        key={idx}
                        className="relative bg-white border-2 border-slate-200/90 hover:border-[#0052CC] rounded-3xl p-5 sm:p-6 transition-all shadow-xs hover:shadow-md flex flex-col justify-between gap-4.5 overflow-hidden group"
                      >
                        {/* Top Subtle Brand Accent Line */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0052CC] via-[#0066FF] to-[#0A2540]" />

                        <div>
                          {/* Bank Header Row */}
                          <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-100 flex-wrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0A2540] to-[#0052CC] text-white flex items-center justify-center font-black shadow-sm flex-shrink-0">
                                <Building2 className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="text-sm sm:text-base font-black text-[#0A2540] tracking-tight flex items-center gap-1.5">
                                  <span>{acc.bankName}</span>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0052CC]" />
                                </h4>
                                <span className="text-[11px] text-slate-500 font-medium block">
                                  {lang === "es"
                                    ? "Cuenta Corriente Empresarial Oficial"
                                    : "Official Corporate Checking Account"}
                                </span>
                              </div>
                            </div>

                            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-extrabold px-3 py-1 rounded-full bg-[#EBF3FC] text-[#0052CC] border border-[#C2DBFE]">
                              {currency === "USD" ? "$ USD (Dólares)" : "₡ CRC (Colones)"}
                            </span>
                          </div>

                          {/* IBAN Hero Box */}
                          <div className="mt-4 bg-slate-50/90 border border-slate-200/90 rounded-2xl p-4 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                {lang === "es"
                                  ? "NÚMERO DE CUENTA IBAN OFICIAL"
                                  : "OFFICIAL IBAN ACCOUNT NUMBER"}
                              </span>
                              <span className="text-[10px] font-bold text-[#0052CC] bg-blue-50 px-2 py-0.5 rounded-md">
                                {lang === "es" ? "Copia directa" : "Direct copy"}
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                              <span className="font-mono font-black text-sm sm:text-base text-slate-900 tracking-wider select-all break-all sm:break-normal">
                                {formatIbanDisplay(rawIban)}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleCopy(rawIban, `${accKey}-iban`)}
                                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex-shrink-0 ${
                                  isIbanCopied
                                    ? "bg-emerald-600 text-white shadow-emerald-600/20"
                                    : "bg-[#0052CC] hover:bg-[#0040A8] text-white shadow-[#0052CC]/20"
                                }`}
                              >
                                {isIbanCopied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>{lang === "es" ? "¡IBAN Copiado!" : "Copied!"}</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>{lang === "es" ? "Copiar IBAN" : "Copy IBAN"}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Beneficiary & Corporate Details Grid */}
                          <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {/* Titular */}
                            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex flex-col justify-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                {lang === "es" ? "Titular / Beneficiario" : "Account Holder"}
                              </span>
                              <span className="font-bold text-slate-800 text-xs truncate mt-0.5">
                                {acc.ownerName || "ZxZ Mods Costa Rica S.A."}
                              </span>
                            </div>

                            {/* Cédula Jurídica */}
                            <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                  {lang === "es" ? "Cédula Jurídica" : "Corporate Tax ID"}
                                </span>
                                <span className="font-mono font-bold text-slate-800 text-xs block mt-0.5">
                                  {acc.idCard || COMPANY_CONFIG.cedulaJuridica || "3-101-436132"}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy(acc.idCard || COMPANY_CONFIG.cedulaJuridica || "3-101-436132", `${accKey}-id`)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                                  isIdCopied
                                    ? "bg-emerald-600 text-white"
                                    : "bg-white hover:bg-slate-200 text-slate-700 border border-slate-200 shadow-2xs"
                                }`}
                                title={lang === "es" ? "Copiar Cédula" : "Copy Tax ID"}
                              >
                                {isIdCopied ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>{lang === "es" ? "Copiada" : "Copied"}</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>{lang === "es" ? "Copiar" : "Copy"}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Exact Amount Notice Banner at Bottom of Bank Card */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs flex-wrap">
                          <div className="flex items-center gap-2 text-slate-600">
                            <span className="text-[11px] font-medium">
                              {lang === "es" ? "Monto exacto a transferir:" : "Exact transfer amount:"}
                            </span>
                            <span className="font-mono font-black text-slate-900 text-sm">
                              {formatPrice(finalPayableCRC)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const rawAmount =
                                currency === "USD"
                                  ? finalPayableUSD.toFixed(2)
                                  : Math.round(finalPayableCRC).toString();
                              handleCopy(rawAmount, `${accKey}-amount`);
                            }}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                              copiedId === `${accKey}-amount`
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            }`}
                          >
                            {copiedId === `${accKey}-amount` ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>{lang === "es" ? "Monto copiado" : "Amount copied"}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>{lang === "es" ? "Copiar monto" : "Copy amount"}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full bg-slate-50 p-6 rounded-2xl text-center text-xs text-slate-500 border border-dashed border-slate-200">
                    {lang === "es"
                      ? "No hay cuentas configuradas en esta moneda en este momento. Por favor contáctanos por WhatsApp para recibir los datos de transferencia."
                      : "No bank accounts found for this currency. Please contact us via WhatsApp for payment details."}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: Proof Upload, Phone Number (ON TOP OF AGREEMENTS), Agreements */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-24 space-y-6">
            {/* Complete Payment Processing Card */}
            <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-[#EBF3FC] text-[#0052CC] flex items-center justify-center font-bold">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0A2540]">
                    {t.checkoutUploadTitle ||
                      (lang === "es" ? "Subir Comprobante de Pago" : "Upload Payment Proof")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === "es"
                      ? "Adjunta la captura de tu transferencia bancaria"
                      : "Attach bank transfer receipt screenshot"}
                  </p>
                </div>
              </div>

              {/* 1. Upload Dropzone */}
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  file
                    ? "border-emerald-500 bg-emerald-50/30"
                    : "border-slate-300 hover:border-[#0052CC] bg-slate-50 hover:bg-[#EBF3FC]/40"
                }`}
              >
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/webp, image/avif, application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {file ? (
                  <div className="w-full flex flex-col items-center space-y-3">
                    {preview ? (
                      <div className="relative w-36 h-48 rounded-xl overflow-hidden border border-slate-200 shadow-md bg-white">
                        <Image
                          src={preview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeSelectedFile}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition-colors shadow-sm cursor-pointer"
                          title={lang === "es" ? "Quitar archivo" : "Remove file"}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative w-36 h-36 rounded-xl border border-slate-200 shadow-md bg-white flex flex-col items-center justify-center p-3">
                        <FileText className="w-10 h-10 text-rose-600" />
                        <span className="text-[10px] font-bold text-slate-700 mt-1 uppercase">PDF</span>
                        <button
                          type="button"
                          onClick={removeSelectedFile}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition-colors shadow-sm cursor-pointer"
                          title={lang === "es" ? "Quitar archivo" : "Remove file"}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800">
                        <FileImage className="w-4 h-4 text-emerald-600" />
                        <span className="truncate max-w-[200px]">{file?.name}</span>
                      </div>
                      <span className="text-[11px] text-[#0052CC] font-semibold hover:underline block mt-1">
                        {lang === "es"
                          ? "Haz clic para cambiar archivo"
                          : "Click to change file"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 py-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#EBF3FC] text-[#0052CC] flex items-center justify-center mx-auto mb-2 shadow-2xs">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      {t.checkoutUploadDesc ||
                        (lang === "es"
                          ? "Arrastra tu comprobante aquí o haz clic"
                          : "Drag and drop your receipt here or click")}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      JPG, PNG, WEBP, PDF ({lang === "es" ? "Máx 100MB" : "Max 100MB"})
                    </p>
                  </div>
                )}
              </label>

              {/* 2. Contact Phone Number (MOVED ON TOP OF ACUERDOS DE PAGO) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#0052CC]" />
                    <span>
                      {t.checkoutPhoneLabel ||
                        (lang === "es"
                          ? "Número de Contacto / WhatsApp"
                          : "Contact Phone / WhatsApp")}
                    </span>
                    <span className="text-[#0052CC]">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {lang === "es" ? "Para entrega / retiro" : "For pickup / delivery"}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.checkoutPhonePlaceholder || "+506 8888 8888"}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC] transition-all"
                  />
                  {phone.trim() && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">
                  {lang === "es"
                    ? "Te contactaremos a este número cuando tus piezas estén listas para entrega, retiro o instalación en taller."
                    : "We will contact you at this number when your parts are ready for delivery, pickup, or workshop install."}
                </p>
              </div>

              {/* 3. Factura Electrónica Request Button & Form (Hacienda CR +13% IVA) */}
              <div className="rounded-2xl border border-slate-200/90 overflow-hidden bg-slate-50 transition-all">
                <button
                  type="button"
                  onClick={() => setRequestFactura(!requestFactura)}
                  className={`w-full p-4 flex items-center justify-between text-left transition-all cursor-pointer ${
                    requestFactura
                      ? "bg-[#EBF3FC] text-[#0A2540] border-b border-[#C2DBFE]"
                      : "hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      requestFactura ? "bg-[#0052CC] text-white shadow-xs" : "bg-slate-200 text-slate-600"
                    }`}>
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold block">
                        {t.checkoutFacturaToggle}
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight">
                        {t.checkoutFacturaSubtitle}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                      requestFactura
                        ? "bg-[#0052CC] text-white"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}>
                      {t.checkoutFacturaTaxBadge || (lang === "es" ? "IVA 13% Ya Incluido" : "13% VAT Already Included")}
                    </span>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      requestFactura
                        ? "bg-[#0052CC] border-[#0052CC] text-white"
                        : "border-slate-300 bg-white"
                    }`}>
                      {requestFactura && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </button>

                {requestFactura && (
                  <div className="p-4 bg-white space-y-3.5 animate-fade-in border-t border-slate-100">
                    {/* Razón Social */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {t.checkoutFacturaCompanyLabel} <span className="text-[#0052CC]">*</span>
                      </label>
                      <input
                        type="text"
                        value={facturaCompanyName}
                        onChange={(e) => setFacturaCompanyName(e.target.value)}
                        placeholder={t.checkoutFacturaCompanyPlaceholder}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]"
                      />
                    </div>

                    {/* Cédula: Tipo y Número */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-5">
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          {t.checkoutFacturaIdTypeLabel} <span className="text-[#0052CC]">*</span>
                        </label>
                        <select
                          value={facturaIdType}
                          onChange={(e: any) => setFacturaIdType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]"
                        >
                          <option value="JURIDICA">{t.checkoutFacturaIdTypeJuridica}</option>
                          <option value="FISICA">{t.checkoutFacturaIdTypeFisica}</option>
                          <option value="DIMEX">{t.checkoutFacturaIdTypeDimex}</option>
                          <option value="NITE">{t.checkoutFacturaIdTypeNite}</option>
                        </select>
                      </div>

                      <div className="sm:col-span-7">
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          {t.checkoutFacturaIdNumberLabel} <span className="text-[#0052CC]">*</span>
                        </label>
                        <input
                          type="text"
                          value={facturaIdNumber}
                          onChange={(e) => setFacturaIdNumber(e.target.value)}
                          placeholder={t.checkoutFacturaIdNumberPlaceholder}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]"
                        />
                      </div>
                    </div>

                    {/* Correo Electrónico de Facturación */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {t.checkoutFacturaEmailLabel} <span className="text-[#0052CC]">*</span>
                      </label>
                      <input
                        type="email"
                        value={facturaEmail}
                        onChange={(e) => setFacturaEmail(e.target.value)}
                        placeholder={t.checkoutFacturaEmailPlaceholder}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]"
                      />
                    </div>

                    {/* Teléfono de Facturación (Diferente al teléfono de contacto del pedido) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          {t.checkoutFacturaPhoneLabel} <span className="text-[#0052CC]">*</span>
                        </label>
                        <span className="text-[9px] text-[#0052CC] font-bold uppercase">
                          {lang === "es" ? "Distinto al de entrega" : "Distinct from delivery"}
                        </span>
                      </div>
                      <input
                        type="tel"
                        value={facturaPhone}
                        onChange={(e) => setFacturaPhone(e.target.value)}
                        placeholder={t.checkoutFacturaPhonePlaceholder}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]"
                      />
                    </div>

                    {/* Actividad Económica */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {t.checkoutFacturaEconomicActivityLabel} <span className="text-[#0052CC]">*</span>
                      </label>
                      <input
                        type="text"
                        value={facturaEconomicActivity}
                        onChange={(e) => setFacturaEconomicActivity(e.target.value)}
                        placeholder={t.checkoutFacturaEconomicActivityPlaceholder}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]"
                      />
                    </div>

                    {/* Detalles / Dirección Fiscal Adicional */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {t.checkoutFacturaDetailsLabel}
                      </label>
                      <input
                        type="text"
                        value={facturaDetails}
                        onChange={(e) => setFacturaDetails(e.target.value)}
                        placeholder={t.checkoutFacturaDetailsPlaceholder}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]"
                      />
                    </div>

                    <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-[10px] text-blue-900 leading-tight">
                      ℹ️ {lang === "es"
                        ? "El 13% de IVA ya está incluido en los precios de los productos. Al solicitar Factura Electrónica NO se agrega ningún recargo adicional; la factura se emitirá automáticamente con estos datos ante el Ministerio de Hacienda por el monto exacto del pedido."
                        : "13% VAT is already included in product prices. Requesting an Electronic Invoice carries NO additional surcharge; the official tax invoice with the Ministry of Finance will be automatically issued using these details for the exact order total."}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Mandatory Legal Agreements & Order Documents Acceptance */}
              <div
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  agreed
                    ? "bg-slate-50 border-slate-200/90 border-l-4 border-l-[#0052CC]"
                    : "bg-red-50/30 border-red-200/90 border-l-4 border-l-red-500"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#0052CC] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-[#0052CC] flex-shrink-0" />
                  <span>
                    {lang === "es"
                      ? "Aceptación Obligatoria de Términos y Pólizas Legales"
                      : "Mandatory Terms & Legal Policies Acceptance"}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed text-justify">
                  {lang === "es"
                    ? "Al confirmar este pedido y cargar el comprobante bancario, declaras conocer y aceptar la totalidad de los 8 Documentos Legales de ZxZ Mods Costa Rica S.A.: pagos exclusivamente por transferencia bancaria oficial (sin SINPE), póliza estricta de CERO devoluciones (única y exclusivamente fallos de fábrica comprobados bajo garantía escrita), plazos aduaneros de importación desde EE.UU. (7 a 12 días hábiles) y la exoneración por errores en cuentas de destino digitadas por el usuario."
                    : "By placing this order and uploading your bank transfer receipt, you acknowledge and agree to all 8 Official Legal Documents of ZxZ Mods Costa Rica S.A.: strictly official bank transfers (no SINPE), strict ZERO returns policy (factory defects only under written warranty), US import customs lead times (7-12 business days), and customer liability for erroneous transfers."}
                </p>

                {/* Interactive Pills to review each of the 8 documents */}
                <div className="pt-2 border-t border-slate-200/70 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {lang === "es"
                      ? "Documentos legales vinculantes (clic para revisar):"
                      : "Binding legal documents (click to review):"}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {OFFICIAL_LEGAL_DOCS.map((doc) => (
                      <button
                        key={doc.slug}
                        type="button"
                        onClick={() => openDocumentModal(doc.slug)}
                        className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-[#0052CC] text-[#0052CC] hover:text-[#003D99] text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <span>{lang === "es" ? doc.titleEs : doc.titleEn}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Master Checkbox */}
                <label className="flex items-start gap-2.5 pt-2 cursor-pointer group border-t border-slate-200/70 select-none">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0052CC] focus:ring-[#0052CC] cursor-pointer"
                  />
                  <div className="text-xs space-y-0.5 leading-tight">
                    <span className="font-extrabold text-slate-900 group-hover:text-[#0052CC] transition-colors block">
                      {lang === "es"
                        ? "He leído, comprendo y acepto la totalidad de los 8 Documentos Legales y Pólizas Oficiales"
                        : "I have read, understood, and accept all 8 Official Legal Documents and Policies"}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {lang === "es"
                        ? "Confirmo la veracidad de la transferencia y acepto las garantías y exclusiones pactadas."
                        : "I confirm transfer validity and accept the agreed warranties and disclaimers."}
                    </span>
                  </div>
                </label>
              </div>

              {/* Validation Error Banner */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Primary Confirmation Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !file || !phone.trim() || !agreed}
                className="w-full py-4 px-6 rounded-2xl bg-[#0052CC] hover:bg-[#0040A8] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm tracking-wider uppercase transition-all shadow-lg shadow-[#0052CC]/25 disabled:shadow-none flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span>
                      {t.checkoutConfirmingBtn ||
                        (lang === "es" ? "Procesando Orden..." : "Processing Order...")}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-blue-100" />
                    <span>
                      {t.checkoutConfirmBtn ||
                        (lang === "es"
                          ? "Confirmar Pago y Crear Pedido"
                          : "Confirm Payment & Place Order")}
                    </span>
                  </>
                )}
              </button>

              {/* Trust Badges Footer */}
              <div className="pt-2 text-center space-y-1.5">
                <div className="flex items-center justify-center gap-4 text-[11px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0052CC]" />
                    {lang === "es"
                      ? "Verificación Oficial ZxZ"
                      : "Official ZxZ Verification"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-[#0052CC]" />
                    {lang === "es"
                      ? "Seguridad SSL 256-Bit"
                      : "256-Bit SSL Security"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {lang === "es"
                    ? "Al enviar el comprobante, nuestro equipo técnico iniciará la verificación de inmediato."
                    : "Upon submission, our technical team will promptly verify the transfer."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Engaging Fun Full-Screen Submission Animation Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-5 animate-in zoom-in-95 duration-300">
            {/* Animated Center Graphic */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-[#EBF3FC] animate-ping opacity-60" />
              <div className="w-20 h-20 rounded-full bg-[#0052CC] text-white flex items-center justify-center shadow-xl relative z-10 shadow-[#0052CC]/30">
                {submissionStep === 1 && (
                  <UploadCloud className="w-10 h-10 text-white animate-bounce" />
                )}
                {submissionStep === 2 && (
                  <Wrench className="w-10 h-10 text-white animate-spin" />
                )}
                {submissionStep >= 3 && (
                  <CheckCircle2 className="w-10 h-10 text-emerald-300 animate-scale" />
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black text-[#0A2540] tracking-tight">
                {submissionStep === 1 &&
                  (lang === "es"
                    ? "Subiendo Comprobante..."
                    : "Uploading Receipt...")}
                {submissionStep === 2 &&
                  (lang === "es"
                    ? "Registrando tu Orden..."
                    : "Registering Order...")}
                {submissionStep >= 3 &&
                  (lang === "es"
                    ? "¡Pago en Confirmación!"
                    : "Payment in Confirmation!")}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {submissionStep < 3
                  ? lang === "es"
                    ? "Estamos enlazando tu transferencia bancaria con el sistema ZxZ Mods..."
                    : "Linking your bank transfer with the ZxZ Mods system..."
                  : lang === "es"
                  ? "Tu orden ha sido creada con éxito. Redirigiendo a tu seguimiento en vivo..."
                  : "Order created successfully. Redirecting to live tracking..."}
              </p>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  submissionStep >= 1 ? "w-8 bg-[#0052CC]" : "w-2 bg-slate-200"
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  submissionStep >= 2 ? "w-8 bg-[#0052CC]" : "w-2 bg-slate-200"
                }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  submissionStep >= 3 ? "w-8 bg-emerald-500" : "w-2 bg-slate-200"
                }`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
