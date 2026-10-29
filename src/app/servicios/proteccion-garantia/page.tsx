"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { GarageModal } from "@/components/garage/GarageModal";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingConcierge } from "@/components/home/FloatingConcierge";
import { Footer } from "@/components/layout/Footer";
import { COMPANY_CONFIG, getWhatsAppUrl, getTelUrl } from "@/config/company";
import {
  ShieldCheck,
  ShieldAlert,
  Wrench,
  Calendar,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  Phone,
  Sparkles,
  Zap,
  Clock,
  Car,
  ChevronDown,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  Sliders,
  Check,
  Truck,
  Building2,
  Info,
  AlertTriangle,
  FileText,
} from "lucide-react";

export interface WarrantyPartItem {
  id: string;
  rawId?: string;
  productId?: string;
  sku: string;
  nameEs: string;
  nameEn: string;
  imageUrl: string;
  installationPriceCRC: number;
  deinstallReinstallCostCRC: number;
  orderId: string;
  orderNumber: string;
  purchasedAt: string;
  orderStatus: string;
  type: "PRODUCT" | "COMBO";
  isAlreadyInActiveGAR?: boolean;
  activeGAROrderNumber?: string | null;
}

function WarrantyProtectionSkeleton() {
  return (
    <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 animate-pulse">
      <div className="w-32 h-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      <div className="p-8 sm:p-12 rounded-3xl bg-slate-200 dark:bg-slate-800 h-80" />
      <div className="p-6 rounded-3xl bg-slate-200 dark:bg-slate-800 h-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-slate-200 dark:bg-slate-800 h-44" />
        <div className="p-6 rounded-3xl bg-slate-200 dark:bg-slate-800 h-44" />
      </div>
      <div className="p-8 rounded-3xl bg-slate-200 dark:bg-slate-800 h-72" />
    </div>
  );
}

