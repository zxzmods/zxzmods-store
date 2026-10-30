"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { formatCRC, formatUSD } from "@/lib/i18n";
import { resolveOptionColorHex } from "@/lib/products";
import {
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  User,
  Phone,
  Package,
  Check,
  ChevronRight,
  ChevronDown,
  Filter,
  Calendar,
  AlertTriangle,
  Clock,
  Trash2,
  Edit2,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  Wrench,
  Lock,
  Plus,
  Sliders,
  MapPin,
  Truck,
  DollarSign,
  Layers,
  Car,
  Percent,
  Tag,
  X,
  Warehouse,
  FileText,
  ShoppingBag,
  ExternalLink,
  Eye,
  Upload,
  Image as ImageIcon,
  Copy,
  Globe,
  Fuel,
  CreditCard,
} from "lucide-react";

import { 
  normalizeServiceCategory, 
  isOrderAtOrPastProgramService, 
  isOrderInProgramServiceStage,
  getNextStageAfterServicePayment,
  shouldSkipInstallationPayment,
  isServiceRequiringInstallation,
  isInstallationPaymentPaidOrConfirmed,
  canPayInstallation,
  isRejectedPaymentCorrected,
} from "@/lib/orderWorkflow";
import { ServiceDocumentModal } from "./ServiceDocumentModal";

interface OrderItem {
  id?: string;
  sku?: string;
  slug?: string;
  name?: string;
  title?: string;
  brand?: string;
  comp?: string[];
  type?: "PRODUCT" | "COMBO" | "PACKAGE" | "CUSTOM";
  quantity?: number;
  priceCRC?: number;
  basePriceCRC?: number;
  basePriceUSD?: number;
  installationPriceCRC?: number;
  withInstallation?: boolean;
  freeInstallation?: boolean;
  homeInstallation?: boolean;
  imageUrl?: string;
  supplierUrl?: string | null;
  supplierStockStatus?: string;
  supplierStockMessage?: string;
  parametersSummary?: string;
  selectedParameters?: Array<{
    parameterId: string;
    parameterName: string;
    optionId: string;
    optionLabel: string;
    priceDeltaCRC?: number;
    colorHex?: string;
    imageUrl?: string;
    supplierUrl?: string;
    linkedProductId?: string;
  }>;
}

interface OrderData {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  guestEmail: string | null;
  status: string;
  totalCRC: number;
  partsSubtotalCRC?: number | null;
  laborSubtotalCRC?: number | null;
  installationCostCRC?: number | null;
  shippingCostCRC?: number | null;
  pickupCostCRC?: number | null;
  serviceType: string;
  shippingAddress: string | null;
  itemsJson: string;
  notes: string | null;
  staffNotes: string | null;
  supplierNotes: string | null;
  claimToken: string | null;
  isRedeemed: boolean;
  paymentProofUrl?: string | null;
  servicePaymentProofUrl?: string | null;
  installationPaymentProofUrl?: string | null;
  purchaseProofUrls?: string[];
  paidCurrency?: string | null;
  isCertified?: boolean;
  zxzCertificationJson?: string | null;
  serviceDocumentsJson?: string | null;
  garageVehicle?: any;
  serviceSchedule?: any;
  isInstallationPaymentConfirmed?: boolean;
  user?: {
    id?: string;
    email?: string;
    displayName?: string;
    phoneNumber?: string;
  } | null;

