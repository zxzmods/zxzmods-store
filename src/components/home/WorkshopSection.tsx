"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { COMPANY_CONFIG, getWhatsAppUrl, getTelUrl } from "@/config/company";
import {
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  ExternalLink,
  Shield,
  Zap,
  Cpu,
  Wrench,
} from "lucide-react";

export interface WorkshopData {
  id: string;
  name: string;
  taglineEs: string;
  taglineEn: string;
  addressEs: string;
  addressEn: string;
  province: string;
  phone: string;
  whatsapp: string;
  googleMapsEmbedUrl: string;
  googleMapsLink: string;
  hours: {
    es: string;
    en: string;
  };
}

interface WorkshopSectionProps {
  workshop: WorkshopData | null;
}

export function WorkshopSection({ workshop }: WorkshopSectionProps) {
  const { t, lang } = useLanguage();

  if (!workshop) return null;

  return (
    <section id="workshop" className="py-20 bg-[#121214] text-[#E6E6E8] border-t border-[#2E2E34]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#10B981]/15 border border-[#10B981]/40 text-xs font-semibold text-[#10B981] uppercase tracking-wider mb-3">
            <Wrench className="w-4 h-4" />
            <span>{t.workshopTitle}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t.homeWorkshopSubtitle}
          </h2>
          <p className="text-sm text-[#A0A0A6] mt-2 leading-relaxed">
            {t.workshopSubtitle}
          </p>
        </div>

        {/* 4 Standardized Warranties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {/* 1. Bolt-On & Electrical */}
          <div className="bg-[#1A1A1D] border border-[#2E2E34] hover:border-[#C02030]/50 rounded-2xl p-6 transition-all shadow-md">
            <div className="w-10 h-10 rounded-xl bg-[#C02030]/15 flex items-center justify-center text-[#C02030] mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-[#C02030] uppercase tracking-wider block mb-1">
              {COMPANY_CONFIG.warranties.boltOnElectrical.termEs}
            </span>
            <h4 className="text-base font-bold text-white mb-2">
              {t.warrantyBoltOnTitle}
            </h4>
            <p className="text-xs text-[#A0A0A6] leading-relaxed">
              {t.warrantyBoltOnDesc}
            </p>
          </div>

          {/* 2. Mechanical & Drivetrain (60 Days!) */}
          <div className="bg-[#1A1A1D] border border-[#2E2E34] hover:border-[#10B981]/50 rounded-2xl p-6 transition-all shadow-md">
            <div className="w-10 h-10 rounded-xl bg-[#10B981]/15 flex items-center justify-center text-[#10B981] mb-4">
              <Wrench className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-[#10B981] uppercase tracking-wider block mb-1">
              {COMPANY_CONFIG.warranties.mechanicalDrivetrain.termEs}
            </span>
            <h4 className="text-base font-bold text-white mb-2">
              {t.warrantyMechTitle}
            </h4>
            <p className="text-xs text-[#A0A0A6] leading-relaxed">
              {t.warrantyMechDesc}
            </p>
          </div>

          {/* 3. ECU Tuning */}
          <div className="bg-[#1A1A1D] border border-[#2E2E34] hover:border-[#0EA5E9]/50 rounded-2xl p-6 transition-all shadow-md">
            <div className="w-10 h-10 rounded-xl bg-[#0EA5E9]/15 flex items-center justify-center text-[#0EA5E9] mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-[#0EA5E9] uppercase tracking-wider block mb-1">
              {COMPANY_CONFIG.warranties.ecuTuning.termEs}
            </span>
            <h4 className="text-base font-bold text-white mb-2">
              {t.warrantyEcuTitle}
            </h4>
            <p className="text-xs text-[#A0A0A6] leading-relaxed">
              {t.warrantyEcuDesc}
            </p>
          </div>

          {/* 4. Product Warranty */}
          <div className="bg-[#1A1A1D] border border-[#2E2E34] hover:border-[#4D5660]/70 rounded-2xl p-6 transition-all shadow-md">
            <div className="w-10 h-10 rounded-xl bg-[#4D5660]/20 flex items-center justify-center text-[#E6E6E8] mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-[#E6E6E8] uppercase tracking-wider block mb-1">
              {COMPANY_CONFIG.warranties.productWarranty.termEs}
            </span>
            <h4 className="text-base font-bold text-white mb-2">
              {t.warrantyProductTitle}
            </h4>
            <p className="text-xs text-[#A0A0A6] leading-relaxed">
              {t.warrantyProductDesc}
            </p>
          </div>
        </div>

        {/* Location & Google Maps Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#1A1A1D] border border-[#2E2E34] rounded-3xl p-6 sm:p-10 shadow-2xl">
          {/* Details */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#C02030] font-semibold block mb-1">
                {t.homeWorkshopPhysicalTitle}
              </span>
              <h3 className="text-2xl font-black text-white tracking-tight">
                {workshop.name}
              </h3>
              <p className="text-xs text-[#A0A0A6] mt-1">
                {lang === "es" ? workshop.taglineEs : workshop.taglineEn}
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#C02030] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">{t.homeWorkshopAddressLabel}</span>
                  <span className="text-[#A0A0A6] leading-relaxed">
                    {lang === "es" ? workshop.addressEs : workshop.addressEn}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block">
                    {t.workshopHoursLabel}:
                  </span>
                  <span className="text-[#A0A0A6]">
                    {lang === "es" ? workshop.hours.es : workshop.hours.en}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#0EA5E9] flex-shrink-0" />
                <div>
                  <span className="font-semibold text-white mr-2">{t.homeWorkshopPhoneLabel}</span>
                  <a
                    href={getTelUrl(workshop.phone)}
                    className="text-[#E6E6E8] hover:text-[#C02030] font-mono"
                  >
                    {workshop.phone || COMPANY_CONFIG.contact.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Maps CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={workshop.googleMapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#242428] hover:bg-[#C02030] text-white text-xs font-semibold uppercase tracking-wider border border-[#2E2E34] hover:border-[#C02030] transition-all shadow-sm"
              >
                <span>{t.workshopOpenMaps}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href={getWhatsAppUrl("Hola ZxZ Mods! Deseo coordinar una cita en el taller.", workshop.whatsapp || workshop.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-black text-xs font-bold uppercase tracking-wider transition-all shadow-md"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-black" />
                <span>{t.workshopWhatsAppLabel}</span>
              </a>
            </div>
          </div>

          {/* Interactive Google Maps Iframe */}
          <div className="lg:col-span-7 h-80 sm:h-96 w-full rounded-2xl overflow-hidden border border-[#2E2E34] shadow-inner relative">
            <iframe
              src={
                workshop.googleMapsEmbedUrl && !workshop.googleMapsEmbedUrl.includes("hl=") && !workshop.googleMapsEmbedUrl.includes("!2ses")
                  ? `${workshop.googleMapsEmbedUrl}${workshop.googleMapsEmbedUrl.includes("?") ? "&" : "?"}hl=es&gl=CR`
                  : workshop.googleMapsEmbedUrl
              }
              width="100%"
              height="100%"
              style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) contrast(95%)" }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="ZxZ Mods Location Map"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
