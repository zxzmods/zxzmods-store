"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  X,
  ShieldCheck,
  FileText,
  Clock,
  Car,
  Wrench,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Plane,
} from "lucide-react";

export function TermsModal() {
  const { isTermsModalOpen, closeTermsModal } = useAuth();
  const { lang } = useLanguage();

  if (!isTermsModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeTermsModal}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#C02030]/10 flex items-center justify-center text-[#C02030]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  {lang === "es"
                    ? "Términos y Condiciones del Servicio"
                    : "Terms and Conditions of Service"}
                </h3>
                <p className="text-xs text-gray-500">
                  {lang === "es"
                    ? "ZxZ Mods • Powersports Performance & Importación Costa Rica"
                    : "ZxZ Mods • Powersports Performance & Importation Costa Rica"}
                </p>
              </div>
            </div>
            <button
              onClick={closeTermsModal}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-gray-700 leading-relaxed">
            {/* Quick Summary Pill */}
            <div className="p-4 rounded-2xl bg-red-50/60 border border-red-100 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#C02030] flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-gray-900">
                  {lang === "es"
                    ? "Resumen de Compromiso ZxZ Mods"
                    : "ZxZ Mods Service Commitment Summary"}
                </p>
                <p className="text-gray-600">
                  {lang === "es"
                    ? "Todas las compras, cotizaciones y servicios mecánicos están respaldados por garantías por escrito: 60 días en mano de obra y 90 días en piezas mecánicas y accesorios bolt-on."
                    : "All purchases, quotes, and mechanical services are backed by written warranties: 60 days on labor and 90 days on bolt-on parts and mechanical components."}
                </p>
              </div>
            </div>

            {/* Section 1 */}
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-mono font-bold">
                  1
                </span>
                {lang === "es"
                  ? "Identificación y Aceptación de los Términos"
                  : "Identification and Acceptance of Terms"}
              </h4>
              <p className="text-xs text-gray-600 pl-8">
                {lang === "es"
                  ? "Al acceder, navegar, registrar una cuenta, agregar vehículos a tu garaje o gestionar pedidos en la plataforma de ZxZ Mods, el usuario acepta de manera expresa los presentes Términos y Condiciones, regidos de conformidad con la legislación de la República de Costa Rica (Ley N° 7472 de Promoción de la Competencia y Defensa Efectiva del Consumidor)."
                  : "By accessing, browsing, registering an account, adding vehicles to your garage, or managing orders on the ZxZ Mods platform, the user explicitly accepts these Terms and Conditions, governed under the laws of the Republic of Costa Rica (Consumer Protection Law No. 7472)."}
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-mono font-bold">
                  2
                </span>
                <Car className="w-4 h-4 text-[#C02030]" />
                {lang === "es"
                  ? "Garaje Virtual y Compatibilidad de Piezas (Fitment)"
                  : "Virtual Garage and Fitment Compatibility"}
              </h4>
              <p className="text-xs text-gray-600 pl-8">
                {lang === "es"
                  ? "Para registrar vehículos en el Garaje virtual, el usuario debe autenticarse. La selección del Año, Marca y Modelo (YMM) se utiliza para filtrar componentes técnicos compatibles. ZxZ Mods verifica rigurosamente el ajuste técnico antes de despachar o instalar cualquier accesorio."
                  : "To register vehicles in the Virtual Garage, the user must authenticate. Selection of Year, Make, and Model (YMM) is used to filter compatible technical components. ZxZ Mods verifies fitment before shipping or installing any accessory."}
              </p>
            </div>

            {/* Section 3 */}
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-mono font-bold">
                  3
                </span>
                <Plane className="w-4 h-4 text-[#C02030]" />
                {lang === "es"
                  ? "Importación de Piezas desde Estados Unidos"
                  : "Parts Importation from the United States"}
              </h4>
              <p className="text-xs text-gray-600 pl-8">
                {lang === "es"
                  ? "Las piezas no disponibles en inventario físico local se importan bajo pedido desde distribuidores autorizados en Estados Unidos. El tiempo estimado de entrega es de 7 a 12 días hábiles una vez confirmado el pedido, sujeto a procesos ordinarios de aduanas e inspección fiscal en Costa Rica."
                  : "Parts not in local physical stock are imported on-demand from authorized distributors in the United States. Estimated delivery time is 7 to 12 business days upon confirmation, subject to standard customs and tax inspections in Costa Rica."}
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-mono font-bold">
                  4
                </span>
                <Wrench className="w-4 h-4 text-[#C02030]" />
                {lang === "es"
                  ? "Pólizas de Garantía por Escrito"
                  : "Written Warranty Policies"}
              </h4>
              <div className="pl-8 space-y-2 text-xs text-gray-600">
                <p>
                  • <strong className="text-gray-900">{lang === "es" ? "Mano de Obra e Instalación:" : "Labor and Installation:"}</strong>{" "}
                  {lang === "es"
                    ? "60 días naturales sobre instalaciones realizadas por nuestro equipo técnico certificado en taller o a domicilio."
                    : "60 calendar days on installations carried out by our certified technicians at our workshop or at home."}
                </p>
                <p>
                  • <strong className="text-gray-900">{lang === "es" ? "Repuestos y Accesorios Bolt-On:" : "Bolt-On Parts and Accessories:"}</strong>{" "}
                  {lang === "es"
                    ? "90 días naturales contra defectos de fabricación."
                    : "90 calendar days against manufacturer defects."}
                </p>
                <p>
                  • <strong className="text-gray-900">{lang === "es" ? "Reprogramación ECU / Tuning:" : "ECU Reprogramming / Tuning:"}</strong>{" "}
                  {lang === "es"
                    ? "Garantía de archivo de por vida para reescritura en caso de reseteo por agencia autorizada."
                    : "Lifetime file backup warranty for re-flashing in case of authorized dealer resets."}
                </p>
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <ShieldAlert className="w-3.5 h-3.5 inline mr-1 text-amber-600" />
                  {lang === "es"
                    ? "Exclusiones: Se excluyen daños ocasionados por accidentes, negligencia, sumersión completa sin snorkel o modificaciones mecánicas no supervisadas por ZxZ Mods."
                    : "Exclusions: Damage caused by crashes, negligence, submersion without snorkel, or unverified modifications by third parties is excluded."}
                </p>
              </div>
            </div>

            {/* Section 5 */}
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-mono font-bold">
                  5
                </span>
                <Clock className="w-4 h-4 text-[#C02030]" />
                {lang === "es"
                  ? "Servicios de Taller, Domicilio y Transporte de UTV"
                  : "Workshop Services, Home Delivery & UTV Pick-Up"}
              </h4>
              <p className="text-xs text-gray-600 pl-8">
                {lang === "es"
                  ? "El servicio de traslado de UTV/ATV se efectúa mediante remolque plataforma especializado con amarres de alta resistencia y cobertura de transporte. Para instalaciones a domicilio en el Gran Área Metropolitana (GAM) y zonas rurales, el cliente debe garantizar un espacio seguro y nivelado para la maniobra técnica."
                  : "UTV/ATV pick-up service is conducted using specialized flatbed trailers with heavy-duty tie-downs and transport coverage. For home installations within the GAM or rural zones, the client must ensure a safe and level working area for our mobile unit."}
              </p>
            </div>

            {/* Section 6 */}
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-xs font-mono font-bold">
                  6
                </span>
                {lang === "es"
                  ? "Precios, Monedas y Métodos de Pago"
                  : "Pricing, Currencies and Payment"}
              </h4>
              <p className="text-xs text-gray-600 pl-8">
                {lang === "es"
                  ? "Los precios se publican en Colones costarricenses (CRC) con conversión dinámica a Dólares estadounidenses (USD) referenciada al tipo de cambio oficial del BCCR / Ministerio de Hacienda. Las cotizaciones formales emitidas tienen una vigencia de 15 días naturales."
                  : "Prices are shown in Costa Rican Colones (CRC) with dynamic conversion to US Dollars (USD) according to official BCCR / Treasury exchange rates. Formal quotations remain valid for 15 calendar days."}
              </p>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-5 border-t border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
            <a
              href="/documentos?doc=terminos-condiciones"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-[#C02030] flex items-center gap-1.5 transition-colors"
            >
              <span>{lang === "es" ? "Ver Centro de Documentos Oficial" : "View Official Document Center"}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={closeTermsModal}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#C02030] hover:bg-[#A01B28] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === "es" ? "Aceptar y Continuar" : "Accept and Continue"}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
