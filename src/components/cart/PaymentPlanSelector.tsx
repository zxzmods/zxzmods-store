"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  PaymentPlanType,
  computeSplitPaymentAmounts,
  isEligibleForSplitPayment,
} from "@/lib/splitPayment";
import { CheckCircle2, CreditCard, ShieldCheck, Split } from "lucide-react";

interface PaymentPlanSelectorProps {
  totalCRC: number;
  paymentPlan: PaymentPlanType;
  onChange: (plan: PaymentPlanType) => void;
  formatPrice: (crc: number) => string;
  compact?: boolean;
}

export function PaymentPlanSelector({
  totalCRC,
  paymentPlan,
  onChange,
  formatPrice,
  compact = false,
}: PaymentPlanSelectorProps) {
  const { t, lang } = useLanguage();
  const isSplitEligible = isEligibleForSplitPayment(totalCRC);
  const effectivePlan: PaymentPlanType =
    paymentPlan === "SPLIT_70_30" && isSplitEligible ? "SPLIT_70_30" : "FULL_100";
  const { initial70AmountCRC, remaining30AmountCRC } = computeSplitPaymentAmounts(totalCRC);

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-slate-50/80 ${
        compact ? "p-3 space-y-2" : "p-4 space-y-3"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-[#0052CC]" />
          <span>{t.paymentPlanSectionTitle}</span>
        </span>
        <span className="text-[10px] font-bold text-[#0052CC] bg-[#EBF3FC] border border-[#C2DBFE] px-2 py-0.5 rounded-full">
          {effectivePlan === "SPLIT_70_30" ? "70% / 30%" : "100%"}
        </span>
      </div>

      <div className={`grid grid-cols-1 ${compact ? "gap-2" : "gap-2.5"}`}>
        {/* Option 1: 100% Full Payment (Default) */}
        <button
          type="button"
          onClick={() => onChange("FULL_100")}
          className={`w-full text-left rounded-xl border transition-all cursor-pointer ${
            compact ? "p-2.5" : "p-3"
          } ${
            effectivePlan === "FULL_100"
              ? "bg-white border-[#0052CC] ring-2 ring-[#0052CC]/15 shadow-xs"
              : "bg-white/70 border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 min-w-0">
              <div
                className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  effectivePlan === "FULL_100"
                    ? "border-[#0052CC] bg-[#0052CC]"
                    : "border-slate-300 bg-white"
                }`}
              >
                {effectivePlan === "FULL_100" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-slate-900">
                  {t.paymentPlanFullTitle}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                  {t.paymentPlanFullDesc}
                </p>
              </div>
            </div>
            <span className="text-xs font-black font-mono text-slate-900 shrink-0">
              {formatPrice(totalCRC)}
            </span>
          </div>
        </button>

        {/* Option 2: 70% Upfront / 30% Remaining Balance (Requires >= ₡80,000 in products) */}
        <button
          type="button"
          disabled={!isSplitEligible}
          onClick={() => {
            if (isSplitEligible) onChange("SPLIT_70_30");
          }}
          className={`w-full text-left rounded-xl border transition-all ${
            compact ? "p-2.5" : "p-3"
          } ${
            !isSplitEligible
              ? "bg-slate-100/80 border-slate-200 opacity-60 cursor-not-allowed"
              : effectivePlan === "SPLIT_70_30"
              ? "bg-gradient-to-br from-[#EBF3FC]/90 via-white to-emerald-50/40 border-[#0052CC] ring-2 ring-[#0052CC]/15 shadow-xs cursor-pointer"
              : "bg-white/70 border-slate-200 hover:border-[#0052CC]/50 cursor-pointer"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 min-w-0">
              <div
                className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  effectivePlan === "SPLIT_70_30"
                    ? "border-[#0052CC] bg-[#0052CC]"
                    : "border-slate-300 bg-white"
                }`}
              >
                {effectivePlan === "SPLIT_70_30" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-xs font-extrabold ${isSplitEligible ? "text-slate-900" : "text-slate-500"}`}>
                    {t.paymentPlanSplitTitle}
                  </span>
                  {isSplitEligible && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <Split className="w-2.5 h-2.5" />
                      {t.paymentPlanSplitBadge}
                    </span>
                  )}
                </div>
                {isSplitEligible ? (
                  <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
                    {t.paymentPlanSplitDesc}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    {t.paymentPlanSplitMinNotice}
                  </p>
                )}
              </div>
            </div>
            {isSplitEligible && (
              <div className="text-right shrink-0">
                <span className="text-xs font-black font-mono text-[#0052CC] block">
                  {formatPrice(initial70AmountCRC)}
                </span>
                <span className="text-[9.5px] font-semibold text-slate-500 block">
                  {lang === "es" ? "hoy (70%)" : "today (70%)"}
                </span>
              </div>
            )}
          </div>

          {isSplitEligible && effectivePlan === "SPLIT_70_30" && (
            <div className="mt-2.5 pt-2.5 border-t border-[#C2DBFE]/80 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-[#0A2540]">
                <span className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0052CC]" />
                  {t.paymentPlanPayTodayLabel}
                </span>
                <span className="font-mono font-black text-[#0052CC]">
                  {formatPrice(initial70AmountCRC)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {t.paymentPlanRemaining30Label}
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {formatPrice(remaining30AmountCRC)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-snug pt-0.5">
                {t.paymentPlanRemaining30DueHint}
              </p>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
