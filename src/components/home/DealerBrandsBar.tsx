"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

interface DealerBrandItem {
  id: string;
  slug?: string;
  name: string;
  logoUrl: string;
  redirectUrl?: string;
  order?: number;
}

export function DealerBrandsBar() {
  const { t } = useLanguage();
  const [brands, setBrands] = useState<DealerBrandItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic fetch from database via public API route (Zero Mock Data)
  useEffect(() => {
    let isMounted = true;
    fetch("/api/dealer-brands")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.brands)) {
          setBrands(data.brands);
        } else {
          setBrands([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching dealer brands:", err);
        setBrands([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Duplicate items to form a seamless infinite rotating wheel track
  const duplicatedBrands = useMemo(() => {
    if (brands.length === 0) return [];
    // Ensure sufficient items for unbroken continuous rotation
    const repeatCount = Math.max(4, Math.ceil(24 / brands.length));
    return Array.from({ length: repeatCount }, () => brands).flat();
  }, [brands]);

  // Rule 7: Animated Skeleton Screen while loading real data
  if (loading) {
    return (
      <section
        aria-hidden="true"
        className="w-full pt-8 pb-4 sm:pt-10 sm:pb-5 bg-white dark:bg-[#121214] flex items-center justify-center select-none"
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="relative h-[116px] sm:h-[128px] w-full rounded-2xl bg-gradient-to-r from-gray-50/70 via-white to-gray-50/70 dark:from-[#151518]/90 dark:via-[#18181C]/90 dark:to-[#151518]/90 border border-gray-200/70 dark:border-zinc-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center justify-around px-8 overflow-hidden">
            <div className="hidden sm:flex items-center justify-between w-full gap-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 sm:h-12 w-28 sm:w-36 rounded-xl bg-gray-200/70 dark:bg-zinc-800/70 animate-pulse"
                />
              ))}
            </div>
            <div className="flex sm:hidden items-center justify-around w-full gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-24 rounded-lg bg-gray-200/70 dark:bg-zinc-800/70 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // If no dealer brands are configured in database, cleanly don't render
  if (brands.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={t.dealerBrandsAriaLabel || "Marcas oficiales y distribuidas"}
      className="w-full pt-8 pb-4 sm:pt-10 sm:pb-5 bg-white dark:bg-[#121214] flex items-center justify-center select-none"
    >
      {/* 
        Bounded within margins - doesn't expand to the extreme edges of the website
      */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div
          className="relative h-[116px] sm:h-[128px] w-full rounded-2xl bg-gradient-to-r from-gray-50/70 via-white to-gray-50/70 dark:from-[#151518]/90 dark:via-[#18181C]/90 dark:to-[#151518]/90 border border-gray-200/70 dark:border-zinc-800/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex items-center overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          }}
        >
          {/* Left Edge Gradient Fade */}
          <div
            aria-hidden="true"
            className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 z-20 pointer-events-none bg-gradient-to-r from-white via-white/80 to-transparent dark:from-[#121214] dark:via-[#121214]/80 dark:to-transparent"
          />

          {/* Right Edge Gradient Fade */}
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 z-20 pointer-events-none bg-gradient-to-l from-white via-white/80 to-transparent dark:from-[#121214] dark:via-[#121214]/80 dark:to-transparent"
          />

          {/* 
            Rotating Horizontal Track (Wheel Animation)
            Pauses smoothly on hover to allow clicking comfortably on any brand logo
          */}
          <div className="dealer-brands-wheel flex items-center whitespace-nowrap will-change-transform">
            {duplicatedBrands.map((brand, idx) => {
              // Redirects to custom search redirect or product brand filter
              const searchRedirectUrl =
                brand.redirectUrl?.trim() ||
                `/productos?brand=${encodeURIComponent(brand.name)}`;

              const tooltipText = (
                t.dealerBrandsTooltip || "Ver productos de {brand}"
              ).replace("{brand}", brand.name);

              return (
                <Link
                  key={`${brand.id}-${idx}`}
                  href={searchRedirectUrl}
                  title={tooltipText}
                  aria-label={tooltipText}
                  className="group relative flex-shrink-0 flex items-center justify-center px-6 sm:px-10 h-full py-2 transition-transform duration-300 hover:scale-105 select-none"
                >
                  <div className="relative h-10 sm:h-12 w-28 sm:w-36 flex items-center justify-center">
                    <Image
                      src={brand.logoUrl}
                      alt={brand.name}
                      fill
                      unoptimized={brand.logoUrl.startsWith("http")}
                      className="object-contain filter grayscale opacity-65 group-hover:grayscale-0 group-hover:opacity-100 dark:opacity-75 dark:group-hover:opacity-100 transition-all duration-300 drop-shadow-sm"
                      sizes="(max-width: 768px) 112px, 144px"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Embedded CSS for hardware-accelerated continuous horizontal wheel rotation */}
      <style jsx>{`
        @keyframes dealerWheelScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .dealer-brands-wheel {
          animation: dealerWheelScroll 34s linear infinite;
        }

        .dealer-brands-wheel:hover {
          animation-play-state: paused;
        }

        @media (max-width: 640px) {
          .dealer-brands-wheel {
            animation-duration: 26s;
          }
        }
      `}</style>
    </section>
  );
}