  discountType?: string;
  discountValue?: number;
  discountReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const WORKFLOW_STAGES = [
  {
    id: "COTIZACION",
    labelEs: "Cotización",
    labelEn: "Quotation",
    color: "bg-amber-50 text-amber-900 border-amber-300",
  },
  {
    id: "PAYMENT_CONFIRMATION",
    labelEs: "Confirmación de Pago",
    labelEn: "Payment Confirmation",
    color: "bg-blue-50 text-blue-800 border-blue-200",
  },
  {
    id: "PAYMENT_REJECTED",
    labelEs: "Pago Rechazado",
    labelEn: "Payment Rejected",
    color: "bg-rose-50 text-rose-800 border-rose-300",
  },
  {
    id: "NEED_TO_GET_ORDER",
    labelEs: "Por Ordenar Piezas (*un)",
    labelEn: "Need to Get Order (*un)",
    color: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  {
    id: "SHIPPING_IN_US",
    labelEs: "En Tránsito en USA",
    labelEn: "Shipping in US",
    color: "bg-purple-50 text-purple-800 border-purple-200",
  },
  {
    id: "SHIPPING_TO_CR",
    labelEs: "En Tránsito a Costa Rica",
    labelEn: "Shipping to Costa Rica",
    color: "bg-cyan-50 text-cyan-800 border-cyan-200",
  },
  {
    id: "IN_COSTA_RICA",
    labelEs: "En Costa Rica (*un)",
    labelEn: "In Costa Rica (*un)",
    color: "bg-teal-50 text-teal-800 border-teal-200",
  },
  {
    id: "IN_WAREHOUSE_CHECK",
    labelEs: "En Taller para Revisión",
    labelEn: "In Warehouse to Check",
    color: "bg-orange-50 text-orange-800 border-orange-200",
  },
  {
    id: "PROGRAM_SERVICE",
    labelEs: "Programar Servicio",
    labelEn: "Program Service",
    color: "bg-blue-50 text-blue-800 border-blue-200",
  },
  {
    id: "CONFIRM_SERVICE_PAYMENT",
    labelEs: "Confirmar Pago de Servicio",
    labelEn: "Confirm Service Payment",
    color: "bg-blue-50 text-blue-800 border-blue-200",
  },
  {
    id: "WAITING_ON_DELIVERY",
    labelEs: "Esperando Entrega",
    labelEn: "Waiting on Delivery",
    color: "bg-amber-50 text-amber-800 border-amber-200",
  },
  {
    id: "PICKUP_DATE_SET",
    labelEs: "Fecha de Retiro Programada",
    labelEn: "Pick-up Date Set",
    color: "bg-indigo-50 text-indigo-800 border-indigo-200",
  },
  {
    id: "HOME_INSTALL_SET",
    labelEs: "Instalación a Domicilio Programada",
    labelEn: "Home Install Set",
    color: "bg-cyan-50 text-cyan-800 border-cyan-200",
  },
  {
    id: "INSTALLING",
    labelEs: "Instalando Piezas",
    labelEn: "Installing",
    color: "bg-orange-50 text-orange-800 border-orange-200",
  },
  {
    id: "INSTALLATION_PAYMENT",
    labelEs: "Pago de Instalación",
    labelEn: "Installation Payment",
    color: "bg-purple-50 text-purple-800 border-purple-200",
  },
  {
    id: "READY_TO_SET_RETURN_DATE",
    labelEs: "Listo para Programar Fecha de Entrega",
    labelEn: "Ready to Set Return Date",
    color: "bg-purple-50 text-purple-800 border-purple-200",
  },
  {
    id: "READY_FOR_PICKUP",
    labelEs: "Listo para Retiro",
    labelEn: "Ready to Pick Up",
    color: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    id: "READY_TO_PICK_UP",
    labelEs: "Listo para Retiro (Previo)",
    labelEn: "Ready to Pick Up (Legacy)",
    color: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  {
    id: "COMPLETED",
    labelEs: "Completado y Entregado",
    labelEn: "Completed",
    color: "bg-slate-100 text-slate-800 border-slate-300",
  },
];

export interface OrdersPipelineTabProps {
  onOrderDeleted?: () => void;
  onOrderUpdated?: () => void;
}

export function OrdersPipelineTab({ onOrderDeleted, onOrderUpdated }: OrdersPipelineTabProps = {}) {
  const { lang, t } = useLanguage();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [serverCorrectedRejectedCount, setServerCorrectedRejectedCount] = useState<number>(0);

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "7_DAYS" | "30_DAYS" | "CUSTOM">("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    orderId: string;
    orderNumber: string;
    targetStatus: string;
    currentStatus: string;
  } | null>(null);

  // Deletion Modal state (User Requirement: needs Master password if in or past PAYMENT_CONFIRMATION)
  const [deleteModal, setDeleteModal] = useState<OrderData | null>(null);
  const [deleteMasterPassword, setDeleteMasterPassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Catalog products and combos for live item search
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [catalogCombos, setCatalogCombos] = useState<any[]>([]);
  const [quoteItemSearch, setQuoteItemSearch] = useState("");
  const [isQuoteSearchOpen, setIsQuoteSearchOpen] = useState(false);

  // Quotation Edit Screen state (ONLY for orders in status COTIZACION)
  const [editingQuoteOrder, setEditingQuoteOrder] = useState<OrderData | null>(null);
  const [quoteForm, setQuoteForm] = useState<{
    customerName: string;
    customerPhone: string;
    guestEmail: string;
    serviceType: string;
    shippingAddress: string;
    items: OrderItem[];
    notes: string;
    staffNotes: string;
  }>({
    customerName: "",
    customerPhone: "",
    guestEmail: "",
    serviceType: "STORE_PICKUP",
    shippingAddress: "",
    items: [],
    notes: "",
    staffNotes: "",
  });
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");

  // Quotation Discounts state (User Requirement: Needs Master password)
  const [quoteDiscountType, setQuoteDiscountType] = useState<"NONE" | "PERCENTAGE" | "FIXED">("NONE");
  const [quoteDiscountValue, setQuoteDiscountValue] = useState("0");
  const [quoteDiscountReason, setQuoteDiscountReason] = useState("");
  const [quoteMasterPassword, setQuoteMasterPassword] = useState("");

  // Transport Service configuration modal (User Requirement: same as /servicios in a tab)
  const [isTransportModalOpen, setIsTransportModalOpen] = useState(false);
  const [transportActiveTab, setTransportActiveTab] = useState<
    "STORE_PICKUP" | "HOME_SERVICE" | "UTV_PICKUP" | "SHIPPING"
  >("STORE_PICKUP");
  const [transportAddress, setTransportAddress] = useState("");
  const [transportVehicle, setTransportVehicle] = useState("");
  const [transportDate, setTransportDate] = useState("");
  const [transportTimeSlot, setTransportTimeSlot] = useState("10:00");
  const [transportRequirements, setTransportRequirements] = useState("");

  // Post-Quotation Management Screen state (for orders in or past COTIZACION)
  const [managingOrder, setManagingOrder] = useState<OrderData | null>(null);
  const [manageForm, setManageForm] = useState<{
    status: string;
    serviceType: string;
    shippingAddress: string;
    staffNotes: string;
    supplierNotes: string;
    paymentProofUrl: string;
    servicePaymentProofUrl: string;
    installationPaymentProofUrl: string;
    installationDurationMinutes?: number;
    orderPartsCostCRC: string;
    purchaseProofUrls: string[];
  }>({
    status: "",
    serviceType: "",
    shippingAddress: "",
    staffNotes: "",
    supplierNotes: "",
    paymentProofUrl: "",
    servicePaymentProofUrl: "",
    installationPaymentProofUrl: "",
    installationDurationMinutes: 60,
    orderPartsCostCRC: "",
    purchaseProofUrls: [],
  });

  // Payment proof preview lightbox & upload states
  const [previewPaymentProofOrder, setPreviewPaymentProofOrder] = useState<OrderData | null>(null);
  const [previewProofModal, setPreviewProofModal] = useState<{
    orderNumber: string;
    status: string;
    title: string;
    subtitle?: string;
    imageUrl: string;
    totalCRC?: number;
    targetAmountLabel?: string;
    targetAmountCRC?: number;
    paidCurrency?: string | null;
  } | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [uploadingServiceProof, setUploadingServiceProof] = useState(false);
  const [uploadingInstallProof, setUploadingInstallProof] = useState(false);
  const [uploadingPurchaseProof, setUploadingPurchaseProof] = useState(false);
  const [previewPurchaseProofUrl, setPreviewPurchaseProofUrl] = useState<string | null>(null);
  const [confirmingInstallPayment, setConfirmingInstallPayment] = useState(false);
  const [confirmingServicePayment, setConfirmingServicePayment] = useState(false);
  const [savingDuration, setSavingDuration] = useState(false);
  const [showAdvancePopover, setShowAdvancePopover] = useState(false);
  const [advancingFromManaging, setAdvancingFromManaging] = useState(false);

  // Service Document & PDF Modal state
  const [serviceDocsModalOrder, setServiceDocsModalOrder] = useState<OrderData | null>(null);


  // Rejection modal states
  const [rejectModalOrder, setRejectModalOrder] = useState<OrderData | null>(null);
  const [rejectPaymentType, setRejectPaymentType] = useState<"ORDER" | "SERVICE" | "INSTALLATION">("ORDER");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Vehicle Return Delivery (50% Rate) configuration modal
  const [returnDeliveryOrder, setReturnDeliveryOrder] = useState<OrderData | null>(null);
  const [returnAddress, setReturnAddress] = useState("");
  const [returnCostCRC, setReturnCostCRC] = useState("5000");
  const [returnNotes, setReturnNotes] = useState("");
  const [savingReturnDelivery, setSavingReturnDelivery] = useState(false);

  const [savingEdit, setSavingEdit] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [copiedSupplierKey, setCopiedSupplierKey] = useState<string | null>(null);

  const handleCopySupplierUrl = (url: string, key: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedSupplierKey(key);
    setTimeout(() => setCopiedSupplierKey(null), 2200);
  };

  const fetchOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/sys/orders?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof data.correctedRejectedCount === "number") {
          setServerCorrectedRejectedCount(data.correctedRejectedCount);
        }
        const standardOrders = (data.orders || []).filter(
          (o: any) => !o.orderNumber?.startsWith("GAR-")
        );
        setOrders((prev) => {
          const prevStr = JSON.stringify(prev);
          const newStr = JSON.stringify(standardOrders);
          return prevStr === newStr ? prev : standardOrders;
        });
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchOrders(false);
  }, [fetchOrders]);

  // User Rule: Page doesn't need to be reloaded to see new incoming orders (Silent polling every 4s)
  useEffect(() => {
    // Only poll when not actively editing a quotation or order in a full modal
    const interval = setInterval(() => {
      fetchOrders(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    fetch("/api/sys/catalog")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCatalogProducts(data.products || []);
          setCatalogCombos(data.combos || []);
        }
      })
      .catch((err) => console.error("Catalog fetch error:", err));
  }, []);

  const matchedQuoteItems = useMemo(() => {
    if (!quoteItemSearch.trim()) return [];
    const q = quoteItemSearch.toLowerCase().trim();

    const matchedProds = catalogProducts
      .filter(
        (p) =>
          p.sku.toLowerCase().includes(q) ||
          p.nameEs.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: lang === "es" ? p.nameEs : p.nameEn,
        sku: p.sku,
        priceCRC: p.priceCRC,
        type: "PRODUCT" as const,
      }));

    const matchedCmb = catalogCombos
      .filter(
        (c) =>
          c.slug.toLowerCase().includes(q) ||
          c.titleEs.toLowerCase().includes(q) ||
          c.titleEn.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        name: lang === "es" ? c.titleEs : c.titleEn,
        sku: c.slug,
        priceCRC: c.priceCRC,
        type: "COMBO" as const,
      }));

    return [...matchedProds, ...matchedCmb];
  }, [quoteItemSearch, catalogProducts, catalogCombos, lang]);

  const getStageLabel = (stageId: string) => {
    const stage = WORKFLOW_STAGES.find((s) => s.id === stageId);
    if (!stage) return stageId;
    return lang === "es" ? stage.labelEs : stage.labelEn;
  };

  const getStageColor = (stageId: string) => {
    const stage = WORKFLOW_STAGES.find((s) => s.id === stageId);
    return stage ? stage.color : "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getPredeterminedStagesForOrder = (order?: OrderData | { serviceType?: string; status?: string; items?: any; itemsJson?: any; installationCostCRC?: number; laborSubtotalCRC?: number } | null) => {
    if (!order) return WORKFLOW_STAGES;
    const category = normalizeServiceCategory(order?.serviceType);
    const skipInstallPayment = shouldSkipInstallationPayment(order, (order as any)?.installationCostCRC, (order as any)?.laborSubtotalCRC);
    const baseStageIds = [
      "COTIZACION",
      "PAYMENT_CONFIRMATION",
      "PAYMENT_REJECTED",
      "NEED_TO_GET_ORDER",
      "SHIPPING_IN_US",
      "SHIPPING_TO_CR",
      "IN_COSTA_RICA",
      "IN_WAREHOUSE_CHECK",
    ];

    let serviceStageIds: string[] = [];
    if (category === "delivery") {
      serviceStageIds = ["PROGRAM_SERVICE", "CONFIRM_SERVICE_PAYMENT", "WAITING_ON_DELIVERY", "COMPLETED"];
    } else if (category === "pickup") {
      serviceStageIds = skipInstallPayment
        ? ["PROGRAM_SERVICE", "CONFIRM_SERVICE_PAYMENT", "PICKUP_DATE_SET", "INSTALLING", "READY_TO_SET_RETURN_DATE", "COMPLETED"]
        : ["PROGRAM_SERVICE", "CONFIRM_SERVICE_PAYMENT", "PICKUP_DATE_SET", "INSTALLING", "INSTALLATION_PAYMENT", "READY_TO_SET_RETURN_DATE", "COMPLETED"];
    } else if (category === "home_install") {
      serviceStageIds = skipInstallPayment
        ? ["PROGRAM_SERVICE", "CONFIRM_SERVICE_PAYMENT", "HOME_INSTALL_SET", "INSTALLING", "COMPLETED"]
        : ["PROGRAM_SERVICE", "CONFIRM_SERVICE_PAYMENT", "HOME_INSTALL_SET", "INSTALLING", "INSTALLATION_PAYMENT", "COMPLETED"];
    } else {
      // Shop install / Only Installation
      const isPaid = order && (skipInstallPayment || isInstallationPaymentPaidOrConfirmed(order));
      serviceStageIds = isPaid
        ? ["PROGRAM_SERVICE", "CONFIRM_SERVICE_PAYMENT", "INSTALLING", "READY_FOR_PICKUP", "COMPLETED"]
        : ["PROGRAM_SERVICE", "CONFIRM_SERVICE_PAYMENT", "INSTALLING", "READY_FOR_PICKUP", "INSTALLATION_PAYMENT", "COMPLETED"];
    }

    const validSet = new Set([...baseStageIds, ...serviceStageIds, order?.status]);
    return WORKFLOW_STAGES.filter((st) => validSet.has(st.id));
  };

  const getNextStageId = (currentStatus: string, order?: OrderData) => {
    const s = currentStatus?.toUpperCase() || "";
    const category = normalizeServiceCategory(order?.serviceType);

    switch (s) {
      case "COTIZACION":
        return "PAYMENT_CONFIRMATION";
      case "PAYMENT_CONFIRMATION":
        return "NEED_TO_GET_ORDER";
      case "PAYMENT_REJECTED": {
        let docs: any = {};
        try {
          docs = typeof order?.serviceDocumentsJson === "string" ? JSON.parse(order.serviceDocumentsJson) : (order?.serviceDocumentsJson || {});
        } catch {}
        if (docs?.rejectionPaymentType === "SERVICE") {
          return "CONFIRM_SERVICE_PAYMENT";
        }
        if (docs?.rejectionPaymentType === "INSTALLATION") {
          return "INSTALLATION_PAYMENT";
        }
        if (docs?.preRejectionStatus && docs.preRejectionStatus !== "PAYMENT_REJECTED") {
          return docs.preRejectionStatus;
        }
        return "PAYMENT_CONFIRMATION";
      }
      case "NEED_TO_GET_ORDER":
        return "SHIPPING_IN_US";
      case "SHIPPING_IN_US":
        return "SHIPPING_TO_CR";
      case "SHIPPING_TO_CR":
        return "IN_COSTA_RICA";
      case "IN_COSTA_RICA":
        return "IN_WAREHOUSE_CHECK";
      case "IN_WAREHOUSE_CHECK":
        return "PROGRAM_SERVICE";
      case "PROGRAM_SERVICE":
        return "CONFIRM_SERVICE_PAYMENT";
      case "CONFIRM_SERVICE_PAYMENT":
        return getNextStageAfterServicePayment(order?.serviceType);

      // Delivery service branch
      case "WAITING_ON_DELIVERY":
        return "COMPLETED";

      // Pick-up service branch
      case "PICKUP_DATE_SET":
        return "INSTALLING";
      case "INSTALLING": {
        if (category === "pickup") {
          if (order && shouldSkipInstallationPayment(order, order.installationCostCRC, order.laborSubtotalCRC)) {
            return "READY_TO_SET_RETURN_DATE";
          }
          return "INSTALLATION_PAYMENT";
        }
        if (category === "home_install") {
          if (order && shouldSkipInstallationPayment(order, order.installationCostCRC, order.laborSubtotalCRC)) {
            return "COMPLETED";
          }
          return "INSTALLATION_PAYMENT";
        }
        // Shop install / Only Installation:
        // 'pago de instalacion' goes after in the only installation
        return "READY_FOR_PICKUP";
      }

      case "READY_FOR_PICKUP":
      case "READY_TO_PICK_UP": {
        if (category === "shop_install") {
          const isPaid = order && (
            shouldSkipInstallationPayment(order, order.installationCostCRC, order.laborSubtotalCRC) ||
            isInstallationPaymentPaidOrConfirmed(order)
          );
          // If payed during 'listo para retiro' then skip 'installation payment' stage, only in 'only installation' service.
          if (isPaid) {
            return "COMPLETED";
          }
          return "INSTALLATION_PAYMENT";
        }
        return "COMPLETED";
      }

      case "INSTALLATION_PAYMENT":
        if (category === "pickup") return "READY_TO_SET_RETURN_DATE";
        if (category === "home_install") return "COMPLETED";
        return "COMPLETED";

      case "READY_TO_SET_RETURN_DATE":
        return "COMPLETED";

      // Home install branch
      case "HOME_INSTALL_SET":
        return "INSTALLING";

      default:
        return null;
    }
  };

  const handleConfirmPaymentRejection = async () => {
    if (!rejectModalOrder) return;
    if (!rejectionReason.trim()) {
      setRejectError(lang === "es" ? "Por favor ingresa un comentario con el motivo del rechazo." : "Please enter a comment with the rejection reason.");
      return;
    }
    setRejecting(true);
    setRejectError(null);
    try {
      let existingComments: any[] = [];
      try {
        existingComments = JSON.parse((rejectModalOrder as any).commentsJson || "[]");
        if (!Array.isArray(existingComments)) existingComments = [];
      } catch {
        existingComments = [];
      }

      const prefix =
        rejectPaymentType === "SERVICE"
          ? "[Pago de Servicio Rechazado]"
          : rejectPaymentType === "INSTALLATION"
          ? "[Pago de Instalación Rechazado]"
          : "[Pago Rechazado]";

      const rejectionComment = {
        id: `cmt-rej-${Date.now()}`,
        authorRole: "STAFF",
        authorName: "Staff ZxZ Mods",
        text: `${prefix}: ${rejectionReason.trim()}`,
        createdAt: new Date().toISOString(),
      };

      const updatedComments = [...existingComments, rejectionComment];

      const res = await fetch(`/api/sys/orders/${rejectModalOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAYMENT_REJECTED",
          rejectPaymentType,
          paymentRejectionReason: rejectionReason.trim(),
          staffNotes: `${prefix}: ${rejectionReason.trim()}${rejectModalOrder.staffNotes ? `\n${rejectModalOrder.staffNotes}` : ""}`,
          commentsJson: JSON.stringify(updatedComments),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRejectModalOrder(null);
        setRejectionReason("");
        if (managingOrder && managingOrder.id === rejectModalOrder.id) {
          setManagingOrder({ ...managingOrder, status: "PAYMENT_REJECTED" });
          setManageForm((prev) => ({ ...prev, status: "PAYMENT_REJECTED" }));
        }
        await fetchOrders(false);
        setFeedback({
          type: "success",
          msg: lang === "es" ? "Pago rechazado correctamente. Notificación registrada en el pedido." : "Payment rejected successfully. Notification recorded in order.",
        });
      } else {
        setRejectError(data.error || "Error al rechazar el pago.");
      }
    } catch (err: any) {
      console.error("Error rejecting payment:", err);
      setRejectError("Error de conexión al procesar el rechazo.");
    } finally {
      setRejecting(false);
    }
  };

  const handleConfirmReturnDelivery = async () => {
    if (!returnDeliveryOrder) return;
    const costNum = Math.round(Number(returnCostCRC) || 0);
    setSavingReturnDelivery(true);
    try {
      const updatedTotal = returnDeliveryOrder.totalCRC + costNum;
      const notesAppend = `[Retorno de Vehículo 50% Tarifa]: Dirección: ${returnAddress || "A domicilio"} | Flete 50%: ${formatCRC(costNum)}${returnNotes ? ` | ${returnNotes}` : ""}`;
      const res = await fetch(`/api/sys/orders/${returnDeliveryOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "WAITING_ON_DELIVERY",
          serviceType: "SHIPPING",
          shippingAddress: returnAddress || returnDeliveryOrder.shippingAddress,
          pickupCostCRC: costNum,
          totalCRC: updatedTotal,
          staffNotes: returnDeliveryOrder.staffNotes ? `${returnDeliveryOrder.staffNotes}\n${notesAppend}` : notesAppend,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReturnDeliveryOrder(null);
        if (managingOrder && managingOrder.id === returnDeliveryOrder.id) {
          setManagingOrder({
            ...managingOrder,
            status: "WAITING_ON_DELIVERY",
            serviceType: "SHIPPING",
            shippingAddress: returnAddress || returnDeliveryOrder.shippingAddress,
            totalCRC: updatedTotal,
          });
          setManageForm((prev) => ({
            ...prev,
            status: "WAITING_ON_DELIVERY",
            shippingAddress: returnAddress || prev.shippingAddress,
          }));
        }
        await fetchOrders(false);
        setFeedback({
          type: "success",
          msg: lang === "es" ? "Servicio de retorno (50% tarifa) configurado exitosamente." : "Vehicle return service (50% rate) configured successfully.",
        });
      } else {
        alert(data.error || "Error al configurar el retorno.");
      }
    } catch (err) {
      console.error("Error setting return delivery:", err);
      alert("Error de conexión al guardar el retorno.");
    } finally {
      setSavingReturnDelivery(false);
    }
  };

  const handleConfirmInstallationPayment = async (targetOrder: OrderData) => {
    setConfirmingInstallPayment(true);
    try {
      const res = await fetch(`/api/sys/orders/${targetOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmInstallationPayment: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === targetOrder.id ? { ...o, isInstallationPaymentConfirmed: true } : o))
        );
        if (managingOrder && managingOrder.id === targetOrder.id) {
          setManagingOrder((prev) => (prev ? { ...prev, isInstallationPaymentConfirmed: true } : null));
        }
        onOrderUpdated?.();
        setFeedback({
          type: "success",
          msg: lang === "es" ? "Pago de instalación / mano de obra confirmado exitosamente." : "Installation payment confirmed successfully.",
        });
      } else {
        alert(data.error || "Error al confirmar el pago de instalación.");
      }
    } catch (err) {
      console.error("Error confirming installation payment:", err);
      alert("Error de conexión al confirmar pago de instalación.");
    } finally {
      setConfirmingInstallPayment(false);
    }
  };

  const handleConfirmServicePayment = async (targetOrder: OrderData) => {
    setConfirmingServicePayment(true);
    try {
      const nextStage = getNextStageAfterServicePayment(targetOrder.serviceType);
      const res = await fetch(`/api/sys/orders/${targetOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStage,
          confirmServicePayment: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === targetOrder.id
              ? {
                  ...o,
                  status: nextStage,
                  serviceSchedule: o.serviceSchedule
                    ? { ...o.serviceSchedule, paymentStatus: "PAID" }
                    : null,
                }
              : o
          )
        );
        onOrderUpdated?.();
        if (managingOrder && managingOrder.id === targetOrder.id) {
          setManagingOrder((prev) => (prev ? { ...prev, status: nextStage } : null));
          setManageForm((prev) => ({ ...prev, status: nextStage }));
        }
        setFeedback({
          type: "success",
          msg: lang === "es" ? `Pago de servicio confirmado. Orden avanzada a ${getStageLabel(nextStage)}.` : `Service payment confirmed. Order advanced to ${getStageLabel(nextStage)}.`,
        });
      } else {
        alert(data.error || "Error al confirmar el pago de servicio.");
      }
    } catch (err) {
      console.error("Error confirming service payment:", err);
      alert("Error de conexión al confirmar pago de servicio.");
    } finally {
      setConfirmingServicePayment(false);
    }
  };

  // CHECK URGENCY FOR "PAYMENT_CONFIRMATION" (>24h) AND "NEED_TO_GET_ORDER" (>48h)
  const checkUrgency = (order: OrderData) => {
    const dateSource = order.updatedAt || order.createdAt;
    const orderTimestamp = new Date(dateSource).getTime();
    const elapsedHours = (Date.now() - orderTimestamp) / (1000 * 60 * 60);

    if (order.status === "PAYMENT_CONFIRMATION" && elapsedHours >= 24) {
      return {
        isUrgent: true,
        hours: Math.floor(elapsedHours),
        badgeText:
          lang === "es"
            ? `⚠️ URGENTE (>24h sin pago: ${Math.floor(elapsedHours)}h)`
            : `⚠️ URGENT (>24h pending payment: ${Math.floor(elapsedHours)}h)`,
      };
    }

    if (order.status === "NEED_TO_GET_ORDER" && elapsedHours >= 48) {
      return {
        isUrgent: true,
        hours: Math.floor(elapsedHours),
        badgeText:
          lang === "es"
            ? `⚠️ URGENTE (*un: >48h sin ordenar piezas: ${Math.floor(elapsedHours)}h)`
            : `⚠️ URGENT (*un: >48h parts not ordered: ${Math.floor(elapsedHours)}h)`,
      };
    }

    return { isUrgent: false, hours: Math.floor(elapsedHours), badgeText: "" };
  };

  // Filter and sort orders: strictly NEW TO OLD (User Requirement)
  const processedOrders = useMemo(() => {
    let result = [...orders];

    if (dateFilter !== "ALL") {
      const now = new Date();
      result = result.filter((order) => {
        const orderDate = new Date(order.createdAt);
        if (dateFilter === "TODAY") {
          return (
            orderDate.getDate() === now.getDate() &&
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getFullYear() === now.getFullYear()
          );
        }
        if (dateFilter === "7_DAYS") {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= sevenDaysAgo;
        }
        if (dateFilter === "30_DAYS") {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= thirtyDaysAgo;
        }
        if (dateFilter === "CUSTOM") {
          if (fromDate && new Date(fromDate) > orderDate) return false;
          if (toDate) {
            const end = new Date(toDate);
            end.setHours(23, 59, 59, 999);
            if (end < orderDate) return false;
          }
          return true;
        }
        return true;
      });
    }

    // Sort strictly from NEW to OLD (User Requirement)
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  }, [orders, dateFilter, fromDate, toDate]);

  const handleOpenConfirm = (order: OrderData, targetStatus: string) => {
    const currentUpper = (order.status || "").toUpperCase();
    const targetUpper = (targetStatus || "").toUpperCase();
    const stagesPastInstalling = [
      "READY_TO_SET_RETURN_DATE",
      "READY_FOR_PICKUP",
      "READY_TO_PICK_UP",
      "COMPLETED",
    ];
    const hasInstallation =
      (order.laborSubtotalCRC || 0) > 0 || (order.installationCostCRC || 0) > 0;

    // RULE 1: Can't advance without order payment in 'confirmacion de pago' state
    if (
      currentUpper === "PAYMENT_CONFIRMATION" &&
      targetUpper !== "PAYMENT_REJECTED" &&
      targetUpper !== "CANCELLED"
    ) {
      if (!order.paymentProofUrl || !order.paymentProofUrl.trim()) {
        setFeedback({
          type: "error",
          msg:
            lang === "es"
              ? "No se puede avanzar el pedido: se requiere adjuntar el comprobante de pago de la orden en el estado 'Confirmación de Pago'."
              : "Cannot advance order: order payment proof must be attached in the 'Payment Confirmation' state.",
        });
        return;
      }
    }

    // RULE BUY PROOF (PIPELINE): Can't advance from 'NEED_TO_GET_ORDER' without purchase proof images (*un)
    if (
      currentUpper === "NEED_TO_GET_ORDER" &&
      targetUpper !== "NEED_TO_GET_ORDER" &&
      targetUpper !== "PAYMENT_REJECTED" &&
      targetUpper !== "CANCELLED"
    ) {
      let proofCount = 0;
      if (Array.isArray(order.purchaseProofUrls) && order.purchaseProofUrls.length > 0) {
        proofCount = order.purchaseProofUrls.length;
      } else if (order.serviceDocumentsJson) {
        try {
          const doc = typeof order.serviceDocumentsJson === "string" ? JSON.parse(order.serviceDocumentsJson) : order.serviceDocumentsJson;
          if (Array.isArray(doc?.purchaseProofUrls)) {
            proofCount = doc.purchaseProofUrls.length;
          }
        } catch {}
      }

      if (proofCount === 0) {
        setFeedback({
          type: "error",
          msg:
            lang === "es"
              ? "No se puede avanzar el pedido: se requiere adjuntar al menos un comprobante de compra de repuestos (proveedor) en el estado 'Por Ordenar Piezas (*un)'."
              : "Cannot advance order: at least one supplier purchase proof receipt must be attached in the 'Need to Get Order (*un)' state.",
        });
        handleOpenManageOrder(order);
        return;
      }
    }

    // RULE 2: Can't advance without service payment proof in 'confirmar pago de servicio' state
    if (
      currentUpper === "CONFIRM_SERVICE_PAYMENT" &&
      targetUpper !== "CANCELLED"
    ) {
      const hasServiceProof = Boolean(
        (order.servicePaymentProofUrl && order.servicePaymentProofUrl.trim()) ||
        (order.serviceSchedule?.paymentProofUrl && order.serviceSchedule.paymentProofUrl.trim())
      );
      if (!hasServiceProof) {
        setFeedback({
          type: "error",
          msg:
            lang === "es"
              ? "No se puede avanzar el pedido: se requiere adjuntar el comprobante de pago del servicio en el estado 'Confirmar Pago de Servicio'."
              : "Cannot advance order: service payment proof must be attached in the 'Confirm Service Payment' state.",
        });
        return;
      }
    }

    const skipInstallPayment = shouldSkipInstallationPayment(order, order.installationCostCRC, order.laborSubtotalCRC);
    const requiresInstall = isServiceRequiringInstallation(order.serviceType);

    // RULE 3: In any service that requires installation, installation payment is a requirement.
    const isTargetRequiringInstallPayment =
      requiresInstall &&
      !skipInstallPayment &&
      (
        targetUpper === "COMPLETED" ||
        targetUpper === "READY_TO_SET_RETURN_DATE" ||
        (currentUpper === "INSTALLATION_PAYMENT" && targetUpper !== "INSTALLATION_PAYMENT" && targetUpper !== "CANCELLED")
      );

    if (isTargetRequiringInstallPayment) {
      const hasInstallProof = Boolean(
        (order.installationPaymentProofUrl && order.installationPaymentProofUrl.trim()) ||
        order.isInstallationPaymentConfirmed
      );
      if (!hasInstallProof) {
        setFeedback({
          type: "error",
          msg:
            lang === "es"
              ? "No se puede avanzar el pedido: se requiere adjuntar el comprobante de pago de instalación para este servicio."
              : "Cannot advance order: installation payment proof must be attached for this service.",
        });
        return;
      }

      if (!order.isInstallationPaymentConfirmed) {
        setFeedback({
          type: "error",
          msg:
            lang === "es"
              ? "No se puede avanzar el pedido más allá del estado de pago de instalación porque el pago de mano de obra no ha sido confirmado por el staff."
              : "Cannot advance order past installation payment because installation labor payment has not been confirmed by staff.",
        });
        return;
      }
    }

    setConfirmModal({
      orderId: order.id,
      orderNumber: order.orderNumber,
      targetStatus,
      currentStatus: order.status,
    });
    setFeedback(null);
  };

  // TRIGGER INLINE ADVANCE POPOVER WITHIN 'GESTIONAR' (CHECKS VALIDATIONS FIRST)
  const handleTriggerAdvancePopover = (targetStage: string) => {
    if (!managingOrder) return;

    const currentUpper = (manageForm.status || managingOrder.status || "").toUpperCase();
    const targetUpper = (targetStage || "").toUpperCase();
    const stagesPastInstalling = [
      "READY_TO_SET_RETURN_DATE",
      "READY_FOR_PICKUP",
      "READY_TO_PICK_UP",
      "COMPLETED",
    ];
    const hasInstallation =
      (managingOrder.laborSubtotalCRC || 0) > 0 || (managingOrder.installationCostCRC || 0) > 0;

    // RULE 1: Can't advance without order payment in 'confirmacion de pago' state
    if (
      currentUpper === "PAYMENT_CONFIRMATION" &&
      targetUpper !== "PAYMENT_CONFIRMATION" &&
      targetUpper !== "PAYMENT_REJECTED" &&
      targetUpper !== "CANCELLED"
    ) {
      const hasOrderProof = Boolean(
        manageForm.paymentProofUrl.trim() || managingOrder.paymentProofUrl
      );
      if (!hasOrderProof) {
        setFeedback({
          type: "error",
          msg:
            lang === "es"
              ? "No se puede avanzar el pedido: se requiere adjuntar el comprobante de pago de la orden en el estado 'Confirmación de Pago'."
              : "Cannot advance order: order payment proof must be attached in the 'Payment Confirmation' state.",
        });
        return;
      }
    }

    // RULE BUY PROOF (PIPELINE): Can't advance from 'NEED_TO_GET_ORDER' without purchase proof images (*un)
    if (
      currentUpper === "NEED_TO_GET_ORDER" &&
      targetUpper !== "NEED_TO_GET_ORDER" &&
      targetUpper !== "PAYMENT_REJECTED" &&
      targetUpper !== "CANCELLED"
    ) {
      let proofCount = 0;
      if (Array.isArray(manageForm.purchaseProofUrls) && manageForm.purchaseProofUrls.length > 0) {
        proofCount = manageForm.purchaseProofUrls.length;
      } else if (Array.isArray(managingOrder.purchaseProofUrls) && managingOrder.purchaseProofUrls.length > 0) {
        proofCount = managingOrder.purchaseProofUrls.length;
      } else if (managingOrder.serviceDocumentsJson) {
        try {
          const doc = typeof managingOrder.serviceDocumentsJson === "string" ? JSON.parse(managingOrder.serviceDocumentsJson) : managingOrder.serviceDocumentsJson;
          if (Array.isArray(doc?.purchaseProofUrls)) {
            proofCount = doc.purchaseProofUrls.length;
          }
        } catch {}
      }

      if (proofCount === 0) {
        setFeedback({
          type: "error",
          msg:
            lang === "es"
              ? "No se puede avanzar el pedido: se requiere adjuntar al menos un comprobante de compra de repuestos (proveedor) en el estado 'Por Ordenar Piezas (*un)'."
              : "Cannot advance order: at least one supplier purchase proof receipt must be attached in the 'Need to Get Order (*un)' state.",
        });
        return;
      }
    }

    // RULE 2: Can't advance without service payment proof in 'confirmar pago de servicio' state
    if (
      currentUpper === "CONFIRM_SERVICE_PAYMENT" &&
      targetUpper !== "CONFIRM_SERVICE_PAYMENT" &&
      targetUpper !== "CANCELLED"
    ) {
      const hasServiceProof = Boolean(
        manageForm.servicePaymentProofUrl.trim() ||
        managingOrder.servicePaymentProofUrl ||
        managingOrder.serviceSchedule?.paymentProofUrl
      );
      if (!hasServiceProof) {
        setFeedback({
          type: "error",
          msg:
            lang === "es"
              ? "No se puede avanzar el pedido: se requiere adjuntar el comprobante de pago del servicio en el estado 'Confirmar Pago de Servicio'."
              : "Cannot advance order: service payment proof must be attached in the 'Confirm Service Payment' state.",
        });
        return;
      }
    }

    const skipInstallPayment = shouldSkipInstallationPayment(
      managingOrder,
      managingOrder.installationCostCRC,
      managingOrder.laborSubtotalCRC
    );
    const requiresInstall = isServiceRequiringInstallation(manageForm.serviceType || managingOrder.serviceType);

    // RULE 3: In any service that requires installation, installation payment is a requirement.
    const isTargetRequiringInstallPayment =
      requiresInstall &&
      !skipInstallPayment &&
      (
        targetUpper === "COMPLETED" ||
        targetUpper === "READY_TO_SET_RETURN_DATE" ||
        (currentUpper === "INSTALLATION_PAYMENT" && targetUpper !== "INSTALLATION_PAYMENT" && targetUpper !== "CANCELLED")
      );

    if (isTargetRequiringInstallPayment) {
      const hasInstallProof = Boolean(
        manageForm.installationPaymentProofUrl.trim() ||
        managingOrder.installationPaymentProofUrl ||
        managingOrder.isInstallationPaymentConfirmed
      );
      if (!hasInstallProof) {
        setFeedback({
          type: "error",
          msg:
            lang === "es"
              ? "No se puede avanzar el pedido: se requiere adjuntar el comprobante de pago de instalación para este servicio."
              : "Cannot advance order: installation payment proof must be attached for this service.",
        });
        return;
      }

      if (!managingOrder.isInstallationPaymentConfirmed) {
        setFeedback({
          type: "error",
          msg:
            lang === "es"
              ? "No se puede avanzar el pedido más allá del estado de pago de instalación porque el pago de mano de obra no ha sido confirmado por el staff."
              : "Cannot advance order past installation payment because installation labor payment has not been confirmed by staff.",
        });
        return;
      }
    }

    setFeedback(null);
    setShowAdvancePopover((prev) => !prev);
  };

  // CONFIRM AND EXECUTE ADVANCE DIRECTLY FROM 'GESTIONAR' POPOVER (RELOCATES TO ORDERS LIST)
  const handleConfirmAdvanceFromManaging = async (targetStage: string) => {
    if (!managingOrder) return;
    setAdvancingFromManaging(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/sys/orders/${managingOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStage,
          serviceType: manageForm.serviceType,
          shippingAddress: manageForm.shippingAddress.trim() || null,
          staffNotes: manageForm.staffNotes.trim() || null,
          supplierNotes: manageForm.supplierNotes.trim() || null,
          paymentProofUrl: manageForm.paymentProofUrl.trim() || null,
          servicePaymentProofUrl: manageForm.servicePaymentProofUrl.trim() || null,
          installationPaymentProofUrl: manageForm.installationPaymentProofUrl.trim() || null,
          installationDurationMinutes: manageForm.installationDurationMinutes || 60,
          orderPartsCostCRC: manageForm.orderPartsCostCRC !== "" ? Math.max(0, Math.round(Number(manageForm.orderPartsCostCRC) || 0)) : undefined,
          purchaseProofUrls: manageForm.purchaseProofUrls,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === managingOrder.id
              ? {
                  ...o,
                  status: targetStage,
                  serviceType: manageForm.serviceType,
                  shippingAddress: manageForm.shippingAddress.trim() || null,
                  staffNotes: manageForm.staffNotes.trim() || null,
                  supplierNotes: manageForm.supplierNotes.trim() || null,
                  paymentProofUrl: manageForm.paymentProofUrl.trim() || null,
                  servicePaymentProofUrl: manageForm.servicePaymentProofUrl.trim() || null,
                  installationPaymentProofUrl: manageForm.installationPaymentProofUrl.trim() || null,
                  purchaseProofUrls: manageForm.purchaseProofUrls,
                  serviceDocumentsJson: JSON.stringify({
                    ...(typeof o.serviceDocumentsJson === "string" ? JSON.parse(o.serviceDocumentsJson || "{}") : (o.serviceDocumentsJson || {})),
                    ...(manageForm.orderPartsCostCRC !== "" ? { orderPartsCostCRC: Number(manageForm.orderPartsCostCRC) } : {}),
                    purchaseProofUrls: manageForm.purchaseProofUrls,
                  }),
                  updatedAt: new Date().toISOString(),
                }
              : o
          )
        );

        setShowAdvancePopover(false);
        setConfirmModal(null);
        setManagingOrder(null);
        onOrderUpdated?.();

        setFeedback({
          type: "success",
          msg:
            lang === "es"
              ? `Pedido #${managingOrder.orderNumber} avanzado a ${getStageLabel(targetStage)} exitosamente.`
              : `Order #${managingOrder.orderNumber} successfully advanced to ${getStageLabel(targetStage)}.`,
        });
      } else {
        setFeedback({
          type: "error",
          msg: data.error || (lang === "es" ? "Error al avanzar el pedido." : "Failed to advance order."),
        });
      }
    } catch (err) {
      console.error("Advance from managing error:", err);
      setFeedback({
        type: "error",
        msg: lang === "es" ? "Error al conectar para avanzar pedido." : "Connection error while advancing order.",
      });
    } finally {
      setAdvancingFromManaging(false);
    }
  };

  const handleAdvanceFromManaging = (_targetOrder: OrderData, targetStage: string) => {
    handleTriggerAdvancePopover(targetStage);
  };

  const handleExecuteStatusUpdate = async () => {
    if (!confirmModal) return;

    setUpdating(true);
    try {
      const modalOrder = orders.find((o) => o.id === confirmModal.orderId);
      const patchBody: any = { status: confirmModal.targetStatus };
      if (modalOrder?.paymentProofUrl && modalOrder.paymentProofUrl.startsWith("BAC_COMPRA_CLICK_AUTH:")) {
        patchBody.paymentProofUrl = modalOrder.paymentProofUrl;
      }

      const res = await fetch(`/api/sys/orders/${confirmModal.orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === confirmModal.orderId
              ? { ...o, status: confirmModal.targetStatus, updatedAt: new Date().toISOString() }
              : o
          )
        );
        if (managingOrder && managingOrder.id === confirmModal.orderId) {
          setManagingOrder((prev) => (prev ? { ...prev, status: confirmModal.targetStatus, updatedAt: new Date().toISOString() } : null));
          setManageForm((prev) => ({ ...prev, status: confirmModal.targetStatus }));
        }
        onOrderUpdated?.();
        setFeedback({
          type: "success",
          msg: `Pedido #${confirmModal.orderNumber} actualizado a ${getStageLabel(confirmModal.targetStatus)}.`,
        });
        setConfirmModal(null);
      } else {
        setFeedback({ type: "error", msg: data.error || "Error al actualizar pedido." });
      }
    } catch (err) {
      console.error("Update error:", err);
      setFeedback({ type: "error", msg: "Error de conexión al actualizar." });
    } finally {
      setUpdating(false);
    }
  };

  // ORDER ELIMINATION HANDLERS
  const handleOpenDeleteModal = (order: OrderData) => {
    setDeleteModal(order);
    setDeleteMasterPassword("");
    setDeleteError(null);
    setFeedback(null);
  };

  const handleExecuteDeleteOrder = async () => {
    if (!deleteModal) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/sys/orders/${deleteModal.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterPassword: deleteMasterPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrders((prev) => prev.filter((o) => o.id !== deleteModal.id));
        setFeedback({
          type: "success",
          msg: `${lang === "es" ? "Pedido" : "Order"} #${deleteModal.orderNumber} ${t.orderDeleteSuccessMsg}`,
        });
        setDeleteModal(null);
        setDeleteMasterPassword("");
        setDeleteError(null);
        onOrderDeleted?.();
      } else {
        setDeleteError(data.error || (lang === "es" ? "Error al eliminar pedido." : "Error deleting order."));
      }
    } catch (err) {
      console.error("Delete order error:", err);
      setDeleteError(lang === "es" ? "Error de conexión al eliminar pedido." : "Network error on order delete.");
    } finally {
      setDeleting(false);
    }
  };

  // OPEN QUOTATION EDIT SCREEN (ONLY COTIZACION STATUS)
  const handleOpenEditQuote = (order: OrderData) => {
    let parsedItems: OrderItem[] = [];
    try {
      parsedItems = JSON.parse(order.itemsJson) || [];
    } catch {
      parsedItems = [];
    }

    setEditingQuoteOrder(order);
    setQuoteForm({
      customerName: order.customerName || "",
      customerPhone: order.customerPhone || "",
      guestEmail: order.guestEmail || "",
      serviceType: order.serviceType || "STORE_PICKUP",
      shippingAddress: order.shippingAddress || "",
      items: parsedItems,
      notes: order.notes || "",
      staffNotes: order.staffNotes || "",
    });
    setNewItemName("");
    setNewItemPrice("");
    setNewItemQty("1");
    setQuoteDiscountType((order.discountType as any) || "NONE");
    setQuoteDiscountValue(String(order.discountValue || 0));
    setQuoteDiscountReason(order.discountReason || "");
    setQuoteMasterPassword("");
    setQuoteItemSearch("");
    setIsQuoteSearchOpen(false);

    const validTransportType = (["STORE_PICKUP", "HOME_SERVICE", "UTV_PICKUP", "SHIPPING"].includes(order.serviceType || "")
      ? order.serviceType
      : "STORE_PICKUP") as "STORE_PICKUP" | "HOME_SERVICE" | "UTV_PICKUP" | "SHIPPING";
    setTransportActiveTab(validTransportType);
    setTransportAddress(order.shippingAddress || (validTransportType === "STORE_PICKUP" ? "Calle 34, Pozos, Santa Ana, San José, CR" : ""));
    const vehicleMatch = (order.notes || "").match(/\[Vehículo Registrado:\s*([^\]]+)\]/);
    if (vehicleMatch && vehicleMatch[1]) {
      setTransportVehicle(vehicleMatch[1]);
    } else {
      setTransportVehicle("");
    }
    setTransportDate("");
    setTransportTimeSlot("10:00");
    setTransportRequirements("");
    setIsTransportModalOpen(false);

    setFeedback(null);
  };

  const handleAddCatalogItemToQuote = (item: {
    name: string;
    sku?: string;
    priceCRC: number;
  }) => {
    const existingIndex = quoteForm.items.findIndex(
      (it) => it.sku === item.sku || it.name === item.name
    );
    if (existingIndex > -1) {
      const updated = [...quoteForm.items];
      updated[existingIndex].quantity = (updated[existingIndex].quantity || 1) + 1;
      setQuoteForm({ ...quoteForm, items: updated });
    } else {
      setQuoteForm({
        ...quoteForm,
        items: [
          ...quoteForm.items,
          {
            name: item.name,
            sku: item.sku,
            priceCRC: item.priceCRC,
            quantity: 1,
          },
        ],
      });
    }
    setQuoteItemSearch("");
    setIsQuoteSearchOpen(false);
  };

  // SAVE EDITED QUOTATION
  const handleSaveQuotationEdit = async () => {
    if (!editingQuoteOrder) return;
    setSavingEdit(true);

    const grossTotal = quoteForm.items.reduce(
      (sum, it) => sum + (Number(it.priceCRC) || 0) * (Number(it.quantity) || 1),
      0
    );

    let discountCRC = 0;
    const numDiscVal = Math.max(0, Number(quoteDiscountValue) || 0);
    if (quoteDiscountType === "PERCENTAGE") {
      discountCRC = Math.round((grossTotal * numDiscVal) / 100);
    } else if (quoteDiscountType === "FIXED") {
      discountCRC = numDiscVal;
    }
    const finalNetTotal = Math.max(0, grossTotal - discountCRC);

    if (numDiscVal > 0 && !quoteMasterPassword.trim() && numDiscVal !== editingQuoteOrder.discountValue) {
      setFeedback({
        type: "error",
        msg: lang === "es"
          ? "Se requiere la contraseña de usuario Master para autorizar descuentos."
          : "Master password is required to authorize discounts.",
      });
      setSavingEdit(false);
      return;
    }

    try {
      const res = await fetch(`/api/sys/orders/${editingQuoteOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: quoteForm.customerName.trim() || null,
          customerPhone: quoteForm.customerPhone.trim() || null,
          guestEmail: quoteForm.guestEmail.trim() || null,
          serviceType: quoteForm.serviceType,
          shippingAddress: quoteForm.shippingAddress.trim() || null,
          items: quoteForm.items,
          itemsJson: JSON.stringify(quoteForm.items),
          totalCRC: finalNetTotal,
          partsSubtotalCRC: grossTotal,
          discountType: quoteDiscountType,
          discountValue: numDiscVal,
          discountReason: quoteDiscountReason || null,
          masterPassword: quoteMasterPassword || undefined,
          notes: quoteForm.notes.trim() || null,
          staffNotes: quoteForm.staffNotes.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === editingQuoteOrder.id
              ? {
                  ...o,
                  customerName: quoteForm.customerName.trim() || null,
                  customerPhone: quoteForm.customerPhone.trim() || null,
                  guestEmail: quoteForm.guestEmail.trim() || null,
                  serviceType: quoteForm.serviceType,
                  shippingAddress: quoteForm.shippingAddress.trim() || null,
                  itemsJson: JSON.stringify(quoteForm.items),
                  totalCRC: finalNetTotal,
                  partsSubtotalCRC: grossTotal,
                  discountType: quoteDiscountType,
                  discountValue: numDiscVal,
                  discountReason: quoteDiscountReason || null,
                  notes: quoteForm.notes.trim() || null,
                  staffNotes: quoteForm.staffNotes.trim() || null,
                  updatedAt: new Date().toISOString(),
                }
              : o
          )
        );
        setFeedback({
          type: "success",
          msg: `Cotización #${editingQuoteOrder.orderNumber} actualizada con éxito.`,
        });
        setEditingQuoteOrder(null);
        onOrderUpdated?.();
      } else {
        setFeedback({
          type: "error",
          msg: data.error || (lang === "es" ? "Error al actualizar cotización." : "Error updating quotation."),
        });
      }
    } catch (err) {
      console.error("Save quote edit error:", err);
      setFeedback({ type: "error", msg: "Error al conectar para actualizar cotización." });
    } finally {
      setSavingEdit(false);
    }
  };

  // OPEN POST-QUOTATION MANAGEMENT SCREEN
  const handleOpenManageOrder = (order: OrderData) => {
    setConfirmModal(null);
    setShowAdvancePopover(false);
    setManagingOrder(order);
    let initialPartsCost = "";
    let initialPurchaseProofs: string[] = [];
    let initialDurationMinutes = 60;
    if (Array.isArray(order.purchaseProofUrls)) {
      initialPurchaseProofs = order.purchaseProofUrls;
    }
    if (order.serviceDocumentsJson) {
      try {
        const parsed = typeof order.serviceDocumentsJson === "string" ? JSON.parse(order.serviceDocumentsJson) : order.serviceDocumentsJson;
        if (typeof parsed?.orderPartsCostCRC === "number") {
          initialPartsCost = String(parsed.orderPartsCostCRC);
        }
        if (typeof parsed?.installationDurationMinutes === "number" && parsed.installationDurationMinutes > 0) {
          initialDurationMinutes = parsed.installationDurationMinutes;
        }
        if (initialPurchaseProofs.length === 0 && Array.isArray(parsed?.purchaseProofUrls)) {
          initialPurchaseProofs = parsed.purchaseProofUrls;
        }
      } catch {}
    }
    if (initialDurationMinutes === 60 && order.itemsJson) {
      try {
        const items = typeof order.itemsJson === "string" ? JSON.parse(order.itemsJson) : order.itemsJson;
        if (Array.isArray(items) && items.length > 0) {
          const sum = items.reduce((acc: number, it: any) => acc + (Number(it.installationDurationMinutes) || 60) * (Number(it.quantity) || 1), 0);
          if (sum > 0) initialDurationMinutes = sum;
        }
      } catch {}
    }
    setManageForm({
      status: order.status,
      serviceType: order.serviceType || "STORE_PICKUP",
      shippingAddress: order.shippingAddress || "",
      staffNotes: order.staffNotes || "",
      supplierNotes: order.supplierNotes || "",
      paymentProofUrl: order.paymentProofUrl || "",
      servicePaymentProofUrl: order.servicePaymentProofUrl || "",
      installationPaymentProofUrl: order.installationPaymentProofUrl || "",
      installationDurationMinutes: initialDurationMinutes,
      orderPartsCostCRC: initialPartsCost,
      purchaseProofUrls: initialPurchaseProofs,
    });
    setFeedback(null);
  };

  // SAVE MANAGEMENT UPDATES
  const handleSaveManagementUpdate = async () => {
    if (!managingOrder) return;

    const currentUpper = (managingOrder.status || "").toUpperCase();
    const targetUpper = (manageForm.status || "").toUpperCase();
    const stagesPastInstalling = [
      "READY_TO_SET_RETURN_DATE",
      "READY_FOR_PICKUP",
      "READY_TO_PICK_UP",
      "COMPLETED",
    ];
    const hasInstallation =
      (managingOrder.laborSubtotalCRC || 0) > 0 || (managingOrder.installationCostCRC || 0) > 0;

    // RULE 1: Can't advance without order payment in 'confirmacion de pago' state
    if (
      currentUpper === "PAYMENT_CONFIRMATION" &&
      targetUpper !== "PAYMENT_CONFIRMATION" &&
      targetUpper !== "PAYMENT_REJECTED" &&
      targetUpper !== "CANCELLED"
    ) {
      const hasOrderProof = Boolean(
        manageForm.paymentProofUrl.trim() || managingOrder.paymentProofUrl
      );
      if (!hasOrderProof) {
        setFeedback({
          type: "error",
          msg:
            lang === "es"
              ? "No se puede avanzar el pedido: se requiere adjuntar el comprobante de pago de la orden en el estado 'Confirmación de Pago'."
              : "Cannot advance order: order payment proof must be attached in the 'Payment Confirmation' state.",
        });
        return;
      }
    }

    // RULE BUY PROOF (PIPELINE): Can't advance from 'NEED_TO_GET_ORDER' without purchase proof images (*un)
    if (
      currentUpper === "NEED_TO_GET_ORDER" &&
      targetUpper !== "NEED_TO_GET_ORDER" &&
      targetUpper !== "PAYMENT_REJECTED" &&
      targetUpper !== "CANCELLED"
    ) {
      let proofCount = 0;
      if (Array.isArray(manageForm.purchaseProofUrls) && manageForm.purchaseProofUrls.length > 0) {
        proofCount = manageForm.purchaseProofUrls.length;
      } else if (Array.isArray(managingOrder.purchaseProofUrls) && managingOrder.purchaseProofUrls.length > 0) {
        proofCount = managingOrder.purchaseProofUrls.length;
      } else if (managingOrder.serviceDocumentsJson) {
        try {
          const doc = typeof managingOrder.serviceDocumentsJson === "string" ? JSON.parse(managingOrder.serviceDocumentsJson) : managingOrder.serviceDocumentsJson;
          if (Array.isArray(doc?.purchaseProofUrls)) {
            proofCount = doc.purchaseProofUrls.length;
          }
        } catch {}
      }

      if (proofCount === 0) {
        setFeedback({
          type: "error",
          msg:
            lang === "es"
              ? "No se puede avanzar el pedido: se requiere adjuntar al menos un comprobante de compra de repuestos (proveedor) en el estado 'Por Ordenar Piezas (*un)'."
              : "Cannot advance order: at least one supplier purchase proof receipt must be attached in the 'Need to Get Order (*un)' state.",
        });
        return;
      }
    }

    // RULE 2: Can't advance without service payment proof in 'confirmar pago de servicio' state
    if (
      currentUpper === "CONFIRM_SERVICE_PAYMENT" &&
      targetUpper !== "CONFIRM_SERVICE_PAYMENT" &&
      targetUpper !== "CANCELLED"
    ) {
      const hasServiceProof = Boolean(
        manageForm.servicePaymentProofUrl.trim() ||
        managingOrder.servicePaymentProofUrl ||
        managingOrder.serviceSchedule?.paymentProofUrl
      );
      if (!hasServiceProof) {
        setFeedback({
          type: "error",
          msg:
            lang === "es"
              ? "No se puede avanzar el pedido: se requiere adjuntar el comprobante de pago del servicio en el estado 'Confirmar Pago de Servicio'."
              : "Cannot advance order: service payment proof must be attached in the 'Confirm Service Payment' state.",
        });
        return;
      }
    }

    const skipInstallPayment = shouldSkipInstallationPayment(
      managingOrder,
      managingOrder.installationCostCRC,
      managingOrder.laborSubtotalCRC
    );
    const requiresInstall = isServiceRequiringInstallation(manageForm.serviceType || managingOrder.serviceType);

    // RULE 3: In any service that requires installation, installation payment is a requirement.
    const isTargetRequiringInstallPayment =
      requiresInstall &&
      !skipInstallPayment &&
      (
        targetUpper === "COMPLETED" ||
        targetUpper === "READY_TO_SET_RETURN_DATE" ||
        (currentUpper === "INSTALLATION_PAYMENT" && targetUpper !== "INSTALLATION_PAYMENT" && targetUpper !== "CANCELLED")
      );

    if (isTargetRequiringInstallPayment) {
      const hasInstallProof = Boolean(
        manageForm.installationPaymentProofUrl.trim() ||
        managingOrder.installationPaymentProofUrl ||
        managingOrder.isInstallationPaymentConfirmed
      );
      if (!hasInstallProof) {
        setFeedback({
          type: "error",
          msg:
            lang === "es"
              ? "No se puede avanzar el pedido: se requiere adjuntar el comprobante de pago de instalación para este servicio."
              : "Cannot advance order: installation payment proof must be attached for this service.",
        });
        return;
      }

      if (!managingOrder.isInstallationPaymentConfirmed) {
        setFeedback({
          type: "error",
          msg:
            lang === "es"
              ? "No se puede avanzar el pedido más allá del estado de pago de instalación porque el pago de mano de obra no ha sido confirmado por el staff."
              : "Cannot advance order past installation payment because installation labor payment has not been confirmed by staff.",
        });
        return;
      }
    }

    setSavingEdit(true);

    try {
      const res = await fetch(`/api/sys/orders/${managingOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: manageForm.status,
          serviceType: manageForm.serviceType,
          shippingAddress: manageForm.shippingAddress.trim() || null,
          staffNotes: manageForm.staffNotes.trim() || null,
          supplierNotes: manageForm.supplierNotes.trim() || null,
          paymentProofUrl: manageForm.paymentProofUrl.trim() || null,
          servicePaymentProofUrl: manageForm.servicePaymentProofUrl.trim() || null,
          installationPaymentProofUrl: manageForm.installationPaymentProofUrl.trim() || null,
          installationDurationMinutes: manageForm.installationDurationMinutes || 60,
          orderPartsCostCRC: manageForm.orderPartsCostCRC !== "" ? Math.max(0, Math.round(Number(manageForm.orderPartsCostCRC) || 0)) : undefined,
          purchaseProofUrls: manageForm.purchaseProofUrls,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === managingOrder.id
              ? {
                  ...o,
                  status: manageForm.status,
                  serviceType: manageForm.serviceType,
                  shippingAddress: manageForm.shippingAddress.trim() || null,
                  staffNotes: manageForm.staffNotes.trim() || null,
                  supplierNotes: manageForm.supplierNotes.trim() || null,
                  paymentProofUrl: manageForm.paymentProofUrl.trim() || null,
                  servicePaymentProofUrl: manageForm.servicePaymentProofUrl.trim() || null,
                  installationPaymentProofUrl: manageForm.installationPaymentProofUrl.trim() || null,
                  purchaseProofUrls: manageForm.purchaseProofUrls,
                  serviceDocumentsJson: JSON.stringify({
                    ...(typeof o.serviceDocumentsJson === "string" ? JSON.parse(o.serviceDocumentsJson || "{}") : (o.serviceDocumentsJson || {})),
                    ...(manageForm.orderPartsCostCRC !== "" ? { orderPartsCostCRC: Number(manageForm.orderPartsCostCRC) } : {}),
                    purchaseProofUrls: manageForm.purchaseProofUrls,
                  }),
                  updatedAt: new Date().toISOString(),
                }
              : o
          )
        );

        setFeedback({
          type: "success",
          msg: `Pedido #${managingOrder.orderNumber} gestionado exitosamente.`,
        });
        setShowAdvancePopover(false);
        setConfirmModal(null);
        setManagingOrder(null);
        onOrderUpdated?.();
      } else {
        setFeedback({
          type: "error",
          msg: data.error || "Error al guardar gestión de pedido.",
        });
      }
    } catch (err) {
      console.error("Manage order error:", err);
      setFeedback({ type: "error", msg: "Error al conectar para guardar gestión." });
    } finally {
      setSavingEdit(false);
    }
  };

  // UPLOAD OR REPLACE PAYMENT PROOF AS STAFF (ORDER, SERVICE, OR INSTALLATION)
  const handleStaffUploadProof = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetOrder: OrderData,
    proofField: "paymentProofUrl" | "servicePaymentProofUrl" | "installationPaymentProofUrl" = "paymentProofUrl"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (proofField === "servicePaymentProofUrl") setUploadingServiceProof(true);
    else if (proofField === "installationPaymentProofUrl") setUploadingInstallProof(true);
    else setUploadingProof(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "payments");

      const upRes = await fetch("/api/sys/upload", {
        method: "POST",
        body: formData,
      });
      let upData: any = null;
      try {
        const rawText = await upRes.text();
        upData = JSON.parse(rawText);
      } catch {
        if (upRes.status === 413) {
          throw new Error("El archivo supera el tamaño máximo permitido por el servidor (413).");
        }
        throw new Error(`Error del servidor (${upRes.status})`);
      }
      if (!upRes.ok || !upData?.success || !upData?.url) {
        throw new Error(upData?.error || "Error al subir comprobante");
      }

      const uploadedUrl = upData.url;
      const isAdvancingFromCotizacion = targetOrder.status === "COTIZACION" && proofField === "paymentProofUrl";
      const patchPayload: any = { [proofField]: uploadedUrl };
      if (isAdvancingFromCotizacion) {
        patchPayload.status = "PAYMENT_CONFIRMATION";
      }

      const patchRes = await fetch(`/api/sys/orders/${targetOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchPayload),
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok || !patchData.success) {
        throw new Error(patchData.error || "Error al asociar comprobante al pedido");
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === targetOrder.id
            ? {
                ...o,
                [proofField]: uploadedUrl,
                ...(isAdvancingFromCotizacion ? { status: "PAYMENT_CONFIRMATION" } : {}),
              }
            : o
        )
      );
      if (managingOrder && managingOrder.id === targetOrder.id) {
        setManagingOrder((prev) =>
          prev
            ? {
                ...prev,
                [proofField]: uploadedUrl,
                ...(isAdvancingFromCotizacion ? { status: "PAYMENT_CONFIRMATION" } : {}),
              }
            : null
        );
        setManageForm((prev) => ({
          ...prev,
          [proofField]: uploadedUrl,
          ...(isAdvancingFromCotizacion ? { status: "PAYMENT_CONFIRMATION" } : {}),
        }));
      }
      onOrderUpdated?.();
      setFeedback({
        type: "success",
        msg: isAdvancingFromCotizacion
          ? (lang === "es"
              ? "Comprobante cargado exitosamente. Orden avanzada a Confirmación de Pago."
              : "Payment receipt uploaded successfully. Order moved to Payment Confirmation.")
          : (lang === "es"
              ? "Comprobante cargado y asociado al pedido exitosamente."
              : "Payment receipt uploaded and linked successfully."),
      });
    } catch (err: any) {
      console.error("Upload proof error:", err);
      setFeedback({
        type: "error",
        msg: err.message || (lang === "es" ? "Error al subir comprobante de pago." : "Failed to upload payment receipt."),
      });
    } finally {
      if (proofField === "servicePaymentProofUrl") setUploadingServiceProof(false);
      else if (proofField === "installationPaymentProofUrl") setUploadingInstallProof(false);
      else setUploadingProof(false);
      e.target.value = "";
    }
  };

  // UPLOAD SUPPLIER PURCHASE PROOFS AS STAFF (MULTIPLE IMAGES SUPPORTED)
  const handleStaffUploadPurchaseProof = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetOrder: OrderData
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPurchaseProof(true);
    setFeedback(null);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "payments");

        const upRes = await fetch("/api/sys/upload", {
          method: "POST",
          body: formData,
        });
        let upData: any = null;
        try {
          const rawText = await upRes.text();
          upData = JSON.parse(rawText);
        } catch {
          if (upRes.status === 413) {
            throw new Error("El archivo supera el tamaño máximo permitido por el servidor (413).");
          }
          throw new Error(`Error del servidor (${upRes.status})`);
        }
        if (!upRes.ok || !upData?.success || !upData?.url) {
          throw new Error(upData?.error || "Error al subir comprobante de compra");
        }
        uploadedUrls.push(upData.url);
      }

      let currentProofs: string[] = manageForm.purchaseProofUrls || [];
      if (currentProofs.length === 0) {
        if (Array.isArray(targetOrder.purchaseProofUrls)) {
          currentProofs = [...targetOrder.purchaseProofUrls];
        } else if (targetOrder.serviceDocumentsJson) {
          try {
            const parsed = typeof targetOrder.serviceDocumentsJson === "string" ? JSON.parse(targetOrder.serviceDocumentsJson) : targetOrder.serviceDocumentsJson;
            if (Array.isArray(parsed?.purchaseProofUrls)) {
              currentProofs = [...parsed.purchaseProofUrls];
            }
          } catch {}
        }
      }

      const updatedProofs = [...currentProofs, ...uploadedUrls];

      const patchRes = await fetch(`/api/sys/orders/${targetOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseProofUrls: updatedProofs }),
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok || !patchData.success) {
        throw new Error(patchData.error || "Error al asociar comprobantes de compra al pedido");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === targetOrder.id ? { ...o, purchaseProofUrls: updatedProofs } : o))
      );
      if (managingOrder && managingOrder.id === targetOrder.id) {
        setManagingOrder((prev) => (prev ? { ...prev, purchaseProofUrls: updatedProofs } : null));
        setManageForm((prev) => ({ ...prev, purchaseProofUrls: updatedProofs }));
      }
      setFeedback({
        type: "success",
        msg:
          lang === "es"
            ? `${uploadedUrls.length} comprobante(s) de compra cargado(s) y asociado(s) exitosamente.`
            : `${uploadedUrls.length} purchase proof receipt(s) uploaded and linked successfully.`,
      });
    } catch (err: any) {
      console.error("Upload purchase proof error:", err);
      setFeedback({
        type: "error",
        msg: err.message || (lang === "es" ? "Error al subir comprobante de compra." : "Failed to upload purchase receipt."),
      });
    } finally {
      setUploadingPurchaseProof(false);
      e.target.value = "";
    }
  };

  // DELETE A SUPPLIER PURCHASE PROOF
  const handleStaffDeletePurchaseProof = async (urlToDelete: string, targetOrder: OrderData) => {
    const currentProofs = manageForm.purchaseProofUrls || targetOrder.purchaseProofUrls || [];
    const updatedProofs = currentProofs.filter((u) => u !== urlToDelete);

    try {
      const patchRes = await fetch(`/api/sys/orders/${targetOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseProofUrls: updatedProofs }),
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok || !patchData.success) {
        throw new Error(patchData.error || "Error al eliminar comprobante de compra");
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === targetOrder.id ? { ...o, purchaseProofUrls: updatedProofs } : o))
      );
      if (managingOrder && managingOrder.id === targetOrder.id) {
        setManagingOrder((prev) => (prev ? { ...prev, purchaseProofUrls: updatedProofs } : null));
        setManageForm((prev) => ({ ...prev, purchaseProofUrls: updatedProofs }));
      }
      setFeedback({
        type: "success",
        msg: lang === "es" ? "Comprobante de compra eliminado." : "Purchase proof deleted.",
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        msg: err.message || (lang === "es" ? "Error al eliminar comprobante." : "Failed to delete proof."),
      });
    }
  };

  // OPEN INSTANT PROOF INSPECTION MODAL
  const handleInspectProof = (
    order: OrderData,
    type: "ORDER" | "SERVICE" | "INSTALLATION"
  ) => {
    const isManagingThis = managingOrder && managingOrder.id === order.id;
    let imageUrl = (isManagingThis && manageForm.paymentProofUrl) ? manageForm.paymentProofUrl : (order.paymentProofUrl || "");
    let title = t.orderPaymentProofTitle;
    let subtitle = order.customerName || order.guestEmail || "Cliente";
    let targetAmountLabel = lang === "es" ? "Monto a Confirmar (Repuestos):" : "Amount to Confirm (Parts):";
    let targetAmountCRC = order.partsSubtotalCRC || order.totalCRC;

    if (type === "SERVICE") {
      imageUrl = (isManagingThis && manageForm.servicePaymentProofUrl) ? manageForm.servicePaymentProofUrl : (order.servicePaymentProofUrl || "");
      title = t.orderServicePaymentProofTitle;
      subtitle = t.orderServicePaymentProofSubtitle;
      targetAmountLabel = lang === "es" ? "Monto a Confirmar (Servicio / Transporte):" : "Amount to Confirm (Service / Transport):";
      targetAmountCRC =
        (Number(order.pickupCostCRC) || 0) + (Number(order.shippingCostCRC) || 0) ||
        Number(order.serviceSchedule?.costCRC) ||
        0;
    } else if (type === "INSTALLATION") {
      imageUrl = (isManagingThis && manageForm.installationPaymentProofUrl) ? manageForm.installationPaymentProofUrl : (order.installationPaymentProofUrl || "");
      title = t.orderInstallationPaymentProofTitle;
      subtitle =
        order.serviceType === "UTV_PICKUP"
          ? t.orderPickupClientNotice
          : t.orderStaffManagedNotice;
      targetAmountLabel = lang === "es" ? "Monto a Confirmar (Instalación / Mano de Obra):" : "Amount to Confirm (Installation / Labor):";
      targetAmountCRC = (Number(order.installationCostCRC) || 0) + (Number(order.laborSubtotalCRC) || 0);
    }

    if (!imageUrl) return;

    setPreviewProofModal({
      orderNumber: order.orderNumber,
      status: (isManagingThis && manageForm.status) ? manageForm.status : order.status,
      title,
      subtitle,
      imageUrl,
      totalCRC: order.totalCRC,
      targetAmountLabel,
      targetAmountCRC,
      paidCurrency: order.paidCurrency,
    });
  };


  // =========================================================================
  // SCREEN: QUOTATION EDIT VIEW (ONLY ORDERS IN STATUS 'COTIZACION')
  // =========================================================================
  if (editingQuoteOrder) {
    const grossTotal = quoteForm.items.reduce(
      (sum, it) => sum + (Number(it.priceCRC) || 0) * (Number(it.quantity) || 1),
      0
    );
    let discountCRC = 0;
    const numDiscVal = Math.max(0, Number(quoteDiscountValue) || 0);
    if (quoteDiscountType === "PERCENTAGE") {
      discountCRC = Math.round((grossTotal * numDiscVal) / 100);
    } else if (quoteDiscountType === "FIXED") {
      discountCRC = numDiscVal;
    }
    const currentTotal = Math.max(0, grossTotal - discountCRC);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditingQuoteOrder(null)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Volver a Pedidos</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900 font-mono">
                  #{editingQuoteOrder.orderNumber}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  {t.orderStatusCotizacion}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{t.orderEditQuoteTitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditingQuoteOrder(null)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white rounded-xl border border-slate-200 transition"
            >
              {t.orderCancelBtn}
            </button>
            <button
              type="button"
              onClick={handleSaveQuotationEdit}
              disabled={savingEdit}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{savingEdit ? t.devSaving : t.devSaveChanges}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* LEFT: Customer & Logistics & Important Notes */}
          <div className="space-y-6">
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <User className="w-4 h-4 text-slate-600" />
                <span>Datos del Cliente</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Nombre Completo:</label>
                  <input
                    type="text"
                    value={quoteForm.customerName}
                    onChange={(e) => setQuoteForm({ ...quoteForm, customerName: e.target.value })}
                    placeholder="Nombre del cliente..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Teléfono / WhatsApp:</label>
                    <input
                      type="text"
                      value={quoteForm.customerPhone}
                      onChange={(e) => setQuoteForm({ ...quoteForm, customerPhone: e.target.value })}
                      placeholder="+506 8888-8888"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Correo Electrónico:</label>
                    <input
                      type="email"
                      value={quoteForm.guestEmail}
                      onChange={(e) => setQuoteForm({ ...quoteForm, guestEmail: e.target.value })}
                      placeholder="cliente@ejemplo.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notes & Critical Information */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>{t.orderImportantNotesLabel}</span>
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Las notas están reservadas estrictamente para información importante de entrega, vehículo o especificaciones técnicas.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Notas del Pedido:</label>
                <textarea
                  rows={3}
                  value={quoteForm.notes}
                  onChange={(e) => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                  placeholder="Detalles críticos de entrega, especificaciones del SxS, fecha acordada..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Notas Técnicas Internas (Staff):</label>
                <textarea
                  rows={2}
                  value={quoteForm.staffNotes}
                  onChange={(e) => setQuoteForm({ ...quoteForm, staffNotes: e.target.value })}
                  placeholder="Instrucciones para mecánicos o personal de logística..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Items & Pricing Editor */}
          <div className="space-y-6">
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#C02030]" />
                  <span>Piezas & Artículos de la Cotización</span>
                </h3>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {quoteForm.items.length} {quoteForm.items.length === 1 ? "pieza" : "piezas"}
                </span>
              </div>

              {/* Items List (User Rule: Price cannot be changed, locked from catalog) */}
              <div className="space-y-2.5">
                {quoteForm.items.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No hay ítems en esta cotización.</p>
                ) : (
                  quoteForm.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-slate-900 block truncate">
                          {item.name || item.title || "Artículo"}
                        </span>
                        {item.sku && <span className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</span>}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] text-slate-400">Cant:</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity || 1}
                            onChange={(e) => {
                              const q = Math.max(1, parseInt(e.target.value) || 1);
                              const updated = [...quoteForm.items];
                              updated[idx] = { ...updated[idx], quantity: q };
                              setQuoteForm({ ...quoteForm, items: updated });
                            }}
                            className="w-14 bg-white border border-slate-200 rounded-lg p-1 text-center font-mono text-xs"
                          />
                        </div>

                        {/* Locked Price - User Rule: Remove ability to change product price */}
                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-400">Precio:</span>
                          <span className="font-bold font-mono text-xs text-slate-900">
                            {formatCRC(item.priceCRC || 0)}
                          </span>
                        </div>

                        <span className="font-black font-mono text-xs text-slate-900 hidden sm:inline-block">
                          {formatCRC((item.priceCRC || 0) * (item.quantity || 1))}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = quoteForm.items.filter((_, i) => i !== idx);
                            setQuoteForm({ ...quoteForm, items: updated });
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                          title="Eliminar ítem"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* SEARCH & ADD FROM CATALOG (SAME POPUP/UI AS CREATING AN ORDER - USER REQUIREMENT) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-800 block">
                  + Agregar Productos o Combos del Catálogo:
                </span>
                <div className="relative">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={quoteItemSearch}
                      onFocus={() => setIsQuoteSearchOpen(true)}
                      onChange={(e) => {
                        setQuoteItemSearch(e.target.value);
                        setIsQuoteSearchOpen(true);
                      }}
                      placeholder="Escribe para buscar por SKU o nombre..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition"
                    />
                  </div>

                  {/* Floating Results Popup UI */}
                  {isQuoteSearchOpen && quoteItemSearch.trim().length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-100 p-1">
                      {matchedQuoteItems.length > 0 ? (
                        matchedQuoteItems.map((item) => (
                          <button
                            key={`${item.type}_${item.id}`}
                            type="button"
                            onClick={() => handleAddCatalogItemToQuote(item)}
                            className="w-full p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between text-left transition group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                  item.type === "COMBO"
                                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                }`}
                              >
                                {item.type}
                              </span>
                              <div className="truncate">
                                <span className="font-bold text-xs text-slate-900 block truncate group-hover:text-[#C02030] transition-colors">
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">{item.sku}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 pl-2">
                              <span className="font-bold font-mono text-xs text-slate-900">
                                {formatCRC(item.priceCRC)}
                              </span>
                              <span className="p-1 rounded-md bg-slate-100 text-slate-600 group-hover:bg-[#C02030] group-hover:text-white transition">
                                <Plus className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No se encontraron artículos con &quot;{quoteItemSearch}&quot;.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Add Custom / Extra Piece Form */}
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-dashed border-slate-300 space-y-2">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                  O Pieza Especial no catalogada:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Descripción de pieza..."
                    className="sm:col-span-2 bg-white border border-slate-200 rounded-xl p-2 text-xs"
                  />
                  <input
                    type="number"
                    min="0"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="Precio en ₡..."
                    className="bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newItemName.trim()) return;
                      const newItem: OrderItem = {
                        name: newItemName.trim(),
                        priceCRC: parseInt(newItemPrice) || 0,
                        quantity: parseInt(newItemQty) || 1,
                      };
                      setQuoteForm({ ...quoteForm, items: [...quoteForm.items, newItem] });
                      setNewItemName("");
                      setNewItemPrice("");
                      setNewItemQty("1");
                    }}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>

              {/* DISCOUNT CONFIGURATION (PERCENTAGE OR DIRECT AMOUNT - REQUIRES MASTER PASSWORD) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-purple-600" />
                    <span>{t.orderDiscountTitle}</span>
                  </span>
                  {quoteDiscountType !== "NONE" && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-mono">
                      {quoteDiscountType === "PERCENTAGE"
                        ? `${quoteDiscountValue}% (-${formatCRC(discountCRC)})`
                        : `-${formatCRC(discountCRC)}`}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setQuoteDiscountType("NONE");
                      setQuoteDiscountValue("0");
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition ${
                      quoteDiscountType === "NONE"
                        ? "bg-slate-900 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Sin Descuento
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuoteDiscountType("PERCENTAGE")}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 ${
                      quoteDiscountType === "PERCENTAGE"
                        ? "bg-purple-600 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Percent className="w-3 h-3" />
                    <span>{t.orderDiscountTypePercent}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuoteDiscountType("FIXED")}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 ${
                      quoteDiscountType === "FIXED"
                        ? "bg-purple-600 text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <DollarSign className="w-3 h-3" />
                    <span>{t.orderDiscountTypeAmount}</span>
                  </button>
                </div>

                {quoteDiscountType !== "NONE" && (
                  <div className="space-y-2 pt-1 border-t border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">
                          {quoteDiscountType === "PERCENTAGE" ? "Porcentaje (%):" : "Monto en Colones (₡):"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={quoteDiscountType === "PERCENTAGE" ? "100" : undefined}
                          value={quoteDiscountValue}
                          onChange={(e) => setQuoteDiscountValue(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-purple-600"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Motivo (Opcional):</label>
                        <input
                          type="text"
                          value={quoteDiscountReason}
                          onChange={(e) => setQuoteDiscountReason(e.target.value)}
                          placeholder="Ej: Promoción cliente habitual..."
                          className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-900 text-[11px] font-bold">
                        <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>{t.orderDiscountMasterPasswordReq}</span>
                      </div>
                      <input
                        type="password"
                        name="auth_master_token_quote_discount"
                        autoComplete="new-password"
                        value={quoteMasterPassword}
                        onChange={(e) => setQuoteMasterPassword(e.target.value)}
                        placeholder={t.orderMasterPasswordPlaceholder}
                        className="w-full bg-white border border-amber-300 rounded-xl p-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Summary Card with Subtotal, Discount & Net Total */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Subtotal Piezas:</span>
                  <span className="font-mono font-semibold text-slate-200">{formatCRC(grossTotal)}</span>
                </div>
                {discountCRC > 0 && (
                  <div className="flex items-center justify-between text-xs text-purple-400">
                    <span>Descuento Aplicado:</span>
                    <span className="font-mono font-semibold">-{formatCRC(discountCRC)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Cotización</span>
                    <span className="text-[10px] text-slate-400">Recalculado con descuento</span>
                  </div>
                  <span className="text-xl font-black font-mono text-emerald-400">
                    {formatCRC(currentTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TRANSPORT SERVICE CONFIGURATION MODAL (Disabled - transport is configured in Services Agenda) */}
        {false && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-fade-in">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {t.orderTransportConfigModalTitle}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Configuración de logística, traslados y especificaciones técnicas para Cotización #{editingQuoteOrder?.orderNumber || ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTransportModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* TABS (Same 4 services as /servicios) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-slate-100/70 border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setTransportActiveTab("STORE_PICKUP");
                    if (!transportAddress) setTransportAddress("Calle 34, Pozos, Santa Ana, San José, CR");
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-start gap-1.5 ${
                    transportActiveTab === "STORE_PICKUP"
                      ? "bg-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20"
                      : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                  }`}
                >
                  <div className={`p-1.5 rounded-xl ${transportActiveTab === "STORE_PICKUP" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                    <Warehouse className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-slate-900">{t.serviceTabShopInstallation}</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">{t.serviceShopInstallationBadge}</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTransportActiveTab("HOME_SERVICE")}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-start gap-1.5 ${
                    transportActiveTab === "HOME_SERVICE"
                      ? "bg-white border-[#C02030] shadow-md ring-2 ring-[#C02030]/20"
                      : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                  }`}
                >
                  <div className={`p-1.5 rounded-xl ${transportActiveTab === "HOME_SERVICE" ? "bg-[#C02030] text-white" : "bg-slate-100 text-slate-700"}`}>
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-slate-900">{t.serviceTabInstallation}</span>
                    <span className="text-[10px] text-slate-500">A domicilio</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTransportActiveTab("SHIPPING")}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-start gap-1.5 ${
                    transportActiveTab === "SHIPPING"
                      ? "bg-white border-blue-600 shadow-md ring-2 ring-blue-500/20"
                      : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                  }`}
                >
                  <div className={`p-1.5 rounded-xl ${transportActiveTab === "SHIPPING" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-slate-900">{t.serviceTabDelivery}</span>
                    <span className="text-[10px] text-slate-500">Entrega repuestos</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTransportActiveTab("UTV_PICKUP")}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col items-start gap-1.5 ${
                    transportActiveTab === "UTV_PICKUP"
                      ? "bg-white border-slate-900 shadow-md ring-2 ring-slate-900/20"
                      : "bg-white/60 border-slate-200 text-slate-600 hover:bg-white"
                  }`}
                >
                  <div className={`p-1.5 rounded-xl ${transportActiveTab === "UTV_PICKUP" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-slate-900">{t.serviceTabPickup}</span>
                    <span className="text-[10px] text-slate-500">Grúa / Remolque</span>
                  </div>
                </button>
              </div>

              {/* Form Content per tab */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
                {/* 1. Address / Destination */}
                <div>
                  <label className="text-[11px] font-bold text-slate-800 block mb-1">
                    {transportActiveTab === "STORE_PICKUP"
                      ? "Ubicación del Taller (Pozos de Santa Ana):"
                      : transportActiveTab === "SHIPPING"
                      ? "Dirección de Entrega / Despacho:"
                      : transportActiveTab === "HOME_SERVICE"
                      ? "Dirección para Instalación a Domicilio:"
                      : "Dirección de Recogida del SxS / UTV:"}
                  </label>
                  <input
                    type="text"
                    value={transportAddress}
                    onChange={(e) => setTransportAddress(e.target.value)}
                    placeholder={
                      transportActiveTab === "STORE_PICKUP"
                        ? "Calle 34, Pozos, Santa Ana, San José, CR"
                        : "Provincia, cantón, distrito, dirección exacta..."
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                  {transportActiveTab === "STORE_PICKUP" && (
                    <p className="text-[10px] text-emerald-700 mt-1">
                      ℹ️ El cliente traslada su vehículo al taller principal de ZxZ Mods en Pozos de Santa Ana.
                    </p>
                  )}
                </div>

                {/* 2. Vehicle details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-800 block mb-1">
                      Vehículo del Cliente (Marca, Modelo, Año):
                    </label>
                    <input
                      type="text"
                      value={transportVehicle}
                      onChange={(e) => setTransportVehicle(e.target.value)}
                      placeholder="Ej: Can-Am Maverick X3 2024"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-800 block mb-1">
                      Horario Sugerido / Franja:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={transportDate}
                        onChange={(e) => setTransportDate(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                      <select
                        value={transportTimeSlot}
                        onChange={(e) => setTransportTimeSlot(e.target.value)}
                        className="w-28 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-900"
                      >
                        <option value="09:00">09:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="13:00">01:00 PM</option>
                        <option value="14:00">02:00 PM</option>
                        <option value="16:00">04:00 PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Technical Requirements */}
                <div>
                  <label className="text-[11px] font-bold text-slate-800 block mb-1">
                    Requisitos Técnicos & Condiciones para el Servicio:
                  </label>
                  <textarea
                    rows={2}
                    value={transportRequirements}
                    onChange={(e) => setTransportRequirements(e.target.value)}
                    placeholder={
                      transportActiveTab === "HOME_SERVICE"
                        ? "Ej: Espacio plano y techado disponible, toma de corriente 110V a menos de 10m..."
                        : transportActiveTab === "UTV_PICKUP"
                        ? "Ej: El UTV enciende y rueda, llaves disponibles, acceso amplio para plataforma..."
                        : "Detalles adicionales para la recepción o empaque de repuestos..."
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransportModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  {t.orderCancelBtn}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const finalAddr = transportAddress.trim() || (transportActiveTab === "STORE_PICKUP" ? "Calle 34, Pozos, Santa Ana, San José, CR" : "");
                    setQuoteForm((prev) => {
                      const serviceLabels: Record<string, string> = {
                        STORE_PICKUP: "Instalación en Taller Pozos",
                        HOME_SERVICE: "Instalación a Domicilio",
                        SHIPPING: "Envío / Delivery Repuestos",
                        UTV_PICKUP: "Pick-up SxS en Plataforma",
                      };
                      const sLabel = serviceLabels[transportActiveTab] || transportActiveTab;
                      let updatedNotes = prev.notes || "";
                      const regex = /\[Logística Transporte: [^\]]+\]/g;
                      const newLogisticsEntry = `[Logística Transporte: ${sLabel} | Ubicación: ${finalAddr || "No especificada"} | Fecha: ${transportDate || "Por coordinar"} ${transportTimeSlot} | Vehículo: ${transportVehicle || "No especificado"} | Requisitos: ${transportRequirements.trim() || "Estándar"}]`;

                      if (regex.test(updatedNotes)) {
                        updatedNotes = updatedNotes.replace(regex, newLogisticsEntry);
                      } else {
                        updatedNotes = updatedNotes ? `${updatedNotes}\n${newLogisticsEntry}` : newLogisticsEntry;
                      }

                      return {
                        ...prev,
                        serviceType: transportActiveTab,
                        shippingAddress: finalAddr,
                        notes: updatedNotes,
                      };
                    });
                    setIsTransportModalOpen(false);
                  }}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aplicar Servicio a Cotización</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // SHARED MODAL RENDERERS (LIGHTBOX, REJECTION, RETURN DELIVERY)
  // =========================================================================
  const renderPaymentProofLightbox = () => {
    const activeProof = previewProofModal || (previewPaymentProofOrder && previewPaymentProofOrder.paymentProofUrl ? {
      orderNumber: previewPaymentProofOrder.orderNumber,
      status: previewPaymentProofOrder.status,
      title: t.orderPaymentProofModalTitle,
      subtitle: previewPaymentProofOrder.customerName || previewPaymentProofOrder.guestEmail || "Cliente",
      imageUrl: previewPaymentProofOrder.paymentProofUrl,
      totalCRC: previewPaymentProofOrder.totalCRC,
      paidCurrency: previewPaymentProofOrder.paidCurrency,
    } : null);

    if (!activeProof || !activeProof.imageUrl) return null;

    const handleClose = () => {
      setPreviewProofModal(null);
      setPreviewPaymentProofOrder(null);
    };

    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
        <div className="relative bg-white rounded-3xl max-w-2xl w-full p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 text-sm">
                  #{activeProof.orderNumber}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStageColor(activeProof.status)}`}>
                  {getStageLabel(activeProof.status)}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 mt-1">
                {activeProof.title}
              </h4>
              {activeProof.subtitle && (
                <p className="text-[11px] text-slate-500">
                  {activeProof.subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={activeProof.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                title={t.orderPaymentProofNewTab}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 bg-slate-950 rounded-2xl p-2 flex items-center justify-center overflow-auto border border-slate-800">
            <img
              src={activeProof.imageUrl}
              alt={`${activeProof.title} #${activeProof.orderNumber}`}
              className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
            />
          </div>

          {/* Prominent Verification Amount Badge */}
          {activeProof.targetAmountCRC !== undefined && (
            <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 block">
                  {activeProof.targetAmountLabel || (lang === "es" ? "Monto a Confirmar:" : "Amount to Confirm:")}
                </span>
                <span className="text-xs text-amber-800">
                  {lang === "es" ? "Verifique que el comprobante coincida con este monto exacto." : "Verify that the receipt matches this exact amount."}
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono text-base sm:text-lg font-black text-amber-950">
                  ₡{Number(activeProof.targetAmountCRC).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-slate-100">
            <div className="text-slate-600">
              {activeProof.totalCRC ? (
                <>
                  <span>Total Global del Pedido: </span>
                  <strong className="font-mono font-extrabold text-slate-900">
                    {formatCRC(activeProof.totalCRC)}
                  </strong>
                  {activeProof.paidCurrency && (
                    <span className="ml-2 text-slate-500 font-medium">
                      ({activeProof.paidCurrency === "USD" ? "USD $" : "CRC ₡"})
                    </span>
                  )}
                </>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <a
                href={activeProof.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{t.orderPaymentProofNewTab}</span>
              </a>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition"
              >
                {t.orderCancelBtn}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };


  const renderRejectModal = () => {
    if (!rejectModalOrder) return null;
    const modalTitle =
      rejectPaymentType === "SERVICE"
        ? (t.orderRejectServiceModalTitle || "Rechazar Comprobante de Servicio")
        : rejectPaymentType === "INSTALLATION"
        ? (t.orderRejectInstallModalTitle || "Rechazar Comprobante de Instalación")
        : (t.orderRejectModalTitle || "Rechazar Comprobante de Pago");

    const modalPlaceholder =
      rejectPaymentType === "SERVICE"
        ? (lang === "es" ? "Ej: Comprobante ilegible, monto no coincide con la tarifa de traslado o no se refleja en la cuenta bancaria..." : "E.g.: Receipt unreadable, amount does not match transport rate or transfer not found...")
        : rejectPaymentType === "INSTALLATION"
        ? (lang === "es" ? "Ej: Comprobante ilegible, falta monto de piezas adicionales o mano de obra, o no se refleja en la cuenta..." : "E.g.: Receipt unreadable, missing amount for extra parts or labor, or transfer not found...")
        : (t.orderRejectReasonPlaceholder || "Ej: Comprobante ilegible, monto no coincide con la factura, número de referencia no encontrado...");

    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">{modalTitle}</h4>
                <p className="text-[11px] text-slate-500 font-mono">#{rejectModalOrder.orderNumber}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setRejectModalOrder(null);
                setRejectionReason("");
                setRejectError(null);
              }}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5">
                {t.orderRejectReasonPrompt}
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={modalPlaceholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white transition"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Este motivo se guardará en el pedido y se le mostrará al cliente para corregir su comprobante. El pedido pasará al estado de Pagos Rechazados.
              </p>
            </div>

            {rejectError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{rejectError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={rejecting}
                onClick={() => {
                  setRejectModalOrder(null);
                  setRejectionReason("");
                  setRejectError(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold text-xs transition"
              >
                {t.orderCancelBtn}
              </button>
              <button
                type="button"
                disabled={rejecting || !rejectionReason.trim()}
                onClick={handleConfirmPaymentRejection}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                {rejecting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
                <span>{t.orderRejectConfirmBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReturnDeliveryModal = () => {
    if (!returnDeliveryOrder) return null;
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 border border-purple-200 text-purple-700">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">{t.orderConfigureReturnDelivery}</h4>
                <p className="text-[11px] text-slate-500 font-mono">#{returnDeliveryOrder.orderNumber}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReturnDeliveryOrder(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl text-xs text-purple-900 space-y-1">
            <span className="font-bold block text-[11px]">{t.orderHalfRateDeliveryBadge}</span>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              {t.orderHalfRateDeliveryDesc}
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Dirección de Destino / Retorno del Vehículo:
              </label>
              <input
                type="text"
                value={returnAddress}
                onChange={(e) => setReturnAddress(e.target.value)}
                placeholder="Provincia, cantón, señas exactas..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Costo de Retorno (50% Tarifa Flete en ₡):
              </label>
              <input
                type="number"
                value={returnCostCRC}
                onChange={(e) => setReturnCostCRC(e.target.value)}
                placeholder="5000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-600"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Se sumará al costo del pedido y se asignará el flete al 50%.
              </span>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Notas / Instrucciones de Entrega:
              </label>
              <input
                type="text"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="Horario de recepción, persona de contacto..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={savingReturnDelivery}
                onClick={() => setReturnDeliveryOrder(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold text-xs transition"
              >
                {t.orderCancelBtn}
              </button>
              <button
                type="button"
                disabled={savingReturnDelivery}
                onClick={handleConfirmReturnDelivery}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                {savingReturnDelivery ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Asignar Entrega (50%)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SCREEN: POST-QUOTATION MANAGEMENT VIEW (ORDERS IN OR PAST COTIZACION)
  // =========================================================================
  if (managingOrder) {
    let parsedItems: OrderItem[] = [];
    try {
      parsedItems = JSON.parse(managingOrder.itemsJson) || [];
    } catch {
      parsedItems = [];
    }

    const detailedItems = parsedItems.map((item, idx) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const rawItemId = String(item.id || "").trim();
      const baseId = rawItemId.split("__")[0].replace(/^combo-/i, "").trim();
      const skuCandidate = String(item.sku || baseId || "").trim();
      const titleCandidate = String(item.title || item.name || "").trim();

      const matchedProduct = catalogProducts.find((p) => {
        if (baseId && (p.id?.toLowerCase() === baseId.toLowerCase() || p.sku?.toLowerCase() === baseId.toLowerCase() || p.slug?.toLowerCase() === baseId.toLowerCase())) {
          return true;
        }
        if (skuCandidate && (p.sku?.toLowerCase() === skuCandidate.toLowerCase() || p.id?.toLowerCase() === skuCandidate.toLowerCase() || p.slug?.toLowerCase() === skuCandidate.toLowerCase())) {
          return true;
        }
        if (titleCandidate && (p.nameEs?.toLowerCase() === titleCandidate.toLowerCase() || p.nameEn?.toLowerCase() === titleCandidate.toLowerCase() || p.p_title?.toLowerCase() === titleCandidate.toLowerCase())) {
          return true;
        }
        return false;
      });

      const matchedCombo = catalogCombos.find((c) => {
        if (baseId && (c.id?.toLowerCase() === baseId.toLowerCase() || c.slug?.toLowerCase() === baseId.toLowerCase())) {
          return true;
        }
        if (skuCandidate && (c.slug?.toLowerCase() === skuCandidate.toLowerCase() || c.id?.toLowerCase() === skuCandidate.toLowerCase())) {
          return true;
        }
        if (titleCandidate && (c.titleEs?.toLowerCase() === titleCandidate.toLowerCase() || c.titleEn?.toLowerCase() === titleCandidate.toLowerCase())) {
          return true;
        }
        return false;
      });

      const catalogParams: any[] = Array.isArray(matchedProduct?.parameters)
        ? matchedProduct.parameters
        : Array.isArray(matchedCombo?.parameters)
        ? matchedCombo.parameters
        : [];

      // Resolve selected parameters (from item.selectedParameters or reconstructed from __paramId_optId)
      let rawSelectedParams = Array.isArray(item.selectedParameters) ? [...item.selectedParameters] : [];
      if (rawSelectedParams.length === 0 && rawItemId.includes("__") && catalogParams.length > 0) {
        const segments = rawItemId.split("__").slice(1);
        segments.forEach((seg) => {
          const matchedParam = catalogParams.find((cp) => seg.startsWith(`${cp.id}_`));
          if (matchedParam && Array.isArray(matchedParam.options)) {
            const optId = seg.slice(matchedParam.id.length + 1);
            const matchedOpt = matchedParam.options.find((o: any) => o.id === optId);
            if (matchedOpt) {
              rawSelectedParams.push({
                parameterId: matchedParam.id,
                parameterName: lang === "es" ? matchedParam.nameEs : (matchedParam.nameEn || matchedParam.nameEs),
                optionId: matchedOpt.id,
                optionLabel: lang === "es" ? matchedOpt.labelEs : (matchedOpt.labelEn || matchedOpt.labelEs),
                priceDeltaCRC: matchedOpt.priceDeltaCRC || 0,
                colorHex: matchedOpt.colorHex,
                imageUrl: matchedOpt.imageUrl,
                supplierUrl: matchedOpt.supplierUrl || matchedParam.supplierUrl,
                linkedProductId: matchedOpt.linkedProductId,
              });
            }
          }
        });
      }

      const resolvedParameters = rawSelectedParams.map((sp) => {
        const cParam = catalogParams.find(
          (cp) =>
            cp.id === sp.parameterId ||
            cp.nameEs?.toLowerCase() === sp.parameterName?.toLowerCase() ||
            cp.nameEn?.toLowerCase() === sp.parameterName?.toLowerCase()
        );
        const cOpt = Array.isArray(cParam?.options)
          ? cParam.options.find(
              (o: any) =>
                o.id === sp.optionId ||
                o.labelEs?.toLowerCase() === sp.optionLabel?.toLowerCase() ||
                o.labelEn?.toLowerCase() === sp.optionLabel?.toLowerCase()
            )
          : null;

        const label = sp.optionLabel || (lang === "es" ? cOpt?.labelEs : (cOpt?.labelEn || cOpt?.labelEs)) || "";
        const linkedProdId = sp.linkedProductId || cOpt?.linkedProductId || "";
        const linkedProd = linkedProdId
          ? catalogProducts.find(
              (lp) =>
                lp.id?.toLowerCase() === linkedProdId.toLowerCase() ||
                lp.sku?.toLowerCase() === linkedProdId.toLowerCase() ||
                lp.slug?.toLowerCase() === linkedProdId.toLowerCase()
            )
          : null;

        return {
          parameterId: sp.parameterId || cParam?.id || "",
          parameterName: sp.parameterName || (lang === "es" ? cParam?.nameEs : (cParam?.nameEn || cParam?.nameEs)) || "Parámetro",
          optionId: sp.optionId || cOpt?.id || "",
          optionLabel: label,
          priceDeltaCRC: sp.priceDeltaCRC ?? cOpt?.priceDeltaCRC ?? 0,
          colorHex: resolveOptionColorHex(label, sp.colorHex || cOpt?.colorHex),
          imageUrl: sp.imageUrl || cOpt?.imageUrl || null,
          supplierUrl: (sp.supplierUrl || cOpt?.supplierUrl || cParam?.supplierUrl || linkedProd?.supplierUrl || "").trim() || null,
          linkedProduct: linkedProd
            ? {
                sku: linkedProd.sku || linkedProd.id,
                name: lang === "es" ? linkedProd.nameEs : linkedProd.nameEn,
                basePriceUSD: Number(linkedProd.processingPriceD || linkedProd.price?.P_price_D || linkedProd.supplierLastPriceUSD || 0),
                supplierUrl: linkedProd.supplierUrl || null,
              }
            : null,
        };
      });

      // Resolve Combo constituent products if this item is a Combo
      let comboComponents: Array<{
        sku: string;
        name: string;
        basePriceUSD: number;
        supplierUrl: string | null;
      }> = [];
      if (matchedCombo?.itemsJson) {
        try {
          const parsedComboItems = JSON.parse(matchedCombo.itemsJson);
          if (Array.isArray(parsedComboItems)) {
            comboComponents = parsedComboItems.map((ci: any) => {
              const ciStr = typeof ci === "string" ? ci : (ci?.id || ci?.sku || ci?.name || "");
              const foundP = catalogProducts.find(
                (p) =>
                  p.id?.toLowerCase() === ciStr.toLowerCase() ||
                  p.sku?.toLowerCase() === ciStr.toLowerCase() ||
                  p.slug?.toLowerCase() === ciStr.toLowerCase() ||
                  p.nameEs?.toLowerCase() === ciStr.toLowerCase() ||
                  p.nameEn?.toLowerCase() === ciStr.toLowerCase()
              );
              return {
                sku: foundP?.sku || ciStr,
                name: foundP ? (lang === "es" ? foundP.nameEs : foundP.nameEn) : ciStr,
                basePriceUSD: Number(foundP?.processingPriceD || foundP?.price?.P_price_D || foundP?.supplierLastPriceUSD || 0),
                supplierUrl: foundP?.supplierUrl || null,
              };
            });
          }
        } catch {}
      }

      const comboSumUSD = comboComponents.reduce((acc, c) => acc + (c.basePriceUSD || 0), 0);
      const linkedParamsUSD = resolvedParameters.reduce((acc, p) => acc + (p.linkedProduct?.basePriceUSD || 0), 0);
      const baseProductUSD = Number(
        item.basePriceUSD ||
          matchedProduct?.processingPriceD ||
          matchedProduct?.price?.P_price_D ||
          matchedProduct?.supplierLastPriceUSD ||
          comboSumUSD ||
          0
      );
      const unitBaseUSD = baseProductUSD + linkedParamsUSD;
      const totalBaseUSD = unitBaseUSD * qty;

      const variantSupplierUrl = resolvedParameters.find((p) => p.supplierUrl)?.supplierUrl || null;
      const mainSupplierUrl = (item.supplierUrl || matchedProduct?.supplierUrl || "").trim() || null;
      const effectiveSupplierUrl = variantSupplierUrl || mainSupplierUrl;

      let supplierHostname = "";
      if (effectiveSupplierUrl) {
        try {
          supplierHostname = new URL(effectiveSupplierUrl).hostname.replace(/^www\./, "");
        } catch {
          supplierHostname = effectiveSupplierUrl;
        }
      }

      const displayImage =
        resolvedParameters.find((p) => p.imageUrl)?.imageUrl ||
        item.imageUrl ||
        matchedProduct?.imageUrl ||
        matchedProduct?.imgs?.[0] ||
        matchedCombo?.imageUrl ||
        null;

      return {
        idx,
        item,
        qty,
        displayName: item.title || item.name || (matchedProduct ? (lang === "es" ? matchedProduct.nameEs : matchedProduct.nameEn) : matchedCombo ? (lang === "es" ? matchedCombo.titleEs : matchedCombo.titleEn) : "Pieza"),
        displaySku: item.sku || matchedProduct?.sku || matchedCombo?.slug || baseId || "N/A",
        displayBrand: item.brand || matchedProduct?.brandName || matchedProduct?.brand?.[0] || (matchedCombo ? "ZxZ Combo" : null),
        displayComp: Array.isArray(item.comp) && item.comp.length > 0 ? item.comp : Array.isArray(matchedProduct?.comp) ? matchedProduct.comp : [],
        displayType: item.type || (matchedCombo ? "COMBO" : "PRODUCT"),
        displayImage,
        unitPriceCRC: Number(item.priceCRC) || 0,
        lineTotalCRC: (Number(item.priceCRC) || 0) * qty,
        unitBaseUSD,
        totalBaseUSD,
        processingPriceCRC: Number(matchedProduct?.processingPriceCRC || matchedProduct?.price?.P_price || 0),
        shippingPriceCRC: Number(matchedProduct?.shippingPriceCRC || matchedProduct?.price?.S_price || 0),
        installationPriceCRC: Number(item.installationPriceCRC ?? matchedProduct?.installationPriceCRC ?? matchedProduct?.price?.I_price?.I_price ?? matchedCombo?.installationPriceCRC ?? 0),
        profitCRC: Number(matchedProduct?.profitCRC || matchedProduct?.price?.profit || 0),
        withInstallation: Boolean(item.withInstallation),
        freeInstallation: Boolean(item.freeInstallation || matchedProduct?.isInstallationIncluded),
        resolvedParameters,
        parametersSummary: item.parametersSummary || "",
        catalogParams,
        effectiveSupplierUrl,
        mainSupplierUrl,
        isVariantUrl: Boolean(variantSupplierUrl && mainSupplierUrl && variantSupplierUrl !== mainSupplierUrl),
        allVariantSupplierUrls: resolvedParameters.filter((p) => Boolean(p.supplierUrl)),
        supplierHostname,
        supplierPlatform: matchedProduct?.supplierPlatform || null,
        supplierStockStatus: item.supplierStockStatus || matchedProduct?.supplierStockStatus || null,
        comboComponents,
      };
    });

    const totalOrderBaseUSD = detailedItems.reduce((acc, d) => acc + d.totalBaseUSD, 0);
    const computedWholesaleCostCRC = detailedItems.reduce((acc, d) => {
      const unitCost = (d.processingPriceCRC || 0) + (d.shippingPriceCRC || 0);
      const unitProfit = d.profitCRC > 0
        ? d.profitCRC
        : unitCost > 0
        ? Math.max(0, d.unitPriceCRC - unitCost)
        : Math.round(d.unitPriceCRC * 0.28);
      const finalUnitCost = unitCost > 0 ? unitCost : Math.max(0, d.unitPriceCRC - unitProfit);
      return acc + finalUnitCost * d.qty;
    }, 0);

    const currentManagingStatus = manageForm.status || managingOrder.status;
    const nextStageForManagingOrder = getNextStageId(currentManagingStatus, managingOrder);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setShowAdvancePopover(false);
                setManagingOrder(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Volver a Pedidos</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900 font-mono">
                  #{managingOrder.orderNumber}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStageColor(manageForm.status)}`}>
                  {getStageLabel(manageForm.status)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{t.orderManageTitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {nextStageForManagingOrder && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => handleTriggerAdvancePopover(nextStageForManagingOrder)}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  title={lang === "es" ? `Avanzar pedido a: ${getStageLabel(nextStageForManagingOrder)}` : `Advance order to: ${getStageLabel(nextStageForManagingOrder)}`}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>
                    {lang === "es"
                      ? `Avanzar a: ${getStageLabel(nextStageForManagingOrder)}`
                      : `Advance to: ${getStageLabel(nextStageForManagingOrder)}`}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${showAdvancePopover ? "rotate-180" : ""}`} />
                </button>

                {showAdvancePopover && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowAdvancePopover(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 text-left animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">
                              {lang === "es" ? "¿Confirmar avance de pedido?" : "Confirm order advancement?"}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-mono">
                              #{managingOrder.orderNumber}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAdvancePopover(false)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="p-3 my-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="text-[11px] font-medium">{lang === "es" ? "Estado actual:" : "Current stage:"}</span>
                          <span className="font-semibold text-slate-700">
                            {getStageLabel(currentManagingStatus)}
                          </span>
                        </div>
                        <div className="flex items-center justify-center text-slate-400">
                          <ArrowDown className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg text-emerald-900">
                          <span className="font-bold text-[11px] uppercase tracking-wider">{lang === "es" ? "Nuevo estado:" : "New stage:"}</span>
                          <span className="font-extrabold text-xs text-emerald-700">
                            {getStageLabel(nextStageForManagingOrder)}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 mb-3.5">
                        {lang === "es"
                          ? "Al confirmar, el pedido avanzará de etapa y se cerrará esta vista para reubicarte en el listado de pedidos."
                          : "Upon confirming, the order will advance stage and this view will close to relocate you to the orders list."}
                      </p>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          disabled={advancingFromManaging}
                          onClick={() => setShowAdvancePopover(false)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                        >
                          {lang === "es" ? "Cancelar" : "Cancel"}
                        </button>
                        <button
                          type="button"
                          disabled={advancingFromManaging}
                          onClick={() => handleConfirmAdvanceFromManaging(nextStageForManagingOrder)}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                        >
                          {advancingFromManaging ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>{lang === "es" ? "Avanzando..." : "Advancing..."}</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>{lang === "es" ? "Confirmar y Avanzar" : "Confirm & Advance"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {isOrderAtOrPastProgramService(manageForm.status) && (
              <button
                type="button"
                onClick={() => setServiceDocsModalOrder(managingOrder)}
                className="px-4 py-2 text-xs font-bold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer border border-amber-500/40"
                title={t.serviceDocsBtn}
              >
                <FileText className="w-3.5 h-3.5 text-amber-950" />
                <span>{managingOrder.serviceDocumentsJson && managingOrder.serviceDocumentsJson !== "{}" ? (lang === "es" ? "Ver / Editar Documentos" : "View / Edit Docs") : t.serviceDocsBtn}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setShowAdvancePopover(false);
                setManagingOrder(null);
              }}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white rounded-xl border border-slate-200 transition"
            >
              {t.orderCancelBtn}
            </button>
            <button
              type="button"
              onClick={handleSaveManagementUpdate}
              disabled={savingEdit}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{savingEdit ? t.devSaving : t.devSaveChanges}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Column: Status, Included Parts (Staff Procurement Detail), & Notes */}
          <div className="space-y-6">
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Sliders className="w-4 h-4 text-slate-600" />
                <span>Estado de Progreso</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Estado de Progreso:</label>
                  <select
                    value={manageForm.status}
                    onChange={(e) => setManageForm({ ...manageForm, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-slate-900"
                  >
                    {getPredeterminedStagesForOrder(managingOrder).map((st) => (
                      <option key={st.id} value={st.id}>
                        {lang === "es" ? st.labelEs : st.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Dirección de Envío / Destino:
                    </label>
                    {manageForm.shippingAddress && (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`https://waze.com/ul?q=${encodeURIComponent(manageForm.shippingAddress)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-[11px] font-bold border border-cyan-200 transition"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Waze</span>
                        </a>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(manageForm.shippingAddress)}&hl=es`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-bold border border-blue-200 transition"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Google Maps</span>
                        </a>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={manageForm.shippingAddress}
                    onChange={(e) => setManageForm({ ...manageForm, shippingAddress: e.target.value })}
                    placeholder="Calle, cantón, señas exactas..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* PIEZAS INCLUIDAS & DETALLE DE COMPRA PARA STAFF (MOVED TO LEFT COLUMN) */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#C02030]" />
                    <span>{lang === "es" ? "Piezas Incluidas & Compra a Proveedor" : "Included Parts & Supplier Procurement"}</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {lang === "es"
                      ? "Especificaciones completas, parámetros seleccionados, valor base en USD y enlaces directos para compra del staff."
                      : "Full specifications, selected parameters, base value in USD, and direct links for staff purchasing."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {detailedItems.reduce((sum, d) => sum + d.qty, 0)} {lang === "es" ? "unid." : "units"}
                  </span>
                  {totalOrderBaseUSD > 0 && (
                    <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-emerald-600" />
                      <span>Base Total: {formatUSD(totalOrderBaseUSD)} USD</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3.5">
                {detailedItems.map((d) => {
                  const copyKey = `sup-${managingOrder.id}-${d.idx}`;
                  const isCopied = copiedSupplierKey === copyKey;
                  return (
                    <div
                      key={d.idx}
                      className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-3 text-xs transition hover:border-slate-300"
                    >
                      {/* Top Header: Image, Title, SKU, Brand, Quantity & CRC Price */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {d.displayImage ? (
                            <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                              <img
                                src={d.displayImage}
                                alt={d.displayName}
                                className="w-full h-full object-contain rounded-lg"
                              />
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-slate-200/70 border border-slate-300 flex items-center justify-center shrink-0 text-slate-500">
                              <Package className="w-6 h-6" />
                            </div>
                          )}

                          <div className="space-y-1 min-w-0">
                            <span className="font-black text-slate-900 text-xs sm:text-sm block leading-snug">
                              {d.displayName}
                            </span>

                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white">
                                SKU: {d.displaySku}
                              </span>
                              {d.displayBrand && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200">
                                  {d.displayBrand}
                                </span>
                              )}
                              {d.displayComp.length > 0 && (
                                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 uppercase">
                                  {d.displayComp.join(", ")}
                                </span>
                              )}
                              {d.withInstallation ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                                  <Wrench className="w-2.5 h-2.5 text-purple-600" />
                                  <span>
                                    {d.freeInstallation
                                      ? "Instalación Incluida"
                                      : `Con Instalación (${formatCRC(d.installationPriceCRC)})`}
                                  </span>
                                </span>
                              ) : d.installationPriceCRC > 0 ? (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                  Mano de Obra Ref: {formatCRC(d.installationPriceCRC)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 space-y-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-[#C02030] text-white font-mono font-black text-xs shadow-2xs">
                            Cantidad: x{d.qty}
                          </span>
                          <div className="font-mono font-black text-sm text-slate-900 block">
                            {formatCRC(d.lineTotalCRC)}
                          </div>
                          {d.qty > 1 && (
                            <span className="text-[10px] font-mono text-slate-400 block">
                              {formatCRC(d.unitPriceCRC)} c/u
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 1. PARAMETERS / SELECTED OPTIONS BLOCK */}
                      {d.resolvedParameters.length > 0 ? (
                        <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{lang === "es" ? "Parámetros / Variantes Seleccionadas:" : "Selected Parameters / Variants:"}</span>
                            </span>
                            <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                              {d.resolvedParameters.length} {d.resolvedParameters.length === 1 ? "parámetro" : "parámetros"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-1.5">
                            {d.resolvedParameters.map((param, pIdx) => (
                              <div
                                key={pIdx}
                                className="p-2 rounded-lg bg-white border border-indigo-200/80 flex flex-wrap items-center justify-between gap-2 shadow-2xs"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {param.colorHex && (
                                    <span
                                      className="w-4 h-4 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                                      style={{ backgroundColor: param.colorHex }}
                                      title={param.optionLabel}
                                    />
                                  )}
                                  <span className="text-xs text-slate-600 font-semibold">
                                    {param.parameterName}:
                                  </span>
                                  <span className="text-xs font-black text-slate-950 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                                    {param.optionLabel}
                                  </span>
                                  {param.priceDeltaCRC !== 0 && (
                                    <span className="text-[10px] font-mono font-bold text-indigo-700">
                                      ({param.priceDeltaCRC > 0 ? `+${formatCRC(param.priceDeltaCRC)}` : `-${formatCRC(Math.abs(param.priceDeltaCRC))}`})
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {param.linkedProduct && (
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      Link SKU: {param.linkedProduct.sku} ({formatUSD(param.linkedProduct.basePriceUSD)} USD)
                                    </span>
                                  )}
                                  {param.supplierUrl && (
                                    <a
                                      href={param.supplierUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold transition shadow-2xs"
                                      title={param.supplierUrl}
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      <span>{lang === "es" ? "Link Variante" : "Variant Link"}</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : d.parametersSummary ? (
                        <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200 flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-900 block">
                              {lang === "es" ? "Parámetros Seleccionados:" : "Selected Parameters:"}
                            </span>
                            <span className="text-xs font-bold text-slate-900">{d.parametersSummary}</span>
                          </div>
                        </div>
                      ) : d.catalogParams.length > 0 ? (
                        <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
                            <Layers className="w-3.5 h-3.5 text-amber-600" />
                            <span>{lang === "es" ? "Parámetros Disponibles en Catálogo (Sin variante marcada en orden):" : "Catalog Parameters Available:"}</span>
                          </div>
                          <div className="space-y-1">
                            {d.catalogParams.map((cp: any, cpIdx: number) => (
                              <div key={cpIdx} className="text-[11px] text-amber-950 flex flex-wrap items-center gap-1.5">
                                <span className="font-bold">{lang === "es" ? cp.nameEs : (cp.nameEn || cp.nameEs)}:</span>
                                {Array.isArray(cp.options) &&
                                  cp.options.map((opt: any, oIdx: number) => (
                                    <span
                                      key={oIdx}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-amber-300 text-[10px] font-semibold text-slate-800"
                                    >
                                      <span>{lang === "es" ? opt.labelEs : (opt.labelEn || opt.labelEs)}</span>
                                      {opt.supplierUrl && (
                                        <a
                                          href={opt.supplierUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline inline-flex items-center"
                                          title={opt.supplierUrl}
                                        >
                                          <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                      )}
                                    </span>
                                  ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-1.5">
                          <Layers className="w-3 h-3 text-slate-400" />
                          <span>{lang === "es" ? "Parámetros: Pieza estándar (sin variantes adicionales)" : "Parameters: Standard part (no extra variants)"}</span>
                        </div>
                      )}

                      {/* 2. BASE VALUE IN DOLLARS (P_price_D) & COST BREAKDOWN FOR STAFF */}
                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <DollarSign className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 block">
                                {lang === "es" ? "Valor Base Proveedor (USD • P_price_D):" : "Supplier Base Value (USD • P_price_D):"}
                              </span>
                              <span className="text-[10px] text-emerald-700">
                                {lang === "es" ? "Costo base en dólares para compra en el sitio del proveedor" : "Base cost in USD for purchasing on supplier site"}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            {d.unitBaseUSD > 0 ? (
                              <>
                                <span className="text-base font-black font-mono text-emerald-950 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs inline-block">
                                  {formatUSD(d.unitBaseUSD)} USD {d.qty > 1 ? "c/u" : ""}
                                </span>
                                {d.qty > 1 && (
                                  <span className="text-[11px] font-mono font-bold text-emerald-800 block mt-0.5">
                                    Total Línea ({d.qty}x): {formatUSD(d.totalBaseUSD)} USD
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-xs font-mono font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                {lang === "es" ? "No especificado ($0.00 USD)" : "Not set ($0.00 USD)"}
                              </span>
                            )}
                          </div>
                        </div>

                        {(d.processingPriceCRC > 0 || d.shippingPriceCRC > 0 || d.profitCRC > 0) && (
                          <div className="pt-2 border-t border-emerald-200/70 grid grid-cols-3 gap-2 text-[10px]">
                            <div className="bg-white/80 rounded-lg px-2 py-1 border border-emerald-100">
                              <span className="text-slate-400 block">Costo Base (CRC):</span>
                              <span className="font-mono font-bold text-slate-800">{formatCRC(d.processingPriceCRC)}</span>
                            </div>
                            <div className="bg-white/80 rounded-lg px-2 py-1 border border-emerald-100">
                              <span className="text-slate-400 block">Envío / Imp (CRC):</span>
                              <span className="font-mono font-bold text-slate-800">{formatCRC(d.shippingPriceCRC)}</span>
                            </div>
                            <div className="bg-white/80 rounded-lg px-2 py-1 border border-emerald-100">
                              <span className="text-slate-400 block">Utilidad (CRC):</span>
                              <span className="font-mono font-bold text-emerald-700">{formatCRC(d.profitCRC)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. SUPPLIER URL (supplierUrl) & DIRECT BUY BUTTON FOR STAFF */}
                      {d.effectiveSupplierUrl ? (
                        <div className="p-3 rounded-xl bg-slate-900 text-white space-y-2 shadow-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">
                                supplierUrl {d.isVariantUrl ? (lang === "es" ? "(Variante Específica)" : "(Specific Variant)") : ""}:
                              </span>
                              {d.supplierHostname && (
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-800 text-emerald-300 border border-slate-700">
                                  {d.supplierHostname}
                                </span>
                              )}
                              {d.supplierPlatform && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                                  {d.supplierPlatform}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleCopySupplierUrl(d.effectiveSupplierUrl!, copyKey)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                                  isCopied
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                                }`}
                                title="Copiar supplierUrl"
                              >
                                {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                <span>{isCopied ? "Copiado" : "Copiar URL"}</span>
                              </button>

                              <a
                                href={d.effectiveSupplierUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 transition shadow-xs"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>{lang === "es" ? "Ir al Sitio a Comprar" : "Go to Site to Buy"}</span>
                              </a>
                            </div>
                          </div>

                          <a
                            href={d.effectiveSupplierUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-[11px] font-mono text-emerald-300/90 hover:text-emerald-200 hover:underline break-all bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800"
                          >
                            {d.effectiveSupplierUrl}
                          </a>

                          {d.allVariantSupplierUrls && d.allVariantSupplierUrls.length > 1 && (
                            <div className="pt-2 border-t border-slate-800 space-y-1.5">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                                {lang === "es" ? "Enlaces Específicos por Parámetro / Opción:" : "Specific Links by Parameter / Option:"}
                              </span>
                              {d.allVariantSupplierUrls.map((vp: any, vpIdx: number) => (
                                <div key={vpIdx} className="flex items-center justify-between gap-2 bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                                  <span className="text-xs text-slate-300 font-semibold truncate">
                                    <b className="text-white">{vp.parameterName}:</b> {vp.optionLabel}
                                  </span>
                                  <a
                                    href={vp.supplierUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] flex items-center gap-1 shrink-0"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>{lang === "es" ? "Abrir Opción" : "Open Option"}</span>
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>
                              {lang === "es"
                                ? "Sin supplierUrl configurado en catálogo para este producto."
                                : "No supplierUrl configured in catalog for this product."}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* If Combo: show constituent parts with their individual USD base values and supplierUrls */}
                      {d.comboComponents.length > 0 && (
                        <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 space-y-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-900 block">
                            {lang === "es" ? "Desglose de Piezas del Combo para Compra:" : "Combo Component Breakdown for Purchase:"}
                          </span>
                          <div className="space-y-1.5">
                            {d.comboComponents.map((comp, cIdx) => (
                              <div
                                key={cIdx}
                                className="p-2 rounded-lg bg-white border border-purple-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px]"
                              >
                                <div>
                                  <span className="font-bold text-slate-900">{comp.name}</span>
                                  <span className="text-[10px] font-mono text-slate-500 ml-1.5">({comp.sku})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    Base: {formatUSD(comp.basePriceUSD)} USD
                                  </span>
                                  {comp.supplierUrl && (
                                    <a
                                      href={comp.supplierUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] flex items-center gap-1 transition"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      <span>Comprar Pieza</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Totals Summary Box */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 mt-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lang === "es" ? "Valor Base Total Proveedor (USD):" : "Total Supplier Base Value (USD):"}</span>
                  </span>
                  <span className="font-mono font-black text-sm text-amber-300">
                    {formatUSD(totalOrderBaseUSD)} USD
                  </span>
                </div>

                {/* PLACE TO PUT / OVERRIDE ORDER PARTS COST */}
                <div className="p-3 bg-slate-800/90 rounded-xl border border-indigo-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-indigo-300 font-bold flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{lang === "es" ? "Costo de Piezas / Mercadería (CRC):" : "Order Parts Cost (CRC):"}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono text-slate-400">₡</span>
                      <input
                        type="number"
                        value={manageForm.orderPartsCostCRC}
                        onChange={(e) => setManageForm({ ...manageForm, orderPartsCostCRC: e.target.value })}
                        placeholder={String(computedWholesaleCostCRC || 0)}
                        className="w-32 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-right font-mono font-bold text-xs text-indigo-200 outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-700/60">
                    <span>
                      {manageForm.orderPartsCostCRC !== ""
                        ? (lang === "es" ? "Costo personalizado ingresado" : "Custom parts cost entered")
                        : (lang === "es" ? "Costo calculado del catálogo" : "Catalog calculated cost")}
                    </span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {lang === "es" ? "Margen: " : "Profit: "}
                      ₡{Math.max(0, (managingOrder.partsSubtotalCRC || managingOrder.totalCRC) - (manageForm.orderPartsCostCRC !== "" ? Number(manageForm.orderPartsCostCRC) : computedWholesaleCostCRC)).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {lang === "es" ? "Total Orden (Cliente)" : "Order Total (Client)"}
                  </span>
                  <span className="text-xl font-black font-mono text-emerald-400">
                    {formatCRC(managingOrder.totalCRC)}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages & Critical Notes */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>{t.orderImportantNotesLabel}</span>
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Las notas están reservadas estrictamente para información importante de entrega, vehículo o especificaciones técnicas.
                </p>
              </div>

              {managingOrder.notes && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs space-y-1">
                  <span className="font-bold text-blue-900 block text-[11px]">Nota / Mensaje del Cliente:</span>
                  <p className="text-blue-950 font-medium leading-relaxed">{managingOrder.notes}</p>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Notas de Taller / Staff:
                </label>
                <textarea
                  rows={3}
                  value={manageForm.staffNotes}
                  onChange={(e) => setManageForm({ ...manageForm, staffNotes: e.target.value })}
                  placeholder="Instrucciones para mecánicos, preparativos en taller..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Notas de Proveedor / Tracking USA:
                </label>
                <textarea
                  rows={2}
                  value={manageForm.supplierNotes}
                  onChange={(e) => setManageForm({ ...manageForm, supplierNotes: e.target.value })}
                  placeholder="Número de tracking USA, fecha de arribo a bodega..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Customer summary & Items */}
          <div className="space-y-6">
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <User className="w-4 h-4 text-slate-600" />
                <span>Cliente & Resumen del Pedido</span>
              </h3>

              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Cliente:</span>
                  <span className="font-bold text-slate-900">
                    {managingOrder.customerName || managingOrder.user?.displayName || managingOrder.guestEmail || managingOrder.user?.email || "Cliente"}
                  </span>
                </div>
                {managingOrder.customerPhone && (
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Teléfono:</span>
                    <span className="font-mono text-slate-900">{managingOrder.customerPhone}</span>
                  </div>
                )}
                {managingOrder.guestEmail && (
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">Correo:</span>
                    <span className="text-slate-900">{managingOrder.guestEmail}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-400">Canje / Reclamación:</span>
                  <span className="font-semibold text-slate-700">
                    {managingOrder.isRedeemed ? "✓ Reclamado en cuenta" : "Link pendiente de reclamo"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Fecha de Creación:</span>
                  <span className="text-slate-700">{new Date(managingOrder.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Client Payment Proof Card */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>{t.orderPaymentProofTitle}</span>
                </h3>
                {managingOrder.paymentProofUrl ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    ✓ {t.orderPaymentProofBadge}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                    ⚠ {t.orderNoPaymentProofBadge}
                  </span>
                )}
              </div>

              {managingOrder.paymentProofUrl ? (
                <div className="space-y-3">
                  <div
                    onClick={() => setPreviewPaymentProofOrder(managingOrder)}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-2 flex items-center justify-center max-h-56 transition hover:border-slate-400"
                  >
                    <img
                      src={managingOrder.paymentProofUrl}
                      alt={`Comprobante #${managingOrder.orderNumber}`}
                      className="max-h-52 w-auto object-contain rounded-xl transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-md flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t.orderPaymentProofOpenFull}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="text-[11px] text-slate-500">
                      <span>{t.orderPaymentProofCurrencyLabel}: </span>
                      <strong className="text-slate-900 font-mono font-bold">
                        {managingOrder.paidCurrency === "USD" ? "Dólares (USD $)" : "Colones (CRC ₡)"}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewPaymentProofOrder(managingOrder)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t.orderPaymentProofOpenFull}</span>
                      </button>
                      <a
                        href={managingOrder.paymentProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t.orderPaymentProofNewTab}</span>
                      </a>
                      <label className="cursor-pointer px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>{uploadingProof ? t.devSaving : "Cambiar"}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          disabled={uploadingProof}
                          onChange={(e) => handleStaffUploadProof(e, managingOrder)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed text-[11px]">
                      {t.orderPaymentProofEmpty}
                    </p>
                  </div>

                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingProof ? t.devSaving : t.orderPaymentProofAttachStaffBtn}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={uploadingProof}
                      onChange={(e) => handleStaffUploadProof(e, managingOrder)}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Payment Rejection Button in PAYMENT_CONFIRMATION */}
              {(managingOrder.status === "PAYMENT_CONFIRMATION" || manageForm.status === "PAYMENT_CONFIRMATION") && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectPaymentType("ORDER");
                      setRejectModalOrder(managingOrder);
                      setRejectionReason("");
                      setRejectError(null);
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs transition flex items-center justify-center gap-2 shadow-2xs"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>{t.orderRejectPaymentBtn}</span>
                  </button>
                </div>
              )}

              {/* Notice if PAYMENT_REJECTED */}
              {(managingOrder.status === "PAYMENT_REJECTED" || manageForm.status === "PAYMENT_REJECTED") && (
                isRejectedPaymentCorrected(managingOrder) ? (
                  <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-xs text-emerald-950 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 font-black text-emerald-900">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping inline-block shrink-0" />
                        <span>● {t.orderRejectedCorrectedStaffBannerTitle || (lang === "es" ? "Pago Corregido: Comprobante Listo para Revisión" : "Corrected Payment: Receipt Ready for Review")}</span>
                      </div>
                      {(manageForm.paymentProofUrl || managingOrder.paymentProofUrl) && (
                        <button
                          type="button"
                          onClick={() => setPreviewPaymentProofOrder(managingOrder)}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-xs shrink-0 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{lang === "es" ? "Ver Comprobante" : "View Receipt"}</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                      {t.orderRejectedCorrectedStaffBannerDesc || (lang === "es"
                        ? "El cliente ha subido un nuevo comprobante para corregir el pago. Por favor revise el comprobante y presione 'Avanzar' para reanudar el flujo."
                        : "The customer uploaded a new receipt to correct payment. Please verify the receipt and advance the order to resume workflow.")}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-rose-800">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>{t.orderStatusPaymentRejected || (lang === "es" ? "Pago actualmente marcado como rechazado" : "Payment currently marked as rejected")}</span>
                    </div>
                    <p className="text-[11px] text-rose-700 leading-relaxed">
                      {lang === "es"
                        ? "Esperando que el cliente vuelva a subir un nuevo comprobante válido."
                        : "Waiting for the customer to re-upload a valid receipt."}
                    </p>
                  </div>
                )
              )}

              {/* Return Delivery 50% for READY_FOR_PICKUP */}
              {(managingOrder.status === "READY_FOR_PICKUP" || manageForm.status === "READY_FOR_PICKUP") && (
                <div className="p-4 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                    <Truck className="w-4 h-4 text-purple-600" />
                    <span>{t.orderHalfRateDeliveryBadge}</span>
                  </div>
                  <p className="text-[11px] text-purple-800 leading-relaxed">
                    {t.orderHalfRateDeliveryDesc}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnDeliveryOrder(managingOrder);
                      setReturnAddress(managingOrder.shippingAddress || "");
                      setReturnCostCRC("5000");
                      setReturnNotes("");
                    }}
                    className="w-full px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition shadow-xs flex items-center justify-center gap-2"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{t.orderConfigureReturnDelivery}</span>
                  </button>
                </div>
              )}
            </div>

            {/* =========================================================================
                SUPPLIER PURCHASE PROOFS CARD (STAFF ONLY *un)
                User Requirement: Staff needs to add proof products have been purchased (multiple images).
                Not shown to users. Blocking advancement from NEED_TO_GET_ORDER without it.
               ========================================================================= */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-indigo-600" />
                    <span>{lang === "es" ? "Comprobantes de Compra a Proveedor (*un)" : "Supplier Purchase Proofs (*un)"}</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {lang === "es"
                      ? "Facturas y capturas de compra de repuestos. Exclusivo para staff (*un), no visible para clientes."
                      : "Parts purchase receipts and supplier invoices. Staff only (*un), hidden from clients."}
                  </p>
                </div>
                {manageForm.purchaseProofUrls.length > 0 ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 shrink-0">
                    ✓ {manageForm.purchaseProofUrls.length} {lang === "es" ? "Comprobante(s)" : "Receipt(s)"}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 shrink-0">
                    ⚠ {lang === "es" ? "Sin Comprobantes" : "No Receipts"}
                  </span>
                )}
              </div>

              {/* Requirement Warning Alert if in NEED_TO_GET_ORDER without buy proof */}
              {(managingOrder.status === "NEED_TO_GET_ORDER" || manageForm.status === "NEED_TO_GET_ORDER") && manageForm.purchaseProofUrls.length === 0 && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>{lang === "es" ? "Requerido para avanzar etapa" : "Required to advance stage"}</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {lang === "es"
                      ? "Este pedido no podrá avanzar a 'En Tránsito en USA' hasta que adjuntes al menos una foto o factura de la compra de los repuestos al proveedor."
                      : "This order cannot advance to 'Shipping in US' until you attach at least one photo or invoice of the parts purchase from the supplier."}
                  </p>
                </div>
              )}

              {/* Grid of uploaded purchase proofs */}
              {manageForm.purchaseProofUrls.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {manageForm.purchaseProofUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="group relative rounded-2xl border border-slate-200 bg-slate-950 overflow-hidden aspect-video flex items-center justify-center shadow-2xs"
                      >
                        <img
                          src={url}
                          alt={`Comprobante de compra #${idx + 1}`}
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewProofModal({
                                orderNumber: managingOrder.orderNumber,
                                status: managingOrder.status,
                                title: lang === "es" ? `Comprobante de Compra #${idx + 1}` : `Purchase Proof #${idx + 1}`,
                                subtitle: lang === "es" ? "Factura / Recibo de compra de repuestos" : "Parts purchase invoice / receipt",
                                imageUrl: url,
                              })
                            }
                            className="p-1.5 rounded-lg bg-white/90 text-slate-900 hover:bg-white shadow transition"
                            title={lang === "es" ? "Ver comprobante en grande" : "View full receipt"}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white/90 text-slate-900 hover:bg-white shadow transition"
                            title={lang === "es" ? "Abrir en nueva pestaña" : "Open in new tab"}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleStaffDeletePurchaseProof(url, managingOrder)}
                            className="p-1.5 rounded-lg bg-rose-600/90 text-white hover:bg-rose-600 shadow transition"
                            title={lang === "es" ? "Eliminar comprobante" : "Delete receipt"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    {lang === "es"
                      ? "Aún no se han adjuntado comprobantes de compra a proveedores para este pedido."
                      : "No supplier purchase receipts have been attached to this order yet."}
                  </span>
                </div>
              )}

              {/* Upload Multiple Images Button */}
              <div>
                <label className="w-full cursor-pointer px-4 py-2.5 rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-900 text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs">
                  <Upload className="w-4 h-4 text-indigo-600" />
                  <span>
                    {uploadingPurchaseProof
                      ? (lang === "es" ? "Subiendo imágenes..." : "Uploading images...")
                      : manageForm.purchaseProofUrls.length > 0
                      ? (lang === "es" ? "+ Agregar Más Comprobantes de Compra" : "+ Add More Purchase Proofs")
                      : (lang === "es" ? "Subir Comprobante(s) de Compra a Proveedor" : "Upload Supplier Purchase Proof(s)")}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    disabled={uploadingPurchaseProof}
                    className="hidden"
                    onChange={(e) => handleStaffUploadPurchaseProof(e, managingOrder)}
                  />
                </label>
                <p className="text-[10px] text-slate-400 text-center mt-1.5">
                  {lang === "es"
                    ? "Permite seleccionar múltiples fotos simultáneamente (JPEG, PNG, WEBP). Solo visible para staff."
                    : "Allows selecting multiple photos at once (JPEG, PNG, WEBP). Visible to staff only."}
                </p>
              </div>
            </div>

            {/* Service Payment Proof Card (Staff Managed) */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>{t.orderServicePaymentProofTitle}</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {t.orderServicePaymentProofSubtitle}
                  </p>
                </div>
                {manageForm.servicePaymentProofUrl || managingOrder.servicePaymentProofUrl ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1 shrink-0">
                    ✓ {t.orderPaymentProofBadge}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 shrink-0">
                    ⚠ {t.orderNoPaymentProofBadge}
                  </span>
                )}
              </div>

              {/* Highlighted Service Amount to Verify & Pickup Gasoline Cost */}
              {(() => {
                const serviceToCollect = Math.max(
                  (Number(managingOrder.pickupCostCRC) || 0) + (Number(managingOrder.shippingCostCRC) || 0),
                  Number(managingOrder.serviceSchedule?.costCRC) || 0
                );

                const isPickup =
                  (managingOrder.serviceType || "").toUpperCase().includes("PICKUP") ||
                  (Number(managingOrder.pickupCostCRC) || 0) > 0 ||
                  (managingOrder.serviceSchedule?.serviceType || "").toLowerCase() === "pickup";

                let pickupKm = 0;
                let parsedDoc: any = {};
                if (managingOrder.serviceDocumentsJson) {
                  try {
                    parsedDoc =
                      typeof managingOrder.serviceDocumentsJson === "string"
                        ? JSON.parse(managingOrder.serviceDocumentsJson)
                        : managingOrder.serviceDocumentsJson;
                  } catch {}
                }
                if (typeof parsedDoc?.distanceKm === "number" && parsedDoc.distanceKm > 0) {
                  pickupKm = parsedDoc.distanceKm;
                } else if (
                  typeof managingOrder.serviceSchedule?.distanceKm === "number" &&
                  managingOrder.serviceSchedule.distanceKm > 0
                ) {
                  pickupKm = managingOrder.serviceSchedule.distanceKm;
                } else if (Number(managingOrder.pickupCostCRC) > 0) {
                  const baseRate = 1500;
                  pickupKm =
                    Number(managingOrder.pickupCostCRC) > 10000
                      ? Math.round((Number(managingOrder.pickupCostCRC) - 10000) / baseRate)
                      : Math.round(Number(managingOrder.pickupCostCRC) / baseRate);
                }
                const gasCostCRC = isPickup && pickupKm > 0 ? Math.round(pickupKm * 500) : 0;

                return (
                  <div className="space-y-2.5">
                    <div className="p-3.5 bg-blue-50/90 border border-blue-200 rounded-2xl flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                          ₡
                        </div>
                        <div>
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900">
                            {lang === "es" ? "Monto a Confirmar por Servicio" : "Service Amount to Confirm"}
                          </div>
                          <div className="text-xs text-blue-700">
                            {managingOrder.serviceType === "UTV_PICKUP"
                              ? (lang === "es" ? "Retiro de Vehículo UTV (Pick-Up)" : "UTV Pick-Up Service")
                              : managingOrder.serviceType === "SHIPPING"
                              ? (lang === "es" ? "Flete / Envío" : "Delivery / Shipping")
                              : (lang === "es" ? "Servicio de Transporte" : "Transport Service")}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-base sm:text-lg font-black text-blue-950 font-mono">
                          ₡{serviceToCollect.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-blue-600 font-semibold">
                          {lang === "es" ? "Verificar contra comprobante" : "Check against receipt"}
                        </div>
                      </div>
                    </div>

                    {/* Calculated Gasoline Cost for Pick-up Service */}
                    {isPickup && gasCostCRC > 0 && (
                      <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#E03A10] text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Fuel className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                              <span>
                                {lang === "es"
                                  ? "Gasto de Gasolina Retiro (₡500/km)"
                                  : "Pickup Gasoline Cost (₡500/km)"}
                              </span>
                              <span className="text-[10px] font-mono bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                                {pickupKm} km
                              </span>
                            </div>
                            <div className="text-[10px] text-amber-800">
                              {lang === "es"
                                ? "Regístrelo manualmente en 'Cierre Financiero' al tanquear el vehículo"
                                : "Register manually in 'Financial Dashboard' when refueling vehicle"}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-base font-black font-mono text-[#D93412] bg-white px-2.5 py-1 rounded-xl border border-amber-300 shadow-2xs block">
                            ₡{gasCostCRC.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {(manageForm.servicePaymentProofUrl || managingOrder.servicePaymentProofUrl) ? (
                <div className="space-y-3">
                  <div
                    onClick={() => handleInspectProof(managingOrder, "SERVICE")}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-2 flex items-center justify-center max-h-56 transition hover:border-slate-400"
                  >
                    <img
                      src={manageForm.servicePaymentProofUrl || managingOrder.servicePaymentProofUrl || ""}
                      alt={`Comprobante de Servicio #${managingOrder.orderNumber}`}
                      className="max-h-52 w-auto object-contain rounded-xl transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-md flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t.orderInspectProofBtn}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleInspectProof(managingOrder, "SERVICE")}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t.orderInspectProofBtn}</span>
                      </button>
                      <a
                        href={manageForm.servicePaymentProofUrl || managingOrder.servicePaymentProofUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t.orderPaymentProofNewTab}</span>
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>{uploadingServiceProof ? t.devSaving : "Cambiar"}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          disabled={uploadingServiceProof}
                          onChange={(e) => handleStaffUploadProof(e, managingOrder, "servicePaymentProofUrl")}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setManageForm((prev) => ({ ...prev, servicePaymentProofUrl: "" }));
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Quitar comprobante"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-3">
                  <div className="flex items-start gap-2">
                    <Truck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed text-[11px] text-slate-600">
                      Sin comprobante de pago de servicio / transporte adjunto. Suba un archivo o pegue el enlace abajo.
                    </p>
                  </div>

                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingServiceProof ? t.devSaving : t.orderAttachServiceProofBtn}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={uploadingServiceProof}
                      onChange={(e) => handleStaffUploadProof(e, managingOrder, "servicePaymentProofUrl")}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Direct URL input */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  URL Directa del Comprobante de Servicio:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={manageForm.servicePaymentProofUrl}
                    onChange={(e) => setManageForm({ ...manageForm, servicePaymentProofUrl: e.target.value })}
                    placeholder="https://... (o sube archivo arriba)"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 font-mono"
                  />
                  {manageForm.servicePaymentProofUrl && (
                    <button
                      type="button"
                      onClick={() => handleInspectProof(managingOrder, "SERVICE")}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Ver</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
                {(managingOrder.status === "CONFIRM_SERVICE_PAYMENT" || manageForm.status === "CONFIRM_SERVICE_PAYMENT") && (
                  <button
                    type="button"
                    disabled={confirmingServicePayment}
                    onClick={() => handleConfirmServicePayment(managingOrder)}
                    className="flex-1 w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{confirmingServicePayment ? "Confirmando..." : (lang === "es" ? "Confirmar Pago de Servicio y Avanzar Estado" : "Confirm Service Payment & Advance Stage")}</span>
                  </button>
                )}
                {(manageForm.servicePaymentProofUrl || managingOrder.servicePaymentProofUrl || managingOrder.status === "CONFIRM_SERVICE_PAYMENT" || manageForm.status === "CONFIRM_SERVICE_PAYMENT") && (
                  <button
                    type="button"
                    onClick={() => {
                      setRejectPaymentType("SERVICE");
                      setRejectModalOrder(managingOrder);
                      setRejectionReason("");
                      setRejectError(null);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>{t.orderRejectServicePaymentBtn || (lang === "es" ? "Rechazar Pago de Servicio" : "Reject Service Payment")}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Installation Payment Proof Card */}
            <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-purple-600" />
                    <span>{t.orderInstallationPaymentProofTitle}</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {managingOrder.serviceType === "UTV_PICKUP"
                      ? t.orderPickupClientNotice
                      : t.orderStaffManagedNotice}
                  </p>
                </div>
                {manageForm.installationPaymentProofUrl || managingOrder.installationPaymentProofUrl ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1 shrink-0">
                    ✓ {t.orderPaymentProofBadge}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 shrink-0">
                    ⚠ {t.orderNoPaymentProofBadge}
                  </span>
                )}
              </div>

              {/* Highlighted Installation Amount to Verify */}
              {(() => {
                const installToCollect = Math.max(
                  (Number(managingOrder.installationCostCRC) || 0) + (Number(managingOrder.laborSubtotalCRC) || 0),
                  0
                );
                return (
                  <div className="p-3.5 bg-purple-50/90 border border-purple-200 rounded-2xl flex items-center justify-between shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                        ₡
                      </div>
                      <div>
                        <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-900">
                          {lang === "es" ? "Monto a Confirmar por Instalación" : "Installation Amount to Confirm"}
                        </div>
                        <div className="text-xs text-purple-700">
                          {lang === "es"
                            ? "Mano de obra técnica y montaje en taller"
                            : "Technical labor and workshop installation"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-base sm:text-lg font-black text-purple-950 font-mono">
                        ₡{installToCollect.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-purple-700 font-semibold">
                        {lang === "es" ? "Verificar contra comprobante" : "Check against receipt"}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* SET INSTALLATION DURATION (User Requirement 7: staff sets installation time) */}
              <div className="p-3.5 bg-slate-50 border border-purple-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {t.orderInstallationDurationTitle || "Tiempo de Instalación en Taller"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {lang === "es"
                          ? "Define las horas de bloqueo en la agenda del taller (se suman 30 min de búfer al agendar)"
                          : "Defines blocked hours in workshop agenda (30 min buffer is added when scheduling)"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-extrabold text-purple-900 bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200">
                      {((manageForm.installationDurationMinutes || 60) / 60).toFixed(1)} h ({manageForm.installationDurationMinutes || 60} min)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max="48"
                      value={((manageForm.installationDurationMinutes || 60) / 60)}
                      onChange={(e) => {
                        const hours = parseFloat(e.target.value) || 0.5;
                        const mins = Math.max(15, Math.round(hours * 60));
                        setManageForm((prev) => ({ ...prev, installationDurationMinutes: mins }));
                      }}
                      className="w-28 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-purple-600 shadow-2xs"
                    />
                    <span className="text-xs font-semibold text-slate-600">
                      {lang === "es" ? "horas" : "hours"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        setSavingDuration(true);
                        const mins = manageForm.installationDurationMinutes || 60;
                        const res = await fetch(`/api/sys/orders/${managingOrder.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ installationDurationMinutes: mins }),
                        });
                        const data = await res.json();
                        if (res.ok && data.success) {
                          setFeedback({
                            type: "success",
                            msg: t.orderInstallationDurationSavedSuccess || "Tiempo de instalación guardado y sincronizado con la agenda.",
                          });
                          await fetchOrders(false);
                        } else {
                          alert(data.error || "Error al guardar tiempo de instalación");
                        }
                      } catch (e: any) {
                        alert(e.message || "Error al conectar");
                      } finally {
                        setSavingDuration(false);
                      }
                    }}
                    disabled={savingDuration}
                    className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition shadow-2xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{savingDuration ? t.devSaving : (t.orderSaveInstallationDurationBtn || "Guardar Tiempo")}</span>
                  </button>
                </div>
              </div>

              {/* Notice for Pick-up orders */}
              {managingOrder.serviceType === "UTV_PICKUP" && (
                <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-xl text-[11px] text-purple-900 flex items-center gap-2">
                  <Car className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>
                    <strong>Servicio Retiro de Vehículo:</strong> El cliente también puede adjuntar este comprobante desde la vista de su pedido.
                  </span>
                </div>
              )}

              {(manageForm.installationPaymentProofUrl || managingOrder.installationPaymentProofUrl) ? (
                <div className="space-y-3">
                  <div
                    onClick={() => handleInspectProof(managingOrder, "INSTALLATION")}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-2 flex items-center justify-center max-h-56 transition hover:border-slate-400"
                  >
                    <img
                      src={manageForm.installationPaymentProofUrl || managingOrder.installationPaymentProofUrl || ""}
                      alt={`Comprobante de Instalación #${managingOrder.orderNumber}`}
                      className="max-h-52 w-auto object-contain rounded-xl transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-md flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t.orderInspectProofBtn}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleInspectProof(managingOrder, "INSTALLATION")}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{t.orderInspectProofBtn}</span>
                      </button>
                      <a
                        href={manageForm.installationPaymentProofUrl || managingOrder.installationPaymentProofUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t.orderPaymentProofNewTab}</span>
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>{uploadingInstallProof ? t.devSaving : "Cambiar"}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          disabled={uploadingInstallProof}
                          onChange={(e) => handleStaffUploadProof(e, managingOrder, "installationPaymentProofUrl")}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setManageForm((prev) => ({ ...prev, installationPaymentProofUrl: "" }));
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Quitar comprobante"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-3">
                  <div className="flex items-start gap-2">
                    <Wrench className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed text-[11px] text-slate-600">
                      Sin comprobante de mano de obra / instalación adjunto. Suba un archivo o pegue el enlace abajo.
                    </p>
                  </div>

                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingInstallProof ? t.devSaving : t.orderAttachInstallationProofBtn}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={uploadingInstallProof}
                      onChange={(e) => handleStaffUploadProof(e, managingOrder, "installationPaymentProofUrl")}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Direct URL input */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  URL Directa del Comprobante de Instalación:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={manageForm.installationPaymentProofUrl}
                    onChange={(e) => setManageForm({ ...manageForm, installationPaymentProofUrl: e.target.value })}
                    placeholder="https://... (o sube archivo arriba)"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-purple-600 font-mono"
                  />
                  {manageForm.installationPaymentProofUrl && (
                    <button
                      type="button"
                      onClick={() => handleInspectProof(managingOrder, "INSTALLATION")}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Ver</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">Estado confirmación taller:</span>
                  {managingOrder.isInstallationPaymentConfirmed ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {lang === "es" ? "Pago Confirmado por Staff" : "Confirmed by Staff"}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lang === "es" ? "Pendiente de Confirmar" : "Pending Confirmation"}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!managingOrder.isInstallationPaymentConfirmed && (
                    <button
                      type="button"
                      disabled={confirmingInstallPayment}
                      onClick={() => handleConfirmInstallationPayment(managingOrder)}
                      className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition shadow-xs flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{confirmingInstallPayment ? "Confirmando..." : (lang === "es" ? "Confirmar Pago Mano de Obra" : "Confirm Labor Payment")}</span>
                    </button>
                  )}
                  {(manageForm.installationPaymentProofUrl || managingOrder.installationPaymentProofUrl || !managingOrder.isInstallationPaymentConfirmed) && (
                    <button
                      type="button"
                      onClick={() => {
                        setRejectPaymentType("INSTALLATION");
                        setRejectModalOrder(managingOrder);
                        setRejectionReason("");
                        setRejectError(null);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>{t.orderRejectInstallPaymentBtn || (lang === "es" ? "Rechazar Pago Instalación" : "Reject Installation Payment")}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {renderPaymentProofLightbox()}
        {renderRejectModal()}
        {renderReturnDeliveryModal()}

        {serviceDocsModalOrder && (
          <ServiceDocumentModal
            order={serviceDocsModalOrder}
            isOpen={Boolean(serviceDocsModalOrder)}
            onClose={() => setServiceDocsModalOrder(null)}
            onOrderUpdated={(updated) => {
              setOrders((prev) =>
                prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
              );
              setManagingOrder(updated);
              onOrderUpdated?.();
            }}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // MAIN ORDERS LIST VIEW
  // =========================================================================
  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por # orden, cliente, email o teléfono..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition"
            />
          </div>

          <button
            type="button"
            onClick={() => fetchOrders(false)}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 self-end sm:self-auto transition"
            title="Actualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Status Filter Tabs (Stage 0: COTIZACION) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" />
            {lang === "es" ? "Estado:" : "Status:"}
          </span>

          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              statusFilter === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {lang === "es" ? "Todos los Estados" : "All Stages"}
          </button>

          {WORKFLOW_STAGES.map((st) => {
            const isRejectedStage = st.id === "PAYMENT_REJECTED";
            const correctedCount = isRejectedStage
              ? Math.max(
                  serverCorrectedRejectedCount,
                  orders.filter((o) => isRejectedPaymentCorrected(o)).length
                )
              : 0;

            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition inline-flex items-center gap-1.5 ${
                  statusFilter === st.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : `${st.color} hover:opacity-85`
                }`}
              >
                <span>{lang === "es" ? st.labelEs : st.labelEn}</span>
                {isRejectedStage && correctedCount > 0 && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-xs"
                    title={`${correctedCount} ${
                      lang === "es"
                        ? "pedido(s) con pago corregido pendiente de revisión"
                        : "order(s) with corrected payment pending review"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    <span>● {correctedCount}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            {lang === "es" ? "Fecha:" : "Date:"}
          </span>

          {[
            { id: "ALL", labelEs: "Cualquier Fecha", labelEn: "All Dates" },
            { id: "TODAY", labelEs: "Hoy", labelEn: "Today" },
            { id: "7_DAYS", labelEs: "Últimos 7 Días", labelEn: "Last 7 Days" },
            { id: "30_DAYS", labelEs: "Últimos 30 Días", labelEn: "Last 30 Days" },
            { id: "CUSTOM", labelEs: "Personalizado", labelEn: "Custom Range" },
          ].map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDateFilter(d.id as any)}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition ${
                dateFilter === d.id
                  ? "bg-slate-800 text-white font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {lang === "es" ? d.labelEs : d.labelEn}
            </button>
          ))}

          {dateFilter === "CUSTOM" && (
            <div className="flex items-center gap-1.5 ml-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-slate-800"
              />
              <span className="text-slate-400 text-xs">-</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-xs text-slate-800"
              />
            </div>
          )}
        </div>
      </div>

      {/* Global Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Minimalist Orders List (NEW TO OLD) */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 animate-pulse"
            >
              <div className="h-5 w-32 bg-slate-200 rounded" />
              <div className="h-4 w-64 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : processedOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-2">
          <Package className="w-8 h-8 mx-auto text-slate-400" />
          <p className="text-xs font-medium">No hay pedidos registrados con estos filtros de búsqueda o fecha.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {processedOrders.map((order) => {
            let items: OrderItem[] = [];
            try {
              items = JSON.parse(order.itemsJson) || [];
            } catch {
              items = [];
            }

            const nextStageId = getNextStageId(order.status, order);
            const urgency = checkUrgency(order);
            const isCotizacion = order.status === "COTIZACION";
            const hasComments = Boolean(
              order.notes?.trim() || order.staffNotes?.trim() || order.supplierNotes?.trim()
            );

            return (
              <div
                key={order.id}
                className={`rounded-2xl p-4 sm:p-5 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  urgency.isUrgent
                    ? "bg-red-50/95 border-2 border-red-500 shadow-md ring-2 ring-red-400/40 text-red-950"
                    : "bg-white border border-slate-200 shadow-xs hover:border-slate-300"
                }`}
              >
                {/* Left: Order # & Critical Data */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`text-base font-black tracking-tight ${
                        urgency.isUrgent ? "text-red-700 font-mono" : "text-slate-900 font-mono"
                      }`}
                    >
                      #{order.orderNumber}
                    </span>

                    {/* Status Pill */}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStageColor(
                        order.status
                      )}`}
                    >
                      {getStageLabel(order.status)}
                    </span>

                    {/* BAC COMPRA CLICK BADGE */}
                    {Boolean(
                      order.serviceDocumentsJson?.includes("BAC_COMPRA_CLICK") ||
                      order.notes?.includes("BAC Compra Click")
                    ) && (
                      <span
                        className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-red-100 text-red-950 border border-red-300 shadow-2xs"
                        title={t.orderBacCompraClickRequestedNotice}
                      >
                        <CreditCard className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>💳 {t.orderBacCompraClickBadge}</span>
                      </span>
                    )}

                    {/* BULLET POINT FOR CORRECTED PAYMENT IN REJECTED PAYMENT STATE */}
                    {isRejectedPaymentCorrected(order) && (
                      <span
                        className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-400 shadow-2xs animate-pulse"
                        title={
                          lang === "es"
                            ? "El cliente corrigió su comprobante de pago. Requiere verificación del staff."
                            : "Client corrected payment receipt. Requires staff review."
                        }
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping shrink-0" />
                        <span>● {t.orderRejectedPaymentCorrectedBadge || (lang === "es" ? "Pago Corregido • Revisar Pago" : "Corrected Payment • Review Payment")}</span>
                      </span>
                    )}

                    {/* COMMENT / NOTE INDICATOR ICON (User Requirement) */}
                    {hasComments && (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs"
                        title={order.notes || order.staffNotes || "Contiene notas o información técnica"}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                        <span>{t.orderHasNotesBadge}</span>
                      </span>
                    )}

                    {/* PAYMENT PROOF BADGE / PREVIEW BUTTON */}
                    {order.paymentProofUrl ? (
                      <button
                        type="button"
                        onClick={() => setPreviewPaymentProofOrder(order)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition shadow-2xs"
                        title={t.orderViewPaymentProofBtn}
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t.orderPaymentProofBadge}</span>
                        <Eye className="w-3 h-3 text-emerald-600" />
                      </button>
                    ) : order.status === "PAYMENT_CONFIRMATION" ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300"
                        title={t.orderPaymentProofEmpty}
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>{t.orderNoPaymentProofBadge}</span>
                      </span>
                    ) : null}

                    {/* SUPPLIER PURCHASE PROOF BADGE (*un) */}
                    {(() => {
                      let proofCount = 0;
                      let proofs: string[] = [];
                      if (Array.isArray(order.purchaseProofUrls) && order.purchaseProofUrls.length > 0) {
                        proofs = order.purchaseProofUrls;
                        proofCount = proofs.length;
                      } else if (order.serviceDocumentsJson) {
                        try {
                          const doc = typeof order.serviceDocumentsJson === "string" ? JSON.parse(order.serviceDocumentsJson) : order.serviceDocumentsJson;
                          if (Array.isArray(doc?.purchaseProofUrls)) {
                            proofs = doc.purchaseProofUrls;
                            proofCount = proofs.length;
                          }
                        } catch {}
                      }

                      if (proofCount > 0) {
                        return (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewProofModal({
                                orderNumber: order.orderNumber,
                                status: order.status,
                                title: lang === "es" ? `Comprobante de Compra (1 de ${proofCount})` : `Purchase Proof (1 of ${proofCount})`,
                                subtitle: lang === "es" ? "Factura de compra de repuestos (*un)" : "Parts purchase receipt (*un)",
                                imageUrl: proofs[0],
                              })
                            }
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-300 hover:bg-indigo-100 transition shadow-2xs"
                            title={lang === "es" ? `${proofCount} Comprobantes de compra adjuntos` : `${proofCount} purchase receipts attached`}
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{proofCount} {lang === "es" ? "Compra" : "Buy Proof"}</span>
                            <Eye className="w-3 h-3 text-indigo-600" />
                          </button>
                        );
                      }

                      if (order.status === "NEED_TO_GET_ORDER") {
                        return (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-300"
                            title={lang === "es" ? "Falta comprobante de compra para avanzar" : "Missing purchase proof to advance"}
                          >
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>{lang === "es" ? "Falta Compra (*un)" : "Need Buy Proof"}</span>
                          </span>
                        );
                      }

                      return null;
                    })()}

                    {/* SERVICE PAYMENT PROOF BADGE */}
                    {order.servicePaymentProofUrl && (
                      <button
                        type="button"
                        onClick={() => handleInspectProof(order, "SERVICE")}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-300 hover:bg-blue-100 transition shadow-2xs"
                        title={t.orderServicePaymentProofTitle}
                      >
                        <Truck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Servicio</span>
                        <Eye className="w-3 h-3 text-blue-600" />
                      </button>
                    )}

                    {/* INSTALLATION PAYMENT PROOF BADGE */}
                    {order.installationPaymentProofUrl && (
                      <button
                        type="button"
                        onClick={() => handleInspectProof(order, "INSTALLATION")}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-300 hover:bg-purple-100 transition shadow-2xs"
                        title={t.orderInstallationPaymentProofTitle}
                      >
                        <Wrench className="w-3.5 h-3.5 text-purple-600" />
                        <span>Instalación</span>
                        <Eye className="w-3 h-3 text-purple-600" />
                      </button>
                    )}

                    {/* RED URGENCY BADGE (24h for payment confirmation / 48h for need to get order) */}
                    {urgency.isUrgent && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-red-600 text-white animate-pulse shadow-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{urgency.badgeText}</span>
                      </span>
                    )}

                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.createdAt).toLocaleDateString()} ({new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                    </span>
                  </div>

                  {/* Customer & Critical details */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-semibold text-slate-900">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {order.customerName || order.user?.displayName || order.guestEmail || order.user?.email || "Cliente"}
                    </span>

                    {order.customerPhone && (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {order.customerPhone}
                      </span>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-slate-500">
                        Entrega: <strong className="text-slate-700">{order.serviceType}</strong>
                      </span>
                      {(() => {
                        const isPickup =
                          (order.serviceType || "").toUpperCase().includes("PICKUP") ||
                          (Number(order.pickupCostCRC) || 0) > 0 ||
                          (order.serviceSchedule?.serviceType || "").toLowerCase() === "pickup";
                        if (!isPickup) return null;
                        let pKm = 0;
                        if (order.serviceDocumentsJson) {
                          try {
                            const doc = JSON.parse(order.serviceDocumentsJson);
                            if (doc?.distanceKm > 0) pKm = doc.distanceKm;
                          } catch {}
                        }
                        if (!pKm && order.serviceSchedule?.distanceKm) pKm = order.serviceSchedule.distanceKm;
                        if (!pKm && Number(order.pickupCostCRC) > 0) {
                          const baseRate = 1500;
                          pKm = Number(order.pickupCostCRC) > 10000
                            ? Math.round((Number(order.pickupCostCRC) - 10000) / baseRate)
                            : Math.round(Number(order.pickupCostCRC) / baseRate);
                        }
                        if (pKm <= 0) return null;
                        const gasVal = pKm * 500;
                        return (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold"
                            title={`Costo combustible traslado UTV: ₡500/km x ${pKm} km`}
                          >
                            <Fuel className="w-3 h-3 text-[#F05526]" />
                            <span>Gasolina: ₡{gasVal.toLocaleString()} ({pKm} km)</span>
                          </span>
                        );
                      })()}
                    </div>

                    {(order.shippingAddress || order.serviceSchedule?.destinationAddress) && (
                      <div className="flex items-center gap-1 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px] sm:max-w-[220px]" title={order.shippingAddress || order.serviceSchedule?.destinationAddress}>
                          {order.shippingAddress || order.serviceSchedule?.destinationAddress}
                        </span>
                        <a
                          href={`https://waze.com/ul?q=${encodeURIComponent(order.shippingAddress || order.serviceSchedule?.destinationAddress || "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-cyan-50 hover:bg-cyan-100 text-cyan-800 text-[10px] font-bold border border-cyan-200 transition"
                          title="Abrir en Waze"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>Waze</span>
                        </a>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.shippingAddress || order.serviceSchedule?.destinationAddress || "")}&hl=es`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 text-[10px] font-bold border border-blue-200 transition"
                          title="Abrir en Google Maps"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>Maps</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Items summary */}
                  <p className="text-xs text-slate-500 truncate pt-0.5">
                    Piezas:{" "}
                    {items.length > 0
                      ? items
                          .map((it) => {
                            const paramSummary = Array.isArray(it.selectedParameters) && it.selectedParameters.length > 0
                              ? ` [${it.selectedParameters.map((sp) => sp.optionLabel).join(", ")}]`
                              : it.parametersSummary
                              ? ` [${it.parametersSummary}]`
                              : "";
                            return `${it.name || it.title || "Pieza"}${paramSummary} (x${it.quantity || 1})`;
                          })
                          .join(", ")
                      : "Sin ítems"}
                  </p>
                </div>

                {/* Right: Total & Actions */}
                <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Total */}
                  <div className="text-left md:text-right pr-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total</span>
                    <span className="text-base font-black text-slate-900 font-mono">
                      {formatCRC(order.totalCRC)}
                    </span>
                  </div>

                  {/* Conditional Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* COTIZACION: Attach payment proof to advance directly to PAYMENT_CONFIRMATION */}
                    {isCotizacion && (
                      <label
                        className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs"
                        title={lang === "es" ? "Adjuntar comprobante recibido por WhatsApp y avanzar a Confirmación de Pago" : "Attach payment receipt received via WhatsApp and advance to Payment Confirmation"}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingProof ? (lang === "es" ? "Subiendo..." : "Uploading...") : t.orderAttachProofStaffBtn}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          disabled={uploadingProof}
                          className="hidden"
                          onChange={(e) => handleStaffUploadProof(e, order, "paymentProofUrl")}
                        />
                      </label>
                    )}

                    {/* PAYMENT_CONFIRMATION: Inspect proof, attach/replace if needed, and approve payment */}
                    {order.status === "PAYMENT_CONFIRMATION" && (
                      <div className="flex items-center gap-2">
                        {order.paymentProofUrl ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setPreviewPaymentProofOrder(order)}
                              className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs"
                              title={t.orderPaymentProofOpenFull}
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-400" />
                              <span>{lang === "es" ? "Ver Comprobante" : "View Proof"}</span>
                            </button>
                            <button
                              type="button"
                              disabled={updating}
                              onClick={() => handleOpenConfirm(order, "NEED_TO_GET_ORDER")}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs"
                              title={lang === "es" ? "Aprobar pago verificado y avanzar orden a Repuestos Requeridos" : "Approve verified payment and advance order"}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{t.orderApprovePaymentStaffBtn}</span>
                            </button>
                          </>
                        ) : (
                          <label
                            className="cursor-pointer bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs"
                            title={lang === "es" ? "Adjuntar comprobante de pago recibido para esta orden" : "Attach payment proof"}
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{uploadingProof ? (lang === "es" ? "Subiendo..." : "Uploading...") : t.orderAttachProofStaffBtn}</span>
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              disabled={uploadingProof}
                              className="hidden"
                              onChange={(e) => handleStaffUploadProof(e, order, "paymentProofUrl")}
                            />
                          </label>
                        )}
                      </div>
                    )}

                    {/* EDIT BUTTON: If COTIZACION -> Edit Quote; Else -> Manage Order */}
                    {isCotizacion ? (
                      <button
                        type="button"
                        onClick={() => handleOpenEditQuote(order)}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs"
                        title="Editar cotización completa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenManageOrder(order)}
                          className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs"
                          title="Gestionar pedido, transporte y mensajes"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Gestionar</span>
                        </button>
                        {isOrderAtOrPastProgramService(order.status) && (
                          <button
                            type="button"
                            onClick={() => setServiceDocsModalOrder(order)}
                            className="bg-amber-400 hover:bg-amber-300 text-amber-950 border border-amber-500/40 text-xs font-bold px-2.5 py-2 rounded-xl flex items-center gap-1 transition shadow-xs"
                            title={order.serviceDocumentsJson && order.serviceDocumentsJson !== "{}" ? "Ver / Editar documentos de servicio" : "Crear documentos de servicio"}
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-950" />
                            <span className="hidden sm:inline">Docs</span>
                          </button>
                        )}
                      </>
                    )}

                    {/* Next Stage Button / Confirm Service Button */}
                    {order.status === "CONFIRM_SERVICE_PAYMENT" ? (
                      <button
                        type="button"
                        disabled={confirmingServicePayment}
                        onClick={() => handleConfirmServicePayment(order)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs animate-pulse disabled:opacity-50"
                        title={lang === "es" ? "Confirmar Pago de Servicio y Avanzar" : "Confirm Service Payment & Advance"}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{lang === "es" ? "Confirmar Servicio" : "Confirm Service"}</span>
                      </button>
                    ) : nextStageId ? (
                      <button
                        type="button"
                        onClick={() => handleOpenConfirm(order, nextStageId)}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs"
                        title={`Avanzar a ${getStageLabel(nextStageId)}`}
                      >
                        <span>Avanzar</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : null}

                    {/* Quick Return Delivery 50% for READY_FOR_PICKUP */}
                    {order.status === "READY_FOR_PICKUP" && (
                      <button
                        type="button"
                        onClick={() => {
                          setReturnDeliveryOrder(order);
                          setReturnAddress(order.shippingAddress || "");
                          setReturnCostCRC("5000");
                          setReturnNotes("");
                        }}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition"
                        title={t.orderConfigureReturnDelivery}
                      >
                        <Truck className="w-3.5 h-3.5 text-purple-600" />
                        <span>Retorno 50%</span>
                      </button>
                    )}

                    {/* Quick Payment Rejection for PAYMENT_CONFIRMATION */}
                    {order.status === "PAYMENT_CONFIRMATION" && (
                      <button
                        type="button"
                        onClick={() => {
                          setRejectPaymentType("ORDER");
                          setRejectModalOrder(order);
                          setRejectionReason("");
                          setRejectError(null);
                        }}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-2.5 py-2 rounded-xl flex items-center gap-1 transition"
                        title={t.orderRejectPaymentBtn}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Rechazar</span>
                      </button>
                    )}

                    {/* Stage Selector Dropdown (Predetermined Stages only) */}
                    <select
                      value={order.status}
                      onChange={(e) => {
                        if (e.target.value !== order.status) {
                          handleOpenConfirm(order, e.target.value);
                        }
                      }}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-900"
                    >
                      {getPredeterminedStagesForOrder(order).map((st) => (
                        <option key={st.id} value={st.id}>
                          {lang === "es" ? st.labelEs : st.labelEn}
                        </option>
                      ))}
                    </select>

                    {/* DELETE ORDER BUTTON (User Requirement) */}
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteModal(order)}
                      className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition"
                      title={t.orderDeleteBtn}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mandatory Status Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">{t.orderConfirmStatusTitle}</h4>
              <p className="text-xs text-slate-600">
                {t.orderConfirmStatusPrompt}{" "}
                <strong className="text-slate-900">#{confirmModal.orderNumber}</strong>?
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>Estado Actual:</span>
                <span className="font-semibold text-slate-700">
                  {getStageLabel(confirmModal.currentStatus)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-900">
                <span className="font-bold">Nuevo Estado:</span>
                <span className="font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-2xs">
                  {getStageLabel(confirmModal.targetStatus)}
                </span>
              </div>
            </div>

            {/* Payment Proof Preview for Confirmation */}
            {(() => {
              const modalOrder = orders.find((o) => o.id === confirmModal.orderId);
              if (!modalOrder) return null;

              if (modalOrder.paymentProofUrl) {
                return (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-700 font-bold">
                      <span className="flex items-center gap-1.5 text-[11px] text-slate-900">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{t.orderPaymentProofTitle}:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewPaymentProofOrder(modalOrder)}
                        className="text-[11px] text-[#0052CC] hover:underline font-semibold flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{t.orderPaymentProofOpenFull}</span>
                      </button>
                    </div>
                    <div
                      onClick={() => setPreviewPaymentProofOrder(modalOrder)}
                      className="cursor-pointer max-h-40 overflow-hidden rounded-xl border border-slate-200 bg-slate-950 flex items-center justify-center p-1 hover:opacity-95 transition"
                    >
                      <img
                        src={modalOrder.paymentProofUrl}
                        alt="Comprobante de pago"
                        className="max-h-36 object-contain rounded"
                      />
                    </div>
                  </div>
                );
              }

              if (
                confirmModal.targetStatus === "PAYMENT_CONFIRMATION" ||
                confirmModal.currentStatus === "PAYMENT_CONFIRMATION" ||
                confirmModal.targetStatus === "NEED_TO_GET_ORDER"
              ) {
                return (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{t.orderPaymentProofEmpty}</span>
                  </div>
                );
              }

              return null;
            })()}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={updating}
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                {t.orderCancelBtn}
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={handleExecuteStatusUpdate}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {updating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{t.devSaving}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.orderConfirmBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DELETION MODAL (Requires Master password if in or past PAYMENT_CONFIRMATION) */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-red-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  {deleteModal.status === "COTIZACION"
                    ? t.orderDeleteQuoteConfirmTitle
                    : `${t.orderDeleteBtn} Pedido #${deleteModal.orderNumber}`}
                </h4>
                <p className="text-xs text-slate-600">
                  {deleteModal.status === "COTIZACION"
                    ? t.orderDeleteQuoteConfirmPrompt
                    : `¿Confirmas la eliminación del pedido #${deleteModal.orderNumber}?`}
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{deleteError}</span>
              </div>
            )}

            {/* If in or past PAYMENT_CONFIRMATION -> Master password requirement alert & input */}
            {deleteModal.status !== "COTIZACION" && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-3 text-xs">
                <div className="flex items-start gap-2 text-amber-900 font-semibold leading-relaxed">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>{t.orderDeleteMasterPasswordRequired}</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-amber-950 block mb-1">
                    {t.orderMasterPasswordLabel}:
                  </label>
                  <input
                    type="password"
                    name={`auth_master_delete_${deleteModal.id}`}
                    autoComplete="new-password"
                    value={deleteMasterPassword}
                    onChange={(e) => setDeleteMasterPassword(e.target.value)}
                    placeholder={t.orderMasterPasswordPlaceholder}
                    className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-600 font-mono"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setDeleteModal(null);
                  setDeleteMasterPassword("");
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                {t.orderCancelBtn}
              </button>
              <button
                type="button"
                disabled={deleting || (deleteModal.status !== "COTIZACION" && !deleteMasterPassword.trim())}
                onClick={handleExecuteDeleteOrder}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t.orderDeleteBtn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {renderPaymentProofLightbox()}
      {renderRejectModal()}
      {renderReturnDeliveryModal()}

      {serviceDocsModalOrder && (
        <ServiceDocumentModal
          order={serviceDocsModalOrder}
          isOpen={Boolean(serviceDocsModalOrder)}
          onClose={() => setServiceDocsModalOrder(null)}
          onOrderUpdated={(updated) => {
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
            );
            onOrderUpdated?.();
          }}
        />
      )}
    </div>
  );
}
