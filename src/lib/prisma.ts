import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  sqlitePragmasConfigured?: boolean;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Configure SQLite pragmas for high concurrency, durability and busy timeout tolerance
if (!globalForPrisma.sqlitePragmasConfigured) {
  globalForPrisma.sqlitePragmasConfigured = true;
  (async () => {
    try {
      // 1. Enable Write-Ahead Logging (allows concurrent reads during active writes)
      await prisma.$queryRawUnsafe(`PRAGMA journal_mode = WAL;`);
      // 2. Set busy timeout to 10 seconds to wait for file locks instead of immediate SQLITE_BUSY
      await prisma.$queryRawUnsafe(`PRAGMA busy_timeout = 10000;`);
      // 3. Set synchronous mode to NORMAL for WAL performance with complete integrity
      await prisma.$queryRawUnsafe(`PRAGMA synchronous = NORMAL;`);
      // 4. Increase SQLite memory page cache (64 MB)
      await prisma.$queryRawUnsafe(`PRAGMA cache_size = -64000;`);
      // 5. Enforce foreign key constraints at SQLite engine level
      await prisma.$queryRawUnsafe(`PRAGMA foreign_keys = ON;`);
    } catch (err) {
      console.warn("[PRISMA_SQLITE_PRAGMA_WARN]: Could not execute WAL pragma config:", err);
    }
  })();
}

// Clean up connections on process termination
if (typeof process !== "undefined") {
  const cleanDisconnect = async () => {
    try {
      await prisma.$disconnect();
    } catch {
      // Silently exit
    }
  };
  process.once("beforeExit", cleanDisconnect);
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

