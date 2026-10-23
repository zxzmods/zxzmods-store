import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customerAuth";
import { getStealthSession } from "@/lib/stealthAuth";
import { sanitizePlainText } from "@/lib/security/inputSanitizer";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await request.json().catch(() => ({}));
    const { text, authorName, authorRole = "CUSTOMER", claimToken } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { success: false, error: "El comentario no puede estar vacío" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Orden no encontrada" },
        { status: 404 }
      );
    }

    const customerSession = await getCustomerSession();
    const stealthSession = await getStealthSession();
    const isStaff = Boolean(stealthSession && (stealthSession.role === "MASTER" || stealthSession.role === "STAFF"));
    const isOwner = Boolean(customerSession && order.userId === customerSession.userId);
    const hasValidClaimToken = Boolean(claimToken && order.claimToken === claimToken);

    if (!isOwner && !isStaff && !hasValidClaimToken) {
      return NextResponse.json(
        { success: false, error: "No autorizado para comentar en esta orden" },
        { status: 403 }
      );
    }

    // Role spoofing defense: strictly forbid non-staff callers from using STAFF role
    const verifiedRole = isStaff && authorRole === "STAFF" ? "STAFF" : "CUSTOMER";
    const verifiedName = isStaff && authorRole === "STAFF"
      ? (stealthSession?.displayName || "Personal ZxZ")
      : (authorName || customerSession?.email?.split("@")[0] || "Cliente");

    let existingComments: any[] = [];
    try {
      existingComments = JSON.parse((order as any).commentsJson || "[]");
      if (!Array.isArray(existingComments)) existingComments = [];
    } catch {
      existingComments = [];
    }

    const newComment = {
      id: `cmt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      authorRole: verifiedRole,
      authorName: sanitizePlainText(verifiedName, 60),
      text: sanitizePlainText(text, 1000), // Max 1000 chars length limit & XSS sanitized
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [...existingComments, newComment];

    await prisma.order.update({
      where: { id: order.id },
      data: {
        commentsJson: JSON.stringify(updatedComments),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      comment: newComment,
      comments: updatedComments,
    });
  } catch (error) {
    console.error("Error in POST /api/orders/[id]/comments:", error);
    return NextResponse.json(
      { success: false, error: "Error al registrar el comentario" },
      { status: 500 }
    );
  }
}
