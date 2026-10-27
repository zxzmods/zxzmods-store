"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Car,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  X,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Truck,
  Upload,
} from "lucide-react";
import { uploadMediaDirect } from "@/lib/clientDirectUpload";

interface BrandItem {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
  modelsCount: number;
}

interface VehicleModelItem {
  id: string;
  brandId: string;
  brandName: string;
  brandSlug: string;
  slug: string;
  code?: string | null;
  name: string;
  category: string;
  years: number[];
  yearsJson: string;
  imageUrl?: string | null;
  pickupServiceAvailable: boolean;
  createdAt: string;
}

interface GarageVehiclesTabProps {
  userRole?: string;
}

const CATEGORY_OPTIONS = ["UTV", "ATV", "SSV"];
const QUICK_YEAR_OPTIONS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027];

export function GarageVehiclesTab({ userRole }: GarageVehiclesTabProps) {
  const { t, lang } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<VehicleModelItem[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<VehicleModelItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formBrandMode, setFormBrandMode] = useState<"existing" | "new">("existing");
  const [formBrandId, setFormBrandId] = useState("");
  const [formNewBrandName, setFormNewBrandName] = useState("");
  const [formNewBrandSlug, setFormNewBrandSlug] = useState("");
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formCategory, setFormCategory] = useState("UTV");
  const [formYearFrom, setFormYearFrom] = useState(2022);
  const [formYearTo, setFormYearTo] = useState(2027);
  const [formSelectedYears, setFormSelectedYears] = useState<number[]>([2024, 2025, 2026, 2027]);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formPickupServiceAvailable, setFormPickupServiceAvailable] = useState<boolean>(true);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setUploadProgress(0);
    try {
      const res = await uploadMediaDirect(file, {
        folder: "vehicles",
        lang,
        onProgress: (p) => setUploadProgress(p.percentage),
      });
      if (res.success && res.url) {
        setFormImageUrl(res.url);
      } else {
        setFeedback({
          type: "error",
          message: res.error || (lang === "es" ? "Error al subir imagen del vehículo" : "Failed to upload vehicle image"),
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || (lang === "es" ? "Error al subir imagen" : "Upload error"),
      });
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sys/vehicles");
      const data = await res.json();
      if (res.ok && data.success) {
        setBrands(data.brands || []);
        setModels(data.models || []);
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Error al cargar catálogo de vehículos",
        });
      }
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setFeedback({
        type: "error",
        message: "Error de conexión al cargar vehículos",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Open Modal for Create
  const handleOpenCreate = () => {
    setEditingModel(null);
    setFormBrandMode("existing");
    setFormBrandId(brands[0]?.id || "");
    setFormNewBrandName("");
    setFormNewBrandSlug("");
    setFormName("");
    setFormSlug("");
    setFormCode("");
    setFormCategory("UTV");
    setFormYearFrom(2022);
    setFormYearTo(2027);
    setFormSelectedYears([2024, 2025, 2026, 2027]);
    setFormImageUrl("");
    setFormPickupServiceAvailable(true);
    setFeedback(null);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (model: VehicleModelItem) => {
    setEditingModel(model);
    setFormBrandMode("existing");
    setFormBrandId(model.brandId);
    setFormNewBrandName("");
    setFormNewBrandSlug("");
    setFormName(model.name);
    setFormSlug(model.slug);
    setFormCode(model.code || model.slug.replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase());
    setFormCategory(model.category || "UTV");
    const sorted = [...model.years].sort((a, b) => a - b);
    if (sorted.length > 0) {
      setFormYearFrom(sorted[0]);
      setFormYearTo(sorted[sorted.length - 1]);
      setFormSelectedYears(sorted);
    } else {
      setFormYearFrom(2022);
      setFormYearTo(2027);
      setFormSelectedYears([2024, 2025, 2026, 2027]);
    }
    setFormImageUrl(model.imageUrl || "");
    setFormPickupServiceAvailable(model.pickupServiceAvailable !== false);
    setFeedback(null);
    setIsModalOpen(true);
  };

  // Auto-generate slug and suggested SKU code when model name changes in Create mode
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingModel) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormSlug(generated);
      const cleanCode = val.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase();
      setFormCode(cleanCode);
    }
  };

  // Handle Quick Range Apply
  const handleApplyYearRange = () => {
    const from = Math.min(Number(formYearFrom), Number(formYearTo));
    const to = Math.max(Number(formYearFrom), Number(formYearTo));
    const generated: number[] = [];
    for (let y = from; y <= to; y++) {
      generated.push(y);
    }
    setFormSelectedYears(generated);
  };

  // Toggle Individual Year
  const handleToggleYear = (year: number) => {
    if (formSelectedYears.includes(year)) {
      setFormSelectedYears(formSelectedYears.filter((y) => y !== year));
    } else {
      setFormSelectedYears([...formSelectedYears, year].sort((a, b) => a - b));
    }
  };

  // Submit Save or Update
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFeedback({ type: "error", message: "El nombre del modelo es obligatorio" });
      return;
    }
    if (formBrandMode === "existing" && !formBrandId) {
      setFeedback({ type: "error", message: "Selecciona una marca para el vehículo" });
      return;
    }
    if (formBrandMode === "new" && !formNewBrandName.trim()) {
      setFeedback({ type: "error", message: "Ingresa el nombre de la nueva marca" });
      return;
    }
    if (formSelectedYears.length === 0) {
      setFeedback({ type: "error", message: "Selecciona al menos un año compatible" });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const isEdit = Boolean(editingModel);
    const url = isEdit ? `/api/sys/vehicles/${editingModel?.id}` : "/api/sys/vehicles";
    const method = isEdit ? "PATCH" : "POST";

    const payload: any = {
      name: formName.trim(),
      slug: formSlug.trim() || undefined,
      code: formCode.trim().toUpperCase() || undefined,
      category: formCategory,
      years: formSelectedYears,
      imageUrl: formImageUrl.trim() || null,
      pickupServiceAvailable: formPickupServiceAvailable,
    };

    if (isEdit) {
      payload.brandId = formBrandId;
    } else {
      if (formBrandMode === "new") {
        payload.newBrandName = formNewBrandName.trim();
        payload.newBrandSlug = formNewBrandSlug.trim() || undefined;
      } else {
        payload.brandId = formBrandId;
      }
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await fetchVehicles();
        setIsModalOpen(false);
        setFeedback({
          type: "success",
          message: isEdit
            ? t.backdoorVehiclesUpdateSuccess
            : t.backdoorVehiclesSaveSuccess,
        });
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Error al guardar el modelo de vehículo",
        });
      }
    } catch (err) {
      console.error("Error saving vehicle model:", err);
      setFeedback({
        type: "error",
        message: "Error de red al guardar el modelo",
      });
    } finally {
      setSaving(false);
    }
  };

  // Delete Vehicle Model
  const handleDeleteModel = async (id: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/sys/vehicles/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setModels((prev) => prev.filter((m) => m.id !== id));
        setDeleteConfirmId(null);
        setFeedback({
          type: "success",
          message: t.backdoorVehiclesDeleteSuccess,
        });
      } else {
        setFeedback({
          type: "error",
          message: data.error || "Error al eliminar el modelo de vehículo",
        });
      }
    } catch (err) {
      console.error("Error deleting vehicle model:", err);
      setFeedback({
        type: "error",
        message: "Error de conexión al eliminar el modelo",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Models
  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      // Text Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = model.name.toLowerCase().includes(query);
        const matchesBrand = model.brandName.toLowerCase().includes(query);
        const matchesSlug = model.slug.toLowerCase().includes(query);
        if (!matchesName && !matchesBrand && !matchesSlug) return false;
      }

      // Brand Filter
      if (selectedBrandFilter !== "all") {
        if (model.brandSlug.toLowerCase() !== selectedBrandFilter.toLowerCase()) {
          return false;
        }
      }

      // Category Filter
      if (selectedCategoryFilter !== "all") {
        if (model.category.toLowerCase() !== selectedCategoryFilter.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [models, searchQuery, selectedBrandFilter, selectedCategoryFilter]);

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-[#C02030] flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {t.backdoorVehiclesTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            {t.backdoorVehiclesSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-[#C02030] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t.backdoorVehiclesAddBtn}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">
            {t.backdoorVehiclesTotalBrands}
          </span>
          <span className="text-xl font-extrabold text-slate-900">
            {brands.length}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">
            {t.backdoorVehiclesTotalModels}
          </span>
          <span className="text-xl font-extrabold text-slate-900">
            {models.length}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">
            Plataformas UTV
          </span>
          <span className="text-xl font-extrabold text-[#C02030]">
            {models.filter((m) => m.category.toUpperCase() === "UTV").length}
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500 block">
            Plataformas ATV / SSV
          </span>
          <span className="text-xl font-extrabold text-emerald-600">
            {models.filter((m) => m.category.toUpperCase() !== "UTV").length}
          </span>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-3 shadow-xs border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.backdoorVehiclesSearchPlaceholder}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition"
          />
        </div>

        {/* Brand Filter */}
        <div className="w-full sm:w-48">
          <select
            value={selectedBrandFilter}
            onChange={(e) => setSelectedBrandFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-slate-900 transition"
          >
            <option value="all">{t.backdoorVehiclesFilterAllBrands}</option>
            {brands.map((b) => (
              <option key={b.id} value={b.slug}>
                {b.name} ({b.modelsCount})
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="w-full sm:w-40">
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-slate-900 transition"
          >
            <option value="all">{t.backdoorVehiclesFilterAllCategories}</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area: Mandatory Animated Skeleton Loader */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5 shadow-xs"
            >
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <Skeleton className="h-3.5 w-1/2 rounded-md" />
              <div className="flex gap-1.5 pt-2">
                <Skeleton className="h-4 w-10 rounded-md" />
                <Skeleton className="h-4 w-10 rounded-md" />
                <Skeleton className="h-4 w-10 rounded-md" />
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <Skeleton className="h-8 w-16 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Car className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {t.backdoorVehiclesEmptyState}
          </h3>
          <p className="text-xs text-slate-500">
            {searchQuery || selectedBrandFilter !== "all" || selectedCategoryFilter !== "all"
              ? "Prueba cambiando o limpiando los filtros de búsqueda."
              : "Comienza agregando el primer modelo de vehículo para la tienda."}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-[#C02030] text-white text-xs font-semibold transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.backdoorVehiclesAddBtn}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map((model) => (
            <div
              key={model.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 shadow-xs flex flex-col justify-between transition hover:shadow-sm group"
            >
              <div className="space-y-3">
                {/* Header: Brand, Category and SKU badges */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-bold uppercase tracking-wider">
                    {model.brandName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {model.code && (
                      <span className="px-2 py-0.5 rounded-md bg-red-100 border border-red-200 text-[#C02030] text-[10px] font-mono font-black">
                        SKU: {model.code}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold">
                      {model.category}
                    </span>
                  </div>
                </div>

                {/* Model Title */}
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-[#C02030] transition leading-snug">
                    {model.name}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                    slug: {model.slug}
                  </span>
                </div>

                {/* Years Chips */}
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                    {t.backdoorVehiclesYearsLabel} ({model.years.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {model.years.map((year) => (
                      <span
                        key={year}
                        className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700"
                      >
                        {year}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Activo</span>
                  </span>

                  {model.pickupServiceAvailable !== false ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1" title="Compatible con Servicio Pick-up">
                      <Truck className="w-3 h-3" />
                      <span>Pick-up ✓</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1" title="Incompatible con Servicio Pick-up">
                      <Truck className="w-3 h-3 text-rose-500" />
                      <span>Pick-up ✗</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(model)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                    title="Editar vehículo"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(model.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Eliminar vehículo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4 animate-scale-in">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t.backdoorVehiclesDeleteConfirm}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Esta acción removerá el modelo de las listas de selección de Mi Garaje para los clientes.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteModel(deleteConfirmId)}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1.5"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Eliminar Modelo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 max-w-lg w-full shadow-2xl my-8 space-y-5 animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingModel
                    ? t.backdoorVehiclesModalEditTitle
                    : t.backdoorVehiclesModalCreateTitle}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configura los detalles del vehículo para que los usuarios puedan agregarlo a Mi Garaje.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Brand Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    {t.backdoorVehiclesBrandLabel} *
                  </label>
                  {!editingModel && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormBrandMode(formBrandMode === "existing" ? "new" : "existing")
                      }
                      className="text-[11px] font-semibold text-[#C02030] hover:underline"
                    >
                      {formBrandMode === "existing"
                        ? t.backdoorVehiclesCreateNewBrandToggle
                        : "Seleccionar marca existente"}
                    </button>
                  )}
                </div>

                {formBrandMode === "existing" ? (
                  <select
                    value={formBrandId}
                    onChange={(e) => setFormBrandId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:border-slate-900 transition"
                  >
                    <option value="">{t.backdoorVehiclesSelectBrandPrompt}</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-600 block mb-1">
                        {t.backdoorVehiclesNewBrandName} *
                      </span>
                      <input
                        type="text"
                        value={formNewBrandName}
                        onChange={(e) => {
                          setFormNewBrandName(e.target.value);
                          setFormNewBrandSlug(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, "-")
                              .replace(/(^-|-$)/g, "")
                          );
                        }}
                        placeholder="ej: Arctic Cat"
                        required={formBrandMode === "new"}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:border-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-600 block mb-1">
                        {t.backdoorVehiclesNewBrandSlug}
                      </span>
                      <input
                        type="text"
                        value={formNewBrandSlug}
                        onChange={(e) => setFormNewBrandSlug(e.target.value)}
                        placeholder="ej: arctic-cat"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Model Name, Slug, and Vehicle SKU Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-800">
                    {t.backdoorVehiclesModelNameLabel} *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="ej: ZForce Z10 / Z10-4"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-slate-900 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">
                    {t.backdoorVehiclesModelSlugLabel}
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="ej: zforce-z10"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-slate-900 transition"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span>{t.backdoorVehiclesModelCodeLabel}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-red-100 text-[#C02030] rounded font-mono font-bold">
                        SKU
                      </span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder={t.backdoorVehiclesModelCodePlaceholder}
                    maxLength={10}
                    className="w-full px-3 py-2 rounded-lg border border-red-200 font-mono font-bold uppercase tracking-wider text-xs text-slate-900 focus:outline-none focus:border-red-500 bg-red-50/20 transition"
                  />
                  <p className="text-[10px] text-slate-400">
                    {t.backdoorVehiclesModelCodeHelp}
                  </p>
                </div>
              </div>

              {/* Category Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">
                  {t.backdoorVehiclesCategoryLabel} *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormCategory(cat)}
                      className={`py-2 rounded-lg text-xs font-bold border transition ${
                        formCategory === cat
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Years Range Configuration */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <label className="text-xs font-bold text-slate-800 block">
                  {t.backdoorVehiclesYearsLabel} *
                </label>

                {/* Quick Range Generator */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-500 block mb-0.5">
                      {t.backdoorVehiclesYearFromLabel}
                    </span>
                    <input
                      type="number"
                      min={1990}
                      max={2035}
                      value={formYearFrom}
                      onChange={(e) => setFormYearFrom(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800"
                    />
                  </div>

                  <div className="flex-1">
                    <span className="text-[10px] text-slate-500 block mb-0.5">
                      {t.backdoorVehiclesYearToLabel}
                    </span>
                    <input
                      type="number"
                      min={1990}
                      max={2035}
                      value={formYearTo}
                      onChange={(e) => setFormYearTo(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyYearRange}
                    className="mt-4 px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold hover:bg-slate-900 transition whitespace-nowrap"
                  >
                    Generar Rango
                  </button>
                </div>

                {/* Selected Years Chips */}
                <div className="pt-2">
                  <span className="text-[10px] text-slate-500 block mb-1">
                    Años seleccionados ({formSelectedYears.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_YEAR_OPTIONS.map((y) => {
                      const isSelected = formSelectedYears.includes(y);
                      return (
                        <button
                          key={y}
                          type="button"
                          onClick={() => handleToggleYear(y)}
                          className={`text-xs font-mono px-2 py-0.5 rounded-md border transition ${
                            isSelected
                              ? "bg-slate-900 text-white border-slate-900 font-bold"
                              : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                          }`}
                        >
                          {y}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Image Upload & URL */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>{t.backdoorVehiclesImageUrlLabel}</span>
                  {uploadingImage && (
                    <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {uploadProgress}%
                    </span>
                  )}
                </label>

                {/* Upload Button & Dropzone / Preview */}
                <div className="p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/70 space-y-3">
                  {formImageUrl ? (
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="relative w-16 h-16 rounded-md overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 flex items-center justify-center">
                        <img
                          src={formImageUrl}
                          alt="Vehicle preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate" title={formImageUrl}>
                          {formImageUrl}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                            <Upload className="w-3 h-3" />
                            <span>{t.backdoorVehiclesChangeImageBtn}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={uploadingImage}
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
                            onClick={() => setFormImageUrl("")}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{t.backdoorVehiclesRemoveImageBtn}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 text-center">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition shadow-sm">
                        {uploadingImage ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            <span>{t.backdoorVehiclesUploadingImage} {uploadProgress > 0 ? `(${uploadProgress}%)` : ""}</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 text-blue-600" />
                            <span>{t.backdoorVehiclesUploadImageBtn}</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingImage}
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        PNG, JPG, WEBP ({lang === "es" ? "Recomendado foto frontal o lateral recortada" : "Recommended cropped front or side view"})
                      </p>
                    </div>
                  )}

                  {uploadingImage && (
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}

                  {/* Manual URL input fallback */}
                  <div className="pt-2 border-t border-slate-200/80">
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder={lang === "es" ? "o escribe la URL: /images/sxs/z10_front.png o https://..." : "or type URL: /images/sxs/z10_front.png or https://..."}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Pick-Up Service Compatibility Toggle */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="cursor-pointer" onClick={() => setFormPickupServiceAvailable(!formPickupServiceAvailable)}>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                      <Truck className="w-4 h-4 text-slate-700" />
                      <span>{t.backdoorVehiclesPickupEligibleLabel || "Compatible con Servicio Pick-up (Remolque/Plataforma)"}</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {t.backdoorVehiclesPickupEligibleHelp || "Habilita si este vehículo califica para ser trasladado en remolque o plataforma."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormPickupServiceAvailable(!formPickupServiceAvailable)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formPickupServiceAvailable ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        formPickupServiceAvailable ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-[#C02030] hover:bg-[#A01825] text-white transition flex items-center gap-2 shadow-sm"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingModel ? "Actualizar Vehículo" : "Guardar Vehículo"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
