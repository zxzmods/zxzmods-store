import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "healthy";
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (dbErr) {
    dbStatus = "unreachable";
    console.error("[HEALTHCHECK_DB_ERROR]:", dbErr);
  }

  const memoryUsage = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  const isHealthy = dbStatus === "healthy";

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      service: "zxz-mods-platform",
      environment: process.env.NODE_ENV || "development",
      uptimeSeconds,
      latencyMs: Date.now() - startTime,
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      memory: {
        heapUsedMB: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMB: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
        rssMB: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
