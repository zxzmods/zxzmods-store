"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingConcierge } from "@/components/home/FloatingConcierge";
import { GarageModal } from "@/components/garage/GarageModal";
import { ConfigBrandLogoStage } from "@/components/garage/ConfigBrandLogoStage";
import { GarageRegisterSkeleton } from "@/components/garage/GarageRegisterSkeleton";
import { useGarage } from "@/context/GarageContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeft,
  AlertCircle,
  Save,
  X,
  Sparkles,
} from "lucide-react";

interface YMMModel {
  slug: string;
  name: string;
  category: string;
  imageUrl?: string | null;
  years: number[];
}

interface YMMBrand {
  slug: string;
  name: string;
  logoUrl?: string | null;
  models: YMMModel[];
}

interface YMMResponseData {
  years: number[];
  brands: YMMBrand[];
}

export default function RegisterVehiclePage() {
  const router = useRouter();
  const { vehicles, maxVehicles, addRegisteredVehicle } = useGarage();
  const { user, requireAuth } = useAuth();
  const { t, lang } = useLanguage();

  const [ymmData, setYmmData] = useState<YMMResponseData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Simplified form selection states (Year, Brand, Model only)
  const [selectedYear, setSelectedYear] = useState<number | "">("");
  const [selectedBrandSlug, setSelectedBrandSlug] = useState<string>("");
  const [selectedModelSlug, setSelectedModelSlug] = useState<string>("");

  // Check capacity limit without displaying the number
  const isLimitReached = vehicles.length >= maxVehicles;

  useEffect(() => {
    let isMounted = true;
    setDataLoading(true);

    fetch("/api/catalog/ymm")
      .then((res) => res.json())
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setYmmData(res.data);
          // Default to latest year (e.g. 2027) if available
          if (res.data.years && res.data.years.length > 0) {
            setSelectedYear(res.data.years[0]);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load vehicle catalog for configurator:", err);
      })
      .finally(() => {
        if (isMounted) setDataLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const currentBrand = ymmData?.brands.find((b) => b.slug === selectedBrandSlug);

  // Filter models strictly by the selected year.
  // For example: Z10 only exists in 2026/2027, so for 2025 and below, it will NOT appear.
  const availableModels = currentBrand?.models.filter((m) =>
    selectedYear ? m.years.includes(Number(selectedYear)) : true
  );

  const currentModel = availableModels?.find((m) => m.slug === selectedModelSlug);

  // Handle year change: filter models and remove selectedModel if no longer available in the new year
  const handleYearChange = (newYear: number | "") => {
    setSelectedYear(newYear);

    if (!newYear) {
      setSelectedModelSlug("");
      return;
    }

    if (selectedModelSlug && currentBrand) {
      const modelStillAvailable = currentBrand.models.some(
        (m) => m.slug === selectedModelSlug && m.years.includes(Number(newYear))
      );
      if (!modelStillAvailable) {
        setSelectedModelSlug("");
      }
    }
  };

  const handleBrandChange = (newBrandSlug: string) => {
    setSelectedBrandSlug(newBrandSlug);
    setSelectedModelSlug("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYear || !selectedBrandSlug || !selectedModelSlug || !currentBrand || !currentModel) {
      setErrorMessage(
        lang === "es"
          ? "Por favor completa el año, marca y modelo del vehículo."
          : "Please complete the year, make, and model."
      );
      return;
    }

    if (isLimitReached) {
      setErrorMessage(t.garageRegisterErrorLimit);
      return;
    }

    const executeSubmit = async () => {
      setIsSubmitting(true);
      setErrorMessage(null);

      const payload = {
        year: Number(selectedYear),
        brandSlug: currentBrand.slug,
        brandName: currentBrand.name,
        modelSlug: currentModel.slug,
        modelName: currentModel.name,
        category: currentModel.category,
        imageUrl: currentModel.imageUrl || undefined,
        setAsActive: true,
      };

      const res = await addRegisteredVehicle(payload);
      setIsSubmitting(false);

      if (res.success) {
        router.push("/garaje");
      } else {
        setErrorMessage(res.error || t.garageRegisterErrorLimit);
      }
    };

    if (!user) {
      requireAuth(executeSubmit, t.authGatingGarageReason);
      return;
    }

    executeSubmit();
  };

  return (
    <div className="relative min-h-screen bg-[#FFFFFF] text-[#1A1A1D] flex flex-col justify-between selection:bg-[#C02030] selection:text-white">
      <NotificationBanner />
      <Navbar />
      <GarageModal />
      <CartDrawer />
      <FloatingConcierge />

      <main className="flex-1 w-full px-4 sm:px-6 md:px-8 lg:px-12 pt-20 sm:pt-24 pb-20">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <Link
            href="/garaje"
            className="hover:text-black flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.garageManageBreadcrumb}</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-900">{t.garageRegisterBreadcrumb}</span>
        </div>

        {/* Real Loading Skeleton */}
        {dataLoading ? (
          <GarageRegisterSkeleton />
        ) : (
          <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            {/* Header info (without 'bahia de configuracion' text and without capacity number) */}
            <div className="space-y-1 pb-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#111827]">
                {t.garageRegisterTitle}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                {t.garageRegisterSubtitle}
              </p>
            </div>

            {/* Capacity Limit Warning if already at capacity (without showing the number) */}
            {isLimitReached && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-amber-800 text-xs sm:text-sm">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">{t.garageMaxNotice}</p>
                  <p className="text-xs text-amber-700">
                    {lang === "es"
                      ? "Tu garaje ha alcanzado su capacidad máxima. Para añadir este nuevo vehículo, elimina uno desde tu garaje."
                      : "Your garage has reached its maximum capacity. To add this new vehicle, remove one from your garage."}
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex items-center justify-between gap-3 text-red-700 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="p-1 hover:text-red-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 
              TOP SPACE: WHERE THE LOGO SITS WHEN CONFIGURING THE VEHICLE
              (Clean dedicated area on top showing the brand logo)
            */}
            <ConfigBrandLogoStage
              brandSlug={selectedBrandSlug}
              brandName={currentBrand?.name}
              year={selectedYear}
              modelName={currentModel?.name}
              category={currentModel?.category}
            />

            {/* SPECIFICATIONS CONFIGURATION FORM (Simplified: Year, Make, Model only) */}
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm space-y-6"
            >
              <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">
                    {t.garageTelemetrySpecs}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {lang === "es"
                      ? "Selecciona el año, marca y modelo para verificar calce y compatibilidad."
                      : "Select the year, make, and model to verify fitment and compatibility."}
                  </p>
                </div>

                {selectedYear && Number(selectedYear) === 2027 && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    <span>2027 Ready</span>
                  </span>
                )}
              </div>

              {/* Grid: Year, Make, Model */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Year */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    {t.garageYearLabel} <span className="text-[#C02030]">*</span>
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) =>
                      handleYearChange(e.target.value ? Number(e.target.value) : "")
                    }
                    className="w-full bg-gray-50 border border-gray-300 focus:border-[#C02030] rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none transition-colors shadow-sm"
                  >
                    <option value="">{t.garageSelectPlaceholder}</option>
                    {ymmData?.years.map((y) => (
                      <option key={y} value={y}>
                        {y} {y === 2027 ? "🔥 (2027)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Brand / Make */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    {t.garageBrandLabel} <span className="text-[#C02030]">*</span>
                  </label>
                  <select
                    disabled={!selectedYear}
                    value={selectedBrandSlug}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 focus:border-[#C02030] disabled:opacity-40 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none transition-colors shadow-sm"
                  >
                    <option value="">{t.garageSelectPlaceholder}</option>
                    {ymmData?.brands.map((b) => (
                      <option key={b.slug} value={b.slug}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Model (Filtered strictly by selected year) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                    {t.garageModelLabel} <span className="text-[#C02030]">*</span>
                  </label>
                  <select
                    disabled={!selectedBrandSlug}
                    value={selectedModelSlug}
                    onChange={(e) => setSelectedModelSlug(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 focus:border-[#C02030] disabled:opacity-40 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none transition-colors shadow-sm"
                  >
                    <option value="">{t.garageSelectPlaceholder}</option>
                    {availableModels?.map((m) => (
                      <option key={m.slug} value={m.slug}>
                        {m.name} ({m.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-gray-100">
                <Link
                  href="/garaje"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:text-black hover:bg-gray-50 text-center transition-colors"
                >
                  {t.garageCancelVehicleCta}
                </Link>

                <button
                  type="submit"
                  disabled={
                    !selectedYear ||
                    !selectedBrandSlug ||
                    !selectedModelSlug ||
                    isLimitReached ||
                    isSubmitting
                  }
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#C02030] hover:bg-[#A01825] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#C02030]/25 transition-all hover:scale-[1.02]"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? lang === "es"
                        ? "Registrando..."
                        : "Saving..."
                      : t.garageSaveVehicleCta}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
