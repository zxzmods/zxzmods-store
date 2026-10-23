"use client";

import React, { useState, useEffect, useCallback } from "react";
import { LogoIntro } from "@/components/intro/LogoIntro";
import { HomeSkeleton } from "@/components/home/HomeSkeleton";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { Navbar } from "@/components/layout/Navbar";
import { DjiHeroSection } from "@/components/home/DjiHeroSection";
import { DealerBrandsBar } from "@/components/home/DealerBrandsBar";
import { DjiBrandsGrid } from "@/components/home/DjiBrandsGrid";
import { ProductShowcaseSection } from "@/components/home/ProductShowcaseSection";
import { CompanyInfoSection } from "@/components/home/CompanyInfoSection";
import { GarageModal } from "@/components/garage/GarageModal";
import { FloatingConcierge } from "@/components/home/FloatingConcierge";
import { useLanguage } from "@/context/LanguageContext";
import { COMPANY_CONFIG } from "@/config/company";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, MapPin } from "lucide-react";

export default function HomePage() {
  const { t, lang, companyPhone } = useLanguage();
  const [showIntro, setShowIntro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const hasSeenIntro = sessionStorage.getItem("zxz_intro_seen");
      if (!hasSeenIntro) {
        setShowIntro(true);
      }
    } catch {
      // In case sessionStorage is blocked
      setShowIntro(false);
    }

    // Verify backend connectivity
    fetch("/api/catalog/home")
      .then((res) => res.json())
      .catch((err) => console.error("Catalog check:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
    try {
      sessionStorage.setItem("zxz_intro_seen", "true");
    } catch {}
  }, []);

  // Animated Skeleton Screen while loading data if intro is not showing
  if (loading && !showIntro) {
    return <HomeSkeleton />;
  }

  return (
    <div className="min-h-screen bg-white text-[#1A1A1D] flex flex-col justify-between selection:bg-[#C02030] selection:text-white relative">
      {/* C_anim Intro Animation Overlay */}
      {showIntro && <LogoIntro onComplete={handleIntroComplete} />}
          {/* Unobtrusive YMM Notification */}
          <NotificationBanner />

          {/* Minimalist DJI-Style Navigation Bar */}
          <Navbar />

          <main className="flex-1">
            {/* 1. Constant Video Hero Section (sketch_1.png) */}
            <DjiHeroSection />

            {/* Dealer Brands Space (Rotating Wheel with Faded Ends) */}
            <DealerBrandsBar />

            {/* 2. Brands Zone (sketch_2.png & OSMO POCKET 4 Image 2) */}
            <DjiBrandsGrid />

            {/* 3. Product Zone (sketch_3.png Image 3 - Cycles every 15s) */}
            <ProductShowcaseSection />

            {/* 4. Companies Info Section (Santa Ana Workshop, Maps, 60-Day Warranty) */}
            <CompanyInfoSection />
          </main>

          {/* Site Footer (Clean DJI Light Aesthetic) */}
          <footer className="bg-[#F5F5F7] border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8 text-xs text-gray-600">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="relative w-36 h-12">
                  <Image
                    src="/images/logo.png"
                    alt={COMPANY_CONFIG.name}
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <p className="font-bold text-[#111827]">
                    {COMPANY_CONFIG.name} Costa Rica
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Especialistas en CFMOTO, Can-Am, Polaris, Yamaha, Honda y Segway.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="flex flex-wrap justify-center gap-6 font-medium text-gray-700">
                  <Link href="/marcas" className="hover:text-black">
                    {t.navBrands}
                  </Link>
                  <Link href="/combos" className="hover:text-black">
                    {t.navCombos}
                  </Link>
                  <Link href="/performance" className="hover:text-black">
                    {t.navPerformance}
                  </Link>
                  <Link href="/taller" className="hover:text-black">
                    {t.navWorkshop}
                  </Link>
                  <Link href="/barrialcr" className="hover:text-black">
                    {t.navBarrialCr || "BarrialCR"}
                  </Link>
                  <Link href="/cotizar" className="text-[#C02030] hover:underline font-bold">
                    {t.navQuote}
                  </Link>
                  <Link href="/documentos" className="hover:text-[#C02030] transition-colors">
                    {lang === "es" ? "Legal & Pólizas" : "Legal & Policies"}
                  </Link>
                  <button
                    onClick={() => {
                      sessionStorage.removeItem("zxz_intro_seen");
                      setShowIntro(true);
                    }}
                    className="text-xs text-gray-500 hover:text-black hover:underline"
                  >
                    Ver Intro
                  </button>
                </div>

                {/* Social & Google Maps Official Links */}
                <div className="flex items-center flex-wrap justify-center gap-3">
                  <a
                    href="https://www.facebook.com/profile.php?id=61595486847238"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-200 transition shadow-2xs text-[11px] font-semibold"
                    aria-label="Facebook ZxZ Mods"
                  >
                    <Facebook className="w-3.5 h-3.5 text-blue-600" />
                    <span>Facebook</span>
                  </a>
                  <a
                    href="https://www.instagram.com/zxz.mods/?hl=en"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:text-pink-600 hover:border-pink-200 transition shadow-2xs text-[11px] font-semibold"
                    aria-label="Instagram ZxZ Mods"
                  >
                    <Instagram className="w-3.5 h-3.5 text-pink-600" />
                    <span>Instagram</span>
                  </a>
                  <a
                    href={COMPANY_CONFIG.location.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700 hover:text-red-600 hover:border-red-200 transition shadow-2xs text-[11px] font-semibold"
                    aria-label="Google Maps ZxZ Mods"
                  >
                    <MapPin className="w-3.5 h-3.5 text-red-600" />
                    <span>Google Maps</span>
                  </a>
                </div>
              </div>

              <div className="text-center md:text-right font-mono text-[11px]">
                <p>© {new Date().getFullYear()} {COMPANY_CONFIG.name}. Todos los derechos reservados.</p>
                <p className="text-gray-500 mt-0.5">
                  {COMPANY_CONFIG.location.shortAddress} • Tel: {companyPhone || COMPANY_CONFIG.contact.phoneDisplay}
                </p>
              </div>
            </div>
          </footer>

          {/* First-time YMM Fitment Gating Modal */}
          <GarageModal />

          {/* Persistent WhatsApp Concierge CTA */}
          <FloatingConcierge />
        </div>
  );
}
