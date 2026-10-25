import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { parseTimeToMinutes, formatMinutesToTime } from "@/lib/serviceSchedules";

function generateAppointmentCode(isBlocked = false): string {
  const prefix = isBlocked ? "BLK" : "SRV";
  const num = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${num}`;
}

export async function GET(request: Request) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();

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
        guestEmail: true,
        shippingAddress: true,
        itemsJson: true,
        paymentProofUrl: true,
        totalCRC: true,
        userId: true,
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    const ordersMap = new Map(orders.map((o) => [o.id, o]));

    // Fetch users for any schedule or order with a userId
    const allUserIds = Array.from(
      new Set(
        [
          ...schedules.map((s) => s.userId),
          ...orders.map((o) => o.userId),
        ].filter(Boolean) as string[]
      )
    );

    const users = allUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: allUserIds } },
          select: {
            id: true,
            displayName: true,
            email: true,
            phoneNumber: true,
          },
        })
      : [];

    const usersMap = new Map(users.map((u) => [u.id, u]));

    let enrichedSchedules = schedules.map((item) => {
      const relatedOrder = item.orderId ? ordersMap.get(item.orderId) || null : null;
      const relatedUser = item.userId
        ? usersMap.get(item.userId) || null
        : relatedOrder?.user || (relatedOrder?.userId ? usersMap.get(relatedOrder.userId) || null : null);

      const resolvedClientName =
        item.clientName ||
        relatedOrder?.customerName ||
        relatedUser?.displayName ||
        null;

      const resolvedClientPhone =
        item.clientPhone ||
        relatedOrder?.customerPhone ||
        relatedUser?.phoneNumber ||
        null;

      return {
        ...item,
        clientName: resolvedClientName,
        clientPhone: resolvedClientPhone,
        order: relatedOrder
          ? {
              ...relatedOrder,
              customerName: relatedOrder.customerName || relatedUser?.displayName || null,
              customerPhone: relatedOrder.customerPhone || relatedUser?.phoneNumber || null,
            }
          : null,
        user: relatedUser,
      };
    });

    if (search) {
      enrichedSchedules = enrichedSchedules.filter((s) => {
        const code = (s.appointmentCode || "").toLowerCase();
        const ord = (s.order?.orderNumber || "").toLowerCase();
        const client = (s.clientName || "").toLowerCase();
        const phone = (s.clientPhone || "").toLowerCase();
        const userEmail = (s.user?.email || "").toLowerCase();
        const dest = (s.destinationAddress || "").toLowerCase();
        return (
          code.includes(search) ||
          ord.includes(search) ||
          client.includes(search) ||
          phone.includes(search) ||
          userEmail.includes(search) ||
          dest.includes(search)
        );
      });
    }

    // Orders eligible for scheduling (Rule: ONLY after payment confirmation)
    const rawOrdersReady = await prisma.order.findMany({
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
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const ordersReady = rawOrdersReady.map((o) => ({
      ...o,
      customerName: o.customerName || o.user?.displayName || null,
      customerPhone: o.customerPhone || o.user?.phoneNumber || null,
      guestEmail: o.guestEmail || o.user?.email || null,
    }));

    // Warranty Protection Orders (GAR-) tracked specifically inside Services Agenda
    const rawWarrantyOrders = await prisma.order.findMany({
      where: {
        orderNumber: { startsWith: "GAR-" },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const warrantyOrders = rawWarrantyOrders.map((o) => ({
      ...o,
      customerName: o.customerName || o.user?.displayName || null,
      customerPhone: o.customerPhone || o.user?.phoneNumber || null,
      guestEmail: o.guestEmail || o.user?.email || null,
    }));

    // Fetch workshop capacity
    let maxConcurrentInstallations = 1;
    try {
      const cfg = await prisma.logisticsRateConfig.findUnique({
        where: { id: "rates-config" },
        select: { maxConcurrentInstallations: true },
      });
      if (cfg?.maxConcurrentInstallations) {
        maxConcurrentInstallations = cfg.maxConcurrentInstallations;
      }
    } catch {}

    return NextResponse.json({
      success: true,
      schedules: enrichedSchedules,
      ordersReady,
      warrantyOrders,
      maxConcurrentInstallations,
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
      installationDurationMin,
      workshopArrivalMinutes,
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

    if (installationDurationMin !== undefined) {
      updateData.installationDurationMin = Math.max(15, parseInt(String(installationDurationMin), 10) || 60);
      updateData.durationMinutes = updateData.installationDurationMin;
    }

    if (workshopArrivalMinutes !== undefined) {
      updateData.workshopArrivalMinutes = Math.max(0, parseInt(String(workshopArrivalMinutes), 10) || 0);
    }

    if (time) {
      updateData.time = time;
      if (time.includes(":")) {
        const parts = time.split(":");
        const timeMin = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        updateData.timeMinutes = timeMin;
        const fullDayCheck = isFullDay !== undefined ? isFullDay : existingSchedule.isFullDay;
        const travelMin = existingSchedule.travelDurationMin || 0;
        updateData.blockedStartMin = fullDayCheck ? 480 : Math.max(0, timeMin - travelMin - 15);
        updateData.blockedEndMin = fullDayCheck ? 1200 : Math.min(1439, timeMin + travelMin + 15);
      }
    }

    const effectiveServiceType = serviceType || existingSchedule.serviceType;
    const effectiveDate = date || existingSchedule.date;
    const effectiveTimeMin = updateData.timeMinutes ?? existingSchedule.timeMinutes;
    const effectiveInstallDuration = updateData.installationDurationMin ?? (existingSchedule.installationDurationMin || 60);
    const effectiveTravelMin = existingSchedule.travelDurationMin || 0;

    if (effectiveServiceType === "pickup" || effectiveServiceType === "UTV_PICKUP") {
      // For pick-up, workshop arrival can be explicitly adjusted independently from customer pick-up time
      const arrival = updateData.workshopArrivalMinutes !== undefined
        ? updateData.workshopArrivalMinutes
        : (existingSchedule.workshopArrivalMinutes ?? (effectiveTimeMin + effectiveTravelMin + 30));
      updateData.workshopArrivalMinutes = arrival;
      const totalFinish = arrival + effectiveInstallDuration + 30;
      if (totalFinish > 1200) {
        updateData.carryoverNextDayMinutes = totalFinish - 1200;
        const [y, m, d] = effectiveDate.split("-").map(Number);
        const dt = new Date(y, m - 1, d);
        dt.setDate(dt.getDate() + 1);
        updateData.carryoverDate = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      } else {
        updateData.carryoverNextDayMinutes = 0;
        updateData.carryoverDate = null;
      }
    } else if (effectiveServiceType === "shop_installation") {
      const arrival = updateData.workshopArrivalMinutes !== undefined
        ? updateData.workshopArrivalMinutes
        : effectiveTimeMin;
      updateData.workshopArrivalMinutes = arrival;
      const totalFinish = arrival + effectiveInstallDuration + 30;
      if (totalFinish > 1200) {
        updateData.carryoverNextDayMinutes = totalFinish - 1200;
        const [y, m, d] = effectiveDate.split("-").map(Number);
        const dt = new Date(y, m - 1, d);
        dt.setDate(dt.getDate() + 1);
        updateData.carryoverDate = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      } else {
        updateData.carryoverNextDayMinutes = 0;
        updateData.carryoverDate = null;
      }
    }

    const updated = await prisma.serviceSchedule.update({
      where: { id },
      data: updateData,
    });

    if (existingSchedule.orderId) {
      try {
        const ord = await prisma.order.findUnique({
          where: { id: existingSchedule.orderId },
          select: { serviceDocumentsJson: true },
        });
        if (ord?.serviceDocumentsJson) {
          const doc = typeof ord.serviceDocumentsJson === "string" ? JSON.parse(ord.serviceDocumentsJson) : ord.serviceDocumentsJson;
          doc.installationDurationMinutes = effectiveInstallDuration;
          if (updateData.time) doc.timeSlot = updateData.time;
          if (date) doc.scheduledDate = date;
          await prisma.order.update({
            where: { id: existingSchedule.orderId },
            data: { serviceDocumentsJson: JSON.stringify(doc) },
          });
        }
      } catch (err) {
        console.warn("[SYS_SERVICES_PATCH_ORDER_SYNC_WARN]:", err);
      }
    }

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

    const isBlocked =
      serviceType === "ruta_barrial" ||
      serviceType === "blocked_day" ||
      serviceType === "blocked_hours" ||
      status === "BLOCKED";

    const isFullDay =
      explicitFullDay !== undefined
        ? Boolean(explicitFullDay)
        : serviceType === "installation" || (isBlocked && serviceType !== "blocked_hours" && !body.startHour);

    const startHourStr = body.startHour || (timeSlot ? timeSlot.split("-")[0].trim() : "08:00");
    const endHourStr = body.endHour || (timeSlot && timeSlot.includes("-") ? timeSlot.split("-")[1].trim() : "20:00");

    const startMin = parseTimeToMinutes(startHourStr);
    let endMin = parseTimeToMinutes(endHourStr);
    if (!isFullDay && endMin <= startMin) {
      endMin = Math.min(1200, startMin + 60);
    }

    const targetTimeMinutes = isFullDay ? 480 : startMin;
    const blockedStartMin = isFullDay ? 480 : startMin;
    const blockedEndMin = isFullDay ? 1200 : endMin;
    const durationMinutes = isFullDay ? 480 : Math.max(30, endMin - startMin);

    const formattedTime = isFullDay
      ? timeSlot || "08:00"
      : `${formatMinutesToTime(startMin).time24} - ${formatMinutesToTime(endMin).time24}`;

    const code = generateAppointmentCode(isBlocked);

    const defaultAddress = isBlocked
      ? serviceType === "ruta_barrial"
        ? "Ruta BarrialCR"
        : body.reason || (isFullDay ? "Día Bloqueado por Taller" : "Horas Bloqueadas (Taller)")
      : null;

    const defaultClient = isBlocked
      ? serviceType === "ruta_barrial"
        ? "Ruta BarrialCR"
        : "Bloqueo Interno Taller"
      : null;

    const newSchedule = await prisma.serviceSchedule.create({
      data: {
        appointmentCode: code,
        orderId: orderId || null,
        serviceType: isBlocked && !isFullDay ? "blocked_hours" : serviceType,
        date: scheduledDate,
        time: formattedTime,
        timeMinutes: targetTimeMinutes,
        durationMinutes,
        travelDurationMin: 0,
        prepBufferMin: 15,
        blockedStartMin,
        blockedEndMin,
        isFullDay,
        destinationAddress: destinationAddress || defaultAddress,
        distanceKm: Number(distanceKm) || 0,
        clientName: clientName || defaultClient,
        clientPhone: clientPhone || null,
        costCRC: Number(costCRC) || 0,
        paymentStatus: isBlocked
          ? "PAID"
          : paymentStatus || (costCRC > 0 && paymentProofUrl ? "PAID" : costCRC === 0 ? "PAID" : "PENDING"),
        paymentProofUrl: paymentProofUrl || null,
        status: isBlocked ? "BLOCKED" : status || "CONFIRMED",
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
      message: isBlocked ? "Bloqueo registrado exitosamente" : "Servicio programado exitosamente",
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
