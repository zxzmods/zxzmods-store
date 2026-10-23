import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStealthSession } from "@/lib/stealthAuth";
import { liftExpiredRejectedServiceSchedules } from "@/lib/serviceSchedules";

// Operating window: 8:00 AM (480 min) to 8:00 PM (1200 min)
const OPERATING_START_MIN = 480;  // 08:00
const OPERATING_END_MIN = 1200;   // 20:00
const DEFAULT_PREP_BUFFER = 15;   // 15 min loading / package prep
const DEFAULT_HANDOVER_BUFFER = 15; // 15 min on-site unloading / handover

/**
 * Format minutes from midnight to "HH:mm" (24h) and 12h display
 */
function formatMinutesToTime(min: number): { time24: string; time12: string } {
  const normalized = Math.max(0, Math.min(1439, Math.round(min)));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const time24 = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  const time12 = `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
  
  return { time24, time12 };
}

/**
 * Parses "HH:mm" string into minutes from midnight (0 - 1440)
 */
function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.trim().split(":");
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * GET /api/logistics/availability
 * Query parameters:
 *  - date: string (YYYY-MM-DD, required)
 *  - travelMinutes: number (one-way trip time from OSRM, default 0)
 *  - serviceType: "delivery" | "installation" | "pickup" | "shop_installation"
 *  - month: optional YYYY-MM to return month-level busy status
 */
export async function GET(request: Request) {
  try {
    // Automatically lift reservations for any service payment rejected >48h ago
    await liftExpiredRejectedServiceSchedules().catch((err) => {
      console.warn("Could not lift expired rejected schedules in availability:", err);
    });

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const travelMinutesParam = searchParams.get("travelMinutes");
    const serviceType = searchParams.get("serviceType") || "delivery";
    const monthParam = searchParams.get("month");

    // Monthly summary query for 2D calendar highlighting
    if (monthParam) {
      const schedules = await prisma.serviceSchedule.findMany({
        where: {
          date: { startsWith: monthParam },
          status: { not: "CANCELLED" },
        },
      });

      const daySummary: Record<string, { totalDispatches: number; hasFullDayBlock: boolean; isRutaBarrial?: boolean; blockReason?: string }> = {};
      for (const item of schedules) {
        if (!daySummary[item.date]) {
          daySummary[item.date] = { totalDispatches: 0, hasFullDayBlock: false };
        }
        daySummary[item.date].totalDispatches += 1;
        const isRuta = item.serviceType === "ruta_barrial" || item.destinationAddress?.includes("Ruta BarrialCR");
        const isBlocked = item.status === "BLOCKED" || item.serviceType === "blocked_day";
        if (item.isFullDay || item.serviceType === "installation" || isRuta || isBlocked) {
          daySummary[item.date].hasFullDayBlock = true;
          if (isRuta) {
            daySummary[item.date].isRutaBarrial = true;
            daySummary[item.date].blockReason = "Ruta BarrialCR";
          } else if (isBlocked) {
            daySummary[item.date].blockReason = "Bloqueado";
          } else {
            daySummary[item.date].blockReason = "Instalación";
          }
        }
      }

      return NextResponse.json({
        success: true,
        month: monthParam,
        daySummary,
      });
    }

    if (!dateParam) {
      return NextResponse.json(
        { success: false, error: "Parámetro 'date' es requerido (formato YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const stealthAuth = await requireStealthSession();
    const isStaff = stealthAuth.authorized && (stealthAuth.session.role === "STAFF" || stealthAuth.session.role === "MASTER");

    const schedDateObj = new Date(dateParam + "T00:00:00");
    const now = new Date();
    const todayDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((schedDateObj.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24));

    if (!isStaff && diffDays < 3) {
      const blockedSlotList = [];
      const reasonEs = "Las citas de servicio requieren un mínimo de 48 horas de anticipación (excluyendo hoy y los próximos 2 días).";
      const reasonEn = "Service appointments require at least 48 hours advance notice (excluding today and next 2 days).";

      for (let min = OPERATING_START_MIN; min <= OPERATING_END_MIN; min += 30) {
        const { time24, time12 } = formatMinutesToTime(min);
        blockedSlotList.push({
          time: time24,
          time12,
          timeMinutes: min,
          available: false,
          reason: reasonEs,
          reasonEn: reasonEn,
        });
      }

      return NextResponse.json({
        success: true,
        date: dateParam,
        isFullDayBlocked: true,
        fullDayReason: reasonEs,
        fullDayReasonEn: reasonEn,
        blockedRanges: [
          {
            start: "08:00",
            end: "20:00",
            startMin: OPERATING_START_MIN,
            endMin: OPERATING_END_MIN,
            label: "Anticipación Requerida (48h)",
          },
        ],
        slots: blockedSlotList,
      });
    }

    const travelMinutes = Math.max(0, parseInt(travelMinutesParam || "0", 10) || 0);

    // Fetch existing confirmed schedules for this date
    const existingSchedules = await prisma.serviceSchedule.findMany({
      where: {
        date: dateParam,
        status: { not: "CANCELLED" },
      },
      orderBy: { blockedStartMin: "asc" },
    });

    // Check if the whole day is blocked:
    // A home installation, Ruta BarrialCR, or workshop block on this day blocks all dispatches
    const fullDaySchedule = existingSchedules.find(
      (s) =>
        s.isFullDay ||
        s.serviceType === "installation" ||
        s.serviceType === "ruta_barrial" ||
        s.serviceType === "blocked_day" ||
        s.status === "BLOCKED"
    );

    if (fullDaySchedule) {
      const isRutaBarrial =
        fullDaySchedule.serviceType === "ruta_barrial" ||
        Boolean(fullDaySchedule.destinationAddress?.includes("Ruta BarrialCR"));
      const isBlocked =
        fullDaySchedule.serviceType === "blocked_day" || fullDaySchedule.status === "BLOCKED";

      const reasonEs = isRutaBarrial
        ? "Día reservado por Ruta BarrialCR (No disponible para servicios)"
        : isBlocked
        ? "Día bloqueado por el taller (No disponible para servicios)"
        : "Instalación a domicilio agendada para este día (bloqueo total)";

      const reasonEn = isRutaBarrial
        ? "Day reserved for Ruta BarrialCR (Unavailable for services)"
        : isBlocked
        ? "Day blocked by workshop (Unavailable for services)"
        : "Home installation scheduled on this date (full-day block)";

      const blockLabel = isRutaBarrial
        ? "Ruta BarrialCR (Día Completo)"
        : isBlocked
        ? "Día Bloqueado por Taller"
        : "Instalación a Domicilio (Día Completo)";

      // Entire day is blocked!
      const blockedSlotList = [];
      for (let min = OPERATING_START_MIN; min <= OPERATING_END_MIN; min += 30) {
        const { time24, time12 } = formatMinutesToTime(min);
        blockedSlotList.push({
          time: time24,
          time12,
          timeMinutes: min,
          available: false,
          reason: reasonEs,
          reasonEn: reasonEn,
        });
      }

      return NextResponse.json({
        success: true,
        date: dateParam,
        isFullDayBlocked: true,
        fullDayReason: reasonEs,
        fullDayReasonEn: reasonEn,
        blockedRanges: [
          {
            start: "08:00",
            end: "20:00",
            startMin: OPERATING_START_MIN,
            endMin: OPERATING_END_MIN,
            label: blockLabel,
          },
        ],
        slots: blockedSlotList,
      });
    }

    // If the requested service IS a home installation:
    // It requires the entire day. If ANY dispatch exists on this day, it cannot be booked.
    if (serviceType === "installation" && existingSchedules.length > 0) {
      const blockedSlotList = [];
      for (let min = OPERATING_START_MIN; min <= OPERATING_END_MIN; min += 30) {
        const { time24, time12 } = formatMinutesToTime(min);
        blockedSlotList.push({
          time: time24,
          time12,
          timeMinutes: min,
          available: false,
          reason: "Instalación a domicilio requiere el día completo y ya existen entregas agendadas",
          reasonEn: "Home installation requires full day and dispatches are already booked",
        });
      }

      return NextResponse.json({
        success: true,
        date: dateParam,
        isFullDayBlocked: true,
        fullDayReason: "No disponible: la instalación a domicilio requiere jornada completa sin entregas previas",
        fullDayReasonEn: "Unavailable: home installation requires full day without prior dispatches",
        blockedRanges: existingSchedules.map((s) => ({
          start: formatMinutesToTime(s.blockedStartMin).time24,
          end: formatMinutesToTime(s.blockedEndMin).time24,
          startMin: s.blockedStartMin,
          endMin: s.blockedEndMin,
          label: `Despacho #${s.orderId || s.id.slice(-4)} (${s.serviceType})`,
        })),
        slots: blockedSlotList,
      });
    }

    // List of existing blocked intervals on that day: [startMin, endMin]
    const blockedRanges = existingSchedules.map((s) => ({
      start: formatMinutesToTime(s.blockedStartMin).time24,
      end: formatMinutesToTime(s.blockedEndMin).time24,
      startMin: s.blockedStartMin,
      endMin: s.blockedEndMin,
      label: `Despacho #${s.orderId || s.id.slice(-4)} (${s.serviceType})`,
    }));

    // Generate slots every 30 minutes from 8:00 AM (480) to 8:00 PM (1200)
    // Evaluate collision and travel buffer for each slot
    const slots = [];
    const MAX_UNRESTRICTED_DRIVE_MIN = 180; // 3 hours threshold for initial hours
    const excessDriveMinutes = Math.max(0, travelMinutes - MAX_UNRESTRICTED_DRIVE_MIN);
    const initialHoursBlockedUntilMin =
      excessDriveMinutes > 0 ? OPERATING_START_MIN + excessDriveMinutes : 0;

    for (let slotMin = OPERATING_START_MIN; slotMin <= OPERATING_END_MIN; slotMin += 30) {
      const { time24, time12 } = formatMinutesToTime(slotMin);

      // Travel buffer formula:
      // Time taken from garage to destination + 30mins to time taken from destination to garage + 30mins.
      // Ex: travel 90mins, pick-up at 1pm (780) -> block 11am (780 - 120) to 3pm (780 + 120).
      const bufferMinutes = travelMinutes + 30;
      const neededDepartureMin = slotMin - bufferMinutes;
      const neededReturnMin = slotMin + bufferMinutes;

      let isAvailable = true;
      let blockReason = null;
      let blockReasonEn = null;

      // 1. Initial hours restriction (8:00 AM +):
      // User rule: Let the user choose initial hours regardless of driving time at the beginning.
      // Start restricting only after 3h drives (e.g. 4h drive -> excess 1h -> block 8:00am, 8:30am, 9:00am).
      if (initialHoursBlockedUntilMin > 0 && slotMin <= initialHoursBlockedUntilMin) {
        isAvailable = false;
        const firstAvailableMin = Math.ceil((initialHoursBlockedUntilMin + 1) / 30) * 30;
        const firstAvailable12 = formatMinutesToTime(firstAvailableMin).time12;
        blockReason = `Horario restringido por distancia de viaje (${Math.round(travelMinutes / 60)}h). Disponible a partir de las ${firstAvailable12}`;
        blockReasonEn = `Time slot restricted due to travel distance (${Math.round(travelMinutes / 60)}h). Available starting at ${firstAvailable12}`;
      }

      // 2. Boundary check: Can driver return at or before operating hours (8:00 PM)?
      else if (neededReturnMin > OPERATING_END_MIN) {
        isAvailable = false;
        blockReason = "Horario no disponible (traslado excede la jornada de 8:00 PM)";
        blockReasonEn = "Time slot unavailable (transit exceeds 8:00 PM closing)";
      }

      // 3. Collision check: Does [neededDepartureMin, neededReturnMin] overlap with ANY existing dispatch?
      if (isAvailable) {
        for (const range of existingSchedules) {
          // Overlap condition:
          // max(startA, startB) < min(endA, endB)
          const overlap =
            Math.max(neededDepartureMin, range.blockedStartMin) <
            Math.min(neededReturnMin, range.blockedEndMin);

          if (overlap) {
            isAvailable = false;
            const earliestArrivalMin = range.blockedEndMin + DEFAULT_PREP_BUFFER + travelMinutes;
            const earliestArrival12 = formatMinutesToTime(earliestArrivalMin).time12;

            blockReason = `Horario ocupado por ruta agendada. Próximo disponible a partir de las ${earliestArrival12}`;
            blockReasonEn = `Time slot booked by scheduled route. Next available starting at ${earliestArrival12}`;
            break;
          }
        }
      }

      slots.push({
        time: time24,
        time12,
        timeMinutes: slotMin,
        available: isAvailable,
        reason: blockReason,
        reasonEn: blockReasonEn,
        departureTime: formatMinutesToTime(neededDepartureMin).time12,
        returnTime: formatMinutesToTime(neededReturnMin).time12,
      });
    }

    return NextResponse.json({
      success: true,
      date: dateParam,
      travelMinutes,
      isFullDayBlocked: false,
      operatingHours: {
        start: "08:00",
        end: "20:00",
        startMinutes: OPERATING_START_MIN,
        endMinutes: OPERATING_END_MIN,
      },
      blockedRanges,
      slots,
    });
  } catch (error) {
    console.error("[AVAILABILITY_API_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al verificar disponibilidad de horarios" },
      { status: 500 }
    );
  }
}
