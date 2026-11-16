"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
  count?: number | string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (CustomSelectOption | string)[];
  labelPrefix?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  align?: "left" | "right";
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  ariaLabel?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  labelPrefix,
  placeholder,
  disabled = false,
  className = "",
  triggerClassName = "",
  dropdownClassName = "",
  align = "left",
  icon,
  size = "sm",
  ariaLabel,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Normalize options to CustomSelectOption objects
  const normalizedOptions: CustomSelectOption[] = options.map((opt) => {
    if (typeof opt === "string") {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find(
    (o) => o.value.toLowerCase() === value.toLowerCase()
  );

  const displayLabel = selectedOption ? selectedOption.label : placeholder || value || "";
  const displayCount = selectedOption?.count;

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Auto-scroll selected element into view when dropdown opens
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const activeEl = dropdownRef.current.querySelector<HTMLElement>('[data-selected="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs rounded-xl",
    md: "px-3 py-2 text-xs sm:text-sm rounded-xl",
    lg: "px-4 py-2.5 text-sm rounded-2xl",
  }[size];

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-label={ariaLabel || labelPrefix || placeholder}
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 bg-white hover:bg-gray-50/80 border border-gray-200 hover:border-gray-300 focus:border-[#C02030] focus:ring-2 focus:ring-[#C02030]/15 shadow-2xs text-gray-900 transition-all cursor-pointer outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed group ${sizeClasses} ${triggerClassName}`}
      >
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          {icon && <span className="shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors">{icon}</span>}
          {labelPrefix && (
            <span className="text-gray-500 font-medium shrink-0">
              {labelPrefix}
            </span>
          )}
          <span className="font-bold truncate text-gray-900">
            {displayLabel}
          </span>
          {displayCount !== undefined && displayCount !== null && (
            <span className="shrink-0 text-gray-500 font-semibold text-[11px]">
              ({displayCount})
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-200 group-hover:text-gray-700 ${
            isOpen ? "rotate-180 text-[#C02030]!" : ""
          }`}
        />
      </button>

      {/* Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute top-full mt-1.5 z-50 min-w-full w-max max-w-xs sm:max-w-sm bg-white rounded-xl border border-gray-200/90 shadow-xl py-1 px-1 max-h-64 overflow-y-auto no-scrollbar backdrop-blur-md ${
              align === "right" ? "right-0" : "left-0"
            } ${dropdownClassName}`}
          >
            {normalizedOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400 italic text-center">
                Sin opciones disponibles
              </div>
            ) : (
              normalizedOptions.map((opt) => {
                const isSelected = opt.value.toLowerCase() === value.toLowerCase();
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    data-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all text-left cursor-pointer my-0.5 select-none disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSelected
                        ? "bg-[#C02030] text-white font-bold shadow-xs"
                        : "text-gray-700 hover:bg-gray-100/90 hover:text-black font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 truncate">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="truncate">{opt.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {opt.count !== undefined && opt.count !== null && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                            isSelected
                              ? "bg-white/25 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {opt.count}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-white shrink-0 stroke-[2.5]" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
