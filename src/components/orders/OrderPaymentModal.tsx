"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { COMPANY_CONFIG } from "@/config/company";
import { formatCRC, formatUSD, convertCRCToUSD } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  PaymentPlanType,
  computeSplitPaymentAmounts,
  extractSplitPayment,
  isEligibleForSplitPayment,
} from "@/lib/splitPayment";
import { PaymentPlanSelector } from "@/components/cart/PaymentPlanSelector";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  FileImage,
  FileText,
  Loader2,
  Lock,
  Phone,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";

interface OrderPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  isRejected: boolean;
  isCurrencyBonded: boolean;
  initialCurrency: "CRC" | "USD";
  sellRate: number;
  userPhone?: string | null;
  claimToken?: string | null;
  onPaymentCompleted: () => Promise<void> | void;
}

function formatIbanDisplay(iban: string): string {
  if (!iban) return "";
  const clean = iban.replace(/\s+/g, "");
  return clean.match(/.{1,4}/g)?.join(" ") || clean;
}

export function OrderPaymentModal({
  isOpen,
  onClose,
  order,
  isRejected,
  isCurrencyBonded,
  initialCurrency,
  sellRate,
  userPhone,
  claimToken,
  onPaymentCompleted,
}: OrderPaymentModalProps) {
  const { t, lang } = useLanguage();
  const isEs = lang === "es";

  const [payCurrency, setPayCurrency] = useState<"CRC" | "USD">(initialCurrency);
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlanType>("FULL_100");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const existingSplit = useMemo(() => extractSplitPayment(order), [order]);
  const fullOrderTotalCRC = Math.max(0, Number(order?.totalCRC) || 0);
  const isSplitEligible = isEligibleForSplitPayment(fullOrderTotalCRC);
  const effectivePlan: PaymentPlanType = existingSplit
    ? "SPLIT_70_30"
    : paymentPlan === "SPLIT_70_30" && isSplitEligible
    ? "SPLIT_70_30"
    : "FULL_100";

  const splitAmounts = useMemo(
    () => computeSplitPaymentAmounts(fullOrderTotalCRC),
    [fullOrderTotalCRC]
  );

  const payableTodayCRC =
    effectivePlan === "SPLIT_70_30"
      ? existingSplit?.initial70AmountCRC || splitAmounts.initial70AmountCRC
      : fullOrderTotalCRC;
  const activeSellRate = sellRate > 300 ? sellRate : 455.21;
  const payableTodayUSD = convertCRCToUSD(payableTodayCRC, activeSellRate);

  const formatAmount = (crcAmount: number) =>
    payCurrency === "USD"
      ? formatUSD(convertCRCToUSD(crcAmount, activeSellRate))
      : formatCRC(crcAmount);

  // Reset form & prefill phone when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setPayCurrency(
      order?.paidCurrency
        ? String(order.paidCurrency).toUpperCase() === "USD"
          ? "USD"
          : "CRC"
        : initialCurrency
    );
    setPaymentPlan(existingSplit ? "SPLIT_70_30" : "FULL_100");
    setPhone(order?.customerPhone || userPhone || "");
    setReference("");
    setNotes("");
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [isOpen, order?.id, order?.customerPhone, order?.paidCurrency, userPhone, initialCurrency, existingSplit]);

  // Lock body scroll while modal is open (prevents iOS background scroll issues)
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Fetch official bank accounts dynamically (Rule 2: zero mock data)
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setLoadingAccounts(true);
    fetch("/api/payment/accounts")
      .then((res) => res.json())
      .then((data) => {
        if (mounted && data.success && Array.isArray(data.accounts)) {
          setAccounts(data.accounts);
        }
      })
      .catch((err) => console.error("Error fetching bank accounts in modal:", err))
      .finally(() => {
        if (mounted) setLoadingAccounts(false);
      });
    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const isSinpe =
        acc.isSinpe === true ||
        acc.type === "SINPE" ||
        acc.bankName?.toLowerCase().includes("sinpe");
      if (isSinpe) return false;
      if (payCurrency === "USD") {
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
  }, [accounts, payCurrency]);

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2200);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/") && selected.type !== "application/pdf") {
      setErrorMsg(
        isEs
          ? "Por favor sube una imagen (JPG, PNG, WEBP) o un archivo PDF."
          : "Please upload an image (JPG, PNG, WEBP) or PDF file."
      );
      return;
    }
    if (selected.size > 100 * 1024 * 1024) {
      setErrorMsg(
        isEs ? "El archivo supera el límite de 100MB." : "File exceeds the 100MB limit."
      );
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(selected);
    setPreviewUrl(selected.type.startsWith("image/") ? URL.createObjectURL(selected) : null);
    setErrorMsg(null);
  };

  const clearFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !order) return;

    if (!file) {
      setErrorMsg(
        isEs
          ? "Debes adjuntar la foto, captura o PDF de tu comprobante de transferencia bancaria."
          : "Please attach the photo, screenshot, or PDF of your bank transfer receipt."
      );
      return;
    }
    if (!isRejected && !phone.trim()) {
      setErrorMsg(
        isEs
          ? "Por favor ingresa tu número de teléfono / WhatsApp para coordinar tu pedido."
          : "Please enter your phone / WhatsApp number so we can coordinate your order."
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      // Step 1: Upload proof file
      const formData = new FormData();
      formData.append("file", file);
      const upRes = await fetch("/api/upload/payment", {
        method: "POST",
        body: formData,
      });
      const upData = await upRes.json();
      if (!upRes.ok || !upData.success || !upData.url) {
        throw new Error(
          upData.error ||
            (isEs
              ? "Error al subir el comprobante. Intenta de nuevo."
              : "Failed to upload payment receipt. Please try again.")
        );
      }

      // Step 2: Register payment on the order
      const payRes = await fetch(`/api/orders/${order.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: "BANK_TRANSFER",
          referenceNumber: reference.trim(),
          customerPhone: phone.trim() || order.customerPhone || "",
          notes: notes.trim(),
          paidCurrency: payCurrency,
          paymentProofUrl: upData.url,
          paymentPlan: isRejected ? undefined : effectivePlan,
          claimToken: claimToken || undefined,
        }),
      });
      const payData = await payRes.json();
      if (!payRes.ok || !payData.success || !payData.order) {
        throw new Error(
          payData.error ||
            (isEs ? "Error al registrar el pago en la orden." : "Failed to register payment.")
        );
      }

      setSuccessMsg(
        isRejected
          ? isEs
            ? "¡Comprobante actualizado! Nuestro equipo verificará los fondos en breve."
            : "Receipt updated! Our team will verify your funds shortly."
          : t.orderPaymentSuccessMsg ||
            (isEs
              ? "¡Comprobante recibido! Tu orden ha pasado a Confirmación de Pago."
              : "Receipt received! Your order is now in Payment Confirmation.")
      );
      await onPaymentCompleted();
      setTimeout(() => {
        setFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setSuccessMsg(null);
        onClose();
      }, 2200);
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          (isEs
            ? "Ocurrió un error al procesar tu pago."
            : "An error occurred while processing your payment.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/65 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!submitting) onClose();
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full sm:max-w-xl max-h-[92dvh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Mobile grab handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0 bg-white">
          <span className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Sticky Modal Header */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-white flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[11px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  isRejected
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-[#EBF3FC] text-[#0052CC] border-[#C2DBFE]"
                }`}
              >
                #{order.orderNumber}
              </span>
              <span className="text-xs font-mono font-black text-slate-900">
                {formatAmount(payableTodayCRC)}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#0A2540] mt-1 leading-tight">
              {isRejected
                ? t.orderPayModalFixTitle || (isEs ? "Actualizar Comprobante de Pago" : "Update Payment Proof")
                : t.orderPayModalTitle || (isEs ? "Pagar Orden / Cotización" : "Pay Order / Quotation")}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              {isRejected
                ? t.orderPayModalFixSubtitle ||
                  (isEs
                    ? "Verifica los datos bancarios y adjunta tu nuevo comprobante."
                    : "Verify the bank details and attach your new receipt.")
                : isEs
                ? "Transfiere a una cuenta oficial y adjunta tu comprobante para confirmar tu pedido."
                : "Transfer to an official account and upload your receipt to confirm your order."}
            </p>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            aria-label={isEs ? "Cerrar" : "Close"}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center shrink-0 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        {successMsg ? (
          <div className="p-8 text-center space-y-3 overflow-y-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-emerald-950">{successMsg}</h3>
            <p className="text-xs text-slate-500">
              {isEs
                ? "Actualizando el estado de tu pedido..."
                : "Updating your order status..."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 space-y-4">
              {/* Rejection notice banner if fixing a rejected proof */}
              {isRejected && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      {isEs ? "Actualización de Comprobante Requerida" : "Receipt Update Required"}
                    </span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    {order.paymentRejectionReason
                      ? isEs
                        ? `Motivo: ${order.paymentRejectionReason}`
                        : `Reason: ${order.paymentRejectionReason}`
                      : isEs
                      ? "Por favor sube una foto o captura clara de tu transferencia bancaria."
                      : "Please attach a clear screenshot or photo of your bank wire transfer."}
                  </p>
                </div>
              )}

              {/* 1. Currency Selector */}
              {!isCurrencyBonded && !isRejected && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <label className="font-extrabold uppercase tracking-wider text-slate-700">
                      {t.orderPayModalCurrencyLabel ||
                        (isEs ? "1. Moneda de la transferencia" : "1. Transfer currency")}
                    </label>
                    <span className="font-mono text-[10px] text-slate-500">
                      TC: ₡{activeSellRate.toFixed(2)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayCurrency("CRC")}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        payCurrency === "CRC"
                          ? "border-[#0052CC] bg-[#EBF3FC] text-[#0052CC] ring-2 ring-[#0052CC]/15"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="font-extrabold">₡ CRC</span>
                      <span className="font-mono text-xs font-black">
                        {formatCRC(payableTodayCRC)}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayCurrency("USD")}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                        payCurrency === "USD"
                          ? "border-[#0052CC] bg-[#EBF3FC] text-[#0052CC] ring-2 ring-[#0052CC]/15"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="font-extrabold">$ USD</span>
                      <span className="font-mono text-xs font-black">
                        {formatUSD(payableTodayUSD)}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Optional 70/30 Split Payment Option on Unpaid Quotations */}
              {!isRejected && !existingSplit && (
                <PaymentPlanSelector
                  totalCRC={fullOrderTotalCRC}
                  paymentPlan={paymentPlan}
                  onChange={setPaymentPlan}
                  formatPrice={formatAmount}
                  compact
                />
              )}

              {/* 2. CRITICAL: Official Bank Accounts (IBAN, Titular, Cédula, Exact Amount to Copy) */}
              <div className="rounded-2xl border border-[#C2DBFE] bg-[#F5F9FF] p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#0052CC] text-white flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-extrabold text-[#0A2540] leading-tight">
                        {isEs
                          ? "Cuentas Bancarias Oficiales (IBAN)"
                          : "Official Bank Accounts (IBAN)"}
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        {isEs
                          ? "Solo transferencia bancaria • No SINPE Móvil"
                          : "Bank wire transfer only • No SINPE Móvil"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    {isEs ? "Verificadas" : "Verified"}
                  </span>
                </div>

                {/* Exact Amount to Transfer + One-Click Copy */}
                <div className="p-3 rounded-xl bg-white border border-[#C2DBFE] flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {effectivePlan === "SPLIT_70_30"
                        ? isEs
                          ? "Monto exacto a transferir hoy (70%):"
                          : "Exact amount to transfer today (70%):"
                        : isEs
                        ? "Monto exacto a transferir:"
                        : "Exact amount to transfer:"}
                    </div>
                    <div className="text-lg font-black font-mono text-[#0052CC] leading-tight">
                      {formatAmount(payableTodayCRC)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const raw =
                        payCurrency === "USD"
                          ? payableTodayUSD.toFixed(2)
                          : Math.round(payableTodayCRC).toString();
                      handleCopy(raw, "modal-exact-amount");
                    }}
                    className={`px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer ${
                      copiedId === "modal-exact-amount"
                        ? "bg-emerald-600 text-white"
                        : "bg-[#0052CC] hover:bg-[#0040A8] text-white shadow-xs"
                    }`}
                  >
                    {copiedId === "modal-exact-amount" ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{isEs ? "Copiado" : "Copied"}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{isEs ? "Copiar monto" : "Copy amount"}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Dynamic Official Bank Accounts List */}
                {loadingAccounts ? (
                  <div className="space-y-2.5">
                    <Skeleton className="h-28 w-full rounded-xl bg-white" />
                  </div>
                ) : filteredAccounts.length > 0 ? (
                  <div className="space-y-2.5">
                    {filteredAccounts.map((acc, idx) => {
                      const accKey = acc.id || `modal-acc-${idx}`;
                      const ibanVal = acc.iban || acc.accountNumber || "";
                      const holderName =
                        acc.accountHolder ||
                        COMPANY_CONFIG.legalName ||
                        "ZxZ Mods Costa Rica S.A.";
                      const cedulaVal =
                        acc.idCard || COMPANY_CONFIG.cedulaJuridica || "3-101-436132";
                      const isIbanCopied = copiedId === `${accKey}-iban`;
                      const isIdCopied = copiedId === `${accKey}-id`;

                      return (
                        <div
                          key={accKey}
                          className="p-3 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-[#0A2540]">
                              {acc.bankName}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {payCurrency === "USD" ? "$ USD" : "₡ CRC"}
                            </span>
                          </div>

                          {/* IBAN Row */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              {isEs ? "Cuenta IBAN" : "IBAN Account"}
                            </span>
                            <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2">
                              <span className="font-mono text-[11px] sm:text-xs font-black text-slate-900 break-all select-all">
                                {formatIbanDisplay(ibanVal)}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(ibanVal.replace(/\s+/g, ""), `${accKey}-iban`)
                                }
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 transition cursor-pointer ${
                                  isIbanCopied
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-900 hover:bg-slate-800 text-white"
                                }`}
                              >
                                {isIbanCopied ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span>
                                  {isIbanCopied
                                    ? isEs
                                      ? "Copiado"
                                      : "Copied"
                                    : isEs
                                    ? "Copiar IBAN"
                                    : "Copy IBAN"}
                                </span>
                              </button>
                            </div>
                          </div>

                          {/* Account Holder & Cédula Jurídica */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
                            <div className="bg-slate-50/80 rounded-lg px-2.5 py-1.5 border border-slate-100">
                              <span className="text-[9.5px] font-bold uppercase text-slate-400 block">
                                {isEs ? "Titular" : "Account Holder"}
                              </span>
                              <span className="font-bold text-slate-800 block truncate">
                                {holderName}
                              </span>
                            </div>
                            <div className="bg-slate-50/80 rounded-lg px-2.5 py-1.5 border border-slate-100 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <span className="text-[9.5px] font-bold uppercase text-slate-400 block">
                                  {isEs ? "Cédula Jurídica" : "Corporate ID"}
                                </span>
                                <span className="font-mono font-bold text-slate-800 block truncate">
                                  {cedulaVal}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy(cedulaVal, `${accKey}-id`)}
                                className={`px-2 py-1 rounded-md text-[10px] font-bold shrink-0 transition cursor-pointer ${
                                  isIdCopied
                                    ? "bg-emerald-600 text-white"
                                    : "bg-white hover:bg-slate-200 text-slate-700 border border-slate-200"
                                }`}
                              >
                                {isIdCopied
                                  ? isEs
                                    ? "✓"
                                    : "✓"
                                  : isEs
                                  ? "Copiar"
                                  : "Copy"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-white border border-dashed border-slate-300 text-[11px] text-slate-600 text-center">
                    {isEs
                      ? "No hay cuentas configuradas en esta moneda. Cambia a Colones/Dólares arriba o contáctanos por WhatsApp."
                      : "No bank accounts configured for this currency. Switch currency above or contact us on WhatsApp."}
                  </div>
                )}
              </div>

              {/* 3. Upload Proof of Payment Dropzone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-800">
                  {isEs
                    ? "Comprobante de Pago (Foto / Captura / PDF)"
                    : "Payment Proof (Photo / Screenshot / PDF)"}{" "}
                  <span className="text-[#0052CC]">*</span>
                </label>

                <label
                  className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    file
                      ? "border-emerald-500 bg-emerald-50/40"
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
                    <div className="flex items-center gap-3 w-full text-left">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Comprobante"
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                          <FileText className="w-7 h-7 text-rose-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <FileImage className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{file.name}</span>
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          {(file.size / 1024).toFixed(1)} KB •{" "}
                          {isEs ? "Listo (toca para cambiar)" : "Ready (tap to change)"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearFile}
                        className="w-8 h-8 rounded-full bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 flex items-center justify-center shrink-0 cursor-pointer"
                        aria-label={isEs ? "Quitar archivo" : "Remove file"}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-1.5 space-y-1">
                      <div className="w-11 h-11 rounded-2xl bg-[#EBF3FC] text-[#0052CC] flex items-center justify-center mx-auto">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">
                        {isEs
                          ? "Toca aquí para adjuntar tu comprobante"
                          : "Tap here to attach your receipt"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        JPG, PNG, WEBP, PDF ({isEs ? "Máx 100MB" : "Max 100MB"})
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {/* 4. Contact Phone & Optional Reference / Notes */}
              {!isRejected && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-[#0052CC]" />
                        <span>
                          {isEs ? "Teléfono / WhatsApp" : "Phone / WhatsApp"}{" "}
                          <span className="text-[#0052CC]">*</span>
                        </span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+506 8888-8888"
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:border-[#0052CC] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isEs
                          ? "N.º de Referencia (opcional)"
                          : "Reference Number (optional)"}
                      </label>
                      <input
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder={isEs ? "Ej: 123456789" : "e.g. 123456789"}
                        className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:bg-white focus:border-[#0052CC] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isEs ? "Notas adicionales (opcional)" : "Additional notes (optional)"}
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={
                        isEs ? "Detalles sobre el pago o entrega..." : "Payment or delivery notes..."
                      }
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-[#0052CC] outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Validation Error */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Sticky Bottom Action Bar (iOS Safe-Area friendly) */}
            <div className="px-5 py-3.5 sm:px-6 pb-[max(0.875rem,env(safe-area-inset-bottom))] border-t border-slate-100 bg-white flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                disabled={submitting}
                onClick={onClose}
                className="px-4 py-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                {isEs ? "Cancelar" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={submitting || !file || (!isRejected && !phone.trim())}
                className={`flex-1 py-3 px-4 rounded-xl text-white text-xs font-extrabold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md ${
                  isRejected
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                    : "bg-[#0052CC] hover:bg-[#0040A8] shadow-[#0052CC]/25"
                }`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isEs ? "Enviando..." : "Submitting..."}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      {isRejected
                        ? isEs
                          ? "Enviar Comprobante Corregido"
                          : "Submit Corrected Receipt"
                        : `${isEs ? "Confirmar Pago" : "Confirm Payment"} • ${formatAmount(
                            payableTodayCRC
                          )}`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
