"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingConcierge } from "@/components/home/FloatingConcierge";
import { DocumentsSkeleton } from "@/components/documents/DocumentsSkeleton";
import { useLanguage } from "@/context/LanguageContext";
import { getWhatsAppUrl, COMPANY_CONFIG } from "@/config/company";
import { LegalDocumentItem, LegalDocumentDetail } from "@/types/document";
import {
  ShieldCheck,
  FileText,
  Clock,
  Car,
  Wrench,
  CheckCircle2,
  Plane,
  ShieldAlert,
  ArrowLeft,
  ChevronRight,
  Scale,
  Lock,
  PhoneCall,
  Zap,
  Search,
  Printer,
  Share2,
  Calendar,
  MapPin,
  AlertTriangle,
  BookOpen,
  Truck,
  ExternalLink,
} from "lucide-react";

function DocumentCenterContent() {
  const { lang, t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [documents, setDocuments] = useState<LegalDocumentItem[]>([]);
  const [activeSlug, setActiveSlug] = useState<string>("terminos-condiciones");
  const [activeDocument, setActiveDocument] = useState<LegalDocumentDetail | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Sync initial slug from URL query (?doc=...)
  useEffect(() => {
    const docQuery = searchParams.get("doc");
    if (docQuery) {
      setActiveSlug(docQuery);
    }
  }, [searchParams]);

  // Fetch all legal documents list
  useEffect(() => {
    let isMounted = true;
    setLoadingList(true);

    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.documents) {
          setDocuments(data.documents);
          const currentParam = searchParams.get("doc");
          if (!currentParam && data.documents.length > 0) {
            setActiveSlug(data.documents[0].slug);
          }
        }
      })
      .catch((err) => {
        console.error("Error al cargar lista de documentos:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingList(false);
      });

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  // Fetch full detail for active slug
  useEffect(() => {
    if (!activeSlug) return;
    let isMounted = true;
    setLoadingDetail(true);

    fetch(`/api/documents/${activeSlug}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.document) {
          setActiveDocument(data.document);
        }
      })
      .catch((err) => {
        console.error("Error al cargar detalle de documento:", err);
      })
      .finally(() => {
        if (isMounted) setLoadingDetail(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeSlug]);

  const handleSelectDocument = (slug: string) => {
    setActiveSlug(slug);
    router.replace(`/documentos?doc=${slug}`, { scroll: false });
  };

  const filteredDocuments = useMemo(() => {
    if (!searchTerm.trim()) return documents;
    const term = searchTerm.toLowerCase();
    return documents.filter(
      (d) =>
        d.titleEs.toLowerCase().includes(term) ||
        (d.titleEn || "").toLowerCase().includes(term) ||
        d.summaryEs.toLowerCase().includes(term) ||
        (d.summaryEn || "").toLowerCase().includes(term) ||
        d.badgeEs.toLowerCase().includes(term) ||
        (d.badgeEn || "").toLowerCase().includes(term)
    );
  }, [documents, searchTerm]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const getDocIcon = (category: string) => {
    switch (category) {
      case "PAYMENTS":
        return <Lock className="w-4 h-4 text-blue-600" />;
      case "WARRANTIES":
        return <ShieldCheck className="w-4 h-4 text-[#C02030]" />;
      case "SAFETY":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case "LOGISTICS":
        return <Truck className="w-4 h-4 text-emerald-600" />;
      case "TUNING":
        return <Zap className="w-4 h-4 text-purple-600" />;
      default:
        return <Scale className="w-4 h-4 text-gray-700" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1D] flex flex-col justify-between selection:bg-[#C02030] selection:text-white">
      <NotificationBanner />
      <Navbar />
      <CartDrawer />
      <FloatingConcierge />

      <main className="flex-1 w-full px-4 sm:px-6 md:px-8 lg:px-12 pt-24 pb-20">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/" className="hover:text-black flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === "es" ? "Inicio" : "Home"}</span>
            </Link>
            <span>/</span>
            <span className="font-semibold text-gray-900">{t.docsNavTitle}</span>
          </div>

          {loadingList ? (
            <DocumentsSkeleton />
          ) : (
            <div className="space-y-8 animate-fade-in">
              {/* Header Title Banner */}
              <div className="space-y-3 pb-6 border-b border-gray-200 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2 max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C02030]/10 text-[#C02030] text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{t.docsOfficialPortalTitle}</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#111827]">
                    {t.docsPageTitle}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    {t.docsPageSubtitle}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{copyFeedback ? t.docsShareCopied : t.docsShareBtn}</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{t.docsPrintBtn}</span>
                  </button>
                </div>
              </div>

              {/* Warranty Quick Highlights Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#C02030]/10 text-[#C02030] flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs mb-0.5">{t.docsWarranty60DaysTitle}</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      {t.docsWarranty60DaysDesc}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#C02030]/10 text-[#C02030] flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs mb-0.5">{t.docsWarranty90DaysTitle}</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      {t.docsWarranty90DaysDesc}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#C02030]/10 text-[#C02030] flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs mb-0.5">{t.docsWarrantyEcuTitle}</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      {t.docsWarrantyEcuDesc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Content Layout: Sidebar + Document Reader */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Document Directory Sidebar */}
                <div className="lg:col-span-4 space-y-4">
                  {/* Search box */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t.docsSearchPlaceholder}
                      className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C02030]/20 focus:border-[#C02030] transition-all"
                    />
                  </div>

                  {/* Documents List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <span>{t.docsIndexTitle} ({filteredDocuments.length})</span>
                      <span>{t.docsIndexTitle}</span>
                    </div>

                    {filteredDocuments.map((doc) => {
                      const isActive = doc.slug === activeSlug;
                      const badgeText = lang === "en" && (doc as any).badgeEn ? (doc as any).badgeEn : doc.badgeEs;
                      const titleText = lang === "en" && (doc as any).titleEn ? (doc as any).titleEn : doc.titleEs;
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => handleSelectDocument(doc.slug)}
                          className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                            isActive
                              ? "bg-gray-900 border-gray-900 text-white shadow-md shadow-black/10"
                              : "bg-white border-gray-200 text-gray-800 hover:border-gray-300 hover:bg-gray-50/80"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isActive ? "bg-white/10 text-white" : "bg-gray-100"
                            }`}
                          >
                            {getDocIcon(doc.category)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider truncate ${
                                  isActive ? "text-red-400" : "text-[#C02030]"
                                }`}
                              >
                                {badgeText}
                              </span>
                              <span
                                className={`text-[10px] font-mono ${
                                  isActive ? "text-gray-400" : "text-gray-400"
                                }`}
                              >
                                0{doc.order}
                              </span>
                            </div>
                            <h3
                              className={`text-xs font-bold leading-tight line-clamp-2 ${
                                isActive ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {titleText}
                            </h3>
                          </div>
                        </button>
                      );
                    })}

                    {filteredDocuments.length === 0 && (
                      <div className="p-6 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-2xl">
                        {t.docsNoResults}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Document Reading Panel */}
                <div className="lg:col-span-8 bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
                  {loadingDetail ? (
                    <div className="space-y-6 animate-pulse py-6">
                      <div className="h-6 w-48 bg-gray-200 rounded-full" />
                      <div className="h-10 w-3/4 bg-gray-200 rounded-2xl" />
                      <div className="h-4 w-full bg-gray-100 rounded-lg" />
                      <div className="h-32 w-full bg-gray-50 rounded-2xl" />
                      <div className="space-y-3 pt-6">
                        <div className="h-5 w-40 bg-gray-200 rounded-lg" />
                        <div className="h-4 w-full bg-gray-100 rounded-md" />
                        <div className="h-4 w-5/6 bg-gray-100 rounded-md" />
                      </div>
                    </div>
                  ) : activeDocument ? (
                    <article className="space-y-8">
                      {/* Document Meta Header */}
                      <div className="space-y-3 pb-6 border-b border-gray-100">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-[#C02030]/10 text-[#C02030] text-xs font-bold uppercase tracking-wider">
                            {lang === "en" && (activeDocument as any).badgeEn ? (activeDocument as any).badgeEn : activeDocument.badgeEs}
                          </span>
                          <span className="text-xs font-mono font-bold text-gray-400">
                            {t.docsDocumentOfficialPrefix}{activeDocument.order}
                          </span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug">
                          {lang === "en" && (activeDocument as any).titleEn ? (activeDocument as any).titleEn : activeDocument.titleEs}
                        </h2>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{t.docsActiveLabel} {activeDocument.lastUpdated}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{t.docsJurisdictionLabel} {activeDocument.jurisdiction}</span>
                          </span>
                        </div>
                      </div>

                      {/* Executive Summary Card */}
                      {activeDocument.summaryEs && (
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs text-slate-700 leading-relaxed space-y-1.5">
                          <strong className="block text-slate-900 font-bold uppercase tracking-wider text-[10px]">
                            {t.docsExecutiveSummary}
                          </strong>
                          <p>{lang === "en" && (activeDocument as any).summaryEn ? (activeDocument as any).summaryEn : activeDocument.summaryEs}</p>
                        </div>
                      )}

                      {/* Applicable Laws Pills */}
                      {activeDocument.applicableLaws && activeDocument.applicableLaws.length > 0 && (
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                            {t.docsLegalFramework}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {activeDocument.applicableLaws.map((law, index) => (
                              <span
                                key={index}
                                className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-800 text-[11px] font-semibold"
                              >
                                {law}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Formatted Text Content */}
                      <div className="prose prose-sm max-w-none text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line space-y-4">
                        {lang === "en" && (activeDocument as any).contentEn ? (activeDocument as any).contentEn : activeDocument.contentEs}
                      </div>

                      {/* Bottom Certification Stamp */}
                      <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-gray-400">
                        <div>
                          <p className="font-bold text-gray-700">
                            ZxZ Mods
                          </p>
                          <p>
                            {lang === "en" ? "Corporate Legal ID:" : "Cédula Jurídica:"}{" "}
                            <span className="font-mono font-semibold text-gray-600">
                              {(activeDocument as any).cedulaJuridica || "3-101-436132"}
                            </span>{" "}
                            <span className="text-[10px] text-gray-400">({(activeDocument as any).legalName || COMPANY_CONFIG.legalName})</span>{" "}
                            • San José, Costa Rica
                          </p>
                        </div>
                        <button
                          onClick={handlePrint}
                          className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{t.docsPrintBtn}</span>
                        </button>
                      </div>
                    </article>
                  ) : null}
                </div>
              </div>

              {/* Bottom Support Callout */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#111827] text-white flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1.5 max-w-xl">
                  <h4 className="font-bold text-base sm:text-lg">
                    {lang === "es"
                      ? "¿Tienes consultas técnicas o dudas sobre alguna de nuestras pólizas?"
                      : "Have technical questions or inquiries about any of our policies?"}
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {lang === "es"
                      ? "Nuestro equipo técnico y de atención al cliente está a tu disposición en Santa Ana, San José, o vía WhatsApp directo."
                      : "Our technical and customer support team is available in Santa Ana, San José, or via direct WhatsApp."}
                  </p>
                </div>
                <a
                  href={getWhatsAppUrl("Hola ZxZ Mods, tengo una consulta sobre los documentos legales y garantías")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 rounded-xl bg-[#C02030] hover:bg-[#A01B28] text-white text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap shadow-lg flex items-center gap-2 flex-shrink-0"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{t.docsContactAdvisor}</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DocumentCenterPage() {
  return (
    <Suspense fallback={<DocumentsSkeleton />}>
      <DocumentCenterContent />
    </Suspense>
  );
}
