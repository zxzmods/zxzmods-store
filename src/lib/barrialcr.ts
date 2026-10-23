import { prisma } from "@/lib/prisma";

export interface BarrialCrConfigRecord {
  id: string;
  title: string;
  subtitleEs: string;
  subtitleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  videoUrl: string;
  posterImageUrl: string;
  logoUrl: string;
  whatsappGroupLink: string;
  whatsappBtnTextEs: string;
  whatsappBtnTextEn: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_BARRIALCR_CONFIG = {
  id: "barrialcr-main",
  title: "BarrialCR",
  subtitleEs: "Comunidad Off-Road & Rutas UTV en Costa Rica",
  subtitleEn: "Off-Road & UTV Rides Community in Costa Rica",
  descriptionEs:
    "BarrialCR es una comunidad apasionada que organiza rutas y expediciones todoterreno por los mejores senderos, montañas y ríos de Costa Rica. Nuestro objetivo es unir a los entusiastas de UTVs y vehículos 4x4 en aventuras inolvidables con espíritu de compañerismo, adrenalina y respeto por la naturaleza.",
  descriptionEn:
    "BarrialCR is a passionate community that organizes off-road trail rides and expeditions across Costa Rica's scenic mountains, rivers, and rugged trails. We bring UTV and 4x4 enthusiasts together for unforgettable adventures driven by camaraderie, adrenaline, and environmental respect.",
  videoUrl: "/uploads/videos/videos_1791875095735_loading_screen_ZXZ_mp4.mp4",
  posterImageUrl:
    "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1920&q=85",
  logoUrl: "/images/logo.png",
  whatsappGroupLink: "https://chat.whatsapp.com/invite/BarrialCR",
  whatsappBtnTextEs: "Unirse al Chat de la Comunidad",
  whatsappBtnTextEn: "Join Community Chat",
  isActive: true,
};

export async function getBarrialCrConfig(): Promise<BarrialCrConfigRecord> {
  try {
    const config = await prisma.barrialCrConfig.findUnique({
      where: { id: "barrialcr-main" },
    });

    if (config) {
      return config;
    }

    // Auto-seed default if not present
    const created = await prisma.barrialCrConfig.create({
      data: DEFAULT_BARRIALCR_CONFIG,
    });
    return created;
  } catch (error) {
    console.error("[GET_BARRIALCR_CONFIG_ERROR]:", error);
    // Return fallback with timestamps if db error occurs
    return {
      ...DEFAULT_BARRIALCR_CONFIG,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export interface BarrialCrRide {
  id: string;
  appointmentCode?: string | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  title: string;
  destinationAddress: string | null;
  status: string;
  isFullDay: boolean;
  isUpcoming: boolean;
}

export async function getBarrialCrRides(): Promise<BarrialCrRide[]> {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const schedules = await prisma.serviceSchedule.findMany({
      where: {
        OR: [
          { serviceType: "ruta_barrial" },
          { destinationAddress: { contains: "Barrial" } },
          { clientName: { contains: "Barrial" } },
        ],
        status: { not: "CANCELLED" },
      },
      orderBy: [{ date: "asc" }, { timeMinutes: "asc" }],
    });

    return schedules.map((s) => ({
      id: s.id,
      appointmentCode: s.appointmentCode,
      date: s.date,
      time: s.time || "08:00",
      title:
        s.clientName && s.clientName !== "Bloqueo Interno Taller"
          ? s.clientName
          : "Ruta BarrialCR",
      destinationAddress: s.destinationAddress,
      status: s.status,
      isFullDay: s.isFullDay,
      isUpcoming: s.date >= todayStr,
    }));
  } catch (error) {
    console.error("[GET_BARRIALCR_RIDES_ERROR]:", error);
    return [];
  }
}
