"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { NotificationBanner } from "@/components/layout/NotificationBanner";
import { GarageModal } from "@/components/garage/GarageModal";
import { useGarage } from "@/context/GarageContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingConcierge } from "@/components/home/FloatingConcierge";
import { ServiceOrderSelector } from "@/components/services/ServiceOrderSelector";
import { ServicesSkeleton } from "@/components/services/ServicesSkeleton";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth, UserOrder } from "@/context/AuthContext";
import { COMPANY_CONFIG, getWhatsAppUrl } from "@/config/company";
import {
  Car,
  Truck,
  Wrench,
  MapPin,
  Calendar,
  ArrowLeft,
  Search,
  MessageCircle,
  LocateFixed,
  AlertCircle,
  CheckCircle2,
  Check,
  Users,
  Warehouse,
  Phone,
  ChevronRight,
} from "lucide-react";
import ServiceCalendar2D from "@/components/services/ServiceCalendar2D";
import { ServiceTimeSlotPicker, TimeSlotItem } from "@/components/services/ServiceTimeSlotPicker";
import { ServiceCostResume } from "@/components/services/ServiceCostResume";
import { DjiPaymentAnimationOverlay } from "@/components/ui/DjiPaymentAnimationOverlay";
import { getTotalOrdersInstallationCost, getOrdersPendingInstallationTotal } from "@/lib/orderServices";
import { getServiceParamFromOrder } from "@/lib/orderWorkflow";

// Client-only dynamic import for Leaflet map to prevent SSR window issues
const LeafletInteractiveMap = dynamic(
  () => import("@/components/services/LeafletInteractiveMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 sm:h-96 md:h-[430px] rounded-3xl bg-gray-100 flex items-center justify-center animate-pulse text-gray-400 text-xs">
        Cargando mapa interactivo...
      </div>
    ),
  }
);

type ServiceType = "shop_installation" | "installation" | "delivery" | "pickup";

interface LogisticsConfig {
  id: string;
  pickupRatePerKmCRC: number;
  deliveryRatePerKmCRC: number;
  homeInstallationRatePerKmCRC: number;
  pickupBaseFeeCRC: number;
  deliveryBaseFeeCRC: number;
  homeInstallationBaseFeeCRC: number;
  pickupServiceEnabled?: boolean;
  garageAddress: string;
  garageLatitude: number;
  garageLongitude: number;
  ineligibleHomeInstallKeys?: string[];
}

interface CalculationResult {
  origin: {
    address: string;
    lat: number;
    lng: number;
  };
  destination: {
    address: string;
    lat: number;
    lng: number;
  };
  distanceKm: number;
  durationMinutes: number;
  rates: {
    pickupRatePerKmCRC: number;
    deliveryRatePerKmCRC: number;
    homeInstallationRatePerKmCRC: number;
    pickupBaseFeeCRC: number;
    deliveryBaseFeeCRC: number;
    homeInstallationBaseFeeCRC: number;
  };
  costs: {
    pickupCostCRC: number;
    deliveryCostCRC: number;
    homeInstallationCostCRC: number;
  };
  geometry?: [number, number][];
}

