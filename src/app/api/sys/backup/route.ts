import { NextResponse } from "next/server";
import { getStealthSession } from "@/lib/stealthAuth";
import { createLiveDatabaseBackup } from "@/lib/backup";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

/**
 * GET /api/sys/backup - List existing SQLite backups
 * Requires Stealth Master session or CRON_SECRET header
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const configuredCronSecret = process.env.CRON_SECRET;
  const isCron = Boolean(configuredCronSecret && configuredCronSecret.length >= 16) && authHeader === `Bearer ${configuredCronSecret}`;

  if (!isCron) {
    const session = await getStealthSession();
    if (!session || session.role !== "MASTER") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }
  }

  const backupsDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupsDir)) {
    return NextResponse.json({ success: true, backups: [] });
  }

  const backups = fs
    .readdirSync(backupsDir)
    .filter((f) => f.startsWith("zxz_backup_") && f.endsWith(".db"))
    .sort()
    .reverse()
    .map((filename) => {
      const stats = fs.statSync(path.join(backupsDir, filename));
      return {
        filename,
        sizeBytes: stats.size,
        sizeMB: (stats.size / 1024 / 1024).toFixed(2),
        createdAt: stats.birthtime.toISOString(),
      };
    });

  return NextResponse.json({
    success: true,
    total: backups.length,
    backups,
  });
}

/**
 * POST /api/sys/backup - Trigger a live atomic SQLite snapshot
 * Requires Stealth Master session or CRON_SECRET header
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const configuredCronSecret = process.env.CRON_SECRET;
  const isCron = Boolean(configuredCronSecret && configuredCronSecret.length >= 16) && authHeader === `Bearer ${configuredCronSecret}`;

  if (!isCron) {
    const session = await getStealthSession();
    if (!session || session.role !== "MASTER") {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
    }
  }

  const backupResult = await createLiveDatabaseBackup();

  if (!backupResult.success) {
    return NextResponse.json(
      { success: false, error: backupResult.error || "Error al generar respaldo" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Respaldo atómico de SQLite generado exitosamente",
    backup: {
      filename: backupResult.filename,
      sizeBytes: backupResult.sizeBytes,
      sizeMB: (backupResult.sizeBytes / 1024 / 1024).toFixed(2),
      retainedCount: backupResult.retainedCount,
      timestamp: new Date().toISOString(),
    },
  });
}
