"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { getBrandLogo } from "@/lib/sxsBrands";
import { useLanguage } from "@/context/LanguageContext";
import { Car } from "lucide-react";

interface ConfigBrandLogoStageProps {
  brandSlug?: string;
  brandName?: string;
  year?: number | "";
  modelName?: string;
  category?: string;
}

export function ConfigBrandLogoStage({
  brandSlug,
  brandName,
  year,
  modelName,
  category,
}: ConfigBrandLogoStageProps) {
  const { t } = useLanguage();
  const logoUrl = getBrandLogo(brandSlug);
  const hasBrand = Boolean(brandSlug);

  return (
    <div className="w-full rounded-3xl bg-gray-50 border border-gray-200 p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[180px] sm:min-h-[220px]">
      <AnimatePresence mode="wait">
        {hasBrand ? (
          <motion.div
            key={brandSlug}
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col items-center justify-center space-y-4 w-full"
          >
            {/* Brand Logo Display Area */}
            <div className="relative w-48 sm:w-64 h-20 sm:h-24 flex items-center justify-center">
              <Image
                src={logoUrl}
                alt={brandName || "Marca"}
                fill
                priority
                className="object-contain filter drop-shadow-sm"
                sizes="(max-width: 768px) 200px, 300px"
              />
            </div>

            {/* Selected specs preview under the logo */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {year && (
                <span className="px-3 py-1 rounded-full bg-[#C02030] text-white text-xs font-black tracking-wider uppercase">
                  {year}
                </span>
              )}
              {modelName ? (
                <span className="text-sm sm:text-base font-bold text-gray-900">
                  {modelName}
                </span>
              ) : (
                <span className="text-xs text-gray-500 font-medium">
                  {brandName}
                </span>
              )}
              {category && (
                <span className="text-[11px] font-semibold text-gray-500 bg-white border border-gray-200 px-2.5 py-0.5 rounded-full">
                  {category}
                </span>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty-brand"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center text-center space-y-3 py-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-400">
              <Car className="w-7 h-7" />
            </div>
            <p className="text-xs font-medium text-gray-500 max-w-sm leading-relaxed">
              {t.garageBrandLogoSelectPrompt}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
