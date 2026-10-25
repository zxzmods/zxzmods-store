"use client";

import React from "react";
import { Clock, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export interface TimeSlotItem {
  time: string; // "10:00"
  time12: string; // "10:00 AM"
  timeMinutes: number;
  available: boolean;
  reason?: string | null;
  reasonEn?: string | null;
  departureTime?: string;
  returnTime?: string;
  carriesOverToNextDay?: boolean;
  carryoverHours?: number;
}

interface ServiceTimeSlotPickerProps {
  slots: TimeSlotItem[];
  selectedTime: string;
  onSelectTime: (time: string) => void;
  isLoading?: boolean;
  isFullDayBlocked?: boolean;
  fullDayReason?: string | null;
  travelMinutes?: number;
  serviceType?: string;
  installationDurationMinutes?: number;
  hasSelectedOrder?: boolean;
}

export function ServiceTimeSlotPicker({
  slots,
  selectedTime,
  onSelectTime,
  isLoading = false,
  isFullDayBlocked = false,
  fullDayReason = null,
  travelMinutes = 0,
  serviceType = "delivery",
  installationDurationMinutes = 60,
  hasSelectedOrder = false,
}: ServiceTimeSlotPickerProps) {
  const { lang, t } = useLanguage();

  if (isLoading) {
    return (
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-40 bg-gray-200 rounded animate-pulse" />
        </div>
        {/* Animated Skeleton Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-xl bg-gray-100 border border-gray-200 relative overflow-hidden animate-pulse"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isFullDayBlocked) {
    return (
      <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-300 text-red-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-red-700">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          <span>{lang === "es" ? "Día Bloqueado para Despachos" : "Day Blocked for Dispatches"}</span>
        </div>
        <p className="text-xs text-red-800 leading-relaxed font-medium">
          {fullDayReason || t.serviceHomeInstallFullDayNote}
        </p>
        <p className="text-[11px] text-red-600 font-mono">
          {lang === "es"
            ? "Por favor selecciona otra fecha disponible en el calendario."
            : "Please select another available date in the calendar."}
        </p>
      </div>
    );
  }

  const availableCount = slots.filter((s) => s.available).length;
  const blockedCount = slots.length - availableCount;

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span>{t.serviceSelectedTime}</span>
        </label>
        <span className="text-[10px] font-mono font-bold text-gray-400">
          8:00 AM — 8:00 PM
        </span>
      </div>

      {/* Info summary about estimated transit time */}
      {travelMinutes > 0 && serviceType !== "shop_installation" && (
        <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200/80 text-[11px] text-gray-600 flex items-start gap-2">
          <Clock className="w-3.5 h-3.5 text-[#C02030] shrink-0 mt-0.5" />
          <span>
            {lang === "es"
              ? `Tiempo de traslado estimado: ~${travelMinutes} min hasta tu ubicación.`
              : `Estimated transit time: ~${travelMinutes} min to your location.`}
          </span>
        </div>
      )}

      {/* Time Slots Grid (8:00 AM to 8:00 PM) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {slots.map((slot) => {
          const isSelected = selectedTime === slot.time;
          const isBlocked = !slot.available;

          if (isBlocked) {
            return (
              <div
                key={slot.time}
                title={slot.reason || (lang === "es" ? "Horario no disponible" : "Time slot unavailable")}
                className="group relative p-2.5 rounded-xl border border-red-300 bg-red-50/70 text-red-700 flex flex-col justify-center items-center cursor-not-allowed select-none transition-all shadow-2xs overflow-hidden"
              >
                {/* Visual red blocked badge */}
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold line-through tracking-tight text-red-800">
                    {slot.time12}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-red-600 mt-0.5">
                  {lang === "es" ? "Bloqueado" : "Blocked"}
                </span>

                {/* Hover popover tooltip with specific reason */}
                {slot.reason && (
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 p-2 rounded-lg bg-gray-950 text-white text-[10px] leading-snug shadow-xl opacity-0 group-hover:opacity-100 transition z-30">
                    <p className="font-semibold text-red-400 mb-0.5 flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {lang === "es" ? "Horario Ocupado" : "Slot Occupied"}
                    </p>
                    <p className="text-gray-200">
                      {lang === "es" ? slot.reason : slot.reasonEn || slot.reason}
                    </p>
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={slot.time}
              type="button"
              onClick={() => onSelectTime(slot.time)}
              className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center relative ${
                isSelected
                  ? "bg-black text-white border-black shadow-md ring-2 ring-black/15 scale-[1.02]"
                  : "bg-white text-gray-900 border-gray-200 hover:border-black hover:bg-gray-50/80 shadow-2xs"
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="text-xs font-black tracking-tight">
                  {slot.time12}
                </span>
                {isSelected && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                )}
              </div>
              <span
                className={`text-[9px] font-medium mt-0.5 ${
                  isSelected ? "text-gray-300" : "text-emerald-700 font-bold"
                }`}
              >
                {lang === "es" ? "Disponible" : "Available"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer stats / guide */}
      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-100">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>{availableCount} {lang === "es" ? "disponibles" : "available"}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          <span>{blockedCount} {lang === "es" ? "bloqueados" : "blocked"}</span>
        </span>
      </div>
    </div>
  );
}
