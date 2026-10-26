"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCRC } from "@/lib/i18n";
import {
  Video,
  ShoppingBag,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
  Sparkles,
  Link as LinkIcon,
  Layers,
  ArrowUpDown,
  Upload,
  Film,
  Image as ImageIcon,
  FileVideo,
  Play,
  X,
  Compass,
  Package,
  Repeat,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { DealerBrandsManagerSection } from "./DealerBrandsManagerSection";
import { BarrialCrManagerSection } from "./BarrialCrManagerSection";

export interface RelatedItem {
  id: string;
  type: "PRODUCT" | "COMBO";
  titleEs: string;
  titleEn: string;
  imageUrl: string;
  priceCRC: number;
  redirectUrl: string;
  category?: string;
}

export interface HomePageItemRecord {
  id: string;
  type: "VIDEO" | "PRODUCT";
  titleEs: string;
  titleEn: string;
  category: string;
  descriptionEs: string;
  descriptionEn: string;
  redirectUrl: string;
  mediaUrl: string;
  videoUrl?: string | null;
  relatedItemsJson?: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface HomePageManagerTabProps {
  userRole?: "MASTER" | "STAFF";
}

export function HomePageManagerTab({ userRole }: HomePageManagerTabProps) {
  const { t, lang } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<"SHOWCASE" | "DEALER_BRANDS" | "BARRIALCR">("SHOWCASE");
  const [items, setItems] = useState<HomePageItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"ALL" | "VIDEO" | "PRODUCT">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HomePageItemRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [previewVideoModalUrl, setPreviewVideoModalUrl] = useState<string | null>(null);

  // Form State
  const [formType, setFormType] = useState<"VIDEO" | "PRODUCT">("PRODUCT");
  const [formTitleEs, setFormTitleEs] = useState("");
  const [formTitleEn, setFormTitleEn] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDescEs, setFormDescEs] = useState("");
  const [formDescEn, setFormDescEn] = useState("");
  const [formRedirectUrl, setFormRedirectUrl] = useState("");
  const [formMediaUrl, setFormMediaUrl] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formOrder, setFormOrder] = useState<number>(0);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formRelatedItems, setFormRelatedItems] = useState<RelatedItem[]>([]);
  const [showCatalogSelector, setShowCatalogSelector] = useState(false);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState("");
  const [catalogFilterType, setCatalogFilterType] = useState<"ALL" | "PRODUCT" | "COMBO">("ALL");
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<RelatedItem[]>([]);
  const [catalogCombos, setCatalogCombos] = useState<RelatedItem[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  // Upload States & Handlers
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState<string | null>(null);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
  const [showManualMediaUrl, setShowManualMediaUrl] = useState(false);
  const [showManualVideoUrl, setShowManualVideoUrl] = useState(false);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "MEDIA" | "VIDEO"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "MEDIA") {
      setUploadingMedia(true);
      setMediaUploadError(null);
    } else {
      setUploadingVideo(true);
      setVideoUploadError(null);
    }

    try {
      // Client-side file size guard before attempting network request
      const maxDirectBytes = type === "VIDEO" ? 30 * 1024 * 1024 : 12 * 1024 * 1024;
      if (file.size > maxDirectBytes) {
        if (type === "VIDEO") {
          setShowManualVideoUrl(true);
          throw new Error(
            lang === "es"
              ? `El video pesa ${(file.size / (1024 * 1024)).toFixed(1)}MB. El límite para subida directa al servidor es de 30MB. Te recomendamos ingresar la URL directa del video en la casilla inferior o comprimir el archivo.`
              : `The video is ${(file.size / (1024 * 1024)).toFixed(1)}MB. The direct upload limit is 30MB. Please paste the direct video URL in the field below or compress the file.`
          );
        } else {
          setShowManualMediaUrl(true);
          throw new Error(
            lang === "es"
              ? `La imagen pesa ${(file.size / (1024 * 1024)).toFixed(1)}MB. El límite máximo para subida directa es de 12MB.`
              : `The image is ${(file.size / (1024 * 1024)).toFixed(1)}MB. The direct upload limit is 12MB.`
          );
        }
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", type === "VIDEO" ? "videos" : "products");

      const res = await fetch("/api/sys/upload", {
        method: "POST",
        body: formData,
      });

      // Resilient response handling (safely catches 413 Request Entity Too Large HTML / non-JSON responses)
      let data: any = null;
      let rawText = "";

      try {
        rawText = await res.text();
        data = JSON.parse(rawText);
      } catch {
        if (res.status === 413) {
          if (type === "VIDEO") setShowManualVideoUrl(true);
          throw new Error(
            lang === "es"
              ? "El servidor rechazó el archivo por exceso de tamaño (HTTP 413: Request Entity Too Large). El video supera el límite de carga directa del servidor web. Por favor ingresa la URL directa del video en la casilla inferior."
              : "Server rejected file due to size (HTTP 413: Request Entity Too Large). The video exceeds proxy upload limits. Please enter the direct video URL in the field below."
          );
        }
        throw new Error(
          lang === "es"
            ? `Error del servidor (${res.status}): No se pudo procesar la subida del archivo.`
            : `Server error (${res.status}): Could not process file upload.`
        );
      }

      if (!res.ok || !data?.success || !data?.url) {
        throw new Error(data?.error || (lang === "es" ? "Error al subir archivo" : "Upload failed"));
      }

      if (type === "MEDIA") {
        setFormMediaUrl(data.url);
      } else {
        setFormVideoUrl(data.url);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      const errMsg = err.message || (lang === "es" ? "Error al procesar el archivo" : "Error processing file");
      if (type === "MEDIA") {
        setMediaUploadError(errMsg);
      } else {
        setVideoUploadError(errMsg);
      }
    } finally {
      if (type === "MEDIA") setUploadingMedia(false);
      else setUploadingVideo(false);
      e.target.value = "";
    }
  };

  // Quick category presets for convenient selection
  const categorySuggestions = [
    "CFMOTO Specialty",
    "Can-Am Off-Road",
    "Polaris Racing",
    "Software & Potencia",
    "Transmisión & Drivetrain",
    "Escapes & Potencia",
    "Chasis & Suspensión",
    "Ruedas & Neumáticos",
    "Iluminación",
  ];

  // Quick redirect presets
  const redirectSuggestions = [
    { label: "Performance", url: "/performance" },
    { label: "Marcas", url: "/marcas" },
    { label: "Cotizar CFMOTO", url: "/cotizar?marca=cfmoto" },
    { label: "Cotizar Can-Am", url: "/cotizar?marca=can-am" },
    { label: "Cotizar Polaris", url: "/cotizar?marca=polaris" },
    { label: "Combos", url: "/combos" },
    { label: "Taller", url: "/taller" },
  ];

  const fetchCatalogItems = useCallback(async () => {
    if (catalogLoaded) return;
    setLoadingCatalog(true);
    try {
      const [prodsRes, combosRes] = await Promise.all([
        fetch("/api/products").then((r) => r.json()).catch(() => ({})),
        fetch("/api/combos").then((r) => r.json()).catch(() => ({})),
      ]);

      if (prodsRes && prodsRes.success && Array.isArray(prodsRes.products)) {
        const mappedProds: RelatedItem[] = prodsRes.products.map((p: any) => ({
          id: String(p.id || p.sku || p.slug),
          type: "PRODUCT" as const,
          titleEs: p.name?.es || p.title || "Producto",
          titleEn: p.name?.en || p.name?.es || p.title || "Product",
          imageUrl: p.imgs?.[0] || p.imageUrl || "/images/logo.png",
          priceCRC: Number(p.price?.T_price || p.priceCRC || 0),
          redirectUrl: `/productos?slug=${p.slug || p.id}`,
          category: Array.isArray(p.category) ? p.category.join(", ") : p.category || "",
        }));
        setCatalogProducts(mappedProds);
      }

      if (combosRes && combosRes.success && combosRes.data && Array.isArray(combosRes.data.combos)) {
        const mappedCombos: RelatedItem[] = combosRes.data.combos.map((c: any) => ({
          id: String(c.id || c.slug),
          type: "COMBO" as const,
          titleEs: c.titleEs,
          titleEn: c.titleEn || c.titleEs,
          imageUrl: c.imageUrl || "/images/logo.png",
          priceCRC: Number(c.priceCRC || 0),
          redirectUrl: `/combos/${c.slug}`,
          category: c.category || "Combos",
        }));
        setCatalogCombos(mappedCombos);
      }
      setCatalogLoaded(true);
    } catch (err) {
      console.error("Failed to load catalog items for related items picker:", err);
    } finally {
      setLoadingCatalog(false);
    }
  }, [catalogLoaded]);

  const filteredCatalogItems = useMemo(() => {
    let pool: RelatedItem[] = [];
    if (catalogFilterType === "ALL" || catalogFilterType === "PRODUCT") {
      pool = [...pool, ...catalogProducts];
    }
    if (catalogFilterType === "ALL" || catalogFilterType === "COMBO") {
      pool = [...pool, ...catalogCombos];
    }
    if (!catalogSearchQuery.trim()) return pool;
    const q = catalogSearchQuery.toLowerCase().trim();
    return pool.filter(
      (item) =>
        item.titleEs.toLowerCase().includes(q) ||
        item.titleEn.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        item.id.toLowerCase().includes(q)
    );
  }, [catalogCombos, catalogFilterType, catalogProducts, catalogSearchQuery]);

  const handleSelectCatalogItem = (item: RelatedItem) => {
    if (replacingIndex !== null) {
      setFormRelatedItems((prev) => {
        const next = [...prev];
        next[replacingIndex] = item;
        return next;
      });
      setReplacingIndex(null);
    } else {
      if (formRelatedItems.some((it) => it.id === item.id)) {
        return;
      }
      setFormRelatedItems((prev) => [...prev, item]);
    }
  };

  const handleRemoveRelatedItem = (index: number) => {
    setFormRelatedItems((prev) => prev.filter((_, i) => i !== index));
    if (replacingIndex === index) {
      setReplacingIndex(null);
    } else if (replacingIndex !== null && replacingIndex > index) {
      setReplacingIndex(replacingIndex - 1);
    }
  };

  const handleMoveRelatedItem = (index: number, direction: "UP" | "DOWN") => {
    setFormRelatedItems((prev) => {
      const next = [...prev];
      const targetIndex = direction === "UP" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleStartReplace = (index: number) => {
    setReplacingIndex(index);
    setShowCatalogSelector(true);
    if (!catalogLoaded) {
      fetchCatalogItems();
    }
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sys/homepage-items");
      const data = await res.json();
      if (res.ok && data.success) {
        setItems(data.items || []);
      } else {
        setFeedbackMessage({
          type: "error",
          text: data.error || "Error al cargar elementos",
        });
      }
    } catch (err: any) {
      console.error("Failed to fetch home page items:", err);
      setFeedbackMessage({
        type: "error",
        text: "Error de red al cargar elementos",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormType("PRODUCT");
    setFormTitleEs("");
    setFormTitleEn("");
    setFormCategory("");
    setFormDescEs("");
    setFormDescEn("");
    setFormRedirectUrl("");
    setFormMediaUrl("");
    setFormVideoUrl("");
    setFormOrder(items.length);
    setFormIsActive(true);
    setFormRelatedItems([]);
    setShowCatalogSelector(false);
    setReplacingIndex(null);
    setCatalogSearchQuery("");
    setMediaUploadError(null);
    setVideoUploadError(null);
    setShowManualMediaUrl(false);
    setShowManualVideoUrl(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: HomePageItemRecord) => {
    setEditingItem(item);
    setFormType(item.type);
    setFormTitleEs(item.titleEs);
    setFormTitleEn(item.titleEn);
    setFormCategory(item.category);
    setFormDescEs(item.descriptionEs);
    setFormDescEn(item.descriptionEn);
    setFormRedirectUrl(item.redirectUrl);
    setFormMediaUrl(item.mediaUrl);
    setFormVideoUrl(item.videoUrl || "");
    setFormOrder(item.order);
    setFormIsActive(item.isActive);
    let parsedRelated: RelatedItem[] = [];
    if (item.relatedItemsJson) {
      try {
        const p = JSON.parse(item.relatedItemsJson);
        if (Array.isArray(p)) parsedRelated = p;
      } catch {}
    }
    setFormRelatedItems(parsedRelated);
    setShowCatalogSelector(false);
    setReplacingIndex(null);
    setCatalogSearchQuery("");
    setMediaUploadError(null);
    setVideoUploadError(null);
    setShowManualMediaUrl(Boolean(item.mediaUrl && item.mediaUrl.startsWith("http")));
    setShowManualVideoUrl(Boolean(item.videoUrl && item.videoUrl.startsWith("http")));
    setIsModalOpen(true);
  };

  const handleToggleActive = async (item: HomePageItemRecord) => {
    try {
      const res = await fetch(`/api/sys/homepage-items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, isActive: !it.isActive } : it))
        );
        setFeedbackMessage({
          type: "success",
          text: t.backdoorHomeSuccessUpdated,
        });
      } else {
        setFeedbackMessage({
          type: "error",
          text: data.error || "No se pudo actualizar el estado",
        });
      }
    } catch (err) {
      setFeedbackMessage({
        type: "error",
        text: "Error al actualizar estado",
      });
    }
  };

  const handleDelete = async (item: HomePageItemRecord) => {
    if (!window.confirm(t.backdoorHomeDeleteConfirm)) return;

    try {
      const res = await fetch(`/api/sys/homepage-items/${item.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setItems((prev) => prev.filter((it) => it.id !== item.id));
        setFeedbackMessage({
          type: "success",
          text: t.backdoorHomeSuccessDeleted,
        });
      } else {
        setFeedbackMessage({
          type: "error",
          text: data.error || "No se pudo eliminar el elemento",
        });
      }
    } catch (err) {
      setFeedbackMessage({
        type: "error",
        text: "Error al eliminar el elemento",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitleEs.trim() || !formCategory.trim() || !formRedirectUrl.trim() || !formMediaUrl.trim()) {
      setFeedbackMessage({
        type: "error",
        text: "Por favor completa todos los campos requeridos (*)",
      });
      return;
    }

    setSubmitting(true);
    setFeedbackMessage(null);

    const payload = {
      type: formType,
      titleEs: formTitleEs,
      titleEn: formTitleEn || formTitleEs,
      category: formCategory,
      descriptionEs: formDescEs,
      descriptionEn: formDescEn || formDescEs,
      redirectUrl: formRedirectUrl,
      mediaUrl: formMediaUrl,
      videoUrl: formType === "VIDEO" ? formVideoUrl : null,
      relatedItemsJson:
        formType === "VIDEO" && formRelatedItems.length > 0
          ? JSON.stringify(formRelatedItems)
          : null,
      order: Number(formOrder) || 0,
      isActive: formIsActive,
    };

    try {
      const url = editingItem
        ? `/api/sys/homepage-items/${editingItem.id}`
        : "/api/sys/homepage-items";
      const method = editingItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (editingItem) {
          setItems((prev) =>
            prev.map((it) => (it.id === editingItem.id ? data.item : it))
          );
          setFeedbackMessage({
            type: "success",
            text: t.backdoorHomeSuccessUpdated,
          });
        } else {
          setItems((prev) => [...prev, data.item]);
          setFeedbackMessage({
            type: "success",
            text: t.backdoorHomeSuccessCreated,
          });
        }
        setIsModalOpen(false);
      } else {
        setFeedbackMessage({
          type: "error",
          text: data.error || "Error al procesar la solicitud",
        });
      }
    } catch (err) {
      setFeedbackMessage({
        type: "error",
        text: "Error de red al guardar el elemento",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter and search
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterType !== "ALL" && item.type !== filterType) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle =
          item.titleEs.toLowerCase().includes(query) ||
          item.titleEn.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        const matchesDesc =
          item.descriptionEs.toLowerCase().includes(query) ||
          item.descriptionEn.toLowerCase().includes(query);
        return matchesTitle || matchesCategory || matchesDesc;
      }
      return true;
    });
  }, [items, filterType, searchQuery]);

  const videoCount = items.filter((i) => i.type === "VIDEO").length;
  const productCount = items.filter((i) => i.type === "PRODUCT").length;

  if (userRole && userRole !== "MASTER") {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-lg mx-auto my-12 space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-slate-900 text-sm">
            {lang === "es" ? "Acceso Restringido (Solo Master)" : "Restricted Access (Master Only)"}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {lang === "es"
              ? "La gestión y configuración del contenido de inicio requiere autorización y privilegios de Administrador Master."
              : "Management and configuration of homepage content requires Master Administrator privileges."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation: Videos & Products vs Dealer Brands */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveSubTab("SHOWCASE")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeSubTab === "SHOWCASE"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Film className="w-3.5 h-3.5 text-[#C02030]" />
          <span>{t.backdoorHomeSubTabMedia || "Videos y Productos"}</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] ${
              activeSubTab === "SHOWCASE"
                ? "bg-white/20 text-white"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {items.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("DEALER_BRANDS")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeSubTab === "DEALER_BRANDS"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#C02030]" />
          <span>{t.backdoorHomeSubTabDealerBrands || "Marcas Distribuidoras"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("BARRIALCR")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeSubTab === "BARRIALCR"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-[#C02030]" />
          <span>{t.backdoorHomeSubTabBarrialCr || "BarrialCR"}</span>
        </button>
      </div>

      {activeSubTab === "DEALER_BRANDS" ? (
        <DealerBrandsManagerSection userRole={userRole} />
      ) : activeSubTab === "BARRIALCR" ? (
        <BarrialCrManagerSection userRole={userRole} />
      ) : (
        <>
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

      {/* Header and Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-900">
                {t.backdoorHomePageTitle}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {items.length} {t.backdoorHomeAllItems}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              {t.backdoorHomePageSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={fetchItems}
              className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
              title="Recargar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.backdoorHomeAddItem}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Type Filter Buttons */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterType === "ALL"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.backdoorHomeAllItems} ({items.length})
            </button>

            <button
              type="button"
              onClick={() => setFilterType("VIDEO")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterType === "VIDEO"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>{t.backdoorHomeVideos} ({videoCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType("PRODUCT")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterType === "PRODUCT"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{t.backdoorHomeProducts} ({productCount})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.backdoorHomeSearchPlaceholder}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Content Grid or Skeleton Loader */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-xl p-4 space-y-3"
            >
              <Skeleton className="h-44 w-full rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="h-5 w-full rounded" />
                <Skeleton className="h-4 w-3/4 rounded" />
              </div>
              <div className="flex justify-between pt-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-600 font-medium">
            {t.backdoorHomeEmptyState}
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.backdoorHomeAddItem}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white border rounded-xl overflow-hidden transition shadow-sm hover:shadow flex flex-col justify-between ${
                item.isActive ? "border-slate-200" : "border-slate-200/60 opacity-60 bg-slate-50/50"
              }`}
            >
              {/* Media Preview Banner */}
              <div className="relative h-44 w-full bg-slate-900 overflow-hidden group">
                {item.mediaUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.mediaUrl}
                    alt={item.titleEs}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                    Sin imagen
                  </div>
                )}

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                {/* Video Play Preview Overlay Button */}
                {item.type === "VIDEO" && item.videoUrl && (
                  <button
                    type="button"
                    onClick={() => setPreviewVideoModalUrl(item.videoUrl || null)}
                    className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Reproducir video de muestra"
                  >
                    <span className="p-3 rounded-full bg-white text-slate-900 shadow-xl hover:scale-110 transition flex items-center justify-center">
                      <Play className="w-4 h-4 fill-slate-900 ml-0.5" />
                    </span>
                  </button>
                )}

                {/* Badges on Top */}
                <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${
                      item.type === "VIDEO"
                        ? "bg-blue-600/90 text-white"
                        : "bg-emerald-600/90 text-white"
                    }`}
                  >
                    {item.type === "VIDEO" ? (
                      <Video className="w-3 h-3" />
                    ) : (
                      <ShoppingBag className="w-3 h-3" />
                    )}
                    <span>{item.type === "VIDEO" ? t.backdoorHomeVideos : t.backdoorHomeProducts}</span>
                  </span>

                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/60 text-white backdrop-blur-md">
                    #{item.order}
                  </span>
                </div>

                {/* Category & Redirect Badge on Bottom of Media */}
                <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between text-white">
                  <span className="text-[11px] font-semibold bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md">
                    {item.category}
                  </span>

                  {item.isActive ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-md backdrop-blur-md">
                      <Eye className="w-3 h-3" />
                      <span>{t.backdoorHomeStatusActive}</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-300 bg-slate-900/70 px-2 py-0.5 rounded-md backdrop-blur-md">
                      <EyeOff className="w-3 h-3" />
                      <span>{t.backdoorHomeStatusInactive}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Item Info */}
              <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                      {lang === "en" ? item.titleEn : item.titleEs}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {lang === "en" ? item.descriptionEn : item.descriptionEs}
                  </p>

                  {/* Related items indicator badge */}
                  {item.type === "VIDEO" && (() => {
                    let count = 0;
                    if (item.relatedItemsJson) {
                      try {
                        const parsed = JSON.parse(item.relatedItemsJson);
                        if (Array.isArray(parsed)) count = parsed.length;
                      } catch {}
                    }
                    if (count === 0) return null;
                    return (
                      <div className="pt-0.5">
                        {count >= 2 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            <span>Pop-up activo ({count} items)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <Package className="w-3 h-3 text-slate-500" />
                            <span>1 producto vinculado</span>
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Redirect Link Display */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <a
                    href={item.redirectUrl}
                    target={item.redirectUrl.startsWith("http") ? "_blank" : "_self"}
                    rel="noreferrer"
                    className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-mono text-[11px] truncate max-w-[200px]"
                    title={item.redirectUrl}
                  >
                    <LinkIcon className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{item.redirectUrl}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
                  </a>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item)}
                      className={`p-1.5 rounded-lg border transition ${
                        item.isActive
                          ? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                          : "text-slate-500 bg-slate-50 border-slate-200 hover:bg-slate-100"
                      }`}
                      title={item.isActive ? "Desactivar" : "Activar"}
                    >
                      {item.isActive ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
                      title={t.backdoorHomeEditItem}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="p-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition"
                      title={t.backdoorHomeDeleteItem}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingItem ? t.backdoorHomeEditItem : t.backdoorHomeAddItem}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t.backdoorHomeItemType} *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType("VIDEO")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${
                      formType === "VIDEO"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>{t.backdoorHomeTypeVideo}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType("PRODUCT")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition ${
                      formType === "PRODUCT"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{t.backdoorHomeTypeProduct}</span>
                  </button>
                </div>
              </div>

              {/* Title ES & EN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.backdoorHomeTitleEs} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitleEs}
                    onChange={(e) => setFormTitleEs(e.target.value)}
                    placeholder="Ej: Bikeman Sport Exhaust"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.backdoorHomeTitleEn}
                  </label>
                  <input
                    type="text"
                    value={formTitleEn}
                    onChange={(e) => setFormTitleEn(e.target.value)}
                    placeholder="Ej: Bikeman Sport Exhaust"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.backdoorHomeCategory} *
                </label>
                <input
                  type="text"
                  required
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder={t.backdoorHomeCategoryPlaceholder}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {categorySuggestions.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormCategory(cat)}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Short Descriptions ES & EN */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.backdoorHomeDescEs}
                  </label>
                  <textarea
                    rows={2}
                    value={formDescEs}
                    onChange={(e) => setFormDescEs(e.target.value)}
                    placeholder="Descripción concisa que resuma las características principales..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.backdoorHomeDescEn}
                  </label>
                  <textarea
                    rows={2}
                    value={formDescEn}
                    onChange={(e) => setFormDescEn(e.target.value)}
                    placeholder="Concise description highlighting main features..."
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Redirect URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.backdoorHomeRedirectUrl} *
                </label>
                <input
                  type="text"
                  required
                  value={formRedirectUrl}
                  onChange={(e) => setFormRedirectUrl(e.target.value)}
                  placeholder={t.backdoorHomeRedirectPlaceholder}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {redirectSuggestions.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setFormRedirectUrl(preset.url)}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
                    >
                      {preset.label}: {preset.url}
                    </button>
                  ))}
                </div>
              </div>

              {/* Media Upload / Image (Poster / Main Image) */}
              <div className="space-y-2 p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>{t.backdoorHomeMediaUrl} *</span>
                  </label>
                  {formMediaUrl && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t.backdoorHomeStatusActive}</span>
                    </span>
                  )}
                </div>

                {mediaUploadError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{mediaUploadError}</span>
                  </div>
                )}

                {/* Media Preview or Upload Dropzone */}
                {formMediaUrl ? (
                  <div className="space-y-2">
                    <div className="relative h-36 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formMediaUrl}
                        alt="Vista previa"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-md hover:bg-slate-100 transition flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingMedia ? t.devSaving : t.backdoorHomeChangeImage}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingMedia}
                            onChange={(e) => handleFileUpload(e, "MEDIA")}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormMediaUrl("")}
                          className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md hover:bg-red-700 transition flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t.backdoorHomeRemoveImage}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs">
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>{uploadingMedia ? t.devSaving : t.backdoorHomeChangeImage}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingMedia}
                            onChange={(e) => handleFileUpload(e, "MEDIA")}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormMediaUrl("")}
                          className="px-3 py-1.5 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t.backdoorHomeRemoveImage}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowManualMediaUrl(!showManualMediaUrl)}
                        className="text-[11px] text-slate-500 hover:text-slate-900 underline"
                      >
                        {showManualMediaUrl ? "Ocultar URL" : t.backdoorHomeManualUrlToggle}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="cursor-pointer block border-2 border-dashed border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 rounded-2xl p-6 text-center transition">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          {uploadingMedia ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-800">
                            {uploadingMedia
                              ? t.backdoorHomeUploadingImage
                              : t.backdoorHomeUploadImageBtn}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Formatos soportados: JPEG, PNG, WebP, AVIF, GIF (hasta 12MB)
                          </p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingMedia}
                        onChange={(e) => handleFileUpload(e, "MEDIA")}
                        className="hidden"
                      />
                    </label>

                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => setShowManualMediaUrl(!showManualMediaUrl)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 underline"
                      >
                        {showManualMediaUrl ? "Ocultar URL manual" : t.backdoorHomeManualUrlToggle}
                      </button>
                    </div>
                  </div>
                )}

                {/* Optional Manual URL Input */}
                {showManualMediaUrl && (
                  <div className="pt-2 border-t border-slate-200/60 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      URL Directa de la Imagen:
                    </label>
                    <input
                      type="text"
                      value={formMediaUrl}
                      onChange={(e) => setFormMediaUrl(e.target.value)}
                      placeholder={t.backdoorHomeMediaPlaceholder}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Video Upload Section (When type === VIDEO) */}
              {formType === "VIDEO" && (
                <div className="space-y-2 p-4 bg-blue-50/50 rounded-2xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-blue-600" />
                        <span>{t.backdoorHomeVideoUrl}</span>
                      </label>
                      <p className="text-[10px] text-blue-700/80">
                        Archivo de video para reproducción dinámica de fondo en la página de inicio
                      </p>
                    </div>
                    {formVideoUrl && (
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Film className="w-3 h-3" />
                        <span>Video Cargado</span>
                      </span>
                    )}
                  </div>

                  {videoUploadError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{videoUploadError}</span>
                    </div>
                  )}

                  {/* Video Player Preview or Video Dropzone */}
                  {formVideoUrl ? (
                    <div className="space-y-2">
                      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-md">
                        <video
                          src={formVideoUrl}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full h-44 object-cover"
                        />
                        <div className="p-2.5 bg-slate-900/95 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-800">
                          <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px] truncate max-w-xs">
                            <FileVideo className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            <span className="truncate">{formVideoUrl}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold flex items-center gap-1 transition">
                              <Upload className="w-3 h-3" />
                              <span>{uploadingVideo ? t.devSaving : t.backdoorHomeChangeVideo}</span>
                              <input
                                type="file"
                                accept="video/mp4,video/webm,video/quicktime,video/*"
                                disabled={uploadingVideo}
                                onChange={(e) => handleFileUpload(e, "VIDEO")}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setFormVideoUrl("")}
                              className="px-2.5 py-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-[11px] font-semibold transition flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>{t.backdoorHomeRemoveVideo}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => setShowManualVideoUrl(!showManualVideoUrl)}
                          className="text-[11px] text-blue-700 hover:text-blue-900 underline"
                        >
                          {showManualVideoUrl ? "Ocultar URL de video" : t.backdoorHomeManualUrlToggle}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="cursor-pointer block border-2 border-dashed border-blue-300 hover:border-blue-400 bg-white hover:bg-blue-50/50 rounded-2xl p-6 text-center transition">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            {uploadingVideo ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              <Film className="w-5 h-5" />
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-800">
                              {uploadingVideo
                                ? t.backdoorHomeUploadingVideo
                                : t.backdoorHomeUploadVideoBtn}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {lang === "es"
                                ? "Formatos: MP4, WebM, MOV (hasta 30MB directo, o mediante URL para videos de mayor tamaño)"
                                : "Formats: MP4, WebM, MOV (up to 30MB direct, or via URL for larger files)"}
                            </p>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,video/*"
                          disabled={uploadingVideo}
                          onChange={(e) => handleFileUpload(e, "VIDEO")}
                          className="hidden"
                        />
                      </label>

                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => setShowManualVideoUrl(!showManualVideoUrl)}
                          className="text-[11px] text-blue-700 hover:text-blue-900 underline"
                        >
                          {showManualVideoUrl ? "Ocultar URL de video" : t.backdoorHomeManualUrlToggle}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Optional Manual Video URL Input */}
                  {showManualVideoUrl && (
                    <div className="pt-2 border-t border-blue-200 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">
                        URL Directa del Video (MP4 / WebM):
                      </label>
                      <input
                        type="text"
                        value={formVideoUrl}
                        onChange={(e) => setFormVideoUrl(e.target.value)}
                        placeholder={t.backdoorHomeVideoPlaceholder}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-900 font-mono bg-white"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Related Products / Combos (Only for VIDEO items) */}
              {formType === "VIDEO" && (
                <div className="space-y-3 p-4 bg-purple-50/50 rounded-2xl border border-purple-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-purple-600" />
                        <h4 className="text-xs font-bold text-purple-950">
                          {t.backdoorHomeRelatedItemsSectionTitle}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                          {formRelatedItems.length}
                        </span>
                      </div>
                      <p className="text-[10px] text-purple-800/80 mt-0.5">
                        {t.backdoorHomeRelatedItemsSectionDesc}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setReplacingIndex(null);
                        setShowCatalogSelector(!showCatalogSelector);
                        if (!catalogLoaded) fetchCatalogItems();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.backdoorHomeRelatedAddBtn}</span>
                    </button>
                  </div>

                  {/* Status indicator badge */}
                  <div className="text-[11px] px-3 py-2 rounded-xl flex items-center gap-2 border bg-white/90">
                    {formRelatedItems.length >= 2 ? (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Pop-up interactivo activo: al tener {formRelatedItems.length} productos/combos, el botón &quot;{t.heroLearnMore}&quot; abrirá la ventana emergente para que el usuario elija cuál explorar.</span>
                      </span>
                    ) : (
                      <span className="text-slate-600 flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Redirección directa activa: al tener {formRelatedItems.length} producto(s), &quot;{t.heroLearnMore}&quot; redirige directamente a la URL del video. (Agrega 2 o más para activar el pop-up).</span>
                      </span>
                    )}
                  </div>

                  {/* List of currently linked items */}
                  {formRelatedItems.length === 0 ? (
                    <div className="p-4 bg-white/80 rounded-xl border border-dashed border-purple-200 text-center text-xs text-slate-500">
                      {t.backdoorHomeRelatedEmpty}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {formRelatedItems.map((item, index) => (
                        <div
                          key={`${item.id}-${index}`}
                          className={`p-2.5 rounded-xl bg-white border transition flex items-center justify-between gap-3 shadow-xs ${
                            replacingIndex === index
                              ? "border-amber-400 ring-2 ring-amber-300 bg-amber-50/40"
                              : "border-slate-200"
                          }`}
                        >
                          {/* Number badge & thumbnail */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {index + 1}
                            </span>
                            <div className="relative w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.imageUrl}
                                alt={item.titleEs}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                    item.type === "PRODUCT"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-purple-50 text-purple-700 border border-purple-200"
                                  }`}
                                >
                                  {item.type === "PRODUCT" ? t.heroRelatedProductBadge : t.heroRelatedComboBadge}
                                </span>
                                {item.category && (
                                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                    {item.category}
                                  </span>
                                )}
                              </div>
                              <h5 className="text-xs font-bold text-slate-900 truncate">
                                {lang === "en" ? item.titleEn || item.titleEs : item.titleEs}
                              </h5>
                              <p className="text-[11px] font-semibold text-slate-700">
                                {formatCRC(item.priceCRC)}
                              </p>
                            </div>
                          </div>

                          {/* Actions: Reorder, Replace, Remove */}
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Move Up */}
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => handleMoveRelatedItem(index, "UP")}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100 transition"
                              title="Subir"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            {/* Move Down */}
                            <button
                              type="button"
                              disabled={index === formRelatedItems.length - 1}
                              onClick={() => handleMoveRelatedItem(index, "DOWN")}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100 transition"
                              title="Bajar"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Replace Button */}
                            <button
                              type="button"
                              onClick={() => handleStartReplace(index)}
                              className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                                replacingIndex === index
                                  ? "bg-amber-500 text-white"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                              }`}
                              title={t.backdoorHomeRelatedReplaceBtn}
                            >
                              <Repeat className="w-3 h-3" />
                              <span className="hidden sm:inline">{t.backdoorHomeRelatedReplaceBtn}</span>
                            </button>

                            {/* Remove Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveRelatedItem(index)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                              title={t.backdoorHomeRelatedRemoveBtn}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Catalog Selector Panel (shown on Add or Replace) */}
                  {(showCatalogSelector || replacingIndex !== null) && (
                    <div className="p-3.5 bg-white rounded-2xl border border-purple-200 space-y-3 mt-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-purple-600" />
                          <h5 className="text-xs font-bold text-slate-900">
                            {replacingIndex !== null
                              ? `${t.backdoorHomeRelatedReplacingMode} #${replacingIndex + 1}`
                              : "Seleccionar del catálogo"}
                          </h5>
                        </div>

                        {replacingIndex !== null ? (
                          <button
                            type="button"
                            onClick={() => setReplacingIndex(null)}
                            className="text-[11px] font-semibold text-amber-700 hover:underline"
                          >
                            {t.backdoorHomeRelatedCancelReplace}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowCatalogSelector(false)}
                            className="text-[11px] font-semibold text-slate-400 hover:text-slate-600"
                          >
                            ✕ {t.heroRelatedCloseModal}
                          </button>
                        )}
                      </div>

                      {/* Filter and Search Bar */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        {/* Type Filter Buttons */}
                        <div className="flex rounded-xl bg-slate-100 p-0.5 shrink-0 text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() => setCatalogFilterType("ALL")}
                            className={`px-2.5 py-1 rounded-lg transition ${
                              catalogFilterType === "ALL" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600"
                            }`}
                          >
                            {t.backdoorHomeRelatedFilterAll}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCatalogFilterType("PRODUCT")}
                            className={`px-2.5 py-1 rounded-lg transition ${
                              catalogFilterType === "PRODUCT" ? "bg-white text-emerald-800 shadow-2xs font-bold" : "text-slate-600"
                            }`}
                          >
                            {t.backdoorHomeRelatedFilterProducts}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCatalogFilterType("COMBO")}
                            className={`px-2.5 py-1 rounded-lg transition ${
                              catalogFilterType === "COMBO" ? "bg-white text-purple-800 shadow-2xs font-bold" : "text-slate-600"
                            }`}
                          >
                            {t.backdoorHomeRelatedFilterCombos}
                          </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={catalogSearchQuery}
                            onChange={(e) => setCatalogSearchQuery(e.target.value)}
                            placeholder={t.backdoorHomeRelatedSearchPlaceholder}
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-600"
                          />
                        </div>
                      </div>

                      {/* Catalog Items Results */}
                      {loadingCatalog ? (
                        /* Animated Skeleton Loading according to Global Rule 7 */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="p-2 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-2">
                              <Skeleton className="w-10 h-10 rounded-lg bg-slate-200" />
                              <div className="space-y-1.5 flex-1">
                                <Skeleton className="h-3 w-3/4 bg-slate-200" />
                                <Skeleton className="h-2.5 w-1/2 bg-slate-200" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
                          {filteredCatalogItems.length === 0 ? (
                            <div className="col-span-2 p-6 text-center text-xs text-slate-400">
                              No se encontraron productos o combos que coincidan con la búsqueda.
                            </div>
                          ) : (
                            filteredCatalogItems.slice(0, 30).map((catItem) => {
                              const isAlreadyAdded = formRelatedItems.some((it) => it.id === catItem.id);
                              return (
                                <div
                                  key={`${catItem.type}-${catItem.id}`}
                                  className="p-2 rounded-xl bg-white border border-slate-200 hover:border-purple-300 flex items-center justify-between gap-2 transition hover:shadow-2xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="relative w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={catItem.imageUrl}
                                        alt={catItem.titleEs}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1">
                                        <span
                                          className={`text-[8px] font-bold uppercase px-1 rounded ${
                                            catItem.type === "PRODUCT"
                                              ? "bg-emerald-50 text-emerald-700"
                                              : "bg-purple-50 text-purple-700"
                                          }`}
                                        >
                                          {catItem.type === "PRODUCT" ? "PROD" : "COMBO"}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-semibold truncate">
                                          {formatCRC(catItem.priceCRC)}
                                        </span>
                                      </div>
                                      <h6 className="text-[11px] font-bold text-slate-900 truncate max-w-[140px]">
                                        {lang === "en" ? catItem.titleEn || catItem.titleEs : catItem.titleEs}
                                      </h6>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleSelectCatalogItem(catItem)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition shrink-0 ${
                                      replacingIndex !== null
                                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                                        : isAlreadyAdded
                                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        : "bg-purple-600 hover:bg-purple-700 text-white"
                                    }`}
                                    disabled={isAlreadyAdded && replacingIndex === null}
                                  >
                                    {replacingIndex !== null
                                      ? t.backdoorHomeRelatedReplaceBtn
                                      : isAlreadyAdded
                                      ? "Agregado"
                                      : "+ Agregar"}
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Order & Active Status */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.backdoorHomeOrder}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="formIsActiveCheckbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900"
                  />
                  <label
                    htmlFor="formIsActiveCheckbox"
                    className="text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    {t.backdoorHomeIsActive}
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                >
                  {t.backdoorHomeCancelBtn}
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? t.backdoorHomeSaving : t.backdoorHomeSaveBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Lightbox Preview Modal */}
      {previewVideoModalUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setPreviewVideoModalUrl(null)}
          />
          <div className="relative bg-slate-950 rounded-3xl max-w-2xl w-full border border-slate-800 shadow-2xl overflow-hidden z-10 space-y-3 p-4">
            <div className="flex items-center justify-between text-white border-b border-slate-800 pb-2">
              <span className="text-xs font-bold font-mono text-slate-400 truncate max-w-md">
                {previewVideoModalUrl}
              </span>
              <button
                type="button"
                onClick={() => setPreviewVideoModalUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <video
                src={previewVideoModalUrl}
                controls
                autoPlay
                playsInline
                className="w-full max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );

}
