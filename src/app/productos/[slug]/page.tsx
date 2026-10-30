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
import { getWhatsAppUrl } from "@/config/company";
import { formatCRC, getCategoryLabel, formatUSD, convertCRCToUSD } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTouchSwipe } from "@/lib/useTouchSwipe";
import {
  ProductItem,
  ParameterOption,
  normalizeBrandName,
  DescriptionSection,
  isPlatformOrVehicleMatch,
  isUniversalFit,
  formatCompListWithYears,
  SelectedParameterItem,
  resolveOptionColorHex,
  normalizeAudioUrl,
  normalizeVideoUrl,
} from "@/lib/products";
import { ProductReviewsSection } from "@/components/reviews/ProductReviewsSection";
import { SuggestedSection } from "@/components/product/SuggestedSection";
import { ProductThumbnailStrip } from "@/components/product/ProductThumbnailStrip";
import {
  Wrench,
  ShoppingCart,
  ArrowLeft,
  MessageCircle,
  Star,
  AlertCircle,
  Car,
  Volume2,
  Video,
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Plus,
  Minus,
  Trash2,
  Home,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  FileText,
  Clock,
  Sliders,
  Loader2,
  Link2,
  ExternalLink,
  Music,
  Play,
  Pause,
} from "lucide-react";

function formatCheckedTime(iso: string | null | undefined, lang: "es" | "en") {
  if (!iso) return lang === "es" ? "recientemente" : "recently";
  const date = new Date(iso);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  if (diffMinutes < 1) return lang === "es" ? "hace unos segundos" : "just now";
  if (diffMinutes < 60) return lang === "es" ? `hace ${diffMinutes} min` : `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return lang === "es" ? `hace ${diffHours} h` : `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return lang === "es" ? `hace ${diffDays} d` : `${diffDays}d ago`;
}

function StarRating({
  stars,
  emptyLabel,
}: {
  stars?: number | null;
  emptyLabel?: string;
}) {
  const hasReviews = typeof stars === "number" && stars > 0;
  const rating = hasReviews ? Math.min(5, Math.max(1, stars)) : 0;

  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={
        hasReviews
          ? `Calificación: ${rating} de 5 estrellas`
          : "Sin reseñas aún"
      }
    >
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((starIndex) => (
          <Star
            key={starIndex}
            className={`w-4 h-4 ${hasReviews && starIndex <= Math.round(rating)
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300 stroke-[1.5]"
              }`}
          />
        ))}
      </div>
      {!hasReviews && emptyLabel && (
        <span className="text-xs text-gray-400 font-medium ml-1">
          ({emptyLabel})
        </span>
      )}
    </div>
  );
}

