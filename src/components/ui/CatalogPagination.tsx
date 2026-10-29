"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
    <motion.nav
      aria-label="Pagination"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="mt-10 sm:mt-12 flex items-center justify-center w-full select-none"
    >
      <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/80 backdrop-blur-md border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {/* Previous Page Arrow */}
        <motion.button
          type="button"
          whileTap={safeCurrentPage > 1 ? { scale: 0.92 } : undefined}
          disabled={safeCurrentPage <= 1}
          onClick={() => handleSelectPage(safeCurrentPage - 1)}
          title={t.paginationPrevious}
          aria-label={t.paginationPrevious}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            safeCurrentPage <= 1
              ? "text-neutral-300 cursor-default"
              : "text-neutral-500 hover:text-neutral-950 hover:bg-black/[0.04] cursor-pointer"
          }`}
        >
          <ChevronLeft className="w-4 h-4 stroke-[2]" />
        </motion.button>

        {/* Minimalist Page Numbers */}
        <div className="flex items-center gap-0.5 px-0.5">
          {pageNumbers.map((item) => {
            if (item === "ellipsis-start" || item === "ellipsis-end") {
              return (
                <span
                  key={item}
                  className="w-7 h-8 flex items-center justify-center text-xs text-neutral-400"
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
                whileTap={!isActive ? { scale: 0.92 } : undefined}
                onClick={() => handleSelectPage(item)}
                className={`relative min-w-[32px] h-8 px-2.5 rounded-full text-xs font-medium flex items-center justify-center transition-colors cursor-pointer ${
                  isActive
                    ? "text-white"
                    : "text-neutral-500 hover:text-neutral-950 hover:bg-black/[0.03]"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId={`${layoutIdPrefix}-active-pill`}
                    className="absolute inset-0 rounded-full bg-[#141414]"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{item}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Next Page Arrow */}
        <motion.button
          type="button"
          whileTap={safeCurrentPage < totalPages ? { scale: 0.92 } : undefined}
          disabled={safeCurrentPage >= totalPages}
          onClick={() => handleSelectPage(safeCurrentPage + 1)}
          title={t.paginationNext}
          aria-label={t.paginationNext}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            safeCurrentPage >= totalPages
              ? "text-neutral-300 cursor-default"
              : "text-neutral-500 hover:text-neutral-950 hover:bg-black/[0.04] cursor-pointer"
          }`}
        >
          <ChevronRight className="w-4 h-4 stroke-[2]" />
        </motion.button>
      </div>
    </motion.nav>
  );
}
