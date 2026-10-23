import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";

function generateAppointmentCode(isBlocked = false): string {
  const prefix = isBlocked ? "BLK" : "SRV";
  const num = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${num}`;
}

export async function GET() {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const schedules = await prisma.serviceSchedule.findMany({
      orderBy: [{ date: "asc" }, { timeMinutes: "asc" }],
    });

    // Backfill any schedules missing appointmentCode in a single non-blocking batch
    const missingCodes = schedules.filter((s) => !s.appointmentCode);
    if (missingCodes.length > 0) {
      const updates = missingCodes.map((s) => {
        const isBlocked =
          s.status === "BLOCKED" ||
          s.serviceType === "ruta_barrial" ||
          s.serviceType === "blocked_day";
        const code = generateAppointmentCode(isBlocked);
        s.appointmentCode = code;
        return prisma.serviceSchedule.update({
          where: { id: s.id },
          data: { appointmentCode: code },
        });
      });
      void prisma.$transaction(updates).catch((err) =>
        console.warn("[BACKFILL_APPOINTMENT_CODES_WARN]:", err)
      );
    }

    // Fetch related orders
    const orderIds = schedules
      .map((s) => s.orderId)
      .filter(Boolean) as string[];

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        customerName: true,
        customerPhone: true,
        shippingAddress: true,
        itemsJson: true,
        paymentProofUrl: true,
        totalCRC: true,
      },
    });

    const ordersMap = new Map(orders.map((o) => [o.id, o]));

    const enrichedSchedules = schedules.map((item) => {
      const relatedOrder = item.orderId ? ordersMap.get(item.orderId) || null : null;
      return {
        ...item,
        order: relatedOrder,
      };
    });

    // Orders eligible for scheduling (Rule: ONLY after payment confirmation)
    const ordersReady = await prisma.order.findMany({
      where: {
        status: {
          in: [
            "NEED_TO_GET_ORDER",
            "SHIPPING_IN_US",
            "SHIPPING_TO_CR",
            "IN_COSTA_RICA",
            "IN_WAREHOUSE_CHECK",
            "PROGRAM_SERVICE",
            "WAITING_ON_DELIVERY",
            "PICKUP_DATE_SET",
            "INSTALLING",
            "READY_TO_SET_RETURN_DATE",
            "HOME_INSTALL_SET",
            "READY_FOR_PICKUP",
            "READY_TO_PICK_UP",
            "READY_FOR_INSTALL",
            "COMPLETED",
            "PAID",
            "CONFIRMED",
          ],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      schedules: enrichedSchedules,
      ordersReady,
    });
  } catch (error) {
    console.error("[SYS_SERVICES_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al cargar la agenda de servicios" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const {
      id,
      status,
      paymentStatus,
      paymentProofUrl,
      date,
      time,
      serviceType,
      destinationAddress,
      distanceKm,
      costCRC,
      clientName,
      clientPhone,
      isFullDay,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de servicio requerido" },
        { status: 400 }
      );
    }

    const existingSchedule = await prisma.serviceSchedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { success: false, error: "Servicio programado no encontrado" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (paymentProofUrl !== undefined) updateData.paymentProofUrl = paymentProofUrl;
    if (date) updateData.date = date;
    if (serviceType) updateData.serviceType = serviceType;
    if (destinationAddress !== undefined) updateData.destinationAddress = destinationAddress;
    if (distanceKm !== undefined) updateData.distanceKm = Number(distanceKm) || 0;
    if (costCRC !== undefined) updateData.costCRC = Number(costCRC) || 0;
    if (clientName !== undefined) updateData.clientName = clientName;
    if (clientPhone !== undefined) updateData.clientPhone = clientPhone;
    if (isFullDay !== undefined) updateData.isFullDay = Boolean(isFullDay);

    if (time) {
      updateData.time = time;
      if (time.includes(":")) {
        const parts = time.split(":");
        const timeMin = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        updateData.timeMinutes = timeMin;
        const fullDayCheck = isFullDay !== undefined ? isFullDay : existingSchedule.isFullDay;
        updateData.blockedStartMin = fullDayCheck ? 480 : Math.max(0, timeMin - 30);
        updateData.blockedEndMin = fullDayCheck ? 1200 : Math.min(1439, timeMin + 30);
      }
    }

    const updated = await prisma.serviceSchedule.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Servicio actualizado exitosamente",
      schedule: updated,
    });
  } catch (error) {
    console.error("[SYS_SERVICES_PATCH_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al actualizar servicio" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const {
      orderId,
      serviceType = "shop_installation",
      scheduledDate,
      timeSlot = "10:00",
      destinationAddress = "",
      distanceKm = 0,
      costCRC = 0,
      paymentProofUrl = null,
      paymentStatus = "PENDING",
      clientName = "",
      clientPhone = "",
      status = "CONFIRMED",
      isFullDay: explicitFullDay,
    } = body;

    if (!scheduledDate) {
      return NextResponse.json(
        { success: false, error: "Fecha de servicio es requerida" },
        { status: 400 }
      );
    }

    let targetTimeMinutes = 600;
    if (timeSlot.includes(":")) {
      const parts = timeSlot.split(":");
      targetTimeMinutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }

    const isBlockedDay = serviceType === "ruta_barrial" || serviceType === "blocked_day" || status === "BLOCKED";
    const isFullDay = explicitFullDay !== undefined
      ? Boolean(explicitFullDay)
      : serviceType === "installation" || isBlockedDay;

    const code = generateAppointmentCode(isBlockedDay);

    const newSchedule = await prisma.serviceSchedule.create({
      data: {
        appointmentCode: code,
        orderId: orderId || null,
        serviceType,
        date: scheduledDate,
        time: timeSlot,
        timeMinutes: targetTimeMinutes,
        durationMinutes: isFullDay ? 480 : 30,
        travelDurationMin: 0,
        prepBufferMin: 15,
        blockedStartMin: isFullDay ? 480 : Math.max(0, targetTimeMinutes - 30),
        blockedEndMin: isFullDay ? 1200 : Math.min(1439, targetTimeMinutes + 30),
        isFullDay,
        destinationAddress: destinationAddress || (isBlockedDay ? (serviceType === "ruta_barrial" ? "Ruta BarrialCR" : "Día Bloqueado") : null),
        distanceKm: Number(distanceKm) || 0,
        clientName: clientName || (isBlockedDay ? (serviceType === "ruta_barrial" ? "Ruta BarrialCR" : "Bloqueo Taller") : null),
        clientPhone: clientPhone || null,
        costCRC: Number(costCRC) || 0,
        paymentStatus: isBlockedDay
          ? "PAID"
          : paymentStatus || (costCRC > 0 && paymentProofUrl ? "PAID" : costCRC === 0 ? "PAID" : "PENDING"),
        paymentProofUrl: paymentProofUrl || null,
        status: isBlockedDay ? "BLOCKED" : status || "CONFIRMED",
      },
    });

    if (orderId) {
      // Map serviceType
      const mappedType =
        serviceType === "shop_installation"
          ? "STORE_PICKUP"
          : serviceType === "pickup"
          ? "UTV_PICKUP"
          : serviceType === "delivery"
          ? "SHIPPING"
          : "HOME_SERVICE";

      await prisma.order.update({
        where: { id: orderId },
        data: {
          serviceType: mappedType,
          shippingAddress: destinationAddress || undefined,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: isBlockedDay ? "Día bloqueado exitosamente" : "Servicio programado exitosamente",
      schedule: newSchedule,
    });
  } catch (error) {
    console.error("[SYS_SERVICES_POST_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al programar servicio o bloquear fecha" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");
    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID de servicio requerido para eliminar" },
        { status: 400 }
      );
    }

    const existing = await prisma.serviceSchedule.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Cita de servicio no encontrada" },
        { status: 404 }
      );
    }

    await prisma.serviceSchedule.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Cita de servicio eliminada exitosamente",
      deletedId: id,
    });
  } catch (error) {
    console.error("[SYS_SERVICES_DELETE_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al eliminar la cita de servicio" },
      { status: 500 }
    );
  }
}
