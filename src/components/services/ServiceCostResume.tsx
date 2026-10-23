"use client";

import React from "react";
import { Route, Clock, Banknote, ShieldCheck, Warehouse, ArrowRight, Truck, Info } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface ServiceCostResumeProps {
  serviceType: string;
  distanceKm: number;
  durationMinutes: number;
  ratePerKm: number;
  baseFee: number;
  totalCostCRC: number;
  installationCostCRC?: number;
  pendingPickupInstallCostCRC?: number;
  ivaCRC?: number;
  hasCalculation: boolean;
  destinationAddress?: string;
  scheduledTime?: string;
  scheduledDate?: string;
}

export function ServiceCostResume({
  serviceType,
  distanceKm,
  durationMinutes,
  ratePerKm,
  baseFee,
  totalCostCRC,
  installationCostCRC,
  pendingPickupInstallCostCRC,
  ivaCRC,
  hasCalculation,
  destinationAddress,
  scheduledTime,
  scheduledDate,
}: ServiceCostResumeProps) {
  const { lang, t } = useLanguage();

  const isShop = serviceType === "shop_installation";

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center">
            <Banknote className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-black text-sm text-gray-900 uppercase tracking-wider">
              {t.serviceCostResumeTitle}
            </h3>
            <p className="text-[11px] text-gray-500">
              {isShop
                ? (lang === "es" ? "Instalación en Taller ZxZ (Pozos de Santa Ana)" : "ZxZ Workshop Installation (Pozos Santa Ana)")
                : (lang === "es" ? "Cálculo vial en tiempo real con OpenStreetMap y tarifas base" : "Real-time road calculation with OpenStreetMap & base rates")}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 uppercase">
          {isShop
            ? "Taller ₡0"
            : hasCalculation
            ? `${distanceKm} km`
            : (lang === "es" ? "Pendiente" : "Pending")}
        </span>
      </div>

      {/* Main Grid: Logistics Timing & Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
        {/* Left Column: Timing & Travel Dispatch Breakdown */}
        <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#C02030]" />
              <span>{t.serviceTripSummaryHeading}</span>
            </span>

            {isShop ? (
              <div className="space-y-2 pt-1">
                <div className="p-3 rounded-xl bg-white border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                  <Warehouse className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">
                    {lang === "es"
                      ? "El cliente traslada su vehículo al taller. Cero tiempo de viaje externo."
                      : "Client brings vehicle to workshop. Zero external transit time."}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 px-1">
                  <span>{lang === "es" ? "Ubicación del taller:" : "Workshop location:"}</span>
                  <span className="font-bold text-gray-900">Calle 34, Pozos</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-1 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span>{lang === "es" ? "Distancia estimada:" : "Estimated distance:"}</span>
                  <span className="font-mono font-bold text-gray-900">
                    {hasCalculation ? `${distanceKm} km` : "-- km"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>{lang === "es" ? "Tiempo estimado de llegada:" : "Estimated arrival time:"}</span>
                  <span className="font-mono font-bold text-gray-900">
                    {hasCalculation ? `~${durationMinutes} min` : "-- min"}
                  </span>
                </div>

                {destinationAddress && (
                  <div className="flex items-center justify-between pt-1 border-t border-gray-200/70 text-xs text-gray-600">
                    <span>{lang === "es" ? "Destino:" : "Destination:"}</span>
                    <span className="font-medium text-gray-900 truncate max-w-[150px] text-right" title={destinationAddress}>
                      {destinationAddress}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Schedule Summary pill if selected */}
          {scheduledDate && scheduledTime && (
            <div className="p-2.5 rounded-xl bg-white border border-gray-200 flex items-center justify-between text-xs font-medium">
              <span className="text-gray-500">{lang === "es" ? "Cita programada:" : "Scheduled slot:"}</span>
              <span className="font-bold text-gray-900">
                {scheduledDate} @ {scheduledTime}
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Financial Cost Calculation */}
        <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Route className="w-3.5 h-3.5 text-gray-600" />
              <span>{lang === "es" ? "Desglose Tarifario" : "Rate Breakdown"}</span>
            </span>

            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <span>{t.ratePerKmLabel}:</span>
                <span className="font-mono font-bold text-gray-900">
                  {isShop ? "₡0 / km" : `₡${ratePerKm.toLocaleString("es-CR")} / km`}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>{t.baseRateLabel}:</span>
                <span className="font-mono font-bold text-gray-900">
                  {isShop ? "₡0" : `₡${baseFee.toLocaleString("es-CR")}`}
                </span>
              </div>

              {!isShop && hasCalculation && (
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <span>{lang === "es" ? "Tarifa variable por km:" : "Variable per-km fee:"}</span>
                  <span className="font-mono">
                    ₡{(Math.max(0, distanceKm) * ratePerKm).toLocaleString("es-CR")}
                  </span>
                </div>
              )}

              {installationCostCRC && installationCostCRC > 0 ? (
                <div className="flex items-center justify-between pt-1.5 border-t border-gray-200/60 text-emerald-800 font-bold">
                  <span>{t.serviceOrdersInstallFeeLabel}:</span>
                  <span className="font-mono">
                    +₡{installationCostCRC.toLocaleString("es-CR")}
                  </span>
                </div>
              ) : null}

              {!isShop && ivaCRC !== undefined && ivaCRC > 0 ? (
                <div className="flex items-center justify-between pt-1.5 border-t border-gray-200/60 text-[#0052CC] font-bold">
                  <span>{t.serviceIvaTaxLabel}:</span>
                  <span className="font-mono">
                    +₡{ivaCRC.toLocaleString("es-CR")}
                  </span>
                </div>
              ) : null}

              {serviceType === "pickup" ? (
                <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 text-[11px] text-emerald-900 flex items-start gap-2">
                  <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>{lang === "es" ? "Flete Todo Incluido: " : "All-Inclusive Freight: "}</strong>
                    {t.servicePickupRoundTripNotice}
                  </span>
                </div>
              ) : null}

              {serviceType === "pickup" && pendingPickupInstallCostCRC && pendingPickupInstallCostCRC > 0 ? (
                <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 text-[11px] text-amber-900 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{t.servicePickupInstallPaidOnRetrievalNotice}</span>
                </div>
              ) : null}

              {isShop ? (
                <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 text-[11px] text-emerald-900 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t.serviceShopInstallNotice}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Grand Total Highlight */}
          <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {installationCostCRC && installationCostCRC > 0
                ? t.serviceTotalWithInstallLabel
                : isShop
                ? (lang === "es" ? "Costo de Traslado (Taller)" : "Transport Fee (Workshop)")
                : t.totalCostLabel}
            </span>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                ₡{totalCostCRC.toLocaleString("es-CR")}
              </p>
              <span className="text-[10px] font-mono text-gray-400">
                CRC (IVA inc.)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
