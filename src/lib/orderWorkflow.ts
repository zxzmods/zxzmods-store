import {
  Clock,
  Truck,
  Plane,
  Wrench,
  CheckCircle2,
  Sparkles,
  ClipboardList,
  CreditCard,
  AlertCircle,
  Package,
  Calendar,
  Home,
  MapPin,
} from "lucide-react";

export type NormalizedServiceCategory = "delivery" | "pickup" | "home_install" | "shop_install";

export function normalizeServiceCategory(serviceType?: string | null): NormalizedServiceCategory {
  const s = (serviceType || "").toLowerCase().trim();
  // 1. Delivery / Shipping / Envíos
  if (
    s === "shipping" ||
    s === "delivery" ||
    s.includes("envio") ||
    s.includes("envío") ||
    s.includes("entrega") ||
    s.includes("delivery")
  ) {
    return "delivery";
  }
  // 2. In-Shop installation / Store pickup / Taller ZxZ Pozos Santa Ana
  if (
    s === "store_pickup" ||
    s === "shop_installation" ||
    s === "shop_install" ||
    s.includes("store") ||
    s.includes("tienda") ||
    s.includes("taller") ||
    s.includes("pozos")
  ) {
    return "shop_install";
  }
  // 3. Home service / Domicilio
  if (
    s === "home_service" ||
    s === "installation" ||
    s.includes("domicilio") ||
    s.includes("home")
  ) {
    return "home_install";
  }
  // 4. Vehicle Pick-up & Delivery (UTV/SxS towing platform)
  if (
    s === "utv_pickup" ||
    s === "pickup" ||
    s.includes("retiro") ||
    s.includes("plataforma") ||
    s.includes("grua") ||
    s.includes("grúa")
  ) {
    return "pickup";
  }
  // Default: shop_installation / STORE_PICKUP / installation only
  return "shop_install";
}

/**
 * Maps order service category to the exact service query parameter accepted by /servicios
 * (?service=shop_installation | installation | delivery | pickup)
 */
export function getServiceParamFromOrder(
  serviceType?: string | null
): "shop_installation" | "installation" | "delivery" | "pickup" {
  const cat = normalizeServiceCategory(serviceType);
  if (cat === "delivery") return "delivery";
  if (cat === "pickup") return "pickup";
  if (cat === "home_install") return "installation";
  return "shop_installation";
}

/**
 * Returns true if the order is in the 'PROGRAM_SERVICE' step (Step 5)
 */
export function isOrderInProgramServiceStage(
  status?: string | null,
  serviceType?: string | null
): boolean {
  if (!status) return false;
  const s = status.toUpperCase().trim();
  if (s === "PROGRAM_SERVICE") return true;
  return getCustomerOrderStepIndex(s, serviceType) === 5;
}

/**
 * Returns true if the order is in or past the 'IN_WAREHOUSE_CHECK' ('en taller para revisión') stage.
 * Service documents can be created anytime after the 'en taller para revisión' state.
 */
export function isOrderAtOrPastProgramService(status?: string | null): boolean {
  if (!status) return false;
  const s = status.toUpperCase().trim();
  const stages = [
    "IN_WAREHOUSE_CHECK",
    "PROGRAM_SERVICE",
    "CONFIRM_SERVICE_PAYMENT",
    "WAITING_ON_DELIVERY",
    "PICKUP_DATE_SET",
    "HOME_INSTALL_SET",
    "INSTALLING",
    "INSTALLATION_PAYMENT",
    "READY_TO_SET_RETURN_DATE",
    "READY_FOR_PICKUP",
    "READY_TO_PICK_UP",
    "READY_FOR_INSTALL",
    "COMPLETED",
  ];
  return stages.includes(s);
}

/**
 * Returns true if the order is in the 'INSTALLATION_PAYMENT' stage
 */
export function isOrderInInstallationPaymentStage(status?: string | null): boolean {
  if (!status) return false;
  const s = status.toUpperCase().trim();
  return (
    s === "INSTALLATION_PAYMENT" ||
    s === "PENDING_INSTALLATION_PAYMENT" ||
    s === "PAGO_INSTALACION" ||
    s === "PAGO_DE_INSTALACION" ||
    s === "PAGO DE INSTALACION" ||
    s === "PAGO DE INSTALACIÓN"
  );
}

/**
 * Returns true if the order has progressed strictly AFTER 'en taller para revision' (IN_WAREHOUSE_CHECK)
 */
