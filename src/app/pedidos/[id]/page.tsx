"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { GarageModal } from "@/components/garage/GarageModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingConcierge } from "@/components/home/FloatingConcierge";
import { ProfileDrawer } from "@/components/profile/ProfileDrawer";
import { CustomerZxzCertModal } from "@/components/orders/CustomerZxzCertModal";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { getWhatsAppUrl } from "@/config/company";
import { formatCRC, formatUSD, convertCRCToUSD } from "@/lib/i18n";
import { hasAnyConfirmedPayment } from "@/lib/orderReceipt";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Wrench,
  MapPin,
  MessageCircle,
  ArrowLeft,
  Calendar,
  CreditCard,
  Send,
  Printer,
  Package,
  Home,
  Tag,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  ClipboardList,
  Plane,
  Eye,
  Upload,
  X,
  Building2,
  Receipt,
  Mail,
  Phone,
  ChevronRight,
  Lock,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

interface OrderComment {
  id: string;
  authorRole: "CUSTOMER" | "STAFF" | "SYSTEM";
  authorName: string;
  text: string;
  createdAt: string;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  userId?: string | null;
  guestEmail?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  shippingAddress?: string | null;
  serviceType: string;
  notes?: string | null;
  totalCRC: number;
  partsSubtotalCRC: number;
  laborSubtotalCRC: number;
  shippingCostCRC: number;
  installationCostCRC: number;
  paidCurrency?: string | null;
  discountType?: string;
  discountValue?: number;
  discountReason?: string | null;
  discountCRC?: number;
  taxCRC?: number;
  requiresElectronicInvoice?: boolean;
  electronicInvoiceJson?: string | null;
  items: any[];
  comments: OrderComment[];
  isCotizacion: boolean;
  daysRemaining: number | null;
  isServiceScheduled?: boolean;
  serviceSchedule?: any;
  isInstallationPaymentConfirmed?: boolean;
  paymentMethod?: string | null;
  serviceDocumentsJson?: string | null;
  claimToken?: string | null;
  paymentProofUrl?: string | null;
  servicePaymentProofUrl?: string | null;
  installationPaymentProofUrl?: string | null;
  paymentRejectionReason?: string | null;
  isCertified?: boolean;
  zxzCertificationJson?: string | null;
  createdAt: string;
  updatedAt: string;
}

