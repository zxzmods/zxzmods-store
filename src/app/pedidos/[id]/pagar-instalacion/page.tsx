"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { GarageModal } from "@/components/garage/GarageModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingConcierge } from "@/components/home/FloatingConcierge";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { convertCRCToUSD, formatCRC, formatUSD } from "@/lib/i18n";
import { getWhatsAppUrl, COMPANY_CONFIG } from "@/config/company";
import { DjiPaymentAnimationOverlay } from "@/components/ui/DjiPaymentAnimationOverlay";
import { getOrderPendingInstallationCost } from "@/lib/orderServices";
import { isOrderInInstallationPaymentStage, canPayInstallation } from "@/lib/orderWorkflow";
import {
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  FileImage,
  ArrowLeft,
  Phone,
  Copy,
  Check,
  Lock,
  Clock,
  Wrench,
  Building2,
  FileText,
  X,
  CreditCard,
  Receipt,
  Car,
  Loader2,
} from "lucide-react";

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  totalCRC: number;
  partsSubtotalCRC: number;
  laborSubtotalCRC: number;
  installationCostCRC?: number;
  customerName?: string | null;
  customerPhone?: string | null;
  shippingAddress?: string | null;
  serviceType?: string;
  items?: any[];
  itemsJson?: string;
  installationPaymentProofUrl?: string | null;
  isInstallationPaymentConfirmed?: boolean;
}

