import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCustomerSession } from "@/lib/customerAuth";

export async function PUT(request: Request) {
  try {
    const session = await getCustomerSession();

    if (!session) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const { displayName } = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        displayName: displayName !== undefined ? (displayName?.trim() || null) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        photoUrl: updatedUser.photoUrl,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Error in /api/user/profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
