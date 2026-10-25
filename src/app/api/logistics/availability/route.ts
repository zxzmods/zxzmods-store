import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStealthSession } from "@/lib/stealthAuth";
import {
  liftExpiredRejectedServiceSchedules,
  parseTimeToMinutes,
  formatMinutesToTime,
} from "@/lib/serviceSchedules";

// Operating window: 8:00 AM (480 min) to 8:00 PM (1200 min)
const OPERATING_START_MIN = 480;  // 08:00
const OPERATING_END_MIN = 1200;   // 20:00
const DEFAULT_PREP_BUFFER = 15;   // 15 min loading / package prep
const DEFAULT_HANDOVER_BUFFER = 15; // 15 min on-site unloading / handover

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
    const rawSchedules = await prisma.serviceSchedule.findMany({
      where: {
        date: dateParam,
        status: { not: "CANCELLED" },
      },
      orderBy: { blockedStartMin: "asc" },
    });

    const relatedOrderIds = rawSchedules.map((s) => s.orderId).filter(Boolean) as string[];
    const linkedOrders = relatedOrderIds.length > 0
      ? await prisma.order.findMany({
          where: { id: { in: relatedOrderIds } },
          select: { id: true, orderNumber: true, itemsJson: true, serviceDocumentsJson: true },
        })
      : [];
    const ordersMap = new Map(linkedOrders.map((o) => [o.id, o]));

    const existingSchedules = rawSchedules.map((s) => ({
      ...s,
      order: s.orderId ? ordersMap.get(s.orderId) || null : null,
    }));

    // Check if the whole day is blocked:
    // A home installation, Ruta BarrialCR, or workshop full-day block on this day blocks all dispatches
    const fullDaySchedule = existingSchedules.find(
      (s) =>
        s.isFullDay ||
        s.serviceType === "installation" ||
        s.serviceType === "ruta_barrial"
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
          label: s.status === "BLOCKED" ? (s.destinationAddress || "Bloqueo Taller") : `Despacho #${s.orderId || s.id.slice(-4)} (${s.serviceType})`,
        })),
        slots: blockedSlotList,
      });
    }

    // Fetch workshop capacity (maxConcurrentInstallations)
    let maxCapacity = 1;
    try {
      const cfg = await prisma.logisticsRateConfig.findUnique({
        where: { id: "rates-config" },
        select: { maxConcurrentInstallations: true },
      });
      maxCapacity = cfg?.maxConcurrentInstallations || 1;
    } catch {}

    // Extract order installation duration from query or orderIds
    const orderIdsParam = searchParams.get("orderIds") || searchParams.get("orderId");
    const installDurationParam = searchParams.get("installDurationMinutes");

    let computedInstallationDurationMin = 60;
    if (installDurationParam && parseInt(installDurationParam, 10) > 0) {
      computedInstallationDurationMin = parseInt(installDurationParam, 10);
    } else if (orderIdsParam) {
      const ids = orderIdsParam.split(",").map((s) => s.trim()).filter(Boolean);
      const orders = await prisma.order.findMany({
        where: {
          OR: ids.flatMap((id) => [{ id }, { orderNumber: id }]),
        },
        select: {
          serviceDocumentsJson: true,
          itemsJson: true,
        },
      });

      let totalMins = 0;
      for (const ord of orders) {
        let ordMins = 0;
        if (ord.serviceDocumentsJson) {
          try {
            const parsed = typeof ord.serviceDocumentsJson === "string" ? JSON.parse(ord.serviceDocumentsJson) : ord.serviceDocumentsJson;
            if (typeof parsed?.installationDurationMinutes === "number" && parsed.installationDurationMinutes > 0) {
              ordMins = parsed.installationDurationMinutes;
            }
          } catch {}
        }
        if (ordMins === 0 && ord.itemsJson) {
          try {
            const items = typeof ord.itemsJson === "string" ? JSON.parse(ord.itemsJson) : ord.itemsJson;
            if (Array.isArray(items)) {
              ordMins = items.reduce((acc: number, it: any) => acc + (Number(it.installationDurationMinutes) || 60) * (Number(it.quantity) || 1), 0);
            }
          } catch {}
        }
        totalMins += ordMins;
      }
      if (totalMins > 0) {
        computedInstallationDurationMin = totalMins;
      }
    }

    // Previous day for carryover calculation
    const [y, m, d] = dateParam.split("-").map(Number);
    const dtPrev = new Date(y, m - 1, d);
    dtPrev.setDate(dtPrev.getDate() - 1);
    const prevDateStr = `${dtPrev.getFullYear()}-${String(dtPrev.getMonth() + 1).padStart(2, "0")}-${String(dtPrev.getDate()).padStart(2, "0")}`;

    const dtNext = new Date(y, m - 1, d);
    dtNext.setDate(dtNext.getDate() + 1);
    const nextDateStr = `${dtNext.getFullYear()}-${String(dtNext.getMonth() + 1).padStart(2, "0")}-${String(dtNext.getDate()).padStart(2, "0")}`;

    const [prevCarryovers, nextDaySchedules, nextDayCarryovers] = await Promise.all([
      prisma.serviceSchedule.findMany({
        where: {
          OR: [
            { carryoverDate: dateParam },
            { date: prevDateStr, carryoverNextDayMinutes: { gt: 0 } },
          ],
          status: { not: "CANCELLED" },
        },
      }),
      prisma.serviceSchedule.findMany({
        where: {
          date: nextDateStr,
          status: { not: "CANCELLED" },
        },
      }),
      prisma.serviceSchedule.findMany({
        where: {
          OR: [
            { carryoverDate: nextDateStr },
            { date: dateParam, carryoverNextDayMinutes: { gt: 0 } },
          ],
          status: { not: "CANCELLED" },
        },
      }),
    ]);

    // Build Day 1 workshop intervals: [start, end]
    const workshopIntervals: { start: number; end: number; label: string }[] = [];

    // Add carryover intervals from previous day (morning at 8:00 AM = 480 min)
    for (const c of prevCarryovers) {
      const cDur = c.carryoverNextDayMinutes || 0;
      if (cDur > 0) {
        workshopIntervals.push({
          start: 480,
          end: Math.min(1200, 480 + cDur),
          label: `Continuación de ayer (#${c.orderId || c.id.slice(-4)})`,
        });
      }
    }

    // Helper to resolve installation duration from schedule or linked order
    const getScheduleInstallDuration = (s: any): number => {
      if (typeof s.installationDurationMin === "number" && s.installationDurationMin > 0) {
        return s.installationDurationMin;
      }
      if (s.order) {
        if (s.order.serviceDocumentsJson) {
          try {
            const doc = typeof s.order.serviceDocumentsJson === "string" ? JSON.parse(s.order.serviceDocumentsJson) : s.order.serviceDocumentsJson;
            if (typeof doc?.installationDurationMinutes === "number" && doc.installationDurationMinutes > 0) {
              return doc.installationDurationMinutes;
            }
          } catch {}
        }
        if (s.order.itemsJson) {
          try {
            const items = typeof s.order.itemsJson === "string" ? JSON.parse(s.order.itemsJson) : s.order.itemsJson;
            if (Array.isArray(items)) {
              const sum = items.reduce((acc: number, it: any) => acc + (Number(it.installationDurationMinutes) || 60) * (Number(it.quantity) || 1), 0);
              if (sum > 0) return sum;
            }
          } catch {}
        }
      }
      return (s.durationMinutes && s.durationMinutes > 30) ? s.durationMinutes : 60;
    };

    // Add Day 1 active schedules
    for (const s of existingSchedules) {
      if (s.status === "BLOCKED" || s.isFullDay) {
        workshopIntervals.push({
          start: s.blockedStartMin !== undefined ? s.blockedStartMin : 480,
          end: s.blockedEndMin !== undefined ? s.blockedEndMin : 1200,
          label: s.destinationAddress || "Bloqueo Taller",
        });
      } else if (s.serviceType === "shop_installation") {
        const sDur = getScheduleInstallDuration(s);
        const sStart = s.timeMinutes;
        const sEnd = Math.min(1200, sStart + sDur + 30);
        workshopIntervals.push({
          start: sStart,
          end: sEnd,
          label: `Instalación Taller #${s.orderId || s.id.slice(-4)}`,
        });
      } else if (s.serviceType === "pickup" || s.serviceType === "UTV_PICKUP") {
        const sDur = getScheduleInstallDuration(s);
        const sArrival = s.workshopArrivalMinutes || (s.timeMinutes + (s.travelDurationMin || 0) + 30);
        const sEnd = Math.min(1200, sArrival + sDur + 30);
        workshopIntervals.push({
          start: sArrival,
          end: sEnd,
          label: `Retiro SxS en Taller #${s.orderId || s.id.slice(-4)}`,
        });
      }
    }

    // Build Day 1 trailer transit intervals
    const trailerTransitIntervals: { start: number; end: number; label: string }[] = [];
    for (const s of existingSchedules) {
      if (s.serviceType === "pickup" || s.serviceType === "UTV_PICKUP" || s.serviceType === "delivery") {
        const trv = s.travelDurationMin !== undefined ? s.travelDurationMin : 0;
        const sBuffer = trv + 30;
        const sStart = Math.max(0, s.timeMinutes - sBuffer);
        const sEnd = Math.min(1439, s.timeMinutes + sBuffer);
        trailerTransitIntervals.push({
          start: sStart,
          end: sEnd,
          label: `Traslado Remolque #${s.orderId || s.id.slice(-4)} (${s.serviceType})`,
        });
      }
    }

    // Build Day 2 workshop intervals (for carryover checking)
    const nextDayIntervals: { start: number; end: number }[] = [];
    for (const c of nextDayCarryovers) {
      const cDur = c.carryoverNextDayMinutes || 0;
      if (cDur > 0) {
        nextDayIntervals.push({ start: 480, end: Math.min(1200, 480 + cDur) });
      }
    }
    for (const s of nextDaySchedules) {
      if (s.status === "BLOCKED" || s.isFullDay) {
        nextDayIntervals.push({ start: 480, end: 1200 });
      } else {
        const sDur = s.installationDurationMin || s.durationMinutes || 60;
        const sStart = s.timeMinutes;
        nextDayIntervals.push({ start: sStart, end: Math.min(1200, sStart + sDur + 30) });
      }
    }

    // List of existing blocked intervals on that day for display
    const blockedRanges = [
      ...workshopIntervals.map((w) => ({
        start: formatMinutesToTime(w.start).time24,
        end: formatMinutesToTime(w.end).time24,
        startMin: w.start,
        endMin: w.end,
        label: w.label,
      })),
      ...trailerTransitIntervals.map((tr) => ({
        start: formatMinutesToTime(tr.start).time24,
        end: formatMinutesToTime(tr.end).time24,
        startMin: tr.start,
        endMin: tr.end,
        label: tr.label,
      })),
    ];

    // Generate slots every 30 minutes from 8:00 AM (480) to 8:00 PM (1200)
    const slots = [];
    const MAX_UNRESTRICTED_DRIVE_MIN = 180; // 3 hours threshold for initial hours
    const excessDriveMinutes = Math.max(0, travelMinutes - MAX_UNRESTRICTED_DRIVE_MIN);
    const initialHoursBlockedUntilMin =
      excessDriveMinutes > 0 ? OPERATING_START_MIN + excessDriveMinutes : 0;

    for (let slotMin = OPERATING_START_MIN; slotMin <= OPERATING_END_MIN; slotMin += 30) {
      const { time24, time12 } = formatMinutesToTime(slotMin);

      const isTransport = serviceType === "pickup" || serviceType === "delivery";
      const bufferMinutes = travelMinutes + 30;
      const neededDepartureMin = slotMin - bufferMinutes;
      const neededReturnMin = slotMin + bufferMinutes;

      let isAvailable = true;
      let blockReason = null;
      let blockReasonEn = null;
      let carriesOverToNextDay = false;
      let carryoverHours = 0;

      // 1. Initial hours restriction (8:00 AM +) for long distance drives
      if (isTransport && initialHoursBlockedUntilMin > 0 && slotMin <= initialHoursBlockedUntilMin) {
        isAvailable = false;
        const firstAvailableMin = Math.ceil((initialHoursBlockedUntilMin + 1) / 30) * 30;
        const firstAvailable12 = formatMinutesToTime(firstAvailableMin).time12;
        blockReason = `Horario restringido por distancia de viaje (${Math.round(travelMinutes / 60)}h). Disponible a partir de las ${firstAvailable12}`;
        blockReasonEn = `Time slot restricted due to travel distance (${Math.round(travelMinutes / 60)}h). Available starting at ${firstAvailable12}`;
      }

      // 2. Transport trailer return boundary check (only for pickup/delivery on the road)
      else if (isTransport && neededReturnMin > OPERATING_END_MIN) {
        isAvailable = false;
        blockReason = "Horario no disponible (traslado excede la jornada de 8:00 PM)";
        blockReasonEn = "Time slot unavailable (transit exceeds 8:00 PM closing)";
      }

      // 3. Trailer transit collision check (only for pickup/delivery)
      if (isAvailable && isTransport) {
        for (const tr of trailerTransitIntervals) {
          const overlap =
            Math.max(neededDepartureMin, tr.start) < Math.min(neededReturnMin, tr.end);
          if (overlap) {
            isAvailable = false;
            const earliestArrivalMin = tr.end + DEFAULT_PREP_BUFFER + travelMinutes;
            const earliestArrival12 = formatMinutesToTime(earliestArrivalMin).time12;
            blockReason = `Unidad de remolque en ruta para otro servicio. Próximo disponible a partir de las ${earliestArrival12}`;
            blockReasonEn = `Trailer unit in transit for another service. Next available starting at ${earliestArrival12}`;
            break;
          }
        }
      }

      // 4. Workshop capacity collision check (for shop_installation)
      // Pick-up times are NOT blocked by workshop capacity (managed on the workshop installation time sheet)
      const requiresWorkshopCheck = serviceType === "shop_installation";
      if (isAvailable && requiresWorkshopCheck) {
        const arrivalMin = slotMin;
        const finishMin = arrivalMin + computedInstallationDurationMin + 30;
        const day1Finish = Math.min(1200, finishMin);

        // Check Day 1 capacity at every 15-min mark plus the finish boundary mark
        // This ensures that candidate slots whose finish time touches or collides with a future install (e.g. 12:30 PM for a 3:00 PM install) are blocked
        const checkPoints: number[] = [];
        for (let t = arrivalMin; t < day1Finish; t += 15) {
          checkPoints.push(t);
        }
        checkPoints.push(day1Finish);

        for (const t of checkPoints) {
          const activeCount = workshopIntervals.filter((iv) => t >= iv.start && t < iv.end).length;
          if (activeCount >= maxCapacity) {
            isAvailable = false;
            blockReason = `Capacidad máxima del taller alcanzada (${maxCapacity} instalación${maxCapacity > 1 ? "es" : ""} simultánea${maxCapacity > 1 ? "s" : ""})`;
            blockReasonEn = `Workshop maximum capacity reached (${maxCapacity} concurrent installation${maxCapacity > 1 ? "s" : ""})`;
            break;
          }
        }

        // Check Day 2 carryover morning capacity if finishing after 8:00 PM
        if (isAvailable && finishMin > 1200) {
          carriesOverToNextDay = true;
          const carryoverMins = finishMin - 1200;
          carryoverHours = Number((carryoverMins / 60).toFixed(1));
          const day2Finish = Math.min(1200, 480 + carryoverMins);

          const checkPointsDay2: number[] = [];
          for (let t2 = 480; t2 < day2Finish; t2 += 15) {
            checkPointsDay2.push(t2);
          }
          checkPointsDay2.push(day2Finish);

          for (const t2 of checkPointsDay2) {
            const activeCount2 = nextDayIntervals.filter((iv) => t2 >= iv.start && t2 < iv.end).length;
            if (activeCount2 >= maxCapacity) {
              isAvailable = false;
              blockReason = `Capacidad para continuar al día siguiente a las 8:00 AM completa (${maxCapacity} máxima${maxCapacity > 1 ? "s" : ""})`;
              blockReasonEn = `Capacity to carry over next morning at 8:00 AM full (${maxCapacity} max)`;
              break;
            }
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
        carriesOverToNextDay,
        carryoverHours,
        departureTime: formatMinutesToTime(neededDepartureMin).time12,
        returnTime: formatMinutesToTime(neededReturnMin).time12,
      });
    }

    return NextResponse.json({
      success: true,
      date: dateParam,
      travelMinutes,
      maxConcurrentInstallations: maxCapacity,
      orderInstallationDurationMinutes: computedInstallationDurationMin,
      estimatedInstallationHours: Number((computedInstallationDurationMin / 60).toFixed(1)),
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
