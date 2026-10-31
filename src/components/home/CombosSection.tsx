"use client";

import React, { useState, useMemo, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useGarage } from "@/context/GarageContext";
import { formatCRC } from "@/lib/i18n";
import { CatalogPagination } from "@/components/ui/CatalogPagination";
import {
  PackagePlus,
  Wrench,
  Check,
  ShoppingCart,
  Percent,
  Sparkles,
  Home,
  AlertCircle,
  Calendar,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export interface ComboData {
  id: string;
  slug: string;
  titleEs: string;
  titleEn: string;
  badgeEs: string;
  badgeEn: string;
  descriptionEs: string;
  descriptionEn: string;
  priceCRC: number;
  originalPriceCRC: number;
  installationPriceCRC: number;
  discountPercent: number;
  items: string[];
  imageUrl: string;
  homeInstallationAvailable?: boolean;
  availability?: any;
  stockStatus?: string;
  isAvailable?: boolean;
  leadDaysMin?: number;
  leadDaysMax?: number;
}

interface CombosSectionProps {
  combos: ComboData[];
}

export function CombosSection({ combos }: CombosSectionProps) {
  const { t, lang } = useLanguage();
  const { addItem } = useCart();
  const router = useRouter();

  const ITEMS_PER_PAGE = 16; // 4 combos per row × 4 rows = 16 items max per page (User Requirement)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageDirection, setPageDirection] = useState<"next" | "prev">("next");
  const gridTopRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(combos.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedCombos = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return combos.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [combos, safeCurrentPage, ITEMS_PER_PAGE]);

  const handlePageChange = (newPage: number, direction: "next" | "prev") => {
    setPageDirection(direction);
    setCurrentPage(newPage);
    if (gridTopRef.current) {
      const yOffset = -100;
      const y = gridTopRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  };

  // Track per-combo installation toggle
  const [installSelections, setInstallSelections] = useState<Record<string, boolean>>({});

  const toggleInstall = (comboId: string) => {
    setInstallSelections((prev) => ({
      ...prev,
      [comboId]: !prev[comboId],
    }));
  };

  const handleAddCombo = (combo: ComboData) => {
    const withInstallation = !!installSelections[combo.id];
    addItem({
      id: `combo-${combo.id}`,
      title: lang === "es" ? combo.titleEs : combo.titleEn,
      brand: "ZxZ Performance",
      comp: ["all"],
      priceCRC: combo.priceCRC,
      installationPriceCRC: combo.installationPriceCRC,
      withInstallation,
      homeInstallation: combo.homeInstallationAvailable ?? true,
      type: "COMBO",
      imageUrl: combo.imageUrl,
      supplierStockStatus: combo.stockStatus || combo.availability?.status || "IN_STOCK",
      supplierStockMessage: lang === "es" ? combo.availability?.summaryEs : combo.availability?.summaryEn,
      supplierLeadDaysMin: combo.leadDaysMin || combo.availability?.leadDaysMin || 7,
      supplierLeadDaysMax: combo.leadDaysMax || combo.availability?.leadDaysMax || 12,
    });
  };

  return (
    <section id="combos" className="py-20 bg-[#121214] text-[#E6E6E8] border-t border-[#2E2E34]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C02030]/15 border border-[#C02030]/40 text-xs font-semibold text-[#C02030] uppercase tracking-wider mb-3">
            <PackagePlus className="w-4 h-4" />
            <span>{t.combosTitle}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t.homeCombosSectionSubtitle}
          </h2>
          <p className="text-sm text-[#A0A0A6] mt-2 leading-relaxed">
            {t.combosSubtitle}
          </p>
        </div>

        <div ref={gridTopRef} />

        {/* Combos Cards Grid: 4 per row, max 5 rows (20 items) per page */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`combos-section-page-${safeCurrentPage}`}
            initial={{ opacity: 0, x: pageDirection === "next" ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: pageDirection === "next" ? -40 : 40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {paginatedCombos.map((combo) => {
            const hasInstall = !!installSelections[combo.id];

            return (
              <div
                key={combo.id}
                className="bg-[#1A1A1D] border border-[#2E2E34] hover:border-[#C02030]/60 rounded-2xl overflow-hidden shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Image & Badge */}
                  <div className="relative w-full h-52 bg-[#242428]">
                    <Image
                      src={combo.imageUrl}
                      alt={combo.titleEs}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 flex-wrap">
                      <div className="bg-[#C02030] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        <span>{lang === "es" ? combo.badgeEs : combo.badgeEn}</span>
                      </div>
                      {combo.stockStatus === "OUT_OF_STOCK" || combo.isAvailable === false ? (
                        <span className="bg-rose-600/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-md">
                          <AlertCircle className="w-2.5 h-2.5" />
                          <span>{t.devComboStockOutOfStock}</span>
                        </span>
                      ) : combo.stockStatus === "PRE_ORDER" ? (
                        <span className="bg-blue-600/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-md">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{t.devComboStockPreOrder}</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="absolute top-4 right-4 bg-[#121214]/90 backdrop-blur-md text-[#10B981] text-xs font-mono font-bold px-2.5 py-1 rounded-md border border-[#2E2E34]">
                      -{combo.discountPercent}% OFF
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white tracking-tight leading-snug mb-2">
                      {lang === "es" ? combo.titleEs : combo.titleEn}
                    </h3>

                    <p className="text-xs text-[#A0A0A6] leading-relaxed mb-4">
                      {lang === "es" ? combo.descriptionEs : combo.descriptionEn}
                    </p>

                    {/* Included Items Checklist */}
                    <div className="bg-[#242428] rounded-xl p-4 border border-[#2E2E34] mb-5 space-y-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#4D5660] block font-semibold">
                        {t.combosIncludes}
                      </span>
                      {combo.items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-[#E6E6E8]">
                          <Check className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* Price Block */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono text-white">
                          {formatCRC(combo.priceCRC)}
                        </span>
                        <span className="text-xs text-[#A0A0A6] line-through font-mono">
                          {formatCRC(combo.originalPriceCRC)}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#A0A0A6]">
                        {t.homeCombosNetPriceNotice}
                      </span>
                    </div>

                    {/* Installation Option Toggle & Home Installation Tag */}
                    <div className="space-y-1.5">
                      <div
                        onClick={() => toggleInstall(combo.id)}
                        className={`cursor-pointer p-3 rounded-xl border transition-all flex items-center justify-between ${
                          hasInstall
                            ? "bg-[#C02030]/10 border-[#C02030] text-white"
                            : "bg-[#242428] border-[#2E2E34] text-[#A0A0A6] hover:border-[#4D5660]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={hasInstall}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-[#C02030] focus:ring-0 bg-[#1A1A1D] border-[#2E2E34]"
                          />
                          <div className="text-xs">
                            <p className="font-semibold text-[#E6E6E8]">
                              {t.comboInstallAddon}
                            </p>
                            <p className="text-[10px] text-[#A0A0A6]">
                              {t.warrantyLaborNotice}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#C02030]">
                          {combo.installationPriceCRC === 0 ? t.comboInstallationIncluded : `+${formatCRC(combo.installationPriceCRC)}`}
                        </span>
                      </div>

                      {/* Tag visible when choosing if wants installation */}
                      {combo.homeInstallationAvailable !== false ? (
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold px-1">
                          <Home className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          <span>{t.cartHomeInstallationEligible}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] text-[#A0A0A6] font-medium px-1">
                          <Wrench className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span>{lang === "es" ? "Instalación exclusiva en taller ZxZ" : "ZxZ workshop installation only"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="p-6 pt-0">
                  {combo.stockStatus === "OUT_OF_STOCK" || combo.isAvailable === false ? (
                    <button
                      onClick={() => router.push(`/combos/${combo.slug}`)}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs tracking-wider uppercase transition-all"
                    >
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span>{t.comboViewDetails}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddCombo(combo)}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#C02030] hover:bg-[#E02A3C] text-white font-bold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(192,32,48,0.35)] transition-all"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>{t.comboAddToCart}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </motion.div>
        </AnimatePresence>

        <CatalogPagination
          currentPage={safeCurrentPage}
          totalItems={combos.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={handlePageChange}
          layoutIdPrefix="home-combos-pagination"
        />
      </div>
    </section>
  );
}
