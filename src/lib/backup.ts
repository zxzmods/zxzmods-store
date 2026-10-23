import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export interface BackupResult {
  success: boolean;
  filename: string;
  filepath: string;
  sizeBytes: number;
  retainedCount: number;
  error?: string;
}

/**
 * Creates an atomic, point-in-time SQLite snapshot of dev.db using VACUUM INTO.
 * Safe to run concurrently while readers and writers are active in WAL mode.
 */
export async function createLiveDatabaseBackup(): Promise<BackupResult> {
  const backupsDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const filename = `zxz_backup_${timestamp}.db`;
  const filepath = path.join(backupsDir, filename);
  const sqliteSafePath = filepath.replace(/\\/g, "/");

  try {
    // 1. Force WAL checkpoint to flush dirty pages
    await prisma.$queryRawUnsafe(`PRAGMA wal_checkpoint(PASSIVE);`);

    // 2. Atomic SQLite online snapshot
    await prisma.$executeRawUnsafe(`VACUUM INTO '${sqliteSafePath}';`);

    const stats = fs.statSync(filepath);

    // 3. Retention policy: Keep the last 14 backups, remove older
    const allBackups = fs
      .readdirSync(backupsDir)
      .filter((f) => f.startsWith("zxz_backup_") && f.endsWith(".db"))
      .sort()
      .reverse();

    if (allBackups.length > 14) {
      const toRemove = allBackups.slice(14);
      for (const old of toRemove) {
        try {
          fs.unlinkSync(path.join(backupsDir, old));
        } catch {
          // ignore error removing stale backup
        }
      }
    }

    const retainedCount = Math.min(allBackups.length, 14);

    return {
      success: true,
      filename,
      filepath,
      sizeBytes: stats.size,
      retainedCount,
    };
  } catch (error: any) {
    console.error("[LIVE_BACKUP_ERROR]:", error);
    return {
      success: false,
      filename,
      filepath,
      sizeBytes: 0,
      retainedCount: 0,
      error: error?.message || "Unknown error creating backup",
    };
  }
}
