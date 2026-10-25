import { prisma } from "@/lib/prisma";

export const SERVICE_PAYMENT_REJECTION_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours

/**
 * Accurately parses 12h, 24h, or named time strings into minutes from midnight (0 - 1439).
 * Examples:
 *  - "1:00 PM" / "01:00 PM" -> 780
 *  - "1:00 AM" / "01:00 AM" -> 60
 *  - "12:00 PM" / "12:00 MD" -> 720
 *  - "12:00 AM" / "12:00 MN" -> 0
 *  - "13:30" -> 810
 *  - "08:00" -> 480
 *  - "afternoon" -> 840
 *  - "morning" -> 600
 */
export function parseTimeToMinutes(timeStr: string | null | undefined): number {
  if (!timeStr) return 600; // default 10:00 AM
  const clean = String(timeStr).trim().toLowerCase();

  if (clean === "morning") return 600; // 10:00 AM
  if (clean === "afternoon") return 840; // 2:00 PM

  // Match: (hours):(minutes) (am|pm|md|mn)?
  const match = clean.match(/^(\d{1,2}):(\d{2})(?:\s*(am|pm|md|mn))?/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10) || 0;
    const meridiem = match[3] ? match[3].toLowerCase() : null;

    if (meridiem === "pm") {
      if (hours < 12) hours += 12;
    } else if (meridiem === "am") {
      if (hours === 12) hours = 0;
    } else if (meridiem === "md") {
      // Medio día (12:00 MD)
      if (hours < 12) hours += 12;
    } else if (meridiem === "mn") {
      // Media noche (12:00 MN)
      if (hours === 12) hours = 0;
    }

    return Math.max(0, Math.min(1439, hours * 60 + minutes));
  }

  // Fallback for single numbers like "13" or "8"
  const singleNumber = parseInt(clean, 10);
  if (!isNaN(singleNumber) && singleNumber >= 0 && singleNumber <= 24) {
    return singleNumber * 60;
  }

  return 600;
}

/**
 * Format minutes from midnight (0 - 1440) to "HH:mm" (24h) and 12h display
 */
export function formatMinutesToTime(min: number): { time24: string; time12: string } {
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
 * Lifts/cancels date reservations for orders whose service payment was rejected
 * and has stayed rejected for more than 48 hours without customer correction.
 * This re-opens the reserved date/time slots so other customers can book them.
 */
export async function liftExpiredRejectedServiceSchedules(tx?: any): Promise<number> {
  const db = tx || prisma;
  let liftedCount = 0;

  try {
    const candidateOrders = await db.order.findMany({
      where: {
        OR: [
          { status: "PAYMENT_REJECTED" },
          { serviceDocumentsJson: { contains: "servicePaymentRejected" } },
        ],
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        serviceDocumentsJson: true,
        notes: true,
      },
    });

    const now = Date.now();

    for (const ord of candidateOrders) {
      if (!ord.serviceDocumentsJson) continue;
      let doc: any = null;
      try {
        doc = typeof ord.serviceDocumentsJson === "string" ? JSON.parse(ord.serviceDocumentsJson) : ord.serviceDocumentsJson;
      } catch {
        continue;
      }

      if (!doc || doc.servicePaymentRejected !== true || !doc.servicePaymentRejectedAt) {
        continue;
      }

      const rejectedTimestamp = new Date(doc.servicePaymentRejectedAt).getTime();
      if (isNaN(rejectedTimestamp)) continue;

      const elapsed = now - rejectedTimestamp;
      if (elapsed >= SERVICE_PAYMENT_REJECTION_EXPIRY_MS) {
        // Find linked active service schedules
        const activeSchedules = await db.serviceSchedule.findMany({
          where: {
            OR: [{ orderId: ord.id }, { orderId: ord.orderNumber }],
            status: { not: "CANCELLED" },
          },
        });

        if (activeSchedules.length > 0) {
          await db.serviceSchedule.updateMany({
            where: {
              OR: [{ orderId: ord.id }, { orderId: ord.orderNumber }],
              status: { not: "CANCELLED" },
            },
            data: {
              status: "CANCELLED",
              updatedAt: new Date(),
            },
          });
          liftedCount += activeSchedules.length;
        }

        // Update order service documents to reflect that the 48h reservation has been lifted
        doc.servicePaymentRejected = false;
        doc.serviceScheduleLiftedAfter48h = true;
        doc.serviceScheduleLiftedAt = new Date().toISOString();

        const liftNote = `[RESERVA LIBERADA]: La reserva de fecha fue liberada automáticamente por superar 48h con comprobante de servicio rechazado.`;
        const updatedNotes = ord.notes ? `${ord.notes}\n${liftNote}` : liftNote;

        await db.order.update({
          where: { id: ord.id },
          data: {
            status: "PROGRAM_SERVICE",
            servicePaymentProofUrl: null,
            serviceDocumentsJson: JSON.stringify(doc),
            notes: updatedNotes,
            updatedAt: new Date(),
          },
        });
      }
    }
  } catch (err) {
    console.error("[LIFT_EXPIRED_SCHEDULES_ERROR]:", err);
  }

  return liftedCount;
}

export interface CollisionCheckParams {
  scheduledDate: string;
  timeMinutes: number;
  travelMinutes?: number;
  installationDurationMinutes?: number;
  serviceType: string;
  isFullDay?: boolean;
  excludeOrderId?: string;
  maxConcurrentInstallations?: number;
}

/**
 * Calculates date offset string (YYYY-MM-DD)
 */
export function getDateOffset(dateStr: string, offsetDays: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + offsetDays);
  const nextY = dt.getFullYear();
  const nextM = String(dt.getMonth() + 1).padStart(2, "0");
  const nextD = String(dt.getDate()).padStart(2, "0");
  return `${nextY}-${nextM}-${nextD}`;
}