export function isOrderAfterWarehouseCheck(status?: string | null): boolean {
  if (!status) return false;
  const s = status.toUpperCase().trim();
  const stagesAfter = [
    "PROGRAM_SERVICE",
    "CONFIRM_SERVICE_PAYMENT",
    "WAITING_ON_DELIVERY",
    "PICKUP_DATE_SET",
    "HOME_INSTALL_SET",
    "INSTALLING",
    "INSTALLATION_PAYMENT",
    "PAGO_INSTALACION",
    "READY_TO_SET_RETURN_DATE",
    "READY_FOR_PICKUP",
    "READY_TO_PICK_UP",
    "COMPLETED",
  ];
  return stagesAfter.includes(s);
}

/**
 * Returns the automatic next stage once service payment is confirmed by staff.
 */
export function getNextStageAfterServicePayment(serviceType?: string | null): string {
  const cat = normalizeServiceCategory(serviceType);
  if (cat === "delivery") return "WAITING_ON_DELIVERY";
  if (cat === "pickup") return "PICKUP_DATE_SET";
  if (cat === "home_install") return "HOME_INSTALL_SET";
  return "INSTALLING";
}

/**
 * Returns true if the service category requires installation/labor.
 * - pickup: UTV towing & platform installation in workshop
 * - shop_install: In-shop installation at Pozos workshop
 * - home_install: Home technical installation visit
 */
export function isServiceRequiringInstallation(serviceType?: string | null): boolean {
  const cat = normalizeServiceCategory(serviceType);
  return cat === "pickup" || cat === "shop_install" || cat === "home_install";
}

/**
 * Returns true if installation payment can be performed by the client for the order.
 * Requirement:
 * "In only installation payment can be done during 'listo para retiro' or 'pago de instalacion',
 * 'pago de instalacion' goes after in the only installation."
 */
export function canPayInstallation(
  status?: string | null,
  serviceType?: string | null,
  serviceDocumentsJson?: any
): boolean {
  if (!status) return false;
  const s = status.toUpperCase().trim();
  if (isOrderInInstallationPaymentStage(s)) return true;
  const cat = normalizeServiceCategory(serviceType);
  if (cat === "shop_install" && (s === "READY_FOR_PICKUP" || s === "READY_TO_PICK_UP")) {
    return true;
  }
  if (s === "PAYMENT_REJECTED") {
    let docs: any = {};
    if (serviceDocumentsJson) {
      try {
        docs =
          typeof serviceDocumentsJson === "string"
            ? JSON.parse(serviceDocumentsJson)
            : serviceDocumentsJson;
      } catch {}
    }
    if (docs?.rejectionPaymentType === "INSTALLATION" || docs?.installationPaymentRejected) {
      return true;
    }
  }
  return false;
}

/**
 * Checks whether an order already has installation payment confirmed or receipt submitted.
 */
export function isInstallationPaymentPaidOrConfirmed(order: any): boolean {
  if (!order) return false;
  if (order.isInstallationPaymentConfirmed) return true;
  if (order.installationPaymentProofUrl && String(order.installationPaymentProofUrl).trim().length > 0) return true;
  if (order.serviceDocumentsJson) {
    try {
      const doc = typeof order.serviceDocumentsJson === "string" ? JSON.parse(order.serviceDocumentsJson) : order.serviceDocumentsJson;
      if (doc?.installationPaymentConfirmed) return true;
      if (doc?.installationPaymentReceiptUrl && String(doc.installationPaymentReceiptUrl).trim().length > 0) return true;
      if (doc?.receiptUrl && String(doc.receiptUrl).trim().length > 0) return true;
    } catch {}
  }
  return false;
}

/**
 * Evaluates whether an order should skip the installation payment step.
 * User requirement: "Fix so that in any service that requires installation the payment installation is a requirement.
 * if only free installation products on the order, then skip installation payment step."
 */
