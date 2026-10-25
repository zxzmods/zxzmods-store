"use client";

import React, { useState } from "react";
import {
  MapPin,
  Navigation,
  ExternalLink,
  Clock,
  Compass,
  Layers,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface GoogleMapsRouteViewerProps {
  originAddress: string;
  originLat: number;
  originLng: number;
  destinationName: string;
  destinationLat?: number | null;
  destinationLng?: number | null;
  distanceKm: number;
  durationMinutes: number;
  googleMapsDirectionsUrl: string;
  googleMapsEmbedUrl: string;
  wazeUrl: string;
  isCalculating: boolean;
}

export function GoogleMapsRouteViewer({
  originAddress,
  originLat,
  originLng,
  destinationName,
  destinationLat,
  destinationLng,
  distanceKm,
  durationMinutes,
  googleMapsDirectionsUrl,
  googleMapsEmbedUrl,
  wazeUrl,
  isCalculating,
}: GoogleMapsRouteViewerProps) {
  const { lang, t } = useLanguage();
  const [mapLoaded, setMapLoaded] = useState(false);

  // Ensure embedded route map always enforces Spanish / English and Costa Rica region
  const sanitizedEmbedUrl = React.useMemo(() => {
    if (!googleMapsEmbedUrl) return "";
    const targetLang = lang === "en" ? "en" : "es";
    if (googleMapsEmbedUrl.includes("hl=") || googleMapsEmbedUrl.includes("language=")) {
      return googleMapsEmbedUrl;
    }
    const separator = googleMapsEmbedUrl.includes("?") ? "&" : "?";
    return `${googleMapsEmbedUrl}${separator}hl=${targetLang}&gl=CR`;
  }, [googleMapsEmbedUrl, lang]);

  return (
    <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-sm flex flex-col transition-all relative isolate z-0">
      {/* Route Header HUD Bar */}
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Origin Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-800 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#C02030] animate-pulse" />
            <span className="truncate max-w-[150px] sm:max-w-none">
              {lang === "es" ? "Calle 34, Pozos" : "Calle 34, Pozos"}
            </span>
          </div>

          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />

          {/* Destination Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-900 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="truncate max-w-[150px] sm:max-w-none">
              {destinationName || (lang === "es" ? "Destino" : "Destination")}
            </span>
          </div>
        </div>

        {/* Live Distance & Duration Stats Badge */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black text-white text-xs font-black tracking-wide">
            <Navigation className="w-3.5 h-3.5 text-[#C02030]" />
            <span>{distanceKm > 0 ? `${distanceKm} km` : "-- km"}</span>
          </div>
          {durationMinutes > 0 && (
            <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-200/80 text-gray-800 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span>~{durationMinutes} min</span>
            </div>
          )}
        </div>
      </div>

      {/* Visual Google Maps Canvas Frame */}
      <div className="relative w-full h-80 sm:h-96 md:h-[420px] bg-slate-100 overflow-hidden">
        {/* Loading overlay while calculating */}
        {isCalculating && (
          <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-xs flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-gray-200 shadow-lg">
              <div className="w-6 h-6 border-2 border-[#C02030] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-gray-800">
                {t.calculatingRoute}
              </span>
            </div>
          </div>
        )}

        {/* Google Maps Embed iframe */}
        <iframe
          src={sanitizedEmbedUrl}
          title="Google Maps Route"
          className="w-full h-full border-0 filter saturate-[0.95]"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setMapLoaded(true)}
        />

        {/* Floating Origin Pin Label (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-gray-200 shadow-md">
            <MapPin className="w-4 h-4 text-[#C02030] shrink-0" />
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {lang === "es" ? "Taller ZxZ Mods" : "ZxZ Mods Shop"}
              </p>
              <p className="text-xs font-black text-gray-900 leading-tight">
                Calle 34, Pozos, Santa Ana
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* External Direct Action Buttons */}
      <div className="p-4 sm:px-6 bg-white border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-gray-500 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-gray-400" />
          <span>
            {lang === "es"
              ? "Cálculo real de ruta vial desde Calle 34 Pozos Santa Ana"
              : "Road route calculation from Calle 34 Pozos Santa Ana"}
          </span>
        </p>

        <div className="flex items-center gap-2">
          {/* Waze Link */}
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:text-black border border-gray-200 hover:bg-gray-50 transition"
          >
            <span>{t.openWazeBtn}</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </a>

          {/* Google Maps Link */}
          <a
            href={googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-black hover:bg-gray-800 transition shadow-sm"
          >
            <Navigation className="w-3.5 h-3.5 text-[#C02030]" />
            <span>{t.openGoogleMapsBtn}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </div>
      </div>
    </div>
  );
}
