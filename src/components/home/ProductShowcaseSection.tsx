"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Wrench } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTouchSwipe } from "@/lib/useTouchSwipe";

interface ProductShowcaseItem {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  redirectUrl: string;
  imageUrl: string;
}

export function ProductShowcaseSection() {
  const { t, lang } = useLanguage();
  const [products, setProducts] = useState<ProductShowcaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  // State variables for smooth animation tracking and card sequence control
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<"next" | "prev" | "idle">("idle");
  const [isAnimating, setIsAnimating] = useState(false);
  const [timerProgress, setTimerProgress] = useState(0);

  // Dynamic fetch from backend database
  useEffect(() => {
    let isMounted = true;
    fetch("/api/homepage-items?type=PRODUCT", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.items)) {
          const mapped: ProductShowcaseItem[] = data.items.map((item: any) => ({
            id: item.id,
            name: lang === "en" ? item.titleEn || item.titleEs : item.titleEs,
            category: item.category,
            tagline: lang === "en" ? item.descriptionEn || item.descriptionEs : item.descriptionEs,
            description: lang === "en" ? item.descriptionEn || item.descriptionEs : item.descriptionEs,
            redirectUrl: item.redirectUrl,
            imageUrl: item.mediaUrl,
          }));
          setProducts(mapped);
        } else if (data.success) {
          setProducts([]);
        }
      })
      .catch((err) => {
        console.error("Failed to load showcase products:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [lang]);

  // Transition controller that pulls out the exact next card without jumping
  const triggerTransition = (target: number, dir: "next" | "prev") => {
    if (isAnimating || products.length === 0) return;

    setNextIndex(target);
    setDirection(dir);
    setIsAnimating(true);
    setTimerProgress(0);
    setCurrentIndex(target);
  };

  const handleNext = () => {
    if (isAnimating || products.length === 0) return;
    const target = (currentIndex + 1) % products.length;
    triggerTransition(target, "next");
  };

  const handlePrev = () => {
    if (isAnimating || products.length === 0) return;
    const target = (currentIndex - 1 + products.length) % products.length;
    triggerTransition(target, "prev");
  };

  const handleSelect = (idx: number) => {
    if (isAnimating || idx === currentIndex || products.length === 0) return;
    const dir = idx > currentIndex ? "next" : "prev";
    triggerTransition(idx, dir);
  };

  // Touch swipe gesture support for mobile phones
  const { touchHandlers, isSwiping } = useTouchSwipe({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrev,
    minDistance: 45,
  });

  // 9-second automatic cycle timer
  useEffect(() => {
    if (products.length <= 1) return;
    const CYCLE_DURATION_MS = 9000;
    const STEP_MS = 50;

    if (isAnimating) return;

    const interval = setInterval(() => {
      setTimerProgress((prev) => {
        const increment = (STEP_MS / CYCLE_DURATION_MS) * 100;
        if (prev + increment >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, STEP_MS);

    return () => clearInterval(interval);
  }, [isAnimating, currentIndex, products.length]);

  // Framer Motion spring transition variants (DJI fluid motion)
  const cardVariants = {
    enter: (dir: string) => ({
      x: dir === "next" ? 140 : dir === "prev" ? -140 : 0,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: "spring", stiffness: 280, damping: 28 },
        opacity: { duration: 0.35, ease: "easeOut" },
        scale: { duration: 0.35, ease: "easeOut" },
      },
    },
    exit: (dir: string) => ({
      x: dir === "next" ? -140 : dir === "prev" ? 140 : 0,
      opacity: 0,
      scale: 0.95,
      transition: {
        x: { type: "spring", stiffness: 280, damping: 28 },
        opacity: { duration: 0.25, ease: "easeIn" },
      },
    }),
  };

  // Rule 7: Animated Skeleton Screen while loading real backend data
  if (loading) {
    return (
      <section className="w-full bg-[#FFFFFF] text-[#1A1A1D] pt-4 sm:pt-6 pb-12 sm:pb-20 border-b border-gray-200 overflow-hidden select-none">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12">
          <div className="flex gap-6 items-center justify-center">
            <Skeleton className="hidden md:block w-1/5 lg:w-[14%] h-[540px] sm:h-[600px] lg:h-[640px] rounded-3xl opacity-40" />
            <Skeleton className="w-full md:w-[68%] lg:w-[72%] h-[620px] sm:h-[680px] lg:h-[720px] rounded-3xl" />
            <Skeleton className="hidden md:block w-1/5 lg:w-[14%] h-[540px] sm:h-[600px] lg:h-[640px] rounded-3xl opacity-40" />
          </div>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Skeleton className="w-full max-w-md h-1.5 rounded-full" />
            <Skeleton className="w-32 h-6 rounded-full" />
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  const currentProduct = products[currentIndex] || products[0];
  const prevProduct = products[(currentIndex - 1 + products.length) % products.length];
  const nextProduct = products[(currentIndex + 1) % products.length];

  return (
    <section className="w-full bg-[#FFFFFF] text-[#1A1A1D] pt-4 sm:pt-6 pb-12 sm:pb-20 border-b border-gray-200 overflow-hidden select-none">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12">
        {/* STAGE CONTAINER */}
        <div className="relative w-full flex items-center justify-center gap-4 sm:gap-6 lg:gap-8">
          {/* 1. PREVIOUS PRODUCT CARD */}
          <div
            onClick={handlePrev}
            className="hidden md:flex flex-col justify-between w-1/5 lg:w-[14%] h-[540px] sm:h-[600px] lg:h-[640px] rounded-3xl bg-gradient-to-b from-[#F7F8FA] to-[#EDEFF2] border border-gray-200/80 p-6 opacity-40 hover:opacity-75 transition-all duration-300 cursor-pointer scale-95 hover:scale-98 shadow-sm flex-shrink-0 select-none overflow-hidden"
            title={prevProduct.name}
          >
            <div className="text-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold block">
                {prevProduct.category}
              </span>
              <h4 className="text-sm font-bold text-gray-800 line-clamp-2 mt-1">
                {prevProduct.name}
              </h4>
            </div>

            <div className="relative w-full h-44 my-auto">
              <div
                className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url('${prevProduct.imageUrl}')` }}
              />
            </div>

            <div className="text-xs text-gray-500 font-medium flex items-center justify-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{t.homeProductShowcasePrevious}</span>
            </div>
          </div>

          {/* 2. ACTIVE MAIN PRODUCT CARD */}
          <div className="w-full md:w-[68%] lg:w-[72%] max-w-[1240px] h-[620px] sm:h-[680px] lg:h-[720px] relative">
            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={cardVariants}
                initial="enter"
                animate="center"
                exit="exit"
                onAnimationComplete={() => {
                  setIsAnimating(false);
                  setDirection("idle");
                  setNextIndex(null);
                }}
                {...touchHandlers}
                className="w-full h-full rounded-3xl bg-gradient-to-b from-[#FFFFFF] via-[#F8F9FA] to-[#EDEFF2] border border-gray-200/90 shadow-xl relative overflow-hidden group cursor-pointer touch-pan-y"
              >
                <Link
                  href={currentProduct.redirectUrl}
                  onClick={(e) => {
                    if (isSwiping()) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full h-full p-5 sm:p-8 lg:p-12 flex flex-col justify-between relative select-none block"
                >
                  {/* Minimalistic Studio Spotlight Backdrop */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#FFFFFF_0%,_#F5F6F8_60%,_#EAECEF_100%)] pointer-events-none" />

                  {/* Mobile Quick Chevrons for 1-Tap Swapping */}
                  {products.length > 1 && (
                    <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none z-20 sm:hidden">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handlePrev();
                        }}
                        className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-gray-800 border border-gray-200 shadow-md flex items-center justify-center pointer-events-auto active:scale-95 transition-transform"
                        aria-label={t.ariaPreviousProduct || "Producto anterior"}
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-800" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleNext();
                        }}
                        className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-gray-800 border border-gray-200 shadow-md flex items-center justify-center pointer-events-auto active:scale-95 transition-transform"
                        aria-label={t.ariaNextProduct || "Siguiente producto"}
                      >
                        <ChevronRight className="w-4 h-4 text-gray-800" />
                      </button>
                    </div>
                  )}

                  {/* TOP: Centered text with shortened title */}
                  <div className="relative z-10 flex flex-col items-center text-center space-y-2 pt-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#C02030]/10 text-[#C02030] text-[11px] font-bold uppercase tracking-wider">
                        <Wrench className="w-3 h-3" />
                        {currentProduct.category}
                      </span>
                    </div>

                    {/* Main Product Name */}
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#111827] tracking-tight text-center">
                      {currentProduct.name}
                    </h3>

                    {/* Description / Tagline */}
                    <p className="text-xs sm:text-sm text-gray-600 font-medium text-center max-w-lg mx-auto">
                      {currentProduct.tagline}
                    </p>
                  </div>

                  {/* CENTER: Product Img on Minimalistic Studio Background */}
                  <div className="relative z-0 my-4 h-64 sm:h-80 lg:h-96 w-full flex items-center justify-center overflow-hidden">
                    <div
                      className="absolute inset-0 bg-contain bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-105"
                      style={{ backgroundImage: `url('${currentProduct.imageUrl}')` }}
                    />
                    {/* Floor Shadow Reflection */}
                    <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-[#EDEFF2]/80 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* BOTTOM: Centered 'Ver Más' button */}
                  <div className="relative z-10 flex items-center justify-center pt-3 border-t border-gray-200/60">
                    <div className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#111827] group-hover:bg-[#C02030] text-white text-xs sm:text-sm font-bold shadow-md transition-all group-hover:scale-105 active:scale-95">
                      <span>{t.homeProductShowcaseViewMore}</span>
                      <ChevronRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* 3. NEXT PRODUCT CARD */}
          <div
            onClick={handleNext}
            className="hidden md:flex flex-col justify-between w-1/5 lg:w-[14%] h-[540px] sm:h-[600px] lg:h-[640px] rounded-3xl bg-gradient-to-b from-[#F7F8FA] to-[#EDEFF2] border border-gray-200/80 p-6 opacity-40 hover:opacity-75 transition-all duration-300 cursor-pointer scale-95 hover:scale-98 shadow-sm flex-shrink-0 select-none overflow-hidden"
            title={nextProduct.name}
          >
            <div className="text-center">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 font-bold block">
                {nextProduct.category}
              </span>
              <h4 className="text-sm font-bold text-gray-800 line-clamp-2 mt-1">
                {nextProduct.name}
              </h4>
            </div>

            <div className="relative w-full h-44 my-auto">
              <div
                className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url('${nextProduct.imageUrl}')` }}
              />
            </div>

            <div className="text-xs text-gray-500 font-medium flex items-center justify-center gap-1">
              <span>{t.homeProductShowcaseNext}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* BOTTOM CONTROLS & TIME BAR */}
        <div className="mt-8 flex flex-col items-center gap-4">
          {/* Animated 9s Time Bar */}
          <div className="w-full max-w-md h-1.5 bg-gray-200/90 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-[#C02030] transition-all duration-75 ease-linear rounded-full"
              style={{ width: `${timerProgress}%` }}
            />
          </div>

          {/* Controls: Prev Arrow + Dot Indicators + Next Arrow */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              disabled={isAnimating}
              aria-label={t.ariaPreviousProduct}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all border border-gray-200 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {products.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(idx)}
                  disabled={isAnimating}
                  className="p-2 -m-1 flex items-center justify-center cursor-pointer group"
                  title={p.name}
                  aria-label={`Ver producto ${p.name}`}
                >
                  <span
                    className={`h-2 rounded-full transition-all duration-300 block ${
                      currentIndex === idx
                        ? "w-8 bg-[#C02030]"
                        : "w-2 bg-gray-300 group-hover:bg-gray-400"
                    }`}
                  />
                </button>
              ))}
            </div>

            <button
              onClick={handleNext}
              disabled={isAnimating}
              aria-label={t.ariaNextProduct}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all border border-gray-200 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
