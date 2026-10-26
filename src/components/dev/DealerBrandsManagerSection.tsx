"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  ArrowUpDown,
  X,
  Layers,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";
import { isVehicleBrand, resolveDefaultDealerBrandCode } from "@/lib/dealerBrands";
import { uploadMediaDirect } from "@/lib/clientDirectUpload";

export interface DealerBrandRecord {
  id: string;
  name: string;
  code?: string | null;
  slug?: string | null;
  logoUrl: string;
  redirectUrl: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DealerBrandsManagerSectionProps {
  userRole?: "MASTER" | "STAFF";
}

export function DealerBrandsManagerSection({ userRole }: DealerBrandsManagerSectionProps) {
  const { t, lang } = useLanguage();
  const [brands, setBrands] = useState<DealerBrandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<DealerBrandRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [modalFeedback, setModalFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formLogoUrl, setFormLogoUrl] = useState("");
  const [formRedirectUrl, setFormRedirectUrl] = useState("");
  const [formOrder, setFormOrder] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState(true);

  // Upload states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [showManualUrl, setShowManualUrl] = useState(false);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sys/dealer-brands");
      const data = await res.json();
      if (res.ok && data.success) {
        const safeBrands = (data.brands || []).filter(
          (b: any) => !isVehicleBrand(b.name) && !isVehicleBrand(b.slug || "")
        );
        setBrands(safeBrands);
      } else {
        setFeedbackMessage({
          type: "error",
          text: data.error || (lang === "es" ? "Error al cargar marcas distribuidoras" : "Failed to load dealer brands"),
        });
      }
    } catch (err) {
      console.error("Failed to load dealer brands:", err);
      setFeedbackMessage({
        type: "error",
        text: lang === "es" ? "Error de conexión al cargar marcas" : "Network error loading dealer brands",
      });
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setLogoUploadError(null);

    try {
      const result = await uploadMediaDirect(file, {
        folder: "brands",
        lang,
      });

      if (!result.success || !result.url) {
        throw new Error(result.error || (lang === "es" ? "Error al subir el logo" : "Upload failed"));
      }

      setFormLogoUrl(result.url);
    } catch (err: any) {
      console.error("Logo upload error:", err);
      setLogoUploadError(err.message || (lang === "es" ? "Error al procesar el archivo" : "Error processing file"));
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleOpenAdd = () => {
    setEditingBrand(null);
    setFormName("");
    setFormCode("");
    setFormLogoUrl("");
    setFormRedirectUrl("");
    setFormOrder(brands.length);
    setFormIsActive(true);
    setLogoUploadError(null);
    setShowManualUrl(false);
    setModalFeedback(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (brand: DealerBrandRecord) => {
    setEditingBrand(brand);
    setFormName(brand.name);
    setFormCode(brand.code || resolveDefaultDealerBrandCode(brand.name));
    setFormLogoUrl(brand.logoUrl);
    setFormRedirectUrl(brand.redirectUrl || "");
    setFormOrder(brand.order ?? 0);
    setFormIsActive(brand.isActive ?? true);
    setLogoUploadError(null);
    setShowManualUrl(Boolean(brand.logoUrl && brand.logoUrl.startsWith("http")));
    setModalFeedback(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingBrand) {
      const suggested = resolveDefaultDealerBrandCode(val);
      setFormCode(suggested);
    }
  };

  const handleAutoFillRedirect = () => {
    if (!formName.trim()) return;
    setFormRedirectUrl(`/productos?brand=${encodeURIComponent(formName.trim())}`);
  };

  const handleToggleActive = async (brand: DealerBrandRecord) => {
    try {
      const res = await fetch(`/api/sys/dealer-brands/${brand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !brand.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBrands((prev) =>
          prev.map((b) => (b.id === brand.id ? { ...b, isActive: !b.isActive } : b))
        );
        setFeedbackMessage({
          type: "success",
          text: t.backdoorDealerBrandsSuccessUpdated || "Marca distribuidora actualizada correctamente.",
        });
      } else {
        setFeedbackMessage({
          type: "error",
          text: data.error || (lang === "es" ? "Error al actualizar estado" : "Failed to toggle status"),
        });
      }
    } catch (err) {
      setFeedbackMessage({
        type: "error",
        text: lang === "es" ? "Error de red" : "Network error",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/sys/dealer-brands/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBrands((prev) => prev.filter((b) => b.id !== id));
        setDeleteConfirmId(null);
        setFeedbackMessage({
          type: "success",
          text: t.backdoorDealerBrandsSuccessDeleted || "Marca distribuidora eliminada correctamente.",
        });
      } else {
        setFeedbackMessage({
          type: "error",
          text: data.error || (lang === "es" ? "Error al eliminar" : "Failed to delete"),
        });
      }
    } catch (err) {
      setFeedbackMessage({
        type: "error",
        text: lang === "es" ? "Error de red al eliminar" : "Network error deleting brand",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setModalFeedback({
        type: "error",
        text: lang === "es" ? "El nombre de la marca es requerido" : "Brand name is required",
      });
      return;
    }
    if (isVehicleBrand(formName.trim())) {
      setModalFeedback({
        type: "error",
        text:
          lang === "es"
            ? "Las marcas de vehículos (CFMOTO, Can-Am, Polaris, Honda, Yamaha, etc.) pertenecen a compatibilidad de vehículos y no a Marcas Distribuidoras (aftermarket parts). Por favor registra marcas de repuestos (ej: EVP, RPM Powersports, Bikeman, Dynojet, etc.)."
            : "Vehicle manufacturer brands (CFMOTO, Can-Am, Polaris, Honda, Yamaha, etc.) belong to vehicle platforms and not to Dealer Brands (aftermarket parts). Please enter aftermarket dealer brands (e.g. EVP, RPM Powersports, Bikeman, Dynojet, etc.).",
      });
      return;
    }
    if (!formLogoUrl.trim()) {
      setModalFeedback({
        type: "error",
        text: lang === "es" ? "El logo de la marca es requerido" : "Brand logo is required",
      });
      return;
    }

    setSubmitting(true);
    setModalFeedback(null);

    const payload = {
      name: formName.trim(),
      code: formCode.trim().toUpperCase() || null,
      logoUrl: formLogoUrl.trim(),
      redirectUrl: formRedirectUrl.trim() || `/productos?brand=${encodeURIComponent(formName.trim())}`,
      order: Number(formOrder) || 0,
      isActive: Boolean(formIsActive),
    };

    try {
      if (editingBrand) {
        const res = await fetch(`/api/sys/dealer-brands/${editingBrand.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.success && data.brand) {
          setBrands((prev) =>
            prev.map((b) => (b.id === editingBrand.id ? data.brand : b))
          );
          setIsModalOpen(false);
          setModalFeedback(null);
          setFeedbackMessage({
            type: "success",
            text: t.backdoorDealerBrandsSuccessUpdated || "Marca distribuidora actualizada correctamente.",
          });
        } else {
          setModalFeedback({
            type: "error",
            text: data.error || (lang === "es" ? "Error al actualizar" : "Failed to update"),
          });
        }
      } else {
        const res = await fetch("/api/sys/dealer-brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.success && data.brand) {
          setBrands((prev) => [...prev, data.brand]);
          setIsModalOpen(false);
          setModalFeedback(null);
          setFeedbackMessage({
            type: "success",
            text: t.backdoorDealerBrandsSuccessCreated || "Marca distribuidora agregada exitosamente.",
          });
        } else {
          setModalFeedback({
            type: "error",
            text: data.error || (lang === "es" ? "Error al crear" : "Failed to create"),
          });
        }
      }
    } catch (err) {
      console.error("Submit error:", err);
      setModalFeedback({
        type: "error",
        text: lang === "es" ? "Error de conexión al guardar" : "Network error saving brand",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        brand.name.toLowerCase().includes(q) ||
        (brand.redirectUrl && brand.redirectUrl.toLowerCase().includes(q))
      );
    });
  }, [brands, searchQuery]);

  const activeBrandsCount = brands.filter((b) => b.isActive).length;

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium transition ${
            feedbackMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Distinction Banner: Dealer Brands vs Vehicle Brands */}
      <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-extrabold block text-amber-950">
            {lang === "es"
              ? "Separación Estricta: Marcas Distribuidoras / Aftermarket Parts"
              : "Strict Separation: Dealer / Aftermarket Parts Brands"}
          </span>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            {lang === "es"
              ? "Esta sección es exclusivamente para marcas de partes, repuestos y accesorios (ej: EVP, RPM Powersports, Bikeman Performance, Shock Therapy, DRT, etc.) que se muestran en la rueda de la página de inicio. Las marcas de vehículos (CFMOTO, Can-Am, Polaris, Honda, Yamaha) no deben agregarse aquí; pertenecen a la configuración de vehículos."
              : "This section is exclusively for aftermarket performance and parts manufacturers (e.g. EVP, RPM Powersports, Bikeman Performance, Shock Therapy, DRT, etc.) rotating in the home wheel. Vehicle manufacturer brands (CFMOTO, Can-Am, Polaris, Honda, Yamaha) must not be added here."}
          </p>
        </div>
      </div>

      {/* Header and Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-900">
                {t.backdoorDealerBrandsTitle || "Marcas Distribuidoras (Rueda de Inicio)"}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {brands.length} {t.backdoorDealerBrandsAllCount || "Marcas"}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {activeBrandsCount} {t.backdoorHomeStatusActive || "Activas"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              {t.backdoorDealerBrandsSubtitle ||
                "Administra las marcas y logos de distribuidores que rotan en la rueda continua de la página principal, junto con su redirección de búsqueda al hacer clic."}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => fetchBrands()}
              disabled={loading}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition"
              title="Refrescar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#C02030] hover:bg-[#A01828] text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t.backdoorDealerBrandsAddBtn || "Agregar Marca Distribuidora"}</span>
            </button>
          </div>
        </div>

        {/* Live Mini Preview of the Home Page Wheel */}
        {brands.filter((b) => b.isActive).length > 0 && (
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#C02030]" />
                {t.backdoorDealerBrandsWheelPreview || "Vista Previa de la Rueda en Inicio"}
              </span>
              <span className="text-[10px] text-slate-400">
                {activeBrandsCount} {lang === "es" ? "logos activos rotando" : "active logos rotating"}
              </span>
            </div>
            <div className="bg-slate-900 rounded-xl p-3 overflow-x-auto flex items-center gap-6 scrollbar-thin border border-slate-800">
              {brands
                .filter((b) => b.isActive)
                .sort((a, b) => a.order - b.order)
                .map((b) => (
                  <div
                    key={b.id}
                    className="relative shrink-0 h-10 w-28 bg-slate-800/80 rounded-lg p-1.5 flex items-center justify-center border border-slate-700/60"
                    title={`${b.name} → ${b.redirectUrl}`}
                  >
                    <div className="relative h-full w-full">
                      <Image
                        src={b.logoUrl}
                        alt={b.name}
                        fill
                        unoptimized={b.logoUrl.startsWith("http")}
                        className="object-contain filter grayscale hover:grayscale-0 transition opacity-80 hover:opacity-100"
                        sizes="112px"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Search Filter */}
        <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.backdoorDealerBrandsSearchPlaceholder || "Buscar marca distribuidora por nombre..."}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C02030]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        /* Rule 7: Animated Skeleton Loader */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 animate-pulse"
            >
              <div className="h-24 bg-slate-100 rounded-lg" />
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
              <div className="h-8 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">
            {searchQuery
              ? lang === "es"
                ? "No se encontraron marcas con ese término"
                : "No brands matching your search"
              : t.backdoorDealerBrandsEmpty || "No hay marcas distribuidoras registradas aún"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? lang === "es"
                ? "Intenta con otro término de búsqueda o limpia el filtro."
                : "Try a different search query or clear the filter."
              : t.backdoorDealerBrandsEmpty ||
                "Haz clic en 'Agregar Marca Distribuidora' para registrar la primera marca que rotará en la rueda."}
          </p>
          {!searchQuery && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C02030] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-[#A01828] transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.backdoorDealerBrandsAddBtn || "Agregar Marca Distribuidora"}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBrands.map((brand) => (
            <div
              key={brand.id}
              className={`bg-white border rounded-xl overflow-hidden shadow-sm transition hover:shadow-md flex flex-col justify-between ${
                brand.isActive ? "border-slate-200" : "border-slate-200 opacity-60 bg-slate-50/50"
              }`}
            >
              {/* Logo Preview Container */}
              <div className="relative h-28 bg-gradient-to-b from-slate-50 to-slate-100/80 p-3 flex items-center justify-center border-b border-slate-100 group">
                <div className="relative h-full w-full flex items-center justify-center">
                  <Image
                    src={brand.logoUrl}
                    alt={brand.name}
                    fill
                    unoptimized={brand.logoUrl.startsWith("http")}
                    className="object-contain p-2 drop-shadow-sm transition group-hover:scale-105"
                    sizes="200px"
                  />
                </div>

                {/* Top badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white/90 text-slate-700 shadow-sm border border-slate-200 flex items-center gap-0.5">
                    <ArrowUpDown className="w-2.5 h-2.5" /> #{brand.order}
                  </span>
                </div>

                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => handleToggleActive(brand)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm transition ${
                      brand.isActive
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : "bg-slate-300 text-slate-700 hover:bg-slate-400"
                    }`}
                    title={brand.isActive ? "Desactivar" : "Activar"}
                  >
                    {brand.isActive ? (
                      <>
                        <Eye className="w-2.5 h-2.5" />
                        <span>{t.backdoorHomeStatusActive || "Activo"}</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-2.5 h-2.5" />
                        <span>{t.backdoorHomeStatusInactive || "Inactivo"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Brand Details */}
              <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-slate-900 text-sm truncate" title={brand.name}>
                      {brand.name}
                    </h4>
                    {brand.code && (
                      <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-mono font-black bg-red-50 text-[#C02030] border border-red-200">
                        SKU: {brand.code}
                      </span>
                    )}
                  </div>

                  {/* Redirect Link info */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <LinkIcon className="w-3 h-3 shrink-0 text-slate-400" />
                    <span className="truncate font-mono text-[10px] text-slate-600" title={brand.redirectUrl}>
                      {brand.redirectUrl || `/productos?brand=${brand.name}`}
                    </span>
                    {brand.redirectUrl && (
                      <Link
                        href={brand.redirectUrl}
                        target="_blank"
                        className="text-[#C02030] hover:underline shrink-0 ml-auto"
                        title="Probar enlace"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenEdit(brand)}
                    className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Pencil className="w-3 h-3 text-slate-500" />
                    <span>{t.backdoorDealerBrandsEditBtn || "Editar"}</span>
                  </button>

                  {deleteConfirmId === brand.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(brand.id)}
                        className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition"
                        title="Confirmar eliminación"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs transition"
                        title="Cancelar"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(brand.id)}
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg border border-transparent hover:border-red-200 transition"
                      title={t.backdoorHomeDeleteItem || "Eliminar"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#C02030]/10 text-[#C02030] flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingBrand
                      ? t.backdoorDealerBrandsEditBtn || "Editar Marca Distribuidora"
                      : t.backdoorDealerBrandsAddBtn || "Agregar Marca Distribuidora"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === "es"
                      ? "Aparecerá en la rueda continua de marcas de la página principal"
                      : "Will appear in the continuous brand wheel on the home page"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Error / Feedback Banner */}
            {modalFeedback && (
              <div
                className={`mx-6 mt-4 p-3 rounded-xl border flex items-center justify-between text-xs font-medium transition ${
                  modalFeedback.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {modalFeedback.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{modalFeedback.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setModalFeedback(null)}
                  className="text-xs opacity-70 hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Brand Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <span>{t.backdoorDealerBrandsName || "Nombre de la Marca"}</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder={t.backdoorDealerBrandsNamePlaceholder || "Ej: Bikeman Performance, SuperATV, Dynojet..."}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C02030]"
                />
              </div>

              {/* Brand SKU Prefix */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>{t.backdoorDealerBrandsCode}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-[#C02030] rounded font-mono font-bold">
                      SKU Prefix
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {t.backdoorDealerBrandsCodeHelp}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder={t.backdoorDealerBrandsCodePlaceholder}
                    maxLength={10}
                    className="w-full px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C02030]"
                  />
                </div>
              </div>

              {/* Logo Upload & Preview */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span>{t.backdoorDealerBrandsLogo || "Logo / Imagen de la Marca"}</span>
                    <span className="text-red-500">*</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualUrl(!showManualUrl)}
                    className="text-[10px] text-[#C02030] hover:underline font-medium"
                  >
                    {showManualUrl
                      ? lang === "es"
                        ? "Usar selector de archivo"
                        : "Use file upload"
                      : t.backdoorHomeManualUrlToggle || "O ingresar URL manual"}
                  </button>
                </label>

                {/* Upload File Button */}
                {!showManualUrl && (
                  <div className="space-y-2">
                    <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 hover:border-[#C02030] bg-slate-50 hover:bg-red-50/20 rounded-xl cursor-pointer transition text-xs font-semibold text-slate-700">
                      <Upload className={`w-4 h-4 text-[#C02030] ${uploadingLogo ? "animate-bounce" : ""}`} />
                      <span>
                        {uploadingLogo
                          ? t.backdoorDealerBrandsUploadingLogo || "Subiendo logo..."
                          : formLogoUrl
                          ? t.backdoorDealerBrandsChangeLogo || "Cambiar Logo (PNG, SVG, JPG)"
                          : t.backdoorDealerBrandsUploadLogo || "Subir Logo de la Marca (PNG, SVG, JPG)"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                    </label>

                    {logoUploadError && (
                      <p className="text-[11px] text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{logoUploadError}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Manual URL Input */}
                {showManualUrl && (
                  <input
                    type="text"
                    value={formLogoUrl}
                    onChange={(e) => setFormLogoUrl(e.target.value)}
                    placeholder="https://... o /images/logos/..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C02030]"
                  />
                )}

                {/* Live Logo Preview Box */}
                {formLogoUrl && (
                  <div className="relative h-24 bg-gradient-to-r from-slate-100 via-white to-slate-100 rounded-xl border border-slate-200 p-2 flex items-center justify-center">
                    <div className="relative h-full w-full">
                      <Image
                        src={formLogoUrl}
                        alt="Logo preview"
                        fill
                        unoptimized={formLogoUrl.startsWith("http")}
                        className="object-contain"
                        sizes="160px"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormLogoUrl("")}
                      className="absolute top-2 right-2 p-1 rounded-full bg-white text-slate-500 hover:text-red-600 shadow-sm border border-slate-200"
                      title={t.backdoorDealerBrandsRemoveLogo || "Quitar Logo"}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Search Redirect URL */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <span>{t.backdoorDealerBrandsRedirectUrl || "Redirección de Búsqueda al Hacer Clic"}</span>
                  </label>
                  {formName.trim() && (
                    <button
                      type="button"
                      onClick={handleAutoFillRedirect}
                      className="text-[10px] text-[#C02030] hover:underline font-semibold flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{t.backdoorDealerBrandsAutoRedirectHint || "Generar búsqueda automática"}</span>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={formRedirectUrl}
                    onChange={(e) => setFormRedirectUrl(e.target.value)}
                    placeholder={
                      t.backdoorDealerBrandsRedirectPlaceholder ||
                      "Ej: /productos?brand=Bikeman o /productos?q=Bikeman"
                    }
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C02030] font-mono text-[11px]"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  {lang === "es"
                    ? "Al hacer clic en el logo en la página de inicio, el usuario será dirigido a esta ruta o búsqueda."
                    : "When clicked in the homepage wheel, the user will be redirected to this route or search query."}
                </p>
              </div>

              {/* Order and Active Switch */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {t.backdoorDealerBrandsOrder || "Orden en la Rueda"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formOrder}
                    onChange={(e) => setFormOrder(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C02030]"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="text-xs font-bold text-slate-700">
                    {t.backdoorDealerBrandsIsActive || "Visible en la Rueda"}
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormIsActive(!formIsActive)}
                    className={`w-full py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      formIsActive
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-slate-100 border-slate-300 text-slate-600"
                    }`}
                  >
                    {formIsActive ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t.backdoorHomeStatusActive || "Activo (Visible)"}</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t.backdoorHomeStatusInactive || "Inactivo (Oculto)"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                >
                  {t.backdoorHomeCancelBtn || "Cancelar"}
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingLogo}
                  className="px-4 py-2 bg-[#C02030] hover:bg-[#A01828] text-white text-xs font-bold rounded-lg shadow-sm transition disabled:opacity-60 flex items-center gap-1.5"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {submitting
                      ? t.backdoorHomeSaving || "Guardando..."
                      : editingBrand
                      ? t.backdoorDealerBrandsEditBtn || "Guardar Cambios"
                      : t.backdoorDealerBrandsAddBtn || "Agregar Marca"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
