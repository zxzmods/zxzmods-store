import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const targetVehicle = await prisma.garageVehicle.findUnique({
      where: { id },
    });

    if (!targetVehicle) {
      return NextResponse.json(
        { success: false, error: "Vehicle not found" },
        { status: 404 }
      );
    }

    // Atomically deactivate other session/user vehicles and activate target vehicle in a transaction
    const [, activated] = await prisma.$transaction([
      prisma.garageVehicle.updateMany({
        where: {
          sessionId: targetVehicle.sessionId,
          isActive: true,
          ...(targetVehicle.userId ? { userId: targetVehicle.userId } : {}),
        },
        data: { isActive: false },
      }),
      prisma.garageVehicle.update({
        where: { id },
        data: { isActive: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: activated,
    });
  } catch (error) {
    console.error("Error activating vehicle:", error);
    return NextResponse.json(
      { success: false, error: "Failed to activate vehicle" },
      { status: 500 }
    );
  }
}