function TransportServiceContent() {
  const { lang, t } = useLanguage();
  const { user, orders, loading: authLoading, openAuthModal, requireAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Require sign in to program services
  useEffect(() => {
    if (!authLoading && !user) {
      openAuthModal(t.authGatingServiceReason);
    }
  }, [authLoading, user, openAuthModal, t.authGatingServiceReason]);

  // Target order param (?orderId=... or ?order=... or ?orderNumber=...)
  const targetOrderId =
    searchParams.get("orderId") ||
    searchParams.get("order") ||
    searchParams.get("orderNumber");

  // Determine initial service from URL query param (?service=shop_installation|installation|delivery|pickup)
  const initialServiceParam = searchParams.get("service");
  const defaultService: ServiceType =
    initialServiceParam === "shop_installation" || initialServiceParam === "shop"
      ? "shop_installation"
      : initialServiceParam === "pickup"
      ? "pickup"
      : initialServiceParam === "delivery"
      ? "delivery"
      : initialServiceParam === "installation"
      ? "installation"
      : "shop_installation";

  // State: Multiple selected orders (Requirement: allow selecting 2+ orders for delivery/shop_installation)
  const [selectedOrders, setSelectedOrders] = useState<UserOrder[]>([]);

  // Garage context integration: check active/listed vehicle for pickup compatibility
  const { activeVehicle, vehicle, openModal: openGarageModal } = useGarage();
  const effectiveGarageVehicle = activeVehicle || vehicle;
  const hasGarageVehicle = Boolean(effectiveGarageVehicle);
  const isPickupVehicleIncompatible = hasGarageVehicle && effectiveGarageVehicle?.pickupServiceAvailable === false;

  // State: Service Type (1. Shop Installation, 2. Home Installation, 3. Delivery, 4. Pick-up)
  const [selectedService, setSelectedService] = useState<ServiceType>(defaultService);
  const [config, setConfig] = useState<LogisticsConfig | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // State: Destination (Left empty initially per user requirement)
  const [destinationInput, setDestinationInput] = useState<string>("");
  const [destCoordinates, setDestCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Handle collision redirect alert if another customer reserved the slot first
  useEffect(() => {
    const conflict = searchParams.get("conflict");
    if (conflict === "slot_taken" || conflict === "true") {
      setErrorMessage(
        t.serviceSlotCollisionAlert ||
          (lang === "es"
            ? "El horario que intentaste reservar acaba de ser tomado por otro cliente. Por favor selecciona otra fecha u horario disponible."
            : "The time slot you tried to reserve was just taken by another customer. Please choose a different date or time slot.")
      );
      setServiceDate("");
    }
  }, [searchParams, t.serviceSlotCollisionAlert, lang]);

  // Pre-select order if passed in query parameters (?orderId=... or ?order=... or ?orderNumber=...)
  useEffect(() => {
    if (!targetOrderId) return;
    if (selectedOrders.some((o) => o.id === targetOrderId || o.orderNumber === targetOrderId)) {
      return;
    }

    // 1. Try to find in orders loaded in auth context
    const foundInAuth = orders.find(
      (o) => o.id === targetOrderId || o.orderNumber === targetOrderId
    );
    if (foundInAuth) {
      const foundStatus = (foundInAuth.status || "").toUpperCase();
      if (foundStatus === "CONFIRM_SERVICE_PAYMENT") {
        setErrorMessage(
          t.serviceOrderAlreadyInConfirmation ||
            (lang === "es"
              ? "Esta orden ya se encuentra en confirmación de pago de servicio. No se puede seleccionar para otro servicio ni pagar doble."
              : "This order is already in service payment confirmation. It cannot be selected for another service.")
        );
        return;
      }
      if (
        !isReturnBooking &&
        (foundInAuth.isServiceScheduled ||
          [
            "WAITING_ON_DELIVERY",
            "PICKUP_DATE_SET",
            "HOME_INSTALL_SET",
            "INSTALLING",
            "INSTALLATION_PAYMENT",
            "READY_FOR_PICKUP",
            "READY_TO_PICK_UP",
            "COMPLETED",
          ].includes(foundStatus))
      ) {
        setErrorMessage(
          t.serviceOrderAlreadyProgrammed ||
            (lang === "es"
              ? "Esta orden ya tiene un servicio programado y no puede ser seleccionada nuevamente."
              : "This order already has a service scheduled and cannot be selected again.")
        );
        return;
      }
      setSelectedOrders([foundInAuth]);
      if (foundInAuth.customerPhone && foundInAuth.customerPhone.trim()) {
        setPhone(foundInAuth.customerPhone.trim());
      }
      let resolvedAddress = "";
      if (foundInAuth.serviceDocumentsJson) {
        try {
          const doc = typeof foundInAuth.serviceDocumentsJson === "string" ? JSON.parse(foundInAuth.serviceDocumentsJson) : foundInAuth.serviceDocumentsJson;
          resolvedAddress = doc.pickupOriginAddress || doc.deliveryAddress || doc.destinationAddress || "";
        } catch {}
      }
      if (!resolvedAddress && foundInAuth.shippingAddress) {
        resolvedAddress = foundInAuth.shippingAddress;
      }
      if (resolvedAddress && !destinationInput) {
        setDestinationInput(resolvedAddress);
      }
      if (!initialServiceParam && foundInAuth.serviceType) {
        const isScheduled = Boolean(foundInAuth.isServiceScheduled);
        if (isScheduled) {
          const mappedService = getServiceParamFromOrder(foundInAuth.serviceType);
          setSelectedService(mappedService);
        }
      }
      return;
    }

    // 2. Fetch directly from API if not yet in auth orders
    let isCancelled = false;
    fetch(`/api/orders/${encodeURIComponent(targetOrderId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled) return;
        if (data.success && data.order) {
          const ord = data.order;
          const ordStatus = (ord.status || "").toUpperCase();
          if (ordStatus === "CONFIRM_SERVICE_PAYMENT") {
            setErrorMessage(
              t.serviceOrderAlreadyInConfirmation ||
                (lang === "es"
                  ? "Esta orden ya se encuentra en confirmación de pago de servicio. No se puede seleccionar para otro servicio ni pagar doble."
                  : "This order is already in service payment confirmation. It cannot be selected for another service.")
            );
            return;
          }
          if (
            !isReturnBooking &&
            (ord.isServiceScheduled ||
              [
                "WAITING_ON_DELIVERY",
                "PICKUP_DATE_SET",
                "HOME_INSTALL_SET",
                "INSTALLING",
                "INSTALLATION_PAYMENT",
                "READY_FOR_PICKUP",
                "READY_TO_PICK_UP",
                "COMPLETED",
              ].includes(ordStatus))
          ) {
            setErrorMessage(
              t.serviceOrderAlreadyProgrammed ||
                (lang === "es"
                  ? "Esta orden ya tiene un servicio programado y no puede ser seleccionada nuevamente."
                  : "This order already has a service scheduled and cannot be selected again.")
            );
            return;
          }
          const userOrd: UserOrder = {
            id: ord.id,
            orderNumber: ord.orderNumber,
            status: ord.status,
            totalCRC: ord.totalCRC,
            partsSubtotalCRC: ord.partsSubtotalCRC,
            laborSubtotalCRC: ord.laborSubtotalCRC,
            itemsJson: JSON.stringify(ord.items || []),
            serviceType: ord.serviceType,
            shippingAddress: ord.shippingAddress || null,
            notes: ord.notes || null,
            customerName: ord.customerName || null,
            customerPhone: ord.customerPhone || null,
            isServiceScheduled: Boolean(ord.isServiceScheduled),
            isInstallationPaymentConfirmed: Boolean(ord.isInstallationPaymentConfirmed),
            serviceDocumentsJson: ord.serviceDocumentsJson ? JSON.stringify(ord.serviceDocumentsJson) : null,
            createdAt: ord.createdAt,
          };
          setSelectedOrders([userOrd]);
          if (userOrd.customerPhone && userOrd.customerPhone.trim()) {
            setPhone(userOrd.customerPhone.trim());
          }
          let resolvedAddress = "";
          if (ord.serviceDocumentsJson) {
            try {
              const doc = typeof ord.serviceDocumentsJson === "string" ? JSON.parse(ord.serviceDocumentsJson) : ord.serviceDocumentsJson;
              resolvedAddress = doc.pickupOriginAddress || doc.deliveryAddress || doc.destinationAddress || "";
            } catch {}
          }
          if (!resolvedAddress && userOrd.shippingAddress) {
            resolvedAddress = userOrd.shippingAddress;
          }
          if (resolvedAddress && !destinationInput) {
            setDestinationInput(resolvedAddress);
          }
          if (!initialServiceParam && userOrd.serviceType) {
            const isScheduled = Boolean(ord.isServiceScheduled);
            if (isScheduled) {
              const mappedService = getServiceParamFromOrder(userOrd.serviceType);
              setSelectedService(mappedService);
            }
          }
        }
      })
      .catch((err) => console.error("Error fetching pre-selected order in /servicios:", err));

    return () => {
      isCancelled = true;
    };
  }, [targetOrderId, orders, initialServiceParam, destinationInput]);

  // State: Date & Time Schedule
  // User Rule: 48 hours minimum advance booking restriction for customers.
  // Today = day 0 (blocked), Tomorrow = day 1 (blocked), +2 days = day 2 (blocked).
  // Earliest date customer can choose is day 3 (+48h full advance). Only staff can bypass (today + 1).
  const isStaff = user?.role === "ADMIN" || user?.role === "STAFF" || user?.role === "MASTER";
  const minDateString = useMemo(() => {
    const d = new Date();
    const daysToAdd = isStaff ? 1 : 3;
    d.setDate(d.getDate() + daysToAdd);
    return d.toISOString().split("T")[0];
  }, [isStaff]);

  const [serviceDate, setServiceDate] = useState<string>("");
  const [serviceTimeSlot, setServiceTimeSlot] = useState<string>("08:00");
  const [availableSlots, setAvailableSlots] = useState<TimeSlotItem[]>([]);
  const [estimatedInstallDurationMin, setEstimatedInstallDurationMin] = useState<number>(60);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [isFullDayBlocked, setIsFullDayBlocked] = useState(false);
  const [fullDayReason, setFullDayReason] = useState<string | null>(null);
  const [fullyBlockedDates, setFullyBlockedDates] = useState<string[]>([]);
  const [blockedReasons, setBlockedReasons] = useState<Record<string, string>>({});

  // Reset selected date if it violates the minimum advance date
  useEffect(() => {
    if (serviceDate && serviceDate < minDateString) {
      setServiceDate("");
    }
  }, [serviceDate, minDateString]);

  // State: Calculations & Feedback
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Return delivery submission states
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [returnSubmissionStep, setReturnSubmissionStep] = useState(1);

  // Shop installation reservation states (0 CRC upfront reservation)
  const [isSubmittingShop, setIsSubmittingShop] = useState(false);
  const [shopSubmissionStep, setShopSubmissionStep] = useState(1);

  // State: Obligatory Contact Phone (Requirement: default from selected order, obligatory)
  const [phone, setPhone] = useState<string>("");

  // Pre-fill phone from auth user or profile API if not already set by order
  useEffect(() => {
    if (phone) return;
    if (user?.phoneNumber) {
      setPhone(user.phoneNumber);
    } else {
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user?.phoneNumber) {
            setPhone((prev) => prev || data.user.phoneNumber);
          }
        })
        .catch(() => {});
    }
  }, [user, phone]);

  // Multi-order condition: strictly delivery or shop_installation
  const isMultiAllowed =
    selectedService === "delivery" || selectedService === "shop_installation";

  // Handle toggle selection/de-selection of orders
  const handleToggleOrder = (order: UserOrder) => {
    setSelectedOrders((prev) => {
      const exists = prev.some((o) => o.id === order.id);
      if (exists) {
        // De-select
        return prev.filter((o) => o.id !== order.id);
      } else {
        // Select order: auto-default phone from selected order
        if (order.customerPhone && order.customerPhone.trim()) {
          setPhone(order.customerPhone.trim());
        } else if (!phone && user?.phoneNumber) {
          setPhone(user.phoneNumber);
        }

        if (isMultiAllowed) {
          return [...prev, order];
        } else {
          return [order];
        }
      }
    });
  };

  const handleClearOrders = () => {
    setSelectedOrders([]);
  };

  // Helper to determine if an order contains items that do not qualify for home installation
  const orderHasIneligibleHomeInstall = useCallback(
    (ord: UserOrder): boolean => {
      if (!ord.itemsJson) return false;
      try {
        const items = JSON.parse(ord.itemsJson);
        if (Array.isArray(items)) {
          const keys = config?.ineligibleHomeInstallKeys || [];
          return items.some((item: any) => {
            if (item.homeInstallation === false) return true;
            if (item.homeInstallationAvailable === false) return true;
            if (item.inHome_install === false) return true;
            if (item.inHomeInstallEligible === false) return true;
            if (item.id && keys.includes(item.id)) return true;
            if (item.sku && keys.includes(item.sku)) return true;
            return false;
          });
        }
      } catch (e) {
        console.error("Error parsing itemsJson for home installation check:", e);
      }
      return false;
    },
    [config?.ineligibleHomeInstallKeys]
  );

  // Check if ANY of the selected orders contains an ineligible product
  const isHomeInstallationBlockedByOrder = useMemo(() => {
    if (selectedOrders.length === 0) return false;
    return selectedOrders.some((ord) => orderHasIneligibleHomeInstall(ord));
  }, [selectedOrders, orderHasIneligibleHomeInstall]);

  // If user has 'installation' selected and the order contains an ineligible product,
  // automatically switch away to shop_installation and alert the user
  useEffect(() => {
    if (isHomeInstallationBlockedByOrder && selectedService === "installation") {
      setSelectedService("shop_installation");
      setErrorMessage(t.serviceHomeInstallIneligibleOrderAlert);
    }
  }, [isHomeInstallationBlockedByOrder, selectedService, t.serviceHomeInstallIneligibleOrderAlert]);

  const isReturnBooking = searchParams.get("return") === "true";

  const isPickupBounded = useMemo(() => {
    // 1. If returning vehicle (e.g. ?return=true), order is strictly bounded to Pick-up return
    if (isReturnBooking) return true;

    // 2. Orders in PROGRAM_SERVICE or earlier have NOT confirmed a service yet.
    // Customers are choosing their service, so they must NEVER be bounded to Pick-up at this stage.
    return selectedOrders.some((o) => {
      const statusUpper = (o.status || "").toUpperCase();

      // At PROGRAM_SERVICE or earlier pipeline stages, the customer is choosing their service freely
      if (
        statusUpper === "PROGRAM_SERVICE" ||
        statusUpper === "PENDING" ||
        statusUpper === "PAID" ||
        statusUpper === "SHIPPING_IN_US" ||
        statusUpper === "SHIPPING_TO_CR" ||
        statusUpper === "IN_WAREHOUSE_CHECK" ||
        statusUpper === "CONFIRM_SERVICE_PAYMENT"
      ) {
        return false;
      }

      // Ready to set vehicle return date is strictly pick-up return
      if (statusUpper === "READY_TO_SET_RETURN_DATE") {
        return true;
      }

      // If service payment was confirmed by staff for a pick-up appointment
      const cat = getServiceParamFromOrder(o.serviceType);
      const isPickupType = cat === "pickup" || o.serviceType === "UTV_PICKUP";
      return isPickupType && (statusUpper === "PICKUP_DATE_SET" || statusUpper === "INSTALLING");
    });
  }, [selectedOrders, isReturnBooking]);

  const isGlobalPickupDisabled = config?.pickupServiceEnabled === false;
  const isPickupServiceDisabled = isGlobalPickupDisabled || isPickupVehicleIncompatible;

  const pickupDisabledReason = useMemo(() => {
    if (isGlobalPickupDisabled) {
      return t.servicePickupDisabledAlert;
    }
    if (isPickupVehicleIncompatible) {
      const vName = `${effectiveGarageVehicle?.brandName || effectiveGarageVehicle?.brandSlug || ""} ${effectiveGarageVehicle?.modelName || effectiveGarageVehicle?.modelSlug || ""}`.trim();
      return `${t.servicePickupVehicleIncompatibleAlert}${vName ? ` (${vName})` : ""}`;
    }
    return "";
  }, [isGlobalPickupDisabled, isPickupVehicleIncompatible, effectiveGarageVehicle, t.servicePickupDisabledAlert, t.servicePickupVehicleIncompatibleAlert]);

  useEffect(() => {
    if (isPickupBounded && selectedService !== "pickup" && !isPickupServiceDisabled) {
      setSelectedService("pickup");
    }
  }, [isPickupBounded, selectedService, isPickupServiceDisabled]);

  useEffect(() => {
    if (isPickupServiceDisabled && selectedService === "pickup" && !isPickupBounded) {
      setSelectedService("shop_installation");
      setErrorMessage(pickupDisabledReason);
    }
  }, [isPickupServiceDisabled, selectedService, isPickupBounded, pickupDisabledReason]);

  // Switch service type and enforce single order restriction if needed
  const handleSelectService = (newService: ServiceType) => {
    if (newService === "pickup") {
      if (isPickupServiceDisabled) {
        setErrorMessage(pickupDisabledReason);
        return;
      }
      if (!hasGarageVehicle) {
        setErrorMessage(t.servicePickupNoGarageVehicleNotice);
        openGarageModal();
        return;
      }
    }
    if (isPickupBounded && newService !== "pickup") {
      setErrorMessage(
        lang === "es"
          ? "Esta orden está vinculada exclusivamente al servicio de Retiro y Entrega de Vehículo (Pick-up)."
          : "This order is strictly bounded to the Vehicle Pick-up and Delivery service."
      );
      return;
    }
    if (newService === "installation" && isHomeInstallationBlockedByOrder) {
      setErrorMessage(t.serviceHomeInstallIneligibleOrderAlert);
      return;
    }
    setSelectedService(newService);
    const allowMulti =
      newService === "delivery" || newService === "shop_installation";
    if (!allowMulti && selectedOrders.length > 1) {
      setSelectedOrders((prev) => prev.slice(0, 1));
    }
  };

  // Fetch initial logistics rates config
  useEffect(() => {
    let isMounted = true;
    fetch("/api/logistics/config")
      .then((res) => res.json())
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setConfig(res.data);
        }
      })
      .catch((err) => console.error("Error loading logistics config:", err))
      .finally(() => {
        if (isMounted) setPageLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch month summary for 2D calendar
  useEffect(() => {
    const month = serviceDate
      ? serviceDate.substring(0, 7)
      : new Date().toISOString().substring(0, 7);
    fetch(`/api/logistics/availability?month=${month}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.daySummary) {
          const blocked: string[] = [];
          const reasons: Record<string, string> = {};
          Object.entries(json.daySummary).forEach(([date, info]: [string, any]) => {
            if (info.hasFullDayBlock) {
              blocked.push(date);
              if (info.blockReason) {
                reasons[date] = info.blockReason;
              }
            }
          });
          setFullyBlockedDates(blocked);
          setBlockedReasons(reasons);
        }
      })
      .catch((e) => console.error("Error fetching month availability:", e));
  }, [serviceDate]);

  // Fetch daily slots and buffer collisions whenever serviceDate, duration, or service changes
  useEffect(() => {
    if (!serviceDate) {
      setAvailableSlots([]);
      return;
    }

    let isMounted = true;
    setIsSlotsLoading(true);

    const travelMin =
      selectedService === "shop_installation"
        ? 0
        : calculation?.durationMinutes || 0;
    const orderIdsQuery = selectedOrders.length > 0
      ? `&orderIds=${selectedOrders.map((o) => encodeURIComponent(o.id)).join(",")}`
      : "";
    const url = `/api/logistics/availability?date=${serviceDate}&travelMinutes=${travelMin}&serviceType=${selectedService}${orderIdsQuery}`;

    fetch(url)
      .then((r) => r.json())
      .then((json) => {
        if (!isMounted) return;
        if (json.success) {
          setIsFullDayBlocked(Boolean(json.isFullDayBlocked));
          setFullDayReason(json.fullDayReason || null);
          if (json.orderInstallationDurationMinutes) {
            setEstimatedInstallDurationMin(json.orderInstallationDurationMinutes);
          }
          const slotsList: TimeSlotItem[] = json.slots || [];
          setAvailableSlots(slotsList);

          if (selectedOrders.length === 0) {
            setServiceTimeSlot("");
          } else {
            // If current time is not available, select first available slot
            const currentValid = slotsList.find(
              (s) => s.time === serviceTimeSlot && s.available
            );
            if (!currentValid) {
              const firstAvailable = slotsList.find((s) => s.available);
              if (firstAvailable) {
                setServiceTimeSlot(firstAvailable.time);
              }
            }
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching availability:", err);
      })
      .finally(() => {
        if (isMounted) setIsSlotsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [serviceDate, calculation?.durationMinutes, selectedService, selectedOrders]);

  // Route calculation handler
  const calculateRoute = useCallback(
    async (dest: string, coords?: { lat: number; lng: number }) => {
      if (!dest.trim() && !coords) return;
      if (!coords && dest.trim().length < 3) {
        setErrorMessage(t.serviceLocationPrecisionError);
        return;
      }
      setIsCalculating(true);
      setErrorMessage(null);

      try {
        const body: Record<string, unknown> = {
          destination: dest.trim() || `${coords?.lat}, ${coords?.lng}`,
        };
        if (coords) {
          body.destLat = coords.lat;
          body.destLng = coords.lng;
        }

        const res = await fetch("/api/logistics/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const json = await res.json();
        if (res.ok && json.success && json.data) {
          setCalculation(json.data);
          if (json.data.destination) {
            setDestCoordinates({
              lat: json.data.destination.lat,
              lng: json.data.destination.lng,
            });
            if (json.data.destination.address) {
              setDestinationInput(json.data.destination.address);
            }
          }
        } else {
          setErrorMessage(json.error || "No se pudo calcular la ruta");
        }
      } catch (err) {
        console.error("Route calculation error:", err);
        setErrorMessage("Error de conexión al calcular la ruta");
      } finally {
        setIsCalculating(false);
      }
    },
    [t.serviceLocationPrecisionError]
  );

  // Map click handler (sets location on map, fills input, and calculates)
  const handleMapLocationSelect = useCallback(
    (lat: number, lng: number, addressName?: string) => {
      setDestCoordinates({ lat, lng });
      const label = addressName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setDestinationInput(label);
      calculateRoute(label, { lat, lng });
    },
    [calculateRoute]
  );

  // GPS Current Location handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage("La geolocalización no está disponible en este dispositivo");
      return;
    }

    setIsCalculating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        handleMapLocationSelect(lat, lng, "Mi ubicación actual");
      },
      (err) => {
        setIsCalculating(false);
        setErrorMessage("No se pudo obtener la ubicación GPS");
      },
      { timeout: 8000 }
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationInput.trim()) return;
    if (destinationInput.trim().length < 3) {
      setErrorMessage(t.serviceLocationPrecisionError);
      return;
    }
    calculateRoute(destinationInput);
  };

  // Cost calculation according to selected service
  const currentRatePerKm =
    selectedService === "shop_installation"
      ? 0
      : selectedService === "installation"
      ? calculation?.rates.homeInstallationRatePerKmCRC ?? config?.homeInstallationRatePerKmCRC ?? 2000
      : selectedService === "delivery"
      ? calculation?.rates.deliveryRatePerKmCRC ?? config?.deliveryRatePerKmCRC ?? 800
      : calculation?.rates.pickupRatePerKmCRC ?? config?.pickupRatePerKmCRC ?? 1500;

  const currentBaseFee =
    selectedService === "shop_installation"
      ? 0
      : selectedService === "installation"
      ? calculation?.rates.homeInstallationBaseFeeCRC ?? config?.homeInstallationBaseFeeCRC ?? 15000
      : selectedService === "delivery"
      ? calculation?.rates.deliveryBaseFeeCRC ?? config?.deliveryBaseFeeCRC ?? 3000
      : calculation?.rates.pickupBaseFeeCRC ?? config?.pickupBaseFeeCRC ?? 10000;

  const hasDistance = Boolean(calculation && calculation.distanceKm > 0);
  const currentTransportCostCRC =
    selectedService === "shop_installation" || isReturnBooking
      ? 0
      : hasDistance
      ? selectedService === "installation"
        ? calculation!.costs.homeInstallationCostCRC
        : selectedService === "delivery"
        ? calculation!.costs.deliveryCostCRC
        : calculation!.costs.pickupCostCRC
      : currentBaseFee;

  // Pending installation cost from the order(s) for installation services (home, shop, pickup)
  const totalOrdersInstallationCostCRC = useMemo(() => {
    return getTotalOrdersInstallationCost(selectedOrders, selectedService);
  }, [selectedOrders, selectedService]);

  // For pickup: clients only pay once for transport initially; installation gets paid after installation completes.
  // For shop_installation: date reservation is ₡0 upfront; installation labor is paid in INSTALLATION_PAYMENT state.
  // When programming return date, return is already paid (0 CRC).
  const currentSubtotalCRC =
    isReturnBooking || selectedService === "shop_installation"
      ? 0
      : selectedService === "pickup"
      ? currentTransportCostCRC
      : currentTransportCostCRC + totalOrdersInstallationCostCRC;

  // 13% IVA added to final price on service payments
  const currentIvaCRC = currentSubtotalCRC > 0 ? Math.round(currentSubtotalCRC * 0.13) : 0;

  // Final price including 13% IVA
  const currentCostCRC = currentSubtotalCRC + currentIvaCRC;

  // Proceed to dedicated Payment screen handler
  const handleProceedToPayment = () => {
    if (!user) {
      requireAuth(() => {}, t.authGatingServiceReason);
      return;
    }

    if (selectedOrders.length === 0) {
      setErrorMessage(t.serviceScheduleRequiresOrder);
      return;
    }

    // Guard: Block if any selected order is already in CONFIRM_SERVICE_PAYMENT or already scheduled
    const isAlreadyInConfirmation = selectedOrders.some((o) => {
      const s = (o.status || "").toUpperCase();
      return s === "CONFIRM_SERVICE_PAYMENT";
    });
    if (isAlreadyInConfirmation) {
      setErrorMessage(
        t.serviceOrderAlreadyInConfirmation ||
          (lang === "es"
            ? "Una o más órdenes seleccionadas ya se encuentran en confirmación de pago de servicio. No se puede seleccionar para otro servicio ni pagar doble."
            : "One or more selected orders are already in service payment confirmation.")
      );
      return;
    }

    const hasAlreadyScheduled = selectedOrders.some((o) => {
      const s = (o.status || "").toUpperCase();
      return (
        !isReturnBooking &&
        (o.isServiceScheduled ||
          [
            "WAITING_ON_DELIVERY",
            "PICKUP_DATE_SET",
            "HOME_INSTALL_SET",
            "INSTALLING",
            "INSTALLATION_PAYMENT",
            "READY_FOR_PICKUP",
            "READY_TO_PICK_UP",
            "COMPLETED",
          ].includes(s))
      );
    });
    if (hasAlreadyScheduled) {
      setErrorMessage(
        t.serviceOrderAlreadyProgrammed ||
          (lang === "es"
            ? "Una o más órdenes seleccionadas ya tienen un servicio programado y no pueden ser programadas nuevamente."
            : "One or more selected orders already have a service scheduled.")
      );
      return;
    }

    if (selectedService === "pickup") {
      if (isPickupServiceDisabled) {
        setErrorMessage(pickupDisabledReason);
        return;
      }
      if (!hasGarageVehicle) {
        setErrorMessage(t.servicePickupNoGarageVehicleNotice);
        openGarageModal();
        return;
      }
    }

    // Guard: Block if vehicle is still in INSTALLING
    const isInstallingBlocked = selectedOrders.some((o) => {
      const s = (o.status || "").toUpperCase();
      return s === "INSTALLING";
    });
    if (isInstallingBlocked && (selectedService === "pickup" || selectedService === "delivery")) {
      setErrorMessage(
        lang === "es"
          ? "El vehículo se encuentra en proceso de instalación técnica. La entrega se programará una vez finalizada."
          : "Vehicle is currently under technical installation. Delivery can be scheduled once completed."
      );
      return;
    }

    // Guard: Block if installation payment is pending
    const isUnpaidInstallation = selectedOrders.some((o) => {
      const s = (o.status || "").toUpperCase();
      return s === "READY_TO_SET_RETURN_DATE" && !o.isInstallationPaymentConfirmed;
    });
    if (isUnpaidInstallation) {
      setErrorMessage(
        lang === "es"
          ? "Pago de mano de obra de instalación pendiente. Debe cancelar la instalación antes de coordinar la entrega."
          : "Installation payment pending. Labor fee must be paid before scheduling return delivery."
      );
      return;
    }

    if (selectedService === "installation" && isHomeInstallationBlockedByOrder) {
      setErrorMessage(t.serviceHomeInstallIneligibleOrderAlert);
      return;
    }
    if (selectedService !== "shop_installation" && !destinationInput.trim() && !destCoordinates) {
      setErrorMessage(t.serviceScheduleRequiresLocation);
      return;
    }
    if (!serviceDate) {
      setErrorMessage(t.serviceScheduleRequiresDate);
      return;
    }

    // 48h advance check for non-staff
    if (!isStaff && serviceDate) {
      const schedDateObj = new Date(serviceDate + "T00:00:00");
      const now = new Date();
      const todayDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffDays = Math.round((schedDateObj.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 3) {
        setErrorMessage(
          lang === "es"
            ? "Las citas de servicio deben programarse con un mínimo de 48 horas de anticipación."
            : "Service appointments must be scheduled at least 48 hours in advance."
        );
        return;
      }
    }

    if (!phone.trim()) {
      setErrorMessage(t.servicePhoneRequired);
      return;
    }

    setErrorMessage(null);

    const matchingSlot = availableSlots.find((s) => s.time === serviceTimeSlot);
    const timeSlotLabel = matchingSlot ? matchingSlot.time12 : (serviceTimeSlot || "10:00 AM");

    const scheduleAddress =
      selectedService === "shop_installation"
        ? (config?.garageAddress || "Calle 34, Pozos, Santa Ana, Costa Rica")
        : destinationInput;

    const bookingData = {
      orderIds: selectedOrders.map((o) => o.id),
      orderNumbers: selectedOrders.map((o) => o.orderNumber),
      serviceType: selectedService,
      scheduledDate: serviceDate,
      timeSlot: timeSlotLabel,
      timeSlot24: serviceTimeSlot,
      destinationAddress: scheduleAddress,
      distanceKm: selectedService === "shop_installation" ? 0 : (calculation?.distanceKm || 0),
      travelMinutes: selectedService === "shop_installation" ? 0 : (calculation?.durationMinutes || 0),
      serviceCostCRC: currentCostCRC,
      subtotalCostCRC: currentSubtotalCRC,
      transportCostCRC: currentTransportCostCRC,
      installationCostCRC: totalOrdersInstallationCostCRC,
      ivaCostCRC: currentIvaCRC,
      customerPhone: phone.trim(),
      isReturnBooking,
      vehicleModel: effectiveGarageVehicle?.modelSlug || "",
      vehicleBrand: effectiveGarageVehicle?.brandSlug || "",
      vehicleName: `${effectiveGarageVehicle?.brandName || ""} ${effectiveGarageVehicle?.modelName || ""}`.trim(),
      vehiclePickupAvailable: effectiveGarageVehicle?.pickupServiceAvailable !== false,
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem("zxz_service_booking", JSON.stringify(bookingData));
    }

    const queryParams = new URLSearchParams({
      orderIds: selectedOrders.map((o) => o.id).join(","),
      serviceType: selectedService,
      date: serviceDate,
      time: timeSlotLabel,
      dest: scheduleAddress,
      dist: String(selectedService === "shop_installation" ? 0 : (calculation?.distanceKm || 0)),
      dur: String(selectedService === "shop_installation" ? 0 : (calculation?.durationMinutes || 0)),
      cost: String(currentCostCRC),
      subtotalCost: String(currentSubtotalCRC),
      transCost: String(currentTransportCostCRC),
      instCost: String(totalOrdersInstallationCostCRC),
      ivaCost: String(currentIvaCRC),
      phone: phone.trim(),
      return: isReturnBooking ? "true" : "false",
      vehicleModel: effectiveGarageVehicle?.modelSlug || "",
      vehicleName: `${effectiveGarageVehicle?.brandName || ""} ${effectiveGarageVehicle?.modelName || ""}`.trim(),
      vehiclePickupAvailable: effectiveGarageVehicle?.pickupServiceAvailable !== false ? "true" : "false",
    });

    router.push(`/servicios/pago?${queryParams.toString()}`);
  };

  // Direct return booking submission (0 CRC - bypasses checkout and agends delivery directly)
  const handleConfirmReturnBooking = async () => {
    if (!user) {
      requireAuth(() => {}, t.authGatingServiceReason);
      return;
    }

    if (selectedOrders.length === 0) {
      setErrorMessage(t.serviceScheduleRequiresOrder);
      return;
    }

    // Guard: Block if any selected order is already in CONFIRM_SERVICE_PAYMENT or already scheduled
    const isAlreadyInConfirmation = selectedOrders.some((o) => {
      const s = (o.status || "").toUpperCase();
      return s === "CONFIRM_SERVICE_PAYMENT";
    });
    if (isAlreadyInConfirmation) {
      setErrorMessage(
        t.serviceOrderAlreadyInConfirmation ||
          (lang === "es"
            ? "Una o más órdenes seleccionadas ya se encuentran en confirmación de pago de servicio. No se puede seleccionar para otro servicio ni pagar doble."
            : "One or more selected orders are already in service payment confirmation.")
      );
      return;
    }

    const hasAlreadyScheduled = selectedOrders.some((o) => {
      const s = (o.status || "").toUpperCase();
      return (
        !isReturnBooking &&
        (o.isServiceScheduled ||
          [
            "WAITING_ON_DELIVERY",
            "PICKUP_DATE_SET",
            "HOME_INSTALL_SET",
            "INSTALLING",
            "INSTALLATION_PAYMENT",
            "READY_FOR_PICKUP",
            "READY_TO_PICK_UP",
            "COMPLETED",
          ].includes(s))
      );
    });
    if (hasAlreadyScheduled) {
      setErrorMessage(
        t.serviceOrderAlreadyProgrammed ||
          (lang === "es"
            ? "Una o más órdenes seleccionadas ya tienen un servicio programado y no pueden ser programadas nuevamente."
            : "One or more selected orders already have a service scheduled.")
      );
      return;
    }

    if (isPickupServiceDisabled) {
      setErrorMessage(pickupDisabledReason);
      return;
    }

    if (!hasGarageVehicle) {
      setErrorMessage(t.servicePickupNoGarageVehicleNotice);
      openGarageModal();
      return;
    }

    const hasInstallationPending = selectedOrders.some((o) => {
      const s = (o.status || "").toUpperCase();
      if (s === "INSTALLING") return true;
      if (s === "READY_TO_SET_RETURN_DATE" && !o.isInstallationPaymentConfirmed) return true;
      return false;
    });
    if (hasInstallationPending) {
      setErrorMessage(
        lang === "es"
          ? "No se puede programar la entrega del vehículo: la instalación está en progreso o el pago de la instalación está pendiente."
          : "Cannot schedule vehicle delivery: installation is in progress or installation payment is pending."
      );
      return;
    }

    if (!destinationInput.trim() && !destCoordinates) {
      setErrorMessage(t.serviceScheduleRequiresLocation);
      return;
    }
    if (!serviceDate) {
      setErrorMessage(t.serviceScheduleRequiresDate);
      return;
    }

    if (!isStaff && serviceDate) {
      const schedDateObj = new Date(serviceDate + "T00:00:00");
      const now = new Date();
      const todayDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffDays = Math.round((schedDateObj.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 3) {
        setErrorMessage(
          lang === "es"
            ? "Las citas de servicio deben programarse con un mínimo de 48 horas de anticipación."
            : "Service appointments must be scheduled with at least 48 hours in advance."
        );
        return;
      }
    }

    if (!phone.trim()) {
      setErrorMessage(t.servicePhoneRequired);
      return;
    }

    setErrorMessage(null);
    setIsSubmittingReturn(true);
    setReturnSubmissionStep(1);

    const matchingSlot = availableSlots.find((s) => s.time === serviceTimeSlot);
    const timeSlotLabel = matchingSlot ? matchingSlot.time12 : (serviceTimeSlot || "10:00 AM");

    try {
      const primaryOrderId = selectedOrders[0].id;
      const res = await fetch(`/api/orders/${primaryOrderId}/schedule-service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: "pickup",
          scheduledDate: serviceDate,
          timeSlot: timeSlotLabel,
          destinationAddress: destinationInput,
          distanceKm: calculation?.distanceKm || 0,
          travelMinutes: calculation?.durationMinutes || 0,
          serviceCostCRC: 0,
          customerPhone: phone.trim(),
          orderIds: selectedOrders.map((o) => o.id),
          isReturnBooking: true,
          vehicleModelSlug: effectiveGarageVehicle?.modelSlug || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al agendar fecha de retorno");
      }

      setReturnSubmissionStep(3);
    } catch (err: any) {
      console.error("Error confirming return delivery date:", err);
      setIsSubmittingReturn(false);
      setErrorMessage(
        err.message ||
          (lang === "es"
            ? "Ocurrió un error al agendar la entrega del vehículo."
            : "An error occurred while scheduling vehicle delivery.")
      );
    }
  };

  // Direct shop installation reservation submission (0 CRC upfront - reservation without payment)
  const handleConfirmShopBooking = async () => {
    if (selectedOrders.length === 0) {
      setErrorMessage(t.serviceScheduleRequiresOrder);
      return;
    }

    // Guard: Block if any selected order is already in CONFIRM_SERVICE_PAYMENT or already scheduled
    const isAlreadyInConfirmation = selectedOrders.some((o) => {
      const s = (o.status || "").toUpperCase();
      return s === "CONFIRM_SERVICE_PAYMENT";
    });
    if (isAlreadyInConfirmation) {
      setErrorMessage(
        t.serviceOrderAlreadyInConfirmation ||
          (lang === "es"
            ? "Una o más órdenes seleccionadas ya se encuentran en confirmación de pago de servicio. No se puede seleccionar para otro servicio ni pagar doble."
            : "One or more selected orders are already in service payment confirmation.")
      );
      return;
    }

    const hasAlreadyScheduled = selectedOrders.some((o) => {
      const s = (o.status || "").toUpperCase();
      return (
        !isReturnBooking &&
        (o.isServiceScheduled ||
          [
            "WAITING_ON_DELIVERY",
            "PICKUP_DATE_SET",
            "HOME_INSTALL_SET",
            "INSTALLING",
            "INSTALLATION_PAYMENT",
            "READY_FOR_PICKUP",
            "READY_TO_PICK_UP",
            "COMPLETED",
          ].includes(s))
      );
    });
    if (hasAlreadyScheduled) {
      setErrorMessage(
        t.serviceOrderAlreadyProgrammed ||
          (lang === "es"
            ? "Una o más órdenes seleccionadas ya tienen un servicio programado y no pueden ser programadas nuevamente."
            : "One or more selected orders already have a service scheduled.")
      );
      return;
    }

    if (!serviceDate) {
      setErrorMessage(t.serviceScheduleRequiresDate);
      return;
    }

    if (!isStaff && serviceDate) {
      const schedDateObj = new Date(serviceDate + "T00:00:00");
      const now = new Date();
      const todayDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffDays = Math.round((schedDateObj.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 3) {
        setErrorMessage(
          lang === "es"
            ? "Las citas de servicio deben programarse con un mínimo de 48 horas de anticipación."
            : "Service appointments must be scheduled at least 48 hours in advance."
        );
        return;
      }
    }

    if (!phone.trim()) {
      setErrorMessage(t.servicePhoneRequired);
      return;
    }

    setErrorMessage(null);
    setIsSubmittingShop(true);
    setShopSubmissionStep(1);

    const matchingSlot = availableSlots.find((s) => s.time === serviceTimeSlot);
    const timeSlotLabel = matchingSlot ? matchingSlot.time12 : (serviceTimeSlot || "10:00 AM");

    try {
      const primaryOrderId = selectedOrders[0].id;
      const res = await fetch(`/api/orders/${primaryOrderId}/schedule-service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: "shop_installation",
          scheduledDate: serviceDate,
          timeSlot: timeSlotLabel,
          destinationAddress: config?.garageAddress || "Calle 34, Pozos, Santa Ana, Costa Rica",
          distanceKm: 0,
          travelMinutes: 0,
          serviceCostCRC: 0,
          customerPhone: phone.trim(),
          orderIds: selectedOrders.map((o) => o.id),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error al agendar cita de instalación en taller");
      }

      setShopSubmissionStep(3);
    } catch (err: any) {
      console.error("Error reserving shop installation appointment:", err);
      setIsSubmittingShop(false);
      setErrorMessage(
        err.message ||
          (lang === "es"
            ? "Ocurrió un error al agendar la cita de instalación en taller."
            : "An error occurred while reserving the workshop appointment.")
      );
    }
  };

  // WhatsApp Pre-filled link
  const serviceNameText =
    selectedService === "shop_installation"
      ? t.serviceTabShopInstallation
      : selectedService === "installation"
      ? t.serviceTabInstallation
      : selectedService === "delivery"
      ? t.serviceTabDelivery
      : t.serviceTabPickup;

  const matchingSlotForMsg = availableSlots.find((s) => s.time === serviceTimeSlot);
  const timeSlotText = matchingSlotForMsg ? matchingSlotForMsg.time12 : (serviceTimeSlot || "10:00 AM");

  const orderNumberParam =
    selectedOrders.length > 0
      ? selectedOrders.map((o) => `#${o.orderNumber}`).join(", ")
      : "Por definir";

  const destinationText =
    selectedService === "shop_installation"
      ? (lang === "es" ? "Taller ZxZ Mods (Calle 34, Pozos, Santa Ana)" : "ZxZ Mods Shop (Calle 34, Pozos, Santa Ana)")
      : destinationInput || "Por coordinar";

  const whatsappRawMessage =
    `Hola ZxZ Mods, deseo coordinar el servicio de ${serviceNameText}.\n\n` +
      `📦 Orden(es): ${orderNumberParam}\n` +
      `📍 ${selectedService === "shop_installation" ? "Lugar de Instalación" : "Destino"}: ${destinationText}\n` +
      (selectedService === "shop_installation"
        ? `⚙️ Modo: El cliente lleva el vehículo SxS directamente al taller (Sin traslado)\n`
        : `📏 Distancia: ${calculation?.distanceKm || 0} km (desde Calle 34, Pozos, Santa Ana)\n`) +
      `📅 Fecha deseada: ${serviceDate || "Por coordinar"} (${timeSlotText})\n` +
      `💰 Costo de traslado: ₡${currentCostCRC.toLocaleString("es-CR")}\n\n` +
      (selectedService === "shop_installation"
        ? `Confirmo llevar el vehículo 10 minutos antes del horario indicado.`
        : `Confirmo que una persona estará presente para la recepción y entrega final.`);

  const whatsappUrl = getWhatsAppUrl(whatsappRawMessage);

  return (
    <div className="relative min-h-screen bg-[#FFFFFF] text-[#111827] flex flex-col justify-between selection:bg-[#C02030] selection:text-white antialiased">
      <NotificationBanner />
      <Navbar />
      <GarageModal />
      <CartDrawer />
      <FloatingConcierge />

      <main className="flex-1 w-full px-4 sm:px-6 md:px-8 lg:px-12 pt-20 sm:pt-24 pb-20">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 text-xs text-gray-500 mb-5">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hover:text-black flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.breadcrumbHome}</span>
            </Link>
            <span>/</span>
            <span className="font-semibold text-gray-900">{t.servicesTitle}</span>
          </div>

          <Link
            href="/servicios/programados"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:border-[#C02030] hover:text-[#C02030] text-xs font-bold text-gray-700 transition shadow-2xs"
          >
            <Calendar className="w-3.5 h-3.5 text-[#C02030]" />
            <span>{t.scheduledServicesTitle}</span>
          </Link>
        </div>

        {/* Real Loading Skeleton */}
        {pageLoading ? (
          <ServicesSkeleton />
        ) : (
          <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            {/* 
              SECTION ON THE TOP: Users orders show up that are ready to program the service
              - Supports de-selection
              - Allows selecting 2 or more orders if delivery or shop installation
            */}
            <ServiceOrderSelector
              selectedOrders={selectedOrders}
              onToggleOrder={handleToggleOrder}
              onClearOrders={handleClearOrders}
              selectedService={selectedService}
              ineligibleHomeInstallKeys={config?.ineligibleHomeInstallKeys}
              isOrderIneligibleForHomeInstall={orderHasIneligibleHomeInstall}
            />

            {isReturnBooking && (
              <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-2 border-purple-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-purple-950">
                      {lang === "es" ? "Programando Retorno de Vehículo SxS / UTV" : "Scheduling SxS / UTV Return Delivery"}
                    </h4>
                    <p className="text-[11px] text-purple-800">
                      {lang === "es"
                        ? "El traslado de ida y vuelta ya fue cubierto en el pago inicial de transporte. Esta entrega tiene costo de flete ₡0."
                        : "Round-trip transport was already covered in your initial payment. This delivery has ₡0 freight cost."}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-black text-purple-900 bg-purple-100 px-3 py-1 rounded-full border border-purple-300 self-start sm:self-auto shrink-0">
                  {lang === "es" ? "Flete ₡0 Ya Cancelado" : "Freight ₡0 Already Paid"}
                </span>
              </div>
            )}

            {/* 
              4 SERVICE CARDS:
              1. Solo Instalación (En Taller) - El cliente lleva el vehículo a Calle 34 Pozos
              2. Instalación a Domicilio
              3. Entrega / Delivery
              4. Pick-up de Vehículo
            */}
            {/* SMARTPHONE VIEW: Icon-only selector + Description of current selected service */}
            <div className="sm:hidden space-y-3">
              {/* 4-icon Row */}
              <div className="grid grid-cols-4 gap-2">
                {/* 1. Shop Installation Icon */}
                <button
                  type="button"
                  onClick={() => handleSelectService("shop_installation")}
                  disabled={isPickupBounded}
                  className={`py-3 px-2 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isPickupBounded
                      ? "bg-gray-100 border-gray-200 opacity-40 cursor-not-allowed"
                      : selectedService === "shop_installation"
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-md ring-2 ring-emerald-500/20"
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 shadow-2xs"
                  }`}
                  title={t.serviceTabShopInstallation}
                >
                  <Warehouse className={`w-5 h-5 ${selectedService === "shop_installation" ? "text-white" : "text-gray-700"}`} />
                </button>

                {/* 2. Home Installation Icon */}
                <button
                  type="button"
                  onClick={() => {
                    if (isPickupBounded) return;
                    if (isHomeInstallationBlockedByOrder) {
                      setErrorMessage(t.serviceHomeInstallIneligibleOrderAlert);
                      return;
                    }
                    handleSelectService("installation");
                  }}
                  disabled={isHomeInstallationBlockedByOrder || isPickupBounded}
                  className={`py-3 px-2 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isHomeInstallationBlockedByOrder || isPickupBounded
                      ? "bg-gray-100 border-gray-200 opacity-40 cursor-not-allowed"
                      : selectedService === "installation"
                      ? "bg-[#C02030] border-[#C02030] text-white shadow-md ring-2 ring-[#C02030]/20"
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 shadow-2xs"
                  }`}
                  title={t.serviceTabInstallation}
                >
                  <Wrench className={`w-5 h-5 ${selectedService === "installation" ? "text-white" : "text-gray-700"}`} />
                </button>

                {/* 3. Delivery Icon */}
                <button
                  type="button"
                  onClick={() => handleSelectService("delivery")}
                  disabled={isPickupBounded}
                  className={`py-3 px-2 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isPickupBounded
                      ? "bg-gray-100 border-gray-200 opacity-40 cursor-not-allowed"
                      : selectedService === "delivery"
                      ? "bg-blue-600 border-blue-600 text-white shadow-md ring-2 ring-blue-500/20"
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 shadow-2xs"
                  }`}
                  title={t.serviceTabDelivery}
                >
                  <Truck className={`w-5 h-5 ${selectedService === "delivery" ? "text-white" : "text-gray-700"}`} />
                </button>

                {/* 4. Pick-up Icon */}
                <button
                  type="button"
                  onClick={() => handleSelectService("pickup")}
                  disabled={isPickupServiceDisabled}
                  className={`py-3 px-2 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isPickupServiceDisabled
                      ? "bg-gray-100 border-gray-200 opacity-40 cursor-not-allowed"
                      : selectedService === "pickup"
                      ? "bg-slate-900 border-slate-900 text-white shadow-md ring-2 ring-slate-900/20"
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 shadow-2xs"
                  }`}
                  title={t.serviceTabPickup}
                >
                  <Car className={`w-5 h-5 ${selectedService === "pickup" ? "text-white" : "text-gray-700"}`} />
                </button>
              </div>

              {/* Detail Card of Currently Selected Service */}
              <div className="p-4 rounded-3xl bg-white border border-gray-200 shadow-sm space-y-3">
                {selectedService === "shop_installation" && (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Warehouse className="w-4 h-4" />
                        </div>
                        <h3 className="font-black text-sm text-gray-900">
                          {t.serviceTabShopInstallation}
                        </h3>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {t.serviceShopInstallationBadge}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {isPickupBounded
                        ? (lang === "es" ? "No disponible: pedido asignado a retiro por plataforma." : "Not available: order assigned to towing pick-up.")
                        : t.serviceShopInstallationDesc}
                    </p>
                  </>
                )}

                {selectedService === "installation" && (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#C02030] text-white flex items-center justify-center shrink-0">
                          <Wrench className="w-4 h-4" />
                        </div>
                        <h3 className="font-black text-sm text-gray-900">
                          {t.serviceTabInstallation}
                        </h3>
                      </div>
                      <span className={`text-xs font-mono font-bold ${isHomeInstallationBlockedByOrder || isPickupBounded ? "text-gray-400 line-through" : "text-gray-900"}`}>
                        ₡{config?.homeInstallationRatePerKmCRC?.toLocaleString("es-CR")}/km
                      </span>
                    </div>
                    {isHomeInstallationBlockedByOrder && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        {t.serviceHomeInstallIneligibleBadge}
                      </span>
                    )}
                    <p className={`text-xs leading-relaxed ${isHomeInstallationBlockedByOrder ? "text-rose-600 font-medium" : "text-gray-600"}`}>
                      {isPickupBounded
                        ? (lang === "es" ? "No disponible: pedido asignado a retiro por plataforma." : "Not available: order assigned to towing pick-up.")
                        : isHomeInstallationBlockedByOrder
                        ? t.serviceHomeInstallIneligibleReason
                        : t.serviceInstallationDesc}
                    </p>
                  </>
                )}

                {selectedService === "delivery" && (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Truck className="w-4 h-4" />
                        </div>
                        <h3 className="font-black text-sm text-gray-900">
                          {t.serviceTabDelivery}
                        </h3>
                      </div>
                      <span className="text-xs font-mono font-bold text-gray-900">
                        ₡{config?.deliveryRatePerKmCRC?.toLocaleString("es-CR")}/km
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {isPickupBounded
                        ? (lang === "es" ? "No disponible: pedido asignado a retiro por plataforma." : "Not available: order assigned to towing pick-up.")
                        : t.serviceDeliveryDesc}
                    </p>
                  </>
                )}

                {selectedService === "pickup" && (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                          <Car className="w-4 h-4" />
                        </div>
                        <h3 className="font-black text-sm text-gray-900">
                          {isReturnBooking
                            ? (lang === "es" ? "Retorno / Entrega de Vehículo" : "Vehicle Return Delivery")
                            : t.serviceTabPickup}
                        </h3>
                      </div>
                      <span className={`text-xs font-mono font-bold ${isPickupServiceDisabled ? "text-gray-400 line-through" : isReturnBooking ? "text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200" : "text-gray-900"}`}>
                        {isReturnBooking ? (lang === "es" ? "₡0 (Cancelado)" : "₡0 (Paid)") : `₡${config?.pickupRatePerKmCRC?.toLocaleString("es-CR")}/km`}
                      </span>
                    </div>
                    {isGlobalPickupDisabled ? (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        {t.servicePickupDisabledBadge}
                      </span>
                    ) : isPickupVehicleIncompatible ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        {t.servicePickupVehicleIncompatibleBadge}
                      </span>
                    ) : hasGarageVehicle ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{effectiveGarageVehicle?.modelName || effectiveGarageVehicle?.modelSlug}</span>
                      </span>
                    ) : null}
                    <p className={`text-xs leading-relaxed ${isPickupServiceDisabled ? "text-rose-600 font-medium" : "text-gray-600"}`}>
                      {isGlobalPickupDisabled
                        ? t.servicePickupDisabledDesc
                        : isPickupVehicleIncompatible
                        ? `${t.servicePickupVehicleIncompatibleDesc} (${effectiveGarageVehicle?.brandName || effectiveGarageVehicle?.brandSlug || ""} ${effectiveGarageVehicle?.modelName || effectiveGarageVehicle?.modelSlug || ""})`
                        : isReturnBooking
                        ? (lang === "es" ? "Coordinación para la entrega de tu vehículo tras la instalación." : "Coordinate date to return your vehicle after installation.")
                        : t.servicePickupDesc}
                    </p>
                    {!isPickupServiceDisabled && !isReturnBooking && (
                      <div className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-semibold leading-tight">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{t.servicePickupRoundTripNotice}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* DESKTOP VIEW: 4 full service cards */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Solo Instalación (En Taller) */}
              <button
                type="button"
                onClick={() => handleSelectService("shop_installation")}
                disabled={isPickupBounded}
                className={`p-5 rounded-3xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isPickupBounded
                    ? "bg-gray-100/70 border-gray-200 opacity-50 cursor-not-allowed"
                    : selectedService === "shop_installation"
                    ? "bg-white border-emerald-600 shadow-lg ring-2 ring-emerald-500/15 cursor-pointer"
                    : "bg-gray-50/60 border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
                }`}
                title={isPickupBounded ? (lang === "es" ? "Orden vinculada exclusivamente a Pick-up" : "Order locked to Pick-up") : undefined}
              >
                <div className="space-y-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                      isPickupBounded
                        ? "bg-gray-200 text-gray-400"
                        : selectedService === "shop_installation"
                        ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/30"
                        : "bg-white border border-gray-200 text-gray-700"
                    }`}
                  >
                    <Warehouse className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-black text-sm ${isPickupBounded ? "text-gray-400" : "text-gray-900"}`}>
                      {t.serviceTabShopInstallation}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                      {isPickupBounded
                        ? (lang === "es" ? "No disponible: pedido asignado a retiro por plataforma." : "Not available: order assigned to towing pick-up.")
                        : t.serviceShopInstallationDesc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-3">
                  <span className="text-[11px] font-semibold text-gray-400">
                    {lang === "es" ? "Traslado:" : "Transport:"}
                  </span>
                  <span className={`text-xs font-mono font-bold ${isPickupBounded ? "text-gray-400 bg-gray-100" : "text-emerald-700 bg-emerald-50"} px-2 py-0.5 rounded-full border border-emerald-200`}>
                    {t.serviceShopInstallationBadge}
                  </span>
                </div>
              </button>

              {/* 2. Home Installation */}
              <button
                type="button"
                onClick={() => {
                  if (isPickupBounded) return;
                  if (isHomeInstallationBlockedByOrder) {
                    setErrorMessage(t.serviceHomeInstallIneligibleOrderAlert);
                    return;
                  }
                  handleSelectService("installation");
                }}
                disabled={isHomeInstallationBlockedByOrder || isPickupBounded}
                className={`p-5 rounded-3xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isHomeInstallationBlockedByOrder || isPickupBounded
                    ? "bg-gray-100/70 border-gray-200 opacity-50 cursor-not-allowed"
                    : selectedService === "installation"
                    ? "bg-white border-[#C02030] shadow-lg ring-2 ring-[#C02030]/15 cursor-pointer"
                    : "bg-gray-50/60 border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
                }`}
                title={
                  isPickupBounded
                    ? (lang === "es" ? "Orden vinculada exclusivamente a Pick-up" : "Order locked to Pick-up")
                    : isHomeInstallationBlockedByOrder
                    ? t.serviceHomeInstallIneligibleReason
                    : undefined
                }
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                        isHomeInstallationBlockedByOrder || isPickupBounded
                          ? "bg-gray-200 text-gray-400"
                          : selectedService === "installation"
                          ? "bg-[#C02030] text-white shadow-sm shadow-[#C02030]/30"
                          : "bg-white border border-gray-200 text-gray-700"
                      }`}
                    >
                      <Wrench className="w-5 h-5" />
                    </div>

                    {isHomeInstallationBlockedByOrder && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        {t.serviceHomeInstallIneligibleBadge}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className={`font-black text-sm ${isHomeInstallationBlockedByOrder || isPickupBounded ? "text-gray-400" : "text-gray-900"}`}>
                      {t.serviceTabInstallation}
                    </h3>
                    <p className={`text-xs mt-1 leading-relaxed line-clamp-2 ${isHomeInstallationBlockedByOrder ? "text-rose-600 font-medium" : "text-gray-500"}`}>
                      {isPickupBounded
                        ? (lang === "es" ? "No disponible: pedido asignado a retiro por plataforma." : "Not available: order assigned to towing pick-up.")
                        : isHomeInstallationBlockedByOrder
                        ? t.serviceHomeInstallIneligibleReason
                        : t.serviceInstallationDesc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-3">
                  <span className="text-[11px] font-semibold text-gray-400">
                    {t.ratePerKmLabel}:
                  </span>
                  <span className={`text-xs font-mono font-bold ${isHomeInstallationBlockedByOrder || isPickupBounded ? "text-gray-400 line-through" : "text-gray-900"}`}>
                    ₡{config?.homeInstallationRatePerKmCRC?.toLocaleString("es-CR")}/km
                  </span>
                </div>
              </button>

              {/* 3. Delivery / Repuestos */}
              <button
                type="button"
                onClick={() => handleSelectService("delivery")}
                disabled={isPickupBounded}
                className={`p-5 rounded-3xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isPickupBounded
                    ? "bg-gray-100/70 border-gray-200 opacity-50 cursor-not-allowed"
                    : selectedService === "delivery"
                    ? "bg-white border-blue-600 shadow-lg ring-2 ring-blue-500/15 cursor-pointer"
                    : "bg-gray-50/60 border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
                }`}
                title={isPickupBounded ? (lang === "es" ? "Orden vinculada exclusivamente a Pick-up" : "Order locked to Pick-up") : undefined}
              >
                <div className="space-y-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                      isPickupBounded
                        ? "bg-gray-200 text-gray-400"
                        : selectedService === "delivery"
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                        : "bg-white border border-gray-200 text-gray-700"
                    }`}
                  >
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-black text-sm ${isPickupBounded ? "text-gray-400" : "text-gray-900"}`}>
                      {t.serviceTabDelivery}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                      {isPickupBounded
                        ? (lang === "es" ? "No disponible: pedido asignado a retiro por plataforma." : "Not available: order assigned to towing pick-up.")
                        : t.serviceDeliveryDesc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-3">
                  <span className="text-[11px] font-semibold text-gray-400">
                    {t.ratePerKmLabel}:
                  </span>
                  <span className={`text-xs font-mono font-bold ${isPickupBounded ? "text-gray-400" : "text-gray-900"}`}>
                    ₡{config?.deliveryRatePerKmCRC?.toLocaleString("es-CR")}/km
                  </span>
                </div>
              </button>

              {/* 4. Pick-up de Vehículo */}
              <button
                type="button"
                onClick={() => handleSelectService("pickup")}
                disabled={isPickupServiceDisabled}
                className={`p-5 rounded-3xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isPickupServiceDisabled
                    ? "bg-gray-100/70 border-gray-200 opacity-60 cursor-not-allowed"
                    : selectedService === "pickup"
                    ? "bg-white border-slate-900 shadow-lg ring-2 ring-slate-900/15 cursor-pointer"
                    : "bg-gray-50/60 border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
                }`}
                title={isPickupServiceDisabled ? pickupDisabledReason : undefined}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${
                        isPickupServiceDisabled
                          ? "bg-gray-200 text-gray-400"
                          : selectedService === "pickup"
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-white border border-gray-200 text-gray-700"
                      }`}
                    >
                      <Car className="w-5 h-5" />
                    </div>
                    {isGlobalPickupDisabled ? (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        {t.servicePickupDisabledBadge}
                      </span>
                    ) : isPickupVehicleIncompatible ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-500" />
                        {t.servicePickupVehicleIncompatibleBadge}
                      </span>
                    ) : hasGarageVehicle ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{effectiveGarageVehicle?.modelName || effectiveGarageVehicle?.modelSlug}</span>
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <h3 className={`font-black text-sm ${isPickupServiceDisabled ? "text-gray-400" : "text-gray-900"}`}>
                      {isReturnBooking
                        ? (lang === "es" ? "Retorno / Entrega de Vehículo" : "Vehicle Return Delivery")
                        : t.serviceTabPickup}
                    </h3>
                    <p className={`text-xs mt-1 leading-relaxed ${isPickupServiceDisabled ? "text-rose-600 font-medium line-clamp-2" : "text-gray-500"}`}>
                      {isGlobalPickupDisabled
                        ? t.servicePickupDisabledDesc
                        : isPickupVehicleIncompatible
                        ? `${t.servicePickupVehicleIncompatibleDesc} (${effectiveGarageVehicle?.brandName || effectiveGarageVehicle?.brandSlug || ""} ${effectiveGarageVehicle?.modelName || effectiveGarageVehicle?.modelSlug || ""})`
                        : isReturnBooking
                        ? (lang === "es" ? "Coordinación para la entrega de tu vehículo tras la instalación." : "Coordinate date to return your vehicle after installation.")
                        : t.servicePickupDesc}
                    </p>
                    {!isPickupServiceDisabled && !isReturnBooking && (
                      <div className="mt-2 text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-semibold leading-tight">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{t.servicePickupRoundTripNotice}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex flex-col gap-1 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-400">
                      {isReturnBooking ? (lang === "es" ? "Flete:" : "Freight:") : `${t.ratePerKmLabel}:`}
                    </span>
                    <span className={`text-xs font-mono font-bold ${isPickupServiceDisabled ? "text-gray-400 line-through" : isReturnBooking ? "text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200" : "text-gray-900"}`}>
                      {isReturnBooking ? (lang === "es" ? "₡0 (Cancelado)" : "₡0 (Paid)") : `₡${config?.pickupRatePerKmCRC?.toLocaleString("es-CR")}/km`}
                    </span>
                  </div>
                  {!isReturnBooking && !isPickupServiceDisabled && (
                    <span className="text-[10px] text-gray-400 font-medium leading-none">
                      *{lang === "es" ? "Tarifa ida y vuelta (incluye entrega final sin costo extra)" : "Round-trip fee (includes return delivery with no extra cost)"}
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* 
              MAIN INTERACTIVE GRID:
              Left: Location Input + 2D Calendar + Time Slot Picker (5 cols)
              Right: Interactive Map + Resume of Costs + Payment Proceed CTA (7 cols)
            */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form & Schedule */}
              <div className="lg:col-span-5 space-y-5">
                <div className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
                  {/* Garage Fixed Origin */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#C02030]" />
                      <span>{t.garageOriginLabel}</span>
                    </label>
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">
                        {config?.garageAddress || "Calle 34, Pozos, Santa Ana, Costa Rica"}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase">
                        Base
                      </span>
                    </div>
                  </div>

                  {/* Destination Location Input OR In-Shop Reception Card */}
                  {selectedService === "shop_installation" ? (
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold">
                          <Warehouse className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{lang === "es" ? "Instalación Directa en Taller" : "Direct In-Shop Installation"}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black uppercase">
                          ₡0 Traslado
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        {t.serviceShopDirectNotice}
                      </p>
                      <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-200/60 flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-semibold">{lang === "es" ? "Punto de llegada:" : "Arrival spot:"}</span>
                        <span className="font-bold text-gray-900">Calle 34, Pozos, Santa Ana</span>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleFormSubmit} className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-between">
                        <span>{t.destinationInputLabel}</span>
                        <button
                          type="button"
                          onClick={handleUseCurrentLocation}
                          className="text-[11px] font-semibold text-[#C02030] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <LocateFixed className="w-3 h-3" />
                          <span>{t.useCurrentLocationBtn}</span>
                        </button>
                      </label>

                      <div className="relative">
                        <input
                          type="text"
                          value={destinationInput}
                          onChange={(e) => setDestinationInput(e.target.value)}
                          placeholder={t.destinationInputPlaceholder}
                          className="w-full pl-4 pr-11 py-3 rounded-2xl border border-gray-200 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C02030]/20 focus:border-[#C02030] transition"
                        />
                        <button
                          type="submit"
                          disabled={isCalculating || !destinationInput.trim()}
                          className="absolute right-2 top-2 p-1.5 rounded-xl bg-black text-white hover:bg-gray-800 transition disabled:opacity-40 cursor-pointer"
                          title="Calcular"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                      </div>
                    </form>
                  )}

                  {/* 
                    2D CALENDAR SECTION:
                    Visualizes available days and selects service date
                  */}
                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-900">
                      <Calendar className="w-3.5 h-3.5 text-[#C02030]" />
                      <span>{t.serviceDateTitle}</span>
                    </div>

                    <ServiceCalendar2D
                      selectedDate={serviceDate}
                      onSelectDate={(d) => setServiceDate(d)}
                      minDate={minDateString}
                      fullyBlockedDates={fullyBlockedDates}
                      blockedReasons={blockedReasons}
                    />

                    {/* DYNAMIC TIME SLOT PICKER (8:00 AM - 8:00 PM) - ONLY SHOWN WHEN ORDER(S) SELECTED */}
                    {selectedOrders.length > 0 ? (
                      <ServiceTimeSlotPicker
                        slots={availableSlots}
                        selectedTime={serviceTimeSlot}
                        onSelectTime={setServiceTimeSlot}
                        isLoading={isSlotsLoading}
                        isFullDayBlocked={isFullDayBlocked}
                        fullDayReason={fullDayReason}
                        travelMinutes={selectedService === "shop_installation" ? 0 : (calculation?.durationMinutes || 0)}
                        serviceType={selectedService}
                        installationDurationMinutes={estimatedInstallDurationMin}
                        hasSelectedOrder={selectedOrders.length > 0}
                      />
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center gap-3 text-slate-700 animate-fade-in">
                        <div className="w-8 h-8 rounded-xl bg-slate-200/80 border border-slate-300 flex items-center justify-center shrink-0 text-slate-700">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900">
                            {lang === "es"
                              ? "Selecciona tu pedido arriba para ver los horarios disponibles"
                              : "Select your order above to view available time slots"}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {lang === "es"
                              ? "La hoja de horarios se habilitará automáticamente al escoger el pedido."
                              : "The time sheet will be enabled automatically once you select an order."}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* GARAGE COMPATIBILITY CHECK SECTION (Below Calendar & Arrival Time) */}
                    {selectedService === "pickup" && (
                      <div className="pt-4 border-t border-gray-100 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                              <Car className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                <span>{t.servicePickupGarageCompatTitle}</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold uppercase">
                                  Pick-up
                                </span>
                              </h4>
                              <p className="text-[10px] text-gray-500">
                                {t.servicePickupGarageCompatSubtitle}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => openGarageModal()}
                            className="text-[11px] font-semibold text-[#C02030] hover:text-[#A01825] flex items-center gap-1 cursor-pointer transition shrink-0"
                          >
                            <span>{hasGarageVehicle ? (lang === "es" ? "Cambiar vehículo" : "Change vehicle") : t.servicePickupOpenGarageBtn}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {hasGarageVehicle ? (
                          <div
                            className={`p-3.5 rounded-2xl border transition-all ${
                              effectiveGarageVehicle?.pickupServiceAvailable !== false
                                ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                                : "bg-rose-50/80 border-rose-200 text-rose-950"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                    effectiveGarageVehicle?.pickupServiceAvailable !== false
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "bg-rose-600 text-white shadow-xs"
                                  }`}
                                >
                                  {effectiveGarageVehicle?.pickupServiceAvailable !== false ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                  ) : (
                                    <AlertCircle className="w-5 h-5" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                                      {t.servicePickupGarageVehicleLabel}
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                        effectiveGarageVehicle?.pickupServiceAvailable !== false
                                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                          : "bg-rose-100 text-rose-800 border-rose-300"
                                      }`}
                                    >
                                      {effectiveGarageVehicle?.pickupServiceAvailable !== false
                                        ? t.servicePickupVehicleCompatibleBadge
                                        : t.servicePickupVehicleIncompatibleBadge}
                                    </span>
                                  </div>
                                  <h5 className="text-sm font-black text-gray-900 truncate mt-0.5">
                                    {effectiveGarageVehicle?.year} {effectiveGarageVehicle?.brandName || effectiveGarageVehicle?.brandSlug} {effectiveGarageVehicle?.modelName || effectiveGarageVehicle?.modelSlug}
                                  </h5>
                                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                    {effectiveGarageVehicle?.pickupServiceAvailable !== false
                                      ? t.servicePickupGarageCompatSuccess
                                      : t.servicePickupGarageCompatFail}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-amber-900 block">
                                  {lang === "es" ? "Sin vehículo seleccionado en Mi Garaje" : "No vehicle selected in My Garage"}
                                </span>
                                <p className="text-[11px] text-amber-700 leading-tight mt-0.5">
                                  {t.servicePickupNoGarageVehicleNotice}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => openGarageModal()}
                              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
                            >
                              {t.servicePickupOpenGarageBtn}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 
                Right Column: Interactive Map + Resume of Costs Below Map + Action Card Below Resume
                Origin strictly set to Calle 34, Pozos, Santa Ana (9.9482, -84.1967)
              */}
              <div className="lg:col-span-7 space-y-6">
                <LeafletInteractiveMap
                  originLat={config?.garageLatitude || 9.9482}
                  originLng={config?.garageLongitude || -84.1967}
                  originAddress={config?.garageAddress || "Calle 34, Pozos, Santa Ana, Costa Rica"}
                  destinationLat={destCoordinates?.lat}
                  destinationLng={destCoordinates?.lng}
                  destinationName={destinationInput}
                  distanceKm={calculation?.distanceKm || 0}
                  durationMinutes={calculation?.durationMinutes || 0}
                  isCalculating={isCalculating}
                  routeGeometry={calculation?.geometry}
                  isShopInstallation={selectedService === "shop_installation"}
                  onLocationSelect={handleMapLocationSelect}
                />

                {/* RESUME OF THE COSTS BELOW THE MAP */}
                <ServiceCostResume
                  serviceType={selectedService}
                  distanceKm={calculation?.distanceKm || 0}
                  durationMinutes={calculation?.durationMinutes || 0}
                  ratePerKm={currentRatePerKm}
                  baseFee={currentBaseFee}
                  totalCostCRC={currentCostCRC}
                  installationCostCRC={totalOrdersInstallationCostCRC}
                  pendingPickupInstallCostCRC={
                    selectedService === "pickup"
                      ? getOrdersPendingInstallationTotal(selectedOrders)
                      : 0
                  }
                  ivaCRC={currentIvaCRC}
                  hasCalculation={hasDistance}
                  destinationAddress={destinationInput}
                  scheduledTime={availableSlots.find((s) => s.time === serviceTimeSlot)?.time12 || serviceTimeSlot}
                  scheduledDate={serviceDate}
                />

                {/* 
                  ACTION CARD BELOW 'RESUMEN DE COSTOS'
                  - Mandatory presence notice
                  - Obligatory contact phone input (defaulted from selected order)
                  - CTA to proceed to dedicated payment screen (/servicios/pago)
                  - WhatsApp quick contact
                */}
                <div className="rounded-3xl border border-gray-200 bg-white p-5 sm:p-7 shadow-xs space-y-6">
                  {/* Mandatory Presence Notice */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-amber-900 text-xs leading-relaxed">
                    <Users className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      {selectedService === "shop_installation"
                        ? (lang === "es"
                            ? "Por favor presentar el vehículo SxS en el taller 10 minutos antes del horario seleccionado."
                            : "Please bring your SxS vehicle to our shop 10 minutes prior to the chosen schedule.")
                        : t.servicePresenceNotice}
                    </span>
                  </div>

                  {/* Customer Contact Phone (Obligatory) */}
                  <div className="space-y-1.5">
                    <label className="flex items-center justify-between text-xs font-bold text-gray-800 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#C02030]" />
                        {t.servicePhoneInputLabel}
                      </span>
                      <span className="text-[10px] text-red-600 font-bold lowercase tracking-normal">
                        *{lang === "es" ? "obligatorio" : "required"}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+506 8888 8888"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-mono text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C02030]/20 focus:border-[#C02030] transition-all"
                        required
                      />
                      {phone.trim() && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500">
                      {t.servicePhoneInputHelp}
                    </p>
                  </div>

                  {/* Error Feedback Messages */}
                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Proceed to Payment or Direct Return / Shop Confirmation CTA */}
                  {selectedOrders.length > 0 ? (
                    isReturnBooking ? (
                      <button
                        type="button"
                        onClick={handleConfirmReturnBooking}
                        disabled={
                          isSubmittingReturn ||
                          !serviceDate ||
                          !serviceTimeSlot ||
                          isFullDayBlocked ||
                          !phone.trim() ||
                          !destinationInput.trim()
                        }
                        className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-black tracking-wider uppercase shadow-md shadow-emerald-600/20 disabled:shadow-none transition-all cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>
                          {lang === "es"
                            ? "Confirmar Fecha de Retorno / Entrega (₡0 - Ya Pagado)"
                            : "Confirm Return Delivery Date (₡0 - Already Paid)"}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : selectedService === "shop_installation" ? (
                      <button
                        type="button"
                        onClick={handleConfirmShopBooking}
                        disabled={
                          isSubmittingShop ||
                          !serviceDate ||
                          !serviceTimeSlot ||
                          isFullDayBlocked ||
                          !phone.trim()
                        }
                        className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[#C02030] hover:bg-[#A01825] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-black tracking-wider uppercase shadow-md shadow-[#C02030]/20 disabled:shadow-none transition-all cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>
                          {t.serviceShopInstallReserveBtn}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleProceedToPayment}
                        disabled={
                          !serviceDate ||
                          !serviceTimeSlot ||
                          isFullDayBlocked ||
                          !phone.trim() ||
                          (!destinationInput.trim() && !destCoordinates)
                        }
                        className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[#C02030] hover:bg-[#A01825] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-black tracking-wider uppercase shadow-md shadow-[#C02030]/20 disabled:shadow-none transition-all cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>
                          {currentCostCRC === 0
                            ? `${t.serviceProceedToConfirmFreeBtn} (${selectedOrders.length === 1 ? `#${selectedOrders[0].orderNumber}` : `${selectedOrders.length} ${t.serviceMultipleOrdersCount}`})`
                            : `${t.serviceProceedToPaymentBtn} (₡${currentCostCRC.toLocaleString("es-CR")})`}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )
                  ) : (
                    <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 text-center space-y-1.5">
                      <p className="text-sm font-bold text-gray-900">
                        {t.serviceScheduleRequiresOrder}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t.serviceOrdersRequiredNotice}
                      </p>
                    </div>
                  )}

                  {/* Direct WhatsApp Contact Button */}
                  <div className="pt-2 border-t border-gray-100">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs sm:text-sm font-bold tracking-wider uppercase shadow-sm transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{t.requestServiceWhatsAppBtn}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Full-Screen Submission Animation Overlay (Matches Checkout Animation) */}
      <DjiPaymentAnimationOverlay
        isOpen={isSubmittingReturn || isSubmittingShop}
        step={isSubmittingShop ? shopSubmissionStep : returnSubmissionStep}
        title={
          isSubmittingShop
            ? shopSubmissionStep < 3
              ? (lang === "es" ? "Agendando Cita en Taller..." : "Scheduling Workshop Appointment...")
              : t.serviceShopInstallOverlayTitle
            : returnSubmissionStep < 3
            ? (lang === "es" ? "Agendando Entrega de Vehículo..." : "Scheduling Vehicle Delivery...")
            : (lang === "es" ? "¡Entrega Programada!" : "Delivery Scheduled!")
        }
        subtitle={
          isSubmittingShop
            ? shopSubmissionStep < 3
              ? (lang === "es"
                  ? "Sincronizando tu cita de taller sin costo inicial con ZxZ Mods..."
                  : "Syncing your workshop appointment at no upfront cost with ZxZ Mods...")
              : t.serviceShopInstallOverlaySub
            : returnSubmissionStep < 3
            ? (lang === "es"
                ? "Estamos sincronizando tu itinerario de entrega con el sistema ZxZ Mods..."
                : "Syncing your vehicle delivery schedule with the ZxZ Mods system...")
            : (lang === "es"
                ? "Tu entrega ha sido programada con éxito. Redirigiendo a tu seguimiento en vivo..."
                : "Delivery scheduled successfully. Redirecting to live tracking...")
        }
        lang={lang}
        onAnimationComplete={() => {
          if (selectedOrders.length > 0) {
            router.push(`/pedidos/${selectedOrders[0].id}`);
          }
        }}
      />
    </div>
  );
}

export default function TransportServicePage() {
  return (
    <React.Suspense fallback={<ServicesSkeleton />}>
      <TransportServiceContent />
    </React.Suspense>
  );
}
