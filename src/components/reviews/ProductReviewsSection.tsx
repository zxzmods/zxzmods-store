"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Star,
  CheckCircle2,
  ShieldCheck,
  Edit3,
  MessageSquare,
  AlertCircle,
  Sparkles,
  Send,
  X,
  User,
} from "lucide-react";

export interface ReviewItem {
  id: string;
  userId: string;
  orderId: string;
  productId?: string | null;
  comboId?: string | null;
  rating: number;
  title?: string | null;
  comment: string;
  userName?: string | null;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStats {
  totalCount: number;
  averageRating: number;
  distribution: Record<number, number>;
}

interface ProductReviewsSectionProps {
  productId?: string;
  productSlug?: string;
  comboId?: string;
  comboSlug?: string;
  itemTitle?: string;
  initialReviewCount?: number;
  onRatingUpdated?: (newRating: { stars: number; count: number }) => void;
}

export function ProductReviewsSection({
  productId,
  productSlug,
  comboId,
  comboSlug,
  itemTitle,
  initialReviewCount = 0,
  onRatingUpdated,
}: ProductReviewsSectionProps) {
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalCount: initialReviewCount,
    averageRating: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loading, setLoading] = useState(true);

  // Eligibility state
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    reason?: string;
    completedOrderId?: string;
    orderNumber?: string;
    existingReview?: any;
  } | null>(null);

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Selected star filter (null = all)
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);

  const onRatingUpdatedRef = useRef(onRatingUpdated);
  useEffect(() => {
    onRatingUpdatedRef.current = onRatingUpdated;
  }, [onRatingUpdated]);

  // Build query parameter string
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (productId) params.set("productId", productId);
    if (productSlug) params.set("productSlug", productSlug);
    if (comboId) params.set("comboId", comboId);
    if (comboSlug) params.set("comboSlug", comboSlug);
    return params.toString();
  }, [productId, productSlug, comboId, comboSlug]);

  // Load reviews from backend API
  const loadReviews = useCallback(async () => {
    if (!queryParams) return;
    try {
      const res = await fetch(`/api/reviews?${queryParams}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        if (data.stats) {
          setStats(data.stats);
          if (onRatingUpdatedRef.current) {
            onRatingUpdatedRef.current({
              stars: data.stats.averageRating,
              count: data.stats.totalCount,
            });
          }
        }
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  // Load eligibility from backend API
  const checkEligibility = useCallback(async () => {
    if (!queryParams) return;
    try {
      const res = await fetch(`/api/reviews/eligibility?${queryParams}`);
      const data = await res.json();
      if (data.success) {
        setEligibility({
          eligible: Boolean(data.eligible),
          reason: data.reason,
          completedOrderId: data.completedOrderId,
          orderNumber: data.orderNumber,
          existingReview: data.existingReview,
        });

        // Pre-fill form if existing review found
        if (data.existingReview) {
          setRating(data.existingReview.rating || 5);
          setTitle(data.existingReview.title || "");
          setComment(data.existingReview.comment || "");
        }
      } else {
        setEligibility(null);
      }
    } catch (err) {
      console.error("Error checking review eligibility:", err);
      setEligibility(null);
    }
  }, [queryParams]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    checkEligibility();
  }, [checkEligibility, user]);

  // Handle Form Submit
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) return;
    if (!comment.trim() || comment.trim().length < 3) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          productSlug,
          comboId,
          comboSlug,
          rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedback({
          type: "success",
          message: t.reviewsSuccessToast,
        });
        setIsFormOpen(false);
        // Refresh reviews and eligibility state
        await Promise.all([loadReviews(), checkEligibility()]);
      } else {
        setFeedback({
          type: "error",
          message: data.error || t.reviewsErrorToast,
        });
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      setFeedback({
        type: "error",
        message: t.reviewsErrorToast,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter reviews
  const filteredReviews = useMemo(() => {
    if (!selectedStarFilter) return reviews;
    return reviews.filter((r) => Math.round(r.rating) === selectedStarFilter);
  }, [reviews, selectedStarFilter]);

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(lang === "es" ? "es-CR" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  // USER RULE:
  // "Don't show the review section if no reviews, only show if user bought the product/combo."
  // "There's a jumping when trying to load the reviews fix."
  const hasReviews = reviews.length > 0 || stats.totalCount > 0;
  const isEligibleBuyer = Boolean(eligibility?.eligible);

  // While loading:
  // If we don't have existing reviews, return null immediately so there is zero layout jumping.
  if (loading && initialReviewCount === 0) {
    return null;
  }

  // Once loaded:
  // If no reviews exist AND the user did not buy the product/combo, hide the section entirely.
  if (!loading && !hasReviews && !isEligibleBuyer) {
    return null;
  }

  return (
    <section
      id="reviews-section"
      className="scroll-mt-28 mt-16 pt-12 border-t border-gray-200/90 transition-opacity duration-300"
      aria-label="Verified Customer Reviews"
    >
      <div className="space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.reviewsVerifiedBuyerBadge}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
              <span>{t.reviewsSectionTitle}</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-2xl">
              {t.reviewsSectionSubtitle}
            </p>
          </div>

          {/* Action button if eligible */}
          {isEligibleBuyer && !isFormOpen && (
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gray-900 hover:bg-[#C02030] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0"
            >
              <Edit3 className="w-4 h-4" />
              <span>
                {eligibility?.existingReview
                  ? t.reviewsEditReviewBtn
                  : t.reviewsWriteReviewBtn}
              </span>
            </button>
          )}
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold transition-all ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                : "bg-rose-50 text-rose-900 border border-rose-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* LOADING SKELETON (Only shown when initialReviewCount > 0 so there's no layout jump) */}
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-gray-50/70 p-6 sm:p-8 rounded-3xl border border-gray-100">
              <div className="md:col-span-4 flex flex-col items-center justify-center space-y-3 p-4">
                <Skeleton className="w-20 h-12 rounded-xl" />
                <Skeleton className="w-32 h-5 rounded-md" />
                <Skeleton className="w-24 h-4 rounded-md" />
              </div>
              <div className="md:col-span-8 space-y-2.5 justify-center flex flex-col p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-12 h-3.5 rounded" />
                    <Skeleton className="flex-1 h-3 rounded-full" />
                    <Skeleton className="w-8 h-3.5 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Reviews Summary Stats Card (Only shown if reviews exist) */}
            {hasReviews && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-gradient-to-br from-gray-50 via-white to-gray-50/80 p-6 sm:p-8 rounded-3xl border border-gray-200/90 shadow-xs">
                {/* Left Column: Overall score */}
                <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-gray-200/70">
                  <span className="text-5xl sm:text-6xl font-black text-gray-900 tracking-tight font-mono">
                    {stats.totalCount > 0 ? stats.averageRating.toFixed(1) : "0.0"}
                  </span>
                  <div className="flex items-center gap-1.5 my-2">
                    {[1, 2, 3, 4, 5].map((starIdx) => (
                      <Star
                        key={starIdx}
                        className={`w-5 h-5 ${
                          stats.totalCount > 0 && starIdx <= Math.round(stats.averageRating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300 stroke-[1.5]"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {stats.totalCount > 0
                      ? `${t.reviewsAverageRating} (${stats.totalCount} ${
                          stats.totalCount === 1 ? "reseña" : "reseñas"
                        })`
                      : t.productNoReviews}
                  </span>
                </div>

                {/* Right Column: Breakdown bars */}
                <div className="md:col-span-8 flex flex-col justify-center space-y-2 p-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = stats.distribution[star] || 0;
                    const pct = stats.totalCount > 0 ? Math.round((count / stats.totalCount) * 100) : 0;
                    const isSelected = selectedStarFilter === star;

                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() =>
                          setSelectedStarFilter((prev) => (prev === star ? null : star))
                        }
                        className={`group flex items-center gap-3 text-xs w-full p-1 rounded-xl transition-all ${
                          isSelected
                            ? "bg-amber-50 ring-1 ring-amber-300"
                            : "hover:bg-gray-100/70"
                        }`}
                      >
                        <div className="flex items-center gap-1 w-14 font-semibold text-gray-700">
                          <span>{star}</span>
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        </div>
                        <div className="flex-1 h-3 rounded-full bg-gray-200 overflow-hidden relative">
                          <div
                            className="h-full bg-amber-400 group-hover:bg-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-10 text-right font-mono text-gray-500 text-[11px]">
                          {count}
                        </span>
                      </button>
                    );
                  })}

                  {selectedStarFilter && (
                    <div className="pt-2 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedStarFilter(null)}
                        className="text-xs font-bold text-[#0052CC] hover:underline"
                      >
                        {t.reviewsFilterAll}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VERIFIED BUYER PROMPT (Shown when user bought the product and is eligible) */}
            {isEligibleBuyer && (
              <div className="p-6 rounded-3xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-emerald-950">
                        {t.reviewsVerifiedBuyerBadge}
                      </h4>
                      {eligibility?.orderNumber && (
                        <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          #{eligibility.orderNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      {t.reviewsVerifiedBuyerNotice}
                    </p>
                  </div>
                </div>
                {!isFormOpen && (
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors flex-shrink-0 flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>
                      {eligibility?.existingReview
                        ? t.reviewsEditReviewBtn
                        : t.reviewsWriteReviewBtn}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* WRITE / EDIT REVIEW FORM */}
            {isFormOpen && isEligibleBuyer && (
              <form
                onSubmit={handleSubmitReview}
                className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-emerald-500/30 shadow-lg space-y-6 transition-all"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-gray-900">
                        {eligibility?.existingReview
                          ? t.reviewsFormEditTitle
                          : t.reviewsFormTitle}
                      </h3>
                      {itemTitle && (
                        <p className="text-xs text-gray-500 truncate max-w-md">
                          {itemTitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Interactive Star Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 block">
                    {t.reviewsRatingLabel} <span className="text-[#C02030]">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((starIdx) => {
                        const activeVal = hoverRating !== null ? hoverRating : rating;
                        const isFilled = starIdx <= activeVal;
                        return (
                          <button
                            key={starIdx}
                            type="button"
                            onMouseEnter={() => setHoverRating(starIdx)}
                            onMouseLeave={() => setHoverRating(null)}
                            onClick={() => setRating(starIdx)}
                            className="p-1 -m-1 focus:outline-none transition-transform hover:scale-125"
                            aria-label={`${starIdx} estrellas`}
                          >
                            <Star
                              className={`w-7 h-7 transition-colors ${
                                isFilled
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-200 stroke-[1.5]"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-sm font-bold text-gray-900 ml-2 font-mono">
                      {rating} / 5
                    </span>
                  </div>
                </div>

                {/* Review Title Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">
                    {t.reviewsTitleLabel}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t.reviewsTitlePlaceholder}
                    maxLength={100}
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052CC]"
                  />
                </div>

                {/* Review Comment Textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 block">
                    {t.reviewsCommentLabel} <span className="text-[#C02030]">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={t.reviewsCommentPlaceholder}
                    required
                    minLength={3}
                    maxLength={1500}
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0052CC] resize-none"
                  />
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>{lang === "es" ? "Mínimo 3 caracteres" : "Minimum 3 characters"}</span>
                    <span>{comment.length} / 1500</span>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-colors"
                  >
                    {t.reviewsCancelBtn}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !comment.trim()}
                    className="px-6 py-2.5 rounded-xl bg-[#0052CC] hover:bg-[#0040A0] text-white text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {submitting
                        ? t.reviewsSubmitting
                        : eligibility?.existingReview
                        ? t.reviewsSaveEditBtn
                        : t.reviewsSubmitBtn}
                    </span>
                  </button>
                </div>
              </form>
            )}

            {/* VERIFIED REVIEWS LIST (Only rendered if there are reviews) */}
            {hasReviews && (
              <div className="space-y-4 pt-2">
                {filteredReviews.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-gray-50/70 border border-gray-200/70 text-center space-y-2">
                    <p className="text-xs text-gray-500">
                      {lang === "es"
                        ? `No hay reseñas con ${selectedStarFilter} estrellas.`
                        : `No reviews with ${selectedStarFilter} stars.`}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedStarFilter(null)}
                      className="text-xs font-bold text-[#0052CC] hover:underline"
                    >
                      {t.reviewsFilterAll}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReviews.map((rev) => {
                      const isMyReview = user && rev.userId === user.id;

                      return (
                        <div
                          key={rev.id}
                          className={`p-6 rounded-3xl border transition-all ${
                            isMyReview
                              ? "bg-blue-50/30 border-blue-200/80 ring-1 ring-blue-100"
                              : "bg-white border-gray-200/80 shadow-xs"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            {/* Stars & Verified Badge */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-4 h-4 ${
                                      s <= Math.round(rev.rating)
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-gray-200 stroke-[1.5]"
                                    }`}
                                  />
                                ))}
                              </div>

                              {rev.verified && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>{t.reviewsVerifiedBuyerBadge}</span>
                                </span>
                              )}

                              {isMyReview && (
                                <span className="text-[11px] font-bold bg-[#0052CC]/10 text-[#0052CC] px-2 py-0.5 rounded-full">
                                  {t.reviewsMyReviewBadge}
                                </span>
                              )}
                            </div>

                            {/* Date and Author */}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="font-semibold text-gray-900">
                                {rev.userName || (lang === "es" ? "Cliente Verificado" : "Verified Customer")}
                              </span>
                              <span>•</span>
                              <time dateTime={rev.createdAt}>
                                {formatDate(rev.createdAt)}
                              </time>
                            </div>
                          </div>

                          {/* Title if present */}
                          {rev.title && (
                            <h4 className="text-sm sm:text-base font-bold text-gray-900 mb-1.5">
                              {rev.title}
                            </h4>
                          )}

                          {/* Comment Body */}
                          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                            {rev.comment}
                          </p>

                          {/* If it's my review, offer quick edit */}
                          {isMyReview && !isFormOpen && (
                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setRating(rev.rating);
                                  setTitle(rev.title || "");
                                  setComment(rev.comment);
                                  setIsFormOpen(true);
                                }}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0052CC] hover:underline"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>{t.reviewsEditReviewBtn}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
