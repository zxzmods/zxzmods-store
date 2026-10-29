"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth, UserOrder } from "@/context/AuthContext";
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
  ShoppingBag,
  Info,
  X,
  Building2,
  Shield,
  Calendar,
  Clock,
  MapPin,
  Truck,
  Car,
  Warehouse,
  ChevronRight,
  Receipt,
  FileText,
  CreditCard,
} from "lucide-react";
import { getWhatsAppUrl } from "@/config/company";
import { Skeleton } from "@/components/ui/Skeleton";
import { ServicePaymentSkeleton } from "@/components/services/ServicePaymentSkeleton";
import { DjiPaymentAnimationOverlay } from "@/components/ui/DjiPaymentAnimationOverlay";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";
import { useGarage } from "@/context/GarageContext";
import { convertCRCToUSD, formatCRC, formatUSD } from "@/lib/i18n";
import {
  getTotalOrdersInstallationCost,
  getOrderPendingInstallationCost,
  getOrdersPendingInstallationTotal,
  isInstallationService,
} from "@/lib/orderServices";

interface BookingState {
  orderIds: string[];
  orderNumbers?: string[];
  serviceType: "shop_installation" | "installation" | "delivery" | "pickup";
  scheduledDate: string;
  timeSlot: string;
  destinationAddress: string;
  distanceKm: number;
  travelMinutes: number;
  serviceCostCRC: number;
  transportCostCRC?: number;
  installationCostCRC?: number;
  customerPhone: string;
}

