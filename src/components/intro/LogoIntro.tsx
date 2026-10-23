"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface LogoIntroProps {
  onComplete: () => void;
}

// Exact 39-vertex silhouette contour of the ZxZ emblem (100% strictly follows logo edges)
// Clockwise from top apex (125, 20)
const FWD_PATH =
  "M 125 20 L 161 20 L 214 89 L 261 31 L 393 31 L 394 65 L 305 150 L 401 151 L 373 180 L 296 180 L 268 143 L 334 81 L 351 64 L 351 62 L 274 61 L 236 108 L 234 114 L 284 180 L 249 180 L 215 136 L 211 138 L 178 180 L 29 180 L 28 151 L 122 62 L 20 61 L 51 31 L 121 31 L 153 72 L 153 74 L 144 83 L 74 149 L 75 151 L 163 151 L 193 114 L 194 112 L 190 106 L 131 30 Z";

// Counter-clockwise from top apex (125, 20)
const REV_PATH =
  "M 125 20 L 131 30 L 190 106 L 194 112 L 193 114 L 163 151 L 75 151 L 74 149 L 144 83 L 153 74 L 153 72 L 121 31 L 51 31 L 20 61 L 122 62 L 28 151 L 29 180 L 178 180 L 211 138 L 215 136 L 249 180 L 284 180 L 234 114 L 236 108 L 274 61 L 351 62 L 351 64 L 334 81 L 268 143 L 296 180 L 373 180 L 401 151 L 305 150 L 394 65 L 393 31 L 261 31 L 214 89 L 161 20 Z";

