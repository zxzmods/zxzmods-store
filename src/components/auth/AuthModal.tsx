"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  X,
  User,
  Mail,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Car,
  ShoppingCart,
  FileText,
  ExternalLink,
} from "lucide-react";
import { OFFICIAL_LEGAL_DOCS } from "@/types/document";

export function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    loginWithGoogle,
    sendEmailCode,
    verifyEmailCode,
    authPromptReason,
    openTermsModal,
    openDocumentModal,
  } = useAuth();
  const { t, lang } = useLanguage();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  if (!isAuthModalOpen) return null;

  const validateTerms = (): boolean => {
    if (!termsAccepted) {
      setError(
        lang === "es"
          ? "Debes leer y aceptar la totalidad de los 8 Documentos Legales y Pólizas Oficiales para continuar."
          : "You must read and accept all 8 Official Legal Documents and Policies to continue."
      );
      return false;
    }
    return true;
  };

  const handleGoogleLogin = async () => {
    if (!validateTerms()) return;
    setError(null);
    setLoading(true);
    const result = await loginWithGoogle();
    setLoading(false);
    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTerms()) return;
    if (!fullName || fullName.trim().length < 2) {
      setError(t.authFullNameRequired);
      return;
    }
    if (!email || !email.includes("@")) {
      setError(lang === "es" ? "Por favor ingresa un correo electrónico válido" : "Please enter a valid email address");
      return;
    }

    setError(null);
    setLoading(true);
    const result = await sendEmailCode(email);
    setLoading(false);

    if (result.success) {
      setStep("code");
      if (result.devCode) {
        setDevCodeHint(result.devCode);
        setCode(result.devCode); // Pre-fill for instant frictionless testing
      }
    } else {
      setError(result.error || "No se pudo enviar el código");
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTerms()) return;
    if (!code || code.trim().length < 6) {
      setError(lang === "es" ? "Ingresa el código de 6 dígitos" : "Enter the 6-digit code");
      return;
    }

    setError(null);
    setLoading(true);
    const result = await verifyEmailCode(email, code.trim(), fullName.trim());
    setLoading(false);

    if (!result.success) {
      setError(result.error || t.authInvalidCode);
    }
  };

  const handleReset = () => {
    setStep("email");
    setCode("");
    setError(null);
    setDevCodeHint(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuthModal}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-10 max-h-[92vh] flex flex-col"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#C02030]/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#C02030]" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">{t.authModalTitle}</h3>
                <p className="text-xs text-gray-500">{t.authModalSubtitle}</p>
              </div>
            </div>
            <button
              onClick={closeAuthModal}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Gating Reason Callout Banner (when triggered by garage or cart) */}
            {authPromptReason && (
              <div className="p-3 rounded-xl bg-red-50/80 border border-red-200/80 flex items-start gap-2.5 text-xs text-red-900 animate-fade-in">
                <Lock className="w-4 h-4 text-[#C02030] flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-[#C02030] block">
                    {t.authPromptReasonTitle}
                  </span>
                  <span className="leading-relaxed text-gray-700">{authPromptReason}</span>
                </div>
              </div>
            )}

            {/* Error Message Alert */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Social Logins Group */}
            <div className="space-y-2.5">
              {/* Option 1: Google Sign-In */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-800 text-xs sm:text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
              >
                {/* Official Google Icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{t.authGoogleButton}</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center pt-1 pb-1">
              <div className="border-t border-gray-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider absolute">
                {t.authOrDivider}
              </span>
            </div>

            {/* Option 3: Email Verification Code Flow */}
            {step === "email" ? (
              <form onSubmit={handleSendCode} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    {t.authFullNameLabel}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t.authFullNamePlaceholder}
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 focus:border-[#C02030] focus:ring-2 focus:ring-[#C02030]/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    {t.profileEmail}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.authEmailPlaceholder}
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 focus:border-[#C02030] focus:ring-2 focus:ring-[#C02030]/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#C02030] hover:bg-[#A01B28] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{t.authSendCodeButton}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-700">
                      {t.authEnterCode} <strong className="text-gray-900">{email}</strong>
                    </label>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-[11px] text-[#C02030] hover:underline"
                    >
                      {t.authChangeEmail}
                    </button>
                  </div>

                  <div className="mb-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px] flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>
                        {lang === "es" ? "Código de prueba y acceso:" : "Test & access code:"}{" "}
                        <strong className="font-mono text-xs text-emerald-950 font-bold">{devCodeHint || "616161"}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCode(devCodeHint || "616161")}
                      className="text-[10px] uppercase font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded transition"
                    >
                      {lang === "es" ? "Aplicar" : "Apply"}
                    </button>
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="616161"
                    required
                    className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 rounded-xl border border-gray-300 focus:border-[#C02030] focus:ring-2 focus:ring-[#C02030]/20 outline-none transition-all"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#C02030] hover:bg-[#A01B28] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{t.authVerifyButton}</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={loading}
                    className="text-xs text-gray-500 hover:text-gray-800 underline"
                  >
                    {t.authResendCode}
                  </button>
                </div>
              </form>
            )}

            {/* Mandatory Agreement to All 8 Official Legal Documents */}
            <div className="pt-3 border-t border-gray-100 space-y-2.5">
              <div
                className={`p-3 rounded-2xl border transition-all ${
                  termsAccepted
                    ? "bg-slate-50 border-gray-200"
                    : "bg-red-50/40 border-red-200/80"
                }`}
              >
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-[#C02030] focus:ring-[#C02030] w-4 h-4 cursor-pointer"
                  />
                  <div className="text-[11px] text-gray-700 leading-tight space-y-1">
                    <span className="font-bold text-gray-900 block leading-snug">
                      {lang === "es"
                        ? "Acepto los 8 Documentos Legales y Pólizas Oficiales de ZxZ Mods Costa Rica S.A."
                        : "I accept all 8 Official Legal Documents and Policies of ZxZ Mods Costa Rica S.A."}
                    </span>
                    <span className="text-gray-500 text-[10px] block leading-relaxed">
                      {lang === "es"
                        ? "Incluye Términos de Venta, Pagos Bancarios (sin SINPE), Póliza de Cero Devoluciones (solo fallos de fábrica) y Privacidad Ley 8968."
                        : "Includes Terms of Sale, Bank Payments (no SINPE), Zero Returns Policy (factory defects only), and Data Privacy."}
                    </span>
                  </div>
                </label>

                {/* Quick Interactive Chips for all 8 Documents */}
                <div className="pt-2 mt-2 border-t border-gray-200/60 space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    {lang === "es"
                      ? "Ver documentos oficiales (clic para leer):"
                      : "View official documents (click to read):"}
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {OFFICIAL_LEGAL_DOCS.map((d) => (
                      <button
                        key={d.slug}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          openDocumentModal(d.slug);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white border border-gray-200 hover:border-[#C02030] text-[#C02030] hover:text-[#901824] text-[10px] font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <span>{lang === "es" ? d.titleEs : d.titleEn}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
