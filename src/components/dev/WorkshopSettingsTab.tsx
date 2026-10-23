"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  GLOBAL_MASTER_PHONE,
  GLOBAL_MASTER_WHATSAPP,
  GLOBAL_LEGAL_NAME,
  GLOBAL_CEDULA_JURIDICA,
  formatWhatsappDigits,
  setGlobalMasterPhone,
} from "@/config/company";
import {
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Building,
  ExternalLink,
  FileText,
  ShieldCheck,
  Mail,
  Send,
} from "lucide-react";

interface WorkshopData {
  id: string;
  name: string;
  legalName?: string;
  cedulaJuridica?: string;
  taglineEs: string;
  taglineEn: string;
  addressEs: string;
  addressEn: string;
  province: string;
  phone: string;
  whatsapp: string;
  googleMapsEmbedUrl: string;
  googleMapsLink: string;
  hoursJson: string;
  latitude: number;
  longitude: number;
}

export function WorkshopSettingsTab() {
  const { t, lang } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form Fields
  const [phone, setPhone] = useState(GLOBAL_MASTER_PHONE);
  const [whatsapp, setWhatsapp] = useState(GLOBAL_MASTER_WHATSAPP);
  const [legalName, setLegalName] = useState(GLOBAL_LEGAL_NAME);
  const [cedulaJuridica, setCedulaJuridica] = useState(GLOBAL_CEDULA_JURIDICA);
  const [hoursText, setHoursText] = useState("8:00 AM - 8:00 PM");
  const [addressEs, setAddressEs] = useState("");
  const [addressEn, setAddressEn] = useState("");
  const [googleMapsLink, setGoogleMapsLink] = useState("");

  // Email Diagnostics State
  const [emailDiag, setEmailDiag] = useState<any>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [testEmailTarget, setTestEmailTarget] = useState("santi2106sandoval@gmail.com");
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ success: boolean; message: string; previewUrl?: string } | null>(null);

  const fetchEmailDiagnostics = useCallback(async () => {
    setCheckingEmail(true);
    try {
      const res = await fetch("/api/sys/email/diagnostics");
      const json = await res.json();
      if (res.ok) {
        setEmailDiag(json);
      }
    } catch (err) {
      console.error("Failed to check email diagnostics:", err);
    } finally {
      setCheckingEmail(false);
    }
  }, []);

  const handleSendTestEmail = async (testType: "TEST" | "REJECTION" = "TEST") => {
    if (!testEmailTarget) return;
    setSendingTestEmail(true);
    setTestEmailResult(null);
    try {
      const res = await fetch("/api/sys/email/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testEmailTarget.trim(), testType }),
      });
      const json = await res.json();
      setTestEmailResult({
        success: Boolean(json.success),
        message: json.message || json.error,
        previewUrl: json.previewUrl,
      });
      fetchEmailDiagnostics();
    } catch (err: any) {
      setTestEmailResult({
        success: false,
        message: err.message || "Error al enviar correo de prueba",
      });
    } finally {
      setSendingTestEmail(false);
    }
  };

  const fetchWorkshop = useCallback(async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/sys/workshop");
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        const data: WorkshopData = json.data;
        const dbPhone = data.phone || GLOBAL_MASTER_PHONE;
        const dbWhatsapp = data.whatsapp || `+${formatWhatsappDigits(dbPhone)}`;
        const dbLegalName = data.legalName || GLOBAL_LEGAL_NAME;
        const dbCedulaJuridica = data.cedulaJuridica !== undefined && data.cedulaJuridica !== null ? data.cedulaJuridica : GLOBAL_CEDULA_JURIDICA;
        setPhone(dbPhone);
        setWhatsapp(dbWhatsapp);
        setLegalName(dbLegalName);
        setCedulaJuridica(dbCedulaJuridica);
        setAddressEs(data.addressEs || "");
        setAddressEn(data.addressEn || "");
        setGoogleMapsLink(data.googleMapsLink || "");
        setGlobalMasterPhone(dbPhone, dbWhatsapp, data.addressEs, data.addressEn, dbLegalName, dbCedulaJuridica);

        try {
          const parsedHours = JSON.parse(data.hoursJson || "{}");
          setHoursText(parsedHours.es || parsedHours.en || "8:00 AM - 8:00 PM");
        } catch {
          setHoursText("8:00 AM - 8:00 PM");
        }
      }
    } catch (err) {
      console.error("Failed to fetch workshop settings:", err);
      setStatusMsg({ type: "error", text: t.backdoorWorkshopError });
    } finally {
      setLoading(false);
    }
  }, [t.backdoorWorkshopError]);

  useEffect(() => {
    fetchWorkshop();
    fetchEmailDiagnostics();
  }, [fetchWorkshop, fetchEmailDiagnostics]);

  const handlePhoneChange = (newPhone: string) => {
    setPhone(newPhone);
    // Automatically synchronize WhatsApp number to the global phone variable set by Master
    setWhatsapp(`+${formatWhatsappDigits(newPhone)}`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    const syncedWhatsapp = `+${formatWhatsappDigits(phone.trim())}`;

    try {
      const res = await fetch("/api/sys/workshop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          whatsapp: syncedWhatsapp,
          legalName: legalName.trim(),
          cedulaJuridica: cedulaJuridica.trim(),
          hoursText: hoursText.trim(),
          addressEs: addressEs.trim(),
          addressEn: addressEn.trim(),
          googleMapsLink: googleMapsLink.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setWhatsapp(syncedWhatsapp);
        setGlobalMasterPhone(
          phone.trim(),
          syncedWhatsapp,
          addressEs.trim(),
          addressEn.trim(),
          legalName.trim(),
          cedulaJuridica.trim()
        );
        setStatusMsg({ type: "success", text: t.backdoorSaveContactSuccess });
      } else {
        setStatusMsg({ type: "error", text: json.error || t.backdoorWorkshopError });
      }
    } catch (err) {
      console.error("Failed to update workshop:", err);
      setStatusMsg({ type: "error", text: t.backdoorWorkshopError });
    } finally {
      setSaving(false);
    }
  };

  // Rule 7: Animated Skeleton Loader during initial data fetch
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 animate-pulse">
          <div className="h-6 w-72 bg-slate-200 rounded" />
          <div className="h-4 w-96 bg-slate-200/80 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-2">
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-100 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-100 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-100 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-100 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-100 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-100 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-100 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-40 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-100 rounded-lg" />
            </div>
          </div>
          <div className="h-12 w-48 bg-slate-200 rounded-lg mt-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {t.backdoorWorkshopTitle}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.backdoorWorkshopSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchWorkshop}
            disabled={loading || saving}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Actualizar</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {statusMsg && (
          <div
            className={`mt-4 p-3.5 rounded-lg border flex items-center gap-2.5 text-xs font-medium ${
              statusMsg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Edit Form */}
        <form onSubmit={handleSave} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Legal Entity Name / Razón Social */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Building className="w-4 h-4 text-slate-700" />
                  <span>{t.backdoorLegalNameLabel}</span>
                </label>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  GLOBAL_LEGAL_NAME
                </span>
              </div>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder={t.backdoorLegalNamePlaceholder}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {t.backdoorLegalNameHelp}
              </p>
            </div>

            {/* Cédula Jurídica / Tax ID */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>{t.backdoorCedulaJuridicaLabel}</span>
                </label>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  GLOBAL_CEDULA_JURIDICA
                </span>
              </div>
              <input
                type="text"
                value={cedulaJuridica}
                onChange={(e) => setCedulaJuridica(e.target.value)}
                placeholder={t.backdoorCedulaJuridicaPlaceholder}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {t.backdoorCedulaJuridicaHelp}
              </p>
            </div>

            {/* Main Global Phone Variable (Primary Request) */}
            <div className="p-4 rounded-xl border-2 border-red-200 bg-red-50/30 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Phone className="w-4 h-4 text-red-600" />
                  <span>{t.backdoorPhoneLabel}</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                  GLOBAL_MASTER_PHONE
                </span>
              </div>
              <input
                type="text"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder={t.backdoorPhonePlaceholder}
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {t.backdoorPhoneHelp}
              </p>
            </div>

            {/* Official WhatsApp (Synchronized with Global Phone) */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>{t.backdoorWhatsappLabel}</span>
                </label>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {lang === "es" ? "Sincronizado con Teléfono Global" : "Synced with Global Phone"}
                </span>
              </div>
              <input
                type="text"
                value={whatsapp}
                readOnly
                className="w-full px-3.5 py-2.5 rounded-lg border border-emerald-200 bg-white/80 text-sm text-emerald-950 font-mono font-medium cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {lang === "es"
                  ? "Sincronizado automáticamente con la variable global de teléfono definida por Master para todos los enlaces wa.me y documentos de la tienda."
                  : "Automatically synchronized with the global phone variable set by Master across all wa.me links and store documents."}
              </p>
            </div>

            {/* Horario de Atención */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>{t.backdoorHoursLabel}</span>
              </label>
              <input
                type="text"
                value={hoursText}
                onChange={(e) => setHoursText(e.target.value)}
                placeholder="8:00 AM - 8:00 PM"
                required
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {t.backdoorHoursHelp}
              </p>
            </div>

            {/* Google Maps Link */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Enlace Google Maps / Navegación</span>
              </label>
              <input
                type="text"
                value={googleMapsLink}
                onChange={(e) => setGoogleMapsLink(e.target.value)}
                placeholder="https://maps.app.goo.gl/CT6yAuDJ7m1sCP5g6"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                URL de destino al presionar el botón de Google Maps.
              </p>
            </div>

            {/* Address Spanish */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <MapPin className="w-4 h-4 text-slate-700" />
                <span>{t.backdoorAddressLabel}</span>
              </label>
              <textarea
                rows={2}
                value={addressEs}
                onChange={(e) => setAddressEs(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
              />
            </div>

            {/* Address English */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <MapPin className="w-4 h-4 text-slate-700" />
                <span>{t.backdoorAddressEnLabel}</span>
              </label>
              <textarea
                rows={2}
                value={addressEn}
                onChange={(e) => setAddressEn(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition disabled:opacity-60"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t.backdoorSavingWorkshop}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t.backdoorSaveWorkshopBtn}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {t.backdoorWorkshopPreview}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            /ubicacion & Home Section
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Phone Card Preview */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Phone className="w-4 h-4 text-[#C02030]" />
              <span>Teléfono de Llamada</span>
            </div>
            <p className="font-mono text-sm font-bold text-slate-900">
              {phone || GLOBAL_MASTER_PHONE}
            </p>
            <p className="text-[10px] text-slate-400">
              Enlace directo: tel:{phone.replace(/[^0-9+]/g, "")}
            </p>
          </div>

          {/* WhatsApp Card Preview */}
          <div className="p-4 rounded-xl border border-slate-200 bg-emerald-50/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Directo</span>
            </div>
            <p className="font-mono text-sm font-bold text-emerald-950">
              {whatsapp || GLOBAL_MASTER_WHATSAPP}
            </p>
            <p className="text-[10px] text-emerald-600/70">
              Enlace directo: wa.me/{whatsapp.replace(/[^0-9]/g, "")}
            </p>
          </div>

          {/* Legal Entity Preview */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>{lang === "es" ? "Razón Social & Cédula" : "Legal Entity & Tax ID"}</span>
            </div>
            <p className="text-sm font-bold text-slate-900 truncate">
              {legalName || GLOBAL_LEGAL_NAME}
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              {cedulaJuridica ? `Cédula: ${cedulaJuridica}` : (lang === "es" ? "Sin cédula configurada" : "No Tax ID set")}
            </p>
          </div>

          {/* Hours Card Preview */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Clock className="w-4 h-4 text-slate-600" />
              <span>{t.workshopHoursLabel}</span>
            </div>
            <p className="text-sm font-bold text-slate-900">
              {hoursText || "8:00 AM - 8:00 PM"}
            </p>
            <p className="text-[10px] text-slate-400">
              Lunes a Domingo
            </p>
          </div>
        </div>
      </div>

      {/* Outbound Email Diagnostics & Testing Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {lang === "es" ? "Diagnóstico y Prueba de Correo Saliente (SMTP)" : "Outbound Email Diagnostics & Testing (SMTP)"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {lang === "es"
                  ? "Verificación en tiempo real del remitente oficial ventas@zxzmods.com y despacho de comprobantes."
                  : "Live verification of official sender ventas@zxzmods.com and notification dispatches."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchEmailDiagnostics}
            disabled={checkingEmail}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingEmail ? "animate-spin" : ""}`} />
            <span>{checkingEmail ? (lang === "es" ? "Verificando..." : "Checking...") : (lang === "es" ? "Comprobar Conexión" : "Check Connection")}</span>
          </button>
        </div>

        {/* Live Status Banner */}
        {emailDiag && (
          <div>
            {emailDiag.status === "CONNECTED" ? (
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-start gap-3 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold">{lang === "es" ? "Servidor SMTP Conectado y Autenticado" : "SMTP Server Connected & Authenticated"}</div>
                  <p className="text-emerald-700 text-[11px]">
                    {lang === "es"
                      ? `Remitente ventas@zxzmods.com listo para enviar comprobantes y notificaciones a través de ${emailDiag.host}:${emailDiag.port}.`
                      : `Sender ventas@zxzmods.com ready to dispatch receipts and step notifications via ${emailDiag.host}:${emailDiag.port}.`}
                  </p>
                </div>
              </div>
            ) : emailDiag.requiresAppPassword ? (
              <div className="p-4 rounded-xl border-2 border-rose-200 bg-rose-50/70 space-y-3 text-xs text-rose-950">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-sm font-extrabold text-rose-900">
                      {lang === "es"
                        ? "Google Workspace Requiere una Contraseña de Aplicación (App Password)"
                        : "Google Workspace Requires an Application-Specific Password"}
                    </strong>
                    <p className="text-rose-800 text-xs mt-1 leading-relaxed">
                      {lang === "es"
                        ? "Google bloqueó la conexión porque la cuenta ventas@zxzmods.com tiene verificación de 2 pasos activa. No acepta la contraseña normal de inicio de sesión para SMTP."
                        : "Google blocked the connection because ventas@zxzmods.com has 2-Step Verification enabled. Google requires a 16-character App Password instead of your regular password."}
                    </p>
                  </div>
                </div>

                <div className="bg-white/90 border border-rose-200 rounded-lg p-3 text-xs text-rose-900 space-y-1.5">
                  <div className="font-bold uppercase tracking-wide text-[10px] text-rose-700">
                    {lang === "es" ? "Pasos para habilitar el envío en 1 minuto:" : "Steps to enable email sending in 1 minute:"}
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px]">
                    <li>{lang === "es" ? "Inicia sesión en Google con" : "Sign in to Google with"} <strong>ventas@zxzmods.com</strong>.</li>
                    <li>
                      {lang === "es" ? "Abre el enlace directo de Contraseñas de Aplicación:" : "Open the direct App Passwords page:"}{" "}
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline font-semibold"
                      >
                        myaccount.google.com/apppasswords
                      </a>
                    </li>
                    <li>{lang === "es" ? "Escribe de nombre 'Sitio Web ZxZ' y presiona Crear." : "Name it 'ZxZ Website' and click Create."}</li>
                    <li>{lang === "es" ? "Copia el código generado de 16 caracteres y colócalo en el archivo .env en" : "Copy the 16-character code and set it in your .env as:"} <code className="bg-rose-100 px-1 py-0.5 rounded font-mono font-bold">SMTP_PASS="tu_codigo_aqui"</code></li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 flex items-start gap-3 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">{lang === "es" ? "Estado de Conexión SMTP:" : "SMTP Connection Status:"} {emailDiag.status}</div>
                  <p className="text-amber-800 text-[11px] mt-0.5">{emailDiag.message || emailDiag.error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Test Dispatch Tool */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <label className="block text-xs font-bold text-slate-800">
            {lang === "es" ? "Enviar Correo de Prueba en Tiempo Real:" : "Send Real-Time Test Email:"}
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <input
              type="email"
              value={testEmailTarget}
              onChange={(e) => setTestEmailTarget(e.target.value)}
              placeholder="santi2106sandoval@gmail.com"
              className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSendTestEmail("TEST")}
                disabled={sendingTestEmail || !testEmailTarget}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {sendingTestEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{lang === "es" ? "Probar Envío" : "Send Test"}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendTestEmail("REJECTION")}
                disabled={sendingTestEmail || !testEmailTarget}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {sendingTestEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{lang === "es" ? "Probar Rechazo" : "Test Rejection"}</span>
              </button>
            </div>
          </div>

          {testEmailResult && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                testEmailResult.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              {testEmailResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">{testEmailResult.message}</p>
                {testEmailResult.previewUrl && (
                  <a
                    href={testEmailResult.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-bold"
                  >
                    <span>{lang === "es" ? "Abrir vista previa de prueba en navegador" : "Open test preview in browser"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
