"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  Wrench,
  Car,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Calculator,
  Power,
  ShieldAlert,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface LogisticsConfigData {
  id: string;
  pickupRatePerKmCRC: number;
  deliveryRatePerKmCRC: number;
  homeInstallationRatePerKmCRC: number;
  pickupBaseFeeCRC: number;
  deliveryBaseFeeCRC: number;
  homeInstallationBaseFeeCRC: number;
  pickupServiceEnabled?: boolean;
  garageAddress: string;
  garageLatitude: number;
  garageLongitude: number;
  updatedAt?: string;
}

interface LogisticsRatesTabProps {
  userRole: "MASTER" | "STAFF";
}

export function LogisticsRatesTab({ userRole }: LogisticsRatesTabProps) {
  const { lang, t } = useLanguage();

  const [config, setConfig] = useState<LogisticsConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingPickup, setTogglingPickup] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states for the variables
  const [pickupRate, setPickupRate] = useState<number>(1500);
  const [deliveryRate, setDeliveryRate] = useState<number>(800);
  const [installationRate, setInstallationRate] = useState<number>(2000);

  const [pickupBase, setPickupBase] = useState<number>(10000);
  const [deliveryBase, setDeliveryBase] = useState<number>(3000);
  const [installationBase, setInstallationBase] = useState<number>(15000);
  const [pickupServiceEnabled, setPickupServiceEnabled] = useState<boolean>(true);

  const [garageAddress, setGarageAddress] = useState<string>(
    "Calle 34, Pozos, Santa Ana, San José, Costa Rica"
  );

  // Test simulator state
  const [testKm, setTestKm] = useState<number>(15);

  const fetchConfig = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/logistics/config", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setConfig(json.data);
        setPickupRate(json.data.pickupRatePerKmCRC ?? 1500);
        setDeliveryRate(json.data.deliveryRatePerKmCRC ?? 800);
        setInstallationRate(json.data.homeInstallationRatePerKmCRC ?? 2000);

        setPickupBase(json.data.pickupBaseFeeCRC ?? 10000);
        setDeliveryBase(json.data.deliveryBaseFeeCRC ?? 3000);
        setInstallationBase(json.data.homeInstallationBaseFeeCRC ?? 15000);
        setPickupServiceEnabled(json.data.pickupServiceEnabled !== false);

        setGarageAddress(
          json.data.garageAddress || "Calle 34, Pozos, Santa Ana, San José, Costa Rica"
        );
      } else {
        setErrorMessage(json.error || "Error al cargar configuración");
      }
    } catch (err) {
      console.error("Error fetching logistics config:", err);
      setErrorMessage("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleTogglePickupService = async () => {
    if (userRole !== "MASTER" || togglingPickup) return;
    const nextState = !pickupServiceEnabled;
    setTogglingPickup(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/logistics/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupRatePerKmCRC: Number(pickupRate),
          deliveryRatePerKmCRC: Number(deliveryRate),
          homeInstallationRatePerKmCRC: Number(installationRate),
          pickupBaseFeeCRC: Number(pickupBase),
          deliveryBaseFeeCRC: Number(deliveryBase),
          homeInstallationBaseFeeCRC: Number(installationBase),
          pickupServiceEnabled: nextState,
          garageAddress: garageAddress.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setPickupServiceEnabled(nextState);
        setConfig(json.data);
        setSuccessMessage(
          nextState
            ? t.backdoorPickupEnabledBadge
            : t.backdoorPickupDisabledBadge
        );
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(json.error || "Error al cambiar estado de Pick-Up");
      }
    } catch (err) {
      console.error("Error toggling pickup service:", err);
      setErrorMessage("Fallo de red al cambiar estado de Pick-Up");
    } finally {
      setTogglingPickup(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/logistics/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupRatePerKmCRC: Number(pickupRate),
          deliveryRatePerKmCRC: Number(deliveryRate),
          homeInstallationRatePerKmCRC: Number(installationRate),
          pickupBaseFeeCRC: Number(pickupBase),
          deliveryBaseFeeCRC: Number(deliveryBase),
          homeInstallationBaseFeeCRC: Number(installationBase),
          ...(userRole === "MASTER" ? { pickupServiceEnabled } : {}),
          garageAddress: garageAddress.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMessage(t.backdoorRatesSavedSuccess || "Tarifas actualizadas correctamente en la base de datos");
        setConfig(json.data);
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(json.error || "Error al guardar las tarifas");
      }
    } catch (err) {
      console.error("Error saving logistics config:", err);
      setErrorMessage("Fallo de red al intentar guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3" />
        <div className="h-4 bg-slate-100 rounded w-2/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="h-32 bg-slate-100 rounded-xl" />
          <div className="h-32 bg-slate-100 rounded-xl" />
          <div className="h-32 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Truck className="w-3.5 h-3.5 text-[#C02030]" />
            <span>{t.backdoorLogisticsTab}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {t.backdoorLogisticsTitle}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {t.backdoorLogisticsSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchConfig}
          className="self-start md:self-auto inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{lang === "es" ? "Recargar" : "Reload"}</span>
        </button>
      </div>

      {/* Master Exclusive Pick-Up Vehicle Operational Status Control */}
      <div
        className={`rounded-2xl p-5 border shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          pickupServiceEnabled
            ? "bg-emerald-50/70 border-emerald-200"
            : "bg-red-50/80 border-red-300"
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
              pickupServiceEnabled
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                : "bg-[#C02030] text-white shadow-sm shadow-[#C02030]/20"
            }`}
          >
            {pickupServiceEnabled ? (
              <Car className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                {t.backdoorPickupStatusLabel}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  pickupServiceEnabled
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-red-100 text-red-800 border border-red-300"
                }`}
              >
                {pickupServiceEnabled
                  ? t.backdoorPickupEnabledBadge
                  : t.backdoorPickupDisabledBadge}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {t.backdoorPickupToggleDesc}
            </p>
          </div>
        </div>

        {userRole === "MASTER" && (
          <button
            type="button"
            disabled={togglingPickup}
            onClick={handleTogglePickupService}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0 shadow-sm disabled:opacity-50 ${
              pickupServiceEnabled
                ? "bg-[#C02030] hover:bg-[#A01825] text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            <Power className="w-4 h-4" />
            <span>
              {togglingPickup
                ? "..."
                : pickupServiceEnabled
                  ? t.backdoorPickupDisableBtn
                  : t.backdoorPickupEnableBtn}
            </span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-emerald-800 text-xs sm:text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-center gap-3 text-red-800 text-xs sm:text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Origin Garage Information */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <MapPin className="w-4 h-4 text-[#C02030]" />
            <span>{t.backdoorGarageAddress}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                {lang === "es" ? "Dirección física central (Origen)" : "Physical Central Address (Origin)"}
              </label>
              <input
                type="text"
                value={garageAddress}
                onChange={(e) => setGarageAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C02030]/20 focus:border-[#C02030]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                {lang === "es" ? "Coordenadas fijas" : "Fixed Coordinates"}
              </label>
              <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600">
                9.9482° N, -84.1967° W
              </div>
            </div>
          </div>
        </div>

        {/* 3 Main Variables: Price Per Kilometer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Pick-up SxS/UTV */}
          <div
            className={`bg-white border rounded-2xl p-6 shadow-sm space-y-4 relative overflow-hidden ${
              pickupServiceEnabled ? "border-slate-200" : "border-red-300 bg-red-50/20"
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[#C02030]">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {lang === "es" ? "Pick-up de Vehículo" : "Vehicle Pick-up"}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {lang === "es" ? "Plataforma / Remolque" : "Trailer / Tow Platform"}
                  </span>
                </div>
              </div>
              {!pickupServiceEnabled && (
                <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-bold uppercase">
                  {t.servicePickupDisabledBadge}
                </span>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>{t.backdoorPickupRate}</span>
                  <span className="text-[11px] font-mono text-[#C02030]">₡/km</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₡</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={pickupRate}
                    onChange={(e) => setPickupRate(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#C02030]/20 focus:border-[#C02030]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 flex items-center justify-between">
                  <span>{t.backdoorPickupBase}</span>
                  <span className="text-[11px] font-mono text-slate-400">₡</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-medium text-slate-400">₡</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={pickupBase}
                    onChange={(e) => setPickupBase(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Delivery / Repuestos */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {lang === "es" ? "Delivery / Repuestos" : "Parts Delivery"}
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {lang === "es" ? "Envío express seguro" : "Express Secure Delivery"}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>{t.backdoorDeliveryRate}</span>
                  <span className="text-[11px] font-mono text-blue-600">₡/km</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₡</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={deliveryRate}
                    onChange={(e) => setDeliveryRate(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 flex items-center justify-between">
                  <span>{t.backdoorDeliveryBase}</span>
                  <span className="text-[11px] font-mono text-slate-400">₡</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-medium text-slate-400">₡</span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={deliveryBase}
                    onChange={(e) => setDeliveryBase(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Home Installation */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {lang === "es" ? "Instalación a Domicilio" : "Home Installation"}
                </h3>
                <span className="text-[11px] text-slate-500 font-medium">
                  {lang === "es" ? "Unidad móvil técnica" : "Mobile Technical Crew"}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>{t.backdoorInstallationRate}</span>
                  <span className="text-[11px] font-mono text-amber-600">₡/km</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₡</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={installationRate}
                    onChange={(e) => setInstallationRate(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 flex items-center justify-between">
                  <span>{t.backdoorInstallationBase}</span>
                  <span className="text-[11px] font-mono text-slate-400">₡</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-medium text-slate-400">₡</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={installationBase}
                    onChange={(e) => setInstallationBase(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Simulator Panel */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#C02030]" />
              <h3 className="text-sm font-bold">{t.backdoorTestCalculatorTitle}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{lang === "es" ? "Distancia prueba:" : "Test distance:"}</span>
              <input
                type="number"
                min="1"
                max="500"
                value={testKm}
                onChange={(e) => setTestKm(Math.max(1, Number(e.target.value)))}
                className="w-20 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-white text-center"
              />
              <span className="text-xs text-slate-400">km</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
            <div className="bg-slate-800/80 rounded-xl p-3.5 space-y-1 border border-slate-700/60">
              <span className="text-[11px] text-slate-400 font-medium">Pick-up ({testKm} km)</span>
              <p className="text-base font-black text-red-400">
                ₡{(pickupBase + testKm * pickupRate).toLocaleString("es-CR")}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">
                ₡{pickupBase.toLocaleString("es-CR")} base + ({testKm} × ₡{pickupRate})
              </span>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3.5 space-y-1 border border-slate-700/60">
              <span className="text-[11px] text-slate-400 font-medium">Delivery ({testKm} km)</span>
              <p className="text-base font-black text-blue-400">
                ₡{(deliveryBase + testKm * deliveryRate).toLocaleString("es-CR")}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">
                ₡{deliveryBase.toLocaleString("es-CR")} base + ({testKm} × ₡{deliveryRate})
              </span>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3.5 space-y-1 border border-slate-700/60">
              <span className="text-[11px] text-slate-400 font-medium">Instalación ({testKm} km)</span>
              <p className="text-base font-black text-amber-400">
                ₡{(installationBase + testKm * installationRate).toLocaleString("es-CR")}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">
                ₡{installationBase.toLocaleString("es-CR")} base + ({testKm} × ₡{installationRate})
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#C02030] hover:bg-[#A01825] text-white text-xs font-bold tracking-wider uppercase shadow-md shadow-[#C02030]/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? (lang === "es" ? "Guardando..." : "Saving...") : (lang === "es" ? "Guardar Variables de Tarifas" : "Save Rate Variables")}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
