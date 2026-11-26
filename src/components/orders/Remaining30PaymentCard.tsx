"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { formatCRC, formatUSD, convertCRCToUSD } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/Skeleton";
import { uploadPaymentProof } from "@/lib/clientPaymentUpload";
import {
  SplitPaymentData,
  canPayRemaining30,
  isRemaining30PendingReview,
} from "@/lib/splitPayment";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  FileText,
  Loader2,
  Lock,
  Receipt,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import Link from "next/link";

interface Remaining30PaymentCardProps {
  order: any;
  splitPayment: SplitPaymentData;
  sellRate: number;
  claimToken?: string | null;
  onPaymentSubmitted: (updatedOrder: any) => void;
  onPreviewProof: (url: string) => void;
}

function formatIbanDisplay(iban: string): string {
  if (!iban) return "";
  const clean = iban.replace(/\s+/g, "");
  return clean.match(/.{1,4}/g)?.join(" ") || clean;
}

export function Remaining30PaymentCard({
  order,
  splitPayment,
  sellRate,
  claimToken,
  onPaymentSubmitted,
  onPreviewProof,
}: Remaining30PaymentCardProps) {
  const { t, lang } = useLanguage();
  const isEs = lang === "es";

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [payCurrency, setPayCurrency] = useState<"CRC" | "USD">(
    String(order?.paidCurrency || "CRC").toUpperCase() === "USD" ? "USD" : "CRC"
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isConfirmed = Boolean(splitPayment.remaining30Confirmed);
  const isInReview = isRemaining30PendingReview(order);
  const isUnlocked = canPayRemaining30(order);
  const isRejected30 = Boolean(
    splitPayment.remaining30Rejected ||
      (String(order?.status || "").toUpperCase() === "PAYMENT_REJECTED" &&
        (() => {
          try {
            const d =
              typeof order.serviceDocumentsJson === "string"
                ? JSON.parse(order.serviceDocumentsJson)
                : order.serviceDocumentsJson;
            return d?.rejectionPaymentType === "REMAINING_30";
          } catch {
            return false;
          }
        })())
  );

  const remainingCRC = splitPayment.remaining30AmountCRC;
  const remainingUSD = convertCRCToUSD(remainingCRC, sellRate || 455.21);

  const formatAmount = (crc: number) =>
    payCurrency === "USD"
      ? formatUSD(convertCRCToUSD(crc, sellRate || 455.21))
      : formatCRC(crc);

  useEffect(() => {
    if (!isUnlocked || isConfirmed || isInReview) return;
    let mounted = true;
    setLoadingAccounts(true);
    fetch("/api/payment/accounts")
      .then((res) => res.json())
      .then((data) => {
        if (mounted && data.success && Array.isArray(data.accounts)) {
          setAccounts(data.accounts);
        }
      })
      .catch((err) => console.error("Error fetching bank accounts for 30% payment:", err))
      .finally(() => {
        if (mounted) setLoadingAccounts(false);
      });
    return () => {
      mounted = false;
    };
  }, [isUnlocked, isConfirmed, isInReview]);

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
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2200);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setFile(selected);
    setErrorMsg(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (selected.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(selected));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit30 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg(
        isEs
          ? "Debes adjuntar el comprobante bancario del 30% restante."
          : "Please attach your 30% remaining balance bank transfer proof."
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Upload proof #2
      const upData = await uploadPaymentProof(file, isEs ? "es" : "en");
      if (!upData.success || !upData.url) {
        throw new Error(
          upData.error ||
            (isEs ? "Error al subir el comprobante del 30%" : "Failed to upload 30% proof")
        );
      }

      // 2. Register 30% balance payment on order
      const payRes = await fetch(`/api/orders/${order.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentPhase: "REMAINING_30",
          paymentMethod: "BANK_TRANSFER",
          paidCurrency: payCurrency,
          referenceNumber: referenceNumber.trim(),
          paymentProofUrl: upData.url,
          claimToken: claimToken || undefined,
        }),
      });
      const payData = await payRes.json();
      if (!payRes.ok || !payData.success || !payData.order) {
        throw new Error(
          payData.error ||
            (isEs ? "Error al registrar el pago del 30%" : "Failed to register 30% payment")
        );
      }

      setSuccessMsg(t.paymentPlanPay30SuccessMsg);
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      setReferenceNumber("");
      onPaymentSubmitted(payData.order);
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          (isEs
            ? "Ocurrió un error al enviar tu comprobante del 30%."
            : "An error occurred submitting your 30% payment proof.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  // STATE 1: 30% Balance Confirmed -> Paid in Full
  if (isConfirmed) {
    return (
      <div className="bg-emerald-50/80 border-2 border-emerald-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 mb-1">
                {isEs ? "PLAN 70% / 30% • 100% CANCELADO" : "70% / 30% PLAN • 100% PAID"}
              </span>
              <h3 className="text-base font-black text-emerald-950">
                {t.paymentPlanBalance30PaidLabel}
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                {isEs
                  ? `Adelanto 70% (${formatCRC(splitPayment.initial70AmountCRC)}) + Saldo 30% (${formatCRC(splitPayment.remaining30AmountCRC)}) verificados. Saldo pendiente: ₡0.`
                  : `70% deposit (${formatCRC(splitPayment.initial70AmountCRC)}) + 30% balance (${formatCRC(splitPayment.remaining30AmountCRC)}) verified. Remaining balance: ₡0.`}
              </p>
            </div>
          </div>

          <Link
            href={`/pedidos/${order.id}/comprobante?type=REMAINING_30`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>{isEs ? "Ver Recibo Final 30%" : "View Final 30% Receipt"}</span>
          </Link>
        </div>
      </div>
    );
  }

  // STATE 2: 30% Proof Uploaded & Under Review (and not rejected)
  if (isInReview && splitPayment.remaining30ProofUrl) {
    return (
      <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 mb-1">
                {isEs ? "COMPROBANTE #2 EN REVISIÓN" : "PROOF #2 UNDER REVIEW"}
              </span>
              <h3 className="text-base font-black text-amber-950">
                {t.paymentPlanPay30InReviewTitle}
              </h3>
              <p className="text-xs text-amber-900/90 mt-1 leading-relaxed max-w-2xl">
                {t.paymentPlanPay30InReviewDesc}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-bold uppercase text-amber-800">
              {t.paymentPlanRemaining30Label}
            </div>
            <div className="text-lg font-black font-mono text-amber-950">
              {formatCRC(remainingCRC)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-amber-200/80 flex-wrap">
          <button
            type="button"
            onClick={() => onPreviewProof(splitPayment.remaining30ProofUrl!)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isEs ? "Inspeccionar Comprobante del 30%" : "Inspect 30% Receipt"}</span>
          </button>
          <a
            href={splitPayment.remaining30ProofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{isEs ? "Abrir archivo original" : "Open original file"}</span>
          </a>
        </div>
      </div>
    );
  }

  // STATE 3: Locked until ZxZ Check Certificate is issued
  if (!isUnlocked) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-2xs flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-200/80 text-slate-600 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBF3FC] text-[#0052CC] border border-[#C2DBFE] mb-1">
              {isEs ? "PLAN 70% / 30% ACTIVO" : "70% / 30% PLAN ACTIVE"}
            </span>
            <h3 className="text-sm font-black text-slate-900">
              {t.paymentPlanStageTitle} — {formatCRC(remainingCRC)}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed max-w-2xl">
              {t.paymentPlanPay30LockedDesc}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // STATE 4: Unlocked (Check Certificate issued / REMAINING_30_PAYMENT stage / Rejected 30% retry)
  return (
    <div className="bg-white border-2 border-amber-400 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-amber-100">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                {isEs ? "ETAPA ACTIVA • SALDO 30%" : "ACTIVE STAGE • 30% BALANCE"}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3" />
                {isEs ? "Certificado ZxZ Emitido" : "ZxZ Certificate Issued"}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#0A2540]">
              {t.paymentPlanPay30CardTitle}
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-2xl">
              {t.paymentPlanPay30CardDesc}
            </p>
          </div>
        </div>

        {/* Currency switcher & exact 30% amount */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center rounded-xl bg-slate-100 p-1 text-[11px] font-bold border border-slate-200">
            <button
              type="button"
              onClick={() => setPayCurrency("CRC")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                payCurrency === "CRC"
                  ? "bg-[#0052CC] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ₡ CRC
            </button>
            <button
              type="button"
              onClick={() => setPayCurrency("USD")}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                payCurrency === "USD"
                  ? "bg-[#0052CC] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              $ USD
            </button>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase text-slate-500">
              {t.paymentPlanRemaining30Label}
            </div>
            <div className="text-2xl font-black font-mono text-[#0052CC]">
              {formatAmount(remainingCRC)}
            </div>
            <div className="text-[10px] font-mono text-slate-500">
              {payCurrency === "USD"
                ? `≈ ${formatCRC(remainingCRC)}`
                : `≈ ${formatUSD(remainingUSD)} USD`}
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Notice if 30% was rejected */}
      {isRejected30 && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-extrabold">
              {isEs
                ? "Tu comprobante del 30% fue rechazado — Sube uno nuevo"
                : "Your 30% balance proof was rejected — Please re-upload"}
            </div>
            {(splitPayment.remaining30RejectionReason || order.paymentRejectionReason) && (
              <p className="text-[11px] mt-0.5 text-rose-800">
                {splitPayment.remaining30RejectionReason || order.paymentRejectionReason}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Official Bank Accounts */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#0052CC]" />
            <span>
              {isEs
                ? "1. Transfiere el 30% a una Cuenta Oficial (IBAN)"
                : "1. Transfer the 30% Balance to an Official Account (IBAN)"}
            </span>
          </h4>
          <button
            type="button"
            onClick={() => {
              const raw =
                payCurrency === "USD"
                  ? remainingUSD.toFixed(2)
                  : Math.round(remainingCRC).toString();
              handleCopy(raw, "rem30-amount");
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
              copiedId === "rem30-amount"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            {copiedId === "rem30-amount" ? (
              <>
                <Check className="w-3 h-3" />
                <span>{isEs ? "Monto copiado" : "Amount copied"}</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>{isEs ? "Copiar monto 30%" : "Copy 30% amount"}</span>
              </>
            )}
          </button>
        </div>

        {loadingAccounts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton className="h-24 w-full rounded-2xl bg-slate-100" />
            <Skeleton className="h-24 w-full rounded-2xl bg-slate-100" />
          </div>
        ) : filteredAccounts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredAccounts.map((acc, idx) => {
              const accKey = acc.id || `acc-${idx}`;
              const ibanVal = acc.iban || acc.accountNumber || "";
              const isCopied = copiedId === `${accKey}-iban`;
              return (
                <div
                  key={accKey}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-[#0A2540]">
                      {acc.bankName}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[#0052CC]">
                      {payCurrency}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-white border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                    <span className="font-mono text-[11px] font-bold text-slate-800 truncate">
                      {formatIbanDisplay(ibanVal)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(ibanVal.replace(/\s+/g, ""), `${accKey}-iban`)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 transition cursor-pointer ${
                        isCopied
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? (isEs ? "Copiado" : "Copied") : (isEs ? "Copiar" : "Copy")}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
            {isEs
              ? "No hay cuentas configuradas en esta moneda. Cambia de moneda arriba o contáctanos por WhatsApp."
              : "No bank accounts configured in this currency. Switch currency above or contact us on WhatsApp."}
          </div>
        )}
      </div>

      {/* Upload Proof #2 Form */}
      <form onSubmit={handleSubmit30} className="space-y-4 pt-2 border-t border-slate-100">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <UploadCloud className="w-4 h-4 text-[#0052CC]" />
          <span>
            {isEs
              ? "2. Sube el Comprobante #2 (Saldo 30% Restante)"
              : "2. Upload Proof #2 (Remaining 30% Balance)"}
          </span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          <div className="md:col-span-7">
            <label
              className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                file
                  ? "border-emerald-500 bg-emerald-50/30"
                  : "border-slate-300 hover:border-[#0052CC] bg-slate-50 hover:bg-[#EBF3FC]/40"
              }`}
            >
              <input
                type="file"
                accept="image/jpeg, image/png, image/webp, image/avif, application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              {file ? (
                <div className="flex items-center gap-3 w-full">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview 30%"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <FileText className="w-7 h-7 text-rose-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-xs font-bold text-slate-900 truncate">{file.name}</div>
                    <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      {isEs ? "Listo para enviar (clic para cambiar)" : "Ready to submit (click to change)"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFile(null);
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }}
                    className="p-1.5 rounded-full bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="py-2 space-y-1">
                  <UploadCloud className="w-7 h-7 text-[#0052CC] mx-auto" />
                  <div className="text-xs font-bold text-slate-800">
                    {isEs
                      ? "Haz clic para adjuntar la captura del pago del 30%"
                      : "Click to attach your 30% transfer screenshot"}
                  </div>
                  <div className="text-[10px] text-slate-400">JPG, PNG, WEBP, PDF</div>
                </div>
              )}
            </label>
          </div>

          <div className="md:col-span-5 space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                {isEs ? "Número de Referencia (Opcional)" : "Reference Number (Optional)"}
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder={isEs ? "Ej: 98451230" : "e.g. 98451230"}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0052CC]/20 focus:border-[#0052CC]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !file}
              className="w-full py-3 px-4 rounded-xl bg-[#0052CC] hover:bg-[#0040A8] disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-md shadow-[#0052CC]/20 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.paymentPlanPay30SubmittingBtn}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.paymentPlanPay30SubmitBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </form>
    </div>
  );
}