/**
 * Atomic validation to prevent two clients from reserving the same date or time slot,
 * taking into account:
 *  1. Transport trailer availability (Pick-up transit buffer: [time - travel - 30, time + travel + 30])
 *  2. Workshop installation capacity (maxConcurrentInstallations) starting upon arrival at workshop
 *  3. Multi-product summed installation durations + 30 min buffer
 *  4. Carryover hours into the next day morning starting at 8:00 AM (480 min)
 */
export async function checkServiceSlotCollision(
  params: CollisionCheckParams,
  tx?: any
): Promise<{ hasCollision: boolean; reason?: string; reasonEn?: string }> {
  const db = tx || prisma;

  // 1. Lift reservations that have stayed rejected for >48 hours
  await liftExpiredRejectedServiceSchedules(db);

  // 2. Resolve workshop capacity (default 1)
  let maxCapacity: number = Number(params.maxConcurrentInstallations) || 0;
  if (maxCapacity < 1) {
    try {
      const cfg = await db.logisticsRateConfig.findUnique({
        where: { id: "rates-config" },
        select: { maxConcurrentInstallations: true },
      });
      maxCapacity = Number(cfg?.maxConcurrentInstallations) || 1;
    } catch {
      maxCapacity = 1;
    }
  }

  // 3. Fetch all active schedules on the target date
  const existingSchedules = await db.serviceSchedule.findMany({
    where: {
      date: params.scheduledDate,
      status: { not: "CANCELLED" },
    },
    orderBy: { blockedStartMin: "asc" },
  });

  const relevantSchedules = params.excludeOrderId
    ? existingSchedules.filter((s: any) => s.orderId !== params.excludeOrderId)
    : existingSchedules;

  const isRequestFullDay =
    params.isFullDay || params.serviceType === "installation" || params.serviceType === "HOME_INSTALL";

  // If request requires the full day (e.g. Home installation), any existing schedule is a collision
  if (isRequestFullDay && relevantSchedules.length > 0) {
    return {
      hasCollision: true,
      reason:
        "La fecha seleccionada ya cuenta con citas agendadas y la instalación a domicilio requiere jornada completa.",
      reasonEn:
        "The selected date already has appointments scheduled and home installation requires a full day.",
    };
  }

  // Check if an existing schedule on target date is a full-day block
  const fullDayExisting = relevantSchedules.find(
    (s: any) =>
      s.isFullDay ||
      s.serviceType === "installation" ||
      s.serviceType === "HOME_INSTALL" ||
      s.serviceType === "ruta_barrial" ||
      (s.serviceType === "blocked_day" && s.isFullDay !== false) ||
      (s.status === "BLOCKED" && s.isFullDay === true) ||
      Boolean(s.destinationAddress?.includes("Ruta BarrialCR"))
  );

  if (fullDayExisting) {
    return {
      hasCollision: true,
      reason:
        "La fecha seleccionada se encuentra reservada por una instalación completa o actividad del taller.",
      reasonEn:
        "The selected date is fully booked by an all-day installation or workshop activity.",
    };
  }

  // 4. Trailer Transit Collision Check (for transport services: pickup / delivery)
  const isTransportService =
    params.serviceType === "pickup" ||
    params.serviceType === "UTV_PICKUP" ||
    params.serviceType === "delivery";

  const travelMin = Math.max(0, params.travelMinutes || 0);
  const transitBuffer = travelMin + 30;
  const neededTransitStart = Math.max(0, params.timeMinutes - transitBuffer);
  const neededTransitEnd = Math.min(1439, params.timeMinutes + transitBuffer);

  if (isTransportService) {
    for (const range of relevantSchedules) {
      const isRangeTransport =
        range.serviceType === "pickup" ||
        range.serviceType === "UTV_PICKUP" ||
        range.serviceType === "delivery";

      if (!isRangeTransport) continue;

      const otherTravel = range.travelDurationMin !== undefined ? range.travelDurationMin : 0;
      const otherBuffer = otherTravel + 30;
      const otherTransitStart =
        range.blockedStartMin !== undefined
          ? range.blockedStartMin
          : Math.max(0, range.timeMinutes - otherBuffer);
      const otherTransitEnd =
        range.blockedEndMin !== undefined && !range.installationDurationMin
          ? range.blockedEndMin
          : Math.min(1439, range.timeMinutes + otherBuffer);

      const overlap =
        Math.max(neededTransitStart, otherTransitStart) <
        Math.min(neededTransitEnd, otherTransitEnd);

      if (overlap) {
        return {
          hasCollision: true,
          reason:
            "La unidad de transporte y remolque se encuentra en ruta para otro servicio durante este horario. Por favor selecciona otra hora de retiro.",
          reasonEn:
            "The transport vehicle and trailer is on route for another service during this time. Please select another pick-up time.",
        };
      }
    }
  }

  // 5. Workshop Capacity Collision Check (for shop installations)
  // Pick-up dispatch times are not blocked by workshop capacity
  const requiresWorkshop = params.serviceType === "shop_installation";

  if (requiresWorkshop) {
    const installDuration = Math.max(15, params.installationDurationMinutes || 60);
    const workshopArrivalMin = params.timeMinutes;

    const totalFinishMin = workshopArrivalMin + installDuration + 30; // 30 min buffer
    const day1FinishMin = Math.min(1200, totalFinishMin);

    // Fetch previous day carryovers into target date
    const prevDateStr = getDateOffset(params.scheduledDate, -1);
    const prevCarryovers = await db.serviceSchedule.findMany({
      where: {
        OR: [
          { carryoverDate: params.scheduledDate },
          { date: prevDateStr, carryoverNextDayMinutes: { gt: 0 } },
        ],
        status: { not: "CANCELLED" },
      },
    });

    // Build list of active workshop intervals on target date [start, end]
    const workshopIntervals: { start: number; end: number; orderId?: string }[] = [];

    // Add previous day carryovers (occupy morning 8:00 AM = 480 min)
    for (const c of prevCarryovers) {
      if (params.excludeOrderId && c.orderId === params.excludeOrderId) continue;
      const cDuration = c.carryoverNextDayMinutes || 0;
      if (cDuration > 0) {
        workshopIntervals.push({
          start: 480,
          end: Math.min(1200, 480 + cDuration),
          orderId: c.orderId,
        });
      }
    }

    // Add target date workshop jobs
    for (const s of relevantSchedules) {
      if (s.status === "BLOCKED") {
        workshopIntervals.push({
          start: s.blockedStartMin !== undefined ? s.blockedStartMin : 480,
          end: s.blockedEndMin !== undefined ? s.blockedEndMin : 1200,
          orderId: s.orderId,
        });
        continue;
      }

      if (s.serviceType === "shop_installation") {
        const sDuration = s.installationDurationMin || s.durationMinutes || 60;
        const sStart = s.timeMinutes;
        const sEnd = Math.min(1200, sStart + sDuration + 30);
        workshopIntervals.push({ start: sStart, end: sEnd, orderId: s.orderId });
      } else if (s.serviceType === "pickup" || s.serviceType === "UTV_PICKUP") {
        const sDuration = s.installationDurationMin || 60;
        const sArrival = s.workshopArrivalMinutes || (s.timeMinutes + (s.travelDurationMin || 0) + 30);
        const sEnd = Math.min(1200, sArrival + sDuration + 30);
        workshopIntervals.push({ start: sArrival, end: sEnd, orderId: s.orderId });
      }
    }

    // Check Day 1 capacity at every 15-minute slice within [workshopArrivalMin, day1FinishMin] plus day1FinishMin
    const checkPoints: number[] = [];
    for (let t = workshopArrivalMin; t < day1FinishMin; t += 15) {
      checkPoints.push(t);
    }
    checkPoints.push(day1FinishMin);

    for (const t of checkPoints) {
      const activeCount = workshopIntervals.filter((iv) => t >= iv.start && t < iv.end).length;
      if (activeCount + 1 > maxCapacity) {
        return {
          hasCollision: true,
          reason: `La capacidad máxima del taller (${maxCapacity} instalación${maxCapacity > 1 ? "es" : ""} simultánea${maxCapacity > 1 ? "s" : ""}) está completa en este horario. Por favor selecciona otra hora.`,
          reasonEn: `Workshop maximum capacity (${maxCapacity} concurrent installation${maxCapacity > 1 ? "s" : ""}) is reached during this time. Please choose another time.`,
        };
      }
    }

    // Check Day 2 carryover if totalFinishMin > 1200 (work extends past 8:00 PM closing)
    if (totalFinishMin > 1200) {
      const carryoverMinutes = totalFinishMin - 1200;
      const nextDateStr = getDateOffset(params.scheduledDate, 1);

      const nextDaySchedules = await db.serviceSchedule.findMany({
        where: {
          date: nextDateStr,
          status: { not: "CANCELLED" },
        },
      });

      const nextDayCarryovers = await db.serviceSchedule.findMany({
        where: {
          OR: [
            { carryoverDate: nextDateStr },
            { date: params.scheduledDate, carryoverNextDayMinutes: { gt: 0 } },
          ],
          status: { not: "CANCELLED" },
        },
      });

      const nextDayIntervals: { start: number; end: number }[] = [];
      for (const c of nextDayCarryovers) {
        if (params.excludeOrderId && c.orderId === params.excludeOrderId) continue;
        const cDur = c.carryoverNextDayMinutes || 0;
        if (cDur > 0) {
          nextDayIntervals.push({ start: 480, end: Math.min(1200, 480 + cDur) });
        }
      }
      for (const s of nextDaySchedules) {
        if (params.excludeOrderId && s.orderId === params.excludeOrderId) continue;
        if (s.status === "BLOCKED" || s.isFullDay) {
          nextDayIntervals.push({ start: 480, end: 1200 });
        } else {
          const sDur = s.installationDurationMin || s.durationMinutes || 60;
          const sStart = s.timeMinutes;
          nextDayIntervals.push({ start: sStart, end: Math.min(1200, sStart + sDur + 30) });
        }
      }

      const day2EndMin = Math.min(1200, 480 + carryoverMinutes);
      const checkPointsDay2: number[] = [];
      for (let t = 480; t < day2EndMin; t += 15) {
        checkPointsDay2.push(t);
      }
      checkPointsDay2.push(day2EndMin);

      for (const t of checkPointsDay2) {
        const activeCount = nextDayIntervals.filter((iv) => t >= iv.start && t < iv.end).length;
        if (activeCount + 1 > maxCapacity) {
          return {
            hasCollision: true,
            reason: `La capacidad del taller para continuar esta instalación el día siguiente a las 8:00 AM está completa (${maxCapacity} máxima${maxCapacity > 1 ? "s" : ""}). Por favor escoge otro horario.`,
            reasonEn: `Workshop capacity to carry over this installation next morning at 8:00 AM is full (${maxCapacity} max). Please choose another time slot.`,
          };
        }
      }
    }
  }

  return { hasCollision: false };
}
