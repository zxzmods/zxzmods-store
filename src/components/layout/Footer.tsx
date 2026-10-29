"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, MapPin } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { COMPANY_CONFIG } from "@/config/company";

export interface FooterProps {
  onShowIntro?: () => void;
  className?: string;
}

export function Footer({ onShowIntro, className = "" }: FooterProps) {
  const { t, lang, companyPhone } = useLanguage();

  const handleIntroClick = () => {
    if (onShowIntro) {
      onShowIntro();
      return;
    }
    try {
      sessionStorage.removeItem("zxz_intro_seen");
    } catch {}
    window.location.href = "/";
  };

  return (
    <footer
      className={`bg-[#F5F5F7] border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8 text-xs text-gray-600 ${className}`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand identity */}
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
              {lang === "es"
                ? "Especialistas en CFMOTO, Can-Am, Polaris, Yamaha, Honda y Segway."
                : "Specialists in CFMOTO, Can-Am, Polaris, Yamaha, Honda & Segway."}
            </p>
          </div>
        </div>

        {/* Navigation links & Socials */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-6 font-medium text-gray-700">
            <Link href="/marcas" className="hover:text-black transition-colors">
              {t.navBrands}
            </Link>
            <Link href="/combos" className="hover:text-black transition-colors">
              {t.navCombos}
            </Link>
            <Link href="/performance" className="hover:text-black transition-colors">
              {t.navPerformance}
            </Link>
            <Link href="/taller" className="hover:text-black transition-colors">
              {t.navWorkshop}
            </Link>
            <Link href="/barrialcr" className="hover:text-black transition-colors">
              {t.navBarrialCr || "BarrialCR"}
            </Link>
            <Link href="/cotizar" className="text-[#C02030] hover:underline font-bold transition-colors">
              {t.navQuote}
            </Link>
            <Link href="/privacidad" className="hover:text-[#C02030] transition-colors font-medium">
              {lang === "es" ? "Privacidad" : "Privacy Policy"}
            </Link>
            <Link href="/terminos" className="hover:text-[#C02030] transition-colors font-medium">
              {lang === "es" ? "Términos" : "Terms"}
            </Link>
            <Link href="/documentos" className="hover:text-[#C02030] transition-colors">
              {lang === "es" ? "Legal & Pólizas" : "Legal & Policies"}
            </Link>
            <button
              type="button"
              onClick={handleIntroClick}
              className="text-xs text-gray-500 hover:text-black hover:underline cursor-pointer"
            >
              {lang === "es" ? "Ver Intro" : "Watch Intro"}
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

        {/* Copyright & Location info */}
        <div className="text-center md:text-right font-mono text-[11px]">
          <p>
            © {new Date().getFullYear()} {COMPANY_CONFIG.name}.{" "}
            {lang === "es" ? "Todos los derechos reservados." : "All rights reserved."}
          </p>
          <p className="text-gray-500 mt-0.5">
            {COMPANY_CONFIG.location.shortAddress} • Tel: {companyPhone || COMPANY_CONFIG.contact.phoneDisplay}
          </p>
        </div>
      </div>
    </footer>
  );
}
