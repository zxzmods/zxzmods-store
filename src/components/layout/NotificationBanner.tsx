"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useGarage } from "@/context/GarageContext";
import { useLanguage } from "@/context/LanguageContext";
import { Wrench, X, ChevronRight } from "lucide-react";

export function NotificationBanner() {
  const pathname = usePathname();
  const { vehicle, openModal } = useGarage();
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Condition 1: Only appears on the home screen
    if (pathname !== "/") {
      setIsVisible(false);
      return;
    }

    // Condition 2: No vehicle configured
    if (vehicle) {
      setIsVisible(false);
      return;
    }

    // Condition 3: Only appears when opening the website for the first time
    const hasBeenPrompted = sessionStorage.getItem("zxz_vehicle_reminder_shown");
    if (hasBeenPrompted) {
      return;
    }

    // Condition 4: Appears after 5s of opening the website
    const timer = setTimeout(() => {
      if (pathname === "/" && !vehicle && !isDismissed) {
        setIsVisible(true);
        sessionStorage.setItem("zxz_vehicle_reminder_shown", "true");
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [pathname, vehicle, isDismissed]);

  // If dismissed, already has vehicle, not on home screen, or timer hasn't fired: do not render
  if (!isVisible || isDismissed || vehicle || pathname !== "/") {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  return (
    <div className="fixed top-[72px] sm:top-24 inset-x-0 z-40 px-3 sm:px-4 pointer-events-none flex justify-center transition-all duration-500 ease-out animate-fade-in">
      <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-gray-200/90 text-[#1A1A1D] py-2 sm:py-2.5 px-3 sm:px-5 rounded-2xl sm:rounded-full shadow-xl flex items-center justify-between gap-2 sm:gap-3 text-xs max-w-2xl w-full ring-1 ring-black/5">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 truncate">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#C02030]/10 flex items-center justify-center text-[#C02030]">
            <Wrench className="w-3.5 h-3.5" />
          </span>
          <p className="text-gray-800 truncate font-semibold text-[11px] sm:text-xs">
            <span className="hidden sm:inline">{t.bannerTitle}</span>
            <span className="sm:hidden">{t.bannerTitleShort}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <button
            onClick={() => {
              openModal();
              handleDismiss();
            }}
            className="flex items-center gap-1 px-3 sm:px-3.5 py-1.5 rounded-full bg-[#C02030] hover:bg-[#A01825] text-white transition-all text-[11px] sm:text-xs font-bold shadow-sm hover:scale-105 whitespace-nowrap"
          >
            <span className="hidden sm:inline">{t.bannerAction}</span>
            <span className="sm:hidden">{t.bannerActionShort}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
          <button
            onClick={handleDismiss}
            aria-label={t.bannerDismiss}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
