"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingConcierge } from "@/components/home/FloatingConcierge";
import { GarageModal } from "@/components/garage/GarageModal";
import { GarageFleetSkeleton } from "@/components/garage/GarageFleetSkeleton";
import { useGarage, RegisteredVehicle } from "@/context/GarageContext";
import { useLanguage } from "@/context/LanguageContext";
import { getBrandLogo } from "@/lib/sxsBrands";
import {
  Car,
  Plus,
  CheckCircle2,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Wrench,
  Layers,
} from "lucide-react";

export default function GarageFleetPage() {
  const router = useRouter();
  const {
    vehicles,
    activeVehicle,
    isLoading,
    canAddMore,
    maxVehicles,
    removeRegisteredVehicle,
    setActiveVehicleId,
  } = useGarage();
  const { t, lang } = useLanguage();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const handleSetActive = async (id: string) => {
    const success = await setActiveVehicleId(id);
    if (success) {
      showNotification(
        lang === "es"
          ? "Vehículo seleccionado como activo para verificación de piezas."
          : "Vehicle set as active for fitment checking."
      );
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const success = await removeRegisteredVehicle(id);
    setDeletingId(null);
    setConfirmDeleteId(null);
    if (success) {
      showNotification(t.garageDeleteSuccess);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FFFFFF] text-[#1A1A1D] flex flex-col justify-between selection:bg-[#C02030] selection:text-white">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed bottom-8 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-fade-in">
          <div className="bg-[#111827] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10 text-xs sm:text-sm font-medium flex items-center gap-3 max-w-md pointer-events-auto">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200 text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#C02030] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {lang === "es" ? "Confirmar Eliminación" : "Confirm Removal"}
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {t.garageDeleteConfirm}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t.garageCancelVehicleCta}
              </button>
              <button
                type="button"
                disabled={deletingId === confirmDeleteId}
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-5 py-2.5 rounded-xl bg-[#C02030] hover:bg-[#A01825] text-white text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
              >
                {deletingId === confirmDeleteId ? "..." : t.garageDeleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      <NotificationBanner />
      <Navbar />
      <GarageModal />
      <CartDrawer />
      <FloatingConcierge />

      <main className="flex-1 w-full px-4 sm:px-6 md:px-8 lg:px-12 pt-20 sm:pt-24 pb-20">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-6">
          <Link
            href="/"
            className="hover:text-black flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === "es" ? "Inicio" : "Home"}</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-900">{t.garageManageBreadcrumb}</span>
        </div>

        {/* Real Loading Skeleton */}
        {isLoading ? (
          <GarageFleetSkeleton />
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Header & Fleet Status Bar (No max number displayed) */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-gray-200">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C02030]/10 text-[#C02030] text-xs font-bold uppercase tracking-wider">
                  <Car className="w-3.5 h-3.5" />
                  <span>{t.garageFleetTitle}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111827]">
                  {t.garageFleetTitle}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 max-w-2xl leading-relaxed">
                  {t.garageFleetSubtitle}
                </p>
              </div>

              {/* Status Pills & Register Button (Without showing number 10) */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Registered Vehicles Count Pill */}
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-100 border border-gray-200 text-xs font-semibold text-gray-800">
                  <Layers className="w-4 h-4 text-gray-500" />
                  <span>
                    {vehicles.length} {t.garageRegisteredCounter}
                  </span>
                  {!canAddMore && (
                    <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      {t.garageSlotFull}
                    </span>
                  )}
                </div>

                {/* Add Vehicle Button (Redirects to /garaje/registrar) */}
                {canAddMore ? (
                  <Link
                    href="/garaje/registrar"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#C02030] hover:bg-[#A01825] text-white text-xs font-bold tracking-wider uppercase shadow-md hover:shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.garageRegisterNewBtn}</span>
                  </Link>
                ) : (
                  <button
                    disabled
                    title={t.garageMaxNotice}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gray-200 text-gray-400 text-xs font-bold tracking-wider uppercase cursor-not-allowed"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{t.garageSlotFull}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Empty State */}
            {vehicles.length === 0 ? (
              <div className="w-full rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-10 sm:p-16 flex flex-col items-center justify-center text-center space-y-5">
                <div className="w-20 h-20 rounded-3xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-[#C02030]">
                  <Car className="w-10 h-10 stroke-[1.5]" />
                </div>
                <div className="space-y-2 max-w-md">
                  <h3 className="text-xl font-bold text-gray-900">
                    {t.garageEmptyTitle}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {t.garageEmptySubtitle}
                  </p>
                </div>
                <Link
                  href="/garaje/registrar"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#C02030] hover:bg-[#A01825] text-white text-xs font-bold tracking-wider uppercase shadow-lg shadow-[#C02030]/20 transition-all hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.garageEmptyCta}</span>
                </Link>
              </div>
            ) : (
              /* Grid of Registered Vehicles (represented by brand logos) */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map((v) => {
                  const isActive = activeVehicle?.id === v.id || v.isActive;
                  const logoUrl = getBrandLogo(v.brandSlug);

                  return (
                    <div
                      key={v.id}
                      className={`relative rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
                        isActive
                          ? "bg-white border-[#C02030] shadow-xl ring-2 ring-[#C02030]/20"
                          : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md"
                      }`}
                    >
                      {/* Top Header Card Info */}
                      <div className="p-6 pb-0 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          {/* Active Fitment Badge */}
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span>{t.garageActiveBadge}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                              {v.category || "SxS"}
                            </span>
                          )}

                          {/* Year Badge */}
                          <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                            {v.year}
                          </span>
                        </div>

                        {/* 
                          VEHICLE IMAGE REPRESENTED BY THE BRAND LOGO
                          (User requirement: "The vehicle image in teh garage will be represented by the brand logo. Asign each logo respectively")
                        */}
                        <div className="relative h-28 w-full rounded-2xl bg-gray-50/80 border border-gray-100 flex items-center justify-center p-4 transition-transform hover:scale-[1.02]">
                          <div className="relative w-44 h-16">
                            <Image
                              src={logoUrl}
                              alt={v.brandName}
                              fill
                              className="object-contain filter drop-shadow-sm"
                              sizes="(max-width: 768px) 100vw, 250px"
                            />
                          </div>
                        </div>

                        {/* Vehicle Title & Platform Specs */}
                        <div className="space-y-1">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-[#C02030] font-bold">
                            {v.brandName}
                          </p>
                          <h3 className="text-lg font-black text-gray-900 leading-snug">
                            {v.year} {v.modelName}
                          </h3>

                          {v.category && (
                            <span className="inline-block text-[11px] text-gray-500 font-medium pt-0.5">
                              {v.category}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="p-6 pt-4 space-y-3 border-t border-gray-100 mt-5 bg-gray-50/50">
                        <div className="flex items-center gap-2">
                          {/* Set Active Button */}
                          {!isActive ? (
                            <button
                              type="button"
                              onClick={() => handleSetActive(v.id)}
                              className="flex-1 px-3 py-2.5 rounded-xl bg-white border border-gray-300 hover:border-[#C02030] hover:text-[#C02030] text-xs font-semibold text-gray-700 transition-colors shadow-sm"
                            >
                              {t.garageSetActiveBtn}
                            </button>
                          ) : (
                            <div className="flex-1 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{t.garageActiveStatus}</span>
                            </div>
                          )}

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(v.id)}
                            title={t.garageDeleteBtn}
                            className="p-2.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* View Compatible Parts Link */}
                        <Link
                          href={`/productos?sxs=${v.brandSlug}`}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[11px] font-bold text-gray-600 hover:text-[#C02030] transition-colors"
                        >
                          <Wrench className="w-3.5 h-3.5 text-[#C02030]" />
                          <span>{t.garageViewCompatibleParts}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
