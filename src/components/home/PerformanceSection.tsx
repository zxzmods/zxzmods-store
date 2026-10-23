"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useGarage } from "@/context/GarageContext";
import { formatCRC } from "@/lib/i18n";
import {
  Gauge,
  Zap,
  Flame,
  CheckCircle2,
  Wrench,
  ShieldCheck,
  ShoppingCart,
  Activity,
} from "lucide-react";

export interface PackageData {
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

interface PerformanceSectionProps {
  packages: PackageData[];
}

export function PerformanceSection({ packages }: PerformanceSectionProps) {
  const { t, lang } = useLanguage();
  const { addItem } = useCart();
  const router = useRouter();

  const [installSelections, setInstallSelections] = useState<Record<string, boolean>>({
    "stage-1": true,
    "stage-2": true,
    "stage-3": true,
  });

  const toggleInstall = (pkgId: string) => {
    setInstallSelections((prev) => ({
      ...prev,
      [pkgId]: !prev[pkgId],
    }));
  };

  const handleAddPackage = (pkg: PackageData) => {
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
      imageUrl:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
    });
  };

  return (
    <section id="performance" className="py-20 bg-[#121214] text-[#E6E6E8] border-t border-[#2E2E34]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E02A3C]/15 border border-[#E02A3C]/40 text-xs font-semibold text-[#E02A3C] uppercase tracking-wider mb-3">
            <Gauge className="w-4 h-4" />
            <span>{t.performanceTitle}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Niveles de Potencia y Preparación Mecánica
          </h2>
          <p className="text-sm text-[#A0A0A6] mt-2 leading-relaxed">
            {t.performanceSubtitle}
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => {
            const hasInstall = !!installSelections[pkg.id];
            const isStage3 = pkg.stageNumber === 3;

            return (
              <div
                key={pkg.id}
                className={`relative bg-[#1A1A1D] border rounded-2xl p-7 flex flex-col justify-between shadow-xl transition-all ${
                  isStage3
                    ? "border-[#C02030] shadow-[0_0_30px_rgba(192,32,48,0.2)]"
                    : "border-[#2E2E34] hover:border-[#4D5660]"
                }`}
              >
                {/* Badge if Stage 3 */}
                {isStage3 && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C02030] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5" />
                    <span>MÁXIMA POTENCIA</span>
                  </div>
                )}

                <div>
                  {/* Top Stage Indicator */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-md bg-[#242428] border border-[#2E2E34] text-[#C02030]">
                      STAGE {pkg.stageNumber}
                    </span>
                    {pkg.includesDyno && (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded-full border border-[#10B981]/30">
                        <Activity className="w-3 h-3" />
                        <span>Dyno Tune</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold text-white tracking-tight leading-snug mb-2">
                    {lang === "es" ? pkg.titleEs : pkg.titleEn}
                  </h3>

                  <p className="text-xs text-[#4D5660] font-mono mb-6">
                    Aplica para:{" "}
                    <span className="text-[#A0A0A6]">
                      {lang === "es" ? pkg.targetVehicleEs : pkg.targetVehicleEn}
                    </span>
                  </p>

                  {/* Dyno Gains Callout */}
                  <div className="grid grid-cols-2 gap-3 bg-[#242428] rounded-xl p-4 border border-[#2E2E34] mb-6">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#A0A0A6] block">
                        {t.stageHpGain}
                      </span>
                      <span className="text-xl font-black font-mono text-[#C02030]">
                        {pkg.hpGain}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#A0A0A6] block">
                        {t.stageTorqueGain}
                      </span>
                      <span className="text-xl font-black font-mono text-[#E6E6E8]">
                        {pkg.torqueGain}
                      </span>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="space-y-2.5 mb-6">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#4D5660] block font-semibold">
                      Incluye:
                    </span>
                    {pkg.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-[#E6E6E8]">
                        <CheckCircle2 className="w-4 h-4 text-[#C02030] flex-shrink-0 mt-0.5" />
                        <span className="leading-snug">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price Block */}
                  <div className="mb-4">
                    <span className="text-2xl font-black font-mono text-white block">
                      {formatCRC(pkg.priceCRC)}
                    </span>
                    <span className="text-[11px] text-[#A0A0A6]">
                      Precio en colones con repuestos certificados
                    </span>
                  </div>

                  {/* Installation Option & Scope Tag */}
                  <div className="space-y-1.5 mb-6">
                    <div
                      onClick={() => toggleInstall(pkg.id)}
                      className={`cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between ${
                        hasInstall
                          ? "bg-[#C02030]/15 border-[#C02030] text-white"
                          : "bg-[#242428] border-[#2E2E34] text-[#A0A0A6] hover:border-[#4D5660]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={hasInstall}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-[#C02030] focus:ring-0 bg-[#1A1A1D] border-[#2E2E34]"
                        />
                        <div className="text-xs">
                          <p className="font-semibold text-[#E6E6E8]">
                            Instalación y Calibración en ZxZ
                          </p>
                          <p className="text-[10px] text-[#A0A0A6]">
                            Incluye escaneo y pruebas de ruta
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#C02030]">
                        +{formatCRC(pkg.installationPriceCRC)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-[#A0A0A6] font-medium px-1">
                      <Wrench className="w-3 h-3 text-[#A0A0A6] flex-shrink-0" />
                      <span>{lang === "es" ? "Instalación exclusiva en taller ZxZ (Requiere Dyno)" : "ZxZ workshop installation only (Dyno required)"}</span>
                    </div>
                  </div>
                </div>

                {/* Add to Cart / Quote Button */}
                <button
                  onClick={() => handleAddPackage(pkg)}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all ${
                    isStage3
                      ? "bg-[#C02030] hover:bg-[#E02A3C] text-white shadow-[0_0_20px_rgba(192,32,48,0.5)]"
                      : "bg-[#242428] hover:bg-[#C02030] text-[#E6E6E8] hover:text-white border border-[#2E2E34] hover:border-[#C02030]"
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{t.stageSelectBtn}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
