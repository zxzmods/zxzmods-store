"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Calendar,
  MapPin,
  Printer,
  Scale,
  ExternalLink,
  Lock,
  Mail,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Share2,
  ArrowLeft,
} from "lucide-react";
import { COMPANY_CONFIG, getWhatsAppUrl } from "@/config/company";

export interface LegalDocPayload {
  slug: string;
  order: number;
  category: string;
  titleEs: string;
  titleEn: string;
  badgeEs: string;
  badgeEn: string;
  summaryEs: string;
  summaryEn: string;
  contentEs: string;
  contentEn: string;
  jurisdiction: string;
  lastUpdated: string;
  applicableLaws: string[];
  cedulaJuridica?: string;
  legalName?: string;
}

interface PublicLegalDocViewProps {
  document: LegalDocPayload;
  defaultLang?: "es" | "en";
  isPrivacyPolicy?: boolean;
}

export function PublicLegalDocView({
  document: doc,
  defaultLang = "es",
  isPrivacyPolicy = false,
}: PublicLegalDocViewProps) {
  const [lang, setLang] = useState<"es" | "en">(defaultLang);
  const [copied, setCopied] = useState(false);

  const activeTitle = lang === "en" && doc.titleEn ? doc.titleEn : doc.titleEs;
  const activeBadge = lang === "en" && doc.badgeEn ? doc.badgeEn : doc.badgeEs;
  const activeSummary = lang === "en" && doc.summaryEn ? doc.summaryEn : doc.summaryEs;
  const activeContent = lang === "en" && doc.contentEn ? doc.contentEn : doc.contentEs;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-gray-900 flex flex-col justify-between selection:bg-[#C02030] selection:text-white">
      {/* Top Header / Breadcrumb Bar */}
      <header className="border-b border-gray-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === "es" ? "Volver a ZxZ Mods" : "Back to ZxZ Mods"}</span>
            </Link>
            <span className="text-gray-300">/</span>
            <Link
              href="/documentos"
              className="text-xs font-medium text-gray-500 hover:text-[#C02030] transition-colors"
            >
              {lang === "es" ? "Centro Legal & Pólizas" : "Legal & Policies Center"}
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center bg-gray-100 rounded-full p-0.5 border border-gray-200">
              <button
                type="button"
                onClick={() => setLang("es")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all ${
                  lang === "es"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                aria-label="Ver en Español"
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all ${
                  lang === "en"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                aria-label="View in English"
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition"
              title={lang === "es" ? "Imprimir documento" : "Print document"}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{lang === "es" ? "Imprimir" : "Print"}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-semibold text-gray-700 transition"
              title={lang === "es" ? "Copiar enlace permanente" : "Copy permanent link"}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? (lang === "es" ? "¡Copiado!" : "Copied!") : lang === "es" ? "Compartir" : "Share"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Document Body */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full flex-1">
        <article className="bg-white border border-gray-200/90 rounded-3xl p-6 sm:p-12 shadow-sm space-y-8">
          {/* Document Header & Identity Badges */}
          <div className="space-y-4 pb-6 border-b border-gray-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 rounded-full bg-[#C02030]/10 text-[#C02030] text-xs font-extrabold uppercase tracking-wider">
                {activeBadge}
              </span>
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-mono font-bold">
                {lang === "es" ? "Documento Oficial N°" : "Official Document #"} 0{doc.order}
              </span>
              {isPrivacyPolicy && (
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Google OAuth 2.0 Compliant</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-gray-950 tracking-tight leading-tight">
              {activeTitle}
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-gray-500 pt-1">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>
                  {lang === "es" ? "Vigente desde:" : "Effective date:"}{" "}
                  <strong className="text-gray-800">{doc.lastUpdated}</strong>
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>
                  {lang === "es" ? "Jurisdicción:" : "Jurisdiction:"}{" "}
                  <strong className="text-gray-800">{doc.jurisdiction}</strong>
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-gray-400" />
                <span>
                  {lang === "es" ? "Entidad Legal:" : "Legal Entity:"}{" "}
                  <strong className="text-gray-800">{doc.legalName || COMPANY_CONFIG.legalName}</strong>
                </span>
              </span>
            </div>
          </div>

          {/* Special Google OAuth Verification Notice (Only on Privacy Policy) */}
          {isPrivacyPolicy && (
            <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  G
                </div>
                <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wide">
                  {lang === "es"
                    ? "Compromiso de Privacidad para Usuarios de Google (Google API Services User Data Policy)"
                    : "Google User Privacy Commitment (Google API Services User Data Policy)"}
                </h2>
              </div>
              <p className="leading-relaxed">
                {lang === "es" ? (
                  <>
                    <strong>ZxZ Mods</strong> utiliza las APIs de Google exclusivamente para proveer inicio de sesión seguro (Google Sign-In). El uso y la transferencia a cualquier otra aplicación por parte de ZxZ Mods de la información recibida a través de las APIs de Google se apega estrictamente a la{" "}
                    <a
                      href="https://developers.google.com/terms/api-services-user-data-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-0.5"
                    >
                      Política de Datos de Usuario de los Servicios de API de Google (Limited Use)
                      <ExternalLink className="w-3 h-3 inline" />
                    </a>
                    .
                  </>
                ) : (
                  <>
                    <strong>ZxZ Mods</strong> uses Google APIs exclusively for secure authentication (Google Sign-In). ZxZ Mods&apos; use and transfer to any other app of information received from Google APIs will adhere to the{" "}
                    <a
                      href="https://developers.google.com/terms/api-services-user-data-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-0.5"
                    >
                      Google API Services User Data Policy, including the Limited Use requirements
                      <ExternalLink className="w-3 h-3 inline" />
                    </a>
                    .
                  </>
                )}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100 font-medium">
                  <span className="block font-bold text-blue-900 mb-0.5">
                    {lang === "es" ? "✓ Cero Venta de Datos" : "✓ No Data Selling"}
                  </span>
                  <span>{lang === "es" ? "Nunca vendemos ni alquilamos tus datos a terceros." : "We never sell or rent your data to third parties."}</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100 font-medium">
                  <span className="block font-bold text-blue-900 mb-0.5">
                    {lang === "es" ? "✓ Cero Publicidad Dirigida" : "✓ No Targeted Ads"}
                  </span>
                  <span>{lang === "es" ? "Tus datos no se usan para anuncios ni rastreo." : "Your data is never used for ads or external profiling."}</span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100 font-medium">
                  <span className="block font-bold text-blue-900 mb-0.5">
                    {lang === "es" ? "✓ Cero Entrenamiento IA" : "✓ No AI Model Training"}
                  </span>
                  <span>{lang === "es" ? "No se usan datos para entrenar modelos de IA." : "Google user data is not used to train AI models."}</span>
                </div>
              </div>
            </div>
          )}

          {/* Executive Summary Card */}
          {activeSummary && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed space-y-1.5">
              <strong className="block text-slate-900 font-bold uppercase tracking-wider text-[11px]">
                {lang === "es" ? "Resumen Ejecutivo de la Póliza" : "Executive Policy Summary"}
              </strong>
              <p>{activeSummary}</p>
            </div>
          )}

          {/* Applicable Legal Framework Pills */}
          {doc.applicableLaws && doc.applicableLaws.length > 0 && (
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                {lang === "es" ? "Marco Jurídico y Estándares Aplicables" : "Applicable Legal Framework & Standards"}
              </span>
              <div className="flex flex-wrap gap-2">
                {doc.applicableLaws.map((law, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-800 text-[11px] font-semibold flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                    <span>{law}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Formatted Legal Text Content */}
          <div className="prose prose-sm sm:prose-base max-w-none text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-line space-y-4">
            {activeContent}
          </div>

          {/* Data Deletion & Revocation Action Card (For Google Verification Compliance) */}
          {isPrivacyPolicy && (
            <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                {lang === "es"
                  ? "Gestión de Acceso y Solicitud de Eliminación de Datos"
                  : "Access Management and Data Deletion Requests"}
              </h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                {lang === "es"
                  ? "Cualquier usuario de ZxZ Mods tiene el derecho absoluto e irrestricto de revocar los permisos otorgados a través de su cuenta de Google o de solicitar la eliminación total y definitiva de todos sus datos personales de nuestros servidores."
                  : "Any ZxZ Mods user has the unrestricted right to revoke permissions granted via their Google Account or to request the complete and permanent deletion of all personal data from our servers."}
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-300 hover:border-gray-400 text-gray-800 text-xs font-bold transition shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5 text-gray-600" />
                  <span>{lang === "es" ? "Revocar Acceso en Google" : "Revoke Access on Google"}</span>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </a>
                <a
                  href="mailto:ventas@zxzmods.com?subject=Solicitud%20de%20Eliminaci%C3%B3n%20de%20Datos%20-%20ZxZ%20Mods"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C02030] hover:bg-[#A01B28] text-white text-xs font-bold transition shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{lang === "es" ? "Solicitar Eliminación de Datos" : "Request Data Deletion"}</span>
                </a>
              </div>
            </div>
          )}

          {/* Official Entity Certification Stamp */}
          <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-gray-500">
            <div>
              <p className="font-bold text-gray-900 text-sm">{COMPANY_CONFIG.name}</p>
              <p className="mt-0.5">
                {lang === "es" ? "Razón Social Oficial:" : "Official Corporate Entity:"}{" "}
                <span className="font-semibold text-gray-800">
                  {doc.legalName || COMPANY_CONFIG.legalName}
                </span>{" "}
                • {lang === "es" ? "Cédula Jurídica:" : "Tax ID:"}{" "}
                <span className="font-mono font-bold text-gray-900">
                  {doc.cedulaJuridica || "3-101-436132"}
                </span>
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {COMPANY_CONFIG.location.address} • San José, Costa Rica (C.P. 10903)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`mailto:${COMPANY_CONFIG.contact.email}`}
                className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-gray-500" />
                <span>{COMPANY_CONFIG.contact.email}</span>
              </a>
              <a
                href={getWhatsAppUrl("Hola ZxZ Mods, tengo una consulta sobre sus pólizas y términos legales")}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Soporte</span>
              </a>
            </div>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 px-4 text-center text-xs text-gray-500">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex flex-wrap justify-center gap-6 font-semibold text-gray-700">
            <Link href="/" className="hover:text-black">
              {lang === "es" ? "Inicio" : "Home"}
            </Link>
            <Link href="/privacidad" className="hover:text-[#C02030] text-black">
              {lang === "es" ? "Política de Privacidad" : "Privacy Policy"}
            </Link>
            <Link href="/terminos" className="hover:text-[#C02030]">
              {lang === "es" ? "Términos y Condiciones" : "Terms & Conditions"}
            </Link>
            <Link href="/documentos" className="hover:text-[#C02030]">
              {lang === "es" ? "Todas las Pólizas" : "All Policies"}
            </Link>
          </div>
          <p>© {new Date().getFullYear()} {COMPANY_CONFIG.name}. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
