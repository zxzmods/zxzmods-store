import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const cookieStore = cookies();
    const sessionId = cookieStore.get("zxz_garage_session")?.value;

    const existing = await prisma.garageVehicle.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Vehicle not found" },
        { status: 404 }
      );
    }

    const wasActive = existing.isActive;
    const vehicleSessionId = existing.sessionId;

    await prisma.garageVehicle.delete({
      where: { id },
    });

    // If the deleted vehicle was the active one, assign another vehicle from the same session as active
    if (wasActive) {
      const nextVehicle = await prisma.garageVehicle.findFirst({
        where: { sessionId: vehicleSessionId },
        orderBy: { createdAt: "desc" },
      });

      if (nextVehicle) {
        await prisma.garageVehicle.update({
          where: { id: nextVehicle.id },
          data: { isActive: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting garage vehicle:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete vehicle" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { nickname, color, notes, isActive } = body;

    const existing = await prisma.garageVehicle.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Vehicle not found" },
        { status: 404 }
      );
    }

    if (isActive) {
      await prisma.garageVehicle.updateMany({
        where: { sessionId: existing.sessionId, isActive: true },
        data: { isActive: false },
      });
    }

    const updated = await prisma.garageVehicle.update({
      where: { id },
      data: {
        ...(nickname !== undefined && { nickname }),
        ...(color !== undefined && { color }),
        ...(notes !== undefined && { notes }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating garage vehicle:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update vehicle" },
      { status: 500 }
    );
  }
}
