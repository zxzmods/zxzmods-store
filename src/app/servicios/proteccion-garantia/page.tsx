"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { GarageModal } from "@/components/garage/GarageModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingConcierge } from "@/components/home/FloatingConcierge";
import { COMPANY_CONFIG, getWhatsAppUrl, getTelUrl } from "@/config/company";
import {
  ShieldCheck,
  ShieldAlert,
  Wrench,
  Calendar,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  MessageCircle,
  Phone,
  Sparkles,
  Zap,
  Clock,
  Car,
  ChevronDown,
} from "lucide-react";

function WarrantyProtectionSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-28 pb-16 px-4 sm:px-6 lg:px-8 animate-pulse">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="w-32 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-200 dark:bg-slate-800 h-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl bg-slate-200 dark:bg-slate-800 h-48" />
          <div className="p-6 rounded-3xl bg-slate-200 dark:bg-slate-800 h-48" />
        </div>
        <div className="p-8 rounded-3xl bg-slate-200 dark:bg-slate-800 h-80" />
      </div>
    </div>
  );
}

export default function WarrantyProtectionPage() {
  const { t, lang, companyPhone } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    // Smooth initial render without artificial delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <NotificationBanner />
        <Navbar />
        <WarrantyProtectionSkeleton />
      </main>
    );
  }

  const whatsappMessage =
    lang === "es"
      ? "Hola ZxZ Mods, deseo coordinar el Servicio de Protección de Garantía de Agencia (desinstalación temporal y reinstalación de piezas OEM) para mi vehículo."
      : "Hello ZxZ Mods, I would like to coordinate the Dealer Warranty Protection Service (temporary uninstall and OEM parts reinstallation) for my vehicle.";

  const whatsappLink = getWhatsAppUrl(whatsappMessage);

  const faqs = [
    {
      q: t.warrantyProtectionFaq1Q,
      a: t.warrantyProtectionFaq1A,
    },
    {
      q: t.warrantyProtectionFaq2Q,
      a: t.warrantyProtectionFaq2A,
    },
    {
      q: t.warrantyProtectionFaq3Q,
      a: t.warrantyProtectionFaq3A,
    },
  ];

  const steps = [
    {
      num: "01",
      title: t.warrantyProtectionStep1Title,
      desc: t.warrantyProtectionStep1Desc,
      icon: Calendar,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    },
    {
      num: "02",
      title: t.warrantyProtectionStep2Title,
      desc: t.warrantyProtectionStep2Desc,
      icon: Wrench,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    },
    {
      num: "03",
      title: t.warrantyProtectionStep3Title,
      desc: t.warrantyProtectionStep3Desc,
      icon: Zap,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    },
    {
      num: "04",
      title: t.warrantyProtectionStep4Title,
      desc: t.warrantyProtectionStep4Desc,
      icon: ShieldCheck,
      color: "text-[#C02030] bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <NotificationBanner />
      <Navbar />

      <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
        {/* Back Button */}
        <div>
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#C02030] dark:hover:text-[#FF3B47] transition group px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
            <span>{t.warrantyProtectionBackBtn}</span>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-slate-900 to-[#3b080d] p-8 sm:p-12 text-white border border-red-900/40 shadow-xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-red-600/15 blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-bold tracking-wider uppercase">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Exclusivo ZxZ Mods</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              {t.warrantyProtectionPageTitle}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              {t.warrantyProtectionPageSubtitle}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 rounded-2xl bg-[#C02030] hover:bg-[#A01825] text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition shadow-lg flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{t.warrantyProtectionContactBtn}</span>
              </a>

              <a
                href={getTelUrl(companyPhone)}
                className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition border border-white/20 flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>{companyPhone || COMPANY_CONFIG.contact.phone}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Highlight Banner: OEM Reinstallation at Labour-Only Cost */}
        <div className="p-6 sm:p-8 rounded-3xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 shrink-0">
                <Wrench className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  {lang === "es"
                    ? "Cero Costos Ocultos: Cobramos Únicamente la Mano de Obra"
                    : "Zero Hidden Costs: We Only Charge for Labor"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                  {lang === "es"
                    ? "Cuando compras accesorios de alto rendimiento en ZxZ Mods que anulan la garantía de agencia, tienes derecho al servicio de desmontaje e instalación de tus piezas originales antes de tus chequeos de agencia, pagando solo las horas de mano de obra del mecánico."
                    : "When purchasing high-performance upgrades at ZxZ Mods that void dealer warranties, you have guaranteed access to temporary removal and OEM parts reinstallation before dealer service visits, paying only technician labor hours."}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>100% Stock Garantizado</span>
              </span>
            </div>
          </div>
        </div>

        {/* 4-Step How It Works */}
        <div className="space-y-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {t.warrantyProtectionHowItWorksTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {lang === "es"
                ? "Un proceso ágil y transparente diseñado para proteger tu inversión."
                : "A seamless, transparent process designed to protect your investment."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-900 transition shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl border ${step.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-black text-slate-300 dark:text-slate-700">
                      PASO {step.num}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {step.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          <div className="text-center space-y-1 pb-2">
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#C02030]" />
              <span>{t.warrantyProtectionFaqTitle}</span>
            </h2>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="transition">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isOpen ? "rotate-180 text-[#C02030]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Final CTA Bar */}
        <div className="p-8 rounded-3xl bg-linear-to-r from-red-600 to-[#A01825] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-black">
              {lang === "es"
                ? "¿Listo para instalar tus mods sin perder la garantía?"
                : "Ready to mod your UTV without voiding dealer coverage?"}
            </h3>
            <p className="text-xs sm:text-sm text-red-100 max-w-lg">
              {lang === "es"
                ? "Contáctanos hoy mismo por WhatsApp y coordinamos tu servicio preventivo con nuestro equipo técnico certificado."
                : "Contact our certified technical team via WhatsApp today to schedule your pre-dealer service appointment."}
            </p>
          </div>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-2xl bg-white text-[#C02030] hover:bg-slate-100 text-xs sm:text-sm font-bold uppercase tracking-wider transition shadow-md shrink-0 flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4 text-[#C02030]" />
            <span>{t.warrantyProtectionContactBtn}</span>
          </a>
        </div>
      </div>

      <CartDrawer />
      <GarageModal />
      <FloatingConcierge />
    </main>
  );
}
