"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useGarage } from "@/context/GarageContext";
import { getWhatsAppUrl } from "@/config/company";
import {
  ShieldCheck,
  Zap,
  MessageCircle,
  ArrowRight,
  Car,
  CheckCircle2,
} from "lucide-react";

export function HeroSection() {
  const { t } = useLanguage();
  const { vehicle, openModal } = useGarage();

  return (
    <section className="relative overflow-hidden bg-[#121214] text-[#E6E6E8] pt-10 pb-20 sm:pt-16 sm:pb-28">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#C02030]/15 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-[#4D5660]/20 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#242428] border border-[#2E2E34] text-xs font-semibold text-[#E6E6E8]">
              <span className="w-2 h-2 rounded-full bg-[#C02030] animate-pulse" />
              <span>{t.heroBadge}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              {t.heroTitle}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C02030] via-[#E02A3C] to-[#E6E6E8]">
                {t.heroHighlight}
              </span>
            </h1>

            {/* Description */}
            <p className="text-base sm:text-lg text-[#A0A0A6] max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              {t.heroDescription}
            </p>

            {/* Vehicle Status Tag (if configured) */}
            {vehicle && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 text-xs text-[#10B981]">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {t.homeNavigatingAdapted}{" "}
                  <strong>
                    {vehicle.year} {vehicle.brandName} {vehicle.modelName}
                  </strong>
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                href="#brands"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#C02030] hover:bg-[#E02A3C] text-white font-bold text-xs tracking-wider uppercase shadow-[0_0_25px_rgba(192,32,48,0.45)] transition-all"
              >
                <span>{t.heroExploreBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href={getWhatsAppUrl("Hola ZxZ Mods! Me gustaría cotizar piezas para mi vehículo.")}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#242428] hover:bg-[#2E2E34] border border-[#2E2E34] hover:border-[#25D366] text-[#E6E6E8] hover:text-[#25D366] font-semibold text-xs tracking-wider uppercase transition-all"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>{t.heroWhatsAppBtn}</span>
              </a>
            </div>

            {/* Three Foundation Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-[#2E2E34]/80">
              <div className="p-3 rounded-xl bg-[#1A1A1D] border border-[#2E2E34]">
                <p className="text-lg sm:text-2xl font-black font-mono text-[#C02030]">
                  {t.heroMetric1Value}
                </p>
                <p className="text-[11px] text-[#A0A0A6] uppercase tracking-wider mt-0.5">
                  {t.heroMetric1Label}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#1A1A1D] border border-[#2E2E34]">
                <p className="text-lg sm:text-2xl font-black font-mono text-[#10B981]">
                  {t.heroMetric2Value}
                </p>
                <p className="text-[11px] text-[#A0A0A6] uppercase tracking-wider mt-0.5">
                  {t.heroMetric2Label}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#1A1A1D] border border-[#2E2E34]">
                <p className="text-lg sm:text-2xl font-black font-mono text-[#E6E6E8]">
                  {t.heroMetric3Value}
                </p>
                <p className="text-[11px] text-[#A0A0A6] uppercase tracking-wider mt-0.5">
                  {t.heroMetric3Label}
                </p>
              </div>
            </div>
          </div>

          {/* Right Visual Display */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden bg-gradient-to-b from-[#242428] to-[#1A1A1D] border border-[#2E2E34] p-8 flex flex-col items-center justify-center shadow-2xl">
              {/* Central Logo */}
              <div className="relative w-64 sm:w-80 h-40 filter drop-shadow-[0_0_30px_rgba(192,32,48,0.5)]">
                <Image
                  src="/images/logo.png"
                  alt="ZxZ Mods Performance"
                  fill
                  priority
                  className="object-contain"
                />
              </div>

              <div className="mt-8 text-center space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-[#C02030]/20 border border-[#C02030]/40 text-[#C02030] text-[11px] font-mono tracking-widest uppercase">
                  {t.homeCostaRicaHq}
                </span>
                <p className="text-xs text-[#A0A0A6]">
                  {t.homeHqSubtitle}
                </p>
              </div>

              {/* Floating feature pills */}
              <div className="absolute top-4 left-4 bg-[#121214]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#2E2E34] text-[10px] font-mono text-[#E6E6E8] flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-[#C02030]" />
                <span>CAN-AM • POLARIS • YAMAHA • HONDA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
