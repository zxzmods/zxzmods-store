"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export interface CatalogPaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number, direction: "next" | "prev") => void;
  layoutIdPrefix?: string;
}

export function CatalogPagination({
  currentPage,
  totalItems,
  itemsPerPage = 20,
  onPageChange,
  layoutIdPrefix = "catalog-pagination",
}: CatalogPaginationProps) {
  const { t } = useLanguage();

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(totalItems, safeCurrentPage * itemsPerPage);
  const progressPercent = totalPages > 1 ? (safeCurrentPage / totalPages) * 100 : 100;

  // Build visible page numbers with ellipsis for large page counts
  const pageNumbers = useMemo(() => {
    const pages: Array<number | "ellipsis-start" | "ellipsis-end"> = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    if (safeCurrentPage > 3) {
      pages.push("ellipsis-start");
    }

    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (safeCurrentPage < totalPages - 2) {
      pages.push("ellipsis-end");
    }

    pages.push(totalPages);
    return pages;
  }, [totalPages, safeCurrentPage]);

  if (totalItems === 0) return null;

  const handleSelectPage = (targetPage: number) => {
    if (targetPage < 1 || targetPage > totalPages || targetPage === safeCurrentPage) return;
    const dir = targetPage > safeCurrentPage ? "next" : "prev";
    onPageChange(targetPage, dir);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mt-10 sm:mt-12 w-full"
    >
      <div className="bg-[#F8F9FA]/95 backdrop-blur-md border border-gray-200/90 rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col gap-3.5">
        {/* Top Animated Progress Track (DJI Minimalist Telemetry Bar) */}
        <div className="w-full h-1 bg-gray-200/80 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#111827] via-[#C02030] to-[#E02A3C] rounded-full"
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Animated Item Range & Page Status */}
          <div className="flex items-center gap-2.5 text-xs text-gray-600 font-medium">
            <AnimatePresence mode="wait">
              <motion.span
                key={`${startItem}-${endItem}-${totalItems}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center gap-1.5"
              >
                <span>{t.paginationShowing}</span>
                <strong className="font-mono font-bold text-[#111827] bg-white px-2 py-0.5 rounded-lg border border-gray-200 shadow-2xs">
                  {startItem}–{endItem}
                </strong>
                <span>{t.paginationOf}</span>
                <strong className="font-mono font-bold text-[#111827]">{totalItems}</strong>
              </motion.span>
            </AnimatePresence>

            <span className="text-gray-300">•</span>

            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-500">
              {t.paginationPage}{" "}
              <strong className="text-[#C02030] font-bold">{safeCurrentPage}</strong> / {totalPages}
            </span>
          </div>

          {/* Right: Interactive Animated Page Changer Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
            {/* First Page Quick Jump (when > 3 pages) */}
            {totalPages > 3 && (
              <motion.button
                type="button"
                whileHover={safeCurrentPage > 1 ? { scale: 1.06 } : undefined}
                whileTap={safeCurrentPage > 1 ? { scale: 0.94 } : undefined}
                disabled={safeCurrentPage <= 1}
                onClick={() => handleSelectPage(1)}
                className={`w-9 h-9 rounded-2xl border flex items-center justify-center transition-colors ${
                  safeCurrentPage <= 1
                    ? "bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:text-[#111827] shadow-2xs cursor-pointer"
                }`}
                aria-label="First page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </motion.button>
            )}

            {/* Previous Page Button */}
            <motion.button
              type="button"
              whileHover={safeCurrentPage > 1 ? { scale: 1.03, x: -2 } : undefined}
              whileTap={safeCurrentPage > 1 ? { scale: 0.96 } : undefined}
              disabled={safeCurrentPage <= 1}
              onClick={() => handleSelectPage(safeCurrentPage - 1)}
              className={`px-3.5 h-9 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                safeCurrentPage <= 1
                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white border-gray-200 text-[#111827] hover:border-[#C02030] hover:text-[#C02030] shadow-2xs cursor-pointer"
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{t.paginationPrevious}</span>
            </motion.button>

            {/* Page Number Pills with DJI Spring Active Indicator */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-gray-200 shadow-2xs">
              {pageNumbers.map((item) => {
                if (item === "ellipsis-start" || item === "ellipsis-end") {
                  return (
                    <span
                      key={item}
                      className="w-7 h-7 flex items-center justify-center text-xs font-mono text-gray-400 select-none"
                    >
                      …
                    </span>
                  );
                }

                const isActive = item === safeCurrentPage;
                return (
                  <motion.button
                    key={item}
                    type="button"
                    whileHover={!isActive ? { scale: 1.08 } : undefined}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleSelectPage(item)}
                    className={`relative min-w-[32px] h-8 px-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-center transition-colors cursor-pointer ${
                      isActive ? "text-white" : "text-gray-700 hover:text-[#111827]"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId={`${layoutIdPrefix}-active-pill`}
                        className="absolute inset-0 rounded-xl bg-[#C02030] shadow-sm shadow-[#C02030]/30"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{item}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Next Page Button */}
            <motion.button
              type="button"
              whileHover={safeCurrentPage < totalPages ? { scale: 1.03, x: 2 } : undefined}
              whileTap={safeCurrentPage < totalPages ? { scale: 0.96 } : undefined}
              disabled={safeCurrentPage >= totalPages}
              onClick={() => handleSelectPage(safeCurrentPage + 1)}
              className={`px-3.5 h-9 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                safeCurrentPage >= totalPages
                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-[#111827] border-[#111827] text-white hover:bg-[#C02030] hover:border-[#C02030] shadow-xs cursor-pointer"
              }`}
            >
              <span className="hidden xs:inline">{t.paginationNext}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>

            {/* Last Page Quick Jump (when > 3 pages) */}
            {totalPages > 3 && (
              <motion.button
                type="button"
                whileHover={safeCurrentPage < totalPages ? { scale: 1.06 } : undefined}
                whileTap={safeCurrentPage < totalPages ? { scale: 0.94 } : undefined}
                disabled={safeCurrentPage >= totalPages}
                onClick={() => handleSelectPage(totalPages)}
                className={`w-9 h-9 rounded-2xl border flex items-center justify-center transition-colors ${
                  safeCurrentPage >= totalPages
                    ? "bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:text-[#111827] shadow-2xs cursor-pointer"
                }`}
                aria-label="Last page"
              >
                <ChevronsRight className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
