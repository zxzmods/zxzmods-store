"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { SXS_BRANDS, SxsBrand } from "@/lib/sxsBrands";
import { Skeleton } from "@/components/ui/Skeleton";

interface BrandCardItem {
  id: string;
  slug: string;
  title: string;
  exploreLink: string;
  sxsImageUrl: string;
  models: string[];
  descriptionEs: string;
  descriptionEn: string;
  isPaused: boolean;
}

export function DjiBrandsGrid() {
  const { lang } = useLanguage();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [brandCards, setBrandCards] = useState<BrandCardItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch only registered brands from backdoor catalog API (Zero Mock Data)
  useEffect(() => {
    let isMounted = true;
    fetch("/api/catalog/home", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        const brandList = data.data?.brands || data.brands;
        if (Array.isArray(brandList)) {
          // Zero Mock Data: only include brands with registered vehicle models
          const activeBrands = brandList.filter(
            (b: any) => Array.isArray(b.models) && b.models.length > 0
          );

          // CFMOTO is always first
          activeBrands.sort((a: any, b: any) => {
            const aIsCfmoto = (a.slug || "").toLowerCase() === "cfmoto";
            const bIsCfmoto = (b.slug || "").toLowerCase() === "cfmoto";
            if (aIsCfmoto) return -1;
            if (bIsCfmoto) return 1;
            return (a.name || a.slug).localeCompare(b.name || b.slug);
          });

          const cards: BrandCardItem[] = activeBrands.map((b: any) => {
            const known = SXS_BRANDS.find((s) => s.slug.toLowerCase() === b.slug.toLowerCase());
            const modelsList = (b.models || []).map((m: any) => m.name || m.slug);
            const modelWithImg = b.models?.find(
              (m: any) => m.imageUrl && m.imageUrl.trim().length > 0 && !m.imageUrl.includes("unsplash.com")
            );
            return {
              id: b.slug,
              slug: b.slug,
              title: b.name || known?.title || b.slug.toUpperCase(),
              exploreLink: known?.exploreLink || `/productos?sxs=${b.slug}`,
              sxsImageUrl: known?.sxsImageUrl || modelWithImg?.imageUrl || b.logoUrl || "/images/sxs/cfmoto_sxs.png",
              models: modelsList,
              descriptionEs: b.descriptionEs || known?.descriptionEs || `Especialistas en ${b.name}.`,
              descriptionEn: b.descriptionEn || known?.descriptionEn || `Specialists in ${b.name}.`,
              isPaused: false,
            };
          });
          setBrandCards(cards);
        } else {
          setBrandCards([]);
        }
      })
      .catch((err) => console.error("Error loading registered brands in DjiBrandsGrid:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePausedClick = (e: React.MouseEvent, card: BrandCardItem) => {
    e.preventDefault();
    setToastMessage(
      lang === "es"
        ? `Próximamente: La presentación y catálogo especializado para ${card.title} están en preparación.`
        : `Coming Soon: The specialized presentation and catalog for ${card.title} are being prepared.`
    );
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <section className="relative w-full bg-[#FFFFFF] text-[#1A1A1D] pt-6 sm:pt-8 pb-4 sm:pb-6 border-b border-gray-100">
      {/* Toast Notification for Paused Brands */}
      {toastMessage && (
        <div className="fixed bottom-8 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-fade-in">
          <div className="bg-[#111827] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 text-xs sm:text-sm font-medium flex items-center gap-3 max-w-md pointer-events-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Expanded to full width of the website minus horizontal padding */}
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            <div className="md:col-span-2 relative rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 p-6 sm:p-8 min-h-[350px] sm:min-h-[440px] flex flex-col justify-between">
              <div className="flex flex-col items-center space-y-3">
                <Skeleton className="h-10 w-56 rounded-xl" />
                <Skeleton className="h-8 w-36 rounded-full" />
              </div>
              <div className="h-52 sm:h-64 w-full flex items-center justify-center">
                <Skeleton className="h-44 w-2/3 rounded-2xl" />
              </div>
              <div className="h-2" />
            </div>
            {[1, 2].map((i) => (
              <div
                key={i}
                className="relative rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 p-6 sm:p-8 min-h-[350px] sm:min-h-[390px] flex flex-col justify-between"
              >
                <div className="flex flex-col items-center space-y-3">
                  <Skeleton className="h-8 w-44 rounded-xl" />
                  <Skeleton className="h-6 w-32 rounded-full" />
                </div>
                <div className="h-44 sm:h-52 w-full flex items-center justify-center">
                  <Skeleton className="h-36 w-3/4 rounded-2xl" />
                </div>
                <div className="h-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            {brandCards.map((card) => {
              const isOdd = brandCards.length % 2 !== 0;
              const isHeroTop = isOdd && card.slug.toLowerCase() === "cfmoto";

              const cardInner = (
                <>
                  {/* TOP: Brand Name and Action Pill */}
                  <div className="relative z-10 flex flex-col items-center text-center space-y-2.5 pt-1">
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-black text-[#111827] tracking-tight ${
                          isHeroTop ? "text-3xl sm:text-5xl md:text-6xl" : "text-2xl sm:text-4xl"
                        }`}
                      >
                        {card.title}
                      </h3>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#111827] text-white group-hover:bg-[#C02030] text-xs sm:text-sm font-semibold transition-all duration-300 shadow-sm group-hover:shadow group-hover:scale-105">
                      <span>
                        {lang === "es"
                          ? "Explorar productos"
                          : "Explore Products"}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* CENTER: Isolated SxS vehicle PNG with studio floor shadow */}
                  <div
                    className={`relative z-0 my-3 sm:my-4 w-full flex items-center justify-center ${
                      isHeroTop ? "h-52 sm:h-64 md:h-80" : "h-44 sm:h-52"
                    }`}
                  >
                    <div
                      className={`relative w-full h-full ${
                        isHeroTop ? "max-w-2xl" : "max-w-xl"
                      }`}
                    >
                      <Image
                        src={card.sxsImageUrl}
                        alt={`${card.title} SxS`}
                        fill
                        className="object-contain transition-transform duration-700 ease-out group-hover:scale-105 drop-shadow-md"
                        priority={card.id === "cfmoto"}
                        sizes={
                          isHeroTop
                            ? "(max-width: 768px) 100vw, 100vw"
                            : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        }
                      />
                    </div>

                    {/* Studio Floor Soft Vignette */}
                    <div className="absolute bottom-1 inset-x-12 sm:inset-x-24 h-5 bg-gradient-to-t from-gray-300/40 to-transparent blur-md rounded-full pointer-events-none" />
                  </div>

                  {/* Bottom Spacer */}
                  <div className="relative z-10 w-full h-1" />
                </>
              );

              return (
                <Link
                  key={card.id}
                  href={card.exploreLink}
                  className={`relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#F7F8FA] via-[#FFFFFF] to-[#EDEFF2] border border-gray-200/90 hover:border-gray-300 transition-all duration-300 flex flex-col justify-between p-6 sm:p-8 group shadow-sm hover:shadow-md cursor-pointer select-none min-h-[350px] sm:min-h-[390px] ${
                    isHeroTop ? "md:col-span-2 md:min-h-[460px] lg:min-h-[480px]" : ""
                  }`}
                >
                  {cardInner}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
