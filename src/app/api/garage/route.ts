import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const MAX_GARAGE_VEHICLES = 10;

function getSessionId(request: Request): string {
  const cookieStore = cookies();
  const cookieSession = cookieStore.get("zxz_garage_session")?.value;
  if (cookieSession) return cookieSession;

  const headerSession = request.headers.get("x-garage-session-id");
  if (headerSession) return headerSession;

  return "gs_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
}

export async function GET(request: Request) {
  try {
    const sessionId = getSessionId(request);

    const vehicles = await prisma.garageVehicle.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      take: MAX_GARAGE_VEHICLES,
    });

    const modelSlugs = Array.from(new Set(vehicles.map((v) => v.modelSlug)));
    const vehicleModels = await prisma.vehicleModel.findMany({
      where: { slug: { in: modelSlugs } },
      select: { slug: true, pickupServiceAvailable: true },
    });
    const modelMap = new Map(vehicleModels.map((m) => [m.slug, m.pickupServiceAvailable]));

    const enrichedVehicles = vehicles.map((v) => ({
      ...v,
      pickupServiceAvailable: modelMap.get(v.modelSlug) ?? true,
    }));

    const activeVehicleRaw = vehicles.find((v) => v.isActive) || vehicles[0] || null;
    const activeVehicle = activeVehicleRaw
      ? {
          ...activeVehicleRaw,
          pickupServiceAvailable: modelMap.get(activeVehicleRaw.modelSlug) ?? true,
        }
      : null;

    const response = NextResponse.json({
      success: true,
      data: {
        vehicles: enrichedVehicles,
        activeVehicle,
        count: vehicles.length,
        maxLimit: MAX_GARAGE_VEHICLES,
        canAddMore: vehicles.length < MAX_GARAGE_VEHICLES,
      },
    });

    response.cookies.set("zxz_garage_session", sessionId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Error fetching garage vehicles:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch garage vehicles" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const sessionId = getSessionId(request);
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Cuerpo de solicitud inválido" },
        { status: 400 }
      );
    }

    const {
      year,
      brandSlug,
      brandName,
      modelSlug,
      modelName,
      category,
      color,
      nickname,
      notes,
      imageUrl,
      setAsActive = true,
    } = body;

    if (!year || !brandSlug || !brandName || !modelSlug || !modelName) {
      return NextResponse.json(
        { success: false, error: "Missing required vehicle specifications" },
        { status: 400 }
      );
    }

    // Check maximum 6 vehicles constraint
    const currentCount = await prisma.garageVehicle.count({
      where: { sessionId },
    });

    if (currentCount >= MAX_GARAGE_VEHICLES) {
      return NextResponse.json(
        {
          success: false,
          error: "Maximum vehicle capacity reached for this garage",
          code: "MAX_LIMIT_REACHED",
        },
        { status: 400 }
      );
    }

    const shouldBeActive = setAsActive || currentCount === 0;

    if (shouldBeActive) {
      await prisma.garageVehicle.updateMany({
        where: { sessionId, isActive: true },
        data: { isActive: false },
      });
    }

    const created = await prisma.garageVehicle.create({
      data: {
        sessionId,
        year: Number(year),
        brandSlug: String(brandSlug),
        brandName: String(brandName),
        modelSlug: String(modelSlug),
        modelName: String(modelName),
        category: category ? String(category) : null,
        color: color ? String(color) : null,
        nickname: nickname ? String(nickname) : null,
        notes: notes ? String(notes) : null,
        imageUrl: imageUrl ? String(imageUrl) : null,
        isActive: shouldBeActive,
      },
    });

    const model = await prisma.vehicleModel.findUnique({
      where: { slug: String(modelSlug) },
      select: { pickupServiceAvailable: true },
    });

    const response = NextResponse.json({
      success: true,
      data: {
        ...created,
        pickupServiceAvailable: model?.pickupServiceAvailable ?? true,
      },
    });

    response.cookies.set("zxz_garage_session", sessionId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Error creating garage vehicle:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create garage vehicle" },
      { status: 500 }
    );
  }
}
