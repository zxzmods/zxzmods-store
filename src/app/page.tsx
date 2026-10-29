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
import { Footer } from "@/components/layout/Footer";
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
    fetch("/api/catalog/home", { cache: "no-store" })
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
          <Footer onShowIntro={() => setShowIntro(true)} />

          {/* First-time YMM Fitment Gating Modal */}
          <GarageModal />

          {/* Persistent WhatsApp Concierge CTA */}
          <FloatingConcierge />
        </div>
  );
}
