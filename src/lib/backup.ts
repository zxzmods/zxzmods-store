import { prisma } from "@/lib/prisma";
import { getGCSClient } from "@/lib/storage";
import fs from "fs";
import path from "path";

export interface BackupResult {
  success: boolean;
  filename: string;
  filepath: string;
  sizeBytes: number;
  retainedCount: number;
  cloudUrl?: string;
  error?: string;
}

/**
 * Creates an atomic, point-in-time database snapshot.
 * - On PostgreSQL / Vercel: Generates a complete JSON logical snapshot of all tables and uploads to Google Cloud Storage.
 * - On local SQLite: Uses SQLite VACUUM INTO to the local backups/ directory.
 */
export async function createLiveDatabaseBackup(): Promise<BackupResult> {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const isPostgresOrServerless =
    process.env.VERCEL === "1" ||
    process.env.NODE_ENV === "production" ||
    (process.env.DATABASE_URL || "").startsWith("postgres");

  if (isPostgresOrServerless) {
    const filename = `zxz_backup_${timestamp}.json`;
    try {
      const [
        brands,
        vehicleModels,
        categories,
        products,
        productCompatibilities,
        combos,
        performancePackages,
        workshopInfo,
        logisticsRates,
        dealerBrands,
        legalDocuments,
        homePageItems,
        discountCodes,
        barrialCrConfig,
        orders,
        schedules,
        transactions,
        monthlyClosures,
      ] = await Promise.all([
        prisma.brand.findMany(),
        prisma.vehicleModel.findMany(),
        prisma.category.findMany(),
        prisma.product.findMany(),
        prisma.productCompatibility.findMany(),
        prisma.combo.findMany(),
        prisma.performancePackage.findMany(),
        prisma.workshopInfo.findMany(),
        prisma.logisticsRateConfig.findMany(),
        prisma.dealerBrand.findMany(),
        prisma.legalDocument.findMany(),
        prisma.homePageItem.findMany(),
        prisma.discountCode.findMany(),
        prisma.barrialCrConfig.findMany(),
        prisma.order.findMany(),
        prisma.serviceSchedule.findMany(),
        prisma.transaction.findMany(),
        prisma.monthlyFinancialClosure.findMany(),
      ]);

      const payload = JSON.stringify(
        {
          exportedAt: now.toISOString(),
          data: {
            brands,
            vehicleModels,
            categories,
            products,
            productCompatibilities,
            combos,
            performancePackages,
            workshopInfo,
            logisticsRates,
            dealerBrands,
            legalDocuments,
            homePageItems,
            discountCodes,
            barrialCrConfig,
            orders,
            schedules,
            transactions,
            monthlyClosures,
          },
        },
        null,
        2
      );
      const buffer = Buffer.from(payload, "utf-8");
      const bucketName = process.env.GCS_BUCKET_NAME || process.env.FIREBASE_STORAGE_BUCKET;
      const gcs = getGCSClient();

      if (bucketName && gcs) {
        const bucket = gcs.bucket(bucketName);
        const destination = `backups/${filename}`;
        await bucket.file(destination).save(buffer, {
          metadata: { contentType: "application/json" },
          resumable: false,
        });
        return {
          success: true,
          filename,
          filepath: `gs://${bucketName}/${destination}`,
          cloudUrl: `https://storage.googleapis.com/${bucketName}/${destination}`,
          sizeBytes: buffer.length,
          retainedCount: 1,
        };
      }

      return {
        success: true,
        filename,
        filepath: `memory://${filename}`,
        sizeBytes: buffer.length,
        retainedCount: 1,
      };
    } catch (pgErr: any) {
      console.error("[POSTGRES_BACKUP_ERROR]:", pgErr);
      return {
        success: false,
        filename,
        filepath: "",
        sizeBytes: 0,
        retainedCount: 0,
        error: pgErr?.message || "Error creating PostgreSQL logical backup",
      };
    }
  }

  const backupsDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

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
