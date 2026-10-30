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
  Star,
  Tag,
  ImageIcon,
} from "lucide-react";
import { uploadMediaDirect } from "@/lib/clientDirectUpload";

interface BrandItem {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string | null;
  defaultVehicleImageUrl?: string | null;
  descriptionEs?: string;
  descriptionEn?: string;
  featured?: boolean;
  modelsCount: number;
  models?: Array<{ id: string; name: string; slug: string }>;
  createdAt?: string;
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
  modelCategory?: string | null;
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

  // Active Sub-tab: Models vs Brands
  const [activeSubtab, setActiveSubtab] = useState<"models" | "brands">("models");

  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [models, setModels] = useState<VehicleModelItem[]>([]);

  // Search & Filters for Models
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [selectedModelCategoryFilter, setSelectedModelCategoryFilter] = useState("all");

  // Search & Filters for Brands
  const [searchBrandQuery, setSearchBrandQuery] = useState("");
  const [selectedBrandFeaturedFilter, setSelectedBrandFeaturedFilter] = useState<"all" | "featured" | "standard">("all");

  // Model Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<VehicleModelItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Model Form State
  const [formBrandMode, setFormBrandMode] = useState<"existing" | "new">("existing");
  const [formBrandId, setFormBrandId] = useState("");
  const [formNewBrandName, setFormNewBrandName] = useState("");
  const [formNewBrandSlug, setFormNewBrandSlug] = useState("");
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formCategory, setFormCategory] = useState("UTV");
  const [formModelCategory, setFormModelCategory] = useState("");
  const [formYearFrom, setFormYearFrom] = useState(2022);
  const [formYearTo, setFormYearTo] = useState(2027);
  const [formSelectedYears, setFormSelectedYears] = useState<number[]>([2024, 2025, 2026, 2027]);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formPickupServiceAvailable, setFormPickupServiceAvailable] = useState<boolean>(true);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Brand Modal State
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
  const [savingBrand, setSavingBrand] = useState(false);
  const [deleteConfirmBrandId, setDeleteConfirmBrandId] = useState<string | null>(null);
  const [deletingBrand, setDeletingBrand] = useState(false);

  // Brand Form State
  const [formBrandName, setFormBrandName] = useState("");
  const [formBrandSlug, setFormBrandSlug] = useState("");
  const [formBrandLogoUrl, setFormBrandLogoUrl] = useState("");
  const [formBrandDefaultVehicleImageUrl, setFormBrandDefaultVehicleImageUrl] = useState("");
  const [formBrandDescriptionEs, setFormBrandDescriptionEs] = useState("");
  const [formBrandDescriptionEn, setFormBrandDescriptionEn] = useState("");
  const [formBrandFeatured, setFormBrandFeatured] = useState(false);

  // Brand Uploads State
  const [uploadingBrandLogo, setUploadingBrandLogo] = useState(false);
  const [uploadBrandLogoProgress, setUploadBrandLogoProgress] = useState(0);
  const [uploadingBrandVehicleImg, setUploadingBrandVehicleImg] = useState(false);
  const [uploadBrandVehicleProgress, setUploadBrandVehicleProgress] = useState(0);

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

  const handleBrandLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBrandLogo(true);
    setUploadBrandLogoProgress(0);
    try {
      const res = await uploadMediaDirect(file, {
        folder: "brands",
        lang,
        onProgress: (p) => setUploadBrandLogoProgress(p.percentage),
      });
      if (res.success && res.url) {
        setFormBrandLogoUrl(res.url);
      } else {
        setFeedback({
          type: "error",
          message: res.error || (lang === "es" ? "Error al subir logo de la marca" : "Failed to upload brand logo"),
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || (lang === "es" ? "Error al subir imagen" : "Upload error"),
      });
    } finally {
      setUploadingBrandLogo(false);
      e.target.value = "";
    }
  };

  const handleBrandVehicleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBrandVehicleImg(true);
    setUploadBrandVehicleProgress(0);
    try {
      const res = await uploadMediaDirect(file, {
        folder: "vehicles",
        lang,
        onProgress: (p) => setUploadBrandVehicleProgress(p.percentage),
      });
      if (res.success && res.url) {
        setFormBrandDefaultVehicleImageUrl(res.url);
      } else {
        setFeedback({
          type: "error",
          message: res.error || (lang === "es" ? "Error al subir imagen de vehículo" : "Failed to upload vehicle image"),
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || (lang === "es" ? "Error al subir imagen" : "Upload error"),
      });
    } finally {
      setUploadingBrandVehicleImg(false);
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
          message: data.error || (lang === "es" ? "Error al cargar catálogo de vehículos" : "Failed to load vehicle catalog"),
        });
      }
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      setFeedback({
        type: "error",
        message: lang === "es" ? "Error de conexión al cargar vehículos" : "Connection error loading vehicles",
      });
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // ==========================================
  // MODEL ACTIONS
  // ==========================================
  const handleOpenCreate = (preselectedBrandId?: string) => {
    setEditingModel(null);
    setFormBrandMode("existing");
    setFormBrandId(preselectedBrandId || brands[0]?.id || "");
    setFormNewBrandName("");
    setFormNewBrandSlug("");
    setFormName("");
    setFormSlug("");
    setFormCode("");
    setFormCategory("UTV");
    setFormModelCategory("");
    setFormYearFrom(2022);
    setFormYearTo(2027);
    setFormSelectedYears([2024, 2025, 2026, 2027]);
    setFormImageUrl("");
    setFormPickupServiceAvailable(true);
    setFeedback(null);
    setIsModalOpen(true);
  };

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
    setFormModelCategory(model.modelCategory || "");
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

  const handleApplyYearRange = () => {
    const from = Math.min(Number(formYearFrom), Number(formYearTo));
    const to = Math.max(Number(formYearFrom), Number(formYearTo));
    const generated: number[] = [];
    for (let y = from; y <= to; y++) {
      generated.push(y);
    }
    setFormSelectedYears(generated);
  };

  const handleToggleYear = (year: number) => {
    if (formSelectedYears.includes(year)) {
      setFormSelectedYears(formSelectedYears.filter((y) => y !== year));
    } else {
      setFormSelectedYears([...formSelectedYears, year].sort((a, b) => a - b));
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFeedback({ type: "error", message: lang === "es" ? "El nombre del modelo es obligatorio" : "Model name is required" });
      return;
    }
    if (formBrandMode === "existing" && !formBrandId) {
      setFeedback({ type: "error", message: lang === "es" ? "Selecciona una marca para el vehículo" : "Select a brand for the vehicle" });
      return;
    }
    if (formBrandMode === "new" && !formNewBrandName.trim()) {
      setFeedback({ type: "error", message: lang === "es" ? "Ingresa el nombre de la nueva marca" : "Enter new brand name" });
      return;
    }
    if (formSelectedYears.length === 0) {
      setFeedback({ type: "error", message: lang === "es" ? "Selecciona al menos un año compatible" : "Select at least one compatible year" });
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
      modelCategory: formModelCategory.trim() || null,
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
          message: data.error || (lang === "es" ? "Error al guardar el modelo de vehículo" : "Failed to save vehicle model"),
        });
      }
    } catch (err) {
      console.error("Error saving vehicle model:", err);
      setFeedback({
        type: "error",
        message: lang === "es" ? "Error de red al guardar el modelo" : "Network error saving model",
      });
    } finally {
      setSaving(false);
    }
  };

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
          message: data.error || (lang === "es" ? "Error al eliminar el modelo de vehículo" : "Failed to delete vehicle model"),
        });
      }
    } catch (err) {
      console.error("Error deleting vehicle model:", err);
      setFeedback({
        type: "error",
        message: lang === "es" ? "Error de conexión al eliminar el modelo" : "Connection error deleting model",
      });
    } finally {
      setDeleting(false);
    }
  };

  // ==========================================
  // BRAND ACTIONS
  // ==========================================
  const handleOpenCreateBrand = () => {
    setEditingBrand(null);
    setFormBrandName("");
    setFormBrandSlug("");
    setFormBrandLogoUrl("");
    setFormBrandDefaultVehicleImageUrl("");
    setFormBrandDescriptionEs("");
    setFormBrandDescriptionEn("");
    setFormBrandFeatured(false);
    setFeedback(null);
    setIsBrandModalOpen(true);
  };

  const handleOpenEditBrand = (brand: BrandItem) => {
    setEditingBrand(brand);
    setFormBrandName(brand.name);
    setFormBrandSlug(brand.slug);
    setFormBrandLogoUrl(brand.logoUrl || "");
    setFormBrandDefaultVehicleImageUrl(brand.defaultVehicleImageUrl || "");
    setFormBrandDescriptionEs(brand.descriptionEs || "");
    setFormBrandDescriptionEn(brand.descriptionEn || "");
    setFormBrandFeatured(Boolean(brand.featured));
    setFeedback(null);
    setIsBrandModalOpen(true);
  };

  const handleBrandNameChange = (val: string) => {
    setFormBrandName(val);
    if (!editingBrand) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormBrandSlug(generated);
    }
  };

  const handleSubmitBrandForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBrandName.trim()) {
      setFeedback({
        type: "error",
        message: lang === "es" ? "El nombre de la marca es obligatorio" : "Brand name is required",
      });
      return;
    }

    setSavingBrand(true);
    setFeedback(null);

    const isEdit = Boolean(editingBrand);
    const url = isEdit
      ? `/api/sys/vehicles/brands/${editingBrand?.id}`
      : "/api/sys/vehicles/brands";
    const method = isEdit ? "PATCH" : "POST";

    const payload = {
      name: formBrandName.trim(),
      slug: formBrandSlug.trim() || undefined,
      logoUrl: formBrandLogoUrl.trim() || null,
      defaultVehicleImageUrl: formBrandDefaultVehicleImageUrl.trim() || null,
      descriptionEs: formBrandDescriptionEs.trim() || undefined,
      descriptionEn: formBrandDescriptionEn.trim() || undefined,
      featured: formBrandFeatured,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await fetchVehicles();
        setIsBrandModalOpen(false);
        setFeedback({
          type: "success",
          message: isEdit
            ? t.backdoorVehiclesBrandUpdateSuccess
            : t.backdoorVehiclesBrandSaveSuccess,
        });
      } else {
        setFeedback({
          type: "error",
          message: data.error || (lang === "es" ? "Error al guardar la marca de vehículo" : "Failed to save vehicle brand"),
        });
      }
    } catch (err: any) {
      console.error("Error saving brand:", err);
      setFeedback({
        type: "error",
        message: lang === "es" ? "Error de red al guardar la marca" : "Network error saving brand",
      });
    } finally {
      setSavingBrand(false);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    setDeletingBrand(true);
    try {
      const res = await fetch(`/api/sys/vehicles/brands/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDeleteConfirmBrandId(null);
        await fetchVehicles();
        setFeedback({
          type: "success",
          message: t.backdoorVehiclesBrandDeleteSuccess,
        });
      } else {
        setFeedback({
          type: "error",
          message: data.error || (lang === "es" ? "Error al eliminar la marca" : "Failed to delete brand"),
        });
      }
    } catch (err) {
      console.error("Error deleting brand:", err);
      setFeedback({
        type: "error",
        message: lang === "es" ? "Error de conexión al eliminar la marca" : "Connection error deleting brand",
      });
    } finally {
      setDeletingBrand(false);
    }
  };

  // Filtered Models
  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = model.name.toLowerCase().includes(query);
        const matchesBrand = model.brandName.toLowerCase().includes(query);
        const matchesSlug = model.slug.toLowerCase().includes(query);
        if (!matchesName && !matchesBrand && !matchesSlug) return false;
      }

      if (selectedBrandFilter !== "all") {
        if (model.brandSlug.toLowerCase() !== selectedBrandFilter.toLowerCase()) {
          return false;
        }
      }

      if (selectedCategoryFilter !== "all") {
        if (model.category.toLowerCase() !== selectedCategoryFilter.toLowerCase()) {
          return false;
        }
      }

      if (selectedModelCategoryFilter !== "all") {
        if ((model.modelCategory || "").toLowerCase() !== selectedModelCategoryFilter.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [models, searchQuery, selectedBrandFilter, selectedCategoryFilter, selectedModelCategoryFilter]);

  const availableModelCategories = useMemo(() => {
    const set = new Set<string>();
    models.forEach((m) => {
      if (selectedBrandFilter !== "all" && m.brandSlug.toLowerCase() !== selectedBrandFilter.toLowerCase()) {
        return;
      }
      if (m.modelCategory) set.add(m.modelCategory);
    });
    return Array.from(set).sort();
  }, [models, selectedBrandFilter]);

  const brandCategorySuggestions = useMemo(() => {
    const targetBrand = formBrandId ? brands.find((b) => b.id === formBrandId) : null;
    if (!targetBrand) return [];
    const set = new Set<string>();
    models
      .filter((m) => m.brandId === targetBrand.id || m.brandSlug === targetBrand.slug)
      .forEach((m) => {
        if (m.modelCategory) set.add(m.modelCategory);
      });
    return Array.from(set).sort();
  }, [formBrandId, brands, models]);

  // Filtered Brands
  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      if (searchBrandQuery.trim()) {
        const q = searchBrandQuery.toLowerCase().trim();
        const matchesName = brand.name.toLowerCase().includes(q);
        const matchesSlug = brand.slug.toLowerCase().includes(q);
        const matchesDescEs = (brand.descriptionEs || "").toLowerCase().includes(q);
        const matchesDescEn = (brand.descriptionEn || "").toLowerCase().includes(q);
        if (!matchesName && !matchesSlug && !matchesDescEs && !matchesDescEn) return false;
      }

      if (selectedBrandFeaturedFilter === "featured") {
        return Boolean(brand.featured);
      }
      if (selectedBrandFeaturedFilter === "standard") {
        return !brand.featured;
      }

      return true;
    });
  }, [brands, searchBrandQuery, selectedBrandFeaturedFilter]);

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation: Models vs Brands */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubtab("models")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeSubtab === "models"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Car className="w-4 h-4" />
          <span>{t.backdoorVehiclesSubtabModels}</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeSubtab === "models" ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {models.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubtab("brands")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeSubtab === "brands"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t.backdoorVehiclesSubtabBrands}</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeSubtab === "brands" ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {brands.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: VEHICLE MODELS                                                 */}
      {/* ========================================================================= */}
      {activeSubtab === "models" && (
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
                onClick={() => handleOpenCreate()}
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
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.backdoorVehiclesSearchPlaceholder}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Brand Filter */}
              <select
                value={selectedBrandFilter}
                onChange={(e) => setSelectedBrandFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:border-slate-900 transition w-full sm:w-auto"
              >
                <option value="all">{t.backdoorVehiclesFilterAllBrands}</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:border-slate-900 transition w-full sm:w-auto"
              >
                <option value="all">{t.backdoorVehiclesFilterAllCategories}</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Brand Model Category Filter */}
              {availableModelCategories.length > 0 && (
                <select
                  value={selectedModelCategoryFilter}
                  onChange={(e) => setSelectedModelCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:border-slate-900 transition w-full sm:w-auto"
                >
                  <option value="all">
                    {lang === "es" ? "Todas las Familias en Marca" : "All Model Categories"}
                  </option>
                  {availableModelCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
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
                {lang === "es"
                  ? "Prueba a cambiar tus criterios de búsqueda o agrega un nuevo modelo al catálogo."
                  : "Try changing your search filters or add a new vehicle model to the catalog."}
              </p>
              <button
                type="button"
                onClick={() => handleOpenCreate()}
                className="mt-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-[#C02030] transition inline-flex items-center gap-1.5 shadow-xs"
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
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Top Row: Brand & Category Badge */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-extrabold tracking-wide uppercase">
                          {model.brandName}
                        </span>
                        {model.modelCategory && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                            {model.modelCategory}
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                          model.category.toUpperCase() === "UTV"
                            ? "bg-red-50 text-[#C02030] border border-red-100"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}
                      >
                        {model.category}
                      </span>
                    </div>

                    {/* Model Title & Code */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>{model.name}</span>
                        {model.code && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-medium">
                            [{model.code}]
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        slug: @{model.slug}
                      </p>
                    </div>

                    {/* Image Preview if provided */}
                    {model.imageUrl && (
                      <div className="relative h-28 w-full bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center p-2">
                        <img
                          src={model.imageUrl}
                          alt={model.name}
                          className="h-full w-full object-contain filter drop-shadow-xs"
                        />
                      </div>
                    )}

                    {/* Pick-up / Tow Compatibility Indicator */}
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      <Truck className={`w-3.5 h-3.5 ${model.pickupServiceAvailable ? "text-emerald-600" : "text-slate-400"}`} />
                      <span>
                        {model.pickupServiceAvailable
                          ? (lang === "es" ? "Apto para Pick-up (Remolque)" : "Pick-up eligible (Trailer)")
                          : (lang === "es" ? "No apto para Pick-up" : "Not eligible for Pick-up")}
                      </span>
                    </div>

                    {/* Years Range Pills */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        {t.backdoorVehiclesYearsLabel} ({model.years.length}):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {model.years.slice(0, 6).map((y) => (
                          <span
                            key={y}
                            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
                          >
                            {y}
                          </span>
                        ))}
                        {model.years.length > 6 && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-medium">
                            +{model.years.length - 6} más
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      {new Date(model.createdAt).toLocaleDateString()}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(model)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      {deleteConfirmId === model.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteModel(model.id)}
                            disabled={deleting}
                            className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 transition flex items-center gap-1"
                          >
                            {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                            <span>Sí</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[11px] font-bold hover:bg-slate-200 transition"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(model.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Eliminar modelo"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: VEHICLE BRANDS                                                  */}
      {/* ========================================================================= */}
      {activeSubtab === "brands" && (
        <div className="space-y-6">
          {/* Header & Stats Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-[#C02030] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  {t.backdoorVehiclesBrandsTitle}
                </h2>
              </div>
              <p className="text-xs text-slate-500 max-w-2xl">
                {t.backdoorVehiclesBrandsSubtitle}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleOpenCreateBrand}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-[#C02030] text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{t.backdoorVehiclesAddBrandBtn}</span>
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
                {lang === "es" ? "Con Logo Oficial" : "With Official Logo"}
              </span>
              <span className="text-xl font-extrabold text-emerald-600">
                {brands.filter((b) => b.logoUrl).length}
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">
                {lang === "es" ? "Con Vehículo por Defecto" : "With Default Vehicle"}
              </span>
              <span className="text-xl font-extrabold text-[#C02030]">
                {brands.filter((b) => b.defaultVehicleImageUrl).length}
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[11px] font-medium text-slate-500 block">
                {lang === "es" ? "Marcas Destacadas" : "Featured Brands"}
              </span>
              <span className="text-xl font-extrabold text-amber-500">
                {brands.filter((b) => b.featured).length}
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
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Search & Filter Bar for Brands */}
          <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchBrandQuery}
                onChange={(e) => setSearchBrandQuery(e.target.value)}
                placeholder={t.backdoorVehiclesBrandSearchPlaceholder}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition"
              />
              {searchBrandQuery && (
                <button
                  type="button"
                  onClick={() => setSearchBrandQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedBrandFeaturedFilter}
                onChange={(e) => setSelectedBrandFeaturedFilter(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:border-slate-900 transition w-full sm:w-auto"
              >
                <option value="all">{t.backdoorVehiclesBrandFilterAll}</option>
                <option value="featured">{t.backdoorVehiclesBrandFilterFeatured}</option>
                <option value="standard">{t.backdoorVehiclesBrandFilterStandard}</option>
              </select>
            </div>
          </div>

          {/* Brands Content Area: Animated Skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs"
                >
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-24 rounded-lg" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-3/4 rounded-md" />
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-3.5 w-full rounded-md" />
                    <Skeleton className="h-3.5 w-2/3 rounded-md" />
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                    <Skeleton className="h-4 w-24 rounded-md" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {t.backdoorVehiclesBrandEmptyState}
              </h3>
              <p className="text-xs text-slate-500">
                {lang === "es"
                  ? "Agrega una nueva marca para registrar vehículos en el Garaje."
                  : "Add a new brand to register vehicles in the Garage."}
              </p>
              <button
                type="button"
                onClick={handleOpenCreateBrand}
                className="mt-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-[#C02030] transition inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.backdoorVehiclesAddBrandBtn}</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBrands.map((brand) => (
                <div
                  key={brand.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Row: Brand Logo & Featured Badge & Actions */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-10 rounded-xl bg-slate-50 border border-slate-100 p-1.5 flex items-center justify-center overflow-hidden">
                          {brand.logoUrl ? (
                            <img
                              src={brand.logoUrl}
                              alt={brand.name}
                              className="max-h-full max-w-full object-contain filter drop-shadow-xs"
                            />
                          ) : (
                            <Layers className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                            {brand.name}
                          </h3>
                          <span className="text-[11px] font-mono text-slate-400 block">
                            @{brand.slug}
                          </span>
                        </div>
                      </div>

                      {brand.featured && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{lang === "es" ? "Destacada" : "Featured"}</span>
                        </span>
                      )}
                    </div>

                    {/* Default Vehicle Image Showcase */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-semibold">{t.backdoorVehiclesBrandDefaultVehicleImgLabel}:</span>
                        {brand.defaultVehicleImageUrl && (
                          <span className="text-emerald-600 font-bold text-[10px] flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>{lang === "es" ? "Configurada" : "Active"}</span>
                          </span>
                        )}
                      </div>

                      <div className="relative h-32 w-full rounded-xl bg-slate-50/90 border border-slate-200/80 p-3 flex items-center justify-center overflow-hidden">
                        {brand.defaultVehicleImageUrl ? (
                          <img
                            src={brand.defaultVehicleImageUrl}
                            alt={`${brand.name} default vehicle`}
                            className="max-h-full max-w-full object-contain filter drop-shadow-sm transition-transform hover:scale-105 duration-300"
                          />
                        ) : (
                          <div className="text-center space-y-1 p-2">
                            <ImageIcon className="w-6 h-6 text-slate-300 mx-auto" />
                            <span className="text-[11px] font-medium text-slate-400 block leading-tight">
                              {lang === "es"
                                ? "Sin imagen por defecto configurada (Se usará logo)"
                                : "No default image set (Logo will be used)"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Models Count & Pill Previews */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-700">
                          {brand.modelsCount} {t.backdoorVehiclesBrandModelsCount}
                        </span>
                      </div>
                      {brand.models && brand.models.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {brand.models.slice(0, 5).map((m) => (
                            <span
                              key={m.id}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                            >
                              {m.name}
                            </span>
                          ))}
                          {brand.models.length > 5 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-400 text-[10px]">
                              +{brand.models.length - 5}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic block">
                          {lang === "es" ? "Aún sin modelos registrados" : "No models registered yet"}
                        </span>
                      )}
                    </div>

                    {/* Bilingual Descriptions */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 text-[11px]">
                      {brand.descriptionEs && (
                        <div>
                          <span className="font-bold text-slate-600 block text-[10px] uppercase">ES:</span>
                          <p className="text-slate-600 line-clamp-2 leading-relaxed">
                            {brand.descriptionEs}
                          </p>
                        </div>
                      )}
                      {brand.descriptionEn && (
                        <div className="pt-1.5 border-t border-slate-200/60">
                          <span className="font-bold text-slate-600 block text-[10px] uppercase">EN:</span>
                          <p className="text-slate-600 line-clamp-2 leading-relaxed">
                            {brand.descriptionEn}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubtab("models");
                        handleOpenCreate(brand.id);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#C02030]" />
                      <span>{lang === "es" ? "Agregar Modelo" : "Add Model"}</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditBrand(brand)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                        <span>{t.backdoorVehiclesEditBrandBtn}</span>
                      </button>

                      {deleteConfirmBrandId === brand.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteBrand(brand.id)}
                            disabled={deletingBrand}
                            className="px-2 py-1 rounded bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 transition flex items-center gap-1"
                          >
                            {deletingBrand && <Loader2 className="w-3 h-3 animate-spin" />}
                            <span>Sí</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmBrandId(null)}
                            className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-[11px] font-bold hover:bg-slate-200 transition"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmBrandId(brand.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Eliminar marca"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* BRAND MODAL (ADD / EDIT BRAND)                                           */}
      {/* ========================================================================= */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-[#C02030] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingBrand
                      ? t.backdoorVehiclesBrandModalEditTitle
                      : t.backdoorVehiclesBrandModalCreateTitle}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === "es"
                      ? "Configura todos los datos de la marca, logos e imagen por defecto."
                      : "Configure brand info, official logos, and default vehicle image."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBrandModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitBrandForm} className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Brand Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t.backdoorVehiclesBrandNameLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formBrandName}
                    onChange={(e) => handleBrandNameChange(e.target.value)}
                    placeholder="ej: CAN-AM, CFMOTO, POLARIS"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t.backdoorVehiclesBrandSlugLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formBrandSlug}
                    onChange={(e) => setFormBrandSlug(e.target.value)}
                    placeholder="ej: can-am, cfmoto, polaris"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition font-mono"
                  />
                </div>
              </div>

              {/* Official Brand Logo */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
                    <span>{t.backdoorVehiclesBrandLogoLabel}</span>
                  </label>
                  {uploadingBrandLogo && (
                    <span className="text-[10px] text-emerald-600 font-semibold animate-pulse flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>{t.backdoorVehiclesBrandUploadingLogo}</span>
                    </span>
                  )}
                </div>

                {formBrandLogoUrl ? (
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-12 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden">
                      <img
                        src={formBrandLogoUrl}
                        alt="Logo preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-[11px] font-mono text-slate-600 truncate block">
                        {formBrandLogoUrl}
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-bold text-slate-900 hover:text-[#C02030] cursor-pointer">
                          <span>{t.backdoorVehiclesChangeImageBtn}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBrandLogoUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormBrandLogoUrl("")}
                          className="text-[11px] font-medium text-rose-600 hover:text-rose-700"
                        >
                          {t.backdoorVehiclesRemoveImageBtn}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="border-2 border-dashed border-slate-200 hover:border-slate-400 bg-white rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition">
                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-700">
                        {uploadingBrandLogo
                          ? `${t.backdoorVehiclesBrandUploadingLogo} (${uploadBrandLogoProgress}%)`
                          : t.backdoorVehiclesBrandUploadLogoBtn}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        PNG, SVG, WEBP o JPG
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBrandLogoUpload}
                        disabled={uploadingBrandLogo}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      value={formBrandLogoUrl}
                      onChange={(e) => setFormBrandLogoUrl(e.target.value)}
                      placeholder="/images/logos/can-am.png o https://..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition"
                    />
                  </div>
                )}
              </div>

              {/* Default Vehicle Image */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-[#C02030]" />
                      <span>{t.backdoorVehiclesBrandDefaultVehicleImgLabel}</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {t.backdoorVehiclesBrandDefaultVehicleImgHelp}
                    </p>
                  </div>
                  {uploadingBrandVehicleImg && (
                    <span className="text-[10px] text-emerald-600 font-semibold animate-pulse flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>{t.backdoorVehiclesBrandUploadingVehicleImg}</span>
                    </span>
                  )}
                </div>

                {formBrandDefaultVehicleImageUrl ? (
                  <div className="flex items-center gap-3">
                    <div className="relative w-24 h-16 rounded-lg bg-white border border-slate-200 p-1 flex items-center justify-center overflow-hidden">
                      <img
                        src={formBrandDefaultVehicleImageUrl}
                        alt="Vehicle preview"
                        className="max-h-full max-w-full object-contain filter drop-shadow-xs"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <span className="text-[11px] font-mono text-slate-600 truncate block">
                        {formBrandDefaultVehicleImageUrl}
                      </span>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] font-bold text-slate-900 hover:text-[#C02030] cursor-pointer">
                          <span>{t.backdoorVehiclesChangeImageBtn}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBrandVehicleImageUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormBrandDefaultVehicleImageUrl("")}
                          className="text-[11px] font-medium text-rose-600 hover:text-rose-700"
                        >
                          {t.backdoorVehiclesRemoveImageBtn}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="border-2 border-dashed border-slate-200 hover:border-slate-400 bg-white rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition">
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-700">
                        {uploadingBrandVehicleImg
                          ? `${t.backdoorVehiclesBrandUploadingVehicleImg} (${uploadBrandVehicleProgress}%)`
                          : t.backdoorVehiclesBrandUploadVehicleImgBtn}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        PNG o WEBP sin fondo recomendado (/images/sxs/...)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBrandVehicleImageUpload}
                        disabled={uploadingBrandVehicleImg}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      value={formBrandDefaultVehicleImageUrl}
                      onChange={(e) => setFormBrandDefaultVehicleImageUrl(e.target.value)}
                      placeholder="/images/sxs/canam_sxs.png o https://..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition"
                    />
                  </div>
                )}
              </div>

              {/* Spanish Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {t.backdoorVehiclesBrandDescEsLabel}
                </label>
                <textarea
                  rows={2}
                  value={formBrandDescriptionEs}
                  onChange={(e) => setFormBrandDescriptionEs(e.target.value)}
                  placeholder="ej: Plataformas Maverick X3, Maverick R y Defender..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition resize-none"
                />
              </div>

              {/* English Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {t.backdoorVehiclesBrandDescEnLabel}
                </label>
                <textarea
                  rows={2}
                  value={formBrandDescriptionEn}
                  onChange={(e) => setFormBrandDescriptionEn(e.target.value)}
                  placeholder="e.g.: Maverick X3, Maverick R, and Defender platforms..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition resize-none"
                />
              </div>

              {/* Featured Toggle */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                <div className="cursor-pointer" onClick={() => setFormBrandFeatured(!formBrandFeatured)}>
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>{t.backdoorVehiclesBrandFeaturedLabel}</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {t.backdoorVehiclesBrandFeaturedHelp}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormBrandFeatured(!formBrandFeatured)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formBrandFeatured ? "bg-amber-500" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      formBrandFeatured ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  disabled={savingBrand}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingBrand}
                  className="px-5 py-2 rounded-lg text-xs font-bold bg-[#C02030] hover:bg-[#A01825] text-white transition flex items-center gap-2 shadow-sm"
                >
                  {savingBrand && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingBrand ? "Actualizar Marca" : "Guardar Marca"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODEL MODAL (ADD / EDIT MODEL)                                           */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-[#C02030] flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingModel
                      ? t.backdoorVehiclesModalEditTitle
                      : t.backdoorVehiclesModalCreateTitle}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === "es"
                      ? "Define las especificaciones del modelo y los años de compatibilidad para el garaje."
                      : "Define vehicle model specs and compatibility years for the garage."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitForm} className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Brand Selector */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    {t.backdoorVehiclesBrandLabel} *
                  </label>
                  {!editingModel && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormBrandMode(formBrandMode === "existing" ? "new" : "existing")
                      }
                      className="text-[11px] font-bold text-[#C02030] hover:underline"
                    >
                      {formBrandMode === "existing"
                        ? t.backdoorVehiclesCreateNewBrandToggle
                        : "Seleccionar Marca Existente"}
                    </button>
                  )}
                </div>

                {formBrandMode === "existing" ? (
                  <select
                    value={formBrandId}
                    onChange={(e) => setFormBrandId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-900 transition"
                  >
                    <option value="">{t.backdoorVehiclesSelectBrandPrompt}</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        {t.backdoorVehiclesNewBrandName} *
                      </label>
                      <input
                        type="text"
                        required
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
                        placeholder="ej: Can-Am, Polaris, Segway"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-slate-900 transition"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                        {t.backdoorVehiclesNewBrandSlug}
                      </label>
                      <input
                        type="text"
                        value={formNewBrandSlug}
                        onChange={(e) => setFormNewBrandSlug(e.target.value)}
                        placeholder="can-am"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 font-mono focus:outline-none focus:border-slate-900 transition"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Model Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t.backdoorVehiclesModelNameLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="ej: ZForce Z10"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t.backdoorVehiclesModelSlugLabel}
                  </label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="ej: zforce-z10"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 transition font-mono"
                  />
                </div>
              </div>

              {/* SKU Code, Type & Brand Model Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>{t.backdoorVehiclesModelCodeLabel}</span>
                    <span className="text-[10px] text-slate-400 font-normal">Prefix</span>
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder={t.backdoorVehiclesModelCodePlaceholder}
                    maxLength={10}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-mono font-bold text-slate-800 uppercase placeholder-slate-400 focus:outline-none focus:border-slate-900 transition"
                  />
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {t.backdoorVehiclesModelCodeHelp}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t.backdoorVehiclesCategoryLabel} *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 font-semibold focus:outline-none focus:border-slate-900 transition"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {lang === "es" ? "Categoría en Marca" : "Brand Model Category"}
                  </label>
                  <input
                    type="text"
                    list="brand-model-categories-list"
                    value={formModelCategory}
                    onChange={(e) => setFormModelCategory(e.target.value)}
                    placeholder={lang === "es" ? "Ej: Maverick X3, Z10, Outlander" : "Ex: Maverick X3, Z10, Outlander"}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 font-semibold placeholder-slate-400 focus:outline-none focus:border-slate-900 transition"
                  />
                  <datalist id="brand-model-categories-list">
                    {brandCategorySuggestions.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Brand Category Quick Selection Pills */}
              {brandCategorySuggestions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 -mt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                    {lang === "es" ? "Existentes:" : "Existing:"}
                  </span>
                  {brandCategorySuggestions.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormModelCategory(cat)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition border cursor-pointer ${
                        formModelCategory.toLowerCase() === cat.toLowerCase()
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Compatible Years Configuration */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    {t.backdoorVehiclesYearsLabel} *
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {formSelectedYears.length} años seleccionados
                  </span>
                </div>

                {/* Range inputs */}
                <div className="grid grid-cols-3 gap-2 items-end pt-1">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      {t.backdoorVehiclesYearFromLabel}
                    </label>
                    <input
                      type="number"
                      min={1995}
                      max={2035}
                      value={formYearFrom}
                      onChange={(e) => setFormYearFrom(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">
                      {t.backdoorVehiclesYearToLabel}
                    </label>
                    <input
                      type="number"
                      min={1995}
                      max={2035}
                      value={formYearTo}
                      onChange={(e) => setFormYearTo(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyYearRange}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition h-[34px]"
                  >
                    Aplicar Rango
                  </button>
                </div>

                {/* Quick Toggle Pills */}
                <div className="pt-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Selección Rápida Individual:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_YEAR_OPTIONS.map((year) => {
                      const isSelected = formSelectedYears.includes(year);
                      return (
                        <button
                          key={year}
                          type="button"
                          onClick={() => handleToggleYear(year)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                            isSelected
                              ? "bg-[#C02030] text-white shadow-xs"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {year}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Vehicle Image Upload & URL */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>{t.backdoorVehiclesImageUrlLabel}</span>
                  </label>
                  {uploadingImage && (
                    <span className="text-[10px] text-emerald-600 font-semibold animate-pulse flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>{t.backdoorVehiclesUploadingImage}</span>
                    </span>
                  )}
                </div>

                {/* Direct Upload Drag & Button */}
                <div className="space-y-2">
                  {formImageUrl ? (
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
                      <div className="relative w-16 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 flex-shrink-0 flex items-center justify-center">
                        <img
                          src={formImageUrl}
                          alt="Vehicle preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-mono text-slate-600 truncate block">
                          {formImageUrl}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <label className="text-[11px] font-bold text-slate-900 hover:text-[#C02030] cursor-pointer">
                            <span>{t.backdoorVehiclesChangeImageBtn}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              disabled={uploadingImage}
                            />
                          </label>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => setFormImageUrl("")}
                            className="text-[11px] font-medium text-rose-600 hover:text-rose-700"
                          >
                            {t.backdoorVehiclesRemoveImageBtn}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-200 hover:border-slate-400 bg-white rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition">
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-700">
                        {uploadingImage ? (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>{t.backdoorVehiclesUploadingImage} {uploadProgress > 0 ? `(${uploadProgress}%)` : ""}</span>
                          </span>
                        ) : (
                          t.backdoorVehiclesUploadImageBtn
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        PNG, WEBP o JPG (imagen frontal o lateral sin fondo recomendada)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  )}

                  {/* Manual URL input fallback */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                      o especificar URL externa / estática:
                    </span>
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
