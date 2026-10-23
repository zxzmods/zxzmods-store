"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import {
  Video,
  Upload,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  Play,
  Save,
  MessageCircle,
  Sparkles,
  Eye,
  Compass,
  Calendar,
  Plus,
  Trash2,
  Clock,
  MapPin,
  X,
} from "lucide-react";

export interface BarrialCrConfigData {
  id: string;
  title: string;
  subtitleEs: string;
  subtitleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  videoUrl: string;
  posterImageUrl: string;
  logoUrl: string;
  whatsappGroupLink: string;
  whatsappBtnTextEs: string;
  whatsappBtnTextEn: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BarrialCrRideItem {
  id: string;
  appointmentCode?: string | null;
  date: string;
  time: string;
  title: string;
  destinationAddress: string | null;
  status: string;
  isFullDay: boolean;
  isUpcoming: boolean;
}

interface BarrialCrManagerSectionProps {
  userRole?: "MASTER" | "STAFF";
}

export function BarrialCrManagerSection({ userRole }: BarrialCrManagerSectionProps) {
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form State
  const [title, setTitle] = useState("BarrialCR");
  const [subtitleEs, setSubtitleEs] = useState("");
  const [subtitleEn, setSubtitleEn] = useState("");
  const [descriptionEs, setDescriptionEs] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [posterImageUrl, setPosterImageUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [whatsappGroupLink, setWhatsappGroupLink] = useState("");
  const [whatsappBtnTextEs, setWhatsappBtnTextEs] = useState("");
  const [whatsappBtnTextEn, setWhatsappBtnTextEn] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Calendar Rides State
  const [rides, setRides] = useState<BarrialCrRideItem[]>([]);
  const [showAddRideModal, setShowAddRideModal] = useState(false);
  const [newRideDate, setNewRideDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [newRideTitle, setNewRideTitle] = useState("");
  const [newRideMeetingPoint, setNewRideMeetingPoint] = useState("");
  const [newRideTime, setNewRideTime] = useState("08:00");
  const [creatingRide, setCreatingRide] = useState(false);

  // Upload States
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sys/barrialcr");
      const data = await res.json();
      if (res.ok && data.success && data.config) {
        const c: BarrialCrConfigData = data.config;
        setTitle(c.title || "BarrialCR");
        setSubtitleEs(c.subtitleEs || "");
        setSubtitleEn(c.subtitleEn || "");
        setDescriptionEs(c.descriptionEs || "");
        setDescriptionEn(c.descriptionEn || "");
        setVideoUrl(c.videoUrl || "");
        setPosterImageUrl(c.posterImageUrl || "");
        setLogoUrl(c.logoUrl || "");
        setWhatsappGroupLink(c.whatsappGroupLink || "");
        setWhatsappBtnTextEs(c.whatsappBtnTextEs || "");
        setWhatsappBtnTextEn(c.whatsappBtnTextEn || "");
        setIsActive(c.isActive ?? true);
      }
      if (data && Array.isArray(data.rides)) {
        setRides(data.rides);
      }
    } catch (err) {
      console.error("Error loading BarrialCR config:", err);
      setFeedback({
        type: "error",
        text: "Error al cargar la configuración de BarrialCR",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRideDate) return;
    setCreatingRide(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/sys/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate: newRideDate,
          timeSlot: newRideTime || "08:00",
          serviceType: "ruta_barrial",
          status: "BLOCKED",
          isFullDay: true,
          destinationAddress: newRideMeetingPoint.trim() || "Ruta BarrialCR",
          clientName: newRideTitle.trim() || "Ruta BarrialCR",
          costCRC: 0,
          paymentStatus: "PAID",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          text:
            lang === "es"
              ? "Ruta BarrialCR agregada al calendario exitosamente"
              : "BarrialCR ride added to calendar successfully",
        });
        setShowAddRideModal(false);
        setNewRideTitle("");
        setNewRideMeetingPoint("");
        fetchConfig();
      } else {
        setFeedback({
          type: "error",
          text: data.error || "Error al agendar la ruta",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Error de conexión al agendar ruta",
      });
    } finally {
      setCreatingRide(false);
    }
  };

  const handleDeleteRide = async (rideId: string) => {
    if (
      !window.confirm(
        lang === "es"
          ? "¿Estás seguro de que deseas eliminar esta ruta de BarrialCR del calendario?"
          : "Are you sure you want to delete this BarrialCR ride from the calendar?"
      )
    )
      return;
    try {
      const res = await fetch(`/api/sys/services?id=${rideId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          text:
            lang === "es"
              ? "Ruta eliminada del calendario exitosamente"
              : "Ride removed from calendar successfully",
        });
        setRides((prev) => prev.filter((r) => r.id !== rideId));
      } else {
        setFeedback({
          type: "error",
          text: data.error || "Error al eliminar la ruta",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        text: "Error al eliminar la ruta",
      });
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "VIDEO" | "POSTER" | "LOGO"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "VIDEO") setUploadingVideo(true);
    else if (type === "POSTER") setUploadingPoster(true);
    else setUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "folder",
        type === "VIDEO" ? "videos" : type === "LOGO" ? "brands" : "products"
      );

      const res = await fetch("/api/sys/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || (lang === "es" ? "Error al subir archivo" : "Upload failed"));
      }

      if (type === "VIDEO") {
        setVideoUrl(data.url);
      } else if (type === "POSTER") {
        setPosterImageUrl(data.url);
      } else {
        setLogoUrl(data.url);
      }

      setFeedback({
        type: "success",
        text:
          lang === "es"
            ? "Archivo multimedia subido con éxito"
            : "Media file uploaded successfully",
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      setFeedback({
        type: "error",
        text: err.message || (lang === "es" ? "Error al procesar archivo" : "Error processing file"),
      });
    } finally {
      if (type === "VIDEO") setUploadingVideo(false);
      else if (type === "POSTER") setUploadingPoster(false);
      else setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    const payload = {
      title,
      subtitleEs,
      subtitleEn,
      descriptionEs,
      descriptionEn,
      videoUrl,
      posterImageUrl,
      logoUrl,
      whatsappGroupLink,
      whatsappBtnTextEs,
      whatsappBtnTextEn,
      isActive,
    };

    try {
      const res = await fetch("/api/sys/barrialcr", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          text: t.backdoorBarrialCrSuccessSaved,
        });
      } else {
        setFeedback({
          type: "error",
          text: data.error || "No se pudo guardar la configuración",
        });
      }
    } catch (err: any) {
      console.error("Save error:", err);
      setFeedback({
        type: "error",
        text: "Error de conexión al guardar cambios",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-2xl w-1/3"></div>
        <div className="h-64 bg-slate-100 rounded-3xl border border-slate-200"></div>
        <div className="h-48 bg-slate-100 rounded-3xl border border-slate-200"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-50 text-[#C02030]">
              <Compass className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              {t.backdoorBarrialCrTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            {t.backdoorBarrialCrSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchConfig}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            title="Recargar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            href="/barrialcr"
            target="_blank"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-black text-white transition shadow-sm"
          >
            <Eye className="w-3.5 h-3.5 text-[#C02030]" />
            <span>{t.backdoorBarrialCrPreviewBtn}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Hero Video & Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-slate-100 text-[#C02030]">
                <Video className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                {t.backdoorBarrialCrHeroSettings}
              </h3>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
              Hero Viewport
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Video & Media inputs */}
            <div className="space-y-4">
              {/* Video URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t.backdoorBarrialCrVideoUrl} *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="/uploads/videos/barrialcr.mp4 o https://..."
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#C02030] focus:ring-1 focus:ring-[#C02030]"
                    required
                  />
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-700 transition shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {uploadingVideo
                        ? t.backdoorBarrialCrUploadingVideo
                        : t.backdoorBarrialCrUploadVideo}
                    </span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "VIDEO")}
                      disabled={uploadingVideo}
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Formatos recomendados: MP4 (H.264) optimizado para web, 1080p o 720p.
                </p>
              </div>

              {/* Poster Image URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t.backdoorBarrialCrPosterUrl}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={posterImageUrl}
                    onChange={(e) => setPosterImageUrl(e.target.value)}
                    placeholder="https://... o /images/..."
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#C02030] focus:ring-1 focus:ring-[#C02030]"
                  />
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-semibold text-slate-700 transition shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {uploadingPoster ? "Subiendo..." : t.backdoorBarrialCrUploadPoster}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "POSTER")}
                      disabled={uploadingPoster}
                    />
                  </label>
                </div>
              </div>

              {/* Centered Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t.backdoorBarrialCrTitleLabel} *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="BarrialCR"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#C02030] focus:ring-1 focus:ring-[#C02030] font-bold"
                  required
                />
              </div>

              {/* Subtitles ES & EN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.backdoorBarrialCrSubtitleEs}
                  </label>
                  <input
                    type="text"
                    value={subtitleEs}
                    onChange={(e) => setSubtitleEs(e.target.value)}
                    placeholder="Comunidad Off-Road & Rutas UTV"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#C02030]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.backdoorBarrialCrSubtitleEn}
                  </label>
                  <input
                    type="text"
                    value={subtitleEn}
                    onChange={(e) => setSubtitleEn(e.target.value)}
                    placeholder="Off-Road & UTV Rides Community"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#C02030]"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Hero Live Preview */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Vista Previa del Hero Video
              </label>
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-300 shadow-inner flex items-center justify-center">
                {videoUrl ? (
                  <video
                    src={videoUrl}
                    poster={posterImageUrl || undefined}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover opacity-80"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-2 p-6 text-center">
                    <FileVideo className="w-10 h-10 opacity-40" />
                    <p className="text-xs">Sin video de fondo asignado</p>
                  </div>
                )}

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60 pointer-events-none" />

                {/* Centered Preview Title */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
                  <span className="text-[9px] font-bold tracking-widest text-[#C02030] uppercase mb-1 bg-black/40 px-2 py-0.5 rounded-full border border-white/10">
                    Comunidad Oficial
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider drop-shadow-md">
                    {title || "BarrialCR"}
                  </h1>
                  {subtitleEs && (
                    <p className="text-[11px] text-white/80 max-w-xs mt-1 drop-shadow-xs">
                      {subtitleEs}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Community Details & Logo */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-slate-100 text-[#C02030]">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                {t.backdoorBarrialCrCommunitySettings}
              </h3>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
              Contenido al Deslizar
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Logo Settings & Preview */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                {t.backdoorBarrialCrLogoUrl} *
              </label>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center gap-3">
                <div className="relative w-32 h-32 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center overflow-hidden p-2">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="BarrialCR Logo"
                      fill
                      className="object-contain p-2"
                      unoptimized
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Sin logo</span>
                  )}
                </div>

                <div className="w-full flex flex-col gap-2">
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="/images/logo.png"
                    className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-300"
                  />
                  <label className="cursor-pointer flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {uploadingLogo
                        ? t.backdoorBarrialCrUploadingLogo
                        : t.backdoorBarrialCrUploadLogo}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "LOGO")}
                      disabled={uploadingLogo}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Description Textareas (ES & EN) */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t.backdoorBarrialCrDescEs} *
                </label>
                <textarea
                  rows={4}
                  value={descriptionEs}
                  onChange={(e) => setDescriptionEs(e.target.value)}
                  placeholder="Describe qué es la comunidad BarrialCR, las rutas que organizan en Costa Rica, requisitos y camaradería..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#C02030] focus:ring-1 focus:ring-[#C02030] leading-relaxed"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t.backdoorBarrialCrDescEn}
                </label>
                <textarea
                  rows={4}
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  placeholder="Describe BarrialCR community, off-road trails organized in Costa Rica, camaraderie and requirements..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#C02030] focus:ring-1 focus:ring-[#C02030] leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: WhatsApp Group Chat */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <MessageCircle className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                Comunidad en WhatsApp
              </h3>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              WhatsApp Direct Chat
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.backdoorBarrialCrWhatsappLink} *
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={whatsappGroupLink}
                  onChange={(e) => setWhatsappGroupLink(e.target.value)}
                  placeholder="https://chat.whatsapp.com/..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                  required
                />
                {whatsappGroupLink && (
                  <a
                    href={whatsappGroupLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs shrink-0"
                  >
                    <span>Probar Enlace</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {t.backdoorBarrialCrWhatsappLinkHelp}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t.backdoorBarrialCrWhatsappBtnEs}
                </label>
                <input
                  type="text"
                  value={whatsappBtnTextEs}
                  onChange={(e) => setWhatsappBtnTextEs(e.target.value)}
                  placeholder="Unirse al Chat de la Comunidad"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t.backdoorBarrialCrWhatsappBtnEn}
                </label>
                <input
                  type="text"
                  value={whatsappBtnTextEn}
                  onChange={(e) => setWhatsappBtnTextEn(e.target.value)}
                  placeholder="Join Community Chat"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Calendar Rides (Sincronización con la Agenda Oficial) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Calendar className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {t.backdoorBarrialCrCalendarRidesTitle}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {t.backdoorBarrialCrCalendarRidesSubtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAddRideModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.backdoorBarrialCrAddRideBtn}</span>
            </button>
          </div>

          {/* Rides List */}
          {rides.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-600">
                {t.backdoorBarrialCrNoCalendarRides}
              </p>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                {lang === "es"
                  ? "Las rutas agregadas aquí o bloqueadas en la 'Agenda de Servicios' aparecerán automáticamente en la pantalla de /barrialcr."
                  : "Rides added here or blocked in the 'Services Agenda' will automatically appear on the /barrialcr page."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rides.map((ride) => (
                <div
                  key={ride.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    ride.isUpcoming
                      ? "bg-amber-50/40 border-amber-200/90 shadow-2xs"
                      : "bg-slate-50 border-slate-200 opacity-70"
                  } flex items-start justify-between gap-3`}
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                        {ride.date}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {ride.time}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ride.isUpcoming
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {ride.isUpcoming
                          ? lang === "es"
                            ? "Próxima"
                            : "Upcoming"
                          : lang === "es"
                          ? "Pasada"
                          : "Past"}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {ride.title}
                    </h4>

                    {ride.destinationAddress && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-[#C02030] shrink-0" />
                        <span>{ride.destinationAddress}</span>
                      </p>
                    )}

                    {ride.appointmentCode && (
                      <p className="text-[10px] font-mono text-slate-400">
                        #{ride.appointmentCode}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteRide(ride.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                    title="Eliminar ruta de la agenda"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 5: Status & Save Button */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-[#C02030] rounded-sm focus:ring-[#C02030] cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-700">
              {isActive
                ? t.backdoorBarrialCrStatusActive
                : t.backdoorBarrialCrStatusInactive}
            </span>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#C02030] hover:bg-[#a81a28] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>
              {saving ? t.backdoorBarrialCrSaving : t.backdoorBarrialCrSaveBtn}
            </span>
          </button>
        </div>
      </form>

      {/* Add Ride Modal */}
      {showAddRideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateRide}
            className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-fade-in"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {lang === "es"
                      ? "Agendar Nueva Ruta BarrialCR"
                      : "Schedule New BarrialCR Ride"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {lang === "es"
                      ? "Se guardará en la Agenda de Servicios y se mostrará en /barrialcr"
                      : "Saves to Service Agenda and shows on /barrialcr"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRideModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Fecha de la Ruta *
                </label>
                <input
                  type="date"
                  value={newRideDate}
                  onChange={(e) => setNewRideDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Hora de Salida *
                </label>
                <input
                  type="time"
                  value={newRideTime}
                  onChange={(e) => setNewRideTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nombre o Destino de la Ruta
                </label>
                <input
                  type="text"
                  value={newRideTitle}
                  onChange={(e) => setNewRideTitle(e.target.value)}
                  placeholder="Ej: Ruta Cerro de la Muerte / Volcán Irazú"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Punto de Encuentro
                </label>
                <input
                  type="text"
                  value={newRideMeetingPoint}
                  onChange={(e) => setNewRideMeetingPoint(e.target.value)}
                  placeholder="Ej: Gasolinera El Guarco, Cartago"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddRideModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={creatingRide}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {creatingRide
                    ? lang === "es"
                      ? "Agendando..."
                      : "Scheduling..."
                    : lang === "es"
                    ? "Agendar Ruta"
                    : "Schedule Ride"}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

