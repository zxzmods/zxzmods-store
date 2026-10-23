"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useLanguage } from "@/context/LanguageContext";
import { formatCRC } from "@/lib/i18n";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Truck,
  Car,
  Wrench,
  Warehouse,
  CheckCircle2,
  AlertCircle,
  Phone,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  User,
  DollarSign,
  X,
  Check,
  Package,
  Layers,
  ShieldCheck,
  FileText,
  Navigation,
  Lock,
  Unlock,
  Trash2,
  Edit,
  LocateFixed,
  Copy,
  Tag,
  AlertTriangle,
  Fuel,
} from "lucide-react";

// Client-only dynamic import for Leaflet map
const LeafletInteractiveMap = dynamic(
  () => import("@/components/services/LeafletInteractiveMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 rounded-3xl bg-slate-100 flex items-center justify-center animate-pulse text-slate-400 text-xs">
        Cargando mapa interactivo...
      </div>
    ),
  }
);

interface ServiceItem {
  id: string;
  appointmentCode?: string | null;
  orderId: string | null;
  serviceType: string; // shop_installation, installation, delivery, pickup, ruta_barrial, blocked_day
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  timeMinutes: number;
  durationMinutes: number;
  destinationAddress: string | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  distanceKm: number | null;
  clientName: string | null;
  clientPhone: string | null;
  costCRC: number;
  paymentStatus: string; // PAID, PENDING
  paymentProofUrl?: string | null;
  status: string; // CONFIRMED, COMPLETED, CANCELLED, BLOCKED
  order?: {
    id: string;
    orderNumber: string;
    status: string;
    customerName: string | null;
    customerPhone: string | null;
    shippingAddress: string | null;
    itemsJson: string;
    totalCRC: number;
    paymentProofUrl?: string | null;
  } | null;
}

interface OrderReady {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  itemsJson: string;
  totalCRC: number;
  createdAt: string;
}

const SERVICE_META: Record<
  string,
  { labelEs: string; labelEn: string; icon: any; color: string; badgeColor: string; defaultCost: number }
> = {
  shop_installation: {
    labelEs: "Solo Instalación (En Taller)",
    labelEn: "Workshop Installation Only",
    icon: Warehouse,
    color: "bg-emerald-50 text-emerald-800 border-emerald-300",
    badgeColor: "bg-emerald-600 text-white",
    defaultCost: 0,
  },
  installation: {
    labelEs: "Instalación a Domicilio",
    labelEn: "Mobile Home Installation",
    icon: Wrench,
    color: "bg-red-50 text-red-800 border-red-300",
    badgeColor: "bg-[#C02030] text-white",
    defaultCost: 2000,
  },
  delivery: {
    labelEs: "Entrega / Delivery",
    labelEn: "Parts Delivery",
    icon: Truck,
    color: "bg-blue-50 text-blue-800 border-blue-300",
    badgeColor: "bg-blue-600 text-white",
    defaultCost: 800,
  },
  pickup: {
    labelEs: "Pick-up de Vehículo",
    labelEn: "Vehicle Transport / Tow",
    icon: Car,
    color: "bg-slate-100 text-slate-800 border-slate-300",
    badgeColor: "bg-slate-900 text-white",
    defaultCost: 1500,
  },
  ruta_barrial: {
    labelEs: "Ruta BarrialCR (Rides)",
    labelEn: "Ruta BarrialCR (Rides)",
    icon: Lock,
    color: "bg-amber-50 text-amber-900 border-amber-300",
    badgeColor: "bg-amber-600 text-white",
    defaultCost: 0,
  },
  blocked_day: {
    labelEs: "Día Bloqueado (Taller)",
    labelEn: "Blocked Day (Workshop)",
    icon: Lock,
    color: "bg-rose-50 text-rose-900 border-rose-300",
    badgeColor: "bg-rose-600 text-white",
    defaultCost: 0,
  },
};

const QUICK_SHORTCUTS = [
  "Escazú, San José",
  "Lindora, Santa Ana",
  "Pozos, Santa Ana",
  "Belén, Heredia",
  "San José Centro",
  "Heredia Centro",
  "La Guácima, Alajuela",
  "Alajuela Centro",
];

// Operating hours for staff override: 08:00 to 20:00 (8:00 AM to 8:00 PM)
const TIME_SLOTS_8_TO_8: string[] = [];
for (let h = 8; h <= 20; h++) {
  const hh = String(h).padStart(2, "0");
  TIME_SLOTS_8_TO_8.push(`${hh}:00`);
  if (h < 20) {
    TIME_SLOTS_8_TO_8.push(`${hh}:30`);
  }
}