function ServicePaymentContent() {
  const { lang, t } = useLanguage();
  const { user, orders } = useAuth();
  const { currency, setCurrency, exchangeRate, sellRate } = useCart();
  const { activeVehicle, vehicle } = useGarage();
  const effectiveGarageVehicle = activeVehicle || vehicle;
  const router = useRouter();
  const searchParams = useSearchParams();

  // Loading state
  const [pageLoading, setPageLoading] = useState(true);

  // Booking details from URL and/or sessionStorage
  const [booking, setBooking] = useState<BookingState | null>(null);

  // Bank accounts
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // Form states
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  // Factura Electrónica (+13% IVA)
  const [requestFactura, setRequestFactura] = useState(false);
  const [facturaCompanyName, setFacturaCompanyName] = useState("");
  const [facturaIdType, setFacturaIdType] = useState<"JURIDICA" | "FISICA" | "DIMEX" | "NITE">("JURIDICA");
  const [facturaIdNumber, setFacturaIdNumber] = useState("");
  const [facturaEmail, setFacturaEmail] = useState("");
  const [facturaPhone, setFacturaPhone] = useState("");
  const [facturaEconomicActivity, setFacturaEconomicActivity] = useState("");
  const [facturaDetails, setFacturaDetails] = useState("");

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissionStep, setSubmissionStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Hydrate booking data
  useEffect(() => {
    let resolvedBooking: BookingState | null = null;

    // 1. Try URL search params
    const qOrderIds = searchParams.get("orderIds");
    const qService = searchParams.get("serviceType") as BookingState["serviceType"] | null;
    const qDate = searchParams.get("date");
    const qTime = searchParams.get("time");
    const qDest = searchParams.get("dest");
    const qDist = searchParams.get("dist");
    const qDur = searchParams.get("dur");
    const qCost = searchParams.get("cost");
    const qTransCost = searchParams.get("transCost");
    const qInstCost = searchParams.get("instCost");
    const qPhone = searchParams.get("phone");

    if (qOrderIds && qDate) {
      resolvedBooking = {
        orderIds: qOrderIds.split(",").filter(Boolean),
        serviceType: qService || "shop_installation",
        scheduledDate: qDate,
        timeSlot: qTime || "10:00 AM",
        destinationAddress: qDest || "",
        distanceKm: Number(qDist) || 0,
        travelMinutes: Number(qDur) || 0,
        serviceCostCRC: Number(qCost) || 0,
        transportCostCRC: qTransCost !== null ? Number(qTransCost) : undefined,
        installationCostCRC: qInstCost !== null ? Number(qInstCost) : undefined,
        customerPhone: qPhone || "",
      };
    } else if (typeof window !== "undefined") {
      // 2. Try sessionStorage
      const saved = sessionStorage.getItem("zxz_service_booking");
      if (saved) {
        try {
          resolvedBooking = JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved service booking:", e);
        }
      }
    }

    if (resolvedBooking) {
      setBooking(resolvedBooking);
      if (resolvedBooking.customerPhone) {
        setPhone(resolvedBooking.customerPhone);
      }
    }

    setPageLoading(false);
  }, [searchParams]);

  // Pre-fill phone fallback from auth/profile
  useEffect(() => {
    if (phone) return;
    if (user?.phoneNumber) {
      setPhone(user.phoneNumber);
    } else {
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user?.phoneNumber) {
            setPhone((prev) => prev || data.user.phoneNumber);
          }
        })
        .catch(() => {});
    }
  }, [user, phone]);

  // Fetch verified bank accounts
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

  // Fetch ineligible products config and Pick-Up service availability
  const [ineligibleKeys, setIneligibleKeys] = useState<string[]>([]);
  const [pickupServiceEnabled, setPickupServiceEnabled] = useState<boolean>(true);
  useEffect(() => {
    fetch("/api/logistics/config", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.ineligibleHomeInstallKeys) {
            setIneligibleKeys(data.data.ineligibleHomeInstallKeys);
          }
          if (data.data.pickupServiceEnabled !== undefined) {
            setPickupServiceEnabled(Boolean(data.data.pickupServiceEnabled));
          }
        }
      })
      .catch(() => {});
  }, []);

  // Exit warning hook when service is pending and receipt uploaded
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (booking && !submitSuccess && file) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [booking, submitSuccess, file]);

  const handleCopy = (text: string, id: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedAccount(id);
      setTimeout(() => setCopiedAccount(null), 2500);
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

  // Find matching full order objects from user orders context
  const matchedOrders: UserOrder[] = useMemo(() => {
    if (!booking?.orderIds || !orders) return [];
    return orders.filter(
      (o) =>
        booking.orderIds.includes(o.id) ||
        booking.orderIds.includes(o.orderNumber)
    );
  }, [booking?.orderIds, orders]);

  // Dynamically resolve installation cost from matched orders if service is installation-capable
  // Pickup only charges transport fee at booking; its installation is paid upon vehicle retrieval
  const dynamicInstallCostCRC = useMemo(() => {
    if (!booking || !isInstallationService(booking.serviceType)) return 0;
    if (booking.installationCostCRC !== undefined && booking.installationCostCRC > 0) {
      return booking.installationCostCRC;
    }
    return getTotalOrdersInstallationCost(matchedOrders, booking.serviceType);
  }, [booking, matchedOrders]);

  const effectiveSubtotalCRC = useMemo(() => {
    if (!booking) return 0;
    if (booking.serviceType === "shop_installation") return 0;
    if (booking.transportCostCRC !== undefined) {
      const trans = booking.transportCostCRC;
      const inst = isInstallationService(booking.serviceType)
        ? (booking.installationCostCRC !== undefined && booking.installationCostCRC > 0
            ? booking.installationCostCRC
            : dynamicInstallCostCRC)
        : 0;
      return trans + inst;
    }
    if (dynamicInstallCostCRC > 0 && isInstallationService(booking.serviceType)) {
      return booking.serviceCostCRC + dynamicInstallCostCRC;
    }
    return booking.serviceCostCRC;
  }, [booking, dynamicInstallCostCRC]);

  const effectiveTotalCostCRC = effectiveSubtotalCRC;

  const effectiveTransportCostCRC = useMemo(() => {
    if (!booking) return 0;
    if (booking.transportCostCRC !== undefined) return booking.transportCostCRC;
    if (booking.serviceType === "shop_installation") return 0;
    return Math.max(0, effectiveSubtotalCRC - dynamicInstallCostCRC);
  }, [booking, effectiveSubtotalCRC, dynamicInstallCostCRC]);

  // If service is pickup, check if orders have pending installation fees that will be paid on retrieval
  const pendingPickupInstallCostCRC = useMemo(() => {
    if (!booking || booking.serviceType !== "pickup") return 0;
    return getOrdersPendingInstallationTotal(matchedOrders);
  }, [booking, matchedOrders]);

  // 13% IVA added to final price for services (if subtotal > 0)
  const ivaTaxCRC = useMemo(() => {
    return effectiveSubtotalCRC > 0 ? Math.round(effectiveSubtotalCRC * 0.13) : 0;
  }, [effectiveSubtotalCRC]);

  const facturaTaxCRC = ivaTaxCRC;

  const finalPayableCRC = effectiveSubtotalCRC + ivaTaxCRC;

  // USD Currency conversions using active live sell exchange rate
  const totalCostUSD = useMemo(() => {
    return convertCRCToUSD(finalPayableCRC, sellRate);
  }, [finalPayableCRC, sellRate]);

  const subtotalUSD = useMemo(() => {
    return convertCRCToUSD(effectiveSubtotalCRC, sellRate);
  }, [effectiveSubtotalCRC, sellRate]);

  const ivaTaxUSD = useMemo(() => {
    return convertCRCToUSD(ivaTaxCRC, sellRate);
  }, [ivaTaxCRC, sellRate]);

  const transportCostUSD = useMemo(() => {
    return convertCRCToUSD(effectiveTransportCostCRC, sellRate);
  }, [effectiveTransportCostCRC, sellRate]);

  const installCostUSD = useMemo(() => {
    return convertCRCToUSD(dynamicInstallCostCRC, sellRate);
  }, [dynamicInstallCostCRC, sellRate]);

  // Filter bank accounts by active currency (CRC / USD) & exclude SINPE
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
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

  // Check if any matched order is disqualified from home installation
  const isHomeInstallIneligible = useMemo(() => {
    if (booking?.serviceType !== "installation" || matchedOrders.length === 0) return false;
    return matchedOrders.some((ord) => {
      if (!ord.itemsJson) return false;
      try {
        const items = JSON.parse(ord.itemsJson);
        if (Array.isArray(items)) {
          return items.some((item: any) => {
            if (item.homeInstallation === false) return true;
            if (item.homeInstallationAvailable === false) return true;
            if (item.inHome_install === false) return true;
            if (item.inHomeInstallEligible === false) return true;
            if (item.id && ineligibleKeys.includes(item.id)) return true;
            if (item.sku && ineligibleKeys.includes(item.sku)) return true;
            return false;
          });
        }
      } catch {}
      return false;
    });
  }, [booking?.serviceType, matchedOrders, ineligibleKeys]);

  // Submission handler
  const handleSubmit = async () => {
    if (!booking) return;

    if (booking.serviceType === "pickup") {
      if (!pickupServiceEnabled) {
        setError(t.servicePickupDisabledAlert);
        return;
      }
      if (effectiveGarageVehicle?.pickupServiceAvailable === false) {
        setError(t.servicePickupVehicleIncompatibleAlert);
        return;
      }
    }

    if (booking.serviceType === "installation" && isHomeInstallIneligible) {
      setError(t.serviceHomeInstallBackendDisqualified);
      return;
    }

    if (!phone.trim()) {
      setError(
        lang === "es"
          ? "Por favor ingresa un número de teléfono válido para contactarte."
          : "Please enter a valid phone number so we can contact you."
      );
      return;
    }

    if (effectiveTotalCostCRC > 0 && !file) {
      setError(
        lang === "es"
          ? "Debes adjuntar el comprobante de transferencia bancaria."
          : "You must upload the bank transfer payment receipt."
      );
      return;
    }

    if (requestFactura) {
      if (!facturaCompanyName.trim()) {
        setError(
          lang === "es"
            ? "Por favor ingresa la Razón Social / Nombre Completo para la factura electrónica."
            : "Please enter legal name / company name for tax invoice."
        );
        return;
      }
      if (!facturaIdNumber.trim()) {
        setError(
          lang === "es"
            ? "Por favor ingresa el número de cédula para la factura electrónica."
            : "Please enter tax ID number for invoice."
        );
        return;
      }
      if (!facturaEmail.trim()) {
        setError(
          lang === "es"
            ? "Por favor ingresa el correo de facturación electrónica."
            : "Please enter billing email for electronic invoice."
        );
        return;
      }
    }

    if (!agreed) {
      setError(
        lang === "es"
          ? "Debes aceptar los Acuerdos y Términos de Pago para continuar."
          : "You must accept the Payment Terms and Agreements to proceed."
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSubmissionStep(1);

    try {
      let uploadedUrl: string | null = null;

      // Step 1: Upload proof image if provided
      if (file) {
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
        uploadedUrl = uploadData.url;
      }

      setSubmissionStep(2);

      // Step 2: Schedule service on primary order and all linked order IDs
      const primaryOrderId = booking.orderIds[0];
      const res = await fetch(`/api/orders/${primaryOrderId}/schedule-service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: booking.serviceType,
          scheduledDate: booking.scheduledDate,
          timeSlot: booking.timeSlot,
          destinationAddress: booking.destinationAddress,
          distanceKm: booking.distanceKm,
          travelMinutes: booking.travelMinutes,
          serviceCostCRC: finalPayableCRC,
          paymentProofUrl: uploadedUrl,
          customerPhone: phone.trim(),
          orderIds: booking.orderIds,
          paidCurrency: currency,
          isReturnBooking: Boolean(searchParams.get("return") === "true" || (booking as any)?.isReturnBooking),
          vehicleModelSlug: effectiveGarageVehicle?.modelSlug || searchParams.get("vehicleModel") || (booking as any)?.vehicleModel || null,
          requiresElectronicInvoice: requestFactura,
          electronicInvoice: requestFactura
            ? {
                companyName: facturaCompanyName.trim(),
                idType: facturaIdType,
                idNumber: facturaIdNumber.trim(),
                email: facturaEmail.trim(),
                phone: facturaPhone.trim() || phone.trim(),
                economicActivity: facturaEconomicActivity.trim(),
                subtotalCRC: effectiveSubtotalCRC,
                taxRate: 13,
                taxAmountCRC: facturaTaxCRC,
                totalWithTaxCRC: finalPayableCRC,
                details: facturaDetails.trim(),
              }
            : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.conflict || res.status === 409) {
          router.push(
            `/servicios?orderId=${booking.orderIds.join(",")}&conflict=slot_taken&date=${booking.scheduledDate}`
          );
          return;
        }
        throw new Error(
          data.error ||
            (lang === "es"
              ? "Error al confirmar el servicio"
              : "Failed to confirm service schedule")
        );
      }

      setSubmissionStep(3);
      setSubmitSuccess(true);

      // Clear session booking
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("zxz_service_booking");
      }
    } catch (err: any) {
      console.error("Error processing service payment:", err);
      setError(
        err.message ||
          (lang === "es"
            ? "Ocurrió un error inesperado al procesar el pago del servicio."
            : "An unexpected error occurred while processing service payment.")
      );
      setIsSubmitting(false);
    }
  };

  // State and handler for Card Payment (BAC Compra Click via WhatsApp)
  const [submittingBac, setSubmittingBac] = useState(false);

  const handleCardPayment = async () => {
    if (!booking) return;

    if (booking.serviceType === "pickup") {
      if (!pickupServiceEnabled) {
        setError(t.servicePickupDisabledAlert);
        return;
      }
      if (effectiveGarageVehicle?.pickupServiceAvailable === false) {
        setError(t.servicePickupVehicleIncompatibleAlert);
        return;
      }
    }

    if (booking.serviceType === "installation" && isHomeInstallIneligible) {
      setError(t.serviceHomeInstallBackendDisqualified);
      return;
    }

    if (!phone.trim()) {
      setError(
        lang === "es"
          ? "Por favor ingresa un número de teléfono válido para contactarte."
          : "Please enter a valid phone number so we can contact you."
      );
      return;
    }

    if (requestFactura) {
      if (!facturaCompanyName.trim() || !facturaIdNumber.trim() || !facturaEmail.trim()) {
        setError(
          lang === "es"
            ? "Por favor completa la Razón Social, Cédula y Correo de Facturación."
            : "Please fill out legal name, Tax ID, and billing email for electronic invoice."
        );
        return;
      }
    }

    if (!agreed) {
      setError(
        lang === "es"
          ? "Debes aceptar los Acuerdos y Términos de Pago para continuar."
          : "You must accept the Payment Terms and Agreements to proceed."
      );
      return;
    }

    setSubmittingBac(true);
    setError(null);

    try {
      const primaryOrderId = booking.orderIds[0];
      const res = await fetch(`/api/orders/${primaryOrderId}/schedule-service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: booking.serviceType,
          scheduledDate: booking.scheduledDate,
          timeSlot: booking.timeSlot,
          destinationAddress: booking.destinationAddress,
          distanceKm: booking.distanceKm,
          travelMinutes: booking.travelMinutes,
          serviceCostCRC: finalPayableCRC,
          paymentMethod: "BAC_COMPRA_CLICK",
          requestedBacLink: true,
          paymentProofUrl: "BAC_COMPRA_CLICK_AUTH: PENDIENTE",
          customerPhone: phone.trim(),
          orderIds: booking.orderIds,
          paidCurrency: currency,
          isReturnBooking: Boolean(searchParams.get("return") === "true" || (booking as any)?.isReturnBooking),
          vehicleModelSlug: effectiveGarageVehicle?.modelSlug || searchParams.get("vehicleModel") || (booking as any)?.vehicleModel || null,
          requiresElectronicInvoice: requestFactura,
          electronicInvoice: requestFactura
            ? {
                companyName: facturaCompanyName.trim(),
                idType: facturaIdType,
                idNumber: facturaIdNumber.trim(),
                email: facturaEmail.trim(),
                phone: facturaPhone.trim() || phone.trim(),
                economicActivity: facturaEconomicActivity.trim(),
                subtotalCRC: effectiveSubtotalCRC,
                taxRate: 13,
                taxAmountCRC: facturaTaxCRC,
                totalWithTaxCRC: finalPayableCRC,
                details: facturaDetails.trim(),
              }
            : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.conflict || res.status === 409) {
          router.push(
            `/servicios?orderId=${booking.orderIds.join(",")}&conflict=slot_taken&date=${booking.scheduledDate}`
          );
          return;
        }
        throw new Error(data.error || "Error al solicitar enlace de pago BAC Compra Click.");
      }

      // Generate WhatsApp link with full service & order details
      const serviceName = getServiceLabel(booking.serviceType);
      const orderNumbers = matchedOrders.map((o) => `#${o.orderNumber}`).join(", ") || `#${primaryOrderId}`;
      const vName = effectiveGarageVehicle ? `${effectiveGarageVehicle.brandName || ""} ${effectiveGarageVehicle.modelName || ""}`.trim() : "";

      let msg = `💳 *SOLICITUD BAC COMPRA-CLICK (SERVICIO)*\n`;
      msg += `*Servicio:* ${serviceName}\n`;
      msg += `*Fecha:* ${booking.scheduledDate}\n`;
      msg += `*Horario:* ${booking.timeSlot}\n`;
      if (booking.serviceType !== "shop_installation" && booking.destinationAddress) {
        msg += `*Destino:* ${booking.destinationAddress}\n`;
      }
      msg += `*Pedido(s):* ${orderNumbers}\n`;
      if (user?.displayName) {
        msg += `*Cliente:* ${user.displayName}\n`;
      }
      msg += `*Teléfono:* ${phone.trim()}\n`;
      if (vName) {
        msg += `*Vehículo:* ${vName}\n`;
      }
      msg += `\n*TOTAL A PAGAR:* ₡${finalPayableCRC.toLocaleString("es-CR")} ($${totalCostUSD.toFixed(2)} USD)\n`;
      msg += `_(13% IVA incluido)_\n\n`;
      msg += `Favor enviar el enlace seguro de pago BAC Compra-Click para este servicio.`;

      const waUrl = getWhatsAppUrl(msg);
      window.open(waUrl, "_blank", "noopener,noreferrer");

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("zxz_service_booking");
      }

      router.push(`/pedidos/${primaryOrderId}`);
    } catch (err: any) {
      console.error("Error creating BAC service payment:", err);
      setError(err.message || "Error al procesar solicitud con tarjeta BAC Compra Click.");
    } finally {
      setSubmittingBac(false);
    }
  };

  // Helper labels
  const getServiceLabel = (type: string) => {
    switch (type) {
      case "shop_installation":
        return t.serviceTabShopInstallation;
      case "installation":
        return t.serviceTabInstallation;
      case "delivery":
        return t.serviceTabDelivery;
      case "pickup":
        return t.serviceTabPickup;
      default:
        return t.serviceTabShopInstallation;
    }
  };

  const getServiceIcon = (type: string) => {
    switch (type) {
      case "shop_installation":
        return <Warehouse className="w-5 h-5 text-emerald-600" />;
      case "installation":
        return <Wrench className="w-5 h-5 text-[#C02030]" />;
      case "delivery":
        return <Truck className="w-5 h-5 text-blue-600" />;
      case "pickup":
        return <Car className="w-5 h-5 text-slate-800" />;
      default:
        return <Wrench className="w-5 h-5 text-emerald-600" />;
    }
  };

  if (pageLoading) {
    return <ServicePaymentSkeleton />;
  }

  // If no booking data exists
  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 selection:bg-[#C02030] selection:text-white">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 max-w-md w-full text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Calendar className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {lang === "es" ? "No hay servicio pendiente de pago" : "No pending service to pay"}
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            {lang === "es"
              ? "Selecciona tu orden y configura la fecha, hora y ubicación en la pantalla de servicios."
              : "Please choose your order and configure date, time, and location in the services screen."}
          </p>
          <Link
            href="/servicios"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.serviceBackToServices}</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-[#C02030] selection:text-white antialiased">
      {/* Top Secure Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/servicios"
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-[#C02030] hover:bg-slate-100 transition-colors"
              title={t.serviceBackToServices}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#C02030] tracking-wider uppercase flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#C02030]" />
                  {lang === "es" ? "Portal de Pago Seguro de Servicios" : "Secure Service Payment Portal"}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <h1 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
                {t.servicePaymentStepTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency Switcher */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-bold border border-slate-200">
              <button
                type="button"
                onClick={() => setCurrency("CRC")}
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
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
                className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  currency === "USD"
                    ? "bg-[#0052CC] text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                $ USD
              </button>
            </div>

            {/* Trust Guarantees Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-50 border border-red-200/60 text-xs font-semibold text-[#C02030]">
              <Lock className="w-3.5 h-3.5 text-[#C02030]" />
              <span>{lang === "es" ? "Cifrado SSL • ZxZ Mods Oficial" : "SSL Encrypted • Official ZxZ Mods"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Responsive Two-Column Grid */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-16 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ========================================================================= */}
          {/* LEFT COLUMN: Service Details, Orders Breakdown, Bank Accounts, Phone */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* 1. Service & Schedule Summary Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center">
                    {getServiceIcon(booking.serviceType)}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900">
                      {getServiceLabel(booking.serviceType)}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {t.serviceSummaryTitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs font-bold border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setCurrency("CRC")}
                      className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
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
                      className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                        currency === "USD"
                          ? "bg-[#0052CC] text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      $ USD
                    </button>
                  </div>

                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-900 text-white">
                    {booking.scheduledDate} • {booking.timeSlot}
                  </span>
                </div>
              </div>

              {/* Service details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#C02030]" />
                    {booking.serviceType === "shop_installation"
                      ? (lang === "es" ? "Punto de Atención" : "Service Location")
                      : (lang === "es" ? "Dirección Destino" : "Destination Address")}
                  </span>
                  <p className="font-bold text-gray-900 leading-snug">
                    {booking.destinationAddress || "Calle 34, Pozos, Santa Ana, Costa Rica"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-600" />
                    {lang === "es" ? "Distancia & Tiempo Estimado" : "Distance & Estimated Time"}
                  </span>
                  <p className="font-bold text-gray-900 leading-snug">
                    {booking.serviceType === "shop_installation"
                      ? (lang === "es" ? "0 km (Atención en taller propio)" : "0 km (In-shop service)")
                      : `${booking.distanceKm} km (~${booking.travelMinutes} min viaje)`}
                  </p>
                </div>
              </div>

              {/* Selected Orders List */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#C02030]" />
                    {t.serviceSelectedOrdersLabel}
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {booking.orderIds.length} {booking.orderIds.length === 1 ? "orden" : "órdenes"}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/70 overflow-hidden bg-slate-50/50">
                  {matchedOrders.length > 0 ? (
                    matchedOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 sm:p-3.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-black text-white font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                            #{ord.orderNumber.slice(-3)}
                          </span>
                          <div className="min-w-0">
                            <span className="font-mono font-bold text-gray-900 block truncate">
                              Orden #{ord.orderNumber}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {new Date(ord.createdAt).toLocaleDateString(
                                lang === "es" ? "es-CR" : "en-US",
                                { day: "numeric", month: "short", year: "numeric" }
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {ord.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3.5 text-xs text-slate-600 flex items-center justify-between">
                      <span className="font-mono font-bold">
                        {booking.orderIds.map((id) => `#${id}`).join(", ")}
                      </span>
                      <span className="text-emerald-700 font-bold text-[11px]">
                        {lang === "es" ? "Órdenes Verificadas" : "Verified Orders"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cost Breakdown with 13% IVA */}
              {effectiveSubtotalCRC > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{t.serviceTransportFeeLabel}:</span>
                    <span className="font-mono font-bold text-gray-900">
                      {effectiveTransportCostCRC === 0
                        ? (lang === "es" ? "₡0 (Atención en taller)" : "₡0 (In-shop service)")
                        : currency === "USD"
                        ? formatUSD(transportCostUSD)
                        : `₡${effectiveTransportCostCRC.toLocaleString("es-CR")}`}
                    </span>
                  </div>
                  {dynamicInstallCostCRC > 0 && (
                    <div className="flex items-center justify-between text-emerald-800 font-bold">
                      <span>{t.serviceOrdersInstallFeeLabel}:</span>
                      <span className="font-mono">
                        {currency === "USD"
                          ? `+${formatUSD(installCostUSD)}`
                          : `+₡${dynamicInstallCostCRC.toLocaleString("es-CR")}`}
                      </span>
                    </div>
                  )}
                  {dynamicInstallCostCRC > 0 && (
                    <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200/60 font-medium">
                      <span>{t.serviceSubtotalNetLabel}:</span>
                      <span className="font-mono">
                        {currency === "USD"
                          ? formatUSD(subtotalUSD)
                          : `₡${effectiveSubtotalCRC.toLocaleString("es-CR")}`}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[#0052CC] font-bold pt-1.5 border-t border-slate-200">
                    <span className="flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5" />
                      <span>{t.serviceIvaTaxLabel}:</span>
                    </span>
                    <span className="font-mono">
                      +{currency === "USD"
                        ? formatUSD(ivaTaxUSD)
                        : `₡${ivaTaxCRC.toLocaleString("es-CR")}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Pickup Service: Notice that transport covers both pick-up and return delivery */}
              {booking.serviceType === "pickup" && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-900 leading-relaxed">
                  <Truck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">{t.servicePickupRoundTripBadge}</span>
                    <span>{t.servicePickupRoundTripNotice}</span>
                  </div>
                </div>
              )}

              {/* Pickup Service: Notice that installation cost is paid upon vehicle retrieval */}
              {booking.serviceType === "pickup" && pendingPickupInstallCostCRC > 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">{t.servicePickupInstallHeading}</span>
                    <span>{t.servicePickupInstallPaidOnRetrievalNotice}</span>
                  </div>
                </div>
              )}

              {/* Shop Installation Service: Notice that date reservation is ₡0 and labor is paid during INSTALLATION_PAYMENT */}
              {booking.serviceType === "shop_installation" && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-2.5 text-xs text-emerald-900 leading-relaxed">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      {lang === "es" ? "Instalación en Taller (Sin costo de reserva)" : "Workshop Installation (No upfront reservation fee)"}
                    </span>
                    <span>{t.serviceShopInstallNotice}</span>
                  </div>
                </div>
              )}

              {/* Total Service Cost Banner */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                    {dynamicInstallCostCRC > 0 ? t.serviceTotalWithInstallLabel : t.totalCostLabel}
                  </span>
                  <span className="text-xs text-gray-500">
                    {finalPayableCRC === 0
                      ? t.serviceFreeTransportNotice
                      : (lang === "es" ? "Monto final a transferir" : "Final amount to transfer")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black font-mono text-[#C02030]">
                    {currency === "USD"
                      ? formatUSD(totalCostUSD)
                      : `₡${finalPayableCRC.toLocaleString("es-CR")}`}
                  </span>
                  {currency === "USD" && finalPayableCRC > 0 && (
                    <span className="text-[11px] text-gray-400 font-mono block">
                      ≈ ₡${finalPayableCRC.toLocaleString("es-CR")} (T.C. ₡${sellRate.toFixed(2)})
                    </span>
                  )}
                </div>
              </div>

              {/* Ineligible Home Install Alert */}
              {isHomeInstallIneligible && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900">
                        {t.serviceHomeInstallIneligibleBadge}
                      </p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        {t.serviceHomeInstallIneligibleReason}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/servicios"
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 self-end sm:self-auto transition"
                  >
                    {lang === "es" ? "Cambiar Servicio" : "Change Service"}
                  </Link>
                </div>
              )}
            </div>

            {/* 2. Official Bank Accounts Grid */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {t.servicePaymentAccountsHeading}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {t.servicePaymentAccountsSubtitle}
                    </p>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {lang === "es" ? "Cuentas Jurídicas Verificadas" : "Verified Accounts"}
                </span>
              </div>

              {/* Payment instructions */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
                <p className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#C02030]" />
                  {lang === "es" ? "Procedimiento de Pago:" : "Payment Procedure:"}
                </p>
                <ol className="list-decimal list-inside space-y-0.5 text-slate-600 text-[11px] pl-1">
                  <li>
                    {lang === "es"
                      ? "Copia el número IBAN de tu banco de preferencia abajo."
                      : "Copy the IBAN of your preferred bank below."}
                  </li>
                  <li>
                    {lang === "es" ? "Realiza la transferencia por exactamente: " : "Transfer exactly: "}
                    <b className="text-[#C02030] font-mono">
                      {currency === "USD"
                        ? `${formatUSD(totalCostUSD)} USD`
                        : `₡${finalPayableCRC.toLocaleString("es-CR")} CRC`}
                    </b>
                    {currency === "USD" && finalPayableCRC > 0 && (
                      <span className="text-[10px] text-slate-500 block font-normal">
                        {lang === "es"
                          ? `(Equivalente oficial a ₡${finalPayableCRC.toLocaleString("es-CR")} al T.C. ₡${sellRate.toFixed(2)})`
                          : `(Official equivalent to ₡${finalPayableCRC.toLocaleString("es-CR")} at rate ₡${sellRate.toFixed(2)})`}
                      </span>
                    )}
                  </li>
                  <li>
                    {lang === "es"
                      ? "Guarda la captura del comprobante y súbela en el recuadro a la derecha."
                      : "Save the receipt screenshot and upload it in the right column."}
                  </li>
                </ol>
              </div>

              {/* Accounts cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {loadingAccounts ? (
                  <>
                    <Skeleton className="h-32 rounded-2xl" />
                    <Skeleton className="h-32 rounded-2xl" />
                  </>
                ) : filteredAccounts.length > 0 ? (
                  filteredAccounts.map((acc, idx) => {
                    const accKey = `pay-${acc.bankName}-${idx}`;
                    const isCopied = copiedAccount === accKey;
                    const ibanString = acc.iban || acc.accountNumber || "";

                    return (
                      <div
                        key={idx}
                        className="bg-white border-2 border-slate-200 hover:border-[#C02030] rounded-2xl p-4 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
                              {acc.bankName}
                            </span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#EBF3FC] text-[#0052CC] border border-[#C2DBFE]">
                              {currency === "USD" ? "$ USD (Dólares)" : "₡ CRC (Colones)"}
                            </span>
                          </div>

                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 mb-2.5 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                                IBAN / NÚMERO
                              </span>
                              <span className="font-mono font-bold text-xs text-slate-900 truncate block">
                                {ibanString}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(ibanString, accKey)}
                              className={`p-2 rounded-lg transition-all flex items-center gap-1 text-[11px] font-bold cursor-pointer ${
                                isCopied
                                  ? "bg-emerald-600 text-white"
                                  : "bg-white text-slate-700 hover:bg-[#C02030] hover:text-white border border-slate-200 shadow-2xs"
                              }`}
                              title={lang === "es" ? "Copiar cuenta" : "Copy account"}
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{lang === "es" ? "Copiado" : "Copied"}</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>{lang === "es" ? "Copiar" : "Copy"}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-0.5 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                          {acc.ownerName && (
                            <div>
                              <span className="font-semibold text-slate-700">
                                {lang === "es" ? "Titular:" : "Holder:"}
                              </span>{" "}
                              {acc.ownerName}
                            </div>
                          )}
                          {acc.idCard && (
                            <div>
                              <span className="font-semibold text-slate-700">
                                {lang === "es" ? "Cédula Jurídica:" : "Corporate ID:"}
                              </span>{" "}
                              {acc.idCard}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full bg-slate-50 p-6 rounded-2xl text-center text-xs text-slate-500 border border-dashed border-slate-200">
                    {lang === "es"
                      ? "No hay cuentas disponibles para la moneda seleccionada. Por favor contáctanos por WhatsApp."
                      : "No bank accounts available for the selected currency. Please contact us via WhatsApp."}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Confirmed Contact Phone Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-gray-800 flex items-center justify-center font-bold">
                  <Phone className="w-5 h-5 text-[#C02030]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {t.servicePhoneInputLabel}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t.servicePhoneInputHelp}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {lang === "es" ? "Teléfono o Celular (Obligatorio)" : "Phone Number (Required)"}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+506 8888 8888"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#C02030]/20 focus:border-[#C02030] transition-all"
                    required
                  />
                  {phone.trim() && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: Proof Upload Dropzone, Agreements & Confirmation CTA */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-24 space-y-6">
            {/* Voucher Upload Card */}
            <div className="bg-white border-2 border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-red-50 text-[#C02030] flex items-center justify-center font-bold">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900">
                      {lang === "es" ? "Comprobante de Pago" : "Payment Proof"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {effectiveTotalCostCRC === 0
                        ? (lang === "es" ? "Opcional para servicio ₡0" : "Optional for ₡0 service")
                        : (lang === "es" ? "Captura de transferencia" : "Transfer screenshot")}
                    </p>
                  </div>
                </div>

                {effectiveTotalCostCRC === 0 && (
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {lang === "es" ? "₡0 Taller" : "₡0 Shop"}
                  </span>
                )}
              </div>

              {/* Upload Dropzone */}
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  file
                    ? "border-emerald-500 bg-emerald-50/30"
                    : "border-slate-300 hover:border-[#C02030] bg-slate-50 hover:bg-red-50/30"
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
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/80 text-white hover:bg-red-600 transition-colors shadow-sm"
                          title={lang === "es" ? "Quitar imagen" : "Remove image"}
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
                      <span className="text-[11px] text-[#C02030] font-semibold hover:underline block mt-1">
                        {lang === "es" ? "Haz clic para cambiar archivo" : "Click to change file"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 py-3">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#C02030] flex items-center justify-center mx-auto mb-2 shadow-2xs">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      {lang === "es"
                        ? "Arrastra tu comprobante aquí o haz clic"
                        : "Drag and drop your receipt here or click"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      JPG, PNG, WEBP, PDF ({lang === "es" ? "Máx 100MB" : "Max 100MB"})
                    </p>
                  </div>
                )}
              </label>

              {/* FACTURA ELECTRÓNICA TOGGLE & FORM (Hacienda CR) */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setRequestFactura(!requestFactura)}
                  className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 text-left flex items-center justify-between gap-3 transition cursor-pointer"
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
                          ? "Emisión oficial con Hacienda Costa Rica desglosando el 13% de IVA"
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
                        Actividad Económica (Código o Descripción)
                      </label>
                      <input
                        type="text"
                        value={facturaEconomicActivity}
                        onChange={(e) => setFacturaEconomicActivity(e.target.value)}
                        placeholder="Ej: Servicios de transporte / taller"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#0052CC]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Detalles u Observaciones para la Factura
                      </label>
                      <textarea
                        rows={2}
                        value={facturaDetails}
                        onChange={(e) => setFacturaDetails(e.target.value)}
                        placeholder="Información adicional a incluir en la factura..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:border-[#0052CC]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Agreements Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 border-l-4 border-l-[#C02030] space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#C02030] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-[#C02030] shrink-0" />
                  <span>{lang === "es" ? "Acuerdos y Condiciones de Pago" : "Payment Terms & Agreement"}</span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed text-justify">
                  {t.servicePaymentAgreementNotice}
                </p>

                <label className="flex items-start gap-2.5 pt-1 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#C02030] focus:ring-[#C02030] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800 group-hover:text-[#C02030] transition-colors select-none leading-tight">
                    {t.servicePaymentAgreementCheckbox}
                  </span>
                </label>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit CTA Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  isSubmitting ||
                  submittingBac ||
                  isHomeInstallIneligible ||
                  !phone.trim() ||
                  !agreed ||
                  (finalPayableCRC > 0 && !file)
                }
                className="w-full py-4 px-6 rounded-2xl bg-[#C02030] hover:bg-[#A01825] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm tracking-wider uppercase transition-all shadow-lg shadow-[#C02030]/25 disabled:shadow-none flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {submissionStep === 1
                        ? t.serviceUploadingReceipt
                        : t.serviceRegisteringReservation}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {finalPayableCRC === 0
                        ? t.serviceProceedToConfirmFreeBtn
                        : `${t.servicePayAndReserveBtn} (${
                            currency === "USD"
                              ? formatUSD(totalCostUSD)
                              : `₡${finalPayableCRC.toLocaleString("es-CR")}`
                          })`}
                    </span>
                  </>
                )}
              </button>

              {/* Secondary BAC Compra-Click Card Payment Button */}
              {finalPayableCRC > 0 && (
                <button
                  type="button"
                  onClick={handleCardPayment}
                  disabled={
                    isSubmitting ||
                    submittingBac ||
                    isHomeInstallIneligible ||
                    !phone.trim() ||
                    !agreed
                  }
                  className="w-full py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2.5 cursor-pointer border border-slate-700/60"
                  title={t.servicePayWithCardBacDesc}
                >
                  {submittingBac ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t.servicePayWithCardGenerating}</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 text-[#E01E26]" />
                      <span>{t.servicePayWithCardBac}</span>
                    </>
                  )}
                </button>
              )}

              {/* Back to services link */}
              <div className="text-center pt-1">
                <Link
                  href="/servicios"
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t.serviceBackToServices}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Full-Screen Submission Animation Overlay (Matches Checkout Animation) */}
      <DjiPaymentAnimationOverlay
        isOpen={isSubmitting || submitSuccess}
        step={submissionStep}
        title={
          submissionStep === 1
            ? finalPayableCRC === 0
              ? (lang === "es" ? "Agendando Cita..." : "Scheduling Appointment...")
              : (lang === "es" ? "Subiendo Comprobante..." : "Uploading Receipt...")
            : submissionStep === 2
            ? lang === "es"
              ? "Registrando tu Servicio..."
              : "Registering Service..."
            : finalPayableCRC === 0
            ? t.serviceShopInstallOverlayTitle
            : lang === "es"
            ? "¡Pago en Confirmación!"
            : "Payment in Confirmation!"
        }
        subtitle={
          submissionStep < 3
            ? finalPayableCRC === 0
              ? (lang === "es"
                  ? "Sincronizando tu reserva de fecha con el sistema ZxZ Mods..."
                  : "Syncing your appointment schedule with the ZxZ Mods system...")
              : (lang === "es"
                  ? "Estamos enlazando tu transferencia bancaria con el sistema ZxZ Mods..."
                  : "Linking your bank transfer with the ZxZ Mods system...")
            : finalPayableCRC === 0
            ? t.serviceShopInstallOverlaySub
            : lang === "es"
            ? "Tu servicio ha sido programado con éxito. Redirigiendo a tu seguimiento en vivo..."
            : "Service scheduled successfully. Redirecting to live tracking..."
        }
        lang={lang}
        onAnimationComplete={() => {
          if (booking?.orderIds?.[0]) {
            router.push(`/pedidos/${booking.orderIds[0]}`);
          }
        }}
      />
    </div>
  );
}

export default function ServicePaymentPage() {
  return (
    <Suspense fallback={<ServicePaymentSkeleton />}>
      <ServicePaymentContent />
    </Suspense>
  );
}
