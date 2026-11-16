"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useGarage, ActiveVehicle } from "@/context/GarageContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { X, CheckCircle2, Car, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { sortVehicleModels, getModelFamilyName } from "@/lib/sxsBrands";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface YMMData {
  years: number[];
  brands: {
    slug: string;
    name: string;
    models: {
      slug: string;
      name: string;
      category: string;
      imageUrl?: string | null;
      pickupServiceAvailable?: boolean;
      years: number[];
    }[];
  }[];
}

export function GarageModal() {
  const { isModalOpen, closeModal, setVehicle, vehicle } = useGarage();
  const { user, requireAuth } = useAuth();
  const { t } = useLanguage();

  const [ymmData, setYmmData] = useState<YMMData | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState<number | "">("");
  const [selectedBrandSlug, setSelectedBrandSlug] = useState<string>("");
  const [selectedModelSlug, setSelectedModelSlug] = useState<string>("");

  useEffect(() => {
    if (isModalOpen && !ymmData) {
      setLoading(true);
      fetch("/api/catalog/ymm")
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            setYmmData(res.data);
          }
        })
        .catch((err) => console.error("Error loading YMM data:", err))
        .finally(() => setLoading(false));
    }
  }, [isModalOpen, ymmData]);

  // Prepopulate if vehicle already exists
  useEffect(() => {
    if (vehicle && isModalOpen) {
      setSelectedYear(vehicle.year);
      setSelectedBrandSlug(vehicle.brandSlug);
      setSelectedModelSlug(vehicle.modelSlug);
    }
  }, [vehicle, isModalOpen]);

  if (!isModalOpen) return null;

  const currentBrand = ymmData?.brands.find((b) => b.slug === selectedBrandSlug);
  // Filter models that support the selected year, sorted canonically
  const availableModels = useMemo(() => {
    if (!currentBrand?.models) return [];
    const filtered = currentBrand.models.filter((m) =>
      selectedYear ? m.years.includes(Number(selectedYear)) : true
    );
    return sortVehicleModels(filtered);
  }, [currentBrand, selectedYear]);

  // Group available models by family for organized presentation
  const groupedModels = useMemo(() => {
    if (!availableModels || availableModels.length === 0) return [];
    const map = new Map<string, typeof availableModels>();
    availableModels.forEach((m) => {
      const fam = getModelFamilyName(m);
      if (!map.has(fam)) map.set(fam, []);
      map.get(fam)!.push(m);
    });
    return Array.from(map.entries()).map(([family, fModels]) => ({
      family,
      models: sortVehicleModels(fModels),
    }));
  }, [availableModels]);

  const handleSave = () => {
    if (!selectedYear || !selectedBrandSlug || !selectedModelSlug || !ymmData) return;

    const brand = ymmData.brands.find((b) => b.slug === selectedBrandSlug);
    const model = brand?.models.find((m) => m.slug === selectedModelSlug);

    if (brand && model) {
      const executeSave = () => {
        const newVehicle: ActiveVehicle = {
          year: Number(selectedYear),
          brandSlug: brand.slug,
          brandName: brand.name,
          modelSlug: model.slug,
          modelName: model.name,
          category: model.category,
          imageUrl: model.imageUrl || undefined,
          pickupServiceAvailable: model.pickupServiceAvailable,
        };
        setVehicle(newVehicle);
      };

      if (!user) {
        requireAuth(executeSave, t.authGatingGarageReason);
        return;
      }

      executeSave();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white border border-gray-200 rounded-3xl shadow-2xl p-5 sm:p-8 text-[#1A1A1D] max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={closeModal}
          className="absolute top-5 right-5 text-gray-400 hover:text-black p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#C02030]/10 flex items-center justify-center text-[#C02030]">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-[#111827]">
              {t.garageModalTitle}
            </h3>
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t.garageFirstTimeNotice}</span>
            </p>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-6 leading-relaxed">
          {t.garageModalSubtitle}
        </p>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-sm text-gray-500 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#C02030]" />
            <span>{t.loadingVehicleData}</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Step 1: Select Year */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                {t.garageSelectYear}
              </label>
              <CustomSelect
                value={selectedYear ? String(selectedYear) : ""}
                onChange={(v) => {
                  setSelectedYear(v ? Number(v) : "");
                  setSelectedModelSlug("");
                }}
                placeholder="-- Seleccionar Año / Year --"
                size="md"
                className="w-full"
                triggerClassName="w-full py-3 px-4 rounded-xl text-sm"
                options={[
                  { value: "", label: "-- Seleccionar Año / Year --" },
                  ...(ymmData?.years || []).map((y) => ({
                    value: String(y),
                    label: String(y),
                  })),
                ]}
              />
            </div>

            {/* Step 2: Select Brand */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                {t.garageSelectBrand}
              </label>
              <CustomSelect
                disabled={!selectedYear}
                value={selectedBrandSlug}
                onChange={(v) => {
                  setSelectedBrandSlug(v);
                  setSelectedModelSlug("");
                }}
                placeholder="-- Seleccionar Marca / Make --"
                size="md"
                className="w-full"
                triggerClassName="w-full py-3 px-4 rounded-xl text-sm"
                options={[
                  { value: "", label: "-- Seleccionar Marca / Make --" },
                  ...(ymmData?.brands || []).map((b) => ({
                    value: b.slug,
                    label: b.name,
                  })),
                ]}
              />
            </div>

            {/* Step 3: Select Model */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                {t.garageSelectModel}
              </label>
              <CustomSelect
                disabled={!selectedBrandSlug}
                value={selectedModelSlug}
                onChange={setSelectedModelSlug}
                placeholder="-- Seleccionar Modelo / Model --"
                size="md"
                className="w-full"
                triggerClassName="w-full py-3 px-4 rounded-xl text-sm"
                options={[
                  { value: "", label: "-- Seleccionar Modelo / Model --" },
                  ...(availableModels || []).map((m) => ({
                    value: m.slug,
                    label: `${m.name} (${m.category})`,
                  })),
                ]}
              />
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3 items-center justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-medium text-gray-600 hover:text-black transition-colors"
              >
                {t.garageCancelBtn}
              </button>

              <button
                type="button"
                disabled={!selectedYear || !selectedBrandSlug || !selectedModelSlug}
                onClick={handleSave}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#C02030] hover:bg-[#E02A3C] disabled:opacity-50 text-white font-semibold text-xs tracking-wider uppercase shadow-md transition-all"
              >
                <span>{t.garageSaveBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Direct link to Full Garage Screen */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <Link
                href="/garaje"
                onClick={closeModal}
                className="hover:text-[#C02030] font-semibold flex items-center gap-1 transition-colors"
              >
                <span>
                  {t.garageFleetTitle} →
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
