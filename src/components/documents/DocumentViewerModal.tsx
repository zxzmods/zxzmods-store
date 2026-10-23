"use client";

import React, { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  ShieldCheck,
  Scale,
  ExternalLink,
  Printer,
  Calendar,
  MapPin,
  AlertTriangle,
  Lock,
  Wrench,
  Truck,
  Zap,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LegalDocumentDetail } from "@/types/document";

interface DocumentViewerModalProps {
  slug: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewerModal({ slug, isOpen, onClose }: DocumentViewerModalProps) {
  const { lang, t } = useLanguage();
  const [doc, setDoc] = useState<LegalDocumentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !slug) {
      setDoc(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/documents/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar el documento.");
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.document) {
          setDoc(data.document);
        } else {
          setError(data.error || "Documento no disponible");
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Error al conectar con el servidor.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, slug]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getDocIcon = (category?: string) => {
    switch (category) {
      case "PAYMENTS":
        return <Lock className="w-5 h-5 text-blue-600" />;
      case "WARRANTIES":
        return <ShieldCheck className="w-5 h-5 text-[#C02030]" />;
      case "SAFETY":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "LOGISTICS":
        return <Truck className="w-5 h-5 text-emerald-600" />;
      case "TUNING":
        return <Zap className="w-5 h-5 text-purple-600" />;
      default:
        return <Scale className="w-5 h-5 text-gray-700" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 selection:bg-[#C02030] selection:text-white">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                {getDocIcon(doc?.category)}
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#C02030] bg-[#C02030]/10 px-2 py-0.5 rounded-full inline-block">
                  {(lang === "en" && (doc as any)?.badgeEn) ? (doc as any).badgeEn : (doc?.badgeEs || "ZxZ Mods Legal")}
                </span>
                <h3 className="font-bold text-gray-900 text-base leading-snug">
                  {(lang === "en" && (doc as any)?.titleEn) ? (doc as any).titleEn : (doc?.titleEs || (loading ? t.docsLoading : t.docsDefaultTitle))}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {doc && (
                <button
                  type="button"
                  onClick={handlePrint}
                  title={t.docsPrintBtn}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-sm text-gray-700 leading-relaxed">
            {loading ? (
              <div className="space-y-4 animate-pulse py-4">
                <div className="h-4 w-3/4 bg-gray-200 rounded-lg" />
                <div className="h-4 w-full bg-gray-100 rounded-lg" />
                <div className="h-4 w-5/6 bg-gray-100 rounded-lg" />
                <div className="h-28 w-full bg-gray-100 rounded-2xl mt-4" />
                <div className="h-4 w-2/3 bg-gray-200 rounded-lg mt-6" />
                <div className="h-4 w-full bg-gray-100 rounded-lg" />
                <div className="h-4 w-4/5 bg-gray-100 rounded-lg" />
              </div>
            ) : error ? (
              <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-center space-y-3">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
                <p className="font-bold">{error}</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold uppercase tracking-wider"
                >
                  {t.docsCloseModal}
                </button>
              </div>
            ) : doc ? (
              <div className="space-y-6">
                {/* Meta info bar */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 pb-4 border-b border-gray-100">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{t.docsLastUpdated} {doc.lastUpdated}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{t.docsJurisdictionLabel} {doc.jurisdiction}</span>
                  </span>
                </div>

                {/* Summary banner */}
                {(doc.summaryEs || (doc as any).summaryEn) && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-medium">
                    <strong className="block text-slate-900 mb-1 uppercase tracking-wide text-[10px]">
                      {t.docsExecutiveSummary}:
                    </strong>
                    {(lang === "en" && (doc as any).summaryEn) ? (doc as any).summaryEn : doc.summaryEs}
                  </div>
                )}

                {/* Applicable laws pills */}
                {doc.applicableLaws && doc.applicableLaws.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      {t.docsLegalFramework}:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {doc.applicableLaws.map((law, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-[11px] font-medium"
                        >
                          {law}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Document formatted content */}
                <div className="space-y-4 pt-2 text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {(lang === "en" && (doc as any).contentEn) ? (doc as any).contentEn : doc.contentEs}
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
            <span className="text-[11px] text-gray-400">
              ZxZ Mods Costa Rica S.A. • Documento Oficial Registrado
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Entendido y Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
