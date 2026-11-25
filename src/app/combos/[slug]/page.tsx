"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { GarageModal } from "@/components/garage/GarageModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingConcierge } from "@/components/home/FloatingConcierge";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useGarage } from "@/context/GarageContext";
import { formatCRC, formatUSD, convertCRCToUSD } from "@/lib/i18n";
import {
  ConfigurableParameter,
  SelectedParameterItem,
  resolveOptionColorHex,
  resolveDualParameterConnection,
  ComboUniqueProduct,
  ComboUniqueProductField,
  ProductItem,
  normalizeBrandName,
  getRecommendedFillerProducts,
  getRecommendedFillerCombos,
  formatCompListWithYears,
  isUniversalFit,
  isPlatformOrVehicleMatch,
} from "@/lib/products";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTouchSwipe } from "@/lib/useTouchSwipe";
import { ProductThumbnailStrip } from "@/components/product/ProductThumbnailStrip";
import {
  Wrench,
  ShoppingCart,
  ArrowLeft,
  MessageCircle,
  Star,
  Car,
  ZoomIn,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Check,
  ShieldCheck,
  Truck,
  Sparkles,
  Home,
  Package,
  AlertCircle,
  Calendar,
  AlertTriangle,
  Sliders,
  FileText,
} from "lucide-react";
import { ProductReviewsSection } from "@/components/reviews/ProductReviewsSection";
import { SuggestedSection } from "@/components/product/SuggestedSection";

interface ComboItem {
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
  installationAvailable?: boolean;
  discountPercent: number;
  items: string[];
  imageUrl: string;
  imgs?: string[];
  images?: string[];
  homeInstallationAvailable?: boolean;
  availability?: any;
  stockStatus?: string;
  isAvailable?: boolean;
  leadDaysMin?: number;
  leadDaysMax?: number;
  parameters?: ConfigurableParameter[];
  uniqueProduct?: ComboUniqueProduct | null;
  reviews?: {
    stars: number;
    count?: number;
  } | null;
  suggestedProductIds?: string[];
  suggestedComboIds?: string[];
  suggestedProducts?: any[];
  suggestedCombos?: any[];
  relatedProducts?: any[];
  relatedCombos?: ComboItem[];
  comp?: string[];
  compDisplay?: string;
}

function StarRating({ stars, emptyLabel }: { stars?: number | null; emptyLabel?: string }) {
  const hasReviews = typeof stars === "number" && stars > 0;
  const rating = hasReviews ? Math.min(5, Math.max(1, stars)) : 0;

  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={hasReviews ? `Calificación: ${rating} de 5 estrellas` : "Sin reseñas aún"}
    >
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((starIndex) => (
          <Star
            key={starIndex}
            className={`w-4 h-4 ${
              hasReviews && starIndex <= Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300 stroke-[1.5]"
            }`}
          />
        ))}
      </div>
      {!hasReviews && emptyLabel && (
        <span className="text-xs text-gray-400 font-medium ml-1">
          {emptyLabel}
        </span>
      )}
    </div>
  );
}