export function shouldSkipInstallationPayment(
  orderOrItems?: any,
  installationCostCRC?: number | null,
  laborSubtotalCRC?: number | null
): boolean {
  if (!orderOrItems) return false;

  let items: any[] = [];
  let installCost = 0;
  let laborCost = 0;
  let serviceType: string | null = null;

  if (Array.isArray(orderOrItems)) {
    items = orderOrItems;
  } else if (typeof orderOrItems === "object") {
    installCost = Number(orderOrItems.installationCostCRC) || 0;
    laborCost = Number(orderOrItems.laborSubtotalCRC) || 0;
    serviceType = orderOrItems.serviceType || null;
    const rawItems = orderOrItems.itemsJson || orderOrItems.items;
    try {
      items = typeof rawItems === "string" ? JSON.parse(rawItems) : (Array.isArray(rawItems) ? rawItems : []);
    } catch {
      items = [];
    }
  }

  if (installationCostCRC !== undefined && installationCostCRC !== null) {
    installCost = Number(installationCostCRC) || 0;
  }
  if (laborSubtotalCRC !== undefined && laborSubtotalCRC !== null) {
    laborCost = Number(laborSubtotalCRC) || 0;
  }

  // If there is explicit non-zero installation fee or labor cost, do not skip
  if (installCost > 0 || laborCost > 0) {
    return false;
  }

  if (!items || items.length === 0) {
    return false;
  }

  // If any item explicitly has non-zero installation price, do not skip
  const hasPaidItem = items.some((it: any) => {
    const isFree = Boolean(it.freeInstallation || it.isFreeInstall || it.isInstallationIncluded);
    const price = Number(it.installationPriceCRC) || 0;
    return !isFree && price > 0;
  });
  if (hasPaidItem) {
    return false;
  }

  // Requirement: "if only free installation products on the order, then skip installation payment step."
  const allItemsFree = items.every((it: any) => {
    return Boolean(it.freeInstallation || it.isFreeInstall || it.isInstallationIncluded);
  });
  if (allItemsFree) {
    return true;
  }

  // Check items with installation explicitly selected
  const installedItems = items.filter((it: any) => Boolean(it.withInstallation));
  if (installedItems.length > 0) {
    return installedItems.every((it: any) =>
      Boolean(it.freeInstallation || it.isFreeInstall || it.isInstallationIncluded) ||
      Number(it.installationPriceCRC || 0) === 0
    );
  }

  // Any service requiring installation defaults to requiring installation payment
  if (serviceType && isServiceRequiringInstallation(serviceType)) {
    return false;
  }

  return false;
}

/**
 * Returns dynamic customer-visible order workflow stages based on the service chosen by the client.
 * 1. Delivery service -> waiting on delivery -> completed
 * 2. Pick-up service -> pick-up date set -> installing -> ready to set return date -> completed
 * 3. Home install service -> home install set -> installing -> completed
 * 4. Installation only (Shop) -> installing -> ready for pick up -> completed
 */
