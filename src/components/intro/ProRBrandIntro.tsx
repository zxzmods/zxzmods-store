"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface ProRBrandIntroProps {
  onComplete: () => void;
}

export function ProRBrandIntro({ onComplete }: ProRBrandIntroProps) {
  const { lang, t } = useLanguage();

  // Animation timeline phases:
  // 1: "dark" (0 - 0.5s): Pure dark background, SxS hidden
  // 2: "led_sweep" (0.5s - 2.0s): White illuminated line sweeps from lowest/center position outward along LED contour
  // 3: "main_lights_ignite" (2.0s - 3.2s): Projector lights softly ignite and ramp up, Pro R emerges
  // 4: "full_shine" (3.2s+): Headlights fully illuminated, vehicle revealed, waits for scroll down
  // 5: "lift_reveal": Curtain lifts up off-screen
  const [phase, setPhase] = useState<
    "dark" | "led_sweep" | "main_lights_ignite" | "full_shine" | "lift_reveal" | "ended"
  >("dark");
  const [assetsReady, setAssetsReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const img = new window.Image();
      img.src = "/images/sxs/polaris_pror_front.png";
      if (img.complete) {
        setAssetsReady(true);
      } else {
        img.onload = () => setAssetsReady(true);
        img.onerror = () => setAssetsReady(true);
      }
    } else {
      setAssetsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!assetsReady) return;

    // Step 1 -> Step 2: Start LED light bars sweep at 0.5s
    const t1 = setTimeout(() => {
      setPhase("led_sweep");
    }, 500);

    // Step 3: Soft main lights ignition & Pro R emergence at 2.0s
    const t2 = setTimeout(() => {
      setPhase("main_lights_ignite");
    }, 2000);

    // Step 4: Peak illumination & center reveal at 3.2s (holds until scroll down)
    const t3 = setTimeout(() => {
      setPhase("full_shine");
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [assetsReady]);

  const handleProceed = () => {
    if (phase === "lift_reveal" || phase === "ended") return;
    setPhase("lift_reveal");
    setTimeout(() => {
      setPhase("ended");
      onComplete();
    }, 750);
  };

  // Scroll down detection to skip or proceed to search section
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY > 10) {
        handleProceed();
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      if (touchStartY - touchEndY > 25 || touchEndY - touchStartY > 25) {
        handleProceed();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " " || e.key === "Enter") {
        handleProceed();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [phase]);

  if (phase === "ended") return null;

  const isLedSweeping =
    phase === "led_sweep" ||
    phase === "main_lights_ignite" ||
    phase === "full_shine" ||
    phase === "lift_reveal";

  const areMainLightsOn =
    phase === "main_lights_ignite" ||
    phase === "full_shine" ||
    phase === "lift_reveal";

  const isFullShine = phase === "full_shine" || phase === "lift_reveal";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 0 }}
        animate={phase === "lift_reveal" ? { y: "-100%" } : { y: 0 }}
        transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1] }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#050505] overflow-hidden select-none"
      >
        {/* Subtle Atmospheric Vignette Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#121316_0%,_#070709_55%,_#020203_100%)] pointer-events-none" />

        {/* Brand Indicator Badge */}
        <div className="absolute top-6 left-6 z-50 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#0055B8] animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80 font-mono">
              POLARIS
            </span>
          </div>
        </div>

        {/* 
          STAGE CONTAINER: Exact 918x689 Aspect Ratio of polaris_pror_front.png
        */}
        <div className="relative w-full max-w-[600px] sm:max-w-[700px] md:max-w-[780px] aspect-[918/689] flex items-center justify-center p-4">
          
          {/* 
            Polaris Pro R Vehicle Image with Center Radial Vignette Mask
          */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: areMainLightsOn ? (isFullShine ? 0.95 : 0.55) : 0,
            }}
            transition={{
              duration: isFullShine ? 0.8 : 1.1,
              ease: "easeOut",
            }}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{
              WebkitMaskImage:
                "radial-gradient(ellipse 70% 65% at 50% 48%, rgba(0,0,0,1) 25%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.3) 70%, transparent 88%)",
              maskImage:
                "radial-gradient(ellipse 70% 65% at 50% 48%, rgba(0,0,0,1) 25%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.3) 70%, transparent 88%)",
            }}
          >
            <Image
              src="/images/sxs/polaris_pror_front.png"
              alt="Polaris RZR Pro R"
              fill
              priority
              className="object-contain"
            />
          </motion.div>

          {/* 
            SVG LIGHT CHOREOGRAPHY LAYER:
            Exact viewBox matching 918x689 image coordinates
          */}
          <svg
            viewBox="0 0 918 689"
            className="absolute inset-0 w-full h-full pointer-events-none z-30"
          >
            <defs>
              {/* Slender neon white glow filter */}
              <filter id="neon-glow-pror" x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="1.5" result="blur1" />
                <feGaussianBlur stdDeviation="3.5" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Ambient light halo filter */}
              <filter id="halo-glow-pror" x="-35%" y="-35%" width="170%" height="170%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Headlight Radial Beam Gradient */}
              <radialGradient id="headlight-beam-pror" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="55%" stopColor="#E6F2FF" stopOpacity="0.45" />
                <stop offset="80%" stopColor="#B8DEFF" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#B8DEFF" stopOpacity="0" />
              </radialGradient>

              {/* Anamorphic Horizontal Flare Gradient */}
              <linearGradient id="lens-flare-pror" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#B8DEFF" stopOpacity="0" />
                <stop offset="35%" stopColor="#E6F2FF" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <stop offset="65%" stopColor="#E6F2FF" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#B8DEFF" stopOpacity="0" />
              </linearGradient>

              {/* Downward Projector Light Beam Cone */}
              <linearGradient id="light-cone-pror" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
                <stop offset="40%" stopColor="#E6F2FF" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#B8DEFF" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* 
              STEP 2 & STEP 3: DRL LED STRIP CONTOUR DRAWING
              Starts from lowest and most center position in the light strips:
              - Left Strip starts at bottom grille fang stem (376, 386) -> curves along fang contour to top apex (400, 279)
              - Right Strip starts at bottom grille fang stem (542, 386) -> curves along fang contour to top apex (518, 279)
              (Outer horizontal lines outside the light strip have been removed)
            */}
            {isLedSweeping && (
              <g>
                {/* LEFT LED STRIP - Ambient Halo */}
                <motion.path
                  d="M 376 386 L 368 382 L 365 370 L 359 350 L 354 332 L 361 320 L 374 306 L 386 293 L 400 279"
                  fill="none"
                  stroke="#B8DEFF"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#halo-glow-pror)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.55 }}
                  transition={{ duration: 1.45, ease: [0.25, 0.1, 0.25, 1.0] }}
                />

                {/* LEFT LED STRIP - Slender Neon Core */}
                <motion.path
                  d="M 376 386 L 368 382 L 365 370 L 359 350 L 354 332 L 361 320 L 374 306 L 386 293 L 400 279"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#neon-glow-pror)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.45, ease: [0.25, 0.1, 0.25, 1.0] }}
                />

                {/* RIGHT LED STRIP - Ambient Halo */}
                <motion.path
                  d="M 542 386 L 550 382 L 553 370 L 559 350 L 564 332 L 557 320 L 544 306 L 532 293 L 518 279"
                  fill="none"
                  stroke="#B8DEFF"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#halo-glow-pror)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.55 }}
                  transition={{ duration: 1.45, ease: [0.25, 0.1, 0.25, 1.0] }}
                />

                {/* RIGHT LED STRIP - Slender Neon Core */}
                <motion.path
                  d="M 542 386 L 550 382 L 553 370 L 559 350 L 564 332 L 557 320 L 544 306 L 532 293 L 518 279"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#neon-glow-pror)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.45, ease: [0.25, 0.1, 0.25, 1.0] }}
                />
              </g>
            )}

            {/* 
              STEP 4 & STEP 5: MAIN HEADLIGHT PROJECTOR ILLUMINATION
              Left lamp center: (328, 275)
              Right lamp center: (590, 275)
            */}
            {areMainLightsOn && (
              <g>
                {/* Downward Projector Light Cones */}
                <motion.polygon
                  points="328,275 220,520 420,520"
                  fill="url(#light-cone-pror)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isFullShine ? 0.35 : 0.15 }}
                  transition={{ duration: 1.0 }}
                />
                <motion.polygon
                  points="590,275 500,520 700,520"
                  fill="url(#light-cone-pror)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isFullShine ? 0.35 : 0.15 }}
                  transition={{ duration: 1.0 }}
                />

                {/* Left Lamp Core Bloom */}
                <motion.circle
                  cx="328"
                  cy="275"
                  r={isFullShine ? "50" : "34"}
                  fill="url(#headlight-beam-pror)"
                  initial={{ scale: 0.2, opacity: 0 }}
                  animate={{ scale: [0.2, 0.6, isFullShine ? 1.15 : 0.85], opacity: [0, 0.6, 1] }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />

                {/* Right Lamp Core Bloom */}
                <motion.circle
                  cx="590"
                  cy="275"
                  r={isFullShine ? "50" : "34"}
                  fill="url(#headlight-beam-pror)"
                  initial={{ scale: 0.2, opacity: 0 }}
                  animate={{ scale: [0.2, 0.6, isFullShine ? 1.15 : 0.85], opacity: [0, 0.6, 1] }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />

                {/* Anamorphic Horizontal Flares */}
                <motion.ellipse
                  cx="328"
                  cy="275"
                  rx={isFullShine ? "130" : "80"}
                  ry={isFullShine ? "7.5" : "4"}
                  fill="url(#lens-flare-pror)"
                  initial={{ opacity: 0, scaleX: 0.2 }}
                  animate={{ opacity: isFullShine ? 0.95 : 0.5, scaleX: 1 }}
                  transition={{ duration: 0.9 }}
                />
                <motion.ellipse
                  cx="590"
                  cy="275"
                  rx={isFullShine ? "130" : "80"}
                  ry={isFullShine ? "7.5" : "4"}
                  fill="url(#lens-flare-pror)"
                  initial={{ opacity: 0, scaleX: 0.2 }}
                  animate={{ opacity: isFullShine ? 0.95 : 0.5, scaleX: 1 }}
                  transition={{ duration: 0.9 }}
                />

                {/* High-Intensity Radial Flare Stars */}
                {isFullShine && (
                  <>
                    <motion.circle
                      cx="328"
                      cy="275"
                      r="10"
                      fill="#FFFFFF"
                      filter="url(#neon-glow-pror)"
                      initial={{ scale: 0.5 }}
                      animate={{ scale: [0.5, 1.4, 1.1] }}
                      transition={{ duration: 0.5 }}
                    />
                    <motion.circle
                      cx="590"
                      cy="275"
                      r="10"
                      fill="#FFFFFF"
                      filter="url(#neon-glow-pror)"
                      initial={{ scale: 0.5 }}
                      animate={{ scale: [0.5, 1.4, 1.1] }}
                      transition={{ duration: 0.5 }}
                    />
                  </>
                )}
              </g>
            )}
          </svg>
        </div>

        {/* Scroll Down Indicator to Skip or Proceed */}
        <div
          onClick={handleProceed}
          className="absolute bottom-6 sm:bottom-8 inset-x-0 z-50 flex flex-col items-center justify-center cursor-pointer pointer-events-auto group select-none transition-transform hover:scale-105"
        >
          {/* Label on top: translated */}
          <span className="text-[11px] sm:text-xs tracking-widest uppercase font-mono text-white/80 group-hover:text-white transition-colors mb-1.5 drop-shadow-sm">
            {t.scrollDown || (lang === "es" ? "Desliza hacia abajo" : "Scroll down")}
          </span>

          {/* Two 'V' shapes one on top of the other */}
          <div className="flex flex-col items-center -space-y-1.5 text-white/90">
            <svg
              className="w-4 h-4 animate-bounce"
              style={{ animationDuration: "1.4s" }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
            <svg
              className="w-4 h-4 text-white/50 animate-bounce"
              style={{ animationDuration: "1.4s", animationDelay: "150ms" }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
