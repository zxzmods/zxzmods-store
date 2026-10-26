"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { GarageModal } from "@/components/garage/GarageModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingConcierge } from "@/components/home/FloatingConcierge";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useGarage } from "@/context/GarageContext";
import { formatCRC } from "@/lib/i18n";
import {
  Gauge,
  Flame,
  CheckCircle2,
  ShoppingCart,
  Activity,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  MessageCircle,
  Wrench,
} from "lucide-react";

interface PackageItem {
  id: string;
  slug: string;
  stageNumber: number;
  titleEs: string;
  titleEn: string;
  targetVehicleEs: string;
  targetVehicleEn: string;
  hpGain: string;
  torqueGain: string;
  priceCRC: number;
  installationPriceCRC: number;
  features: string[];
  includesDyno: boolean;
  includesWarranty: boolean;
}

export default function PerformancePage() {
  const { lang, t } = useLanguage();
  const { addItem } = useCart();
  const { requireVehicleBeforeAction, vehicle, openModal } = useGarage();

  const router = useRouter();

  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [installSelections, setInstallSelections] = useState<Record<string, boolean>>({
    "stage-1": true,
    "stage-2": true,
    "stage-3": true,
  });

  useEffect(() => {
    fetch("/api/catalog/home")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data.performancePackages) {
          setPackages(res.data.performancePackages);
        }
      })
      .catch((err) => console.error("Error loading packages:", err))
      .finally(() => setLoading(false));
  }, []);

  const toggleInstall = (id: string) => {
    setInstallSelections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAddPackage = (pkg: PackageItem) => {
    const withInstallation = !!installSelections[pkg.id];
    addItem({
      id: `pkg-${pkg.id}`,
      title: lang === "es" ? pkg.titleEs : pkg.titleEn,
      brand: "ZxZ Performance",
      comp: ["all"],
      priceCRC: pkg.priceCRC,
      installationPriceCRC: pkg.installationPriceCRC,
      withInstallation,
      homeInstallation: false,
      type: "PACKAGE",
      imageUrl: "/images/sxs/z10_front.png",
    });
  };

  return (
    <div className="min-h-screen bg-white text-[#1A1A1D] flex flex-col justify-between">
      <NotificationBanner />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-black flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.breadcrumbHome}</span>
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">{t.breadcrumbPerformance}</span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-gray-200 pb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C02030]/10 border border-[#C02030]/30 text-xs font-bold text-[#C02030] uppercase tracking-wider mb-2">
              <Gauge className="w-3.5 h-3.5" />
              <span>{t.performanceBadge}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#111827] tracking-tight">
              {t.performancePageTitle}
            </h1>
            <p className="text-sm text-gray-600 mt-2 max-w-2xl">
              {t.performancePageSubtitle}
            </p>
          </div>

          {/* Action to Custom Quote */}
          <Link
            href="/cotizar"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#C02030] hover:bg-[#A01825] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex-shrink-0"
          >
            <span>{t.performanceQuoteCustomBtn}</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Packages Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[460px] rounded-3xl bg-gray-100 animate-pulse border border-gray-200"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg) => {
              const hasInstall = !!installSelections[pkg.id];

              return (
                <div
                  key={pkg.id}
                  className={`bg-white rounded-3xl border transition-all duration-300 p-8 flex flex-col justify-between shadow-sm hover:shadow-md ${
                    pkg.stageNumber === 2
                      ? "border-[#C02030] ring-1 ring-[#C02030]/20"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div>
                    {/* Stage Header */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                        STAGE {pkg.stageNumber}
                      </span>
                      {pkg.stageNumber === 2 && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-[#C02030] bg-[#C02030]/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          <Flame className="w-3 h-3 fill-[#C02030]" />
                          {t.performanceMostPopular}
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl font-black text-[#111827] tracking-tight mb-1">
                      {lang === "es" ? pkg.titleEs : pkg.titleEn}
                    </h3>

                    <p className="text-xs text-gray-500 font-medium mb-6">
                      {lang === "es" ? pkg.targetVehicleEs : pkg.targetVehicleEn}
                    </p>

                    {/* Power Gains Callout */}
                    <div className="grid grid-cols-2 gap-3 mb-6 p-4 rounded-2xl bg-[#F8F9FA] border border-gray-200">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-gray-500 block">
                          {t.performanceHpGainLabel}
                        </span>
                        <span className="text-lg font-black font-mono text-[#C02030]">
                          {pkg.hpGain}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase text-gray-500 block">
                          {t.performanceTorqueGainLabel}
                        </span>
                        <span className="text-lg font-black font-mono text-emerald-600">
                          {pkg.torqueGain}
                        </span>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2.5 mb-8">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-gray-500 block font-bold">
                        {t.performanceIncludesLabel}
                      </span>
                      {pkg.features.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-gray-700 font-medium">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Dyno & Warranty Badges */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {pkg.includesDyno && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                          <Activity className="w-3 h-3" />
                          {t.performanceDynoBadge}
                        </span>
                      )}
                      {pkg.includesWarranty && (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" />
                          {t.performanceLaborWarrantyBadge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-6 border-t border-gray-200 space-y-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-gray-500">{lang === "es" ? "Inversión:" : "Investment:"}</span>
                      <span className="text-2xl font-black font-mono text-[#111827]">
                        {formatCRC(pkg.priceCRC)}
                      </span>
                    </div>

                    {/* Install Checkbox & Scope */}
                    <div className="space-y-1.5">
                      <div
                        onClick={() => toggleInstall(pkg.id)}
                        className={`cursor-pointer p-3 rounded-2xl border transition-all flex items-center justify-between ${
                          hasInstall
                            ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                            : "bg-[#F8F9FA] border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={hasInstall}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-0 bg-white border-gray-300"
                          />
                          <span className="text-xs font-bold text-gray-900">
                            {lang === "es" ? "Instalación en Taller" : "Workshop Installation"}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#C02030]">
                          +{formatCRC(pkg.installationPriceCRC)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg">
                        <Wrench className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span>{lang === "es" ? "Instalación exclusiva en taller ZxZ (Requiere Dyno)" : "ZxZ workshop installation only (Dyno required)"}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddPackage(pkg)}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#C02030] hover:bg-[#A01825] text-white font-bold text-xs tracking-wider uppercase shadow-md transition-all"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>{t.performanceAddToCartBtn}</span>
                      </button>

                      <Link
                        href={`/cotizar?tipo=stage&stage=${pkg.stageNumber}`}
                        className="px-4 py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 flex items-center justify-center text-xs transition-colors"
                        title={t.quoteSubmitWhatsappBtn}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <GarageModal />
      <CartDrawer />
      <FloatingConcierge />
    </div>
  );
}
