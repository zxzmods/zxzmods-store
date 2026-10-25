"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { Navigation, Clock, ChevronRight, MousePointerClick, MapPin } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface LeafletInteractiveMapProps {
  originLat: number;
  originLng: number;
  originAddress: string;
  destinationLat?: number | null;
  destinationLng?: number | null;
  destinationName?: string;
  distanceKm: number;
  durationMinutes: number;
  isCalculating: boolean;
  routeGeometry?: [number, number][];
  isShopInstallation?: boolean;
  onLocationSelect: (lat: number, lng: number, addressName?: string) => void;
}

export default function LeafletInteractiveMap({
  originLat,
  originLng,
  originAddress,
  destinationLat,
  destinationLng,
  destinationName,
  distanceKm,
  durationMinutes,
  isCalculating,
  routeGeometry,
  isShopInstallation,
  onLocationSelect,
}: LeafletInteractiveMapProps) {
  const { lang, t } = useLanguage();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const originMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const polylineGlowRef = useRef<L.Polyline | null>(null);

  // Store onLocationSelect in a ref to keep map lifecycle stable across re-renders
  const onLocationSelectRef = useRef(onLocationSelect);
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // Keep map tiles language synced in Spanish (or English) to prevent Chinese character fallbacks
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const targetLang = lang === "en" ? "en" : "es";
    tileLayerRef.current.setUrl(
      `https://{s}.google.com/vt/lyrs=m&hl=${targetLang}&gl=CR&x={x}&y={y}&z={z}`
    );
  }, [lang]);

  // Initialize Map ONCE on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Calle 34, Pozos, Santa Ana
    const map = L.map(mapContainerRef.current, {
      center: [originLat, originLng],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Google Maps standard roadmap tiles with strict Spanish language & Costa Rica region parameters
    // &hl=es&gl=CR ensures that labels are strictly rendered in Spanish and never fallback to Chinese
    const targetLang = lang === "en" ? "en" : "es";
    const googleRoadmap = L.tileLayer(
      `https://{s}.google.com/vt/lyrs=m&hl=${targetLang}&gl=CR&x={x}&y={y}&z={z}`,
      {
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
      }
    );
    googleRoadmap.addTo(map);
    tileLayerRef.current = googleRoadmap;

    // Custom Origin Icon (ZxZ Red Pin)
    const originIcon = L.divIcon({
      className: "custom-garage-marker",
      html: `
        <div style="
          width: 36px;
          height: 36px;
          background: #C02030;
          border: 3px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 4px 14px rgba(192, 32, 48, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 900;
          font-size: 14px;
        ">
          ★
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const originMarker = L.marker([originLat, originLng], {
      icon: originIcon,
      title: "Taller ZxZ Mods (Calle 34, Pozos, Santa Ana)",
    }).addTo(map);

    originMarker.bindPopup(
      `<div style="font-family: inherit; font-size: 12px; font-weight: bold; color: #111827;">
        Taller ZxZ Mods
        <div style="font-size: 10px; color: #6B7280; font-weight: normal;">Calle 34, Pozos, Santa Ana</div>
      </div>`
    );
    originMarkerRef.current = originMarker;

    // Handle Click on map to select location immediately
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      onLocationSelectRef.current(lat, lng);
    });

    mapInstanceRef.current = map;

    // Force map to compute correct container dimensions
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [originLat, originLng]);

  // Synchronize destination marker and route polyline when destination or road geometry changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isShopInstallation) {
      if (destMarkerRef.current) {
        destMarkerRef.current.remove();
        destMarkerRef.current = null;
      }
      if (polylineGlowRef.current) {
        polylineGlowRef.current.remove();
        polylineGlowRef.current = null;
      }
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }
      map.setView([originLat, originLng], 16);
      return;
    }

    if (destinationLat && destinationLng) {
      const destCoords: [number, number] = [destinationLat, destinationLng];

      // Custom Destination Icon (Blue Pin with shadow)
      const destIcon = L.divIcon({
        className: "custom-dest-marker",
        html: `
          <div style="
            width: 34px;
            height: 34px;
            background: #2563EB;
            border: 3px solid #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 4px 14px rgba(37, 99, 235, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            font-weight: 800;
          ">
            📍
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      if (!destMarkerRef.current) {
        const marker = L.marker(destCoords, {
          icon: destIcon,
          draggable: true,
        }).addTo(map);

        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onLocationSelectRef.current(pos.lat, pos.lng);
        });

        destMarkerRef.current = marker;
      } else {
        destMarkerRef.current.setLatLng(destCoords);
      }

      if (destinationName) {
        destMarkerRef.current.bindPopup(
          `<div style="font-family: inherit; font-size: 12px; font-weight: bold; color: #111827;">
            ${destinationName}
            ${
              distanceKm > 0
                ? `<div style="font-size: 11px; color: #C02030; font-weight: 800; margin-top: 3px;">
                    ${distanceKm} km · ~${durationMinutes} min
                   </div>`
                : ""
            }
          </div>`
        );
      }

      const hasRoadGeometry = Array.isArray(routeGeometry) && routeGeometry.length > 1;

      if (hasRoadGeometry) {
        // Draw real street-by-street road route
        // 1. Casing / road shadow outline
        if (!polylineGlowRef.current) {
          polylineGlowRef.current = L.polyline(routeGeometry!, {
            color: "#7F1D1D",
            weight: 8,
            opacity: 0.35,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);
        } else {
          polylineGlowRef.current.setLatLngs(routeGeometry!);
        }

        // 2. High-contrast brand red road route line
        if (!polylineRef.current) {
          polylineRef.current = L.polyline(routeGeometry!, {
            color: "#C02030",
            weight: 5,
            opacity: 0.95,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);
        } else {
          polylineRef.current.setLatLngs(routeGeometry!);
          polylineRef.current.setStyle({
            color: "#C02030",
            weight: 5,
            opacity: 0.95,
            dashArray: undefined,
          });
        }

        const polylineBounds = polylineRef.current.getBounds();
        if (polylineBounds.isValid()) {
          map.fitBounds(polylineBounds, { padding: [55, 55], maxZoom: 15, animate: true });
        }
      } else {
        // Pending calculation or fallback straight dashed guide line
        const fallbackPoints: [number, number][] = [
          [originLat, originLng],
          destCoords,
        ];

        if (polylineGlowRef.current) {
          polylineGlowRef.current.remove();
          polylineGlowRef.current = null;
        }

        if (!polylineRef.current) {
          polylineRef.current = L.polyline(fallbackPoints, {
            color: "#C02030",
            weight: 3,
            opacity: 0.7,
            dashArray: "6, 8",
          }).addTo(map);
        } else {
          polylineRef.current.setLatLngs(fallbackPoints);
          polylineRef.current.setStyle({
            color: "#C02030",
            weight: 3,
            opacity: 0.7,
            dashArray: "6, 8",
          });
        }

        const bounds = L.latLngBounds([[originLat, originLng], destCoords]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    } else {
      // Clear destination pin and polyline if location cleared
      if (destMarkerRef.current) {
        destMarkerRef.current.remove();
        destMarkerRef.current = null;
      }
      if (polylineGlowRef.current) {
        polylineGlowRef.current.remove();
        polylineGlowRef.current = null;
      }
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }
      map.setView([originLat, originLng], 12);
    }
  }, [
    isShopInstallation,
    destinationLat,
    destinationLng,
    originLat,
    originLng,
    routeGeometry,
    destinationName,
    distanceKm,
    durationMinutes,
  ]);

  return (
    <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-xs flex flex-col transition-all relative isolate z-0">
      {/* Route Header HUD Bar */}
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Origin Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-800 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#C02030] animate-pulse" />
            <span className="truncate max-w-[150px] sm:max-w-none">
              Calle 34, Pozos
            </span>
          </div>

          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />

          {/* Destination Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-900 shadow-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isShopInstallation
                  ? "bg-emerald-500"
                  : destinationName
                  ? "bg-blue-500"
                  : "bg-gray-300"
              }`}
            />
            <span className="truncate max-w-[150px] sm:max-w-none">
              {isShopInstallation
                ? (lang === "es" ? "Instalación en Taller" : "In-Shop Installation")
                : destinationName || (lang === "es" ? "Haz clic en el mapa" : "Click on map")}
            </span>
          </div>
        </div>

        {/* Live Distance & Duration Stats Badge */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black text-white text-xs font-black tracking-wide">
            <Navigation className="w-3.5 h-3.5 text-[#C02030]" />
            <span>{isShopInstallation ? "0 km" : distanceKm > 0 ? `${distanceKm} km` : "-- km"}</span>
          </div>
          {isShopInstallation ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <span>{lang === "es" ? "Sin Traslado" : "No Transport"}</span>
            </div>
          ) : durationMinutes > 0 ? (
            <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gray-200/80 text-gray-800 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span>~{durationMinutes} min</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Interactive Map Canvas Container */}
      <div className="relative w-full h-[430px] bg-slate-100 overflow-hidden">
        {/* Loading overlay while calculating route */}
        {isCalculating && (
          <div className="absolute inset-0 z-[1000] bg-white/70 backdrop-blur-xs flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-gray-200 shadow-lg">
              <div className="w-6 h-6 border-2 border-[#C02030] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-gray-800">
                {t.calculatingRoute}
              </span>
            </div>
          </div>
        )}

        {/* Click hint pill on top of the map */}
        <div className="absolute top-3 left-3 z-[400] pointer-events-none">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-gray-200 shadow-sm text-[11px] font-bold text-gray-700">
            {isShopInstallation ? (
              <>
                <MapPin className="w-3.5 h-3.5 text-[#C02030]" />
                <span>{lang === "es" ? "Punto de instalación: Calle 34, Pozos, Santa Ana" : "Installation spot: Calle 34, Pozos, Santa Ana"}</span>
              </>
            ) : (
              <>
                <MousePointerClick className="w-3.5 h-3.5 text-[#C02030]" />
                <span>{t.clickMapToSetLocation}</span>
              </>
            )}
          </div>
        </div>

        {/* Leaflet Map DOM Element */}
        <div
          ref={mapContainerRef}
          style={{ width: "100%", height: "100%" }}
          className="cursor-crosshair z-0"
        />

        {/* Floating Origin Pin Label (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-[400] pointer-events-none">
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
    </div>
  );
}
