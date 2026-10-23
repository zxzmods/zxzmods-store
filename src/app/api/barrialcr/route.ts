import { NextResponse } from "next/server";
import { getBarrialCrConfig, getBarrialCrRides } from "@/lib/barrialcr";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [config, rides] = await Promise.all([
      getBarrialCrConfig(),
      getBarrialCrRides(),
    ]);

    return NextResponse.json({
      success: true,
      config,
      rides,
    });
  } catch (error) {
    console.error("[PUBLIC_BARRIALCR_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load BarrialCR data", rides: [] },
      { status: 500 }
    );
  }
}