function renderStringDescription(rawText: string) {
  if (!rawText) return null;
  const lines = rawText.split("\n");
  const blocks: Array<
    | { type: "paragraph"; text: string }
    | { type: "bullets"; items: string[] }
  > = [];

  let currentBullets: string[] = [];

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      blocks.push({ type: "bullets", items: [...currentBullets] });
      currentBullets = [];
    }
  };

  let startIndex = 0;
  while (startIndex < lines.length && !lines[startIndex].trim()) {
    startIndex++;
  }
  if (
    startIndex < lines.length &&
    /^(descripción|descripcion|description)[:\s]*$/i.test(lines[startIndex].trim())
  ) {
    startIndex++;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      flushBullets();
      continue;
    }

    // Match bullet indicators: -, *, •, +, or numbered 1., 2.
    const bulletMatch = /^([•\-*+]|\d+[.)])\s+(.*)$/.exec(trimmed);
    if (bulletMatch) {
      currentBullets.push(bulletMatch[2]);
    } else {
      flushBullets();
      blocks.push({ type: "paragraph", text: trimmed });
    }
  }
  flushBullets();

  return (
    <div className="space-y-3">
      {blocks.map((block, bIdx) => {
        if (block.type === "paragraph") {
          return (
            <p key={bIdx} className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {block.text}
            </p>
          );
        }
        return (
          <ul key={bIdx} className="space-y-2.5 pl-1 my-2">
            {block.items.map((bullet, idx) => {
              let prefix = "";
              let rest = bullet;

              // Check for markdown **bold:** prefix
              const boldMatch = /^\*\*(.*?)\*\*[:\s]*(.*)$/.exec(bullet);
              if (boldMatch) {
                prefix = boldMatch[1];
                rest = boldMatch[2];
              } else {
                const colonIndex = bullet.indexOf(":");
                if (colonIndex > 0 && colonIndex < 40) {
                  prefix = bullet.substring(0, colonIndex);
                  rest = bullet.substring(colonIndex + 1);
                }
              }

              return (
                <li
                  key={idx}
                  className="text-xs sm:text-sm text-gray-700 leading-relaxed flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C02030] mt-2 shrink-0" />
                  <span>
                    {prefix ? (
                      <>
                        <strong className="font-bold text-gray-900">{prefix}:</strong>{" "}
                        <span>{rest}</span>
                      </>
                    ) : (
                      bullet
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        );
      })}
    </div>
  );
}

function ProductDescriptionBlock({
  description,
  lang,
}: {
  description: any;
  lang: "es" | "en";
}) {
  if (!description) return null;

  let sections: DescriptionSection[] = [];
  if (typeof description === "object" && !Array.isArray(description)) {
    sections = description[lang] || description["es"] || description["en"] || [];
  } else if (Array.isArray(description)) {
    sections = description;
  }

  if (sections.length > 0) {
    return (
      <div className="p-6 sm:p-7 rounded-3xl bg-gray-50/90 border border-gray-200/80 shadow-xs space-y-6">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#C02030] flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <span>
            {lang === "es"
              ? "Especificaciones y Descripción"
              : "Specs & Description"}
          </span>
        </h3>
        <div className="space-y-6 divide-y divide-gray-200/70">
          {sections.map((section, idx) => {
            const isDescTitle =
              section.title?.trim().toLowerCase() === "descripción" ||
              section.title?.trim().toLowerCase() === "descripcion" ||
              section.title?.trim().toLowerCase() === "description";
            const showTitle = Boolean(section.title && !isDescTitle);

            return (
              <div key={idx} className={idx > 0 ? "pt-5 space-y-3" : "space-y-3"}>
                {showTitle && (
                  <h4 className="text-base sm:text-lg font-black text-[#111827] flex items-start gap-2.5">
                    <span className="w-1.5 h-5 bg-[#C02030] rounded-full mt-0.5 flex-shrink-0" />
                    <span>{section.title}</span>
                  </h4>
                )}
                <div className={showTitle ? "pl-4" : ""}>
                  {renderStringDescription(section.content)}
                </div>
                {section.bullets && section.bullets.length > 0 && (
                  <ul className={`space-y-2.5 pt-1 ${showTitle ? "pl-4" : ""}`}>
                    {section.bullets.map((bullet, bIdx) => {
                      const colonIndex = bullet.indexOf(":");
                      const hasPrefix = colonIndex > 0 && colonIndex < 40;
                      const prefix = hasPrefix
                        ? bullet.substring(0, colonIndex + 1)
                        : "";
                      const rest = hasPrefix
                        ? bullet.substring(colonIndex + 1)
                        : bullet;

                      return (
                        <li
                          key={bIdx}
                          className="text-xs sm:text-sm text-gray-700 leading-relaxed flex items-start gap-2.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C02030] mt-2 flex-shrink-0" />
                          <span>
                            {hasPrefix ? (
                              <>
                                <strong className="font-bold text-gray-900">
                                  {prefix}
                                </strong>
                                <span>{rest}</span>
                              </>
                            ) : (
                              bullet
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-gray-50 border border-gray-200 shadow-xs space-y-3">
      <h3 className="text-xs font-black uppercase tracking-wider text-[#C02030] flex items-center gap-2">
        <Layers className="w-4 h-4" />
        <span>{lang === "es" ? "Especificaciones y Descripción" : "Specs & Description"}</span>
      </h3>
      {renderStringDescription(typeof description === "string" ? description : "")}
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const { t, lang } = useLanguage();
  const { items, addItem, updateQuantity, removeItem, setIsOpen, createQuotationOrder, currency, sellRate } = useCart();
  const { requireVehicleBeforeAction, vehicle, openModal } = useGarage();

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedImageOverride, setSelectedImageOverride] = useState<string | null>(null);
  const [activeAudioIndex, setActiveAudioIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioError, setAudioError] = useState(false);

  // US Supplier Live Availability State
  const [availability, setAvailability] = useState<{
    status: string;
    available: boolean;
    stockCount: number | null;
    platform: string;
    messageEs: string;
    messageEn: string;
    leadDaysMin: number;
    leadDaysMax: number;
    supplierUrl: string | null;
    supplierPriceUSD: number | null;
    checkedAt: string;
    isStale: boolean;
  } | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [submittingReservationQuote, setSubmittingReservationQuote] = useState(false);

  // Lightbox Modal state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);

  // Confirmation modal to remove product when reducing quantity to zero
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // Related products state
  const [relatedProducts, setRelatedProducts] = useState<ProductItem[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // Suggested combos state (LE-03)
  const [suggestedCombos, setSuggestedCombos] = useState<any[]>([]);
  const [combosLoading, setCombosLoading] = useState(false);

  // Selected Configurable Parameters State (parameterId -> optionId)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [switchingLinkedProduct, setSwitchingLinkedProduct] = useState(false);
  const [switchingTargetId, setSwitchingTargetId] = useState<string | null>(null);

  const isCurrentProductOpt = (opt: any, currentProduct: ProductItem | null): boolean => {
    if (!opt || !currentProduct) return false;
    if (opt.isCurrentProduct) return true;
    if (opt.id && String(opt.id).startsWith(`self-${currentProduct.id}`)) return true;
    if (!opt.linkedProductId) return true;
    const lId = String(opt.linkedProductId).trim().toLowerCase();
    const pId = String(currentProduct.id || "").trim().toLowerCase();
    const pSlug = String(currentProduct.slug || "").trim().toLowerCase();
    const pSku = String(currentProduct.sku || "").trim().toLowerCase();
    return (Boolean(pId) && lId === pId) || (Boolean(pSlug) && lId === pSlug) || (Boolean(pSku) && lId === pSku);
  };

  const deriveCleanVariantLabel = (prod: ProductItem, otherOpts: ParameterOption[]) => {
    const title = (prod.nameEs || prod.p_title || "").trim();
    const titleLower = title.toLowerCase();
    const skuLower = (prod.sku || "").toLowerCase();

    const has4SeaterSibling = otherOpts.some((o) => {
      const s = `${o.labelEs || ""} ${o.labelEn || ""} ${o.linkedProductId || ""}`.toLowerCase();
      return s.includes("z10-4") || s.includes("4-seater") || s.includes("4 seater") || s.includes("4 plazas") || s.includes("4-seat");
    });

    const is4Seater = titleLower.includes("z10-4") || skuLower.includes("z10-4") || /\b4[- ]?(seater|seat|plazas|asientos)\b/i.test(titleLower);
    const is2Seater = !is4Seater && (has4SeaterSibling || titleLower.includes("z10") || skuLower.includes("z10") || /\b2[- ]?(seater|seat|plazas|asientos)\b/i.test(titleLower));

    if (is4Seater) {
      return { es: "Z10-4", en: "Z10-4" };
    }
    if (is2Seater) {
      return { es: "2 Seater", en: "2 Seater" };
    }

    const modelMatch = title.match(/(?:CFMoto|Polaris|Can-Am|Honda|Yamaha|Kawasaki)\s+([A-Za-z0-9_-]+(?:\s+[A-Za-z0-9_-]+)?)/i);
    if (modelMatch) {
      return { es: modelMatch[1], en: modelMatch[1] };
    }

    const dashMatch = title.match(/-\s*([^-\n]+)$/);
    const viewingLabel = dashMatch ? dashMatch[1].trim() : title;
    return { es: viewingLabel, en: prod.nameEn || viewingLabel };
  };

  const handleSelectOption = async (
    param: any,
    opt: any
  ) => {
    const isProductLinking =
      param.type === "product_linking" ||
      param.type === "product_link" ||
      Boolean(opt.linkedProductId);

    // If this option is linked to another product:
    if (isProductLinking && opt.linkedProductId) {
      if (isCurrentProductOpt(opt, product)) {
        // Already viewing this product, nothing to do
        return;
      }

      setSwitchingLinkedProduct(true);
      setSwitchingTargetId(opt.id);
      try {
        const res = await fetch(
          `/api/products?slug=${encodeURIComponent(opt.linkedProductId)}`
        );
        const data = await res.json();
        if (data.success && data.product) {
          const nextProd: ProductItem = data.product;
          setProduct(nextProd);
          setActiveImageIndex(0);

          // Update URL in browser silently without full page refresh (Amazon style)
          const nextSlug = nextProd.slug || nextProd.sku || nextProd.id;
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", `/productos/${encodeURIComponent(nextSlug)}`);
          }

          // Retain matching parameters or configure default for new product
          const nextOpts: Record<string, string> = {};
          if (nextProd.parameters && Array.isArray(nextProd.parameters)) {
            nextProd.parameters.forEach((p: any) => {
              const isPLinked =
                p.type === "product_linking" ||
                p.type === "product_link" ||
                p.options?.some((o: any) => Boolean(o.linkedProductId));
              if (isPLinked) {
                const selfOpt = p.options?.find((o: any) => isCurrentProductOpt(o, nextProd));
                if (selfOpt) {
                  nextOpts[p.id] = selfOpt.id;
                  return;
                }
              }
              const match = p.options?.find(
                (o: any) =>
                  isCurrentProductOpt(o, nextProd) ||
                  o.id === opt.id ||
                  o.labelEs?.toLowerCase() === opt.labelEs?.toLowerCase()
              );
              if (match) {
                nextOpts[p.id] = match.id;
              } else if (p.options?.[0]) {
                nextOpts[p.id] = p.options[0].id;
              }
            });
          }
          setSelectedOptions(nextOpts);
        }
      } catch (err) {
        console.error("Error switching linked product:", err);
      } finally {
        setSwitchingLinkedProduct(false);
        setSwitchingTargetId(null);
      }
      return;
    }

    // Normal option selection
    setSelectedOptions((prev) => ({
      ...prev,
      [param.id]: opt.id,
    }));
    if (opt.imageUrl) {
      setSelectedImageOverride(opt.imageUrl);
      const optIdx = allImages.indexOf(opt.imageUrl);
      if (optIdx !== -1) {
        setActiveImageIndex(optIdx);
      }
    }
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    fetch(`/api/products?slug=${encodeURIComponent(slug)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.product) {
          setProduct(data.product);
          setActiveImageIndex(0);
          setSelectedImageOverride(null);
          setActiveAudioIndex(0);
          setIsPlayingAudio(false);
          setAudioError(false);
          if (data.product.parameters && Array.isArray(data.product.parameters)) {
            const initialOpts: Record<string, string> = {};
            data.product.parameters.forEach((param: any) => {
              if (param.options && param.options.length > 0) {
                const isLinked =
                  param.type === "product_linking" ||
                  param.type === "product_link" ||
                  param.options.some((o: any) => Boolean(o.linkedProductId));
                if (isLinked) {
                  const selfOpt = param.options.find((o: any) => isCurrentProductOpt(o, data.product));
                  if (selfOpt) {
                    initialOpts[param.id] = selfOpt.id;
                    return;
                  }
                }
                initialOpts[param.id] = param.options[0].id;
              }
            });
            setSelectedOptions(initialOpts);
          }
        } else {
          setProduct(null);
        }
      })
      .catch((err) => console.error("Error fetching product detail:", err))
      .finally(() => setLoading(false));
  }, [slug]);

  // Synchronize and verify live supplier availability (enforces 8-hour freshness policy)
  useEffect(() => {
    if (!product) return;

    // Seed immediate state from database cache
    if (product.supplierStockStatus) {
      setAvailability({
        status: product.supplierStockStatus,
        available: product.supplierStockStatus !== "OUT_OF_STOCK" && product.supplierStockStatus !== "UNAVAILABLE",
        stockCount: product.supplierStockCount ?? null,
        platform: product.supplierPlatform || "SHOPIFY",
        messageEs: product.supplierStockMessageEs || "Disponible para entrega o importación inmediata",
        messageEn: product.supplierStockMessageEn || "In stock ready for immediate delivery or import",
        leadDaysMin: product.supplierLeadDaysMin || 7,
        leadDaysMax: product.supplierLeadDaysMax || 21,
        supplierUrl: product.supplierUrl || null,
        supplierPriceUSD: product.supplierLastPriceUSD ?? null,
        checkedAt: product.supplierStockCheckedAt ? new Date(product.supplierStockCheckedAt).toISOString() : new Date().toISOString(),
        isStale: false,
      });
    }

    // Query availability endpoint to check against 8-hour TTL or revalidate
    if (product.supplierUrl || product.id) {
      setCheckingAvailability(true);
      fetch(`/api/products/${encodeURIComponent(product.id)}/availability`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.availability) {
            setAvailability(data.availability);
          }
        })
        .catch((err) => console.warn("Live availability check warning:", err))
        .finally(() => setCheckingAvailability(false));
    }
  }, [product?.id]);

  const handleRefreshAvailability = async () => {
    if (!product) return;
    setCheckingAvailability(true);
    try {
      const res = await fetch(`/api/products/${encodeURIComponent(product.id)}/availability?fresh=true`);
      const data = await res.json();
      if (data.success && data.availability) {
        setAvailability(data.availability);
      }
    } catch (err) {
      console.error("Failed to refresh supplier availability:", err);
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Fetch suggested combos containing this product or related category/brand (LE-03)
  useEffect(() => {
    if (!product) return;
    setCombosLoading(true);

    fetch("/api/combos")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.combos)) {
          const prodId = (product.id || "").toLowerCase();
          const prodSku = ((product as any).sku || "").toLowerCase();
          const prodSlug = (product.slug || "").toLowerCase();
          const prodBrand = (product.brand?.[0] || "").toLowerCase();
          const prodCat = (product.category?.[0] || "").toLowerCase();

          // 1. Combos that explicitly contain this item
          const containingCombos = data.combos.filter((combo: any) => {
            let comboItems: any[] = [];
            try {
              comboItems = typeof combo.itemsJson === "string" ? JSON.parse(combo.itemsJson) : combo.itemsJson || [];
            } catch {}
            return comboItems.some((it: any) => {
              const itId = typeof it === "string" ? it.toLowerCase() : (it.id || it.sku || "").toLowerCase();
              return itId === prodId || (prodSku && itId === prodSku) || (prodSlug && itId === prodSlug);
            });
          });

          // 2. Combos that match brand or category
          const matchingCategory = data.combos.filter((combo: any) => {
            if (containingCombos.some((m: any) => m.id === combo.id)) return false;
            const comboBrand = (combo.brand || "").toLowerCase();
            const comboCategory = (combo.category || "").toLowerCase();
            return (
              (prodBrand && comboBrand && (comboBrand.includes(prodBrand) || prodBrand.includes(comboBrand))) ||
              (prodCat && comboCategory && comboCategory.includes(prodCat))
            );
          });

          const combined = [...containingCombos, ...matchingCategory];
          setSuggestedCombos(combined.length > 0 ? combined.slice(0, 4) : data.combos.slice(0, 4));
        }
      })
      .catch((err) => console.error("Error fetching suggested combos:", err))
      .finally(() => setCombosLoading(false));
  }, [product?.id]);

  // Fetch related & suggested products (up to 10 products, dynamically filled by category or brand)
  useEffect(() => {
    if (!product) return;

    if (product.relatedProducts && product.relatedProducts.length >= 10) {
      setRelatedProducts(product.relatedProducts.slice(0, 10));
      setRelatedLoading(false);
      return;
    }

    setRelatedLoading(true);

    fetch(`/api/products`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.products)) {
          const list: ProductItem[] = [];
          const seen = new Set<string>([product.id]);

          // 1. Initial seeds from product.relatedProducts
          if (product.relatedProducts && product.relatedProducts.length > 0) {
            for (const p of product.relatedProducts) {
              if (p && p.id && !seen.has(p.id)) {
                seen.add(p.id);
                list.push(p);
              }
            }
          }

          // 2. Explicit relatedProductIds if present
          if (list.length < 10 && Array.isArray(product.relatedProductIds) && product.relatedProductIds.length > 0) {
            const explicit = data.products.filter((p: ProductItem) =>
              !seen.has(p.id) && (
                product.relatedProductIds?.includes(p.id) ||
                ((p as any).sku && product.relatedProductIds?.includes((p as any).sku)) ||
                (p.slug && product.relatedProductIds?.includes(p.slug))
              )
            );
            for (const p of explicit) {
              if (list.length >= 10) break;
              if (!seen.has(p.id)) {
                seen.add(p.id);
                list.push(p);
              }
            }
          }

          const primaryCat = product.category?.[0];
          const primaryBrand = product.brand?.[0];

          // 3. Fill missing up to 10 with same category and same platform fitment
          for (const p of data.products) {
            if (list.length >= 10) break;
            if (seen.has(p.id)) continue;
            const sameCat = primaryCat && p.category?.some((c: string) => c.toLowerCase() === primaryCat.toLowerCase());
            const samePlat = product.comp?.some((c) =>
              p.comp?.some((candC: string) => isPlatformOrVehicleMatch(candC, c))
            );
            if (sameCat && samePlat) {
              seen.add(p.id);
              list.push(p);
            }
          }

          // 4. Fill missing up to 10 with same category
          for (const p of data.products) {
            if (list.length >= 10) break;
            if (seen.has(p.id)) continue;
            const sameCat = primaryCat && p.category?.some((c: string) => c.toLowerCase() === primaryCat.toLowerCase());
            if (sameCat) {
              seen.add(p.id);
              list.push(p);
            }
          }

          // 5. Fill missing up to 10 with same brand
          for (const p of data.products) {
            if (list.length >= 10) break;
            if (seen.has(p.id)) continue;
            const sameBrand = primaryBrand && p.brand?.some((b: string) => b.toLowerCase() === primaryBrand.toLowerCase());
            if (sameBrand) {
              seen.add(p.id);
              list.push(p);
            }
          }

          // 6. Fill missing up to 10 with same vehicle platform
          for (const p of data.products) {
            if (list.length >= 10) break;
            if (seen.has(p.id)) continue;
            const samePlat = product.comp?.some((c) =>
              p.comp?.some((candC: string) => isPlatformOrVehicleMatch(candC, c))
            );
            if (samePlat) {
              seen.add(p.id);
              list.push(p);
            }
          }

          // 7. Fill missing up to 10 with any other active products
          for (const p of data.products) {
            if (list.length >= 10) break;
            if (!seen.has(p.id)) {
              seen.add(p.id);
              list.push(p);
            }
          }

          setRelatedProducts(list.slice(0, 10));
        }
      })
      .catch((err) => console.error("Error fetching related products:", err))
      .finally(() => setRelatedLoading(false));
  }, [product]);

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

  // Dynamic Calculation of Parameters & Price Delta
  const selectedParametersList: SelectedParameterItem[] = useMemo(() => {
    if (!product?.parameters || product.parameters.length === 0) return [];
    const list: SelectedParameterItem[] = [];
    product.parameters.forEach((param) => {
      const isLinkedParam =
        param.type === "product_linking" ||
        param.type === "product_link" ||
        param.options?.some((o) => Boolean(o.linkedProductId));

      let option = null;
      if (isLinkedParam) {
        option = param.options?.find((o) => isCurrentProductOpt(o, product)) || param.options?.[0];
      } else {
        const selectedOptionId = selectedOptions[param.id] || param.options?.[0]?.id;
        option = param.options?.find((o) => o.id === selectedOptionId);
      }
      if (option) {
        list.push({
          parameterId: param.id,
          parameterName: lang === "es" ? param.nameEs : (param.nameEn || param.nameEs),
          optionId: option.id,
          optionLabel: lang === "es" ? option.labelEs : (option.labelEn || option.labelEs),
          priceDeltaCRC: isLinkedParam ? 0 : (option.priceDeltaCRC || 0),
          colorHex: option.colorHex,
          imageUrl: option.imageUrl,
          supplierUrl: option.supplierUrl,
          linkedProductId: option.linkedProductId,
        });
      }
    });
    return list;
  }, [product, selectedOptions, lang]);

  // Complete image gallery (primary image first, followed by deduplicated gallery images)
  const allImages = useMemo(() => {
    const list: string[] = [];
    if (product?.imageUrl && typeof product.imageUrl === "string") {
      const s = product.imageUrl.trim();
      if (s) list.push(s);
    }
    if (product?.imgs && Array.isArray(product.imgs)) {
      product.imgs.forEach((img) => {
        const s = typeof img === "string" ? img.trim() : "";
        if (s && !list.includes(s)) list.push(s);
      });
    }
    return list.length > 0 ? list : ["/images/logo.png"];
  }, [product]);

  // Option-specific image for visualization (e.g. orange, black, blue charge tube)
  const activeOptionImage = useMemo(() => {
    for (const item of selectedParametersList) {
      if (item.imageUrl) return item.imageUrl;
    }
    return null;
  }, [selectedParametersList]);

  const displayImageUrl = useMemo(() => {
    if (selectedImageOverride) return selectedImageOverride;
    return allImages[activeImageIndex] || allImages[0] || "/images/logo.png";
  }, [selectedImageOverride, allImages, activeImageIndex]);

  const totalDeltaCRC = useMemo(() => {
    return selectedParametersList.reduce((acc, p) => acc + (p.priceDeltaCRC || 0), 0);
  }, [selectedParametersList]);

  const effectivePriceCRC = (product?.price?.T_price || 0) + totalDeltaCRC;

  const computedVariantId = useMemo(() => {
    if (!product) return "";
    if (selectedParametersList.length === 0) return product.id;
    const paramSlug = selectedParametersList.map((p) => `${p.parameterId}_${p.optionId}`).join("__");
    return `${product.id}__${paramSlug}`;
  }, [product, selectedParametersList]);

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

  // Touch swipe support for main product gallery (phone usage)
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

  const handleAddToCart = () => {
    if (!product) return;
    const isIncluded = Boolean(
      product.price?.I_price?.includes ||
      (product as any).isInstallationIncluded
    );
    const variantSupplierUrl = selectedParametersList.find((p) => p.supplierUrl)?.supplierUrl;

    addItem({
      type: "PRODUCT",
      id: product.id,
      sku: product.id.toUpperCase(),
      title: product.p_title,
      brand: product.brand?.[0] || "Bikeman Performance",
      comp: product.comp,
      priceCRC: effectivePriceCRC,
      basePriceCRC: product.price.T_price,
      basePriceUSD: Number(product.price?.P_price_D || product.supplierLastPriceUSD || 0),
      supplierUrl: variantSupplierUrl || product.supplierUrl || null,
      selectedParameters: selectedParametersList,
      installationPriceCRC: isIncluded ? 0 : (Number(product.price?.I_price?.I_price) || 0),
      withInstallation: isIncluded,
      freeInstallation: isIncluded,
      homeInstallation: product.homeInstallation !== false,
      imageUrl: activeOptionImage || product.imgs?.[0] || "/images/logo.png",
      supplierStockStatus: availability?.status || product.supplierStockStatus,
      supplierStockMessage: lang === "es" ? availability?.messageEs : availability?.messageEn,
      supplierLeadDaysMin: availability?.leadDaysMin || product.supplierLeadDaysMin,
      supplierLeadDaysMax: availability?.leadDaysMax || product.supplierLeadDaysMax,
    });
  };

  // Solicitar Cotización de Reserva (Creates a #COT order and redirects or opens WhatsApp)
  const handleReserveQuotation = async () => {
    if (!product) return;
    setSubmittingReservationQuote(true);
    try {
      const isIncluded = Boolean(
        product.price?.I_price?.includes ||
        (product as any).isInstallationIncluded
      );
      const variantSupplierUrl = selectedParametersList.find((p) => p.supplierUrl)?.supplierUrl;

      // 1. Ensure item is in cart with OUT_OF_STOCK tag
      if (quantityInCart === 0) {
        addItem({
          type: "PRODUCT",
          id: product.id,
          sku: product.id.toUpperCase(),
          title: product.p_title,
          brand: product.brand?.[0] || "Bikeman Performance",
          comp: product.comp,
          priceCRC: effectivePriceCRC,
          basePriceCRC: product.price.T_price,
          basePriceUSD: Number(product.price?.P_price_D || product.supplierLastPriceUSD || 0),
          supplierUrl: variantSupplierUrl || product.supplierUrl || null,
          selectedParameters: selectedParametersList,
          installationPriceCRC: isIncluded ? 0 : (Number(product.price?.I_price?.I_price) || 0),
          withInstallation: isIncluded,
          freeInstallation: isIncluded,
          homeInstallation: product.homeInstallation !== false,
          imageUrl: activeOptionImage || product.imgs?.[0] || "/images/logo.png",
          supplierStockStatus: "OUT_OF_STOCK",
          supplierStockMessage: lang === "es" ? availability?.messageEs : availability?.messageEn,
          supplierLeadDaysMin: availability?.leadDaysMin,
          supplierLeadDaysMax: availability?.leadDaysMax,
        });
      }

      // 2. Create quotation order #COT
      const reservationNote = `Solicitud de Cotización de Reserva: ${product.p_title} (SKU: ${product.id.toUpperCase()}) agotada en proveedor`;
      const res = await createQuotationOrder(reservationNote);

      let orderNumber: string | undefined;
      let targetOrderId: string | undefined;
      if (res.success && res.order) {
        orderNumber = res.order.orderNumber;
        targetOrderId = res.order.id;
      }

      // 3. Open WhatsApp reservation proforma
      const waMsg =
        `¡Hola ZxZ Mods! Me interesa solicitar una Cotización de Reserva para el repuesto agotado:\n` +
        `• Producto: ${product.p_title}\n` +
        `• SKU / ID: ${product.id.toUpperCase()}\n` +
        `• Precio Base: ${formatCRC(effectivePriceCRC)}\n` +
        (orderNumber ? `• Cotización Generada: ${orderNumber}\n` : "") +
        `Por favor avisarme y apartar mi pedido en cuanto haya disponibilidad del proveedor.`;
      window.open(getWhatsAppUrl(waMsg), "_blank", "noopener,noreferrer");

      if (targetOrderId) {
        router.push(`/pedidos/${targetOrderId}`);
      }
    } catch (err) {
      console.error("Error creating reservation quotation:", err);
    } finally {
      setSubmittingReservationQuote(false);
    }
  };

  const isFreeInstallation = product?.price?.I_price?.includes ?? false;

  // Normalized brands list (guarantees Bikeman Performance)
  const displayedBrands = product?.brand
    ? Array.from(new Set(product.brand.map(normalizeBrandName)))
    : [];

  // Compatibility display with year model only to the right side of compatible models (e.g. Z10 & z10-4  2026+)
  const compDisplay = formatCompListWithYears(product?.comp);

  // Vehicle compatibility logic (matching platform and optional year bounds)
  const isUniversal = isUniversalFit(product?.comp);
  const isVehicleCompatible = Boolean(
    vehicle &&
    (isUniversal ||
      (product?.modelYearCompatibility && product.modelYearCompatibility.length > 0
        ? product.modelYearCompatibility.some((fit) => {
            const fitModelLower = (fit.model || "").toLowerCase();
            const fitMakeLower = (fit.make || "").toLowerCase();
            if (fitModelLower === "all" || fitModelLower.includes("universal")) return true;

            // Brand/Make match: if make is specified and not universal, vehicle brand MUST match
            if (fitMakeLower && fitMakeLower !== "all" && !fitMakeLower.includes("universal")) {
              const brandMatches =
                isPlatformOrVehicleMatch(fit.make || "", vehicle.brandName || "") ||
                isPlatformOrVehicleMatch(fit.make || "", (vehicle as any).brandSlug || "");
              if (!brandMatches) return false;
            }

            // Model match: vehicle model MUST match fit.model
            const modelMatches =
              isPlatformOrVehicleMatch(fit.model || "", vehicle.modelName || "") ||
              isPlatformOrVehicleMatch(fit.model || "", vehicle.modelSlug || "") ||
              isPlatformOrVehicleMatch(fit.model || "", `${vehicle.brandName || ""} ${vehicle.modelName || ""}`.trim());
            if (!modelMatches) return false;

            if (fit.yearFrom && vehicle.year < fit.yearFrom) return false;
            if (fit.yearTo && vehicle.year > fit.yearTo) return false;
            return true;
          })
        : product?.comp?.some((c) =>
            isPlatformOrVehicleMatch(c, vehicle.modelName) ||
            isPlatformOrVehicleMatch(c, vehicle.modelSlug) ||
            isPlatformOrVehicleMatch(c, `${vehicle.brandName} ${vehicle.modelName}`)
          )))
  );

  // Cart quantity for this specific product variant (replaces Add to cart button when > 0)
  const cartItem = items.find((i) => i.id === computedVariantId || (selectedParametersList.length === 0 && i.id === product?.id));
  const quantityInCart = cartItem?.quantity || 0;

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1D] flex flex-col justify-between selection:bg-[#C02030] selection:text-white">
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
            <span>{t.breadcrumbHome}</span>
          </Link>
          <span>/</span>
          <Link
            href="/productos"
            className="hover:text-black transition-colors"
          >
            <span>{t.breadcrumbProducts}</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-900 truncate max-w-xs">
            {(lang === "en" && (product as any)?.nameEn) ? (product as any).nameEn : (product?.p_title || slug)}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <Skeleton className="h-96 w-full rounded-3xl" />
              <div className="flex gap-2">
                <Skeleton className="h-20 w-20 rounded-2xl" />
                <Skeleton className="h-20 w-20 rounded-2xl" />
              </div>
              <Skeleton className="h-24 w-full rounded-3xl" />
              <Skeleton className="h-48 w-full rounded-3xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4 rounded-xl" />
              <Skeleton className="h-5 w-1/4 rounded-lg" />
              <Skeleton className="h-24 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-full" />
            </div>
          </div>
        ) : !product ? (
          <div className="py-24 text-center max-w-md mx-auto space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              {lang === "es" ? "Producto no encontrado" : "Product not found"}
            </h2>
            <p className="text-xs text-gray-500">
              {lang === "es"
                ? "El producto solicitado no existe o no se encuentra disponible."
                : "The requested product does not exist or is currently unavailable."}
            </p>
            <Link
              href="/productos"
              className="inline-block py-2.5 px-6 rounded-full bg-[#111827] text-white text-xs font-bold"
            >
              {lang === "es" ? "Volver al Catálogo" : "Back to Catalog"}
            </Link>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
              {/* Left Column: Visual Media Gallery & Description Below Audio */}
              <div className="space-y-5">
                {/* Main Image with Zoom Lightbox Trigger & Touch Swipe Gestures */}
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
                  {Boolean(product.discountPercent && product.discountPercent > 0) && (
                    <span className="absolute top-4 left-4 z-10 bg-[#C02030] text-white text-xs font-black px-3 py-1 rounded-full shadow-md tracking-wider uppercase">
                      -{product.discountPercent}% OFF
                    </span>
                  )}

                  {/* Mobile Image Counter Badge */}
                  {allImages.length > 1 && (
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10 sm:hidden">
                      {((selectedImageOverride ? allImages.indexOf(selectedImageOverride) : activeImageIndex) + 1) || 1} / {allImages.length}
                    </div>
                  )}

                  <Image
                    src={displayImageUrl}
                    alt={product.p_title}
                    fill
                    priority
                    className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
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

                {/* Audio Sample Player ("Sonido en espera" / "Audio Samples") */}
                {product.audios && product.audios.length > 0 && (() => {
                  const normalizedAudios: string[] = product.audios
                    .map((a: string) => normalizeAudioUrl(a))
                    .filter((s): s is string => Boolean(s));
                  if (normalizedAudios.length === 0) return null;
                  const safeIndex = activeAudioIndex >= 0 && activeAudioIndex < normalizedAudios.length ? activeAudioIndex : 0;
                  const currentTrackUrl: string = normalizedAudios[safeIndex] || "";

                  const getTrackLabel = (url: string, index: number) => {
                    const lower = url.toLowerCase();
                    if (lower.includes("idle")) return t.productAudioIdle || (lang === "es" ? "Ralentí / En Espera (Idle)" : "Idle Sound");
                    if (lower.includes("rev")) return t.productAudioRev || (lang === "es" ? "Aceleración / Revving" : "Revving Sound");
                    if (lower.includes("launch")) return lang === "es" ? "Despegue / Launch" : "Launch Sound";
                    return `${lang === "es" ? "Muestra" : "Clip"} ${index + 1}`;
                  };

                  const getTrackDescription = (url: string) => {
                    const lower = url.toLowerCase();
                    if (lower.includes("idle")) return t.productListenAudio;
                    if (lower.includes("rev")) return t.productAudioRev || (lang === "es" ? "Sonido del escape al acelerar (Rev Sound)" : "Exhaust sound revving (Rev Sound)");
                    return lang === "es" ? "Muestra de sonido de alta fidelidad para este producto" : "High-fidelity audio recording for this product";
                  };

                  return (
                    <div className="p-4 sm:p-5 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-[#C02030]" />
                          <span>{t.productAudioSample}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          {isPlayingAudio && (
                            <div className="flex items-center gap-0.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-[10px] text-red-700 font-mono font-bold animate-pulse">
                              <span className="w-1 h-2.5 bg-[#C02030] rounded-full animate-bounce [animation-delay:0ms]"></span>
                              <span className="w-1 h-3.5 bg-[#C02030] rounded-full animate-bounce [animation-delay:150ms]"></span>
                              <span className="w-1 h-2 bg-[#C02030] rounded-full animate-bounce [animation-delay:300ms]"></span>
                              <span className="ml-1 uppercase text-[9px] tracking-wider font-extrabold">{lang === "es" ? "Reproduciendo" : "Playing"}</span>
                            </div>
                          )}
                          <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider bg-gray-100 border border-gray-200/90 px-2 py-0.5 rounded-full">
                            HD Audio · WAV
                          </span>
                        </div>
                      </div>

                      {/* Multi-track switcher if more than 1 audio clip */}
                      {normalizedAudios.length > 1 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-gray-500 block">
                            {t.productAudioSelectTrack || (lang === "es" ? "Seleccionar Muestra de Sonido:" : "Select Sound Sample:")}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {normalizedAudios.map((url, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  setActiveAudioIndex(i);
                                  setIsPlayingAudio(false);
                                  setAudioError(false);
                                }}
                                className={`text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                                  safeIndex === i
                                    ? "bg-[#C02030] text-white shadow-xs ring-2 ring-red-200"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                                }`}
                              >
                                <Music className="w-3 h-3" />
                                <span>{getTrackLabel(url, i)}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-[11px] text-gray-600 font-medium">
                          {getTrackDescription(currentTrackUrl)}
                        </p>
                      </div>

                      {/* Audio Element with controls and error handling */}
                      <div className="pt-0.5">
                        <audio
                          key={currentTrackUrl}
                          controls
                          preload="metadata"
                          onPlay={() => setIsPlayingAudio(true)}
                          onPause={() => setIsPlayingAudio(false)}
                          onEnded={() => setIsPlayingAudio(false)}
                          onError={() => {
                            setAudioError(true);
                            setIsPlayingAudio(false);
                          }}
                          className="w-full h-10 outline-none rounded-xl"
                          src={currentTrackUrl}
                        />
                      </div>

                      {audioError && (
                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-700 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                          <span>{t.productAudioErrorNotice || (lang === "es" ? "No se pudo reproducir este clip de audio." : "Could not play this audio clip.")}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Video Sample Player (if any) */}
                {product.vids && product.vids.length > 0 && (
                  <div className="p-4 rounded-3xl bg-gray-50 border border-gray-200 shadow-sm space-y-2.5">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-2">
                      <Video className="w-4 h-4 text-[#C02030]" />
                      <span>{t.productVideoSample}</span>
                    </span>
                    <video
                      controls
                      preload="metadata"
                      className="w-full rounded-2xl"
                      src={product.vids[0]}
                    />
                  </div>
                )}

                {/* Product Description Below Audio Section */}
                <ProductDescriptionBlock
                  description={product.description}
                  lang={lang}
                />
              </div>

              {/* Right Column: Information, Fitment, Price & Purchase (Stays fixed while scrolling left column until reaching recommended products) */}
              <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {product.category?.map((cat) => (
                    <span
                      key={cat}
                      className="text-xs font-bold uppercase tracking-wider text-[#C02030] bg-[#C02030]/10 px-3 py-1 rounded-full"
                    >
                      {getCategoryLabel(cat, lang)}
                    </span>
                  ))}
                  {displayedBrands.map((b) => (
                    <span
                      key={b}
                      className="text-xs font-semibold text-gray-800 bg-gray-100 px-3 py-1 rounded-full border border-gray-200"
                    >
                      {b}
                    </span>
                  ))}

                  {/* Home Installation Eligibility Badge */}
                  {product.homeInstallation !== false ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold px-3 py-1 rounded-full">
                      <Home className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t.cartHomeInstallationEligible}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold px-3 py-1 rounded-full">
                      <Wrench className="w-3.5 h-3.5 text-rose-600" />
                      <span>{t.cartHomeInstallationIneligible}</span>
                    </span>
                  )}
                </div>

                {/* Star Rating - Empty outline stars when no reviews exist */}
                {Boolean(product.reviews?.count && product.reviews.count > 0) ? (
                  <a href="#reviews-section" className="inline-block hover:opacity-80 transition-opacity">
                    <StarRating
                      stars={product.reviews?.stars}
                      emptyLabel={t.productNoReviews}
                    />
                  </a>
                ) : (
                  <div>
                    <StarRating
                      stars={product.reviews?.stars}
                      emptyLabel={t.productNoReviews}
                    />
                  </div>
                )}

                {/* Title */}
                <h1 className="text-2xl sm:text-4xl font-black text-[#111827] tracking-tight leading-tight">
                  {(lang === "en" && (product as any)?.nameEn) ? (product as any).nameEn : product.p_title}
                </h1>

                {/* Configurable Parameters & Options (Colors, Materials, Stages, etc.) */}
                {product.parameters && product.parameters.length > 0 && (
                  <div className="p-4 sm:p-5 rounded-3xl bg-gray-50 border border-gray-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200/70 pb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                        <Sliders className="w-4 h-4 text-[#C02030]" />
                        <span>{t.productParametersTitle}</span>
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {product.parameters.map((param) => {
                        const isLinkedParam =
                          param.type === "product_linking" ||
                          param.type === "product_link" ||
                          param.options?.some((o) => Boolean(o.linkedProductId));

                        // Find if any existing option represents THIS product
                        const thisProdOpt = isLinkedParam
                          ? param.options?.find((o) => isCurrentProductOpt(o, product))
                          : null;

                        // Guarantee that the current viewing product is included in the options list
                        let displayOptions = [...(param.options || [])];
                        if (isLinkedParam) {
                          if (!thisProdOpt && product) {
                            const derived = deriveCleanVariantLabel(product, param.options || []);
                            const syntheticOpt: ParameterOption = {
                              id: `self-${product.id}`,
                              labelEs: derived.es,
                              labelEn: derived.en,
                              priceDeltaCRC: 0,
                              linkedProductId: product.slug || product.sku || product.id,
                              imageUrl: product.imageUrl || undefined,
                              isCurrentProduct: true,
                            };
                            displayOptions = [syntheticOpt, ...displayOptions];
                          } else if (thisProdOpt && product) {
                            const fullTitle = (product.nameEs || product.p_title || "").trim().toLowerCase();
                            const optLabel = (thisProdOpt.labelEs || "").trim().toLowerCase();
                            const isDirty = !thisProdOpt.labelEs || optLabel === fullTitle || optLabel.includes("skid plate") || optLabel.includes("hdpe") || optLabel === "estándar / base";
                            if (isDirty) {
                              const derived = deriveCleanVariantLabel(product, param.options || []);
                              thisProdOpt.labelEs = derived.es;
                              thisProdOpt.labelEn = derived.en;
                            }
                            thisProdOpt.priceDeltaCRC = 0;
                            thisProdOpt.isCurrentProduct = true;
                          }
                        }

                        // Determine the active option for header label
                        let activeOpt = null;
                        if (isLinkedParam) {
                          // For product linking: the active option label MUST be the viewing product
                          activeOpt = displayOptions.find((o) => isCurrentProductOpt(o, product)) || displayOptions[0];
                        } else {
                          const activeOptionId = selectedOptions[param.id] || displayOptions[0]?.id;
                          activeOpt = displayOptions.find((o) => o.id === activeOptionId) || displayOptions[0];
                        }

                        const paramTitle = lang === "es" ? param.nameEs : (param.nameEn || param.nameEs);
                        const activeOptLabel = activeOpt
                          ? (lang === "es" ? activeOpt.labelEs : (activeOpt.labelEn || activeOpt.labelEs))
                          : "";

                        return (
                          <div key={param.id} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-gray-800">
                                {paramTitle}:
                              </span>
                              <span className="font-semibold text-gray-600">
                                {activeOptLabel}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2.5">
                              {displayOptions.map((opt) => {
                                const isViewing = isLinkedParam
                                  ? isCurrentProductOpt(opt, product)
                                  : opt.id === activeOpt?.id;
                                const isSelected = isViewing;
                                const optLabel = lang === "es" ? opt.labelEs : (opt.labelEn || opt.labelEs);
                                const resolvedColor = resolveOptionColorHex(optLabel, opt.colorHex);
                                const isTargetSwitching = switchingLinkedProduct && switchingTargetId === opt.id;

                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    disabled={switchingLinkedProduct}
                                    onClick={() => handleSelectOption(param, opt)}
                                    className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border shadow-2xs ${
                                      isSelected
                                        ? "bg-[#C02030] border-[#C02030] text-white shadow-md scale-[1.02] ring-2 ring-[#C02030]/25"
                                        : "bg-white/80 backdrop-blur-md border border-gray-200/90 text-gray-800 hover:border-gray-400 hover:bg-white/95"
                                    } ${switchingLinkedProduct ? "opacity-85 cursor-wait" : ""}`}
                                  >
                                    {isTargetSwitching ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C02030] shrink-0" />
                                    ) : (
                                      <>
                                        {opt.imageUrl && (
                                          <img
                                            src={opt.imageUrl}
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
                                        {isLinkedParam && !opt.imageUrl && (
                                          <Link2
                                            className={`w-3.5 h-3.5 shrink-0 ${
                                              isSelected ? "text-white" : "text-gray-500"
                                            }`}
                                          />
                                        )}
                                      </>
                                    )}
                                    <span>{optLabel}</span>
                                    {!isSelected && opt.priceDeltaCRC !== 0 && (
                                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-gray-100 text-[#C02030]">
                                        {opt.priceDeltaCRC > 0
                                          ? `+${formatCRC(opt.priceDeltaCRC)}`
                                          : `-${formatCRC(Math.abs(opt.priceDeltaCRC))}`}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Total Price (Strictly only T_price disclosed, dynamically adjusted by selected parameters) */}
                <div className="p-5 rounded-3xl bg-gray-50 border border-gray-200/80 space-y-3">
                  <div>
                    <span className="text-xs text-gray-500 font-medium block">
                      {t.productsPricePiece}
                    </span>
                    <div className="flex items-baseline gap-2.5 flex-wrap">
                      <span className={`text-3xl sm:text-4xl font-black ${product.discountPercent && product.discountPercent > 0 ? "text-[#C02030]" : "text-[#111827]"}`}>
                        {formatCRC(effectivePriceCRC)}
                      </span>
                      {Boolean(product.discountPercent && product.discountPercent > 0 && product.originalPriceCRC && product.originalPriceCRC > 0) && (
                        <>
                          <span className="text-sm font-mono font-bold text-gray-400 line-through">
                            {formatCRC((product.originalPriceCRC || 0) + totalDeltaCRC)}
                          </span>
                          <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-rose-50 text-[#C02030] border border-rose-200">
                            -{product.discountPercent}% {lang === "es" ? "DESCUENTO" : "OFF"}
                          </span>
                        </>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 font-semibold block mt-1">
                      {t.productsPriceWithIvaFull || (lang === "es" ? "IVA incluido (13%)" : "13% VAT included")}
                    </span>
                  </div>

                  {/* Compatibility & Year Model: e.g. Z10 & z10-4  2026+ */}
                  {compDisplay && (
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200/60 text-xs">
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
                          title={t.productFitCheckChangeBtn}
                        >
                          {t.productFitCheckChangeBtn}
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
                          title={t.productFitCheckChangeBtn}
                        >
                          {t.productFitCheckChangeBtn}
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs">
                      <div className="flex items-center gap-2 text-amber-950 font-medium min-w-0">
                        <Car className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span className="truncate">
                          {lang === "es"
                            ? "¿Verificar con tu SxS? Selecciona tu modelo"
                            : "Check fit with your SxS? Select your model"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openModal()}
                        className="text-[11px] text-amber-800 font-bold underline hover:text-amber-950 cursor-pointer flex-shrink-0 whitespace-nowrap"
                      >
                        {lang === "es" ? "Mi Garaje" : "My Garage"}
                      </button>
                    </div>
                  )}

                  {/* Installation Details & Marketing Strategy */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-200/60">
                    {isFreeInstallation && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
                        <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t.productsInstallationFree}</span>
                      </div>
                    )}

                    {product.homeInstallation !== false ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
                        <Home className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t.cartHomeInstallationEligible}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50/80 border border-rose-200 text-rose-800 text-xs font-bold shadow-xs">
                        <Wrench className="w-3.5 h-3.5 text-rose-600" />
                        <span>{t.cartHomeInstallationIneligible}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* US Supplier Live Availability Projection Card */}
                {checkingAvailability && !availability ? (
                  <div className="p-4 sm:p-5 rounded-3xl bg-gray-50 border border-gray-200/80 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-48 rounded-full" />
                      <Skeleton className="h-4 w-24 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-5/6 rounded-lg" />
                    <div className="flex items-center justify-between pt-1">
                      <Skeleton className="h-3 w-36 rounded-md" />
                      <Skeleton className="h-3 w-20 rounded-md" />
                    </div>
                  </div>
                ) : availability ? (
                  <div
                    className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                      availability.status === "PRE_ORDER"
                        ? "bg-blue-50/80 border-blue-200 text-blue-950"
                        : availability.status === "OUT_OF_STOCK" || availability.status === "UNAVAILABLE"
                        ? "bg-rose-50/80 border-rose-200 text-rose-950"
                        : "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {availability.status === "PRE_ORDER" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-300">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            <Calendar className="w-3.5 h-3.5 text-blue-700" />
                            <span>{t.supplierStockPreOrder}</span>
                          </span>
                        ) : availability.status === "OUT_OF_STOCK" || availability.status === "UNAVAILABLE" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-300">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>{t.supplierStockOutOfStock}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>
                              {availability.status === "LOW_STOCK"
                                ? t.supplierStockLowStock
                                : t.supplierStockInStock}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Recheck live availability button */}
                      <button
                        type="button"
                        onClick={handleRefreshAvailability}
                        disabled={checkingAvailability}
                        className="text-[11px] text-gray-500 hover:text-gray-900 inline-flex items-center gap-1 font-semibold p-1 hover:bg-white/60 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        title={t.supplierCheckingLive}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${checkingAvailability ? "animate-spin text-[#C02030]" : ""}`} />
                        <span className="hidden sm:inline">
                          {checkingAvailability
                            ? (lang === "es" ? "Verificando..." : "Checking...")
                            : (lang === "es" ? "Actualizar" : "Refresh")}
                        </span>
                      </button>
                    </div>

                    {/* Message & Lead Time Explanation */}
                    <div className="space-y-1.5 text-xs">
                      <p className="font-semibold leading-relaxed">
                        {lang === "es" ? availability.messageEs : availability.messageEn}
                      </p>

                      {availability.status === "PRE_ORDER" && (
                        <p className="text-[11px] text-blue-900/90 leading-relaxed font-medium">
                          {t.supplierPreOrderNotice}
                        </p>
                      )}

                      {availability.status === "OUT_OF_STOCK" && (
                        <p className="text-[11px] text-rose-900/90 leading-relaxed font-medium">
                          {t.supplierReserveQuotationNotice}
                        </p>
                      )}

                      {availability.status !== "OUT_OF_STOCK" && availability.status !== "UNAVAILABLE" && (
                        <p className="text-[11px] text-gray-700 font-medium">
                          {t.supplierLeadTimeText
                            .replace("{min}", String(availability.leadDaysMin || 7))
                            .replace("{max}", String(availability.leadDaysMax || 12))}
                        </p>
                      )}
                    </div>

                    {/* Verification Footer */}
                    <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-black/5 text-[10px] text-gray-600">
                      <div className="flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{t.supplierVerifiedBadge}</span>
                      </div>
                      <div className="font-mono text-gray-500">
                        <span>{t.supplierLastCheckedLabel} </span>
                        <span className="font-semibold">{formatCheckedTime(availability.checkedAt, lang)}</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Requirements Notice if defined on product */}
                {product.requirements && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-950 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <span className="font-bold text-amber-900">
                        {t.productsRequirementsNotice}:{" "}
                      </span>
                      <span>{product.requirements}</span>
                    </div>
                  </div>
                )}

                {/* Warranty Void Alert & ZxZ Mods Dealer Warranty Protection Service Banner */}
                {product.voidsWarranty && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-red-50 border border-amber-200 text-slate-900 space-y-3 shadow-xs">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                        <ShieldAlert className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-md">
                            {t.devVoidsWarrantyBadge}
                          </span>
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                          {t.warrantyProtectionBannerTitle}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                          {t.warrantyProtectionBannerDesc}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 flex items-center justify-between gap-3 border-t border-amber-200/70">
                      <span className="text-[10px] text-amber-900 font-medium">
                        {lang === "es" ? "Reinstalación OEM cobrando solo mano de obra" : "OEM re-installation charging only labor"}
                      </span>
                      <Link
                        href="/servicios/proteccion-garantia"
                        className="text-xs font-bold text-[#C02030] hover:text-[#901824] underline hover:no-underline inline-flex items-center gap-1 shrink-0"
                      >
                        <span>{t.warrantyProtectionBannerCta}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div ref={buySectionRef} className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  {quantityInCart === 0 ? (
                    availability?.status === "OUT_OF_STOCK" || availability?.status === "UNAVAILABLE" ? (
                      <button
                        onClick={handleReserveQuotation}
                        disabled={submittingReservationQuote}
                        className="w-full sm:flex-1 py-4 px-6 rounded-full bg-[#C02030] hover:bg-[#9A1624] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] cursor-pointer disabled:opacity-60"
                      >
                        {submittingReservationQuote ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <FileText className="w-4 h-4" />
                            <span>{t.supplierReserveQuotationBtn}</span>
                          </>
                        )}
                      </button>
                    ) : availability?.status === "PRE_ORDER" ? (
                      <button
                        onClick={handleAddToCart}
                        className="w-full sm:flex-1 py-4 px-6 rounded-full bg-[#1e40af] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>{lang === "es" ? "Reservar en Preventa" : "Pre-Order Reservation"}</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleAddToCart}
                        className="w-full sm:flex-1 py-4 px-6 rounded-full bg-[#111827] hover:bg-[#C02030] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>{t.productsAddToCart}</span>
                      </button>
                    )
                  ) : (
                    <div className="w-full sm:flex-1 py-2 px-3 sm:px-4 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-between gap-2 shadow-inner">
                      {/* Quantity Controller: Minus, Count, Plus */}
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (quantityInCart === 1) {
                              setShowRemoveConfirm(true);
                            } else {
                              updateQuantity(cartItem ? cartItem.id : product.id, quantityInCart - 1);
                            }
                          }}
                          className="w-8 h-8 rounded-full bg-white hover:bg-gray-200 text-gray-800 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                          aria-label="Reducir cantidad"
                          title="Reducir cantidad"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <div
                          onClick={() => setIsOpen(true)}
                          className="px-2 sm:px-3 text-center cursor-pointer select-none"
                          title="Ver en carrito"
                        >
                          <span className="font-mono font-extrabold text-sm sm:text-base text-gray-900 block leading-tight">
                            {quantityInCart}
                          </span>
                          <span className="text-[10px] text-gray-500 font-semibold block leading-tight">
                            {t.productInCart}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => updateQuantity(cartItem ? cartItem.id : product.id, quantityInCart + 1)}
                          className="w-8 h-8 rounded-full bg-white hover:bg-gray-200 text-gray-800 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                          aria-label="Aumentar cantidad"
                          title="Aumentar cantidad"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Right actions: Quick view cart and Direct Trash Can */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsOpen(true)}
                          className="p-2 rounded-full bg-white/80 hover:bg-white text-gray-700 hover:text-black text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          title={t.cartTitle}
                        >
                          <ShoppingCart className="w-3.5 h-3.5 text-[#C02030]" />
                        </button>

                        {/* Trash Can: Removes immediately WITHOUT confirmation pop up per user instructions */}
                        <button
                          type="button"
                          onClick={() => removeItem(cartItem ? cartItem.id : product.id)}
                          className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                          title={lang === "es" ? "Eliminar del carrito" : "Remove from cart"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <a
                    href={getWhatsAppUrl(
                      `¡Hola ZxZ Mods! Me interesa cotizar la pieza: ${product.p_title}${selectedParametersList.length > 0 ? ` (${selectedParametersList.map(p => `${p.parameterName}: ${p.optionLabel}`).join(", ")})` : ""} (ID: ${product.id}). Precio: ${formatCRC(effectivePriceCRC)}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto py-4 px-6 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{t.productsQuoteWhatsapp}</span>
                  </a>
                </div>

                {/* Suggestions Section (For Optimal Function & Prevention) */}
                <SuggestedSection
                  suggestedProducts={product.suggestedProducts || []}
                  suggestedCombos={product.suggestedCombos || []}
                  isLoading={loading}
                />
              </div>
            </div>

            {/* Requirements Shelf (if product specifies required components) */}
            {product.requirements && (
              <section className="mt-16 pt-10 border-t border-gray-200">
                <div className="mb-6 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                      {t.productRequirementsShelfTitle}
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {t.productRequirementsShelfSubtitle}
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-sm text-amber-950">
                        {product.requirements}
                      </h3>
                      <p className="text-xs text-amber-800/90 mt-1">
                        {lang === "es"
                          ? "Para asegurar la máxima confiabilidad mecánica y rendimiento del vehículo con este accesorio, recomendamos instalar este componente complementario."
                          : "To ensure maximum mechanical reliability and performance with this upgrade, we recommend this complementary component."}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Suggested Combos Shelf (LE-03) */}
            {(combosLoading || suggestedCombos.length > 0) && (
              <section className="mt-14 pt-10 border-t border-gray-200">
                <div className="mb-6 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F05526]" />
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#F05526]" />
                      <span>{t.productSuggestedCombosTitle}</span>
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {t.productSuggestedCombosSubtitle}
                  </p>
                </div>

                {combosLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-72 w-full rounded-3xl" />
                    ))}
                  </div>
                ) : suggestedCombos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {suggestedCombos.map((combo: any) => {
                      let itemsList: any[] = [];
                      try {
                        itemsList = typeof combo.itemsJson === "string" ? JSON.parse(combo.itemsJson) : combo.itemsJson || [];
                      } catch {}
                      const priceCRC = Number(combo.priceCRC) || 0;
                      const savingsCRC = Number(combo.savingsCRC) || 0;
                      const comboImg = combo.imageUrl || (Array.isArray(combo.images) && combo.images[0]) || "/images/logo.png";

                      return (
                        <Link
                          key={combo.id}
                          href={`/combos/${combo.slug || combo.id}`}
                          className="group flex flex-col bg-white rounded-3xl border border-gray-200 overflow-hidden hover:shadow-xl hover:border-gray-300 transition-all duration-300 p-4 justify-between"
                        >
                          <div>
                            <div className="relative h-44 w-full bg-gradient-to-b from-[#FBFBFC] to-[#F1F3F5] rounded-2xl overflow-hidden mb-3">
                              <Image
                                src={comboImg}
                                alt={combo.nameEs || combo.nameEn || "Combo"}
                                fill
                                className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
                              />
                              {savingsCRC > 0 && (
                                <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-xs">
                                  {lang === "es" ? `Ahorra ₡${savingsCRC.toLocaleString()}` : `Save ₡${savingsCRC.toLocaleString()}`}
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold text-[#F05526] bg-[#F05526]/10 px-2 py-0.5 rounded-full uppercase">
                                  Combo Pack
                                </span>
                                {itemsList.length > 0 && (
                                  <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                    {itemsList.length} {lang === "es" ? "piezas" : "items"}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-bold text-xs text-gray-900 group-hover:text-[#F05526] transition-colors line-clamp-2 mt-1">
                                {lang === "es" ? combo.nameEs : (combo.nameEn || combo.nameEs)}
                              </h3>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-gray-100 mt-3 flex items-center justify-between">
                            <div>
                              <div className="text-base font-black text-gray-900 font-mono">
                                {formatCRC(priceCRC)}
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-[#F05526] group-hover:underline flex items-center gap-1">
                              <span>{t.productViewComboBtn}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            )}

            {/* Related & Suggested Products Shelf (LE-03) */}
            <section className="mt-14 pt-10 border-t border-gray-200">
              <div className="mb-6 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C02030]" />
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                    {t.productSuggestedProductsTitle}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-gray-500">
                  {t.productSuggestedProductsSubtitle}
                </p>
              </div>

              {relatedLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-72 w-full rounded-3xl" />
                  ))}
                </div>
              ) : relatedProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {relatedProducts.slice(0, 10).map((rel) => {
                    const isFree = rel.price?.I_price?.includes ?? (rel as any).isInstallationIncluded ?? false;
                    const brandDisplay = normalizeBrandName(
                      rel.brand?.[0] || (rel as any).brandName || ""
                    );
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
                                  {getCategoryLabel(rel.category[0], lang)}
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-xs text-gray-900 group-hover:text-[#C02030] transition-colors line-clamp-2">
                              {rel.p_title || (rel as any).nameEs}
                            </h3>
                          </div>

                          <div className="pt-2 border-t border-gray-100 space-y-1">
                            <StarRating stars={rel.reviews?.stars} />
                            <div className="text-base font-black text-gray-900 font-mono">
                              {relPriceDisplay}
                            </div>
                            {isFree && (
                              <span className="text-[10px] font-bold text-emerald-700 block">
                                {t.productsInstallationFree}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 rounded-3xl bg-gray-50 border border-gray-200 text-center max-w-lg mx-auto space-y-2">
                  <Car className="w-8 h-8 text-gray-400 mx-auto" />
                  <h3 className="text-sm font-bold text-gray-800">
                    {lang === "es"
                      ? "Próximamente más productos"
                      : "More products coming soon"}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {lang === "es"
                      ? "Estamos agregando continuamente reprogramaciones ECU, filtros de aire y repuestos de alto rendimiento para esta plataforma."
                      : "We are continually adding ECU tunes, air filters, and high-performance upgrades for this vehicle platform."}
                  </p>
                </div>
              )}
            </section>

            {/* Verified Customer Reviews Section (Placed at the very bottom) */}
            <ProductReviewsSection
              productId={product.id}
              productSlug={product.slug}
              itemTitle={product.p_title}
              initialReviewCount={product.reviews?.count || 0}
              onRatingUpdated={(newRating) => {
                setProduct((prev) => {
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

      {/* Full-Screen Image Lightbox Modal */}
      {isLightboxOpen && product && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-fadeIn"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Lightbox Header */}
          <div
            className="flex items-center justify-between text-white max-w-7xl mx-auto w-full pb-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm font-semibold text-gray-300 truncate max-w-xs sm:max-w-md">
                {product.p_title}
              </span>
              {product.imgs && product.imgs.length > 1 && (
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-gray-400">
                  {lightboxImageIndex + 1} / {product.imgs.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Cerrar vista ampliada"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lightbox Center Image with Touch Swipe Support */}
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
                  "/images/logo.png"
                }
                alt={product.p_title}
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

      {/* Confirmation Modal when reducing item quantity to zero */}
      {showRemoveConfirm && product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div
            className="fixed inset-0"
            onClick={() => setShowRemoveConfirm(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-200 z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  {t.cartRemoveConfirmTitle}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                  {product.p_title}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              {t.cartRemoveConfirmMessage}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowRemoveConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {t.cartRemoveConfirmCancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  removeItem(cartItem ? cartItem.id : product.id);
                  setShowRemoveConfirm(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#C02030] hover:bg-[#9A1624] text-white transition-colors shadow-sm cursor-pointer"
              >
                {t.cartRemoveConfirmAction}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Phone Sticky Buy Action Bar */}
      {showStickyBar && product && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 sm:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.12)] flex items-center justify-between gap-3 animate-fade-in pb-safe">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="relative w-11 h-11 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
              <Image
                src={displayImageUrl}
                alt={product.p_title}
                fill
                className="object-contain p-1"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 truncate">
                {lang === "en" && (product as any).nameEn ? (product as any).nameEn : product.p_title}
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

          <button
            onClick={handleAddToCart}
            className="px-4 py-2.5 rounded-full bg-[#111827] hover:bg-[#C02030] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0 cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{quantityInCart > 0 ? `(${quantityInCart}) +` : t.productsAddToCart}</span>
          </button>
        </div>
      )}

      {/* Global Site Footer */}
      <Footer />

      <GarageModal />
      <FloatingConcierge />
    </div>
  );
}

