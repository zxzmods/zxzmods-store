import { createLiveDatabaseBackup } from "../src/lib/backup";
import { prisma } from "../src/lib/prisma";

// CLI runner for scheduled background tasks or Windows Task Scheduler:
// cmd.exe /c "npx tsx scripts/backup-database.ts"
(async () => {
  console.log("Initiating live atomic SQLite database backup...");
  const res = await createLiveDatabaseBackup();
  if (res.success) {
    console.log(
      `✅ Backup successfully created: ${res.filename} (${(
        res.sizeBytes /
        1024 /
        1024
      ).toFixed(2)} MB)`
    );
    console.log(`📦 Retained ${res.retainedCount} backups in /backups`);
  } else {
    console.error(`❌ Backup failed: ${res.error}`);
    process.exit(1);
  }
  await prisma.$disconnect();
})();
