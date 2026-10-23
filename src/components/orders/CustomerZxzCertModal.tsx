"use client";

import React, { useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { COMPANY_CONFIG } from "@/config/company";
import {
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  Award,
  Package,
  MapPin,
  FileCheck,
  Sparkles,
} from "lucide-react";

interface CustomerZxzCertModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerZxzCertModal({
  order,
  isOpen,
  onClose,
}: CustomerZxzCertModalProps) {
  const { lang, t } = useLanguage();

  const certData: any = useMemo(() => {
    if (!order?.zxzCertificationJson) {
      return {
        certificationNumber: `ZXZ-CERT-${(order?.orderNumber || "ORD").replace(/[^A-Za-z0-9]/g, "")}`,
        certifiedAt: order?.updatedAt || order?.createdAt || new Date().toISOString(),
        certifiedBy: "Staff Técnico ZxZ Mods",
        status: "VERIFIED_OK",
        warehouseLocation: "Taller & Bodega Central ZxZ Mods, Pozos de Santa Ana, Costa Rica",
      };
    }
    try {
      return typeof order.zxzCertificationJson === "string"
        ? JSON.parse(order.zxzCertificationJson)
        : order.zxzCertificationJson;
    } catch {
      return {};
    }
  }, [order?.zxzCertificationJson, order?.orderNumber, order?.createdAt, order?.updatedAt]);

  const itemsList: any[] = useMemo(() => {
    if (certData.itemsVerified && Array.isArray(certData.itemsVerified) && certData.itemsVerified.length > 0) {
      return certData.itemsVerified;
    }
    if (order?.items && Array.isArray(order.items)) {
      return order.items;
    }
    if (order?.itemsJson) {
      try {
        const parsed = typeof order.itemsJson === "string" ? JSON.parse(order.itemsJson) : order.itemsJson;
        return Array.isArray(parsed) ? parsed : [];
      } catch {}
    }
    return [];
  }, [certData.itemsVerified, order?.items, order?.itemsJson]);

  if (!isOpen || !order) return null;

  // ISOLATED IFRAME PRINT ENGINE
  const handlePrint = () => {
    const printElement = document.getElementById("zxz-customer-cert-sheet");
    if (!printElement) {
      window.print();
      return;
    }

    let iframe = document.getElementById("zxz-customer-cert-iframe") as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "zxz-customer-cert-iframe";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.visibility = "hidden";
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const styleTags = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map((el) => el.outerHTML)
      .join("\n");

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ZxZ Mods - Certificado de Calidad #${order.orderNumber}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          ${styleTags}
          <style>
            @page {
              size: letter portrait;
              margin: 10mm 10mm 10mm 10mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            #customer-print-sheet {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              box-shadow: none !important;
              border: none !important;
            }
            * {
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          <div id="customer-print-sheet">
            ${printElement.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error("Print error:", err);
        window.print();
      }
    }, 250);
  };

  const formattedDate = new Date(certData.certifiedAt || order.createdAt).toLocaleDateString(
    lang === "es" ? "es-CR" : "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const inspectorDisplayName = certData.certifiedBy
    ? certData.certifiedBy.includes("@")
      ? "Dirección Técnica & Control de Calidad"
      : certData.certifiedBy
    : "Staff Técnico ZxZ Mods";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-hidden">
      <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header (No Print) */}
        <div className="no-print p-4 sm:p-5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold tracking-tight">
                  {lang === "es" ? "Certificado Oficial de Calidad ZxZ" : "Official ZxZ Quality Certificate"}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-600/50 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  <span>{lang === "es" ? "Auténtico" : "Authentic"}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {lang === "es"
                  ? "Arribo e inspección técnica de mercadería en bodega central"
                  : "Warehouse arrival & quality inspection certificate"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>{t.zxzCertDownloadBtn}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title={lang === "es" ? "Cerrar" : "Close"}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Viewport with comfortable scrolling & generous bottom space */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 bg-slate-950/40 flex justify-center items-start">
          <div
            id="zxz-customer-cert-sheet"
            className="w-full max-w-3xl bg-white rounded-3xl shadow-xl text-slate-900 font-sans p-6 sm:p-10 md:p-12 relative overflow-hidden border border-slate-200 mb-8 sm:mb-12"
          >
            {/* Subtle Security Guilloche Watermark */}
            <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center opacity-[0.03]">
              <ShieldCheck className="w-96 h-96 text-slate-950" />
            </div>

            {/* Inner Double Security Border Frame */}
            <div className="relative border-2 border-emerald-700/30 rounded-2xl p-5 sm:p-8 bg-gradient-to-b from-white via-slate-50/25 to-white space-y-6">
              
              {/* Corner Security Accents */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-emerald-600 pointer-events-none" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-emerald-600 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-emerald-600 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-emerald-600 pointer-events-none" />

              {/* Certificate Header */}
              <div className="text-center space-y-2 border-b-2 border-slate-900/10 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold tracking-widest text-slate-600 uppercase">
                  <span>{COMPANY_CONFIG.legalName}</span>
                  <span>•</span>
                  <span>COSTA RICA</span>
                </div>

                <div className="w-16 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-emerald-600 mx-auto rounded-full my-2" />

                <h1 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-slate-950">
                  {lang === "es"
                    ? "Certificado Oficial de Calidad de Producto"
                    : "Official Product Quality Certificate"}
                </h1>
                
                <p className="text-[11px] sm:text-xs font-extrabold text-emerald-800 tracking-wider uppercase">
                  {lang === "es"
                    ? "Constancia de Arribo de Mercadería en Estado Perfecto"
                    : "Official Certification of Arrival in Perfect Condition"}
                </p>
              </div>

              {/* Certificate Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {lang === "es" ? "N° Certificado" : "Certificate #"}
                  </span>
                  <span className="font-mono font-black text-slate-900 text-xs truncate block" title={certData.certificationNumber}>
                    {certData.certificationNumber}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {lang === "es" ? "Orden de Pedido" : "Order #"}
                  </span>
                  <span className="font-mono font-black text-slate-900 text-xs sm:text-sm block">
                    #{order.orderNumber}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {lang === "es" ? "Fecha de Arribo" : "Arrival Date"}
                  </span>
                  <span className="font-bold text-slate-800 text-xs block">
                    {formattedDate}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-300 shadow-2xs flex flex-col justify-between">
                  <span className="text-[9.5px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                    {lang === "es" ? "Estado de Arribo" : "Arrival Status"}
                  </span>
                  <div className="inline-flex items-center gap-1.5 font-black text-emerald-800 text-[11px] whitespace-nowrap">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{lang === "es" ? "ESTADO PERFECTO" : "PERFECT CONDITION"}</span>
                  </div>
                </div>
              </div>

              {/* Simplified Official Statement */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/90 border-l-4 border-emerald-600 border-y border-r border-slate-200/80 text-xs text-slate-800 leading-relaxed space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
                    {lang === "es"
                      ? "Declaración Oficial de Conformidad Técnica:"
                      : "Official Statement of Technical Conformity:"}
                  </span>
                </div>
                <p className="font-medium text-slate-700 text-xs sm:text-[12.5px] leading-relaxed">
                  {lang === "es"
                    ? `ZxZ Mods Costa Rica S.A. certifica oficialmente que la totalidad de los productos, repuestos y accesorios correspondientes a la orden #${order.orderNumber} han arribado a nuestra bodega central en ESTADO PERFECTO. Cada ítem fue desempaquetado e inspeccionado individualmente en nuestra estación de calidad técnica, constatando empaques y sellos originales de fábrica íntegros, libres de averías o defectos de transporte, y aprobados con garantía oficial ZxZ.`
                    : `ZxZ Mods Costa Rica S.A. officially certifies that all products, parts, and accessories corresponding to order #${order.orderNumber} have arrived at our central warehouse in PERFECT CONDITION. Each component was unboxed and inspected at our quality station, verifying intact factory seals, zero shipping damage, and full authorization under our official ZxZ warranty.`}
                </p>

                {certData.inspectionSummary && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 italic">
                    <span className="font-bold text-slate-800 not-italic uppercase text-[10px] block mb-0.5">
                      {lang === "es" ? "Resumen de Inspección Técnica:" : "Technical Inspection Summary:"}
                    </span>
                    &ldquo;{certData.inspectionSummary}&rdquo;
                  </div>
                )}
              </div>

              {/* Verified Items Table */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold uppercase tracking-wider text-slate-900 text-[11px] flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-[#0052CC]" />
                    <span>{lang === "es" ? "Componentes Inspeccionados y Aprobados:" : "Inspected & Approved Components:"}</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    {itemsList.length} {itemsList.length === 1 ? "ítem" : "ítems"}
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 shadow-2xs">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-100/80 text-[10px] font-black uppercase tracking-wider text-slate-700 border-b border-slate-200">
                        <th className="p-2.5 border-r border-slate-200 w-10 text-center">#</th>
                        <th className="p-2.5 border-r border-slate-200">
                          {lang === "es" ? "Descripción del Producto" : "Product Description"}
                        </th>
                        <th className="p-2.5 border-r border-slate-200 w-32">
                          {lang === "es" ? "SKU / Parte" : "SKU / Part #"}
                        </th>
                        <th className="p-2.5 border-r border-slate-200 w-16 text-center">
                          {lang === "es" ? "Cant." : "Qty"}
                        </th>
                        <th className="p-2.5 text-center w-36">
                          {lang === "es" ? "Condición" : "Condition"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {itemsList.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition text-[11px]">
                          <td className="p-2.5 border-r border-slate-100 text-center font-mono font-bold text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="p-2.5 border-r border-slate-100 font-semibold text-slate-900">
                            {item.title || item.name || "Componente ZxZ"}
                          </td>
                          <td className="p-2.5 border-r border-slate-100 font-mono text-[10px] text-slate-600">
                            {item.sku || "ZXZ-ACC"}
                          </td>
                          <td className="p-2.5 border-r border-slate-100 text-center font-mono font-bold text-slate-900">
                            {item.quantity || 1}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold whitespace-nowrap shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{lang === "es" ? "ESTADO PERFECTO" : "PERFECT"}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Inspection Sign-off & Quality Stamp */}
              <div className="pt-6 border-t-2 border-slate-900/15 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center text-xs">
                {/* Warehouse Location Info */}
                <div className="space-y-1">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                    {lang === "es" ? "Bodega Central & Taller:" : "Central Warehouse & Workshop:"}
                  </span>
                  <p className="font-semibold text-slate-900 text-[11px] leading-snug">
                    {COMPANY_CONFIG.location.address}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Tel: {COMPANY_CONFIG.contact.phone}
                  </p>
                </div>

                {/* Official Inspection Stamp Emblem */}
                <div className="flex justify-center my-2 sm:my-0">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-emerald-600 bg-emerald-50/70 p-1 flex flex-col items-center justify-center text-center shadow-xs rotate-[-3deg]">
                    <Award className="w-5 h-5 text-emerald-700 shrink-0" />
                    <span className="text-[8px] font-black uppercase tracking-wider text-emerald-950 leading-tight mt-0.5">
                      CALIDAD APROBADA
                    </span>
                    <span className="text-[7.5px] font-mono font-bold text-emerald-700 leading-tight">
                      ZXZ MODS CR
                    </span>
                    <span className="text-[7px] font-bold text-emerald-900 tracking-widest uppercase mt-0.5">
                      VERIFICADO
                    </span>
                  </div>
                </div>

                {/* Technician Inspector Sign-off */}
                <div className="text-left sm:text-right space-y-1">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">
                    {lang === "es" ? "Inspector Técnico:" : "Technical Inspector:"}
                  </span>
                  <p className="font-bold text-slate-900 text-xs">
                    {inspectorDisplayName}
                  </p>
                  {certData.certifiedBy && certData.certifiedBy.includes("@") && (
                    <p className="text-[10px] font-mono text-slate-500">
                      {certData.certifiedBy}
                    </p>
                  )}
                  <p className="text-[9.5px] font-mono text-emerald-700 font-bold uppercase tracking-wider">
                    SELLO DE GARANTÍA OFICIAL ZXZ
                  </p>
                </div>
              </div>

              {/* Certificate Security Footer */}
              <div className="pt-4 border-t border-slate-200 text-[9px] text-slate-400 font-mono flex flex-col sm:flex-row items-center justify-between gap-1.5">
                <span>{COMPANY_CONFIG.legalName} • Documento Digital Oficial</span>
                <span className="font-bold text-slate-600">ID: {certData.certificationNumber}</span>
                <span>Inspección Técnica Certificada</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
