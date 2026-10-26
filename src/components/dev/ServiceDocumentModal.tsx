"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { formatCRC } from "@/lib/i18n";
import { COMPANY_CONFIG } from "@/config/company";
import { normalizeServiceCategory, NormalizedServiceCategory } from "@/lib/orderWorkflow";
import {
  Printer,
  X,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Wrench,
  AlertTriangle,
  ClipboardCheck,
  Save,
  Check,
  MapPin,
  Edit3,
  Key,
} from "lucide-react";

export interface VehicleChecksData {
  keysReceived?: boolean;
  spareKeyReceived?: boolean;
  keysCount?: string | number;
  fuelLevel?: "E" | "1/4" | "1/2" | "3/4" | "F" | "";
  noPersonalBelongings?: boolean;
  belongingsNotes?: string;
  batteryFunctional?: boolean;
  parkingBrakeFunctional?: boolean;
  tiresGoodCondition?: boolean;
  noVisibleLeaks?: boolean;
  documentsInVehicle?: boolean;
  keysReturnedToOwner?: boolean;
}

export interface ServiceDocumentData {
  ownerName?: string;
  ownerCedula?: string;
  contactPhone?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: string;
  licensePlate?: string;
  vin?: string;
  vehicleColor?: string;
  mileageOrHours?: string;
  receiverStaffName?: string;
  installerStaffName?: string;
  driverStaffName?: string;
  preExistingDamages?: string;
  freeWashRequested?: boolean;
  deliveryAddress?: string;
  pickupOriginAddress?: string;
  distanceKm?: number;
  completionNotes?: string;
  checklist?: {
    allPartsAccounted?: boolean;
    packagesIntact?: boolean;
    boltsTorqued?: boolean;
    electricalTightened?: boolean;
    testDriven?: boolean;
    cleanWorkArea?: boolean;
    originalPartsReturned?: boolean;
  };
  vehicleChecks?: VehicleChecksData;
  receptionDate?: string;
  handoverDate?: string;
  garageVehicle?: any;
}

interface ServiceDocumentModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated?: (updatedOrder: any) => void;
}

type DocumentCategory =
  | "only_installation"
  | "home_installation"
  | "pickup"
  | "delivery"
  | "quality_certificate";