export function getCustomerOrderStages(
  serviceType?: string | null,
  isServiceScheduled: boolean = false,
  skipInstallationPayment: boolean = false,
  isPaidInstallation: boolean = false
) {
  const category = normalizeServiceCategory(serviceType);

  // Common baseline steps (1 to 5)
  const baseSteps = [
    {
      id: "PAYMENT_CONFIRMATION",
      stepNum: 1,
      labelEs: "Confirmación de Pago",
      labelEn: "Payment Confirmation",
      subEs: "Comprobante en revisión",
      subEn: "Receipt in review",
      icon: Clock,
    },
    {
      id: "SHIPPING_IN_US",
      stepNum: 2,
      labelEs: "En Tránsito en USA",
      labelEn: "Shipping in US",
      subEs: "Despacho en Miami",
      subEn: "Dispatched in Miami",
      icon: Truck,
    },
    {
      id: "SHIPPING_TO_CR",
      stepNum: 3,
      labelEs: "En Tránsito a Costa Rica",
      labelEn: "Shipping to Costa Rica",
      subEs: "Flete aéreo / aduana",
      subEn: "Air freight & customs",
      icon: Plane,
    },
    {
      id: "IN_WAREHOUSE_CHECK",
      stepNum: 4,
      labelEs: "En Taller para Revisión",
      labelEn: "In Workshop for Inspection",
      subEs: "Control técnico ZxZ",
      subEn: "Technical inspection",
      icon: Wrench,
    },
    {
      id: "PROGRAM_SERVICE",
      stepNum: 5,
      labelEs: "Programar Servicio",
      labelEn: "Program Service",
      subEs: "Coordinar fecha y logística",
      subEn: "Coordinate schedule & logistics",
      icon: Calendar,
    },
  ];

  // User requirement: "Also in orders, when showing the steps get up to 'Programar servicio' the other steps are going to show after the service got program."
  if (!isServiceScheduled) {
    return baseSteps;
  }

  if (category === "delivery") {
    return [
      ...baseSteps,
      {
        id: "CONFIRM_SERVICE_PAYMENT",
        stepNum: 6,
        labelEs: "Confirmar Pago de Servicio",
        labelEn: "Confirm Service Payment",
        subEs: "Comprobante en revisión",
        subEn: "Payment in review",
        icon: Clock,
      },
      {
        id: "WAITING_ON_DELIVERY",
        stepNum: 7,
        labelEs: "Esperando Entrega",
        labelEn: "Waiting on Delivery",
        subEs: "Despacho en ruta",
        subEn: "Dispatch in transit",
        icon: Truck,
      },
      {
        id: "COMPLETED",
        stepNum: 8,
        labelEs: "Completado y Entregado",
        labelEn: "Completed & Delivered",
        subEs: "Orden finalizada",
        subEn: "Order fulfilled",
        icon: Sparkles,
      },
    ];
  }

  if (category === "pickup") {
    // User Requirement: "Installation payment goes after 'instalando piezas' in the pick-up service."
    const afterInstallSteps = skipInstallationPayment
      ? [
          {
            id: "READY_TO_SET_RETURN_DATE",
            stepNum: 9,
            labelEs: "Listo para Programar Fecha de Entrega",
            labelEn: "Ready to Set Return Date",
            subEs: "Coordinar retorno de UTV",
            subEn: "Schedule UTV return",
            icon: Clock,
          },
          {
            id: "COMPLETED",
            stepNum: 10,
            labelEs: "Completado y Entregado",
            labelEn: "Completed & Delivered",
            subEs: "Orden finalizada",
            subEn: "Order fulfilled",
            icon: Sparkles,
          },
        ]
      : [
          {
            id: "INSTALLATION_PAYMENT",
            stepNum: 9,
            labelEs: "Pago de Instalación",
            labelEn: "Installation Payment",
            subEs: "Pagar mano de obra de taller",
            subEn: "Pay workshop labor",
            icon: CreditCard,
          },
          {
            id: "READY_TO_SET_RETURN_DATE",
            stepNum: 10,
            labelEs: "Listo para Programar Fecha de Entrega",
            labelEn: "Ready to Set Return Date",
            subEs: "Coordinar retorno de UTV",
            subEn: "Schedule UTV return",
            icon: Clock,
          },
          {
            id: "COMPLETED",
            stepNum: 11,
            labelEs: "Completado y Entregado",
            labelEn: "Completed & Delivered",
            subEs: "Orden finalizada",
            subEn: "Order fulfilled",
            icon: Sparkles,
          },
        ];

    return [
      ...baseSteps,
      {
        id: "CONFIRM_SERVICE_PAYMENT",
        stepNum: 6,
        labelEs: "Confirmar Pago de Servicio",
        labelEn: "Confirm Service Payment",
        subEs: "Comprobante en revisión",
        subEn: "Payment in review",
        icon: Clock,
      },
      {
        id: "PICKUP_DATE_SET",
        stepNum: 7,
        labelEs: "Fecha de Retiro Programada",
        labelEn: "Pick-up Date Set",
        subEs: "Retiro de UTV agendado",
        subEn: "UTV pickup scheduled",
        icon: Calendar,
      },
      {
        id: "INSTALLING",
        stepNum: 8,
        labelEs: "Instalando Piezas",
        labelEn: "Installing",
        subEs: "Mano de obra en taller",
        subEn: "Workshop labor",
        icon: Wrench,
      },
      ...afterInstallSteps,
    ];
  }

  if (category === "home_install") {
    const afterInstallSteps = skipInstallationPayment
      ? [
          {
            id: "COMPLETED",
            stepNum: 9,
            labelEs: "Completado y Entregado",
            labelEn: "Completed & Delivered",
            subEs: "Orden finalizada",
            subEn: "Order fulfilled",
            icon: Sparkles,
          },
        ]
      : [
          {
            id: "INSTALLATION_PAYMENT",
            stepNum: 9,
            labelEs: "Pago de Instalación",
            labelEn: "Installation Payment",
            subEs: "Pagar mano de obra",
            subEn: "Pay installation labor",
            icon: CreditCard,
          },
          {
            id: "COMPLETED",
            stepNum: 10,
            labelEs: "Completado y Entregado",
            labelEn: "Completed & Delivered",
            subEs: "Orden finalizada",
            subEn: "Order fulfilled",
            icon: Sparkles,
          },
        ];

    return [
      ...baseSteps,
      {
        id: "CONFIRM_SERVICE_PAYMENT",
        stepNum: 6,
        labelEs: "Confirmar Pago de Servicio",
        labelEn: "Confirm Service Payment",
        subEs: "Comprobante en revisión",
        subEn: "Payment in review",
        icon: Clock,
      },
      {
        id: "HOME_INSTALL_SET",
        stepNum: 7,
        labelEs: "Instalación a Domicilio Programada",
        labelEn: "Home Install Set",
        subEs: "Visita técnica confirmada",
        subEn: "Technical visit confirmed",
        icon: Home,
      },
      {
        id: "INSTALLING",
        stepNum: 8,
        labelEs: "Instalando Piezas",
        labelEn: "Installing",
        subEs: "Instalación en sitio",
        subEn: "On-site installation",
        icon: Wrench,
      },
      ...afterInstallSteps,
    ];
  }

  // Installation only (Shop installation / default)
  // User Requirement:
  // "In only installation payment can be done during 'listo para retiro' or 'pago de instalacion',
  // 'pago de instalacion' goes after in the only installation.
  // If payed during 'listo para retiro' then skip 'installation payment' stage, only in 'only installation' service."
  const shouldSkipStage = skipInstallationPayment || isPaidInstallation;
  const afterInstallSteps = shouldSkipStage
    ? [
        {
          id: "READY_FOR_PICKUP",
          stepNum: 8,
          labelEs: "Listo para Retiro",
          labelEn: "Ready for Pick Up",
          subEs: "Retiro en taller Pozos",
          subEn: "Pickup at Pozos workshop",
          icon: CheckCircle2,
        },
        {
          id: "COMPLETED",
          stepNum: 9,
          labelEs: "Completado y Entregado",
          labelEn: "Completed & Delivered",
          subEs: "Orden finalizada",
          subEn: "Order fulfilled",
          icon: Sparkles,
        },
      ]
    : [
        {
          id: "READY_FOR_PICKUP",
          stepNum: 8,
          labelEs: "Listo para Retiro",
          labelEn: "Ready for Pick Up",
          subEs: "Retiro en taller Pozos",
          subEn: "Pickup at Pozos workshop",
          icon: CheckCircle2,
        },
        {
          id: "INSTALLATION_PAYMENT",
          stepNum: 9,
          labelEs: "Pago de Instalación",
          labelEn: "Installation Payment",
          subEs: "Pagar mano de obra de taller",
          subEn: "Pay workshop labor",
          icon: CreditCard,
        },
        {
          id: "COMPLETED",
          stepNum: 10,
          labelEs: "Completado y Entregado",
          labelEn: "Completed & Delivered",
          subEs: "Orden finalizada",
          subEn: "Order fulfilled",
          icon: Sparkles,
        },
      ];

  return [
    ...baseSteps,
    {
      id: "CONFIRM_SERVICE_PAYMENT",
      stepNum: 6,
      labelEs: "Confirmar Pago de Servicio",
      labelEn: "Confirm Service Payment",
      subEs: "Comprobante en revisión",
      subEn: "Payment in review",
      icon: Clock,
    },
    {
      id: "INSTALLING",
      stepNum: 7,
      labelEs: "Instalando Piezas",
      labelEn: "Installing",
      subEs: "Mano de obra en taller",
      subEn: "Workshop labor",
      icon: Wrench,
    },
    ...afterInstallSteps,
  ];
}

