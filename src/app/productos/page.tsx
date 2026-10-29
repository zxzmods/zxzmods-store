"use client";

import React, { useState, useEffect, useRef, Suspense, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { GarageModal } from "@/components/garage/GarageModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingConcierge } from "@/components/home/FloatingConcierge";
import { Footer } from "@/components/layout/Footer";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useGarage } from "@/context/GarageContext";
import { getWhatsAppUrl } from "@/config/company";
import { formatCRC, getCategoryLabel } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/Skeleton";
import { CatalogPagination } from "@/components/ui/CatalogPagination";
import { motion, AnimatePresence } from "framer-motion";
import { ProductItem, normalizeBrandList, isPlatformOrVehicleMatch, detectVehiclePlatform, isUniversalFit, SelectedParameterItem } from "@/lib/products";
import { getSxsBrandBySlug } from "@/lib/sxsBrands";
import { SxsBrandIntro } from "@/components/intro/SxsBrandIntro";
import {
  Wrench,
  Check,
  ShoppingCart,
  ArrowLeft,
  MessageCircle,
  Search,
  X,
  SlidersHorizontal,
  Star,
  AlertCircle,
  Car,
  PackageOpen,
  Volume2,
  Percent,
  ArrowUpDown,
} from "lucide-react";

// Stars component - displays empty stars if no reviews submitted
function StarRating({ reviews }: { reviews?: { stars?: number; count?: number } | null | string }) {
  const { lang } = useLanguage();
  const hasReviews =
    typeof reviews === "object" &&
    reviews !== null &&
    typeof reviews.stars === "number" &&
    reviews.stars > 0;

  const rating = hasReviews ? Math.min(5, Math.max(1, (reviews as any).stars)) : 0;

  return (
    <div className="flex items-center gap-1.5" title={hasReviews ? (lang === "es" ? `${rating}/5 estrellas` : `${rating}/5 stars`) : (lang === "es" ? "Sin reseñas aún" : "No reviews yet")}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((starIndex) => (
          <Star
            key={starIndex}
            className={`w-3.5 h-3.5 ${
              hasReviews && starIndex <= Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300 fill-transparent"
            }`}
          />
        ))}
      </div>
      {!hasReviews && (
        <span className="text-[10px] text-gray-400 font-medium">
          {lang === "es" ? "(Sin reseñas aún)" : "(No reviews yet)"}
        </span>
      )}
    </div>
  );
}

function getDescriptionSnippet(desc: any, lang: "es" | "en"): string {
  if (!desc) return "";
  if (typeof desc === "string") return desc;
  if (typeof desc === "object" && !Array.isArray(desc)) {
    const list = desc[lang] || desc["es"] || desc["en"] || [];
    if (Array.isArray(list) && list.length > 0) {
      return list[0]?.content || list[0]?.title || "";
    }
  }
  if (Array.isArray(desc) && desc.length > 0) {
    return desc[0]?.content || desc[0]?.title || "";
  }
  return "";
}

function parseBrandParam(searchParams: { get: (k: string) => string | null; forEach?: (callback: (val: string, key: string) => void) => void }): string {
  // 1. Direct param: ?brand=XYZ or ?marca=XYZ
  let brand = searchParams.get("brand") || searchParams.get("marca") || "";

  // 2. Bare query param, e.g. /productos?Polaris or /productos?(Polaris) or /productos?Bikeman
  if (!brand && typeof searchParams.forEach === "function") {
    searchParams.forEach((val, key) => {
      if (
        key &&
        !val &&
        !brand &&
        !["q", "category", "sxs", "sort", "intro", "vehicleModel"].includes(key)
      ) {
        brand = key;
      }
    });
  }

  // 3. Clean up any wrapping parentheses, e.g. "(Polaris)" -> "Polaris"
  if (brand) {
    brand = brand.trim();
    if (brand.startsWith("(") && brand.endsWith(")")) {
      brand = brand.slice(1, -1).trim();
    }
    try {
      brand = decodeURIComponent(brand);
    } catch {}
  }

  return brand || "all";
}