export function ServiceDocumentModal({
  order,
  isOpen,
  onClose,
  onOrderUpdated,
}: ServiceDocumentModalProps) {
  const { lang, t } = useLanguage();

  const serviceCategory: NormalizedServiceCategory = useMemo(() => {
    return normalizeServiceCategory(order?.serviceType);
  }, [order?.serviceType]);

  // Map serviceCategory to initial document category
  const initialCategory: DocumentCategory = useMemo(() => {
    if (serviceCategory === "delivery") return "delivery";
    if (serviceCategory === "home_install") return "home_installation";
    if (serviceCategory === "pickup") return "pickup";
    return "only_installation";
  }, [serviceCategory]);

  const [activeCategory, setActiveCategory] = useState<DocumentCategory>(initialCategory);
  const [activeSubDoc, setActiveSubDoc] = useState<string>("reception"); // 'reception' | 'handover' | 'transport_auth' | 'transport_return'
  const [showEditDrawer, setShowEditDrawer] = useState<boolean>(false);
  const [savingDocData, setSavingDocData] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Synchronize category to the exact selected service document
  useEffect(() => {
    setActiveCategory(initialCategory);
    if (initialCategory === "pickup") {
      setActiveSubDoc("transport_auth");
    } else if (initialCategory === "only_installation") {
      setActiveSubDoc("reception");
    }
  }, [initialCategory, order?.id]);

  // Parse existing documents data from order
  const existingDocData: ServiceDocumentData = useMemo(() => {
    if (!order?.serviceDocumentsJson) return {};
    try {
      return typeof order.serviceDocumentsJson === "string"
        ? JSON.parse(order.serviceDocumentsJson)
        : order.serviceDocumentsJson;
    } catch {
      return {};
    }
  }, [order?.serviceDocumentsJson]);

  // Resolve garage vehicle from order, user, or existing documents (Zero mock data)
  const garageVehicle = useMemo(() => {
    if (order?.garageVehicle) return order.garageVehicle;
    if (existingDocData?.garageVehicle) return existingDocData.garageVehicle;
    if (order?.serviceDocumentsJson) {
      try {
        const parsed =
          typeof order.serviceDocumentsJson === "string"
            ? JSON.parse(order.serviceDocumentsJson)
            : order.serviceDocumentsJson;
        if (parsed?.garageVehicle) return parsed.garageVehicle;
      } catch {}
    }
    return null;
  }, [order?.garageVehicle, existingDocData?.garageVehicle, order?.serviceDocumentsJson]);

  // Parse items from order
  const orderItems: any[] = useMemo(() => {
    if (!order?.itemsJson) return [];
    try {
      const parsed = typeof order.itemsJson === "string" ? JSON.parse(order.itemsJson) : order.itemsJson;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [order?.itemsJson]);

  // Parse certification data from order
  const certData: any = useMemo(() => {
    if (!order?.zxzCertificationJson) {
      return {
        certificationNumber: `ZXZ-CERT-${(order?.orderNumber || "ORD").replace(/[^A-Za-z0-9]/g, "")}`,
        certifiedAt: order?.updatedAt || order?.createdAt || new Date().toISOString(),
        certifiedBy: "Staff Técnico ZxZ Mods",
        status: "VERIFIED_OK",
        warehouseLocation: `Taller & Bodega Central ZxZ Mods, ${COMPANY_CONFIG.location.canton}, Costa Rica`,
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

  // Registered phone from system (client)
  const registeredPhone = useMemo(() => {
    let docPhone = "";
    if (order?.serviceDocumentsJson) {
      try {
        const parsed = typeof order.serviceDocumentsJson === "string" ? JSON.parse(order.serviceDocumentsJson) : order.serviceDocumentsJson;
        docPhone = parsed?.contactPhone || parsed?.phone || "";
      } catch {}
    }
    return (
      order?.customerPhone ||
      docPhone ||
      order?.serviceSchedule?.clientPhone ||
      order?.user?.phoneNumber ||
      ""
    );
  }, [order?.customerPhone, order?.serviceDocumentsJson, order?.serviceSchedule?.clientPhone, order?.user?.phoneNumber]);

  // Form state
  const [formData, setFormData] = useState<ServiceDocumentData>({
    ownerName: "",
    ownerCedula: "",
    contactPhone: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    licensePlate: "",
    vin: "",
    vehicleColor: "",
    mileageOrHours: "",
    receiverStaffName: "",
    installerStaffName: "",
    driverStaffName: "",
    preExistingDamages: "",
    freeWashRequested: undefined,
    deliveryAddress: "",
    pickupOriginAddress: "",
    completionNotes: "",
    checklist: {
      allPartsAccounted: false,
      packagesIntact: false,
      boltsTorqued: false,
      electricalTightened: false,
      testDriven: false,
      cleanWorkArea: false,
      originalPartsReturned: false,
    },
    vehicleChecks: {
      keysReceived: true,
      spareKeyReceived: false,
      keysCount: 1,
      fuelLevel: "",
      noPersonalBelongings: true,
      belongingsNotes: "",
      batteryFunctional: true,
      parkingBrakeFunctional: true,
      tiresGoodCondition: true,
      noVisibleLeaks: true,
      documentsInVehicle: true,
      keysReturnedToOwner: false,
    },
  });

  // Sync state when order changes (Zero Mock Data Policy: Never insert CFMOTO/ZForce unless registered)
  useEffect(() => {
    if (order) {
      const parsed = existingDocData;
      const initialMake = parsed.vehicleMake !== undefined ? parsed.vehicleMake : (garageVehicle?.brandName || "");
      const initialModel = parsed.vehicleModel !== undefined ? parsed.vehicleModel : (garageVehicle?.modelName || "");
      const initialYear = parsed.vehicleYear !== undefined ? parsed.vehicleYear : (garageVehicle?.year ? String(garageVehicle.year) : "");
      const initialColor = parsed.vehicleColor !== undefined ? parsed.vehicleColor : (garageVehicle?.color || "");

      setFormData({
        ownerName: parsed.ownerName || order.customerName || order.user?.displayName || "",
        ownerCedula: parsed.ownerCedula || "",
        contactPhone: parsed.contactPhone || registeredPhone,
        vehicleMake: initialMake,
        vehicleModel: initialModel,
        vehicleYear: initialYear,
        licensePlate: parsed.licensePlate || "",
        vin: parsed.vin || "",
        vehicleColor: initialColor,
        mileageOrHours: parsed.mileageOrHours || "",
        receiverStaffName: parsed.receiverStaffName || "",
        installerStaffName: parsed.installerStaffName || "",
        driverStaffName: parsed.driverStaffName || "",
        preExistingDamages: parsed.preExistingDamages || "",
        freeWashRequested:
          typeof parsed.freeWashRequested === "boolean" ? parsed.freeWashRequested : undefined,
        deliveryAddress: parsed.deliveryAddress || order.shippingAddress || "",
        pickupOriginAddress: parsed.pickupOriginAddress || order.shippingAddress || "",
        completionNotes: parsed.completionNotes || "",
        checklist: {
          allPartsAccounted: parsed.checklist?.allPartsAccounted ?? false,
          packagesIntact: parsed.checklist?.packagesIntact ?? false,
          boltsTorqued: parsed.checklist?.boltsTorqued ?? false,
          electricalTightened: parsed.checklist?.electricalTightened ?? false,
          testDriven: parsed.checklist?.testDriven ?? false,
          cleanWorkArea: parsed.checklist?.cleanWorkArea ?? false,
          originalPartsReturned: parsed.checklist?.originalPartsReturned ?? false,
        },
        vehicleChecks: {
          keysReceived: parsed.vehicleChecks?.keysReceived ?? true,
          spareKeyReceived: parsed.vehicleChecks?.spareKeyReceived ?? false,
          keysCount: parsed.vehicleChecks?.keysCount ?? 1,
          fuelLevel: parsed.vehicleChecks?.fuelLevel ?? "",
          noPersonalBelongings: parsed.vehicleChecks?.noPersonalBelongings ?? true,
          belongingsNotes: parsed.vehicleChecks?.belongingsNotes ?? "",
          batteryFunctional: parsed.vehicleChecks?.batteryFunctional ?? true,
          parkingBrakeFunctional: parsed.vehicleChecks?.parkingBrakeFunctional ?? true,
          tiresGoodCondition: parsed.vehicleChecks?.tiresGoodCondition ?? true,
          noVisibleLeaks: parsed.vehicleChecks?.noVisibleLeaks ?? true,
          documentsInVehicle: parsed.vehicleChecks?.documentsInVehicle ?? true,
          keysReturnedToOwner: parsed.vehicleChecks?.keysReturnedToOwner ?? false,
        },
        receptionDate: parsed.receptionDate || new Date().toISOString(),
        handoverDate: parsed.handoverDate || new Date().toISOString(),
      });
      setActiveCategory(initialCategory);
      if (initialCategory === "pickup") setActiveSubDoc("transport_auth");
      else if (initialCategory === "only_installation") setActiveSubDoc("reception");
    }
  }, [order, existingDocData, initialCategory, garageVehicle, registeredPhone]);

  if (!isOpen || !order) return null;

  // Handle save to DB
  const handleSaveDocData = async () => {
    setSavingDocData(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/sys/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceDocumentsJson: JSON.stringify(formData),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccess(true);
        if (onOrderUpdated && data.order) {
          onOrderUpdated(data.order);
        }
        setTimeout(() => setSaveSuccess(false), 3500);
      } else {
        alert(data.error || "Error al guardar información del documento");
      }
    } catch (err: any) {
      console.error("Error saving service doc data:", err);
      alert("Error de conexión al guardar");
    } finally {
      setSavingDocData(false);
    }
  };

  // ROBUST ISOLATED IFRAME PRINT ENGINE (Zero offset, letter portrait, sharp blanks)
  const handlePrint = () => {
    const printElement = document.getElementById("zxz-service-document-sheet");
    if (!printElement) {
      window.print();
      return;
    }

    let iframe = document.getElementById("zxz-print-iframe") as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "zxz-print-iframe";
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
          <title>ZxZ Mods - Documento de Servicio #${order.orderNumber}</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          ${styleTags}
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: 100% !important;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            #isolated-print-sheet {
              width: 100% !important;
              max-width: 100% !important;
              height: 280mm !important;
              min-height: 280mm !important;
              max-height: 280mm !important;
              overflow: hidden !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              box-shadow: none !important;
              border: none !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              box-sizing: border-box !important;
            }
            .no-print {
              display: none !important;
            }
            .avoid-break {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            * {
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          <div id="isolated-print-sheet">
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

  const docDateStr = new Date().toLocaleDateString(lang === "es" ? "es-CR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Display vehicle info or empty underline placeholder
  const hasVehicle = Boolean(formData.vehicleMake || formData.vehicleModel);
  const vehicleText = hasVehicle
    ? `${formData.vehicleMake} ${formData.vehicleModel} ${formData.vehicleYear ? `(${formData.vehicleYear})` : ""}`.trim()
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[95vh]">
        {/* Top Header Bar (No print) */}
        <div className="no-print p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight">
                  Documentos Físicos de Servicio & Taller
                </h2>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-slate-700">
                  #{order.orderNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Formatos físicos para imprimir y rellenar a mano con lapicero por el personal técnico.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setShowEditDrawer(!showEditDrawer)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                showEditDrawer
                  ? "bg-amber-500 text-slate-950 font-black"
                  : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t.serviceDocsFillDetails}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t.serviceDocsPrintBtn}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRIMARY DOCUMENT SELECTOR TABS - RESTRICTED TO ORDER SERVICE */}
        <div className="no-print bg-slate-100 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* 1. Solo Instalación */}
            {initialCategory === "only_installation" && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("only_installation");
                  setActiveSubDoc("reception");
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 bg-slate-900 text-white shadow-xs cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                <span>Solo Instalación (Taller)</span>
              </button>
            )}

            {/* 2. Instalación a Domicilio */}
            {initialCategory === "home_installation" && (
              <button
                type="button"
                onClick={() => setActiveCategory("home_installation")}
                className="px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 bg-slate-900 text-white shadow-xs cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Instalación a Domicilio</span>
              </button>
            )}

            {/* 3. Pick-up de Vehículo */}
            {initialCategory === "pickup" && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("pickup");
                  setActiveSubDoc("transport_auth");
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 bg-slate-900 text-white shadow-xs cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Pick-up de Vehículo (Remolque)</span>
              </button>
            )}

            {/* 4. Entrega de Productos / Delivery */}
            {initialCategory === "delivery" && (
              <button
                type="button"
                onClick={() => setActiveCategory("delivery")}
                className="px-3.5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 bg-slate-900 text-white shadow-xs cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Entrega de Productos (Delivery)</span>
              </button>
            )}
          </div>

          {/* Indicator showing document is locked to the selected service */}
          <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>
              {lang === "es"
                ? `Documento exclusivo para servicio: ${
                    serviceCategory === "pickup"
                      ? "Pick-up de Vehículo"
                      : serviceCategory === "delivery"
                      ? "Entrega / Delivery"
                      : serviceCategory === "home_install"
                      ? "Instalación a Domicilio"
                      : "Instalación en Taller"
                  }`
                : `Document restricted to service: ${
                    serviceCategory === "pickup"
                      ? "Vehicle Pick-up"
                      : serviceCategory === "delivery"
                      ? "Product Delivery"
                      : serviceCategory === "home_install"
                      ? "Home Installation"
                      : "Shop Installation"
                  }`}
            </span>
          </div>
        </div>

        {/* SUBTABS for Categories with multiple physical sheets */}
        {activeCategory === "only_installation" && (
          <div className="no-print bg-slate-50 px-5 py-2 border-b border-slate-200 flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Hoja de Trabajo:</span>
            <button
              type="button"
              onClick={() => setActiveSubDoc("reception")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubDoc === "reception"
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              1. Hoja de Recepción & Daños Previos
            </button>
            <button
              type="button"
              onClick={() => setActiveSubDoc("handover")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubDoc === "handover"
                  ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              2. Checklist Técnico & Entrega Final
            </button>
          </div>
        )}

        {activeCategory === "pickup" && (
          <div className="no-print bg-slate-50 px-5 py-2 border-b border-slate-200 flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Hoja de Trabajo:</span>
            <button
              type="button"
              onClick={() => setActiveSubDoc("transport_auth")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubDoc === "transport_auth"
                  ? "bg-indigo-600 text-white font-black shadow-xs"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              1. Autorización de Retiro & Traslado
            </button>
            <button
              type="button"
              onClick={() => setActiveSubDoc("transport_return")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubDoc === "transport_return"
                  ? "bg-indigo-600 text-white font-black shadow-xs"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              2. Acta de Devolución al Propietario
            </button>
          </div>
        )}

        {/* Optional Edit Drawer to pre-fill known fields */}
        {showEditDrawer && (
          <div className="no-print bg-slate-50 border-b border-slate-200 p-5 space-y-4 max-h-72 overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pre-llenar Datos para Impresión (Opcional)</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Los campos vacíos se imprimirán como líneas en blanco para escribir a mano con lapicero.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {saveSuccess && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>Guardado exitoso</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveDocData}
                  disabled={savingDocData}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingDocData ? t.devSaving : "Guardar en Orden"}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre Propietario / Cliente</label>
                <input
                  type="text"
                  value={formData.ownerName || ""}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  placeholder="Nombre completo"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Cédula / Identificación</label>
                <input
                  type="text"
                  value={formData.ownerCedula || ""}
                  onChange={(e) => setFormData({ ...formData, ownerCedula: e.target.value })}
                  placeholder="Ej: 1-1234-0567"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Teléfono Registrado</label>
                <input
                  type="text"
                  value={formData.contactPhone || ""}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder={registeredPhone || "+506 8888-8888"}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Número de Placa</label>
                <input
                  type="text"
                  value={formData.licensePlate || ""}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                  placeholder="Ej: UTV-482910"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Marca del Vehículo</label>
                <input
                  type="text"
                  value={formData.vehicleMake || ""}
                  onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })}
                  placeholder="Marca (o dejar en blanco)"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Modelo del Vehículo</label>
                <input
                  type="text"
                  value={formData.vehicleModel || ""}
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  placeholder="Modelo (o dejar en blanco)"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Año</label>
                <input
                  type="text"
                  value={formData.vehicleYear || ""}
                  onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
                  placeholder="Año"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">VIN / Chasis</label>
                <input
                  type="text"
                  value={formData.vin || ""}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                  placeholder="17 dígitos de chasis"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Funcionario Receptor</label>
                <input
                  type="text"
                  value={formData.receiverStaffName || ""}
                  onChange={(e) => setFormData({ ...formData, receiverStaffName: e.target.value })}
                  placeholder="Nombre de quien recibe"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Técnico Instalador</label>
                <input
                  type="text"
                  value={formData.installerStaffName || ""}
                  onChange={(e) => setFormData({ ...formData, installerStaffName: e.target.value })}
                  placeholder="Técnico responsable"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Chofer / Transportista</label>
                <input
                  type="text"
                  value={formData.driverStaffName || ""}
                  onChange={(e) => setFormData({ ...formData, driverStaffName: e.target.value })}
                  placeholder="Chofer de plataforma"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
                />
              </div>

              <div className="flex flex-col justify-between">
                <label className="font-bold text-slate-700 block mb-1">Lavado de Cortesía Gratuito</label>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="radio"
                      name="freeWash"
                      checked={formData.freeWashRequested === undefined}
                      onChange={() => setFormData({ ...formData, freeWashRequested: undefined })}
                      className="accent-slate-900"
                    />
                    <span>En blanco (A mano)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="radio"
                      name="freeWash"
                      checked={formData.freeWashRequested === true}
                      onChange={() => setFormData({ ...formData, freeWashRequested: true })}
                      className="accent-slate-900"
                    />
                    <span>Sí solicita</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="radio"
                      name="freeWash"
                      checked={formData.freeWashRequested === false}
                      onChange={() => setFormData({ ...formData, freeWashRequested: false })}
                      className="accent-slate-900"
                    />
                    <span>No solicita</span>
                  </label>
                </div>
              </div>
            </div>

            {/* VEHICLE CHECKS & KEYS DRAWER CONTROLS */}
            <div className="mt-4 pt-3 border-t border-slate-200">
              <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5 mb-2.5">
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>Control de Llaves & Chequeos Técnicos del Vehículo</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.vehicleChecks?.keysReceived ?? true}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicleChecks: { ...prev.vehicleChecks, keysReceived: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded accent-slate-900"
                  />
                  <span className="font-semibold text-slate-800">Llave principal recibida</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.vehicleChecks?.spareKeyReceived ?? false}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicleChecks: { ...prev.vehicleChecks, spareKeyReceived: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded accent-slate-900"
                  />
                  <span className="font-semibold text-slate-800">Llave de repuesto recibida</span>
                </label>

                <div className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 bg-white">
                  <span className="font-semibold text-slate-700 text-xs shrink-0">Cant. llaves:</span>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.vehicleChecks?.keysCount ?? 1}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicleChecks: { ...prev.vehicleChecks, keysCount: Number(e.target.value) || 1 },
                      }))
                    }
                    className="w-16 bg-slate-50 border border-slate-200 rounded px-2 py-0.5 font-bold font-mono text-center"
                  />
                </div>

                <div className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 bg-white">
                  <span className="font-semibold text-slate-700 text-xs shrink-0">Combustible:</span>
                  <select
                    value={formData.vehicleChecks?.fuelLevel || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicleChecks: { ...prev.vehicleChecks, fuelLevel: e.target.value as any },
                      }))
                    }
                    className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 font-bold text-xs"
                  >
                    <option value="">En blanco (A mano)</option>
                    <option value="E">E (Vacío / Reserva)</option>
                    <option value="1/4">1/4 de tanque</option>
                    <option value="1/2">1/2 de tanque</option>
                    <option value="3/4">3/4 de tanque</option>
                    <option value="F">F (Tanque Lleno)</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.vehicleChecks?.noPersonalBelongings ?? true}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicleChecks: { ...prev.vehicleChecks, noPersonalBelongings: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded accent-slate-900"
                  />
                  <span className="font-semibold text-slate-800">Sin pertenencias en cabina</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.vehicleChecks?.batteryFunctional ?? true}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicleChecks: { ...prev.vehicleChecks, batteryFunctional: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded accent-slate-900"
                  />
                  <span className="font-semibold text-slate-800">Batería & encendido OK</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.vehicleChecks?.parkingBrakeFunctional ?? true}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicleChecks: { ...prev.vehicleChecks, parkingBrakeFunctional: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded accent-slate-900"
                  />
                  <span className="font-semibold text-slate-800">Freno estacionamiento OK</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.vehicleChecks?.tiresGoodCondition ?? true}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicleChecks: { ...prev.vehicleChecks, tiresGoodCondition: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded accent-slate-900"
                  />
                  <span className="font-semibold text-slate-800">Neumáticos & aros OK</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.vehicleChecks?.noVisibleLeaks ?? true}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicleChecks: { ...prev.vehicleChecks, noVisibleLeaks: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded accent-slate-900"
                  />
                  <span className="font-semibold text-slate-800">Sin fugas de fluidos</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.vehicleChecks?.documentsInVehicle ?? true}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicleChecks: { ...prev.vehicleChecks, documentsInVehicle: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded accent-slate-900"
                  />
                  <span className="font-semibold text-slate-800">Documentos a bordo</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 col-span-2">
                  <input
                    type="checkbox"
                    checked={formData.vehicleChecks?.keysReturnedToOwner ?? false}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        vehicleChecks: { ...prev.vehicleChecks, keysReturnedToOwner: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded accent-slate-900"
                  />
                  <span className="font-semibold text-slate-800">Llaves devueltas formalmente al propietario</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* DOCUMENT VIEWPORT */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-200/50 flex justify-center">
          <div
            id="zxz-service-document-sheet"
            className="w-full max-w-[800px] bg-white p-5 rounded-2xl shadow-md border border-slate-300 text-slate-950 font-sans flex flex-col justify-between overflow-hidden"
            style={{ minHeight: "280mm", height: "280mm", maxHeight: "280mm" }}
          >
            {/* OFFICIAL LETTERHEAD */}
            <div className="border-b-2 border-slate-900 pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shrink-0">
              <div>
                <span className="text-base sm:text-lg font-black tracking-tighter text-slate-950 uppercase font-mono block">
                  ZxZ Mods
                </span>
                <p className="text-[9.5px] font-bold text-slate-700 leading-tight">
                  Cédula Jurídica: {COMPANY_CONFIG.cedulaJuridica || "3-101-436132"} <span className="text-[8px] font-normal text-slate-500">({COMPANY_CONFIG.legalName})</span> • Taller Especializado SxS, UTV & ATV
                </p>
                <p className="text-[8.5px] text-slate-600 leading-tight">
                  {COMPANY_CONFIG.location.address} • Tel: {COMPANY_CONFIG.contact.phone} • WhatsApp: {COMPANY_CONFIG.contact.whatsappDisplay}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-block text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-slate-900 text-white tracking-widest">
                  DOCUMENTO FÍSICO A4
                </span>
                <p className="text-[11px] font-mono font-bold text-slate-900 mt-0.5">
                  ORDEN: <span className="font-black text-xs">#{order.orderNumber}</span>
                </p>
                <p className="text-[8.5px] text-slate-600 font-mono">EMISIÓN: {docDateStr}</p>
              </div>
            </div>

            {/* ============================================================== */}
            {/* 5. CERTIFICADO GLOBAL DE CALIDAD SIMPLIFICADO */}
            {/* ============================================================== */}
            {activeCategory === "quality_certificate" && (
              <div className="flex-1 flex flex-col justify-between my-2 space-y-3">
                <div className="text-center py-2.5 bg-emerald-50 rounded-xl border border-emerald-400 space-y-1 shrink-0">
                  <span className="text-[9.5px] font-mono font-bold uppercase tracking-widest text-emerald-800 block">
                    DEPARTAMENTO DE CONTROL TÉCNICO & BODEGA CENTRAL
                  </span>
                  <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-emerald-950">
                    CERTIFICADO OFICIAL DE CALIDAD DE PRODUCTO
                  </h1>
                  <p className="text-[10.5px] font-bold text-emerald-700">
                    CONSTANCIA DE ARRIBO DE MERCADERÍA EN ESTADO PERFECTO
                  </p>
                </div>

                {/* Metadata Cards */}
                <div className="grid grid-cols-4 gap-2.5 text-[10px] shrink-0">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[8.5px] font-bold text-slate-500 uppercase block">Certificado #</span>
                    <span className="font-mono font-black text-emerald-800 text-[11px] truncate block">
                      {certData.certificationNumber}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[8.5px] font-bold text-slate-500 uppercase block">Orden</span>
                    <span className="font-mono font-black text-slate-900 text-[11px] truncate block">
                      #{order.orderNumber}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[8.5px] font-bold text-slate-500 uppercase block">Cliente</span>
                    <span className="font-bold text-slate-900 truncate block text-[10.5px]">
                      {formData.ownerName || order.customerName || "Cliente Registrado"}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300">
                    <span className="text-[8.5px] font-bold text-emerald-800 uppercase block">Condición</span>
                    <span className="font-black text-emerald-700 flex items-center gap-1 text-[10.5px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ESTADO PERFECTO</span>
                    </span>
                  </div>
                </div>

                {/* Simplified Official Statement */}
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-300 text-[10px] text-slate-800 leading-relaxed space-y-1.5 shrink-0">
                  <p className="font-black text-emerald-950 uppercase tracking-wide flex items-center gap-2 text-[10.5px]">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Declaración Oficial de Inspección y Conformidad:</span>
                  </p>
                  <p>
                    ZxZ Mods Costa Rica S.A. certifica formalmente que la totalidad de los productos, repuestos y accesorios de la orden <strong>#{order.orderNumber}</strong> han arribado a nuestras instalaciones en <strong>ESTADO PERFECTO</strong>. Cada ítem fue desempaquetado e inspeccionado individualmente en nuestra bodega técnica en Santa Ana, constatando sellos de fábrica intactos, especificaciones correctas y ausencia absoluta de averías de traslado o defectos de manufactura.
                  </p>
                </div>

                {/* Product List */}
                <div className="flex-1 flex flex-col justify-start space-y-1.5 text-[9.5px]">
                  <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-800 block">
                    Productos Inspeccionados y Aprobados:
                  </span>
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-slate-100 text-[9px] font-black uppercase text-slate-800 border-b border-slate-300">
                          <th className="py-1.5 px-2.5 border-r border-slate-300 w-8 text-center">#</th>
                          <th className="py-1.5 px-2.5 border-r border-slate-300">Descripción del Producto</th>
                          <th className="py-1.5 px-2.5 border-r border-slate-300 w-24">SKU</th>
                          <th className="py-1.5 px-2.5 border-r border-slate-300 w-12 text-center">Cant.</th>
                          <th className="py-1.5 px-2.5 text-center w-28">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-3 px-2 text-center text-slate-500 italic">
                              Productos verificados de la orden.
                            </td>
                          </tr>
                        ) : (
                          orderItems.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-200 text-[9.5px]">
                              <td className="py-1.5 px-2.5 border-r border-slate-300 text-center font-mono font-bold text-slate-500">
                                {idx + 1}
                              </td>
                              <td className="py-1.5 px-2.5 border-r border-slate-300 font-semibold text-slate-900 truncate max-w-[280px]">
                                {item.title || item.name || "Repuesto / Accesorio SxS"}
                              </td>
                              <td className="py-1.5 px-2.5 border-r border-slate-300 font-mono text-[9px] text-slate-700">
                                {item.sku || "ZXZ-ACC"}
                              </td>
                              <td className="py-1.5 px-2.5 border-r border-slate-300 text-center font-mono font-bold">
                                {item.quantity || 1}
                              </td>
                              <td className="py-1.5 px-2.5 text-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>VERIFICADO OK</span>
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sello y Firma */}
                <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-6 text-[10px] avoid-break mt-auto shrink-0">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Bodega & Taller Central:</span>
                    <p className="font-bold text-slate-900 leading-tight">{COMPANY_CONFIG.location.address}</p>
                    <p className="text-[9px] text-slate-500">
                      Tel: {COMPANY_CONFIG.contact.phone} • WhatsApp: {COMPANY_CONFIG.contact.whatsappDisplay}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase block">Inspector Responsable:</span>
                    <p className="font-bold text-slate-900 text-[11px]">
                      {certData.certifiedBy || "Taller Técnico ZxZ Mods"}
                    </p>
                    <p className="text-[9px] font-mono text-emerald-700 font-bold">
                      SELLO DE GARANTÍA OFICIAL ZXZ MODS COSTA RICA
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* PHYSICAL SERVICE DOCUMENTS WITH WRITE-IN BLANKS */}
            {/* ============================================================== */}
            {activeCategory !== "quality_certificate" && (
              <div className="flex-1 flex flex-col justify-between my-1 space-y-2">
                {/* Document Main Heading */}
                <div className="text-center py-1.5 px-2 bg-slate-100 rounded-lg border border-slate-300 shrink-0">
                  <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                    {activeCategory === "only_installation" &&
                      activeSubDoc === "reception" &&
                      "HOJA DE RECEPCIÓN TÉCNICA E INSPECCIÓN DE INGRESO A TALLER"}
                    {activeCategory === "only_installation" &&
                      activeSubDoc === "handover" &&
                      "ACTA DE ENTREGA DE VEHÍCULO Y CONTROL DE CALIDAD TÉCNICO"}
                    {activeCategory === "home_installation" &&
                      "CONTRATO DE SERVICIO A DOMICILIO Y ACTA DE CONFORMIDAD EN SITIO"}
                    {activeCategory === "pickup" &&
                      activeSubDoc === "transport_auth" &&
                      "AUTORIZACIÓN DE TRASLADO Y CUSTODIA EN PLATAFORMA / REMOLQUE"}
                    {activeCategory === "pickup" &&
                      activeSubDoc === "transport_return" &&
                      "ACTA DE RETORNO Y ENTREGA FINAL DE VEHÍCULO TRASLADADO"}
                    {activeCategory === "delivery" &&
                      "MANIFIESTO DE DESPACHO, ENCOMIENDA Y RECEPCIÓN DE MERCADERÍA"}
                  </h1>
                  <p className="text-[8.5px] font-medium text-slate-600">
                    Documento oficial con validez jurídica vinculante bajo el Código de Comercio de Costa Rica (Ley N° 3284)
                  </p>
                </div>

                {/* UNIFIED HIGH-DENSITY SECTION 1: DATOS DEL CLIENTE Y VEHÍCULO */}
                <div className="border border-slate-300 rounded-lg overflow-hidden text-[9px] shrink-0">
                  <div className="bg-slate-100 px-2.5 py-1 border-b border-slate-300 flex items-center justify-between">
                    <span className="font-black uppercase tracking-wider text-slate-800 text-[8.5px]">
                      1. Identificación del Propietario / Cliente y Vehículo
                    </span>
                    {garageVehicle && (
                      <span className="text-[8px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        Vehículo Registrado en Garaje
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200">
                    <div className="p-1.5">
                      <span className="text-[8px] font-bold text-slate-500 uppercase block">Propietario / Cliente:</span>
                      <span className="font-bold text-slate-900 block truncate text-[9.5px]">
                        {formData.ownerName || "______________________________"}
                      </span>
                    </div>
                    <div className="p-1.5">
                      <span className="text-[8px] font-bold text-slate-500 uppercase block">Cédula / Identificación:</span>
                      <span className="font-mono font-bold text-slate-900 block truncate text-[9.5px]">
                        {formData.ownerCedula || "____________________"}
                      </span>
                    </div>
                    <div className="p-1.5">
                      <span className="text-[8px] font-bold text-slate-500 uppercase block">Teléfono Registrado:</span>
                      <span className="font-mono font-bold text-slate-900 block truncate text-[9.5px]">
                        {formData.contactPhone || registeredPhone || "____________________"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 divide-x divide-slate-200 border-b border-slate-200">
                    <div className="p-1.5 col-span-2">
                      <span className="text-[8px] font-bold text-slate-500 uppercase block">Vehículo (Marca / Modelo / Año):</span>
                      <span className="font-bold text-slate-900 block truncate text-[9.5px]">
                        {vehicleText || "____________________________________"}
                      </span>
                    </div>
                    <div className="p-1.5">
                      <span className="text-[8px] font-bold text-slate-500 uppercase block">Placa / Matrícula:</span>
                      <span className="font-mono font-bold text-slate-900 block text-[9.5px]">
                        {formData.licensePlate || "______________"}
                      </span>
                    </div>
                    <div className="p-1.5">
                      <span className="text-[8px] font-bold text-slate-500 uppercase block">Color:</span>
                      <span className="font-bold text-slate-900 block text-[9.5px]">
                        {formData.vehicleColor || "______________"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200">
                    <div className="p-1.5 col-span-2">
                      <span className="text-[8px] font-bold text-slate-500 uppercase block">Nº de Chasis / VIN (17 Dígitos):</span>
                      <span className="font-mono font-bold text-slate-900 block tracking-wider text-[9.5px]">
                        {formData.vin || "____________________________________________"}
                      </span>
                    </div>
                    <div className="p-1.5">
                      <span className="text-[8px] font-bold text-slate-500 uppercase block">Horas Motor / Kilometraje:</span>
                      <span className="font-mono font-bold text-slate-900 block text-[9.5px]">
                        {formData.mileageOrHours ? `${formData.mileageOrHours} Hrs / Km` : "__________________ Hrs/Km"}
                      </span>
                    </div>
                  </div>

                  <div className="p-1.5">
                    <span className="text-[8px] font-bold text-slate-500 uppercase block">
                      Dirección Registrada / Destino de Servicio:
                    </span>
                    <span className="font-medium text-slate-900 block truncate text-[9px]">
                      {formData.deliveryAddress || order.shippingAddress || "________________________________________________________________________________"}
                    </span>
                  </div>
                </div>

                {/* SECTION 2: DETALLE DE PRODUCTOS, COMBOS & ACCESORIOS */}
                <div className="border border-slate-300 rounded-lg overflow-hidden text-[9px] shrink-0">
                  <div className="bg-slate-100 px-2.5 py-1 border-b border-slate-300 flex items-center justify-between">
                    <span className="font-black uppercase tracking-wider text-slate-800 text-[8.5px]">
                      2. Piezas, Accesorios & Combos Contratados
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[8.5px]">Total Contratado:</span>
                      <span className="font-black font-mono text-slate-900 text-[9.5px]">
                        {formatCRC(order.totalCRC || 0)}
                      </span>
                    </div>
                  </div>
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50 text-[8px] font-black uppercase text-slate-700 border-b border-slate-200">
                        <th className="py-1 px-2.5 border-r border-slate-200 w-8 text-center">#</th>
                        <th className="py-1 px-2.5 border-r border-slate-200">Descripción del Accesorio / Repuesto</th>
                        <th className="py-1 px-2.5 border-r border-slate-200 w-24">SKU</th>
                        <th className="py-1 px-2.5 border-r border-slate-200 w-12 text-center">Cant.</th>
                        <th className="py-1 px-2.5 text-center w-20">Modalidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-1.5 px-2.5 text-center text-slate-500 italic">
                            Productos asociados a la orden #{order.orderNumber}.
                          </td>
                        </tr>
                      ) : (
                        orderItems.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-200 text-[8.5px]">
                            <td className="py-1 px-2.5 border-r border-slate-200 text-center font-mono font-bold text-slate-500">
                              {idx + 1}
                            </td>
                            <td className="py-1 px-2.5 border-r border-slate-200 font-semibold text-slate-900 truncate max-w-[280px]">
                              {item.title || item.name || "Accesorio SxS"}
                            </td>
                            <td className="py-1 px-2.5 border-r border-slate-200 font-mono text-[8px] text-slate-700">
                              {item.sku || "ZXZ-ACC"}
                            </td>
                            <td className="py-1 px-2.5 border-r border-slate-200 text-center font-mono font-bold">
                              {item.quantity || 1}
                            </td>
                            <td className="py-1 px-2.5 text-center text-[8px] font-bold">
                              {item.installation ? "En Taller" : "Solo Pieza"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ============================================================== */}
                {/* SECTION 3: SPECIFIC SERVICE CLAUSES & WRITE-IN HANDWRITING BOXES */}
                {/* ============================================================== */}

                {/* 1A. SOLO INSTALACIÓN: HOJA DE RECEPCIÓN */}
                {activeCategory === "only_installation" && activeSubDoc === "reception" && (
                  <div className="flex-1 flex flex-col justify-between space-y-1.5 text-[9px]">
                    {/* Vehicle Reception & Key Custody Checklist */}
                    <div className="border border-slate-300 p-2 rounded-lg bg-slate-50/70 space-y-1.5 shrink-0">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                        <span className="font-extrabold text-slate-900 uppercase text-[8.5px] flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-amber-600" />
                          <span>3. Custodia de Llaves & Chequeo Técnico de Ingreso</span>
                        </span>
                        <div className="flex items-center gap-2.5 font-mono font-bold text-[8.5px]">
                          <span>
                            [{formData.vehicleChecks?.keysReceived ? " X " : "\u00A0\u00A0\u00A0"}] Llaves Recibidas ({formData.vehicleChecks?.keysCount || 1} juego)
                          </span>
                          <span>
                            [{formData.vehicleChecks?.spareKeyReceived ? " X " : "\u00A0\u00A0\u00A0"}] Llave Repuesto
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[8px] font-mono border-b border-slate-200 pb-1 text-slate-800">
                        <div>[{formData.vehicleChecks?.batteryFunctional ? " X " : "\u00A0\u00A0\u00A0"}] Batería / Arranque OK</div>
                        <div>[{formData.vehicleChecks?.parkingBrakeFunctional ? " X " : "\u00A0\u00A0\u00A0"}] Freno Mano Operativo</div>
                        <div>[{formData.vehicleChecks?.tiresGoodCondition ? " X " : "\u00A0\u00A0\u00A0"}] Neumáticos / Aros OK</div>
                        <div>[{formData.vehicleChecks?.noVisibleLeaks ? " X " : "\u00A0\u00A0\u00A0"}] Sin Fugas Visibles</div>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                        <span className="font-bold text-slate-800 uppercase text-[8px]">
                          Combustible al Recibir:
                        </span>
                        <div className="flex items-center gap-3 font-mono font-bold text-[8.5px]">
                          <span>[{formData.vehicleChecks?.fuelLevel === "E" ? " X " : "\u00A0\u00A0\u00A0"}] E</span>
                          <span>[{formData.vehicleChecks?.fuelLevel === "1/4" ? " X " : "\u00A0\u00A0\u00A0"}] 1/4</span>
                          <span>[{formData.vehicleChecks?.fuelLevel === "1/2" ? " X " : "\u00A0\u00A0\u00A0"}] 1/2</span>
                          <span>[{formData.vehicleChecks?.fuelLevel === "3/4" ? " X " : "\u00A0\u00A0\u00A0"}] 3/4</span>
                          <span>[{formData.vehicleChecks?.fuelLevel === "F" ? " X " : "\u00A0\u00A0\u00A0"}] F</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="font-bold text-slate-800 uppercase text-[8px] shrink-0">
                          Pertenencias en Cabina:
                        </span>
                        <span className="font-mono text-[8px] shrink-0">
                          [{formData.vehicleChecks?.noPersonalBelongings ? " X " : "\u00A0\u00A0\u00A0"}] Sin objetos declarados
                        </span>
                        <span className="text-slate-400">|</span>
                        <span className="text-[8px] text-slate-600 truncate flex-1">
                          Detalle: {formData.vehicleChecks?.belongingsNotes || "____________________________________________________________________"}
                        </span>
                      </div>
                    </div>

                    {/* Pre-existing damages inspection */}
                    <div className="border border-slate-300 p-2 rounded-lg space-y-1 flex-1 flex flex-col justify-between">
                      <div className="flex items-center justify-between shrink-0">
                        <span className="font-extrabold uppercase text-slate-900 flex items-center gap-1.5 text-[8.5px]">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>4. Inspección Visual de Daños Previos en Recepción</span>
                        </span>
                        <span className="font-mono font-bold text-[8.5px] text-slate-800">
                          [ &nbsp; ] Sin daños aparentes
                        </span>
                      </div>
                      {formData.preExistingDamages ? (
                        <p className="font-semibold text-slate-900 bg-amber-50/70 p-1.5 border border-amber-200 rounded text-[8.5px]">
                          {formData.preExistingDamages}
                        </p>
                      ) : (
                        <div className="space-y-1.5 pt-0.5">
                          <div className="border-b border-slate-300 border-dashed h-4.5 w-full flex items-end">
                            <span className="text-[7.5px] text-slate-400 italic">Línea para notas / rayones / golpes:</span>
                          </div>
                          <div className="border-b border-slate-300 border-dashed h-4.5 w-full"></div>
                        </div>
                      )}
                    </div>

                    {/* Free wash courtesy check */}
                    <div className="border border-slate-300 px-2.5 py-1 rounded-lg bg-slate-50 flex items-center justify-between text-[8.5px] shrink-0">
                      <div>
                        <span className="font-extrabold text-slate-900">Lavado Exterior de Cortesía Gratuito:</span>
                        <span className="text-[8px] text-slate-500 ml-1">Incluido sin costo adicional con la orden.</span>
                      </div>
                      <div className="flex items-center gap-4 font-mono font-bold text-[9px]">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              freeWashRequested: prev.freeWashRequested === true ? undefined : true,
                            }))
                          }
                          className="cursor-pointer hover:text-emerald-700 transition-colors"
                          title="Clic para marcar / desmarcar"
                        >
                          [{formData.freeWashRequested === true ? " X " : "\u00A0\u00A0\u00A0"}] SÍ autoriza lavado
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              freeWashRequested: prev.freeWashRequested === false ? undefined : false,
                            }))
                          }
                          className="cursor-pointer hover:text-red-700 transition-colors"
                          title="Clic para marcar / desmarcar"
                        >
                          [{formData.freeWashRequested === false ? " X " : "\u00A0\u00A0\u00A0"}] NO autoriza lavado
                        </button>
                      </div>
                    </div>

                    {/* Legal liability release */}
                    <div className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[8px] leading-tight text-slate-600 space-y-0.5 shrink-0">
                      <p className="font-bold uppercase text-slate-800">
                        CUSTODIA MERCANTIL & EXONERACIÓN DE RESPONSABILIDAD (CÓDIGO DE COMERCIO DE COSTA RICA, LEY N° 3284):
                      </p>
                      <p>
                        El firmante declara ser propietario legítimo o apoderado facultado para autorizar la recepción y modificaciones. ZxZ Mods no responde por vicios mecánicos preexistentes ni objetos no inventariados. Se autorizan pruebas de carretera y calibración técnica.
                      </p>
                    </div>
                  </div>
                )}

                {/* 1B. SOLO INSTALACIÓN: HOJA DE CONTROL TÉCNICO Y ENTREGA */}
                {activeCategory === "only_installation" && activeSubDoc === "handover" && (
                  <div className="flex-1 flex flex-col justify-between space-y-1.5 text-[9px]">
                    <div className="p-2.5 rounded-lg border border-slate-300 bg-emerald-50/40 space-y-1.5 shrink-0">
                      <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                        <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>3. Checklist de Control Técnico del Mecánico:</span>
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 text-[8.5px]">
                        <div>[ &nbsp; ] 1. Torque y apriete de pernos de fábrica</div>
                        <div>[ &nbsp; ] 2. Conexiones eléctricas y arneses sellados</div>
                        <div>[ &nbsp; ] 3. Prueba de encendido y rodaje aprobada</div>
                        <div>[ &nbsp; ] 4. Limpieza de bahía y cabina completada</div>
                        <div>[ &nbsp; ] 5. Devolución de piezas originales al cliente</div>
                        <div className="font-bold text-slate-950">
                          [{formData.vehicleChecks?.keysReturnedToOwner ? " X " : "\u00A0\u00A0\u00A0"}] 6. Devolución formal de llaves del vehículo al cliente
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-300 p-2 rounded-lg space-y-1 flex-1 flex flex-col justify-between">
                      <span className="text-[8px] font-bold text-slate-700 uppercase block shrink-0">Observaciones Técnicas Finales:</span>
                      <div className="space-y-1.5 pt-0.5">
                        <div className="border-b border-slate-300 border-dashed h-4.5 w-full flex items-end">
                          <span className="text-[7.5px] text-slate-400 italic">Notas de instalación y pruebas de rodaje:</span>
                        </div>
                        <div className="border-b border-slate-300 border-dashed h-4.5 w-full"></div>
                      </div>
                    </div>

                    <div className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[8px] leading-tight text-slate-600 space-y-0.5 shrink-0">
                      <p className="font-bold uppercase text-slate-800">ACTA DE ENTREGA A ENTERA SATISFACCIÓN & GARANTÍA TÉCNICA:</p>
                      <p>
                        El propietario o representante declara haber inspeccionado el vehículo, comprobado el funcionamiento y recibido los trabajos a entera satisfacción. Rige garantía legal de 30 días sobre mano de obra según legislación mercantil de Costa Rica.
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. INSTALACIÓN A DOMICILIO */}
                {activeCategory === "home_installation" && (
                  <div className="flex-1 flex flex-col justify-between space-y-1.5 text-[9px]">
                    <div className="grid grid-cols-3 gap-2 border border-slate-300 bg-slate-50 p-2 rounded-lg shrink-0">
                      <div className="col-span-2">
                        <span className="text-[8px] font-bold text-slate-500 uppercase block">Dirección de Instalación en Sitio:</span>
                        <span className="font-semibold text-slate-900 block truncate text-[9px]">
                          {formData.deliveryAddress || order.shippingAddress || "________________________________________________"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase block">Mano de Obra Acordada:</span>
                        <span className="font-mono font-black text-slate-900 block text-[9.5px]">
                          {order.installationCostCRC ? formatCRC(order.installationCostCRC) : "Incluido en Total"}
                        </span>
                      </div>
                    </div>

                    <div className="border border-slate-300 p-2.5 rounded-lg bg-blue-50/30 space-y-1.5 shrink-0">
                      <span className="text-[8.5px] font-bold text-slate-900 uppercase block">
                        Comprobación Técnica en Sitio (Marcar por el Técnico Instalador):
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 text-[8.5px]">
                        <div>[ &nbsp; ] 1. Área nivelada y techada provista</div>
                        <div>[ &nbsp; ] 2. Fijación mecánica y soportes concluidos</div>
                        <div>[ &nbsp; ] 3. Prueba eléctrica y funcional en sitio aprobada</div>
                        <div>[ &nbsp; ] 4. Área de trabajo limpia y componentes originales entregados</div>
                      </div>
                    </div>

                    <div className="border border-slate-300 p-2 rounded-lg space-y-1 flex-1 flex flex-col justify-between">
                      <span className="text-[8px] font-bold text-slate-700 uppercase block shrink-0">Observaciones Técnicas en Sitio:</span>
                      <div className="space-y-1.5 pt-0.5">
                        <div className="border-b border-slate-300 border-dashed h-4.5 w-full flex items-end">
                          <span className="text-[7.5px] text-slate-400 italic">Notas de montaje y calibración en domicilio:</span>
                        </div>
                        <div className="border-b border-slate-300 border-dashed h-4.5 w-full"></div>
                      </div>
                    </div>

                    <div className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-[8px] leading-tight text-slate-600 space-y-0.5 shrink-0">
                      <p className="font-bold uppercase text-slate-800">CONDICIONES DEL SERVICIO TÉCNICO A DOMICILIO:</p>
                      <p>
                        El cliente garantiza acceso y condiciones físicas seguras. Concluida la prueba técnica conjunta, la firma al pie certifica la recepción de la instalación en domicilio a entera conformidad.
                      </p>
                    </div>
                  </div>
                )}

                {/* 3A. PICK-UP: AUTORIZACIÓN DE TRASLADO EN PLATAFORMA */}
                {activeCategory === "pickup" && activeSubDoc === "transport_auth" && (
                  <div className="flex-1 flex flex-col justify-between space-y-1.5 text-[9px]">
                    <div className="grid grid-cols-2 gap-2 border border-slate-300 bg-slate-50 p-2 rounded-lg shrink-0">
                      <div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase block">Punto de Retiro (Origen):</span>
                        <span className="font-semibold text-slate-900 block truncate text-[9px]">
                          {formData.pickupOriginAddress || order?.shippingAddress || "________________________________________________"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-slate-500 uppercase block">Destino del Traslado:</span>
                        <span className="font-semibold text-slate-900 block truncate text-[9px]">
                          Taller Central ZxZ Mods, Pozos de Santa Ana, San José
                        </span>
                      </div>
                    </div>

                    <div className="border border-slate-300 p-2 rounded-lg space-y-1.5 flex-1 flex flex-col justify-between">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1 shrink-0">
                        <span className="text-[8.5px] font-extrabold text-slate-900 uppercase flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-amber-600" />
                          <span>Custodia en Plataforma & Entrega de Llaves al Chofer:</span>
                        </span>
                        <div className="flex items-center gap-2.5 font-mono font-bold text-[8.5px]">
                          <span>[{formData.vehicleChecks?.keysReceived ? " X " : "\u00A0\u00A0\u00A0"}] Llaves entregadas ({formData.vehicleChecks?.keysCount || 1} juego)</span>
                          <span>[{formData.vehicleChecks?.spareKeyReceived ? " X " : "\u00A0\u00A0\u00A0"}] Llave repuesto</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[8px] font-mono border-b border-slate-200 pb-1 text-slate-800">
                        <div>[{formData.vehicleChecks?.parkingBrakeFunctional ? " X " : "\u00A0\u00A0\u00A0"}] Freno Mano & Posición P</div>
                        <div>[{formData.vehicleChecks?.tiresGoodCondition ? " X " : "\u00A0\u00A0\u00A0"}] 4 Fajas de Amarre en Ruedas</div>
                        <div>[{formData.vehicleChecks?.noPersonalBelongings ? " X " : "\u00A0\u00A0\u00A0"}] Sin Objetos Sueltos Cabina</div>
                      </div>

                      <div className="flex items-center justify-between border-b border-slate-200 pb-1 shrink-0">
                        <span className="text-[8px] font-bold text-slate-700 uppercase">
                          Combustible al Cargar en Plataforma:
                        </span>
                        <div className="flex items-center gap-3 font-mono font-bold text-[8.5px]">
                          <span>[{formData.vehicleChecks?.fuelLevel === "E" ? " X " : "\u00A0\u00A0\u00A0"}] E</span>
                          <span>[{formData.vehicleChecks?.fuelLevel === "1/4" ? " X " : "\u00A0\u00A0\u00A0"}] 1/4</span>
                          <span>[{formData.vehicleChecks?.fuelLevel === "1/2" ? " X " : "\u00A0\u00A0\u00A0"}] 1/2</span>
                          <span>[{formData.vehicleChecks?.fuelLevel === "3/4" ? " X " : "\u00A0\u00A0\u00A0"}] 3/4</span>
                          <span>[{formData.vehicleChecks?.fuelLevel === "F" ? " X " : "\u00A0\u00A0\u00A0"}] F</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] font-bold text-slate-600 uppercase block shrink-0">
                          Inspección de Daños Previos al Cargar en Plataforma:
                        </span>
                        <div className="space-y-1.5 pt-0.5">
                          <div className="border-b border-slate-300 border-dashed h-4.5 w-full flex items-end">
                            <span className="text-[7.5px] text-slate-400 italic">Estado exterior al momento de subir a plataforma:</span>
                          </div>
                          <div className="border-b border-slate-300 border-dashed h-4.5 w-full"></div>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-300 px-2.5 py-1 rounded-lg bg-slate-50 flex items-center justify-between text-[8.5px] shrink-0">
                      <span className="font-bold text-slate-800">Lavado de Cortesía Gratuito:</span>
                      <div className="flex items-center gap-4 font-mono font-bold text-[9px]">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              freeWashRequested: prev.freeWashRequested === true ? undefined : true,
                            }))
                          }
                          className="cursor-pointer hover:text-emerald-700 transition-colors"
                          title="Clic para marcar / desmarcar"
                        >
                          [{formData.freeWashRequested === true ? " X " : "\u00A0\u00A0\u00A0"}] SÍ autoriza
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              freeWashRequested: prev.freeWashRequested === false ? undefined : false,
                            }))
                          }
                          className="cursor-pointer hover:text-red-700 transition-colors"
                          title="Clic para marcar / desmarcar"
                        >
                          [{formData.freeWashRequested === false ? " X " : "\u00A0\u00A0\u00A0"}] NO desea lavado
                        </button>
                      </div>
                    </div>

                    <div className="p-1.5 rounded-lg border border-slate-200 bg-slate-100 text-[8px] leading-tight text-slate-700 space-y-0.5 shrink-0">
                      <p className="font-bold uppercase text-slate-900">AUTORIZACIÓN DE TRASLADO & CUSTODIA MERCANTIL (LEY N° 3284):</p>
                      <p>
                        El propietario confiere autorización plena a ZxZ Mods Costa Rica S.A. y su transportista para remolcar y transportar en plataforma el vehículo hasta el taller central bajo el Código de Comercio de Costa Rica.
                      </p>
                    </div>
                  </div>
                )}

                {/* 3B. PICK-UP: ACTA DE RETORNO Y ENTREGA */}
                {activeCategory === "pickup" && activeSubDoc === "transport_return" && (
                  <div className="flex-1 flex flex-col justify-between space-y-1.5 text-[9px]">
                    <div className="border border-slate-300 bg-emerald-50/50 p-2 rounded-lg space-y-1 shrink-0">
                      <div className="flex items-center justify-between border-b border-emerald-200/80 pb-1">
                        <span className="font-black uppercase text-emerald-950 text-[9px] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Acta de Retorno de Vehículo & Devolución de Llaves:</span>
                        </span>
                        <div className="font-mono font-bold text-[8.5px] text-emerald-900">
                          [{formData.vehicleChecks?.keysReturnedToOwner ? " X " : "\u00A0\u00A0\u00A0"}] Llaves entregadas formalmente al cliente
                        </div>
                      </div>
                      <p className="text-[8px] text-slate-800 leading-snug">
                        Se efectúa la devolución formal del vehículo en destino con los trabajos mecánicos contratados totalmente instalados, pruebas dinámicas aprobadas y lavado de cortesía efectuado.
                      </p>
                    </div>

                    <div className="border border-slate-300 p-2.5 rounded-lg space-y-1.5 flex-1 flex flex-col justify-between">
                      <span className="text-[8.5px] font-bold text-slate-700 uppercase block shrink-0">
                        Constancia de Entrega y Observaciones Finales:
                      </span>
                      <div className="space-y-2 pt-0.5">
                        <div className="border-b border-slate-300 border-dashed h-5 w-full flex items-end">
                          <span className="text-[7.5px] text-slate-400 italic">Constancia de entrega sin novedades:</span>
                        </div>
                        <div className="border-b border-slate-300 border-dashed h-5 w-full"></div>
                        <div className="border-b border-slate-300 border-dashed h-5 w-full"></div>
                      </div>
                    </div>

                    <div className="p-1.5 rounded-lg border border-slate-200 bg-slate-100 text-[8px] leading-tight text-slate-700 space-y-0.5 shrink-0">
                      <p className="font-bold uppercase text-slate-900">CONFORMIDAD DE RECEPCIÓN FINAL:</p>
                      <p>
                        El propietario o receptor autorizado certifica haber recibido el vehículo en el destino fijado a entera satisfacción y conformidad técnica.
                      </p>
                    </div>
                  </div>
                )}

                {/* 4. ENTREGA DE PRODUCTOS (DELIVERY) */}
                {activeCategory === "delivery" && (
                  <div className="flex-1 flex flex-col justify-between space-y-1.5 text-[9px]">
                    <div className="border border-slate-300 p-2.5 rounded-lg bg-slate-50 space-y-1.5 shrink-0">
                      <span className="text-[8.5px] font-bold text-slate-900 uppercase block">
                        Control de Despacho y Entrega de Mercadería (Marcar por el Repartidor):
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 text-[8.5px]">
                        <div>[ &nbsp; ] Empaques y precintos de fábrica cerrados e íntegros</div>
                        <div>[ &nbsp; ] Comprobante / Factura oficial adjunta al paquete</div>
                        <div className="col-span-2">
                          Número de bultos / cajas entregadas: ____________________________________
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-300 p-2.5 rounded-lg space-y-1 flex-1 flex flex-col justify-between">
                      <span className="text-[8.5px] font-bold text-slate-700 uppercase block shrink-0">
                        Observaciones de Entrega y Encomienda:
                      </span>
                      <div className="space-y-2 pt-0.5">
                        <div className="border-b border-slate-300 border-dashed h-5 w-full flex items-end">
                          <span className="text-[7.5px] text-slate-400 italic">Persona que recibe / notas de entrega:</span>
                        </div>
                        <div className="border-b border-slate-300 border-dashed h-5 w-full"></div>
                      </div>
                    </div>

                    <div className="p-1.5 rounded-lg border border-slate-200 bg-slate-100 text-[8px] leading-tight text-slate-700 space-y-0.5 shrink-0">
                      <p className="font-bold uppercase text-slate-900">PLAZO LEGAL DE RECLAMO POR VICIO APARENTE:</p>
                      <p>
                        El receptor confirma haber recibido la cantidad de bultos descrita en perfecto estado exterior. Conforme a la legislación costarricense, rige un plazo de 48 horas para reportar averías internas de transporte.
                      </p>
                    </div>
                  </div>
                )}

                {/* DUAL SIGNATURE BLOCKS */}
                <div className="pt-2.5 border-t-2 border-slate-900 grid grid-cols-2 gap-6 text-[9.5px] avoid-break mt-auto shrink-0">
                  {/* Client / Owner Signature */}
                  <div className="space-y-1 text-center">
                    <div className="h-11 border-b border-slate-700 flex items-end justify-center pb-0.5">
                      <span className="text-[8px] text-slate-400 italic">
                        (Firma Física del Propietario / Cliente)
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-[10px]">
                        {formData.ownerName || "______________________________"}
                      </p>
                      <p className="text-[8px] text-slate-600 font-mono">
                        Cédula: {formData.ownerCedula || "____________________"} • Tel: {formData.contactPhone || registeredPhone || "_______________"}
                      </p>
                      <p className="text-[8px] text-slate-500 font-mono">
                        Fecha: _____ / _____ / 2026 &nbsp;&nbsp; Hora: _________
                      </p>
                    </div>
                  </div>

                  {/* Staff / Technician Signature & Stamp */}
                  <div className="space-y-1 text-center">
                    <div className="h-11 border-b border-slate-700 flex items-end justify-center pb-0.5">
                      <span className="text-[8px] text-slate-500 font-mono font-bold">
                        SELLO & FIRMA OFICIAL ZXZ MODS
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-[10px]">
                        {formData.receiverStaffName || formData.installerStaffName || formData.driverStaffName || "Personal Autorizado ZxZ Mods"}
                      </p>
                      <p className="text-[8px] text-slate-600 font-mono">
                        ZxZ Mods • Céd. Jur. {COMPANY_CONFIG.cedulaJuridica || "3-101-436132"} <span className="text-[7.5px] text-slate-500">({COMPANY_CONFIG.legalName})</span>
                      </p>
                      <p className="text-[8px] text-slate-500 font-mono">
                        Fecha: _____ / _____ / 2026 &nbsp;&nbsp; Hora: _________
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DOCUMENT FOOTER */}
            <div className="pt-2 border-t border-slate-300 text-center text-[8.5px] text-slate-500 font-mono flex items-center justify-between shrink-0">
              <span>ZxZ Mods • Céd. Jur. {COMPANY_CONFIG.cedulaJuridica || "3-101-436132"} <span className="text-[7.5px] text-slate-400">({COMPANY_CONFIG.legalName})</span> • Comprobante Físico Oficial A4</span>
              <span>Orden #{order.orderNumber}</span>
              <span>Tel: {COMPANY_CONFIG.contact.phone} • WhatsApp: {COMPANY_CONFIG.contact.whatsappDisplay}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
