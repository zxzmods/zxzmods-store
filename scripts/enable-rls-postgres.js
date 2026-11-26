/**
 * Enables Row Level Security (RLS) on public."SupplierPriceDecrease" in PostgreSQL / Supabase
 * and revokes anon/authenticated PostgREST access. Server-side Prisma (postgres/owner role)
 * continues to operate normally.
 */
const { PrismaClient } = require("@prisma/client");

async function main() {
  const dbUrl = (process.env.DATABASE_URL || "").toLowerCase();
  if (!dbUrl.startsWith("postgres://") && !dbUrl.startsWith("postgresql://")) {
    console.log("[RLS] Non-PostgreSQL DATABASE_URL detected; skipping.");
    return;
  }
  if (dbUrl.includes("placeholder:placeholder")) {
    console.log("[RLS] Placeholder DATABASE_URL detected; skipping.");
    return;
  }

  const prisma = new PrismaClient();
  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'SupplierPriceDecrease'
        ) THEN
          EXECUTE 'ALTER TABLE "public"."SupplierPriceDecrease" ENABLE ROW LEVEL SECURITY';
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
            EXECUTE 'REVOKE ALL ON TABLE "public"."SupplierPriceDecrease" FROM anon';
          END IF;
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
            EXECUTE 'REVOKE ALL ON TABLE "public"."SupplierPriceDecrease" FROM authenticated';
          END IF;
        END IF;
      END
      $$;
    `);
    console.log('[RLS] Verified RLS enabled on public."SupplierPriceDecrease".');
  } catch (err) {
    console.warn("[RLS] Warning while enforcing RLS:", err?.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
