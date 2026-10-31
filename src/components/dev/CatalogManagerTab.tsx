"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { formatCRC } from "@/lib/i18n";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Lock,
  Upload,
  CheckCircle2,
  AlertCircle,
  Package,
  Layers,
  Volume2,
  Video,
  Car,
  Wrench,
  ArrowLeft,
  Check,
  Sparkles,
  ShieldCheck,
  CheckCircle,
  Calendar,
  AlertTriangle,
  Clock,
  DollarSign,
  Calculator,
  Image as ImageIcon,
  FileText,
  Star,
  Home,
  Archive,
  ArchiveRestore,
  RefreshCw,
  X,
  FolderPlus,
  Sliders,
  ShieldAlert,
  ListPlus,
  Tag,
  Globe,
  Link2,
  ExternalLink,
  Receipt,
  Loader2,
} from "lucide-react";
import {
  ConfigurableParameter,
  ParameterOption,
  ParameterOptionConnection,
  synchronizeDualParameterConnections,
  resolveDualParameterConnection,
  resolveOptionColorHex,
  normalizeAudioUrl,
  normalizeVideoUrl,
  cleanDescriptionText,
  extractAndCleanDescription,
  detectProductVehicleBrands,
  normalizeBrandName,
  ComboUniqueProduct,
  ComboUniqueProductField,
  SUSPENSION_ADJUST_UNIQUE_PRODUCT_TEMPLATE
} from "@/lib/products";
import { uploadMediaDirect } from "@/lib/clientDirectUpload";
import { isVehicleBrand, computeAutoProductSku } from "@/lib/dealerBrands";
import { SXS_BRANDS } from "@/lib/sxsBrands";

import {
  calculateComboAvailability,
  resolveProductStockStatus,
  ComboAvailabilityResult,
} from "@/lib/comboAvailability";
import {
  computeProductLivePricing,
  resolveShippingUSD,
  LEGACY_SHIPPING_CONVERSION_RATE,
  type ProductLivePricingProjection,
} from "@/lib/productPricing";

export interface InstallExtraPart {
  id: string;
  name: string;
  priceCRC: number;
}

interface Product {
  id: string;
  sku: string;
  slug: string;
  nameEs: string;
  nameEn: string;
  priceCRC: number;
  originalPriceCRC?: number;
  discountPercent?: number;
  installationPriceCRC: number;
  installLabourCostCRC?: number;
  installProfitCRC?: number;
  installationDurationMinutes?: number;
  installExtraParts?: InstallExtraPart[];
  installExtraPartsJson?: string;
  installationBreakdownJson?: string | null;
  processingPriceD?: number;
  processingPriceCRC?: number;
  shippingPriceD?: number;
  shippingPriceCRC?: number;
  lockedExchangeRate?: number;
  profitCRC?: number;
  effectiveProfitCRC?: number;
  hasProfitAlert?: boolean;
  profitLossPercent?: number;
  livePricing?: ProductLivePricingProjection;
  totalPriceD?: string;
  warrantyCategory: string;
  descriptionEs: string;
  descriptionEn: string;
  imageUrl: string;
  stockStatus: string;
  featured: boolean;
  homeInstallationAvailable: boolean;
  isInstallationIncluded?: boolean;
  isArchived: boolean;
  brandName?: string | null;
  requirements?: string | null;
  reviews?: string | null;
  additionalImagesJson?: string | null;
  audioUrl?: string | null;
  videoUrl?: string | null;
  modelYearCompatibilityJson?: string | null;
  compatibilities?: Array<{
    brandSlug: string;
    modelSlug: string;
    yearFrom: number;
    yearTo: number;
  }>;
  // Enriched JSON specification fields
  comp?: string[];
  category?: string[];
  brand?: string[];
  price?: {
    P_price_D: number;
    S_price_D?: number;
    P_price: number;
    S_price: number;
    lockedExchangeRate?: number;
    I_price: {
      includes: boolean;
      I_price: number;
    };
    profit: number;
    T_price: number;
    T_price_D: string | number;
  };
  imgs?: string[];
  vids?: string[];
  audios?: string[];
  p_title?: string;
  description?: any;
  inHome_install?: boolean;
  homeInstallation?: boolean;
  year_compatability?: any[];
  modelYearCompatibility?: any[];
  supplierUrl?: string | null;
  supplierPlatform?: string | null;
  supplierStockStatus?: string;
  supplierStockCount?: number | null;
  supplierStockMessageEs?: string | null;
  supplierStockMessageEn?: string | null;
  supplierLeadDaysMin?: number | null;
  supplierLeadDaysMax?: number | null;
  supplierLastPriceUSD?: number | null;
  supplierStockCheckedAt?: Date | string | null;
  parameters?: ConfigurableParameter[];
  parametersJson?: string;
  voidsWarranty?: boolean;
  relatedProductIds?: string[];
  relatedProductIdsJson?: string | null;
  suggestedProductIds?: string[];
  suggestedProductIdsJson?: string | null;
  suggestedComboIds?: string[];
  suggestedComboIdsJson?: string | null;
}

interface Combo {
  id: string;
  slug: string;
  category: string;
  titleEs: string;
  titleEn: string;
  badgeEs: string;
  badgeEn: string;
  descriptionEs: string;
  descriptionEn: string;
  priceCRC: number;
  originalPriceCRC: number;
  installationPriceCRC: number;
  installLabourCostCRC?: number;
  installProfitCRC?: number;
  installationDurationMinutes?: number;
  installExtraParts?: InstallExtraPart[];
  installExtraPartsJson?: string;
  installationBreakdownJson?: string | null;
  discountPercent: number;
  itemsJson: string;
  parameters?: ConfigurableParameter[];
  parametersJson?: string;
  imageUrl: string;
  featured: boolean;
  homeInstallationAvailable: boolean;
  isArchived: boolean;
  suggestedProductIds?: string[];
  suggestedProductIdsJson?: string | null;
  suggestedComboIds?: string[];
  suggestedComboIdsJson?: string | null;
  availability?: ComboAvailabilityResult;
  stockStatus?: string;
  isAvailable?: boolean;
  leadDaysMin?: number;
  leadDaysMax?: number;
}

function DualParameterMatrixModal({
  isOpen,
  onClose,
  parameters,
  onSave,
  t,
  liveExchangeRate = 515,
  currentProductSupplierUrl = "",
  currentProductImage = "",
}: {
  isOpen: boolean;
  onClose: () => void;
  parameters: ConfigurableParameter[];
  onSave: (newParams: ConfigurableParameter[]) => void;
  t: any;
  liveExchangeRate?: number;
  currentProductSupplierUrl?: string;
  currentProductImage?: string;
}) {
  const [param1, setParam1] = useState<ConfigurableParameter | null>(null);
  const [param2, setParam2] = useState<ConfigurableParameter | null>(null);
  const [selectedParam1OptId, setSelectedParam1OptId] = useState<string>("");
  const [activeColorPaletteKey, setActiveColorPaletteKey] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [urlInputMap, setUrlInputMap] = useState<Record<string, string>>({});

  const POPULAR_COLORS = [
    { label: "Naranja", hex: "#EA580C" },
    { label: "Negro", hex: "#18181B" },
    { label: "Azul", hex: "#2563EB" },
    { label: "Rojo", hex: "#DC2626" },
    { label: "Titanio", hex: "#94A3B8" },
    { label: "Blanco", hex: "#FFFFFF" },
    { label: "Oro / Amarillo", hex: "#EAB308" },
    { label: "Verde", hex: "#16A34A" },
    { label: "Carbon Forged", hex: "#1E293B" },
  ];

  // Initialize or re-sync when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let p1: ConfigurableParameter;
    let p2: ConfigurableParameter;

    if (Array.isArray(parameters) && parameters.length >= 2) {
      p1 = JSON.parse(JSON.stringify(parameters[0]));
      p2 = JSON.parse(JSON.stringify(parameters[1]));
    } else {
      // Default Preset from user screenshot with complete bilingual support (Spanish & English)
      p1 = {
        id: `param-${Date.now()}-tip`,
        nameEs: "Color de Punta",
        nameEn: "Tip Color",
        type: "button",
        options: [
          {
            id: `opt-tip-1`,
            labelEs: "Inoxidable",
            labelEn: "Stainless",
            colorHex: "#CBD5E1",
            priceDeltaCRC: 0,
            priceDeltaUSD: 0,
            imageUrl: "",
            images: [],
            supplierUrl: currentProductSupplierUrl || "",
          },
          {
            id: `opt-tip-2`,
            labelEs: "Negro",
            labelEn: "Black",
            colorHex: "#18181B",
            priceDeltaCRC: 0,
            priceDeltaUSD: 0,
            imageUrl: "",
            images: [],
            supplierUrl: currentProductSupplierUrl || "",
          },
          {
            id: `opt-tip-3`,
            labelEs: "Azul / Oro",
            labelEn: "Blue / Gold",
            colorHex: "#2563EB",
            priceDeltaCRC: 0,
            priceDeltaUSD: 0,
            imageUrl: "",
            images: [],
            supplierUrl: currentProductSupplierUrl || "",
          },
          {
            id: `opt-tip-4`,
            labelEs: "Oro",
            labelEn: "Gold",
            colorHex: "#EAB308",
            priceDeltaCRC: 0,
            priceDeltaUSD: 0,
            imageUrl: "",
            images: [],
            supplierUrl: currentProductSupplierUrl || "",
          },
        ],
      };

      p2 = {
        id: `param-${Date.now() + 1}-cover`,
        nameEs: "Color de Cubierta",
        nameEn: "Cover Color",
        type: "button",
        options: [
          {
            id: `opt-cov-1`,
            labelEs: "Fibra Carbono Brillante",
            labelEn: "Gloss Carbon",
            colorHex: "#0F172A",
            priceDeltaCRC: 0,
            priceDeltaUSD: 0,
            imageUrl: "",
            images: [],
            supplierUrl: currentProductSupplierUrl || "",
          },
          {
            id: `opt-cov-2`,
            labelEs: "Fibra Carbono Mate",
            labelEn: "Matte Carbon",
            colorHex: "#334155",
            priceDeltaCRC: 0,
            priceDeltaUSD: 0,
            imageUrl: "",
            images: [],
            supplierUrl: currentProductSupplierUrl || "",
          },
          {
            id: `opt-cov-3`,
            labelEs: "Fibra Carbono Roja",
            labelEn: "Red Carbon",
            colorHex: "#DC2626",
            priceDeltaCRC: 0,
            priceDeltaUSD: 0,
            imageUrl: "",
            images: [],
            supplierUrl: currentProductSupplierUrl || "",
          },
          {
            id: `opt-cov-4`,
            labelEs: "Carbono Forjado Brillante",
            labelEn: "Gloss Forged Carbon",
            colorHex: "#0F172A",
            priceDeltaCRC: 0,
            priceDeltaUSD: 0,
            imageUrl: "",
            images: [],
            supplierUrl: currentProductSupplierUrl || "",
          },
          {
            id: `opt-cov-5`,
            labelEs: "Carbono Forjado Mate",
            labelEn: "Matte Forged Carbon",
            colorHex: "#334155",
            priceDeltaCRC: 0,
            priceDeltaUSD: 0,
            imageUrl: "",
            images: [],
            supplierUrl: currentProductSupplierUrl || "",
          },
          {
            id: `opt-cov-6`,
            labelEs: "Carbono Forjado Dorado",
            labelEn: "Gold Forged Carbon",
            colorHex: "#EAB308",
            priceDeltaCRC: 0,
            priceDeltaUSD: 0,
            imageUrl: "",
            images: [],
            supplierUrl: currentProductSupplierUrl || "",
          },
          {
            id: `opt-cov-7`,
            labelEs: "Carbono Forjado Rojo",
            labelEn: "Red Forged Carbon",
            colorHex: "#EF4444",
            priceDeltaCRC: 0,
            priceDeltaUSD: 0,
            imageUrl: "",
            images: [],
            supplierUrl: currentProductSupplierUrl || "",
          },
          {
            id: `opt-cov-8`,
            labelEs: "Carbono Forjado Azul",
            labelEn: "Blue Forged Carbon",
            colorHex: "#3B82F6",
            priceDeltaCRC: 0,
            priceDeltaUSD: 0,
            imageUrl: "",
            images: [],
            supplierUrl: currentProductSupplierUrl || "",
          },
        ],
      };
    }

    // Guarantee connections synchronization
    p1.options = synchronizeDualParameterConnections(p1.options || [], p2.options || []);

    setParam1(p1);
    setParam2(p2);
    setSelectedParam1OptId(p1.options[0]?.id || "");
  }, [isOpen]);

  if (!isOpen || !param1 || !param2) return null;

  // Active Option 1 whose connections we are currently editing
  const activeOpt1Index = (param1.options || []).findIndex((o) => o.id === selectedParam1OptId);
  const activeOpt1 = activeOpt1Index !== -1 ? param1.options[activeOpt1Index] : param1.options[0];

  // Handlers for Parameter 1 options
  const handleAddParam1Option = () => {
    const newOpt: ParameterOption = {
      id: `opt-p1-${Date.now()}`,
      labelEs: "Nueva Opción",
      labelEn: "New Option",
      priceDeltaCRC: 0,
      priceDeltaUSD: 0,
      imageUrl: "",
      images: [],
      supplierUrl: currentProductSupplierUrl || "",
    };
    const updatedP1Opts = synchronizeDualParameterConnections(
      [...(param1.options || []), newOpt],
      param2.options || []
    );
    setParam1({ ...param1, options: updatedP1Opts });
    setSelectedParam1OptId(newOpt.id);
  };

  const handleUpdateParam1Option = (idx: number, fields: Partial<ParameterOption>) => {
    const updatedOpts = [...param1.options];
    updatedOpts[idx] = { ...updatedOpts[idx], ...fields };
    setParam1({ ...param1, options: updatedOpts });
  };

  const handleRemoveParam1Option = (idx: number) => {
    const updatedOpts = param1.options.filter((_, i) => i !== idx);
    setParam1({ ...param1, options: updatedOpts });
    if (updatedOpts.length > 0) {
      setSelectedParam1OptId(updatedOpts[0].id);
    }
  };

  // Handlers for Parameter 2 options (Master Template - Replicates automatically to all Param 1 connections!)
  const handleAddParam2Option = () => {
    const newOpt: ParameterOption = {
      id: `opt-p2-${Date.now()}`,
      labelEs: "Nuevo Color / Opción",
      labelEn: "New Color / Option",
      priceDeltaCRC: 0,
      priceDeltaUSD: 0,
      imageUrl: "",
      images: [],
      supplierUrl: currentProductSupplierUrl || "",
    };
    const nextP2Opts = [...(param2.options || []), newOpt];
    const synchronizedP1Opts = synchronizeDualParameterConnections(param1.options || [], nextP2Opts);

    setParam2({ ...param2, options: nextP2Opts });
    setParam1({ ...param1, options: synchronizedP1Opts });
  };

  const handleUpdateParam2Option = (idx: number, fields: Partial<ParameterOption>) => {
    const nextP2Opts = [...param2.options];
    nextP2Opts[idx] = { ...nextP2Opts[idx], ...fields };
    const synchronizedP1Opts = synchronizeDualParameterConnections(param1.options || [], nextP2Opts);

    setParam2({ ...param2, options: nextP2Opts });
    setParam1({ ...param1, options: synchronizedP1Opts });
  };

  const handleRemoveParam2Option = (idx: number) => {
    const nextP2Opts = param2.options.filter((_, i) => i !== idx);
    const synchronizedP1Opts = synchronizeDualParameterConnections(param1.options || [], nextP2Opts);

    setParam2({ ...param2, options: nextP2Opts });
    setParam1({ ...param1, options: synchronizedP1Opts });
  };

  // Update a specific connection of active Opt1
  const handleUpdateActiveConnection = (
    connSecondOptId: string,
    fields: Partial<ParameterOptionConnection>
  ) => {
    if (!activeOpt1) return;
    const updatedP1Opts = [...param1.options];
    const currentOpt1 = { ...updatedP1Opts[activeOpt1Index] };
    const conns = [...(currentOpt1.connections || [])];
    const cIdx = conns.findIndex((c) => c.secondOptionId === connSecondOptId);
    if (cIdx !== -1) {
      conns[cIdx] = { ...conns[cIdx], ...fields };
      currentOpt1.connections = conns;
      updatedP1Opts[activeOpt1Index] = currentOpt1;
      setParam1({ ...param1, options: updatedP1Opts });
    }
  };

  // Handle uploading images to a specific combination
  const handleUploadConnectionImages = async (connSecondOptId: string, files: FileList | File[]) => {
    const uploadKey = `${selectedParam1OptId}-${connSecondOptId}`;
    setUploadingKey(uploadKey);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "products");
        const res = await fetch("/api/sys/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data?.success && data?.url) {
          uploadedUrls.push(data.url);
        }
      }

      if (uploadedUrls.length > 0 && activeOpt1) {
        const targetConn = activeOpt1.connections?.find((c) => c.secondOptionId === connSecondOptId);
        const existingImages = Array.isArray(targetConn?.images) ? targetConn.images : [];
        const nextImages = Array.from(new Set([...existingImages, ...uploadedUrls]));
        handleUpdateActiveConnection(connSecondOptId, {
          images: nextImages,
          imageUrl: targetConn?.imageUrl || uploadedUrls[0],
        });
      }
    } catch (e) {
      console.error("Error uploading connection images", e);
    } finally {
      setUploadingKey(null);
    }
  };

  const handleAddConnectionImageUrl = (connSecondOptId: string, url: string) => {
    if (!url || !url.trim() || !activeOpt1) return;
    const cleanUrl = url.trim();
    const targetConn = activeOpt1.connections?.find((c) => c.secondOptionId === connSecondOptId);
    const existingImages = Array.isArray(targetConn?.images) ? targetConn.images : [];
    const nextImages = Array.from(new Set([...existingImages, cleanUrl]));
    handleUpdateActiveConnection(connSecondOptId, {
      images: nextImages,
      imageUrl: targetConn?.imageUrl || cleanUrl,
    });
  };

  const handleRemoveConnectionImage = (connSecondOptId: string, imgUrl: string) => {
    if (!activeOpt1) return;
    const targetConn = activeOpt1.connections?.find((c) => c.secondOptionId === connSecondOptId);
    const existingImages = Array.isArray(targetConn?.images) ? targetConn.images : [];
    const nextImages = existingImages.filter((img) => img !== imgUrl);
    handleUpdateActiveConnection(connSecondOptId, {
      images: nextImages,
      imageUrl: targetConn?.imageUrl === imgUrl ? (nextImages[0] || "") : targetConn?.imageUrl,
    });
  };

  const handleSetConnectionPrimaryImage = (connSecondOptId: string, imgUrl: string) => {
    handleUpdateActiveConnection(connSecondOptId, { imageUrl: imgUrl });
  };

  // Helper: Replicate active Opt1's supplier URL base to empty connections
  const handleFillEmptyUrlsForActiveOpt1 = () => {
    if (!activeOpt1 || !activeOpt1.connections) return;
    const promptUrl = window.prompt(
      "Ingresa la URL base o enlace para las conexiones vacías de esta opción:",
      activeOpt1.supplierUrl || currentProductSupplierUrl || ""
    );
    if (!promptUrl || !promptUrl.trim()) return;
    const trimmed = promptUrl.trim();

    const updatedP1Opts = [...param1.options];
    const currentOpt1 = { ...updatedP1Opts[activeOpt1Index] };
    const conns = (currentOpt1.connections || []).map((c) => {
      if (!c.supplierUrl || !c.supplierUrl.trim()) {
        return { ...c, supplierUrl: trimmed };
      }
      return c;
    });
    currentOpt1.connections = conns;
    updatedP1Opts[activeOpt1Index] = currentOpt1;
    setParam1({ ...param1, options: updatedP1Opts });
  };

  // Save changes and close modal
  const handleCommitSave = () => {
    // Re-verify synchronization before final output
    const finalP1Opts = synchronizeDualParameterConnections(param1.options || [], param2.options || []);
    const resultParams: ConfigurableParameter[] = [
      { ...param1, options: finalP1Opts },
      { ...param2 },
    ];
    onSave(resultParams);
    onClose();
  };

  const totalCombinations = (param1.options?.length || 0) * (param2.options?.length || 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C02030] text-white flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {t.devDualMatrixModalTitle || "Matriz de Doble Parámetro & Conexiones de Proveedor"}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-extrabold border border-purple-200">
                  {totalCombinations} {totalCombinations === 1 ? "combinación" : "combinaciones"} ({param1.options?.length || 0} × {param2.options?.length || 0})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {t.devDualMatrixModalSubtitle || "Configura cada combinación (Parámetro 1 × Parámetro 2). El Parámetro 2 se replica automáticamente a todas las opciones."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCommitSave}
              className="px-4 py-2 rounded-xl bg-[#C02030] hover:bg-[#A01825] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{t.devDualMatrixSaveBtn || "Guardar y Aplicar"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Top Grid: Param 1 & Param 2 Master Definition */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Column 1: Parámetro 1 (e.g. Tip Color) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-slate-800 text-white flex items-center justify-center text-[10px] font-mono">1</span>
                  <span>{param1.nameEs || "Primer Parámetro (Tip Color)"}</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddParam1Option}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-[#C02030] text-[11px] font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Agregar Opción</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={param1.nameEs}
                  onChange={(e) => setParam1({ ...param1, nameEs: e.target.value })}
                  placeholder="Nombre ES (ej: Color de Punta)"
                  className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-900"
                />
                <input
                  type="text"
                  value={param1.nameEn || ""}
                  onChange={(e) => setParam1({ ...param1, nameEn: e.target.value })}
                  placeholder="Nombre EN (e.g. Tip Color)"
                  className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900"
                />
              </div>

              {/* Options List */}
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {param1.options.map((opt1, idx) => {
                  const resolvedColor = resolveOptionColorHex(opt1.labelEs || opt1.labelEn || "", opt1.colorHex);
                  const isPaletteOpen = activeColorPaletteKey === `p1-${opt1.id}`;

                  return (
                    <div
                      key={opt1.id}
                      className="flex items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-xl shadow-2xs"
                    >
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveColorPaletteKey(isPaletteOpen ? null : `p1-${opt1.id}`)}
                          className="w-6 h-6 rounded-lg border border-slate-300 flex items-center justify-center cursor-pointer shrink-0 shadow-2xs"
                          style={{ backgroundColor: resolvedColor || "#CBD5E1" }}
                          title="Color"
                        />
                        {isPaletteOpen && (
                          <div className="absolute left-0 top-8 z-40 p-2 bg-white border border-slate-200 rounded-xl shadow-xl w-48 space-y-1.5">
                            <div className="grid grid-cols-3 gap-1">
                              {POPULAR_COLORS.map((c) => (
                                <button
                                  key={c.hex}
                                  type="button"
                                  onClick={() => {
                                    handleUpdateParam1Option(idx, { colorHex: c.hex });
                                    setActiveColorPaletteKey(null);
                                  }}
                                  className="w-7 h-7 rounded-lg border border-slate-200"
                                  style={{ backgroundColor: c.hex }}
                                  title={c.label}
                                />
                              ))}
                            </div>
                            <input
                              type="color"
                              value={resolvedColor || "#18181B"}
                              onChange={(e) => handleUpdateParam1Option(idx, { colorHex: e.target.value })}
                              className="w-full h-6 rounded cursor-pointer"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 grid grid-cols-2 gap-1.5 min-w-0">
                        <input
                          type="text"
                          value={opt1.labelEs}
                          onChange={(e) => handleUpdateParam1Option(idx, { labelEs: e.target.value })}
                          placeholder="ES: Inoxidable"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none focus:border-red-500"
                          title="Nombre en Español"
                        />
                        <input
                          type="text"
                          value={opt1.labelEn || ""}
                          onChange={(e) => handleUpdateParam1Option(idx, { labelEn: e.target.value })}
                          placeholder="EN: Stainless"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                          title="Name in English"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveParam1Option(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 2: Parámetro 2 (Master Template - Cover Color) */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3">
              <div className="flex items-center justify-between border-b border-purple-200/80 pb-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-md bg-purple-700 text-white flex items-center justify-center text-[10px] font-mono">2</span>
                  <span>{param2.nameEs || "Segundo Parámetro Maestro (Cover Color)"}</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddParam2Option}
                  className="px-2.5 py-1 rounded-lg bg-white border border-purple-300 text-purple-800 hover:bg-purple-100 text-[11px] font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Agregar Opción</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={param2.nameEs}
                  onChange={(e) => setParam2({ ...param2, nameEs: e.target.value })}
                  placeholder="Nombre ES (ej: Color de Cubierta)"
                  className="bg-white border border-purple-200 rounded-lg p-1.5 text-xs font-bold text-slate-900"
                />
                <input
                  type="text"
                  value={param2.nameEn || ""}
                  onChange={(e) => setParam2({ ...param2, nameEn: e.target.value })}
                  placeholder="Nombre EN (e.g. Cover Color)"
                  className="bg-white border border-purple-200 rounded-lg p-1.5 text-xs text-slate-900"
                />
              </div>

              {/* Master Options List (Replicated to all Param 1 connections!) */}
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {param2.options.map((opt2, idx) => {
                  const resolvedColor = resolveOptionColorHex(opt2.labelEs || opt2.labelEn || "", opt2.colorHex);
                  const isPaletteOpen = activeColorPaletteKey === `p2-${opt2.id}`;

                  return (
                    <div
                      key={opt2.id}
                      className="flex items-center gap-2 p-1.5 bg-white border border-purple-200 rounded-xl shadow-2xs"
                    >
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveColorPaletteKey(isPaletteOpen ? null : `p2-${opt2.id}`)}
                          className="w-6 h-6 rounded-lg border border-purple-300 flex items-center justify-center cursor-pointer shrink-0 shadow-2xs"
                          style={{ backgroundColor: resolvedColor || "#0F172A" }}
                          title="Color"
                        />
                        {isPaletteOpen && (
                          <div className="absolute left-0 top-8 z-40 p-2 bg-white border border-slate-200 rounded-xl shadow-xl w-48 space-y-1.5">
                            <div className="grid grid-cols-3 gap-1">
                              {POPULAR_COLORS.map((c) => (
                                <button
                                  key={c.hex}
                                  type="button"
                                  onClick={() => {
                                    handleUpdateParam2Option(idx, { colorHex: c.hex });
                                    setActiveColorPaletteKey(null);
                                  }}
                                  className="w-7 h-7 rounded-lg border border-slate-200"
                                  style={{ backgroundColor: c.hex }}
                                  title={c.label}
                                />
                              ))}
                            </div>
                            <input
                              type="color"
                              value={resolvedColor || "#DC2626"}
                              onChange={(e) => handleUpdateParam2Option(idx, { colorHex: e.target.value })}
                              className="w-full h-6 rounded cursor-pointer"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 grid grid-cols-2 gap-1.5 min-w-0">
                        <input
                          type="text"
                          value={opt2.labelEs}
                          onChange={(e) => handleUpdateParam2Option(idx, { labelEs: e.target.value })}
                          placeholder="ES: Carbono Rojo"
                          className="w-full bg-purple-50/50 border border-purple-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none focus:border-purple-500"
                          title="Nombre en Español"
                        />
                        <input
                          type="text"
                          value={opt2.labelEn || ""}
                          onChange={(e) => handleUpdateParam2Option(idx, { labelEn: e.target.value })}
                          placeholder="EN: Red Carbon"
                          className="w-full bg-purple-50/50 border border-purple-200 rounded-lg px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                          title="Name in English"
                        />
                      </div>

                      <div className="w-20 shrink-0">
                        <input
                          type="number"
                          step="1"
                          value={opt2.priceDeltaUSD || 0}
                          onChange={(e) => {
                            const usd = parseFloat(e.target.value) || 0;
                            handleUpdateParam2Option(idx, {
                              priceDeltaUSD: usd,
                              priceDeltaCRC: Math.round(usd * liveExchangeRate),
                            });
                          }}
                          placeholder="+$ USD"
                          className="w-full bg-purple-50/50 border border-purple-200 rounded-lg px-1.5 py-1 text-[11px] font-mono text-emerald-700 font-bold text-right"
                          title="Delta base en USD para esta cubierta"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveParam2Option(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="p-2 rounded-xl bg-purple-100/70 border border-purple-200 text-[10px] font-semibold text-purple-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                <span>Las opciones del 2do parámetro se replican de forma automática e inmediata a todas las opciones del 1er parámetro.</span>
              </div>
            </div>
          </div>

          {/* Section 2: Connection Expander (Select 1st Param -> Opens Connections to all 2nd Params) */}
          <div className="space-y-4 pt-2 border-t border-slate-200">
            <div>
              <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-[#C02030]" />
                  <span>{t.devDualMatrixSelectFirstPrompt || "1. Selecciona una opción del 1er parámetro para abrir sus conexiones:"}</span>
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Opción activa: <b className="text-slate-900 font-bold">{activeOpt1?.labelEs || "Ninguna"}</b>
                </span>
              </div>

              {/* Selector Pills for Parameter 1 */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {param1.options.map((opt1) => {
                  const isSelected = opt1.id === selectedParam1OptId;
                  const color = resolveOptionColorHex(opt1.labelEs || opt1.labelEn || "", opt1.colorHex);
                  const configuredUrlsCount = (opt1.connections || []).filter((c) => Boolean(c.supplierUrl?.trim())).length;
                  const totalConns = opt1.connections?.length || 0;

                  return (
                    <button
                      key={opt1.id}
                      type="button"
                      onClick={() => setSelectedParam1OptId(opt1.id)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2.5 border shadow-2xs shrink-0 cursor-pointer ${
                        isSelected
                          ? "bg-[#C02030] text-white border-[#C02030] ring-2 ring-[#C02030]/25 shadow-md scale-[1.02]"
                          : "bg-white hover:bg-slate-100 text-slate-800 border-slate-300"
                      }`}
                    >
                      {color && (
                        <span
                          className={`w-3.5 h-3.5 rounded-full border shrink-0 ${
                            isSelected ? "border-white" : "border-slate-300"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      )}
                      <span>
                        {opt1.labelEs || "Sin nombre"}
                        {opt1.labelEn && opt1.labelEn !== opt1.labelEs ? (
                          <span className={isSelected ? "text-white/80 font-normal ml-1" : "text-slate-400 font-normal ml-1"}>
                            ({opt1.labelEn})
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : configuredUrlsCount === totalConns && totalConns > 0
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                        title={`${configuredUrlsCount} de ${totalConns} URLs configuradas`}
                      >
                        {configuredUrlsCount}/{totalConns} URLs
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Connections Grid for Selected Parameter 1 Option */}
            {activeOpt1 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 flex-wrap">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span>{t.devDualMatrixConnectionsFor || "Conexiones para:"}</span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#C02030] text-white font-extrabold text-xs">
                        {activeOpt1.labelEs}
                      </span>
                      <span className="text-slate-400">×</span>
                      <span className="text-slate-600 font-bold text-xs">Todos los Colores de Cubierta</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ingresa el enlace específico de proveedor (supplierUrl), fotos o precio exclusivo de cada variante combinada.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleFillEmptyUrlsForActiveOpt1}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title="Asigna una URL base a todas las conexiones que aún no tengan enlace"
                    >
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t.devDualMatrixReplicateUrlsBtn || "Replicar supplierURL a vacías"}</span>
                    </button>
                  </div>
                </div>

                {/* Connection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(activeOpt1.connections || []).map((conn, cIdx) => {
                    const opt2 = param2.options.find((o) => o.id === conn.secondOptionId);
                    const opt1LabelEs = activeOpt1.labelEs || "Opción 1";
                    const opt1LabelEn = activeOpt1.labelEn || opt1LabelEs;
                    const opt2LabelEs = conn.secondOptionLabelEs || opt2?.labelEs || `Opción ${cIdx + 1}`;
                    const opt2LabelEn = conn.secondOptionLabelEn || opt2?.labelEn || opt2LabelEs;

                    const opt1Color = resolveOptionColorHex(opt1LabelEs || opt1LabelEn, activeOpt1.colorHex);
                    const opt2Color = resolveOptionColorHex(opt2LabelEs || opt2LabelEn, conn.secondOptionColorHex || opt2?.colorHex);

                    const baseSumUSD = (activeOpt1.priceDeltaUSD || 0) + (opt2?.priceDeltaUSD || 0);
                    const baseSumCRC = (activeOpt1.priceDeltaCRC || 0) + (opt2?.priceDeltaCRC || 0);
                    const isPriceOverridden = conn.priceDeltaUSD !== undefined && conn.priceDeltaUSD !== null;

                    const effectiveUSD = isPriceOverridden ? conn.priceDeltaUSD! : baseSumUSD;
                    const effectiveCRC = isPriceOverridden ? (conn.priceDeltaCRC || Math.round(effectiveUSD * liveExchangeRate)) : baseSumCRC;

                    const connKey = `${activeOpt1.id}-${conn.secondOptionId}`;
                    const isUploadingThis = uploadingKey === connKey;
                    const connImages = Array.isArray(conn.images) && conn.images.length > 0 ? conn.images : (conn.imageUrl ? [conn.imageUrl] : []);

                    return (
                      <div
                        key={conn.secondOptionId || cIdx}
                        className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3 hover:border-slate-300 transition"
                      >
                        {/* Title Bar */}
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Color Swatch Combination Dots */}
                            <div className="flex items-center -space-x-1 shrink-0">
                              <span
                                className="w-4 h-4 rounded-full border border-white shadow-xs"
                                style={{ backgroundColor: opt1Color || "#CBD5E1" }}
                                title={`${opt1LabelEs} (${opt1LabelEn})`}
                              />
                              <span
                                className="w-4 h-4 rounded-full border border-white shadow-xs"
                                style={{ backgroundColor: opt2Color || "#0F172A" }}
                                title={`${opt2LabelEs} (${opt2LabelEn})`}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-900 truncate">
                              <span className="text-slate-700 font-extrabold">{opt1LabelEs}</span>
                              {opt1LabelEn !== opt1LabelEs && (
                                <span className="text-slate-400 font-normal text-[11px] ml-1">({opt1LabelEn})</span>
                              )}
                              <span className="text-slate-400 mx-1.5">+</span>
                              <span className="text-[#C02030] font-black">{opt2LabelEs}</span>
                              {opt2LabelEn !== opt2LabelEs && (
                                <span className="text-rose-400 font-normal text-[11px] ml-1">({opt2LabelEn})</span>
                              )}
                            </span>
                          </div>

                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-100 shrink-0">
                            {t.devDualMatrixReplicatedBadge || "Replicado"}
                          </span>
                        </div>

                        {/* Supplier URL Input */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-600 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3 text-blue-600" />
                              <span>supplierUrl exclusivo:</span>
                            </span>
                            {conn.supplierUrl && (
                              <a
                                href={conn.supplierUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-0.5 text-[10px] font-semibold"
                              >
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>Abrir y probar</span>
                              </a>
                            )}
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="url"
                              value={conn.supplierUrl || ""}
                              onChange={(e) => handleUpdateActiveConnection(conn.secondOptionId, { supplierUrl: e.target.value })}
                              placeholder={`https://supplier.com/item?tip=${encodeURIComponent(opt1LabelEs)}&cover=${encodeURIComponent(opt2LabelEs)}`}
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:border-red-500"
                            />
                            {conn.supplierUrl && (
                              <a
                                href={conn.supplierUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition shrink-0"
                                title="Abrir enlace"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Multi-Image Gallery for this Combo */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
                            <span className="flex items-center gap-1">
                              <ImageIcon className="w-3 h-3 text-[#C02030]" />
                              <span>Fotos de la Combinación ({connImages.length}):</span>
                            </span>
                            <label className="cursor-pointer px-2 py-0.5 rounded-md bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-[#C02030] border border-slate-200 text-[10px] font-bold flex items-center gap-1 transition shrink-0">
                              <Upload className="w-2.5 h-2.5" />
                              <span>{isUploadingThis ? "Subiendo..." : "+ Subir Fotos"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                disabled={isUploadingThis}
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    handleUploadConnectionImages(conn.secondOptionId, e.target.files);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {/* Thumbnails row */}
                          {connImages.length > 0 ? (
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                              {connImages.map((imgUrl, iIdx) => {
                                const isPrimary = (conn.imageUrl && conn.imageUrl === imgUrl) || (!conn.imageUrl && iIdx === 0);
                                return (
                                  <div
                                    key={`${imgUrl}-${iIdx}`}
                                    className={`group relative w-11 h-11 rounded-lg border overflow-hidden shrink-0 bg-slate-100 ${
                                      isPrimary ? "border-amber-500 ring-1 ring-amber-300" : "border-slate-200"
                                    }`}
                                  >
                                    <img src={imgUrl} alt={`Foto ${iIdx + 1}`} className="w-full h-full object-cover" />
                                    {isPrimary && (
                                      <div className="absolute top-0 left-0 bg-amber-500 p-0.5 rounded-br">
                                        <Star className="w-2 h-2 fill-white text-white" />
                                      </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                                      {!isPrimary && (
                                        <button
                                          type="button"
                                          onClick={() => handleSetConnectionPrimaryImage(conn.secondOptionId, imgUrl)}
                                          className="p-0.5 bg-amber-500 text-white rounded cursor-pointer"
                                          title="Hacer principal"
                                        >
                                          <Star className="w-2.5 h-2.5 fill-white" />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveConnectionImage(conn.secondOptionId, imgUrl)}
                                        className="p-0.5 bg-red-600 text-white rounded cursor-pointer"
                                        title="Eliminar"
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 italic">
                              Sin fotos individuales. La tienda mostrará las fotos de {opt2LabelEs}.
                            </p>
                          )}

                          {/* Add Image URL */}
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={urlInputMap[connKey] || ""}
                              onChange={(e) => setUrlInputMap((prev) => ({ ...prev, [connKey]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddConnectionImageUrl(conn.secondOptionId, urlInputMap[connKey] || "");
                                  setUrlInputMap((prev) => ({ ...prev, [connKey]: "" }));
                                }
                              }}
                              placeholder="Pegar URL de foto..."
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-[11px] text-slate-700"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                handleAddConnectionImageUrl(conn.secondOptionId, urlInputMap[connKey] || "");
                                setUrlInputMap((prev) => ({ ...prev, [connKey]: "" }));
                              }}
                              className="px-2 py-1 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold"
                            >
                              + URL
                            </button>
                          </div>
                        </div>

                        {/* Price Delta Override */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-500">Precio Combinación:</span>
                            <span className="text-[11px] font-mono font-bold text-slate-700">
                              {effectiveUSD > 0 ? `+$${effectiveUSD}` : effectiveUSD < 0 ? `-$${Math.abs(effectiveUSD)}` : "$0"}
                              <span className="text-slate-400 text-[10px] font-normal ml-1">
                                ({formatCRC(effectiveCRC)})
                              </span>
                            </span>
                            {!isPriceOverridden && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-semibold">
                                (Suma Base)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.01"
                              value={conn.priceDeltaUSD !== undefined ? conn.priceDeltaUSD : ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "") {
                                  handleUpdateActiveConnection(conn.secondOptionId, {
                                    priceDeltaUSD: undefined,
                                    priceDeltaCRC: undefined,
                                  });
                                } else {
                                  const usd = parseFloat(val) || 0;
                                  handleUpdateActiveConnection(conn.secondOptionId, {
                                    priceDeltaUSD: usd,
                                    priceDeltaCRC: Math.round(usd * liveExchangeRate),
                                  });
                                }
                              }}
                              placeholder={`$${baseSumUSD} (Base)`}
                              className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono font-bold text-emerald-700 text-right focus:outline-none focus:border-red-500"
                              title="Sobrescribe el precio exclusivo para esta combinación en USD"
                            />
                            {isPriceOverridden && (
                              <button
                                type="button"
                                onClick={() => handleUpdateActiveConnection(conn.secondOptionId, {
                                  priceDeltaUSD: undefined,
                                  priceDeltaCRC: undefined,
                                })}
                                className="text-[10px] text-slate-400 hover:text-red-600 underline font-semibold"
                                title="Volver a la suma automática de parámetros"
                              >
                                Restablecer
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="text-xs text-slate-600 font-semibold">
            <span>Matriz de Variantes: </span>
            <b className="text-slate-900">{totalCombinations} combinaciones totales</b>
            <span className="text-slate-400 mx-1.5">•</span>
            <span className="text-emerald-700 font-bold">
              {param1.options.reduce((acc, opt) => acc + (opt.connections?.filter((c) => Boolean(c.supplierUrl?.trim())).length || 0), 0)} URLs de proveedor enlazadas
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCommitSave}
              className="px-5 py-2 rounded-xl bg-[#C02030] hover:bg-[#A01825] text-white text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{t.devDualMatrixSaveBtn || "Guardar y Aplicar Matriz"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParametersEditorSection({
  parameters,
  onChange,
  t,
  availableProducts = [],
  currentProductPrice = 0,
  currentProductName = "",
  currentProductSku = "",
  currentProductImage = "",
  currentProductSupplierUrl = "",
  liveExchangeRate = 515,
}: {
  parameters: ConfigurableParameter[];
  onChange: (newParams: ConfigurableParameter[]) => void;
  t: any;
  availableProducts?: Product[];
  currentProductPrice?: number;
  currentProductName?: string;
  currentProductSku?: string;
  currentProductImage?: string;
  currentProductSupplierUrl?: string;
  liveExchangeRate?: number;
}) {
  const [activeColorPaletteOpt, setActiveColorPaletteOpt] = useState<string | null>(null);
  const [uploadingOptId, setUploadingOptId] = useState<string | null>(null);
  const [urlInputByOpt, setUrlInputByOpt] = useState<Record<string, string>>({});
  const [isDualMatrixModalOpen, setIsDualMatrixModalOpen] = useState<boolean>(false);

  const POPULAR_COLORS = [
    { label: "Naranja", hex: "#EA580C" },
    { label: "Negro", hex: "#18181B" },
    { label: "Azul", hex: "#2563EB" },
    { label: "Rojo", hex: "#DC2626" },
    { label: "Titanio", hex: "#94A3B8" },
    { label: "Blanco", hex: "#FFFFFF" },
    { label: "Oro / Amarillo", hex: "#EAB308" },
    { label: "Verde", hex: "#16A34A" },
  ];

  const handleAddParameter = () => {
    const newParam: ConfigurableParameter = {
      id: `param-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nameEs: "",
      nameEn: "",
      type: "button",
      options: [
        {
          id: `opt-${Date.now()}-1`,
          labelEs: "",
          labelEn: "",
          priceDeltaCRC: 0,
          priceDeltaUSD: 0,
          imageUrl: "",
          images: [],
          supplierUrl: "",
        },
      ],
    };
    onChange([...(parameters || []), newParam]);
  };

  const handleAddDualParameterPreset = () => {
    const tipParam: ConfigurableParameter = {
      id: `param-${Date.now()}-tip`,
      nameEs: "Color de Punta",
      nameEn: "Tip Color",
      type: "button",
      options: [
        {
          id: `opt-tip-${Date.now()}-1`,
          labelEs: "Inoxidable",
          labelEn: "Stainless",
          colorHex: "#CBD5E1",
          priceDeltaCRC: 0,
          priceDeltaUSD: 0,
          imageUrl: "",
          images: [],
          supplierUrl: currentProductSupplierUrl || "",
        },
        {
          id: `opt-tip-${Date.now()}-2`,
          labelEs: "Negro",
          labelEn: "Black",
          colorHex: "#18181B",
          priceDeltaCRC: 0,
          priceDeltaUSD: 0,
          imageUrl: "",
          images: [],
          supplierUrl: currentProductSupplierUrl || "",
        },
        {
          id: `opt-tip-${Date.now()}-3`,
          labelEs: "Azul / Oro",
          labelEn: "Blue / Gold",
          colorHex: "#2563EB",
          priceDeltaCRC: 0,
          priceDeltaUSD: 0,
          imageUrl: "",
          images: [],
          supplierUrl: currentProductSupplierUrl || "",
        },
        {
          id: `opt-tip-${Date.now()}-4`,
          labelEs: "Oro",
          labelEn: "Gold",
          colorHex: "#EAB308",
          priceDeltaCRC: 0,
          priceDeltaUSD: 0,
          imageUrl: "",
          images: [],
          supplierUrl: currentProductSupplierUrl || "",
        },
      ],
    };

    const coverParam: ConfigurableParameter = {
      id: `param-${Date.now() + 1}-cover`,
      nameEs: "Color de Cubierta",
      nameEn: "Cover Color",
      type: "button",
      options: [
        {
          id: `opt-cov-${Date.now()}-1`,
          labelEs: "Fibra Carbono Brillante",
          labelEn: "Gloss Carbon",
          colorHex: "#0F172A",
          priceDeltaCRC: 0,
          priceDeltaUSD: 0,
          imageUrl: "",
          images: [],
          supplierUrl: currentProductSupplierUrl || "",
        },
        {
          id: `opt-cov-${Date.now()}-2`,
          labelEs: "Fibra Carbono Mate",
          labelEn: "Matte Carbon",
          colorHex: "#334155",
          priceDeltaCRC: 0,
          priceDeltaUSD: 0,
          imageUrl: "",
          images: [],
          supplierUrl: currentProductSupplierUrl || "",
        },
        {
          id: `opt-cov-${Date.now()}-3`,
          labelEs: "Fibra Carbono Roja",
          labelEn: "Red Carbon",
          colorHex: "#DC2626",
          priceDeltaCRC: 0,
          priceDeltaUSD: 0,
          imageUrl: "",
          images: [],
          supplierUrl: currentProductSupplierUrl || "",
        },
        {
          id: `opt-cov-${Date.now()}-4`,
          labelEs: "Carbono Forjado Brillante",
          labelEn: "Gloss Forged Carbon",
          colorHex: "#0F172A",
          priceDeltaCRC: 0,
          priceDeltaUSD: 0,
          imageUrl: "",
          images: [],
          supplierUrl: currentProductSupplierUrl || "",
        },
        {
          id: `opt-cov-${Date.now()}-5`,
          labelEs: "Carbono Forjado Mate",
          labelEn: "Matte Forged Carbon",
          colorHex: "#334155",
          priceDeltaCRC: 0,
          priceDeltaUSD: 0,
          imageUrl: "",
          images: [],
          supplierUrl: currentProductSupplierUrl || "",
        },
        {
          id: `opt-cov-${Date.now()}-6`,
          labelEs: "Carbono Forjado Dorado",
          labelEn: "Gold Forged Carbon",
          colorHex: "#EAB308",
          priceDeltaCRC: 0,
          priceDeltaUSD: 0,
          imageUrl: "",
          images: [],
          supplierUrl: currentProductSupplierUrl || "",
        },
        {
          id: `opt-cov-${Date.now()}-7`,
          labelEs: "Carbono Forjado Rojo",
          labelEn: "Red Forged Carbon",
          colorHex: "#EF4444",
          priceDeltaCRC: 0,
          priceDeltaUSD: 0,
          imageUrl: "",
          images: [],
          supplierUrl: currentProductSupplierUrl || "",
        },
        {
          id: `opt-cov-${Date.now()}-8`,
          labelEs: "Carbono Forjado Azul",
          labelEn: "Blue Forged Carbon",
          colorHex: "#3B82F6",
          priceDeltaCRC: 0,
          priceDeltaUSD: 0,
          imageUrl: "",
          images: [],
          supplierUrl: currentProductSupplierUrl || "",
        },
      ],
    };

    // Synchronize connections immediately across the entire parameter matrix
    tipParam.options = synchronizeDualParameterConnections(tipParam.options, coverParam.options);

    onChange([...(parameters || []), tipParam, coverParam]);
  };

  const handleAddColorPreset = () => {
    const colorParam: ConfigurableParameter = {
      id: `param-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nameEs: "Color",
      nameEn: "Color",
      type: "color",
      options: [
        {
          id: `opt-${Date.now()}-1`,
          labelEs: "Naranja",
          labelEn: "Orange",
          colorHex: "#EA580C",
          priceDeltaCRC: 0,
          priceDeltaUSD: 0,
          imageUrl: "",
          images: [],
          supplierUrl: currentProductSupplierUrl || "",
        },
        {
          id: `opt-${Date.now()}-2`,
          labelEs: "Negro",
          labelEn: "Black",
          colorHex: "#18181B",
          priceDeltaCRC: 0,
          priceDeltaUSD: 0,
          imageUrl: "",
          images: [],
          supplierUrl: currentProductSupplierUrl || "",
        },
        {
          id: `opt-${Date.now()}-3`,
          labelEs: "Azul",
          labelEn: "Blue",
          colorHex: "#2563EB",
          priceDeltaCRC: 0,
          priceDeltaUSD: 0,
          imageUrl: "",
          images: [],
          supplierUrl: currentProductSupplierUrl || "",
        },
      ],
    };
    onChange([...(parameters || []), colorParam]);
  };

  const handleAddProductLinkingPreset = () => {
    const linkParam: ConfigurableParameter = {
      id: `param-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nameEs: "Versión / Edición",
      nameEn: "Edition / Version",
      type: "product_linking",
      options: [
        {
          id: `opt-${Date.now()}-1`,
          labelEs: "Estándar / Base",
          labelEn: "Standard / Base",
          priceDeltaCRC: 0,
          priceDeltaUSD: 0,
          imageUrl: currentProductImage || "",
          images: currentProductImage ? [currentProductImage] : [],
          supplierUrl: currentProductSupplierUrl || "",
        },
        {
          id: `opt-${Date.now()}-2`,
          labelEs: "Kit Completo / Avanzado",
          labelEn: "Complete Kit / Advanced",
          priceDeltaCRC: 0,
          priceDeltaUSD: 0,
          imageUrl: "",
          images: [],
          linkedProductId: "",
          supplierUrl: "",
        },
      ],
    };
    onChange([...(parameters || []), linkParam]);
  };

  const handleRemoveParameter = (pIndex: number) => {
    const updated = (parameters || []).filter((_, idx) => idx !== pIndex);
    onChange(updated);
  };

  const handleUpdateParameter = (
    pIndex: number,
    field: "nameEs" | "nameEn" | "type",
    value: any
  ) => {
    const updated = [...(parameters || [])];
    updated[pIndex] = { ...updated[pIndex], [field]: value };
    onChange(updated);
  };

  const handleAddOption = (pIndex: number) => {
    const updated = [...(parameters || [])];
    const newOpt: ParameterOption = {
      id: `opt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      labelEs: "",
      labelEn: "",
      priceDeltaCRC: 0,
    };
    updated[pIndex] = {
      ...updated[pIndex],
      options: [...(updated[pIndex].options || []), newOpt],
    };
    onChange(updated);
  };

  const handleRemoveOption = (pIndex: number, oIndex: number) => {
    const updated = [...(parameters || [])];
    updated[pIndex] = {
      ...updated[pIndex],
      options: (updated[pIndex].options || []).filter((_, idx) => idx !== oIndex),
    };
    onChange(updated);
  };

  const handleUpdateOption = (
    pIndex: number,
    oIndex: number,
    field: keyof ParameterOption,
    value: any
  ) => {
    const updated = [...(parameters || [])];
    const opts = [...(updated[pIndex].options || [])];
    opts[oIndex] = { ...opts[oIndex], [field]: value };
    updated[pIndex] = { ...updated[pIndex], options: opts };
    onChange(updated);
  };

  const handleUpdateOptionMulti = (
    pIndex: number,
    oIndex: number,
    fields: Partial<ParameterOption>
  ) => {
    const updated = [...(parameters || [])];
    const opts = [...(updated[pIndex].options || [])];
    opts[oIndex] = { ...opts[oIndex], ...fields };
    updated[pIndex] = { ...updated[pIndex], options: opts };
    onChange(updated);
  };

  const handleUploadOptionImages = async (
    pIndex: number,
    oIndex: number,
    files: FileList | File[]
  ) => {
    const optId = parameters[pIndex]?.options[oIndex]?.id || `${pIndex}-${oIndex}`;
    setUploadingOptId(optId);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "products");
        const res = await fetch("/api/sys/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data?.success && data?.url) {
          uploadedUrls.push(data.url);
        }
      }
      if (uploadedUrls.length > 0) {
        const updated = [...(parameters || [])];
        const opts = [...(updated[pIndex].options || [])];
        const currentOpt = opts[oIndex];
        const existingImages = Array.isArray(currentOpt.images)
          ? currentOpt.images
          : currentOpt.imageUrl
          ? [currentOpt.imageUrl]
          : [];
        const nextImages = Array.from(new Set([...existingImages, ...uploadedUrls]));
        opts[oIndex] = {
          ...currentOpt,
          imageUrl: currentOpt.imageUrl || uploadedUrls[0],
          images: nextImages,
        };
        updated[pIndex] = { ...updated[pIndex], options: opts };
        onChange(updated);
      }
    } catch (e) {
      console.error("Error uploading option images", e);
    } finally {
      setUploadingOptId(null);
    }
  };

  const handleAddOptionImageUrl = (pIndex: number, oIndex: number, url: string) => {
    if (!url || !url.trim()) return;
    const cleanUrl = url.trim();
    const updated = [...(parameters || [])];
    const opts = [...(updated[pIndex].options || [])];
    const currentOpt = opts[oIndex];
    const existingImages = Array.isArray(currentOpt.images)
      ? currentOpt.images
      : currentOpt.imageUrl
      ? [currentOpt.imageUrl]
      : [];
    const nextImages = Array.from(new Set([...existingImages, cleanUrl]));
    opts[oIndex] = {
      ...currentOpt,
      imageUrl: currentOpt.imageUrl || cleanUrl,
      images: nextImages,
    };
    updated[pIndex] = { ...updated[pIndex], options: opts };
    onChange(updated);
  };

  const handleRemoveOptionImage = (pIndex: number, oIndex: number, imgUrl: string) => {
    const updated = [...(parameters || [])];
    const opts = [...(updated[pIndex].options || [])];
    const currentOpt = opts[oIndex];
    const currentImages = Array.isArray(currentOpt.images)
      ? currentOpt.images
      : currentOpt.imageUrl
      ? [currentOpt.imageUrl]
      : [];
    const nextImages = currentImages.filter((img) => img !== imgUrl);
    opts[oIndex] = {
      ...currentOpt,
      imageUrl: currentOpt.imageUrl === imgUrl ? (nextImages[0] || "") : currentOpt.imageUrl,
      images: nextImages,
    };
    updated[pIndex] = { ...updated[pIndex], options: opts };
    onChange(updated);
  };

  const handleSetOptionPrimaryImage = (pIndex: number, oIndex: number, imgUrl: string) => {
    handleUpdateOption(pIndex, oIndex, "imageUrl", imgUrl);
  };

  const safeParams = parameters || [];

  return (
    <div className="p-6 rounded-3xl bg-white border border-red-200 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-red-100 pb-3 flex-wrap gap-2">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-[#C02030]" />
            <span>{t.devParametersTitle}</span>
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {t.devParametersDesc}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsDualMatrixModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Abrir ventana para configurar la matriz de combinaciones (Tip × Cover)"
          >
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>{t.devAddDualParameterPresetBtn || "+ Doble Parámetro (Tip & Cover)"}</span>
          </button>
          <button
            type="button"
            onClick={handleAddProductLinkingPreset}
            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Vincular diferentes productos del catálogo estilo Amazon para cambiar precio, fotos y detalles"
          >
            <Link2 className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.devAddProductLinkingPresetBtn || "+ Vincular Productos (Amazon)"}</span>
          </button>
          <button
            type="button"
            onClick={handleAddColorPreset}
            className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#EA580C] border border-orange-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Agrega rápidamente la opción de colores Naranja, Negro y Azul con botones visuales"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#EA580C]" />
            <span>{t.devAddColorPresetBtn}</span>
          </button>
          <button
            type="button"
            onClick={handleAddParameter}
            className="px-3 py-1.5 rounded-xl bg-[#C02030] hover:bg-[#A01825] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.devAddParameterBtn}</span>
          </button>
        </div>
      </div>

      {safeParams.length === 0 ? (
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
          <p className="text-xs text-slate-500">{t.devNoParametersNotice}</p>
          <div className="flex justify-center gap-2 pt-1 flex-wrap">
            <button
              type="button"
              onClick={() => setIsDualMatrixModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white border border-purple-300 text-purple-700 text-xs font-bold hover:bg-purple-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              <span>{t.devAddDualParameterPresetBtn || "+ Doble Parámetro (Tip & Cover)"}</span>
            </button>
            <button
              type="button"
              onClick={handleAddProductLinkingPreset}
              className="px-3 py-1.5 rounded-xl bg-white border border-blue-300 text-blue-700 text-xs font-bold hover:bg-blue-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.devAddProductLinkingPresetBtn || "+ Vincular Productos (Amazon)"}</span>
            </button>
            <button
              type="button"
              onClick={handleAddColorPreset}
              className="px-3 py-1.5 rounded-xl bg-white border border-orange-300 text-[#EA580C] text-xs font-bold hover:bg-orange-50 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>{t.devAddColorPresetBtn}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {safeParams.length >= 2 && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 flex items-center justify-between gap-3 flex-wrap shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-black text-purple-950 block">
                    {t.devDualMatrixBtn || "Matriz de Doble Parámetro Activa"}
                  </span>
                  <span className="text-[11px] text-purple-800">
                    Las conexiones de proveedor (supplierUrl), fotos y precios específicos por combinación se configuran en la ventana interactiva.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDualMatrixModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Ventana de Conexiones</span>
              </button>
            </div>
          )}
          {safeParams.map((param, pIdx) => {
            const isProductLinking =
              param.type === "product_linking" || param.type === "product_link";

            return (
              <div
                key={param.id || pIdx}
                className={`p-4 rounded-2xl bg-slate-50 border space-y-3 ${
                  isProductLinking ? "border-blue-300 ring-1 ring-blue-100" : "border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                        {t.devParameterNameEsLabel}:
                      </label>
                      <input
                        type="text"
                        value={param.nameEs}
                        onChange={(e) => handleUpdateParameter(pIdx, "nameEs", e.target.value)}
                        placeholder="ej: Color, Edición o Kit"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                        {t.devParameterNameEnLabel}:
                      </label>
                      <input
                        type="text"
                        value={param.nameEn || ""}
                        onChange={(e) => handleUpdateParameter(pIdx, "nameEn", e.target.value)}
                        placeholder="e.g. Color, Edition or Kit"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveParameter(pIdx)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition shrink-0 cursor-pointer"
                    title={t.devRemoveParameterBtn}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Parameter Type Selector */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-700">
                    {t.devParameterTypeLabel || "Tipo de Parámetro:"}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleUpdateParameter(pIdx, "type", "button")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border ${
                        (!param.type || param.type === "button")
                          ? "bg-slate-800 text-white border-slate-800 shadow-2xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {t.devParamTypeButton || "Botones Estándar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateParameter(pIdx, "type", "color")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border ${
                        param.type === "color"
                          ? "bg-orange-600 text-white border-orange-600 shadow-2xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      {t.devParamTypeColor || "Colores con Muestra"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateParameter(pIdx, "type", "product_linking")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border ${
                        isProductLinking
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <Link2 className="w-2.5 h-2.5" />
                      {t.devParamTypeProductLinking || "Vinculación de Productos (Estilo Amazon)"}
                    </button>
                  </div>
                </div>

                {isProductLinking && (
                  <div className="p-2.5 rounded-xl bg-blue-50/90 border border-blue-200 text-[11px] text-blue-900 flex items-start gap-2">
                    <Link2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">
                        {t.devParamTypeProductLinking || "Vinculación de Productos (Estilo Amazon)"}
                      </span>
                      <span className="text-blue-800">
                        {t.devLinkedProductDesc || "Cambia imágenes, precio y especificaciones sin salir de la pantalla para guiar al cliente a comprar más."}
                      </span>
                    </div>
                  </div>
                )}

                {/* Options List */}
                <div className={`pl-3 border-l-2 space-y-2.5 mt-2 ${isProductLinking ? "border-blue-400" : "border-red-300"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                      {t.devParameterOptionsTitle}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddOption(pIdx)}
                      className="text-[11px] font-bold text-[#C02030] hover:text-[#901520] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{t.devAddOptionBtn}</span>
                    </button>
                  </div>

                  {(param.options || []).map((opt, oIdx) => {
                    const resolvedColor = resolveOptionColorHex(opt.labelEs || opt.labelEn || "", opt.colorHex);
                    const isPaletteOpen = activeColorPaletteOpt === opt.id;
                    const isUploadingThis = uploadingOptId === opt.id;

                    return (
                      <div
                        key={opt.id || oIdx}
                        className="p-3 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-2xs"
                      >
                        {/* Product Linking Selector (Amazon style) */}
                        {isProductLinking && (
                          <div className="p-2 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                            <label className="text-[9px] font-bold text-blue-900 flex items-center justify-between flex-wrap gap-1">
                              <span className="flex items-center gap-1">
                                <Link2 className="w-3 h-3 text-blue-600" />
                                <span>{t.devSelectLinkedProduct || "Vincular a Producto del Catálogo (Estilo Amazon):"}</span>
                              </span>
                              {opt.linkedProductId && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono text-[9px] font-bold flex items-center gap-1">
                                  <ExternalLink className="w-2.5 h-2.5" />
                                  <span>{t.devLinkedProductBadge || "Producto Vinculado"}: {opt.linkedProductId}</span>
                                </span>
                              )}
                            </label>
                            <select
                              value={opt.linkedProductId || ""}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                if (!selectedId) {
                                  handleUpdateOptionMulti(pIdx, oIdx, { linkedProductId: undefined });
                                  return;
                                }
                                const targetProd = availableProducts.find(
                                  (p) =>
                                    p.id === selectedId ||
                                    p.sku === selectedId ||
                                    p.slug === selectedId
                                );
                                if (targetProd) {
                                  const targetPrice =
                                    targetProd.price?.T_price || targetProd.priceCRC || 0;
                                  const delta =
                                    currentProductPrice > 0 && targetPrice > 0
                                      ? Math.round(targetPrice - currentProductPrice)
                                      : opt.priceDeltaCRC;
                                  const targetTitleEs = targetProd.nameEs || targetProd.p_title || "";
                                  const targetTitleEn = targetProd.nameEn || targetTitleEs;
                                  let candidateLabelEs = opt.labelEs?.trim();
                                  let candidateLabelEn = opt.labelEn?.trim();
                                  if (!candidateLabelEs) {
                                    if (/z10-4|\b4[- ]?(seater|seat|plazas)\b/i.test(targetTitleEs) || targetProd.sku?.toLowerCase().includes("z10-4")) {
                                      candidateLabelEs = "Z10-4";
                                      candidateLabelEn = "Z10-4";
                                    } else if (/z10\b|\b2[- ]?(seater|seat|plazas)\b/i.test(targetTitleEs) || targetProd.sku?.toLowerCase().includes("z10")) {
                                      candidateLabelEs = "2 Seater";
                                      candidateLabelEn = "2 Seater";
                                    } else {
                                      candidateLabelEs = targetTitleEs;
                                      candidateLabelEn = targetTitleEn;
                                    }
                                  }

                                  // Auto-fill linked product image
                                  const targetImg =
                                    (typeof targetProd.imageUrl === "string" && targetProd.imageUrl.trim() ? targetProd.imageUrl.trim() : "") ||
                                    (Array.isArray(targetProd.imgs) && targetProd.imgs[0] && typeof targetProd.imgs[0] === "string" ? targetProd.imgs[0].trim() : "") ||
                                    (() => {
                                      if ((targetProd as any).imagesJson) {
                                        try {
                                          const parsed = JSON.parse((targetProd as any).imagesJson);
                                          if (Array.isArray(parsed) && parsed[0]) return String(parsed[0]).trim();
                                        } catch {}
                                      }
                                      return "";
                                    })() ||
                                    opt.imageUrl ||
                                    "";

                                  // Auto-fill linked product supplierUrl
                                  const targetSupplier =
                                    (typeof targetProd.supplierUrl === "string" && targetProd.supplierUrl.trim() ? targetProd.supplierUrl.trim() : "") ||
                                    (typeof (targetProd as any).supplier_url === "string" && (targetProd as any).supplier_url.trim() ? (targetProd as any).supplier_url.trim() : "") ||
                                    opt.supplierUrl ||
                                    "";

                                  handleUpdateOptionMulti(pIdx, oIdx, {
                                    linkedProductId: targetProd.slug || targetProd.sku || targetProd.id,
                                    labelEs: candidateLabelEs || targetTitleEs,
                                    labelEn: candidateLabelEn || targetTitleEn,
                                    imageUrl: targetImg,
                                    supplierUrl: targetSupplier,
                                    priceDeltaCRC: delta,
                                  });

                                  // If the complementary option (e.g. self/base option) still has default/empty label, intelligently suggest "2 Seater" or counterpart
                                  const currentParam = (parameters || [])[pIdx];
                                  if (currentParam && currentParam.options) {
                                    const otherIdx = currentParam.options.findIndex((_, idx) => idx !== oIdx && !_.linkedProductId);
                                    if (otherIdx !== -1) {
                                      const otherOpt = currentParam.options[otherIdx];
                                      const updates: Partial<ParameterOption> = {};

                                      if (!otherOpt.labelEs || otherOpt.labelEs === "Estándar / Base" || otherOpt.labelEs.includes("Skid Plate")) {
                                        const curTitle = (currentProductName || "").toLowerCase();
                                        const curSku = (currentProductSku || "").toLowerCase();
                                        if (candidateLabelEs === "Z10-4" || /z10-4|\b4[- ]?(seater|seat|plazas)\b/i.test(targetTitleEs)) {
                                          updates.labelEs = "2 Seater";
                                          updates.labelEn = "2 Seater";
                                        } else if (candidateLabelEs === "2 Seater" || /z10\b|\b2[- ]?(seater|seat|plazas)\b/i.test(targetTitleEs)) {
                                          const is4 = curTitle.includes("z10-4") || curSku.includes("z10-4");
                                          updates.labelEs = is4 ? "Z10-4" : "4 Seater";
                                          updates.labelEn = is4 ? "Z10-4" : "4 Seater";
                                        }
                                      }

                                      // Auto fill base option's image and supplierUrl from current product if not yet set
                                      if (!otherOpt.imageUrl && currentProductImage) {
                                        updates.imageUrl = currentProductImage;
                                      }
                                      if (!otherOpt.supplierUrl && currentProductSupplierUrl) {
                                        updates.supplierUrl = currentProductSupplierUrl;
                                      }

                                      if (Object.keys(updates).length > 0) {
                                        handleUpdateOptionMulti(pIdx, otherIdx, updates);
                                      }
                                    }
                                  }
                                } else {
                                  handleUpdateOption(pIdx, oIdx, "linkedProductId", selectedId);
                                }
                              }}
                              className="w-full bg-white border border-blue-200 rounded-lg p-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                            >
                              <option value="">-- {t.devSelectLinkedProduct || "Opción base / sin producto vinculado"} --</option>
                              {availableProducts.map((p) => {
                                const pPrice = p.price?.T_price || p.priceCRC || 0;
                                const pTitle = p.nameEs || p.p_title || p.sku;
                                return (
                                  <option key={p.id} value={p.slug || p.sku || p.id}>
                                    {pTitle} ({p.sku || p.id}) {pPrice > 0 ? `— ${formatCRC(pPrice)}` : ""}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        )}

                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                          {/* Visual Color Swatch & Palette Trigger (Only show if color parameter or color hex exists) */}
                          {(param.type === "color" || opt.colorHex) && (
                            <div className="relative shrink-0">
                              <label className="text-[9px] font-bold text-slate-500 block mb-0.5">
                                {t.devOptionColorLabel}
                              </label>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveColorPaletteOpt(isPaletteOpen ? null : opt.id)
                                  }
                                  className="w-8 h-8 rounded-xl border border-slate-300 flex items-center justify-center transition shadow-2xs cursor-pointer hover:scale-105"
                                  style={{
                                    backgroundColor: resolvedColor || "#F1F5F9",
                                  }}
                                  title={resolvedColor ? `Color: ${resolvedColor}` : "Elegir color visual"}
                                >
                                  {!resolvedColor && (
                                    <span className="text-[9px] text-slate-400 font-bold">Ø</span>
                                  )}
                                </button>
                              </div>

                              {/* Quick Color Palette Popover */}
                              {isPaletteOpen && (
                                <div className="absolute left-0 top-12 z-30 p-2.5 bg-white border border-slate-200 rounded-2xl shadow-xl w-56 space-y-2">
                                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-700">Paleta SXS</span>
                                    <button
                                      type="button"
                                      onClick={() => setActiveColorPaletteOpt(null)}
                                      className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {POPULAR_COLORS.map((c) => (
                                      <button
                                        key={c.hex}
                                        type="button"
                                        onClick={() => {
                                          handleUpdateOption(pIdx, oIdx, "colorHex", c.hex);
                                          setActiveColorPaletteOpt(null);
                                        }}
                                        className="w-9 h-9 rounded-xl border border-slate-200 flex flex-col items-center justify-center hover:scale-110 transition shadow-2xs cursor-pointer"
                                        style={{ backgroundColor: c.hex }}
                                        title={c.label}
                                      >
                                        {resolvedColor?.toLowerCase() === c.hex.toLowerCase() && (
                                          <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1">
                                    <label className="text-[10px] text-slate-600 font-semibold flex items-center gap-1 cursor-pointer">
                                      <span>Personalizado:</span>
                                      <input
                                        type="color"
                                        value={resolvedColor || "#EA580C"}
                                        onChange={(e) =>
                                          handleUpdateOption(pIdx, oIdx, "colorHex", e.target.value)
                                        }
                                        className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleUpdateOption(pIdx, oIdx, "colorHex", "");
                                        setActiveColorPaletteOpt(null);
                                      }}
                                      className="text-[10px] text-slate-500 hover:text-red-600 underline font-semibold cursor-pointer"
                                    >
                                      {t.devOptionNoColor}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Option Labels ES & EN */}
                          <div className="flex-1 min-w-[120px]">
                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">
                              {t.devOptionLabelEs}
                            </label>
                            <input
                              type="text"
                              value={opt.labelEs}
                              onChange={(e) =>
                                handleUpdateOption(pIdx, oIdx, "labelEs", e.target.value)
                              }
                              placeholder="ej: Naranja o Kit Completo"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-red-500"
                            />
                          </div>
                          <div className="flex-1 min-w-[120px]">
                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">
                              {t.devOptionLabelEn}
                            </label>
                            <input
                              type="text"
                              value={opt.labelEn || ""}
                              onChange={(e) =>
                                handleUpdateOption(pIdx, oIdx, "labelEn", e.target.value)
                              }
                              placeholder="e.g. Orange or Full Kit"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                            />
                          </div>

                          {/* Dual Price Delta (USD & CRC with live exchange rate conversion) */}
                          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                            <div className="w-28">
                              <label className="text-[9px] font-bold text-slate-500 block mb-0.5">
                                {t.devOptionPriceDeltaUSD || "Dif. Precio ($ USD)"}
                              </label>
                              <div className="relative">
                                <span className="absolute left-2 top-1.5 text-[10px] font-mono text-slate-400">
                                  $
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={
                                    opt.priceDeltaUSD !== undefined
                                      ? opt.priceDeltaUSD
                                      : opt.priceDeltaCRC
                                      ? Number((opt.priceDeltaCRC / (liveExchangeRate || 515)).toFixed(2))
                                      : 0
                                  }
                                  onChange={(e) => {
                                    const usd = parseFloat(e.target.value) || 0;
                                    const crc = Math.round(usd * (liveExchangeRate || 515));
                                    handleUpdateOptionMulti(pIdx, oIdx, {
                                      priceDeltaUSD: usd,
                                      priceDeltaCRC: crc,
                                    });
                                  }}
                                  className="w-full pl-5 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:border-red-500"
                                />
                              </div>
                            </div>

                            <div className="w-28">
                              <label className="text-[9px] font-bold text-slate-500 block mb-0.5">
                                {t.devOptionPriceDeltaCRC || "Dif. Precio (₡ CRC)"}
                              </label>
                              <div className="relative">
                                <span className="absolute left-2 top-1.5 text-[10px] font-mono text-slate-400">
                                  ₡
                                </span>
                                <input
                                  type="number"
                                  step="100"
                                  value={opt.priceDeltaCRC || 0}
                                  onChange={(e) => {
                                    const crc = Math.round(Number(e.target.value) || 0);
                                    const usd = Number((crc / (liveExchangeRate || 515)).toFixed(2));
                                    handleUpdateOptionMulti(pIdx, oIdx, {
                                      priceDeltaCRC: crc,
                                      priceDeltaUSD: usd,
                                    });
                                  }}
                                  className="w-full pl-5 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-[#C02030] focus:outline-none focus:border-red-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Delete Option */}
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(pIdx, oIdx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0 mt-4 sm:mt-0 cursor-pointer"
                            title={t.devRemoveOptionBtn}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Option Images Gallery (for client to visualize the variant & scroll through photos) */}
                        <div className="pt-2.5 border-t border-slate-100 space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <label className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5">
                              <ImageIcon className="w-3.5 h-3.5 text-[#C02030]" />
                              <span>{t.devOptionImagesGalleryLabel || "Imágenes de la Variante (Galería de Fotos):"}</span>
                              <span className="text-[9px] font-normal text-slate-400">
                                ({Array.isArray(opt.images) && opt.images.length > 0 ? opt.images.length : (opt.imageUrl ? 1 : 0)} fotos)
                              </span>
                            </label>

                            <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-[#C02030] border border-red-200 text-[11px] font-bold flex items-center gap-1 transition shrink-0 shadow-2xs">
                              <Upload className="w-3 h-3" />
                              <span>{isUploadingThis ? "Subiendo..." : (t.devOptionUploadImagesBtn || "+ Subir Fotos")}</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                disabled={isUploadingThis}
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    handleUploadOptionImages(pIdx, oIdx, e.target.files);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {/* Thumbnails row */}
                          {(() => {
                            const rawList = Array.isArray(opt.images) && opt.images.length > 0
                              ? opt.images
                              : opt.imageUrl
                              ? [opt.imageUrl]
                              : [];
                            const imagesList = Array.from(new Set(rawList.filter(Boolean)));

                            return (
                              <div className="space-y-2">
                                {imagesList.length > 0 ? (
                                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                    {imagesList.map((imgUrl, iIdx) => {
                                      const isPrimary = (opt.imageUrl && opt.imageUrl === imgUrl) || (!opt.imageUrl && iIdx === 0);
                                      return (
                                        <div
                                          key={`${imgUrl}-${iIdx}`}
                                          className={`group relative w-14 h-14 rounded-xl border-2 overflow-hidden shrink-0 bg-slate-100 transition shadow-2xs ${
                                            isPrimary ? "border-amber-500 ring-2 ring-amber-300/60" : "border-slate-200 hover:border-slate-400"
                                          }`}
                                        >
                                          <img
                                            src={imgUrl}
                                            alt={`Variante ${opt.labelEs || ""} foto ${iIdx + 1}`}
                                            className="w-full h-full object-cover"
                                          />
                                          {isPrimary && (
                                            <div className="absolute top-0.5 left-0.5 px-1 py-0.5 rounded bg-amber-500 text-white text-[8px] font-extrabold flex items-center gap-0.5 shadow-xs">
                                              <Star className="w-2 h-2 fill-white text-white" />
                                              <span>{t.devOptionPrimaryBadge || "Principal"}</span>
                                            </div>
                                          )}
                                          {/* Action overlays on hover */}
                                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity">
                                            {!isPrimary && (
                                              <button
                                                type="button"
                                                onClick={() => handleSetOptionPrimaryImage(pIdx, oIdx, imgUrl)}
                                                className="p-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow-xs"
                                                title={t.devOptionSetPrimaryImage || "Definir como foto principal"}
                                              >
                                                <Star className="w-3 h-3 fill-white" />
                                              </button>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveOptionImage(pIdx, oIdx, imgUrl)}
                                              className="p-1 rounded-md bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-xs"
                                              title="Eliminar imagen"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="p-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 text-center text-[10px] text-slate-400">
                                    Sin imágenes para esta opción. Puedes pegar una URL abajo o subir varias fotos.
                                  </div>
                                )}

                                {/* Add URL input for images */}
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={urlInputByOpt[opt.id] || ""}
                                    onChange={(e) =>
                                      setUrlInputByOpt((prev) => ({ ...prev, [opt.id]: e.target.value }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddOptionImageUrl(pIdx, oIdx, urlInputByOpt[opt.id] || "");
                                        setUrlInputByOpt((prev) => ({ ...prev, [opt.id]: "" }));
                                      }
                                    }}
                                    placeholder="Pegar URL de imagen externa o enlace CDN..."
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 focus:outline-none focus:border-red-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleAddOptionImageUrl(pIdx, oIdx, urlInputByOpt[opt.id] || "");
                                      setUrlInputByOpt((prev) => ({ ...prev, [opt.id]: "" }));
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold transition cursor-pointer"
                                  >
                                    {t.devOptionAddImageUrlBtn || "+ Agregar URL"}
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Space for Parameter Option to have different supplierUrl */}
                        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs">
                          <div className="w-5 flex justify-center text-slate-400 shrink-0">
                            <Globe className="w-3.5 h-3.5 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">
                              {t.devOptionSupplierUrlLabel || "URL del Proveedor para esta opción (supplierUrl):"}
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="url"
                                value={opt.supplierUrl || ""}
                                onChange={(e) =>
                                  handleUpdateOption(pIdx, oIdx, "supplierUrl", e.target.value)
                                }
                                placeholder="https://... (enlace específico del proveedor para esta variante o edición)"
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-700 font-mono focus:outline-none focus:border-red-500"
                              />
                              {opt.supplierUrl && (
                                <a
                                  href={opt.supplierUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition shrink-0 cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                                  title="Abrir enlace del proveedor en nueva pestaña"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Abrir</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handleAddOption(pIdx)}
                    className="w-full py-2 border border-dashed border-red-300 rounded-xl text-xs font-bold text-[#C02030] hover:bg-red-50 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t.devAddOptionBtn}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dual Parameter Combinations Window (Fraction expansion matrix modal) */}
      <DualParameterMatrixModal
        isOpen={isDualMatrixModalOpen}
        onClose={() => setIsDualMatrixModalOpen(false)}
        parameters={parameters || []}
        onSave={(newParams) => {
          onChange(newParams);
        }}
        t={t}
        liveExchangeRate={liveExchangeRate}
        currentProductSupplierUrl={currentProductSupplierUrl}
        currentProductImage={currentProductImage}
      />
    </div>
  );
}

function InstallationBreakdownEditor({
  labourCostCRC,
  extraParts,
  profitCRC,
  totalCostCRC,
  durationMinutes = 60,
  onDurationChange,
  onChange,
  t,
  showIncludeCheckbox = false,
  isIncluded = true,
  onToggleInclude,
  comboProductsInstallSummary,
  onApplyComboProductsInstall,
}: {
  labourCostCRC: number;
  extraParts: InstallExtraPart[];
  profitCRC: number;
  totalCostCRC: number;
  durationMinutes?: number;
  onDurationChange?: (mins: number) => void;
  onChange: (labour: number, parts: InstallExtraPart[], profit: number) => void;
  lang: "es" | "en";
  t: any;
  showIncludeCheckbox?: boolean;
  isIncluded?: boolean;
  onToggleInclude?: (val: boolean) => void;
  comboProductsInstallSummary?: {
    totalLabour: number;
    totalProfit: number;
    allExtraParts: InstallExtraPart[];
    totalParts: number;
    totalInstall: number;
  };
  onApplyComboProductsInstall?: () => void;
}) {
  const extraPartsTotal = useMemo(() => {
    return (extraParts || []).reduce((sum, pt) => sum + (Number(pt.priceCRC) || 0), 0);
  }, [extraParts]);

  const handleLabourChange = (val: number) => {
    onChange(val, extraParts || [], profitCRC || 0);
  };

  const handleProfitChange = (val: number) => {
    onChange(labourCostCRC || 0, extraParts || [], val);
  };

  const handleAddExtraPart = () => {
    const newPart: InstallExtraPart = {
      id: `pt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: "",
      priceCRC: 0,
    };
    onChange(labourCostCRC || 0, [...(extraParts || []), newPart], profitCRC || 0);
  };

  const handleUpdateExtraPart = (idx: number, field: "name" | "priceCRC", value: any) => {
    const updated = [...(extraParts || [])];
    if (!updated[idx]) return;
    updated[idx] = {
      ...updated[idx],
      [field]: field === "priceCRC" ? Math.max(0, Math.round(Number(value) || 0)) : value,
    };
    onChange(labourCostCRC || 0, updated, profitCRC || 0);
  };

  const handleRemoveExtraPart = (idx: number) => {
    const updated = (extraParts || []).filter((_, i) => i !== idx);
    onChange(labourCostCRC || 0, updated, profitCRC || 0);
  };

  return (
    <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
          <Wrench className="w-4 h-4 text-emerald-600" />
          <span>{t.devInstallTotalCostLabel || "Costo Total de Instalación (I_price)"}</span>
        </label>
        <span className="text-xs font-extrabold font-mono text-emerald-900 bg-emerald-100/90 border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-2xs">
          {formatCRC(totalCostCRC)}
        </span>
      </div>

      <p className="text-[11px] text-emerald-900/80 leading-snug">
        {t.devInstallBreakdownHelp || "Suma la mano de obra, los repuestos/materiales extra y la ganancia para calcular el costo total de instalación y rastrear mejor los gastos."}
      </p>

      {/* Combo Products Live Aggregation Banner */}
      {comboProductsInstallSummary && comboProductsInstallSummary.totalInstall > 0 && onApplyComboProductsInstall && (
        <div className="p-3 bg-white rounded-xl border border-purple-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>{t.devComboProductsInstallSummary || "Suma de instalación de los productos seleccionados"}:</span>
            </span>
            <span className="text-xs font-mono font-extrabold text-purple-900">
              {formatCRC(comboProductsInstallSummary.totalInstall)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-purple-700/80 font-mono flex-wrap gap-2">
            <span>Mano de Obra: {formatCRC(comboProductsInstallSummary.totalLabour)}</span>
            <span>Repuestos: {formatCRC(comboProductsInstallSummary.totalParts)}</span>
            <span>Ganancia: {formatCRC(comboProductsInstallSummary.totalProfit)}</span>
          </div>
          <button
            type="button"
            onClick={onApplyComboProductsInstall}
            className="w-full py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{t.devComboAddProductInstallCostsBtn || "Sumar costos de instalación de los productos incluidos"}</span>
          </button>
        </div>
      )}

      {/* Optional Free / Included in Product Price Checkbox */}
      {showIncludeCheckbox && (
        <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-emerald-200/90 hover:border-emerald-400 cursor-pointer transition select-none shadow-xs">
          <input
            type="checkbox"
            checked={Boolean(isIncluded)}
            onChange={(e) => onToggleInclude?.(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer"
          />
          <div className="text-left flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-900">
                {t.devFreeInstallationCheckbox} (<span className="font-mono text-emerald-700">includes: true</span>)
              </span>
              {isIncluded && (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                  {t.devFreeInstallationBadge}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
              {t.devFreeInstallationHelp} (Al marcarse, el costo de instalación se suma al Total y se mantiene aunque el cliente no desee instalación).
            </p>
          </div>
        </label>
      )}

      {/* Installation Duration (in the same section as setting install pricing) */}
      <div className="bg-white p-3 rounded-xl border border-emerald-200/80 space-y-1.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.devInstallDurationLabel || "Tiempo Estimado de Instalación (Horas):"}</span>
          </label>
          <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            {((durationMinutes || 60) / 60).toFixed(1)} h ({durationMinutes || 60} min)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={((durationMinutes || 60) / 60) || ""}
            onChange={(e) => {
              const h = Number(e.target.value) || 0;
              onDurationChange?.(Math.max(15, Math.round(h * 60)));
            }}
            placeholder="1.0"
            className="w-full bg-slate-50 border border-emerald-300 rounded-lg p-2 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 transition"
          />
          <span className="text-xs text-slate-600 font-semibold shrink-0">horas</span>
        </div>
        <p className="text-[9px] text-slate-400">
          {t.devInstallDurationHelp || "Tiempo que tomará instalar esta pieza/combo en el taller o a domicilio. Se sumará al agendar citas."}
        </p>
      </div>

      {/* Step 1: Install Labour Cost */}
      <div className="bg-white p-3 rounded-xl border border-emerald-200/80 space-y-1.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
            <span>1. {t.devInstallLabourCostLabel || "Costo de Mano de Obra de Instalación (₡):"}</span>
          </label>
          <span className="text-[11px] font-mono font-bold text-emerald-800">
            {formatCRC(labourCostCRC || 0)}
          </span>
        </div>
        <input
          type="number"
          min="0"
          value={labourCostCRC || ""}
          onChange={(e) => handleLabourChange(Math.max(0, Math.round(Number(e.target.value) || 0)))}
          placeholder="0"
          className="w-full bg-slate-50 border border-emerald-300 rounded-lg p-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 transition"
        />
        <p className="text-[9px] text-slate-400">
          Costo real que cobra el técnico o taller por ejecutar la instalación.
        </p>
      </div>

      {/* Step 2: Extra Parts Cost List */}
      <div className="bg-white p-3 rounded-xl border border-emerald-200/80 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
            <span>2. {t.devInstallExtraPartsLabel || "Repuestos y Materiales Extra de Instalación:"}</span>
          </label>
          <span className="text-[11px] font-mono font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            {t.devInstallExtraPartsTotal || "Subtotal"}: {formatCRC(extraPartsTotal)}
          </span>
        </div>

        {(!extraParts || extraParts.length === 0) ? (
          <div className="py-2.5 px-3 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center">
            <p className="text-[11px] text-slate-400 italic">
              {t.devInstallExtraPartsEmpty || "No hay repuestos o materiales extra registrados para esta instalación."}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {extraParts.map((part, idx) => (
              <div
                key={part.id || `pt-${idx}`}
                className="flex items-center gap-2 p-2 bg-slate-50/80 rounded-lg border border-slate-200/90 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={part.name}
                    onChange={(e) => handleUpdateExtraPart(idx, "name", e.target.value)}
                    placeholder={t.devInstallExtraPartsNamePlaceholder || "Nombre del repuesto (ej: Relé 40A, Arnés, Base)"}
                    className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div className="w-28 sm:w-32 shrink-0">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-[10px]">₡</span>
                    <input
                      type="number"
                      min="0"
                      value={part.priceCRC || ""}
                      onChange={(e) => handleUpdateExtraPart(idx, "priceCRC", e.target.value)}
                      placeholder="0"
                      className="w-full bg-white border border-slate-200 rounded pl-5 pr-2 py-1 text-xs font-mono text-slate-800 text-right focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveExtraPart(idx)}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition shrink-0 cursor-pointer"
                  title="Eliminar repuesto extra"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleAddExtraPart}
          className="w-full py-1.5 px-3 border border-dashed border-emerald-400 bg-emerald-50/50 hover:bg-emerald-100/70 rounded-lg text-[11px] font-bold text-emerald-800 flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.devInstallExtraPartsAddBtn || "+ Agregar Repuesto / Material Extra"}</span>
        </button>
      </div>

      {/* Step 3: Install Profit */}
      <div className="bg-white p-3 rounded-xl border border-emerald-200/80 space-y-1.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-emerald-950 flex items-center gap-1">
            <span>3. {t.devInstallProfitLabel || "Ganancia de Instalación (₡):"}</span>
          </label>
          <span className="text-[11px] font-mono font-bold text-emerald-800">
            {formatCRC(profitCRC || 0)}
          </span>
        </div>
        <input
          type="number"
          min="0"
          value={profitCRC || ""}
          onChange={(e) => handleProfitChange(Math.max(0, Math.round(Number(e.target.value) || 0)))}
          placeholder="0"
          className="w-full bg-slate-50 border border-emerald-300 rounded-lg p-2 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 transition"
        />
        <p className="text-[9px] text-slate-400">
          Margen de beneficio neto de ZxZ sobre la instalación después de pagar mano de obra y repuestos.
        </p>
      </div>

      {/* Step 4: Formula & Breakdown Summary */}
      <div className="p-3 bg-emerald-950 text-white rounded-xl space-y-2 shadow-sm">
        <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
          Desglose Total de Instalación (Suma Automática):
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="bg-white/10 rounded-lg p-1.5">
            <span className="text-[9px] text-emerald-200 block">Mano de Obra</span>
            <span className="font-mono font-bold text-white text-[11px]">{formatCRC(labourCostCRC || 0)}</span>
          </div>
          <div className="bg-white/10 rounded-lg p-1.5">
            <span className="text-[9px] text-emerald-200 block">+ Repuestos ({extraParts?.length || 0})</span>
            <span className="font-mono font-bold text-white text-[11px]">{formatCRC(extraPartsTotal)}</span>
          </div>
          <div className="bg-white/10 rounded-lg p-1.5">
            <span className="text-[9px] text-emerald-200 block">+ Ganancia</span>
            <span className="font-mono font-bold text-white text-[11px]">{formatCRC(profitCRC || 0)}</span>
          </div>
          <div className="bg-emerald-500/30 border border-emerald-400 rounded-lg p-1.5">
            <span className="text-[9px] text-emerald-200 block font-extrabold">= Total Instalación</span>
            <span className="font-mono font-extrabold text-emerald-300 text-[11px]">{formatCRC(totalCostCRC)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MinimalistSuggestionsTaggerProps {
  suggestedProductIds: string[];
  suggestedComboIds: string[];
  onUpdateProductIds: (ids: string[]) => void;
  onUpdateComboIds: (ids: string[]) => void;
  allProducts: Product[];
  allCombos: Combo[];
  currentId?: string;
  currentSku?: string;
  t: any;
  lang: string;
}

function MinimalistSuggestionsTagger({
  suggestedProductIds = [],
  suggestedComboIds = [],
  onUpdateProductIds,
  onUpdateComboIds,
  allProducts = [],
  allCombos = [],
  currentId,
  currentSku,
  t,
  lang,
}: MinimalistSuggestionsTaggerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "products" | "combos">("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const totalCount = suggestedProductIds.length + suggestedComboIds.length;

  const filteredCandidates = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const norm = (str: string) =>
      String(str || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    const q = norm(searchTerm.trim());

    const matchedProducts = filterType === "combos" ? [] : allProducts
      .filter((p) => {
        if (currentId && (p.id === currentId || p.sku === currentId || p.slug === currentId)) return false;
        if (currentSku && p.sku === currentSku) return false;
        if (suggestedProductIds.includes(p.id) || (p.sku && suggestedProductIds.includes(p.sku))) return false;
        const haystack = norm(
          [
            p.nameEs,
            p.nameEn,
            p.p_title,
            p.sku,
            p.slug,
            p.brandName,
            ...(Array.isArray(p.brand) ? p.brand : []),
          ].join(" ")
        );
        return haystack.includes(q);
      })
      .slice(0, 6)
      .map((p) => ({
        type: "product" as const,
        id: p.id,
        sku: p.sku,
        title: lang === "es" ? (p.nameEs || p.p_title || p.nameEn) : (p.nameEn || p.nameEs || p.p_title),
        priceCRC: p.priceCRC || p.price?.T_price || 0,
        imageUrl: p.imageUrl || "/images/logo.png",
      }));

    const matchedCombos = filterType === "products" ? [] : allCombos
      .filter((c) => {
        if (currentId && (c.id === currentId || c.slug === currentId)) return false;
        if (suggestedComboIds.includes(c.id) || (c.slug && suggestedComboIds.includes(c.slug))) return false;
        const haystack = norm([c.titleEs, c.titleEn, c.slug, c.badgeEs, c.badgeEn, c.category].join(" "));
        return haystack.includes(q);
      })
      .slice(0, 6)
      .map((c) => ({
        type: "combo" as const,
        id: c.id,
        sku: c.slug,
        title: lang === "es" ? (c.titleEs || c.titleEn) : (c.titleEn || c.titleEs),
        priceCRC: c.priceCRC || 0,
        imageUrl: c.imageUrl || "/images/logo.png",
      }));

    return [...matchedProducts, ...matchedCombos].slice(0, 8);
  }, [searchTerm, filterType, allProducts, allCombos, currentId, currentSku, suggestedProductIds, suggestedComboIds, lang]);

  const handleAdd = (item: { type: "product" | "combo"; id: string }) => {
    if (item.type === "product") {
      onUpdateProductIds(Array.from(new Set([...suggestedProductIds, item.id])));
    } else {
      onUpdateComboIds(Array.from(new Set([...suggestedComboIds, item.id])));
    }
    setSearchTerm("");
    setIsDropdownOpen(false);
  };

  const handleRemoveProduct = (id: string) => {
    onUpdateProductIds(suggestedProductIds.filter((x) => x !== id));
  };

  const handleRemoveCombo = (id: string) => {
    onUpdateComboIds(suggestedComboIds.filter((x) => x !== id));
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#C02030]" />
          <span>{t.devSuggestionsTitle}</span>
        </span>
        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-full font-semibold">
          {totalCount} {lang === "es" ? "etiquetado(s)" : "tagged"}
        </span>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        {t.devSuggestionsDesc}
      </p>

      {/* Filter and Search Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 pb-1">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
              filterType === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t.devTagTypeAll}
          </button>
          <button
            type="button"
            onClick={() => setFilterType("products")}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
              filterType === "products" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            {t.devTagTypeProducts}
          </button>
          <button
            type="button"
            onClick={() => setFilterType("combos")}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
              filterType === "combos" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            {t.devTagTypeCombos}
          </button>
        </div>

        <div className="relative">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:border-red-500 focus-within:bg-white transition">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder={t.devSuggestionsSearchPlaceholder}
              className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setIsDropdownOpen(false);
                }}
                className="p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Results Dropdown */}
          {isDropdownOpen && searchTerm.trim().length > 0 && (
            <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
              {filteredCandidates.length === 0 ? (
                <div className="p-3 text-center text-[11px] text-slate-400">
                  {lang === "es" ? "No se encontraron coincidencias" : "No matches found"}
                </div>
              ) : (
                filteredCandidates.map((cand) => (
                  <button
                    key={`${cand.type}-${cand.id}`}
                    type="button"
                    onClick={() => handleAdd(cand)}
                    className="w-full p-2 text-left hover:bg-red-50/70 flex items-center justify-between gap-2.5 transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                        <img src={cand.imageUrl} alt="" className="max-h-full max-w-full object-contain" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[8px] font-black uppercase tracking-wider px-1 py-0.2 rounded ${
                              cand.type === "product"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-amber-50 text-amber-800 border border-amber-300"
                            }`}
                          >
                            {cand.type === "product" ? "Prod" : "Combo"}
                          </span>
                          <span className="text-xs font-bold text-slate-800 truncate block">
                            {cand.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {formatCRC(cand.priceCRC)}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#C02030] bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-lg flex items-center gap-0.5 shrink-0">
                      <Plus className="w-3 h-3" />
                      <span>{lang === "es" ? "Taggear" : "Tag"}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Minimalistic Tagged Chips */}
      <div>
        {totalCount === 0 ? (
          <p className="text-[11px] text-slate-400 italic">
            {t.devNoSuggestionsTagged}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 pt-0.5">
            {/* Tagged Products */}
            {suggestedProductIds.map((pId) => {
              const prod = allProducts.find((p) => p.id === pId || p.sku === pId || p.slug === pId);
              return (
                <div
                  key={`prod-${pId}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-slate-800 shadow-2xs group"
                >
                  <span className="text-[8px] font-black uppercase tracking-wider text-blue-700 bg-blue-100/80 px-1 py-0.2 rounded font-mono">
                    Prod
                  </span>
                  <span className="font-semibold text-slate-800 max-w-[170px] truncate" title={lang === "es" ? (prod?.nameEs || prod?.p_title || pId) : (prod?.nameEn || prod?.nameEs || prod?.p_title || pId)}>
                    {lang === "es" ? (prod?.nameEs || prod?.p_title || pId) : (prod?.nameEn || prod?.nameEs || prod?.p_title || pId)}
                  </span>
                  {prod && (
                    <span className="text-[10px] text-blue-700 font-mono font-bold">
                      {formatCRC(prod.priceCRC || prod.price?.T_price || 0)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(pId)}
                    className="p-0.5 text-blue-400 hover:text-red-600 hover:bg-white rounded-md transition"
                    title={lang === "es" ? "Remover sugerencia" : "Remove suggestion"}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

            {/* Tagged Combos */}
            {suggestedComboIds.map((cId) => {
              const combo = allCombos.find((c) => c.id === cId || c.slug === cId);
              return (
                <div
                  key={`combo-${cId}`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-slate-800 shadow-2xs group"
                >
                  <span className="text-[8px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 px-1 py-0.2 rounded font-mono">
                    Combo
                  </span>
                  <span className="font-semibold text-slate-800 max-w-[170px] truncate" title={lang === "es" ? (combo?.titleEs || combo?.titleEn || cId) : (combo?.titleEn || combo?.titleEs || cId)}>
                    {lang === "es" ? (combo?.titleEs || combo?.titleEn || cId) : (combo?.titleEn || combo?.titleEs || cId)}
                  </span>
                  {combo && (
                    <span className="text-[10px] text-amber-800 font-mono font-bold">
                      {formatCRC(combo.priceCRC || 0)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveCombo(cId)}
                    className="p-0.5 text-amber-400 hover:text-red-600 hover:bg-white rounded-md transition"
                    title={lang === "es" ? "Remover sugerencia" : "Remove suggestion"}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function CatalogManagerTab({ userRole }: { userRole: "MASTER" | "STAFF" }) {
  const { lang, t } = useLanguage();
  const isMaster = userRole === "MASTER";

  const [activeCatalogType, setActiveCatalogType] = useState<"products" | "combos">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Product Edit View (Full Store Screen layout with Faded Red Background)
  const [isEditingProductView, setIsEditingProductView] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Comprehensive Product Form (Shows ALL product information matching the exact JSON structure)
  const [productForm, setProductForm] = useState({
    sku: "",
    slug: "",
    p_title: "",
    nameEs: "",
    nameEn: "",
    brandName: "",
    category: "",
    selectedCategories: [] as string[],
    voidsWarranty: false,
    relatedProductIds: [] as string[],
    suggestedProductIds: [] as string[],
    suggestedComboIds: [] as string[],
    compText: "",
    warrantyCategory: "BOLT_ON_ELECTRICAL",
    stockStatus: "IN_STOCK_US",
    featured: true,
    inHome_install: true,
    homeInstallationAvailable: true,
    requirements: "",
    reviews: "",
    // price hierarchy:
    P_price_D: 0,
    S_price_D: 0,
    P_price: 0,
    S_price: 0,
    I_price_includes: true,
    I_price: 0,
    profit: 0,
    ivaPercent: 13,
    ivaCRC: 0,
    T_price: 0,
    T_price_D: "calculate in checkout with the selling value of dolar to colones",
    priceCRC: 0,
    originalPriceCRC: 0,
    discountPercent: 0,
    installationPriceCRC: 0,
    installLabourCostCRC: 0,
    installProfitCRC: 0,
    installationDurationMinutes: 60,
    installExtraParts: [] as InstallExtraPart[],
    isInstallationIncluded: true,
    // multimedia:
    imageUrl: "",
    imgsText: "",
    vidsText: "",
    audiosText: "",
    audioUrl: "",
    videoUrl: "",
    // descriptions:
    descriptionEs: "",
    descriptionEn: "",
    // year range (replaces bulky matrix):
    yearFrom: 2022 as number | string,
    yearTo: 2026 as number | string,
    // compatibility matrix fallback:
    modelYearCompatibilityText: "",
    // US Supplier integration:
    supplierUrl: "",
    supplierPlatform: "SHOPIFY",
    supplierStockStatus: "IN_STOCK",
    supplierStockCount: "" as number | string,
    supplierLeadDaysMin: 7 as number | string,
    supplierLeadDaysMax: 12 as number | string,
    supplierLastPriceUSD: "" as number | string,
    supplierStockCheckedAt: "",
    parameters: [] as ConfigurableParameter[],
  });

  const [testingSupplier, setTestingSupplier] = useState(false);
  const [supplierTestResult, setSupplierTestResult] = useState<any>(null);

  // Related products search in product editor
  const [relatedProductSearch, setRelatedProductSearch] = useState("");
  const [isRelatedSearchDropdownOpen, setIsRelatedSearchDropdownOpen] = useState(false);

  // Active description tab in editor
  const [activeDescTab, setActiveDescTab] = useState<"es" | "en">("es");

  // Combo Modal & Full Screen View states (User Requirement)
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [isEditingComboView, setIsEditingComboView] = useState(false);
  const [editingCombo, setEditingCombo] = useState<Combo | null>(null);
  const [comboSelectedProducts, setComboSelectedProducts] = useState<any[]>([]);
  const [comboProductSearch, setComboProductSearch] = useState("");
  const [isComboSearchDropdownOpen, setIsComboSearchDropdownOpen] = useState(false);
  const [comboForm, setComboForm] = useState({
    slug: "",
    category: "performance",
    titleEs: "",
    titleEn: "",
    badgeEs: "COMBO ESPECIAL",
    badgeEn: "SPECIAL COMBO",
    descriptionEs: "",
    descriptionEn: "",
    priceCRC: 0,
    originalPriceCRC: 0,
    installationPriceCRC: 0,
    installLabourCostCRC: 0,
    installProfitCRC: 0,
    installationDurationMinutes: 60,
    installExtraParts: [] as InstallExtraPart[],
    discountPercent: 10,
    itemsText: "",
    imageUrl: "/images/sxs/z10_front.png",
    imgsText: "",
    featured: true,
    homeInstallationAvailable: true,
    parameters: [] as ConfigurableParameter[],
    suggestedProductIds: [] as string[],
    suggestedComboIds: [] as string[],
    uniqueProduct: {
      enabled: false,
      titleEs: "",
      titleEn: "",
      badgeEs: "SERVICIO EXCLUSIVO DE AJUSTE",
      badgeEn: "EXCLUSIVE TUNING SERVICE",
      descriptionEs: "",
      descriptionEn: "",
      priceCRC: 0,
      imageUrl: "",
      fields: [] as ComboUniqueProductField[],
    } as ComboUniqueProduct,
  });

  // Quick Product Creation Modal State (inside Combo Editor)
  const [isQuickProductModalOpen, setIsQuickProductModalOpen] = useState(false);
  const [quickProductNameEs, setQuickProductNameEs] = useState("");
  const [quickProductNameEn, setQuickProductNameEn] = useState("");
  const [quickProductSku, setQuickProductSku] = useState("");
  const [quickProductPriceCRC, setQuickProductPriceCRC] = useState<number>(0);
  const [quickProductCategory, setQuickProductCategory] = useState<string>("suspension");
  const [creatingQuickProduct, setCreatingQuickProduct] = useState(false);
  const [quickProductError, setQuickProductError] = useState<string | null>(null);

  // Unique Product Custom Field Addition State
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [newFieldNameEs, setNewFieldNameEs] = useState("");
  const [newFieldNameEn, setNewFieldNameEn] = useState("");
  const [newFieldType, setNewFieldType] = useState<"text" | "number" | "select">("select");
  const [newFieldOptionsRaw, setNewFieldOptionsRaw] = useState("");
  const [newFieldRequired, setNewFieldRequired] = useState(true);
  const [newFieldPlaceholderEs, setNewFieldPlaceholderEs] = useState("");

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingMediaType, setUploadingMediaType] = useState<"image" | "video" | "audio" | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Product archiving filter & elimination states
  const [productFilterStatus, setProductFilterStatus] = useState<"all" | "active" | "archived">("all");
  const [eliminateModalProduct, setEliminateModalProduct] = useState<Product | null>(null);
  const [eliminateMasterPassword, setEliminateMasterPassword] = useState("");
  const [eliminatingProduct, setEliminatingProduct] = useState(false);
  const [eliminateError, setEliminateError] = useState<string | null>(null);

  // Combo archiving filter & elimination states
  const [comboFilterStatus, setComboFilterStatus] = useState<"all" | "active" | "archived">("all");
  const [eliminateModalCombo, setEliminateModalCombo] = useState<Combo | null>(null);
  const [eliminateComboMasterPassword, setEliminateComboMasterPassword] = useState("");
  const [eliminatingCombo, setEliminatingCombo] = useState(false);
  const [eliminateComboError, setEliminateComboError] = useState<string | null>(null);

  // Backdoor Catalog Separated Parameter Filtering (Category, Vehicle Brand, Distributor Brand, In Stock, Discounted)
  const [backdoorCategory, setBackdoorCategory] = useState<string>("all");
  const [backdoorVehicleBrand, setBackdoorVehicleBrand] = useState<string>("all");
  const [backdoorDistributorBrand, setBackdoorDistributorBrand] = useState<string>("all");
  const [backdoorInStockOnly, setBackdoorInStockOnly] = useState<boolean>(false);
  const [backdoorDiscountedOnly, setBackdoorDiscountedOnly] = useState<boolean>(false);

  // Unsaved changes warning state (User Requirement)
  const [initialFormSnapshot, setInitialFormSnapshot] = useState<string>("");
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState<boolean>(false);

  // Categories & Registered Brands/Models State
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [dealerBrands, setDealerBrands] = useState<any[]>([]);

  // Dealer Brands (RPM, EVP, Bikeman, etc.) strictly separated from Vehicle Brands
  const registeredDealerBrands = useMemo(() => {
    const set = new Set<string>();

    // 1. Dealer brands from the database (DealerBrand table)
    dealerBrands.forEach((db: any) => {
      if (db.name && !isVehicleBrand(db.name)) {
        set.add(db.name.trim());
      }
    });

    // 2. Existing brands from products (strictly excluding vehicle brands)
    products.forEach((p: any) => {
      if (p.brandName && !isVehicleBrand(p.brandName)) {
        set.add(p.brandName.trim());
      }
      if (Array.isArray(p.brand)) {
        p.brand.forEach((b: string) => {
          if (b && typeof b === "string" && !isVehicleBrand(b)) {
            set.add(b.trim());
          }
        });
      }
    });

    // 3. Known popular aftermarket dealer brands if not yet registered
    const standardDealerBrands = [
      "Bikeman Performance",
      "RPM Powersports",
      "EVP",
      "DRT Motorsports",
      "Shock Therapy",
      "GGB Exhaust",
      "Team MSC",
      "RNG Performance",
      "Elektric Offroad Designs",
      "Dynojet",
      "Agency Power",
      "Trinity Racing",
    ];
    standardDealerBrands.forEach((b) => set.add(b));

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [dealerBrands, products]);

  const registeredBrandSuggestions = registeredDealerBrands;

  // Only vehicle brands that have registered models in the database/backdoor
  const registeredVehicleBrands = useMemo(() => {
    return (brands || [])
      .filter((b: any) => Array.isArray(b.models) && b.models.length > 0)
      .map((b: any) => ({
        ...b,
        models: b.models.filter((m: any) => Boolean(m && m.slug)),
      }))
      .filter((b: any) => b.models.length > 0);
  }, [brands]);

  // Compatible Vehicles Multi-Selector State (User Requirement)
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);

  // Add Category Modal States (User Requirement: first letter always caps)
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [categoryModalTarget, setCategoryModalTarget] = useState<"product" | "combo" | "quick_product">("product");
  const [newCategoryNameEs, setNewCategoryNameEs] = useState("");
  const [newCategoryNameEn, setNewCategoryNameEn] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryModalError, setCategoryModalError] = useState<string | null>(null);

  // Automatic SKU generation state and helpers
  const [isSkuManuallyEdited, setIsSkuManuallyEdited] = useState(false);

  const updateAutoSkuIfApplicable = useCallback((newBrand?: string, newVehicles?: string[]) => {
    if (editingProduct || isSkuManuallyEdited) return;
    const b = newBrand !== undefined ? newBrand : productForm.brandName;
    const v = newVehicles !== undefined ? newVehicles : selectedVehicles;
    if (!b || !b.trim()) return;
    const newSku = computeAutoProductSku({
      dealerBrandName: b,
      selectedVehicles: v,
      existingProducts: products,
      dealerBrands,
      vehicleBrands: brands,
    });
    if (newSku) {
      setProductForm((prev) => ({
        ...prev,
        sku: newSku,
        slug: !prev.slug || prev.slug === prev.sku.toLowerCase() ? newSku.toLowerCase() : prev.slug,
      }));
    }
  }, [editingProduct, isSkuManuallyEdited, productForm.brandName, selectedVehicles, products, dealerBrands, brands]);

  const handleForceGenerateSku = useCallback(() => {
    if (!productForm.brandName.trim()) {
      setFeedback({
        type: "error",
        msg: lang === "es" ? "Por favor selecciona o ingresa una marca distribuidora primero" : "Please select a dealer brand first",
      });
      return;
    }
    const generated = computeAutoProductSku({
      dealerBrandName: productForm.brandName,
      selectedVehicles,
      existingProducts: products,
      dealerBrands,
      vehicleBrands: brands,
      currentProductId: editingProduct?.id,
    });
    if (generated) {
      setProductForm((prev) => ({
        ...prev,
        sku: generated,
        slug: !prev.slug || prev.slug === prev.sku.toLowerCase() ? generated.toLowerCase() : prev.slug,
      }));
      setIsSkuManuallyEdited(false);
      setFeedback({
        type: "success",
        msg: lang === "es" ? `SKU generado: ${generated}` : `SKU generated: ${generated}`,
      });
    }
  }, [productForm.brandName, selectedVehicles, products, dealerBrands, brands, editingProduct?.id, lang]);

  const [liveExchangeRate, setLiveExchangeRate] = useState<number>(455.21);
  const [adjustingProductId, setAdjustingProductId] = useState<string | null>(null);

  const refreshLiveExchangeRate = useCallback(async (): Promise<number> => {
    try {
      const rateRes = await fetch("/api/exchange-rate", { cache: "no-store" });
      if (rateRes.ok) {
        const rateData = await rateRes.json().catch(() => null);
        const extractedRate = Number(rateData?.data?.rate || rateData?.rate || 0);
        if (extractedRate > 300) {
          setLiveExchangeRate(extractedRate);
          return extractedRate;
        }
      }
    } catch {}
    return liveExchangeRate > 300 ? liveExchangeRate : 455.21;
  }, [liveExchangeRate]);

  const fetchCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const [res, rateRes] = await Promise.all([
        fetch("/api/sys/catalog", { cache: "no-store" }),
        fetch("/api/exchange-rate", { cache: "no-store" }).catch(() => null),
      ]);
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts(data.products || []);
        setCombos(data.combos || []);
        setCategories(data.categories || []);
        setBrands(data.brands || []);
        setDealerBrands(data.dealerBrands || []);
        if (data.exchangeRate && Number(data.exchangeRate) > 300) {
          setLiveExchangeRate(Number(data.exchangeRate));
        }
      }
      if (rateRes && rateRes.ok) {
        const rateData = await rateRes.json().catch(() => null);
        const extractedRate = Number(rateData?.data?.rate || rateData?.rate || 0);
        if (extractedRate > 300) {
          setLiveExchangeRate(extractedRate);
        }
      }
    } catch (err) {
      console.error("Failed to fetch catalog:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const handleAdjustProductLockedPrice = useCallback(
    async (prod: Product) => {
      setAdjustingProductId(prod.id);
      setFeedback(null);
      try {
        const res = await fetch(`/api/sys/products/${prod.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recalculateLockedPrice: true,
            lockedExchangeRate: liveExchangeRate,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          await fetchCatalog();
          setFeedback({
            type: "success",
            msg:
              lang === "es"
                ? `Precio T_price de ${prod.sku} actualizado y bloqueado al tipo de cambio actual (₡${liveExchangeRate.toFixed(2)}).`
                : `T_price for ${prod.sku} updated and locked at current exchange rate (₡${liveExchangeRate.toFixed(2)}).`,
          });
        } else {
          setFeedback({
            type: "error",
            msg: data.error || (lang === "es" ? "No se pudo ajustar el precio" : "Could not adjust price"),
          });
        }
      } catch (err: any) {
        setFeedback({
          type: "error",
          msg: err?.message || (lang === "es" ? "Error al ajustar precio" : "Error adjusting price"),
        });
      } finally {
        setAdjustingProductId(null);
      }
    },
    [liveExchangeRate, fetchCatalog, lang]
  );

  const syncSupplierUrlPrice = useCallback(
    async (urlToTest: string, silent = false) => {
      const trimmed = (urlToTest || "").trim();
      if (!trimmed || !/^https?:\/\//i.test(trimmed)) return;
      setTestingSupplier(true);
      if (!silent) setSupplierTestResult(null);
      try {
        const [res, currentRate] = await Promise.all([
          fetch("/api/sys/catalog/supplier-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: trimmed,
              saveToProductId: editingProduct?.id,
            }),
          }),
          refreshLiveExchangeRate(),
        ]);
        const data = await res.json();
        if (data.success && data.result) {
          setSupplierTestResult(data.result);
          const fetchedPriceUSD = Number(data.result.supplierPriceUSD);
          const activeRate = currentRate > 300 ? currentRate : (liveExchangeRate || 455.21);
          setProductForm((prev) => {
            const hasValidUSD = Number.isFinite(fetchedPriceUSD) && fetchedPriceUSD > 0;
            const nextPPriceD = hasValidUSD ? Number(fetchedPriceUSD.toFixed(2)) : prev.P_price_D;
            const nextPPriceCRC = hasValidUSD
              ? Math.round(nextPPriceD * activeRate)
              : prev.P_price;
            const nextSPriceCRC = Number(prev.S_price_D) > 0
              ? Math.round(Number(prev.S_price_D) * activeRate)
              : prev.S_price;
            const ivaRate = prev.ivaPercent ?? 13;
            const nextIva = calculateIvaAmount(nextPPriceCRC, nextSPriceCRC, prev.profit, prev.I_price, prev.I_price_includes, prev.discountPercent, ivaRate);
            const nextTotal = recalculateTPrice(nextPPriceCRC, nextSPriceCRC, prev.profit, prev.I_price, prev.I_price_includes, prev.discountPercent, ivaRate);
            return {
              ...prev,
              supplierUrl: trimmed,
              supplierPlatform: data.result.platform || prev.supplierPlatform,
              supplierStockStatus: data.result.status || prev.supplierStockStatus,
              supplierStockCount: data.result.stockCount ?? prev.supplierStockCount,
              supplierLeadDaysMin: data.result.leadDaysMin || prev.supplierLeadDaysMin,
              supplierLeadDaysMax: data.result.leadDaysMax || prev.supplierLeadDaysMax,
              supplierLastPriceUSD: hasValidUSD ? nextPPriceD : (data.result.supplierPriceUSD ?? prev.supplierLastPriceUSD),
              P_price_D: nextPPriceD,
              P_price: nextPPriceCRC,
              S_price: nextSPriceCRC,
              ivaCRC: nextIva,
              priceCRC: nextTotal,
              T_price: nextTotal,
              supplierStockCheckedAt: data.result.checkedAt || new Date().toISOString(),
            };
          });
          if (!silent) {
            const priceLabel =
              Number.isFinite(fetchedPriceUSD) && fetchedPriceUSD > 0
                ? ` — P_price_D actualizado a $${fetchedPriceUSD.toFixed(2)} USD (₡${Math.round(fetchedPriceUSD * activeRate).toLocaleString()} @ ₡${activeRate.toFixed(2)})`
                : "";
            setFeedback({
              type: "success",
              msg:
                lang === "es"
                  ? `Enlace verificado con éxito: Estado [${data.result.status}] - Plataforma [${data.result.platform}]${priceLabel}.`
                  : `Supplier link verified: Status [${data.result.status}] - Platform [${data.result.platform}]${
                      Number.isFinite(fetchedPriceUSD) && fetchedPriceUSD > 0
                        ? ` — P_price_D auto-updated to $${fetchedPriceUSD.toFixed(2)} USD (₡${Math.round(fetchedPriceUSD * activeRate).toLocaleString()} @ ₡${activeRate.toFixed(2)})`
                        : ""
                    }.`,
            });
          }
        } else if (!silent) {
          setFeedback({
            type: "error",
            msg:
              data.error ||
              (lang === "es"
                ? "No se pudo verificar el enlace del proveedor"
                : "Could not verify supplier link"),
          });
        }
      } catch (err: any) {
        if (!silent) {
          setFeedback({
            type: "error",
            msg:
              err?.message ||
              (lang === "es"
                ? "Error al conectar con el proveedor"
                : "Error connecting to supplier"),
          });
        }
      } finally {
        setTestingSupplier(false);
      }
    },
    [editingProduct?.id, liveExchangeRate, refreshLiveExchangeRate, lang]
  );

  // OPEN EDIT PRODUCT: Populates ALL information of the product matching JSON structure
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setValidationErrors([]);
    refreshLiveExchangeRate();

    // 1. Compatibility matrix formatting
    let modelYearFormatted = "";
    const fitments = prod.year_compatability || prod.modelYearCompatibility;
    if (Array.isArray(fitments) && fitments.length > 0) {
      modelYearFormatted = fitments
        .map(
          (m) =>
            `${m.make || "CFMOTO"} | ${m.model || ""} | ${m.years || "2024 - 2027"} | ${
              m.yearFrom || ""
            } | ${m.yearTo || ""} | ${m.trim || ""} | ${m.fitmentType || ""} | ${m.notes || ""}`
        )
        .join("\n");
    } else if (prod.modelYearCompatibilityJson) {
      try {
        const parsed = JSON.parse(prod.modelYearCompatibilityJson);
        if (Array.isArray(parsed)) {
          modelYearFormatted = parsed
            .map(
              (m) =>
                `${m.make || "CFMOTO"} | ${m.model || ""} | ${m.years || "2024 - 2027"} | ${
                  m.yearFrom || ""
                } | ${m.yearTo || ""}`
            )
            .join("\n");
        }
      } catch {
        modelYearFormatted = prod.modelYearCompatibilityJson;
      }
    } else if (prod.compatibilities && prod.compatibilities.length > 0) {
      modelYearFormatted = prod.compatibilities
        .map((c) => `${c.brandSlug.toUpperCase()} | ${c.modelSlug} | ${c.yearFrom} - ${c.yearTo}`)
        .join("\n");
    }

    // 2. Images
    const imgsList = Array.isArray(prod.imgs) && prod.imgs.length > 0
      ? prod.imgs
      : prod.imageUrl ? [prod.imageUrl] : [];
    const imgsText = imgsList.join("\n");

    // 3. Videos
    const vidsList = Array.isArray(prod.vids) && prod.vids.length > 0
      ? prod.vids
      : prod.videoUrl ? [prod.videoUrl] : [];
    const vidsText = vidsList.join("\n");

    // 4. Audios
    const rawAudiosList = Array.isArray(prod.audios) && prod.audios.length > 0
      ? prod.audios
      : prod.audioUrl ? [prod.audioUrl] : [];
    const audiosList = rawAudiosList.map(normalizeAudioUrl).filter(Boolean);
    const audiosText = audiosList.join("\n");

    // 5. Comp & Category & Brand
    const compText = Array.isArray(prod.comp) ? prod.comp.join(", ") : (typeof prod.comp === "string" ? prod.comp : "");
    let initialCategories: string[] = [];
    if (Array.isArray(prod.category)) {
      initialCategories = prod.category.filter(Boolean);
    } else if (typeof prod.category === "string" && prod.category) {
      initialCategories = [prod.category];
    }
    if (initialCategories.length === 0) {
      initialCategories = ["performance"];
    }
    const categoryText = initialCategories[0] || "performance";
    const brandText = Array.isArray(prod.brand) ? prod.brand.join(", ") : (prod.brandName || "Bikeman Performance");

    // Extract compatible vehicles array
    let initialVehicles: string[] = [];
    if (Array.isArray(prod.comp) && prod.comp.length > 0) {
      initialVehicles = prod.comp.map((v) => {
        if (v === "z10") return "zforce-z10";
        if (v === "z10-4") return "zforce-z10-4";
        return v;
      });
    } else if (compText) {
      initialVehicles = compText
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .map((v) => {
          if (v === "z10") return "zforce-z10";
          if (v === "z10-4") return "zforce-z10-4";
          return v;
        });
    }
    if (initialVehicles.length === 0) {
      initialVehicles = ["zforce-z10"];
    }
    setSelectedVehicles(initialVehicles);

    // 6. Descriptions
    const descEs = extractAndCleanDescription(prod.description, "es", prod.descriptionEs);
    const descEn = extractAndCleanDescription(prod.description, "en", prod.descriptionEn);

    // 7. Price hierarchy (P_price_D and S_price_D in USD, translated to Colones at liveExchangeRate when editing/saving)
    const activeRate = liveExchangeRate > 300 ? liveExchangeRate : 455.21;
    const P_price_D = Number(prod.price?.P_price_D ?? prod.processingPriceD ?? 0);
    const rawSPriceCRC = Number(prod.price?.S_price ?? prod.shippingPriceCRC ?? 0);
    const S_price_D = resolveShippingUSD(prod.shippingPriceD ?? prod.price?.S_price_D, rawSPriceCRC);
    const P_price = P_price_D > 0 ? Math.round(P_price_D * activeRate) : (prod.price?.P_price ?? prod.processingPriceCRC ?? 0);
    const S_price = S_price_D > 0 ? Math.round(S_price_D * activeRate) : rawSPriceCRC;
    const I_price_includes = prod.price?.I_price?.includes ?? prod.isInstallationIncluded ?? true;

    // Installation breakdown extraction
    let parsedExtraParts: InstallExtraPart[] = [];
    if (Array.isArray(prod.installExtraParts)) {
      parsedExtraParts = prod.installExtraParts;
    } else if (prod.installExtraPartsJson) {
      try {
        const parsed = JSON.parse(prod.installExtraPartsJson);
        if (Array.isArray(parsed)) parsedExtraParts = parsed;
      } catch {}
    }
    const extraPartsSum = parsedExtraParts.reduce((s, pt) => s + (Number(pt.priceCRC) || 0), 0);
    const rawIPrice = prod.price?.I_price?.I_price ?? prod.installationPriceCRC ?? 0;
    const labourCost = prod.installLabourCostCRC ?? (rawIPrice > 0 && extraPartsSum === 0 ? rawIPrice : 0);
    const installProfit = prod.installProfitCRC ?? 0;
    const computedTotalInstall = labourCost + extraPartsSum + installProfit;
    const I_price = computedTotalInstall > 0 ? computedTotalInstall : rawIPrice;
    const profit = prod.price?.profit ?? prod.profitCRC ?? 0;
    const ivaPercent = (prod as any).ivaPercent ?? 13;
    const discountPercent = (prod as any).discountPercent || 0;
    const computedIvaCRC = calculateIvaAmount(P_price, S_price, profit, I_price, I_price_includes, discountPercent, ivaPercent);
    const computedTPrice = recalculateTPrice(P_price, S_price, profit, I_price, I_price_includes, discountPercent, ivaPercent);
    const computedOriginalPrice = getProductOriginalPriceWithIVA(P_price, S_price, profit, I_price, I_price_includes, ivaPercent);
    const T_price = computedTPrice > 0 ? computedTPrice : (prod.price?.T_price ?? prod.priceCRC ?? 0);
    const T_price_D = String(prod.price?.T_price_D ?? prod.totalPriceD ?? "calculate in checkout with the selling value of dolar to colones");

    // 7. Year range extraction
    let yearFrom: number | string = 2022;
    let yearTo: number | string = 2026;
    if (Array.isArray(fitments) && fitments.length > 0) {
      const f = fitments[0];
      if (f.yearFrom) yearFrom = f.yearFrom;
      if (f.yearTo) yearTo = f.yearTo;
      else if (typeof f.years === "string") {
        const ym = f.years.match(/(\d{4})\s*-\s*(\d{4})/);
        if (ym) {
          yearFrom = ym[1];
          yearTo = ym[2];
        }
      }
    } else if (prod.compatibilities && prod.compatibilities.length > 0) {
      yearFrom = prod.compatibilities[0].yearFrom || 2022;
      yearTo = prod.compatibilities[0].yearTo || 2026;
    }

    const editInitialForm = {
      sku: prod.sku,
      slug: prod.slug,
      p_title: prod.p_title || prod.nameEs,
      nameEs: prod.nameEs,
      nameEn: prod.nameEn,
      brandName: brandText,
      category: categoryText,
      selectedCategories: initialCategories,
      voidsWarranty: Boolean(prod.voidsWarranty),
      relatedProductIds: (() => {
        if (Array.isArray(prod.relatedProductIds)) return prod.relatedProductIds;
        if (prod.relatedProductIdsJson) {
          try {
            const parsed = JSON.parse(prod.relatedProductIdsJson);
            if (Array.isArray(parsed)) return parsed;
          } catch {}
        }
        return [];
      })(),
      suggestedProductIds: (() => {
        if (Array.isArray(prod.suggestedProductIds)) return prod.suggestedProductIds;
        if (prod.suggestedProductIdsJson) {
          try {
            const parsed = JSON.parse(prod.suggestedProductIdsJson);
            if (Array.isArray(parsed)) return parsed;
          } catch {}
        }
        return [];
      })(),
      suggestedComboIds: (() => {
        if (Array.isArray(prod.suggestedComboIds)) return prod.suggestedComboIds;
        if (prod.suggestedComboIdsJson) {
          try {
            const parsed = JSON.parse(prod.suggestedComboIdsJson);
            if (Array.isArray(parsed)) return parsed;
          } catch {}
        }
        return [];
      })(),
      compText,
      warrantyCategory: prod.warrantyCategory || "BOLT_ON_ELECTRICAL",
      stockStatus: prod.stockStatus || "IN_STOCK_US",
      featured: prod.featured ?? true,
      inHome_install: prod.inHome_install ?? prod.homeInstallation ?? prod.homeInstallationAvailable ?? true,
      homeInstallationAvailable: prod.homeInstallationAvailable ?? true,
      requirements: prod.requirements || "",
      reviews: typeof prod.reviews === "string" ? prod.reviews : JSON.stringify(prod.reviews || ""),
      P_price_D,
      S_price_D,
      P_price,
      S_price,
      I_price_includes,
      I_price,
      profit,
      ivaPercent,
      ivaCRC: computedIvaCRC,
      T_price,
      T_price_D,
      imageUrl: imgsList[0] || prod.imageUrl || "",
      imgsText,
      vidsText,
      audiosText,
      audioUrl: prod.audioUrl || "",
      videoUrl: prod.videoUrl || "",
      priceCRC: T_price,
      originalPriceCRC: computedOriginalPrice > 0 ? computedOriginalPrice : ((prod as any).originalPriceCRC || T_price),
      discountPercent,
      installationPriceCRC: I_price,
      installLabourCostCRC: labourCost,
      installProfitCRC: installProfit,
      installationDurationMinutes: (prod as any).installationDurationMinutes ?? 60,
      installExtraParts: parsedExtraParts,
      isInstallationIncluded: prod.isInstallationIncluded ?? I_price_includes,
      descriptionEs: descEs,
      descriptionEn: descEn,
      yearFrom,
      yearTo,
      modelYearCompatibilityText: modelYearFormatted,
      supplierUrl: prod.supplierUrl || "",
      supplierPlatform: prod.supplierPlatform || "SHOPIFY",
      supplierStockStatus: prod.supplierStockStatus || "IN_STOCK",
      supplierStockCount: prod.supplierStockCount !== null && prod.supplierStockCount !== undefined ? prod.supplierStockCount : "",
      supplierLeadDaysMin: prod.supplierLeadDaysMin || 7,
      supplierLeadDaysMax: prod.supplierLeadDaysMax || 12,
      supplierLastPriceUSD: prod.supplierLastPriceUSD !== null && prod.supplierLastPriceUSD !== undefined ? prod.supplierLastPriceUSD : "",
      supplierStockCheckedAt: prod.supplierStockCheckedAt ? new Date(prod.supplierStockCheckedAt).toISOString() : "",
      parameters: (() => {
        if (Array.isArray(prod.parameters)) return prod.parameters;
        if (prod.parametersJson) {
          try {
            const p = JSON.parse(prod.parametersJson);
            if (Array.isArray(p)) return p;
          } catch {}
        }
        return [];
      })(),
    };

    setProductForm(editInitialForm);
    setSupplierTestResult(null);
    setRelatedProductSearch("");
    setIsRelatedSearchDropdownOpen(false);
    setInitialFormSnapshot(JSON.stringify({ ...editInitialForm, selectedVehicles: initialVehicles }));
    setIsSkuManuallyEdited(true);
    setIsEditingProductView(true);
    setFeedback(null);
  };

  // OPEN CREATE PRODUCT: LEAVE EVERYTHING READY FOR INPUT
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setValidationErrors([]);
    setIsSkuManuallyEdited(false);
    refreshLiveExchangeRate();
    const defaultCat = categories.length > 0 ? categories[0].slug : "performance";
    const defaultVehicle = registeredVehicleBrands[0]?.models?.[0]?.slug || "zforce-z10";
    const initialCreateVehicles = [defaultVehicle];
    setSelectedVehicles(initialCreateVehicles);

    const createInitialForm = {
      sku: "",
      slug: "",
      p_title: "",
      nameEs: "",
      nameEn: "",
      brandName: "",
      category: defaultCat,
      selectedCategories: [defaultCat],
      voidsWarranty: false,
      relatedProductIds: [] as string[],
      compText: "",
      warrantyCategory: "BOLT_ON_ELECTRICAL",
      stockStatus: "IN_STOCK_US",
      featured: false,
      inHome_install: false,
      homeInstallationAvailable: false,
      requirements: "",
      reviews: "",
      P_price_D: 0,
      S_price_D: 0,
      P_price: 0,
      S_price: 0,
      I_price_includes: false,
      I_price: 0,
      profit: 0,
      ivaPercent: 13,
      ivaCRC: 0,
      T_price: 0,
      T_price_D: "calculate in checkout with the selling value of dolar to colones",
      imageUrl: "",
      imgsText: "",
      vidsText: "",
      audiosText: "",
      audioUrl: "",
      videoUrl: "",
      priceCRC: 0,
      originalPriceCRC: 0,
      discountPercent: 0,
      installationPriceCRC: 0,
      installLabourCostCRC: 0,
      installProfitCRC: 0,
      installationDurationMinutes: 60,
      installExtraParts: [] as InstallExtraPart[],
      isInstallationIncluded: true,
      descriptionEs: "",
      descriptionEn: "",
      yearFrom: 2022,
      yearTo: 2026,
      modelYearCompatibilityText: "",
      supplierUrl: "",
      supplierPlatform: "SHOPIFY",
      supplierStockStatus: "IN_STOCK",
      supplierStockCount: "",
      supplierLeadDaysMin: 7,
      supplierLeadDaysMax: 12,
      supplierLastPriceUSD: "",
      supplierStockCheckedAt: "",
      parameters: [] as ConfigurableParameter[],
    suggestedProductIds: [] as string[],
    suggestedComboIds: [] as string[],
    };
    setProductForm(createInitialForm);
    setSupplierTestResult(null);
    setInitialFormSnapshot(JSON.stringify({ ...createInitialForm, category: defaultCat, selectedVehicles: initialCreateVehicles }));
    setIsEditingProductView(true);
    setFeedback(null);
  };

  // Track if current form has unsaved modifications
  const isFormDirty = Boolean(
    isEditingProductView &&
    initialFormSnapshot &&
    JSON.stringify({ ...productForm, selectedVehicles }) !== initialFormSnapshot
  );

  // Exit guard handler
  const handleRequestExitEditView = () => {
    if (isFormDirty) {
      setShowUnsavedChangesModal(true);
    } else {
      setIsEditingProductView(false);
    }
  };

  // Create new category handler (User Requirement: first letter always caps)
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryNameEs.trim()) {
      setCategoryModalError(
        lang === "es"
          ? "El nombre de la categoría es obligatorio."
          : "Category name is required."
      );
      return;
    }

    setCreatingCategory(true);
    setCategoryModalError(null);

    const cleanEs = newCategoryNameEs.trim();
    const formattedEs = cleanEs.charAt(0).toUpperCase() + cleanEs.slice(1);
    const cleanEn = newCategoryNameEn.trim();
    const formattedEn = cleanEn ? cleanEn.charAt(0).toUpperCase() + cleanEn.slice(1) : formattedEs;

    try {
      const res = await fetch("/api/sys/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameEs: formattedEs,
          nameEn: formattedEn,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.category) {
        setCategories((prev) => {
          if (prev.some((c) => c.id === data.category.id || c.slug === data.category.slug)) {
            return prev;
          }
          return [...prev, data.category];
        });

        // Automatically select and append the new category based on active target context
        if (categoryModalTarget === "combo") {
          setComboForm((prev) => ({
            ...prev,
            category: data.category.slug,
          }));
        } else if (categoryModalTarget === "quick_product") {
          setQuickProductCategory(data.category.slug);
        } else {
          setProductForm((prev) => ({
            ...prev,
            category: data.category.slug,
            selectedCategories: prev.selectedCategories?.includes(data.category.slug)
              ? prev.selectedCategories
              : [...(prev.selectedCategories || []), data.category.slug],
          }));
        }

        setIsAddCategoryModalOpen(false);
        setNewCategoryNameEs("");
        setNewCategoryNameEn("");
        setFeedback({
          type: "success",
          msg:
            lang === "es"
              ? `Categoría "${data.category.nameEs}" creada y asignada exitosamente.`
              : `Category "${data.category.nameEn}" created and assigned successfully.`,
        });
      } else {
        setCategoryModalError(
          data.error ||
            (lang === "es"
              ? "Error al crear la categoría."
              : "Failed to create category.")
        );
      }
    } catch (err) {
      console.error("Error creating category:", err);
      setCategoryModalError(
        lang === "es"
          ? "Error de conexión al crear la categoría."
          : "Network error creating category."
      );
    } finally {
      setCreatingCategory(false);
    }
  };

  // Window beforeunload warning hook
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditingProductView && isFormDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isEditingProductView, isFormDirty]);

  // BASE CALCULATED PRICE (P_price + S_price + profit + (includes ? I_price : 0))
  const getProductBasePrice = (
    pCRC: number,
    sCRC: number,
    profCRC: number,
    iPriceCRC: number,
    includes: boolean
  ) => {
    const p = Math.round(Number(pCRC) || 0);
    const s = Math.round(Number(sCRC) || 0);
    const prof = Math.round(Number(profCRC) || 0);
    const inst = includes ? Math.round(Number(iPriceCRC) || 0) : 0;
    return p + s + prof + inst;
  };

  // CALCULATE IVA AMOUNT IN CRC (Default 13% on discounted subtotal)
  const calculateIvaAmount = (
    pCRC: number,
    sCRC: number,
    profCRC: number,
    iPriceCRC: number,
    includes: boolean,
    discountPct: number = 0,
    ivaRate: number = 13
  ) => {
    const base = getProductBasePrice(pCRC, sCRC, profCRC, iPriceCRC, includes);
    const pct = Math.max(0, Math.min(100, Math.round(Number(discountPct) || 0)));
    const discounted = pct > 0 ? Math.round(base * (1 - pct / 100)) : base;
    const rate = Math.max(0, Number(ivaRate) || 0);
    return Math.round(discounted * (rate / 100));
  };

  // RECALCULATE T_PRICE IN REAL TIME: Subtotal after discount + 13% IVA = True Total Price (IVA Included)
  const recalculateTPrice = (
    pCRC: number,
    sCRC: number,
    profCRC: number,
    iPriceCRC: number,
    includes: boolean,
    discountPct: number = 0,
    ivaRate: number = 13
  ) => {
    const base = getProductBasePrice(pCRC, sCRC, profCRC, iPriceCRC, includes);
    const pct = Math.max(0, Math.min(100, Math.round(Number(discountPct) || 0)));
    const discounted = pct > 0 ? Math.round(base * (1 - pct / 100)) : base;
    const iva = calculateIvaAmount(pCRC, sCRC, profCRC, iPriceCRC, includes, discountPct, ivaRate);
    return discounted + iva;
  };

  // BASE ORIGINAL PRICE INCLUDING IVA (Base before discount + 13% IVA)
  const getProductOriginalPriceWithIVA = (
    pCRC: number,
    sCRC: number,
    profCRC: number,
    iPriceCRC: number,
    includes: boolean,
    ivaRate: number = 13
  ) => {
    const base = getProductBasePrice(pCRC, sCRC, profCRC, iPriceCRC, includes);
    const rate = Math.max(0, Number(ivaRate) || 0);
    return Math.round(base * (1 + rate / 100));
  };

  // AUTO CALCULATE TOTAL SELLING PRICE (T_price)
  const handleAutoCalculateTotal = () => {
    const total = recalculateTPrice(
      productForm.P_price,
      productForm.S_price,
      productForm.profit,
      productForm.I_price,
      productForm.I_price_includes,
      productForm.discountPercent,
      productForm.ivaPercent ?? 13
    );
    const ivaAmount = calculateIvaAmount(
      productForm.P_price,
      productForm.S_price,
      productForm.profit,
      productForm.I_price,
      productForm.I_price_includes,
      productForm.discountPercent,
      productForm.ivaPercent ?? 13
    );
    setProductForm((prev) => ({ ...prev, T_price: total, priceCRC: total, ivaCRC: ivaAmount }));
  };

  // Automatically sync productForm.P_price, productForm.S_price, productForm.T_price, productForm.priceCRC, and productForm.ivaCRC
  // whenever USD prices (P_price_D, S_price_D), liveExchangeRate, profit, installation, or IVA rate change
  useEffect(() => {
    const activeRate = liveExchangeRate > 300 ? liveExchangeRate : 455.21;
    const pPriceUSD = Number(productForm.P_price_D) || 0;
    const sPriceUSD = Number(productForm.S_price_D) || 0;

    const translatedPPrice = pPriceUSD > 0 ? Math.round(pPriceUSD * activeRate) : 0;
    const translatedSPrice = sPriceUSD > 0 ? Math.round(sPriceUSD * activeRate) : 0;

    const total = recalculateTPrice(
      translatedPPrice,
      translatedSPrice,
      productForm.profit,
      productForm.I_price,
      productForm.I_price_includes,
      productForm.discountPercent,
      productForm.ivaPercent ?? 13
    );
    const ivaAmount = calculateIvaAmount(
      translatedPPrice,
      translatedSPrice,
      productForm.profit,
      productForm.I_price,
      productForm.I_price_includes,
      productForm.discountPercent,
      productForm.ivaPercent ?? 13
    );
    if (
      productForm.P_price !== translatedPPrice ||
      productForm.S_price !== translatedSPrice ||
      productForm.T_price !== total ||
      productForm.ivaCRC !== ivaAmount ||
      productForm.priceCRC !== total
    ) {
      setProductForm((prev) => ({
        ...prev,
        P_price: translatedPPrice,
        S_price: translatedSPrice,
        T_price: total,
        priceCRC: total,
        ivaCRC: ivaAmount,
      }));
    }
  }, [
    productForm.P_price_D,
    productForm.S_price_D,
    productForm.P_price,
    productForm.S_price,
    productForm.profit,
    productForm.I_price,
    productForm.I_price_includes,
    productForm.discountPercent,
    productForm.ivaPercent,
    productForm.T_price,
    productForm.ivaCRC,
    productForm.priceCRC,
    liveExchangeRate,
  ]);

  // VALIDATION & SAVE PRODUCT
  const handleSaveProduct = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);
    setValidationErrors([]);

    // Check critical spots required for product upload (User Requirement)
    const missing: string[] = [];
    if (!productForm.sku.trim()) missing.push("SKU");
    if (!productForm.p_title.trim() && !productForm.nameEs.trim()) missing.push("Título (p_title / Español)");
    if (!productForm.nameEn.trim()) missing.push("Nombre en Inglés");
    if (!productForm.brandName.trim()) missing.push("Marca (brand)");
    const effectiveCategories = (productForm.selectedCategories && productForm.selectedCategories.length > 0)
      ? productForm.selectedCategories
      : (productForm.category ? [productForm.category] : []);
    if (effectiveCategories.length === 0) missing.push("Categorías (category)");
    if (productForm.T_price <= 0) missing.push("Precio Total (T_price > 0)");
    const effectiveStockStatus = productForm.stockStatus?.trim() || "IN_STOCK_US";
    const effectiveWarranty = productForm.warrantyCategory?.trim() || "BOLT_ON_ELECTRICAL";
    if (!productForm.imgsText.trim() && !productForm.imageUrl.trim()) missing.push("Imágenes (imgs)");
    if (!productForm.descriptionEs.trim()) missing.push("Descripción en Español");
    if (!productForm.descriptionEn.trim()) missing.push("Descripción en Inglés");

    if (missing.length > 0) {
      setValidationErrors(missing);
      setFeedback({
        type: "error",
        msg: `Faltan campos críticos obligatorios: ${missing.join(", ")}. Por favor complétalos para continuar.`,
      });
      setSaving(false);
      return;
    }

    const isEdit = Boolean(editingProduct);
    const url = isEdit ? `/api/sys/products/${editingProduct?.id}` : "/api/sys/products";
    const method = isEdit ? "PATCH" : "POST";

    // Auto-generate clean slug if not set
    const finalSlug =
      productForm.slug.trim() ||
      (productForm.nameEn || productForm.p_title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const parsedImgs = Array.from(
      new Set(
        productForm.imgsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );
    const trimmedPrimary = productForm.imageUrl.trim();
    const chosenPrimaryImage =
      parsedImgs.length > 0
        ? parsedImgs.includes(trimmedPrimary)
          ? trimmedPrimary
          : parsedImgs[0]
        : trimmedPrimary || "/images/logo.png";
    const orderedImgs =
      parsedImgs.length > 0
        ? [chosenPrimaryImage, ...parsedImgs.filter((u) => u !== chosenPrimaryImage)]
        : trimmedPrimary
        ? [trimmedPrimary]
        : [];

    const parsedVids = productForm.vidsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedAudios = productForm.audiosText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(normalizeAudioUrl);

    const effectiveVehicles = selectedVehicles.map((v) => v.trim()).filter(Boolean);
    const parsedComp = effectiveVehicles.length > 0 ? effectiveVehicles : ["all"];

    const primaryCategorySlug = effectiveCategories[0] || "performance";
    const selectedCat = categories.find(
      (c) =>
        c.slug === primaryCategorySlug ||
        c.id === primaryCategorySlug ||
        c.nameEs?.toLowerCase() === primaryCategorySlug?.toLowerCase()
    );
    const categorySlug = selectedCat ? selectedCat.slug : primaryCategorySlug.trim();
    const categoryId = selectedCat ? selectedCat.id : null;

    const parsedBrands = productForm.brandName
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const yFrom = Number(productForm.yearFrom) || 2022;
    const yTo = Number(productForm.yearTo) || 2026;

    const resolveVehicleBrandAndName = (slug: string) => {
      const s = slug.toLowerCase().trim();
      if (s === "all" || s.includes("universal")) {
        return { make: "Universal", brandSlug: "all", modelName: "Universal" };
      }
      for (const b of brands) {
        const found = (b.models || []).find((m: any) => m.slug?.toLowerCase() === s);
        if (found) {
          return { make: b.name, brandSlug: b.slug, modelName: found.name };
        }
      }
      if (s.includes("can-am") || s.includes("x3") || s === "can-amx3") {
        return { make: "CAN-AM", brandSlug: "can-am", modelName: "Can-Am Maverick X3" };
      }
      if (s.includes("z10") || s.includes("zforce") || s.includes("cfmoto")) {
        return { make: "CFMOTO", brandSlug: "cfmoto", modelName: s.includes("4") ? "ZForce Z10-4" : "ZForce Z10" };
      }
      if (s.includes("villain") || s.includes("segway")) {
        return { make: "Segway", brandSlug: "segway", modelName: "Villain SX10" };
      }
      return { make: "CFMOTO", brandSlug: "cfmoto", modelName: slug };
    };

    const parsedYearFitments = parsedComp.map((vehicleSlug) => {
      const resolved = resolveVehicleBrandAndName(vehicleSlug);
      return {
        make: resolved.make,
        model: vehicleSlug,
        years: `${yFrom} - ${yTo}`,
        yearFrom: yFrom,
        yearTo: yTo,
        trim: "Todas las versiones",
        fitmentType: "Direct Bolt-On",
        notes: "",
      };
    });

    const parsedCompatibilities = parsedComp
      .filter((v) => v !== "all" && !v.includes("universal"))
      .map((vehicleSlug) => {
        const resolved = resolveVehicleBrandAndName(vehicleSlug);
        return {
          brandSlug: resolved.brandSlug,
          modelSlug: vehicleSlug,
          yearFrom: yFrom,
          yearTo: yTo,
        };
      });

    // Recalculate true price with 13% IVA guaranteed
    const finalIvaRate = Math.max(0, Number(productForm.ivaPercent ?? 13));
    const finalIvaCRC = calculateIvaAmount(
      productForm.P_price,
      productForm.S_price,
      productForm.profit,
      productForm.I_price,
      productForm.I_price_includes,
      productForm.discountPercent,
      finalIvaRate
    );
    const finalTPrice = recalculateTPrice(
      productForm.P_price,
      productForm.S_price,
      productForm.profit,
      productForm.I_price,
      productForm.I_price_includes,
      productForm.discountPercent,
      finalIvaRate
    );
    const finalOriginalPrice = getProductOriginalPriceWithIVA(
      productForm.P_price,
      productForm.S_price,
      productForm.profit,
      productForm.I_price,
      productForm.I_price_includes,
      finalIvaRate
    );

    const payload = {
      sku: productForm.sku.trim(),
      slug: finalSlug,
      p_title: productForm.p_title.trim() || productForm.nameEs.trim(),
      nameEs: productForm.p_title.trim() || productForm.nameEs.trim(),
      nameEn: productForm.nameEn.trim(),
      brand: parsedBrands.length > 0 ? parsedBrands : [productForm.brandName.trim()],
      brandName: parsedBrands[0] || productForm.brandName.trim(),
      categoryId,
      category: effectiveCategories,
      categoryJson: JSON.stringify(effectiveCategories),
      comp: parsedComp,
      warrantyCategory: effectiveWarranty,
      stockStatus: effectiveStockStatus,
      featured: productForm.featured,
      inHome_install: productForm.inHome_install,
      homeInstallationAvailable: productForm.inHome_install,
      homeInstallation: productForm.inHome_install,
      requirements: productForm.requirements.trim() || null,
      reviews: productForm.reviews.trim() || "",
      // Full price hierarchy:
      price: {
        P_price_D: Number(productForm.P_price_D) || 0,
        S_price_D: Number(productForm.S_price_D) || 0,
        P_price: Math.round(Number(productForm.P_price) || 0),
        S_price: Math.round(Number(productForm.S_price) || 0),
        lockedExchangeRate: liveExchangeRate,
        I_price: {
          includes: Boolean(productForm.I_price_includes),
          I_price: Math.round(Number(productForm.I_price) || 0),
        },
        profit: Math.round(Number(productForm.profit) || 0),
        iva: {
          rate: finalIvaRate,
          amount: finalIvaCRC,
        },
        T_price: finalTPrice,
        T_price_D: productForm.T_price_D || "calculate in checkout with the selling value of dolar to colones",
        discountPercent: Math.max(0, Math.min(100, Math.round(Number(productForm.discountPercent) || 0))),
        originalPriceCRC: finalOriginalPrice,
      },
      // Database mapped fields:
      processingPriceD: Number(productForm.P_price_D) || 0,
      processingPriceCRC: Math.round(Number(productForm.P_price) || 0),
      shippingPriceD: Number(productForm.S_price_D) || 0,
      shippingPriceCRC: Math.round(Number(productForm.S_price) || 0),
      lockedExchangeRate: liveExchangeRate,
      profitCRC: Math.round(Number(productForm.profit) || 0),
      ivaPercent: finalIvaRate,
      ivaCRC: finalIvaCRC,
      priceCRC: finalTPrice,
      originalPriceCRC: finalOriginalPrice,
      discountPercent: Math.max(0, Math.min(100, Math.round(Number(productForm.discountPercent) || 0))),
      installationPriceCRC: Math.round(Number(productForm.I_price) || 0),
      installLabourCostCRC: Math.round(Number(productForm.installLabourCostCRC) || 0),
      installProfitCRC: Math.round(Number(productForm.installProfitCRC) || 0),
      installationDurationMinutes: Math.max(15, Math.round(Number(productForm.installationDurationMinutes) || 60)),
      installExtraParts: productForm.installExtraParts || [],
      installExtraPartsJson: JSON.stringify(productForm.installExtraParts || []),
      isInstallationIncluded: Boolean(productForm.I_price_includes),
      totalPriceD: productForm.T_price_D || "calculate in checkout with the selling value of dolar to colones",
      // Multimedia:
      imgs: orderedImgs,
      imageUrl: chosenPrimaryImage,
      vids: parsedVids,
      videoUrl: parsedVids[0] || "",
      audios: parsedAudios,
      audioUrl: parsedAudios[0] || "",
      // Descriptions:
      descriptionEs: cleanDescriptionText(productForm.descriptionEs),
      descriptionEn: cleanDescriptionText(productForm.descriptionEn),
      // Compatibility:
      year_compatability: parsedYearFitments,
      modelYearCompatibility: parsedYearFitments,
      modelYearCompatibilityJson: JSON.stringify(parsedYearFitments),
      compatibilities: parsedCompatibilities,
      // US Supplier fields:
      supplierUrl: productForm.supplierUrl.trim() || null,
      supplierPlatform: productForm.supplierPlatform || null,
      supplierStockStatus: productForm.supplierStockStatus || "IN_STOCK",
      supplierStockCount: productForm.supplierStockCount !== "" ? Number(productForm.supplierStockCount) : null,
      supplierLeadDaysMin: Number(productForm.supplierLeadDaysMin) || 7,
      supplierLeadDaysMax: Number(productForm.supplierLeadDaysMax) || 12,
      supplierLastPriceUSD: productForm.supplierLastPriceUSD !== "" ? Number(productForm.supplierLastPriceUSD) : null,
      supplierStockCheckedAt: productForm.supplierStockCheckedAt ? new Date(productForm.supplierStockCheckedAt).toISOString() : null,
      parameters: productForm.parameters,
      parametersJson: JSON.stringify(productForm.parameters || []),
      voidsWarranty: Boolean(productForm.voidsWarranty),
      relatedProductIds: productForm.relatedProductIds || [],
      relatedProductIdsJson: JSON.stringify(productForm.relatedProductIds || []),
      suggestedProductIds: productForm.suggestedProductIds || [],
      suggestedProductIdsJson: JSON.stringify(productForm.suggestedProductIds || []),
      suggestedComboIds: productForm.suggestedComboIds || [],
      suggestedComboIdsJson: JSON.stringify(productForm.suggestedComboIds || []),
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        await fetchCatalog();
        setInitialFormSnapshot(JSON.stringify({ ...productForm, selectedVehicles }));
        setIsEditingProductView(false);
        setFeedback({
          type: "success",
          msg: isEdit
            ? lang === "es"
              ? "¡Producto actualizado exitosamente en tienda!"
              : "Product updated successfully in store!"
            : lang === "es"
            ? "¡Nuevo producto creado exitosamente!"
            : "New product created successfully!",
        });
      } else {
        setFeedback({
          type: "error",
          msg: data.message || data.error || "Error al guardar el producto.",
        });
      }
    } catch (err) {
      console.error("Save product error:", err);
      setFeedback({
        type: "error",
        msg: "Error de conexión al guardar el producto.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleArchiveProduct = async (prod: Product) => {
    const isCurrentlyArchived = Boolean(prod.isArchived);
    const confirmPrompt = isCurrentlyArchived
      ? t.productUnarchiveConfirmPrompt
      : t.productArchiveConfirmPrompt;

    if (!confirm(confirmPrompt)) return;

    try {
      const res = await fetch(`/api/sys/products/${prod.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isCurrentlyArchived ? "unarchive" : "archive" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, isArchived: !isCurrentlyArchived } : p))
        );
        setFeedback({
          type: "success",
          msg: isCurrentlyArchived
            ? (lang === "es" ? "Producto reactivado en la tienda." : "Product reactivated in store.")
            : (lang === "es" ? "Producto archivado." : "Product archived."),
        });
      } else {
        setFeedback({
          type: "error",
          msg: data.error || (lang === "es" ? "Error al actualizar archivo." : "Error updating archive status."),
        });
      }
    } catch (err) {
      console.error("Archive toggle error:", err);
      setFeedback({
        type: "error",
        msg: lang === "es" ? "Error de conexión al archivar." : "Connection error while archiving.",
      });
    }
  };

  const handleOpenEliminateModal = (prod: Product) => {
    setEliminateModalProduct(prod);
    setEliminateMasterPassword("");
    setEliminateError(null);
  };

  const handleExecuteEliminateProduct = async () => {
    if (!eliminateModalProduct) return;
    if (!eliminateMasterPassword.trim()) {
      setEliminateError(
        lang === "es" ? "Por favor ingresa la contraseña Master." : "Please enter Master password."
      );
      return;
    }

    setEliminatingProduct(true);
    setEliminateError(null);

    try {
      const res = await fetch(`/api/sys/products/${eliminateModalProduct.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "eliminate", masterPassword: eliminateMasterPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== eliminateModalProduct.id));
        setEliminateModalProduct(null);
        setEliminateMasterPassword("");
        setFeedback({
          type: "success",
          msg: t.productEliminateSuccess,
        });
      } else {
        setEliminateError(
          data.error ||
            (lang === "es" ? "Contraseña incorrecta o error al eliminar." : "Incorrect password or error eliminating.")
        );
      }
    } catch (err) {
      console.error("Eliminate product error:", err);
      setEliminateError(
        lang === "es" ? "Error de conexión al eliminar producto." : "Network error eliminating product."
      );
    } finally {
      setEliminatingProduct(false);
    }
  };

  // Combo Actions (User Requirement: Dedicated Edit/Create Screen with Linked Included Products)
  const handleOpenEditCombo = (combo: Combo) => {
    setEditingCombo(combo);
    let parsedItems: any[] = [];
    try {
      parsedItems = JSON.parse(combo.itemsJson || "[]");
    } catch {
      parsedItems = [];
    }

    const matchedProducts: any[] = [];
    const manualItemsList: string[] = [];

    parsedItems.forEach((item) => {
      if (typeof item === "object" && item !== null) {
        const p = products.find((cp: Product) => cp.sku === item.sku || cp.id === item.id || cp.slug === item.slug);
        if (p) matchedProducts.push(p);
        else matchedProducts.push(item);
      } else if (typeof item === "string") {
        const itemStr = item.trim();
        const skuMatch = itemStr.match(/\[([A-Za-z0-9\-_]+)\]/);
        const extractedSku = skuMatch ? skuMatch[1] : null;

        const p = products.find(
          (cp: Product) =>
            (extractedSku && cp.sku?.toLowerCase() === extractedSku.toLowerCase()) ||
            cp.sku?.toLowerCase() === itemStr.toLowerCase() ||
            cp.nameEs?.toLowerCase() === itemStr.toLowerCase() ||
            cp.nameEn?.toLowerCase() === itemStr.toLowerCase()
        );
        if (p) {
          matchedProducts.push(p);
        } else {
          manualItemsList.push(itemStr);
        }
      }
    });

    const comboParams: ConfigurableParameter[] = (() => {
      if (Array.isArray(combo.parameters)) return combo.parameters;
      if (combo.parametersJson) {
        try {
          const p = JSON.parse(combo.parametersJson);
          if (Array.isArray(p)) return p;
        } catch {}
      }
      return [];
    })();

    let parsedComboExtraParts: InstallExtraPart[] = [];
    if (Array.isArray(combo.installExtraParts)) {
      parsedComboExtraParts = combo.installExtraParts;
    } else if (combo.installExtraPartsJson) {
      try {
        const parsed = JSON.parse(combo.installExtraPartsJson);
        if (Array.isArray(parsed)) parsedComboExtraParts = parsed;
      } catch {}
    }
    const comboExtraPartsSum = parsedComboExtraParts.reduce((s, pt) => s + (Number(pt.priceCRC) || 0), 0);
    const comboLabour = combo.installLabourCostCRC ?? (combo.installationPriceCRC > 0 && comboExtraPartsSum === 0 ? combo.installationPriceCRC : 0);
    const comboProfit = combo.installProfitCRC ?? 0;
    const computedComboInstall = comboLabour + comboExtraPartsSum + comboProfit;
    const effectiveComboInstall = computedComboInstall > 0 ? computedComboInstall : (combo.installationPriceCRC || 0);

    const parsedComboUniqueProduct: ComboUniqueProduct = (() => {
      if ((combo as any).uniqueProduct && typeof (combo as any).uniqueProduct === "object") {
        return (combo as any).uniqueProduct;
      }
      if ((combo as any).uniqueProductJson) {
        try {
          const u = JSON.parse((combo as any).uniqueProductJson);
          if (u && typeof u === "object") return u;
        } catch {}
      }
      return {
        enabled: false,
        titleEs: "",
        titleEn: "",
        badgeEs: "SERVICIO EXCLUSIVO DE AJUSTE",
        badgeEn: "EXCLUSIVE TUNING SERVICE",
        descriptionEs: "",
        descriptionEn: "",
        priceCRC: 0,
        imageUrl: "",
        fields: [],
      };
    })();

    setComboSelectedProducts(matchedProducts);
    setComboProductSearch("");
    setComboForm({
      slug: combo.slug,
      category: combo.category || "performance",
      titleEs: combo.titleEs,
      titleEn: combo.titleEn,
      badgeEs: combo.badgeEs || "COMBO ESPECIAL",
      badgeEn: combo.badgeEn || "SPECIAL COMBO",
      descriptionEs: extractAndCleanDescription((combo as any).description, "es", combo.descriptionEs),
      descriptionEn: extractAndCleanDescription((combo as any).description, "en", combo.descriptionEn),
      priceCRC: combo.priceCRC,
      originalPriceCRC: combo.originalPriceCRC,
      installationPriceCRC: effectiveComboInstall,
      installLabourCostCRC: comboLabour,
      installProfitCRC: comboProfit,
      installationDurationMinutes: (combo as any).installationDurationMinutes ?? 60,
      installExtraParts: parsedComboExtraParts,
      discountPercent: combo.discountPercent,
      itemsText: manualItemsList.join("\n"),
      imageUrl: combo.imageUrl || "/images/sxs/z10_front.png",
      imgsText: (() => {
        const list: string[] = [];
        if (combo.imageUrl) list.push(combo.imageUrl);
        if ((combo as any).imagesJson) {
          try {
            const parsed = JSON.parse((combo as any).imagesJson);
            if (Array.isArray(parsed)) {
              parsed.forEach((img: any) => {
                if (typeof img === "string" && img.trim() && !list.includes(img.trim())) list.push(img.trim());
              });
            }
          } catch {}
        } else if (Array.isArray((combo as any).imgs)) {
          (combo as any).imgs.forEach((img: any) => {
            if (typeof img === "string" && img.trim() && !list.includes(img.trim())) list.push(img.trim());
          });
        }
        return list.join("\n");
      })(),
      featured: combo.featured ?? true,
      homeInstallationAvailable: combo.homeInstallationAvailable ?? true,
      parameters: comboParams,
      suggestedProductIds: (() => {
        if (Array.isArray(combo.suggestedProductIds)) return combo.suggestedProductIds;
        if (combo.suggestedProductIdsJson) {
          try {
            const parsed = JSON.parse(combo.suggestedProductIdsJson);
            if (Array.isArray(parsed)) return parsed;
          } catch {}
        }
        return [];
      })(),
      suggestedComboIds: (() => {
        if (Array.isArray(combo.suggestedComboIds)) return combo.suggestedComboIds;
        if (combo.suggestedComboIdsJson) {
          try {
            const parsed = JSON.parse(combo.suggestedComboIdsJson);
            if (Array.isArray(parsed)) return parsed;
          } catch {}
        }
        return [];
      })(),
      uniqueProduct: parsedComboUniqueProduct,
    });
    setIsEditingComboView(true);
    setIsComboModalOpen(false);
    setFeedback(null);
  };

  const handleOpenCreateCombo = () => {
    setEditingCombo(null);
    setComboSelectedProducts([]);
    setComboProductSearch("");
    setComboForm({
      slug: `combo-${Math.floor(100 + Math.random() * 900)}`,
      category: "performance",
      titleEs: "",
      titleEn: "",
      badgeEs: "COMBO ESPECIAL",
      badgeEn: "SPECIAL COMBO",
      descriptionEs: "",
      descriptionEn: "",
      priceCRC: 0,
      originalPriceCRC: 0,
      installationPriceCRC: 0,
      installLabourCostCRC: 0,
      installProfitCRC: 0,
      installationDurationMinutes: 60,
      installExtraParts: [] as InstallExtraPart[],
      discountPercent: 10,
      itemsText: "",
      imageUrl: "/images/sxs/z10_front.png",
      imgsText: "",
      featured: true,
      homeInstallationAvailable: true,
      parameters: [] as ConfigurableParameter[],
      suggestedProductIds: [] as string[],
      suggestedComboIds: [] as string[],
      uniqueProduct: {
        enabled: false,
        titleEs: "",
        titleEn: "",
        badgeEs: "SERVICIO EXCLUSIVO DE AJUSTE",
        badgeEn: "EXCLUSIVE TUNING SERVICE",
        descriptionEs: "",
        descriptionEn: "",
        priceCRC: 0,
        imageUrl: "",
        fields: [],
      },
    });
    setIsEditingComboView(true);
    setIsComboModalOpen(false);
    setFeedback(null);
  };

  const handleCreateQuickProductForCombo = async () => {
    if (!quickProductNameEs.trim()) {
      setQuickProductError(lang === "es" ? "Ingresa el nombre del producto en español" : "Please enter the product name in Spanish");
      return;
    }
    setCreatingQuickProduct(true);
    setQuickProductError(null);
    try {
      const sku = quickProductSku.trim() || `PRD-${Math.floor(100000 + Math.random() * 900000)}`;
      const res = await fetch("/api/sys/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku,
          nameEs: quickProductNameEs.trim(),
          nameEn: quickProductNameEn.trim() || quickProductNameEs.trim(),
          category: quickProductCategory || comboForm.category || "suspension",
          priceCRC: quickProductPriceCRC || 0,
          originalPriceCRC: quickProductPriceCRC || 0,
          discountPercent: 0,
          installationPriceCRC: 0,
          descriptionEs: quickProductNameEs.trim(),
          descriptionEn: quickProductNameEn.trim() || quickProductNameEs.trim(),
          imageUrl: "/images/logo.png",
          stockStatus: "IN_STOCK_US",
          featured: false,
          homeInstallationAvailable: true,
          isInstallationIncluded: true,
          warrantyCategory: "MECHANICAL_DRIVETRAIN",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.product) {
        setComboSelectedProducts((prev) => [...prev, data.product]);
        setIsQuickProductModalOpen(false);
        setQuickProductNameEs("");
        setQuickProductNameEn("");
        setQuickProductSku("");
        setQuickProductPriceCRC(0);
        setFeedback({
          type: "success",
          msg: t.devComboUniqueProductQuickCreateSuccess || "Producto creado exitosamente y vinculado al combo.",
        });
        await fetchCatalog();
      } else {
        setQuickProductError(data.error || data.message || "Error al crear producto");
      }
    } catch (err: any) {
      setQuickProductError(err.message || "Error al crear producto");
    } finally {
      setCreatingQuickProduct(false);
    }
  };

  const handleAddUniqueProductField = () => {
    if (!newFieldNameEs.trim()) return;
    const newField: ComboUniqueProductField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      nameEs: newFieldNameEs.trim(),
      nameEn: newFieldNameEn.trim() || newFieldNameEs.trim(),
      type: newFieldType,
      options: newFieldType === "select"
        ? newFieldOptionsRaw.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
      required: newFieldRequired,
      placeholderEs: newFieldPlaceholderEs.trim() || undefined,
    };
    setComboForm((prev) => ({
      ...prev,
      uniqueProduct: {
        ...prev.uniqueProduct,
        fields: [...(prev.uniqueProduct?.fields || []), newField],
      },
    }));
    setIsAddFieldModalOpen(false);
    setNewFieldNameEs("");
    setNewFieldNameEn("");
    setNewFieldOptionsRaw("");
    setNewFieldPlaceholderEs("");
    setNewFieldRequired(true);
  };

  const handleRemoveUniqueProductField = (fieldId: string) => {
    setComboForm((prev) => ({
      ...prev,
      uniqueProduct: {
        ...prev.uniqueProduct,
        fields: (prev.uniqueProduct?.fields || []).filter((f) => f.id !== fieldId),
      },
    }));
  };

  const [uploadingUniqueImage, setUploadingUniqueImage] = useState(false);
  const [uniqueImageProgress, setUniqueImageProgress] = useState(0);

  const handleUniqueProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingUniqueImage(true);
    setUniqueImageProgress(0);
    try {
      const res = await uploadMediaDirect(file, {
        folder: "combos",
        lang,
        onProgress: (p) => setUniqueImageProgress(p.percentage),
      });
      if (res.success && res.url) {
        setComboForm((prev) => ({
          ...prev,
          uniqueProduct: { ...prev.uniqueProduct, imageUrl: res.url },
        }));
      } else {
        setFeedback({ type: "error", msg: res.error || (lang === "es" ? "Error al subir imagen" : "Upload failed") });
      }
    } catch (err: any) {
      setFeedback({ type: "error", msg: err.message || "Upload error" });
    } finally {
      setUploadingUniqueImage(false);
      e.target.value = "";
    }
  };

  const handleSaveCombo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const isEdit = Boolean(editingCombo);
    const url = isEdit ? `/api/sys/combos/${editingCombo?.id}` : "/api/sys/combos";
    const method = isEdit ? "PATCH" : "POST";

    const productItems = comboSelectedProducts.map((p) => {
      const skuStr = p.sku ? ` [${p.sku}]` : "";
      return `${p.nameEs || p.p_title || p.title || "Pieza"}${skuStr}`;
    });

    const manualItems = comboForm.itemsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const items = [...productItems, ...manualItems];
    if (comboForm.uniqueProduct?.enabled && comboForm.uniqueProduct.titleEs?.trim()) {
      const uniqueTag = `★ [EXCLUSIVO] ${comboForm.uniqueProduct.titleEs.trim()}`;
      if (!items.includes(uniqueTag)) {
        items.unshift(uniqueTag);
      }
    }

    const comboImgs = Array.from(
      new Set(
        comboForm.imgsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );
    const trimmedComboPrimary = comboForm.imageUrl.trim();
    const chosenComboPrimary =
      comboImgs.length > 0
        ? comboImgs.includes(trimmedComboPrimary)
          ? trimmedComboPrimary
          : comboImgs[0]
        : trimmedComboPrimary || "/images/logo.png";
    const orderedComboImgs =
      comboImgs.length > 0
        ? [chosenComboPrimary, ...comboImgs.filter((u) => u !== chosenComboPrimary)]
        : trimmedComboPrimary
        ? [trimmedComboPrimary]
        : [];

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: comboForm.slug,
          category: comboForm.category,
          titleEs: comboForm.titleEs,
          titleEn: comboForm.titleEn,
          badgeEs: comboForm.badgeEs,
          badgeEn: comboForm.badgeEn,
          descriptionEs: cleanDescriptionText(comboForm.descriptionEs),
          descriptionEn: cleanDescriptionText(comboForm.descriptionEn),
          priceCRC: comboForm.priceCRC,
          originalPriceCRC: comboForm.originalPriceCRC,
          installationPriceCRC: comboForm.installationPriceCRC,
          installLabourCostCRC: Math.round(Number(comboForm.installLabourCostCRC) || 0),
          installProfitCRC: Math.round(Number(comboForm.installProfitCRC) || 0),
          installationDurationMinutes: Math.max(15, Math.round(Number(comboForm.installationDurationMinutes) || 60)),
          installExtraParts: comboForm.installExtraParts || [],
          installExtraPartsJson: JSON.stringify(comboForm.installExtraParts || []),
          discountPercent: comboForm.discountPercent,
          itemsJson: JSON.stringify(items),
          imageUrl: chosenComboPrimary,
          imagesJson: JSON.stringify(orderedComboImgs),
          imgs: orderedComboImgs,
          featured: comboForm.featured,
          homeInstallationAvailable: comboForm.homeInstallationAvailable,
          parameters: comboForm.parameters,
          parametersJson: JSON.stringify(comboForm.parameters || []),
          suggestedProductIds: comboForm.suggestedProductIds || [],
          suggestedProductIdsJson: JSON.stringify(comboForm.suggestedProductIds || []),
          suggestedComboIds: comboForm.suggestedComboIds || [],
          suggestedComboIdsJson: JSON.stringify(comboForm.suggestedComboIds || []),
          uniqueProduct: comboForm.uniqueProduct,
          uniqueProductJson: JSON.stringify(comboForm.uniqueProduct || {}),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsEditingComboView(false);
        setIsComboModalOpen(false);
        await fetchCatalog();
        setFeedback({
          type: "success",
          msg: isEdit
            ? lang === "es"
              ? "Combo actualizado correctamente."
              : "Combo updated successfully."
            : lang === "es"
            ? "Combo creado correctamente."
            : "Combo created successfully.",
        });
      } else {
        setFeedback({
          type: "error",
          msg: data.message || data.error || "Error al guardar el combo.",
        });
      }
    } catch (err) {
      console.error("Save combo error:", err);
      setFeedback({
        type: "error",
        msg: "Error de conexión al guardar el combo.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleArchiveCombo = async (combo: Combo) => {
    const isCurrentlyArchived = Boolean(combo.isArchived);
    const confirmPrompt = isCurrentlyArchived
      ? t.comboUnarchiveConfirmPrompt
      : t.comboArchiveConfirmPrompt;

    if (!confirm(confirmPrompt)) return;

    try {
      const res = await fetch(`/api/sys/combos/${combo.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isCurrentlyArchived ? "unarchive" : "archive" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCombos((prev) =>
          prev.map((c) => (c.id === combo.id ? { ...c, isArchived: !isCurrentlyArchived } : c))
        );
        setFeedback({
          type: "success",
          msg: isCurrentlyArchived
            ? (lang === "es" ? "Combo reactivado en el catálogo." : "Combo reactivated in catalog.")
            : (lang === "es" ? "Combo archivado." : "Combo archived."),
        });
      } else {
        setFeedback({
          type: "error",
          msg: data.error || (lang === "es" ? "Error al actualizar archivo del combo." : "Error updating combo archive status."),
        });
      }
    } catch (err) {
      console.error("Archive combo error:", err);
      setFeedback({
        type: "error",
        msg: lang === "es" ? "Error de conexión al archivar combo." : "Connection error while archiving combo.",
      });
    }
  };

  const handleOpenEliminateComboModal = (combo: Combo) => {
    setEliminateModalCombo(combo);
    setEliminateComboMasterPassword("");
    setEliminateComboError(null);
  };

  const handleExecuteEliminateCombo = async () => {
    if (!eliminateModalCombo) return;
    if (!eliminateComboMasterPassword.trim()) {
      setEliminateComboError(
        lang === "es" ? "Por favor ingresa la contraseña Master." : "Please enter Master password."
      );
      return;
    }

    setEliminatingCombo(true);
    setEliminateComboError(null);

    try {
      const res = await fetch(`/api/sys/combos/${eliminateModalCombo.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "eliminate", masterPassword: eliminateComboMasterPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCombos((prev) => prev.filter((c) => c.id !== eliminateModalCombo.id));
        setEliminateModalCombo(null);
        setEliminateComboMasterPassword("");
        setFeedback({
          type: "success",
          msg: t.comboEliminateSuccess,
        });
      } else {
        setEliminateComboError(
          data.error ||
            (lang === "es" ? "Contraseña incorrecta o error al eliminar." : "Incorrect password or error eliminating.")
        );
      }
    } catch (err) {
      console.error("Eliminate combo error:", err);
      setEliminateComboError(
        lang === "es" ? "Error de conexión al eliminar combo." : "Network error eliminating combo."
      );
    } finally {
      setEliminatingCombo(false);
    }
  };

  const handleMediaUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    mediaType: "image" | "video" | "audio" = "image",
    replaceIndex?: number
  ) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;
    const files = Array.from(rawFiles);

    setUploadingMediaType(mediaType);
    setUploadingImage(true);
    const folderTarget = mediaType === "image" ? (isEditingProductView ? "products" : activeCatalogType) : mediaType === "video" ? "videos" : "audios";

    try {
      const validFolder = (["products", "combos", "brands", "payments", "videos", "audios"].includes(folderTarget) ? folderTarget : "products") as "products" | "combos" | "brands" | "payments" | "videos" | "audios";

      // If replacing a single media item at a specific index
      if (replaceIndex !== undefined && replaceIndex >= 0) {
        const file = files[0];
        const result = await uploadMediaDirect(file, {
          folder: validFolder,
          lang,
        });

        if (!result.success || !result.url) {
          alert(result.error || (lang === "es" ? "Error al subir archivo" : "Upload failed"));
          return;
        }

        const fileUrl = result.url;
        if (isEditingProductView) {
          if (mediaType === "image") {
            setProductForm((prev) => {
              const list = prev.imgsText
                ? prev.imgsText.split("\n").map((s) => s.trim()).filter(Boolean)
                : prev.imageUrl
                ? [prev.imageUrl]
                : [];
              let nextPrimary = prev.imageUrl;
              if (replaceIndex < list.length) {
                const oldUrl = list[replaceIndex];
                list[replaceIndex] = fileUrl;
                if (prev.imageUrl === oldUrl || replaceIndex === 0) {
                  nextPrimary = fileUrl;
                }
              }
              const deduped = Array.from(new Set(list));
              return {
                ...prev,
                imageUrl: nextPrimary || deduped[0] || "",
                imgsText: deduped.join("\n"),
              };
            });
          } else if (mediaType === "video") {
            setProductForm((prev) => {
              const list = prev.vidsText
                ? prev.vidsText.split("\n").map((s) => s.trim()).filter(Boolean)
                : prev.videoUrl
                ? [prev.videoUrl]
                : [];
              if (replaceIndex < list.length) {
                list[replaceIndex] = fileUrl;
              }
              const deduped = Array.from(new Set(list));
              return {
                ...prev,
                videoUrl: deduped[0] || "",
                vidsText: deduped.join("\n"),
              };
            });
          } else if (mediaType === "audio") {
            setProductForm((prev) => {
              const list = prev.audiosText
                ? prev.audiosText.split("\n").map((s) => s.trim()).filter(Boolean)
                : prev.audioUrl
                ? [prev.audioUrl]
                : [];
              if (replaceIndex < list.length) {
                list[replaceIndex] = fileUrl;
              }
              const deduped = Array.from(new Set(list));
              return {
                ...prev,
                audioUrl: deduped[0] || "",
                audiosText: deduped.join("\n"),
              };
            });
          }
        } else {
          setComboForm((prev) => {
            const list = prev.imgsText
              ? prev.imgsText.split("\n").map((s) => s.trim()).filter(Boolean)
              : prev.imageUrl
              ? [prev.imageUrl]
              : [];
            let nextPrimary = prev.imageUrl;
            if (replaceIndex < list.length) {
              const oldUrl = list[replaceIndex];
              list[replaceIndex] = fileUrl;
              if (prev.imageUrl === oldUrl || replaceIndex === 0) {
                nextPrimary = fileUrl;
              }
            }
            const deduped = Array.from(new Set(list));
            return {
              ...prev,
              imageUrl: nextPrimary || deduped[0] || "",
              imgsText: deduped.join("\n"),
            };
          });
        }
        setFeedback({
          type: "success",
          msg:
            lang === "es"
              ? "Archivo multimedia reemplazado exitosamente. Guarda los cambios para aplicarlo en la base de datos."
              : "Media file replaced successfully. Save changes to apply in database.",
        });
        return;
      }

      // MULTIPLE / BATCH UPLOAD (when replaceIndex is undefined)
      // Upload all selected files concurrently
      const results = await Promise.all(
        files.map((f) => uploadMediaDirect(f, { folder: validFolder, lang }))
      );

      const successfulUrls = results.filter((r) => r.success && r.url).map((r) => r.url as string);
      const failedCount = results.filter((r) => !r.success || !r.url).length;

      if (successfulUrls.length === 0) {
        alert(results[0]?.error || (lang === "es" ? "Error al subir archivo(s)" : "Upload failed"));
        return;
      }

      if (isEditingProductView) {
        if (mediaType === "image") {
          setProductForm((prev) => {
            const list = prev.imgsText
              ? prev.imgsText.split("\n").map((s) => s.trim()).filter(Boolean)
              : prev.imageUrl
              ? [prev.imageUrl]
              : [];
            let nextPrimary = prev.imageUrl;
            successfulUrls.forEach((fileUrl) => {
              if (!list.includes(fileUrl)) list.push(fileUrl);
              if (!nextPrimary) nextPrimary = fileUrl;
            });
            const deduped = Array.from(new Set(list));
            return {
              ...prev,
              imageUrl: nextPrimary || deduped[0] || "",
              imgsText: deduped.join("\n"),
            };
          });
        } else if (mediaType === "video") {
          setProductForm((prev) => {
            const list = prev.vidsText
              ? prev.vidsText.split("\n").map((s) => s.trim()).filter(Boolean)
              : prev.videoUrl
              ? [prev.videoUrl]
              : [];
            successfulUrls.forEach((fileUrl) => {
              if (!list.includes(fileUrl)) list.push(fileUrl);
            });
            const deduped = Array.from(new Set(list));
            return {
              ...prev,
              videoUrl: deduped[0] || "",
              vidsText: deduped.join("\n"),
            };
          });
        } else if (mediaType === "audio") {
          setProductForm((prev) => {
            const list = prev.audiosText
              ? prev.audiosText.split("\n").map((s) => s.trim()).filter(Boolean)
              : prev.audioUrl
              ? [prev.audioUrl]
              : [];
            successfulUrls.forEach((fileUrl) => {
              if (!list.includes(fileUrl)) list.push(fileUrl);
            });
            const deduped = Array.from(new Set(list));
            return {
              ...prev,
              audioUrl: deduped[0] || "",
              audiosText: deduped.join("\n"),
            };
          });
        }
      } else {
        setComboForm((prev) => {
          const list = prev.imgsText
            ? prev.imgsText.split("\n").map((s) => s.trim()).filter(Boolean)
            : prev.imageUrl
            ? [prev.imageUrl]
            : [];
          let nextPrimary = prev.imageUrl;
          successfulUrls.forEach((fileUrl) => {
            if (!list.includes(fileUrl)) list.push(fileUrl);
            if (!nextPrimary || nextPrimary === "/images/sxs/z10_front.png") {
              nextPrimary = fileUrl;
            }
          });
          const deduped = Array.from(new Set(list));
          return {
            ...prev,
            imageUrl: nextPrimary || deduped[0] || "",
            imgsText: deduped.join("\n"),
          };
        });
      }

      setFeedback({
        type: "success",
        msg:
          lang === "es"
            ? `${successfulUrls.length} ${successfulUrls.length === 1 ? "archivo multimedia subido" : "archivos multimedia subidos"} exitosamente.${failedCount > 0 ? ` (${failedCount} fallaron)` : ""}`
            : `${successfulUrls.length} ${successfulUrls.length === 1 ? "media file uploaded" : "media files uploaded"} successfully.${failedCount > 0 ? ` (${failedCount} failed)` : ""}`,
      });
    } catch (err) {
      console.error("Upload error:", err);
      setFeedback({
        type: "error",
        msg: lang === "es" ? "Error al conectar para subir archivo." : "Connection error while uploading file.",
      });
    } finally {
      setUploadingMediaType(null);
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => handleMediaUpload(e, "image");

  // Dynamic computation of available vehicle brands & distributor brands
  // (Zero Mock Data Policy: only show parameters actually present in catalog with count > 0)
  const availableProductVehicleBrands = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const vBrands = detectProductVehicleBrands(p);
      vBrands.forEach((vb) => {
        const slug = vb.toLowerCase();
        counts[slug] = (counts[slug] || 0) + 1;
      });
    });
    return SXS_BRANDS.filter((b) => (counts[b.slug.toLowerCase()] || 0) > 0).map((b) => ({
      slug: b.slug,
      title: b.title,
      count: counts[b.slug.toLowerCase()] || 0,
    }));
  }, [products]);

  const availableComboVehicleBrands = useMemo(() => {
    const counts: Record<string, number> = {};
    combos.forEach((c) => {
      const vBrands = detectProductVehicleBrands({
        p_title: c.titleEs,
        nameEs: c.titleEs,
        nameEn: c.titleEn,
        description: c.descriptionEs,
        slug: c.slug,
        comp: [c.slug, c.category],
      });
      vBrands.forEach((vb) => {
        const slug = vb.toLowerCase();
        counts[slug] = (counts[slug] || 0) + 1;
      });
    });
    return SXS_BRANDS.filter((b) => (counts[b.slug.toLowerCase()] || 0) > 0).map((b) => ({
      slug: b.slug,
      title: b.title,
      count: counts[b.slug.toLowerCase()] || 0,
    }));
  }, [combos]);

  const availableVehicleBrands = activeCatalogType === "products" ? availableProductVehicleBrands : availableComboVehicleBrands;

  const availableProductDistributorBrands = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const brandsList = Array.isArray(p.brand) && p.brand.length > 0
        ? p.brand
        : (p.brandName ? [p.brandName] : []);
      brandsList.forEach((b) => {
        const norm = normalizeBrandName(b || "");
        if (norm) {
          counts[norm] = (counts[norm] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const availableComboDistributorBrands = useMemo(() => {
    const counts: Record<string, number> = {};
    combos.forEach((c) => {
      const itemsStr = (c.itemsJson || "").toLowerCase();
      dealerBrands.forEach((db) => {
        if (itemsStr.includes(db.name.toLowerCase())) {
          counts[db.name] = (counts[db.name] || 0) + 1;
        }
      });
    });
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [combos, dealerBrands]);

  const availableDistributorBrands = activeCatalogType === "products" ? availableProductDistributorBrands : availableComboDistributorBrands;

  // Dynamic computation of available categories
  // (Zero Mock Data Policy: only show categories actually present in catalog with count > 0)
  const availableProductCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      let cats: string[] = [];
      if (Array.isArray(p.category) && p.category.length > 0) {
        cats = p.category;
      } else if (typeof p.category === "string" && p.category) {
        cats = [p.category];
      } else if ((p as any).category?.slug) {
        cats = [(p as any).category.slug];
      }
      cats.forEach((c) => {
        const slug = String(c).trim().toLowerCase();
        if (slug) {
          counts[slug] = (counts[slug] || 0) + 1;
        }
      });
    });

    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([slug, count]) => {
        const matchedCat = categories.find((cat) => (cat.slug || "").toLowerCase() === slug || cat.id === slug);
        const nameEs = matchedCat?.nameEs || slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        const nameEn = matchedCat?.nameEn || nameEs;
        return {
          slug,
          nameEs,
          nameEn,
          title: lang === "es" ? nameEs : nameEn,
          count,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [products, categories, lang]);

  const availableComboCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    combos.forEach((c) => {
      const slug = (c.category || "").trim().toLowerCase();
      if (slug) {
        counts[slug] = (counts[slug] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([slug, count]) => {
        const matchedCat = categories.find((cat) => (cat.slug || "").toLowerCase() === slug || cat.id === slug);
        const nameEs = matchedCat?.nameEs || slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        const nameEn = matchedCat?.nameEn || nameEs;
        return {
          slug,
          nameEs,
          nameEn,
          title: lang === "es" ? nameEs : nameEn,
          count,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [combos, categories, lang]);

  const availableCategories = activeCatalogType === "products" ? availableProductCategories : availableComboCategories;

  const hasInStockItems = useMemo(() => {
    if (activeCatalogType === "products") {
      return products.some((p) => p.supplierStockStatus !== "OUT_OF_STOCK" && p.supplierStockStatus !== "UNAVAILABLE" && p.stockStatus !== "Agotado");
    }
    return combos.some((c) => c.stockStatus !== "OUT_OF_STOCK" && c.availability?.status !== "OUT_OF_STOCK" && c.availability?.available !== false);
  }, [activeCatalogType, products, combos]);

  const hasDiscountedItems = useMemo(() => {
    if (activeCatalogType === "products") {
      return products.some((p) => (p.discountPercent && p.discountPercent > 0) || (p.originalPriceCRC && p.originalPriceCRC > p.priceCRC));
    }
    return combos.some((c) => (c.discountPercent && c.discountPercent > 0) || (c.originalPriceCRC && c.originalPriceCRC > c.priceCRC));
  }, [activeCatalogType, products, combos]);

  const comboProductsInstallSummary = useMemo(() => {
    let totalLabour = 0;
    let totalProfit = 0;
    let allExtraParts: InstallExtraPart[] = [];
    let totalInstall = 0;
    let totalDuration = 0;

    comboSelectedProducts.forEach((p: any) => {
      const pLabour = Number(p.installLabourCostCRC) || Number(p.price?.I_price?.I_price) || Number(p.installationPriceCRC) || 0;
      const pProfit = Number(p.installProfitCRC) || 0;
      const pDuration = Number(p.installationDurationMinutes) > 0 ? Number(p.installationDurationMinutes) : 60;
      totalDuration += pDuration;
      let pParts: InstallExtraPart[] = [];
      if (Array.isArray(p.installExtraParts)) {
        pParts = p.installExtraParts;
      } else if (p.installExtraPartsJson) {
        try {
          const parsed = JSON.parse(p.installExtraPartsJson);
          if (Array.isArray(parsed)) pParts = parsed;
        } catch {}
      }
      const pPartsTotal = pParts.reduce((s, pt) => s + (Number(pt.priceCRC) || 0), 0);
      totalLabour += pLabour;
      totalProfit += pProfit;
      const pTot = (Number(p.installationPriceCRC) || Number(p.price?.I_price?.I_price) || (pLabour + pPartsTotal + pProfit));
      totalInstall += pTot;

      pParts.forEach((pt) => {
        allExtraParts.push({
          id: `cp-${p.id || p.sku || "p"}-${Math.random().toString(36).substring(2, 6)}`,
          name: `${p.nameEs || p.p_title || p.title || "Pieza"}: ${pt.name}`,
          priceCRC: Number(pt.priceCRC) || 0,
        });
      });
    });

    const totalParts = allExtraParts.reduce((s, pt) => s + (Number(pt.priceCRC) || 0), 0);
    const computedSum = totalInstall > 0 ? totalInstall : (totalLabour + totalParts + totalProfit);

    return {
      totalLabour,
      totalProfit,
      allExtraParts,
      totalParts,
      totalInstall: computedSum,
      totalDuration: totalDuration || 60,
    };
  }, [comboSelectedProducts]);

  // Filtered lists
  const normalizeSearchStr = (val: any) =>
    String(val || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const filteredProducts = products.filter((p) => {
    const qNorm = normalizeSearchStr(search).trim();
    if (qNorm) {
      const catNames = (Array.isArray(p.category) ? p.category : p.category ? [p.category] : []).flatMap((cSlug) => {
        const cObj = categories.find((cat: any) => cat.slug === cSlug || cat.id === cSlug);
        return cObj ? [cSlug, cObj.nameEn, cObj.nameEs] : [cSlug];
      });
      const haystack = normalizeSearchStr(
        [
          p.nameEn,
          p.nameEs,
          p.p_title,
          p.sku,
          p.slug,
          p.brandName,
          ...(Array.isArray(p.brand) ? p.brand : []),
          ...catNames,
          p.descriptionEn,
          p.descriptionEs,
          typeof p.description === "object" && p.description ? `${p.description.en || ""} ${p.description.es || ""}` : "",
        ].join(" ")
      );
      if (!haystack.includes(qNorm)) return false;
    }

    if (productFilterStatus === "active" && p.isArchived) return false;
    if (productFilterStatus === "archived" && !p.isArchived) return false;

    if (backdoorCategory !== "all") {
      let cats: string[] = [];
      if (Array.isArray(p.category) && p.category.length > 0) {
        cats = p.category;
      } else if (typeof p.category === "string" && p.category) {
        cats = [p.category];
      } else if ((p as any).category?.slug) {
        cats = [(p as any).category.slug];
      }
      const matchCat = cats.some((c) => String(c).trim().toLowerCase() === backdoorCategory.toLowerCase());
      if (!matchCat) return false;
    }

    if (backdoorVehicleBrand !== "all") {
      const vBrands = detectProductVehicleBrands(p);
      if (!vBrands.includes(backdoorVehicleBrand.toLowerCase())) return false;
    }

    if (backdoorDistributorBrand !== "all") {
      const pBrands = (Array.isArray(p.brand) && p.brand.length > 0 ? p.brand : [p.brandName || ""]).map((b) => normalizeBrandName(b || ""));
      if (!pBrands.includes(normalizeBrandName(backdoorDistributorBrand))) return false;
    }

    if (backdoorInStockOnly) {
      const isOut = p.supplierStockStatus === "OUT_OF_STOCK" || p.supplierStockStatus === "UNAVAILABLE" || p.stockStatus === "Agotado";
      if (isOut) return false;
    }

    if (backdoorDiscountedOnly) {
      const hasDiscount = (p.discountPercent && p.discountPercent > 0) || (p.originalPriceCRC && p.originalPriceCRC > p.priceCRC);
      if (!hasDiscount) return false;
    }

    return true;
  });

  const activeProductsCount = products.filter((p) => !p.isArchived).length;
  const archivedProductsCount = products.filter((p) => Boolean(p.isArchived)).length;

  const filteredCombos = combos.filter((c) => {
    const qNorm = normalizeSearchStr(search).trim();
    if (qNorm) {
      const cCatObj = categories.find((cat: any) => cat.slug === c.category || cat.id === c.category);
      const haystack = normalizeSearchStr(
        [
          c.titleEn,
          c.titleEs,
          c.slug,
          c.category,
          cCatObj?.nameEn,
          cCatObj?.nameEs,
          c.badgeEn,
          c.badgeEs,
          c.descriptionEn,
          c.descriptionEs,
          c.itemsJson,
        ].join(" ")
      );
      if (!haystack.includes(qNorm)) return false;
    }

    if (comboFilterStatus === "active" && c.isArchived) return false;
    if (comboFilterStatus === "archived" && !c.isArchived) return false;

    if (backdoorCategory !== "all") {
      const cCat = (c.category || "").trim().toLowerCase();
      if (cCat !== backdoorCategory.toLowerCase()) return false;
    }

    if (backdoorVehicleBrand !== "all") {
      const vBrands = detectProductVehicleBrands({
        p_title: c.titleEs,
        nameEs: c.titleEs,
        nameEn: c.titleEn,
        description: c.descriptionEs,
        slug: c.slug,
        comp: [c.slug, c.category],
      });
      if (!vBrands.includes(backdoorVehicleBrand.toLowerCase())) return false;
    }

    if (backdoorDistributorBrand !== "all") {
      const normTarget = normalizeBrandName(backdoorDistributorBrand).toLowerCase();
      const titleMatch = (c.titleEs || "").toLowerCase().includes(normTarget) || (c.titleEn || "").toLowerCase().includes(normTarget);
      const itemsMatch = (c.itemsJson || "").toLowerCase().includes(normTarget);
      if (!titleMatch && !itemsMatch) return false;
    }

    if (backdoorInStockOnly) {
      const isOut = c.stockStatus === "OUT_OF_STOCK" || c.availability?.status === "OUT_OF_STOCK" || c.availability?.available === false;
      if (isOut) return false;
    }

    if (backdoorDiscountedOnly) {
      const hasDiscount = (c.discountPercent && c.discountPercent > 0) || (c.originalPriceCRC && c.originalPriceCRC > c.priceCRC);
      if (!hasDiscount) return false;
    }

    return true;
  });

  const activeCombosCount = combos.filter((c) => !c.isArchived).length;
  const archivedCombosCount = combos.filter((c) => Boolean(c.isArchived)).length;

  const hasActiveBackdoorFilters =
    search.trim() !== "" ||
    backdoorCategory !== "all" ||
    backdoorVehicleBrand !== "all" ||
    backdoorDistributorBrand !== "all" ||
    backdoorInStockOnly ||
    backdoorDiscountedOnly ||
    (activeCatalogType === "products" ? productFilterStatus !== "all" : comboFilterStatus !== "all");

  const handleClearBackdoorFilters = () => {
    setSearch("");
    setBackdoorCategory("all");
    setBackdoorVehicleBrand("all");
    setBackdoorDistributorBrand("all");
    setBackdoorInStockOnly(false);
    setBackdoorDiscountedOnly(false);
    if (activeCatalogType === "products") {
      setProductFilterStatus("all");
    } else {
      setComboFilterStatus("all");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between animate-pulse">
          <div className="flex gap-2">
            <div className="h-8 w-28 bg-slate-200 rounded-lg" />
            <div className="h-8 w-28 bg-slate-200 rounded-lg" />
          </div>
          <div className="h-8 w-56 bg-slate-200 rounded-lg" />
        </div>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden p-4 space-y-3 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div className="space-y-1.5 w-1/3">
                <div className="h-4 bg-slate-200 rounded w-24" />
                <div className="h-3 bg-slate-100 rounded w-48" />
              </div>
              <div className="h-5 bg-slate-100 rounded w-20" />
              <div className="h-4 bg-slate-200 rounded w-24" />
              <div className="h-4 bg-slate-100 rounded w-20" />
              <div className="h-6 bg-slate-100 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // SHARED GLOBAL MODALS (Rendered across all views: Products, Combos, Catalog Overview)
  // -------------------------------------------------------------
  const renderGlobalModals = () => (
    <>
      {/* ELIMINATE PRODUCT MODAL (STRICT MASTER PASSWORD CONFIRMATION) */}
      {eliminateModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900">{t.productEliminateConfirmTitle}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {t.productEliminateConfirmPrompt}
                </p>
                <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-0.5">
                  <div className="font-mono font-bold text-slate-900">
                    SKU: {eliminateModalProduct.sku}
                  </div>
                  <div className="text-slate-600 truncate">
                    {lang === "es" ? eliminateModalProduct.nameEs : eliminateModalProduct.nameEn}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 space-y-2 text-xs">
              <div className="flex items-start gap-2 text-amber-900 font-semibold">
                <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>{t.orderMasterPasswordLabel}</span>
              </div>
              <input
                type="password"
                autoComplete="new-password"
                name={`master_pwd_elim_prod_${eliminateModalProduct.id}`}
                value={eliminateMasterPassword}
                onChange={(e) => {
                  setEliminateMasterPassword(e.target.value);
                  setEliminateError(null);
                }}
                placeholder={t.orderMasterPasswordPlaceholder}
                className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
              />
              {eliminateError && (
                <p className="text-[11px] font-bold text-red-600">{eliminateError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={eliminatingProduct}
                onClick={() => {
                  setEliminateModalProduct(null);
                  setEliminateMasterPassword("");
                  setEliminateError(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                {t.orderCancelBtn}
              </button>
              <button
                type="button"
                disabled={eliminatingProduct || !eliminateMasterPassword.trim()}
                onClick={handleExecuteEliminateProduct}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {eliminatingProduct ? (
                  <span>{lang === "es" ? "Eliminando..." : "Eliminating..."}</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.productEliminateBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ELIMINATE COMBO MODAL (STRICT MASTER PASSWORD CONFIRMATION) */}
      {eliminateModalCombo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900">{t.comboEliminateConfirmTitle}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {t.comboEliminateConfirmPrompt}
                </p>
                <div className="mt-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-0.5">
                  <div className="font-mono font-bold text-slate-900">
                    SLUG: {eliminateModalCombo.slug}
                  </div>
                  <div className="text-slate-600 truncate">
                    {lang === "es" ? eliminateModalCombo.titleEs : eliminateModalCombo.titleEn}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 space-y-2 text-xs">
              <div className="flex items-start gap-2 text-amber-900 font-semibold">
                <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>{t.orderMasterPasswordLabel}</span>
              </div>
              <input
                type="password"
                autoComplete="new-password"
                name={`master_pwd_elim_combo_${eliminateModalCombo.id}`}
                value={eliminateComboMasterPassword}
                onChange={(e) => {
                  setEliminateComboMasterPassword(e.target.value);
                  setEliminateComboError(null);
                }}
                placeholder={t.orderMasterPasswordPlaceholder}
                className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
              />
              {eliminateComboError && (
                <p className="text-[11px] font-bold text-red-600">{eliminateComboError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={eliminatingCombo}
                onClick={() => {
                  setEliminateModalCombo(null);
                  setEliminateComboMasterPassword("");
                  setEliminateComboError(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                {t.orderCancelBtn}
              </button>
              <button
                type="button"
                disabled={eliminatingCombo || !eliminateComboMasterPassword.trim()}
                onClick={handleExecuteEliminateCombo}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {eliminatingCombo ? (
                  <span>{lang === "es" ? "Eliminando..." : "Eliminating..."}</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.comboEliminateBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNSAVED CHANGES WARNING MODAL (User Requirement) */}
      {showUnsavedChangesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">{t.devUnsavedChangesTitle}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t.devUnsavedChangesPrompt}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowUnsavedChangesModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                {t.devUnsavedChangesStay}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedChangesModal(false);
                  setIsEditingProductView(false);
                  setIsEditingComboView(false);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm"
              >
                {t.devUnsavedChangesDiscard}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL (User Requirement: staff can create a new category and add to selector, first letter always caps) */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 text-[#C02030] flex items-center justify-center shrink-0">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900">{t.devAddCategoryModalTitle}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {categoryModalTarget === "combo"
                        ? (lang === "es" ? "Para: Combo" : "For: Combo")
                        : categoryModalTarget === "quick_product"
                        ? (lang === "es" ? "Para: Producto de Combo" : "For: Combo Product")
                        : (lang === "es" ? "Para: Producto" : "For: Product")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {t.devAddCategoryModalDesc}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddCategoryModalOpen(false);
                  setNewCategoryNameEs("");
                  setNewCategoryNameEn("");
                  setCategoryModalError(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {t.devCategoryNameEsLabel} <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newCategoryNameEs}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const formatted = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "";
                    setNewCategoryNameEs(formatted);
                    setCategoryModalError(null);
                  }}
                  placeholder="e.g. Frenos & Discos Ventilados"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-semibold"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  {t.devCategoryCapsNotice}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {t.devCategoryNameEnLabel}:
                </label>
                <input
                  type="text"
                  value={newCategoryNameEn}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const formatted = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "";
                    setNewCategoryNameEn(formatted);
                  }}
                  placeholder="e.g. Brakes & Rotors"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-semibold"
                />
              </div>

              {categoryModalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{categoryModalError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={creatingCategory}
                  onClick={() => {
                    setIsAddCategoryModalOpen(false);
                    setNewCategoryNameEs("");
                    setNewCategoryNameEn("");
                    setCategoryModalError(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  {t.orderCancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={creatingCategory || !newCategoryNameEs.trim()}
                  className="px-4 py-2 rounded-xl bg-[#C02030] hover:bg-[#A01824] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {creatingCategory ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{lang === "es" ? "Creando categoría..." : "Creating category..."}</span>
                    </span>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>{t.devAddCategoryBtn}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK PRODUCT CREATION MODAL FOR COMBO */}
      {isQuickProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    {t.devComboUniqueProductQuickCreateModalTitle}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Crea un nuevo artículo en catálogo y vincúlalo a este combo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickProductModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {quickProductError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{quickProductError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nombre del Producto (Español): <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={quickProductNameEs}
                  onChange={(e) => setQuickProductNameEs(e.target.value)}
                  placeholder="Ej: Tapas de Reservorio Anodizadas FOX"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nombre del Producto (English):
                </label>
                <input
                  type="text"
                  value={quickProductNameEn}
                  onChange={(e) => setQuickProductNameEn(e.target.value)}
                  placeholder="E.g.: Anodized Billet Reservoir Caps FOX"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    SKU:
                  </label>
                  <input
                    type="text"
                    value={quickProductSku}
                    onChange={(e) => setQuickProductSku(e.target.value)}
                    placeholder="PRD-123456"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Precio Individual (₡):
                  </label>
                  <input
                    type="number"
                    value={quickProductPriceCRC || ""}
                    onChange={(e) => setQuickProductPriceCRC(Math.round(Number(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    {t.devCategorySelectorLabel || (lang === "es" ? "Categoría de Producto" : "Product Category")}:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryModalTarget("quick_product");
                      setCategoryModalError(null);
                      setNewCategoryNameEs("");
                      setNewCategoryNameEn("");
                      setIsAddCategoryModalOpen(true);
                    }}
                    className="text-[10px] font-bold text-[#C02030] hover:text-[#A01824] flex items-center gap-1 cursor-pointer transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{t.devNewCategoryBtn || (lang === "es" ? "+ Nueva Categoría" : "+ New Category")}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={quickProductCategory}
                    onChange={(e) => setQuickProductCategory(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-900 focus:bg-white transition"
                  >
                    <option value="" disabled>
                      {t.devSelectCategoryPrompt || (lang === "es" ? "-- Seleccionar Categoría --" : "-- Select Category --")}
                    </option>
                    {categories.map((cat: any) => {
                      const rawName = lang === "es" ? (cat.nameEs || cat.nameEn || cat.slug) : (cat.nameEn || cat.nameEs || cat.slug);
                      const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
                      return (
                        <option key={cat.id || cat.slug} value={cat.slug}>
                          {displayName}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsQuickProductModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={creatingQuickProduct}
                onClick={() => handleCreateQuickProductForCombo()}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-[#C02030] rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{creatingQuickProduct ? t.devSaving : "Crear y Vincular"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD FIELD MODAL TO UNIQUE PRODUCT */}
      {isAddFieldModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                  <ListPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    {t.devComboUniqueProductAddField}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pregunta o especificación requerida al cliente
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddFieldModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {t.devComboUniqueProductFieldName} (Español): <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newFieldNameEs}
                  onChange={(e) => setNewFieldNameEs(e.target.value)}
                  placeholder="Ej: Estilo de Manejo, Peso del Piloto, Accesorios Instalados"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {t.devComboUniqueProductFieldName} (English):
                </label>
                <input
                  type="text"
                  value={newFieldNameEn}
                  onChange={(e) => setNewFieldNameEn(e.target.value)}
                  placeholder="E.g.: Riding Style, Rider Weight, Installed Accessories"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {t.devComboUniqueProductFieldType}:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewFieldType("select")}
                    className={`p-2 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                      newFieldType === "select"
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {t.devComboUniqueProductFieldTypeSelect}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewFieldType("text")}
                    className={`p-2 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                      newFieldType === "text"
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {t.devComboUniqueProductFieldTypeText}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewFieldType("number")}
                    className={`p-2 rounded-xl border text-xs font-bold transition text-center cursor-pointer ${
                      newFieldType === "number"
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {t.devComboUniqueProductFieldTypeNumber}
                  </button>
                </div>
              </div>

              {newFieldType === "select" ? (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {t.devComboUniqueProductFieldOptionsPrompt}:
                  </label>
                  <textarea
                    rows={2}
                    value={newFieldOptionsRaw}
                    onChange={(e) => setNewFieldOptionsRaw(e.target.value)}
                    placeholder="Dunas, Rocas, Trail, Carreras, Mixto"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Ejemplo / Placeholder:
                  </label>
                  <input
                    type="text"
                    value={newFieldPlaceholderEs}
                    onChange={(e) => setNewFieldPlaceholderEs(e.target.value)}
                    placeholder="ej: 85 kg piloto + 60 kg copiloto"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white"
                  />
                </div>
              )}

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFieldRequired}
                    onChange={(e) => setNewFieldRequired(e.target.checked)}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-600 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    {t.devComboUniqueProductFieldRequired} (El cliente debe completarlo obligatoriamente)
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddFieldModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddUniqueProductField}
                disabled={!newFieldNameEs.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Agregar Campo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  // -------------------------------------------------------------
  // PRODUCT EDIT / CREATE SCREEN WITH FADED RED BACKGROUND
  // "When editing the product show all the information of the product for me to edit, everything."
  // "When creating a new product leave everything empty ready for information. Also make the critical spots require"
  // -------------------------------------------------------------
  if (isEditingProductView) {
    const isEdit = Boolean(editingProduct);
    const parsedImgsList = productForm.imgsText
      ? productForm.imgsText.split("\n").map((s) => s.trim()).filter(Boolean)
      : productForm.imageUrl
      ? [productForm.imageUrl]
      : [];
    const parsedAudiosList = productForm.audiosText
      ? productForm.audiosText.split("\n").map((s) => s.trim()).filter(Boolean)
      : [];
    const parsedVidsList = productForm.vidsText
      ? productForm.vidsText.split("\n").map((s) => s.trim()).filter(Boolean)
      : [];

    return (
      <div className="space-y-6">
        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 shadow-sm ${
              feedback.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="font-medium">{feedback.msg}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-bold px-2 py-0.5 rounded hover:bg-black/5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Validation Errors Box */}
        {validationErrors.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Campos Críticos Obligatorios Faltantes ({validationErrors.length}):</span>
            </div>
            <ul className="list-disc list-inside text-[11px] space-y-0.5 pl-2 text-amber-800">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* FADED RED WRAPPER (STORE REPLICA EDIT SCREEN) */}
        <div className="relative rounded-3xl bg-rose-50/75 border-2 border-red-300 shadow-md p-5 sm:p-8 space-y-8 backdrop-blur-sm transition-all duration-300">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-red-200/80">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRequestExitEditView}
                className="px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-red-200 text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#C02030]" />
                <span>{t.devBackToCatalog}</span>
              </button>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-[#C02030] text-[11px] font-extrabold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#C02030] animate-ping" />
                <span>{isEdit ? "Modo Edición Total de Producto" : "Nuevo Producto (Campos Limpios)"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleRequestExitEditView}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white/80 hover:bg-white rounded-xl border border-red-200 transition"
              >
                {t.orderCancelBtn}
              </button>
              <button
                type="button"
                onClick={() => handleSaveProduct()}
                disabled={saving}
                className="px-5 py-2 text-xs font-bold text-white bg-[#C02030] hover:bg-[#A01825] rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{saving ? t.devSaving : isEdit ? "Guardar Cambios" : "Publicar Producto"}</span>
              </button>
            </div>
          </div>

          {/* TWO-COLUMN FULL PRODUCT EDITING LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* LEFT COLUMN: Media (imgs, audios, vids), Descriptions, Requirements & Reviews */}
            <div className="space-y-6">
              {/* Direct Media Upload Section (imgs, vids, audios) - User Requirement */}
              <div className="rounded-3xl bg-white border border-red-200 shadow-sm overflow-hidden p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-red-100 pb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-[#C02030]" />
                    <span>{t.devMediaUploadSection}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Subida al servidor & BD</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Upload Image */}
                  <label className="cursor-pointer bg-red-50/80 hover:bg-red-100 text-[#C02030] border border-red-200 p-3.5 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition text-center shadow-xs">
                    <ImageIcon className="w-5 h-5 text-[#C02030]" />
                    <span>{uploadingMediaType === "image" ? t.devUploading : t.devUploadImage}</span>
                    <span className="text-[9px] text-slate-500 font-normal">
                      {lang === "es" ? "Fotos (múltiples)" : "Photos (multiple)"}
                    </span>
                    <input type="file" accept="image/*" multiple onChange={(e) => handleMediaUpload(e, "image")} disabled={Boolean(uploadingMediaType)} className="hidden" />
                  </label>

                  {/* Upload Video */}
                  <label className="cursor-pointer bg-red-50/80 hover:bg-red-100 text-[#C02030] border border-red-200 p-3.5 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition text-center shadow-xs">
                    <Video className="w-5 h-5 text-[#C02030]" />
                    <span>{uploadingMediaType === "video" ? t.devUploading : t.devUploadVideoBtn}</span>
                    <span className="text-[9px] text-slate-500 font-normal">Videos (vids)</span>
                    <input type="file" accept="video/*" onChange={(e) => handleMediaUpload(e, "video")} disabled={Boolean(uploadingMediaType)} className="hidden" />
                  </label>

                  {/* Upload Audio */}
                  <label className="cursor-pointer bg-red-50/80 hover:bg-red-100 text-[#C02030] border border-red-200 p-3.5 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition text-center shadow-xs">
                    <Volume2 className="w-5 h-5 text-[#C02030]" />
                    <span>{uploadingMediaType === "audio" ? t.devUploading : t.devUploadAudioBtn}</span>
                    <span className="text-[9px] text-slate-500 font-normal">Audio HD (audios)</span>
                    <input type="file" accept="audio/*" onChange={(e) => handleMediaUpload(e, "audio")} disabled={Boolean(uploadingMediaType)} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Image Gallery (imgs) */}
              <div className="rounded-3xl bg-white border border-red-200 shadow-sm overflow-hidden p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-red-100 pb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#C02030]" />
                    <span>{t.devImagesListLabel}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {parsedImgsList.length} {lang === "es" ? (parsedImgsList.length === 1 ? "imagen" : "imágenes") : (parsedImgsList.length === 1 ? "image" : "images")}
                  </span>
                </div>

                {/* Primary Preview */}
                <div className="relative w-full h-64 sm:h-72 flex items-center justify-center bg-slate-50/70 rounded-2xl border border-red-100 overflow-hidden">
                  {productForm.imageUrl || parsedImgsList[0] ? (
                    <img
                      src={productForm.imageUrl || parsedImgsList[0]}
                      alt="Primary Preview"
                      className="max-h-full max-w-full object-contain p-2"
                    />
                  ) : (
                    <div className="text-center p-6 text-slate-400 space-y-2">
                      <Package className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="text-xs">
                        {lang === "es" ? "Sin imagen asignada. Sube o escribe URLs abajo." : "No image assigned. Upload or enter URLs below."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {parsedImgsList.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-1">
                    {parsedImgsList.map((imgUrl, idx) => {
                      const isPrimary = (productForm.imageUrl || parsedImgsList[0]) === imgUrl;
                      return (
                        <div
                          key={idx}
                          className={`relative group shrink-0 w-16 h-16 rounded-xl border-2 overflow-hidden transition cursor-pointer ${
                            isPrimary ? "border-[#C02030] shadow-sm ring-2 ring-red-200" : "border-slate-200 hover:border-slate-400 opacity-80 hover:opacity-100"
                          }`}
                          onClick={() => {
                            const remaining = parsedImgsList.filter((u) => u !== imgUrl);
                            const reordered = [imgUrl, ...remaining];
                            setProductForm({
                              ...productForm,
                              imageUrl: imgUrl,
                              imgsText: reordered.join("\n"),
                            });
                          }}
                          title={lang === "es" ? `Click para establecer como principal (${imgUrl})` : `Click to set as primary (${imgUrl})`}
                        >
                          <img src={imgUrl} alt={`Thumb ${idx + 1}`} className="w-full h-full object-contain p-1 bg-white" />
                          {isPrimary && (
                            <span className="absolute bottom-0 inset-x-0 bg-[#C02030] text-white text-[8px] font-bold text-center py-0.5 leading-none">
                              {lang === "es" ? "Principal" : "Primary"}
                            </span>
                          )}
                          <label
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-0.5 left-0.5 w-4 h-4 bg-slate-900/85 hover:bg-slate-900 text-white rounded-full text-[9px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow cursor-pointer"
                            title={lang === "es" ? "Reemplazar imagen" : "Replace image"}
                          >
                            <Upload className="w-2.5 h-2.5" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleMediaUpload(e, "image", idx)}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updated = parsedImgsList.filter((_, i) => i !== idx);
                              const newPrimary = isPrimary ? (updated[0] || "") : (updated.includes(productForm.imageUrl) ? productForm.imageUrl : (updated[0] || ""));
                              setProductForm({
                                ...productForm,
                                imageUrl: newPrimary,
                                imgsText: updated.join("\n"),
                              });
                            }}
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow"
                            title={lang === "es" ? "Eliminar de la lista y base de datos" : "Delete from list & database"}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Upload Trigger & Primary URL */}
                <div className="pt-2 border-t border-red-100 flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex-1 w-full">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      {lang === "es" ? "URL Imagen Principal" : "Primary Image URL"} <span className="text-red-500">*</span>:
                    </label>
                    <input
                      type="text"
                      required
                      value={productForm.imageUrl}
                      onChange={(e) => {
                        const newUrl = e.target.value;
                        const list = productForm.imgsText.split("\n").map((s) => s.trim()).filter(Boolean);
                        if (!newUrl.trim()) {
                          const filtered = list.filter((u) => u !== productForm.imageUrl);
                          setProductForm({
                            ...productForm,
                            imageUrl: "",
                            imgsText: filtered.join("\n"),
                          });
                        } else {
                          const prevIdx = list.indexOf(productForm.imageUrl);
                          if (prevIdx === 0) {
                            list[0] = newUrl;
                          } else if (!list.includes(newUrl)) {
                            list.unshift(newUrl);
                          }
                          setProductForm({
                            ...productForm,
                            imageUrl: newUrl,
                            imgsText: Array.from(new Set(list)).join("\n"),
                          });
                        }
                      }}
                      placeholder="/products/nombre-imagen.webp"
                      className="w-full bg-slate-50 border border-red-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                  <label className="cursor-pointer bg-red-50 hover:bg-red-100 text-[#C02030] border border-red-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 mt-2 sm:mt-4">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingImage ? t.devUploading : (lang === "es" ? "Subir Imágenes (múltiples)" : "Upload Images (multiple)")}</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                  </label>
                </div>

                {/* imgs Multi-line Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      {lang === "es" ? "Galería Completa de Imágenes" : "Complete Image Gallery"} (<span className="font-mono text-[#C02030]">imgs</span> - {lang === "es" ? "Una por línea" : "One per line"}) <span className="text-red-500">*</span>:
                    </label>
                    <span className="text-[10px] text-slate-500">
                      {lang === "es" ? "Primera URL = Imagen Principal" : "First URL = Primary Image"}
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={productForm.imgsText}
                    onChange={(e) => {
                      const text = e.target.value;
                      const lines = text.split("\n").map((s) => s.trim()).filter(Boolean);
                      const firstLine = lines[0] || "";
                      setProductForm({
                        ...productForm,
                        imgsText: text,
                        imageUrl: firstLine,
                      });
                    }}
                    placeholder="/products/bmp_z10_side_exhaust_01.webp&#10;/products/bmp_z10_side_exhaust_02.webp"
                    className="w-full bg-slate-50 border border-red-200 rounded-xl p-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-red-500 leading-relaxed"
                  />
                </div>
              </div>

              {/* Multimedia Técnica (audios & vids) */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-red-200 shadow-sm space-y-4">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-red-100 pb-2">
                  <Volume2 className="w-4 h-4 text-[#C02030]" />
                  <span>
                    {lang === "es" ? "Multimedia Técnica" : "Technical Multimedia"} (<span className="font-mono text-[#C02030]">audios</span> & <span className="font-mono text-[#C02030]">vids</span>)
                  </span>
                </span>

                {/* audios */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      {t.devAudiosListLabel} (<span className="font-mono text-[#C02030]">audios</span> - {lang === "es" ? "Una por línea" : "One per line"}):
                    </label>
                    <span className="text-[10px] text-slate-500">
                      {parsedAudiosList.length} {lang === "es" ? "muestras" : "samples"}
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={productForm.audiosText}
                    onChange={(e) => {
                      const text = e.target.value;
                      const firstAudio = text.split("\n").map((s) => s.trim()).filter(Boolean)[0] || "";
                      setProductForm({
                        ...productForm,
                        audiosText: text,
                        audioUrl: firstAudio ? normalizeAudioUrl(firstAudio) : "",
                      });
                    }}
                    placeholder="/audio/CFMOTO_Z10_Side-exit_exhaust-IDLE.wav&#10;/audio/CFMOTO_Z10_Side-exit_exhaust-REV.wav"
                    className="w-full bg-slate-50 border border-red-200 rounded-xl p-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-red-500 leading-relaxed"
                  />

                  {/* Audio Player Previews */}
                  {parsedAudiosList.length > 0 && (
                    <div className="mt-2.5 space-y-2">
                      {parsedAudiosList.map((rawAudio, idx) => {
                        const audioUrl = normalizeAudioUrl(rawAudio);
                        return (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2 bg-slate-50 rounded-xl border border-red-100">
                            <span className="text-[10px] font-mono text-slate-600 truncate max-w-xs">{audioUrl}</span>
                            <div className="flex items-center gap-1.5">
                              <audio controls preload="none" className="h-7 w-full sm:w-52 outline-none" src={audioUrl} />
                              <label
                                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer shrink-0"
                                title={lang === "es" ? "Reemplazar audio" : "Replace audio"}
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="audio/*"
                                  onChange={(e) => handleMediaUpload(e, "audio", idx)}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = parsedAudiosList.filter((_, i) => i !== idx);
                                  setProductForm({
                                    ...productForm,
                                    audiosText: updated.join("\n"),
                                    audioUrl: updated[0] ? normalizeAudioUrl(updated[0]) : "",
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition shrink-0"
                                title={lang === "es" ? "Eliminar audio" : "Delete audio"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* vids */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      {t.devVideosListLabel} (<span className="font-mono text-[#C02030]">vids</span> - {lang === "es" ? "Una por línea" : "One per line"}):
                    </label>
                    <span className="text-[10px] text-slate-500">{parsedVidsList.length} videos</span>
                  </div>
                  <textarea
                    rows={2}
                    value={productForm.vidsText}
                    onChange={(e) => {
                      const text = e.target.value;
                      const firstVid = text.split("\n").map((s) => s.trim()).filter(Boolean)[0] || "";
                      setProductForm({
                        ...productForm,
                        vidsText: text,
                        videoUrl: firstVid,
                      });
                    }}
                    placeholder="/videos/demostracion-z10.mp4&#10;https://youtube.com/watch?v=..."
                    className="w-full bg-slate-50 border border-red-200 rounded-xl p-2.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-red-500 leading-relaxed"
                  />

                  {/* Video Previews */}
                  {parsedVidsList.length > 0 && (
                    <div className="mt-2.5 space-y-2">
                      {parsedVidsList.map((vidUrl, idx) => (
                        <div key={idx} className="p-2 bg-slate-50 rounded-xl border border-red-100 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono text-slate-600 truncate block">{vidUrl}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <label
                                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                                title={lang === "es" ? "Reemplazar video" : "Replace video"}
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => handleMediaUpload(e, "video", idx)}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = parsedVidsList.filter((_, i) => i !== idx);
                                  setProductForm({
                                    ...productForm,
                                    vidsText: updated.join("\n"),
                                    videoUrl: updated[0] || "",
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition"
                                title={lang === "es" ? "Eliminar video" : "Delete video"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          {vidUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video controls preload="metadata" className="w-full max-h-44 rounded-lg bg-black" src={vidUrl} />
                          ) : (
                            <a href={vidUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#C02030] hover:underline font-semibold flex items-center gap-1">
                              <span>{lang === "es" ? "Abrir video en nueva pestaña" : "Open video in new tab"}</span> ↗
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Technical Description (description) */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-red-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-red-100 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#C02030]">
                    <Layers className="w-4 h-4" />
                    <span>{t.devSpecsAndDesc} (<span className="font-mono">description</span>)</span>
                  </div>
                  {/* Language Toggle */}
                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveDescTab("es")}
                      className={`px-2.5 py-1 rounded-md transition ${activeDescTab === "es" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      Español (es)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveDescTab("en")}
                      className={`px-2.5 py-1 rounded-md transition ${activeDescTab === "en" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                    >
                      English (en)
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-1">
                  <span className="text-[11px] text-slate-500 font-medium">Formato y viñetas</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeDescTab === "es") {
                        setProductForm((prev) => ({
                          ...prev,
                          descriptionEs: prev.descriptionEs ? `${prev.descriptionEs.trimEnd()}\n- ` : "- ",
                        }));
                      } else {
                        setProductForm((prev) => ({
                          ...prev,
                          descriptionEn: prev.descriptionEn ? `${prev.descriptionEn.trimEnd()}\n- ` : "- ",
                        }));
                      }
                    }}
                    className="text-[10px] font-bold text-[#C02030] hover:text-[#901824] bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1 shadow-2xs"
                    title="Insertar viñeta '- '"
                  >
                    <ListPlus className="w-3.5 h-3.5" />
                    <span>{t.devAddBulletTemplateBtn}</span>
                  </button>
                </div>

                {activeDescTab === "es" ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        Descripción en Español (<span className="font-mono text-[#C02030]">description.es</span>) <span className="text-red-500">*</span>:
                      </label>
                      <span className="text-[10px] text-slate-400">Párrafos y viñetas</span>
                    </div>
                    <textarea
                      rows={6}
                      required
                      value={productForm.descriptionEs}
                      onChange={(e) => setProductForm({ ...productForm, descriptionEs: e.target.value })}
                      placeholder="Detalla las características principales. Usa '- ' al inicio de cada línea para viñetas automáticas:&#10;- Construcción en acero inoxidable 304&#10;- Soldadura TIG de grado aeronáutico&#10;- Ganancias comprobadas de +7 HP"
                      className="w-full bg-slate-50 border border-red-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-red-500 leading-relaxed font-sans"
                    />
                    <div className="mt-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px] text-slate-600 flex items-start gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#C02030] shrink-0 mt-0.5" />
                      <span>{t.devBulletListHelp}</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        Descripción en Inglés (<span className="font-mono text-[#C02030]">description.en</span>) <span className="text-red-500">*</span>:
                      </label>
                      <span className="text-[10px] text-slate-400">Paragraphs and bullets</span>
                    </div>
                    <textarea
                      rows={6}
                      required
                      value={productForm.descriptionEn}
                      onChange={(e) => setProductForm({ ...productForm, descriptionEn: e.target.value })}
                      placeholder="Detail full engineering specifications. Use '- ' at start of lines for bullet points:&#10;- Premium 304 stainless steel tubing&#10;- Aircraft-grade precision TIG welds&#10;- Dyno-proven +7 HP gains"
                      className="w-full bg-slate-50 border border-red-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-red-500 leading-relaxed font-sans"
                    />
                    <div className="mt-1.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[10px] text-slate-600 flex items-start gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#C02030] shrink-0 mt-0.5" />
                      <span>{t.devBulletListHelp}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Requirements & Reviews (requirements & reviews) */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-red-200 shadow-sm space-y-4">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-2 border-b border-red-100 pb-2">
                  <ShieldCheck className="w-4 h-4 text-[#C02030]" />
                  <span>Requerimientos & Reseñas (<span className="font-mono text-[#C02030]">requirements</span> & <span className="font-mono text-[#C02030]">reviews</span>)</span>
                </span>

                {/* requirements */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {t.devRequirementsLabel} (<span className="font-mono text-[#C02030]">requirements</span>):
                  </label>
                  <input
                    type="text"
                    value={productForm.requirements}
                    onChange={(e) => setProductForm({ ...productForm, requirements: e.target.value })}
                    placeholder="e.g. Requiere reflash de ECU o apto para motor stock"
                    className="w-full bg-slate-50 border border-red-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-red-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Notas de instalación, combustible mínimo o ajustes de motor necesarios.</p>
                </div>

                {/* reviews */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{t.devReviewsLabel} (<span className="font-mono text-[#C02030]">reviews</span>):</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Texto o JSON estructurado</span>
                  </div>
                  <textarea
                    rows={3}
                    value={productForm.reviews}
                    onChange={(e) => setProductForm({ ...productForm, reviews: e.target.value })}
                    placeholder='[{"author": "Carlos M.", "rating": 5, "comment": "Sonido increíble, 100% recomendado para Santa Ana y rutas de montaña"}]'
                    className="w-full bg-slate-50 border border-red-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-red-500 leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Categorization, Full Price Breakdown (price), Vehicle Fitment & Actions */}
            <div className="space-y-6">
              {/* Critical Identification & Categorization */}
              <div className="p-6 rounded-3xl bg-white border border-red-200 shadow-sm space-y-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 block border-b border-red-100 pb-2">
                  Identificación & Categorización Crítica
                </span>

                {/* p_title & nameEn */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      {t.devProductTitleLabel} (<span className="font-mono text-[#C02030]">p_title</span> - Español) <span className="text-red-500">*</span>:
                    </label>
                    <span className="text-[10px] text-slate-400">Título oficial de tienda</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={productForm.p_title}
                    onChange={(e) =>
                      setProductForm({ ...productForm, p_title: e.target.value, nameEs: e.target.value })
                    }
                    placeholder="e.g. Mufla Deportiva CFMOTO Z10 - Doble Barril Salida Central"
                    className="w-full bg-slate-50 border border-red-200 rounded-xl p-2.5 text-sm font-extrabold text-slate-900 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Título en Inglés (<span className="font-mono text-[#C02030]">nameEn</span>) <span className="text-red-500">*</span>:
                    </label>
                    <span className="text-[10px] text-slate-400">English store title</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={productForm.nameEn}
                    onChange={(e) => setProductForm({ ...productForm, nameEn: e.target.value })}
                    placeholder="e.g. CFMOTO Z10 Sport Exhaust - Dual Barrel Center Exit"
                    className="w-full bg-slate-50 border border-red-200 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-red-500"
                  />
                </div>

                {/* SKU & Slug */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <span>SKU del Producto</span> <span className="text-red-500">*</span>:
                      </label>
                      <button
                        type="button"
                        onClick={handleForceGenerateSku}
                        className="text-[10px] font-bold text-[#C02030] hover:text-[#901824] flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-50 hover:bg-red-100 transition border border-red-200 cursor-pointer shadow-2xs"
                        title="Generar SKU automáticamente según la marca distribuidora, los vehículos compatibles y la secuencia de productos"
                      >
                        <Sparkles className="w-3 h-3 text-[#C02030]" />
                        <span>{t.devAutoGenerateSkuBtn}</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={productForm.sku}
                        onChange={(e) => {
                          setIsSkuManuallyEdited(true);
                          setProductForm({ ...productForm, sku: e.target.value.toUpperCase() });
                        }}
                        placeholder="e.g. BMP-Z10-01"
                        className="w-full bg-slate-50 border border-red-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-red-500 uppercase tracking-wide"
                      />
                    </div>
                    <div className="mt-1 text-[10px] text-slate-500 font-mono">
                      {t.devSkuPatternHelp}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      URL Slug:
                    </label>
                    <input
                      type="text"
                      value={productForm.slug}
                      onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                      placeholder="e.g. bmp-z10-01"
                      className="w-full bg-slate-50 border border-red-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {/* brand & category */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      {t.devBrandLabel} (<span className="font-mono text-[#C02030]">brand</span>) <span className="text-red-500">*</span>:
                    </label>

                    <div className="space-y-1.5">
                      {/* Select Dropdown of Registered Dealer Brands */}
                      <select
                        value={registeredDealerBrands.includes(productForm.brandName) ? productForm.brandName : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            setProductForm((prev) => ({ ...prev, brandName: val }));
                            updateAutoSkuIfApplicable(val, undefined);
                          }
                        }}
                        className="w-full bg-white border border-red-200 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-bold shadow-2xs cursor-pointer"
                      >
                        <option value="">-- Seleccionar Marca Distribuidora (EVP, RPM, Bikeman...) --</option>
                        {registeredDealerBrands.map((bName: string) => (
                          <option key={bName} value={bName}>
                            {bName}
                          </option>
                        ))}
                      </select>

                      {/* Text Input with Datalist */}
                      <input
                        type="text"
                        required
                        list="registered-brands-datalist"
                        value={productForm.brandName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProductForm({ ...productForm, brandName: val });
                          updateAutoSkuIfApplicable(val, undefined);
                        }}
                        placeholder="e.g. Bikeman Performance, RPM Powersports, EVP..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-semibold"
                      />
                      <datalist id="registered-brands-datalist">
                        {registeredDealerBrands.map((bName: string) => (
                          <option key={bName} value={bName} />
                        ))}
                      </datalist>

                      {/* Quick Chips of Top Registered Dealer Brands */}
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {["RPM Powersports", "EVP", "Bikeman Performance", "DRT Motorsports", "Shock Therapy", "GGB Exhaust"].map((quickBrand) => {
                          const isActive = productForm.brandName.toLowerCase() === quickBrand.toLowerCase();
                          return (
                            <button
                              key={quickBrand}
                              type="button"
                              onClick={() => {
                                setProductForm((prev) => ({ ...prev, brandName: quickBrand }));
                                updateAutoSkuIfApplicable(quickBrand, undefined);
                              }}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                                isActive
                                   ? "bg-[#C02030] text-white border-[#C02030] shadow-2xs"
                                   : "bg-white text-slate-700 border-slate-200 hover:border-red-300 hover:bg-red-50/50"
                              }`}
                            >
                              {quickBrand}
                            </button>
                          );
                        })}
                      </div>

                      <p className="text-[10px] text-slate-400 italic">
                        ℹ️ Marca del repuesto / aftermarket (RPM, EVP, Bikeman...). La compatibilidad del vehículo (CFMOTO, Can-Am, Polaris, etc.) se configura abajo.
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        {t.devProductCategoriesLabel} (<span className="font-mono text-[#C02030]">category</span>) <span className="text-red-500">*</span>:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryModalError(null);
                          setNewCategoryNameEs("");
                          setNewCategoryNameEn("");
                          setIsAddCategoryModalOpen(true);
                        }}
                        className="text-[10px] font-bold text-[#C02030] hover:text-[#901824] flex items-center gap-1 transition"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{t.devAddCategoryBtn}</span>
                      </button>
                    </div>

                    {/* Selected Categories Badges/Chips */}
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {(productForm.selectedCategories && productForm.selectedCategories.length > 0
                        ? productForm.selectedCategories
                        : productForm.category ? [productForm.category] : []
                      ).map((catSlug) => {
                        const catObj = categories.find((c: any) => c.slug === catSlug || c.id === catSlug);
                        const rawName = catObj ? (lang === "es" ? (catObj.nameEs || catObj.nameEn || catObj.slug) : (catObj.nameEn || catObj.nameEs || catObj.slug)) : catSlug;
                        const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
                        return (
                          <span
                            key={catSlug}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-50 border border-red-200 text-[#C02030] text-xs font-semibold shadow-2xs"
                          >
                            <Tag className="w-3 h-3 text-[#C02030]" />
                            <span>{displayName}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const current = productForm.selectedCategories && productForm.selectedCategories.length > 0
                                  ? productForm.selectedCategories
                                  : (productForm.category ? [productForm.category] : []);
                                const next = current.filter((c) => c !== catSlug);
                                setProductForm({
                                  ...productForm,
                                  category: next[0] || "",
                                  selectedCategories: next,
                                });
                              }}
                              className="p-0.5 hover:bg-red-200 rounded-full transition text-[#C02030]"
                              title={lang === "es" ? "Eliminar categoría" : "Remove category"}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                      {(!productForm.selectedCategories || productForm.selectedCategories.length === 0) && !productForm.category && (
                        <span className="text-[11px] text-amber-600 font-medium italic">
                          {t.devNoCategoriesSelected}
                        </span>
                      )}
                    </div>

                    {/* Add Category Dropdown Row */}
                    <div className="flex items-center gap-2">
                      <select
                        value=""
                        onChange={(e) => {
                          const chosen = e.target.value;
                          if (!chosen) return;
                          const current = productForm.selectedCategories && productForm.selectedCategories.length > 0
                            ? productForm.selectedCategories
                            : (productForm.category ? [productForm.category] : []);
                          if (!current.includes(chosen)) {
                            const next = [...current, chosen];
                            setProductForm({
                              ...productForm,
                              category: next[0] || "",
                              selectedCategories: next,
                            });
                          }
                        }}
                        className="flex-1 bg-slate-50 border border-red-200 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:border-red-500 font-semibold"
                      >
                        <option value="" disabled>
                          {t.devSelectCategoryToAdd}
                        </option>
                        {categories
                          .filter((cat: any) => !(productForm.selectedCategories || [productForm.category]).includes(cat.slug))
                          .map((cat: any) => {
                            const rawName = lang === "es" ? (cat.nameEs || cat.nameEn || cat.slug) : (cat.nameEn || cat.nameEs || cat.slug);
                            const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
                            return (
                              <option key={cat.id || cat.slug} value={cat.slug}>
                                + {displayName}
                              </option>
                            );
                          })}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryModalTarget("product");
                          setCategoryModalError(null);
                          setNewCategoryNameEs("");
                          setNewCategoryNameEn("");
                          setIsAddCategoryModalOpen(true);
                        }}
                        className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-[#C02030] transition text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                        title={t.devAddCategoryBtn}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.devNewCategoryBtn || (lang === "es" ? "+ Nueva Categoría" : "+ New Category")}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* comp tags & Year Range (Side-by-side) - User Requirement */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-start">
                  <div className="sm:col-span-7 lg:col-span-8 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5 text-[#C02030]" />
                        <span>{t.devCompVehiclesLabel}:</span>
                      </label>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {selectedVehicles.filter(Boolean).length} {lang === "es" ? "vehículo(s)" : "vehicle(s)"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {selectedVehicles.map((vehicleSlug, index) => (
                        <div key={index} className="flex items-center gap-2 min-w-0">
                          <select
                            value={vehicleSlug}
                            onChange={(e) => {
                              const val = e.target.value;
                              const updated = selectedVehicles.map((v, i) => (i === index ? val : v));
                              setSelectedVehicles(updated);
                              updateAutoSkuIfApplicable(undefined, updated);
                            }}
                            className="flex-1 min-w-0 bg-slate-50 border border-red-200 rounded-xl p-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-red-500 truncate"
                          >
                            <option value="" disabled>
                              {t.devSelectVehiclePrompt}
                            </option>
                            <option value="all">
                              🌐 {t.devUniversalFitment}
                            </option>
                            {registeredVehicleBrands.map((brand: any) => (
                              <optgroup key={brand.id || brand.slug} label={brand.name}>
                                {brand.models.map((model: any) => (
                                  <option key={model.id || model.slug} value={model.slug}>
                                    {brand.name} - {model.name} {model.code ? `[SKU: ${model.code}]` : ""}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                            {/* Fallback for active legacy or uncatalogued vehicle tag if currently selected */}
                            {vehicleSlug &&
                              vehicleSlug !== "all" &&
                              !registeredVehicleBrands.some((b: any) =>
                                b.models.some((m: any) => m.slug === vehicleSlug)
                              ) && (
                                <option value={vehicleSlug}>
                                  {vehicleSlug.toUpperCase()}
                                </option>
                              )}
                          </select>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = selectedVehicles.filter((_, i) => i !== index);
                              setSelectedVehicles(updated);
                              updateAutoSkuIfApplicable(undefined, updated);
                            }}
                            className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition shrink-0"
                            title={t.devRemoveVehicle}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* Button to add another vehicle selector */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVehicles((prev) => [...prev, ""]);
                        }}
                        className="w-full py-2 px-3 rounded-xl border border-dashed border-red-300 bg-red-50/40 hover:bg-red-50 text-[#C02030] font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.devAddVehicleSelector}</span>
                      </button>
                    </div>
                  </div>

                  {/* Year Range (2 inputs on the right side) */}
                  <div className="sm:col-span-5 lg:col-span-4 min-w-0">
                    <div className="flex items-center justify-between mb-1 min-w-0 flex-wrap gap-1">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#C02030]" />
                        <span>{t.devYearRangeTitle} (<span className="font-mono text-[#C02030]">year_compatability</span>):</span>
                      </label>
                      <span className="text-[10px] font-mono text-[#C02030] font-bold">
                        {productForm.yearFrom && productForm.yearTo ? `${productForm.yearFrom} - ${productForm.yearTo}` : "2022 - 2026"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 min-w-0">
                      <div className="min-w-0">
                        <input
                          type="number"
                          min="1990"
                          max="2035"
                          value={productForm.yearFrom}
                          onChange={(e) => setProductForm({ ...productForm, yearFrom: e.target.value })}
                          placeholder="Desde (2022)"
                          className="w-full min-w-0 bg-slate-50 border border-red-200 rounded-xl p-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-red-500 text-center"
                        />
                        <span className="text-[9px] text-slate-400 block text-center mt-0.5">{t.devYearFromLabel}</span>
                      </div>
                      <div className="min-w-0">
                        <input
                          type="number"
                          min="1990"
                          max="2035"
                          value={productForm.yearTo}
                          onChange={(e) => setProductForm({ ...productForm, yearTo: e.target.value })}
                          placeholder="Hasta (2026)"
                          className="w-full min-w-0 bg-slate-50 border border-red-200 rounded-xl p-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-red-500 text-center"
                        />
                        <span className="text-[9px] text-slate-400 block text-center mt-0.5">{t.devYearToLabel}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* stockStatus & warrantyCategory */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      {t.devStockStatus} <span className="text-red-500">*</span>:
                    </label>
                    <select
                      value={productForm.stockStatus}
                      onChange={(e) => setProductForm({ ...productForm, stockStatus: e.target.value })}
                      className="w-full bg-slate-50 border border-red-200 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-red-500"
                    >
                      <option value="IN_STOCK_US">IN_STOCK_US (Importación / Preventa)</option>
                      <option value="IN_STOCK_CR">IN_STOCK_CR (Taller Santa Ana)</option>
                      <option value="SPECIAL_ORDER">SPECIAL_ORDER (Pedido Especial)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Garantía Técnica <span className="text-red-500">*</span>:
                    </label>
                    <select
                      value={productForm.warrantyCategory}
                      onChange={(e) => setProductForm({ ...productForm, warrantyCategory: e.target.value })}
                      className="w-full bg-slate-50 border border-red-200 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-red-500"
                    >
                      <option value="BOLT_ON_ELECTRICAL">BOLT_ON_ELECTRICAL (Garantía Eléctrica/Directa)</option>
                      <option value="MECHANICAL_DRIVETRAIN">MECHANICAL_DRIVETRAIN (Tren Motriz/Clutch)</option>
                      <option value="ECU_TUNING">ECU_TUNING (Reprogramación Vitalicia)</option>
                      <option value="PARTS_ONLY">PARTS_ONLY (Solo Pieza / Fábrica)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Disponibilidad y Seguimiento del Proveedor (Live Supplier Integration & 8h Sync) */}
              <div className="p-6 rounded-3xl bg-white border border-red-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-red-100 pb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#C02030]" />
                    <span>
                      {lang === "es" ? "Disponibilidad & Seguimiento del Proveedor" : "Supplier Availability & Price Sync"}
                    </span>
                  </span>
                  {productForm.supplierStockCheckedAt && (
                    <span className="text-[10px] font-mono text-slate-500">
                      {lang === "es" ? "Última sync" : "Last sync"}: {new Date(productForm.supplierStockCheckedAt).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Supplier URL Input + Test Button */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {lang === "es" ? "Enlace Oficial del Producto" : "Official Supplier Product Link"} (<span className="font-mono text-[#C02030]">supplierUrl</span>):
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={productForm.supplierUrl}
                      onChange={(e) => setProductForm({ ...productForm, supplierUrl: e.target.value })}
                      onPaste={(e) => {
                        const pasted = e.clipboardData?.getData("text")?.trim();
                        if (pasted && /^https?:\/\//i.test(pasted)) {
                          setTimeout(() => syncSupplierUrlPrice(pasted, false), 120);
                        }
                      }}
                      onBlur={(e) => {
                        const urlVal = e.target.value.trim();
                        if (urlVal && /^https?:\/\//i.test(urlVal) && (!editingProduct || urlVal !== editingProduct.supplierUrl)) {
                          syncSupplierUrlPrice(urlVal, true);
                        }
                      }}
                      placeholder="https://bikemanperformance.com/products/... o https://ggbexhaust.com/products/..."
                      className="flex-1 bg-slate-50 border border-red-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="button"
                      disabled={testingSupplier || !productForm.supplierUrl.trim()}
                      onClick={() => syncSupplierUrlPrice(productForm.supplierUrl, false)}
                      className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testingSupplier ? "animate-spin text-[#C02030]" : ""}`} />
                      <span>
                        {testingSupplier
                          ? lang === "es"
                            ? "Verificando..."
                            : "Checking..."
                          : lang === "es"
                          ? "Probar y Sincronizar"
                          : "Test & Sync Price"}
                      </span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {lang === "es"
                      ? `Al ingresar o sincronizar el enlace del proveedor, el precio en USD se asigna automáticamente a P_price_D (y P_price en ₡ a tasa BCCR ₡${liveExchangeRate.toFixed(2)}).`
                      : `When entering or syncing the supplier link, the USD price automatically updates P_price_D (and P_price in ₡ at BCCR rate ₡${liveExchangeRate.toFixed(2)}).`}
                  </p>
                </div>

                {/* Live Supplier Results Preview Box */}
                {supplierTestResult && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {lang === "es" ? "Resultado de Detección:" : "Detection Result:"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 text-slate-800">
                        {supplierTestResult.platform}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">
                          {lang === "es" ? "Estado Stock:" : "Stock Status:"}
                        </span>
                        <span className="font-bold font-mono text-[#C02030]">{supplierTestResult.status}</span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">
                          {lang === "es" ? "Precio USD (P_price_D):" : "USD Price (P_price_D):"}
                        </span>
                        <span className="font-bold font-mono text-emerald-700">
                          {supplierTestResult.supplierPriceUSD ? `$${supplierTestResult.supplierPriceUSD}` : "N/D"}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">
                          {lang === "es" ? "Días Entrega:" : "Lead Days:"}
                        </span>
                        <span className="font-bold font-mono text-slate-800">
                          {supplierTestResult.leadDaysMin} - {supplierTestResult.leadDaysMax} d
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">
                          {lang === "es" ? "Disponible:" : "Available:"}
                        </span>
                        <span className="font-bold font-mono text-slate-800">
                          {supplierTestResult.available ? (lang === "es" ? "SÍ" : "YES") : "NO"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status & Lead Days */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      {lang === "es" ? "Estado Proyectado en Web:" : "Projected Web Status:"}
                    </label>
                    <select
                      value={productForm.supplierStockStatus}
                      onChange={(e) => setProductForm({ ...productForm, supplierStockStatus: e.target.value })}
                      className="w-full bg-slate-50 border border-red-200 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-red-500"
                    >
                      <option value="IN_STOCK">IN_STOCK ({lang === "es" ? "En Stock con Proveedor" : "In Stock with Supplier"})</option>
                      <option value="PRE_ORDER">PRE_ORDER ({lang === "es" ? "Preventa de Fábrica" : "Factory Pre-Order"})</option>
                      <option value="LOW_STOCK">LOW_STOCK ({lang === "es" ? "Últimas Unidades" : "Low Stock"})</option>
                      <option value="OUT_OF_STOCK">OUT_OF_STOCK ({lang === "es" ? "Agotado - Cotización Reserva" : "Out of Stock"})</option>
                      <option value="UNAVAILABLE">UNAVAILABLE ({lang === "es" ? "No Disponible" : "Unavailable"})</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      {lang === "es" ? "Días Mínimos Entrega:" : "Min Delivery Days:"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={productForm.supplierLeadDaysMin}
                      onChange={(e) => setProductForm({ ...productForm, supplierLeadDaysMin: e.target.value })}
                      className="w-full bg-slate-50 border border-red-200 rounded-xl p-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-red-500 text-center"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      {lang === "es" ? "Días Máximos Entrega:" : "Max Delivery Days:"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={productForm.supplierLeadDaysMax}
                      onChange={(e) => setProductForm({ ...productForm, supplierLeadDaysMax: e.target.value })}
                      className="w-full bg-slate-50 border border-red-200 rounded-xl p-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-red-500 text-center"
                    />
                  </div>
                </div>

                {/* Last Supplier Price USD */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      {lang === "es" ? "Precio del Proveedor (USD $) → P_price_D:" : "Supplier Price (USD $) → P_price_D:"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.supplierLastPriceUSD}
                      onChange={(e) => {
                        const rawVal = e.target.value;
                        const numVal = parseFloat(rawVal);
                        setProductForm((prev) => {
                          const hasValid = Number.isFinite(numVal) && numVal >= 0;
                          const nextPPriceCRC = hasValid && numVal > 0 ? Math.round(numVal * (liveExchangeRate || 455.21)) : prev.P_price;
                          return {
                            ...prev,
                            supplierLastPriceUSD: rawVal,
                            P_price_D: hasValid ? numVal : prev.P_price_D,
                            P_price: nextPPriceCRC,
                          };
                        });
                      }}
                      placeholder="e.g. 979.95"
                      className="w-full bg-slate-50 border border-red-200 rounded-xl p-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      {lang === "es" ? "Plataforma Detectada:" : "Detected Platform:"}
                    </label>
                    <input
                      type="text"
                      value={productForm.supplierPlatform}
                      onChange={(e) => setProductForm({ ...productForm, supplierPlatform: e.target.value })}
                      placeholder="SHOPIFY, SCHEMA_ORG, MANUAL"
                      className="w-full bg-slate-50 border border-red-200 rounded-xl p-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* FULL PRICING BREAKDOWN (price) */}
              <div className="p-6 rounded-3xl bg-white border border-red-200 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-red-100 pb-2">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-[#C02030]" />
                    <span>{t.devPriceBreakdownTitle}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-[#C02030]">
                    {lang === "es" ? "Total Tienda" : "Store Total"}: {formatCRC(recalculateTPrice(productForm.P_price, productForm.S_price, productForm.profit, productForm.I_price, productForm.I_price_includes, productForm.discountPercent, productForm.ivaPercent ?? 13))}
                  </span>
                </div>

                {/* Important Notice regarding Dollar Pricing & Locked T_price */}
                <div className="p-3.5 bg-red-50/80 rounded-2xl border border-red-200/90 text-[11px] text-[#A01825] leading-relaxed flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#C02030] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">
                      {lang === "es"
                        ? "Sistema de Precios en Dólares ($ USD) con T_price Bloqueado y Precaución del 15%"
                        : "USD ($) Pricing System with Locked T_price & 15% Profit Precaution"}
                    </p>
                    <p className="text-[11px] text-[#A01825]">
                      {lang === "es"
                        ? "Ingresa el costo del producto (P_price_D) y el envío (S_price) en dólares ($ USD); ambos se traducen automáticamente según el valor actual del dólar. Al guardar en creación o edición, el precio público con impuestos (T_price) queda bloqueado para no confundir al cliente, y cualquier fluctuación del dólar se refleja directamente en la ganancia."
                        : "Enter the product cost (P_price_D) and shipping (S_price) in US Dollars ($ USD); both translate automatically using the live dollar rate. Once saved on creation or edit, the total price with taxes (T_price) is locked for customers, and any dollar fluctuation is absorbed by the profit."}
                    </p>
                    <p className="text-[10px] text-red-700/90 font-mono">
                      {lang === "es" ? "Tipo de Cambio Venta BCCR Actual" : "Current BCCR Sell Exchange Rate"}:{" "}
                      <span className="font-extrabold">₡{liveExchangeRate.toFixed(2)} / $1 USD</span> ·{" "}
                      <span className="font-bold">Alerta de precaución si la ganancia cae ≥ 15% (≤ 85% de la ganancia inicial)</span>
                    </p>
                  </div>
                </div>

                {/* Live Profit Fluctuation Status when editing an existing product */}
                {editingProduct && (() => {
                  const liveInfo = computeProductLivePricing(editingProduct, liveExchangeRate);
                  return (
                    <div
                      className={`p-4 rounded-2xl border space-y-2.5 ${
                        liveInfo.hasProfitAlert
                          ? "bg-rose-50/90 border-rose-300 text-rose-950"
                          : liveInfo.profitDeltaCRC < 0
                          ? "bg-amber-50/80 border-amber-200 text-amber-950"
                          : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {liveInfo.hasProfitAlert ? (
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          <span className="text-xs font-extrabold uppercase tracking-wider">
                            {liveInfo.hasProfitAlert
                              ? lang === "es"
                                ? "⚠️ Alerta de Precaución: Pérdida de Ganancia ≥ 15% por Dólar"
                                : "⚠️ Precaution Alert: Profit Loss ≥ 15% from Dollar Fluctuation"
                              : lang === "es"
                              ? "Estado Actual del Precio Bloqueado vs Dólar Hoy"
                              : "Current Locked Price vs Live Dollar Status"}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-full border ${
                            liveInfo.hasProfitAlert
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : liveInfo.profitDeltaCRC < 0
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-emerald-100 text-emerald-800 border-emerald-300"
                          }`}
                        >
                          {liveInfo.profitChangePercent >= 0 ? `+${liveInfo.profitChangePercent}%` : `${liveInfo.profitChangePercent}%`}{" "}
                          ({liveInfo.profitDeltaCRC >= 0 ? `+${formatCRC(liveInfo.profitDeltaCRC)}` : formatCRC(liveInfo.profitDeltaCRC)})
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                        <div className="p-2.5 rounded-xl bg-white/90 border border-black/5">
                          <span className="text-[10px] font-bold text-slate-500 block">
                            {lang === "es" ? "T_price Bloqueado Actual" : "Current Locked T_price"}
                          </span>
                          <span className="text-xs font-black font-mono text-slate-900">
                            {formatCRC(liveInfo.lockedTPriceCRC)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/90 border border-black/5">
                          <span className="text-[10px] font-bold text-slate-500 block">
                            {lang === "es" ? "Ganancia Inicial Fijada" : "Initial Set Profit"}
                          </span>
                          <span className="text-xs font-bold font-mono text-slate-700">
                            {formatCRC(liveInfo.initialProfitCRC)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/90 border border-black/5">
                          <span className="text-[10px] font-bold text-slate-500 block">
                            {lang === "es" ? "Ganancia Real Hoy (con Dólar)" : "Live Profit Today (USD Adj.)"}
                          </span>
                          <span
                            className={`text-xs font-black font-mono ${
                              liveInfo.hasProfitAlert
                                ? "text-rose-700"
                                : liveInfo.profitDeltaCRC < 0
                                ? "text-amber-700"
                                : "text-emerald-700"
                            }`}
                          >
                            {formatCRC(liveInfo.effectiveProfitCRC)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/90 border border-black/5">
                          <span className="text-[10px] font-bold text-slate-500 block">
                            {lang === "es" ? "Umbral Precaución (85%)" : "Precaution Threshold (85%)"}
                          </span>
                          <span className="text-xs font-bold font-mono text-slate-800">
                            {formatCRC(liveInfo.alertThresholdProfitCRC)}
                          </span>
                        </div>
                      </div>

                      {liveInfo.hasProfitAlert && (
                        <p className="text-[11px] font-semibold text-rose-800">
                          {lang === "es"
                            ? `La ganancia real cayó un ${liveInfo.profitLossPercent}% (a ${formatCRC(liveInfo.effectiveProfitCRC)}, por debajo del límite de ${formatCRC(liveInfo.alertThresholdProfitCRC)}). Al guardar este formulario, el T_price se actualizará y bloqueará en ${formatCRC(recalculateTPrice(productForm.P_price, productForm.S_price, productForm.profit, productForm.I_price, productForm.I_price_includes, productForm.discountPercent, productForm.ivaPercent ?? 13))} recuperando el 100% de la ganancia.`
                            : `Real profit dropped by ${liveInfo.profitLossPercent}% (to ${formatCRC(liveInfo.effectiveProfitCRC)}, below the ${formatCRC(liveInfo.alertThresholdProfitCRC)} threshold). Saving this form will re-lock T_price and restore 100% of target profit.`}
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Base Costs Grid - Editable by Staff & Master in USD ($), Auto-Translated to CRC (₡) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* P_price_D (Acquisition in USD -> translates to P_price in CRC) */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-red-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                        <span>{lang === "es" ? "Precio del Producto en Dólares (P_price_D)" : "Product Price in USD (P_price_D)"}</span>
                      </label>
                      <span className="text-xs font-extrabold font-mono text-[#C02030] bg-red-50 px-2 py-0.5 rounded-lg border border-red-200">
                        ${Number(productForm.P_price_D || 0).toFixed(2)} USD → {formatCRC(productForm.P_price)}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold font-mono text-slate-500">$</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={productForm.P_price_D}
                        onChange={(e) => {
                          const usdVal = parseFloat(e.target.value) || 0;
                          const rate = liveExchangeRate > 300 ? liveExchangeRate : 455.21;
                          const translatedCRC = Math.round(usdVal * rate);
                          setProductForm((prev) => {
                            const ivaRate = prev.ivaPercent ?? 13;
                            return {
                              ...prev,
                              P_price_D: usdVal,
                              supplierLastPriceUSD: usdVal > 0 ? usdVal : prev.supplierLastPriceUSD,
                              P_price: translatedCRC,
                              ivaCRC: calculateIvaAmount(translatedCRC, prev.S_price, prev.profit, prev.I_price, prev.I_price_includes, prev.discountPercent, ivaRate),
                              priceCRC: recalculateTPrice(translatedCRC, prev.S_price, prev.profit, prev.I_price, prev.I_price_includes, prev.discountPercent, ivaRate),
                              T_price: recalculateTPrice(translatedCRC, prev.S_price, prev.profit, prev.I_price, prev.I_price_includes, prev.discountPercent, ivaRate),
                            };
                          });
                        }}
                        className="w-full bg-white border border-red-200 rounded-xl pl-7 pr-14 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-red-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold font-mono text-slate-400">USD</span>
                    </div>
                    <p className="text-[9px] text-slate-500">
                      {lang === "es"
                        ? `En $ USD · Se traduce automáticamente a P_price (${formatCRC(productForm.P_price)}) a ₡${liveExchangeRate.toFixed(2)}/$1`
                        : `In $ USD · Auto-translates to P_price (${formatCRC(productForm.P_price)}) at ₡${liveExchangeRate.toFixed(2)}/$1`}
                    </p>
                  </div>

                  {/* S_price / S_price_D (Shipping in USD -> translates to S_price in CRC) */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-red-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                        <span>{lang === "es" ? "Precio de Envío en Dólares (S_price USD)" : "Shipping Price in USD (S_price USD)"}</span>
                      </label>
                      <span className="text-xs font-extrabold font-mono text-[#C02030] bg-red-50 px-2 py-0.5 rounded-lg border border-red-200">
                        ${Number(productForm.S_price_D || 0).toFixed(2)} USD → {formatCRC(productForm.S_price)}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold font-mono text-slate-500">$</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={productForm.S_price_D}
                        onChange={(e) => {
                          const usdVal = parseFloat(e.target.value) || 0;
                          const rate = liveExchangeRate > 300 ? liveExchangeRate : 455.21;
                          const translatedCRC = Math.round(usdVal * rate);
                          setProductForm((prev) => {
                            const ivaRate = prev.ivaPercent ?? 13;
                            return {
                              ...prev,
                              S_price_D: usdVal,
                              S_price: translatedCRC,
                              ivaCRC: calculateIvaAmount(prev.P_price, translatedCRC, prev.profit, prev.I_price, prev.I_price_includes, prev.discountPercent, ivaRate),
                              priceCRC: recalculateTPrice(prev.P_price, translatedCRC, prev.profit, prev.I_price, prev.I_price_includes, prev.discountPercent, ivaRate),
                              T_price: recalculateTPrice(prev.P_price, translatedCRC, prev.profit, prev.I_price, prev.I_price_includes, prev.discountPercent, ivaRate),
                            };
                          });
                        }}
                        className="w-full bg-white border border-red-200 rounded-xl pl-7 pr-14 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-red-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold font-mono text-slate-400">USD</span>
                    </div>
                    <p className="text-[9px] text-slate-500">
                      {lang === "es"
                        ? `Flete e impuestos en $ USD · Se traduce a S_price (${formatCRC(productForm.S_price)}) a ₡${liveExchangeRate.toFixed(2)}/$1`
                        : `Shipping & customs in $ USD · Auto-translates to S_price (${formatCRC(productForm.S_price)}) at ₡${liveExchangeRate.toFixed(2)}/$1`}
                    </p>
                  </div>

                  {/* Translated Colones Summary / Direct CRC Reference (P_price & S_price in CRC) */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700">
                        {lang === "es" ? "Conversión a Colones (P_price + S_price)" : "Colones Conversion (P_price + S_price)"}
                      </label>
                      <button
                        type="button"
                        onClick={async () => {
                          const latestRate = await refreshLiveExchangeRate();
                          const rate = latestRate > 300 ? latestRate : (liveExchangeRate > 300 ? liveExchangeRate : 455.21);
                          const nextP = productForm.P_price_D > 0 ? Math.round(Number(productForm.P_price_D) * rate) : 0;
                          const nextS = productForm.S_price_D > 0 ? Math.round(Number(productForm.S_price_D) * rate) : 0;
                          setProductForm((prev) => {
                            const ivaRate = prev.ivaPercent ?? 13;
                            return {
                              ...prev,
                              P_price: nextP,
                              S_price: nextS,
                              ivaCRC: calculateIvaAmount(nextP, nextS, prev.profit, prev.I_price, prev.I_price_includes, prev.discountPercent, ivaRate),
                              priceCRC: recalculateTPrice(nextP, nextS, prev.profit, prev.I_price, prev.I_price_includes, prev.discountPercent, ivaRate),
                              T_price: recalculateTPrice(nextP, nextS, prev.profit, prev.I_price, prev.I_price_includes, prev.discountPercent, ivaRate),
                            };
                          });
                        }}
                        className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>{lang === "es" ? "Sincronizar con Dólar Hoy" : "Sync with Live USD"}</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white border border-slate-200 rounded-xl p-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">P_price (₡)</span>
                        <span className="text-xs font-mono font-extrabold text-slate-900">{formatCRC(productForm.P_price)}</span>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">S_price (₡)</span>
                        <span className="text-xs font-mono font-extrabold text-slate-900">{formatCRC(productForm.S_price)}</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400">
                      {lang === "es"
                        ? `Costo Total Base USD: $${(Number(productForm.P_price_D || 0) + Number(productForm.S_price_D || 0)).toFixed(2)} = ${formatCRC((Number(productForm.P_price) || 0) + (Number(productForm.S_price) || 0))}`
                        : `Total Base USD Cost: $${(Number(productForm.P_price_D || 0) + Number(productForm.S_price_D || 0)).toFixed(2)} = ${formatCRC((Number(productForm.P_price) || 0) + (Number(productForm.S_price) || 0))}`}
                    </p>
                  </div>

                  {/* profit (Profit Margin in CRC) */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-red-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                        <span>{lang === "es" ? "Margen de Ganancia Inicial (profit ₡)" : "Initial Target Profit (profit ₡)"}</span>
                      </label>
                      <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        {formatCRC(productForm.profit)}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={productForm.profit}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setProductForm((prev) => {
                          const ivaRate = prev.ivaPercent ?? 13;
                          return {
                            ...prev,
                            profit: val,
                            ivaCRC: calculateIvaAmount(prev.P_price, prev.S_price, val, prev.I_price, prev.I_price_includes, prev.discountPercent, ivaRate),
                            priceCRC: recalculateTPrice(prev.P_price, prev.S_price, val, prev.I_price, prev.I_price_includes, prev.discountPercent, ivaRate),
                            T_price: recalculateTPrice(prev.P_price, prev.S_price, val, prev.I_price, prev.I_price_includes, prev.discountPercent, ivaRate),
                          };
                        });
                      }}
                      className="w-full bg-white border border-red-200 rounded-xl p-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-red-500"
                    />
                    <p className="text-[9px] text-slate-500">
                      {lang === "es"
                        ? `Ganancia inicial en ₡ · Alerta de precaución (-15%) si baja a ${formatCRC(Math.round((Number(productForm.profit) || 0) * 0.85))} o menos`
                        : `Initial profit in ₡ · Precaution alert (-15%) triggers if it drops to ${formatCRC(Math.round((Number(productForm.profit) || 0) * 0.85))} or lower`}
                    </p>
                  </div>
                </div>

                {/* I_price (Installation & Labor Breakdown - Editable by Staff & Master) */}
                <InstallationBreakdownEditor
                  labourCostCRC={productForm.installLabourCostCRC}
                  extraParts={productForm.installExtraParts}
                  profitCRC={productForm.installProfitCRC}
                  totalCostCRC={productForm.I_price}
                  durationMinutes={productForm.installationDurationMinutes}
                  onDurationChange={(mins) => setProductForm((prev) => ({ ...prev, installationDurationMinutes: mins }))}
                  lang={lang}
                  t={t}
                  showIncludeCheckbox={true}
                  isIncluded={productForm.I_price_includes}
                  onToggleInclude={(val) => {
                    setProductForm((prev) => {
                      const ivaRate = prev.ivaPercent ?? 13;
                      return {
                        ...prev,
                        I_price_includes: val,
                        isInstallationIncluded: val,
                        ivaCRC: calculateIvaAmount(prev.P_price, prev.S_price, prev.profit, prev.I_price, val, prev.discountPercent, ivaRate),
                        priceCRC: recalculateTPrice(prev.P_price, prev.S_price, prev.profit, prev.I_price, val, prev.discountPercent, ivaRate),
                        T_price: recalculateTPrice(prev.P_price, prev.S_price, prev.profit, prev.I_price, val, prev.discountPercent, ivaRate),
                      };
                    });
                  }}
                  onChange={(labour, parts, profit) => {
                    const partsTotal = (parts || []).reduce((sum, pt) => sum + (Number(pt.priceCRC) || 0), 0);
                    const totalInstall = Math.max(0, labour) + Math.max(0, partsTotal) + Math.max(0, profit);
                    setProductForm((prev) => {
                      const ivaRate = prev.ivaPercent ?? 13;
                      return {
                        ...prev,
                        installLabourCostCRC: labour,
                        installExtraParts: parts,
                        installProfitCRC: profit,
                        I_price: totalInstall,
                        installationPriceCRC: totalInstall,
                        ivaCRC: calculateIvaAmount(prev.P_price, prev.S_price, prev.profit, totalInstall, prev.I_price_includes, prev.discountPercent, ivaRate),
                        priceCRC: recalculateTPrice(prev.P_price, prev.S_price, prev.profit, totalInstall, prev.I_price_includes, prev.discountPercent, ivaRate),
                        T_price: recalculateTPrice(prev.P_price, prev.S_price, prev.profit, totalInstall, prev.I_price_includes, prev.discountPercent, ivaRate),
                      };
                    });
                  }}
                />

                {/* Product Percentage Discount Section (User Requirement: Percentage Only) */}
                <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-purple-600" />
                      <span>{t.devProductDiscountPercent || "Descuento del Producto (% OFF)"}</span>
                    </label>
                    {productForm.discountPercent > 0 ? (
                      <span className="text-xs font-extrabold font-mono text-purple-800 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded-full">
                        -{productForm.discountPercent}% OFF
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-500">
                        {t.devProductNoDiscount || "Sin Descuento (0%)"}
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-purple-900/80 leading-snug">
                    {t.devProductDiscountHelp || "Aplica un descuento porcentual directo al precio final de venta del producto."}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={productForm.discountPercent || ""}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(99, parseInt(e.target.value) || 0));
                            setProductForm((prev) => {
                              const ivaRate = prev.ivaPercent ?? 13;
                              return {
                                ...prev,
                                discountPercent: val,
                                ivaCRC: calculateIvaAmount(prev.P_price, prev.S_price, prev.profit, prev.I_price, prev.I_price_includes, val, ivaRate),
                                priceCRC: recalculateTPrice(prev.P_price, prev.S_price, prev.profit, prev.I_price, prev.I_price_includes, val, ivaRate),
                                T_price: recalculateTPrice(prev.P_price, prev.S_price, prev.profit, prev.I_price, prev.I_price_includes, val, ivaRate),
                              };
                            });
                          }}
                          placeholder="0"
                          className="w-full bg-white border border-purple-300 rounded-xl p-2.5 pr-8 text-xs font-mono font-bold text-purple-950 focus:outline-none focus:border-purple-600"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold font-mono text-purple-500">
                          %
                        </span>
                      </div>

                      {/* Clear / Reset button */}
                      {productForm.discountPercent > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setProductForm((prev) => {
                              const ivaRate = prev.ivaPercent ?? 13;
                              return {
                                ...prev,
                                discountPercent: 0,
                                ivaCRC: calculateIvaAmount(prev.P_price, prev.S_price, prev.profit, prev.I_price, prev.I_price_includes, 0, ivaRate),
                                priceCRC: recalculateTPrice(prev.P_price, prev.S_price, prev.profit, prev.I_price, prev.I_price_includes, 0, ivaRate),
                                T_price: recalculateTPrice(prev.P_price, prev.S_price, prev.profit, prev.I_price, prev.I_price_includes, 0, ivaRate),
                              };
                            });
                          }}
                          className="px-3 py-2.5 rounded-xl bg-white border border-purple-200 text-purple-700 hover:bg-purple-100 text-xs font-bold transition-colors cursor-pointer flex-shrink-0"
                        >
                          {t.checkoutDiscountRemoveBtn || "Quitar"}
                        </button>
                      )}
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {[0, 5, 10, 15, 20, 25, 30].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => {
                            setProductForm((prev) => {
                              const ivaRate = prev.ivaPercent ?? 13;
                              return {
                                ...prev,
                                discountPercent: pct,
                                ivaCRC: calculateIvaAmount(prev.P_price, prev.S_price, prev.profit, prev.I_price, prev.I_price_includes, pct, ivaRate),
                                priceCRC: recalculateTPrice(prev.P_price, prev.S_price, prev.profit, prev.I_price, prev.I_price_includes, pct, ivaRate),
                                T_price: recalculateTPrice(prev.P_price, prev.S_price, prev.profit, prev.I_price, prev.I_price_includes, pct, ivaRate),
                              };
                            });
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-colors cursor-pointer ${
                            productForm.discountPercent === pct
                              ? "bg-purple-700 text-white shadow-2xs"
                              : "bg-white hover:bg-purple-100 text-purple-900 border border-purple-200"
                          }`}
                        >
                          {pct === 0 ? (t.devProductNoDiscount || "0%") : `${pct}%`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* IVA Variable (13% - Impuesto sobre el Valor Agregado Incluido) */}
                <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-blue-600" />
                      <span>{t.devProductIvaTitle || "IVA (13% - Impuesto sobre el Valor Agregado)"}</span>
                    </label>
                    <span className="text-xs font-extrabold font-mono text-blue-900 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full">
                      +{formatCRC(calculateIvaAmount(productForm.P_price, productForm.S_price, productForm.profit, productForm.I_price, productForm.I_price_includes, productForm.discountPercent, productForm.ivaPercent ?? 13))}
                    </span>
                  </div>

                  <p className="text-[10px] text-blue-900/80 leading-snug">
                    {t.devProductIvaHelp || "Al crear o editar el producto se calcula automáticamente el 13% de IVA sobre el subtotal y se suma para obtener el Precio Total Verdadero (T_price). En la tienda y checkout se indica que el precio ya incluye el IVA."}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-blue-950 block">
                        Porcentaje de IVA (%):
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={productForm.ivaPercent ?? 13}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setProductForm((prev) => ({
                              ...prev,
                              ivaPercent: val,
                              ivaCRC: calculateIvaAmount(prev.P_price, prev.S_price, prev.profit, prev.I_price, prev.I_price_includes, prev.discountPercent, val),
                              priceCRC: recalculateTPrice(prev.P_price, prev.S_price, prev.profit, prev.I_price, prev.I_price_includes, prev.discountPercent, val),
                              T_price: recalculateTPrice(prev.P_price, prev.S_price, prev.profit, prev.I_price, prev.I_price_includes, prev.discountPercent, val),
                            }));
                          }}
                          className="w-full bg-white border border-blue-300 rounded-xl p-2 pr-8 text-xs font-mono font-bold text-blue-950 focus:outline-none focus:border-blue-600"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold font-mono text-blue-500">
                          %
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-blue-950 block">
                        Monto de IVA Calculado (₡):
                      </label>
                      <div className="w-full bg-blue-100/60 border border-blue-200 rounded-xl p-2 text-xs font-mono font-extrabold text-blue-900 flex items-center justify-between">
                        <span>{formatCRC(calculateIvaAmount(productForm.P_price, productForm.S_price, productForm.profit, productForm.I_price, productForm.I_price_includes, productForm.discountPercent, productForm.ivaPercent ?? 13))}</span>
                        <span className="text-[10px] text-blue-700 font-bold uppercase tracking-wider">Incluido</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* T_price (Total Selling Price in CRC - Calculated Automatically, NOT editable directly per User Rule) */}
                <div className="p-5 bg-slate-900 text-white rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-red-300 block">
                        {t.devPriceTotalCRC} (<span className="font-mono">T_price</span>)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {productForm.discountPercent > 0
                          ? `Precio final con ${productForm.discountPercent}% de descuento y ${productForm.ivaPercent ?? 13}% de IVA incluido`
                          : `Precio final con ${productForm.ivaPercent ?? 13}% de IVA incluido`}
                      </span>
                    </div>
                    <span className="text-xl font-black font-mono text-emerald-400">
                      {formatCRC(recalculateTPrice(productForm.P_price, productForm.S_price, productForm.profit, productForm.I_price, productForm.I_price_includes, productForm.discountPercent, productForm.ivaPercent ?? 13))}
                    </span>
                  </div>

                  {/* Formula Breakdown Display */}
                  <div className="p-3 bg-slate-800/90 rounded-xl border border-slate-700 text-xs font-mono space-y-1.5 text-slate-300">
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Hardware (P_price_D: ${Number(productForm.P_price_D || 0).toFixed(2)} USD):</span>
                      <span className="font-bold text-white">{formatCRC(productForm.P_price)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Flete/Aduana (S_price: ${Number(productForm.S_price_D || 0).toFixed(2)} USD):</span>
                      <span className="font-bold text-white">{formatCRC(productForm.S_price)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Margen de Ganancia Inicial (profit):</span>
                      <span className="font-bold text-white">{formatCRC(productForm.profit)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Instalación ({productForm.I_price_includes ? "Incluida en precio" : "No incluida"}):</span>
                      <span className="font-bold text-white">
                        {productForm.I_price_includes ? formatCRC(productForm.I_price) : "₡0"}
                      </span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-700 flex items-center justify-between text-slate-300 text-[11px]">
                      <span>Subtotal Base (sin IVA):</span>
                      <span className="font-bold text-white font-mono">
                        {formatCRC(getProductBasePrice(productForm.P_price, productForm.S_price, productForm.profit, productForm.I_price, productForm.I_price_includes))}
                      </span>
                    </div>
                    {productForm.discountPercent > 0 && (
                      <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px]">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3 text-emerald-400" />
                          <span>{t.devProductDiscountAmount || "Descuento Aplicado"} ({productForm.discountPercent}% OFF):</span>
                        </span>
                        <span className="font-mono">
                          -{formatCRC(
                            Math.round(
                              getProductBasePrice(productForm.P_price, productForm.S_price, productForm.profit, productForm.I_price, productForm.I_price_includes) * (productForm.discountPercent / 100)
                            )
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-blue-400 font-bold text-[11px]">
                      <span className="flex items-center gap-1">
                        <Receipt className="w-3 h-3 text-blue-400" />
                        <span>IVA ({productForm.ivaPercent ?? 13}% Incluido):</span>
                      </span>
                      <span className="font-mono">
                        +{formatCRC(calculateIvaAmount(productForm.P_price, productForm.S_price, productForm.profit, productForm.I_price, productForm.I_price_includes, productForm.discountPercent, productForm.ivaPercent ?? 13))}
                      </span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-700 flex items-center justify-between font-bold text-emerald-400 text-xs">
                      <span>Total Verdadero con IVA (T_price):</span>
                      <span className="text-sm font-mono">
                        {formatCRC(recalculateTPrice(productForm.P_price, productForm.S_price, productForm.profit, productForm.I_price, productForm.I_price_includes, productForm.discountPercent, productForm.ivaPercent ?? 13))}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">
                    ℹ️ El precio final de venta al público se calcula directamente a partir de la suma de sus componentes menos el descuento porcentual configurado.
                  </p>
                </div>
              </div>

              {/* CONFIGURABLE PARAMETERS & VARIANTS */}
              <ParametersEditorSection
                parameters={productForm.parameters}
                onChange={(newParams) => setProductForm((prev) => ({ ...prev, parameters: newParams }))}
                t={t}
                availableProducts={products.filter((p) => (p.sku || p.id) !== (productForm.sku || productForm.slug))}
                currentProductPrice={productForm.T_price || productForm.priceCRC}
                currentProductName={productForm.nameEs || productForm.p_title}
                currentProductSku={productForm.sku}
                currentProductImage={productForm.imageUrl || parsedImgsList[0] || ""}
                currentProductSupplierUrl={productForm.supplierUrl || ""}
                liveExchangeRate={liveExchangeRate || 515}
              />

              {/* Services & Toggles (inHome_install & featured) */}
              <div className="p-5 rounded-3xl bg-white border border-red-200 shadow-sm space-y-3">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 border-b border-red-100 pb-2">
                  <Home className="w-4 h-4 text-[#C02030]" />
                  <span>Servicios Adicionales & Visibilidad</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* inHome_install */}
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-red-100 hover:border-red-300 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={productForm.inHome_install}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          inHome_install: e.target.checked,
                          homeInstallationAvailable: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-[#C02030] focus:ring-0 cursor-pointer"
                    />
                    <div className="text-left flex-1">
                      <span className="text-xs font-bold text-slate-900 block">
                        Instalación a Domicilio
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        inHome_install: {productForm.inHome_install ? "true" : "false"}
                      </span>
                    </div>
                  </label>

                  {/* featured */}
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-red-100 hover:border-red-300 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={productForm.featured}
                      onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                      className="w-4 h-4 rounded text-[#C02030] focus:ring-0 cursor-pointer"
                    />
                    <div className="text-left flex-1">
                      <span className="text-xs font-bold text-slate-900 block">
                        Destacado en Inicio
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        featured: {productForm.featured ? "true" : "false"}
                      </span>
                    </div>
                  </label>

                  {/* voidsWarranty (User Requirement: Voids Dealer Warranty) */}
                  <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition sm:col-span-2 ${
                    productForm.voidsWarranty ? "bg-amber-50/80 border-amber-300 ring-1 ring-amber-300" : "bg-slate-50 border-red-100 hover:border-red-300"
                  }`}>
                    <input
                      type="checkbox"
                      checked={productForm.voidsWarranty}
                      onChange={(e) => setProductForm({ ...productForm, voidsWarranty: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-0 cursor-pointer mt-0.5"
                    />
                    <div className="text-left flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 block">
                          {t.devVoidsWarrantyLabel}
                        </span>
                        {productForm.voidsWarranty && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-amber-600" />
                            <span>{t.devVoidsWarrantyBadge}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        {t.devVoidsWarrantyDesc}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono block mt-1">
                        voidsWarranty: {productForm.voidsWarranty ? "true" : "false"}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* HIGHLY RELATED / RECOMMENDED PRODUCTS SECTION (User Requirement) */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-red-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-red-100 pb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C02030]" />
                    <span>{t.devRelatedProductsTitle}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {(productForm.relatedProductIds || []).length} {lang === "es" ? "seleccionado(s)" : "selected"}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {t.devRelatedProductsDesc}
                </p>

                {/* Search & Add Picker */}
                <div className="relative">
                  <div className="flex items-center gap-2 bg-slate-50 border border-red-200 rounded-2xl p-2.5 focus-within:border-red-500 transition">
                    <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                    <input
                      type="text"
                      value={relatedProductSearch}
                      onChange={(e) => {
                        setRelatedProductSearch(e.target.value);
                        setIsRelatedSearchDropdownOpen(true);
                      }}
                      onFocus={() => setIsRelatedSearchDropdownOpen(true)}
                      placeholder={t.devAddRelatedProductPlaceholder}
                      className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    />
                    {relatedProductSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setRelatedProductSearch("");
                          setIsRelatedSearchDropdownOpen(false);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Results */}
                  {isRelatedSearchDropdownOpen && relatedProductSearch.trim().length > 0 && (
                    <div className="absolute z-20 left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {products
                        .filter((p) => {
                          if (editingProduct && (p.id === editingProduct.id || p.sku === editingProduct.sku)) return false;
                          if ((productForm.relatedProductIds || []).includes(p.id) || (p.sku && (productForm.relatedProductIds || []).includes(p.sku))) return false;
                          const q = normalizeSearchStr(relatedProductSearch).trim();
                          const haystack = normalizeSearchStr(
                            [p.nameEs, p.nameEn, p.p_title, p.sku, p.slug, p.brandName, ...(Array.isArray(p.brand) ? p.brand : [])].join(" ")
                          );
                          return haystack.includes(q);
                        })
                        .slice(0, 8)
                        .map((candidate) => (
                          <button
                            key={candidate.id}
                            type="button"
                            onClick={() => {
                              const idToAdd = candidate.id;
                              setProductForm((prev) => ({
                                ...prev,
                                relatedProductIds: Array.from(new Set([...(prev.relatedProductIds || []), idToAdd])),
                              }));
                              setRelatedProductSearch("");
                              setIsRelatedSearchDropdownOpen(false);
                            }}
                            className="w-full p-2.5 text-left hover:bg-red-50 flex items-center justify-between gap-3 transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 p-0.5 flex items-center justify-center shrink-0">
                                <img
                                  src={candidate.imageUrl || "/images/logo.png"}
                                  alt=""
                                  className="max-h-full max-w-full object-contain"
                                />
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-800 block truncate">
                                  {lang === "es" ? (candidate.nameEs || candidate.p_title || candidate.nameEn) : (candidate.nameEn || candidate.nameEs || candidate.p_title)}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  #{candidate.sku} · {formatCRC(candidate.priceCRC || candidate.price?.T_price || 0)}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-[#C02030] bg-red-100/60 px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0">
                              <Plus className="w-3 h-3" />
                              <span>{lang === "es" ? "Agregar" : "Add"}</span>
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                {/* Selected Related Products List */}
                <div className="space-y-2">
                  {(productForm.relatedProductIds || []).length === 0 ? (
                    <div className="p-4 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400">
                      {t.devNoRelatedProducts}
                    </div>
                  ) : (
                    (productForm.relatedProductIds || []).map((relId, idx) => {
                      const matchedProd = products.find((p) => p.id === relId || p.sku === relId || p.slug === relId);
                      return (
                        <div
                          key={relId || idx}
                          className="p-2.5 bg-slate-50 rounded-2xl border border-red-100 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
                              <img
                                src={matchedProd?.imageUrl || "/images/logo.png"}
                                alt=""
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-900 block truncate">
                                {lang === "es"
                                  ? (matchedProd?.nameEs || matchedProd?.p_title || matchedProd?.nameEn || relId)
                                  : (matchedProd?.nameEn || matchedProd?.nameEs || matchedProd?.p_title || relId)}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                                {matchedProd?.sku && <span>#{matchedProd.sku}</span>}
                                {matchedProd && (
                                  <span className="text-emerald-700 font-bold">
                                    {formatCRC(matchedProd.priceCRC || matchedProd.price?.T_price || 0)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setProductForm((prev) => ({
                                ...prev,
                                relatedProductIds: (prev.relatedProductIds || []).filter((id) => id !== relId),
                              }));
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100/60 rounded-xl transition"
                            title={lang === "es" ? "Quitar de recomendados" : "Remove from recommended"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Minimalistic Suggestions Tagger for Prevention & Performance */}
              <MinimalistSuggestionsTagger
                suggestedProductIds={productForm.suggestedProductIds || []}
                suggestedComboIds={productForm.suggestedComboIds || []}
                onUpdateProductIds={(ids) => setProductForm((prev) => ({ ...prev, suggestedProductIds: ids }))}
                onUpdateComboIds={(ids) => setProductForm((prev) => ({ ...prev, suggestedComboIds: ids }))}
                allProducts={products}
                allCombos={combos}
                currentId={editingProduct?.id}
                currentSku={editingProduct?.sku}
                t={t}
                lang={lang}
              />

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProductView(false)}
                  className="px-4 py-3 rounded-2xl bg-white border border-red-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition shadow-xs"
                >
                  {t.orderCancelBtn}
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveProduct()}
                  disabled={saving}
                  className="flex-1 py-3.5 px-6 rounded-2xl bg-[#C02030] hover:bg-[#A01825] text-white text-xs font-bold uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {saving
                      ? t.devSaving
                      : isEdit
                      ? lang === "es"
                        ? "Guardar Todos los Cambios"
                        : "Save All Changes"
                      : lang === "es"
                      ? "Publicar Nuevo Producto"
                      : "Publish New Product"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
        {renderGlobalModals()}
      </div>
    );
  }

  // =========================================================================
  // SCREEN: FULL COMBO EDIT / CREATE SCREEN (User Requirement)
  // =========================================================================
  if (isEditingComboView) {
    const isEdit = Boolean(editingCombo);
    const totalIncludedPrice = comboSelectedProducts.reduce(
      (sum, p) => sum + (p.priceCRC || p.price?.T_price || 0),
      0
    );

    const currentComboAvailability = calculateComboAvailability(
      [
        ...comboSelectedProducts,
        ...comboForm.itemsText.split("\n").map((s) => s.trim()).filter(Boolean),
      ],
      products
    );

    const handleApplyComboProductsInstall = () => {
      setComboForm((prev) => ({
        ...prev,
        installLabourCostCRC: comboProductsInstallSummary.totalLabour,
        installExtraParts: comboProductsInstallSummary.allExtraParts,
        installProfitCRC: comboProductsInstallSummary.totalProfit,
        installationPriceCRC: comboProductsInstallSummary.totalInstall,
        installationDurationMinutes: comboProductsInstallSummary.totalDuration,
      }));
      setFeedback({
        type: "success",
        msg: lang === "es"
          ? `¡Costos de instalación de los ${comboSelectedProducts.length} productos aplicados al combo! Total: ${formatCRC(comboProductsInstallSummary.totalInstall)}`
          : `Installation costs from ${comboSelectedProducts.length} products applied to combo! Total: ${formatCRC(comboProductsInstallSummary.totalInstall)}`,
      });
    };

    const filteredProductOptions: Product[] = comboProductSearch.trim()
      ? products
          .filter((p: Product) => {
            const q = normalizeSearchStr(comboProductSearch).trim();
            const haystack = normalizeSearchStr(
              [p.nameEs, p.nameEn, p.p_title, p.sku, p.slug, p.brandName, ...(Array.isArray(p.brand) ? p.brand : [])].join(" ")
            );
            return haystack.includes(q);
          })
          .slice(0, 8)
      : [];

    return (
      <div className="space-y-6">
        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 shadow-sm ${
              feedback.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="font-medium">{feedback.msg}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-bold px-2 py-0.5 rounded hover:bg-black/5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Header Sticky Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditingComboView(false)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.devBackToCatalog}</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900">
                  {isEdit
                    ? lang === "es"
                      ? `Editar Combo: ${comboForm.titleEs || "Combo"}`
                      : `Edit Combo: ${comboForm.titleEn || comboForm.titleEs || "Combo"}`
                    : t.devComboCreateScreenTitle}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider">
                  {comboForm.category || "Performance"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                slug: {comboForm.slug || "combo-slug"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingComboView(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white rounded-xl border border-slate-200 transition"
            >
              {t.orderCancelBtn}
            </button>
            <button
              type="button"
              onClick={() => handleSaveCombo()}
              disabled={saving}
              className="px-5 py-2 text-xs font-bold text-white bg-[#C02030] hover:bg-[#A01825] rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? t.devSaving : isEdit ? t.devSaveChanges : "Crear Combo"}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Combo Availability Alert / Banner Card */}
        <div className={`p-5 rounded-3xl border transition-all shadow-xs ${
          currentComboAvailability.status === "OUT_OF_STOCK" || currentComboAvailability.status === "UNAVAILABLE"
            ? "bg-rose-50/90 border-rose-300 text-rose-950"
            : currentComboAvailability.status === "PRE_ORDER"
            ? "bg-blue-50/90 border-blue-200 text-blue-950"
            : currentComboAvailability.status === "LOW_STOCK"
            ? "bg-amber-50/90 border-amber-200 text-amber-950"
            : "bg-emerald-50/90 border-emerald-200 text-emerald-950"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-2xl shrink-0 ${
                currentComboAvailability.status === "OUT_OF_STOCK" || currentComboAvailability.status === "UNAVAILABLE"
                  ? "bg-rose-600 text-white"
                  : currentComboAvailability.status === "PRE_ORDER"
                  ? "bg-blue-600 text-white"
                  : currentComboAvailability.status === "LOW_STOCK"
                  ? "bg-amber-600 text-white"
                  : "bg-emerald-600 text-white"
              }`}>
                {currentComboAvailability.status === "OUT_OF_STOCK" || currentComboAvailability.status === "UNAVAILABLE" ? (
                  <AlertCircle className="w-5 h-5" />
                ) : currentComboAvailability.status === "PRE_ORDER" ? (
                  <Calendar className="w-5 h-5" />
                ) : currentComboAvailability.status === "LOW_STOCK" ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black uppercase tracking-wider">
                    {t.devComboAvailabilityLiveTitle}:
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase font-mono ${
                    currentComboAvailability.status === "OUT_OF_STOCK" || currentComboAvailability.status === "UNAVAILABLE"
                      ? "bg-rose-200 text-rose-900 border border-rose-300"
                      : currentComboAvailability.status === "PRE_ORDER"
                      ? "bg-blue-200 text-blue-900 border border-blue-300"
                      : currentComboAvailability.status === "LOW_STOCK"
                      ? "bg-amber-200 text-amber-900 border border-amber-300"
                      : "bg-emerald-200 text-emerald-900 border border-emerald-300"
                  }`}>
                    {lang === "es" ? currentComboAvailability.summaryEs : currentComboAvailability.summaryEn}
                  </span>
                </div>
                <p className="text-xs opacity-90 leading-relaxed">
                  {lang === "es" ? currentComboAvailability.detailEs : currentComboAvailability.detailEn}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center text-xs font-mono">
              <span className="px-3 py-1.5 rounded-xl bg-white/90 border border-black/10 font-bold shadow-2xs">
                {currentComboAvailability.linkedProductsCount}/{currentComboAvailability.totalComponents} {lang === "es" ? "piezas vinculadas" : "linked parts"}
              </span>
            </div>
          </div>

          {currentComboAvailability.outOfStockComponents.length > 0 && (
            <div className="mt-3 pt-3 border-t border-rose-200/80 flex items-center gap-2 text-xs font-bold text-rose-800">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>
                {lang === "es"
                  ? `Piezas sin stock que inhabilitan este combo: ${currentComboAvailability.outOfStockComponents.map((c) => c.name).join(", ")}`
                  : `Out of stock parts disabling this combo: ${currentComboAvailability.outOfStockComponents.map((c) => c.name).join(", ")}`}
              </span>
            </div>
          )}
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Basic Info, Descriptions & Included Products */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card 1: Basic Combo Info */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Sparkles className="w-4 h-4 text-[#C02030]" />
                <span>Información Principal del Combo</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Título del Combo (Español): <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={comboForm.titleEs}
                    onChange={(e) => setComboForm({ ...comboForm, titleEs: e.target.value })}
                    placeholder="Ej: Kit Stage 2 Turbo Boost Polaris Pro R"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Título del Combo (English):
                  </label>
                  <input
                    type="text"
                    value={comboForm.titleEn}
                    onChange={(e) => setComboForm({ ...comboForm, titleEn: e.target.value })}
                    placeholder="E.g.: Stage 2 Turbo Boost Polaris Pro R Package"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Identificador Único (Slug): <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={comboForm.slug}
                    onChange={(e) => setComboForm({ ...comboForm, slug: e.target.value })}
                    placeholder="kit-stage-2-polaris-pro-r"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      {t.devComboCategoryLabel || (lang === "es" ? "Categoría del Combo" : "Combo Category")}:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryModalTarget("combo");
                        setCategoryModalError(null);
                        setNewCategoryNameEs("");
                        setNewCategoryNameEn("");
                        setIsAddCategoryModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-[#C02030] hover:text-[#A01824] flex items-center gap-1 cursor-pointer transition"
                      title={t.devAddCategoryBtn}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{t.devNewCategoryBtn || (lang === "es" ? "+ Nueva Categoría" : "+ New Category")}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={comboForm.category}
                      onChange={(e) => setComboForm({ ...comboForm, category: e.target.value })}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-900 focus:bg-white transition"
                    >
                      <option value="" disabled>
                        {t.devSelectCategoryPrompt || (lang === "es" ? "-- Seleccionar Categoría --" : "-- Select Category --")}
                      </option>
                      {categories.map((cat: any) => {
                        const rawName = lang === "es" ? (cat.nameEs || cat.nameEn || cat.slug) : (cat.nameEn || cat.nameEs || cat.slug);
                        const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
                        return (
                          <option key={cat.id || cat.slug} value={cat.slug}>
                            {displayName}
                          </option>
                        );
                      })}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryModalTarget("combo");
                        setCategoryModalError(null);
                        setNewCategoryNameEs("");
                        setNewCategoryNameEn("");
                        setIsAddCategoryModalOpen(true);
                      }}
                      className="px-3 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 transition text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                      title={t.devAddCategoryBtn}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{lang === "es" ? "Nueva Categoría" : "New Category"}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Insignia / Badge (Español):
                  </label>
                  <input
                    type="text"
                    value={comboForm.badgeEs}
                    onChange={(e) => setComboForm({ ...comboForm, badgeEs: e.target.value })}
                    placeholder="COMBO ESPECIAL"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Insignia / Badge (English):
                  </label>
                  <input
                    type="text"
                    value={comboForm.badgeEn}
                    onChange={(e) => setComboForm({ ...comboForm, badgeEn: e.target.value })}
                    placeholder="SPECIAL COMBO"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Descriptions */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Descripción del Combo</span>
                </h3>

                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveDescTab("es")}
                    className={`px-3 py-1 rounded-lg transition ${
                      activeDescTab === "es" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Español (ES)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveDescTab("en")}
                    className={`px-3 py-1 rounded-lg transition ${
                      activeDescTab === "en" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    English (EN)
                  </button>
                </div>
              </div>

              {activeDescTab === "es" ? (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Descripción en Español:
                  </label>
                  <textarea
                    rows={4}
                    value={comboForm.descriptionEs}
                    onChange={(e) => setComboForm({ ...comboForm, descriptionEs: e.target.value })}
                    placeholder="Detalla los componentes, beneficios de potencia, garantía e instalación incluida..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Descripción en Inglés:
                  </label>
                  <textarea
                    rows={4}
                    value={comboForm.descriptionEn}
                    onChange={(e) => setComboForm({ ...comboForm, descriptionEn: e.target.value })}
                    placeholder="Details about included components, performance gain, warranty and included labor..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition"
                  />
                </div>
              )}
            </div>

            {/* Card 3: Included Products with Direct Edit Links (User Requirement) */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#C02030]" />
                    <span>{t.devComboIncludedProducts}</span>
                    <span className="text-slate-400 font-mono">({comboSelectedProducts.length})</span>
                  </h3>
                  {totalIncludedPrice > 0 && (
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                      Suma piezas: <strong className="text-slate-900">{formatCRC(totalIncludedPrice)}</strong>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Agrega productos del catálogo para este paquete. Cada pieza incluye su acceso directo para editarla en la pantalla de producto.
                </p>
              </div>

              {/* Product Search & Quick Product Creation Trigger */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={comboProductSearch}
                    onChange={(e) => {
                      setComboProductSearch(e.target.value);
                      setIsComboSearchDropdownOpen(true);
                    }}
                    onFocus={() => setIsComboSearchDropdownOpen(true)}
                    placeholder={t.devComboSearchProductPlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-9 pr-8 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition"
                  />
                  {comboProductSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setComboProductSearch("");
                        setIsComboSearchDropdownOpen(false);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Dropdown Results */}
                  {isComboSearchDropdownOpen && filteredProductOptions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-64 overflow-y-auto divide-y divide-slate-100">
                      {filteredProductOptions.map((prod) => (
                        <div
                          key={prod.id}
                          onClick={() => {
                            setComboSelectedProducts((prev) => [...prev, prod]);
                            setComboProductSearch("");
                            setIsComboSearchDropdownOpen(false);
                          }}
                          className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                              <img
                                src={prod.imageUrl || "/images/logo.png"}
                                alt=""
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-900 block truncate">
                                {prod.nameEs || prod.p_title}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                                <span>SKU: {prod.sku}</span>
                                {prod.brandName && <span>• {prod.brandName}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {(() => {
                              const prodStock = resolveProductStockStatus(prod);
                              return prodStock.status === "OUT_OF_STOCK" || prodStock.status === "UNAVAILABLE" ? (
                                <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                                  {t.comboComponentOutOfStock}
                                </span>
                              ) : prodStock.status === "PRE_ORDER" ? (
                                <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                                  {t.comboComponentPreOrder}
                                </span>
                              ) : prodStock.status === "LOW_STOCK" ? (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                  {t.devComboStockLowStock}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                  {t.comboComponentInStock}
                                </span>
                              );
                            })()}
                            <span className="text-xs font-bold font-mono text-slate-800">
                              {formatCRC(prod.priceCRC || prod.price?.T_price || 0)}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-[#C02030] text-white text-[11px] font-bold transition flex items-center gap-1">
                              <Plus className="w-3 h-3" />
                              <span>{t.devComboAddProduct}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setQuickProductNameEs("");
                    setQuickProductNameEn("");
                    setQuickProductSku(`PRD-${Math.floor(100000 + Math.random() * 900000)}`);
                    setQuickProductPriceCRC(0);
                    setQuickProductCategory(comboForm.category || "suspension");
                    setQuickProductError(null);
                    setIsQuickProductModalOpen(true);
                  }}
                  className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-[#C02030] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                  title="Crear un nuevo producto en catálogo para este combo"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.devComboUniqueProductQuickCreateProduct}</span>
                </button>
              </div>

              {/* Included Products List */}
              <div className="space-y-2.5 pt-1">
                {comboSelectedProducts.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-1.5">
                    <Package className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-600 font-medium">
                      {t.devComboNoProductsSelected}
                    </p>
                  </div>
                ) : (
                  comboSelectedProducts.map((p, idx) => {
                    const pStock = resolveProductStockStatus(p);
                    return (
                    <div
                      key={idx}
                      className={`p-3.5 bg-slate-50 rounded-2xl border flex items-center justify-between gap-3 transition ${
                        pStock.status === "OUT_OF_STOCK" || pStock.status === "UNAVAILABLE"
                          ? "border-rose-300 bg-rose-50/40"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
                          <img
                            src={p.imageUrl || "/images/logo.png"}
                            alt=""
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {p.nameEs || p.p_title || p.title || "Pieza"}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mt-0.5 flex-wrap">
                            {p.sku && (
                              <span className="bg-white border border-slate-200 px-1.5 py-0.2 rounded font-bold text-slate-700">
                                #{p.sku}
                              </span>
                            )}
                            <span className="text-emerald-700 font-bold">
                              {formatCRC(p.priceCRC || p.price?.T_price || 0)}
                            </span>
                            {/* Component Live Stock Badge */}
                            {pStock.status === "OUT_OF_STOCK" || pStock.status === "UNAVAILABLE" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100/90 border border-rose-200 px-2 py-0.5 rounded-md">
                                <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
                                <span>{t.comboComponentOutOfStock}</span>
                              </span>
                            ) : pStock.status === "PRE_ORDER" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 bg-blue-100/90 border border-blue-200 px-2 py-0.5 rounded-md">
                                <Calendar className="w-2.5 h-2.5 text-blue-600" />
                                <span>{t.comboComponentPreOrder}</span>
                              </span>
                            ) : pStock.status === "LOW_STOCK" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/90 border border-amber-200 px-2 py-0.5 rounded-md">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                <span>{t.devComboStockLowStock}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-md">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                <span>{t.comboComponentInStock}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Direct link to edit product in public/store product screen */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditProduct(p)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
                          title="Abrir editor completo de este producto"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{t.devComboEditProductLink}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setComboSelectedProducts((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                          title="Eliminar del combo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
                )}
              </div>

              {/* Extra Items or Services (Manual text list) */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Artículos o Servicios Adicionales en el Kit (Línea por línea):
                </label>
                <textarea
                  rows={2}
                  value={comboForm.itemsText}
                  onChange={(e) => setComboForm({ ...comboForm, itemsText: e.target.value })}
                  placeholder="Ej: Calibración en Dinamómetro ZxZ\nInstalación profesional en taller Pozos"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Card 3B: Unique Product / Custom Service for this Combo */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-purple-600" />
                    <span>{t.devComboUniqueProductTitle}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 max-w-xl leading-relaxed">
                    {t.devComboUniqueProductDesc}
                  </p>
                </div>

                {/* Enable / Disable Toggle Switch */}
                <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                  <span className="text-xs font-bold text-slate-700">
                    {comboForm.uniqueProduct?.enabled ? (lang === "es" ? "Activado" : "Enabled") : (lang === "es" ? "Desactivado" : "Disabled")}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const willEnable = !comboForm.uniqueProduct?.enabled;
                      if (willEnable && (!comboForm.uniqueProduct?.titleEs || comboForm.uniqueProduct.fields.length === 0)) {
                        setComboForm((prev) => ({
                          ...prev,
                          uniqueProduct: {
                            ...SUSPENSION_ADJUST_UNIQUE_PRODUCT_TEMPLATE,
                            enabled: true,
                          },
                        }));
                      } else {
                        setComboForm((prev) => ({
                          ...prev,
                          uniqueProduct: {
                            ...prev.uniqueProduct,
                            enabled: willEnable,
                          },
                        }));
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      comboForm.uniqueProduct?.enabled ? "bg-purple-600" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        comboForm.uniqueProduct?.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {comboForm.uniqueProduct?.enabled ? (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Quick Preset Templates */}
                  <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-200/80 space-y-2">
                    <span className="text-[11px] font-black uppercase text-purple-900 tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                      <span>{t.devComboUniqueProductTemplates}</span>
                    </span>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setComboForm((prev) => ({
                            ...prev,
                            uniqueProduct: {
                              ...SUSPENSION_ADJUST_UNIQUE_PRODUCT_TEMPLATE,
                              enabled: true,
                            },
                          }));
                          setFeedback({
                            type: "success",
                            msg: lang === "es"
                              ? "¡Plantilla de Ajuste de Suspensión aplicada con campos de Estilo, Peso y Accesorios!"
                              : "Suspension Tuning Template applied with Style, Weight, and Accessories fields!",
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 hover:border-purple-400 text-purple-900 font-bold transition shadow-2xs hover:bg-purple-100/50 flex items-center gap-1 cursor-pointer"
                      >
                        ⚡ <span>{t.devComboUniqueProductTemplateSuspension}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setComboForm((prev) => ({
                            ...prev,
                            uniqueProduct: {
                              enabled: true,
                              titleEs: "Reprogramación y Mapa Personalizado de ECU",
                              titleEn: "Custom ECU Remap & Dyno Calibration",
                              badgeEs: "CALIBRACIÓN DE SOFTWARE",
                              badgeEn: "SOFTWARE CALIBRATION",
                              descriptionEs: "Calibración a medida de inyección, avance de ignición, apertura de mariposa y limitadores según modificaciones del vehículo y octanaje.",
                              descriptionEn: "Tailored calibration of fueling, timing, throttle tables, and rev limits suited to vehicle modifications and fuel octane.",
                              priceCRC: 0,
                              imageUrl: "/images/sxs/z10_front.png",
                              fields: [
                                {
                                  id: "fuel_octane",
                                  nameEs: "Octanaje de Gasolina Habitual",
                                  nameEn: "Main Fuel Octane",
                                  type: "select",
                                  options: ["Regular (91)", "Super (95)", "Premium / VP (98+)", "E85"],
                                  required: true,
                                },
                                {
                                  id: "tire_size",
                                  nameEs: "Medida de Llantas Instaladas",
                                  nameEn: "Installed Tire Size",
                                  type: "text",
                                  placeholderEs: "ej: 32x10 R15 o 35x10.5 R15",
                                  required: true,
                                },
                                {
                                  id: "exhaust_mod",
                                  nameEs: "Escape / Mods de Admisión",
                                  nameEn: "Exhaust / Intake Modifications",
                                  type: "text",
                                  placeholderEs: "ej: Escape directo Agency Power, filtro de alto flujo",
                                  required: false,
                                },
                              ],
                            },
                          }));
                          setFeedback({
                            type: "success",
                            msg: lang === "es" ? "¡Plantilla de Reprogramación ECU aplicada!" : "ECU Remap template applied!",
                          });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white border border-purple-200 hover:border-purple-400 text-purple-900 font-bold transition shadow-2xs hover:bg-purple-100/50 flex items-center gap-1 cursor-pointer"
                      >
                        ⚡ <span>{t.devComboUniqueProductTemplateECU}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setComboForm((prev) => ({
                            ...prev,
                            uniqueProduct: {
                              enabled: true,
                              titleEs: "",
                              titleEn: "",
                              badgeEs: "PRODUCTO ÚNICO",
                              badgeEn: "UNIQUE PRODUCT",
                              descriptionEs: "",
                              descriptionEn: "",
                              priceCRC: 0,
                              imageUrl: "",
                              fields: [],
                            },
                          }));
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold transition shadow-2xs hover:bg-slate-50 cursor-pointer"
                      >
                        <span>{t.devComboUniqueProductTemplateCustom}</span>
                      </button>
                    </div>
                  </div>

                  {/* Basic Details of Unique Product */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {t.devComboUniqueProductNameEs}: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={comboForm.uniqueProduct.titleEs || ""}
                        onChange={(e) =>
                          setComboForm((prev) => ({
                            ...prev,
                            uniqueProduct: { ...prev.uniqueProduct, titleEs: e.target.value },
                          }))
                        }
                        placeholder="Ej: Ajuste y Valvulado Completo de Suspensión"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {t.devComboUniqueProductNameEn}:
                      </label>
                      <input
                        type="text"
                        value={comboForm.uniqueProduct.titleEn || ""}
                        onChange={(e) =>
                          setComboForm((prev) => ({
                            ...prev,
                            uniqueProduct: { ...prev.uniqueProduct, titleEn: e.target.value },
                          }))
                        }
                        placeholder="E.g.: Full Custom Suspension Valving & Tuning"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {t.devComboUniqueProductBadgeEs}:
                      </label>
                      <input
                        type="text"
                        value={comboForm.uniqueProduct.badgeEs || ""}
                        onChange={(e) =>
                          setComboForm((prev) => ({
                            ...prev,
                            uniqueProduct: { ...prev.uniqueProduct, badgeEs: e.target.value },
                          }))
                        }
                        placeholder="SERVICIO EXCLUSIVO DE AJUSTE"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {t.devComboUniqueProductBadgeEn}:
                      </label>
                      <input
                        type="text"
                        value={comboForm.uniqueProduct.badgeEn || ""}
                        onChange={(e) =>
                          setComboForm((prev) => ({
                            ...prev,
                            uniqueProduct: { ...prev.uniqueProduct, badgeEn: e.target.value },
                          }))
                        }
                        placeholder="EXCLUSIVE TUNING SERVICE"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white transition"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {t.devComboUniqueProductDescEs}:
                      </label>
                      <textarea
                        rows={2}
                        value={comboForm.uniqueProduct.descriptionEs || ""}
                        onChange={(e) =>
                          setComboForm((prev) => ({
                            ...prev,
                            uniqueProduct: { ...prev.uniqueProduct, descriptionEs: e.target.value },
                          }))
                        }
                        placeholder="Explica qué incluye este producto o servicio único (ej. Valvulado interno, resortes progressive, calibración en mesa de prueba)..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 focus:bg-white transition"
                      />
                    </div>

                    {/* Image for Unique Product */}
                    <div className="sm:col-span-2 space-y-2 pt-2 border-t border-slate-100">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        {t.devComboUniqueProductImage}:
                      </label>
                      <div className="flex items-center gap-3">
                        {comboForm.uniqueProduct.imageUrl ? (
                          <div className="relative w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                            <img
                              src={comboForm.uniqueProduct.imageUrl}
                              alt=""
                              className="max-h-full max-w-full object-contain rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setComboForm((prev) => ({
                                  ...prev,
                                  uniqueProduct: { ...prev.uniqueProduct, imageUrl: "" },
                                }))
                              }
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : null}

                        <label className="cursor-pointer px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploadingUniqueImage ? `${uniqueImageProgress}%...` : t.devComboUniqueProductUploadImage}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingUniqueImage}
                            onChange={handleUniqueProductImageUpload}
                            className="hidden"
                          />
                        </label>

                        <input
                          type="text"
                          value={comboForm.uniqueProduct.imageUrl || ""}
                          onChange={(e) =>
                            setComboForm((prev) => ({
                              ...prev,
                              uniqueProduct: { ...prev.uniqueProduct, imageUrl: e.target.value },
                            }))
                          }
                          placeholder="/images/sxs/z10_front.png o https://..."
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-purple-600 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customer Customization Fields List */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                          {t.devComboUniqueProductFieldsTitle}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {t.devComboUniqueProductFieldsSubtitle}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setNewFieldNameEs("");
                          setNewFieldNameEn("");
                          setNewFieldType("select");
                          setNewFieldOptionsRaw("Paseo / Trail, Dunas / Arena, Rocas / Crawling, Carreras");
                          setNewFieldPlaceholderEs("");
                          setNewFieldRequired(true);
                          setIsAddFieldModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t.devComboUniqueProductAddField}</span>
                      </button>
                    </div>

                    {comboForm.uniqueProduct.fields.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                        No hay campos de personalización configurados aún. Pulsa en "+ Agregar Campo" o carga una plantilla arriba.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {comboForm.uniqueProduct.fields.map((f) => (
                          <div
                            key={f.id}
                            className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900">
                                  {f.nameEs}
                                </span>
                                {f.nameEn && f.nameEn !== f.nameEs && (
                                  <span className="text-[10px] text-slate-500">
                                    ({f.nameEn})
                                  </span>
                                )}
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold uppercase">
                                  {f.type === "select" ? "Opciones Desplegables" : f.type === "number" ? "Número" : "Texto"}
                                </span>
                                {f.required ? (
                                  <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
                                    Obligatorio
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded">
                                    Opcional
                                  </span>
                                )}
                              </div>
                              {f.type === "select" && f.options && (
                                <p className="text-[11px] text-slate-500 mt-1 truncate">
                                  Opciones: {f.options.join(" • ")}
                                </p>
                              )}
                              {f.placeholderEs && (
                                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                  Ej: {f.placeholderEs}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveUniqueProductField(f.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Eliminar campo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                  Este combo no tiene un producto o servicio único activado. Habilita el interruptor si deseas incluir calibración o especificaciones personalizadas.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Pricing, Media & Configuration */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card 4: Pricing Breakdown */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Precios y Beneficios del Combo</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Precio Regular / Original (₡):
                    </label>
                    {totalIncludedPrice > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setComboForm((prev) => ({
                            ...prev,
                            originalPriceCRC: totalIncludedPrice,
                            discountPercent:
                              prev.priceCRC > 0
                                ? Math.max(0, Math.round(((totalIncludedPrice - prev.priceCRC) / totalIncludedPrice) * 100))
                                : prev.discountPercent,
                          }))
                        }
                        className="text-[10px] font-bold text-purple-700 hover:text-purple-900 underline"
                      >
                        Fijar a suma ({formatCRC(totalIncludedPrice)})
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    value={comboForm.originalPriceCRC || ""}
                    onChange={(e) => {
                      const orig = Math.round(Number(e.target.value) || 0);
                      setComboForm({
                        ...comboForm,
                        originalPriceCRC: orig,
                        discountPercent:
                          orig > 0 && comboForm.priceCRC > 0
                            ? Math.max(0, Math.round(((orig - comboForm.priceCRC) / orig) * 100))
                            : comboForm.discountPercent,
                      });
                    }}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Precio Final del Combo (₡): <span className="text-red-500">*</span>
                    </label>
                    {comboForm.originalPriceCRC > 0 && comboForm.discountPercent > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const discounted = Math.round(
                            comboForm.originalPriceCRC * (1 - comboForm.discountPercent / 100)
                          );
                          setComboForm((prev) => ({ ...prev, priceCRC: discounted }));
                        }}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline"
                      >
                        Aplicar {comboForm.discountPercent}% OFF
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    value={comboForm.priceCRC || ""}
                    onChange={(e) => {
                      const pr = Math.round(Number(e.target.value) || 0);
                      setComboForm({
                        ...comboForm,
                        priceCRC: pr,
                        discountPercent:
                          comboForm.originalPriceCRC > 0
                            ? Math.max(0, Math.round(((comboForm.originalPriceCRC - pr) / comboForm.originalPriceCRC) * 100))
                            : comboForm.discountPercent,
                      });
                    }}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm font-mono font-black text-emerald-700 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Descuento Visual (% OFF):
                  </label>
                  <input
                    type="number"
                    value={comboForm.discountPercent || ""}
                    onChange={(e) => setComboForm({ ...comboForm, discountPercent: Number(e.target.value) || 0 })}
                    placeholder="10"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <InstallationBreakdownEditor
                    labourCostCRC={comboForm.installLabourCostCRC}
                    extraParts={comboForm.installExtraParts}
                    profitCRC={comboForm.installProfitCRC}
                    totalCostCRC={comboForm.installationPriceCRC}
                    durationMinutes={comboForm.installationDurationMinutes}
                    onDurationChange={(mins) => setComboForm((prev) => ({ ...prev, installationDurationMinutes: mins }))}
                    lang={lang}
                    t={t}
                    showIncludeCheckbox={false}
                    comboProductsInstallSummary={comboProductsInstallSummary}
                    onApplyComboProductsInstall={handleApplyComboProductsInstall}
                    onChange={(labour, parts, profit) => {
                      const partsTotal = (parts || []).reduce((sum, pt) => sum + (Number(pt.priceCRC) || 0), 0);
                      const totalInstall = Math.max(0, labour) + Math.max(0, partsTotal) + Math.max(0, profit);
                      setComboForm((prev) => ({
                        ...prev,
                        installLabourCostCRC: labour,
                        installExtraParts: parts,
                        installProfitCRC: profit,
                        installationPriceCRC: totalInstall,
                      }));
                    }}
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={comboForm.homeInstallationAvailable}
                      onChange={(e) => setComboForm({ ...comboForm, homeInstallationAvailable: e.target.checked })}
                      className="rounded border-slate-300 text-[#C02030] focus:ring-[#C02030] w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Apto para Instalación a Domicilio
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={comboForm.featured}
                      onChange={(e) => setComboForm({ ...comboForm, featured: e.target.checked })}
                      className="rounded border-slate-300 text-[#C02030] focus:ring-[#C02030] w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Destacado en Inicio (Featured)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Card 5: Combo Media Gallery (imgs) */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-600" />
                  <span>{lang === "es" ? "Galería Multimedia del Combo" : "Combo Media Gallery"}</span>
                </h3>
                {(() => {
                  const list = comboForm.imgsText
                    ? comboForm.imgsText.split("\n").map((s) => s.trim()).filter(Boolean)
                    : comboForm.imageUrl
                    ? [comboForm.imageUrl]
                    : [];
                  return (
                    <span className="text-[10px] font-mono text-slate-500">
                      {list.length} {lang === "es" ? (list.length === 1 ? "imagen" : "imágenes") : (list.length === 1 ? "image" : "images")}
                    </span>
                  );
                })()}
              </div>

              {(() => {
                const list = comboForm.imgsText
                  ? comboForm.imgsText.split("\n").map((s) => s.trim()).filter(Boolean)
                  : comboForm.imageUrl
                  ? [comboForm.imageUrl]
                  : [];

                return (
                  <div className="space-y-4">
                    {/* Primary Preview */}
                    <div className="relative rounded-2xl bg-slate-950 p-2 border border-slate-800 flex items-center justify-center max-h-56 overflow-hidden">
                      <img
                        src={comboForm.imageUrl || list[0] || "/images/sxs/z10_front.png"}
                        alt="Combo"
                        className="max-h-48 w-auto object-contain rounded-xl"
                      />
                    </div>

                    {/* Thumbnail strip with Replace & Delete buttons */}
                    {list.length > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {list.map((imgUrl, idx) => {
                          const isPrimary = (comboForm.imageUrl || list[0]) === imgUrl;
                          return (
                            <div
                              key={idx}
                              className={`group relative rounded-xl border-2 p-1 bg-slate-50 overflow-hidden flex flex-col items-center justify-center transition-all ${
                                isPrimary
                                  ? "border-purple-600 ring-2 ring-purple-500/20 shadow-xs"
                                  : "border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <img
                                src={imgUrl}
                                alt={`Combo media ${idx + 1}`}
                                className="w-full h-16 object-contain rounded-lg cursor-pointer"
                                onClick={() => {
                                  const remaining = list.filter((u) => u !== imgUrl);
                                  const reordered = [imgUrl, ...remaining];
                                  setComboForm((prev) => ({
                                    ...prev,
                                    imageUrl: imgUrl,
                                    imgsText: reordered.join("\n"),
                                  }));
                                }}
                              />
                              <label
                                onClick={(e) => e.stopPropagation()}
                                className="absolute top-1 left-1 w-5 h-5 bg-slate-900/85 hover:bg-slate-900 text-white rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                                title={lang === "es" ? "Reemplazar imagen" : "Replace image"}
                              >
                                <Upload className="w-2.5 h-2.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleMediaUpload(e, "image", idx)}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = list.filter((_, i) => i !== idx);
                                  setComboForm((prev) => ({
                                    ...prev,
                                    imageUrl: isPrimary ? (updated[0] || "") : (updated.includes(prev.imageUrl) ? prev.imageUrl : (updated[0] || "")),
                                    imgsText: updated.join("\n"),
                                  }));
                                }}
                                className="absolute top-1 right-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition shadow-xs"
                                title={lang === "es" ? "Eliminar imagen" : "Delete image"}
                              >
                                <X className="w-3 h-3" />
                              </button>
                              {isPrimary && (
                                <span className="absolute bottom-1 left-1 bg-purple-600 text-[8px] font-bold text-white px-1.5 py-0.5 rounded-full uppercase">
                                  {lang === "es" ? "Principal" : "Primary"}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Direct Upload Button */}
                    <label className="cursor-pointer w-full py-2.5 px-4 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition flex items-center justify-center gap-2 border border-purple-200 shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-purple-600" />
                      <span>
                        {uploadingImage
                          ? t.devSaving
                          : lang === "es"
                          ? "Subir Imágenes al Combo (múltiples)"
                          : "Upload Combo Images (multiple)"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={uploadingImage}
                        onChange={(e) => handleMediaUpload(e, "image")}
                        className="hidden"
                      />
                    </label>

                    {/* Manual URLs textarea */}
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        {lang === "es" ? "URLs de Imágenes (una por línea):" : "Image URLs (one per line):"}
                      </label>
                      <textarea
                        rows={3}
                        value={comboForm.imgsText}
                        onChange={(e) => {
                          const text = e.target.value;
                          const lines = text.split("\n").map((s) => s.trim()).filter(Boolean);
                          setComboForm((prev) => ({
                            ...prev,
                            imgsText: text,
                            imageUrl: lines[0] || "",
                          }));
                        }}
                        placeholder="/images/sxs/z10_front.png&#10;https://..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Card 6: Configurable Parameters & Variants */}
            <ParametersEditorSection
              parameters={comboForm.parameters}
              onChange={(newParams) => setComboForm((prev) => ({ ...prev, parameters: newParams }))}
              t={t}
              availableProducts={products}
              currentProductPrice={comboForm.priceCRC}
              currentProductName={comboForm.titleEs || comboForm.titleEn}
              currentProductImage={comboForm.imageUrl || ""}
              currentProductSupplierUrl=""
              liveExchangeRate={liveExchangeRate || 515}
            />

            {/* Minimalistic Suggestions Tagger for Prevention & Performance */}
            <MinimalistSuggestionsTagger
              suggestedProductIds={comboForm.suggestedProductIds || []}
              suggestedComboIds={comboForm.suggestedComboIds || []}
              onUpdateProductIds={(ids) => setComboForm((prev) => ({ ...prev, suggestedProductIds: ids }))}
              onUpdateComboIds={(ids) => setComboForm((prev) => ({ ...prev, suggestedComboIds: ids }))}
              allProducts={products}
              allCombos={combos}
              currentId={editingCombo?.id}
              currentSku={editingCombo?.slug}
              t={t}
              lang={lang}
            />

            {/* Actions Bar */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingComboView(false)}
                className="px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition shadow-xs"
              >
                {t.orderCancelBtn}
              </button>

              <button
                type="button"
                onClick={() => handleSaveCombo()}
                disabled={saving}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-[#C02030] hover:bg-[#A01825] text-white text-xs font-bold uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>
                  {saving
                    ? t.devSaving
                    : isEdit
                    ? lang === "es"
                      ? "Guardar Cambios del Combo"
                      : "Save Combo Changes"
                    : lang === "es"
                    ? "Publicar Combo"
                    : "Publish Combo"}
                </span>
              </button>
            </div>
          </div>
        </div>
        {renderGlobalModals()}
      </div>
    );
  }

  // -------------------------------------------------------------
  // CATALOG OVERVIEW TABLE (PRODUCTS & COMBOS)
  // -------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 shadow-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold px-2 py-0.5 rounded hover:bg-black/5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCatalogType("products")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeCatalogType === "products"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>
              {lang === "es" ? "Productos" : "Products"} ({products.length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCatalogType("combos")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
              activeCatalogType === "combos"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Combos ({combos.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeCatalogType === "products"
                  ? lang === "es"
                    ? "Filtrar por SKU, nombre (ES/EN) o marca..."
                    : "Search by SKU, name (EN/ES), or brand..."
                  : lang === "es"
                  ? "Filtrar combos (ES/EN)..."
                  : "Search combos (EN/ES)..."
              }
              className="w-56 sm:w-64 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            {activeCatalogType === "products" && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setProductFilterStatus("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    productFilterStatus === "all"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t.productFilterAll} ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProductFilterStatus("active")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    productFilterStatus === "active"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t.productFilterActive} ({activeProductsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setProductFilterStatus("archived")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                    productFilterStatus === "archived"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Archive className="w-3 h-3 text-amber-600" />
                  <span>{t.productFilterArchived} ({archivedProductsCount})</span>
                </button>
              </div>
            )}

            {activeCatalogType === "combos" && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setComboFilterStatus("all")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    comboFilterStatus === "all"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t.comboFilterAll} ({combos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setComboFilterStatus("active")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    comboFilterStatus === "active"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {t.comboFilterActive} ({activeCombosCount})
                </button>
                <button
                  type="button"
                  onClick={() => setComboFilterStatus("archived")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                    comboFilterStatus === "archived"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Archive className="w-3 h-3 text-amber-600" />
                  <span>{t.comboFilterArchived} ({archivedCombosCount})</span>
                </button>
              </div>
            )}

            {activeCatalogType === "products" ? (
              <button
                type="button"
                onClick={handleOpenCreateProduct}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-1.5 px-3.5 rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === "es" ? "Nuevo Producto" : "New Product"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenCreateCombo}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-1.5 px-3.5 rounded-xl flex items-center gap-1.5 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{lang === "es" ? "Nuevo Combo" : "New Combo"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Separated Catalog Parameters Filter Bar (Category, Vehicle Brand, Distributor Brand, In Stock, Discounted) */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Category Parameter Dropdown (Zero Mock Data: strictly present categories only) */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-bold text-slate-700">{t.productsFilterCategory || (lang === "es" ? "Categoría" : "Category")}:</span>
            <select
              value={backdoorCategory}
              onChange={(e) => setBackdoorCategory(e.target.value)}
              className="bg-transparent font-semibold text-slate-900 outline-none cursor-pointer text-xs"
            >
              <option value="all">
                {availableCategories.length === 0
                  ? (t.productsAllCategories || (lang === "es" ? "Todas las Categorías" : "All Categories"))
                  : `${t.productsAllCategories || (lang === "es" ? "Todas las Categorías" : "All Categories")} (${availableCategories.length})`}
              </option>
              {availableCategories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.title} ({c.count})
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Brand Parameter Dropdown (Zero Mock Data: strictly present brands only) */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Car className="w-3.5 h-3.5 text-[#C02030]" />
            <span className="font-bold text-slate-700">{t.productsFilterVehicleBrand || (lang === "es" ? "Marca de Vehículo" : "Vehicle Brand")}:</span>
            <select
              value={backdoorVehicleBrand}
              onChange={(e) => setBackdoorVehicleBrand(e.target.value)}
              className="bg-transparent font-semibold text-slate-900 outline-none cursor-pointer text-xs"
            >
              <option value="all">
                {availableVehicleBrands.length === 0
                  ? (t.productsAllVehicleBrands || (lang === "es" ? "Todos los Vehículos" : "All Vehicles"))
                  : `${t.productsAllVehicleBrands || (lang === "es" ? "Todos los Vehículos" : "All Vehicles")} (${availableVehicleBrands.length})`}
              </option>
              {availableVehicleBrands.map((vb) => (
                <option key={vb.slug} value={vb.slug}>
                  {vb.title} ({vb.count})
                </option>
              ))}
            </select>
          </div>

          {/* Distributor Brand Parameter Dropdown (Zero Mock Data: strictly present brands only) */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
            <Tag className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-bold text-slate-700">{t.productsFilterDistributorBrand || (lang === "es" ? "Marca Fabricante" : "Dealer Brand")}:</span>
            <select
              value={backdoorDistributorBrand}
              onChange={(e) => setBackdoorDistributorBrand(e.target.value)}
              className="bg-transparent font-semibold text-slate-900 outline-none cursor-pointer text-xs"
            >
              <option value="all">
                {availableDistributorBrands.length === 0
                  ? (t.productsAllDistributorBrands || (lang === "es" ? "Todas las Marcas" : "All Brands"))
                  : `${t.productsAllDistributorBrands || (lang === "es" ? "Todas las Marcas" : "All Brands")} (${availableDistributorBrands.length})`}
              </option>
              {availableDistributorBrands.map((db) => (
                <option key={db.name} value={db.name}>
                  {db.name} ({db.count})
                </option>
              ))}
            </select>
          </div>

          {/* In Stock Toggle Parameter */}
          <button
            type="button"
            onClick={() => setBackdoorInStockOnly(!backdoorInStockOnly)}
            disabled={!hasInStockItems && !backdoorInStockOnly}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
              backdoorInStockOnly
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : hasInStockItems
                ? "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                : "bg-slate-50 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${backdoorInStockOnly ? "bg-white" : "bg-emerald-500"}`} />
            <span>{t.productsFilterInStock || (lang === "es" ? "En Stock" : "In Stock")}</span>
          </button>

          {/* Discounted Toggle Parameter */}
          <button
            type="button"
            onClick={() => setBackdoorDiscountedOnly(!backdoorDiscountedOnly)}
            disabled={!hasDiscountedItems && !backdoorDiscountedOnly}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
              backdoorDiscountedOnly
                ? "bg-[#C02030] text-white border-[#C02030] shadow-xs"
                : hasDiscountedItems
                ? "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                : "bg-slate-50 text-slate-400 border-slate-200 opacity-50 cursor-not-allowed"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.productsFilterDiscounted || (lang === "es" ? "En Oferta" : "On Sale")}</span>
          </button>
        </div>

        {/* Clear Filters Button (shown when any filter is active) */}
        {hasActiveBackdoorFilters && (
          <button
            type="button"
            onClick={handleClearBackdoorFilters}
            className="text-xs font-bold text-slate-500 hover:text-red-600 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-red-50 transition"
          >
            <X className="w-3.5 h-3.5" />
            <span>{t.productsClearFilters || (lang === "es" ? "Limpiar filtros" : "Clear filters")}</span>
          </button>
        )}
      </div>

      {/* Active Filter Pills Bar */}
      {hasActiveBackdoorFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {lang === "es" ? "Filtros activos:" : "Active filters:"}
          </span>
          {search.trim() && (
            <span className="inline-flex items-center gap-1 bg-slate-900 text-white px-2.5 py-1 rounded-full text-[11px] font-semibold">
              <span>{lang === "es" ? "Búsqueda" : "Search"}: &ldquo;{search}&rdquo;</span>
              <button type="button" onClick={() => setSearch("")} className="hover:text-red-300">✕</button>
            </span>
          )}
          {backdoorCategory !== "all" && (
            <span className="inline-flex items-center gap-1 bg-blue-700 text-white px-2.5 py-1 rounded-full text-[11px] font-semibold">
              <span>{lang === "es" ? "Categoría" : "Category"}: {availableCategories.find((c) => c.slug === backdoorCategory)?.title || backdoorCategory}</span>
              <button type="button" onClick={() => setBackdoorCategory("all")} className="hover:text-blue-200">✕</button>
            </span>
          )}
          {backdoorVehicleBrand !== "all" && (
            <span className="inline-flex items-center gap-1 bg-[#C02030] text-white px-2.5 py-1 rounded-full text-[11px] font-semibold">
              <span>{lang === "es" ? "Vehículo" : "Vehicle"}: {availableVehicleBrands.find((b) => b.slug === backdoorVehicleBrand)?.title || backdoorVehicleBrand.toUpperCase()}</span>
              <button type="button" onClick={() => setBackdoorVehicleBrand("all")} className="hover:text-red-200">✕</button>
            </span>
          )}
          {backdoorDistributorBrand !== "all" && (
            <span className="inline-flex items-center gap-1 bg-slate-800 text-white px-2.5 py-1 rounded-full text-[11px] font-semibold">
              <span>{lang === "es" ? "Distribuidor" : "Brand"}: {backdoorDistributorBrand}</span>
              <button type="button" onClick={() => setBackdoorDistributorBrand("all")} className="hover:text-red-300">✕</button>
            </span>
          )}
          {backdoorInStockOnly && (
            <span className="inline-flex items-center gap-1 bg-emerald-700 text-white px-2.5 py-1 rounded-full text-[11px] font-semibold">
              <span>{lang === "es" ? "En Stock" : "In Stock"}</span>
              <button type="button" onClick={() => setBackdoorInStockOnly(false)} className="hover:text-emerald-200">✕</button>
            </span>
          )}
          {backdoorDiscountedOnly && (
            <span className="inline-flex items-center gap-1 bg-rose-700 text-white px-2.5 py-1 rounded-full text-[11px] font-semibold">
              <span>{lang === "es" ? "En Oferta" : "On Sale"}</span>
              <button type="button" onClick={() => setBackdoorDiscountedOnly(false)} className="hover:text-rose-200">✕</button>
            </span>
          )}
          {(activeCatalogType === "products" ? productFilterStatus !== "all" : comboFilterStatus !== "all") && (
            <span className="inline-flex items-center gap-1 bg-amber-700 text-white px-2.5 py-1 rounded-full text-[11px] font-semibold">
              <span>
                {lang === "es" ? "Estado" : "Status"}:{" "}
                {(activeCatalogType === "products" ? productFilterStatus : comboFilterStatus) === "active"
                  ? lang === "es"
                    ? "Activos"
                    : "Active"
                  : lang === "es"
                  ? "Archivados"
                  : "Archived"}
              </span>
              <button type="button" onClick={() => activeCatalogType === "products" ? setProductFilterStatus("all") : setComboFilterStatus("all")} className="hover:text-amber-200">✕</button>
            </span>
          )}
        </div>
      )}

      {/* 15% PROFIT LOSS PRECAUTION SYSTEM BANNER (Active for Staff & Master) */}
      {activeCatalogType === "products" && (() => {
        const activeList = products.filter((p) => !p.isArchived);
        const alertedProducts = activeList
          .map((p) => ({
            product: p,
            live: computeProductLivePricing(p, liveExchangeRate),
          }))
          .filter((item) => item.live.hasProfitAlert);

        return (
          <div
            className={`rounded-2xl p-4 border shadow-2xs space-y-3 transition-all ${
              alertedProducts.length > 0
                ? "bg-rose-50/90 border-rose-300 text-rose-950"
                : "bg-emerald-50/60 border-emerald-200/90 text-emerald-950"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    alertedProducts.length > 0
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-emerald-600 text-white shadow-xs"
                  }`}
                >
                  {alertedProducts.length > 0 ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-extrabold uppercase tracking-wider">
                      {alertedProducts.length > 0
                        ? lang === "es"
                          ? `⚠️ Sistema de Precaución: ${alertedProducts.length} ${alertedProducts.length === 1 ? "producto perdió" : "productos perdieron"} ≥ 15% de ganancia por el dólar`
                          : `⚠️ Precaution System: ${alertedProducts.length} ${alertedProducts.length === 1 ? "product lost" : "products lost"} ≥ 15% profit from USD fluctuation`
                        : lang === "es"
                        ? "Sistema de Precaución de Ganancias (Umbral -15% por Dólar) — Sin Alertas"
                        : "Profit Precaution System (-15% USD Fluctuation Threshold) — Clear"}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/90 border border-black/10 text-slate-800">
                      {lang === "es" ? "Dólar BCCR Hoy" : "Live BCCR USD"}: ₡{liveExchangeRate.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-85 mt-0.5">
                    {alertedProducts.length > 0
                      ? lang === "es"
                        ? "Los siguientes productos tienen su T_price bloqueado y su ganancia real cayó un 15% o más (a ≤ 85% de la ganancia inicial) debido al alza del dólar. Ajusta el precio para recuperar el margen."
                        : "The following products have a locked T_price and their real profit dropped by 15% or more (to ≤ 85% of initial profit) due to USD increases. Adjust their price to restore margin."
                      : lang === "es"
                      ? `Todos los productos activos (${activeList.length}) mantienen más del 85% de su ganancia proyectada con el tipo de cambio actual. Los precios T_price permanecen bloqueados.`
                      : `All active products (${activeList.length}) maintain over 85% of their projected profit at the current exchange rate. Customer T_price values remain locked.`}
                  </p>
                </div>
              </div>
            </div>

            {alertedProducts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {alertedProducts.map(({ product: prod, live }) => (
                  <div
                    key={prod.id}
                    className="bg-white rounded-xl p-3 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {prod.sku}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {lang === "es" ? prod.nameEs : prod.nameEn}
                        </span>
                        <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                          -{live.profitLossPercent}% {lang === "es" ? "ganancia" : "profit"}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span>
                          {lang === "es" ? "T_price Bloqueado" : "Locked T_price"}:{" "}
                          <strong className="text-slate-900">{formatCRC(live.lockedTPriceCRC)}</strong>
                        </span>
                        <span>
                          {lang === "es" ? "Ganancia Inicial" : "Initial Profit"}:{" "}
                          <strong>{formatCRC(live.initialProfitCRC)}</strong>
                        </span>
                        <span className="text-rose-700 font-bold">
                          {lang === "es" ? "Ganancia Hoy" : "Live Profit"}: {formatCRC(live.effectiveProfitCRC)}
                        </span>
                        <span className="text-emerald-700 font-bold">
                          {lang === "es" ? "T_price Sugerido" : "Suggested T_price"}: {formatCRC(live.suggestedTPriceCRC)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={adjustingProductId === prod.id}
                        onClick={() => handleAdjustProductLockedPrice(prod)}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        {adjustingProductId === prod.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        <span>{lang === "es" ? "Ajustar T_price" : "Adjust T_price"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditProduct(prod)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition cursor-pointer"
                      >
                        {lang === "es" ? "Editar" : "Edit"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* PRODUCTS TABLE */}
      {activeCatalogType === "products" && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="p-3.5">{lang === "es" ? "SKU / Producto" : "SKU / Product"}</th>
                <th className="p-3.5">{lang === "es" ? "Estado Stock" : "Stock Status"}</th>
                <th className="p-3.5">{lang === "es" ? "T_price Bloqueado & Ganancia Real" : "Locked T_price & Live Profit"}</th>
                <th className="p-3.5">{lang === "es" ? "Mano de Obra / Inst." : "Labor / Install"}</th>
                <th className="p-3.5 text-right">{lang === "es" ? "Acciones" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((prod) => {
                const liveInfo = computeProductLivePricing(prod, liveExchangeRate);
                return (
                <tr key={prod.id} className={`hover:bg-slate-50/70 transition ${liveInfo.hasProfitAlert ? "bg-rose-50/30" : ""}`}>
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                        <img
                          src={prod.imageUrl || "/products/z10_bikeman_exhaust.webp"}
                          alt=""
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900">{prod.sku}</span>
                          {liveInfo.hasProfitAlert && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                              <span>-{liveInfo.profitLossPercent}% GANANCIA</span>
                            </span>
                          )}
                        </div>
                        <span className="text-slate-600 text-[11px] line-clamp-1">
                          {lang === "es" ? (prod.nameEs || prod.p_title || prod.nameEn) : (prod.nameEn || prod.nameEs || prod.p_title)}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="p-3.5">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 block w-max">
                        {prod.stockStatus}
                      </span>
                      {prod.supplierStockStatus === "PRE_ORDER" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          <span>{lang === "es" ? "Preventa" : "Pre-Order"}</span>
                        </span>
                      ) : prod.supplierStockStatus === "OUT_OF_STOCK" || prod.supplierStockStatus === "UNAVAILABLE" ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>{lang === "es" ? "Agotado" : "Out of Stock"}</span>
                        </span>
                      ) : prod.supplierUrl ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{lang === "es" ? "En Stock" : "In Stock"}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                          {lang === "es" ? "Sin enlace" : "No link"}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-3.5 font-bold text-slate-900">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className={prod.discountPercent && prod.discountPercent > 0 ? "text-[#C02030]" : ""}>
                          {formatCRC(prod.priceCRC)}
                        </span>
                        <span
                          className="text-[9px] font-sans font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
                          title={lang === "es" ? "T_price bloqueado con impuestos incluidos" : "Locked T_price including taxes"}
                        >
                          {lang === "es" ? "Bloqueado" : "Locked"}
                        </span>
                      </div>
                      {Boolean(prod.discountPercent && prod.discountPercent > 0) && (
                        <div className="flex items-center gap-1.5">
                          {Boolean(prod.originalPriceCRC && prod.originalPriceCRC > prod.priceCRC) && (
                            <span className="text-[10px] text-slate-400 line-through font-mono">
                              {formatCRC(prod.originalPriceCRC!)}
                            </span>
                          )}
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-50 text-[#C02030] border border-rose-200">
                            -{prod.discountPercent}% OFF
                          </span>
                        </div>
                      )}
                      <div className="text-[10px] font-mono text-slate-500">
                        P: ${liveInfo.pPriceUSD.toFixed(2)} | S: ${liveInfo.sPriceUSD.toFixed(2)} USD
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-mono">
                        <span
                          className={
                            liveInfo.hasProfitAlert
                              ? "text-rose-700 font-extrabold"
                              : liveInfo.profitDeltaCRC < 0
                              ? "text-amber-700 font-bold"
                              : "text-emerald-700 font-bold"
                          }
                        >
                          {lang === "es" ? "Ganancia Real:" : "Live Profit:"} {formatCRC(liveInfo.effectiveProfitCRC)}
                        </span>
                        {liveInfo.profitDeltaCRC !== 0 && (
                          <span
                            className={`text-[9px] px-1 rounded ${
                              liveInfo.hasProfitAlert
                                ? "bg-rose-100 text-rose-800 font-extrabold"
                                : liveInfo.profitDeltaCRC < 0
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {liveInfo.profitChangePercent >= 0 ? `+${liveInfo.profitChangePercent}%` : `${liveInfo.profitChangePercent}%`}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="p-3.5 text-slate-700 font-mono font-medium">
                    <div>
                      <span className="font-bold">{formatCRC(prod.installationPriceCRC)}</span>
                      {prod.isInstallationIncluded && (
                        <span className="block text-[10px] text-emerald-700 font-bold font-sans">
                          ✓ {t.devFreeInstallationBadge}
                        </span>
                      )}
                      {(prod.installLabourCostCRC || (prod.installExtraParts && prod.installExtraParts.length > 0) || prod.installProfitCRC) ? (
                        <span className="block text-[9px] text-slate-500 font-sans mt-0.5">
                          MO: {formatCRC(prod.installLabourCostCRC || 0)} | Rep: {formatCRC((prod.installExtraParts || []).reduce((s, p) => s + (Number(p.priceCRC) || 0), 0))} | Gan: {formatCRC(prod.installProfitCRC || 0)}
                        </span>
                      ) : null}
                    </div>
                  </td>

                  <td className="p-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {liveInfo.hasProfitAlert && (
                        <button
                          type="button"
                          disabled={adjustingProductId === prod.id}
                          onClick={() => handleAdjustProductLockedPrice(prod)}
                          className="px-2 py-1 text-white bg-rose-600 hover:bg-rose-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                          title={lang === "es" ? "Ajustar y bloquear nuevo T_price con el dólar actual" : "Adjust and lock new T_price at current USD rate"}
                        >
                          <RefreshCw className={`w-3 h-3 ${adjustingProductId === prod.id ? "animate-spin" : ""}`} />
                          <span>{lang === "es" ? "Ajustar ₡" : "Adjust ₡"}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenEditProduct(prod)}
                        className="px-2.5 py-1 text-slate-700 hover:text-white bg-slate-100 hover:bg-[#C02030] rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                        title={lang === "es" ? "Abrir editor visual" : "Open visual editor"}
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>{lang === "es" ? "Editar" : "Edit"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleArchiveProduct(prod)}
                        className={`p-1.5 rounded-lg transition ${
                          prod.isArchived
                            ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        }`}
                        title={prod.isArchived ? t.productUnarchiveBtn : t.productArchiveBtn}
                      >
                        {prod.isArchived ? (
                          <ArchiveRestore className="w-3.5 h-3.5" />
                        ) : (
                          <Archive className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEliminateModal(prod)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title={t.productEliminateBtn}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 space-y-2">
                    <Package className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-semibold text-xs text-slate-600">
                      {lang === "es"
                        ? "No se encontraron productos con los filtros seleccionados."
                        : "No products found matching the selected filters."}
                    </p>
                    {hasActiveBackdoorFilters && (
                      <button
                        type="button"
                        onClick={handleClearBackdoorFilters}
                        className="text-xs font-bold text-[#C02030] hover:underline"
                      >
                        {lang === "es" ? "Limpiar todos los filtros" : "Clear all filters"}
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* COMBOS TABLE */}
      {activeCatalogType === "combos" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3.5">{lang === "es" ? "Combo / Título" : "Combo / Title"}</th>
                  <th className="p-3.5">{lang === "es" ? "Categoría" : "Category"}</th>
                  <th className="p-3.5">{t.devComboAvailabilityCol}</th>
                  <th className="p-3.5">{lang === "es" ? "Descuento" : "Discount"}</th>
                  <th className="p-3.5">{lang === "es" ? "Precio Combo" : "Combo Price"}</th>
                  <th className="p-3.5">{lang === "es" ? "Mano de Obra / Inst." : "Labor / Install"}</th>
                  <th className="p-3.5 text-right">{lang === "es" ? "Acciones" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCombos.map((combo) => {
                  let itemsCount = 0;
                  try {
                    itemsCount = JSON.parse(combo.itemsJson || "[]").length;
                  } catch {
                    itemsCount = 0;
                  }
                  const comboAvail = combo.availability || calculateComboAvailability(combo.itemsJson, products);

                  return (
                    <tr key={combo.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-10 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                            <img
                              src={combo.imageUrl || "/images/sxs/z10_front.png"}
                              alt=""
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 block text-xs">
                                {lang === "es" ? (combo.titleEs || combo.titleEn) : (combo.titleEn || combo.titleEs)}
                              </span>
                              {combo.isArchived && (
                                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                                  {t.comboFilterArchived}
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 text-[11px] font-mono">
                              {combo.slug} • ({itemsCount} items)
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                          {combo.category}
                        </span>
                      </td>

                      {/* Dynamic Availability Status derived from listed products */}
                      <td className="p-3.5">
                        {comboAvail.status === "OUT_OF_STOCK" || comboAvail.status === "UNAVAILABLE" ? (
                          <span
                            title={lang === "es" ? comboAvail.detailEs : comboAvail.detailEn}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 cursor-help"
                          >
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>{t.devComboStockOutOfStock}</span>
                          </span>
                        ) : comboAvail.status === "PRE_ORDER" ? (
                          <span
                            title={lang === "es" ? comboAvail.detailEs : comboAvail.detailEn}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 cursor-help"
                          >
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <span>{t.devComboStockPreOrder}</span>
                          </span>
                        ) : comboAvail.status === "LOW_STOCK" ? (
                          <span
                            title={lang === "es" ? comboAvail.detailEs : comboAvail.detailEn}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 cursor-help"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>{t.devComboStockLowStock}</span>
                          </span>
                        ) : (
                          <span
                            title={lang === "es" ? comboAvail.detailEs : comboAvail.detailEn}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-help"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t.devComboStockInStock}</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          -{combo.discountPercent}% OFF
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-baseline gap-1.5 font-mono">
                          <span className="font-extrabold text-slate-900">{formatCRC(combo.priceCRC)}</span>
                          {combo.originalPriceCRC > combo.priceCRC && (
                            <span className="text-[10px] text-slate-400 line-through">
                              {formatCRC(combo.originalPriceCRC)}
                            </span>
                          )}
                          {!isMaster && (
                            <span title={lang === "es" ? "Precio base exclusivo de Master" : "Master-only base price"}>
                              <Lock className="w-3 h-3 text-slate-400" />
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5 text-slate-700 font-mono font-medium">
                        <div>
                          <span className="font-bold">{formatCRC(combo.installationPriceCRC)}</span>
                          {(combo.installLabourCostCRC || (combo.installExtraParts && combo.installExtraParts.length > 0) || combo.installProfitCRC) ? (
                            <span className="block text-[9px] text-slate-500 font-sans mt-0.5">
                              MO: {formatCRC(combo.installLabourCostCRC || 0)} | Rep: {formatCRC((combo.installExtraParts || []).reduce((s, p) => s + (Number(p.priceCRC) || 0), 0))} | Gan: {formatCRC(combo.installProfitCRC || 0)}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCombo(combo)}
                            className="px-2.5 py-1 text-slate-700 hover:text-white bg-slate-100 hover:bg-slate-900 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                            title={lang === "es" ? "Editar Combo" : "Edit Combo"}
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>{lang === "es" ? "Editar" : "Edit"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleArchiveCombo(combo)}
                            className={`p-1.5 rounded-lg transition ${
                              combo.isArchived
                                ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            }`}
                            title={combo.isArchived ? t.comboUnarchiveBtn : t.comboArchiveBtn}
                          >
                            {combo.isArchived ? (
                              <ArchiveRestore className="w-3.5 h-3.5" />
                            ) : (
                              <Archive className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEliminateComboModal(combo)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title={t.comboEliminateBtn}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredCombos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 space-y-2">
                      <Layers className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-semibold text-xs text-slate-600">
                        {lang === "es"
                          ? "No se encontraron combos con los filtros seleccionados."
                          : "No combos found matching the selected filters."}
                      </p>
                      {hasActiveBackdoorFilters && (
                        <button
                          type="button"
                          onClick={handleClearBackdoorFilters}
                          className="text-xs font-bold text-[#C02030] hover:underline"
                        >
                          {lang === "es" ? "Limpiar todos los filtros" : "Clear all filters"}
                        </button>
                      )}
                    </td>
                  </tr>
                )}
            </tbody>
            </table>
          </div>
        </div>
      )}

      {renderGlobalModals()}
    </div>
  );
}
