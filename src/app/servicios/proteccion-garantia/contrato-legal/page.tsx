"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { GarageModal } from "@/components/garage/GarageModal";
import { FloatingConcierge } from "@/components/home/FloatingConcierge";
import { useLanguage } from "@/context/LanguageContext";
import { COMPANY_CONFIG } from "@/config/company";
import {
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Printer,
  FileText,
  AlertTriangle,
  Scale,
  Building2,
  Phone,
  CheckCircle2,
} from "lucide-react";

export default function WarrantyLegalContractPage() {
  const { lang, t } = useLanguage();
  const [docLang, setDocLang] = useState<"es" | "en">(lang === "es" ? "es" : "en");

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="print:hidden">
        <NotificationBanner />
        <Navbar />
      </div>

      <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 print:p-0 print:pt-4">
        {/* Top Back Navigation */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            href="/servicios/proteccion-garantia"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-[#C02030] transition group px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
            <span>{lang === "es" ? "Volver a Protección de Garantía" : "Back to Warranty Protection"}</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl p-0.5 border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-2xs">
              <button
                type="button"
                onClick={() => setDocLang("es")}
                className={`px-3 py-1 rounded-lg transition ${
                  docLang === "es"
                    ? "bg-[#C02030] text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                Español
              </button>
              <button
                type="button"
                onClick={() => setDocLang("en")}
                className={`px-3 py-1 rounded-lg transition ${
                  docLang === "en"
                    ? "bg-[#C02030] text-white"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                English
              </button>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:bg-slate-800 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{lang === "es" ? "Imprimir" : "Print"}</span>
            </button>
          </div>
        </div>

        {/* Contract Card Container */}
        <div className="p-6 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-6 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 block">
                  TERMINOLOGÍA LEGAL & CONTRACTUAL
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white font-mono mt-0.5">
                  {COMPANY_CONFIG.legalName}
                </h1>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                  Cédula Jurídica: {COMPANY_CONFIG.cedulaJuridica || "3-101-436132"} • Taller Especializado en Performance & UTV
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {COMPANY_CONFIG.location.address} • Tel: {COMPANY_CONFIG.contact.phone}
                </p>
              </div>

              <div className="text-right text-xs font-mono text-slate-500">
                <p>Pozos de Santa Ana, Costa Rica</p>
                <p>www.zxzmods.com</p>
              </div>
            </div>

            <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              {docLang === "es"
                ? "TÉRMINOS, CONDICIONES CONTRACTUALES Y EXONERACIÓN DE RESPONSABILIDAD PARA EL SERVICIO DE PROTECCIÓN DE GARANTÍA"
                : "TERMS, CONTRACTUAL CONDITIONS AND LIABILITY RELEASE FOR DEALER WARRANTY PROTECTION SERVICE"}
            </h2>
          </div>

          {/* Mandatory OEM Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-950 dark:text-amber-200 space-y-1.5 text-xs">
            <div className="flex items-center gap-2 font-black text-amber-800 dark:text-amber-400 uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {docLang === "es"
                  ? "AVISO OBLIGATORIO: ENTREGA INDISPENSABLE DE PIEZAS ORIGINALES (OEM)"
                  : "MANDATORY NOTICE: INDISPENSABLE DELIVERY OF FACTORY ORIGINAL (OEM) PARTS"}
              </span>
            </div>
            <p className="leading-relaxed">
              {docLang === "es"
                ? "El cliente debe entregar físicamente las piezas originales de fábrica (OEM) completas y operativas. Sin las piezas OEM, es estrictamente imposible ejecutar el procedimiento de desinstalación de accesorios ZxZ y montaje stock. ZxZ Mods no suministra piezas OEM ni asume responsabilidad por la falta de entrega de las mismas."
                : "The client must physically deliver complete and operational factory original (OEM) parts. Without the OEM parts, it is strictly impossible to perform the ZxZ aftermarket disassembly and stock mounting procedure. ZxZ Mods does not provide OEM parts nor assume liability for missing client-provided OEM components."}
            </p>
          </div>

          {/* Legal Clauses */}
          <div className="space-y-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed text-justify">
            {docLang === "es" ? (
              <>
                <section className="space-y-1.5">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono text-xs">
                    CLÁUSULA 1: NATURALEZA Y ALCANCE DEL SERVICIO
                  </h3>
                  <p>
                    ZxZ Mods Costa Rica ({COMPANY_CONFIG.legalName}, Cédula Jurídica {COMPANY_CONFIG.cedulaJuridica || "3-101-436132"}) actúa en calidad de prestador de servicios mecánicos
                    independiente. El Servicio de Protección de Garantía comprende de forma
                    exclusiva la mano de obra calificada para dos procedimientos mecánicos: (1) el
                    desmontaje previo de los accesorios aftermarket ZxZ adquiridos por el cliente y el
                    montaje temporal de las piezas OEM originales de fábrica suministradas por el
                    cliente, y (2) tras el retorno de la inspección de agencia, el desmontaje de las
                    piezas OEM y la reinstalación definitiva de las piezas ZxZ.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono text-xs">
                    CLÁUSULA 2: CONDICIÓN SUSPENSIVA DE ENTREGA DE PIEZAS OEM
                  </h3>
                  <p>
                    Es requisito indispensable e insubsanable que el cliente entregue a ZxZ Mods las
                    piezas OEM originales completas, en buen estado y compatibles antes o al momento
                    del retiro/ingreso del vehículo al taller. En caso de no entregarse las piezas OEM,
                    el servicio se suspenderá de pleno derecho y no se iniciará ningún desmontaje, sin
                    que ello genere responsabilidad económica, contractual ni extracontractual para
                    ZxZ Mods.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono text-xs">
                    CLÁUSULA 3: EXCLUSIÓN TOTAL DE RESPONSABILIDAD ANTE CONCESIONARIOS
                  </h3>
                  <p>
                    ZxZ Mods NO es agencia oficial, concesionario autorizado ni representante de
                    marcas de vehículos (incluyendo Can-Am, Polaris, Yamaha, Honda, Kawasaki, CF Moto u
                    otras). La decisión de mantener, validar, suspender o revocar la garantía oficial de
                    fábrica es potestad privativa y discrecional del concesionario oficial. ZxZ Mods no
                    garantiza bajo ninguna circunstancia que el concesionario apruebe las revisiones, ni
                    asume responsabilidad por diagnósticos de agencia, memorias de la ECU (computadora),
                    registros telemétricos de horas o kilometraje, ni por rechazos de garantía
                    derivados de políticas internas de la agencia.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono text-xs">
                    CLÁUSULA 4: CUSTODIA Y PLAZO DE REINSTALACIÓN
                  </h3>
                  <p>
                    Las piezas ZxZ desmontadas permanecerán en custodia segura en las bodegas de ZxZ
                    Mods en Pozos de Santa Ana durante el lapso de visita a la agencia. El cliente
                    cuenta con un plazo máximo de treinta (30) días naturales posteriores a la entrega
                    del vehículo con piezas OEM para solicitar la cita de reinstalación final de sus
                    piezas ZxZ.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono text-xs">
                    CLÁUSULA 5: DECLARACIÓN DE CONDICIONES PREVIAS DEL VEHÍCULO
                  </h3>
                  <p>
                    El cliente declara bajo la gravedad de juramento que el vehículo ingresa sin
                    daños estructurales ocultos, sin averías previas no reportadas y con su sistema
                    eléctrico y mecánico en condiciones estándar de operación.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono text-xs">
                    CLÁUSULA 6: LEY APLICABLE Y TRIBUNALES
                  </h3>
                  <p>
                    Este contrato se interpreta y ejecuta de conformidad con el ordenamiento jurídico
                    de la República de Costa Rica. Para cualquier diferendo, las partes acuerdan
                    someterse a la jurisdicción de los Tribunales de Justicia del Primer Circuito
                    Judicial de San José.
                  </p>
                </section>
              </>
            ) : (
              <>
                <section className="space-y-1.5">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono text-xs">
                    CLAUSE 1: NATURE AND SCOPE OF SERVICE
                  </h3>
                  <p>
                    ZxZ Mods Costa Rica ({COMPANY_CONFIG.legalName}, Corporate Tax ID {COMPANY_CONFIG.cedulaJuridica || "3-101-436132"}) provides independent mechanical labor services. The Warranty
                    Protection service strictly covers two technical stages: (1) removing the client's
                    ZxZ aftermarket upgrades and mounting the client's factory OEM parts, and (2) after
                    the dealer inspection, dismounting the OEM parts and reinstalling the ZxZ upgrades.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono text-xs">
                    CLAUSE 2: MANDATORY DELIVERY OF FACTORY OEM PARTS
                  </h3>
                  <p>
                    It is an absolute prerequisite that the client supplies the complete, original, and
                    functional OEM factory parts before service initiation. Without the OEM parts,
                    service execution is strictly impossible and will be held without any liability on
                    ZxZ Mods.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono text-xs">
                    CLAUSE 3: COMPLETE RELEASE OF DEALER WARRANTY LIABILITY
                  </h3>
                  <p>
                    ZxZ Mods is not an authorized distributor, dealer, or partner of any vehicle brand
                    (Polaris, Can-Am, Yamaha, Honda, Kawasaki, CF Moto). Warranty approvals are at the
                    exclusive discretion of the official dealership. ZxZ Mods assumes zero liability for
                    dealer inspection findings, telemetry logs, ECU operating records, or warranty claim
                    denials.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono text-xs">
                    CLAUSE 4: APPLICABLE LAW
                  </h3>
                  <p>
                    This contract is governed under the laws of the Republic of Costa Rica.
                  </p>
                </section>
              </>
            )}
          </div>

          {/* Footer Seals */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Términos Legales Vigentes • ZxZ Mods Costa Rica</span>
            </div>
            <span>Revisión Legal: 2026-CR</span>
          </div>
        </div>
      </div>

      <div className="print:hidden">
        <CartDrawer />
        <GarageModal />
        <FloatingConcierge />
      </div>
    </main>
  );
}
