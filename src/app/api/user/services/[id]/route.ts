import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customerAuth";

export const dynamic = "force-dynamic";

function parseTimeToMinutes(tStr: string): number {
  const [h, m] = tStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCustomerSession();

    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const userId = session.userId;

    const serviceId = params.id;
    const schedule = await prisma.serviceSchedule.findFirst({
      where: {
        OR: [{ id: serviceId }, { appointmentCode: serviceId }],
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: "Servicio programado no encontrado" },
        { status: 404 }
      );
    }

    // Verify ownership
    const isOwner =
      schedule.userId === userId ||
      (schedule.orderId &&
        (await prisma.order.count({
          where: { id: schedule.orderId, userId },
        })) > 0);

    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para ver este servicio" },
        { status: 403 }
      );
    }

    const now = new Date();
    const timeStr = schedule.time || "10:00";
    const scheduledDateTime = new Date(`${schedule.date}T${timeStr}:00`);
    const diffHours = (scheduledDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const canEdit = diffHours > 48 && schedule.status !== "CANCELLED" && schedule.status !== "COMPLETED";
    const hoursRemaining = Math.max(0, Math.round(diffHours * 10) / 10);

    let comments: any[] = [];
    try {
      comments = JSON.parse(schedule.commentsJson || "[]");
    } catch {
      comments = [];
    }

    let linkedOrder = null;
    if (schedule.orderId) {
      linkedOrder = await prisma.order.findUnique({
        where: { id: schedule.orderId },
      });
    }

    return NextResponse.json({
      success: true,
      service: {
        ...schedule,
        canEdit,
        diffHours,
        hoursRemaining,
        comments,
        order: linkedOrder,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/user/services/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener el servicio" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCustomerSession();

    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const userId = session.userId;

    const serviceId = params.id;
    const body = await request.json().catch(() => ({}));
    const { newDate, newTime } = body;

    if (!newDate || !newTime) {
      return NextResponse.json(
        { success: false, error: "Debes proporcionar una nueva fecha y hora" },
        { status: 400 }
      );
    }

    const schedule = await prisma.serviceSchedule.findFirst({
      where: {
        OR: [{ id: serviceId }, { appointmentCode: serviceId }],
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { success: false, error: "Servicio programado no encontrado" },
        { status: 404 }
      );
    }

    // Verify ownership
    const isOwner =
      schedule.userId === userId ||
      (schedule.orderId &&
        (await prisma.order.count({
          where: { id: schedule.orderId, userId },
        })) > 0);

    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para modificar este servicio" },
        { status: 403 }
      );
    }

    // 48-HOUR RULE ENFORCEMENT:
    // User can edit time or date ONLY if there's more than 48 hours until scheduled delivery/service!
    const now = new Date();
    const currentTimeStr = schedule.time || "10:00";
    const currentScheduledDateTime = new Date(`${schedule.date}T${currentTimeStr}:00`);
    const diffHours = (currentScheduledDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours <= 48) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No es posible modificar la fecha u hora con menos de 48 horas de anticipación a la cita. Comunícate directamente con el taller.",
        },
        { status: 400 }
      );
    }

    // Validate that the NEW requested date/time is also at least 48 hours in the future
    const newScheduledDateTime = new Date(`${newDate}T${newTime}:00`);
    const newDiffHours = (newScheduledDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (newDiffHours <= 48) {
      return NextResponse.json(
        {
          success: false,
          error:
            "La nueva fecha y hora debe programarse con al menos 48 horas de anticipación.",
        },
        { status: 400 }
      );
    }

    // Recalculate time minutes and blocked ranges
    const timeMinutes = parseTimeToMinutes(newTime);
    const duration = schedule.durationMinutes || 30;
    const travel = schedule.travelDurationMin || 0;
    const prep = schedule.prepBufferMin || 15;
    const blockedStart = Math.max(0, timeMinutes - travel - prep);
    const blockedEnd = Math.min(1440, timeMinutes + duration + travel);

    // Existing comments
    let comments: any[] = [];
    try {
      comments = JSON.parse(schedule.commentsJson || "[]");
      if (!Array.isArray(comments)) comments = [];
    } catch {
      comments = [];
    }

    const systemComment = {
      id: `cmt-sys-${Date.now()}`,
      authorRole: "SYSTEM",
      authorName: "Sistema ZxZ",
      text: `Cita reprogramada para el ${newDate} a las ${newTime}. (Horario previo: ${schedule.date} ${schedule.time})`,
      createdAt: new Date().toISOString(),
    };
    const updatedComments = [...comments, systemComment];

    // Update ServiceSchedule
    const updated = await prisma.serviceSchedule.update({
      where: { id: schedule.id },
      data: {
        date: newDate,
        time: newTime,
        timeMinutes,
        blockedStartMin: blockedStart,
        blockedEndMin: blockedEnd,
        commentsJson: JSON.stringify(updatedComments),
        updatedAt: new Date(),
      },
    });

    // If order exists, also mirror log in Order comments
    if (schedule.orderId) {
      try {
        const linkedOrder = await prisma.order.findUnique({
          where: { id: schedule.orderId },
        });
        if (linkedOrder) {
          let orderComments = [];
          try {
            orderComments = JSON.parse(linkedOrder.commentsJson || "[]");
          } catch {}
          orderComments.push(systemComment);
          await prisma.order.update({
            where: { id: linkedOrder.id },
            data: {
              commentsJson: JSON.stringify(orderComments),
              updatedAt: new Date(),
            },
          });
        }
      } catch (err) {
        console.error("Error syncing system comment to order:", err);
      }
    }

    const newDiffRemaining = Math.max(0, Math.round(newDiffHours * 10) / 10);

    return NextResponse.json({
      success: true,
      message: "Cita reprogramada exitosamente",
      service: {
        ...updated,
        canEdit: newDiffHours > 48,
        diffHours: newDiffHours,
        hoursRemaining: newDiffRemaining,
        comments: updatedComments,
      },
    });
  } catch (error) {
    console.error("Error in PATCH /api/user/services/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar la cita" },
      { status: 500 }
    );
  }
}