export default function ComboDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const { t, lang } = useLanguage();
  const { items, addItem, currency, sellRate } = useCart();
  const { vehicle, openModal } = useGarage();

  const [combo, setCombo] = useState<ComboItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedImageOverride, setSelectedImageOverride] = useState<string | null>(null);

  // Selected Configurable Parameters State (parameterId -> optionId)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Unique Product Customization State (fieldId -> answer)
  const [uniqueAnswers, setUniqueAnswers] = useState<Record<string, string>>({});
  const [uniqueError, setUniqueError] = useState<string | null>(null);

  // Customer Text Input Fields State (parameterId -> value)
  const [textInputValues, setTextInputValues] = useState<Record<string, string>>({});
  const [textInputErrors, setTextInputErrors] = useState<Record<string, boolean>>({});
  const [textInputErrorMsg, setTextInputErrorMsg] = useState<string | null>(null);

  // Lightbox Modal state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);

  // Related combos state
  const [relatedCombos, setRelatedCombos] = useState<ComboItem[]>([]);

  // Related products state (up to 10 products dynamically filled by category or brand)
  const [relatedProducts, setRelatedProducts] = useState<ProductItem[]>([]);
  const [relatedProductsLoading, setRelatedProductsLoading] = useState(false);

  // Fetch / assemble related products matching compatible vehicle and category
  useEffect(() => {
    if (!combo) return;

    if (Array.isArray(combo.relatedProducts)) {
      setRelatedProducts(combo.relatedProducts.slice(0, 10));
      setRelatedProductsLoading(false);
      return;
    }

    setRelatedProductsLoading(true);
    fetch("/api/products", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products)) {
          const recommended = getRecommendedFillerProducts(
            combo,
            data.products,
            10,
            []
          );
          setRelatedProducts(recommended);
        }
      })
      .catch((err) => console.error("Error fetching related products for combo:", err))
      .finally(() => setRelatedProductsLoading(false));
  }, [combo]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    fetch(`/api/combos?slug=${encodeURIComponent(slug)}`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.combo && !data.data.combo.isArchived) {
          setCombo(data.data.combo);
          setActiveImageIndex(0);
          setSelectedImageOverride(null);
          setTextInputValues({});
          setTextInputErrors({});
          setTextInputErrorMsg(null);
          if (data.data.combo.parameters && Array.isArray(data.data.combo.parameters)) {
            const initialOpts: Record<string, string> = {};
            data.data.combo.parameters.forEach((param: any) => {
              if (param.type === "text_input" || param.type === "cart_addon") return;
              if (param.options && param.options.length > 0) {
                if (param.type === "combo_product_choice") {
                  const firstInStock = param.options.find((o: any) => !o.isOutOfStock);
                  initialOpts[param.id] = (firstInStock || param.options[0]).id;
                } else {
                  initialOpts[param.id] = param.options[0].id;
                }
              }
            });
            setSelectedOptions(initialOpts);
          }
          if (data.data.combo.uniqueProduct?.enabled && Array.isArray(data.data.combo.uniqueProduct.fields)) {
            const initialUnique: Record<string, string> = {};
            data.data.combo.uniqueProduct.fields.forEach((f: ComboUniqueProductField) => {
              if (f.type === "select" && f.options && f.options.length > 0) {
                initialUnique[f.id] = f.options[0];
              } else {
                initialUnique[f.id] = "";
              }
            });
            setUniqueAnswers(initialUnique);
          } else {
            setUniqueAnswers({});
          }
        } else {
          setCombo(null);
        }
      })
      .catch((err) => console.error("Error fetching combo detail:", err))
      .finally(() => setLoading(false));
  }, [slug]);

  // Fetch related combos strictly prioritizing vehicle compatibility and category
  useEffect(() => {
    if (!combo) return;
    if (Array.isArray(combo.relatedCombos)) {
      setRelatedCombos(combo.relatedCombos.slice(0, 4));
      return;
    }
    fetch("/api/combos", {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const comboList = Array.isArray(data?.combos)
          ? data.combos
          : (Array.isArray(data?.data?.combos) ? data.data.combos : []);

        if (comboList.length > 0) {
          const recommended = getRecommendedFillerCombos(
            combo,
            comboList,
            undefined,
            4,
            []
          );
          setRelatedCombos(recommended);
        }
      })
      .catch((err) => console.error("Error fetching related combos:", err));
  }, [combo, slug]);

  // Handle escape key to close lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      }
    };
    if (isLightboxOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isLightboxOpen]);

  const standardParameters = useMemo(() => {
    return (combo?.parameters || []).filter(
      (p) => p.type !== "text_input" && p.type !== "cart_addon"
    );
  }, [combo?.parameters]);

  const textInputParameters = useMemo(() => {
    return (combo?.parameters || []).filter((p) => p.type === "text_input");
  }, [combo?.parameters]);

  const filledTextParameterItems: SelectedParameterItem[] = useMemo(() => {
    const list: SelectedParameterItem[] = [];
    textInputParameters.forEach((param) => {
      const val = (textInputValues[param.id] || "").trim();
      if (val) {
        list.push({
          parameterId: param.id,
          parameterName: lang === "es" ? param.nameEs : (param.nameEn || param.nameEs),
          optionId: `txt_${encodeURIComponent(val).slice(0, 32)}`,
          optionLabel: val,
          priceDeltaCRC: 0,
        });
      }
    });
    return list;
  }, [textInputParameters, textInputValues, lang]);

  // Dynamic Calculation of Parameters & Price Delta (includes Combo-Exclusive Product Choice options)
  const selectedParametersList: SelectedParameterItem[] = useMemo(() => {
    if (standardParameters.length === 0) return [];
    const list: SelectedParameterItem[] = [];
    standardParameters.forEach((param) => {
      const selectedOptionId = selectedOptions[param.id] || param.options?.[0]?.id;
      const option = param.options?.find((o) => o.id === selectedOptionId);
      if (option) {
        list.push({
          parameterId: param.id,
          parameterName: lang === "es" ? param.nameEs : (param.nameEn || param.nameEs),
          optionId: option.id,
          optionLabel: lang === "es" ? option.labelEs : (option.labelEn || option.labelEs),
          priceDeltaCRC:
            param.type === "combo_product_choice"
              ? (option.liveProductPriceCRC ?? option.originalPriceDeltaCRC ?? option.priceDeltaCRC ?? 0)
              : (option.priceDeltaCRC || 0),
          priceDeltaUSD: option.priceDeltaUSD || 0,
          colorHex: option.colorHex,
          imageUrl: option.imageUrl,
          images: option.images || (option.imageUrl ? [option.imageUrl] : []),
          supplierUrl: option.supplierUrl,
          linkedProductId: option.choiceProductId || option.linkedProductId,
        });
      }
    });
    return list;
  }, [standardParameters, selectedOptions, lang]);

  // Track currently selected combo_product_choice options (for live out-of-stock reflection & original price)
  const selectedChoiceDetails = useMemo(() => {
    const details: Array<{
      paramId: string;
      paramName: string;
      optionId: string;
      label: string;
      sku?: string;
      priceDeltaCRC: number;
      originalPriceDeltaCRC: number;
      isOutOfStock: boolean;
    }> = [];
    standardParameters.forEach((param) => {
      if (param.type !== "combo_product_choice") return;
      const selectedOptionId = selectedOptions[param.id] || param.options?.[0]?.id;
      const option = param.options?.find((o) => o.id === selectedOptionId);
      if (!option) return;
      const supStatus = String(option.supplierStockStatus || "").toUpperCase();
      const isOut =
        Boolean(option.isOutOfStock) ||
        supStatus === "OUT_OF_STOCK" ||
        supStatus === "UNAVAILABLE" ||
        String(option.stockStatus || "").toLowerCase() === "agotado";
      const fullChoicePrice = option.liveProductPriceCRC ?? option.originalPriceDeltaCRC ?? option.priceDeltaCRC ?? 0;
      details.push({
        paramId: param.id,
        paramName: lang === "es" ? param.nameEs : (param.nameEn || param.nameEs),
        optionId: option.id,
        label: lang === "es" ? option.labelEs : (option.labelEn || option.labelEs),
        sku: option.choiceProductSku,
        priceDeltaCRC: fullChoicePrice,
        originalPriceDeltaCRC: fullChoicePrice,
        isOutOfStock: isOut,
      });
    });
    return details;
  }, [standardParameters, selectedOptions, lang]);

  const isSelectedChoiceOutOfStock = useMemo(
    () => selectedChoiceDetails.some((d) => d.isOutOfStock),
    [selectedChoiceDetails]
  );

  const isEffectivelyOutOfStock = Boolean(
    combo &&
      (combo.stockStatus === "OUT_OF_STOCK" ||
        combo.isAvailable === false ||
        isSelectedChoiceOutOfStock)
  );

  // Dual parameter matrix resolution (Param 1 x Param 2 expansion)
  const dualResolution = useMemo(() => {
    return resolveDualParameterConnection(standardParameters, selectedOptions);
  }, [standardParameters, selectedOptions]);

  // Complete combo image gallery (selected parameter variant images first, followed by deduplicated gallery images)
  const allImages = useMemo(() => {
    const list: string[] = [];

    // Prioritize photos from dual parameter connection if resolved
    if (Array.isArray(dualResolution.effectiveImages) && dualResolution.effectiveImages.length > 0) {
      dualResolution.effectiveImages.forEach((img) => {
        const s = typeof img === "string" ? img.trim() : "";
        if (s && !list.includes(s)) list.push(s);
      });
    }

    // Prioritize photos belonging to currently selected parameter options
    for (const item of selectedParametersList) {
      if (Array.isArray(item.images)) {
        item.images.forEach((img) => {
          const s = typeof img === "string" ? img.trim() : "";
          if (s && !list.includes(s)) list.push(s);
        });
      }
      if (item.imageUrl && typeof item.imageUrl === "string") {
        const s = item.imageUrl.trim();
        if (s && !list.includes(s)) list.push(s);
      }
    }

    if (combo?.imageUrl && typeof combo.imageUrl === "string") {
      const s = combo.imageUrl.trim();
      if (s && !list.includes(s)) list.push(s);
    }
    if (combo?.imgs && Array.isArray(combo.imgs)) {
      combo.imgs.forEach((img) => {
        const s = typeof img === "string" ? img.trim() : "";
        if (s && !list.includes(s)) list.push(s);
      });
    }
    if (combo?.images && Array.isArray(combo.images)) {
      combo.images.forEach((img) => {
        const s = typeof img === "string" ? img.trim() : "";
        if (s && !list.includes(s)) list.push(s);
      });
    }
    return list.length > 0 ? list : ["/images/sxs/z10_front.png"];
  }, [combo, selectedParametersList, dualResolution.effectiveImages]);

  const activeOptionImage = useMemo(() => {
    if (dualResolution.effectiveImages && dualResolution.effectiveImages[0]) {
      return dualResolution.effectiveImages[0];
    }
    for (const item of selectedParametersList) {
      if ((item as any).imageUrl) return (item as any).imageUrl;
    }
    return null;
  }, [selectedParametersList, dualResolution.effectiveImages]);

  const displayImageUrl = useMemo(() => {
    if (selectedImageOverride) return selectedImageOverride;
    return allImages[activeImageIndex] || allImages[0] || "/images/sxs/z10_front.png";
  }, [selectedImageOverride, allImages, activeImageIndex]);

  const totalDeltaCRC = useMemo(() => {
    const choiceDelta = selectedChoiceDetails.reduce((acc, c) => acc + (c.priceDeltaCRC || 0), 0);
    const nonChoiceParams = selectedParametersList.filter(
      (p) => !selectedChoiceDetails.some((c) => c.paramId === p.parameterId)
    );
    if (combo?.parameters && combo.parameters.length >= 2 && dualResolution.connection) {
      return dualResolution.effectivePriceDeltaCRC + choiceDelta;
    }
    const nonChoiceDelta = nonChoiceParams.reduce((acc, p) => acc + (p.priceDeltaCRC || 0), 0);
    return nonChoiceDelta + choiceDelta;
  }, [selectedParametersList, selectedChoiceDetails, combo?.parameters, dualResolution]);

  const totalOriginalDeltaCRC = useMemo(() => {
    const choiceOrig = selectedChoiceDetails.reduce((acc, c) => acc + (c.originalPriceDeltaCRC || 0), 0);
    const nonChoiceDelta = selectedParametersList
      .filter((p) => !selectedChoiceDetails.some((c) => c.paramId === p.parameterId))
      .reduce((acc, p) => acc + (p.priceDeltaCRC || 0), 0);
    return nonChoiceDelta + choiceOrig;
  }, [selectedParametersList, selectedChoiceDetails]);

  const effectivePriceCRC = (combo?.priceCRC || 0) + totalDeltaCRC;
  const effectiveOriginalPriceCRC = (combo?.originalPriceCRC || combo?.priceCRC || 0) + totalOriginalDeltaCRC;

  const combinedCartParameters = useMemo(() => {
    return [...selectedParametersList, ...filledTextParameterItems];
  }, [selectedParametersList, filledTextParameterItems]);

  const computedVariantId = useMemo(() => {
    if (!combo) return "";
    if (combinedCartParameters.length === 0) return `combo-${combo.id}`;
    const paramSlug = combinedCartParameters.map((p) => `${p.parameterId}_${p.optionId}`).join("__");
    return `combo-${combo.id}__${paramSlug}`;
  }, [combo, combinedCartParameters]);

  // Gallery navigation functions for touch swipe and tap
  const handleNextImage = useCallback(() => {
    if (allImages.length <= 1) return;
    setSelectedImageOverride(null);
    setActiveImageIndex((prev) => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const handlePrevImage = useCallback(() => {
    if (allImages.length <= 1) return;
    setSelectedImageOverride(null);
    setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  // Touch swipe support for main combo gallery (phone usage)
  const { touchHandlers: galleryTouchHandlers, isSwiping: isGallerySwiping } = useTouchSwipe({
    onSwipeLeft: handleNextImage,
    onSwipeRight: handlePrevImage,
    minDistance: 35,
  });

  // Touch swipe support for fullscreen lightbox modal
  const { touchHandlers: lightboxTouchHandlers } = useTouchSwipe({
    onSwipeLeft: () => {
      if (allImages.length <= 1) return;
      setLightboxImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
    },
    onSwipeRight: () => {
      if (allImages.length <= 1) return;
      setLightboxImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
    },
    minDistance: 40,
  });

  // Mobile Sticky Bottom Bar tracking
  const buySectionRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!buySectionRef.current) return;
      const rect = buySectionRef.current.getBoundingClientRect();
      setShowStickyBar(rect.bottom < 60);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const validateCustomerTextInputs = (): boolean => {
    if (textInputParameters.length === 0) return true;
    const missingIds: Record<string, boolean> = {};
    const missingNames: string[] = [];
    textInputParameters.forEach((param) => {
      const isReq = param.required !== false;
      const val = (textInputValues[param.id] || "").trim();
      if (isReq && !val) {
        missingIds[param.id] = true;
        missingNames.push(lang === "es" ? param.nameEs : (param.nameEn || param.nameEs));
      }
    });
    if (missingNames.length > 0) {
      setTextInputErrors(missingIds);
      setTextInputErrorMsg(
        `${t.customerTextInputMissingError || (lang === "es" ? "Por favor completa los siguientes campos obligatorios antes de continuar:" : "Please fill out the following required fields before continuing:")} ${missingNames.join(", ")}`
      );
      const el = document.getElementById("combo-customer-text-inputs");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    setTextInputErrors({});
    setTextInputErrorMsg(null);
    return true;
  };

  const handleAddToCart = () => {
    if (!combo) return;
    if (isEffectivelyOutOfStock) return;
    if (!validateCustomerTextInputs()) return;

    if (combo.uniqueProduct?.enabled && Array.isArray(combo.uniqueProduct.fields)) {
      const missingRequired = combo.uniqueProduct.fields.filter(
        (f) => f.required && !uniqueAnswers[f.id]?.trim()
      );
      if (missingRequired.length > 0) {
        const fieldNames = missingRequired
          .map((f) => (lang === "es" ? f.nameEs : f.nameEn || f.nameEs))
          .join(", ");
        setUniqueError(`${t.comboUniqueProductRequiredMissing} ${fieldNames}`);
        const el = document.getElementById("combo-unique-customization-section");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
    setUniqueError(null);

    const uniqueSummaryParts: string[] = [];
    if (combo.uniqueProduct?.enabled && Array.isArray(combo.uniqueProduct.fields)) {
      combo.uniqueProduct.fields.forEach((f) => {
        const val = uniqueAnswers[f.id];
        if (val && val.trim()) {
          const fn = lang === "es" ? f.nameEs : (f.nameEn || f.nameEs);
          uniqueSummaryParts.push(`${fn}: ${val.trim()}`);
        }
      });
    }
    const uniqueProductSummary = uniqueSummaryParts.join(" | ");

    const includesInstall = combo.installationAvailable !== false;

    addItem({
      type: "COMBO",
      id: `${computedVariantId || `combo-${combo.id}`}${uniqueProductSummary ? `-${encodeURIComponent(uniqueProductSummary).slice(0, 24)}` : ""}`,
      title: lang === "es" ? combo.titleEs : combo.titleEn,
      brand: "ZxZ Performance",
      comp: combo.comp && combo.comp.length > 0 ? combo.comp : ["all"],
      priceCRC: effectivePriceCRC,
      basePriceCRC: combo.priceCRC,
      selectedParameters: combinedCartParameters,
      installationAvailable: includesInstall,
      installationPriceCRC: 0,
      withInstallation: includesInstall,
      freeInstallation: includesInstall,
      homeInstallation: includesInstall ? (combo.homeInstallationAvailable ?? true) : false,
      imageUrl: activeOptionImage || combo.imageUrl,
      supplierUrl: dualResolution.effectiveSupplierUrl || null,
      supplierStockStatus: isEffectivelyOutOfStock ? "OUT_OF_STOCK" : (combo.stockStatus || combo.availability?.status || "IN_STOCK"),
      supplierStockMessage: lang === "es" ? combo.availability?.summaryEs : combo.availability?.summaryEn,
      supplierLeadDaysMin: combo.leadDaysMin || combo.availability?.leadDaysMin || 7,
      supplierLeadDaysMax: combo.leadDaysMax || combo.availability?.leadDaysMax || 21,
      uniqueProductCustomization: uniqueAnswers,
      uniqueProductSummary,
    });
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === "performance") return t.combosCategoryPerformance;
    if (cat === "rings") return t.combosCategoryRings;
    if (cat === "lights") return t.combosCategoryLights;
    return cat.charAt(0).toUpperCase() + cat.slice(1);
  };

  // Cart item matching
  const cartItem = items.find((i) => i.id === computedVariantId || (selectedParametersList.length === 0 && i.id === `combo-${combo?.id}`));
  const quantityInCart = cartItem?.quantity || 0;

  const displayPrice = combo
    ? currency === "USD"
      ? formatUSD(convertCRCToUSD(effectivePriceCRC, sellRate))
      : formatCRC(effectivePriceCRC)
    : "";

  const displayOriginalPrice = combo
    ? currency === "USD"
      ? formatUSD(convertCRCToUSD(effectiveOriginalPriceCRC, sellRate))
      : formatCRC(effectiveOriginalPriceCRC)
    : "";

  const savingsCRC = combo ? effectiveOriginalPriceCRC - effectivePriceCRC : 0;
  const displaySavings = combo && savingsCRC > 0
    ? currency === "USD"
      ? formatUSD(convertCRCToUSD(savingsCRC, sellRate))
      : formatCRC(savingsCRC)
    : null;

  const compDisplay = combo?.compDisplay || formatCompListWithYears(combo?.comp);
  const isUniversalCombo = isUniversalFit(combo?.comp);
  const isVehicleCompatible = Boolean(
    vehicle &&
      (isUniversalCombo ||
        combo?.comp?.some(
          (c) =>
            isPlatformOrVehicleMatch(c, vehicle.modelName) ||
            isPlatformOrVehicleMatch(c, vehicle.modelSlug) ||
            isPlatformOrVehicleMatch(c, `${vehicle.brandName} ${vehicle.modelName}`)
        ))
  );
  const hasExplicitSuggestedItems = Boolean(
    (combo?.suggestedProducts && combo.suggestedProducts.length > 0) ||
      (combo?.suggestedCombos && combo.suggestedCombos.length > 0)
  );

  return (
    <div className="min-h-screen bg-white text-[#111827] flex flex-col justify-between antialiased">
      <NotificationBanner />
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-24 sm:pb-16 w-full">
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
          <Link
            href="/combos"
            className="hover:text-black transition-colors"
          >
            <span>{t.comboBreadcrumb}</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-900 truncate max-w-xs">
            {combo ? (lang === "es" ? combo.titleEs : combo.titleEn) : slug}
          </span>
        </div>

        {/* Real Loading Skeleton (Rule 7: Mandatory Animated Skeleton Loaders) */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 animate-pulse">
            <div className="space-y-4">
              <div className="h-96 sm:h-[460px] w-full rounded-3xl bg-gray-200" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-20 bg-gray-100 rounded-2xl" />
                <div className="h-20 bg-gray-100 rounded-2xl" />
                <div className="h-20 bg-gray-100 rounded-2xl" />
              </div>
            </div>
            <div className="space-y-5">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-10 bg-gray-200 rounded w-1/2" />
              <div className="h-32 bg-gray-100 rounded-2xl" />
              <div className="h-24 bg-gray-100 rounded-2xl" />
              <div className="h-14 bg-gray-200 rounded-2xl" />
            </div>
          </div>
        ) : !combo ? (
          /* Empty / Not Found State */
          <div className="py-24 text-center max-w-md mx-auto space-y-4">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <h2 className="text-xl font-bold text-gray-900">
              {t.comboNotFound}
            </h2>
            <p className="text-xs text-gray-500">
              {t.comboNotFoundDesc}
            </p>
            <Link
              href="/combos"
              className="inline-block py-2.5 px-6 rounded-full bg-[#111827] text-white text-xs font-bold hover:bg-black transition-colors"
            >
              {t.comboBackToCombos}
            </Link>
          </div>
        ) : (
          /* Detailed Combo Screen Layout (Same standard as Product Detail) */
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
              {/* Left Column: Media Showcase & Trust Badges */}
              <div className="space-y-5">
                {/* Main Hero Image with Zoom Lightbox Trigger & Touch Swipe Gestures */}
                <div
                  onClick={() => {
                    if (isGallerySwiping()) return;
                    const currentIdx = selectedImageOverride
                      ? allImages.indexOf(selectedImageOverride) !== -1
                        ? allImages.indexOf(selectedImageOverride)
                        : 0
                      : activeImageIndex;
                    setLightboxImageIndex(currentIdx >= 0 ? currentIdx : 0);
                    setIsLightboxOpen(true);
                  }}
                  {...galleryTouchHandlers}
                  className="group relative h-80 sm:h-[460px] w-full rounded-3xl bg-gradient-to-b from-[#FBFBFC] to-[#F1F3F5] border border-gray-200 overflow-hidden flex items-center justify-center p-6 shadow-sm cursor-zoom-in touch-pan-y select-none"
                >
                  {/* Mobile Image Counter Badge */}
                  {allImages.length > 1 && (
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10 sm:hidden">
                      {((selectedImageOverride ? allImages.indexOf(selectedImageOverride) : activeImageIndex) + 1) || 1} / {allImages.length}
                    </div>
                  )}

                  <Image
                    src={displayImageUrl}
                    alt={lang === "es" ? combo.titleEs : combo.titleEn}
                    fill
                    priority
                    className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Enlarge Hint Badge */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-200/80 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-[11px] font-bold text-gray-700 shadow-sm opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all">
                    <ZoomIn className="w-3.5 h-3.5 text-[#C02030]" />
                    <span>
                      {lang === "es" ? "Ampliar imagen" : "Enlarge image"}
                    </span>
                  </div>

                  {/* Mobile Floating Chevrons for 1-Tap Swapping */}
                  {allImages.length > 1 && (
                    <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none sm:hidden z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrevImage();
                        }}
                        className="w-9 h-9 rounded-full bg-white/85 hover:bg-white backdrop-blur-md text-gray-800 border border-gray-200/80 shadow-md flex items-center justify-center pointer-events-auto active:scale-95 transition-transform"
                        aria-label={lang === "es" ? "Imagen anterior" : "Previous image"}
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-800" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNextImage();
                        }}
                        className="w-9 h-9 rounded-full bg-white/85 hover:bg-white backdrop-blur-md text-gray-800 border border-gray-200/80 shadow-md flex items-center justify-center pointer-events-auto active:scale-95 transition-transform"
                        aria-label={lang === "es" ? "Siguiente imagen" : "Next image"}
                      >
                        <ChevronRight className="w-4 h-4 text-gray-800" />
                      </button>
                    </div>
                  )}

                  {/* Mobile Pagination Indicator Dots */}
                  {allImages.length > 1 && (
                    <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-10 pointer-events-none sm:hidden">
                      {allImages.map((imgUrl, i) => {
                        const isCurrentActive =
                          (!selectedImageOverride && activeImageIndex === i) ||
                          selectedImageOverride === imgUrl;
                        return (
                          <span
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              isCurrentActive
                                ? "w-6 bg-[#C02030] shadow-sm"
                                : "w-1.5 bg-black/30"
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {allImages.length > 1 && (
                  <ProductThumbnailStrip
                    images={allImages}
                    activeIndex={activeImageIndex}
                    selectedImageUrl={selectedImageOverride}
                    onSelectImage={(i) => {
                      setActiveImageIndex(i);
                      setSelectedImageOverride(null);
                    }}
                    lang={lang}
                    size="md"
                    theme="light"
                  />
                )}

                {/* Technical Assurance / Guarantee Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/90 flex flex-col justify-between space-y-1">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-bold text-gray-900 block">
                      {lang === "es" ? "Garantía Taller ZxZ" : "ZxZ Workshop Warranty"}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {lang === "es" ? "60 días de mano de obra garantizada" : "60 days labor warranty included"}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/90 flex flex-col justify-between space-y-1">
                    <Truck className="w-5 h-5 text-[#C02030]" />
                    <span className="text-xs font-bold text-gray-900 block">
                      {lang === "es" ? "Importación USA Directa" : "Direct USA Freight"}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {lang === "es" ? "Impuestos y desalmacenaje incluidos" : "Customs and taxes all included"}
                    </span>
                  </div>

                  {combo.installationAvailable === false ? (
                    <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200/90 flex flex-col justify-between space-y-1">
                      <Truck className="w-5 h-5 text-sky-600" />
                      <span className="text-xs font-bold text-gray-900 block">
                        {t.comboDeliveryOnlyBadge || (lang === "es" ? "Solo Envío / Entrega" : "Delivery Only")}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {lang === "es" ? "Entrega directa en Costa Rica" : "Direct delivery in Costa Rica"}
                      </span>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/90 flex flex-col justify-between space-y-1">
                      <Wrench className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs font-bold text-gray-900 block">
                        {lang === "es" ? "Instalación Incluida" : "Installation Included"}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {lang === "es" ? "Santa Ana, San José, Costa Rica" : "Santa Ana, San José, Costa Rica"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Included Components (Boxed List) - Positioned on Left Column under media */}
                <div className="p-5 rounded-3xl bg-[#FBFBFC] border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#C02030]" />
                      <span>{t.combosIncludes}</span>
                    </h3>
                    <span className="text-[11px] font-mono text-gray-500 font-bold">
                      {combo.items.length + selectedChoiceDetails.length} {lang === "es" ? "piezas" : "items"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Unique Product / Service Highlight Card */}
                    {combo.uniqueProduct?.enabled && (
                      <div className="p-3.5 rounded-xl bg-gradient-to-r from-purple-50 via-slate-50 to-white border border-purple-200/90 shadow-2xs space-y-1.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                              <Sparkles className="w-4 h-4 text-amber-300" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-black text-slate-900">
                                  {lang === "es" ? combo.uniqueProduct.titleEs : (combo.uniqueProduct.titleEn || combo.uniqueProduct.titleEs)}
                                </span>
                              </div>
                              {combo.uniqueProduct.descriptionEs && (
                                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                                  {lang === "es" ? combo.uniqueProduct.descriptionEs : (combo.uniqueProduct.descriptionEn || combo.uniqueProduct.descriptionEs)}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 uppercase shrink-0 font-mono">
                            {combo.uniqueProduct.badgeEs || t.comboUniqueProductBadgeDefault}
                          </span>
                        </div>
                      </div>
                    )}

                    {combo.items.map((item, idx) => {
                      const compInfo = combo.availability?.components?.[idx] ||
                        combo.availability?.components?.find((c: any) => c.originalText === item || c.name === item);
                      const isOutOfStock = compInfo && (!compInfo.available || compInfo.status === "OUT_OF_STOCK" || compInfo.status === "UNAVAILABLE");
                      const isPreOrder = compInfo && compInfo.status === "PRE_ORDER";

                      return (
                        <div
                          key={idx}
                          className={`flex items-start justify-between gap-2.5 text-xs font-medium p-2.5 rounded-xl border transition-all ${
                            isOutOfStock
                              ? "bg-rose-50/70 border-rose-200 text-rose-950"
                              : isPreOrder
                              ? "bg-blue-50/50 border-blue-200 text-blue-950"
                              : "bg-white border-gray-100 text-gray-800"
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            {isOutOfStock ? (
                              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                            ) : isPreOrder ? (
                              <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            )}
                            <span className="truncate">{item}</span>
                          </div>

                          {/* Individual Part Status Badge */}
                          {compInfo && compInfo.hasProduct && (
                            <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                              {isOutOfStock ? (
                                <span className="text-rose-700 bg-rose-100/90 px-1.5 py-0.5 rounded font-mono">
                                  {t.comboComponentOutOfStock}
                                </span>
                              ) : isPreOrder ? (
                                <span className="text-blue-700 bg-blue-100/90 px-1.5 py-0.5 rounded font-mono">
                                  {t.comboComponentPreOrder}
                                </span>
                              ) : (
                                <span className="text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded font-mono">
                                  {t.comboComponentInStock}
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {/* Dynamically reflect currently selected combo_product_choice items */}
                    {selectedChoiceDetails.map((choice) => (
                      <div
                        key={`included-choice-${choice.paramId}-${choice.optionId}`}
                        className={`flex items-start justify-between gap-2.5 text-xs font-medium p-2.5 rounded-xl border transition-all ${
                          choice.isOutOfStock
                            ? "bg-rose-50/70 border-rose-200 text-rose-950"
                            : "bg-purple-50/40 border-purple-200/80 text-gray-900"
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          {choice.isOutOfStock ? (
                            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
                              {choice.paramName} ({t.comboChoiceProductLabel})
                            </span>
                            <span className="truncate block font-semibold">{choice.label}</span>
                          </div>
                        </div>
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                          {choice.isOutOfStock ? (
                            <span className="text-rose-700 bg-rose-100/90 px-1.5 py-0.5 rounded font-mono">
                              {t.comboComponentOutOfStock}
                            </span>
                          ) : (
                            <span className="text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded font-mono">
                              {t.comboComponentInStock}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Full Description Below Media Section */}
                <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-2">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                    {lang === "es" ? "Descripción & Rendimiento" : "Description & Performance"}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {lang === "es" ? combo.descriptionEs : combo.descriptionEn}
                  </p>
                </div>
              </div>

              {/* Right Column: Details, Components, Pricing & CTA (Stays fixed while scrolling left column until reaching recommended products) */}
              <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                {/* Badges Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-black text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full">
                    {getCategoryLabel(combo.category)}
                  </span>

                  {combo.discountPercent > 0 && (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                      -{combo.discountPercent}% OFF
                    </span>
                  )}

                  {combo.installationAvailable === false ? (
                    <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-800 border border-sky-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      <Truck className="w-3 h-3 text-sky-600" />
                      <span>{t.devDeliveryOnlyBadge || (lang === "es" ? "Solo Entrega / Envío" : "Delivery Only")}</span>
                    </span>
                  ) : combo.homeInstallationAvailable !== false ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      <Home className="w-3 h-3 text-emerald-600" />
                      <span>{t.cartHomeInstallationEligible}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                      <Wrench className="w-3 h-3 text-emerald-600" />
                      <span>
                        {lang === "es" ? "Instalación en Taller Incluida" : "Workshop Install Included"}
                      </span>
                    </span>
                  )}
                </div>

                {/* Title & Badge */}
                <div>
                  <span className="text-xs font-bold text-[#C02030] tracking-wider uppercase">
                    {lang === "es" ? combo.badgeEs : combo.badgeEn}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight mt-1">
                    {lang === "es" ? combo.titleEs : combo.titleEn}
                  </h1>

                  <div className="mt-2.5 flex items-center gap-4 flex-wrap">
                    {Boolean(combo.reviews?.count && combo.reviews.count > 0) ? (
                      <a href="#reviews-section" className="inline-block hover:opacity-80 transition-opacity">
                        <StarRating
                          stars={combo.reviews?.stars}
                          emptyLabel={lang === "es" ? "Especialidad ZxZ" : "ZxZ Specialty"}
                        />
                      </a>
                    ) : (
                      <StarRating
                        stars={combo.reviews?.stars}
                        emptyLabel={lang === "es" ? "Especialidad ZxZ" : "ZxZ Specialty"}
                      />
                    )}
                    <span className="text-xs text-gray-400">•</span>
                    {/* Live Dynamic Stock Badge based on listed products & selected choice options */}
                    {isEffectivelyOutOfStock ? (
                      <span className="text-xs text-rose-700 font-bold flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>{t.devComboStockOutOfStock}</span>
                      </span>
                    ) : combo.stockStatus === "PRE_ORDER" ? (
                      <span className="text-xs text-blue-700 font-bold flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>{lang === "es" ? `Bajo Pre-Orden (${combo.leadDaysMin || 10}-${combo.leadDaysMax || 20} días)` : `Pre-Order (${combo.leadDaysMin || 10}-${combo.leadDaysMax || 20} days)`}</span>
                      </span>
                    ) : combo.stockStatus === "LOW_STOCK" ? (
                      <span className="text-xs text-amber-700 font-bold flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>{t.devComboStockLowStock}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{lang === "es" ? "En stock para importación / taller" : "Available for import & shop"}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Out of Stock Warning Alert */}
                {isEffectivelyOutOfStock && (
                  <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-rose-900">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>{t.comboOutOfStockAlertTitle}</span>
                    </div>
                    <p className="text-xs text-rose-900 leading-relaxed">
                      {isSelectedChoiceOutOfStock
                        ? t.comboChoiceSelectedOutOfStockNotice
                        : t.comboOutOfStockAlertDesc}
                    </p>
                    {((combo.availability?.outOfStockComponents?.length ?? 0) > 0 || isSelectedChoiceOutOfStock) && (
                      <div className="text-[11px] text-rose-800 font-semibold bg-white/90 p-2.5 rounded-xl border border-rose-200">
                        <span className="block font-bold mb-1 text-rose-950">
                          {lang === "es" ? "Componentes afectados:" : "Affected components:"}
                        </span>
                        <ul className="list-disc list-inside space-y-0.5">
                          {(combo.availability?.outOfStockComponents || []).map((c: any, i: number) => (
                            <li key={`fixed-${i}`}>
                              <span className="font-bold">{c.name}</span> {c.sku ? `(#${c.sku})` : ""} -{" "}
                              <span className="text-rose-600 font-bold">{t.comboComponentOutOfStock}</span>
                            </li>
                          ))}
                          {selectedChoiceDetails
                            .filter((d) => d.isOutOfStock)
                            .map((d) => (
                              <li key={`choice-${d.paramId}-${d.optionId}`}>
                                <span className="font-bold">{d.label}</span> {d.sku ? `(#${d.sku})` : ""} -{" "}
                                <span className="text-rose-600 font-bold">{t.comboChoiceOutOfStockBadge}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Configurable Parameters & Options */}
                {standardParameters.length > 0 && (
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-[#C02030]" />
                        <span>{t.productParametersTitle}</span>
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {standardParameters.map((param) => {
                        const activeOptionId = selectedOptions[param.id] || param.options?.[0]?.id;
                        const paramTitle = lang === "es" ? param.nameEs : (param.nameEn || param.nameEs);
                        const isChoiceParam = param.type === "combo_product_choice";

                        return (
                          <div key={param.id} className="space-y-2">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="font-bold text-gray-800 flex items-center gap-1.5">
                                {isChoiceParam && <Package className="w-3.5 h-3.5 text-[#C02030]" />}
                                <span>{paramTitle}:</span>
                              </span>
                              <span className="font-semibold text-gray-600 truncate max-w-[60%] text-right">
                                {(() => {
                                  const currentOpt = param.options.find((o) => o.id === activeOptionId);
                                  if (!currentOpt) return "";
                                  return lang === "es" ? currentOpt.labelEs : (currentOpt.labelEn || currentOpt.labelEs);
                                })()}
                              </span>
                            </div>

                            {isChoiceParam ? (
                              <div className="grid grid-cols-1 gap-2">
                                {param.options.map((opt) => {
                                  const isSelected = opt.id === activeOptionId;
                                  const optLabel = lang === "es" ? opt.labelEs : (opt.labelEn || opt.labelEs);
                                  const optThumb = opt.imageUrl || (Array.isArray(opt.images) && opt.images[0] ? opt.images[0] : "/images/logo.png");
                                  const supStatus = String(opt.supplierStockStatus || "").toUpperCase();
                                  const isOut =
                                    Boolean(opt.isOutOfStock) ||
                                    supStatus === "OUT_OF_STOCK" ||
                                    supStatus === "UNAVAILABLE" ||
                                    String(opt.stockStatus || "").toLowerCase() === "agotado";
                                  const choicePriceCRC = opt.liveProductPriceCRC ?? opt.originalPriceDeltaCRC ?? opt.priceDeltaCRC ?? 0;

                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedOptions((prev) => ({
                                          ...prev,
                                          [param.id]: opt.id,
                                        }));
                                        if (optThumb && optThumb !== "/images/logo.png") {
                                          setSelectedImageOverride(optThumb);
                                          setActiveImageIndex(0);
                                        }
                                      }}
                                      className={`w-full p-3 rounded-2xl text-left transition-all flex items-center justify-between gap-3 cursor-pointer border ${
                                        isOut
                                          ? isSelected
                                            ? "bg-gray-100 border-rose-400 ring-2 ring-rose-300/40 text-gray-600"
                                            : "bg-gray-100/80 border-gray-200 text-gray-500 opacity-75 hover:opacity-95"
                                          : isSelected
                                          ? "bg-white border-[#C02030] ring-2 ring-[#C02030]/20 shadow-sm"
                                          : "bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50/70"
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div
                                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                            isSelected
                                              ? isOut
                                                ? "border-rose-500 bg-rose-500"
                                                : "border-[#C02030] bg-[#C02030]"
                                              : "border-gray-300 bg-white"
                                          }`}
                                        >
                                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>

                                        <img
                                          src={optThumb}
                                          alt={optLabel}
                                          className={`w-11 h-11 rounded-xl object-contain bg-white border border-gray-200 p-1 shrink-0 ${
                                            isOut ? "grayscale opacity-60" : ""
                                          }`}
                                        />

                                        <div className="min-w-0 flex-1">
                                          <span
                                            className={`text-xs font-bold block leading-snug line-clamp-2 ${
                                              isOut ? "text-gray-500 line-through decoration-gray-400" : "text-gray-900"
                                            }`}
                                          >
                                            {optLabel}
                                          </span>
                                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                            {isOut ? (
                                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                                <AlertCircle className="w-3 h-3" />
                                                <span>{t.comboChoiceOutOfStockBadge}</span>
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                <CheckCircle2 className="w-3 h-3" />
                                                <span>{t.comboChoiceInStockBadge}</span>
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="text-right shrink-0">
                                        <span
                                          className={`text-xs font-black font-mono block ${
                                            isOut
                                              ? "text-gray-400"
                                              : isSelected
                                              ? "text-[#C02030]"
                                              : "text-gray-900"
                                          }`}
                                        >
                                          +{currency === "USD" ? formatUSD(convertCRCToUSD(choicePriceCRC, sellRate)) : formatCRC(choicePriceCRC)}
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2.5">
                                {param.options.map((opt) => {
                                  const isSelected = opt.id === activeOptionId;
                                  const optLabel = lang === "es" ? opt.labelEs : (opt.labelEn || opt.labelEs);
                                  const resolvedColor = resolveOptionColorHex(optLabel, opt.colorHex);
                                  const optThumb = opt.imageUrl || (Array.isArray(opt.images) && opt.images[0] ? opt.images[0] : null);

                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedOptions((prev) => ({
                                          ...prev,
                                          [param.id]: opt.id,
                                        }));
                                        if (optThumb) {
                                          setSelectedImageOverride(optThumb);
                                          setActiveImageIndex(0);
                                        }
                                      }}
                                      className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border shadow-2xs ${
                                        isSelected
                                          ? "bg-[#C02030] border-[#C02030] text-white shadow-md scale-[1.02] ring-2 ring-[#C02030]/25"
                                          : "bg-white border-gray-200 text-gray-800 hover:border-gray-400 hover:bg-gray-50"
                                      }`}
                                    >
                                      {optThumb && (
                                        <img
                                          src={optThumb}
                                          alt={optLabel}
                                          className="w-5 h-5 rounded-md object-cover border border-gray-200/50 shrink-0"
                                        />
                                      )}
                                      {resolvedColor && (
                                        <span
                                          className={`w-3.5 h-3.5 rounded-full border shadow-2xs shrink-0 ${
                                            isSelected ? "border-white ring-1 ring-white/60" : "border-gray-300"
                                          }`}
                                          style={{ backgroundColor: resolvedColor }}
                                        />
                                      )}
                                      <span>{optLabel}</span>
                                      {(opt.priceDeltaCRC !== 0 || (opt.priceDeltaUSD !== undefined && opt.priceDeltaUSD !== 0)) && (
                                        <span
                                          className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md ${
                                            isSelected
                                              ? "bg-black/25 text-white"
                                              : "bg-gray-100 text-[#C02030]"
                                          }`}
                                        >
                                          {opt.priceDeltaCRC !== 0
                                            ? (opt.priceDeltaCRC > 0
                                                ? `+${formatCRC(opt.priceDeltaCRC)}`
                                                : `-${formatCRC(Math.abs(opt.priceDeltaCRC))}`)
                                            : (opt.priceDeltaUSD && opt.priceDeltaUSD > 0
                                                ? `+$${opt.priceDeltaUSD}`
                                                : `-$${Math.abs(opt.priceDeltaUSD || 0)}`)}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Unique Product / Custom Service Customization Card */}
                {combo.uniqueProduct?.enabled && combo.uniqueProduct.fields && combo.uniqueProduct.fields.length > 0 && (
                  <div id="combo-unique-customization-section" className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50/70 via-white to-slate-50 border-2 border-purple-200/90 shadow-xs space-y-4">
                    <div className="flex items-start justify-between gap-3 border-b border-purple-100 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                            <Wrench className="w-3.5 h-3.5" />
                          </span>
                          <span className="text-xs font-black uppercase tracking-wider text-purple-950">
                            {t.comboUniqueProductCustomizationTitle}
                          </span>
                        </div>
                        <p className="text-[11px] text-purple-800/80 leading-relaxed">
                          {t.comboUniqueProductCustomizationSubtitle}
                        </p>
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 shrink-0 font-mono">
                        {combo.uniqueProduct.badgeEs || t.comboUniqueProductBadgeDefault}
                      </span>
                    </div>

                    {uniqueError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{uniqueError}</span>
                      </div>
                    )}

                    <div className="space-y-3.5">
                      {combo.uniqueProduct.fields.map((field) => {
                        const fieldVal = uniqueAnswers[field.id] || "";
                        const fieldLabel = lang === "es" ? field.nameEs : (field.nameEn || field.nameEs);
                        const placeholder = lang === "es" ? (field.placeholderEs || "") : (field.placeholderEn || field.placeholderEs || "");

                        return (
                          <div key={field.id} className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <span>{fieldLabel}</span>
                                {field.required ? (
                                  <span className="text-rose-600 font-bold text-[10px]">*</span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-normal">({lang === "es" ? "Opcional" : "Optional"})</span>
                                )}
                              </span>
                            </label>

                            {field.type === "select" && Array.isArray(field.options) && field.options.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {field.options.map((opt, oIdx) => {
                                  const isSelected = fieldVal === opt;
                                  return (
                                    <button
                                      key={oIdx}
                                      type="button"
                                      onClick={() => {
                                        setUniqueAnswers((prev) => ({ ...prev, [field.id]: opt }));
                                        setUniqueError(null);
                                      }}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                                        isSelected
                                          ? "bg-purple-700 text-white border-purple-700 shadow-xs ring-2 ring-purple-400/30 scale-[1.01]"
                                          : "bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/40"
                                      }`}
                                    >
                                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                      <span>{opt}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <input
                                type={field.type === "number" ? "number" : "text"}
                                value={fieldVal}
                                onChange={(e) => {
                                  setUniqueAnswers((prev) => ({ ...prev, [field.id]: e.target.value }));
                                  setUniqueError(null);
                                }}
                                placeholder={placeholder}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Price Block & Inherited Compatibility Tags */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-extrabold font-mono text-gray-900">
                        {displayPrice}
                      </span>
                      {effectiveOriginalPriceCRC > effectivePriceCRC && (
                        <span className="text-sm text-gray-400 line-through font-mono">
                          {displayOriginalPrice}
                        </span>
                      )}
                      {displaySavings && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md font-mono">
                          {t.comboSavings} {displaySavings}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-500 block mt-1">
                      {lang === "es"
                        ? "Precios finales con impuestos de importación y fletes incluidos."
                        : "Final prices include US freight and Costa Rica customs duties."}
                    </span>
                  </div>

                  {/* Compatibility & Year Model inherited from listed products */}
                  {compDisplay && (
                    <div className="flex items-center gap-2 pt-2.5 border-t border-gray-200/70 text-xs flex-wrap">
                      <span className="font-bold text-gray-900 flex items-center gap-1.5">
                        <Car className="w-4 h-4 text-[#C02030]" />
                        <span>{lang === "es" ? "Compatibilidad:" : "Compatibility:"}</span>
                      </span>
                      <span className="font-extrabold text-gray-800 font-mono">
                        {compDisplay}
                      </span>
                    </div>
                  )}

                  {/* Registered Garage Vehicle Compatibility Check */}
                  {vehicle ? (
                    isVehicleCompatible ? (
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs">
                        <div className="flex items-center gap-2 text-emerald-950 font-bold min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="truncate">
                            {lang === "es" ? "Es compatible con tu" : "Compatible with your"}{" "}
                            <span className="underline decoration-emerald-400">
                              {vehicle.brandName} {vehicle.modelName} ({vehicle.year})
                            </span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openModal()}
                          className="text-[11px] text-emerald-700 font-semibold underline hover:text-emerald-900 cursor-pointer flex-shrink-0"
                        >
                          {t.combosChangeVehicle}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-rose-50/90 border border-rose-200 text-xs">
                        <div className="flex items-center gap-2 text-rose-950 font-bold min-w-0">
                          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                          <span className="truncate">
                            {lang === "es" ? "No es compatible con tu" : "Not compatible with your"}{" "}
                            <span className="line-through decoration-rose-400">
                              {vehicle.brandName} {vehicle.modelName}
                            </span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openModal()}
                          className="text-[11px] text-rose-700 font-semibold underline hover:text-rose-900 cursor-pointer flex-shrink-0"
                        >
                          {t.combosChangeVehicle}
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs">
                      <div className="flex items-center gap-2 text-amber-950 font-medium min-w-0">
                        <Car className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span className="truncate">
                          {t.comboFitmentPrompt}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openModal()}
                        className="text-[11px] text-amber-800 font-bold underline hover:text-amber-950 cursor-pointer flex-shrink-0 whitespace-nowrap"
                      >
                        {t.combosSelectVehicle}
                      </button>
                    </div>
                  )}
                </div>

                {/* Combo Installation Status Banner (Included in Price vs Delivery Only) */}
                {combo.installationAvailable === false ? (
                  <div className="p-4 rounded-2xl border bg-sky-50/70 border-sky-200 text-sky-950 flex items-center justify-between gap-3 select-none">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-sky-950">
                          {t.comboDeliveryOnlyTitle || (lang === "es" ? "Solo Entrega / Envío (Sin Instalación)" : "Delivery / Shipping Only (No Installation)")}
                        </p>
                        <p className="text-[11px] text-sky-800/80 leading-snug mt-0.5">
                          {t.comboDeliveryOnlyDesc ||
                            (lang === "es"
                              ? "Este combo no incluye servicio de instalación; se entrega o envía directamente."
                              : "This combo does not include installation; delivered or shipped directly.")}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-300/70 px-2.5 py-1 rounded-full shrink-0">
                      {t.comboDeliveryOnlyBadge || (lang === "es" ? "Solo Envío" : "Delivery Only")}
                    </span>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border bg-emerald-50/70 border-emerald-200 text-emerald-950 flex items-center justify-between gap-3 select-none">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-emerald-950">
                          {t.comboInstallIncludedTitle || (lang === "es" ? "Instalación Profesional Incluida" : "Professional Installation Included")}
                        </p>
                        <p className="text-[11px] text-emerald-800/85 leading-snug mt-0.5">
                          {t.comboInstallIncludedDesc ||
                            (lang === "es"
                              ? "Ya está incluida en el precio del combo · Se coordina mediante nuestro sistema de servicios de instalación"
                              : "Already included in the combo price · Scheduled through our installation services system")}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300/70 px-2.5 py-1 rounded-full shrink-0">
                      {t.comboInstallationIncluded || (lang === "es" ? "Incluida" : "Included")}
                    </span>
                  </div>
                )}

                {/* Customer Text Input Fields (Immediately Above Add to Cart) */}
                {textInputParameters.length > 0 && (
                  <div
                    id="combo-customer-text-inputs"
                    className="p-4 sm:p-5 rounded-3xl bg-gray-50 border border-gray-200/80 shadow-xs space-y-4"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-gray-200/70 pb-2.5">
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-[#111827] flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-[#C02030]" />
                          <span>
                            {t.customerTextInputsTitle ||
                              (lang === "es"
                                ? "Información Requerida para tu Pedido"
                                : "Required Information for Your Order")}
                          </span>
                        </span>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                          {t.customerTextInputsDesc ||
                            (lang === "es"
                              ? "Completa los siguientes datos para personalizar y procesar tu pedido correctamente."
                              : "Please fill out the following details to customize and process your order accurately.")}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {textInputParameters.map((field) => {
                        const isReq = field.required !== false;
                        const hasError = Boolean(textInputErrors[field.id]);
                        const fieldLabel =
                          lang === "es"
                            ? field.nameEs || field.nameEn || ""
                            : field.nameEn || field.nameEs || "";
                        const fieldPlaceholder =
                          lang === "es"
                            ? field.placeholderEs || field.placeholderEn || "Escribe aquí..."
                            : field.placeholderEn || field.placeholderEs || "Type here...";

                        return (
                          <div key={field.id} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <label
                                htmlFor={`combo-txt-${field.id}`}
                                className="text-xs font-bold text-[#111827] flex items-center gap-1"
                              >
                                <span>{fieldLabel}</span>
                                {isReq && <span className="text-[#C02030]">*</span>}
                              </label>
                              <span
                                className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  isReq
                                    ? "bg-[#C02030]/10 text-[#C02030]"
                                    : "bg-gray-200/80 text-gray-600"
                                }`}
                              >
                                {isReq
                                  ? t.customerTextInputRequiredBadge || (lang === "es" ? "Requerido" : "Required")
                                  : t.customerTextInputOptionalBadge || (lang === "es" ? "Opcional" : "Optional")}
                              </span>
                            </div>
                            <input
                              id={`combo-txt-${field.id}`}
                              type="text"
                              required={isReq}
                              value={textInputValues[field.id] || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTextInputValues((prev) => ({ ...prev, [field.id]: val }));
                                if (textInputErrors[field.id] && val.trim()) {
                                  setTextInputErrors((prev) => {
                                    const next = { ...prev };
                                    delete next[field.id];
                                    return next;
                                  });
                                  setTextInputErrorMsg(null);
                                }
                              }}
                              placeholder={fieldPlaceholder}
                              className={`w-full rounded-2xl bg-white border px-4 py-3 text-xs sm:text-sm font-medium text-[#111827] placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
                                hasError
                                  ? "border-[#C02030] ring-2 ring-[#C02030]/20 bg-rose-50/30"
                                  : "border-gray-200 hover:border-gray-300 focus:border-[#C02030] focus:ring-[#C02030]/15"
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {textInputErrorMsg && (
                      <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-[#C02030] shrink-0 mt-0.5" />
                        <span>{textInputErrorMsg}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Add to Cart & Inquiry Actions */}
                <div ref={buySectionRef} className="space-y-3 pt-2">
                  {isEffectivelyOutOfStock ? (
                    <Link
                      href={`/cotizar?tipo=combo&id=${combo.slug}`}
                      className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[#C02030] hover:bg-[#9A1624] text-white font-extrabold text-sm uppercase tracking-wider transition-colors shadow-md"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{t.comboQuoteBecauseOutOfStock}</span>
                    </Link>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[#111827] hover:bg-[#C02030] text-white font-extrabold text-sm uppercase tracking-wider transition-colors shadow-md"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>
                        {quantityInCart > 0
                          ? `${t.comboAddToCart} (${quantityInCart} en carrito)`
                          : t.comboAddToCart}
                      </span>
                    </button>
                  )}

                  <div className="flex gap-2">
                    <Link
                      href={`/cotizar?tipo=combo&id=${combo.slug}`}
                      className="flex-1 py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-[#C02030]" />
                      <span>
                        {lang === "es"
                          ? "Consultar o Cotizar por WhatsApp"
                          : "Inquire or Quote via WhatsApp"}
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Suggestions Section (ONLY shown if products or combos were explicitly attached to this combo) */}
                {hasExplicitSuggestedItems && (
                  <SuggestedSection
                    suggestedProducts={combo.suggestedProducts || []}
                    suggestedCombos={combo.suggestedCombos || []}
                    isLoading={loading}
                  />
                )}
              </div>
            </div>

            {/* Related & Suggested Products Shelf (up to 10 products, dynamically filled by category or brand) */}
            {(relatedProductsLoading || relatedProducts.length > 0) && (
              <section className="mt-14 pt-10 border-t border-gray-200">
                <div className="mb-6 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C02030]" />
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                      {t.productSuggestedProductsTitle || (lang === "es" ? "Productos Recomendados y Relacionados" : "Recommended & Related Products")}
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {t.productSuggestedProductsSubtitle || (lang === "es" ? "Piezas y accesorios complementarios que se adaptan a tu vehículo" : "Complementary parts and upgrades engineered for your vehicle")}
                  </p>
                </div>

                {relatedProductsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-72 w-full rounded-3xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                    {relatedProducts.slice(0, 10).map((rel) => {
                      const isFree = rel.price?.I_price?.includes ?? (rel as any).isInstallationIncluded ?? false;
                      const brandDisplay = normalizeBrandName(rel.brand?.[0] || (rel as any).brandName || "");
                      const relPriceDisplay = currency === "USD"
                        ? formatUSD(convertCRCToUSD(rel.price?.T_price ?? (rel as any).priceCRC ?? 0, sellRate))
                        : formatCRC(rel.price?.T_price ?? (rel as any).priceCRC ?? 0);

                      return (
                        <Link
                          key={rel.id}
                          href={`/productos/${rel.slug || rel.id}`}
                          className="group flex flex-col bg-white rounded-3xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-gray-300 transition-all duration-300 p-4"
                        >
                          <div className="relative h-44 w-full bg-gradient-to-b from-[#FBFBFC] to-[#F1F3F5] rounded-2xl overflow-hidden mb-3">
                            <Image
                              src={rel.imgs?.[0] || (rel as any).imageUrl || "/images/logo.png"}
                              alt={rel.p_title || (rel as any).nameEs || "Product"}
                              fill
                              className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="flex-1 flex flex-col justify-between space-y-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {brandDisplay && (
                                  <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {brandDisplay}
                                  </span>
                                )}
                                {rel.category?.[0] && (
                                  <span className="text-[10px] font-bold text-[#C02030] bg-[#C02030]/10 px-2 py-0.5 rounded-full">
                                    {getCategoryLabel(rel.category[0])}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-bold text-xs text-gray-900 group-hover:text-[#C02030] transition-colors line-clamp-2">
                                {lang === "es" ? ((rel as any).nameEs || rel.p_title) : ((rel as any).nameEn || rel.p_title)}
                              </h3>
                            </div>

                            <div className="pt-2 border-t border-gray-100 space-y-1">
                              <div className="text-base font-black text-gray-900 font-mono">
                                {relPriceDisplay}
                              </div>
                              {isFree && (
                                <span className="text-[10px] font-bold text-emerald-700 block">
                                  {t.productsInstallationFree || (lang === "es" ? "Instalación Gratis" : "Free Installation")}
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Related Combos Section */}
            {relatedCombos.length > 0 && (
              <div className="mt-20 pt-12 border-t border-gray-200">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                      {t.comboRelatedTitle}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {t.comboRelatedSubtitle}
                    </p>
                  </div>
                  <Link
                    href="/combos"
                    className="text-xs font-bold text-[#C02030] hover:underline flex items-center gap-1"
                  >
                    <span>{t.comboBackToCombos}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedCombos.slice(0, 3).map((rel) => {
                    const relPrice =
                      currency === "USD"
                        ? formatUSD(convertCRCToUSD(rel.priceCRC, sellRate))
                        : formatCRC(rel.priceCRC);

                    return (
                      <div
                        key={rel.id}
                        onClick={() => router.push(`/combos/${rel.slug}`)}
                        className="group bg-white rounded-3xl border border-gray-200 hover:border-gray-400 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer"
                      >
                        <div>
                          <div className="relative w-full h-48 bg-[#F4F5F7] overflow-hidden flex items-center justify-center p-4">
                            <Image
                              src={rel.imageUrl}
                              alt={lang === "es" ? rel.titleEs : rel.titleEn}
                              fill
                              className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                            <div className="absolute top-3 left-3">
                              <span className="bg-black/85 backdrop-blur-md text-white text-[10px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full">
                                {getCategoryLabel(rel.category)}
                              </span>
                            </div>
                            {rel.discountPercent > 0 && (
                              <div className="absolute top-3 right-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                                -{rel.discountPercent}%
                              </div>
                            )}
                          </div>

                          <div className="p-4">
                            <span className="text-[10px] font-bold text-[#C02030] tracking-wide uppercase">
                              {lang === "es" ? rel.badgeEs : rel.badgeEn}
                            </span>
                            <h3 className="text-sm font-bold text-gray-900 tracking-tight leading-snug mt-0.5 group-hover:text-[#C02030] transition-colors line-clamp-1">
                              {lang === "es" ? rel.titleEs : rel.titleEn}
                            </h3>
                            <div className="pt-2">
                              <span className="text-base font-extrabold font-mono text-gray-900">
                                {relPrice}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 pt-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/combos/${rel.slug}`);
                            }}
                            className="w-full flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-gray-100 group-hover:bg-[#111827] group-hover:text-white text-gray-800 font-bold text-xs transition-colors"
                          >
                            <span>{t.comboViewDetails}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Verified Customer Reviews Section (Placed at the very bottom) */}
            <ProductReviewsSection
              comboId={combo.id}
              comboSlug={combo.slug}
              itemTitle={lang === "es" ? combo.titleEs : combo.titleEn}
              initialReviewCount={combo.reviews?.count || 0}
              onRatingUpdated={(newRating) => {
                setCombo((prev) => {
                  if (!prev) return prev;
                  if (
                    prev.reviews?.stars === newRating.stars &&
                    prev.reviews?.count === newRating.count
                  ) {
                    return prev;
                  }
                  return { ...prev, reviews: newRating };
                });
              }}
            />
          </div>
        )}
      </main>

      {/* Lightbox Modal for Full Image Zoom Preview */}
      {isLightboxOpen && combo && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between w-full max-w-6xl mx-auto z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-white font-extrabold text-sm sm:text-base line-clamp-1">
                {lang === "es" ? combo.titleEs : combo.titleEn}
              </span>
              {allImages.length > 1 && (
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-[11px] font-mono">
                  {lightboxImageIndex + 1} / {allImages.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Cerrar imagen ampliada"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center Image with Previous / Next & Touch Swipe */}
          <div
            className="flex-1 relative flex items-center justify-center max-w-6xl mx-auto w-full p-2 sm:p-6 touch-pan-y select-none"
            onClick={(e) => e.stopPropagation()}
            {...lightboxTouchHandlers}
          >
            {allImages.length > 1 && (
              <button
                onClick={() =>
                  setLightboxImageIndex((prev) =>
                    prev === 0 ? allImages.length - 1 : prev - 1
                  )
                }
                className="absolute left-2 sm:left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div className="relative w-full h-full max-h-[75vh] flex items-center justify-center">
              <Image
                src={
                  allImages[lightboxImageIndex] ||
                  allImages[0] ||
                  "/images/sxs/z10_front.png"
                }
                alt={lang === "es" ? combo.titleEs : combo.titleEn}
                fill
                className="object-contain"
                priority
              />
            </div>

            {allImages.length > 1 && (
              <button
                onClick={() =>
                  setLightboxImageIndex((prev) =>
                    prev === allImages.length - 1 ? 0 : prev + 1
                  )
                }
                className="absolute right-2 sm:right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Siguiente imagen"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Lightbox Footer Thumbnails */}
          {allImages.length > 1 && (
            <div
              className="max-w-xl mx-auto w-full px-4"
              onClick={(e) => e.stopPropagation()}
            >
              <ProductThumbnailStrip
                images={allImages}
                activeIndex={lightboxImageIndex}
                onSelectImage={(i) => setLightboxImageIndex(i)}
                lang={lang}
                size="sm"
                theme="dark"
                showCounter={false}
              />
            </div>
          )}
        </div>
      )}

      {/* Mobile Phone Sticky Buy Action Bar */}
      {showStickyBar && combo && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 sm:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.12)] flex items-center justify-between gap-3 animate-fade-in pb-safe">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative w-11 h-11 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
              <Image
                src={displayImageUrl}
                alt={lang === "es" ? combo.titleEs : combo.titleEn}
                fill
                className="object-contain p-1"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 truncate">
                {lang === "es" ? combo.titleEs : combo.titleEn}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-black text-[#C02030] font-mono">
                  {formatCRC(effectivePriceCRC)}
                </span>
                {currency === "USD" && (
                  <span className="text-[10px] font-bold text-gray-400 font-mono">
                    ({formatUSD(convertCRCToUSD(effectivePriceCRC, sellRate))})
                  </span>
                )}
              </div>
            </div>
          </div>

          {isEffectivelyOutOfStock ? (
            <Link
              href={`/cotizar?tipo=combo&id=${combo.slug}`}
              className="px-4 py-2.5 rounded-full bg-[#C02030] hover:bg-[#9A1624] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{t.comboChoiceOutOfStockBadge}</span>
            </Link>
          ) : (
            <button
              onClick={handleAddToCart}
              className="px-4 py-2.5 rounded-full bg-[#111827] hover:bg-[#C02030] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0 cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{t.comboAddToCart}</span>
            </button>
          )}
        </div>
      )}

      {/* Global Site Footer */}
      <Footer />

      {/* Global Modals & Drawers */}
      <GarageModal />
      <CartDrawer />
      <FloatingConcierge />
    </div>
  );
}
