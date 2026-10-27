"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { formatCRC, formatUSD, convertCRCToUSD } from "@/lib/i18n";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTouchSwipe } from "@/lib/useTouchSwipe";

export interface RelatedItem {
  id: string;
  type: "PRODUCT" | "COMBO";
  titleEs: string;
  titleEn: string;
  imageUrl: string;
  priceCRC: number;
  redirectUrl: string;
  category?: string;
}

interface VideoScene {
  id: string;
  title: string;
  subtitle: string;
  temporaryImage: string;
  videoUrl?: string;
  exploreLink: string;
  relatedItems: RelatedItem[];
}

export function DjiHeroSection() {
  const { t, lang } = useLanguage();
  const { currency, sellRate } = useCart();
  const [videoScenes, setVideoScenes] = useState<VideoScene[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [popupScene, setPopupScene] = useState<VideoScene | null>(null);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Close popup with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPopupScene(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Fetch dynamic video items from backend
  useEffect(() => {
    let isMounted = true;
    fetch("/api/homepage-items?type=VIDEO")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.items) && data.items.length > 0) {
          const mapped: VideoScene[] = data.items.map((item: any) => {
            let relatedItems: RelatedItem[] = [];
            if (item.relatedItemsJson) {
              try {
                const parsed = JSON.parse(item.relatedItemsJson);
                if (Array.isArray(parsed)) {
                  relatedItems = parsed;
                }
              } catch {}
            }
            return {
              id: item.id,
              title: lang === "en" ? item.titleEn || item.titleEs : item.titleEs,
              subtitle: item.category,
              temporaryImage: item.mediaUrl,
              videoUrl: item.videoUrl || "",
              exploreLink: item.redirectUrl,
              relatedItems,
            };
          });
          setVideoScenes(mapped);
        }
      })
      .catch((err) => {
        console.error("Failed to load hero video scenes:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [lang]);

  // Smooth advance to the next video
  const advanceToNext = useCallback(() => {
    if (videoScenes.length === 0) return;
    setActiveVideoIndex((currentIndex) => {
      const nextIndex = (currentIndex + 1) % videoScenes.length;
      const nextVideo = videoRefs.current[nextIndex];
      const prevVideo = videoRefs.current[currentIndex];

      // Pre-play incoming video right as crossfade starts
      if (nextVideo && nextVideo.currentSrc) {
        nextVideo.currentTime = 0;
        nextVideo.muted = true;
        const playPromise = nextVideo.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      }

      // Smoothly stop previous video after crossfade transition finishes
      if (prevVideo) {
        setTimeout(() => {
          try {
            prevVideo.pause();
            prevVideo.currentTime = 0;
          } catch {}
        }, 1100);
      }

      return nextIndex;
    });
  }, [videoScenes.length]);

  // Transition to a specific scene (when user clicks a dot)
  const transitionToScene = useCallback((targetIndex: number) => {
    setActiveVideoIndex((currentIndex) => {
      if (targetIndex === currentIndex) return currentIndex;

      const nextVideo = videoRefs.current[targetIndex];
      const prevVideo = videoRefs.current[currentIndex];

      if (nextVideo && nextVideo.currentSrc) {
        nextVideo.currentTime = 0;
        nextVideo.muted = true;
        const playPromise = nextVideo.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      }

      if (prevVideo) {
        setTimeout(() => {
          try {
            prevVideo.pause();
            prevVideo.currentTime = 0;
          } catch {}
        }, 1100);
      }

      return targetIndex;
    });
  }, []);

  // Automatic transition control
  useEffect(() => {
    if (videoScenes.length === 0) return;
    const currentVideo = videoRefs.current[activeVideoIndex];
    let watchdogTimer: NodeJS.Timeout | null = null;
    const DEFAULT_SCENE_DURATION_MS = 7000;

    if (currentVideo && currentVideo.currentSrc) {
      currentVideo.muted = true;
      currentVideo.currentTime = 0;
      const playPromise = currentVideo.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            const duration = currentVideo.duration;
            const maxWaitMs =
              duration && !isNaN(duration) && duration > 0
                ? (duration + 0.8) * 1000
                : DEFAULT_SCENE_DURATION_MS;

            watchdogTimer = setTimeout(() => {
              advanceToNext();
            }, maxWaitMs);
          })
          .catch(() => {
            watchdogTimer = setTimeout(() => {
              advanceToNext();
            }, DEFAULT_SCENE_DURATION_MS);
          });
      }
    } else {
      watchdogTimer = setTimeout(() => {
        advanceToNext();
      }, DEFAULT_SCENE_DURATION_MS);
    }

    return () => {
      if (watchdogTimer) clearTimeout(watchdogTimer);
    };
  }, [activeVideoIndex, advanceToNext, videoScenes.length]);

  // Keep active video playing when switching back to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const activeVideo = videoRefs.current[activeVideoIndex];
        if (activeVideo && activeVideo.currentSrc && !activeVideo.ended) {
          activeVideo.play().catch(() => {});
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [activeVideoIndex]);

  // Track real-time progress for the active dot indicator
  useEffect(() => {
    if (videoScenes.length === 0) return;
    let animId: number;
    const startTime = Date.now();
    const currentVideo = videoRefs.current[activeVideoIndex];

    const updateProgress = () => {
      if (
        currentVideo &&
        currentVideo.currentSrc &&
        currentVideo.duration &&
        !isNaN(currentVideo.duration) &&
        currentVideo.duration > 0
      ) {
        const pct = Math.min(100, (currentVideo.currentTime / currentVideo.duration) * 100);
        setProgress(pct);
      } else {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(100, (elapsed / 7000) * 100);
        setProgress(pct);
      }
      animId = requestAnimationFrame(updateProgress);
    };

    animId = requestAnimationFrame(updateProgress);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [activeVideoIndex, videoScenes.length]);

  // Touch swipe support for mobile phone gestures
  const { touchHandlers, isSwiping } = useTouchSwipe({
    onSwipeLeft: advanceToNext,
    onSwipeRight: () => {
      transitionToScene((activeVideoIndex - 1 + videoScenes.length) % videoScenes.length);
    },
    minDistance: 45,
  });

  // Rule 7: Animated Skeleton Screen while loading real backend data
  if (loading) {
    return (
      <section className="relative w-full h-[90vh] sm:h-screen overflow-hidden bg-black flex flex-col justify-end pb-12 sm:pb-16 border-b border-gray-200">
        <Skeleton className="absolute inset-0 bg-neutral-900" />
        <div className="relative z-20 max-w-3xl mx-auto px-4 text-center space-y-4 w-full">
          <Skeleton className="h-12 sm:h-16 w-3/4 max-w-lg mx-auto bg-neutral-800 rounded-xl" />
          <Skeleton className="h-10 w-36 mx-auto bg-neutral-800 rounded-full" />
        </div>
      </section>
    );
  }

  if (videoScenes.length === 0) {
    return null;
  }

  const currentScene = videoScenes[activeVideoIndex] || videoScenes[0];

  return (
    <section
      {...touchHandlers}
      className="relative w-full h-[90vh] sm:h-screen overflow-hidden bg-black select-none flex flex-col justify-end pb-12 sm:pb-16 border-b border-gray-200 touch-pan-y"
    >
      {/* 
        1. Stacked Dual-Layer Video/Image Container
      */}
      <div className="absolute inset-0 z-0">
        {videoScenes.map((scene, idx) => {
          const isActive = activeVideoIndex === idx;
          return (
            <div
              key={scene.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive
                  ? "opacity-100 z-10 pointer-events-auto"
                  : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* High-Resolution Poster / Base Image */}
              <div
                className="absolute inset-0 bg-cover bg-center transform scale-105 transition-transform duration-[12000ms] ease-out"
                style={{
                  backgroundImage: `url('${scene.temporaryImage}')`,
                }}
              />

              {/* Preloaded Video Element */}
              {scene.videoUrl ? (
                <video
                  ref={(el) => {
                    videoRefs.current[idx] = el;
                  }}
                  playsInline
                  muted
                  preload="auto"
                  onEnded={() => {
                    if (activeVideoIndex === idx) {
                      advanceToNext();
                    }
                  }}
                  onError={() => {
                    // Graceful fallback to background image
                  }}
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src={scene.videoUrl} type="video/mp4" />
                </video>
              ) : null}
            </div>
          );
        })}

        {/* Gradient overlays: subtle top vignette for navbar visibility, bottom vignette for text contrast */}
        <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none z-20" />
        <div className="absolute bottom-0 inset-x-0 h-72 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none z-20" />
      </div>

      {/* Mobile Swipe Navigation Floating Chevrons */}
      {videoScenes.length > 1 && (
        <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none z-30 sm:hidden">
          <button
            type="button"
            onClick={() => transitionToScene((activeVideoIndex - 1 + videoScenes.length) % videoScenes.length)}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center justify-center pointer-events-auto active:scale-95 transition-all shadow-md"
            aria-label="Video anterior"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button
            type="button"
            onClick={advanceToNext}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center justify-center pointer-events-auto active:scale-95 transition-all shadow-md"
            aria-label="Siguiente video"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {/* 
        2. Minimalist DJI Scene Dots / Switcher with Smooth Progress Fill (Comfortable Mobile Touch Areas)
      */}
      <div className="absolute bottom-6 left-4 sm:bottom-10 sm:left-10 z-30 flex items-center gap-1.5 sm:gap-2">
        {videoScenes.map((scene, idx) => {
          const isActive = activeVideoIndex === idx;
          return (
            <button
              key={scene.id}
              onClick={() => transitionToScene(idx)}
              className="p-2 -m-1.5 flex items-center justify-center cursor-pointer group"
              title={scene.title}
              aria-label={`Ver video ${scene.title}`}
            >
              <span
                className={`relative h-2 rounded-full overflow-hidden transition-all duration-300 block ${
                  isActive
                    ? "w-10 bg-white/30 shadow-md"
                    : "w-2.5 bg-white/40 group-hover:bg-white/70"
                }`}
              >
                {isActive && (
                  <span
                    className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-75 ease-linear"
                    style={{ width: `${progress}%` }}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* 
        3. Text related to Video - Minimalist with Smooth Fade
      */}
      <div className="relative z-20 max-w-3xl mx-auto px-4 text-center space-y-3 pointer-events-auto">
        <AnimatePresence mode="wait">
          <motion.h1
            key={currentScene.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.7)] leading-tight"
          >
            {currentScene.title}
          </motion.h1>
        </AnimatePresence>

        {/* Minimalist DJI Pill Button - Conocer Más */}
        <div className="flex items-center justify-center pt-2">
          {currentScene.relatedItems && currentScene.relatedItems.length >= 2 ? (
            <button
              type="button"
              onClick={() => {
                if (isSwiping()) return;
                setPopupScene(currentScene);
              }}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-full border border-white/80 hover:border-white text-xs sm:text-sm font-semibold text-white bg-black/30 hover:bg-black/50 backdrop-blur-md transition-all shadow-md hover:scale-105 cursor-pointer active:scale-95"
            >
              <span>{t.heroLearnMore || "Conocer Más"}</span>
              <ChevronRight className="w-3.5 h-3.5 text-white" />
            </button>
          ) : (
            <Link
              href={currentScene.exploreLink}
              onClick={(e) => {
                if (isSwiping()) e.preventDefault();
              }}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-full border border-white/80 hover:border-white text-xs sm:text-sm font-semibold text-white bg-black/30 hover:bg-black/50 backdrop-blur-md transition-all shadow-md hover:scale-105 active:scale-95"
            >
              <span>{t.heroLearnMore || "Conocer Más"}</span>
              <ChevronRight className="w-3.5 h-3.5 text-white" />
            </Link>
          )}
        </div>
      </div>

      {/* Related Products / Combos Modal (Triggered when video has >= 2 related items) */}
      <AnimatePresence>
        {popupScene && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPopupScene(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-3xl bg-neutral-950/95 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl text-white z-10 my-8 overflow-hidden"
            >
              {/* Top subtle ambient glow */}
              <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-blue-500/10 via-purple-500/5 to-transparent pointer-events-none" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setPopupScene(null)}
                className="absolute top-5 right-5 p-2 rounded-full text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition z-20"
                aria-label={t.heroRelatedCloseModal}
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="space-y-1.5 mb-6 pr-10">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/10 text-white/90 border border-white/10">
                    {popupScene.subtitle || "ZxZ Performance"}
                  </span>
                  <span className="text-xs text-white/50">
                    • {popupScene.relatedItems.length} {t.heroRelatedModalTitle}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {popupScene.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400">
                  {t.heroRelatedModalSubtitle}
                </p>
              </div>

              {/* Grid of Related Items */}
              <div
                className={`grid gap-4 ${
                  popupScene.relatedItems.length === 2
                    ? "grid-cols-1 sm:grid-cols-2"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                } max-h-[60vh] overflow-y-auto pr-1`}
              >
                {popupScene.relatedItems.map((item) => {
                  const displayTitle = lang === "en" ? item.titleEn || item.titleEs : item.titleEs;
                  const isCombo = item.type === "COMBO";
                  const primaryPrice =
                    currency === "USD"
                      ? formatUSD(convertCRCToUSD(item.priceCRC, sellRate))
                      : formatCRC(item.priceCRC);
                  const secondaryPrice =
                    currency === "USD"
                      ? formatCRC(item.priceCRC)
                      : `≈ ${formatUSD(convertCRCToUSD(item.priceCRC, sellRate))}`;

                  return (
                    <div
                      key={item.id}
                      className="group bg-neutral-900/90 border border-white/10 hover:border-white/30 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
                    >
                      <div>
                        {/* Image Showcase */}
                        <div className="relative w-full h-44 bg-neutral-950 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.imageUrl}
                            alt={displayTitle}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase backdrop-blur-md shadow-xs ${
                                isCombo
                                  ? "bg-purple-600/90 text-white"
                                  : "bg-emerald-600/90 text-white"
                              }`}
                            >
                              {isCombo ? t.heroRelatedComboBadge : t.heroRelatedProductBadge}
                            </span>
                          </div>
                        </div>

                        {/* Card Info */}
                        <div className="p-4 space-y-1.5">
                          {item.category && (
                            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider truncate">
                              {item.category}
                            </p>
                          )}
                          <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-2 leading-snug">
                            {displayTitle}
                          </h4>
                          <div className="pt-1 flex items-baseline gap-2 flex-wrap">
                            <span className="text-sm font-black text-white">
                              {primaryPrice}
                            </span>
                            <span className="text-[11px] text-neutral-400">
                              {secondaryPrice}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Link */}
                      <div className="p-4 pt-0">
                        <Link
                          href={item.redirectUrl}
                          onClick={() => setPopupScene(null)}
                          className="w-full py-2.5 px-4 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold transition flex items-center justify-center gap-1.5 group/btn shadow-md"
                        >
                          <span>{isCombo ? t.heroRelatedViewCombo : t.heroRelatedViewProduct}</span>
                          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom footer button */}
              <div className="pt-6 border-t border-white/10 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setPopupScene(null)}
                  className="px-5 py-2 rounded-full border border-white/20 hover:border-white/50 text-xs font-semibold text-white/80 hover:text-white transition"
                >
                  {t.heroRelatedCloseModal}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
