"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface ProductThumbnailStripProps {
  images: string[];
  activeIndex: number;
  selectedImageUrl?: string | null;
  onSelectImage: (index: number) => void;
  lang?: "es" | "en";
  className?: string;
  size?: "sm" | "md";
  theme?: "light" | "dark";
  showCounter?: boolean;
}

export function ProductThumbnailStrip({
  images,
  activeIndex,
  selectedImageUrl,
  onSelectImage,
  lang = "es",
  className = "",
  size = "md",
  theme = "light",
  showCounter = true,
}: ProductThumbnailStripProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Drag-to-scroll state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const didDragRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  // Compute active target index
  const currentIdx = selectedImageUrl
    ? images.indexOf(selectedImageUrl) >= 0
      ? images.indexOf(selectedImageUrl)
      : activeIndex
    : activeIndex;

  // Check overflow & scroll positions
  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const hasOverflow = scrollWidth > clientWidth + 4;
    setCanScrollLeft(hasOverflow && scrollLeft > 6);
    setCanScrollRight(hasOverflow && scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  // Auto-scroll to center the active thumbnail whenever it changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (currentIdx < 0 || currentIdx >= images.length) return;

    const thumbEl = container.querySelector<HTMLElement>(`[data-thumb-index="${currentIdx}"]`);
    if (thumbEl) {
      const containerWidth = container.clientWidth;
      const thumbLeft = thumbEl.offsetLeft;
      const thumbWidth = thumbEl.clientWidth;
      const targetScrollLeft = thumbLeft - containerWidth / 2 + thumbWidth / 2;

      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: "smooth",
      });
    }
  }, [currentIdx, images]);

  // Set up listeners for resize and scroll
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    updateScrollState();

    const handleScroll = () => updateScrollState();
    el.addEventListener("scroll", handleScroll, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => updateScrollState());
      resizeObserver.observe(el);
    }

    const handleResize = () => updateScrollState();
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [updateScrollState, images.length]);

  // Horizontal mouse wheel scrolling (converts deltaY to horizontal scroll)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (el.scrollWidth > el.clientWidth && e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY * 1.1;
        updateScrollState();
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [updateScrollState]);

  // Scroll buttons handler
  const scrollByDirection = (dir: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const step = Math.max(160, el.clientWidth * 0.65);
    el.scrollBy({
      left: dir === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  // Mouse Drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    didDragRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftStartRef.current = el.scrollLeft;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = x - startXRef.current;
    if (Math.abs(walk) > 5) {
      didDragRef.current = true;
    }
    el.scrollLeft = scrollLeftStartRef.current - walk;
    updateScrollState();
  };

  const handleMouseUpOrLeave = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
    }
  };

  if (!images || images.length <= 1) {
    return null;
  }

  const isDark = theme === "dark";
  const sizeClasses = size === "sm" ? "w-14 h-14 rounded-xl" : "w-20 h-20 rounded-2xl";

  return (
    <div
      className={`relative w-full group/strip ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        handleMouseUpOrLeave();
      }}
    >
      {/* Left Edge Gradient Fade */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none transition-opacity duration-300 ${
          canScrollLeft ? "opacity-100" : "opacity-0"
        } ${
          isDark
            ? "bg-gradient-to-r from-black via-black/60 to-transparent"
            : "bg-gradient-to-r from-white via-white/80 to-transparent"
        }`}
      />

      {/* Right Edge Gradient Fade */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none transition-opacity duration-300 ${
          canScrollRight ? "opacity-100" : "opacity-0"
        } ${
          isDark
            ? "bg-gradient-to-l from-black via-black/60 to-transparent"
            : "bg-gradient-to-l from-white via-white/80 to-transparent"
        }`}
      />

      {/* Left Navigation Chevron Button */}
      <button
        type="button"
        onClick={() => scrollByDirection("left")}
        aria-label={lang === "es" ? "Ver miniaturas anteriores" : "View previous thumbnails"}
        className={`absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-lg active:scale-90 ${
          canScrollLeft
            ? "opacity-90 hover:opacity-100 hover:scale-110 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        } ${
          isDark
            ? "bg-[#1f2937]/90 hover:bg-[#111827] text-white border border-white/20 backdrop-blur-md"
            : "bg-white/95 hover:bg-white text-gray-800 hover:text-black border border-gray-200/90 backdrop-blur-md"
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Right Navigation Chevron Button */}
      <button
        type="button"
        onClick={() => scrollByDirection("right")}
        aria-label={lang === "es" ? "Ver miniaturas siguientes" : "View next thumbnails"}
        className={`absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-lg active:scale-90 ${
          canScrollRight
            ? "opacity-90 hover:opacity-100 hover:scale-110 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        } ${
          isDark
            ? "bg-[#1f2937]/90 hover:bg-[#111827] text-white border border-white/20 backdrop-blur-md"
            : "bg-white/95 hover:bg-white text-gray-800 hover:text-black border border-gray-200/90 backdrop-blur-md"
        }`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Horizontal Scroll Track */}
      <div
        ref={scrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        className={`flex items-center gap-3 overflow-x-auto p-2 py-3 scroll-smooth no-scrollbar select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          WebkitOverflowScrolling: "touch",
        }}
      >
        {images.map((imgUrl, i) => {
          const isActive =
            (!selectedImageUrl && activeIndex === i) ||
            selectedImageUrl === imgUrl ||
            currentIdx === i;

          return (
            <button
              key={`${imgUrl}-${i}`}
              data-thumb-index={i}
              data-active={isActive ? "true" : "false"}
              type="button"
              onClick={(e) => {
                if (didDragRef.current) {
                  e.preventDefault();
                  return;
                }
                onSelectImage(i);
              }}
              aria-label={
                lang === "es"
                  ? `Ver imagen ${i + 1} de ${images.length}`
                  : `View image ${i + 1} of ${images.length}`
              }
              className={`relative ${sizeClasses} border-2 overflow-hidden flex-shrink-0 transition-all duration-200 cursor-pointer ${
                isActive
                  ? isDark
                    ? "border-[#C02030] ring-2 ring-[#C02030]/40 shadow-lg scale-105 z-10"
                    : "border-[#C02030] ring-2 ring-[#C02030]/25 shadow-md scale-105 z-10"
                  : isDark
                  ? "border-white/20 opacity-60 hover:opacity-100 hover:border-white/50 hover:scale-[1.02]"
                  : "border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-300 hover:scale-[1.02]"
              }`}
            >
              <Image
                src={imgUrl || "/images/logo.png"}
                alt=""
                fill
                sizes="(max-width: 768px) 80px, 96px"
                className="object-cover"
                draggable={false}
              />
            </button>
          );
        })}
      </div>

      {/* Subtle Counter / Hint when many images (> 5) */}
      {showCounter && images.length > 5 && (
        <div
          className={`flex items-center justify-between px-2 pt-0.5 text-[11px] font-medium transition-opacity duration-300 ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          <span>
            {lang === "es"
              ? `Foto ${currentIdx + 1} de ${images.length}`
              : `Photo ${currentIdx + 1} of ${images.length}`}
          </span>
          <span className="text-[10px] opacity-75 hidden sm:inline">
            {lang === "es"
              ? "Desplaza o arrastra para ver más"
              : "Scroll or drag to see more"}
          </span>
        </div>
      )}
    </div>
  );
}
