"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { GarageModal } from "@/components/garage/GarageModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingConcierge } from "@/components/home/FloatingConcierge";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/context/LanguageContext";
import {
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  ExternalLink,
  Copy,
  Check,
  ArrowLeft,
  Navigation,
} from "lucide-react";

interface LocationData {
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
  wazeLink: string;
  hours: {
    es: string;
    en: string;
  };
  latitude: number;
  longitude: number;
}

export default function UbicacionPage() {
  const { lang, t } = useLanguage();
  const [data, setData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/location")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        }
      })
      .catch((err) => console.error("Error loading location data:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleCopyAddress = () => {
    if (!data) return;
    const addressToCopy = lang === "es" ? data.addressEs : data.addressEn;
    navigator.clipboard.writeText(addressToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#111827] flex flex-col justify-between antialiased">
      <NotificationBanner />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 w-full">
        {/* Minimalist Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <Link
            href="/"
            className="hover:text-black flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === "es" ? "Inicio" : "Home"}</span>
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">{t.locationBreadcrumb}</span>
        </div>

        {/* Minimalist Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C02030]/10 border border-[#C02030]/20 text-[11px] font-bold text-[#C02030] uppercase tracking-wider mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>{t.locationBadge}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            {t.locationTitle}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1.5 max-w-xl">
            {t.locationSubtitle}
          </p>
        </div>

        {/* Real Loading Skeleton (Rule 7: Mandatory Animated Skeleton Loaders) */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-pulse">
            {/* Info Skeleton */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-4/5" />
                <div className="h-8 bg-gray-100 rounded-xl w-1/2" />
              </div>
              <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
              <div className="bg-white rounded-3xl border border-gray-200 p-6 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
              <div className="flex gap-3">
                <div className="h-12 bg-gray-200 rounded-2xl flex-1" />
                <div className="h-12 bg-gray-200 rounded-2xl flex-1" />
              </div>
            </div>

            {/* Map Skeleton */}
            <div className="lg:col-span-7 h-[420px] sm:h-[480px] bg-gray-200 rounded-3xl border border-gray-200" />
          </div>
        ) : !data ? null : (
          /* Minimalist Location Content */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Essential Contact & Information Cards */}
            <div className="lg:col-span-5 space-y-4">
              {/* Physical Address Card */}
              <div className="bg-white rounded-3xl border border-gray-200/90 p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#C02030]/10 text-[#C02030] flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      {t.workshopAddressLabel}
                    </span>
                  </div>

                  <button
                    onClick={handleCopyAddress}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                    title={t.locationCopyAddress}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">{t.locationAddressCopied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t.locationCopyAddress}</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                  {lang === "es" ? data.addressEs : data.addressEn}
                </p>
                <span className="inline-block text-[11px] font-mono text-gray-500">
                  {data.province}, Costa Rica
                </span>
              </div>

              {/* Operating Hours Card */}
              <div className="bg-white rounded-3xl border border-gray-200/90 p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    {t.workshopHoursLabel}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
                  {lang === "es" ? data.hours.es : data.hours.en}
                </p>
              </div>

              {/* Direct Contact Card */}
              <div className="bg-white rounded-3xl border border-gray-200/90 p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    {lang === "es" ? "Contacto Directo" : "Direct Contact"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href={`tel:${data.phone.replace(/[^0-9+]/g, "")}`}
                    className="flex items-center gap-2 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200/70 text-gray-800 text-xs font-semibold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#C02030]" />
                    <span className="font-mono">{data.phone}</span>
                  </a>

                  <a
                    href={`https://wa.me/${data.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Quiero modificar mi mula")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/80 text-emerald-900 text-xs font-semibold transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Navigation CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <a
                  href={data.googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-[#111827] hover:bg-[#C02030] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
                >
                  <Navigation className="w-4 h-4" />
                  <span>{t.locationGoogleMapsBtn}</span>
                </a>

                <a
                  href={data.wazeLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-bold uppercase tracking-wider shadow-xs transition-all"
                >
                  <ExternalLink className="w-4 h-4 text-[#0070D2]" />
                  <span>{t.locationWazeBtn}</span>
                </a>
              </div>
            </div>

            {/* Right: Clean Google Maps Embed */}
            <div className="lg:col-span-7 h-[420px] sm:h-[520px] rounded-3xl overflow-hidden border border-gray-200/90 relative shadow-sm bg-gray-100">
              <iframe
                src={
                  data.googleMapsEmbedUrl && !data.googleMapsEmbedUrl.includes("hl=") && !data.googleMapsEmbedUrl.includes("!2ses")
                    ? `${data.googleMapsEmbedUrl}${data.googleMapsEmbedUrl.includes("?") ? "&" : "?"}hl=es&gl=CR`
                    : data.googleMapsEmbedUrl
                }
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps - ZxZ Mods Santa Ana"
                className="w-full h-full"
              />

              {/* Discreet Map Coordinates Pill */}
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-mono text-gray-600 shadow-sm pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C02030]" />
                <span>Santa Ana, CR • {data.latitude}, {data.longitude}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Site Footer */}
      <Footer />

      {/* Global Modals & Drawers */}
      <GarageModal />
      <CartDrawer />
      <FloatingConcierge />
    </div>
  );
}
