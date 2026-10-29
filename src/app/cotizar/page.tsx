"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { GarageModal } from "@/components/garage/GarageModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingConcierge } from "@/components/home/FloatingConcierge";
import { Footer } from "@/components/layout/Footer";
import { useGarage } from "@/context/GarageContext";
import { useLanguage } from "@/context/LanguageContext";
import { getWhatsAppUrl } from "@/config/company";
import {
  Car,
  MessageCircle,
  FileText,
  Send,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Wrench,
  Percent,
} from "lucide-react";

interface YMMData {
  years: number[];
  brands: {
    slug: string;
    name: string;
    models: {
      slug: string;
      name: string;
      category: string;
      years: number[];
    }[];
  }[];
}

export default function CotizarPage() {
  const { vehicle, setVehicle } = useGarage();
  const { lang, t } = useLanguage();

  const [ymmData, setYmmData] = useState<YMMData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedYear, setSelectedYear] = useState<number | "">(vehicle?.year || "");
  const [selectedBrandSlug, setSelectedBrandSlug] = useState<string>(vehicle?.brandSlug || "cfmoto");
  const [selectedModelSlug, setSelectedModelSlug] = useState<string>(vehicle?.modelSlug || "");
  const [interestType, setInterestType] = useState<string>("combos");
  const [customPartsDetails, setCustomPartsDetails] = useState<string>("");
  const [includeInstallation, setIncludeInstallation] = useState<boolean>(true);
  const [clientName, setClientName] = useState<string>("");
  const [clientPhone, setClientPhone] = useState<string>("");

  useEffect(() => {
    fetch("/api/catalog/ymm")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setYmmData(res.data);
          if (!selectedYear && res.data.years.length > 0) {
            setSelectedYear(res.data.years[0]);
          }
        }
      })
      .catch((err) => console.error("Error loading YMM:", err))
      .finally(() => setLoading(false));
  }, [selectedYear]);

  const currentBrand = ymmData?.brands.find((b) => b.slug === selectedBrandSlug);
  const availableModels = currentBrand?.models.filter((m) =>
    selectedYear ? m.years.includes(Number(selectedYear)) : true
  );

  const selectedModel = currentBrand?.models.find((m) => m.slug === selectedModelSlug);

  const handleGenerateQuote = (e: React.FormEvent) => {
    e.preventDefault();

    const vehicleText = `${selectedYear || 2024} ${currentBrand?.name || "CFMOTO"} ${
      selectedModel?.name || selectedModelSlug || "General"
    }`;

    // Save to garage
    if (selectedYear && currentBrand && selectedModel) {
      setVehicle({
        year: Number(selectedYear),
        brandSlug: currentBrand.slug,
        brandName: currentBrand.name,
        modelSlug: selectedModel.slug,
        modelName: selectedModel.name,
      });
    }

    let msg = "";
    if (lang === "es") {
      msg = `¡Hola ZxZ Mods! Me gustaría solicitar una cotización formal para mi vehículo:\n`;
      msg += `🚜 *Vehículo:* ${vehicleText}\n`;
      msg += `👤 *Cliente:* ${clientName || "Cliente Web"}\n`;
      if (clientPhone) msg += `📱 *Teléfono:* ${clientPhone}\n`;
      msg += `📋 *Tipo de Cotización:* ${
        interestType === "combos"
          ? "Combos / Kits Preparados"
          : interestType === "performance"
          ? "Paquetes de Rendimiento Stage (Potencia/ECU)"
          : interestType === "importacion"
          ? "Importación de Pieza Especial de EE.UU."
          : "Mantenimiento / Instalación en Taller"
      }\n`;
      if (customPartsDetails.trim()) {
        msg += `📝 *Detalles de lo que busco:* ${customPartsDetails.trim()}\n`;
      }
      msg += `🔧 *Deseo incluir instalación:* ${
        includeInstallation ? "Sí (en Taller ZxZ)" : "No (Solo compra y envío)"
      }\n\n`;
      msg += `¿Podrían indicarme disponibilidad y proforma con costos de envío a Costa Rica?`;
    } else {
      msg = `Hello ZxZ Mods! I would like to request a formal quotation for my vehicle:\n`;
      msg += `🚜 *Vehicle:* ${vehicleText}\n`;
      msg += `👤 *Customer:* ${clientName || "Web Customer"}\n`;
      if (clientPhone) msg += `📱 *Phone:* ${clientPhone}\n`;
      msg += `📋 *Quote Type:* ${
        interestType === "combos"
          ? "Combos & Pre-assembled Kits"
          : interestType === "performance"
          ? "Stage Performance Packages (Tuning/ECU)"
          : interestType === "importacion"
          ? "US Special Parts Import"
          : "In-Shop Workshop Installation / Maintenance"
      }\n`;
      if (customPartsDetails.trim()) {
        msg += `📝 *Specific details:* ${customPartsDetails.trim()}\n`;
      }
      msg += `🔧 *Include installation:* ${
        includeInstallation ? "Yes (at ZxZ Workshop)" : "No (Parts only)"
      }\n\n`;
      msg += `Could you share parts availability and a proforma with shipping/import details to Costa Rica?`;
    }

    const whatsappUrl = getWhatsAppUrl(msg);

    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-white text-[#1A1A1D] flex flex-col justify-between">
      <NotificationBanner />
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-12 w-full">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-black flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.breadcrumbHome}</span>
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">{t.breadcrumbQuote}</span>
        </div>

        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C02030]/10 border border-[#C02030]/30 text-xs font-bold text-[#C02030] uppercase tracking-wider mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>{t.quoteBadge}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight">
            {t.quotePageTitle}
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            {t.quotePageSubtitle}
          </p>
        </div>

        <form
          onSubmit={handleGenerateQuote}
          className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8"
        >
          {/* Step 1: Vehicle Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#111827] border-b border-gray-200 pb-2">
              <Car className="w-4 h-4 text-[#C02030]" />
              <span>{t.quoteStep1Title}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Year */}
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1.5">
                  {t.quoteYearLabel}
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value ? Number(e.target.value) : "");
                    setSelectedModelSlug("");
                  }}
                  className="w-full bg-gray-50 border border-gray-300 focus:border-[#C02030] rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none"
                  required
                >
                  <option value="">{t.quoteSelectYear}</option>
                  {ymmData?.years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand (CFMOTO is first!) */}
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1.5">
                  {t.quoteMakeLabel}
                </label>
                <select
                  value={selectedBrandSlug}
                  onChange={(e) => {
                    setSelectedBrandSlug(e.target.value);
                    setSelectedModelSlug("");
                  }}
                  className="w-full bg-gray-50 border border-gray-300 focus:border-[#C02030] rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none"
                  required
                >
                  <option value="">{t.quoteSelectMake}</option>
                  {ymmData?.brands.map((b) => (
                    <option key={b.slug} value={b.slug}>
                      {b.name} {b.slug === "cfmoto" ? (lang === "es" ? "★ (Especialidad ZxZ)" : "★ (ZxZ Specialty)") : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1.5">
                  {t.quoteModelLabel}
                </label>
                <select
                  value={selectedModelSlug}
                  onChange={(e) => setSelectedModelSlug(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 focus:border-[#C02030] rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none"
                  required
                >
                  <option value="">{t.quoteSelectModel}</option>
                  {availableModels?.map((m) => (
                    <option key={m.slug} value={m.slug}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: What are you looking for? */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#111827] border-b border-gray-200 pb-2">
              <Wrench className="w-4 h-4 text-[#C02030]" />
              <span>{t.quoteStep2Title}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: "combos",
                  title: t.quoteInterestPackageTitle,
                  desc: t.quoteInterestPackageDesc,
                },
                {
                  id: "performance",
                  title: t.quoteInterestPartsTitle,
                  desc: t.quoteInterestPartsDesc,
                },
                {
                  id: "importacion",
                  title: t.quoteInterestCustomTitle,
                  desc: t.quoteInterestCustomDesc,
                },
                {
                  id: "mantenimiento",
                  title: t.quoteInterestMaintenanceTitle,
                  desc: t.quoteInterestMaintenanceDesc,
                },
              ].map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setInterestType(opt.id)}
                  className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                    interestType === opt.id
                      ? "bg-red-50/60 border-[#C02030] text-[#111827]"
                      : "bg-[#F8F9FA] border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#111827]">
                      {opt.title}
                    </span>
                    <input
                      type="radio"
                      name="interest"
                      checked={interestType === opt.id}
                      onChange={() => {}}
                      className="text-[#C02030] focus:ring-0"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1.5">
                {t.quoteSpecificDetailsLabel}
              </label>
              <textarea
                rows={3}
                value={customPartsDetails}
                onChange={(e) => setCustomPartsDetails(e.target.value)}
                placeholder={t.quoteSpecificDetailsPlaceholder}
                className="w-full bg-gray-50 border border-gray-300 focus:border-[#C02030] rounded-2xl p-4 text-sm text-gray-900 focus:outline-none"
              />
            </div>

            {/* Installation Toggle */}
            <div
              onClick={() => setIncludeInstallation(!includeInstallation)}
              className="cursor-pointer p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:border-gray-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={includeInstallation}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-[#C02030] focus:ring-0 bg-white border-gray-300"
                />
                <div>
                  <p className="text-sm font-bold text-[#111827]">
                    {t.quoteWorkshopIncludeLabel}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t.quoteWorkshopWarrantyNotice}
                  </p>
                </div>
              </div>
              <span className="text-xs text-emerald-700 font-mono font-bold">
                {t.quoteWorkshopLocationBadge}
              </span>
            </div>
          </div>

          {/* Step 3: Contact */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#111827] border-b border-gray-200 pb-2">
              <MessageCircle className="w-4 h-4 text-[#C02030]" />
              <span>{t.quoteStep3Title}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1.5">
                  {t.quoteClientNameLabel}
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder={t.quoteClientNamePlaceholder}
                  required
                  className="w-full bg-gray-50 border border-gray-300 focus:border-[#C02030] rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1.5">
                  {t.quoteClientPhoneLabel}
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder={t.quoteClientPhonePlaceholder}
                  className="w-full bg-gray-50 border border-gray-300 focus:border-[#C02030] rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{t.quoteImmediateResponseNotice}</span>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-black font-extrabold text-xs tracking-wider uppercase shadow-md transition-all"
            >
              <Send className="w-4 h-4 fill-black" />
              <span>{t.quoteSubmitWhatsappBtn}</span>
            </button>
          </div>
        </form>
      </main>

      {/* Global Site Footer */}
      <Footer />

      <GarageModal />
      <CartDrawer />
      <FloatingConcierge />
    </div>
  );
}
