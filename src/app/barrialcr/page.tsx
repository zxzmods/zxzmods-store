"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { GarageModal } from "@/components/garage/GarageModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingConcierge } from "@/components/home/FloatingConcierge";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/context/LanguageContext";
import {
  ChevronDown,
  MessageCircle,
  ShieldCheck,
  Compass,
  MapPin,
  Users,
  ExternalLink,
  ArrowRight,
  Flame,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Flag,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

interface BarrialCrData {
  id: string;
  title: string;
  subtitleEs: string;
  subtitleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  videoUrl: string;
  posterImageUrl: string;
  logoUrl: string;
  whatsappGroupLink: string;
  whatsappBtnTextEs: string;
  whatsappBtnTextEn: string;
  isActive: boolean;
}

interface BarrialCrRide {
  id: string;
  appointmentCode?: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  destinationAddress: string | null;
  status: string;
  isFullDay: boolean;
  isUpcoming: boolean;
}

function formatRideDate(dateStr: string, lang: "es" | "en") {
  try {
    const parts = dateStr.split("-").map(Number);
    if (parts.length === 3) {
      const [year, month, day] = parts;
      const dateObj = new Date(year, month - 1, day);
      const dayOfWeek = dateObj.toLocaleDateString(lang === "es" ? "es-CR" : "en-US", {
        weekday: "short",
      });
      const monthName = dateObj.toLocaleDateString(lang === "es" ? "es-CR" : "en-US", {
        month: "short",
      });
      const fullDate = dateObj.toLocaleDateString(lang === "es" ? "es-CR" : "en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      return {
        day: String(day).padStart(2, "0"),
        dayOfWeek: dayOfWeek.toUpperCase(),
        month: monthName.toUpperCase(),
        fullDate,
      };
    }
  } catch (e) {
    console.error("Error formatting date:", e);
  }
  return { day: dateStr, dayOfWeek: "", month: "", fullDate: dateStr };
}

export default function BarrialCrPage() {
  const { lang, t } = useLanguage();
  const [data, setData] = useState<BarrialCrData | null>(null);
  const [rides, setRides] = useState<BarrialCrRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/barrialcr")
      .then((res) => res.json())
      .then((resData) => {
        if (!isMounted) return;
        if (resData.success) {
          if (resData.config) setData(resData.config);
          if (Array.isArray(resData.rides)) setRides(resData.rides);
        }
      })
      .catch((err) => {
        console.error("Error loading BarrialCR page data:", err);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleScrollToDetails = () => {
    if (detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Animated Skeleton Loader (Rule 7)
  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#0B0D12] text-white flex flex-col justify-between overflow-hidden">
        <NotificationBanner />
        <Navbar />

        {/* Hero Skeleton */}
        <section className="relative w-full h-screen min-h-[600px] flex flex-col items-center justify-center p-6 bg-slate-900/80">
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90 pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-2xl w-full px-4">
            <Skeleton className="h-6 w-36 rounded-full bg-slate-800" />
            <Skeleton className="h-16 sm:h-24 w-3/4 max-w-lg rounded-2xl bg-slate-800" />
            <Skeleton className="h-5 w-2/3 max-w-md rounded-xl bg-slate-800/80" />
            <Skeleton className="h-12 w-48 rounded-full bg-slate-800/70" />
          </div>
          <div className="absolute bottom-8 flex flex-col items-center gap-2">
            <Skeleton className="h-3 w-28 rounded-md bg-slate-800" />
            <Skeleton className="h-6 w-6 rounded-full bg-slate-800" />
          </div>
        </section>

        {/* Details & Rides Skeleton */}
        <section className="w-full bg-[#F5F5F7] py-20 px-4 sm:px-6 lg:px-12">
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
              <Skeleton className="w-40 h-40 rounded-3xl bg-slate-200 shrink-0" />
              <div className="flex-1 w-full space-y-4">
                <Skeleton className="h-8 w-1/2 rounded-xl bg-slate-200" />
                <Skeleton className="h-4 w-full rounded-md bg-slate-200" />
                <Skeleton className="h-4 w-5/6 rounded-md bg-slate-200" />
                <Skeleton className="h-4 w-4/6 rounded-md bg-slate-200" />
                <Skeleton className="h-12 w-64 rounded-full bg-slate-200 mt-4" />
              </div>
            </div>

            {/* Rides Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-44 rounded-3xl bg-slate-200" />
              <Skeleton className="h-44 rounded-3xl bg-slate-200" />
            </div>
          </div>
        </section>
      </div>
    );
  }

  const currentTitle = data?.title || "BarrialCR";
  const currentSubtitle =
    lang === "es"
      ? data?.subtitleEs || "Comunidad Off-Road & Rutas UTV en Costa Rica"
      : data?.subtitleEn || data?.subtitleEs || "Off-Road & UTV Rides Community in Costa Rica";
  const currentDescription =
    lang === "es"
      ? data?.descriptionEs ||
        "BarrialCR es una comunidad apasionada que organiza rutas y expediciones todoterreno por los mejores senderos, montañas y ríos de Costa Rica. Unimos a los entusiastas de UTVs y vehículos 4x4 en aventuras inolvidables."
      : data?.descriptionEn ||
        data?.descriptionEs ||
        "BarrialCR is a passionate community organizing off-road trail rides and expeditions across Costa Rica's scenic mountains and rugged terrain.";
  const currentWhatsappText =
    lang === "es"
      ? data?.whatsappBtnTextEs || "Unirse al Chat de la Comunidad"
      : data?.whatsappBtnTextEn || data?.whatsappBtnTextEs || "Join Community Chat";
  const whatsappUrl = data?.whatsappGroupLink || "https://chat.whatsapp.com/invite/BarrialCR";
  const videoSrc = data?.videoUrl || "/uploads/videos/videos_1791875095735_loading_screen_ZXZ_mp4.mp4";
  const posterSrc = data?.posterImageUrl || "/images/sxs/cfmoto_sxs.png";
  const logoSrc = data?.logoUrl || "/images/logo.png";

  const upcomingRides = rides.filter((r) => r.isUpcoming);
  const pastRides = rides.filter((r) => !r.isUpcoming);

  return (
    <div className="relative min-h-screen bg-[#FFFFFF] text-[#1A1A1D] flex flex-col justify-between selection:bg-[#C02030] selection:text-white">
      <NotificationBanner />
      <Navbar />

      <main className="flex-1 w-full">
        {/* ========================================================
            HERO SECTION: Background Video with Centered Title
        ======================================================== */}
        <section className="relative w-full h-screen min-h-[640px] flex flex-col items-center justify-center overflow-hidden bg-black text-white">
          {/* Background Video */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <video
              src={videoSrc}
              poster={posterSrc}
              autoPlay
              loop
              muted
              playsInline
              onLoadedData={() => setVideoLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-1000 ${
                videoLoaded ? "opacity-75" : "opacity-40"
              }`}
            />
            {/* Cinematic Gradient Overlays for high-contrast DJI typography */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/70 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.55)_100%)] pointer-events-none" />
          </div>

          {/* Centered Title & Hero Content */}
          <div className="relative z-10 flex flex-col items-center text-center px-4 sm:px-6 max-w-4xl mx-auto space-y-5 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-lg">
              <span className="w-2 h-2 rounded-full bg-[#C02030] animate-ping" />
              <span>{t.barrialCrBadgeCommunity || "Comunidad Oficial"}</span>
              <span className="text-white/40">•</span>
              <span className="text-[#C02030] font-bold">Costa Rica</span>
            </div>

            {/* Main Centered Title */}
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.8)] select-none">
              {currentTitle}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-xl text-gray-200 font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              {currentSubtitle}
            </p>

            {/* Quick CTA to join chat or scroll down */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#25D366] hover:bg-[#20ba5c] text-white font-bold text-sm transition-all duration-300 shadow-[0_10px_30px_rgba(37,211,102,0.4)] hover:scale-105 active:scale-95"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>{currentWhatsappText}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <button
                type="button"
                onClick={handleScrollToDetails}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 backdrop-blur-md text-white text-sm font-semibold transition"
              >
                <span>{lang === "es" ? "Conocer Más" : "Learn More"}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Animated Scroll Down Indicator */}
          <button
            type="button"
            onClick={handleScrollToDetails}
            aria-label={t.barrialCrScrollDown || "Desliza para explorar"}
            className="absolute bottom-8 z-10 flex flex-col items-center gap-1.5 text-white/70 hover:text-white transition-colors cursor-pointer group"
          >
            <span className="text-[11px] font-semibold tracking-widest uppercase opacity-80 group-hover:opacity-100">
              {t.barrialCrScrollDown || "Desliza para explorar"}
            </span>
            <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center animate-bounce group-hover:bg-white/20 transition">
              <ChevronDown className="w-4 h-4 text-white" />
            </div>
          </button>
        </section>

        {/* ========================================================
            COMMUNITY SECTION: Logo, Description & WhatsApp Chat
        ======================================================== */}
        <section
          ref={detailsRef}
          id="community-details"
          className="w-full bg-[#F5F5F7] py-16 sm:py-24 px-4 sm:px-6 lg:px-12 border-t border-gray-200"
        >
          <div className="max-w-5xl mx-auto space-y-12">
            {/* Header Badge & Title */}
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-[#C02030] text-xs font-bold uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5" />
                <span>{t.barrialCrRidesTitle || "Rutas & Aventuras en Costa Rica"}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] tracking-tight">
                {t.barrialCrAboutTitle || "Sobre la Comunidad BarrialCR"}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                {lang === "es"
                  ? "Conectando pilotos de vehículos todoterreno en las rutas más extremas y espectaculares de Costa Rica."
                  : "Connecting off-road drivers on Costa Rica's most extreme and scenic trails."}
              </p>
            </div>

            {/* Main Showcase Card: Logo + Community Description */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 border border-gray-200/90 shadow-xl shadow-gray-200/50 flex flex-col md:flex-row items-center md:items-start gap-8 lg:gap-12 transition-all">
              {/* Group Logo Box */}
              <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-3xl bg-gray-50 border border-gray-200 shadow-inner flex items-center justify-center p-4 shrink-0 overflow-hidden group">
                <div className="relative w-full h-full transition-transform duration-500 group-hover:scale-105">
                  <Image
                    src={logoSrc}
                    alt={`${currentTitle} Logo`}
                    fill
                    className="object-contain drop-shadow-md"
                    priority
                    unoptimized
                  />
                </div>
              </div>

              {/* Description Content & Details */}
              <div className="flex-1 space-y-6 text-center md:text-left">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#111827] text-white text-[11px] font-bold">
                      {currentTitle}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {lang === "es" ? "Comunidad Activa" : "Active Community"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-[#C02030] text-[11px] font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Costa Rica
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {currentSubtitle}
                  </h3>
                </div>

                <p className="text-sm sm:text-base text-gray-600 leading-relaxed whitespace-pre-line font-normal">
                  {currentDescription}
                </p>

                {/* Key Community Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-2.5 text-left">
                    <div className="p-1.5 rounded-xl bg-red-50 text-[#C02030] shrink-0">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {lang === "es" ? "Rutas Mensuales" : "Monthly Rides"}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {lang === "es" ? "Barro, montaña y ríos" : "Mud, mountains and rivers"}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-2.5 text-left">
                    <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {lang === "es" ? "Seguridad & Guía" : "Safety & Guidance"}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {lang === "es" ? "Soporte técnico y rescate" : "Technical support & recovery"}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-2.5 text-left">
                    <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {lang === "es" ? "Camaradería" : "Camaraderie"}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {lang === "es" ? "Pasión todoterreno pura" : "Pure off-road passion"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Group CTA Card */}
                <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left space-y-0.5">
                    <p className="text-xs font-bold text-gray-900">
                      {t.barrialCrJoinChatPrompt}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {lang === "es"
                        ? "Coordinación de fechas, puntos de encuentro y fotos de expediciones."
                        : "Coordination of dates, meeting points, and expedition photo galleries."}
                    </p>
                  </div>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba5c] text-white font-bold text-xs sm:text-sm transition-all duration-300 shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/35 hover:-translate-y-0.5 shrink-0"
                  >
                    <MessageCircle className="w-5 h-5 fill-current" />
                    <span>{currentWhatsappText}</span>
                    <ExternalLink className="w-4 h-4 opacity-80" />
                  </a>
                </div>
              </div>
            </div>

            {/* ========================================================
                CALENDAR RIDES SECTION: Dynamically pulled from Backdoor Agenda
            ======================================================== */}
            <div className="space-y-6 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-gray-200 pb-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>{t.barrialCrCalendarSyncNotice}</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
                    {t.barrialCrUpcomingRidesTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl">
                    {t.barrialCrUpcomingRidesSubtitle}
                  </p>
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition shadow-xs shrink-0 self-start sm:self-auto"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>{currentWhatsappText}</span>
                </a>
              </div>

              {/* Dynamic Rides Render */}
              {upcomingRides.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {upcomingRides.map((ride) => {
                    const formatted = formatRideDate(ride.date, lang);
                    const whatsappJoinRideUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
                      lang === "es"
                        ? `¡Hola! Quiero unirme a la ${ride.title} de BarrialCR programada para el ${formatted.fullDate}.`
                        : `Hi! I want to join BarrialCR's ${ride.title} scheduled for ${formatted.fullDate}.`
                    )}`;

                    return (
                      <div
                        key={ride.id}
                        className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-md hover:shadow-xl hover:border-amber-300 transition-all duration-300 flex flex-col justify-between gap-5 group"
                      >
                        <div className="flex items-start gap-4">
                          {/* Left Date Badge */}
                          <div className="w-18 h-20 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col items-center justify-center shrink-0 shadow-inner group-hover:bg-amber-100 transition">
                            <span className="text-[10px] font-bold text-amber-700 tracking-wider">
                              {formatted.month}
                            </span>
                            <span className="text-2xl sm:text-3xl font-black text-gray-900 leading-none my-0.5">
                              {formatted.day}
                            </span>
                            <span className="text-[9px] font-extrabold text-amber-800 tracking-wider">
                              {formatted.dayOfWeek}
                            </span>
                          </div>

                          {/* Ride Content */}
                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {t.barrialCrRideConfirmed}
                              </span>

                              {ride.appointmentCode && (
                                <span className="font-mono text-[10px] text-gray-400">
                                  #{ride.appointmentCode}
                                </span>
                              )}
                            </div>

                            <h4 className="text-base sm:text-lg font-bold text-gray-900 leading-snug group-hover:text-[#C02030] transition-colors">
                              {ride.title}
                            </h4>

                            <div className="flex flex-col gap-1 text-xs text-gray-500 pt-1">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="font-semibold text-gray-700">
                                  {ride.time || "08:00 AM"}
                                </span>
                              </div>

                              {ride.destinationAddress && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-[#C02030] shrink-0" />
                                  <span className="truncate">{ride.destinationAddress}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card CTA: Direct WhatsApp Join */}
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                          <span className="text-[11px] text-gray-400 flex items-center gap-1">
                            <Flag className="w-3 h-3 text-amber-500" />
                            {lang === "es" ? "Cupos limitados" : "Limited spots"}
                          </span>

                          <a
                            href={whatsappJoinRideUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba5c] text-white text-xs font-bold transition shadow-xs shrink-0"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-current" />
                            <span>{t.barrialCrRideJoinWhatsApp}</span>
                            <ExternalLink className="w-3 h-3 opacity-80" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Empty State (Zero Mock Data Policy Compliant) */
                <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-200 text-center space-y-4 shadow-sm">
                  <div className="w-14 h-14 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                    <Calendar className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h4 className="text-base sm:text-lg font-bold text-gray-900">
                      {t.barrialCrNoRidesPlanned}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                      {t.barrialCrNoRidesSub}
                    </p>
                  </div>

                  <div className="pt-2">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#25D366] hover:bg-[#20ba5c] text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-500/20"
                    >
                      <MessageCircle className="w-4 h-4 fill-current" />
                      <span>{currentWhatsappText}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>
                  </div>
                </div>
              )}

              {/* Past Completed Rides History (if any) */}
              {pastRides.length > 0 && (
                <div className="pt-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      {lang === "es" ? "Expediciones Realizadas" : "Past Completed Expeditions"}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {pastRides.map((ride) => {
                      const formatted = formatRideDate(ride.date, lang);
                      return (
                        <div
                          key={ride.id}
                          className="p-3.5 rounded-2xl bg-white border border-gray-200 opacity-80 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 space-y-0.5">
                            <span className="font-mono text-[10px] text-gray-400 block">
                              {formatted.fullDate}
                            </span>
                            <p className="font-bold text-gray-800 truncate">{ride.title}</p>
                            {ride.destinationAddress && (
                              <p className="text-[11px] text-gray-500 truncate">
                                {ride.destinationAddress}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                            {t.barrialCrRidePastBadge}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Back to Products / Combos Navigation Bar */}
            <div className="p-6 rounded-3xl bg-white border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  {lang === "es"
                    ? "¿Listo para equipar tu vehículo para la próxima ruta?"
                    : "Ready to equip your vehicle for the next ride?"}
                </h4>
                <p className="text-xs text-gray-500">
                  {lang === "es"
                    ? "Explora nuestros combos de alto rendimiento, paquetes de potencia e instalación garantizada."
                    : "Explore our performance combos, power packages, and certified installation."}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href="/combos"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 transition"
                >
                  <span>{t.navCombos}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C02030]" />
                </Link>
                <Link
                  href="/marcas"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-xs font-bold text-white transition shadow-sm"
                >
                  <span>{t.navBrands}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#C02030]" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Global Site Footer */}
      <Footer />

      {/* Floating Concierge & Modals */}
      <FloatingConcierge />
      <GarageModal />
      <CartDrawer />
    </div>
  );
}
