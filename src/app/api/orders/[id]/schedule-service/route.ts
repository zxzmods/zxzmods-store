import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStealthSession } from "@/lib/stealthAuth";
import { sendOrderStepNotificationEmail } from "@/lib/orderStepEmails";
import {
  liftExpiredRejectedServiceSchedules,
  checkServiceSlotCollision,
  parseTimeToMinutes,
} from "@/lib/serviceSchedules";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderIdentifier = params.id;
    const body = await request.json();
    const isReturnBooking = Boolean(body.isReturnBooking);

    const {
      serviceType = "installation",
      scheduledDate,
      timeSlot,
      destinationAddress,
      distanceKm = 0,
      serviceCostCRC = 0,
      paymentProofUrl = null,
      customerPhone = null,
      travelMinutes = 0,
      orderIds = [],
    } = body;

    if (!scheduledDate) {
      return NextResponse.json(
        { success: false, error: "Debes seleccionar una fecha para el servicio" },
        { status: 400 }
      );
    }

    // 48 hours minimum advance booking restriction:
    // Today is day 0 (blocked), tomorrow is day 1 (blocked), +2 days is day 2 (blocked).
    // Earliest allowed date for customers is day 3 (+48h full advance). Only staff can bypass.
    const stealthAuth = await requireStealthSession();
    const isStaff = stealthAuth.authorized && (stealthAuth.session.role === "STAFF" || stealthAuth.session.role === "MASTER");

    if (!isStaff && scheduledDate) {
      const schedDateObj = new Date(scheduledDate + "T00:00:00");
      const now = new Date();
      const todayDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffDays = Math.round((schedDateObj.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 3) {
        return NextResponse.json(
          {
            success: false,
            error: "Las citas de servicio deben programarse con un mínimo de 48 horas de anticipación (excluyendo hoy y los próximos 2 días).",
          },
          { status: 400 }
        );
      }
    }

    // Determine target order IDs (support single ID from URL params or multiple orderIds)
    const targetIds: string[] = Array.isArray(orderIds) && orderIds.length > 0
      ? Array.from(new Set([orderIdentifier, ...orderIds]))
      : [orderIdentifier];

    const allOrders = await prisma.order.findMany({
      where: {
        OR: targetIds.flatMap((id) => [{ id }, { orderNumber: id }]),
      },
    });

    if (allOrders.length === 0) {
      return NextResponse.json(
        { success: false, error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    const order = allOrders[0];

    // Find any existing active service schedules for these orders
    const existingActiveSchedules = await prisma.serviceSchedule.findMany({
      where: {
        OR: targetIds.flatMap((id) => [{ orderId: id }]),
        status: { not: "CANCELLED" },
      },
      select: { orderId: true },
    });
    const scheduledOrderIds = new Set(existingActiveSchedules.map((s) => s.orderId));

    const isAfterPaymentConfirmation = (status: string) => {
      const s = (status || "").toUpperCase();
      return [
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
      ].includes(s);
    };

    // Check all orders qualify and are NOT already in service payment confirmation or already scheduled
    for (const ord of allOrders) {
      const s = (ord.status || "").toUpperCase();
      if (s === "CONFIRM_SERVICE_PAYMENT") {
        return NextResponse.json(
          {
            success: false,
            error: `La orden #${ord.orderNumber} ya cuenta con un servicio en confirmación de pago. No se puede seleccionar para otro servicio ni pagar doble.`,
          },
          { status: 400 }
        );
      }
      const ordHasSchedule =
        scheduledOrderIds.has(ord.id) || scheduledOrderIds.has(ord.orderNumber);
      if (
        !isReturnBooking &&
        (ordHasSchedule ||
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
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `La orden #${ord.orderNumber} ya tiene un servicio programado y no puede ser programada nuevamente.`,
          },
          { status: 400 }
        );
      }
      if (!isAfterPaymentConfirmation(ord.status)) {
        return NextResponse.json(
          {
            success: false,
            error: `La orden #${ord.orderNumber} solo puede programarse después de confirmación de pago.`,
          },
          { status: 400 }
        );
      }
    }

    // Master Rule: If serviceType is "pickup", verify that Pick-Up service is currently enabled
    if (serviceType === "pickup" || serviceType === "UTV_PICKUP") {
      try {
        const config = await prisma.logisticsRateConfig.findUnique({
          where: { id: "rates-config" },
          select: { pickupServiceEnabled: true },
        });
        if (config && config.pickupServiceEnabled !== undefined && config.pickupServiceEnabled !== null) {
          if (!Boolean(config.pickupServiceEnabled)) {
            return NextResponse.json(
              {
                success: false,
                error: "El servicio de Pick-up de Vehículo se encuentra temporalmente fuera de operación por mantenimiento de la unidad de transporte.",
              },
              { status: 400 }
            );
          }
        }
      } catch (e) {
        console.warn("Could not check pickupServiceEnabled in schedule-service:", e);
      }

      // Vehicle Compatibility Rule: verify vehicle compatibility from garage catalog
      try {
        let vehicleModelSlugToCheck: string | null = body.vehicleModelSlug || null;
        const sessionUserId = stealthAuth.authorized ? stealthAuth.session.userId : null;
        const targetUserId = order.userId || sessionUserId;

        if (!vehicleModelSlugToCheck && targetUserId) {
          const activeGarageVehicle = await prisma.garageVehicle.findFirst({
            where: {
              userId: targetUserId,
              isActive: true,
            },
          });
          if (activeGarageVehicle) {
            vehicleModelSlugToCheck = activeGarageVehicle.modelSlug;
          }
        }

        if (!vehicleModelSlugToCheck) {
          try {
            const doc = typeof order.serviceDocumentsJson === "string"
              ? JSON.parse(order.serviceDocumentsJson)
              : (order.serviceDocumentsJson || {});
            if (doc.vehicleModelSlug || doc.modelSlug) {
              vehicleModelSlugToCheck = doc.vehicleModelSlug || doc.modelSlug;
            }
          } catch {}
        }

        if (vehicleModelSlugToCheck) {
          const vehicleModel = await prisma.vehicleModel.findUnique({
            where: { slug: vehicleModelSlugToCheck },
          });
          if (vehicleModel && vehicleModel.pickupServiceAvailable === false) {
            return NextResponse.json(
              {
                success: false,
                error: `El vehículo (${vehicleModel.name}) no es compatible con el servicio de Pick-up (traslado en remolque).`,
              },
              { status: 400 }
            );
          }
        }
      } catch (e) {
        console.warn("Could not check vehicleModel pickupServiceAvailable in schedule-service:", e);
      }
    }

    // User Rule: If serviceType is "installation" (home service), verify that NO product in any order is disqualified
    if (serviceType === "installation") {
      const [ineligibleDbProducts, ineligibleDbCombos, ineligibleDbPackages] = await Promise.all([
        prisma.product.findMany({
          where: { homeInstallationAvailable: false },
          select: { id: true, sku: true },
        }),
        prisma.combo.findMany({
          where: { homeInstallationAvailable: false },
          select: { id: true, slug: true },
        }),
        prisma.performancePackage.findMany({
          where: { homeInstallationAvailable: false },
          select: { id: true, slug: true },
        }),
      ]);

      const ineligibleKeySet = new Set<string>([
        ...ineligibleDbProducts.flatMap((p) => [p.id, p.sku]),
        ...ineligibleDbCombos.flatMap((c) => [c.id, c.slug]),
        ...ineligibleDbPackages.flatMap((pkg) => [pkg.id, pkg.slug]),
      ]);

      for (const ord of allOrders) {
        if (ord.itemsJson) {
          try {
            const items = JSON.parse(ord.itemsJson);
            if (Array.isArray(items)) {
              const hasIneligibleItem = items.some((item: any) => {
                if (item.homeInstallation === false) return true;
                if (item.homeInstallationAvailable === false) return true;
                if (item.inHome_install === false) return true;
                if (item.inHomeInstallEligible === false) return true;
                if (item.id && ineligibleKeySet.has(item.id)) return true;
                if (item.sku && ineligibleKeySet.has(item.sku)) return true;
                return false;
              });

              if (hasIneligibleItem) {
                return NextResponse.json(
                  {
                    success: false,
                    error: `La orden #${ord.orderNumber} contiene productos que no califican para instalación a domicilio. Por favor selecciona instalación en taller o entrega.`,
                  },
                  { status: 400 }
                );
              }
            }
          } catch (e) {
            console.error("Error checking itemsJson for home installation:", e);
          }
        }
      }
    }

    const effectivePhone = (customerPhone || order.customerPhone || "").trim();
    if (!effectivePhone) {
      return NextResponse.json(
        { success: false, error: "Debes ingresar un número de teléfono de contacto" },
        { status: 400 }
      );
    }

    const costNumber = isReturnBooking ? 0 : (Number(serviceCostCRC) || 0);

    const isBacRequested =
      body.paymentMethod === "BAC_COMPRA_CLICK" ||
      body.requestedBacLink === true;

    if (
      costNumber > 0 &&
      serviceType !== "shop_installation" &&
      !paymentProofUrl &&
      !isReturnBooking &&
      !isBacRequested
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Debes adjuntar el comprobante de transferencia bancaria o seleccionar pago con tarjeta BAC Compra Click para reservar este servicio",
        },
        { status: 400 }
      );
    }

    const effectivePaymentProofUrl = isBacRequested
      ? (paymentProofUrl || "BAC_COMPRA_CLICK_AUTH: PENDIENTE")
      : paymentProofUrl;

    // Factura Electrónica for service
    const requiresElectronicInvoice = Boolean(body.requiresElectronicInvoice);
    let electronicInvoiceJson: string | null = null;
    if (requiresElectronicInvoice && body.electronicInvoice) {
      electronicInvoiceJson =
        typeof body.electronicInvoice === "object"
          ? JSON.stringify(body.electronicInvoice)
          : String(body.electronicInvoice);
    }

    // Map serviceType to standard Order schema serviceType
    const mappedType =
      serviceType === "shop_installation"
        ? "STORE_PICKUP"
        : serviceType === "pickup"
        ? "UTV_PICKUP"
        : serviceType === "delivery"
        ? "SHIPPING"
        : "HOME_SERVICE";

    const serviceTitle =
      serviceType === "shop_installation"
        ? "Instalación en Taller (Cliente trae vehículo)"
        : serviceType === "pickup"
        ? "Pick-up de Vehículo"
        : serviceType === "delivery"
        ? "Entrega / Delivery"
        : "Instalación a Domicilio";

    const targetAddress =
      serviceType === "shop_installation"
        ? "Taller ZxZ Mods (Calle 34, Pozos, Santa Ana)"
        : destinationAddress || "Por coordinar";

    const paymentNotePart = isBacRequested
      ? " | Pago con Tarjeta BAC Compra Click solicitado (Enlace por WhatsApp)"
      : effectivePaymentProofUrl
      ? ` | Comprobante de pago: ${effectivePaymentProofUrl}`
      : costNumber === 0
      ? " | Sin costo adicional"
      : "";

    const appointmentNote =
      serviceType === "shop_installation"
        ? `[SERVICIO PROGRAMADO]: Instalación en Taller para el ${scheduledDate} (${timeSlot || "Horario acordado"}). El cliente trae el SxS directamente al taller ZxZ (Calle 34, Pozos, Santa Ana). Sin costo de traslado (₡0). Tel: ${effectivePhone}${paymentNotePart}.`
        : `[SERVICIO PROGRAMADO]: ${serviceTitle} para el ${scheduledDate} (${timeSlot || "Horario acordado"}). Destino: ${targetAddress} (${distanceKm} km, costo: ₡${costNumber.toLocaleString("es-CR")}). Tel: ${effectivePhone}${paymentNotePart}.`;

    const existingNotes = order.notes ? `${order.notes}\n\n` : "";
    const updatedNotes = `${existingNotes}${appointmentNote}`;

    // Travel buffer logic: time from garage to destination + 30m, to time from destination back to garage + 30m.
    // Ex: travel 90min, 1pm (780min) -> blocked 11am (780 - 120) to 3pm (780 + 120).
    const isFullDay = serviceType === "installation";
    const targetTimeMinutes = parseTimeToMinutes(timeSlot);

    const travelMin = Math.max(0, parseInt(travelMinutes || body.travelMinutes || "0", 10) || 0);
    const bufferMin = travelMin + 30;
    const blockedStart = isFullDay ? 480 : Math.max(0, targetTimeMinutes - bufferMin);
    const blockedEnd = isFullDay ? 1200 : Math.min(1439, targetTimeMinutes + bufferMin);

    let clientDisplay = typeof body.clientName === "string" && body.clientName.trim().length > 0
      ? body.clientName.trim()
      : "";

    if (!clientDisplay) {
      const orderUserIds = allOrders.map((o) => o.userId).filter(Boolean) as string[];
      let usersMap = new Map<string, string>();
      if (orderUserIds.length > 0) {
        try {
          const dbUsers = await prisma.user.findMany({
            where: { id: { in: orderUserIds } },
            select: { id: true, displayName: true },
          });
          usersMap = new Map(dbUsers.filter((u) => u.displayName).map((u) => [u.id, u.displayName!]));
        } catch {}
      }

      clientDisplay = allOrders
        .map((o) => o.customerName || (o.userId ? usersMap.get(o.userId) : null) || `#${o.orderNumber}`)
        .filter(Boolean)
        .join(", ");
    }

    // Calculate total installation duration for the target orders
    let totalOrderInstallDuration = 0;
    for (const ord of allOrders) {
      if (ord.serviceDocumentsJson) {
        try {
          const doc = typeof ord.serviceDocumentsJson === "string" ? JSON.parse(ord.serviceDocumentsJson) : ord.serviceDocumentsJson;
          if (typeof doc?.installationDurationMinutes === "number" && doc.installationDurationMinutes > 0) {
            totalOrderInstallDuration += doc.installationDurationMinutes;
          }
        } catch {}
      }
      if (ord.itemsJson) {
        try {
          const items = typeof ord.itemsJson === "string" ? JSON.parse(ord.itemsJson) : ord.itemsJson;
          if (Array.isArray(items)) {
            const itemSum = items.reduce((sum: number, it: any) => sum + (Number(it.installationDurationMinutes) || 60) * (Number(it.quantity) || 1), 0);
            if (totalOrderInstallDuration === 0 && itemSum > 0) totalOrderInstallDuration += itemSum;
          }
        } catch {}
      }
    }
    if (totalOrderInstallDuration <= 0) totalOrderInstallDuration = 60;

    // Concurrency & Collision Prevention Transaction with N+1 Query Validation
    const { scheduleRecord, updatedOrders } = await prisma.$transaction(async (tx) => {
      // 1. Lift expired rejected schedules (>48h)
      await liftExpiredRejectedServiceSchedules(tx);

      // 2. Atomic Collision Check: First to finish checkout or send BAC request reserves the time
      const collisionCheck = await checkServiceSlotCollision(
        {
          scheduledDate,
          timeMinutes: targetTimeMinutes,
          travelMinutes: travelMin,
          installationDurationMinutes: totalOrderInstallDuration,
          serviceType,
          isFullDay,
          excludeOrderId: order.id,
        },
        tx
      );

      if (collisionCheck.hasCollision) {
        const collisionErr: any = new Error(
          collisionCheck.reason ||
            "El horario seleccionado acaba de ser reservado por otro cliente. Por favor selecciona otra fecha u horario disponible."
        );
        collisionErr.code = "SLOT_ALREADY_TAKEN";
        collisionErr.status = 409;
        throw collisionErr;
      }

      // 3. N+1 Query Method: Check every linked order for active confirmation or existing scheduled service
      for (const ord of allOrders) {
        const fresh = await tx.order.findUnique({
          where: { id: ord.id },
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        });

        if (fresh) {
          const freshStatus = (fresh.status || "").toUpperCase();
          if (freshStatus === "CONFIRM_SERVICE_PAYMENT") {
            const confErr: any = new Error(
              `La orden #${fresh.orderNumber} ya tiene un servicio en confirmación de pago. No es posible pagar doble.`
            );
            confErr.code = "ORDER_ALREADY_IN_CONFIRMATION";
            confErr.status = 400;
            throw confErr;
          }

          const freshSchedule = await tx.serviceSchedule.findFirst({
            where: {
              OR: [{ orderId: fresh.id }, { orderId: fresh.orderNumber }],
              status: { not: "CANCELLED" },
            },
            select: { id: true },
          });

          const hasFreshSchedule = Boolean(freshSchedule);

          if (
            !isReturnBooking &&
            (hasFreshSchedule ||
              [
                "WAITING_ON_DELIVERY",
                "PICKUP_DATE_SET",
                "HOME_INSTALL_SET",
                "INSTALLING",
                "INSTALLATION_PAYMENT",
                "READY_FOR_PICKUP",
                "READY_TO_PICK_UP",
                "COMPLETED",
              ].includes(freshStatus))
          ) {
            const progErr: any = new Error(
              `La orden #${fresh.orderNumber} ya tiene un servicio programado y no puede ser programada nuevamente.`
            );
            progErr.code = "ORDER_ALREADY_PROGRAMMED";
            progErr.status = 400;
            throw progErr;
          }
        }
      }

      // 4. Update orders in database
      const updatedList = [];
      for (let idx = 0; idx < allOrders.length; idx++) {
        const ord = allOrders[idx];
        let existingDoc: any = {};
        try {
          existingDoc =
            typeof ord.serviceDocumentsJson === "string"
              ? JSON.parse(ord.serviceDocumentsJson)
              : ord.serviceDocumentsJson || {};
        } catch {}

        const updatedDoc = {
          ...existingDoc,
          serviceType: mappedType,
          scheduledDate,
          timeSlot: timeSlot || "10:00",
          destinationAddress: targetAddress,
          distanceKm: Number(distanceKm) || 0,
          serviceCostCRC: costNumber,
          deliveryAddress: targetAddress,
          pickupOriginAddress: mappedType === "UTV_PICKUP" ? targetAddress : existingDoc.pickupOriginAddress,
          contactPhone: effectivePhone,
          servicePaidCurrency: body.paidCurrency
            ? String(body.paidCurrency).toUpperCase() === "USD"
              ? "USD"
              : "CRC"
            : "CRC",
        };

        if (isBacRequested) {
          updatedDoc.paymentMethod = "BAC_COMPRA_CLICK";
          updatedDoc.requestedBacLink = true;
          updatedDoc.bacRequestedAt = new Date().toISOString();
        }

        const targetStatus = isReturnBooking
          ? "READY_FOR_PICKUP"
          : serviceType === "shop_installation"
          ? "INSTALLING"
          : "CONFIRM_SERVICE_PAYMENT";

        const updateData: any = {
          serviceType: mappedType,
          shippingAddress: destinationAddress || ord.shippingAddress,
          customerPhone: effectivePhone,
          status: targetStatus,
          serviceDocumentsJson: JSON.stringify(updatedDoc),
          notes: ord.notes ? `${ord.notes}\n\n${appointmentNote}` : appointmentNote,
          updatedAt: new Date(),
        };

        if (effectivePaymentProofUrl) {
          updateData.servicePaymentProofUrl = effectivePaymentProofUrl;
        }

        if (requiresElectronicInvoice) {
          updateData.requiresElectronicInvoice = true;
          if (electronicInvoiceJson) {
            updateData.electronicInvoiceJson = electronicInvoiceJson;
          }
        }

        if (idx === 0) {
          if (serviceType === "delivery" && costNumber > 0) {
            updateData.shippingCostCRC = costNumber;
          } else if (serviceType === "installation" && costNumber > 0) {
            updateData.installationCostCRC = costNumber;
          } else if (serviceType === "pickup" && costNumber > 0 && !isReturnBooking) {
            updateData.pickupCostCRC = costNumber;
          }
        }
        if (body.paidCurrency && !ord.paidCurrency) {
          updateData.paidCurrency =
            String(body.paidCurrency).toUpperCase() === "USD" ? "USD" : "CRC";
        }

        const updated = await tx.order.update({
          where: { id: ord.id },
          data: updateData,
        });
        updatedList.push(updated);
      }

      // Compute workshop arrival, end minutes, and carryover
      let schedWorkshopArrival: number | null = null;
      let schedCarryoverMin = 0;
      let schedCarryoverDate: string | null = null;
      let schedBlockedEnd = blockedEnd;

      if (serviceType === "pickup" || serviceType === "UTV_PICKUP") {
        schedWorkshopArrival = targetTimeMinutes + travelMin + 30;
        const totalFinish = schedWorkshopArrival + totalOrderInstallDuration + 30;
        if (totalFinish > 1200) {
          schedCarryoverMin = totalFinish - 1200;
          schedBlockedEnd = 1200;
          const [y, m, d] = scheduledDate.split("-").map(Number);
          const dt = new Date(y, m - 1, d);
          dt.setDate(dt.getDate() + 1);
          schedCarryoverDate = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
        } else {
          schedBlockedEnd = totalFinish;
        }
      } else if (serviceType === "shop_installation") {
        schedWorkshopArrival = targetTimeMinutes;
        const totalFinish = targetTimeMinutes + totalOrderInstallDuration + 30;
        if (totalFinish > 1200) {
          schedCarryoverMin = totalFinish - 1200;
          schedBlockedEnd = 1200;
          const [y, m, d] = scheduledDate.split("-").map(Number);
          const dt = new Date(y, m - 1, d);
          dt.setDate(dt.getDate() + 1);
          schedCarryoverDate = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
        } else {
          schedBlockedEnd = totalFinish;
        }
      }

      // 5. Query N+1: Create ServiceSchedule to immediately reserve the slot
      const newSchedule = await tx.serviceSchedule.create({
        data: {
          appointmentCode: `SRV-${Math.floor(100000 + Math.random() * 900000)}`,
          orderId: order.id,
          userId: order.userId || null,
          commentsJson: "[]",
          serviceType,
          date: scheduledDate,
          time: timeSlot || "10:00",
          timeMinutes: targetTimeMinutes,
          durationMinutes: isFullDay ? 480 : totalOrderInstallDuration,
          installationDurationMin: totalOrderInstallDuration,
          workshopArrivalMinutes: schedWorkshopArrival,
          travelDurationMin: travelMin,
          prepBufferMin: 15,
          blockedStartMin: blockedStart,
          blockedEndMin: schedBlockedEnd,
          carryoverNextDayMinutes: schedCarryoverMin,
          carryoverDate: schedCarryoverDate,
          isFullDay,
          destinationAddress: targetAddress,
          distanceKm: Number(distanceKm) || 0,
          clientName: clientDisplay,
          clientPhone: effectivePhone,
          status: "CONFIRMED",
          costCRC: isReturnBooking || serviceType === "shop_installation" ? 0 : costNumber,
          paymentStatus:
            serviceType === "shop_installation" || isReturnBooking
              ? "PAID"
              : costNumber === 0
              ? "PAID"
              : "PENDING",
          paymentProofUrl: effectivePaymentProofUrl || null,
        },
      });

      return { scheduleRecord: newSchedule, updatedOrders: updatedList };
    });

    if (serviceType === "pickup" || serviceType === "UTV_PICKUP") {
      void sendOrderStepNotificationEmail({
        step: "PICK_UP_DATE_SET",
        order: updatedOrders[0],
        pickupDate: scheduledDate,
        pickupTime: timeSlot,
        pickupAddress: targetAddress,
      }).catch((err) => console.error("[SCHEDULE_PICKUP_EMAIL_ERR]:", err));
    }

    return NextResponse.json({
      success: true,
      message: "Servicio programado exitosamente",
      order: {
        ...updatedOrders[0],
        serviceSchedule: scheduleRecord,
      },
      orders: updatedOrders,
      schedule: scheduleRecord,
    });
  } catch (error: any) {
    console.error("Error scheduling service for order:", error);

    if (error?.code === "SLOT_ALREADY_TAKEN" || error?.status === 409) {
      return NextResponse.json(
        {
          success: false,
          conflict: true,
          code: "SLOT_ALREADY_TAKEN",
          error:
            error.message ||
            "El horario seleccionado acaba de ser reservado por otro cliente. Por favor selecciona otra fecha u horario disponible.",
        },
        { status: 409 }
      );
    }

    if (error?.code === "ORDER_ALREADY_IN_CONFIRMATION" || error?.status === 400) {
      return NextResponse.json(
        {
          success: false,
          error: error.message || "La orden ya cuenta con un servicio en confirmación de pago.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error?.message || "Error al programar el servicio" },
      { status: 500 }
    );
  }
}