/**
 * Customer visible order workflow stages (fallback baseline).
 */
export const CUSTOMER_ORDER_STAGES = getCustomerOrderStages("shop_installation");

/**
 * Stages for Proforma Quotations (COTIZACION)
 */
export const COTIZACION_STAGES = [
  {
    stepNum: 1,
    labelEs: "Cotización Creada",
    labelEn: "Quotation Created",
    subEs: "Proforma abierta",
    subEn: "Proforma open",
    icon: ClipboardList,
  },
  {
    stepNum: 2,
    labelEs: "Revisión Técnica",
    labelEn: "Technical Review",
    subEs: "Staff ZxZ personalizando",
    subEn: "Staff customizing",
    icon: Wrench,
  },
  {
    stepNum: 3,
    labelEs: "Aprobación & Pago",
    labelEn: "Payment & Order",
    subEs: "Pase a pedido en firme",
    subEn: "Convert to confirmed order",
    icon: CreditCard,
  },
];

/**
 * Calculate the active step number for a customer placed order.
 * Accurately translates internal statuses including "*un" statuses to corresponding step index.
 * PM-02: If status is PAYMENT_REJECTED, resolves linear step from preRejectionStatus instead of resetting to step 1.
 */
export function getCustomerOrderStepIndex(
  status: string,
  serviceType?: string | null,
  skipInstallationPayment: boolean = false,
  serviceDocumentsJson?: any,
  isPaidInstallation: boolean = false
): number {
  const s = status?.toUpperCase() || "";
  if (s === "CANCELLED") return 0;

  let effectivePaidInstallation = isPaidInstallation;
  if (!effectivePaidInstallation && serviceDocumentsJson) {
    try {
      const doc = typeof serviceDocumentsJson === "string" ? JSON.parse(serviceDocumentsJson) : serviceDocumentsJson;
      if (doc?.installationPaymentConfirmed || doc?.installationPaymentReceiptUrl || doc?.receiptUrl) {
        effectivePaidInstallation = true;
      }
    } catch {}
  }

  let effectiveStatus = s;
  if (s === "PAYMENT_REJECTED") {
    let docs: any = {};
    try {
      docs = typeof serviceDocumentsJson === "string" ? JSON.parse(serviceDocumentsJson) : (serviceDocumentsJson || {});
    } catch {}
    if (docs?.preRejectionStatus && docs.preRejectionStatus !== "PAYMENT_REJECTED") {
      effectiveStatus = String(docs.preRejectionStatus).toUpperCase();
    } else if (docs?.rejectionPaymentType === "SERVICE") {
      effectiveStatus = "CONFIRM_SERVICE_PAYMENT";
    } else if (docs?.rejectionPaymentType === "INSTALLATION") {
      effectiveStatus = "INSTALLATION_PAYMENT";
    } else {
      effectiveStatus = "PAYMENT_CONFIRMATION";
    }
  }

  const stages = getCustomerOrderStages(serviceType, true, skipInstallationPayment, effectivePaidInstallation);

  // Direct match with stage ID in the active stages list
  const directMatch = stages.find((st) => st.id === effectiveStatus);
  if (directMatch) return directMatch.stepNum;

  // Handle aliases and intermediate statuses:
  if (effectiveStatus === "PENDING" || effectiveStatus === "PAYMENT_CONFIRMATION" || effectiveStatus === "CONFIRMED") {
    return 1;
  }
  if (effectiveStatus === "NEED_TO_GET_ORDER" || effectiveStatus === "SHIPPING_IN_US") {
    return 2;
  }
  if (effectiveStatus === "SHIPPING_TO_CR" || effectiveStatus === "IN_COSTA_RICA") {
    return 3;
  }
  if (effectiveStatus === "IN_WAREHOUSE_CHECK") {
    return 4;
  }
  if (effectiveStatus === "PROGRAM_SERVICE") {
    return 5;
  }
  if (effectiveStatus === "CONFIRM_SERVICE_PAYMENT") {
    return 6;
  }
  if (effectiveStatus === "READY_TO_PICK_UP" || effectiveStatus === "READY_FOR_PICKUP") {
    const readyMatch = stages.find((st) => st.id === "READY_FOR_PICKUP");
    return readyMatch ? readyMatch.stepNum : 8;
  }
  if (effectiveStatus === "INSTALLATION_PAYMENT" || effectiveStatus === "PENDING_INSTALLATION_PAYMENT") {
    const installMatch = stages.find((st) => st.id === "INSTALLATION_PAYMENT");
    return installMatch ? installMatch.stepNum : 9;
  }
  if (effectiveStatus === "READY_FOR_INSTALL") {
    const installMatch = stages.find((st) => st.id === "INSTALLING");
    return installMatch ? installMatch.stepNum : 7;
  }
  if (effectiveStatus === "COMPLETED" || effectiveStatus === "PAID") {
    return stages[stages.length - 1].stepNum;
  }

  return 1;
}

