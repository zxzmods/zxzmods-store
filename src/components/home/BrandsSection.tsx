"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useGarage } from "@/context/GarageContext";
import { ChevronRight, ShieldCheck, Car } from "lucide-react";

export interface BrandData {
  id: string;
  slug: string;
  name: string;
  descriptionEs: string;
  descriptionEn: string;
  models: {
    id: string;
    slug: string;
    name: string;
    category: string;
    years: number[];
  }[];
}

interface BrandsSectionProps {
  brands: BrandData[];
}

export function BrandsSection({ brands }: BrandsSectionProps) {
  const { t, lang } = useLanguage();
  const { setVehicle, vehicle, openModal } = useGarage();

  const handleSelectModel = (
    brandSlug: string,
    brandName: string,
    modelSlug: string,
    modelName: string,
    years: number[]
  ) => {
    // Pick most recent year by default
    const latestYear = years.length > 0 ? years[0] : 2024;
    setVehicle({
      year: latestYear,
      brandSlug,
      brandName,
      modelSlug,
      modelName,
    });
  };

  return (
    <section id="brands" className="py-20 bg-[#121214] text-[#E6E6E8] border-t border-[#2E2E34]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#242428] border border-[#2E2E34] text-xs font-semibold text-[#C02030] uppercase tracking-wider mb-2">
              <Car className="w-3.5 h-3.5" />
              <span>{t.brandsTitle}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {t.homeSpecializedBrandsTitle}
            </h2>
            <p className="text-sm text-[#A0A0A6] mt-1 max-w-xl">
              {t.brandsSubtitle}
            </p>
          </div>

          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C02030] hover:text-[#E02A3C] transition-colors"
          >
            <span>{t.homeConfigureFullVehicle}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Brands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="group relative bg-[#1A1A1D] hover:bg-[#242428] border border-[#2E2E34] hover:border-[#C02030]/50 rounded-2xl p-6 transition-all duration-300 shadow-lg flex flex-col justify-between"
            >
              <div>
                {/* Brand Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-black text-white group-hover:text-[#C02030] transition-colors tracking-tight">
                    {brand.name}
                  </h3>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-[#242428] border border-[#2E2E34] text-[#A0A0A6]">
                    {brand.models.length} {t.homeModelsCountLabel}
                  </span>
                </div>

                <p className="text-xs text-[#A0A0A6] leading-relaxed mb-5">
                  {lang === "es" ? brand.descriptionEs : brand.descriptionEn}
                </p>

                {/* Models List */}
                <div className="space-y-2 mb-6">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#4D5660] block">
                    {t.homePopularModelsLabel}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {brand.models.map((model) => {
                      const isSelected =
                        vehicle?.brandSlug === brand.slug &&
                        vehicle?.modelSlug === model.slug;

                      return (
                        <button
                          key={model.id}
                          onClick={() =>
                            handleSelectModel(
                              brand.slug,
                              brand.name,
                              model.slug,
                              model.name,
                              model.years
                            )
                          }
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                            isSelected
                              ? "bg-[#10B981]/15 border-[#10B981] text-[#10B981] font-semibold"
                              : "bg-[#242428] hover:bg-[#2E2E34] border-[#2E2E34] text-[#E6E6E8] hover:border-[#C02030]/40"
                          }`}
                        >
                          {isSelected && "✓ "}
                          {model.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card Footer CTA */}
              <button
                onClick={() => openModal()}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#242428] hover:bg-[#C02030] text-[#E6E6E8] hover:text-white border border-[#2E2E34] hover:border-[#C02030] text-xs font-semibold transition-all mt-2"
              >
                <span>{t.brandsViewModels}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
