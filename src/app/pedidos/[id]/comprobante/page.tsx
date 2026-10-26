"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { COMPANY_CONFIG } from "@/config/company";
import { formatCRC, formatUSD, convertCRCToUSD } from "@/lib/i18n";
import {
  extractReceiptItems,
  getServiceTypeLabel,
  isOrderPaymentConfirmed,
  isInstallationPaymentConfirmed,
  isServicePaymentConfirmed,
  hasAnyConfirmedPayment,
  ReceiptPaymentType,
  ReceiptOrderData,
} from "@/lib/orderReceipt";
import {
  Printer,
  ArrowLeft,
  CheckCircle2,
  Package,
  Calendar,
  CreditCard,
  Truck,
  Wrench,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  Tag,
  AlertCircle,
  FileCheck2,
} from "lucide-react";

export default function OrderReceiptPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = (params?.id as string) || "";
  const queryLang = searchParams?.get("lang") as "es" | "en" | null;
  const queryType = searchParams?.get("type") as ReceiptPaymentType | null;

  const { lang: appLang, t } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<"es" | "en">(queryLang || appLang || "es");
  const [activeType, setActiveType] = useState<ReceiptPaymentType>(queryType || "ORDER");

  const [order, setOrder] = useState<ReceiptOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isEs = selectedLang === "es";

  useEffect(() => {
    if (!orderId) return;
    let isMounted = true;
    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError(data.error || (isEs ? "No se pudo cargar el comprobante" : "Failed to load receipt"));
        }
      })
      .catch((err) => {
        console.error("Error fetching order for receipt:", err);
        if (isMounted) {
          setError(isEs ? "Error de conexión al cargar el comprobante" : "Network error loading receipt");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [orderId, isEs]);

  const orderPaid = useMemo(() => (order ? isOrderPaymentConfirmed(order) : false), [order]);
  const installPaid = useMemo(() => (order ? isInstallationPaymentConfirmed(order) : false), [order]);
  const servicePaid = useMemo(() => (order ? isServicePaymentConfirmed(order) : false), [order]);
  const anyPaid = useMemo(() => (order ? hasAnyConfirmedPayment(order) : false), [order]);

  // Adjust activeType if requested type is not paid
  useEffect(() => {
    if (!order) return;
    if (activeType === "ORDER" && !orderPaid) {
      if (installPaid) setActiveType("INSTALLATION");
      else if (servicePaid) setActiveType("SERVICE");
    }
  }, [order, activeType, orderPaid, installPaid, servicePaid]);

  const items = useMemo(() => {
    return order ? extractReceiptItems(order) : [];
  }, [order]);

  const currency = String(order?.paidCurrency || "CRC").toUpperCase() === "USD" ? "USD" : "CRC";
  const sellRate = 520;

  const formatPrice = (crcAmount: number) => {
    if (currency === "USD") {
      return formatUSD(convertCRCToUSD(crcAmount, sellRate));
    }
    return formatCRC(crcAmount);
  };

  const secondaryPrice = (crcAmount: number) => {
    if (currency === "USD") {
      return formatCRC(crcAmount);
    }
    return `≈ ${formatUSD(convertCRCToUSD(crcAmount, sellRate))}`;
  };

  // Rule 7: Animated Skeleton Screen while loading real backend data
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 py-8 px-3">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-9 w-40 bg-neutral-200 rounded-xl" />
          <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex justify-between">
              <Skeleton className="h-10 w-48 bg-neutral-200 rounded-lg" />
              <Skeleton className="h-10 w-28 bg-neutral-200 rounded-lg" />
            </div>
            <Skeleton className="h-20 w-full bg-neutral-100 rounded-lg" />
            <Skeleton className="h-32 w-full bg-neutral-100 rounded-lg" />
            <Skeleton className="h-16 w-48 ml-auto bg-neutral-100 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-neutral-900">
            {isEs ? "No se pudo generar el comprobante" : "Unable to generate receipt"}
          </h2>
          <p className="text-xs text-neutral-500">{error || (isEs ? "Orden no encontrada" : "Order not found")}</p>
          <Link
            href={`/pedidos/${orderId}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isEs ? "Volver a la orden" : "Back to order"}</span>
          </Link>
        </div>
      </div>
    );
  }

  // REQUIREMENT: Payment receipt only shows after payment is confirmed!
  if (!anyPaid) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 sm:p-10 max-w-md w-full text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-50 text-amber-800 border border-amber-200">
            {isEs ? "Pago Pendiente de Confirmación" : "Payment Pending Confirmation"}
          </span>
          <h2 className="text-lg font-black text-neutral-900">
            {isEs ? "Comprobante Oficial No Disponible" : "Official Receipt Not Available Yet"}
          </h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            {isEs
              ? "El comprobante oficial de pago se genera automáticamente una vez que el taller valide y confirme la acreditación de tus fondos."
              : "The official payment receipt is generated automatically once our workshop verifies and confirms your payment."}
          </p>
          <div className="pt-2">
            <Link
              href={`/pedidos/${order.id}`}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isEs ? "Volver a la orden" : "Back to order"}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const customerName =
    order.customerName ||
    order.user?.displayName ||
    (isEs ? "Cliente Estimado" : "Valued Customer");
  const customerEmail = order.guestEmail || order.user?.email || "N/A";
  const customerPhone = order.customerPhone || order.user?.phoneNumber || "N/A";
  const deliveryMode = getServiceTypeLabel(order.serviceType, selectedLang);

  let vehicleStr = "";
  let docsData: any = {};
  if (order.serviceDocumentsJson) {
    try {
      docsData =
        typeof order.serviceDocumentsJson === "string"
          ? JSON.parse(order.serviceDocumentsJson)
          : order.serviceDocumentsJson;
      if (docsData?.vehicle) {
        vehicleStr = `${docsData.vehicle.make || ""} ${docsData.vehicle.model || ""} ${docsData.vehicle.year || ""}`.trim();
      }
    } catch {}
  }

  // Date formatting
  const dateStr = new Date(order.createdAt).toLocaleDateString(isEs ? "es-CR" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Calculate totals and titles based on activeType
  let receiptTitle = isEs ? "COMPROBANTE OFICIAL DE COMPRA" : "OFFICIAL PURCHASE RECEIPT";
  let statusBadgeLabel = isEs ? "Pago Confirmado" : "Payment Confirmed";
  let displayTotalCRC = order.totalCRC;

  const baseLabor = docsData.installationPaymentLaborCRC || order.installationCostCRC || order.laborSubtotalCRC || 0;
  const ivaCost = docsData.installationPaymentIvaCRC !== undefined ? docsData.installationPaymentIvaCRC : Math.round(baseLabor * 0.13);
  const totalInstallAmount = docsData.installationPaymentPaidAmountCRC || (baseLabor + ivaCost);

  if (activeType === "INSTALLATION") {
    receiptTitle = isEs ? "COMPROBANTE DE INSTALACIÓN & MANO DE OBRA" : "LABOR & INSTALLATION RECEIPT";
    statusBadgeLabel = isEs ? "Pago de Instalación Confirmado" : "Installation Payment Confirmed";
    displayTotalCRC = totalInstallAmount;
  } else if (activeType === "SERVICE") {
    receiptTitle = isEs ? "COMPROBANTE DE SERVICIO DE TRANSPORTE" : "TRANSPORT SERVICE RECEIPT";
    statusBadgeLabel = isEs ? "Pago de Servicio Confirmado" : "Service Payment Confirmed";
    displayTotalCRC = order.shippingCostCRC || order.pickupCostCRC || 0;
  } else if (activeType === "COMPLETE") {
    receiptTitle = isEs ? "COMPROBANTE DE PAGO CONSOLIDADO" : "CONSOLIDATED PAYMENT RECEIPT";
    statusBadgeLabel = isEs ? "Pagos Confirmados por Taller" : "Payments Confirmed";
    displayTotalCRC = order.totalCRC;
  } else {
    // ORDER
    receiptTitle = isEs ? "COMPROBANTE OFICIAL DE COMPRA" : "OFFICIAL PURCHASE RECEIPT";
    statusBadgeLabel = isEs ? "Pago de Productos Confirmado" : "Products Payment Confirmed";
    displayTotalCRC = (order.partsSubtotalCRC || order.totalCRC) - (order.discountCRC || 0);
  }

  const countConfirmedTypes = [orderPaid, installPaid, servicePaid].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 py-4 sm:py-8 px-2 sm:px-4 font-sans antialiased text-xs">
      {/* Top Action Bar (Hidden when printing via CSS @media print) */}
      <div className="max-w-2xl mx-auto mb-3 flex flex-wrap items-center justify-between gap-2.5 no-print">
        <Link
          href={`/pedidos/${order.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition bg-white border border-neutral-200 px-3 py-1.5 rounded-lg shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isEs ? "Volver a la orden" : "Back to order"}</span>
        </Link>

        {/* Multi-Payment Category Tabs (when order has multiple confirmed payments) */}
        {countConfirmedTypes > 1 && (
          <div className="flex items-center bg-white border border-neutral-200 rounded-lg p-0.5 text-[11px] font-bold shadow-2xs">
            {orderPaid && (
              <button
                type="button"
                onClick={() => setActiveType("ORDER")}
                className={`px-2.5 py-1 rounded transition ${
                  activeType === "ORDER" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {isEs ? "Productos" : "Products"}
              </button>
            )}
            {installPaid && (
              <button
                type="button"
                onClick={() => setActiveType("INSTALLATION")}
                className={`px-2.5 py-1 rounded transition ${
                  activeType === "INSTALLATION" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {isEs ? "Instalación" : "Installation"}
              </button>
            )}
            {servicePaid && (
              <button
                type="button"
                onClick={() => setActiveType("SERVICE")}
                className={`px-2.5 py-1 rounded transition ${
                  activeType === "SERVICE" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {isEs ? "Transporte" : "Transport"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveType("COMPLETE")}
              className={`px-2.5 py-1 rounded transition ${
                activeType === "COMPLETE" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {isEs ? "Consolidado" : "Consolidated"}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex items-center bg-white border border-neutral-200 rounded-lg p-0.5 text-xs font-semibold shadow-2xs">
            <button
              type="button"
              onClick={() => setSelectedLang("es")}
              className={`px-2 py-1 rounded transition ${
                isEs ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => setSelectedLang("en")}
              className={`px-2 py-1 rounded transition ${
                !isEs ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              EN
            </button>
          </div>

          {/* Minimalist Print / PDF Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isEs ? "Imprimir" : "Print"}</span>
          </button>
        </div>
      </div>

      {/* Printable Compact Receipt Card (Amazon Clean Neutral Style) */}
      <div className="receipt-container max-w-2xl mx-auto bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs print:border-none print:shadow-none print:rounded-none">
        {/* Receipt Header */}
        <div className="p-4 sm:p-5 border-b-2 border-neutral-900 flex flex-col sm:flex-row justify-between items-start gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-neutral-900 uppercase">
              ZXZ <span className="text-[#C02030]">MODS</span> COSTA RICA
            </h1>
            <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
              ZxZ Mods
              {COMPANY_CONFIG.cedulaJuridica ? ` • Cédula: ${COMPANY_CONFIG.cedulaJuridica}` : ""} <span className="text-[9.5px] text-neutral-400">({COMPANY_CONFIG.legalName})</span> • {isEs ? "Centro Técnico Especializado" : "Specialized Performance Center"}
            </p>
            <p className="text-[10px] text-neutral-500">
              {isEs ? COMPANY_CONFIG.location.addressEs : COMPANY_CONFIG.location.addressEn}
            </p>
            <p className="text-[10px] text-neutral-500">
              {isEs ? "Email Oficial:" : "Official Email:"} ventas@zxzmods.com • {isEs ? "Tel / WhatsApp:" : "Phone / WhatsApp:"} {COMPANY_CONFIG.contact.phone}
            </p>
          </div>

          <div className="text-left sm:text-right sm:self-start shrink-0">
            <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 mb-1">
              {statusBadgeLabel}
            </span>
            <div className="text-xs sm:text-sm font-extrabold font-mono text-neutral-900">
              #{order.orderNumber}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5">
              {dateStr}
            </div>
          </div>
        </div>

        {/* 2-Column Info: Buyer & Payment Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-neutral-200 bg-neutral-50/60 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200">
          <div className="p-3 sm:p-4 space-y-1 text-[11px]">
            <h4 className="text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">
              {isEs ? "Comprador / Facturado A" : "Billed To / Buyer"}
            </h4>
            <div>
              <span className="text-neutral-500">{isEs ? "Nombre: " : "Name: "}</span>
              <span className="font-bold text-neutral-900">{customerName}</span>
            </div>
            <div>
              <span className="text-neutral-500">{isEs ? "Correo: " : "Email: "}</span>
              <span className="font-semibold text-neutral-900">{customerEmail}</span>
            </div>
            <div>
              <span className="text-neutral-500">{isEs ? "Teléfono: " : "Phone: "}</span>
              <span className="font-semibold text-neutral-900">{customerPhone}</span>
            </div>
            {vehicleStr && (
              <div>
                <span className="text-neutral-500">{isEs ? "Vehículo: " : "Vehicle: "}</span>
                <span className="font-semibold text-neutral-900">{vehicleStr}</span>
              </div>
            )}
          </div>

          <div className="p-3 sm:p-4 space-y-1 text-[11px]">
            <h4 className="text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">
              {isEs ? "Detalles del Pago & Entrega" : "Payment & Delivery Info"}
            </h4>
            <div>
              <span className="text-neutral-500">{isEs ? "Estado: " : "Status: "}</span>
              <span className="font-bold text-emerald-700">{statusBadgeLabel}</span>
            </div>
            <div>
              <span className="text-neutral-500">{isEs ? "Método: " : "Method: "}</span>
              <span className="font-semibold text-neutral-900">
                {isEs ? "Transferencia Bancaria (IBAN)" : "Bank Wire Transfer (IBAN)"}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">{isEs ? "Moneda: " : "Currency: "}</span>
              <span className="font-semibold text-neutral-900">
                {currency === "USD" ? "Dólares ($ USD)" : "Colones (₡ CRC)"}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">{isEs ? "Modalidad: " : "Delivery Mode: "}</span>
              <span className="font-semibold text-neutral-900">{deliveryMode}</span>
            </div>
            {order.shippingAddress && (
              <div>
                <span className="text-neutral-500">{isEs ? "Dirección: " : "Address: "}</span>
                <span className="font-semibold text-neutral-900">{order.shippingAddress}</span>
              </div>
            )}
          </div>
        </div>

        {/* Itemized Table */}
        <div className="p-3 sm:p-4">
          <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-700 mb-2">
            {isEs ? "Detalle del Pago y Conceptos Acreditados" : "Breakdown of Paid & Confirmed Items"}
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left border-collapse">
              <thead>
                <tr className="border-t border-b border-neutral-200 bg-neutral-50 text-neutral-600 uppercase text-[9px] tracking-wider">
                  <th className="py-1.5 px-2 font-bold">{isEs ? "Descripción" : "Description"}</th>
                  <th className="py-1.5 px-2 font-bold text-center w-12">{isEs ? "Cant." : "Qty"}</th>
                  <th className="py-1.5 px-2 font-bold text-right w-24">{isEs ? "Precio Unit." : "Unit Price"}</th>
                  <th className="py-1.5 px-2 font-bold text-right w-24">{isEs ? "Subtotal" : "Total"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {activeType === "INSTALLATION" ? (
                  <tr>
                    <td className="py-2 px-2">
                      <div className="font-bold text-neutral-900">
                        {isEs ? "Servicio Técnico Especializado - Instalación & Montaje" : "Specialized Technical Installation & Labor"}
                      </div>
                      <div className="text-[9px] font-mono text-neutral-400">
                        SKU: INST-SRV • {isEs ? "Garantía de Taller: 60 días" : "Workshop Warranty: 60 days"}
                      </div>
                      {vehicleStr && (
                        <div className="text-[9px] text-neutral-500 mt-0.5">{isEs ? "Vehículo:" : "Vehicle:"} {vehicleStr}</div>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center font-semibold text-neutral-800">1</td>
                    <td className="py-2 px-2 text-right font-mono text-neutral-700 font-semibold">{formatPrice(baseLabor)}</td>
                    <td className="py-2 px-2 text-right font-bold text-neutral-900">{formatPrice(baseLabor)}</td>
                  </tr>
                ) : activeType === "SERVICE" ? (
                  <tr>
                    <td className="py-2 px-2">
                      <div className="font-bold text-neutral-900">{deliveryMode}</div>
                      <div className="text-[9px] font-mono text-neutral-400">
                        SKU: LOG-SRV • {isEs ? "Logística Oficial ZxZ" : "Official ZxZ Logistics"}
                      </div>
                      {order.shippingAddress && (
                        <div className="text-[9px] text-neutral-500 mt-0.5">{order.shippingAddress}</div>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center font-semibold text-neutral-800">1</td>
                    <td className="py-2 px-2 text-right font-mono text-neutral-700 font-semibold">{formatPrice(displayTotalCRC)}</td>
                    <td className="py-2 px-2 text-right font-bold text-neutral-900">{formatPrice(displayTotalCRC)}</td>
                  </tr>
                ) : (
                  <>
                    {items.map((it, idx) => {
                      const itemName = isEs
                        ? it.nameEs || it.title || "Artículo"
                        : it.nameEn || it.nameEs || it.title || "Item";
                      const itemSku = it.sku || it.slug || (it.id ? String(it.id).slice(0, 10) : `ITM-${idx + 1}`);
                      const qty = Math.max(1, Number(it.quantity) || 1);
                      const unitCost = Number(it.unitPriceCRC || it.priceCRC || it.price || 0);
                      const lineSubtotal = unitCost * qty;
                      const paramsText = Array.isArray(it.selectedParameters) && it.selectedParameters.length > 0
                        ? it.selectedParameters.map((p) => `${p.name}: ${p.value}`).join(" | ")
                        : "";

                      return (
                        <tr key={idx} className="hover:bg-neutral-50/50">
                          <td className="py-2 px-2">
                            <div className="font-bold text-neutral-900">{itemName}</div>
                            <div className="text-[9px] font-mono text-neutral-400">SKU: {itemSku}</div>
                            {paramsText && (
                              <div className="text-[9px] text-neutral-500 mt-0.5">{paramsText}</div>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center font-semibold text-neutral-800">{qty}</td>
                          <td className="py-2 px-2 text-right font-mono text-neutral-700 font-semibold">{formatPrice(unitCost)}</td>
                          <td className="py-2 px-2 text-right font-bold text-neutral-900">{formatPrice(lineSubtotal)}</td>
                        </tr>
                      );
                    })}

                    {activeType === "COMPLETE" && installPaid && (order.installationCostCRC || order.laborSubtotalCRC) ? (
                      <tr className="bg-neutral-50/60">
                        <td className="py-2 px-2">
                          <div className="font-bold text-neutral-900">{isEs ? "Mano de Obra de Instalación (Confirmado)" : "Installation Labor (Confirmed)"}</div>
                          <div className="text-[9px] font-mono text-neutral-400">SKU: INST-SRV</div>
                        </td>
                        <td className="py-2 px-2 text-center font-semibold text-neutral-800">1</td>
                        <td className="py-2 px-2 text-right font-mono text-neutral-700 font-semibold">{formatPrice(order.installationCostCRC || order.laborSubtotalCRC || 0)}</td>
                        <td className="py-2 px-2 text-right font-bold text-neutral-900">{formatPrice(order.installationCostCRC || order.laborSubtotalCRC || 0)}</td>
                      </tr>
                    ) : null}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="p-3 sm:p-4 pt-0">
          <div className="max-w-xs ml-auto border-t border-neutral-200 pt-2 space-y-1 text-[11px] text-neutral-600">
            {activeType === "INSTALLATION" ? (
              <>
                <div className="flex justify-between">
                  <span>{isEs ? "Mano de Obra Neta:" : "Net Labor:"}</span>
                  <span className="font-semibold text-neutral-800">{formatPrice(baseLabor)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isEs ? "IVA (13%):" : "VAT (13%):"}</span>
                  <span className="font-semibold text-neutral-800">{formatPrice(ivaCost)}</span>
                </div>
              </>
            ) : activeType === "SERVICE" ? (
              <div className="flex justify-between">
                <span>{isEs ? "Servicio de Logística:" : "Logistics Service:"}</span>
                <span className="font-semibold text-neutral-800">{formatPrice(displayTotalCRC)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>{isEs ? "Subtotal de Partes:" : "Parts Subtotal:"}</span>
                  <span className="font-semibold text-neutral-800">{formatPrice(order.partsSubtotalCRC || order.totalCRC)}</span>
                </div>
                {activeType === "COMPLETE" && (order.laborSubtotalCRC || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>{isEs ? "Subtotal de Mano de Obra:" : "Labor Subtotal:"}</span>
                    <span className="font-semibold text-neutral-800">{formatPrice(order.laborSubtotalCRC)}</span>
                  </div>
                )}
                {activeType === "COMPLETE" && (order.shippingCostCRC || 0) > 0 && (
                  <div className="flex justify-between">
                    <span>{isEs ? "Logística / Envío:" : "Shipping:"}</span>
                    <span className="font-semibold text-neutral-800">{formatPrice(order.shippingCostCRC || 0)}</span>
                  </div>
                )}
                {(order.discountCRC || 0) > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>{isEs ? "Descuento Aplicado:" : "Discount Applied:"}</span>
                    <span>-{formatPrice(order.discountCRC || 0)}</span>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between text-xs sm:text-sm font-black text-neutral-900 border-t-2 border-neutral-900 pt-2 mt-1">
              <span>{isEs ? "TOTAL PAGADO:" : "TOTAL PAID:"}</span>
              <span>{formatPrice(displayTotalCRC)}</span>
            </div>
            <div className="text-[10px] text-neutral-500 text-right font-medium">
              {secondaryPrice(displayTotalCRC)}
            </div>
          </div>
        </div>

        {/* Terms, Warranties & Conditions (Amazon Style Clean Box) */}
        <div className="mx-3 sm:mx-4 mb-3 p-2.5 sm:p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-[9.5px] text-neutral-600 space-y-1 leading-snug">
          <h5 className="font-black text-neutral-900 uppercase tracking-wide text-[9.5px]">
            {isEs ? "TÉRMINOS, GARANTÍAS Y CONDICIONES GENERALES" : "TERMS & CONDITIONS"}
          </h5>
          <div>
            <strong className="text-neutral-800">{isEs ? "1. Garantía Oficial ZxZ: " : "1. Official Warranty: "}</strong>
            {isEs
              ? "90 días en partes bolt-on y accesorios eléctricos; 60 días en mano de obra mecánica; soporte de por vida en software ECU ZxZ."
              : "90 days on bolt-on & electrical parts; 60 days workshop labor; lifetime support on ZxZ ECU software."}
          </div>
          <div>
            <strong className="text-neutral-800">{isEs ? "2. Tiempos de Entrega & Importación: " : "2. Delivery & Import Times: "}</strong>
            {isEs
              ? "Repuestos importación EE.UU.: 7 a 12 días hábiles en taller central. Inventario local: entrega inmediata coordinada."
              : "US imports: 7 to 12 business days. Local stock: immediate coordinated delivery or installation."}
          </div>
          <div>
            <strong className="text-neutral-800">{isEs ? "3. Atención al Cliente y Facturación: " : "3. Customer Support & Billing: "}</strong>
            {isEs
              ? `Consultas a ventas@zxzmods.com o WhatsApp al ${COMPANY_CONFIG.contact.phone}. Ubicación: ${COMPANY_CONFIG.location.addressEs}.`
              : `Queries to ventas@zxzmods.com or WhatsApp at ${COMPANY_CONFIG.contact.phone}. Workshop located at ${COMPANY_CONFIG.location.addressEn}.`}
          </div>
          <div>
            <strong className="text-neutral-800">{isEs ? "4. Política de No Devoluciones: " : "4. No Return Policy: "}</strong>
            {isEs
              ? "Todas las ventas son finales. No se aceptan devoluciones en componentes eléctricos, repuestos instalados ni órdenes especiales de importación una vez confirmados o entregados. Cobertura estricta bajo garantía por defectos de fábrica."
              : "All sales are final. No returns on electrical components, installed parts, or direct import orders once confirmed or delivered. Strictly covered by warranty for manufacturing defects."}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-200 text-center text-[10px] text-neutral-500 space-y-0.5 bg-white">
          <p className="font-bold text-neutral-800">
            {isEs ? "¡Gracias por confiar en ZxZ Mods Costa Rica!" : "Thank you for shopping with ZxZ Mods Costa Rica!"}
          </p>
          <p className="text-[9.5px] text-neutral-400">
            {isEs
              ? "Este documento constituye un comprobante formal de pago generado automáticamente para registros del cliente."
              : "This document serves as a formal payment receipt generated automatically for customer records."}
          </p>
          <div className="pt-1 flex items-center justify-center gap-2 text-[9.5px] font-semibold text-neutral-600">
            <span>{isEs ? "Soporte:" : "Support:"} {COMPANY_CONFIG.contact.phone}</span>
            <span>•</span>
            <a
              href={COMPANY_CONFIG.contact.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-900 transition underline-offset-2 hover:underline"
            >
              Facebook
            </a>
            <span>•</span>
            <a
              href={COMPANY_CONFIG.contact.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-900 transition underline-offset-2 hover:underline"
            >
              Instagram
            </a>
            <span>•</span>
            <a
              href={COMPANY_CONFIG.location.googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-900 transition underline-offset-2 hover:underline"
            >
              Google Maps
            </a>
          </div>
        </div>
      </div>

      {/* Embedded Print CSS Rules */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .receipt-container {
            border: none !important;
            box-shadow: none !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