/**
 * Returns true if the order is already in PAYMENT_CONFIRMATION or any subsequent state.
 * When true, "Proceder al Pago" MUST NOT appear.
 */
export function isPaymentConfirmedOrMore(status: string): boolean {
  const s = status?.toUpperCase() || "";
  return [
    "PAYMENT_CONFIRMATION",
    "CONFIRMED",
    "NEED_TO_GET_ORDER",
    "SHIPPING_IN_US",
    "SHIPPING_TO_CR",
    "IN_COSTA_RICA",
    "IN_WAREHOUSE_CHECK",
    "PROGRAM_SERVICE",
    "CONFIRM_SERVICE_PAYMENT",
    "WAITING_ON_DELIVERY",
    "PICKUP_DATE_SET",
    "INSTALLING",
    "INSTALLATION_PAYMENT",
    "READY_TO_SET_RETURN_DATE",
    "HOME_INSTALL_SET",
    "READY_FOR_PICKUP",
    "READY_TO_PICK_UP",
    "READY_FOR_INSTALL",
    "COMPLETED",
    "PAID",
    "PROCESSING",
  ].includes(s);
}

/**
 * Helper to retrieve rich badge styling and icon for any order or quotation status
 */
export function getWorkflowStatusBadge(status: string, lang: "es" | "en") {
  const s = status?.toUpperCase() || "";

  if (s === "COTIZACION") {
    return {
      label: lang === "es" ? "Cotización Proforma" : "Proforma Quotation",
      bg: "bg-purple-50 text-purple-800 border-purple-200",
      accentBg: "bg-purple-600 text-white",
      icon: ClipboardList,
      isQuote: true,
    };
  }

  if (s === "PAYMENT_CONFIRMATION") {
    return {
      label: lang === "es" ? "Confirmación de Pago" : "Payment Confirmation",
      bg: "bg-amber-50 text-amber-800 border-amber-200",
      accentBg: "bg-amber-500 text-white",
      icon: Clock,
      isQuote: false,
    };
  }

  if (s === "PAYMENT_REJECTED") {
    return {
      label: lang === "es" ? "Pago Rechazado" : "Payment Rejected",
      bg: "bg-rose-50 text-rose-800 border-rose-300",
      accentBg: "bg-rose-600 text-white",
      icon: AlertCircle,
      isQuote: false,
    };
  }

  if (s === "CONFIRMED") {
    return {
      label: lang === "es" ? "Pago Confirmado" : "Payment Confirmed",
      bg: "bg-blue-50 text-blue-800 border-blue-200",
      accentBg: "bg-[#0052CC] text-white",
      icon: CheckCircle2,
      isQuote: false,
    };
  }

  if (s === "SHIPPING_IN_US") {
    return {
      label: lang === "es" ? "En Tránsito en USA" : "Shipping in US",
      bg: "bg-indigo-50 text-indigo-800 border-indigo-200",
      accentBg: "bg-indigo-600 text-white",
      icon: Truck,
      isQuote: false,
    };
  }

  if (s === "SHIPPING_TO_CR") {
    return {
      label: lang === "es" ? "En Tránsito a Costa Rica" : "Shipping to Costa Rica",
      bg: "bg-purple-50 text-purple-800 border-purple-200",
      accentBg: "bg-purple-600 text-white",
      icon: Plane,
      isQuote: false,
    };
  }

  if (s === "IN_WAREHOUSE_CHECK") {
    return {
      label: lang === "es" ? "En Taller para Revisión" : "In Workshop for Inspection",
      bg: "bg-orange-50 text-orange-800 border-orange-200",
      accentBg: "bg-orange-500 text-white",
      icon: Wrench,
      isQuote: false,
    };
  }

  if (s === "PROGRAM_SERVICE") {
    return {
      label: lang === "es" ? "Programar Servicio" : "Program Service",
      bg: "bg-blue-50 text-blue-800 border-blue-200",
      accentBg: "bg-blue-600 text-white",
      icon: Calendar,
      isQuote: false,
    };
  }

  if (s === "CONFIRM_SERVICE_PAYMENT") {
    return {
      label: lang === "es" ? "Confirmar Pago de Servicio" : "Confirm Service Payment",
      bg: "bg-amber-50 text-amber-900 border-amber-300",
      accentBg: "bg-amber-500 text-slate-950 font-bold",
      icon: Clock,
      isQuote: false,
    };
  }

  if (s === "WAITING_ON_DELIVERY") {
    return {
      label: lang === "es" ? "Esperando Entrega" : "Waiting on Delivery",
      bg: "bg-amber-50 text-amber-800 border-amber-200",
      accentBg: "bg-amber-600 text-white",
      icon: Truck,
      isQuote: false,
    };
  }

  if (s === "PICKUP_DATE_SET") {
    return {
      label: lang === "es" ? "Fecha de Retiro Programada" : "Pick-up Date Set",
      bg: "bg-indigo-50 text-indigo-800 border-indigo-200",
      accentBg: "bg-indigo-600 text-white",
      icon: Calendar,
      isQuote: false,
    };
  }

  if (s === "INSTALLING" || s === "READY_FOR_INSTALL") {
    return {
      label: lang === "es" ? "Instalando Piezas" : "Installing",
      bg: "bg-orange-50 text-orange-800 border-orange-200",
      accentBg: "bg-orange-600 text-white",
      icon: Wrench,
      isQuote: false,
    };
  }

  if (s === "INSTALLATION_PAYMENT" || s === "PENDING_INSTALLATION_PAYMENT") {
    return {
      label: lang === "es" ? "Pago de Instalación" : "Installation Payment",
      bg: "bg-purple-50 text-purple-800 border-purple-200",
      accentBg: "bg-purple-600 text-white",
      icon: CreditCard,
      isQuote: false,
    };
  }

  if (s === "READY_TO_SET_RETURN_DATE") {
    return {
      label: lang === "es" ? "Listo para Programar Fecha de Entrega" : "Ready to Set Return Date",
      bg: "bg-purple-50 text-purple-800 border-purple-200",
      accentBg: "bg-purple-600 text-white",
      icon: Clock,
      isQuote: false,
    };
  }

  if (s === "HOME_INSTALL_SET") {
    return {
      label: lang === "es" ? "Instalación a Domicilio Programada" : "Home Install Set",
      bg: "bg-cyan-50 text-cyan-800 border-cyan-200",
      accentBg: "bg-cyan-600 text-white",
      icon: Home,
      isQuote: false,
    };
  }

  if (s === "READY_FOR_PICKUP" || s === "READY_TO_PICK_UP") {
    return {
      label: lang === "es" ? "Listo para Retiro" : "Ready for Pickup",
      bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
      accentBg: "bg-emerald-600 text-white",
      icon: CheckCircle2,
      isQuote: false,
    };
  }

  if (s === "COMPLETED" || s === "PAID") {
    return {
      label: lang === "es" ? "Completado y Entregado" : "Completed & Delivered",
      bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
      accentBg: "bg-emerald-600 text-white",
      icon: Sparkles,
      isQuote: false,
    };
  }

  if (s === "CANCELLED") {
    return {
      label: lang === "es" ? "Cancelado" : "Cancelled",
      bg: "bg-rose-50 text-rose-800 border-rose-200",
      accentBg: "bg-rose-600 text-white",
      icon: AlertCircle,
      isQuote: false,
    };
  }

  if (s === "NEED_TO_GET_ORDER") {
    return {
      label: lang === "es" ? "Pago confirmado, preparando pedido" : "Payment confirmed, preparing order",
      bg: "bg-blue-50 text-blue-800 border-blue-200",
      accentBg: "bg-[#0052CC] text-white",
      icon: CheckCircle2,
      isQuote: false,
    };
  }

  // Default fallback (PENDING / etc)
  return {
    label: lang === "es" ? "Pedido en Proceso" : "Order in Progress",
    bg: "bg-blue-50 text-blue-800 border-blue-200",
    accentBg: "bg-[#0052CC] text-white",
    icon: Package,
    isQuote: false,
  };
}