export function LogoIntro({ onComplete }: LogoIntroProps) {
  const { t } = useLanguage();
  const [phase, setPhase] = useState<"drawing" | "flare" | "exit">("drawing");
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // 0.0s - 2.4s: Continuous fluid drawing of lines without stopping, infill fades in
    // 2.4s: Horizontal laser flare sweeps beneath the logo
    const flareTimer = setTimeout(() => {
      setPhase("flare");
    }, 2400);

    // 3.9s: Smooth exit and website reveal
    const completeTimer = setTimeout(() => {
      setPhase("exit");
      setTimeout(() => {
        onCompleteRef.current?.();
      }, 450);
    }, 3900);

    return () => {
      clearTimeout(flareTimer);
      clearTimeout(completeTimer);
    };
  }, []);

  const handleSkip = () => {
    setPhase("exit");
    setTimeout(() => {
      onCompleteRef.current?.();
    }, 100);
  };

  return (
    <AnimatePresence>
      {phase !== "exit" && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleSkip}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FAFAFA] overflow-hidden select-none cursor-pointer"
        >
          {/* Pure clean studio illumination gradient - no arbitrary grid lines */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#FFFFFF_0%,_#F7F8FA_55%,_#EDEFF2_100%)] pointer-events-none" />

          {/* Unobtrusive skip button */}
          <div className="absolute top-6 right-6 z-20 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSkip();
              }}
              className="text-xs uppercase tracking-widest font-mono text-gray-400 hover:text-[#C02030] transition-colors px-3 py-1 rounded-full border border-gray-200 hover:border-[#C02030] bg-white/80 shadow-sm"
            >
              {t.skipIntro || "Saltar"} &rarr;
            </button>
          </div>

          {/* 
            MAIN ANIMATION STAGE: Exactly 422x200 Aspect Ratio (ZxZ Emblem Only, No 'mods')
          */}
          <div className="relative w-72 sm:w-96 md:w-[480px] lg:w-[540px] aspect-[422/200] flex items-center justify-center">
            {/* 
              STEP 3 & 4: Volumetric Radial Rays / Aura (blooms smoothly behind emblem)
            */}
            <motion.div
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{
                opacity: [0, 0, 0.75, 0.45],
                scale: [0.75, 0.85, 1.25, 1.1],
              }}
              transition={{
                times: [0, 0.45, 0.75, 1],
                duration: 2.6,
                ease: "easeOut",
              }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
            >
              {/* Radial red bloom */}
              <div className="w-[160%] h-[160%] rounded-full bg-[radial-gradient(circle,_rgba(224,30,43,0.32)_0%,_rgba(192,32,48,0.14)_45%,_transparent_75%)] blur-2xl" />

              {/* Volumetric light streaks */}
              <div className="absolute w-[200%] h-20 bg-gradient-to-r from-transparent via-[#E01E2B]/30 to-transparent rotate-[-22deg] blur-md" />
              <div className="absolute w-[200%] h-20 bg-gradient-to-r from-transparent via-[#E01E2B]/30 to-transparent rotate-[22deg] blur-md" />
            </motion.div>

            {/* 
              STEPS 1, 2, 3, 4: Exact Vector Red Lines Tracing Fluidly Without Stopping
            */}
            <svg
              viewBox="0 0 422 200"
              className="absolute inset-0 w-full h-full z-10 pointer-events-none overflow-visible"
            >
              <defs>
                {/* Luminous red laser glow filter */}
                <filter id="redLaserGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="2.5" result="blur1" />
                  <feGaussianBlur stdDeviation="6" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Clockwise Fluid Stroke */}
              <motion.path
                d={FWD_PATH}
                fill="none"
                stroke="#C02030"
                strokeWidth={2.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#redLaserGlow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 2.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />

              {/* Counter-Clockwise Symmetrical Fluid Stroke */}
              <motion.path
                d={REV_PATH}
                fill="none"
                stroke="#E01E2B"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#redLaserGlow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 2.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </svg>

            {/* 
              STEPS 3 & 4: Solid Red Infill Emerging Smoothly As Lines Seal (No 'mods')
            */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{
                opacity: [0, 0, 0.55, 1],
                scale: [0.98, 0.98, 1.01, 1],
              }}
              transition={{
                times: [0, 0.5, 0.75, 1],
                duration: 2.4,
                ease: "easeInOut",
              }}
              className="absolute inset-0 z-20 pointer-events-none"
            >
              <div className="relative w-full h-full">
                <Image
                  src="/images/zxz_emblem_only.png"
                  alt="ZxZ Emblem"
                  fill
                  priority
                  className="object-contain drop-shadow-[0_4px_25px_rgba(192,32,48,0.45)]"
                />
              </div>
            </motion.div>

            {/* 
              STEP 5: Horizontal Red Shining Line Passing Directly Below the Logo Emblem
            */}
            <AnimatePresence>
              {phase === "flare" && (
                <div className="absolute top-[93%] inset-x-[-25%] h-8 flex items-center pointer-events-none z-30">
                  {/* Subtle horizontal track line directly below emblem */}
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: [0, 0.75, 0.75, 0], scaleX: [0, 1, 1, 1] }}
                    transition={{ duration: 1.3, times: [0, 0.2, 0.8, 1] }}
                    className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#C02030]/80 to-transparent"
                  />

                  {/* Horizontal Red Shining Laser Flare sweeping fluidly from left to right */}
                  <motion.div
                    initial={{ left: "-20%", opacity: 0 }}
                    animate={{
                      left: ["-20%", "50%", "120%"],
                      opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                      duration: 1.25,
                      ease: [0.25, 0.1, 0.25, 1],
                    }}
                    className="absolute w-44 sm:w-64 h-8 flex items-center justify-center -translate-x-1/2"
                  >
                    {/* Intense white laser core with red aura */}
                    <div className="w-full h-[3px] bg-white rounded-full shadow-[0_0_15px_4px_#FF2233,0_0_35px_8px_rgba(192,32,48,0.9),0_0_60px_15px_rgba(192,32,48,0.5)]" />

                    {/* Extended horizontal anamorphic flare streak */}
                    <div className="absolute w-[200%] h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />

                    {/* Center flare sparkle */}
                    <div className="absolute w-6 h-6 rounded-full bg-white blur-[1.5px] shadow-[0_0_20px_6px_#FF1E2E]" />
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
