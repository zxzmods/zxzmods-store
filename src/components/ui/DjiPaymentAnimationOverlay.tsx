"use client";

import React, { useEffect, useState } from "react";
import { UploadCloud, Wrench, CheckCircle2 } from "lucide-react";

interface DjiPaymentAnimationOverlayProps {
  isOpen: boolean;
  step?: number; // 1 | 2 | 3
  title?: string;
  subtitle?: string;
  onAnimationComplete?: () => void;
  lang?: "es" | "en";
}

export function DjiPaymentAnimationOverlay({
  isOpen,
  step: propStep,
  title,
  subtitle,
  onAnimationComplete,
  lang = "es",
}: DjiPaymentAnimationOverlayProps) {
  const [internalStep, setInternalStep] = useState(1);
  const currentStep = propStep !== undefined ? propStep : internalStep;

  // Auto-progress internal step if not controlled externally
  useEffect(() => {
    if (!isOpen || propStep !== undefined) return;

    setInternalStep(1);
    const t1 = setTimeout(() => setInternalStep(2), 1100);
    const t2 = setTimeout(() => setInternalStep(3), 2200);
    const t3 = setTimeout(() => {
      if (onAnimationComplete) onAnimationComplete();
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isOpen, propStep, onAnimationComplete]);

  // Trigger completion callback when controlled externally and step reaches 3
  useEffect(() => {
    if (!isOpen || propStep === undefined || propStep < 3 || !onAnimationComplete) return;

    const timer = setTimeout(() => {
      onAnimationComplete();
    }, 2200);

    return () => clearTimeout(timer);
  }, [isOpen, propStep, onAnimationComplete]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 select-none"
    >
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl space-y-5 animate-in zoom-in-95 duration-300">
        {/* Animated Center Graphic */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#EBF3FC] animate-ping opacity-60" />
          <div className="w-20 h-20 rounded-full bg-[#0052CC] text-white flex items-center justify-center shadow-xl relative z-10 shadow-[#0052CC]/30">
            {currentStep === 1 && (
              <UploadCloud className="w-10 h-10 text-white animate-bounce" />
            )}
            {currentStep === 2 && (
              <Wrench className="w-10 h-10 text-white animate-spin" />
            )}
            {currentStep >= 3 && (
              <CheckCircle2 className="w-10 h-10 text-emerald-300 animate-scale" />
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-black text-[#0A2540] tracking-tight">
            {title ||
              (currentStep === 1 &&
                (lang === "es"
                  ? "Subiendo Comprobante..."
                  : "Uploading Receipt...")) ||
              (currentStep === 2 &&
                (lang === "es"
                  ? "Registrando tu Orden..."
                  : "Registering Order...")) ||
              (lang === "es"
                ? "¡Pago en Confirmación!"
                : "Payment in Confirmation!")}
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {subtitle ||
              (currentStep < 3
                ? lang === "es"
                  ? "Estamos enlazando tu transferencia bancaria con el sistema ZxZ Mods..."
                  : "Linking your bank transfer with the ZxZ Mods system..."
                : lang === "es"
                ? "Tu pago ha sido registrado con éxito. Redirigiendo a tu seguimiento en vivo..."
                : "Payment registered successfully. Redirecting to live tracking...")}
          </p>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentStep >= 1 ? "w-8 bg-[#0052CC]" : "w-2 bg-slate-200"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentStep >= 2 ? "w-8 bg-[#0052CC]" : "w-2 bg-slate-200"
            }`}
          />
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentStep >= 3 ? "w-8 bg-emerald-500" : "w-2 bg-slate-200"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