/**
 * Detects whether an order currently in PAYMENT_REJECTED has submitted a corrected payment proof.
 */
export function isRejectedPaymentCorrected(order: any): boolean {
  if (!order) return false;
  const statusUpper = String(order.status || "").toUpperCase().trim();
  if (statusUpper !== "PAYMENT_REJECTED") return false;

  let docs: any = {};
  if (order.serviceDocumentsJson) {
    try {
      docs =
        typeof order.serviceDocumentsJson === "string"
          ? JSON.parse(order.serviceDocumentsJson)
          : order.serviceDocumentsJson;
    } catch {
      docs = {};
    }
  }

  // 1. Explicit paymentCorrected or hasNewProofToReview flag
  if (docs?.paymentCorrected === true || docs?.hasNewProofToReview === true) {
    return true;
  }

  // 2. Order was rejected, but customer submitted a new receipt timestamped after rejection
  const rejectionTime =
    docs?.orderPaymentRejectedAt ||
    docs?.servicePaymentRejectedAt ||
    docs?.installationPaymentRejectedAt;
  const correctionTime =
    docs?.paymentCorrectedAt || docs?.installationPaymentSubmittedAt;

  if (rejectionTime && correctionTime) {
    try {
      if (new Date(correctionTime).getTime() >= new Date(rejectionTime).getTime()) {
        return true;
      }
    } catch {}
  }

  return false;
}

/**
 * Returns the count of orders that are in PAYMENT_REJECTED and have corrected their payment.
 */
export function getCorrectedRejectedOrdersCount(orders: any[]): number {
  if (!Array.isArray(orders)) return 0;
  return orders.filter(isRejectedPaymentCorrected).length;
}
