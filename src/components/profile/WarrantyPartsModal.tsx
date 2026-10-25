"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  FileText,
  Check,
  HelpCircle,
  Sparkles,
} from "lucide-react";

export interface WarrantyPartItem {
  id: string;
  rawId?: string;
  productId?: string;
  sku: string;
  nameEs: string;
  nameEn: string;
  imageUrl: string;
  installationPriceCRC: number;
  deinstallReinstallCostCRC: number;
  orderId: string;
  orderNumber: string;
  purchasedAt: string;
  orderStatus: string;
  type: "PRODUCT" | "COMBO";
  isAlreadyInActiveGAR?: boolean;
  activeGAROrderNumber?: string | null;
}

interface WarrantyPartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToWarrantyInfo?: () => void;
}

export function WarrantyPartsModal({
  isOpen,
  onClose,
  onGoToWarrantyInfo,
}: WarrantyPartsModalProps) {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const { formatPrice } = useCart();

  const [parts, setParts] = useState<WarrantyPartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [confirmedOemRequirement, setConfirmedOemRequirement] = useState(false);

  const fetchParts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/user/warranty-parts");
      const data = await res.json();
      if (res.ok && data.success) {
        const fetchedParts: WarrantyPartItem[] = data.parts || [];
        setParts(fetchedParts);
        // Pre-select only parts not currently in an active GAR request
        setSelectedIds(fetchedParts.filter((p) => !p.isAlreadyInActiveGAR).map((p) => p.id));
      } else {
        throw new Error(data.error || "Error al cargar piezas registradas");
      }
    } catch (err: any) {
      console.error("Error fetching warranty parts:", err);
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchParts();
    }
  }, [isOpen, fetchParts]);

  if (!isOpen) return null;

  const toggleSelectPart = (part: WarrantyPartItem) => {
    if (part.isAlreadyInActiveGAR) {
      alert(
        lang === "es"
          ? `Esta pieza ya está incluida en la solicitud de garantía #${part.activeGAROrderNumber}. No es posible duplicarla mientras esté en proceso.`
          : `This part is already included in warranty order #${part.activeGAROrderNumber}. Cannot duplicate while in progress.`
      );
      return;
    }
    setSelectedIds((prev) =>
      prev.includes(part.id) ? prev.filter((item) => item !== part.id) : [...prev, part.id]
    );
  };

  const selectedParts = parts.filter((p) => selectedIds.includes(p.id));
  const totalDeinstallReinstallCRC = selectedParts.reduce(
    (sum, p) => sum + p.deinstallReinstallCostCRC,
    0
  );

  const handleCreateWarrantyOrder = async () => {
    if (selectedIds.length === 0 || !confirmedOemRequirement) return;
    setCreatingOrder(true);
    try {
      const res = await fetch("/api/user/warranty-service-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedPartIds: selectedIds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.redirectUrl) {
        onClose();
        router.push(data.redirectUrl);
      } else {
        alert(data.error || "No se pudo generar la orden de servicio");
      }
    } catch (err: any) {
      console.error("Error creating warranty service order:", err);
      alert("Error de conexión al programar el servicio");
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleNavigateToScreen = () => {
    onClose();
    if (onGoToWarrantyInfo) {
      onGoToWarrantyInfo();
    } else {
      router.push("/servicios/proteccion-garantia");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-tight">
                  {t.warrantyProtectionPartsTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t.warrantyProtectionPartsSubtitle}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subheader Notice & Link to Full Info Screen */}
          <div className="px-6 py-3 bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-200/60 dark:border-amber-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs text-amber-900 dark:text-amber-300 font-medium">
              <Wrench className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>{t.warrantyProtectionOnlyZxzNotice}</span>
            </div>

            <button
              type="button"
              onClick={handleNavigateToScreen}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C02030] dark:text-[#FF3B47] hover:underline shrink-0"
            >
              <span>{t.warrantyProtectionGoToScreen}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? (
              /* Animated Skeleton Loader per Rule 7 */
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-700" />
                      <div className="space-y-2">
                        <div className="w-36 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                        <div className="w-24 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                      </div>
                    </div>
                    <div className="w-28 h-6 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center space-y-3">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{error}</p>
                <button
                  type="button"
                  onClick={fetchParts}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  Reintentar
                </button>
              </div>
            ) : parts.length === 0 ? (
              /* Empty State (Zero Mock Data Policy) */
              <div className="py-10 px-4 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {t.warrantyProtectionNoParts}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t.warrantyProtectionNoPartsDesc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push("/productos");
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C02030] hover:bg-[#A01825] text-white text-xs font-bold transition shadow-sm"
                >
                  <span>{t.warrantyProtectionExploreCatalog}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Parts List strictly displaying: Image preview, Name, Install & de-install cost [installation * 2] */
              <div className="space-y-3">
                {/* Strictly Mandatory OEM Parts Delivery Requirement */}
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                      {lang === "es"
                        ? "REQUISITO INDISPENSABLE: ENTREGA FÍSICA DE PIEZAS ORIGINALES (OEM)"
                        : "MANDATORY REQUIREMENT: PHYSICAL DELIVERY OF FACTORY ORIGINAL (OEM) PARTS"}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                    {lang === "es"
                      ? "Para desinstalar tus accesorios y dejar el vehículo en condiciones stock, es estrictamente obligatorio entregar físicamente las piezas originales de fábrica (OEM). Sin piezas OEM, no es posible realizar el servicio."
                      : "To disassemble your aftermarket accessories and return the vehicle to stock condition, physical delivery of original factory (OEM) parts is strictly mandatory. Without OEM parts, the warranty protection service cannot be performed."}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1 pt-1">
                  <span>{t.warrantyProtectionSelectParts}:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {selectedIds.length} / {parts.length} {t.warrantyProtectionSelectedCount}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                  {parts.map((part) => {
                    const isSelected = selectedIds.includes(part.id);
                    const isBlockedInGAR = Boolean(part.isAlreadyInActiveGAR);
                    const displayName = lang === "es" ? part.nameEs : part.nameEn;

                    return (
                      <div
                        key={part.id}
                        onClick={() => toggleSelectPart(part)}
                        className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition ${
                          isBlockedInGAR
                            ? "bg-slate-50/70 dark:bg-slate-800/30 opacity-75 cursor-not-allowed"
                            : isSelected
                            ? "bg-red-50/40 dark:bg-red-950/20"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Selection Checkbox */}
                          <div
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                              isBlockedInGAR
                                ? "border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-700"
                                : isSelected
                                ? "bg-[#C02030] border-[#C02030] text-white"
                                : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>

                          {/* 1. Image Preview */}
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 overflow-hidden shrink-0 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={part.imageUrl}
                              alt={displayName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/images/placeholder.png";
                              }}
                            />
                          </div>

                          {/* 2. Name */}
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                {displayName}
                              </h4>
                              {isBlockedInGAR && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                                  En Solicitud #{part.activeGAROrderNumber}
                                </span>
                              )}
                            </div>
                            {part.sku && (
                              <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                SKU: {part.sku}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                              <span>Orden: #{part.orderNumber}</span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Install & De-install Cost [installation * 2] */}
                        <div className="text-right shrink-0 space-y-0.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                            {lang === "es" ? "Desinstalación & Reinstalación" : "De-install & Re-install"}
                          </span>
                          <span className="text-sm sm:text-base font-black font-mono text-[#C02030] dark:text-[#FF3B47] block">
                            ₡{part.deinstallReinstallCostCRC.toLocaleString("es-CR")}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block">
                            ({t.warrantyProtectionInstallCostLabel} ₡{part.installationPriceCRC.toLocaleString("es-CR")} × 2)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar: Total & Action to Proceed to Service Selection */}
          {parts.length > 0 && (
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {t.warrantyProtectionTotalToPay}
                </span>
                <span className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-slate-100">
                  ₡{totalDeinstallReinstallCRC.toLocaleString("es-CR")}
                </span>
              </div>

              {/* Mandatory OEM requirement & legal contract acceptance checkbox */}
              <div className="space-y-1 pt-1">
                <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={confirmedOemRequirement}
                    onChange={(e) => setConfirmedOemRequirement(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-[#C02030] focus:ring-[#C02030] w-4 h-4 cursor-pointer mt-0.5"
                  />
                  <span>
                    {lang === "es"
                      ? "Entregaré físicamente las piezas OEM originales y acepto el Contrato Legal."
                      : "I will physically deliver the original OEM parts and accept the Legal Agreement."}
                  </span>
                </label>
                <div className="pl-6.5">
                  <a
                    href="/servicios/proteccion-garantia/contrato-legal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-[#C02030] dark:text-[#FF3B47] hover:underline inline-flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" />
                    <span>{lang === "es" ? "Ver Contrato Legal & Exoneración" : "View Legal Terms & Release"}</span>
                  </a>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleCreateWarrantyOrder}
                  disabled={selectedIds.length === 0 || creatingOrder || !confirmedOemRequirement}
                  className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-[#C02030] hover:bg-[#A01825] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
                >
                  {creatingOrder ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{t.warrantyProtectionCreatingOrder}</span>
                    </>
                  ) : (
                    <>
                      <span>{t.warrantyProtectionProceedService}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleNavigateToScreen}
                  className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#C02030] text-xs font-bold text-slate-700 dark:text-slate-200 transition"
                >
                  {t.warrantyProtectionGoToScreen}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