function ProductCatalogCard({
  product,
  lang,
  t,
  vehicle,
  checkVehicleCompatibility,
  onAddToCart,
  onClick,
}: {
  product: ProductItem;
  lang: "es" | "en";
  t: any;
  vehicle: any;
  checkVehicleCompatibility: (product: ProductItem) => { isUniversal: boolean; isCompatible: boolean };
  onAddToCart: (
    e: React.MouseEvent,
    product: ProductItem,
    selectedParams?: SelectedParameterItem[],
    effectivePrice?: number,
    chosenImage?: string
  ) => void;
  onClick: () => void;
}) {
  const selectedParametersList: SelectedParameterItem[] = useMemo(() => {
    if (!product.parameters || product.parameters.length === 0) return [];
    return product.parameters.map((param) => {
      const isLinked = (param as any).type === "product_linking" || (param as any).type === "product_link";
      const matchingLinkedOption = isLinked
        ? param.options?.find(
            (o: any) =>
              !o.linkedProductId ||
              o.isCurrentProduct ||
              o.linkedProductId === product.id ||
              o.linkedProductId === product.slug ||
              o.linkedProductId === (product as any).sku
          )
        : null;
      const def = matchingLinkedOption || param.options?.find((o) => o.isDefault) || param.options?.[0];
      return {
        parameterId: param.id,
        parameterName: lang === "es" ? param.nameEs : (param.nameEn || param.nameEs),
        optionId: def?.id || "",
        optionLabel: def ? (lang === "es" ? def.labelEs : (def.labelEn || def.labelEs)) : "",
        priceDeltaCRC: isLinked ? 0 : (def?.priceDeltaCRC || 0),
        colorHex: def?.colorHex,
        imageUrl: def?.imageUrl,
      };
    });
  }, [product.parameters, product.id, product.slug, (product as any).sku, lang]);

  const totalDeltaCRC = useMemo(() => {
    return selectedParametersList.reduce((acc, p) => acc + (p.priceDeltaCRC || 0), 0);
  }, [selectedParametersList]);

  const effectivePriceCRC = (product.price?.T_price ?? 0) + totalDeltaCRC;

  // The preview image in searching must always show the product's primary image
  const cardImageUrl = (product.imageUrl && product.imageUrl.trim()) || product.imgs?.[0] || "/images/logo.png";
  const compStatus = checkVehicleCompatibility(product);
  const isFreeInstallation = product.price?.I_price?.includes ?? false;

  const [imgSrc, setImgSrc] = useState(cardImageUrl);

  useEffect(() => {
    setImgSrc(cardImageUrl);
  }, [cardImageUrl]);

  return (
    <div
      onClick={onClick}
      className="rounded-3xl bg-gradient-to-b from-[#FBFBFC] via-[#FFFFFF] to-[#F4F5F7] border border-gray-200/90 hover:border-gray-400 transition-all duration-300 p-5 flex flex-col justify-between shadow-sm hover:shadow-md group relative cursor-pointer h-full"
    >
      <div>
        {/* Header: Category & Brand Badges */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {product.category?.map((cat) => (
              <span
                key={cat}
                className="text-[10px] font-bold uppercase tracking-wider text-[#C02030] bg-[#C02030]/10 px-2.5 py-0.5 rounded-full"
              >
                {getCategoryLabel(cat, lang)}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-1">
            {normalizeBrandList(product.brand || []).map((b) => (
              <span
                key={b}
                className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md"
              >
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Product Image Showcase (Updates when variant/color button is selected) */}
        <div className="relative h-48 w-full my-2.5 flex items-center justify-center bg-white/60 rounded-2xl border border-gray-100 overflow-hidden">
          {Boolean(product.discountPercent && product.discountPercent > 0) && (
            <span className="absolute top-2.5 left-2.5 z-10 bg-[#C02030] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md tracking-wider uppercase">
              -{product.discountPercent}% OFF
            </span>
          )}
          {Boolean(product.audios && product.audios.length > 0) && (
            <span className="absolute bottom-2.5 right-2.5 z-10 bg-white/95 backdrop-blur-xs text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1.5 border border-gray-200/90">
              <Volume2 className="w-3 h-3 text-[#C02030]" />
              <span>{t.badgeAudioHd}</span>
            </span>
          )}
          <Image
            src={imgSrc}
            alt={lang === "en" && (product as any).nameEn ? (product as any).nameEn : product.p_title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgSrc("/images/logo.png")}
          />
        </div>

        {/* Star Reviews */}
        <div className="mb-1.5">
          <StarRating reviews={product.reviews} />
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-[#111827] mb-1.5 leading-snug group-hover:text-[#C02030] transition-colors line-clamp-2">
          {lang === "en" && (product as any).nameEn ? (product as any).nameEn : product.p_title}
        </h3>

        {/* Description */}
        <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
          {getDescriptionSnippet(product.description, lang)}
        </p>

        {/* Compatibility Badge */}
        <div className="mb-3">
          {compStatus.isUniversal ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>{t.productsUniversalFit}</span>
            </span>
          ) : compStatus.isCompatible ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Compatible con tu {vehicle?.brandName} {vehicle?.modelName}</span>
            </span>
          ) : (
            <div className="text-[11px] text-gray-500 flex items-start gap-1">
              <span className="font-semibold text-gray-700">{t.productsFitsSxs}</span>
              <span className="line-clamp-1">{product.comp?.join(", ")}</span>
            </div>
          )}
        </div>

        {/* Requirements Notice */}
        {product.requirements && (
          <div className="mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-950 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold text-amber-900">{t.productsRequirementsNotice}: </span>
              <span className="text-amber-900/90">{product.requirements}</span>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Section */}
      <div className="pt-4 border-t border-gray-200/90 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-gray-500 font-medium">
            {t.productsPricePiece}
          </span>
          <div className="text-right">
            {Boolean(product.discountPercent && product.discountPercent > 0 && product.originalPriceCRC && product.originalPriceCRC > 0) ? (
              <div className="flex flex-col items-end">
                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                  <span className="text-xs text-gray-400 line-through font-mono">
                    {formatCRC((product.originalPriceCRC || 0) + totalDeltaCRC)}
                  </span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-50 text-[#C02030] border border-rose-200">
                    -{product.discountPercent}%
                  </span>
                  <span className="text-xl font-black text-[#C02030]">
                    {formatCRC(effectivePriceCRC)}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-bold">
                  {t.productsPriceIncludesIva || (lang === "es" ? "IVA incluido" : "VAT included")}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-end">
                <div className="flex items-baseline justify-end">
                  <span className="text-xl font-black text-[#111827]">
                    {formatCRC(effectivePriceCRC)}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-bold">
                  {t.productsPriceIncludesIva || (lang === "es" ? "IVA incluido" : "VAT included")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Free installation badge */}
        {isFreeInstallation && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
            <Wrench className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.productsInstallationFree}</span>
          </div>
        )}

        {/* Actions: Add to Cart & WhatsApp */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={(e) => onAddToCart(e, product, selectedParametersList, effectivePriceCRC, cardImageUrl)}
            className="flex-1 py-3 px-4 rounded-full bg-[#111827] hover:bg-[#C02030] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{t.productsAddToCart}</span>
          </button>

          <a
            href={getWhatsAppUrl(
              `¡Hola ZxZ Mods! Me interesa cotizar la pieza: ${product.p_title} (ID: ${product.id}). ${
                selectedParametersList.length > 0
                  ? `Configuración: ${selectedParametersList.map((p) => `${p.parameterName}: ${p.optionLabel}`).join(", ")}. `
                  : ""
              }Precio: ${formatCRC(effectivePriceCRC)}.`
            )}
            onClick={(e) => e.stopPropagation()}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
            title={t.productsQuoteWhatsapp}
          >
            <MessageCircle className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search and filter params from URL
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "all";
  const initialVehicleBrand = searchParams.get("vehicleBrand") || searchParams.get("sxs") || "all";
  const initialDistributorBrand = searchParams.get("distributorBrand") || parseBrandParam(searchParams) || "all";
  const initialInStock = searchParams.get("inStock") === "true";
  const initialDiscounted = searchParams.get("discounted") === "true";

  const { t, lang } = useLanguage();
  const { addItem } = useCart();
  const { requireVehicleBeforeAction, vehicle } = useGarage();

  // Component state
  const ITEMS_PER_PAGE = 20; // 4 products per row × 5 rows = 20 items max per page
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageDirection, setPageDirection] = useState<"next" | "prev">("next");
  const gridTopRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedVehicleBrand, setSelectedVehicleBrand] = useState(initialVehicleBrand);
  const [selectedDistributorBrand, setSelectedDistributorBrand] = useState(initialDistributorBrand);
  const [inStockOnly, setInStockOnly] = useState(initialInStock);
  const [discountedOnly, setDiscountedOnly] = useState(initialDiscounted);
  const [onlyCompatibleWithGarage, setOnlyCompatibleWithGarage] = useState(false);
  const [sortBy, setSortBy] = useState<"relevant" | "price-asc" | "price-desc" | "stars">("relevant");

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableVehicleBrands, setAvailableVehicleBrands] = useState<Array<{ slug: string; title: string; count: number }>>([]);
  const [availableDistributorBrands, setAvailableDistributorBrands] = useState<Array<{ name: string; count: number }>>([]);
  const [hasInStock, setHasInStock] = useState(false);
  const [hasDiscounted, setHasDiscounted] = useState(false);
  const [sxsBrandModels, setSxsBrandModels] = useState<
    Record<string, Array<{ id: string; name: string; code?: string | null; slug: string; imageUrl?: string | null }>>
  >({});

  const activeSxsBrand = getSxsBrandBySlug(selectedVehicleBrand !== "all" ? selectedVehicleBrand : undefined);

  // Intro animation state for SxS brands (CFMOTO, CAN-AM, POLARIS)
  const [activeIntroBrand, setActiveIntroBrand] = useState<string | null>(() => {
    const sxsParam = (initialVehicleBrand || "").toLowerCase().trim();
    const isIntro = searchParams.get("intro") === "true";
    if (isIntro && (sxsParam === "cfmoto" || sxsParam === "can-am" || sxsParam === "polaris")) {
      return sxsParam;
    }
    return null;
  });

  // Determine if a specific vehicle model is actively selected or searched
  const selectedVehicleModel = useMemo(() => {
    const currentModels = sxsBrandModels[selectedVehicleBrand?.toLowerCase()] || [];
    if (currentModels.length === 0) return null;

    const qNorm = searchQuery.toLowerCase().trim();
    const vModelParam = (searchParams.get("vehicleModel") || "").toLowerCase().trim();
    const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

    if (qNorm || vModelParam) {
      for (const mod of currentModels) {
        const modNameNorm = mod.name.toLowerCase().trim();
        const modCodeNorm = (mod.code || "").toLowerCase().trim();
        const modSlugNorm = mod.slug.toLowerCase().trim();

        if (qNorm) {
          if (qNorm === modNameNorm || (modCodeNorm && qNorm === modCodeNorm) || qNorm === modSlugNorm) {
            return mod;
          }

          // Strict 2-seater (Z10) vs 4-seater (Z10-4) isolation
          const qIs4 = qNorm.includes("-4") || qNorm.includes(" 4") || /\bz10[-_\s]?4\b/i.test(qNorm);
          const modIs4 = modNameNorm.includes("-4") || modNameNorm.includes(" 4") || modSlugNorm.includes("-4") || (Boolean(modCodeNorm) && modCodeNorm.includes("4"));
          if (qIs4 !== modIs4) {
            continue;
          }

          const qPlat = detectVehiclePlatform(qNorm);
          const modPlat = detectVehiclePlatform(mod.code || mod.name || mod.slug);
          if (qPlat && modPlat && qPlat === modPlat) {
            return mod;
          }
          if (modCodeNorm) {
            const codeRegex = new RegExp(`(^|[\\s\\-_/])${escapeRegex(modCodeNorm)}($|[\\s\\-_/])`, "i");
            if (codeRegex.test(qNorm)) return mod;
          }
          if (qNorm.includes(modNameNorm) || (modNameNorm.length > 5 && modNameNorm.includes(qNorm))) {
            return mod;
          }
        }

        if (vModelParam) {
          if (vModelParam === modNameNorm || (modCodeNorm && vModelParam === modCodeNorm) || vModelParam === modSlugNorm) {
            return mod;
          }
          if (vModelParam.includes(modNameNorm) || (modCodeNorm && vModelParam.includes(modCodeNorm))) {
            return mod;
          }
        }
      }
    }

    if (onlyCompatibleWithGarage && vehicle) {
      const vNameNorm = `${vehicle.brandName || ""} ${vehicle.modelName || ""}`.toLowerCase().trim();
      for (const mod of currentModels) {
        if (vNameNorm.includes(mod.name.toLowerCase().trim())) {
          return mod;
        }
      }
    }

    return null;
  }, [sxsBrandModels, selectedVehicleBrand, searchQuery, searchParams, onlyCompatibleWithGarage, vehicle]);

  const bannerVehicleImageUrl = useMemo(() => {
    if (
      selectedVehicleModel?.imageUrl &&
      selectedVehicleModel.imageUrl.trim() &&
      selectedVehicleModel.imageUrl !== "null" &&
      selectedVehicleModel.imageUrl !== "undefined"
    ) {
      return selectedVehicleModel.imageUrl.trim();
    }
    return activeSxsBrand?.sxsImageUrl || "/images/sxs/cfmoto_sxs.png";
  }, [selectedVehicleModel, activeSxsBrand]);

  const [bannerImageError, setBannerImageError] = useState(false);

  useEffect(() => {
    setBannerImageError(false);
  }, [bannerVehicleImageUrl]);

  const finalBannerImageUrl = bannerImageError
    ? (activeSxsBrand?.sxsImageUrl || "/images/sxs/cfmoto_sxs.png")
    : bannerVehicleImageUrl;

  // Helper to update URL params smoothly
  const updateUrlParams = (newParams: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "" || v === "all") {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    });
    router.replace(`/productos?${params.toString()}`, { scroll: false });
  };

  // Sync state when URL params change
  useEffect(() => {
    if (searchParams.get("q") !== null) {
      setSearchQuery(searchParams.get("q") || "");
    }
    if (searchParams.get("category") !== null) {
      setSelectedCategory(searchParams.get("category") || "all");
    }
    const vb = searchParams.get("vehicleBrand") || searchParams.get("sxs");
    setSelectedVehicleBrand(vb || "all");

    const db = searchParams.get("distributorBrand") || parseBrandParam(searchParams);
    setSelectedDistributorBrand(db || "all");

    setInStockOnly(searchParams.get("inStock") === "true");
    setDiscountedOnly(searchParams.get("discounted") === "true");

    const isGarage = searchParams.get("garage") === "true" || searchParams.get("compatible") === "true";
    if (isGarage) {
      setOnlyCompatibleWithGarage(true);
    }

    const sxsParam = (vb || "").toLowerCase().trim();
    const isIntro = searchParams.get("intro") === "true";
    if (isIntro && (sxsParam === "cfmoto" || sxsParam === "can-am" || sxsParam === "polaris")) {
      setActiveIntroBrand(sxsParam);
    }
  }, [searchParams]);

  const handleIntroComplete = () => {
    setActiveIntroBrand(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("intro");
    router.replace(`/productos?${params.toString()}`, { scroll: false });
  };

  // Fetch products dynamically from backend API (Zero Mock Data)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    if (selectedVehicleBrand && selectedVehicleBrand !== "all") params.set("vehicleBrand", selectedVehicleBrand);
    if (selectedDistributorBrand && selectedDistributorBrand !== "all") params.set("distributorBrand", selectedDistributorBrand);
    if (inStockOnly) params.set("inStock", "true");
    if (discountedOnly) params.set("discounted", "true");
    if (sortBy && sortBy !== "relevant") params.set("sort", sortBy);
    if (onlyCompatibleWithGarage && vehicle) {
      params.set("vehicleModel", vehicle.modelSlug || `${vehicle.brandName} ${vehicle.modelName}`);
      params.set("vehicleBrand", vehicle.brandSlug || vehicle.brandName);
      if (vehicle.year) params.set("vehicleYear", String(vehicle.year));
    }

    fetch(`/api/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.products)) {
          setProducts(data.products);

          // Dynamic parameters strictly from backend response
          if (Array.isArray(data.categories)) {
            setAvailableCategories(data.categories);
            if (
              selectedCategory !== "all" &&
              !data.categories.map((c: string) => c.toLowerCase()).includes(selectedCategory.toLowerCase())
            ) {
              setSelectedCategory("all");
            }
          }

          if (Array.isArray(data.availableVehicleBrands)) {
            setAvailableVehicleBrands(data.availableVehicleBrands);
          }

          if (Array.isArray(data.availableDistributorBrands)) {
            setAvailableDistributorBrands(data.availableDistributorBrands);
          }

          setHasInStock(Boolean(data.hasInStock));
          setHasDiscounted(Boolean(data.hasDiscounted));

          if (data.sxsBrandModels) {
            setSxsBrandModels(data.sxsBrandModels);
          }
        }
      })
      .catch((err) => console.error("Error fetching products:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    searchQuery,
    selectedCategory,
    selectedVehicleBrand,
    selectedDistributorBrand,
    inStockOnly,
    discountedOnly,
    sortBy,
    onlyCompatibleWithGarage,
    vehicle,
  ]);

  // Handle Search Input Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams({ q: searchQuery.trim() || null });
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedVehicleBrand("all");
    setSelectedDistributorBrand("all");
    setInStockOnly(false);
    setDiscountedOnly(false);
    setOnlyCompatibleWithGarage(false);
    setSortBy("relevant");
    router.replace("/productos", { scroll: false });
  };

  // Add product to cart with selected parameters and effective price
  const handleAddToCart = (
    e: React.MouseEvent,
    product: ProductItem,
    selectedParams?: SelectedParameterItem[],
    effectivePrice?: number,
    chosenImage?: string
  ) => {
    e.stopPropagation();
    const isIncluded = Boolean(
      product.price?.I_price?.includes ||
      (product as any).isInstallationIncluded
    );

    const effectiveCRC = effectivePrice ?? product.price.T_price;
    const paramsList = selectedParams || [];
    const paramSlug = paramsList.length > 0 ? paramsList.map((p) => `${p.parameterId}_${p.optionId}`).join("__") : "";
    const uniqueId = paramSlug ? `${product.id}__${paramSlug}` : product.id;

    addItem({
      type: "PRODUCT",
      id: uniqueId,
      sku: product.slug.toUpperCase(),
      title: product.p_title,
      brand: product.brand?.[0] || "Bikeman Performance",
      comp: product.comp,
      priceCRC: effectiveCRC,
      basePriceCRC: product.price.T_price,
      selectedParameters: paramsList,
      installationPriceCRC: isIncluded ? 0 : (Number(product.price?.I_price?.I_price) || 0),
      withInstallation: isIncluded,
      freeInstallation: isIncluded,
      imageUrl: chosenImage || (product.imageUrl && product.imageUrl.trim()) || product.imgs?.[0] || "/images/logo.png",
      homeInstallation: product.homeInstallation !== false,
      supplierStockStatus: product.supplierStockStatus,
      supplierStockMessage: (lang === "es" ? product.supplierStockMessageEs : product.supplierStockMessageEn) || undefined,
      supplierLeadDaysMin: product.supplierLeadDaysMin,
      supplierLeadDaysMax: product.supplierLeadDaysMax,
    });
  };

  // Check if product is compatible with active garage vehicle
  const checkVehicleCompatibility = (product: ProductItem) => {
    const isUniversal = isUniversalFit(product.comp);
    if (isUniversal) return { isCompatible: true, isUniversal: true };

    if (!vehicle) return { isCompatible: false, isUniversal: false, pending: true };

    if (product.modelYearCompatibility && product.modelYearCompatibility.length > 0) {
      const match = product.modelYearCompatibility.some((fit) => {
        const fitModelLower = (fit.model || "").toLowerCase();
        const fitMakeLower = (fit.make || "").toLowerCase();
        if (fitModelLower === "all" || fitModelLower.includes("universal")) return true;

        if (fitMakeLower && fitMakeLower !== "all" && !fitMakeLower.includes("universal")) {
          const brandMatches =
            isPlatformOrVehicleMatch(fit.make || "", vehicle.brandName || "") ||
            isPlatformOrVehicleMatch(fit.make || "", (vehicle as any).brandSlug || "");
          if (!brandMatches) return false;
        }

        const modelMatches =
          isPlatformOrVehicleMatch(fit.model || "", vehicle.modelName || "") ||
          isPlatformOrVehicleMatch(fit.model || "", vehicle.modelSlug || "") ||
          isPlatformOrVehicleMatch(fit.model || "", `${vehicle.brandName || ""} ${vehicle.modelName || ""}`.trim());
        if (!modelMatches) return false;

        if (fit.yearFrom && vehicle.year < fit.yearFrom) return false;
        if (fit.yearTo && vehicle.year > fit.yearTo) return false;
        return true;
      });

      return { isCompatible: match, isUniversal: false, pending: false };
    }

    const vehicleString = `${vehicle.brandName} ${vehicle.modelName}`.toLowerCase();
    const isCompatible = Boolean(product.comp?.some((c) =>
      isPlatformOrVehicleMatch(c, vehicleString) ||
      isPlatformOrVehicleMatch(c, vehicle.modelName) ||
      isPlatformOrVehicleMatch(c, vehicle.modelSlug)
    ));

    return { isCompatible, isUniversal: false, pending: false };
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedVehicleBrand !== "all" ||
    selectedDistributorBrand !== "all" ||
    inStockOnly ||
    discountedOnly ||
    onlyCompatibleWithGarage;

  // Reset pagination to page 1 when filters or search query change
  useEffect(() => {
    setCurrentPage(1);
    setPageDirection("next");
  }, [
    searchQuery,
    selectedCategory,
    selectedVehicleBrand,
    selectedDistributorBrand,
    inStockOnly,
    discountedOnly,
    sortBy,
    onlyCompatibleWithGarage,
    vehicle,
  ]);

  // Filter products by vehicle compatibility when onlyCompatibleWithGarage is active
  const displayedProducts = useMemo(() => {
    if (!onlyCompatibleWithGarage || !vehicle) return products;
    return products.filter((p) => {
      const { isCompatible, isUniversal } = checkVehicleCompatibility(p);
      return isCompatible || isUniversal;
    });
  }, [products, onlyCompatibleWithGarage, vehicle]);

  const totalPages = Math.max(1, Math.ceil(displayedProducts.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedProducts = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return displayedProducts.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [displayedProducts, safeCurrentPage, ITEMS_PER_PAGE]);

  const handlePageChange = (newPage: number, direction: "next" | "prev") => {
    setPageDirection(direction);
    setCurrentPage(newPage);
    if (gridTopRef.current) {
      const yOffset = -100;
      const y = gridTopRef.current.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1D] flex flex-col justify-between selection:bg-[#C02030] selection:text-white">
      {activeIntroBrand && (
        <SxsBrandIntro
          brand={activeIntroBrand}
          onComplete={handleIntroComplete}
        />
      )}
      <NotificationBanner />
      <Navbar />

      <main className="flex-1 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-16 w-full">
        {/* Navigation Breadcrumb: To the right of 'Inicio', show the words used in search or '...' */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-black flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Inicio</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-900 font-mono">
            {searchQuery.trim()
              ? searchQuery.trim()
              : activeSxsBrand
              ? activeSxsBrand.title
              : "..."}
          </span>
        </div>

        {/* Special SXS Brand Search Header Banner */}
        {activeSxsBrand && (
          <div className="relative mb-6 rounded-3xl overflow-hidden bg-gradient-to-b from-[#F7F8FA] via-[#FFFFFF] to-[#EDEFF2] border border-gray-200/90 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C02030]/10 border border-[#C02030]/20 text-[11px] font-black text-[#C02030] uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#C02030] animate-pulse" />
                <span>{lang === "es" ? "Búsqueda por Marca SXS" : "SXS Brand Search"}</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-[#111827] tracking-tight">
                {lang === "es"
                  ? `Catálogo Especializado ${activeSxsBrand.title}`
                  : `${activeSxsBrand.title} Specialized Catalog`}
              </h2>

              {/* Quick Model Chips */}
              {(() => {
                const currentModels = sxsBrandModels[selectedVehicleBrand?.toLowerCase()] || [];
                if (loading && currentModels.length === 0) {
                  return (
                    <div className="pt-2 flex flex-wrap items-center gap-2 justify-center md:justify-start">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        {lang === "es" ? "Modelos:" : "Models:"}
                      </span>
                      <div className="h-6 w-20 rounded-full bg-gray-200 animate-pulse" />
                      <div className="h-6 w-24 rounded-full bg-gray-200 animate-pulse" />
                    </div>
                  );
                }
                if (currentModels.length === 0) return null;

                return (
                  <div className="pt-2 flex flex-wrap items-center gap-2 justify-center md:justify-start">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      {lang === "es" ? "Modelos:" : "Models:"}
                    </span>
                    {currentModels.map((mod) => {
                      const qNorm = searchQuery.toLowerCase().trim();
                      const modNameNorm = mod.name.toLowerCase().trim();
                      const modCodeNorm = (mod.code || "").toLowerCase().trim();
                      const modSlugNorm = mod.slug.toLowerCase().trim();
                      const escapeRegex = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

                      // Strict model chip selection: NEVER allow Z1000 to highlight Z10, or Z10 to highlight Z10-4
                      const isSelected = Boolean(qNorm) && (() => {
                        if (qNorm === modNameNorm || (Boolean(modCodeNorm) && qNorm === modCodeNorm) || qNorm === modSlugNorm) {
                          return true;
                        }

                        // Prevent 2-seater (Z10) vs 4-seater (Z10-4) cross-highlighting
                        const qIs4 = qNorm.includes("-4") || qNorm.includes(" 4") || /\bz10[-_\s]?4\b/i.test(qNorm);
                        const modIs4 = modNameNorm.includes("-4") || modNameNorm.includes(" 4") || modSlugNorm.includes("-4") || (Boolean(modCodeNorm) && modCodeNorm.includes("4"));
                        if (qIs4 !== modIs4) {
                          return false;
                        }

                        const qPlat = detectVehiclePlatform(qNorm);
                        const modPlat = detectVehiclePlatform(mod.code || mod.name || mod.slug);
                        if (qPlat && modPlat) {
                          return qPlat === modPlat;
                        }
                        if (modCodeNorm) {
                          const codeRegex = new RegExp(`(^|[\\s\\-_/])${escapeRegex(modCodeNorm)}($|[\\s\\-_/])`, "i");
                          if (codeRegex.test(qNorm)) return true;
                        }
                        return qNorm.includes(modNameNorm);
                      })();

                      return (
                        <button
                          key={mod.id || mod.slug}
                          type="button"
                          onClick={() => {
                            // Use mod.name for clear human-readable search, e.g. "ZForce 1000 Sport R"
                            const newQuery = isSelected ? "" : mod.name;
                            setSearchQuery(newQuery);
                            const params = new URLSearchParams(searchParams.toString());
                            if (newQuery) {
                              params.set("q", newQuery);
                            } else {
                              params.delete("q");
                            }
                            router.replace(`/productos?${params.toString()}`);
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                            isSelected
                              ? "bg-[#C02030] text-white border-[#C02030] shadow-sm"
                              : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:text-black"
                          }`}
                        >
                          {mod.name}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Clear Brand Filter Pill */}
              <div className="pt-1 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVehicleBrand("all");
                    updateUrlParams({ vehicleBrand: null, sxs: null });
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#C02030] font-semibold transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>{lang === "es" ? "Quitar filtro de marca SXS" : "Clear SXS brand filter"}</span>
                </button>
              </div>
            </div>

            {/* SxS Isolated Vehicle Visual with Studio Shadow */}
            <div className="relative w-64 sm:w-80 h-44 sm:h-52 flex items-center justify-center flex-shrink-0">
              <div className="relative w-full h-full">
                <Image
                  key={finalBannerImageUrl}
                  src={finalBannerImageUrl}
                  alt={selectedVehicleModel ? `${selectedVehicleModel.name} SxS` : `${activeSxsBrand.title} SxS`}
                  fill
                  className="object-contain drop-shadow-md transition-all duration-300"
                  priority
                  onError={() => setBannerImageError(true)}
                />
              </div>
              <div className="absolute bottom-1 inset-x-8 h-4 bg-gradient-to-t from-gray-300/40 to-transparent blur-md rounded-full pointer-events-none" />
            </div>
          </div>
        )}

        {/* Prominent Search & Filter Toolbar */}
        <div className="bg-[#F8F9FA] border border-gray-200 rounded-3xl p-4 sm:p-5 mb-8 shadow-sm space-y-3.5">
          {/* Search Input Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.productsSearchPlaceholder}
                className="w-full pl-11 pr-10 py-2.5 rounded-2xl bg-white border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C02030]/20 focus:border-[#C02030] transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("q");
                    router.replace(`/productos?${params.toString()}`);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 rounded-2xl bg-[#111827] hover:bg-[#C02030] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar</span>
            </button>
          </form>

          {/* Thinner Category Slide Bar (Always present below search input) */}
          <div className="relative w-full border-t border-b border-gray-200/60 py-1.5">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all border ${
                  selectedCategory === "all"
                    ? "bg-[#C02030] text-white border-[#C02030] shadow-xs"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-black"
                }`}
              >
                {t.productsAllCategories}
              </button>

              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all border ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? "bg-[#C02030] text-white border-[#C02030] shadow-xs"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-black"
                  }`}
                >
                  {getCategoryLabel(cat, lang)}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Controls: Separated Filter Parameters (Vehicle Brand, Distributor Brand, In Stock, Discounted) & Sorting */}
          <div className="space-y-2.5 pt-1 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* 1. Vehicle Brand Selector (SxS Platform Brand - e.g. CFMOTO, Can-Am, Polaris, Kawasaki...) */}
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-xs max-w-full">
                <span className="text-gray-500 font-medium shrink-0">{t.productsFilterVehicleBrand}:</span>
                <select
                  value={selectedVehicleBrand}
                  onChange={(e) => {
                    const newVb = e.target.value;
                    setSelectedVehicleBrand(newVb);
                    updateUrlParams({ vehicleBrand: newVb, sxs: null });
                  }}
                  className="bg-transparent text-gray-900 font-bold outline-none cursor-pointer text-xs max-w-[150px] sm:max-w-none truncate"
                >
                  <option value="all">
                    {availableVehicleBrands.length === 0
                      ? t.productsAllVehicleBrands
                      : `${t.productsAllVehicleBrands} (${availableVehicleBrands.length})`}
                  </option>
                  {availableVehicleBrands.map((vb) => (
                    <option key={vb.slug} value={vb.slug}>
                      {vb.title} ({vb.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Distributor / Parts Manufacturer Brand Selector (e.g. EVP, Shock Therapy, Bikeman...) */}
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-xs max-w-full">
                <span className="text-gray-500 font-medium shrink-0">{t.productsFilterDistributorBrand}:</span>
                <select
                  value={selectedDistributorBrand}
                  onChange={(e) => {
                    const newDb = e.target.value;
                    setSelectedDistributorBrand(newDb);
                    updateUrlParams({ distributorBrand: newDb, brand: null, marca: null });
                  }}
                  className="bg-transparent text-gray-900 font-bold outline-none cursor-pointer text-xs max-w-[150px] sm:max-w-none truncate"
                >
                  <option value="all">
                    {availableDistributorBrands.length === 0
                      ? t.productsAllDistributorBrands
                      : `${t.productsAllDistributorBrands} (${availableDistributorBrands.length})`}
                  </option>
                  {availableDistributorBrands.map((db) => (
                    <option key={db.name} value={db.name}>
                      {db.name} ({db.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. In Stock Filter Toggle Button (Strictly only shown if in-stock products exist or filter active) */}
              {(hasInStock || inStockOnly) && (
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !inStockOnly;
                    setInStockOnly(nextVal);
                    updateUrlParams({ inStock: nextVal ? "true" : null });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                    inStockOnly
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t.productsFilterInStock}</span>
                </button>
              )}

              {/* 4. Discounted Filter Toggle Button (Strictly only shown if discounted products exist or filter active) */}
              {(hasDiscounted || discountedOnly) && (
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !discountedOnly;
                    setDiscountedOnly(nextVal);
                    updateUrlParams({ discounted: nextVal ? "true" : null });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                    discountedOnly
                      ? "bg-[#C02030] text-white border-[#C02030] shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>{t.productsFilterDiscounted}</span>
                </button>
              )}

              {/* 5. Compatible with My Garage Toggle */}
              {vehicle && (
                <button
                  type="button"
                  onClick={() => setOnlyCompatibleWithGarage(!onlyCompatibleWithGarage)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition-all shadow-xs cursor-pointer ${
                    onlyCompatibleWithGarage
                      ? "bg-emerald-500 text-white border-emerald-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>
                    {t.productsFitMyGarage} ({vehicle.brandName} {vehicle.modelName})
                  </span>
                </button>
              )}

              {/* Results count & Sort */}
              <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto sm:ml-auto">
                <span className="text-gray-500 font-medium text-xs whitespace-nowrap">
                  {displayedProducts.length} {t.productsCount}
                </span>

                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 shadow-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      const newSort = e.target.value as any;
                      setSortBy(newSort);
                      updateUrlParams({ sort: newSort !== "relevant" ? newSort : null });
                    }}
                    className="bg-transparent text-gray-900 font-semibold outline-none cursor-pointer text-xs"
                  >
                    <option value="relevant">{t.productsSortRelevant}</option>
                    <option value="price-asc">{t.productsSortPriceAsc}</option>
                    <option value="price-desc">{t.productsSortPriceDesc}</option>
                    <option value="stars">{t.productsSortRating}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Active Filter Pills Bar */}
            {(selectedVehicleBrand !== "all" ||
              selectedDistributorBrand !== "all" ||
              inStockOnly ||
              discountedOnly ||
              selectedCategory !== "all" ||
              searchQuery.trim() !== "" ||
              onlyCompatibleWithGarage) && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-gray-500 font-medium mr-1">
                  {lang === "es" ? "Filtros activos:" : "Active filters:"}
                </span>

                {/* Vehicle Brand Pill */}
                {selectedVehicleBrand !== "all" && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#111827] text-white text-[11px] font-semibold shadow-xs">
                    <span>
                      {t.productsFilterVehicleBrand}:{" "}
                      <strong className="text-white">
                        {availableVehicleBrands.find((b) => b.slug === selectedVehicleBrand)?.title || selectedVehicleBrand.toUpperCase()}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVehicleBrand("all");
                        updateUrlParams({ vehicleBrand: null, sxs: null });
                      }}
                      className="p-0.5 hover:bg-white/20 rounded-full transition cursor-pointer"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}

                {/* Distributor Brand Pill */}
                {selectedDistributorBrand !== "all" && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#111827] text-white text-[11px] font-semibold shadow-xs">
                    <span>
                      {t.productsFilterDistributorBrand}:{" "}
                      <strong className="text-white">{selectedDistributorBrand}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDistributorBrand("all");
                        updateUrlParams({ distributorBrand: null, brand: null, marca: null });
                      }}
                      className="p-0.5 hover:bg-white/20 rounded-full transition cursor-pointer"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}

                {/* In Stock Pill */}
                {inStockOnly && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[11px] font-semibold shadow-xs">
                    <span>{t.productsFilterInStock}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setInStockOnly(false);
                        updateUrlParams({ inStock: null });
                      }}
                      className="p-0.5 hover:bg-white/20 rounded-full transition cursor-pointer"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}

                {/* Discounted Pill */}
                {discountedOnly && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#C02030] text-white text-[11px] font-semibold shadow-xs">
                    <span>{t.productsFilterDiscounted}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountedOnly(false);
                        updateUrlParams({ discounted: null });
                      }}
                      className="p-0.5 hover:bg-white/20 rounded-full transition cursor-pointer"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}

                {/* Category Pill */}
                {selectedCategory !== "all" && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-700 text-white text-[11px] font-semibold shadow-xs">
                    <span>{getCategoryLabel(selectedCategory, lang)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("all");
                        updateUrlParams({ category: null });
                      }}
                      className="p-0.5 hover:bg-white/20 rounded-full transition cursor-pointer"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}

                {/* Search Query Pill */}
                {searchQuery.trim() !== "" && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-700 text-white text-[11px] font-semibold shadow-xs">
                    <span>&quot;{searchQuery}&quot;</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        updateUrlParams({ q: null });
                      }}
                      className="p-0.5 hover:bg-white/20 rounded-full transition cursor-pointer"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}

                {/* Compatible with Garage Pill */}
                {onlyCompatibleWithGarage && vehicle && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-[11px] font-semibold shadow-xs">
                    <span>
                      {t.productsFitMyGarage}: <strong className="text-white">{vehicle.brandName} {vehicle.modelName}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setOnlyCompatibleWithGarage(false)}
                      className="p-0.5 hover:bg-white/20 rounded-full transition cursor-pointer"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                )}

                {/* Clear All Filters Button */}
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-[11px] text-[#C02030] hover:underline font-bold ml-1 cursor-pointer"
                >
                  {t.productsClearFilters}
                </button>
              </div>
            )}
          </div>
        </div>

        <div ref={gridTopRef} />

        {/* Mandatory Animated Skeleton Screen on the Same Layout (4 columns per row) */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-gray-200 bg-white p-5 space-y-3.5 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-48 w-full rounded-2xl" />
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-5 w-1/2 rounded-md" />
                <div className="pt-3.5 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-28" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedProducts.length === 0 ? (
          /* Empty State */
          <div className="py-20 text-center max-w-md mx-auto space-y-4 bg-[#F8F9FA] rounded-3xl border border-gray-200 p-8 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-red-50 text-[#C02030] flex items-center justify-center mx-auto">
              {hasActiveFilters ? <Search className="w-8 h-8" /> : <PackageOpen className="w-8 h-8" />}
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {hasActiveFilters
                ? t.productsNoResults
                : lang === "es"
                ? "Catálogo de productos en actualización"
                : "Product catalog being updated"}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {hasActiveFilters
                ? t.productsNoResultsDesc
                : lang === "es"
                ? "Próximamente estaremos agregando piezas y componentes de alto rendimiento."
                : "High-performance parts and components will be listed here soon."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="py-2.5 px-6 rounded-full bg-[#111827] hover:bg-[#C02030] text-white text-xs font-bold transition-all shadow-sm"
              >
                {t.productsClearFilters}
              </button>
            )}
          </div>
        ) : (
          /* Products Grid: 4 products per row, max 5 rows (20 items) per page with DJI page transition */
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={`products-page-${safeCurrentPage}`}
                initial={{
                  opacity: 0,
                  x: pageDirection === "next" ? 18 : -18,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: pageDirection === "next" ? -18 : 18,
                }}
                transition={{
                  duration: 0.25,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
              >
                {paginatedProducts.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: Math.min(idx * 0.02, 0.3),
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="h-full"
                  >
                    <ProductCatalogCard
                      product={product}
                      lang={lang}
                      t={t}
                      vehicle={vehicle}
                      checkVehicleCompatibility={checkVehicleCompatibility}
                      onAddToCart={handleAddToCart}
                      onClick={() => router.push(`/productos/${product.id}`)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            <CatalogPagination
              currentPage={safeCurrentPage}
              totalItems={products.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={handlePageChange}
              layoutIdPrefix="products-pagination"
            />
          </>
        )}
      </main>

      {/* Global Site Footer */}
      <Footer />

      {/* Global Modals & Concierge */}
      <GarageModal />
      <CartDrawer />
      <FloatingConcierge />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#C02030] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
