import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customerAuth";
import { sanitizePlainText } from "@/lib/security/inputSanitizer";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCustomerSession();

    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const userId = session.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    const serviceId = params.id;
    const body = await request.json().catch(() => ({}));
    const { text } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { success: false, error: "El comentario no puede estar vacío" },
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
        { success: false, error: "No tienes permiso para comentar en este servicio" },
        { status: 403 }
      );
    }

    // REGARDLESS of time to delivery, comments can always be added!
    let existingComments: any[] = [];
    try {
      existingComments = JSON.parse(schedule.commentsJson || "[]");
      if (!Array.isArray(existingComments)) existingComments = [];
    } catch {
      existingComments = [];
    }

    const authorDisplayName = sanitizePlainText(
      user.displayName?.trim() || user.email?.split("@")[0] || "Cliente",
      60
    );

    const newComment = {
      id: `cmt-srv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      authorRole: "CUSTOMER" as const,
      authorName: authorDisplayName,
      text: sanitizePlainText(text, 1000),
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [...existingComments, newComment];

    // Update ServiceSchedule
    await prisma.serviceSchedule.update({
      where: { id: schedule.id },
      data: {
        commentsJson: JSON.stringify(updatedComments),
        updatedAt: new Date(),
      },
    });

    // Also mirror to Order comments if linked
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
          orderComments.push({
            id: newComment.id,
            authorRole: "CUSTOMER",
            authorName: `${authorDisplayName} (Servicio)`,
            text: newComment.text,
            createdAt: newComment.createdAt,
          });
          await prisma.order.update({
            where: { id: linkedOrder.id },
            data: {
              commentsJson: JSON.stringify(orderComments),
              updatedAt: new Date(),
            },
          });
        }
      } catch (syncErr) {
        console.error("Error mirroring comment to order:", syncErr);
      }
    }

    return NextResponse.json({
      success: true,
      comment: newComment,
      comments: updatedComments,
    });
  } catch (error) {
    console.error("Error in POST /api/user/services/[id]/comments:", error);
    return NextResponse.json(
      { success: false, error: "Error al registrar el comentario" },
      { status: 500 }
    );
  }
}
