"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { getBrandLogo } from "@/lib/sxsBrands";
import { resolveVehicleImage } from "@/lib/products";
import { useLanguage } from "@/context/LanguageContext";
import { Car } from "lucide-react";

interface ConfigBrandLogoStageProps {
  brandSlug?: string;
  brandName?: string;
  year?: number | "";
  modelName?: string;
  modelSlug?: string;
  imageUrl?: string | null;
  category?: string;
  defaultVehicleImageUrl?: string | null;
  brandLogoUrl?: string | null;
}

export function ConfigBrandLogoStage({
  brandSlug,
  brandName,
  year,
  modelName,
  modelSlug,
  imageUrl,
  category,
  defaultVehicleImageUrl,
  brandLogoUrl,
}: ConfigBrandLogoStageProps) {
  const { t, lang } = useLanguage();
  const effectiveLogo = brandLogoUrl || getBrandLogo(brandSlug);
  const hasBrand = Boolean(brandSlug);

  // Resolve best vehicle image:
  // 1. Model specific image if model selected
  // 2. resolveVehicleImage logic (including modelSlug or brandDefaultVehicleImageUrl)
  // 3. Brand's default vehicle image from backdoor (applied immediately even before picking a model!)
  // 4. Fallback to brand logo
  const resolvedVehicleImg = (() => {
    if (imageUrl && imageUrl.trim() && imageUrl !== "null" && imageUrl !== "undefined") {
      return imageUrl.trim();
    }
    if (modelName) {
      const fromResolver = resolveVehicleImage({
        imageUrl,
        modelSlug,
        modelName,
        brandSlug,
        brandName,
        brandDefaultVehicleImageUrl: defaultVehicleImageUrl,
      });
      if (fromResolver && fromResolver !== "/images/logo.png") {
        return fromResolver;
      }
    }
    if (
      defaultVehicleImageUrl &&
      defaultVehicleImageUrl.trim() &&
      defaultVehicleImageUrl !== "null" &&
      defaultVehicleImageUrl !== "undefined"
    ) {
      return defaultVehicleImageUrl.trim();
    }
    return null;
  })();

  const [imgError, setImgError] = useState(false);

  // Reset img error whenever brand or model changes
  useEffect(() => {
    setImgError(false);
  }, [brandSlug, modelSlug, imageUrl, defaultVehicleImageUrl]);

  const displayImage = imgError || !resolvedVehicleImg ? effectiveLogo : resolvedVehicleImg;
  const isShowingVehicle = displayImage === resolvedVehicleImg && displayImage !== effectiveLogo;

  return (
    <div className="w-full rounded-3xl bg-gray-50 border border-gray-200 p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[190px] sm:min-h-[230px]">
      <AnimatePresence mode="wait">
        {hasBrand ? (
          <motion.div
            key={`${brandSlug}-${modelSlug || "base"}-${displayImage}`}
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex flex-col items-center justify-center space-y-4 w-full"
          >
            {/* Vehicle or Brand Logo Display Area */}
            <div className="relative w-56 sm:w-72 h-28 sm:h-36 flex items-center justify-center">
              <Image
                src={displayImage}
                alt={modelName ? `${brandName} ${modelName}` : brandName || "Marca"}
                fill
                priority
                className="object-contain filter drop-shadow-sm transition-all duration-300"
                sizes="(max-width: 768px) 240px, 320px"
                onError={() => setImgError(true)}
              />
            </div>

            {/* Selected specs preview under the vehicle/image */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {year && (
                <span className="px-3 py-1 rounded-full bg-[#C02030] text-white text-xs font-black tracking-wider uppercase shadow-xs">
                  {year}
                </span>
              )}

              {/* Brand Pill with Logo if vehicle image is shown */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-800 shadow-xs">
                {isShowingVehicle && effectiveLogo && (
                  <div className="relative w-4 h-4 flex-shrink-0">
                    <Image
                      src={effectiveLogo}
                      alt={brandName || "Logo"}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                <span>{brandName}</span>
              </div>

              {modelName ? (
                <span className="text-xs sm:text-sm font-extrabold text-gray-900 bg-white border border-gray-200 px-3 py-1 rounded-full shadow-xs">
                  {modelName}
                </span>
              ) : (
                <span className="text-[11px] text-gray-400 font-medium italic">
                  {lang === "es" ? "Selecciona un modelo" : "Select a model"}
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
