"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  RefreshCw,
  Percent,
  DollarSign,
  Calendar,
  Lock,
  Layers,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { formatCRC } from "@/lib/i18n";

export interface DiscountCodeRecord {
  id: string;
  code: string;
  description: string | null;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderCRC: number;
  maxDiscountCRC: number | null;
  maxUses: number | null;
  timesUsed: number;
  isActive: boolean;
  expiresAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DiscountCodesManagerSectionProps {
  userRole?: "MASTER" | "STAFF";
}

export function DiscountCodesManagerSection({ userRole = "MASTER" }: DiscountCodesManagerSectionProps) {
  const { t, lang } = useLanguage();
  const isMaster = userRole === "MASTER";

  const [codes, setCodes] = useState<DiscountCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCodeRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [formCode, setFormCode] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [formValue, setFormValue] = useState<number>(10);
  const [formMinOrder, setFormMinOrder] = useState<number>(0);
  const [formMaxDiscount, setFormMaxDiscount] = useState<string>("");
  const [formMaxUses, setFormMaxUses] = useState<string>("");
  const [formExpiresAt, setFormExpiresAt] = useState<string>("");
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Delete Confirmation State
  const [codeToDelete, setCodeToDelete] = useState<DiscountCodeRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Discount Codes
  const fetchCodes = useCallback(async () => {
    if (!isMaster) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/sys/discount-codes");
      const data = await res.json();
      if (res.ok && data.success) {
        setCodes(data.discountCodes || []);
      } else {
        setFeedbackMsg({
          type: "error",
          text: data.error || (lang === "es" ? "Error al cargar códigos de descuento" : "Failed to load discount codes"),
        });
      }
    } catch (err) {
      console.error("Failed to fetch discount codes:", err);
      setFeedbackMsg({
        type: "error",
        text: lang === "es" ? "Error de conexión al cargar cupones" : "Network error loading coupons",
      });
    } finally {
      setLoading(false);
    }
  }, [isMaster, lang]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleCopy = (codeText: string, id: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(codeText);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingCode(null);
    setFormCode("");
    setFormDescription("");
    setFormType("PERCENTAGE");
    setFormValue(10);
    setFormMinOrder(0);
    setFormMaxDiscount("");
    setFormMaxUses("");
    setFormExpiresAt("");
    setFormIsActive(true);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: DiscountCodeRecord) => {
    setEditingCode(item);
    setFormCode(item.code);
    setFormDescription(item.description || "");
    setFormType(item.discountType);
    setFormValue(item.discountValue);
    setFormMinOrder(item.minOrderCRC || 0);
    setFormMaxDiscount(item.maxDiscountCRC ? String(item.maxDiscountCRC) : "");
    setFormMaxUses(item.maxUses ? String(item.maxUses) : "");
    setFormExpiresAt(item.expiresAt ? new Date(item.expiresAt).toISOString().split("T")[0] : "");
    setFormIsActive(item.isActive);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleToggleActive = async (item: DiscountCodeRecord) => {
    try {
      const res = await fetch(`/api/sys/discount-codes/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.discountCode) {
        setCodes((prev) =>
          prev.map((c) => (c.id === item.id ? data.discountCode : c))
        );
        setFeedbackMsg({
          type: "success",
          text: t.backdoorDiscountsSaveSuccess || "Código de descuento actualizado correctamente.",
        });
        setTimeout(() => setFeedbackMsg(null), 3500);
      } else {
        setFeedbackMsg({
          type: "error",
          text: data.error || (lang === "es" ? "Error al cambiar estado" : "Failed to toggle status"),
        });
      }
    } catch (err) {
      setFeedbackMsg({
        type: "error",
        text: lang === "es" ? "Error de red al actualizar estado" : "Network error updating status",
      });
    }
  };

  const handleSaveCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) {
      setModalError(lang === "es" ? "El código de descuento es obligatorio." : "Coupon code is required.");
      return;
    }

    const cleanCode = formCode.trim().toUpperCase().replace(/\s+/g, "");
    if (!/^[A-Z0-9_-]+$/.test(cleanCode)) {
      setModalError(
        lang === "es"
          ? "El código solo puede contener letras mayúsculas, números, guiones y guiones bajos."
          : "Code may only contain uppercase letters, numbers, hyphens, and underscores."
      );
      return;
    }

    if (formValue <= 0) {
      setModalError(lang === "es" ? "El valor del descuento debe ser mayor a 0." : "Discount value must be greater than 0.");
      return;
    }

    if (formType === "PERCENTAGE" && formValue > 100) {
      setModalError(lang === "es" ? "El porcentaje no puede ser superior al 100%." : "Percentage cannot exceed 100%.");
      return;
    }

    setSaving(true);
    setModalError(null);

    const payload = {
      code: cleanCode,
      description: formDescription.trim() || null,
      discountType: formType,
      discountValue: Number(formValue),
      minOrderCRC: Number(formMinOrder) || 0,
      maxDiscountCRC: formMaxDiscount ? Number(formMaxDiscount) : null,
      maxUses: formMaxUses ? Number(formMaxUses) : null,
      expiresAt: formExpiresAt ? new Date(formExpiresAt).toISOString() : null,
      isActive: Boolean(formIsActive),
    };

    try {
      const url = editingCode ? `/api/sys/discount-codes/${editingCode.id}` : "/api/sys/discount-codes";
      const method = editingCode ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success && data.discountCode) {
        if (editingCode) {
          setCodes((prev) =>
            prev.map((c) => (c.id === editingCode.id ? data.discountCode : c))
          );
        } else {
          setCodes((prev) => [data.discountCode, ...prev]);
        }
        setIsModalOpen(false);
        setFeedbackMsg({
          type: "success",
          text: t.backdoorDiscountsSaveSuccess || "Código de descuento guardado exitosamente.",
        });
        setTimeout(() => setFeedbackMsg(null), 3500);
      } else {
        setModalError(data.error || (lang === "es" ? "Error al procesar el código de descuento." : "Failed to save discount code."));
      }
    } catch (err) {
      console.error("Error saving discount code:", err);
      setModalError(lang === "es" ? "Error de conexión con el servidor." : "Network connection error.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCode = async () => {
    if (!codeToDelete) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/sys/discount-codes/${codeToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCodes((prev) => prev.filter((c) => c.id !== codeToDelete.id));
        setCodeToDelete(null);
        setFeedbackMsg({
          type: "success",
          text: t.backdoorDiscountsDeleteSuccess || "Código de descuento eliminado correctamente.",
        });
        setTimeout(() => setFeedbackMsg(null), 3500);
      } else {
        setFeedbackMsg({
          type: "error",
          text: data.error || (lang === "es" ? "Error al eliminar código" : "Failed to delete discount code"),
        });
      }
    } catch (err) {
      console.error("Error deleting discount code:", err);
      setFeedbackMsg({
        type: "error",
        text: lang === "es" ? "Error de red al eliminar" : "Network error deleting code",
      });
    } finally {
      setDeleting(false);
    }
  };

  // Stats calculation
  const totalCodes = codes.length;
  const activeCodes = useMemo(() => codes.filter((c) => c.isActive).length, [codes]);
  const totalUses = useMemo(() => codes.reduce((acc, c) => acc + (c.timesUsed || 0), 0), [codes]);

  // Master Access Guard
  if (!isMaster) {
    return (
      <div className="bg-white border border-purple-200 rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-black text-slate-900">
          {lang === "es" ? "Acceso Restringido: Solo Perfil Master" : "Restricted Access: Master Profile Only"}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {lang === "es"
            ? "Los códigos de descuento aplican rebajas directas sobre el monto total de las órdenes y solo pueden ser creados, editados o eliminados por la cuenta Master propietaria."
            : "Discount codes apply direct rebates on total order revenue and can only be created, edited, or deleted by the Master owner account."}
        </p>
      </div>
    );
  }

  // Rule 7: Animated Skeleton Loader
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-2xl w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-slate-200 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-900 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                {t.backdoorDiscountsTitle}
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t.backdoorDiscountsSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchCodes}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 transition"
            title="Refrescar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>{t.backdoorDiscountsAddBtn}</span>
          </button>
        </div>
      </div>

      {/* Success / Alert Banner */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition animate-fade-in ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {feedbackMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="ml-auto opacity-70 hover:opacity-100"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {lang === "es" ? "Total de Códigos" : "Total Codes"}
            </div>
            <div className="text-xl font-black text-slate-900 font-mono">
              {totalCodes}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {lang === "es" ? "Cupones Activos" : "Active Coupons"}
            </div>
            <div className="text-xl font-black text-emerald-700 font-mono">
              {activeCodes}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {lang === "es" ? "Canjes Totales" : "Total Redemptions"}
            </div>
            <div className="text-xl font-black text-[#0052CC] font-mono">
              {totalUses}
            </div>
          </div>
        </div>
      </div>

      {/* Codes Grid */}
      {codes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-900 flex items-center justify-center mx-auto">
            <Tag className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">
            {t.backdoorDiscountsEmpty}
          </h3>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-900 text-white text-xs font-bold rounded-xl hover:bg-purple-800 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.backdoorDiscountsAddBtn}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {codes.map((item) => {
            const isPercentage = item.discountType === "PERCENTAGE";
            const isExpired = item.expiresAt ? new Date() > new Date(item.expiresAt) : false;
            const isLimitReached = item.maxUses !== null && item.timesUsed >= item.maxUses;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-3xl border p-5 shadow-xs flex flex-col justify-between gap-4 transition relative overflow-hidden ${
                  !item.isActive || isExpired || isLimitReached
                    ? "border-slate-200 opacity-60 bg-slate-50/50"
                    : "border-purple-200 hover:border-purple-400"
                }`}
              >
                {/* Top Colored Strip */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    !item.isActive
                      ? "bg-slate-300"
                      : isExpired || isLimitReached
                      ? "bg-amber-500"
                      : isPercentage
                      ? "bg-purple-600"
                      : "bg-emerald-600"
                  }`}
                />

                <div className="space-y-3 pt-1">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-base text-slate-900 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-lg tracking-wider">
                          {item.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.code, item.id)}
                          className="p-1 text-slate-400 hover:text-purple-900 transition"
                          title="Copiar código"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {item.description && (
                        <p className="text-xs text-slate-500 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Value Badge */}
                    <div
                      className={`px-2.5 py-1 rounded-xl text-xs font-black font-mono shrink-0 shadow-2xs ${
                        isPercentage
                          ? "bg-purple-100 text-purple-900 border border-purple-300"
                          : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      }`}
                    >
                      {isPercentage ? `${item.discountValue}% OFF` : `₡${formatCRC(item.discountValue)} OFF`}
                    </div>
                  </div>

                  {/* Conditions & Details */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{t.backdoorDiscountsMinOrder}:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {item.minOrderCRC > 0 ? `₡${formatCRC(item.minOrderCRC)}` : (lang === "es" ? "Sin mínimo" : "No minimum")}
                      </span>
                    </div>

                    {isPercentage && item.maxDiscountCRC && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">{lang === "es" ? "Tope máx.:" : "Max cap:"}</span>
                        <span className="font-mono font-bold text-slate-800">
                          ₡{formatCRC(item.maxDiscountCRC)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{t.backdoorDiscountsUsesCount}:</span>
                      <span className="font-mono font-bold text-purple-900">
                        {item.timesUsed} / {item.maxUses !== null ? item.maxUses : "∞"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">{lang === "es" ? "Expiración:" : "Expires:"}</span>
                      <span
                        className={`font-mono text-[10px] font-bold ${
                          isExpired ? "text-red-600" : "text-slate-700"
                        }`}
                      >
                        {item.expiresAt
                          ? new Date(item.expiresAt).toLocaleDateString(lang === "es" ? "es-CR" : "en-US")
                          : (lang === "es" ? "Sin límite" : "No expiry")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(item)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 ${
                      item.isActive
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.isActive ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    <span>{item.isActive ? t.backdoorDiscountsStatusActive : t.backdoorDiscountsStatusInactive}</span>
                  </button>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                      title={t.backdoorDiscountsEditTitle}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCodeToDelete(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-fade-in my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {editingCode ? t.backdoorDiscountsEditTitle : t.backdoorDiscountsCreateTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Error Banner */}
            {modalError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleSaveCode} className="space-y-4">
              {/* Code */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {t.backdoorDiscountsCode} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                  placeholder={t.backdoorDiscountsCodePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold tracking-wider focus:outline-none focus:border-purple-600 uppercase bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {t.backdoorDiscountsDescription}
                </label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder={t.backdoorDiscountsDescriptionPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-600 bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Type and Value */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t.backdoorDiscountsType}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFormType("PERCENTAGE")}
                      className={`py-1.5 text-xs font-bold rounded-lg transition ${
                        formType === "PERCENTAGE"
                          ? "bg-purple-900 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      % Porcentaje
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType("FIXED")}
                      className={`py-1.5 text-xs font-bold rounded-lg transition ${
                        formType === "FIXED"
                          ? "bg-purple-900 text-white shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      ₡ Monto Fijo
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t.backdoorDiscountsValue} {formType === "PERCENTAGE" ? "(%)" : "(₡)"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formType === "PERCENTAGE" ? "100" : undefined}
                    required
                    value={formValue}
                    onChange={(e) => setFormValue(Math.max(1, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:outline-none focus:border-purple-600 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Min Order & Max Discount Cap */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t.backdoorDiscountsMinOrder}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-purple-600 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t.backdoorDiscountsMaxDiscount}
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={formType === "FIXED"}
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(e.target.value)}
                    placeholder={formType === "FIXED" ? (lang === "es" ? "No aplica a monto fijo" : "N/A for fixed") : "Opcional"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-purple-600 bg-slate-50 focus:bg-white disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Max Uses & Expiry */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t.backdoorDiscountsMaxUses}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(e.target.value)}
                    placeholder={lang === "es" ? "Ilimitado" : "Unlimited"}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-purple-600 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t.backdoorDiscountsExpiresAt}
                  </label>
                  <input
                    type="date"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-600 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Active Toggle Switch */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    {lang === "es" ? "Estado del Código de Descuento" : "Coupon Status"}
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {formIsActive
                      ? (lang === "es" ? "El cupón podrá ser utilizado inmediatamente en el checkout." : "Coupon can be redeemed immediately in checkout.")
                      : (lang === "es" ? "El cupón estará pausado y no podrá canjearse." : "Coupon is paused and cannot be redeemed.")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    formIsActive
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                      : "bg-slate-100 text-slate-600 border border-slate-300"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      formIsActive ? "bg-emerald-500" : "bg-slate-400"
                    }`}
                  />
                  <span>{formIsActive ? t.backdoorDiscountsStatusActive : t.backdoorDiscountsStatusInactive}</span>
                </button>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  {t.orderCancelBtn}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{saving ? t.devSaving : editingCode ? "Guardar Cambios" : "Crear Código"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {codeToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-fade-in text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900">
                {t.backdoorDiscountsDeleteConfirm}
              </h3>
              <p className="text-xs text-slate-500">
                Se eliminará permanentemente el código{" "}
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1 rounded">
                  {codeToDelete.code}
                </span>
                . Los clientes ya no podrán utilizar este descuento en el checkout.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCodeToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                {t.orderCancelBtn}
              </button>
              <button
                type="button"
                onClick={handleDeleteCode}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {deleting ? t.devSaving : "Eliminar Código"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