import {
  getCustomerOrderStages,
  CUSTOMER_ORDER_STAGES,
  COTIZACION_STAGES,
  getCustomerOrderStepIndex,
  shouldSkipInstallationPayment,
  isPaymentConfirmedOrMore,
  getWorkflowStatusBadge,
  getServiceParamFromOrder,
  isOrderInProgramServiceStage,
  isOrderInInstallationPaymentStage,
  isOrderAfterWarehouseCheck,
  canPayInstallation,
  isInstallationPaymentPaidOrConfirmed,
  isServiceRequiringInstallation,
  isRejectedPaymentCorrected,
} from "@/lib/orderWorkflow";
import { getOrderPendingInstallationCost } from "@/lib/orderServices";

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = (params?.id as string) || "";
  const autoOpenPay = searchParams?.get("action") === "pay";

  const { user } = useAuth();
  const { currency, setCurrency, sellRate, activeQuotation, clearActiveQuotation } = useCart();
  const { t, lang } = useLanguage();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comments state
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Pay modal state
  const [payModalOpen, setPayModalOpen] = useState(autoOpenPay);
  const [selectedPayMethod, setSelectedPayMethod] = useState<"BANK_TRANSFER" | "WHATSAPP">("BANK_TRANSFER");
  const [modalPayCurrency, setModalPayCurrency] = useState<"CRC" | "USD">(currency);
  const [payReference, setPayReference] = useState("");
  const [payPhone, setPayPhone] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [payReceiptFile, setPayReceiptFile] = useState<File | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState<string | null>(null);

  // Client installation and service proof state
  const [clientProofModalUrl, setClientProofModalUrl] = useState<string | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);

  // Small Upload Payment Proof modal state (BAC / Wire Transfer direct upload)
  const [uploadProofModalOpen, setUploadProofModalOpen] = useState(false);
  const [uploadingDirectProof, setUploadingDirectProof] = useState(false);
  const [directProofFile, setDirectProofFile] = useState<File | null>(null);
  const [directProofSuccess, setDirectProofSuccess] = useState<string | null>(null);

  useEffect(() => {
    setModalPayCurrency(currency);
  }, [currency]);

  useEffect(() => {
    if (searchParams?.get("action") === "pay") {
      setPayModalOpen(true);
    }
  }, [searchParams]);

  // Fetch order data dynamically
  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      let tokenParam = searchParams?.get("token") || "";
      if (!tokenParam && typeof window !== "undefined") {
        try {
          tokenParam = localStorage.getItem(`zxz_claim_token_${orderId}`) || "";
        } catch {}
      }
      const url = `/api/orders/${orderId}${tokenParam ? `?token=${encodeURIComponent(tokenParam)}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
        setError(null);

        if (data.order.claimToken && typeof window !== "undefined") {
          try {
            localStorage.setItem(`zxz_claim_token_${data.order.id}`, data.order.claimToken);
            localStorage.setItem(`zxz_claim_token_${data.order.orderNumber}`, data.order.claimToken);
          } catch {}
        }

        // User rule: if order was active quotation but has been updated to payment confirmation (or non-COTIZACION status), clear cart advert!
        if (
          activeQuotation &&
          (activeQuotation.id === data.order.id || activeQuotation.orderNumber === data.order.orderNumber) &&
          String(data.order.status || "").toUpperCase() !== "COTIZACION"
        ) {
          clearActiveQuotation();
        }

        try {
          const stored = JSON.parse(localStorage.getItem("zxz_tracked_orders") || "[]");
          const list = Array.isArray(stored) ? stored : [];
          const updated = Array.from(new Set([data.order.id, data.order.orderNumber, ...list])).slice(0, 25);
          localStorage.setItem("zxz_tracked_orders", JSON.stringify(updated));
        } catch {}
      } else {
        setError(data.error || (lang === "es" ? "No se pudo cargar la orden" : "Failed to load order"));
      }
    } catch (err: any) {
      console.error("Error fetching order:", err);
      setError(lang === "es" ? "Error de conexión al cargar la orden" : "Network error loading order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  // Handle posting a comment / request
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment || !order) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: commentText.trim(),
          authorName: user?.displayName || order.customerName || (lang === "es" ? "Cliente" : "Customer"),
          authorRole: "CUSTOMER",
        }),
      });
      const data = await res.json();
      if (data.success && data.comments) {
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                comments: data.comments,
                updatedAt: new Date().toISOString(),
                daysRemaining: 60, // Reset expiration timer to 60 days on update
              }
            : null
        );
        setCommentText("");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle fixing payment when order is in PAYMENT_REJECTED (user ONLY needs to update receipt image)
  const handleFixRejectedPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingPayment || !order || !payReceiptFile) return;

    setSubmittingPayment(true);
    try {
      const formData = new FormData();
      formData.append("file", payReceiptFile);
      const upRes = await fetch("/api/upload/payment", {
        method: "POST",
        body: formData,
      });
      const upData = await upRes.json();
      if (!upRes.ok || !upData.success || !upData.url) {
        throw new Error(upData.error || (lang === "es" ? "Error al subir comprobante" : "Upload failed"));
      }

      const uploadedProofUrl = upData.url;

      const res = await fetch(`/api/orders/${order.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentProofUrl: uploadedProofUrl,
          paidCurrency: order.paidCurrency || modalPayCurrency,
        }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setPaySuccessMsg(
          lang === "es"
            ? "¡Comprobante actualizado exitosamente! El taller revisará los fondos en breve."
            : "Payment receipt updated successfully! Workshop staff will review shortly."
        );
        clearActiveQuotation();
        window.dispatchEvent(new Event("zxz-order-updated"));
        await fetchOrder();
        setTimeout(() => {
          setPayModalOpen(false);
          setPaySuccessMsg(null);
          setPayReceiptFile(null);
        }, 2000);
      } else {
        alert(data.error || (lang === "es" ? "Error al registrar el comprobante" : "Error updating receipt"));
      }
    } catch (err: any) {
      console.error("Error submitting fixed payment proof:", err);
      alert(err.message || (lang === "es" ? "Error de conexión al procesar comprobante" : "Network error"));
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Handle direct upload of payment proof (BAC / Wire Transfer) from the Order Overview
  const handleUploadProofAndConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingDirectProof || !order || !directProofFile) return;

    setUploadingDirectProof(true);
    try {
      const formData = new FormData();
      formData.append("file", directProofFile);
      const upRes = await fetch("/api/upload/payment", {
        method: "POST",
        body: formData,
      });
      const upData = await upRes.json();
      if (!upRes.ok || !upData.success || !upData.url) {
        throw new Error(upData.error || (lang === "es" ? "Error al subir comprobante" : "Upload failed"));
      }

      const uploadedProofUrl = upData.url;
      let tokenParam = searchParams?.get("token") || "";
      if (!tokenParam && typeof window !== "undefined") {
        try {
          tokenParam = localStorage.getItem(`zxz_claim_token_${order.id}`) || "";
        } catch {}
      }

      const res = await fetch(`/api/orders/${order.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentProofUrl: uploadedProofUrl,
          paidCurrency: modalPayCurrency,
          claimToken: tokenParam || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setDirectProofSuccess(
          t.orderUploadProofSuccessMsg ||
            (lang === "es"
              ? "¡Comprobante enviado exitosamente! Tu orden ha pasado a Confirmación de Pago."
              : "Receipt uploaded successfully! Your order has moved to Payment Confirmation.")
        );
        clearActiveQuotation();
        window.dispatchEvent(new Event("zxz-order-updated"));
        await fetchOrder();
        setTimeout(() => {
          setUploadProofModalOpen(false);
          setDirectProofSuccess(null);
          setDirectProofFile(null);
        }, 2200);
      } else {
        alert(data.error || (lang === "es" ? "Error al registrar el comprobante" : "Error updating receipt"));
      }
    } catch (err: any) {
      console.error("Error submitting direct payment proof:", err);
      alert(err.message || (lang === "es" ? "Error de conexión al procesar comprobante" : "Network error"));
    } finally {
      setUploadingDirectProof(false);
    }
  };

  // Handle proceeding with payment (normal payment flow)
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingPayment || !order) return;

    setSubmittingPayment(true);
    try {
      let uploadedProofUrl = order.paymentProofUrl || null;
      if (payReceiptFile) {
        const formData = new FormData();
        formData.append("file", payReceiptFile);
        const upRes = await fetch("/api/upload/payment", {
          method: "POST",
          body: formData,
        });
        const upData = await upRes.json();
        if (upData.success && upData.url) {
          uploadedProofUrl = upData.url;
        }
      }

      const res = await fetch(`/api/orders/${order.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: selectedPayMethod,
          referenceNumber: payReference.trim(),
          customerPhone: payPhone.trim(),
          notes: payNotes.trim(),
          paidCurrency: modalPayCurrency,
          paymentProofUrl: uploadedProofUrl,
        }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        // User Rule: once an order type '#COT' gets updated by the user to payment confirmation,
        // the advertisement on the cart disappears since the order got paid.
        clearActiveQuotation();
        window.dispatchEvent(new Event("zxz-order-updated"));
        setPaySuccessMsg(t.orderPaymentSuccessMsg);
        await fetchOrder();
        setTimeout(() => {
          setPayModalOpen(false);
          setPaySuccessMsg(null);
        }, 2500);
      } else {
        alert(data.error || "Error al registrar el pago");
      }
    } catch (err) {
      console.error("Error submitting payment:", err);
      alert("Error de conexión al procesar el pago");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const isQuote = order?.isCotizacion || order?.status?.toUpperCase() === "COTIZACION";
  const isRejected = order?.status?.toUpperCase() === "PAYMENT_REJECTED";
  const isPaymentCorrected = Boolean(isRejected && isRejectedPaymentCorrected(order));
  const hasPaid = order ? (!isRejected && isPaymentConfirmedOrMore(order.status)) : false;
  const isCurrencyBonded = Boolean(
    order &&
    (order.paidCurrency || (order.status && order.status.toUpperCase() !== "COTIZACION"))
  );
  const isOrderPaid = Boolean(
    order && (hasPaid || (order.paidCurrency && !isQuote) || Boolean(order.paymentProofUrl))
  );

  const paidCurrency = order?.paidCurrency
    ? (order.paidCurrency.toUpperCase() === "USD" ? "USD" : "CRC")
    : "CRC";

  const displayCurrency = isCurrencyBonded ? paidCurrency : currency;

  const formatPrice = (amountCRC: number) => {
    if (displayCurrency === "USD") {
      return formatUSD(convertCRCToUSD(amountCRC, sellRate));
    }
    return formatCRC(amountCRC);
  };

  const getStatusBadge = (status: string) => {
    return getWorkflowStatusBadge(status, lang);
  };

  const skipInstallationPayment = order ? shouldSkipInstallationPayment(order, order.installationCostCRC, order.laborSubtotalCRC) : false;
  const isPaidInstallation = Boolean(order && isInstallationPaymentPaidOrConfirmed(order));
  const stepIndex = order
    ? isQuote
      ? 1
      : getCustomerOrderStepIndex(order.status, order.serviceType, skipInstallationPayment, (order as any).serviceDocumentsJson, isPaidInstallation)
    : 1;
  const isPaymentStatusUpdated = Boolean(
    order && (
      (order.paymentProofUrl && order.paymentProofUrl.trim().length > 0) ||
      isPaymentConfirmedOrMore(order.status) ||
      order.status === "PAYMENT_CONFIRMATION" ||
      order.isInstallationPaymentConfirmed
    )
  );
  const isServiceProgrammed = Boolean(order?.isServiceScheduled || stepIndex > 5);
  const isProgramService = Boolean(
    order &&
    !isQuote &&
    !isRejected &&
    order.status?.toUpperCase() !== "CONFIRM_SERVICE_PAYMENT" &&
    (order.status?.toUpperCase() === "PROGRAM_SERVICE" || stepIndex === 5)
  );
  const customerStages = order
    ? getCustomerOrderStages(order.serviceType, isServiceProgrammed, skipInstallationPayment, isPaidInstallation)
    : getCustomerOrderStages("shop_installation", false, false, false);

  // True only after the client has chosen/scheduled a service that includes labor cost
  const isLaborServiceType = Boolean(
    order?.serviceType === "shop_installation" ||
    order?.serviceType === "installation" ||
    order?.serviceType === "pickup" ||
    order?.serviceType === "UTV_PICKUP" ||
    order?.serviceType === "HOME_SERVICE" ||
    (order?.serviceSchedule && ["shop_installation", "installation", "pickup"].includes(order.serviceSchedule.serviceType))
  );

  const hasChosenLaborService = Boolean(
    order && (
      (isQuote && ((order.laborSubtotalCRC && order.laborSubtotalCRC > 0) || (order.installationCostCRC && order.installationCostCRC > 0))) ||
      (
        isLaborServiceType &&
        (
          order.isServiceScheduled ||
          order.serviceSchedule ||
          order.installationPaymentProofUrl ||
          order.isInstallationPaymentConfirmed ||
          order.status === "INSTALLATION_PAYMENT" ||
          order.status === "INSTALLED" ||
          order.status === "READY_FOR_PICKUP" ||
          order.status === "COMPLETED"
        )
      )
    )
  );

  const effectiveLaborCost = useMemo(() => {
    if (!order) return 0;
    return order.installationCostCRC || order.laborSubtotalCRC || order.serviceSchedule?.costCRC || 0;
  }, [order]);

  // Real-time calculation of order discount amount in CRC (only real applied discounts)
  const orderDiscountCRC = useMemo(() => {
    if (!order) return 0;
    if (typeof order.discountCRC === "number" && order.discountCRC > 0) return order.discountCRC;
    return 0;
  }, [order]);

  // Electronic Invoice data parsed
  const electronicInvoice = useMemo(() => {
    if (!order?.electronicInvoiceJson) return null;
    try {
      return JSON.parse(order.electronicInvoiceJson);
    } catch {
      return null;
    }
  }, [order?.electronicInvoiceJson]);

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#111827] flex flex-col justify-between antialiased">
      <NotificationBanner />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 w-full">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <Link
            href="/"
            className="hover:text-black flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === "es" ? "Inicio" : "Home"}</span>
          </Link>
          <span>/</span>
          <Link href="/pedidos" className="hover:text-black transition-colors">
            <span>{t.ordersPageTitle}</span>
          </Link>
          <span>/</span>
          <span className={`font-semibold font-mono ${isRejected ? "text-rose-600 font-bold" : "text-gray-900"}`}>
            {order ? `#${order.orderNumber}` : orderId}
          </span>
        </div>

        {/* Loading Animated Skeleton (Rule 7) */}
        {loading ? (
          <div className="space-y-6 animate-pulse">
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-48" />
                  <div className="h-4 bg-gray-200 rounded w-32" />
                </div>
                <div className="h-8 bg-gray-200 rounded-full w-36" />
              </div>
              <div className="h-20 bg-gray-100 rounded-2xl" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-4">
                <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4">
                  <div className="h-5 bg-gray-200 rounded w-40" />
                  <div className="h-16 bg-gray-100 rounded-xl" />
                  <div className="h-16 bg-gray-100 rounded-xl" />
                </div>
              </div>
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-4">
                  <div className="h-5 bg-gray-200 rounded w-36" />
                  <div className="h-32 bg-gray-100 rounded-xl" />
                </div>
              </div>
            </div>
          </div>
        ) : error || !order ? (
          /* Error / Expired state */
          <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-14 text-center max-w-lg mx-auto shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900">
              {lang === "es" ? "No se pudo encontrar la orden" : "Order Not Found"}
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
              {error}
            </p>
            <div className="pt-3 flex justify-center gap-3">
              <Link
                href="/pedidos"
                className="px-5 py-2.5 rounded-xl bg-[#111827] hover:bg-[#0052CC] text-white text-xs font-bold transition-colors shadow-sm"
              >
                {t.orderBackToOrders}
              </Link>
              <Link
                href="/carrito"
                className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors"
              >
                {lang === "es" ? "Ir al Carrito" : "Go to Cart"}
              </Link>
            </div>
          </div>
        ) : (
          /* Main Order Detail Content */
          <div className="space-y-6">
            
            {/* Top Bar with distinct styling for Rejected vs Cotización vs Placed Order */}
            <div
              className={`bg-white rounded-3xl border p-6 sm:p-8 shadow-xs transition-all ${
                isRejected
                  ? "border-rose-300 border-t-4 border-t-rose-600 bg-rose-50/20"
                  : isQuote
                  ? "border-purple-200/90 border-t-4 border-t-purple-600"
                  : "border-slate-200/90 border-t-4 border-t-[#0052CC]"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {/* Clear distinction badge between Rejected, Quote and Placed Order */}
                    {isRejected ? (
                      isPaymentCorrected ? (
                        <span className="text-xs font-mono font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping shrink-0" />
                          <span>● {t.orderRejectedCorrectedCustomerTitle || (lang === "es" ? "COMPROBANTE EN REVISIÓN" : "RECEIPT UNDER REVIEW")}</span>
                        </span>
                      ) : (
                        <span className="text-xs font-mono font-extrabold text-rose-800 bg-rose-100/90 border border-rose-300 px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>{lang === "es" ? "PAGO RECHAZADO" : "PAYMENT REJECTED"}</span>
                        </span>
                      )
                    ) : isQuote ? (
                      <span className="text-xs font-mono font-extrabold text-purple-800 bg-purple-50 border border-purple-200 px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                        <ClipboardList className="w-3.5 h-3.5 text-purple-600" />
                        <span>COTIZACIÓN PROFORMA</span>
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-extrabold text-[#0052CC] bg-[#EBF3FC] border border-[#C2DBFE] px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-[#0052CC]" />
                        <span>PEDIDO EN FIRME</span>
                      </span>
                    )}

                    <span className={`text-xs px-2.5 py-0.5 rounded-md font-mono font-bold ${
                      isRejected ? "bg-rose-100 text-rose-800 border border-rose-300" : "bg-gray-100 text-gray-700"
                    }`}>
                      #{order.orderNumber}
                    </span>
                  </div>

                  <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    isRejected ? (isPaymentCorrected ? "text-emerald-950" : "text-rose-950") : "text-gray-900"
                  }`}>
                    {isRejected
                      ? (isPaymentCorrected
                        ? (lang === "es" ? "Pago Corregido - Comprobante en Revisión" : "Payment Corrected - Receipt Under Review")
                        : (lang === "es" ? "Pago Rechazado - Corrección Requerida" : "Payment Rejected - Action Required"))
                      : isQuote
                      ? (lang === "es" ? "Cotización de Accesorios & Taller" : "Custom Accessories Quotation")
                      : t.orderDetailsTitle}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-1.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        {new Date(order.createdAt).toLocaleDateString(lang === "es" ? "es-CR" : "en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </span>
                    <span>•</span>
                    <span>
                      {lang === "es" ? "Última actualización:" : "Last updated:"}{" "}
                      {new Date(order.updatedAt).toLocaleDateString(lang === "es" ? "es-CR" : "en-US")}
                    </span>
                  </div>
                </div>

                {/* Right Header: Status Badge & Currency Toggle */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Currency selector: ONLY show if order is NOT bonded to a currency! */}
                  {!isCurrencyBonded ? (
                    <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setCurrency("CRC")}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          currency === "CRC" ? "bg-white text-[#0052CC] shadow-2xs" : "text-gray-600"
                        }`}
                      >
                        ₡ CRC
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrency("USD")}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          currency === "USD" ? "bg-white text-[#0052CC] shadow-2xs" : "text-gray-600"
                        }`}
                      >
                        $ USD
                      </button>
                    </div>
                  ) : (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border ${
                      isRejected
                        ? "bg-rose-50 text-rose-900 border-rose-200"
                        : "bg-gray-100/90 text-gray-800 border-gray-200"
                    }`}>
                      <Tag className={`w-3.5 h-3.5 ${isRejected ? "text-rose-600" : "text-[#0052CC]"}`} />
                      <span>{displayCurrency === "USD" ? "$ USD" : "₡ CRC"}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                        isRejected
                          ? "text-rose-800 bg-rose-100 border-rose-300"
                          : "text-emerald-700 bg-emerald-50 border-emerald-200"
                      }`}>
                        {displayCurrency === "USD" ? t.orderPaidInUSD : t.orderPaidInCRC}
                      </span>
                    </div>
                  )}

                  {/* Status Badge */}
                  {(() => {
                    const st = getStatusBadge(order.status);
                    const Icon = st.icon;
                    return (
                      <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${st.bg}`}>
                        <Icon className="w-4 h-4" />
                        <span>{st.label}</span>
                      </span>
                    );
                  })()}

                  {/* Minimalistic Download Receipt Button (ONLY shown after payment has been confirmed!) */}
                  {order && hasAnyConfirmedPayment(order) && (
                    <Link
                      href={`/pedidos/${order.id}/comprobante?lang=${lang}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 text-xs font-semibold transition-all shadow-2xs group"
                      title={t.orderDownloadReceipt}
                    >
                      <Receipt className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 transition-colors" />
                      <span>{t.orderDownloadReceipt}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-gray-300 group-hover:text-gray-500" />
                    </Link>
                  )}
                </div>
              </div>

              {/* Special Quotation Notice & Expiration Banner */}
              {isQuote && (
                <div className="mt-5 p-4 rounded-2xl bg-purple-50/80 border border-purple-200/90 text-purple-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <strong className="text-xs font-extrabold uppercase tracking-wide text-purple-900">
                        {lang === "es" ? "Cotización Abierta para Edición y Consulta Técnica" : "Quotation Open for Staff Customization"}
                      </strong>
                    </div>
                    <p className="text-xs text-purple-900/80 leading-relaxed max-w-2xl">
                      {lang === "es"
                        ? "Esta cotización no representa un pedido en firme hasta confirmar el pago. Vence automáticamente en 60 días sin actividad."
                        : "This quotation is not a confirmed order until payment is verified. Expires in 60 days of inactivity."}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="px-3.5 py-2 rounded-xl bg-white border border-purple-200 text-center shadow-2xs">
                      <span className="block text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                        {lang === "es" ? "Vigencia Restante" : "Days Remaining"}
                      </span>
                      <span className="text-sm font-black font-mono text-purple-700">
                        {order.daysRemaining !== null ? `${order.daysRemaining} días` : "60 días"}
                      </span>
                    </div>

                    {!hasPaid && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setUploadProofModalOpen(true)}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                        >
                          <Upload className="w-4 h-4" />
                          <span>{t.orderUploadPaymentProofBtn}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayModalOpen(true)}
                          className="px-4 py-2.5 rounded-xl bg-[#0052CC] hover:bg-[#0040A8] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>{t.orderProceedToPay}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* BAC Compra Click Notice Banner */}
              {isQuote && !hasPaid && !order.paymentProofUrl && Boolean(
                order.notes?.includes("BAC") ||
                order.paymentMethod === "BAC_COMPRA_CLICK" ||
                order.serviceDocumentsJson?.includes("BAC_COMPRA_CLICK")
              ) && (
                <div className="mt-4 p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-950 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-[#E01E26] text-white shrink-0 mt-0.5">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-black uppercase tracking-wider text-rose-950">
                        {lang === "es" ? "Pago con Tarjeta (BAC Compra-Click)" : "Credit/Debit Card Payment (BAC Compra-Click)"}
                      </div>
                      <p className="text-xs text-rose-900/80 leading-relaxed max-w-2xl">
                        {lang === "es"
                          ? "Una vez completado tu pago mediante el enlace del BAC que te enviamos, adjunta aquí la foto o captura de tu comprobante para verificar tus fondos y confirmar tu pedido."
                          : "Once your payment is completed using the BAC link sent to you, upload your receipt here to verify funds and confirm your order."}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadProofModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-[#E01E26] hover:bg-[#C0181F] text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-red-600/20 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{t.orderUploadPaymentProofBtn}</span>
                  </button>
                </div>
              )}

              {/* Payment Rejection Banner (User Requirement) */}
              {isRejected && (
                isPaymentCorrected ? (
                  <div className="mt-5 p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0 shadow-xs">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-extrabold text-emerald-950 uppercase tracking-wide flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping shrink-0" />
                            <span>● {t.orderRejectedCorrectedCustomerTitle || (lang === "es" ? "Comprobante Corregido en Revisión" : "Corrected Receipt Under Review")}</span>
                          </h3>
                          <p className="text-xs text-emerald-900 leading-relaxed max-w-2xl font-medium">
                            {t.orderRejectedCorrectedCustomerNotice || (lang === "es"
                              ? "Hemos recibido tu nuevo comprobante de pago. Nuestro equipo del taller lo está verificando para continuar con tu orden."
                              : "We received your updated payment receipt. Our workshop team is reviewing it shortly to proceed with your order.")}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPayModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0 self-stretch sm:self-auto justify-center"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>{t.orderReuploadProofBtn}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2.5 bg-rose-600 text-white rounded-xl shrink-0 shadow-xs">
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-extrabold text-rose-950 uppercase tracking-wide">
                            {t.orderRejectedCustomerAlert}
                          </h3>
                          <p className="text-xs text-rose-900 leading-relaxed max-w-2xl">
                            {t.orderRejectedCustomerAdvice}
                          </p>
                          {/* Display reason from staff */}
                          {(() => {
                            const rejComment = [...order.comments]
                              .reverse()
                              .find(
                                (c) =>
                                  c.authorRole === "STAFF" &&
                                  c.text.toLowerCase().includes("rechaz")
                              );
                            const reasonText = rejComment
                              ? rejComment.text.replace(/^Pago Rechazado:\s*/i, "")
                              : (order.notes || "");
                            if (!reasonText) return null;
                            return (
                              <div className="mt-2 p-3 bg-white/95 rounded-xl border border-rose-200 text-xs text-rose-950 space-y-0.5 shadow-2xs">
                                <span className="font-bold text-[11px] text-rose-800 block">
                                  {lang === "es" ? "Motivo indicado por el taller:" : "Reason noted by workshop:"}
                                </span>
                                <p className="font-medium text-slate-800 leading-snug">{reasonText}</p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPayModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0 self-stretch sm:self-auto justify-center"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>{t.orderReuploadProofBtn}</span>
                      </button>
                    </div>
                  </div>
                )
              )}

              {/* Order Stages Stepper (Shows all customer-facing stages, excluding *un states) */}
              <div className="pt-6 mt-2 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    {isQuote
                      ? (lang === "es" ? "Etapas de la Cotización" : "Quotation Stages")
                      : (lang === "es" ? "Estado del Flujo de la Orden" : "Order Workflow Stages")}
                  </span>

                  {/* OM-01: Bullet point for Payment Confirmation in order status tracking */}
                  {!isQuote && (
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
                  )}
                </div>

                {isQuote ? (
                  /* 3-Step Quotation Stepper */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {COTIZACION_STAGES.map((st) => {
                      const isCurrent = st.stepNum === 1;
                      const Icon = st.icon;
                      return (
                        <div
                          key={st.stepNum}
                          className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                            isCurrent
                              ? "bg-purple-50/80 border-purple-300 ring-2 ring-purple-100 text-purple-950"
                              : "bg-gray-50/70 border-gray-200 text-gray-500"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                              isCurrent ? "bg-purple-600 text-white shadow-xs" : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold block truncate text-gray-900">{st.labelEs}</span>
                            <span className="text-[10px] block truncate text-gray-500">{st.subEs}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Dynamic Customer Order Stepper (Service-dependent Stages) */
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-flow-col lg:auto-cols-fr gap-2.5">
                    {customerStages.map((st) => {
                      const isDone = stepIndex > st.stepNum;
                      const isCurrent = stepIndex === st.stepNum;
                      const isCurrentRejected = isRejected && isCurrent;
                      const Icon = isCurrentRejected ? AlertCircle : st.icon;

                      return (
                        <div
                          key={st.id}
                          className={`p-3 rounded-2xl border flex flex-col justify-between min-h-[76px] transition-all ${
                            isDone
                              ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                              : isCurrentRejected
                              ? "bg-rose-50 border-rose-300 ring-2 ring-rose-200 text-rose-950 shadow-xs"
                              : isCurrent
                              ? "bg-[#EBF3FC] border-[#0052CC] ring-2 ring-[#0052CC]/15 text-[#0A2540]"
                              : "bg-gray-50/70 border-gray-200 text-gray-400"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-mono font-bold ${
                              isCurrentRejected ? "text-rose-600" : "text-gray-400"
                            }`}>
                              0{st.stepNum}
                            </span>
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isDone
                                  ? "bg-emerald-600 text-white"
                                  : isCurrentRejected
                                  ? "bg-rose-600 text-white animate-pulse"
                                  : isCurrent
                                  ? "bg-[#0052CC] text-white"
                                  : "bg-gray-200 text-gray-500"
                              }`}
                            >
                              {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3 h-3" />}
                            </div>
                          </div>
                          <div>
                            <span className={`text-[11px] font-bold block leading-tight ${
                              isCurrentRejected
                                ? "text-rose-900 font-extrabold"
                                : isDone || isCurrent
                                ? "text-gray-900"
                                : "text-gray-400"
                            }`}>
                              {lang === "es" ? st.labelEs : st.labelEn}
                            </span>
                            <span className={`text-[9px] block mt-0.5 truncate ${
                              isCurrentRejected ? "text-rose-700 font-medium" : "text-gray-500"
                            }`}>
                              {isCurrentRejected
                                ? isPaymentCorrected
                                  ? (lang === "es" ? "Comprobante en revisión" : "Receipt under review")
                                  : (lang === "es" ? "Comprobante rechazado" : "Receipt rejected")
                                : (lang === "es" ? st.subEs : st.subEn)}
                            </span>
                            {st.stepNum === 1 && isPaymentStatusUpdated && !isCurrentRejected && (
                              <span className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[8px] font-extrabold uppercase tracking-wider border border-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                <span>{lang === "es" ? "Actualizado" : "Updated"}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Banner / Prompt for Programar Servicio */}
                {isProgramService && order && (
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col gap-3 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0052CC] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-gray-900">
                            {order.isServiceScheduled
                              ? (lang === "es" ? "Cita de servicio agendada" : "Service appointment scheduled")
                              : t.orderScheduleServiceBannerTitle}
                          </h4>
                          <p className="text-[11px] text-gray-600">
                            {order.isServiceScheduled
                              ? (lang === "es" ? "Puedes consultar los detalles de tu cita o reprogramar si es necesario." : "You can check your appointment details or reschedule if needed.")
                              : t.orderScheduleServiceBannerSubtitle}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={
                          order.isServiceScheduled
                            ? `/servicios?orderId=${order.id}&orderNumber=${order.orderNumber}&service=${getServiceParamFromOrder(order.serviceType)}`
                            : `/servicios?orderId=${order.id}&orderNumber=${order.orderNumber}`
                        }
                        className="px-5 py-2.5 rounded-xl bg-[#0052CC] hover:bg-[#0040A8] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm shrink-0 flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>
                          {order.isServiceScheduled
                            ? t.orderRescheduleServiceBtn
                            : t.orderScheduleServiceBtn}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>

                    {/* Prominent Installation Cost Indicator (User Requirement) */}
                    {(order.laborSubtotalCRC > 0 || (order.installationCostCRC && order.installationCostCRC > 0)) && (
                      <div className="pt-2.5 border-t border-blue-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 text-blue-950 font-bold">
                          <Wrench className="w-4 h-4 text-blue-700 shrink-0" />
                          <span>
                            {lang === "es" ? "Costo de Mano de Obra (Instalación):" : "Estimated Labor / Installation Cost:"}
                          </span>
                          <span className="font-mono text-sm font-black text-purple-900 bg-white px-2.5 py-0.5 rounded-lg border border-purple-200 shadow-2xs">
                            {formatCRC(order.installationCostCRC || order.laborSubtotalCRC)}
                          </span>
                        </div>
                        <span className="text-[10.5px] text-blue-800 italic">
                          {lang === "es"
                            ? "En servicio de retiro (Pick-up), la instalación se paga durante 'Instalando piezas'."
                            : "For vehicle pick-up service, labor is paid during 'Installing parts'."}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Banner for CONFIRM_SERVICE_PAYMENT */}
                {order.status === "CONFIRM_SERVICE_PAYMENT" && (
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border-2 border-blue-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-blue-950">
                          {lang === "es" ? "Comprobante de Servicio en Revisión" : "Service Payment Receipt Under Review"}
                        </h4>
                        <p className="text-[11px] text-blue-800 leading-relaxed">
                          {lang === "es"
                            ? "Tu cita de servicio y comprobante han sido recibidos. Nuestro staff está verificando el pago para iniciar la logística."
                            : "Your service appointment and receipt have been received. Our staff is verifying payment to begin logistics."}
                        </p>
                      </div>
                    </div>
                    {order.serviceSchedule && (
                      <div className="text-right shrink-0 bg-white/80 px-3 py-1.5 rounded-xl border border-blue-200">
                        <span className="text-[10px] font-bold text-blue-600 uppercase block tracking-wider">
                          {lang === "es" ? "Cita Asignada" : "Appointment Set"}
                        </span>
                        <span className="text-xs font-black text-blue-950 font-mono">
                          {order.serviceSchedule.scheduledDate} {order.serviceSchedule.timeSlot}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Banner for INSTALLING and INSTALLATION_PAYMENT (User Requirement: Enable paying installation during 'instalando piezas' & new 'pago de instalacion' state) */}
                {(order.status === "INSTALLING" || isOrderInInstallationPaymentStage(order.status)) && (
                  <div className="mt-4 p-5 rounded-3xl border-2 border-purple-400 bg-gradient-to-r from-purple-50 via-indigo-50/70 to-purple-50 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-md">
                          <Wrench className="w-6 h-6 animate-spin-slow" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-white text-purple-900 border-purple-300 shadow-2xs">
                              {skipInstallationPayment
                                ? (lang === "es" ? "Instalación en Taller" : "Workshop Installation")
                                : isOrderInInstallationPaymentStage(order.status)
                                ? (lang === "es" ? "Etapa: Pago de Instalación" : "Stage: Installation Payment")
                                : (lang === "es" ? "Instalando Piezas en Taller" : "Installing Parts in Workshop")}
                            </span>
                            {skipInstallationPayment ? (
                              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{lang === "es" ? "Instalación Gratuita Incluida" : "Free Installation Included"}</span>
                              </span>
                            ) : order.isInstallationPaymentConfirmed ? (
                              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{lang === "es" ? "Instalación Pagada y Confirmada" : "Labor Paid & Confirmed"}</span>
                              </span>
                            ) : order.installationPaymentProofUrl ? (
                              <span className="text-[11px] font-bold text-blue-800 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                <span>{lang === "es" ? "Comprobante de Instalación en Revisión" : "Labor Receipt Under Review"}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-purple-900 bg-purple-200/80 border border-purple-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                <CreditCard className="w-3.5 h-3.5 text-purple-700" />
                                <span>{lang === "es" ? "Pago de Instalación Requerido" : "Labor Payment Required"}</span>
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-black text-gray-900">
                            {skipInstallationPayment
                              ? (lang === "es" ? "Vehículo en Proceso de Instalación Técnica • Gratis" : "Vehicle Under Technical Installation • Free")
                              : isOrderInInstallationPaymentStage(order.status)
                              ? (lang === "es" ? "Piezas Instaladas • Pendiente Pago de Mano de Obra" : "Parts Installed • Pending Labor Payment")
                              : (lang === "es" ? "Vehículo en Proceso de Instalación Técnica" : "Vehicle Under Technical Installation")}
                          </h4>
                          <p className="text-xs text-gray-600 leading-relaxed max-w-xl">
                            {skipInstallationPayment
                              ? (lang === "es"
                                  ? "Nuestros mecánicos especialistas se encuentran instalando las piezas en taller. Tu orden incluye instalación gratuita, por lo que no se requiere ningún pago adicional de mano de obra."
                                  : "Our certified technicians are installing your parts in the workshop. Your order includes free installation, so no additional labor payment is required.")
                              : isOrderInInstallationPaymentStage(order.status)
                              ? (lang === "es"
                                  ? "Las piezas de tu orden han sido instaladas con éxito por nuestros mecánicos especialistas. Por favor realiza el pago de la mano de obra para que el staff confirme y proceda con la entrega de tu vehículo."
                                  : "Your parts have been successfully installed. Please complete the installation labor payment so our team can confirm and proceed with your vehicle delivery.")
                              : (lang === "es"
                                  ? "Nuestros mecánicos especialistas se encuentran instalando las piezas de tu orden en el taller. Una vez finalizada la instalación técnica, la orden pasará al estado 'Pago de Instalación' donde podrás realizar el pago de la mano de obra."
                                  : "Our certified technicians are installing your parts in the workshop. Once technical installation finishes, the order will advance to 'Installation Payment' where you can pay the labor fee.")}
                          </p>
                        </div>
                      </div>

                      {/* CTA to Pay Installation ONLY during INSTALLATION_PAYMENT state */}
                      <div className="flex flex-col sm:items-end gap-2 shrink-0">
                        {skipInstallationPayment ? (
                          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-xs font-bold shadow-2xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span>{lang === "es" ? "Instalación Gratuita" : "Free Installation"}</span>
                          </div>
                        ) : isOrderInInstallationPaymentStage(order.status) ? (
                          <Link
                            href={`/pedidos/${order.id}/pagar-instalacion`}
                            className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>
                              {order.isInstallationPaymentConfirmed
                                ? (lang === "es" ? "Ver Detalles de Mano de Obra" : "View Labor Details")
                                : order.installationPaymentProofUrl
                                ? (lang === "es" ? "Comprobante en Revisión" : "Receipt in Review")
                                : (lang === "es" ? "Pagar Mano de Obra" : "Pay Labor Fee")}
                            </span>
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-100/90 border border-purple-200 text-purple-900 text-xs font-bold shadow-2xs">
                            <Lock className="w-4 h-4 text-purple-700 shrink-0" />
                            <span>{lang === "es" ? "Pago bloqueado en instalación" : "Payment locked in installation"}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Delivery blocked banner */}
                    {skipInstallationPayment ? (
                      <div className="p-3 bg-white/80 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          {lang === "es"
                            ? "Mano de obra 100% gratuita incluida con tus productos. Tu vehículo pasará directamente a entrega o retiro al finalizar la instalación."
                            : "100% free labor included with your products. Your vehicle will advance directly to delivery or pickup once installation finishes."}
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 bg-white/80 rounded-2xl border border-purple-200 text-xs text-purple-950 flex items-center gap-2 shadow-2xs">
                        <Lock className="w-4 h-4 text-purple-700 shrink-0" />
                        <span>
                          {lang === "es"
                            ? "La entrega de vehículo se encuentra bloqueada durante la instalación. Podrá programarse una vez completado el trabajo y confirmado el pago."
                            : "Vehicle delivery scheduling is locked during installation. It will unlock once work is completed and payment is confirmed."}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Banner / Stage Action for READY_TO_SET_RETURN_DATE */}
                {order.status === "READY_TO_SET_RETURN_DATE" && (
                  <div className={`mt-4 p-5 rounded-3xl border-2 shadow-sm ${
                    order.isInstallationPaymentConfirmed
                      ? "bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-400"
                      : "bg-gradient-to-r from-purple-50 via-amber-50/70 to-purple-50 border-purple-400"
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-md ${
                          order.isInstallationPaymentConfirmed ? "bg-emerald-600" : "bg-purple-700"
                        }`}>
                          {order.isInstallationPaymentConfirmed ? (
                            <CheckCircle2 className="w-6 h-6" />
                          ) : (
                            <Wrench className="w-6 h-6" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-white shadow-2xs">
                              {order.isInstallationPaymentConfirmed
                                ? (lang === "es" ? "Instalación Pagada y Verificada" : "Installation Paid & Verified")
                                : (lang === "es" ? "Instalación Completada en Taller" : "Workshop Installation Completed")}
                            </span>
                            {!order.isInstallationPaymentConfirmed && (
                              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                {lang === "es" ? "Pago de Mano de Obra Pendiente" : "Labor Payment Pending"}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-black text-gray-900">
                            {order.isInstallationPaymentConfirmed
                              ? (lang === "es" ? "Listo para Programar Fecha de Retorno de Vehículo" : "Ready to Schedule Vehicle Return Date")
                              : (lang === "es" ? "Se requiere pago de instalación para programar retorno" : "Installation payment required to schedule return")}
                          </h4>
                          <p className="text-xs text-gray-600 leading-relaxed max-w-xl">
                            {order.isInstallationPaymentConfirmed
                              ? (lang === "es"
                                  ? "Tu pago de mano de obra ha sido confirmado. El transporte de retorno ya está 100% cubierto (₡0). Programa la fecha y hora de entrega de tu vehículo."
                                  : "Your labor payment has been confirmed. Return transport is 100% covered (₡0). Schedule your vehicle return date and time.")
                              : (lang === "es"
                                  ? "El trabajo técnico en tu vehículo ha finalizado exitosamente. Por favor cancela el monto de mano de obra y sube tu comprobante para habilitar la entrega."
                                  : "Technical work on your vehicle is complete. Please pay the labor amount and upload your receipt to unlock return delivery.")}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2 shrink-0">
                        {order.isInstallationPaymentConfirmed ? (
                          <Link
                            href={`/servicios?orderId=${order.id}&orderNumber=${order.orderNumber}&return=true&service=pickup`}
                            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                          >
                            <Calendar className="w-4 h-4" />
                            <span>{lang === "es" ? "Programar Fecha de Retorno (₡0)" : "Schedule Return Date (₡0)"}</span>
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-purple-900 font-bold bg-white/90 px-3 py-1.5 rounded-xl border border-purple-200 flex items-center gap-1.5 shadow-2xs">
                              <Lock className="w-3.5 h-3.5 text-purple-700" />
                              <span>{lang === "es" ? "Programación Bloqueada" : "Schedule Locked"}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Banner / Stage Action for READY_FOR_PICKUP (Shop Install: Ready for Workshop Pickup) */}
                {(order.status === "READY_FOR_PICKUP" || order.status === "READY_TO_PICK_UP") && (
                  <div className={`mt-4 p-5 rounded-3xl border-2 shadow-sm ${
                    order.isInstallationPaymentConfirmed || skipInstallationPayment
                      ? "bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-400"
                      : "bg-gradient-to-r from-purple-50 via-indigo-50/70 to-purple-50 border-purple-400"
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-md ${
                          order.isInstallationPaymentConfirmed || skipInstallationPayment ? "bg-emerald-600" : "bg-purple-700"
                        }`}>
                          {order.isInstallationPaymentConfirmed || skipInstallationPayment ? (
                            <CheckCircle2 className="w-6 h-6" />
                          ) : (
                            <Wrench className="w-6 h-6" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border bg-white shadow-2xs">
                              {lang === "es" ? "Listo para Retiro en Taller" : "Ready for Workshop Pickup"}
                            </span>
                            {skipInstallationPayment ? (
                              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{lang === "es" ? "Instalación Gratuita Incluida" : "Free Installation Included"}</span>
                              </span>
                            ) : order.isInstallationPaymentConfirmed ? (
                              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{lang === "es" ? "Instalación Pagada y Verificada" : "Labor Paid & Verified"}</span>
                              </span>
                            ) : order.installationPaymentProofUrl ? (
                              <span className="text-[11px] font-bold text-blue-800 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                <span>{lang === "es" ? "Comprobante de Instalación en Revisión" : "Labor Receipt Under Review"}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-purple-900 bg-purple-200/80 border border-purple-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                <CreditCard className="w-3.5 h-3.5 text-purple-700" />
                                <span>{lang === "es" ? "Pago de Mano de Obra Habilitado" : "Labor Payment Enabled"}</span>
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-black text-gray-900">
                            {order.isInstallationPaymentConfirmed || skipInstallationPayment
                              ? (lang === "es" ? "Vehículo Listo para Retiro • Taller Pozos de Santa Ana" : "Vehicle Ready for Pickup • Pozos Workshop")
                              : (lang === "es" ? "Vehículo Listo para Retiro • Pago de Mano de Obra Habilitado" : "Vehicle Ready for Pickup • Labor Payment Enabled")}
                          </h4>
                          <p className="text-xs text-gray-600 leading-relaxed max-w-xl">
                            {order.isInstallationPaymentConfirmed || skipInstallationPayment
                              ? (lang === "es"
                                  ? "Las piezas han sido instaladas exitosamente y el pago de mano de obra está verificado. Puedes presentarte en el taller ZxZ Pozos de Santa Ana para retirar tu vehículo."
                                  : "Parts have been successfully installed and labor payment is confirmed. You can visit our ZxZ Pozos workshop to pick up your vehicle.")
                              : order.installationPaymentProofUrl
                              ? (lang === "es"
                                  ? "Tu comprobante de pago de instalación fue enviado y se encuentra en revisión administrativa por nuestro equipo técnico."
                                  : "Your installation payment receipt has been submitted and is under administrative review by our technical team.")
                              : (lang === "es"
                                  ? "La instalación técnica en tu vehículo ha finalizado. Puedes realizar el pago de la mano de obra ahora durante esta etapa para agilizar el retiro de tu vehículo."
                                  : "Technical installation on your vehicle is complete. You can complete the labor payment now during this stage to expedite your vehicle pickup.")}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2 shrink-0">
                        {!order.isInstallationPaymentConfirmed && !skipInstallationPayment && (
                          <Link
                            href={`/pedidos/${order.id}/pagar-instalacion`}
                            className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>
                              {order.installationPaymentProofUrl
                                ? (lang === "es" ? "Comprobante en Revisión" : "Receipt in Review")
                                : (lang === "es" ? "Pagar Mano de Obra" : "Pay Labor Fee")}
                            </span>
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2-Column Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Full list of products & Comments thread */}
              <div className="lg:col-span-8 space-y-6">

                {/* ZxZ Quality Certification Banner (Customer View - only available strictly AFTER 'en taller para revision') */}
                {Boolean((order.isCertified || order.zxzCertificationJson) && isOrderAfterWarehouseCheck(order.status)) && (
                  <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50/80 to-emerald-50 border-2 border-emerald-400 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-black text-emerald-900 uppercase tracking-wider bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
                            {t.zxzCertBadge}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t.zxzCertStatusVerified}</span>
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-emerald-950">
                          {t.zxzCertCustomerBannerTitle}
                        </h3>
                        <p className="text-xs text-emerald-900/80 leading-relaxed max-w-xl">
                          {t.zxzCertCustomerBannerSub}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCertModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer self-stretch sm:self-auto justify-center"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{t.zxzCertViewBtn}</span>
                    </button>
                  </div>
                )}
                
                {/* Products List Section */}
                <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#0052CC]" />
                      <span>{t.orderProductsList}</span>
                      <span className="text-gray-400 font-mono">({order.items.length})</span>
                    </h2>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-black font-medium transition-colors cursor-pointer"
                      title="Imprimir proforma"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{t.orderPrintProforma}</span>
                    </button>
                  </div>

                  {order.items.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 space-y-2">
                      <FileText className="w-10 h-10 text-gray-400 mx-auto" />
                      <h3 className="text-sm font-bold text-gray-800">
                        {lang === "es" ? "Cotización sin productos iniciales" : "Custom quotation with no initial items"}
                      </h3>
                      <p className="text-xs text-gray-500 max-w-md mx-auto">
                        {t.orderCotizacionEmptyNotice}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {order.items.map((item, idx) => {
                        const itemPrice = item.priceCRC || 0;
                        const qty = item.quantity || 1;
                        const lineTotal = itemPrice * qty;
                        const itemSkuOrId = item.sku || item.id;

                        return (
                          <div
                            key={idx}
                            className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-gray-300"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                                <Image
                                  src={item.imageUrl || "/images/logo.png"}
                                  alt={item.title || "Product"}
                                  fill
                                  className="object-contain p-1"
                                />
                              </div>

                              <div className="min-w-0 space-y-1">
                                {item.sku && (
                                  <Link
                                    href={`/productos/${itemSkuOrId}`}
                                    className="text-sm font-bold text-gray-900 hover:text-[#0052CC] transition-colors truncate block"
                                  >
                                    {item.title}
                                  </Link>
                                )}
                                {!item.sku && (
                                  <span className="text-sm font-bold text-gray-900 truncate block">
                                    {item.title}
                                  </span>
                                )}

                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  {item.brand && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0052CC] bg-[#EBF3FC] border border-[#C2DBFE] px-2 py-0.5 rounded-md">
                                      <Tag className="w-3 h-3 text-[#0052CC]" />
                                      <span>{item.brand}</span>
                                    </span>
                                  )}
                                  <span className="text-gray-500 font-mono text-[11px]">
                                    Cant: {qty} × {formatPrice(itemPrice)}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                  {item.withInstallation && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                                      <Wrench className="w-3 h-3 text-emerald-600" />
                                      <span>
                                        {item.freeInstallation || item.installationPriceCRC === 0
                                          ? (lang === "es" ? "Instalación Gratis" : "Free Installation")
                                          : `+${formatPrice(item.installationPriceCRC || 0)} taller`}
                                      </span>
                                    </span>
                                  )}

                                  {item.homeInstallation !== false && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                      <Home className="w-3 h-3 text-blue-600" />
                                      <span>{lang === "es" ? "Apto a domicilio" : "At-home eligible"}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0 self-end sm:self-center">
                              <span className="text-sm sm:text-base font-black font-mono text-gray-900 block">
                                {formatPrice(lineTotal)}
                              </span>
                              {!isCurrencyBonded && displayCurrency === "USD" && (
                                <span className="text-[10px] text-gray-400 font-mono">
                                  ₡{formatCRC(lineTotal)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Factura Electrónica Details Card (Hacienda CR) */}
                {order.requiresElectronicInvoice && electronicInvoice && (
                  <div className="bg-white rounded-3xl border border-[#C2DBFE] p-6 sm:p-7 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
                      <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-[#0052CC]" />
                        <span>{t.orderFacturaDetailsTitle}</span>
                      </h2>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0052CC] bg-[#EBF3FC] px-2.5 py-1 rounded-full border border-[#C2DBFE] self-start sm:self-auto">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.checkoutFacturaTaxBadge}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Razón Social */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          {t.orderFacturaCompany}
                        </span>
                        <span className="font-bold text-gray-900 text-sm block">
                          {electronicInvoice.companyName}
                        </span>
                      </div>

                      {/* Cédula */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          {t.orderFacturaId} ({electronicInvoice.idType || "ID"})
                        </span>
                        <span className="font-bold font-mono text-gray-900 text-sm block">
                          {electronicInvoice.idNumber}
                        </span>
                      </div>

                      {/* Correo Electrónico */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#0052CC]" />
                          <span>{t.orderFacturaEmail}</span>
                        </span>
                        <span className="font-semibold text-gray-800 truncate block">
                          {electronicInvoice.email}
                        </span>
                      </div>

                      {/* Teléfono de Facturación */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#0052CC]" />
                          <span>{t.orderFacturaPhone}</span>
                        </span>
                        <span className="font-semibold font-mono text-gray-800 block">
                          {electronicInvoice.phone}
                        </span>
                      </div>

                      {/* Actividad Económica */}
                      <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          {t.orderFacturaEconomicActivity}
                        </span>
                        <span className="font-medium text-gray-800 block">
                          {electronicInvoice.economicActivity}
                        </span>
                      </div>

                      {/* Señas Fiscales si existen */}
                      {electronicInvoice.details && (
                        <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            {t.orderFacturaNotes}
                          </span>
                          <span className="text-gray-600 block">
                            {electronicInvoice.details}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Uploaded Payment Proofs Section - Always accessible for Client (Requirement #1) */}
                {(order.paymentProofUrl || order.installationPaymentProofUrl || order.servicePaymentProofUrl) && (
                  <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-xs space-y-5">
                    <div className="pb-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-[#0052CC]" />
                          <span>{lang === "es" ? "Comprobantes de Pago Subidos" : "Uploaded Payment Proofs"}</span>
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                          {lang === "es"
                            ? "Consulta las imágenes y archivos de respaldo de las transferencias registradas en esta orden."
                            : "Inspect uploaded receipts and bank transfer records for this order."}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {lang === "es" ? "ARCHIVOS VERIFICADOS" : "VERIFIED FILES"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* 1. Comprobante de Productos / Pedido */}
                      {order.paymentProofUrl && (
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5 min-w-0">
                              <Package className="w-3.5 h-3.5 text-[#0052CC] shrink-0" />
                              <span className="truncate">{lang === "es" ? "Comprobante de Pedido" : "Order / Parts Receipt"}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{lang === "es" ? "Registrado" : "Uploaded"}</span>
                            </span>
                          </div>

                          <div
                            onClick={() => setClientProofModalUrl(order.paymentProofUrl || null)}
                            className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-950 p-2 flex items-center justify-center h-36 transition hover:border-blue-400"
                          >
                            <img
                              src={order.paymentProofUrl}
                              alt="Comprobante de Pedido"
                              className="max-h-32 w-auto object-contain rounded-lg transition duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="px-3 py-1 rounded-lg bg-white text-gray-900 text-[11px] font-bold shadow-md flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span>{lang === "es" ? "Ver Completo" : "View Full"}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 text-xs">
                            <button
                              type="button"
                              onClick={() => setClientProofModalUrl(order.paymentProofUrl || null)}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{lang === "es" ? "Inspeccionar" : "Inspect"}</span>
                            </button>
                            <a
                              href={order.paymentProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-xl border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
                              title={lang === "es" ? "Abrir original en nueva pestaña" : "Open in new tab"}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* 2. Comprobante de Mano de Obra / Instalación */}
                      {order.installationPaymentProofUrl && (
                        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex flex-col justify-between space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-purple-950 flex items-center gap-1.5 min-w-0">
                              <Wrench className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                              <span className="truncate">{lang === "es" ? "Mano de Obra" : "Labor / Install"}</span>
                            </span>
                            {order.isInstallationPaymentConfirmed ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{lang === "es" ? "Confirmado" : "Confirmed"}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-300 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 shadow-2xs">
                                <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>{lang === "es" ? "En Revisión" : "In Review"}</span>
                              </span>
                            )}
                          </div>

                          <div
                            onClick={() => setClientProofModalUrl(order.installationPaymentProofUrl || null)}
                            className="group relative cursor-pointer overflow-hidden rounded-xl border border-purple-200 bg-gray-950 p-2 flex items-center justify-center h-36 transition hover:border-purple-400"
                          >
                            <img
                              src={order.installationPaymentProofUrl}
                              alt="Comprobante de Instalación"
                              className="max-h-32 w-auto object-contain rounded-lg transition duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="px-3 py-1 rounded-lg bg-white text-gray-900 text-[11px] font-bold shadow-md flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span>{lang === "es" ? "Ver Completo" : "View Full"}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-purple-200 text-xs">
                            <button
                              type="button"
                              onClick={() => setClientProofModalUrl(order.installationPaymentProofUrl || null)}
                              className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{lang === "es" ? "Inspeccionar" : "Inspect"}</span>
                            </button>
                            <a
                              href={order.installationPaymentProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-xl border border-purple-200 hover:bg-white text-purple-900 text-xs font-semibold flex items-center gap-1 transition"
                              title={lang === "es" ? "Abrir original en nueva pestaña" : "Open in new tab"}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* 3. Comprobante de Servicio */}
                      {order.servicePaymentProofUrl && (
                        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col justify-between space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-blue-950 flex items-center gap-1.5 min-w-0">
                              <Truck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                              <span className="truncate">{lang === "es" ? "Servicio de Transporte" : "Transport Service"}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-300 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0 shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{lang === "es" ? "Registrado" : "Uploaded"}</span>
                            </span>
                          </div>

                          <div
                            onClick={() => setClientProofModalUrl(order.servicePaymentProofUrl || null)}
                            className="group relative cursor-pointer overflow-hidden rounded-xl border border-blue-200 bg-gray-950 p-2 flex items-center justify-center h-36 transition hover:border-blue-400"
                          >
                            <img
                              src={order.servicePaymentProofUrl}
                              alt="Comprobante de Servicio"
                              className="max-h-32 w-auto object-contain rounded-lg transition duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="px-3 py-1 rounded-lg bg-white text-gray-900 text-[11px] font-bold shadow-md flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                <span>{lang === "es" ? "Ver Completo" : "View Full"}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-blue-200 text-xs">
                            <button
                              type="button"
                              onClick={() => setClientProofModalUrl(order.servicePaymentProofUrl || null)}
                              className="px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{lang === "es" ? "Inspeccionar" : "Inspect"}</span>
                            </button>
                            <a
                              href={order.servicePaymentProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-xl border border-blue-200 hover:bg-white text-blue-900 text-xs font-semibold flex items-center gap-1 transition"
                              title={lang === "es" ? "Abrir original en nueva pestaña" : "Open in new tab"}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Comments & Modification Requests Section */}
                <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-7 shadow-xs space-y-5">
                  <div className="pb-3 border-b border-gray-100">
                    <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-[#0052CC]" />
                      <span>{t.orderCommentsTitle}</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {t.orderCommentsSubtitle}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                      ✓ {t.orderCommentResetsTimer}
                    </p>
                  </div>

                  {/* Comments Thread List */}
                  <div className="space-y-3">
                    {order.comments.length === 0 ? (
                      <div className="py-6 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        {lang === "es"
                          ? "No hay mensajes aún. Las notas son exclusivamente para información importante."
                          : "No messages yet. Notes are strictly reserved for critical information."}
                      </div>
                    ) : (
                      order.comments.map((cmt) => {
                        const isStaff = cmt.authorRole === "STAFF";
                        const isSystem = cmt.authorRole === "SYSTEM";

                        return (
                          <div
                            key={cmt.id}
                            className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition-all ${
                              isStaff
                                ? "bg-blue-50/70 border-blue-200 text-gray-900"
                                : isSystem
                                ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                                : "bg-gray-50 border-gray-200 text-gray-900"
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-1.5 font-bold">
                                <span>{cmt.authorName}</span>
                                <span
                                  className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-mono ${
                                    isStaff
                                      ? "bg-[#0052CC] text-white"
                                      : isSystem
                                      ? "bg-emerald-600 text-white"
                                      : "bg-gray-200 text-gray-700"
                                  }`}
                                >
                                  {isStaff
                                    ? "Staff ZxZ"
                                    : isSystem
                                    ? "Sistema"
                                    : lang === "es" ? "Tú" : "Customer"}
                                </span>
                              </div>
                              <span className="text-gray-400 font-mono text-[10px]">
                                {new Date(cmt.createdAt).toLocaleString(lang === "es" ? "es-CR" : "en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed whitespace-pre-wrap">
                              {cmt.text ? cmt.text.replace(/SINPE M[oó]vil/gi, "Transferencia Bancaria").replace(/SINPE/gi, "Transferencia Bancaria") : ""}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="pt-2 space-y-2.5">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={t.orderCommentPlaceholder}
                      rows={3}
                      className="w-full p-3 rounded-2xl bg-gray-50 border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20 transition-all resize-none outline-hidden"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingComment || !commentText.trim()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0052CC] hover:bg-[#0040A8] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{submittingComment ? "Enviando..." : t.orderCommentSubmit}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Column: Financial Breakdown & Proceed to Pay */}
              <div className="lg:col-span-4 sticky top-24 space-y-4">
                
                {/* Cost Breakdown Card */}
                <div
                  className={`bg-white rounded-3xl p-6 shadow-sm space-y-5 border transition-all ${
                    isRejected
                      ? "border-rose-300 ring-2 ring-rose-100 shadow-rose-950/5"
                      : "border-gray-200"
                  }`}
                >
                  <h3 className="text-base font-bold text-[#111827] pb-3 border-b border-gray-100 flex items-center justify-between">
                    <span>{t.ordersSummaryLabel}</span>
                    <span className="text-xs font-mono font-normal text-gray-500">
                      {displayCurrency === "USD" ? "USD ($)" : "CRC (₡)"}
                    </span>
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center text-gray-600">
                      <span>{t.cartPartsSubtotal}</span>
                      <span className="font-mono font-bold text-gray-900 text-sm">
                        {formatPrice(order.partsSubtotalCRC)}
                      </span>
                    </div>

                    {order.shippingCostCRC > 0 && (
                      <div className="flex justify-between items-center text-gray-600">
                        <span>{lang === "es" ? "Envío / Logística:" : "Shipping:"}</span>
                        <span className="font-mono font-bold text-gray-900 text-sm">
                          {formatPrice(order.shippingCostCRC)}
                        </span>
                      </div>
                    )}

                    {/* Applied Discount Line */}
                    {orderDiscountCRC > 0 && (
                      <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                        <span className="flex items-center gap-1.5 font-bold text-xs">
                          <Tag className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            {t.orderDiscountApplied || "Descuento Aplicado"}
                            {order.discountReason ? ` (${order.discountReason})` : ""}
                          </span>
                        </span>
                        <span className="font-mono font-black text-sm text-emerald-700">
                          -{formatPrice(orderDiscountCRC)}
                        </span>
                      </div>
                    )}

                    {/* Factura Electrónica (IVA 13% incluido en el total) Line */}
                    {Boolean(order.requiresElectronicInvoice || (order.taxCRC && order.taxCRC > 0)) && (
                      <div className="flex justify-between items-center text-[#0A2540] bg-[#EBF3FC] px-3 py-2 rounded-xl border border-[#C2DBFE]">
                        <span className="flex items-center gap-1.5 font-bold text-xs">
                          <FileText className="w-3.5 h-3.5 text-[#0052CC]" />
                          <span>{t.orderFacturaTaxLabel || "IVA 13% (incluido en el total)"}</span>
                        </span>
                        <span className="font-mono font-black text-sm text-[#0052CC]">
                          {formatPrice(order.taxCRC || Math.round(((order.partsSubtotalCRC || 0) - orderDiscountCRC) * (13 / 113)))}
                        </span>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-baseline">
                        <span className="text-base font-extrabold text-[#111827]">
                          {t.orderTotalLabel}
                        </span>
                        <div className="text-right">
                          <div
                            className={`text-2xl font-black font-mono ${
                              isRejected ? "text-rose-600" : "text-[#0052CC]"
                            }`}
                          >
                            {formatPrice(order.totalCRC)}
                          </div>
                          {!isCurrencyBonded && (
                            displayCurrency === "USD" ? (
                              <div className="text-xs text-gray-500 font-mono mt-0.5">
                                ₡{formatCRC(order.totalCRC)}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 font-mono mt-0.5">
                                ${formatUSD(convertCRCToUSD(order.totalCRC, sellRate))} USD
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment State CTA Handling:
                      USER REQUIREMENT: If order is in 'confirmar pago' (PAYMENT_CONFIRMATION) or more,
                      'proceder al pago' DOES NOT APPEAR! */}
                  {isRejected && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-xs text-rose-900">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span>{lang === "es" ? "Pago Rechazado" : "Payment Rejected"}</span>
                      </div>
                      <p className="text-[11px] text-rose-800 leading-relaxed">
                        {order.paymentRejectionReason ||
                          (lang === "es"
                            ? "Tu comprobante de pago fue rechazado o no pudo ser verificado. Por favor realiza el pago nuevamente o adjunta un nuevo comprobante para continuar."
                            : "Your payment receipt was rejected or could not be verified. Please re-submit payment or attach a valid receipt to continue.")}
                      </p>
                    </div>
                  )}

                  {hasPaid ? (
                    order.status === "PAYMENT_CONFIRMATION" ? (
                      /* Payment Confirmation Status Card */
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 animate-spin-slow" />
                          <span>{lang === "es" ? "Comprobante en Verificación" : "Payment Under Verification"}</span>
                        </div>
                        <p className="text-[11px] text-amber-800/90 leading-relaxed">
                          {lang === "es"
                            ? "Tu comprobante de transferencia fue recibido. Nuestro equipo administrativo está validando los fondos en las cuentas oficiales."
                            : "Your payment receipt was received and is being verified by our administration team."}
                        </p>
                        {order.paymentProofUrl && (
                          <div className="pt-2 border-t border-amber-200/80 space-y-2">
                            <button
                              type="button"
                              onClick={() => setClientProofModalUrl(order.paymentProofUrl || null)}
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-950 hover:underline cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-700" />
                              <span>{lang === "es" ? "Inspeccionar Comprobante" : "Inspect Receipt"}</span>
                            </button>
                            <a
                              href={order.paymentProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-amber-800 hover:text-black ml-2"
                              title="Abrir en pestaña nueva"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Active Processing or Completed Order State */
                      <div className="p-4 rounded-2xl bg-[#EBF3FC] border border-[#C2DBFE] text-[#0A2540] space-y-2">
                        <div className="flex items-center gap-2 font-bold text-xs text-[#0052CC]">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>{lang === "es" ? "Pago Confirmado & Pedido Activo" : "Payment Confirmed & Order Active"}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {lang === "es"
                            ? "Tu orden está avanzando en el flujo de taller y logística."
                            : "Your order is progressing through workshop and logistics."}
                        </p>
                        {order.paymentProofUrl && (
                          <div className="pt-2 border-t border-blue-200/80 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => setClientProofModalUrl(order.paymentProofUrl || null)}
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0052CC] hover:text-[#0040A8] cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{lang === "es" ? "Ver Comprobante Subido" : "View Uploaded Receipt"}</span>
                            </button>
                            <a
                              href={order.paymentProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-500 hover:text-slate-800 p-1"
                              title="Abrir en pestaña nueva"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    )
                  ) : isRejected ? (
                    <button
                      type="button"
                      onClick={() => setPayModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-white font-extrabold text-xs tracking-wider uppercase shadow-md hover:shadow-lg transition-all cursor-pointer bg-rose-600 hover:bg-rose-700 shadow-rose-600/25"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{lang === "es" ? "Corregir Pago" : "Fix Payment"}</span>
                    </button>
                  ) : (
                    /* Proceed to Pay / Upload Proof Buttons for quotation / unpaid orders */
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setUploadProofModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-md hover:shadow-lg transition-all cursor-pointer shadow-emerald-600/20"
                      >
                        <Upload className="w-4 h-4" />
                        <span>{t.orderUploadPaymentProofBtn}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPayModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl bg-[#0052CC] hover:bg-[#0040A8] text-white font-bold text-xs tracking-wider uppercase shadow-xs hover:shadow-md transition-all cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>{t.orderProceedToPay}</span>
                      </button>
                    </div>
                  )}

                  {/* Programar Servicio Primary Action Button in Right Column */}
                  {isProgramService && (
                    <Link
                      href={
                        order.isServiceScheduled
                          ? `/servicios?orderId=${order.id}&orderNumber=${order.orderNumber}&service=${getServiceParamFromOrder(order.serviceType)}`
                          : `/servicios?orderId=${order.id}&orderNumber=${order.orderNumber}`
                      }
                      className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-[#0052CC] hover:bg-[#0040A8] text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg ring-2 ring-blue-300"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>
                        {order.isServiceScheduled
                          ? t.orderRescheduleServiceBtn
                          : t.orderScheduleServiceBtn}
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}

                  {/* WhatsApp Support CTA */}
                  <a
                    href={getWhatsAppUrl(
                      `¡Hola ZxZ Mods! Quiero consultar sobre mi ${isQuote ? "cotización" : "pedido"} #${order.orderNumber} por total ${formatCRC(
                        order.totalCRC
                      )}`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-black font-bold text-xs uppercase tracking-wider transition-colors shadow-2xs"
                  >
                    <MessageCircle className="w-4 h-4 fill-black" />
                    <span>{t.ordersContactWhatsApp}</span>
                  </a>

                  {/* Workshop & Guarantees info */}
                  <div className="pt-4 border-t border-gray-100 space-y-2 text-[11px] text-gray-500">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0052CC]" />
                      <span>{t.warrantyProductDesc}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#0052CC]" />
                      <span>{lang === "es" ? "Taller Físico en Pozos de Santa Ana, CR" : "Workshop in Santa Ana, Costa Rica"}</span>
                    </div>
                  </div>
                </div>

                {/* Dedicated Installation Payment Card (Client can pay during INSTALLATION_PAYMENT or READY_FOR_PICKUP) */}
                {(isServiceRequiringInstallation(order.serviceType) || (order.installationCostCRC && order.installationCostCRC > 0) || (order.laborSubtotalCRC && order.laborSubtotalCRC > 0)) && !skipInstallationPayment && (
                  <div className="bg-white border-2 border-purple-300 rounded-3xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-purple-100 text-purple-700 border border-purple-200">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                            {lang === "es" ? "Pago de Mano de Obra (Instalación)" : "Labor / Installation Payment"}
                          </h4>
                          <p className="text-[10px] text-gray-500">
                            {lang === "es" ? "Taller ZxZ Mods • Instalación Técnica" : "ZxZ Mods Workshop • Technical Labor"}
                          </p>
                        </div>
                      </div>
                      {order.isInstallationPaymentConfirmed ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 shadow-2xs">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{lang === "es" ? "Confirmado" : "Confirmed"}</span>
                        </span>
                      ) : order.installationPaymentProofUrl ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1 shadow-2xs">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span>{lang === "es" ? "En Revisión" : "In Review"}</span>
                        </span>
                      ) : canPayInstallation(order.status, order.serviceType) ? (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1 shadow-2xs animate-pulse">
                          <CreditCard className="w-3.5 h-3.5 text-purple-700" />
                          <span>{lang === "es" ? "Listo para Pago" : "Ready to Pay"}</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 shadow-2xs">
                          <Lock className="w-3 h-3 text-slate-500" />
                          <span>{lang === "es" ? "Bloqueado" : "Locked"}</span>
                        </span>
                      )}
                    </div>

                    {/* Breakdown Amount Box */}
                    <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                          {lang === "es" ? "Monto de Mano de Obra:" : "Installation Labor Total:"}
                        </span>
                        <span className="text-base font-black text-purple-950 font-mono">
                          {formatCRC(getOrderPendingInstallationCost(order) || order.installationCostCRC || order.laborSubtotalCRC || 0)}
                        </span>
                      </div>
                      {canPayInstallation(order.status, order.serviceType) && !order.isInstallationPaymentConfirmed && !order.installationPaymentProofUrl && (
                        <Link
                          href={`/pedidos/${order.id}/pagar-instalacion`}
                          className="text-[11px] text-white font-bold bg-purple-700 hover:bg-purple-800 px-3 py-1.5 rounded-xl transition shadow-xs flex items-center gap-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{lang === "es" ? "Pagar" : "Pay"}</span>
                        </Link>
                      )}
                    </div>

                    {/* Contextual Status / Call to Action */}
                    {order.isInstallationPaymentConfirmed ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-900 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">
                              {lang === "es" ? "Pago de mano de obra confirmado" : "Installation labor payment confirmed"}
                            </span>
                            <span className="text-emerald-800">
                              {lang === "es"
                                ? "El taller ha verificado el pago satisfactoriamente."
                                : "The workshop has verified the payment successfully."}
                            </span>
                          </div>
                        </div>

                        {order.installationPaymentProofUrl && (
                          <button
                            type="button"
                            onClick={() => setClientProofModalUrl(order.installationPaymentProofUrl || null)}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-gray-500" />
                            <span>{lang === "es" ? "Ver Comprobante Registrado" : "View Registered Receipt"}</span>
                          </button>
                        )}
                      </div>
                    ) : order.installationPaymentProofUrl ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-[11px] text-blue-900 flex items-start gap-2">
                          <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block">
                              {lang === "es" ? "Comprobante en revisión administrativa" : "Receipt under administrative review"}
                            </span>
                            <span className="text-blue-800">
                              {lang === "es"
                                ? "Has enviado tu comprobante. Nuestro equipo lo está validando para proceder con la entrega."
                                : "Your receipt has been submitted. Our team is validating it to proceed with delivery."}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setClientProofModalUrl(order.installationPaymentProofUrl || null)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{lang === "es" ? "Ver Comprobante Enviado" : "View Submitted Receipt"}</span>
                        </button>
                      </div>
                    ) : isOrderInInstallationPaymentStage(order.status) ? (
                      <div className="space-y-3">
                        <p className="text-[11px] text-gray-600 leading-relaxed">
                          {lang === "es"
                            ? "Tus piezas han sido instaladas con éxito. Por favor ingresa al checkout oficial para registrar la transferencia y solicitar factura electrónica si la requieres."
                            : "Your parts have been installed. Please proceed to the official checkout to submit transfer details and request an electronic invoice if needed."}
                        </p>

                        <Link
                          href={`/pedidos/${order.id}/pagar-instalacion`}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>{lang === "es" ? "Ingresar al Checkout de Instalación" : "Enter Installation Checkout"}</span>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-700 flex items-start gap-2">
                          <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block text-slate-900">
                              {lang === "es" ? "Pago no disponible aún" : "Payment not available yet"}
                            </span>
                            <span className="text-slate-600">
                              {lang === "es"
                                ? "El pago de instalación se habilitará una vez que los mecánicos terminen el trabajo y el pedido avance a 'Pago de Instalación'."
                                : "Installation payment will unlock once technicians finish the work and the order advances to 'Installation Payment'."}
                            </span>
                          </div>
                        </div>

                        <div className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gray-100 text-gray-400 text-xs font-bold cursor-not-allowed border border-gray-200">
                          <Lock className="w-3.5 h-3.5" />
                          <span>{lang === "es" ? "Bloqueado Durante Instalación" : "Locked During Installation"}</span>
                        </div>
                      </div>
                    )}

                    {/* Schedule Return Button Integration in this card */}
                    {order.status === "READY_TO_SET_RETURN_DATE" && (
                      <div className="pt-2 border-t border-gray-100">
                        {order.isInstallationPaymentConfirmed ? (
                          <Link
                            href={`/servicios?orderId=${order.id}&orderNumber=${order.orderNumber}&return=true&service=pickup`}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition shadow-md"
                          >
                            <Calendar className="w-4 h-4" />
                            <span>{lang === "es" ? "Programar Retorno de Vehículo (₡0)" : "Schedule Vehicle Return (₡0)"}</span>
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        ) : (
                          <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 text-[11px] text-purple-900 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-purple-600 shrink-0" />
                            <span>
                              {lang === "es"
                                ? "La programación de entrega se desbloqueará una vez confirmado el pago de instalación."
                                : "Return scheduling will unlock once installation payment is confirmed."}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Service Payment Proof Card (If attached by workshop staff or client) */}
                {order.servicePaymentProofUrl && (
                  <div className="bg-white border border-blue-200 rounded-3xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900">
                            {lang === "es" ? "Comprobante de Servicio / Flete" : "Service / Shipping Receipt"}
                          </h4>
                          <p className="text-[10px] text-gray-500">
                            {lang === "es" ? "Verificado por Staff de Taller" : "Verified by Workshop Staff"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                        ✓ {lang === "es" ? "Adjunto" : "Attached"}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div
                        onClick={() => setClientProofModalUrl(order.servicePaymentProofUrl || null)}
                        className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-gray-950 p-2 flex items-center justify-center max-h-40 transition hover:border-gray-400"
                      >
                        <img
                          src={order.servicePaymentProofUrl}
                          alt="Comprobante de Servicio"
                          className="max-h-36 w-auto object-contain rounded-lg transition duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <span className="px-3 py-1 rounded-lg bg-white text-gray-900 text-[11px] font-bold shadow-md flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>{lang === "es" ? "Ver Completo" : "View Full"}</span>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setClientProofModalUrl(order.servicePaymentProofUrl || null)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{lang === "es" ? "Inspeccionar Comprobante de Servicio" : "Inspect Service Receipt"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Payment Modal */}
      {payModalOpen && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setPayModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-200 z-10 space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                  isRejected ? "text-rose-600" : "text-[#0052CC]"
                }`}>
                  #{order.orderNumber}
                </span>
                <span className={`text-sm font-black font-mono ${
                  isRejected ? "text-rose-600" : "text-gray-900"
                }`}>
                  {formatPrice(order.totalCRC)}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 mt-1">
                {isRejected
                  ? (t.orderPayModalFixTitle || "Actualizar Comprobante de Pago")
                  : t.orderPayModalTitle}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isRejected
                  ? (t.orderPayModalFixSubtitle || "Adjunta la nueva foto o captura de tu transferencia para verificar tu pago.")
                  : t.orderPayModalSubtitle}
              </p>
            </div>

            {paySuccessMsg ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-sm font-bold text-emerald-900">{paySuccessMsg}</h3>
              </div>
            ) : isRejected ? (
              /* Streamlined Fix Payment Mode: ONLY needs to update payment proof image */
              <form onSubmit={handleFixRejectedPayment} className="space-y-4">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{lang === "es" ? "Actualización de Comprobante Requerida" : "Receipt Update Required"}</span>
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    {order.paymentRejectionReason
                      ? (lang === "es" ? `Motivo del rechazo: ${order.paymentRejectionReason}` : `Rejection reason: ${order.paymentRejectionReason}`)
                      : (lang === "es" ? "Por favor adjunta una foto o captura clara de tu transferencia bancaria para verificar los fondos." : "Please attach a clear photo or screenshot of your wire transfer to verify funds.")}
                  </p>
                </div>

                {/* Dropzone File Upload */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700">
                    {lang === "es" ? "Nuevo Comprobante de Pago:" : "New Payment Receipt:"}
                  </label>
                  <label className="border-2 border-dashed border-rose-300 hover:border-rose-400 bg-rose-50/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-colors text-center group">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const f = e.target.files[0];
                          if (f.size > 100 * 1024 * 1024) {
                            alert(lang === "es" ? "El archivo supera el límite de 100MB." : "File exceeds the 100MB limit.");
                            return;
                          }
                          setPayReceiptFile(f);
                        }
                      }}
                    />
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {payReceiptFile ? payReceiptFile.name : (t.orderPayModalFixDropzonePrompt || "Haz clic o arrastra aquí tu nuevo comprobante de pago")}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {payReceiptFile
                          ? `${(payReceiptFile.size / 1024).toFixed(1)} KB • Listo para enviar`
                          : (lang === "es" ? "Formatos aceptados: JPG, PNG, WEBP, PDF (Máx 100MB)" : "Accepted formats: JPG, PNG, WEBP, PDF (Max 100MB)")}
                      </p>
                    </div>
                  </label>
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPayModalOpen(false);
                      setPayReceiptFile(null);
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    {lang === "es" ? "Cancelar" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment || !payReceiptFile}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-rose-600/20"
                  >
                    {submittingPayment
                      ? (lang === "es" ? "Subiendo Comprobante..." : "Uploading Receipt...")
                      : (t.orderPayModalFixSubmitBtn || "Enviar Comprobante Corregido")}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmPayment} className="space-y-4">
                {/* Currency Selection - ONLY show if not bonded */}
                {!isCurrencyBonded && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t.orderPayModalCurrencyLabel}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setModalPayCurrency("CRC")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                          modalPayCurrency === "CRC"
                            ? "border-[#0052CC] bg-blue-50/70 text-[#0052CC] ring-1 ring-[#0052CC]"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <span className="font-extrabold">₡</span> CRC
                        </span>
                        <span className="font-mono text-[11px] font-black">{formatCRC(order.totalCRC)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalPayCurrency("USD")}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                          modalPayCurrency === "USD"
                            ? "border-[#0052CC] bg-blue-50/70 text-[#0052CC] ring-1 ring-[#0052CC]"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <span className="font-extrabold">$</span> USD
                        </span>
                        <span className="font-mono text-[11px] font-black">${formatUSD(convertCRCToUSD(order.totalCRC, sellRate))}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Method indicator */}
                <div className="p-3.5 rounded-2xl bg-[#EBF3FC] border border-[#0052CC] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#0052CC] text-white flex items-center justify-center font-bold">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-black text-sm text-[#0A2540]">
                        {lang === "es" ? "Transferencia Bancaria (IBAN)" : "Bank Wire Transfer (IBAN)"}
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {lang === "es" ? "BAC Credomatic / Cuentas Verificadas" : "BAC Credomatic / Verified Accounts"}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#0052CC] bg-white px-2 py-0.5 rounded-full border border-[#0052CC]/30 font-mono">
                    OFICIAL
                  </span>
                </div>

                {/* Reference number */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === "es" ? "Número de Comprobante / Referencia:" : "Receipt / Reference Number:"}
                  </label>
                  <input
                    type="text"
                    required
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    placeholder="Ej: 123456789"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono text-gray-900 focus:bg-white focus:border-[#0052CC] outline-none"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === "es" ? "Teléfono que realizó el pago:" : "Phone used for payment:"}
                  </label>
                  <input
                    type="tel"
                    required
                    value={payPhone}
                    onChange={(e) => setPayPhone(e.target.value)}
                    placeholder="8888-8888"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono text-gray-900 focus:bg-white focus:border-[#0052CC] outline-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === "es" ? "Notas adicionales (opcional):" : "Additional notes (optional):"}
                  </label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="Detalles sobre el pago"
                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 focus:bg-white focus:border-[#0052CC] outline-none"
                  />
                </div>

                {/* Receipt Upload File */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === "es" ? "Comprobante de Pago (Foto / Captura):" : "Payment Proof (Photo / Screenshot):"}
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPayReceiptFile(e.target.files[0]);
                      }
                    }}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0052CC]/10 file:text-[#0052CC] hover:file:bg-[#0052CC]/20 cursor-pointer"
                  />
                  {payReceiptFile && (
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                      ✓ {payReceiptFile.name} ({(payReceiptFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPayModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    {lang === "es" ? "Cancelar" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment || !payReference.trim() || !payPhone.trim()}
                    className="px-5 py-2.5 rounded-xl bg-[#0052CC] hover:bg-[#0040A8] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-[#0052CC]/20"
                  >
                    {submittingPayment
                      ? (lang === "es" ? "Registrando..." : "Submitting...")
                      : (lang === "es" ? "Confirmar Pago" : "Confirm Payment")}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Small Upload Payment Proof Modal (BAC / Wire Transfer direct upload) */}
      {uploadProofModalOpen && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => {
              if (!uploadingDirectProof) {
                setUploadProofModalOpen(false);
                setDirectProofFile(null);
              }
            }}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-gray-200 z-10 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700">
                  #{order.orderNumber}
                </span>
                <span className="text-sm font-black font-mono text-gray-900">
                  {formatPrice(order.totalCRC)}
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-gray-900 mt-1 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{t.orderUploadProofModalTitle}</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {t.orderUploadProofModalSubtitle}
              </p>
            </div>

            {directProofSuccess ? (
              <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2 animate-fade-in">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="text-sm font-bold text-emerald-900">{directProofSuccess}</h3>
              </div>
            ) : (
              <form onSubmit={handleUploadProofAndConfirm} className="space-y-4">
                {/* Currency Selection - ONLY show if not bonded */}
                {!isCurrencyBonded && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                      {t.orderPayModalCurrencyLabel}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setModalPayCurrency("CRC")}
                        className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                          modalPayCurrency === "CRC"
                            ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/30"
                            : "border-gray-200 hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <span>Colones (CRC ₡)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalPayCurrency("USD")}
                        className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                          modalPayCurrency === "USD"
                            ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/30"
                            : "border-gray-200 hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <span>Dólares (USD $)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Dropzone File Upload */}
                <div className="space-y-2">
                  <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-400 bg-emerald-50/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-colors text-center group">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const f = e.target.files[0];
                          if (f.size > 100 * 1024 * 1024) {
                            alert(lang === "es" ? "El archivo supera el límite de 100MB." : "File exceeds the 100MB limit.");
                            return;
                          }
                          setDirectProofFile(f);
                        }
                      }}
                    />
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {directProofFile ? directProofFile.name : t.orderUploadProofDropzonePrompt}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {directProofFile
                          ? `${(directProofFile.size / 1024).toFixed(1)} KB • Listo para enviar`
                          : (lang === "es" ? "Formatos: JPG, PNG, WEBP, PDF (Máx 100MB)" : "Formats: JPG, PNG, WEBP, PDF (Max 100MB)")}
                      </p>
                    </div>
                  </label>
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadProofModalOpen(false);
                      setDirectProofFile(null);
                    }}
                    disabled={uploadingDirectProof}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    {lang === "es" ? "Cancelar" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingDirectProof || !directProofFile}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                  >
                    {uploadingDirectProof ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>{lang === "es" ? "Subiendo..." : "Uploading..."}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>{t.orderUploadProofSubmitBtn}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Proof Modal for Client */}
      {clientProofModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setClientProofModalUrl(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-2xl w-full p-5 shadow-2xl border border-gray-200 z-10 space-y-4 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="font-bold text-xs text-gray-900">
                {lang === "es" ? "Comprobante Adjunto" : "Attached Receipt"}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={clientProofModalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition"
                  title={lang === "es" ? "Abrir en nueva pestaña" : "Open in new tab"}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setClientProofModalUrl(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 bg-gray-950 rounded-2xl p-2 flex items-center justify-center overflow-auto border border-gray-800">
              <img
                src={clientProofModalUrl}
                alt="Comprobante"
                className="max-h-[65vh] max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Customer ZxZ Quality Certification Modal */}
      {order && (
        <CustomerZxzCertModal
          order={order}
          isOpen={showCertModal}
          onClose={() => setShowCertModal(false)}
        />
      )}

      {/* Global Modals & Drawers */}
      <GarageModal />
      <CartDrawer />
      <FloatingConcierge />
      <ProfileDrawer />
    </div>
  );
}
