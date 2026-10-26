"use client";

import React, { useState } from "react";
import {
  FileText,
  ShieldCheck,
  Printer,
  X,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Phone,
  Car,
  Wrench,
  Globe,
} from "lucide-react";
import { formatCRC } from "@/lib/i18n";
import { COMPANY_CONFIG } from "@/config/company";

export interface WarrantyLegalDocumentData {
  orderNumber: string;
  orderId?: string;
  createdAt: string | Date;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail?: string | null;
  vehicleModel?: string | null;
  totalCRC: number;
  items: Array<{
    name?: string;
    sku?: string;
    priceCRC?: number;
  }>;
}

interface WarrantyLegalDocumentModalProps {
  data: WarrantyLegalDocumentData | null;
  onClose: () => void;
}

export function WarrantyLegalDocumentModal({
  data,
  onClose,
}: WarrantyLegalDocumentModalProps) {
  const [docLang, setDocLang] = useState<"es" | "en">("es");

  if (!data) return null;

  const dateFormatted = new Date(data.createdAt).toLocaleDateString(
    docLang === "es" ? "es-CR" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in my-auto">
        {/* Modal Top Action Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
                  Documento Legal & Contractual
                </span>
                <span className="text-xs font-mono font-extrabold text-white">
                  #{data.orderNumber}
                </span>
              </div>
              <h3 className="text-sm font-black text-white">
                Contrato de Servicio de Protección de Garantía
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setDocLang("es")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  docLang === "es"
                    ? "bg-[#C02030] text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => setDocLang("en")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  docLang === "en"
                    ? "bg-[#C02030] text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                EN
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition border border-white/10"
              title="Imprimir o Guardar en PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-6 text-slate-800 print:p-0 print:overflow-visible print:max-h-none print:text-black">
          {/* Company & Document Header */}
          <div className="border-b-2 border-slate-900 pb-5 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950 font-mono">
                  ZxZ Mods
                </h1>
                <p className="text-xs text-slate-700 font-bold">
                  Cédula Jurídica: {COMPANY_CONFIG.cedulaJuridica || "3-101-436132"} <span className="text-[10px] font-normal text-slate-500">({COMPANY_CONFIG.legalName})</span> • Taller Especializado en UTV & Performance
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {COMPANY_CONFIG.location.address} • Tel: {COMPANY_CONFIG.contact.phone} • WhatsApp: {COMPANY_CONFIG.contact.whatsappDisplay}
                </p>
              </div>

              <div className="text-right font-mono">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  ORDEN DE SERVICIO
                </span>
                <span className="text-base sm:text-lg font-black text-[#C02030] block">
                  #{data.orderNumber}
                </span>
                <span className="text-xs text-slate-600 block">{dateFormatted}</span>
              </div>
            </div>

            <div className="pt-2">
              <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-900 bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-center">
                {docLang === "es"
                  ? "CONTRATO DE PRESTACIÓN DE SERVICIO DE PROTECCIÓN DE GARANTÍA, CONDICIONES DE DESMONTAJE/MONTAJE Y EXONERACIÓN DE RESPONSABILIDAD"
                  : "DEALER WARRANTY PROTECTION SERVICE AGREEMENT, DISASSEMBLY/MOUNTING TERMS & FULL LIABILITY RELEASE"}
              </h2>
            </div>
          </div>

          {/* Party Details & Vehicle Info Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                {docLang === "es" ? "DATOS DEL CLIENTE / PROPIETARIO:" : "CLIENT / OWNER INFORMATION:"}
              </span>
              <p className="font-bold text-slate-900 text-sm">
                {data.customerName || "Cliente Registrado"}
              </p>
              <p className="text-slate-600">Teléfono: {data.customerPhone || "N/A"}</p>
              {data.customerEmail && (
                <p className="text-slate-600">Email: {data.customerEmail}</p>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                {docLang === "es" ? "SERVICIO Y VEHÍCULO:" : "SERVICE & VEHICLE:"}
              </span>
              <p className="font-bold text-slate-900">
                {docLang === "es" ? "Servicio de Protección de Garantía" : "Warranty Protection Service"}
              </p>
              <p className="text-slate-600">
                {docLang === "es" ? "Mano de obra pactada [Inst × 2]:" : "Agreed Labor [Inst × 2]:"}{" "}
                <strong className="text-slate-900 font-bold">
                  {formatCRC(data.totalCRC)}
                </strong>
              </p>
              <p className="text-slate-600">
                Estado Actual: <strong className="text-slate-900">ACTIVO</strong>
              </p>
            </div>
          </div>

          {/* Parts Covered Table */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              {docLang === "es"
                ? "PIEZAS ZXZ REGISTRADAS PARA DESMONTAJE Y REINSTALACIÓN:"
                : "ZXZ PARTS COVERED FOR REMOVAL AND REINSTALLATION:"}
            </span>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">
                      {docLang === "es" ? "Descripción de Pieza ZxZ" : "ZxZ Part Description"}
                    </th>
                    <th className="p-2.5">SKU / Código</th>
                    <th className="p-2.5 text-right">
                      {docLang === "es" ? "Mano de Obra [×2]" : "Labor Fee [×2]"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 font-semibold text-slate-900">
                        {it.name || "Accesorio ZxZ"}
                      </td>
                      <td className="p-2.5 font-mono text-slate-500">{it.sku || "N/A"}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        {it.priceCRC ? formatCRC(it.priceCRC) : "₡0"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Contractual Clauses (Air-tight legal language) */}
          <div className="space-y-4 text-xs leading-relaxed text-slate-700 border-t border-slate-200 pt-4">
            <h3 className="font-bold uppercase tracking-wider text-slate-900 text-xs font-mono">
              {docLang === "es"
                ? "CLÁUSULAS GENERALES & CONDICIONES CONTRACTUALES"
                : "GENERAL CLAUSES & LEGAL PROVISIONS"}
            </h3>

            {docLang === "es" ? (
              <div className="space-y-3 text-justify">
                <p>
                  <strong>PRIMERA. OBJETO Y ALCANCE MECÁNICO:</strong> El presente contrato
                  regula la contratación de servicios especializados de mano de obra mecánica
                  por parte de <em>ZxZ Mods Costa Rica</em> (Cédula Jurídica {COMPANY_CONFIG.cedulaJuridica || "3-101-436132"}, {COMPANY_CONFIG.legalName}, en adelante “EL PRESTADOR”) en
                  favor del cliente propietario o autorizado (en adelante “EL CLIENTE”). El
                  servicio comprende exclusivamente: (a) Desmontaje técnico de los accesorios y
                  componentes aftermarket de marca ZxZ indicados en la tabla superior; (b)
                  Montaje e instalación temporal de las piezas originales de fábrica (OEM)
                  entregadas por EL CLIENTE; y (c) Posterior desmontaje de las piezas OEM y
                  reinstalación final de los accesorios ZxZ una vez concluida la inspección en la
                  agencia autorizada.
                </p>

                <p className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950">
                  <strong>SEGUNDA. REQUISITO OBLIGATORIO DE ENTREGA DE PIEZAS OEM:</strong> Es
                  condición suspensiva, indispensable e imperativa para la ejecución del presente
                  servicio que EL CLIENTE entregue físicamente al personal de EL PRESTADOR las
                  piezas originales de fábrica (OEM) completas, compatibles y en óptimo estado de
                  funcionamiento. <strong>Sin la entrega física oportuna de las piezas OEM, es
                  absolutamente imposible ejecutar el procedimiento de Protección de Garantía</strong>,
                  eximiendo a EL PRESTADOR de toda responsabilidad por atrasos o imposibilidad
                  material de cumplimiento. EL CLIENTE es el único responsable de la idoneidad,
                  autenticidad y estado de las piezas OEM suministradas.
                </p>

                <p>
                  <strong>TERCERA. INDEPENDENCIA Y EXONERACIÓN TOTAL ANTE CONCESIONARIOS / AGENCIAS:</strong>{" "}
                  EL CLIENTE reconoce y acepta expresamente que <em>ZxZ Mods</em> es un taller y
                  preparador independiente que <strong>no posee ninguna filiación, representación,
                  asociación comercial ni agencia oficial</strong> con fabricantes de vehículos UTV
                  o automotrices, tales como Polaris, Can-Am (BRP), Honda, Yamaha, Kawasaki, CF Moto o
                  sus distribuidores locales en Costa Rica. Las políticas, reclamos de garantía,
                  mantenimientos de fábrica y revisiones técnicas son del resorte único y
                  discrecional de la respectiva agencia concesionaria. EL PRESTADOR <strong>no
                  garantiza ni puede garantizar</strong> que la agencia apruebe revisiones o
                  reclamos de garantía, ni asume responsabilidad alguna por rechazos fundamentados en
                  horas de uso, memorias de telemetría de computadoras (ECU) o revisiones forenses
                  realizadas por el concesionario.
                </p>

                <p>
                  <strong>CUARTA. CUSTODIA Y RESGUARDO DE PIEZAS ZXZ:</strong> EL PRESTADOR se
                  compromete a custodiar con la debida diligencia los accesorios ZxZ desmontados en
                  sus bodegas de Santa Ana durante el lapso de visita del vehículo a la agencia. EL
                  CLIENTE dispondrá de un plazo máximo de treinta (30) días naturales posteriores a la
                  entrega del vehículo con piezas OEM para programar la cita de reinstalación final de
                  sus piezas ZxZ. Vencido dicho plazo sin que medie coordinación escrita, EL
                  PRESTADOR queda facultado a cobrar gastos razonables de almacenaje.
                </p>

                <p>
                  <strong>QUINTA. CONDICIONES PREVIAS DEL VEHÍCULO:</strong> EL CLIENTE declara bajo
                  fe de juramento que el vehículo no presenta fallas mecánicas previas ocultas,
                  daños estructurales no reportados ni alertas electrónicas preexistentes. EL PRESTADOR
                  no responderá por averías preexistentes ni por desgastes naturales propios del uso del
                  vehículo en ruta o competencia.
                </p>

                <p>
                  <strong>SEXTA. TARIFA PACTADA [INSTALACIÓN × 2]:</strong> La tarifa total pactada
                  cubre de forma transparente y sin sobrecostos de repuestos las horas mecánicas de los
                  dos ciclos completos de montaje/desmontaje. Los costos de transporte o grúa plataforma,
                  en caso de ser contratados, se liquidan conforme al tarifario oficial vigente.
                </p>

                <p>
                  <strong>SÉPTIMA. LEY APLICABLE Y RESOLUCIÓN DE CONFLICTOS:</strong> El presente
                  acuerdo se rige por las leyes de la República de Costa Rica. Para cualquier
                  controversia derivada de su interpretación o ejecución, ambas partes se someten a la
                  jurisdicción de los Tribunales de Justicia del Primer Circuito Judicial de San José.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-justify">
                <p>
                  <strong>FIRST. SCOPE & MECHANICAL PURPOSE:</strong> This agreement governs the
                  contracting of specialized mechanical labor services provided by <em>ZxZ Mods Costa
                  Rica</em> (Corporate Tax ID {COMPANY_CONFIG.cedulaJuridica || "3-101-436132"}, {COMPANY_CONFIG.legalName}, "THE PROVIDER") to the vehicle owner or authorized client ("THE CLIENT").
                  The service consists exclusively of: (a) Technical removal of registered ZxZ
                  aftermarket upgrades listed above; (b) Temporary installation of factory original (OEM)
                  parts supplied by THE CLIENT; and (c) Removal of OEM parts and final reinstallation
                  of ZxZ upgrades once the official dealership inspection has concluded.
                </p>

                <p className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950">
                  <strong>SECOND. MANDATORY OEM PARTS DELIVERY:</strong> It is a mandatory and
                  indispensable condition for this service that THE CLIENT physically delivers to THE
                  PROVIDER all complete, operational, and compatible factory original (OEM) parts.{" "}
                  <strong>Without physical delivery of the original OEM parts, it is strictly impossible
                  to perform the Warranty Protection procedure</strong>. THE CLIENT assumes full and sole
                  responsibility for the authenticity, compatibility, and mechanical state of the
                  supplied OEM components.
                </p>

                <p>
                  <strong>THIRD. INDEPENDENCE & FULL RELEASE OF DEALERSHIP LIABILITY:</strong> THE
                  CLIENT expressly acknowledges that <em>ZxZ Mods</em> is an independent specialized
                  workshop and holds <strong>no affiliation, representation, or partnership with
                  official vehicle dealerships or manufacturers</strong> (including Polaris, Can-Am
                  / BRP, Honda, Yamaha, Kawasaki, CF Moto or local distributors). Warranty approvals,
                  maintenance acceptance, and warranty claim decisions are strictly at the sole
                  discretion of the authorized dealer. THE PROVIDER <strong>does not and cannot
                  guarantee</strong> dealer warranty approvals, and assumes zero liability for dealer
                  warranty denials based on telemetry logs, ECU operating hours, or forensic dealer
                  evaluations.
                </p>

                <p>
                  <strong>FOURTH. ZXZ UPGRADES CUSTODY & SAFEKEEPING:</strong> THE PROVIDER shall store
                  the dismounted ZxZ components with due care at its Pozos de Santa Ana facilities. THE
                  CLIENT has up to thirty (30) calendar days following OEM delivery to schedule the
                  reinstallation appointment.
                </p>

                <p>
                  <strong>FIFTH. APPLICABLE LAW:</strong> This agreement is governed in all respects by
                  the laws of the Republic of Costa Rica.
                </p>
              </div>
            )}
          </div>

          {/* Signatures & Acceptance Box */}
          <div className="pt-8 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs font-mono">
            <div className="space-y-8">
              <div className="border-b border-slate-400 pb-1 pt-6 text-center">
                <span className="font-bold text-slate-900 block">
                  {data.customerName || "CLIENTE / PROPIETARIO"}
                </span>
                <span className="text-[10px] text-slate-400">Firma del Cliente Aceptante</span>
              </div>
              <div className="text-[10px] text-slate-500 space-y-0.5">
                <p>Cédula / Identificación: ________________________</p>
                <p>Aceptación Digital Registrada en Sistema ZxZ Mods</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="border-b border-slate-400 pb-1 pt-6 text-center">
                <span className="font-bold text-slate-900 block">
                  ZxZ Mods
                </span>
                <span className="text-[10px] text-slate-600 font-mono font-bold block">
                  Cédula Jurídica: {COMPANY_CONFIG.cedulaJuridica || "3-101-436132"} <span className="text-[8.5px] font-normal text-slate-500">({COMPANY_CONFIG.legalName})</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Taller Especializado / Responsable Técnico
                </span>
              </div>
              <div className="text-[10px] text-slate-500 space-y-0.5">
                <p>Santa Ana, San José, Costa Rica</p>
                <p>Certificación de Servicio Autorizado ZxZ</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Documento oficial generado bajo normativa legal de Costa Rica</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Contrato</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