export default function WarrantyProtectionPage() {
  const router = useRouter();
  const { t, lang, companyPhone } = useLanguage();
  const { user, openAuthModal } = useAuth();
  const { formatPrice } = useCart();

  const [parts, setParts] = useState<WarrantyPartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [confirmedOemRequirement, setConfirmedOemRequirement] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Fetch client's purchased warranty parts from API
  const fetchWarrantyParts = useCallback(async () => {
    try {
      const res = await fetch("/api/user/warranty-parts");
      const data = await res.json();
      if (res.ok && data.success) {
        const list: WarrantyPartItem[] = data.parts || [];
        setParts(list);
        setSelectedIds(list.filter((p) => !p.isAlreadyInActiveGAR).map((p) => p.id));
      }
    } catch (err) {
      console.error("Error fetching warranty parts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarrantyParts();
  }, [fetchWarrantyParts]);

  const toggleSelectPart = (part: WarrantyPartItem) => {
    if (part.isAlreadyInActiveGAR) {
      alert(
        lang === "es"
          ? `Esta pieza ya está incluida en la orden de garantía #${part.activeGAROrderNumber}. No es posible duplicarla mientras esté en proceso.`
          : `This part is already included in warranty order #${part.activeGAROrderNumber}. Cannot duplicate while in progress.`
      );
      return;
    }
    setSelectedIds((prev) =>
      prev.includes(part.id) ? prev.filter((item) => item !== part.id) : [...prev, part.id]
    );
  };

  const selectedParts = parts.filter((p) => selectedIds.includes(p.id));
  const totalDeinstallReinstallCRC = selectedParts.reduce(
    (sum, p) => sum + p.deinstallReinstallCostCRC,
    0
  );

  const handleCreateServiceOrder = async () => {
    if (!user) {
      openAuthModal("Inicia sesión para programar el servicio de garantía");
      return;
    }
    if (selectedIds.length === 0) return;

    setCreatingOrder(true);
    try {
      const res = await fetch("/api/user/warranty-service-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedPartIds: selectedIds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.redirectUrl) {
        router.push(data.redirectUrl);
      } else {
        alert(data.error || "No se pudo generar la orden de servicio");
      }
    } catch (err) {
      console.error("Error creating warranty service order:", err);
      alert("Error de conexión al programar el servicio");
    } finally {
      setCreatingOrder(false);
    }
  };

  const whatsappMessage =
    lang === "es"
      ? "Hola ZxZ Mods, deseo coordinar el Servicio de Protección de Garantía de Agencia (desinstalación temporal y reinstalación de piezas OEM) para mi vehículo."
      : "Hello ZxZ Mods, I would like to coordinate the Dealer Warranty Protection Service (temporary uninstall and OEM parts reinstallation) for my vehicle.";

  const whatsappLink = getWhatsAppUrl(whatsappMessage);

  const faqs = [
    {
      q: t.warrantyProtectionFaq1Q,
      a: t.warrantyProtectionFaq1A,
    },
    {
      q:
        lang === "es"
          ? "¿Por qué el costo de mano de obra es exactamente [Instalación × 2]?"
          : "Why is the labor cost calculated as [Installation × 2]?",
      a:
        lang === "es"
          ? "Porque el servicio cubre el ciclo completo en dos etapas: primero el desmontaje de tus accesorios ZxZ y el montaje de tus piezas OEM de fábrica antes de la agencia (1ra instalación), y tras superar la revisión, el desmontaje de las piezas OEM y la reinstalación final de tus piezas ZxZ (2da instalación). Cero cargos sorpresa por repuestos."
          : "Because the service covers the full cycle in two phases: first the disassembly of your ZxZ parts and mounting of your original factory OEM parts prior to dealer inspection (1st install), and after passing inspection, dismounting the OEM parts and reinstalling your ZxZ parts back (2nd install). Zero surprise parts markups.",
    },
    {
      q: t.warrantyProtectionFaq2Q,
      a: t.warrantyProtectionFaq2A,
    },
    {
      q:
        lang === "es"
          ? "¿Puedo solicitar que el técnico venga a mi domicilio o recoja el vehículo en plataforma?"
          : "Can I request mobile on-site service or platform pickup for my UTV?",
      a:
        lang === "es"
          ? "¡Por supuesto! Al generar tu solicitud podrás elegir entre: 1) Taller Central en Pozos de Santa Ana (sin costo de traslado), 2) Servicio a Domicilio con taller móvil a tu cochera o finca, o 3) Plataforma Pick-Up todo incluido que retira tu UTV y lo devuelve 100% listo."
          : "Absolutely! When initiating your request you can choose between: 1) Central Workshop in Santa Ana (no transport fee), 2) Mobile Home Service to your garage or farm, or 3) All-Inclusive Flatbed Platform Pickup and return.",
    },
    {
      q: t.warrantyProtectionFaq3Q,
      a: t.warrantyProtectionFaq3A,
    },
  ];

  const steps = [
    {
      num: "01",
      title: lang === "es" ? "1. Selección de Piezas & Modalidad" : "1. Part Selection & Service Mode",
      desc:
        lang === "es"
          ? "Selecciona en el sistema cuáles de tus accesorios ZxZ necesitas retirar. Escoge si deseas servicio en Taller Central, A Domicilio o Retiro en Plataforma con fecha y hora reservada."
          : "Select which of your registered ZxZ upgrades need removal. Choose between Workshop, Home Mobile Service, or Flatbed Pickup with scheduled date and time.",
      icon: Sliders,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
    },
    {
      num: "02",
      title: t.warrantyProtectionStep2Title,
      desc: t.warrantyProtectionStep2Desc,
      icon: Wrench,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    },
    {
      num: "03",
      title: lang === "es" ? "3. Visita a la Agencia 100% Stock" : "3. 100% Stock Dealer Visit",
      desc:
        lang === "es"
          ? "Lleva tu UTV a su mantenimiento periódico o reclamo oficial de fábrica con total tranquilidad. Tu vehículo cumple 100% las condiciones de agencia sin rastros de alteraciones."
          : "Take your UTV to scheduled dealer maintenance or official factory inspection with absolute confidence. Your vehicle is 100% factory compliant.",
      icon: ShieldCheck,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    },
    {
      num: "04",
      title: t.warrantyProtectionStep4Title,
      desc: t.warrantyProtectionStep4Desc,
      icon: Zap,
      color: "text-[#C02030] bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
    },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <NotificationBanner />
        <Navbar />
        <WarrantyProtectionSkeleton />
        <CartDrawer />
        <GarageModal />
        <FloatingConcierge />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors">
      <NotificationBanner />
      <Navbar />

      <main className="flex-1 pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10 w-full">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#C02030] dark:hover:text-[#FF3B47] transition group px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
            <span>{t.warrantyProtectionBackBtn}</span>
          </Link>

          <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
            ZxZ Protected System
          </span>
        </div>

        {/* Hero Section (DJI Aesthetics) */}
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-[#3b080d] p-8 sm:p-12 text-white border border-red-900/40 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 rounded-full bg-red-600/20 blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-bold tracking-wider uppercase">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Garantía de Agencia 100% Protegida</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              {t.warrantyProtectionPageTitle}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              {lang === "es"
                ? "Instala escapes de alto flujo, reprogramaciones ECU, clutch kits y mods de potencia con absoluta tranquilidad. Antes de tus chequeos de agencia, desinstalamos tus piezas ZxZ y reinstalamos temporalmente las originales (OEM). Una vez aprobada tu revisión, reinstalamos tus mejoras ZxZ cobrando únicamente la mano de obra calculada a [Instalación × 2]."
                : "Install high-flow exhausts, ECU tunes, clutch kits and power upgrades with total peace of mind. Prior to dealer checkups, we uninstall your ZxZ parts and temporarily reinstall your OEM parts. Once inspected, we reinstall your ZxZ upgrades charging solely for labor calculated as [Installation × 2]."}
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              {parts.length > 0 ? (
                <a
                  href="#mis-piezas"
                  className="px-6 py-3.5 rounded-2xl bg-[#C02030] hover:bg-[#A01825] text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition shadow-lg flex items-center gap-2"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Ver Mis Piezas Registradas ({parts.length})</span>
                </a>
              ) : (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3.5 rounded-2xl bg-[#C02030] hover:bg-[#A01825] text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition shadow-lg flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{t.warrantyProtectionContactBtn}</span>
                </a>
              )}

              <a
                href={getTelUrl(companyPhone)}
                className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition border border-white/20 flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>{companyPhone || COMPANY_CONFIG.contact.phone}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Strictly Mandatory OEM Parts Delivery Requirement */}
        <div className="p-5 sm:p-6 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-600/50 shadow-sm space-y-3">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-black text-amber-950 dark:text-amber-200 uppercase tracking-wide">
                {lang === "es"
                  ? "REQUISITO INDISPENSABLE: ENTREGA FÍSICA DE PIEZAS ORIGINALES (OEM)"
                  : "MANDATORY REQUIREMENT: PHYSICAL DELIVERY OF FACTORY ORIGINAL (OEM) PARTS"}
              </h3>
              <p className="text-xs sm:text-sm text-amber-900/90 dark:text-amber-300/90 leading-relaxed font-medium">
                {lang === "es"
                  ? "Para que el equipo de ZxZ Mods pueda desmontar tus accesorios y dejar tu UTV 100% stock, es estrictamente obligatorio que el cliente entregue físicamente las piezas originales de fábrica (OEM). Sin las piezas OEM originales, es absolutamente imposible realizar el servicio de Protección de Garantía."
                  : "For ZxZ Mods to disassemble your upgrades and leave your UTV 100% stock, it is strictly mandatory that the client physically delivers the factory original (OEM) parts. Without original OEM parts, performing the Warranty Protection service is strictly impossible."}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-amber-200 dark:border-amber-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-[11px] font-mono text-amber-800 dark:text-amber-400">
              {lang === "es"
                ? "El cliente es responsable de suministrar piezas OEM compatibles y en buen estado."
                : "The client is responsible for supplying operational and compatible OEM parts."}
            </span>
            <Link
              href="/servicios/proteccion-garantia/contrato-legal"
              className="inline-flex items-center gap-1 font-bold text-[#C02030] dark:text-[#FF3B47] hover:underline"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{lang === "es" ? "Ver Contrato Legal & Exoneración →" : "View Legal Terms & Release →"}</span>
            </Link>
          </div>
        </div>

        {/* ============================================================== */}
        {/* LIVE REGISTERED PARTS CONSOLE (User Requirement & Core Engine) */}
        {/* ============================================================== */}
        <section id="mis-piezas" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Wrench className="w-3 h-3" />
                <span>Gestor de Desinstalación & Reinstalación</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {t.warrantyProtectionPartsTitle}
              </h2>
            </div>

            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Fórmula: [Instalación Base × 2]
            </span>
          </div>

          {!user ? (
            /* Log In Prompt */
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6 text-[#C02030]" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t.warrantyProtectionLoginRequired}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t.warrantyProtectionLoginPrompt}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openAuthModal("Accede para ver tus piezas de protección de garantía")}
                className="px-6 py-2.5 rounded-xl bg-[#C02030] hover:bg-[#A01825] text-white text-xs font-bold transition shadow-sm"
              >
                {lang === "es" ? "Iniciar Sesión" : "Log In"}
              </button>
            </div>
          ) : parts.length === 0 ? (
            /* Empty State */
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800/60">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-lg mx-auto">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {t.warrantyProtectionNoParts}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t.warrantyProtectionNoPartsDesc}
                </p>
              </div>
              <Link
                href="/productos"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C02030] hover:bg-[#A01825] text-white text-xs font-bold transition shadow-sm"
              >
                <span>{t.warrantyProtectionExploreCatalog}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            /* Active Interactive Part Selector */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 flex items-center gap-3 text-xs text-amber-900 dark:text-amber-300">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  {t.warrantyProtectionOnlyZxzNotice} {lang === "es" ? "Selecciona los componentes que deseas retirar antes de ingresar tu vehículo a la agencia." : "Select the components you wish to remove before entering your vehicle into the dealership."}
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                {parts.map((part) => {
                  const isSelected = selectedIds.includes(part.id);
                  const isBlockedInGAR = Boolean(part.isAlreadyInActiveGAR);
                  const displayName = lang === "es" ? part.nameEs : part.nameEn;

                  return (
                    <div
                      key={part.id}
                      onClick={() => toggleSelectPart(part)}
                      className={`p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer transition ${
                        isBlockedInGAR
                          ? "bg-slate-50/70 dark:bg-slate-800/30 opacity-75 cursor-not-allowed"
                          : isSelected
                          ? "bg-red-50/30 dark:bg-red-950/15"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        {/* Checkbox */}
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                            isBlockedInGAR
                              ? "border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-700"
                              : isSelected
                              ? "bg-[#C02030] border-[#C02030] text-white"
                              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>

                        {/* Image Preview */}
                        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 overflow-hidden shrink-0 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={part.imageUrl}
                            alt={displayName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/placeholder.png";
                            }}
                          />
                        </div>

                        {/* Name & Metadata */}
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                              {displayName}
                            </h4>
                            {isBlockedInGAR && (
                              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 inline-flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                <span>En Solicitud #{part.activeGAROrderNumber}</span>
                              </span>
                            )}
                          </div>
                          {part.sku && (
                            <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                              SKU: {part.sku}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                            <span>{lang === "es" ? "Comprado en Orden:" : "Purchased in Order:"} #{part.orderNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Install & De-install Cost [installation * 2] */}
                      <div className="pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80 flex sm:block items-center justify-between sm:justify-center text-left sm:text-right shrink-0 space-y-0 sm:space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                          {t.warrantyProtectionDeinstallReinstallLabel}
                        </span>
                        <div className="text-right sm:text-inherit">
                          <span className="text-sm sm:text-lg font-black font-mono text-[#C02030] dark:text-[#FF3B47] block">
                            ₡{part.deinstallReinstallCostCRC.toLocaleString("es-CR")}
                          </span>
                          <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 dark:text-slate-500 block">
                            ({t.warrantyProtectionInstallCostLabel} ₡{part.installationPriceCRC.toLocaleString("es-CR")} × 2)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Toolbar */}
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg border border-slate-800">
                <div className="space-y-1.5 text-center sm:text-left">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t.warrantyProtectionTotalToPay}
                  </span>
                  <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                    <span className="text-2xl sm:text-3xl font-black font-mono text-white">
                      ₡{totalDeinstallReinstallCRC.toLocaleString("es-CR")}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      ({selectedParts.length} {t.warrantyProtectionSelectedCount})
                    </span>
                  </div>

                  {/* Required OEM Delivery & Legal Agreement Acceptance Checkbox */}
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={confirmedOemRequirement}
                      onChange={(e) => setConfirmedOemRequirement(e.target.checked)}
                      className="rounded border-slate-700 text-[#C02030] focus:ring-[#C02030] w-4 h-4 cursor-pointer"
                    />
                    <span>
                      {lang === "es"
                        ? "Entregaré físicamente las piezas OEM originales y acepto el Contrato Legal."
                        : "I will deliver the original OEM parts and accept the Legal Agreement."}
                    </span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <Link
                    href="/servicios/proteccion-garantia/contrato-legal"
                    className="text-xs text-slate-400 hover:text-white underline font-semibold"
                  >
                    {lang === "es" ? "Leer Contrato Completo" : "Read Full Contract"}
                  </Link>

                  <button
                    type="button"
                    onClick={handleCreateServiceOrder}
                    disabled={selectedIds.length === 0 || creatingOrder || !confirmedOemRequirement}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#C02030] hover:bg-[#A01825] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition shadow-md cursor-pointer shrink-0"
                  >
                    {creatingOrder ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{t.warrantyProtectionCreatingOrder}</span>
                      </>
                    ) : (
                      <>
                        <span>{t.warrantyProtectionProceedService}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Pricing Transparency Formula Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  {lang === "es"
                    ? "Transparencia Total: Fórmula [Instalación Base × 2]"
                    : "Zero Hidden Costs: Formula [Base Installation × 2]"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === "es"
                    ? "El cobro corresponde exclusivamente a las horas mecánicas de dos procedimientos de montaje."
                    : "Fee accounts strictly for the mechanical labor hours of two full assembly procedures."}
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800 shrink-0 self-start sm:self-auto">
              100% Stock Garantizado
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                {lang === "es" ? "Etapa 1: Pre-Agencia" : "Phase 1: Pre-Dealer Inspection"}
              </span>
              <p>
                {lang === "es"
                  ? "Desinstalamos con máxima prolijidad los accesorios de alto rendimiento ZxZ y reinstalamos tus piezas OEM de fábrica con calibración exacta para que el vehículo ingrese 100% stock a la agencia."
                  : "We meticulously remove your ZxZ high-performance upgrades and remount your factory OEM parts with precision torque so your vehicle enters the dealer 100% stock."}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                {lang === "es" ? "Etapa 2: Post-Agencia" : "Phase 2: Post-Dealer Inspection"}
              </span>
              <p>
                {lang === "es"
                  ? "Finalizada la inspección oficial de la agencia, retornas a ZxZ para desinstalar los componentes OEM y volver a montar tus piezas de alto rendimiento para que continúes disfrutando de su máximo poder."
                  : "Once official dealer maintenance is approved, return to ZxZ to remove OEM components and reinstall your performance upgrades to enjoy peak power."}
              </p>
            </div>
          </div>
        </div>

        {/* 4-Step How It Works */}
        <div className="space-y-6">
          <div className="text-center space-y-1.5 max-w-xl mx-auto">
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              {t.warrantyProtectionHowItWorksTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {lang === "es"
                ? "Flujo ágil y seguro respaldado por el taller especializado ZxZ Mods."
                : "A seamless, secure flow backed by the ZxZ Mods specialized workshop."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.num}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-900 transition shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-2xl border ${step.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-black text-slate-300 dark:text-slate-700">
                      PASO {step.num}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {step.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          <div className="text-center space-y-1 pb-2">
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#C02030]" />
              <span>{t.warrantyProtectionFaqTitle}</span>
            </h2>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className="transition">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                  >
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        isOpen ? "rotate-180 text-[#C02030]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Final CTA Banner */}
        <div className="p-8 rounded-3xl bg-[#C02030] bg-gradient-to-r from-red-600 via-[#C02030] to-[#800f1a] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-black">
              {lang === "es"
                ? "¿Dudas sobre la garantía de tus accesorios?"
                : "Questions about your parts warranty coverage?"}
            </h3>
            <p className="text-xs sm:text-sm text-red-100 max-w-lg">
              {lang === "es"
                ? "Conversa directamente con nuestro equipo de técnicos certificados por WhatsApp y te asesoramos paso a paso."
                : "Chat directly with our certified technical team via WhatsApp for personalized guidance."}
            </p>
          </div>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-2xl bg-white text-[#C02030] hover:bg-slate-100 text-xs sm:text-sm font-bold uppercase tracking-wider transition shadow-md shrink-0 flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4 text-[#C02030]" />
            <span>{t.warrantyProtectionContactBtn}</span>
          </a>
        </div>
      </main>

      <Footer />

      <CartDrawer />
      <GarageModal />
      <FloatingConcierge />
    </div>
  );
}
