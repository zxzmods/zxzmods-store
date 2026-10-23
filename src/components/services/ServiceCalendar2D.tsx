"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ServiceCalendar2DProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateString: string) => void;
  minDate?: string; // YYYY-MM-DD
  maxMonthsAhead?: number;
  fullyBlockedDates?: string[];
  blockedReasons?: Record<string, string>;
}

const MONTH_NAMES_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Setiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const MONTH_NAMES_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const WEEKDAY_NAMES_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ServiceCalendar2D({
  selectedDate,
  onSelectDate,
  minDate,
  maxMonthsAhead = 3,
  fullyBlockedDates = [],
  blockedReasons = {},
}: ServiceCalendar2DProps) {
  const { lang, t } = useLanguage();

  // Compute minimum selectable date (tomorrow by default)
  const defaultMinDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  })();
  const effectiveMinDate = minDate || defaultMinDate;

  // Initial month view set to either selectedDate month or minimum date month
  const initialDate = selectedDate ? new Date(selectedDate + "T12:00:00") : new Date(effectiveMinDate + "T12:00:00");

  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-indexed

  // Boundary checks for navigation
  const minMonthDate = new Date(effectiveMinDate + "T12:00:00");
  const minYear = minMonthDate.getFullYear();
  const minMonth = minMonthDate.getMonth();

  const maxMonthDate = new Date(minMonthDate);
  maxMonthDate.setMonth(maxMonthDate.getMonth() + maxMonthsAhead);
  const maxYear = maxMonthDate.getFullYear();
  const maxMonth = maxMonthDate.getMonth();

  const canGoPrev =
    currentYear > minYear || (currentYear === minYear && currentMonth > minMonth);
  const canGoNext =
    currentYear < maxYear || (currentYear === maxYear && currentMonth < maxMonth);

  const handlePrevMonth = () => {
    if (!canGoPrev) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Calendar calculations
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  // Monday start offset: 0 for Mon, 6 for Sun
  const firstDayOfWeek = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

  const monthName =
    lang === "es" ? MONTH_NAMES_ES[currentMonth] : MONTH_NAMES_EN[currentMonth];
  const weekdays = lang === "es" ? WEEKDAY_NAMES_ES : WEEKDAY_NAMES_EN;

  // Format date nicely for display badge
  const formatFormattedDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day, 12, 0, 0);

    const dayName = d.toLocaleDateString(lang === "es" ? "es-CR" : "en-US", {
      weekday: "long",
    });
    const monthLabel =
      lang === "es" ? MONTH_NAMES_ES[month] : MONTH_NAMES_EN[month];
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${day} ${monthLabel} ${year}`;
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-xs space-y-3.5 transition-all">
      {/* Calendar Header with Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-[#C02030]" />
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
            {monthName} {currentYear}
          </h4>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={!canGoPrev}
            aria-label={t.calendarPrevMonth}
            className="p-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            disabled={!canGoNext}
            aria-label={t.calendarNextMonth}
            className="p-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday Names Header Row */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {weekdays.map((w, idx) => (
          <div
            key={w}
            className="text-[10px] font-bold uppercase py-1 text-gray-500"
          >
            {w}
          </div>
        ))}
      </div>

      {/* 2D Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {/* Leading empty slots for the first week */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-9 sm:h-10" />
        ))}

        {/* Days of current month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const monthString = String(currentMonth + 1).padStart(2, "0");
          const dayString = String(dayNum).padStart(2, "0");
          const dateString = `${currentYear}-${monthString}-${dayString}`;

          // Check if date is in the past or fully blocked (Sundays are enabled)
          const isPast = dateString < effectiveMinDate;
          const isFullyBlocked = fullyBlockedDates.includes(dateString);
          const isDisabled = isPast || isFullyBlocked;
          const isSelected = selectedDate === dateString;
          const blockReason = blockedReasons[dateString];
          const isRutaBarrial = blockReason === "Ruta BarrialCR";

          return (
            <button
              key={dateString}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectDate(dateString)}
              title={
                isFullyBlocked
                  ? isRutaBarrial
                    ? "Ruta BarrialCR (No disponible para servicios)"
                    : (lang === "es" ? "Día completamente reservado" : "Day fully booked")
                  : isPast
                  ? (lang === "es" ? "Fecha no disponible" : "Unavailable date")
                  : dateString
              }
              className={`h-9 sm:h-10 rounded-xl text-xs font-bold flex flex-col items-center justify-center relative transition-all ${
                isSelected
                  ? "bg-[#C02030] text-white font-black shadow-md shadow-[#C02030]/30 scale-105 z-10"
                  : isFullyBlocked
                  ? isRutaBarrial
                    ? "text-amber-900 bg-amber-50/90 border border-amber-300 cursor-not-allowed select-none"
                    : "text-red-700 bg-red-50/80 border border-red-200 cursor-not-allowed select-none"
                  : isDisabled
                  ? "text-gray-300 bg-gray-50/50 cursor-not-allowed border border-transparent"
                  : "text-gray-800 bg-gray-50 hover:bg-red-50/70 hover:border-[#C02030]/40 border border-gray-100 active:scale-95"
              }`}
            >
              <span className={isFullyBlocked ? "line-through" : ""}>{dayNum}</span>
              {isSelected && (
                <span className="w-1 h-1 rounded-full bg-white mt-0.5" />
              )}
              {isFullyBlocked && !isSelected && (
                <span
                  className={`w-1 h-1 rounded-full mt-0.5 ${
                    isRutaBarrial ? "bg-amber-600" : "bg-red-600"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Summary & Legend */}
      <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px]">
        {selectedDate ? (
          <div className="flex items-center gap-1.5 text-gray-900 font-bold">
            <span className="w-2 h-2 rounded-full bg-[#C02030]" />
            <span className="capitalize">{formatFormattedDate(selectedDate)}</span>
          </div>
        ) : (
          <span className="text-gray-400 italic font-medium">
            {t.calendarSelectDate}
          </span>
        )}

        <div className="flex items-center gap-3 text-[10px] text-gray-400 self-end sm:self-auto">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-[#C02030]" />
            <span>{lang === "es" ? "Elegido" : "Selected"}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-gray-200" />
            <span>{lang === "es" ? "No disp." : "Unavailable"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