export function ServicesAgendaTab() {
  const { t, lang } = useLanguage();

  // Data state
  const [schedules, setSchedules] = useState<ServiceItem[]>([]);
  const [ordersReady, setOrdersReady] = useState<OrderReady[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // View state: "calendar" (Google Calendar) | "column" (Chronological) | "program" (Screen from Screenshot)
  const [viewMode, setViewMode] = useState<"calendar" | "column" | "program">("calendar");

  // Search filter for agenda (by appointment code, order number, or client name)
  const [agendaSearch, setAgendaSearch] = useState("");

  // Calendar navigation state
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Selected schedule detail modal
  const [selectedSchedule, setSelectedSchedule] = useState<ServiceItem | null>(null);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // -------------------------------------------------------------
  // PROGRAM SERVICE FORM STATE
  // -------------------------------------------------------------
  const [programSelectedOrder, setProgramSelectedOrder] = useState<OrderReady | null>(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [programServiceType, setProgramServiceType] = useState<
    "shop_installation" | "installation" | "delivery" | "pickup"
  >("installation");
  const [programDestination, setProgramDestination] = useState("");
  const [programDestCoords, setProgramDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [programDate, setProgramDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [programTimeSlot, setProgramTimeSlot] = useState("10:00");
  const [programDistanceKm, setProgramDistanceKm] = useState(0);
  const [programClientName, setProgramClientName] = useState("");
  const [programClientPhone, setProgramClientPhone] = useState("");
  const [programPaymentProofUrl, setProgramPaymentProofUrl] = useState("");
  const [programSubmitting, setProgramSubmitting] = useState(false);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [calculatedRoute, setCalculatedRoute] = useState<any>(null);

  // -------------------------------------------------------------
  // BLOCKED DAYS MANAGEMENT STATE
  // -------------------------------------------------------------
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockDate, setBlockDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [isBlockRutaBarrial, setIsBlockRutaBarrial] = useState(false);
  const [blockRutaTitle, setBlockRutaTitle] = useState("");
  const [blockRutaMeetingPoint, setBlockRutaMeetingPoint] = useState("");
  const [blockRutaTime, setBlockRutaTime] = useState("08:00");
  const [blockSaving, setBlockSaving] = useState(false);

  // -------------------------------------------------------------
  // APPOINTMENT EDIT MODAL STATE
  // -------------------------------------------------------------
  const [editingSchedule, setEditingSchedule] = useState<ServiceItem | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("10:00");
  const [editServiceType, setEditServiceType] = useState("installation");
  const [editDestination, setEditDestination] = useState("");
  const [editDistanceKm, setEditDistanceKm] = useState(0);
  const [editCostCRC, setEditCostCRC] = useState(0);
  const [editClientName, setEditClientName] = useState("");
  const [editClientPhone, setEditClientPhone] = useState("");
  const [editStatus, setEditStatus] = useState("CONFIRMED");
  const [editPaymentStatus, setEditPaymentStatus] = useState("PENDING");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Computed Transport Cost for Program view
  const computedTransportCost = useMemo(() => {
    if (programServiceType === "shop_installation") return 0;
    if (calculatedRoute && calculatedRoute.costs) {
      if (programServiceType === "installation") return calculatedRoute.costs.homeInstallationCostCRC || 0;
      if (programServiceType === "pickup") return calculatedRoute.costs.pickupCostCRC || 0;
      if (programServiceType === "delivery") return calculatedRoute.costs.deliveryCostCRC || 0;
    }
    const ratePerKm =
      programServiceType === "installation"
        ? 2000
        : programServiceType === "pickup"
        ? 1500
        : 800;
    const baseFee =
      programServiceType === "installation"
        ? 15000
        : programServiceType === "pickup"
        ? 10000
        : 3000;
    return baseFee + Math.round((programDistanceKm || 0) * ratePerKm);
  }, [programServiceType, programDistanceKm, calculatedRoute]);

  // Fetch Services & Ready Orders
  const fetchServices = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await fetch("/api/sys/services");
      const data = await res.json();
      if (res.ok && data.success) {
        setSchedules((prev) => {
          const prevStr = JSON.stringify(prev);
          const newStr = JSON.stringify(data.schedules || []);
          return prevStr === newStr ? prev : data.schedules || [];
        });
        setOrdersReady((prev) => {
          const prevStr = JSON.stringify(prev);
          const newStr = JSON.stringify(data.ordersReady || []);
          return prevStr === newStr ? prev : data.ordersReady || [];
        });
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Error fetching services agenda:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchServices(false);
  }, [fetchServices]);

  // Background Polling every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchServices(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchServices]);

  // Auto-fill client info when selecting order in Program view
  useEffect(() => {
    if (programSelectedOrder) {
      setProgramClientName(programSelectedOrder.customerName || "");
      setProgramClientPhone(programSelectedOrder.customerPhone || "");
      if (programSelectedOrder.shippingAddress) {
        setProgramDestination(programSelectedOrder.shippingAddress);
        calculateRoute(programSelectedOrder.shippingAddress);
      }
    }
  }, [programSelectedOrder]);

  // Calculate route using identical pipeline as /servicios
  const calculateRoute = async (dest: string, coords?: { lat: number; lng: number }) => {
    if (!dest.trim() && !coords) return;
    setIsCalculatingRoute(true);
    try {
      const body: any = {
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
        setCalculatedRoute(json.data);
        setProgramDistanceKm(json.data.distanceKm || 0);
        if (json.data.destination) {
          setProgramDestCoords({
            lat: json.data.destination.lat,
            lng: json.data.destination.lng,
          });
          if (json.data.destination.address) {
            setProgramDestination(json.data.destination.address);
          }
        }
      }
    } catch (err) {
      console.error("Route calculation error:", err);
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Map location select (pin click on Leaflet map)
  const handleMapLocationSelect = (lat: number, lng: number, addressName?: string) => {
    setProgramDestCoords({ lat, lng });
    const label = addressName || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    setProgramDestination(label);
    calculateRoute(label, { lat, lng });
  };

  // GPS Current Location handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFeedback({ type: "error", msg: "Geolocalización no disponible en este dispositivo" });
      return;
    }
    setIsCalculatingRoute(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        handleMapLocationSelect(lat, lng, "Ubicación actual de staff");
      },
      () => {
        setIsCalculatingRoute(false);
        setFeedback({ type: "error", msg: "No se pudo obtener la ubicación GPS" });
      },
      { timeout: 8000 }
    );
  };

  // Confirm / Toggle Transport Payment status
  const handleUpdatePaymentStatus = async (
    scheduleId: string,
    newStatus: "PAID" | "PENDING"
  ) => {
    setUpdatingPayment(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/sys/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: scheduleId,
          paymentStatus: newStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSchedules((prev) =>
          prev.map((s) => (s.id === scheduleId ? { ...s, paymentStatus: newStatus } : s))
        );
        if (selectedSchedule && selectedSchedule.id === scheduleId) {
          setSelectedSchedule({ ...selectedSchedule, paymentStatus: newStatus });
        }
        setFeedback({
          type: "success",
          msg:
            newStatus === "PAID"
              ? t.backdoorAgendaTransportPaymentSuccess
              : "Estado de pago actualizado a PENDIENTE",
        });
      } else {
        setFeedback({ type: "error", msg: data.error || "Error al actualizar estado de pago" });
      }
    } catch {
      setFeedback({ type: "error", msg: "Error de red al actualizar pago" });
    } finally {
      setUpdatingPayment(false);
    }
  };

  // Submit Programmed Service Form
  const handleProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programDate) {
      setFeedback({ type: "error", msg: "Debes seleccionar una fecha de servicio" });
      return;
    }

    // Validate staff time override strictly between 08:00 and 20:00
    if (programTimeSlot) {
      const parts = programTimeSlot.split(":");
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10) || 0;
      const totalMinutes = hours * 60 + minutes;
      if (totalMinutes < 480 || totalMinutes > 1200) {
        setFeedback({
          type: "error",
          msg: "El horario permitido de taller es estrictamente entre 8:00 AM y 8:00 PM (08:00 a 20:00).",
        });
        return;
      }
    }

    setProgramSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        orderId: programSelectedOrder?.id || null,
        serviceType: programServiceType,
        scheduledDate: programDate,
        timeSlot: programTimeSlot,
        destinationAddress:
          programServiceType === "shop_installation"
            ? "Calle 34, Pozos, Santa Ana, Costa Rica"
            : programDestination,
        distanceKm: programDistanceKm,
        costCRC: computedTransportCost,
        paymentProofUrl: programPaymentProofUrl || null,
        paymentStatus: computedTransportCost === 0 ? "PAID" : programPaymentProofUrl ? "PAID" : "PENDING",
        clientName: programClientName || programSelectedOrder?.customerName || null,
        clientPhone: programClientPhone || programSelectedOrder?.customerPhone || null,
      };

      const res = await fetch("/api/sys/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          msg: `Servicio programado exitosamente con código #${data.schedule?.appointmentCode || "SRV"}.`,
        });
        await fetchServices(true);
        setViewMode("calendar");
        // Reset form
        setProgramSelectedOrder(null);
        setProgramDestination("");
        setProgramDistanceKm(0);
        setCalculatedRoute(null);
        setProgramClientName("");
        setProgramClientPhone("");
        setProgramPaymentProofUrl("");
      } else {
        setFeedback({ type: "error", msg: data.error || "Error al programar servicio" });
      }
    } catch {
      setFeedback({ type: "error", msg: "Error de red al programar servicio" });
    } finally {
      setProgramSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // BLOCK / UNBLOCK DATE ACTIONS
  // -------------------------------------------------------------
  const existingBlockOnDate = useMemo(() => {
    return schedules.find(
      (s) =>
        s.date === blockDate &&
        (s.status === "BLOCKED" || s.serviceType === "ruta_barrial" || s.serviceType === "blocked_day")
    );
  }, [schedules, blockDate]);

  const handleSaveBlockDay = async () => {
    if (!blockDate) return;
    setBlockSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/sys/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate: blockDate,
          timeSlot: isBlockRutaBarrial && blockRutaTime ? blockRutaTime : "08:00",
          serviceType: isBlockRutaBarrial ? "ruta_barrial" : "blocked_day",
          status: "BLOCKED",
          isFullDay: true,
          destinationAddress: isBlockRutaBarrial
            ? blockRutaMeetingPoint.trim() || "Ruta BarrialCR"
            : "Día Bloqueado por Taller",
          clientName: isBlockRutaBarrial
            ? blockRutaTitle.trim() || "Ruta BarrialCR"
            : "Bloqueo Interno Taller",
          costCRC: 0,
          paymentStatus: "PAID",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          msg: isBlockRutaBarrial
            ? `Fecha ${blockDate} bloqueada por Ruta BarrialCR exitosamente (#${data.schedule?.appointmentCode || "BLK"}).`
            : `Fecha ${blockDate} bloqueada exitosamente (#${data.schedule?.appointmentCode || "BLK"}).`,
        });
        await fetchServices(true);
        setShowBlockModal(false);
      } else {
        setFeedback({ type: "error", msg: data.error || "Error al bloquear la fecha" });
      }
    } catch {
      setFeedback({ type: "error", msg: "Error de conexión al bloquear fecha" });
    } finally {
      setBlockSaving(false);
    }
  };

  const handleUnblockDay = async (scheduleId: string) => {
    setBlockSaving(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/sys/services?id=${scheduleId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: "success", msg: "Fecha desbloqueada exitosamente." });
        await fetchServices(true);
        setShowBlockModal(false);
        if (selectedSchedule?.id === scheduleId) {
          setSelectedSchedule(null);
        }
      } else {
        setFeedback({ type: "error", msg: data.error || "Error al desbloquear fecha" });
      }
    } catch {
      setFeedback({ type: "error", msg: "Error al desbloquear fecha" });
    } finally {
      setBlockSaving(false);
    }
  };

  // -------------------------------------------------------------
  // ELIMINATE / DELETE APPOINTMENT ACTION
  // -------------------------------------------------------------
  const handleDeleteAppointment = async (schedule: ServiceItem) => {
    const isBlock = schedule.status === "BLOCKED" || schedule.serviceType === "ruta_barrial" || schedule.serviceType === "blocked_day";
    const promptMsg = isBlock
      ? "¿Deseas desbloquear y eliminar este bloqueo de fecha?"
      : t.backdoorEliminateAppointmentConfirm;

    if (!window.confirm(promptMsg)) return;

    setFeedback(null);
    try {
      const res = await fetch(`/api/sys/services?id=${schedule.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          msg: isBlock
            ? "Bloqueo de fecha eliminado exitosamente."
            : t.backdoorEliminateAppointmentSuccess,
        });
        setSchedules((prev) => prev.filter((s) => s.id !== schedule.id));
        if (selectedSchedule?.id === schedule.id) {
          setSelectedSchedule(null);
        }
      } else {
        setFeedback({ type: "error", msg: data.error || "Error al eliminar la cita" });
      }
    } catch {
      setFeedback({ type: "error", msg: "Error de red al eliminar la cita" });
    }
  };

  // -------------------------------------------------------------
  // EDIT APPOINTMENT ACTION
  // -------------------------------------------------------------
  const handleOpenEditModal = (sch: ServiceItem) => {
    setEditingSchedule(sch);
    setEditDate(sch.date);
    setEditTime(sch.time);
    setEditServiceType(sch.serviceType);
    setEditDestination(sch.destinationAddress || "");
    setEditDistanceKm(sch.distanceKm || 0);
    setEditCostCRC(sch.costCRC || 0);
    setEditClientName(sch.clientName || "");
    setEditClientPhone(sch.clientPhone || "");
    setEditStatus(sch.status || "CONFIRMED");
    setEditPaymentStatus(sch.paymentStatus || "PENDING");
  };

  const handleSaveEditAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule) return;

    // Validate time strictly between 08:00 and 20:00
    if (editTime) {
      const parts = editTime.split(":");
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10) || 0;
      const totalMinutes = hours * 60 + minutes;
      if (totalMinutes < 480 || totalMinutes > 1200) {
        setFeedback({
          type: "error",
          msg: "El horario permitido de taller es estrictamente entre 8:00 AM y 8:00 PM (08:00 a 20:00).",
        });
        return;
      }
    }

    setEditSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/sys/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingSchedule.id,
          date: editDate,
          time: editTime,
          serviceType: editServiceType,
          destinationAddress: editDestination,
          distanceKm: editDistanceKm,
          costCRC: editCostCRC,
          clientName: editClientName,
          clientPhone: editClientPhone,
          status: editStatus,
          paymentStatus: editPaymentStatus,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ type: "success", msg: "Cita de servicio actualizada exitosamente." });
        setSchedules((prev) =>
          prev.map((s) => (s.id === editingSchedule.id ? { ...s, ...data.schedule } : s))
        );
        if (selectedSchedule?.id === editingSchedule.id) {
          setSelectedSchedule({ ...selectedSchedule, ...data.schedule });
        }
        setEditingSchedule(null);
      } else {
        setFeedback({ type: "error", msg: data.error || "Error al actualizar la cita" });
      }
    } catch {
      setFeedback({ type: "error", msg: "Error al actualizar la cita" });
    } finally {
      setEditSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // CALENDAR HELPER CALCULATIONS (Google Calendar Month View)
  // Requirement: Month and year formatted WITHOUT "de" (e.g. "Octubre 2026")
  // -------------------------------------------------------------
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = useMemo(() => {
    const d = new Date(year, month, 1);
    const raw = d.toLocaleDateString(lang === "es" ? "es-CR" : "en-US", {
      month: "long",
      year: "numeric",
    });
    return raw.replace(/\s+de\s+/gi, " ");
  }, [year, month, lang]);

  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayStr = new Date().toISOString().split("T")[0];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dNum);
      const yyyy = prevDate.getFullYear();
      const mm = String(prevDate.getMonth() + 1).padStart(2, "0");
      const dd = String(dNum).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      days.push({
        dateStr,
        dayNumber: dNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const curDate = new Date(year, month, d);
      const yyyy = curDate.getFullYear();
      const mm = String(curDate.getMonth() + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding to fill grid to 35 or 42 cells
    const remaining = 35 - days.length >= 0 ? 35 - days.length : 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const yyyy = nextDate.getFullYear();
      const mm = String(nextDate.getMonth() + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [year, month]);

  // Filtered schedules according to search query (code, order number, or client name)
  const filteredSchedules = useMemo(() => {
    if (!agendaSearch.trim()) return schedules;
    const q = agendaSearch.toLowerCase().trim();
    return schedules.filter((s) => {
      const code = (s.appointmentCode || "").toLowerCase();
      const orderNum = (s.order?.orderNumber || "").toLowerCase();
      const client = (s.clientName || "").toLowerCase();
      const dest = (s.destinationAddress || "").toLowerCase();
      return (
        code.includes(q) ||
        orderNum.includes(q) ||
        client.includes(q) ||
        dest.includes(q)
      );
    });
  }, [schedules, agendaSearch]);

  // Index schedules by date (YYYY-MM-DD)
  const schedulesByDate = useMemo(() => {
    const map = new Map<string, ServiceItem[]>();
    for (const item of filteredSchedules) {
      if (!map.has(item.date)) {
        map.set(item.date, []);
      }
      map.get(item.date)!.push(item);
    }
    return map;
  }, [filteredSchedules]);

  // Chronological sorting (closest to date first)
  const sortedChronological = useMemo(() => {
    return [...filteredSchedules].sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.timeMinutes - b.timeMinutes;
    });
  }, [filteredSchedules]);

  // Grouped chronological view
  const chronologicalGroups = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const weekLater = new Date();
    weekLater.setDate(weekLater.getDate() + 7);
    const weekLaterStr = weekLater.toISOString().split("T")[0];

    const past: ServiceItem[] = [];
    const todayItems: ServiceItem[] = [];
    const tomorrowItems: ServiceItem[] = [];
    const thisWeekItems: ServiceItem[] = [];
    const upcomingItems: ServiceItem[] = [];

    for (const sch of sortedChronological) {
      if (sch.date < todayStr) {
        past.push(sch);
      } else if (sch.date === todayStr) {
        todayItems.push(sch);
      } else if (sch.date === tomorrowStr) {
        tomorrowItems.push(sch);
      } else if (sch.date <= weekLaterStr) {
        thisWeekItems.push(sch);
      } else {
        upcomingItems.push(sch);
      }
    }

    return [
      { id: "today", label: "Hoy", items: todayItems, accent: "bg-emerald-500" },
      { id: "tomorrow", label: "Mañana", items: tomorrowItems, accent: "bg-blue-500" },
      { id: "thisWeek", label: "Próximos 7 Días", items: thisWeekItems, accent: "bg-purple-500" },
      { id: "upcoming", label: "Más Adelante", items: upcomingItems, accent: "bg-slate-500" },
      { id: "past", label: "Historial Pasado", items: past, accent: "bg-gray-400" },
    ].filter((g) => g.items.length > 0);
  }, [sortedChronological]);

  // Filtered orders ready for search in Program Service view
  const filteredOrdersReady = useMemo(() => {
    if (!orderSearchQuery.trim()) return ordersReady;
    const q = orderSearchQuery.toLowerCase().trim();
    return ordersReady.filter((o) => {
      const ordNum = (o.orderNumber || "").toLowerCase();
      const cust = (o.customerName || "").toLowerCase();
      const phone = (o.customerPhone || "").toLowerCase();
      return ordNum.includes(q) || cust.includes(q) || phone.includes(q);
    });
  }, [ordersReady, orderSearchQuery]);

  return (
    <div className="space-y-6">
      {/* Tab Header & Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <CalendarIcon className="w-4 h-4 text-[#C02030]" />
            </div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              {t.backdoorAgendaTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t.backdoorAgendaSubtitle}
          </p>
        </div>

        {/* View Switcher, Block Days CTA & Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Buttons */}
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                viewMode === "calendar"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-[#C02030]" />
              <span>{t.backdoorAgendaCalendarView}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("column")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                viewMode === "column"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.backdoorAgendaChronologicalView}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("program")}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                viewMode === "program"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.backdoorAgendaScheduleServiceBtn}</span>
            </button>
          </div>

          {/* Block Days Button */}
          <button
            type="button"
            onClick={() => setShowBlockModal(true)}
            className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{t.backdoorBlockDaysBtn}</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchServices(false)}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 transition"
            title="Refrescar en tiempo real"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2 animate-fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="flex-1">{feedback.msg}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search Bar for Appointments (Appointment Code, Order Number, Client) */}
      {(viewMode === "calendar" || viewMode === "column") && (
        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={agendaSearch}
              onChange={(e) => setAgendaSearch(e.target.value)}
              placeholder={t.backdoorSearchByCodeOrOrder}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 transition"
            />
            {agendaSearch && (
              <button
                type="button"
                onClick={() => setAgendaSearch("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-500 shrink-0 px-2">
            {filteredSchedules.length} / {schedules.length} citas
          </span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. GOOGLE CALENDAR MONTH VIEW */}
      {/* ========================================================= */}
      {viewMode === "calendar" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
          {/* Calendar Header with Navigation (WITHOUT 'de' between month and year) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-black text-slate-900 capitalize tracking-tight">
                {monthName}
              </h3>
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {filteredSchedules.length} {lang === "es" ? "citas activas" : "active appointments"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Hoy
              </button>
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                  className="p-1.5 text-slate-600 hover:bg-slate-50 transition"
                  title="Mes anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                  className="p-1.5 text-slate-600 hover:bg-slate-50 transition"
                  title="Mes siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Days Grid */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            {/* Weekday Labels (Sun to Sat) */}
            <div className="grid grid-cols-7 bg-slate-100 text-slate-700 border-b border-slate-200 text-center font-extrabold text-[11px] py-2">
              <span>{lang === "es" ? "DOM" : "SUN"}</span>
              <span>{lang === "es" ? "LUN" : "MON"}</span>
              <span>{lang === "es" ? "MAR" : "TUE"}</span>
              <span>{lang === "es" ? "MIÉ" : "WED"}</span>
              <span>{lang === "es" ? "JUE" : "THU"}</span>
              <span>{lang === "es" ? "VIE" : "FRI"}</span>
              <span>{lang === "es" ? "SÁB" : "SAT"}</span>
            </div>

            {/* Day Cells Grid */}
            <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-px">
              {calendarDays.map((cell, idx) => {
                const daySchedules = schedulesByDate.get(cell.dateStr) || [];
                const hasBlock = daySchedules.some(
                  (s) => s.status === "BLOCKED" || s.serviceType === "ruta_barrial" || s.serviceType === "blocked_day"
                );

                return (
                  <div
                    key={`${cell.dateStr}-${idx}`}
                    className={`min-h-[110px] p-1.5 flex flex-col justify-between transition-colors ${
                      cell.isCurrentMonth
                        ? hasBlock
                          ? "bg-amber-50/40 hover:bg-amber-50/60"
                          : "bg-white hover:bg-slate-50/70"
                        : "bg-slate-50/70 text-slate-400"
                    }`}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between pb-1">
                      <span
                        className={`text-xs font-black inline-flex items-center justify-center w-6 h-6 rounded-full ${
                          cell.isToday
                            ? "bg-[#C02030] text-white"
                            : cell.isCurrentMonth
                            ? "text-slate-800"
                            : "text-slate-400"
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                      {daySchedules.length > 0 && (
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {daySchedules.length}
                        </span>
                      )}
                    </div>

                    {/* Event Chips Container (Google Calendar style) */}
                    <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px]">
                      {daySchedules.map((sch) => {
                        const meta =
                          SERVICE_META[sch.serviceType] || SERVICE_META.installation;
                        const isPaid = sch.paymentStatus === "PAID";
                        const isBlocked = sch.status === "BLOCKED" || sch.serviceType === "ruta_barrial" || sch.serviceType === "blocked_day";
                        const Icon = meta.icon;

                        return (
                          <button
                            key={sch.id}
                            type="button"
                            onClick={() => setSelectedSchedule(sch)}
                            className={`w-full text-left p-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 truncate shadow-xs transition hover:brightness-95 ${
                              isBlocked
                                ? sch.serviceType === "ruta_barrial"
                                  ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold"
                                  : "bg-rose-100 text-rose-900 border-rose-300 font-extrabold"
                                : meta.color
                            }`}
                            title={`${sch.appointmentCode || ""} | ${sch.time} - ${sch.clientName || "Cliente"} (${meta.labelEs})`}
                          >
                            {sch.appointmentCode && (
                              <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-black/10 shrink-0">
                                {sch.appointmentCode}
                              </span>
                            )}
                            <Icon className="w-3 h-3 shrink-0" />
                            <span className="truncate flex-1">
                              {sch.serviceType === "ruta_barrial"
                                ? "Ruta BarrialCR"
                                : sch.order?.orderNumber
                                ? `#${sch.order.orderNumber}`
                                : sch.clientName || meta.labelEs}
                            </span>
                            {!isBlocked && (
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  isPaid ? "bg-emerald-600" : "bg-amber-500"
                                }`}
                                title={isPaid ? "Pago confirmado" : "Pago pendiente"}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. CHRONOLOGICAL COLUMN VIEW (Sorted Closest to Date) */}
      {/* ========================================================= */}
      {viewMode === "column" && (
        <div className="space-y-6">
          {chronologicalGroups.map((grp) => (
            <div key={grp.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${grp.accent}`} />
                <h3 className="text-xs font-black tracking-wider uppercase text-slate-800">
                  {grp.label} ({grp.items.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {grp.items.map((sch) => {
                  const meta =
                    SERVICE_META[sch.serviceType] || SERVICE_META.installation;
                  const isPaid = sch.paymentStatus === "PAID";
                  const isBlocked = sch.status === "BLOCKED" || sch.serviceType === "ruta_barrial" || sch.serviceType === "blocked_day";
                  const Icon = meta.icon;

                  return (
                    <div
                      key={sch.id}
                      className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between gap-3 hover:border-slate-300 transition"
                    >
                      <div className="space-y-2">
                        {/* Top Badge, Appointment Code & Date */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isBlocked
                                ? sch.serviceType === "ruta_barrial"
                                  ? "bg-amber-600 text-white"
                                  : "bg-rose-600 text-white"
                                : meta.badgeColor
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>
                              {sch.serviceType === "ruta_barrial"
                                ? "Ruta BarrialCR"
                                : lang === "es"
                                ? meta.labelEs
                                : meta.labelEn}
                            </span>
                          </span>

                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{sch.date}</span>
                            <span>@{sch.time}</span>
                          </div>
                        </div>

                        {/* Appointment Code badge */}
                        {sch.appointmentCode && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                              #{sch.appointmentCode}
                            </span>
                            {sch.order && (
                              <span className="text-[10px] font-mono font-bold text-[#C02030]">
                                #{sch.order.orderNumber}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Client Name & Phone */}
                        <div>
                          <h4 className="text-xs font-black text-slate-900 line-clamp-1">
                            {sch.serviceType === "ruta_barrial"
                              ? "Ruta BarrialCR (Rides - Día Bloqueado)"
                              : sch.clientName || sch.order?.customerName || "Cliente ZxZ"}
                          </h4>
                          {sch.clientPhone && (
                            <a
                              href={`tel:${sch.clientPhone}`}
                              className="text-[11px] text-slate-500 hover:text-slate-900 flex items-center gap-1 mt-0.5"
                            >
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{sch.clientPhone}</span>
                            </a>
                          )}
                        </div>

                        {/* Address */}
                        {sch.destinationAddress && (
                          <div className="flex items-start gap-1.5 text-[11px] text-slate-600 p-2 rounded-xl bg-slate-50 border border-slate-150">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{sch.destinationAddress}</span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Cost & Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Costo
                          </span>
                          <span className="font-mono font-extrabold text-xs text-slate-900">
                            {formatCRC(sch.costCRC)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedSchedule(sch)}
                            className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition"
                          >
                            Detalles
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(sch)}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                            title="Editar Cita"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAppointment(sch)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar Cita"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredSchedules.length === 0 && (
            <div className="p-8 rounded-3xl bg-white border border-slate-200 text-center space-y-2">
              <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">
                No hay servicios de transporte o instalación programados.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. PROGRAM SERVICE SCREEN */}
      {/* Requirement: Search bar for orders, identical location calculation, and staff time override (8am to 8pm) */}
      {/* ========================================================= */}
      {viewMode === "program" && (
        <form onSubmit={handleProgramSubmit} className="space-y-6">
          {/* Order Search Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Búsqueda de Orden para el Servicio
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Busca la orden confirmada por número (#COT-... o #ZXZ-...) o cliente.
                  </p>
                </div>
              </div>

              {programSelectedOrder && (
                <button
                  type="button"
                  onClick={() => setProgramSelectedOrder(null)}
                  className="px-3 py-1 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  {t.backdoorChangeOrderBtn}
                </button>
              )}
            </div>

            {/* If order is selected: Show clean summary card */}
            {programSelectedOrder ? (
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black text-red-400">
                      #{programSelectedOrder.orderNumber}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                      {programSelectedOrder.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-extrabold">
                    {programSelectedOrder.customerName || "Cliente ZxZ"}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-300">
                    {programSelectedOrder.customerPhone && (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {programSelectedOrder.customerPhone}
                      </span>
                    )}
                    {programSelectedOrder.shippingAddress && (
                      <span className="flex items-center gap-1 truncate max-w-xs">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {programSelectedOrder.shippingAddress}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Total de Orden
                  </span>
                  <span className="text-base font-mono font-black text-white">
                    {formatCRC(programSelectedOrder.totalCRC)}
                  </span>
                </div>
              </div>
            ) : (
              /* Search input & dropdown results */
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder={t.backdoorSearchOrderPlaceholder}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-slate-900 transition"
                  />
                </div>

                <div className="max-h-52 overflow-y-auto space-y-2">
                  {filteredOrdersReady.map((ord) => (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => setProgramSelectedOrder(ord)}
                      className="w-full p-3 rounded-2xl border border-slate-200 bg-gray-50/70 hover:bg-white hover:border-slate-900 text-left transition flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[#C02030] block">
                          #{ord.orderNumber}
                        </span>
                        <p className="text-xs font-bold text-slate-900">
                          {ord.customerName || "Cliente"}
                        </p>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {ord.customerPhone || "Sin teléfono"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-900 block">
                          {formatCRC(ord.totalCRC)}
                        </span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                          Elegir Orden
                        </span>
                      </div>
                    </button>
                  ))}

                  {filteredOrdersReady.length === 0 && (
                    <p className="text-xs text-slate-500 p-3 text-center bg-slate-50 rounded-xl">
                      No se encontraron órdenes con los términos de búsqueda. Puedes continuar programando el servicio ingresando los datos del cliente manualmente.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4 Service Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: Solo Instalación */}
            <button
              type="button"
              onClick={() => {
                setProgramServiceType("shop_installation");
                setProgramDistanceKm(0);
              }}
              className={`p-4 rounded-3xl border text-left transition-all flex flex-col justify-between min-h-[140px] ${
                programServiceType === "shop_installation"
                  ? "bg-white border-[#C02030] shadow-md ring-2 ring-[#C02030]/20"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                  <Warehouse className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">
                    Solo Instalación (En Taller)
                  </h4>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                    Cliente trae su vehículo al taller en Pozos de Santa Ana. Sin costo de traslado.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                <span className="text-slate-400 font-medium">Traslado:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Sin Traslado (₡0)
                </span>
              </div>
            </button>

            {/* Card 2: Instalación a Domicilio */}
            <button
              type="button"
              onClick={() => setProgramServiceType("installation")}
              className={`p-4 rounded-3xl border text-left transition-all flex flex-col justify-between min-h-[140px] ${
                programServiceType === "installation"
                  ? "bg-white border-[#C02030] shadow-md ring-2 ring-[#C02030]/20"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">
                    Instalación a Domicilio
                  </h4>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                    Taller móvil equipado con herramientas para instalar en el garage del cliente.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                <span className="text-slate-400 font-medium">Tarifa por km:</span>
                <span className="font-mono font-bold text-slate-900">₡2 000/km</span>
              </div>
            </button>

            {/* Card 3: Entrega / Delivery */}
            <button
              type="button"
              onClick={() => setProgramServiceType("delivery")}
              className={`p-4 rounded-3xl border text-left transition-all flex flex-col justify-between min-h-[140px] ${
                programServiceType === "delivery"
                  ? "bg-white border-[#C02030] shadow-md ring-2 ring-[#C02030]/20"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">
                    Entrega / Delivery
                  </h4>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                    Envío seguro de repuestos y accesorios directo al cliente.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                <span className="text-slate-400 font-medium">Tarifa por km:</span>
                <span className="font-mono font-bold text-slate-900">₡800/km</span>
              </div>
            </button>

            {/* Card 4: Pick-up de Vehículo */}
            <button
              type="button"
              onClick={() => setProgramServiceType("pickup")}
              className={`p-4 rounded-3xl border text-left transition-all flex flex-col justify-between min-h-[140px] ${
                programServiceType === "pickup"
                  ? "bg-white border-[#C02030] shadow-md ring-2 ring-[#C02030]/20"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">
                    Pick-up de Vehículo
                  </h4>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                    Recolección especializada de SxS o UTV en remolque para traer al taller.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                <span className="text-slate-400 font-medium">Tarifa por km:</span>
                <span className="font-mono font-bold text-slate-900">₡1 500/km</span>
              </div>
            </button>
          </div>

          {/* Bottom Grid: Left Controls & Right Map (Identical system to /servicios) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Controls */}
            <div className="space-y-4">
              {/* Origin Card */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-red-600 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    TALLER ZXZ MODS (ORIGEN)
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    BASE
                  </span>
                </div>
                <p className="text-xs font-extrabold text-slate-900">
                  Calle 34, Pozos, Santa Ana, Costa Rica
                </p>
              </div>

              {/* Destination Input & Shortcuts (Identical to /servicios) */}
              {programServiceType !== "shop_installation" && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase font-bold text-slate-700">
                      DIRECCIÓN O LUGAR DE DESTINO
                    </label>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      className="text-[10px] font-bold text-[#C02030] hover:underline flex items-center gap-1"
                    >
                      <LocateFixed className="w-3 h-3" />
                      <span>{t.useCurrentLocationBtn}</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={programDestination}
                      onChange={(e) => setProgramDestination(e.target.value)}
                      placeholder="Ingresa cantón, distrito o punto exacto (ej. Escazú, Lindora...)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 pr-20 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                    <button
                      type="button"
                      disabled={isCalculatingRoute || !programDestination.trim()}
                      onClick={() => calculateRoute(programDestination)}
                      className="absolute right-1.5 top-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-800 transition disabled:opacity-40"
                    >
                      {isCalculatingRoute ? "..." : "Calcular"}
                    </button>
                  </div>

                  {/* Shortcuts */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Accesos rápidos de ubicación:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_SHORTCUTS.map((sc) => (
                        <button
                          key={sc}
                          type="button"
                          onClick={() => {
                            setProgramDestination(sc);
                            calculateRoute(sc);
                          }}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        >
                          {sc}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Distance calculation feedback */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="font-bold text-slate-600">Distancia calculada:</span>
                    <span className="font-mono font-extrabold text-slate-900">
                      {programDistanceKm} km
                    </span>
                  </div>
                </div>
              )}

              {/* Date & Time Slot (Staff override 8am to 8pm) */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-slate-700 block">
                    FECHA Y HORARIO DEL SERVICIO
                  </label>
                  <span className="text-[10px] font-bold text-[#C02030] bg-red-50 px-2 py-0.5 rounded-full">
                    Override Staff (8:00 AM - 8:00 PM)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Fecha:
                    </label>
                    <input
                      type="date"
                      required
                      value={programDate}
                      onChange={(e) => setProgramDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-bold focus:outline-none focus:border-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Horario (08:00 a 20:00):
                    </label>
                    <div className="space-y-1.5">
                      <select
                        value={programTimeSlot}
                        onChange={(e) => setProgramTimeSlot(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-bold focus:outline-none focus:border-slate-900"
                      >
                        {TIME_SLOTS_8_TO_8.map((slot) => {
                          const parts = slot.split(":");
                          const h = parseInt(parts[0], 10);
                          const m = parts[1];
                          const period = h >= 12 ? "PM" : "AM";
                          const h12 = h % 12 === 0 ? 12 : h % 12;
                          const label = `${h12}:${m} ${period} (${slot})`;
                          return (
                            <option key={slot} value={slot}>
                              {label}
                            </option>
                          );
                        })}
                      </select>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">Hora exacta:</span>
                        <input
                          type="time"
                          min="08:00"
                          max="20:00"
                          value={programTimeSlot}
                          onChange={(e) => setProgramTimeSlot(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs font-mono font-bold text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Contact & Payment Info */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-700">
                    CONTACTO & PAGO DE TRANSPORTE
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Total: {formatCRC(computedTransportCost)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Nombre Cliente:
                    </label>
                    <input
                      type="text"
                      value={programClientName}
                      onChange={(e) => setProgramClientName(e.target.value)}
                      placeholder="Nombre completo"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Teléfono:
                    </label>
                    <input
                      type="text"
                      value={programClientPhone}
                      onChange={(e) => setProgramClientPhone(e.target.value)}
                      placeholder="8888-8888"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-mono focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Comprobante de Pago Transporte (URL / Comprobante):
                  </label>
                  <input
                    type="text"
                    value={programPaymentProofUrl}
                    onChange={(e) => setProgramPaymentProofUrl(e.target.value)}
                    placeholder="URL de imagen o comprobante de SINPE Móvil / Transferencia"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 text-xs focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setViewMode("calendar")}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={programSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {programSubmitting ? "Agendando..." : "Confirmar y Agendar Servicio"}
                  </span>
                </button>
              </div>
            </div>

            {/* Right: Interactive Leaflet Map (Identical to /servicios) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-red-600" />
                  <span>Calle 34, Pozos (Origen)</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500">
                    {programServiceType === "shop_installation"
                      ? "En Taller"
                      : programDestination || "Destino"}
                  </span>
                </div>

                <div className="bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5">
                  <Navigation className="w-3 h-3 text-red-400" />
                  <span>{programDistanceKm} km</span>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-200">
                <LeafletInteractiveMap
                  originLat={9.9482}
                  originLng={-84.1967}
                  originAddress="Calle 34, Pozos, Santa Ana, Costa Rica"
                  destinationLat={programDestCoords?.lat}
                  destinationLng={programDestCoords?.lng}
                  destinationName={
                    programServiceType === "shop_installation"
                      ? "Calle 34, Pozos, Santa Ana, Costa Rica"
                      : programDestination || "Santa Ana, San José"
                  }
                  distanceKm={programDistanceKm}
                  durationMinutes={calculatedRoute?.durationMinutes || Math.round(programDistanceKm * 1.8)}
                  isCalculating={isCalculatingRoute}
                  routeGeometry={calculatedRoute?.geometry}
                  isShopInstallation={programServiceType === "shop_installation"}
                  onLocationSelect={handleMapLocationSelect}
                />
              </div>

              <p className="text-[10px] text-slate-400 text-center">
                Haz clic en cualquier punto del mapa para colocar el pin de destino y calcular la ruta en tiempo real.
              </p>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* 4. DETAIL MODAL (With Edit & Delete options) */}
      {/* ========================================================= */}
      {selectedSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-[#C02030]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {selectedSchedule.appointmentCode && (
                      <span className="text-xs font-mono font-extrabold px-2 py-0.5 rounded-md bg-slate-900 text-white">
                        #{selectedSchedule.appointmentCode}
                      </span>
                    )}
                    {selectedSchedule.order?.orderNumber && (
                      <span className="text-xs font-mono font-bold text-[#C02030]">
                        #{selectedSchedule.order.orderNumber}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mt-1">
                    {selectedSchedule.serviceType === "ruta_barrial"
                      ? "Ruta BarrialCR (Rides - Bloqueo de Día)"
                      : selectedSchedule.clientName || "Servicio Programado"}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSchedule(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-3 text-xs">
              {/* Type, Date & Time */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Modalidad
                  </span>
                  <span className="font-bold text-slate-900">
                    {SERVICE_META[selectedSchedule.serviceType]?.labelEs ||
                      selectedSchedule.serviceType}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Fecha & Hora
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedSchedule.date} @ {selectedSchedule.time}
                  </span>
                </div>
              </div>

              {/* Destination */}
              {selectedSchedule.destinationAddress && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Destino / Dirección
                  </span>
                  <p className="font-medium text-slate-800">
                    {selectedSchedule.destinationAddress}
                  </p>
                  {selectedSchedule.distanceKm ? (
                    <span className="text-[10px] font-mono text-slate-500 block">
                      Distancia: {selectedSchedule.distanceKm} km desde Calle 34 Pozos
                    </span>
                  ) : null}
                </div>
              )}

              {/* Phone & Order details */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Teléfono de Contacto
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedSchedule.clientPhone || "No especificado"}
                  </span>
                </div>
                {selectedSchedule.clientPhone && (
                  <a
                    href={`tel:${selectedSchedule.clientPhone}`}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 hover:bg-slate-800 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Llamar</span>
                  </a>
                )}
              </div>

              {/* Payment Section */}
              <div className="p-3 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Costo de Servicio / Traslado
                    </span>
                    <span className="font-mono font-black text-sm text-slate-900">
                      {formatCRC(selectedSchedule.costCRC)}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      selectedSchedule.paymentStatus === "PAID"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        selectedSchedule.paymentStatus === "PAID"
                          ? "bg-emerald-600"
                          : "bg-amber-500"
                      }`}
                    />
                    <span>
                      {selectedSchedule.paymentStatus === "PAID"
                        ? "PAGO CONFIRMADO"
                        : "PAGO PENDIENTE"}
                    </span>
                  </span>
                </div>

                {/* Pickup Gasoline Cost Details */}
                {(selectedSchedule.serviceType === "pickup" || (selectedSchedule.distanceKm || 0) > 0) && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-[11px]">
                      <Fuel className="w-3.5 h-3.5 text-[#F05526]" />
                      <span>Costo de Gasolina Retiro (₡500/km):</span>
                      <span className="font-mono text-slate-500">
                        ({selectedSchedule.distanceKm || 0} km)
                      </span>
                    </div>
                    <span className="font-mono font-bold text-[#D93412] bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200 text-xs shadow-2xs">
                      ₡{Math.round((selectedSchedule.distanceKm || 0) * 500).toLocaleString()}
                    </span>
                  </div>
                )}

                {selectedSchedule.paymentProofUrl && (
                  <a
                    href={selectedSchedule.paymentProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-bold"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ver Comprobante de Transferencia</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    Cambiar estado de pago:
                  </span>
                  <button
                    type="button"
                    disabled={updatingPayment}
                    onClick={() =>
                      handleUpdatePaymentStatus(
                        selectedSchedule.id,
                        selectedSchedule.paymentStatus === "PAID" ? "PENDING" : "PAID"
                      )
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 ${
                      selectedSchedule.paymentStatus === "PAID"
                        ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {selectedSchedule.paymentStatus === "PAID"
                        ? "Marcar como Pendiente"
                        : "Confirmar Pago de Transporte"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions: Edit, Delete, Close */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDeleteAppointment(selectedSchedule)}
                className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.backdoorEliminateAppointmentBtn}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEditModal(selectedSchedule);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Editar Cita</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSchedule(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. BLOCKED DAYS MANAGEMENT MODAL */}
      {/* ========================================================= */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {t.backdoorBlockDaysTitle}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {t.backdoorBlockDaysSubtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBlockModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Date selection */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Fecha a Bloquear:
                </label>
                <input
                  type="date"
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none focus:border-slate-900"
                />
              </div>

              {/* Status of this date if already blocked */}
              {existingBlockOnDate && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Fecha actualmente bloqueada</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    {existingBlockOnDate.serviceType === "ruta_barrial"
                      ? "Bloqueado por: Ruta BarrialCR (Rides)"
                      : "Bloqueado por: Taller ZxZ"}
                  </p>
                  <button
                    type="button"
                    disabled={blockSaving}
                    onClick={() => handleUnblockDay(existingBlockOnDate.id)}
                    className="w-full py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{t.backdoorUnblockBtn}</span>
                  </button>
                </div>
              )}

              {/* Toggles */}
              {!existingBlockOnDate && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  {/* Toggle 1: Block Full Day */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {t.backdoorBlockDayToggle}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Inhabilita agendar citas este día en /servicios
                      </span>
                    </div>
                    <span className="font-mono font-bold text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                      Día Completo
                    </span>
                  </div>

                  {/* Toggle 2: Ruta BarrialCR */}
                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                    <div className="pr-3">
                      <span className="font-bold text-slate-900 block">
                        {t.backdoorRutaBarrialToggle}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Los clientes verán la etiqueta &quot;Ruta BarrialCR&quot; en el calendario de /servicios
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={isBlockRutaBarrial}
                        onChange={(e) => setIsBlockRutaBarrial(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {/* Optional BarrialCR Details */}
                  {isBlockRutaBarrial && (
                    <div className="pt-3 border-t border-amber-200/60 space-y-2.5 animate-in fade-in">
                      <div>
                        <label className="text-[11px] font-bold text-slate-800 block mb-1">
                          Nombre / Destino de la Ruta (Visible en /barrialcr):
                        </label>
                        <input
                          type="text"
                          value={blockRutaTitle}
                          onChange={(e) => setBlockRutaTitle(e.target.value)}
                          placeholder="Ej: Ruta Cerro de la Muerte / Volcán Irazú"
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-bold text-slate-800 block mb-1">
                            Punto de Encuentro:
                          </label>
                          <input
                            type="text"
                            value={blockRutaMeetingPoint}
                            onChange={(e) => setBlockRutaMeetingPoint(e.target.value)}
                            placeholder="Ej: Gasolinera El Guarco"
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-800 block mb-1">
                            Hora de Salida:
                          </label>
                          <input
                            type="time"
                            value={blockRutaTime}
                            onChange={(e) => setBlockRutaTime(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cerrar
              </button>
              {!existingBlockOnDate && (
                <button
                  type="button"
                  disabled={blockSaving}
                  onClick={handleSaveBlockDay}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{blockSaving ? "Guardando..." : t.backdoorSaveBlockBtn}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. EDIT APPOINTMENT MODAL */}
      {/* ========================================================= */}
      {editingSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEditAppointment}
            className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                  <Edit className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {t.backdoorEditAppointmentTitle}
                  </h3>
                  <p className="text-[11px] font-mono font-bold text-slate-500">
                    #{editingSchedule.appointmentCode || editingSchedule.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSchedule(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Fecha:
                  </label>
                  <input
                    type="date"
                    required
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-bold focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Hora (08:00 - 20:00):
                  </label>
                  <input
                    type="time"
                    min="08:00"
                    max="20:00"
                    required
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Service Type */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Modalidad de Servicio:
                </label>
                <select
                  value={editServiceType}
                  onChange={(e) => setEditServiceType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-bold focus:outline-none focus:border-slate-900"
                >
                  <option value="shop_installation">Solo Instalación (En Taller)</option>
                  <option value="installation">Instalación a Domicilio</option>
                  <option value="delivery">Entrega / Delivery</option>
                  <option value="pickup">Pick-up de Vehículo</option>
                  <option value="ruta_barrial">Ruta BarrialCR (Rides - Bloqueado)</option>
                  <option value="blocked_day">Día Bloqueado (Taller)</option>
                </select>
              </div>

              {/* Destination Address */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Dirección de Destino:
                </label>
                <input
                  type="text"
                  value={editDestination}
                  onChange={(e) => setEditDestination(e.target.value)}
                  placeholder="Dirección completa"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              {/* Client Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Cliente:
                  </label>
                  <input
                    type="text"
                    value={editClientName}
                    onChange={(e) => setEditClientName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Teléfono:
                  </label>
                  <input
                    type="text"
                    value={editClientPhone}
                    onChange={(e) => setEditClientPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Cost & Payment Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Costo Traslado (₡):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editCostCRC}
                    onChange={(e) => setEditCostCRC(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-mono font-bold focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Estado de Pago:
                  </label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-bold focus:outline-none focus:border-slate-900"
                  >
                    <option value="PAID">PAGADO (Confirmado)</option>
                    <option value="PENDING">PENDIENTE</option>
                  </select>
                </div>
              </div>

              {/* Service Status */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Estado de Cita:
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 font-bold focus:outline-none focus:border-slate-900"
                >
                  <option value="CONFIRMED">CONFIRMADO</option>
                  <option value="COMPLETED">COMPLETADO</option>
                  <option value="CANCELLED">CANCELADO</option>
                  <option value="BLOCKED">BLOQUEADO</option>
                </select>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingSchedule(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={editSubmitting}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editSubmitting ? "Guardando..." : t.backdoorSaveAppointmentBtn}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