export default function InstallationCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const { currency, sellRate } = useCart();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);

  // PM-01: Multi-Currency selector for installation fee (can be paid in USD even if order is CRC)
  const [payCurrency, setPayCurrency] = useState<"CRC" | "USD">(currency || "CRC");

  // Bank accounts
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form inputs
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Factura Electrónica
  const [requestFactura, setRequestFactura] = useState(false);
  const [facturaCompanyName, setFacturaCompanyName] = useState("");
  const [facturaIdType, setFacturaIdType] = useState<"JURIDICA" | "FISICA" | "DIMEX" | "NITE">("JURIDICA");
  const [facturaIdNumber, setFacturaIdNumber] = useState("");
  const [facturaEmail, setFacturaEmail] = useState("");
  const [facturaPhone, setFacturaPhone] = useState("");
  const [facturaEconomicActivity, setFacturaEconomicActivity] = useState("");
  const [facturaDetails, setFacturaDetails] = useState("");

  // DJI-inspired animation overlay state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState(1);
  const [isSubmittingBac, setIsSubmittingBac] = useState(false);

  // Fetch order data dynamically
  useEffect(() => {
    if (!orderId) return;
    setLoadingOrder(true);
    fetch(`/api/orders/${encodeURIComponent(orderId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.order) {
          setOrder(data.order);
          if (data.order.customerPhone) {
            setPhone(data.order.customerPhone);
          }
        } else {
          setOrderError(data.error || "Orden no encontrada.");
        }
      })
      .catch((err) => {
        console.error("Error loading order:", err);
        setOrderError("Error al cargar la información de la orden.");
      })
      .finally(() => setLoadingOrder(false));
  }, [orderId]);

  // Pre-fill phone fallback
  useEffect(() => {
    if (phone) return;
    if (user?.phoneNumber) {
      setPhone(user.phoneNumber);
    }
  }, [user, phone]);

  // Fetch bank accounts
  useEffect(() => {
    fetch("/api/payment/accounts")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.accounts)) {
          setAccounts(data.accounts);
        }
      })
      .catch((err) => console.error("Error loading bank accounts:", err))
      .finally(() => setLoadingAccounts(false));
  }, []);

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
      if (selected.size > 8 * 1024 * 1024) {
        setError(lang === "es" ? "El archivo supera el límite de 8MB." : "File exceeds the 8MB limit.");
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
      if (selected.size > 8 * 1024 * 1024) {
        setError(lang === "es" ? "El archivo supera el límite de 8MB." : "File exceeds the 8MB limit.");
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

  // Base installation labor fee (dynamically resolved from products in order)
  const baseLaborCRC = useMemo(() => {
    if (!order) return 0;
    return getOrderPendingInstallationCost(order);
  }, [order]);

  // 13% IVA added to installation labor
  const ivaTaxCRC = useMemo(() => {
    return baseLaborCRC > 0 ? Math.round(baseLaborCRC * 0.13) : 0;
  }, [baseLaborCRC]);

  const facturaTaxCRC = ivaTaxCRC;

  const totalPayableCRC = baseLaborCRC + ivaTaxCRC;
  const totalPayableUSD = sellRate > 0 ? totalPayableCRC / sellRate : 0;

  const baseLaborUSD = sellRate > 0 ? baseLaborCRC / sellRate : 0;
  const ivaTaxUSD = sellRate > 0 ? ivaTaxCRC / sellRate : 0;

  // Filter bank accounts by selected payment currency (PM-01)
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const isSinpe =
        acc.isSinpe === true ||
        acc.type === "SINPE" ||
        acc.bankName?.toLowerCase().includes("sinpe");
      if (isSinpe) return false;

      if (payCurrency === "USD") {
        return acc.currency === "USD" || acc.currency === "DOLAR" || acc.currency === "DOLARES";
      }
      return acc.currency === "CRC" || acc.currency === "COLON" || acc.currency === "COLONES" || !acc.currency;
    });
  }, [accounts, payCurrency]);

  // Submission handler with DJI animation sequence
  const handleSubmit = async () => {
    if (!order) return;

    if (!canPayInstallation(order.status, order.serviceType)) {
      setError(
        lang === "es"
          ? "El pago de instalación solo puede realizarse durante el estado 'Pago de Instalación' o 'Listo para Retiro'."
          : "Installation payment can only be made during the 'Installation Payment' or 'Ready for Pickup' stage."
      );
      return;
    }

    if (!phone.trim()) {
      setError(
        lang === "es"
          ? "Por favor ingresa un número de teléfono válido para contactarte."
          : "Please enter a valid phone number."
      );
      return;
    }

    if (!file) {
      setError(
        lang === "es"
          ? "Debes adjuntar el comprobante de transferencia bancaria de la mano de obra."
          : "You must attach the bank transfer receipt for the installation labor."
      );
      return;
    }

    if (requestFactura) {
      if (!facturaCompanyName.trim() || !facturaIdNumber.trim() || !facturaEmail.trim()) {
        setError(
          lang === "es"
            ? "Por favor completa la Razón Social, Cédula y Correo de Facturación."
            : "Please fill out Company Name, Tax ID, and Billing Email."
        );
        return;
      }
    }

    if (!agreed) {
      setError(
        lang === "es"
          ? "Debes aceptar los términos y pólizas legales de instalación de ZxZ Mods."
          : "You must accept the installation terms and legal policies."
      );
      return;
    }

    setIsSubmitting(true);
    setSubmissionStep(1);
    setError(null);

    try {
      // 1. Upload receipt file
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "payments");

      const uploadRes = await fetch("/api/upload/payment", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.error || "Error al subir la imagen del comprobante");
      }

      setSubmissionStep(2);

      // 2. Call backend installation payment route
      const paymentPayload = {
        receiptUrl: uploadData.url,
        phone: phone.trim(),
        paidCurrency: payCurrency,
        paidAmountCRC: totalPayableCRC,
        baseLaborCRC: baseLaborCRC,
        ivaCRC: ivaTaxCRC,
        requiresElectronicInvoice: requestFactura,
        electronicInvoice: requestFactura
          ? {
              companyName: facturaCompanyName.trim(),
              idType: facturaIdType,
              idNumber: facturaIdNumber.trim(),
              email: facturaEmail.trim(),
              phone: facturaPhone.trim() || phone.trim(),
              economicActivity: facturaEconomicActivity.trim(),
              subtotalCRC: baseLaborCRC,
              taxRate: 13,
              taxAmountCRC: ivaTaxCRC,
              totalWithTaxCRC: totalPayableCRC,
              details: facturaDetails.trim(),
            }
          : null,
      };

      const res = await fetch(`/api/orders/${order.id}/installation-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al registrar el pago de instalación.");
      }

      setSubmissionStep(3);

      setTimeout(() => {
        router.push(`/pedidos/${order.id}`);
      }, 1800);
    } catch (err: any) {
      console.error("Installation payment submission error:", err);
      setIsSubmitting(false);
      setError(err.message || "Error al procesar el pago. Por favor intenta de nuevo.");
    }
  };

  // BAC Compra-Click Card Payment handler
  const handleCardPayment = async () => {
    if (!order) return;

    if (!canPayInstallation(order.status, order.serviceType)) {
      setError(
        lang === "es"
          ? "El pago de instalación solo puede realizarse durante el estado 'Pago de Instalación' o 'Listo para Retiro'."
          : "Installation payment can only be made during the 'Installation Payment' or 'Ready for Pickup' stage."
      );
      return;
    }

    if (!phone.trim()) {
      setError(
        lang === "es"
          ? "Por favor ingresa un número de teléfono válido para contactarte."
          : "Please enter a valid phone number."
      );
      return;
    }

    if (requestFactura) {
      if (!facturaCompanyName.trim() || !facturaIdNumber.trim() || !facturaEmail.trim()) {
        setError(
          lang === "es"
            ? "Por favor completa la Razón Social, Cédula y Correo de Facturación."
            : "Please fill out Company Name, Tax ID, and Billing Email."
        );
        return;
      }
    }

    if (!agreed) {
      setError(
        lang === "es"
          ? "Debes aceptar los términos y pólizas legales de instalación de ZxZ Mods."
          : "You must accept the installation terms and legal policies."
      );
      return;
    }

    setIsSubmittingBac(true);
    setError(null);

    try {
      const paymentPayload = {
        paymentMethod: "BAC_COMPRA_CLICK",
        requestedBacLink: true,
        receiptUrl: "BAC_COMPRA_CLICK_AUTH: PENDIENTE",
        phone: phone.trim(),
        paidCurrency: payCurrency,
        paidAmountCRC: totalPayableCRC,
        baseLaborCRC: baseLaborCRC,
        ivaCRC: ivaTaxCRC,
        requiresElectronicInvoice: requestFactura,
        electronicInvoice: requestFactura
          ? {
              companyName: facturaCompanyName.trim(),
              idType: facturaIdType,
              idNumber: facturaIdNumber.trim(),
              email: facturaEmail.trim(),
              phone: facturaPhone.trim() || phone.trim(),
              economicActivity: facturaEconomicActivity.trim(),
              subtotalCRC: baseLaborCRC,
              taxRate: 13,
              taxAmountCRC: ivaTaxCRC,
              totalWithTaxCRC: totalPayableCRC,
              details: facturaDetails.trim(),
            }
          : null,
      };

      const res = await fetch(`/api/orders/${order.id}/installation-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentPayload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al solicitar enlace de pago BAC Compra Click.");
      }

      let msg = `💳 *SOLICITUD BAC COMPRA-CLICK (MANO DE OBRA / INSTALACIÓN)*\n`;
      msg += `*Pedido:* #${order.orderNumber}\n`;
      if (user?.displayName || order.customerName) {
        msg += `*Cliente:* ${user?.displayName || order.customerName}\n`;
      }
      msg += `*Teléfono:* ${phone.trim()}\n`;
      msg += `*Mano de Obra:* ₡${baseLaborCRC.toLocaleString("es-CR")} ($${baseLaborUSD.toFixed(2)} USD)\n`;
      msg += `*IVA (13%):* ₡${ivaTaxCRC.toLocaleString("es-CR")} ($${ivaTaxUSD.toFixed(2)} USD)\n`;
      msg += `\n*TOTAL A PAGAR:* ₡${totalPayableCRC.toLocaleString("es-CR")} ($${totalPayableUSD.toFixed(2)} USD)\n`;
      msg += `_(13% IVA incluido)_\n\n`;
      msg += `Favor enviar el enlace seguro de pago BAC Compra-Click para la mano de obra de este pedido.`;

      const waUrl = getWhatsAppUrl(msg);
      window.open(waUrl, "_blank", "noopener,noreferrer");

      router.push(`/pedidos/${order.id}`);
    } catch (err: any) {
      console.error("Installation card payment error:", err);
      setError(err.message || "Error al procesar solicitud con tarjeta BAC Compra Click.");
    } finally {
      setIsSubmittingBac(false);
    }
  };

  // Loading Skeleton Screen
  if (loadingOrder) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#111827]">
        <NotificationBanner />
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16 space-y-6 animate-pulse">
          <div className="h-6 w-48 bg-slate-200 rounded-xl" />
          <div className="h-32 bg-slate-200 rounded-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 h-96 bg-slate-200 rounded-3xl" />
            <div className="lg:col-span-5 h-96 bg-slate-200 rounded-3xl" />
          </div>
        </main>
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#111827]">
        <NotificationBanner />
        <Navbar />
        <main className="max-w-md mx-auto px-4 pt-32 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-slate-900">
            {orderError || "No se pudo cargar la orden"}
          </h2>
          <Link
            href="/pedidos"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.btnBackToOrders}</span>
          </Link>
        </main>
      </div>
    );
  }

  const isInstallationState = canPayInstallation(order.status, order.serviceType);
  if (!isInstallationState) {
    return (
      <div className="relative min-h-screen bg-[#F8FAFC] text-[#111827] flex flex-col justify-between selection:bg-[#C02030] selection:text-white antialiased">
        <NotificationBanner />
        <Navbar />
        <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-28 pb-16 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-md">
            {order.isInstallationPaymentConfirmed ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            ) : order.installationPaymentProofUrl ? (
              <Clock className="w-8 h-8 text-blue-600" />
            ) : (
              <Lock className="w-8 h-8 text-purple-700" />
            )}
          </div>
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              {t.orderNumberLabel} #{order.orderNumber}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {order.isInstallationPaymentConfirmed
                ? t.instAlreadyConfirmed
                : order.installationPaymentProofUrl
                ? t.instUnderReview
                : t.instNotAvailableYet}
            </h1>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              {order.isInstallationPaymentConfirmed
                ? (lang === "es"
                    ? "El pago de la mano de obra para esta orden ya ha sido verificado y confirmado por el personal de ZxZ Mods."
                    : "The installation payment for this order has already been verified and confirmed.")
                : order.installationPaymentProofUrl
                ? (lang === "es"
                    ? "Ya has enviado el comprobante de transferencia para la instalación. El equipo administrativo lo está validando."
                    : "Your installation payment receipt was already submitted and is being verified by our administration team.")
                : (lang === "es"
                    ? `El pago de instalación se habilita en las etapas correspondientes ("Listo para Retiro" o "Pago de Instalación"). Actualmente tu pedido se encuentra en proceso previo.`
                    : `Installation payment unlocks during the appropriate stages ("Ready for Pickup" or "Installation Payment"). Your order is currently in an earlier stage.`)}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href={`/pedidos/${order.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold uppercase tracking-wider transition shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.btnBackToOrder}</span>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] text-[#111827] flex flex-col justify-between selection:bg-[#C02030] selection:text-white antialiased">
      <NotificationBanner />
      <Navbar />
      <GarageModal />
      <CartDrawer />
      <FloatingConcierge />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 md:px-8 pt-20 sm:pt-24 pb-20 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <Link
            href={`/pedidos/${order.id}`}
            className="hover:text-black flex items-center gap-1.5 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.btnBackToOrder} #{order.orderNumber}</span>
          </Link>

          <span className="font-mono text-[11px] text-purple-700 font-bold bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
            {t.instCheckoutHeader}
          </span>
        </div>

        {/* Hero Header Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/30">
              <Wrench className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-black uppercase tracking-wider text-purple-300">
                  {t.orderNumberLabel} #{order.orderNumber}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30">
                  {t.instLaborSubtotal}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                {t.instCheckoutSubtitle}
              </h1>
              <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
                {t.instCheckoutDesc}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-3 shrink-0">
            {/* Currency Selector Pill (PM-01) */}
            <div className="flex items-center bg-white/15 backdrop-blur-md p-1 rounded-xl border border-white/20 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setPayCurrency("CRC")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  payCurrency === "CRC" ? "bg-white text-slate-900 shadow-sm" : "text-white/80 hover:text-white"
                }`}
              >
                ₡ CRC
              </button>
              <button
                type="button"
                onClick={() => setPayCurrency("USD")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  payCurrency === "USD" ? "bg-white text-slate-900 shadow-sm" : "text-white/80 hover:text-white"
                }`}
              >
                $ USD
              </button>
            </div>

            <div className="text-left sm:text-right shrink-0 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-300 block">
                {lang === "es" ? "Monto de Instalación (IVA inc.)" : "Installation Amount (13% VAT inc.)"}
              </span>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
                {payCurrency === "USD" ? `$${formatUSD(totalPayableUSD)} USD` : formatCRC(totalPayableCRC)}
              </div>
              <div className="text-[11px] font-mono text-slate-300">
                {payCurrency === "USD" ? `≈ ${formatCRC(totalPayableCRC)}` : `$${formatUSD(totalPayableUSD)} USD`} (TC: ₡{sellRate.toFixed(2)})
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Bank Accounts & Breakdown */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Cost Breakdown Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-purple-700" />
                  <span>{lang === "es" ? "Desglose de Mano de Obra" : "Labor Cost Breakdown"}</span>
                </div>
                {/* Dedicated Currency Switcher */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPayCurrency("CRC")}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                      payCurrency === "CRC" ? "bg-white text-purple-700 shadow-2xs font-mono" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    ₡ CRC
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayCurrency("USD")}
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                      payCurrency === "USD" ? "bg-white text-purple-700 shadow-2xs font-mono" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    $ USD
                  </button>
                </div>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>{t.installationLaborSubtotalLabel}:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {payCurrency === "USD" ? `$${formatUSD(baseLaborUSD)} USD` : formatCRC(baseLaborCRC)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[#0A2540] bg-[#EBF3FC] px-3 py-2 rounded-xl border border-[#C2DBFE] font-medium">
                  <span className="flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-[#0052CC]" />
                    <span>{t.installationIvaTaxLabel}:</span>
                  </span>
                  <span className="font-mono font-black text-[#0052CC] text-sm">
                    +{payCurrency === "USD" ? `$${formatUSD(ivaTaxUSD)} USD` : formatCRC(ivaTaxCRC)}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-base font-extrabold text-slate-900">
                    {t.installationTotalWithIvaLabel}:
                  </span>
                  <div className="text-right">
                    <div className="text-2xl font-black font-mono text-purple-700">
                      {payCurrency === "USD" ? `$${formatUSD(totalPayableUSD)} USD` : formatCRC(totalPayableCRC)}
                    </div>
                    {payCurrency === "USD" ? (
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        ≈ {formatCRC(totalPayableCRC)} (TC: ₡{sellRate.toFixed(2)})
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        ${formatUSD(totalPayableUSD)} USD
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Official Bank Accounts */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {lang === "es" ? "Cuentas Bancarias Oficiales (IBAN)" : "Official Bank Accounts (IBAN)"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {lang === "es"
                        ? `Transfiere a nombre de ${COMPANY_CONFIG.legalName} (Cédula Jurídica ${COMPANY_CONFIG.cedulaJuridica || "3-101-436132"})`
                        : `Transfer to ${COMPANY_CONFIG.legalName} (Corporate Tax ID ${COMPANY_CONFIG.cedulaJuridica || "3-101-436132"})`}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>{lang === "es" ? "Cuentas Verificadas" : "Verified Accounts"}</span>
                </span>
              </div>

              <div className="space-y-3.5">
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((acc, idx) => {
                    const rawIban = acc.iban || acc.accountNumber || "";
                    const accKey = `inst-${idx}`;
                    const isCopied = copiedId === `${accKey}-iban`;

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-purple-300 transition-all space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <Building2 className="w-4 h-4 text-purple-700" />
                            <span className="font-extrabold text-slate-900 text-sm">
                              {acc.bankName}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                            {payCurrency === "USD" ? "Dólares ($)" : "Colones (₡)"}
                          </span>
                        </div>

                        {/* IBAN Box */}
                        <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                              Cuenta IBAN:
                            </span>
                            <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 break-all select-all">
                              {rawIban}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(rawIban, `${accKey}-iban`)}
                            className={`p-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                              isCopied
                                ? "bg-emerald-600 text-white"
                                : "bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopied ? "Copiado" : "Copiar"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
                    BAC Credomatic (IBAN): CR58010200009405624912 (Colones)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Proof Upload, Phone, Factura Electrónica & Submit */}
          <div className="lg:col-span-5 sticky top-24 space-y-6">
            
            <div className="bg-white rounded-3xl border-2 border-slate-200/90 p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {lang === "es" ? "Subir Comprobante de Mano de Obra" : "Upload Labor Payment Proof"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === "es"
                      ? "Adjunta la captura o comprobante de la transferencia"
                      : "Attach transfer receipt screenshot or PDF"}
                  </p>
                </div>
              </div>

              {/* Upload Dropzone */}
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  file
                    ? "border-emerald-500 bg-emerald-50/30"
                    : "border-slate-300 hover:border-purple-600 bg-slate-50 hover:bg-purple-50/30"
                }`}
              >
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/webp, application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {preview ? (
                  <div className="w-full flex flex-col items-center space-y-3">
                    <div className="relative w-36 h-48 rounded-xl overflow-hidden border border-slate-200 shadow-md bg-white">
                      <Image src={preview} alt="Receipt preview" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          setPreview(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
                      {file?.name}
                    </span>
                  </div>
                ) : file ? (
                  <div className="text-center space-y-2">
                    <FileImage className="w-8 h-8 text-purple-700 mx-auto" />
                    <span className="text-xs font-bold text-slate-800 block">{file.name}</span>
                    <span className="text-[10px] text-emerald-600 font-bold block">✓ Archivo adjunto</span>
                  </div>
                ) : (
                  <div className="text-center space-y-2 py-2">
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">
                      {lang === "es" ? "Haz clic o arrastra tu comprobante aquí" : "Click or drag your receipt here"}
                    </p>
                    <p className="text-[10px] text-slate-400">JPG, PNG, WEBP o PDF hasta 8MB</p>
                  </div>
                )}
              </label>

              {/* Obligatory Contact Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-purple-700" />
                    <span>{lang === "es" ? "Teléfono de Contacto Obligatorio" : "Required Contact Phone"}</span>
                  </span>
                  <span className="text-[10px] text-purple-700 font-bold uppercase">
                    {lang === "es" ? "Obligatorio" : "Required"}
                  </span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+506 8888-8888"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* FACTURA ELECTRÓNICA TOGGLE & FORM (Hacienda CR) */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setRequestFactura(!requestFactura)}
                  className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 text-left flex items-center justify-between gap-3 transition"
                >
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#0052CC]" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {lang === "es"
                          ? "Solicitar Factura Electrónica (IVA 13% ya incluido)"
                          : "Request Electronic Invoice (13% VAT already included)"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {lang === "es"
                          ? "Emisión oficial Hacienda Costa Rica desglosando el 13% de IVA"
                          : "Official Costa Rica Tax Invoice itemizing 13% VAT"}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      requestFactura ? "bg-[#0052CC] border-[#0052CC] text-white" : "border-slate-300 bg-white"
                    }`}
                  >
                    {requestFactura && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>

                {requestFactura && (
                  <div className="p-4 bg-white border-t border-slate-100 space-y-3 text-xs animate-in fade-in duration-200">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Razón Social / Nombre Completo <span className="text-[#0052CC]">*</span>
                      </label>
                      <input
                        type="text"
                        value={facturaCompanyName}
                        onChange={(e) => setFacturaCompanyName(e.target.value)}
                        placeholder="Nombre registrado en Hacienda"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0052CC]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-5">
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Tipo Cédula <span className="text-[#0052CC]">*</span>
                        </label>
                        <select
                          value={facturaIdType}
                          onChange={(e: any) => setFacturaIdType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#0052CC]"
                        >
                          <option value="JURIDICA">Jurídica</option>
                          <option value="FISICA">Física</option>
                          <option value="DIMEX">DIMEX</option>
                          <option value="NITE">NITE</option>
                        </select>
                      </div>

                      <div className="sm:col-span-7">
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Número de Cédula <span className="text-[#0052CC]">*</span>
                        </label>
                        <input
                          type="text"
                          value={facturaIdNumber}
                          onChange={(e) => setFacturaIdNumber(e.target.value)}
                          placeholder="3-101-XXXXXX"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0052CC]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Correo de Facturación <span className="text-[#0052CC]">*</span>
                      </label>
                      <input
                        type="email"
                        value={facturaEmail}
                        onChange={(e) => setFacturaEmail(e.target.value)}
                        placeholder="facturacion@empresa.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0052CC]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Teléfono de Facturación
                      </label>
                      <input
                        type="tel"
                        value={facturaPhone}
                        onChange={(e) => setFacturaPhone(e.target.value)}
                        placeholder="+506 2222-3333"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-[#0052CC]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Actividad Económica
                      </label>
                      <input
                        type="text"
                        value={facturaEconomicActivity}
                        onChange={(e) => setFacturaEconomicActivity(e.target.value)}
                        placeholder="Código de actividad o descripción"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0052CC]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Mandatory Legal Acceptance */}
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 leading-snug p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 accent-purple-700 w-4 h-4 rounded"
                />
                <span>
                  {lang === "es"
                    ? "Confirmo haber realizado la transferencia bancaria por concepto de mano de obra y acepto los términos de servicio técnico y entrega de ZxZ Mods."
                    : "I confirm the bank transfer for technical labor and accept ZxZ Mods service and handover policies."}
                </span>
              </label>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || isSubmittingBac}
                className="w-full py-4 rounded-2xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? "Registrando Pago..."
                    : lang === "es"
                    ? "Confirmar Pago de Mano de Obra"
                    : "Confirm Labor Payment"}
                </span>
              </button>

              {/* Secondary BAC Compra-Click Card Payment Button */}
              <button
                type="button"
                onClick={handleCardPayment}
                disabled={isSubmitting || isSubmittingBac}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2.5 cursor-pointer border border-slate-700/60"
                title={t.installationPayWithCardBacDesc}
              >
                {isSubmittingBac ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{t.installationPayWithCardGenerating}</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 text-[#E01E26]" />
                    <span>{t.installationPayWithCardBac}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Full-Screen Submission Animation Overlay (Matches Checkout Animation) */}
      <DjiPaymentAnimationOverlay
        isOpen={isSubmitting}
        step={submissionStep}
        title={
          submissionStep === 1
            ? lang === "es"
              ? "Subiendo Comprobante..."
              : "Uploading Receipt..."
            : submissionStep === 2
            ? lang === "es"
              ? "Registrando Pago de Instalación..."
              : "Registering Installation Payment..."
            : lang === "es"
            ? "¡Pago en Confirmación!"
            : "Payment in Confirmation!"
        }
        subtitle={
          submissionStep < 3
            ? lang === "es"
              ? "Estamos enlazando tu transferencia bancaria con el sistema ZxZ Mods..."
              : "Linking your bank transfer with the ZxZ Mods system..."
            : lang === "es"
            ? "Tu pago de instalación ha sido registrado con éxito. Redirigiendo a tu seguimiento en vivo..."
            : "Installation payment registered successfully. Redirecting to live tracking..."
        }
        lang={lang}
      />
    </div>
  );
}
