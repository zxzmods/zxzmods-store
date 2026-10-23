import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setGlobalMasterPhone } from "@/config/company";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const workshop = await prisma.workshopInfo.findUnique({
      where: { id: "zxz-hq" },
    });

    if (!workshop) {
      return NextResponse.json(
        { success: false, error: "Location info not found" },
        { status: 404 }
      );
    }

    setGlobalMasterPhone(
      workshop.phone,
      workshop.whatsapp,
      workshop.addressEs,
      workshop.addressEn
    );

    const hours = JSON.parse(workshop.hoursJson || "{}");
    const wazeLink = `https://waze.com/ul?ll=${workshop.latitude},${workshop.longitude}&navigate=yes`;

    const response = NextResponse.json({
      success: true,
      data: {
        ...workshop,
        hours,
        wazeLink,
      },
    });
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );
    return response;
  } catch (error) {
    console.error("Error fetching location data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch location data" },
      { status: 500 }
    );
  }
}

