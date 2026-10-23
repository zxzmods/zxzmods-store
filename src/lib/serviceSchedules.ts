import { prisma } from "@/lib/prisma";

export const SERVICE_PAYMENT_REJECTION_EXPIRY_MS = 48 * 60 * 60 * 1000; // 48 hours

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
  travelMinutes: number;
  serviceType: string;
  isFullDay?: boolean;
  excludeOrderId?: string;
}

/**
 * Atomic validation to prevent two clients from reserving the same date or time slot.
 * Whichever client finishes checkout or sends the BAC request first acquires the slot.
 */
export async function checkServiceSlotCollision(
  params: CollisionCheckParams,
  tx?: any
): Promise<{ hasCollision: boolean; reason?: string; reasonEn?: string }> {
  const db = tx || prisma;

  // 1. First lift any reservations that have been rejected for >48 hours
  await liftExpiredRejectedServiceSchedules(db);

  // 2. Fetch all active schedules on the target date
  const existingSchedules = await db.serviceSchedule.findMany({
    where: {
      date: params.scheduledDate,
      status: { not: "CANCELLED" },
    },
    orderBy: { blockedStartMin: "asc" },
  });

  // Filter out schedules belonging to the same order if re-scheduling
  const relevantSchedules = params.excludeOrderId
    ? existingSchedules.filter((s: any) => s.orderId !== params.excludeOrderId)
    : existingSchedules;

  if (relevantSchedules.length === 0) {
    return { hasCollision: false };
  }

  const isRequestFullDay =
    params.isFullDay || params.serviceType === "installation";

  // If the new request requires the entire day (e.g. Home installation),
  // ANY existing schedule on this day is a collision.
  if (isRequestFullDay) {
    return {
      hasCollision: true,
      reason:
        "La fecha seleccionada ya cuenta con citas agendadas y la instalación a domicilio requiere jornada completa.",
      reasonEn:
        "The selected date already has appointments scheduled and home installation requires a full day.",
    };
  }

  // Check if an existing schedule on that date is a full-day block
  const fullDayExisting = relevantSchedules.find(
    (s: any) =>
      s.isFullDay ||
      s.serviceType === "installation" ||
      s.serviceType === "ruta_barrial" ||
      s.serviceType === "blocked_day" ||
      s.status === "BLOCKED" ||
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

  // Time-window collision check for partial-day dispatches
  const travelMin = Math.max(0, params.travelMinutes || 0);
  const bufferMin = travelMin + 30;
  const neededStart = Math.max(0, params.timeMinutes - bufferMin);
  const neededEnd = Math.min(1439, params.timeMinutes + bufferMin);

  for (const range of relevantSchedules) {
    const overlap =
      Math.max(neededStart, range.blockedStartMin) <
      Math.min(neededEnd, range.blockedEndMin);

    if (overlap) {
      return {
        hasCollision: true,
        reason:
          "El horario seleccionado acaba de ser reservado por otro cliente. Por favor selecciona otra fecha u horario disponible.",
        reasonEn:
          "The selected time slot was just reserved by another customer. Please choose a different date or time slot.",
      };
    }
  }

  return { hasCollision: false };
}
