import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function seedMaster() {
  console.log("==================================================");
  console.log("   ZxZ MODS - Production Master Account Bootstrap ");
  console.log("==================================================");

  const masterEmail = (process.env.MASTER_EMAIL || "master@zxzmods.com").toLowerCase().trim();
  const existingMaster = await prisma.user.findFirst({
    where: { email: masterEmail, role: "MASTER" },
  });

  if (existingMaster && existingMaster.passwordHash) {
    console.log(`[OK] Master account already exists for ${masterEmail}. No changes made.`);
    return;
  }

  // Use provided initial password from env, or generate a cryptographically strong 24-char temporary password
  let initialPassword = process.env.MASTER_INITIAL_PASSWORD;
  let wasGenerated = false;

  if (!initialPassword || initialPassword.length < 12) {
    initialPassword = `ZxZ#${crypto.randomBytes(12).toString("base64url")}!`;
    wasGenerated = true;
  }

  const passwordHash = hashPassword(initialPassword);

  const master = await prisma.user.upsert({
    where: { email: masterEmail },
    update: {
      role: "MASTER",
      isActive: true,
      passwordHash,
      permissionsJson: JSON.stringify({
        isMaster: true,
        canEditBasePrices: true,
        canEditInstallationCosts: true,
        canManageStaff: true,
        canViewAuditLogs: true,
        canCreateOrders: true,
        canApplyUnlimitedDiscounts: true,
      }),
    },
    create: {
      email: masterEmail,
      firebaseUid: `master_${Date.now()}`,
      displayName: "Master Admin (ZxZ Owner)",
      role: "MASTER",
      isActive: true,
      passwordHash,
      permissionsJson: JSON.stringify({
        isMaster: true,
        canEditBasePrices: true,
        canEditInstallationCosts: true,
        canManageStaff: true,
        canViewAuditLogs: true,
        canCreateOrders: true,
        canApplyUnlimitedDiscounts: true,
      }),
    },
  });

  console.log(`[SUCCESS] Master account configured: ${master.email}`);
  if (wasGenerated) {
    console.log("--------------------------------------------------");
    console.log(`TEMPORARY MASTER PASSWORD: ${initialPassword}`);
    console.log("IMPORTANT: Save this password now and change it upon first login!");
    console.log("--------------------------------------------------");
  } else {
    console.log(`[INFO] Master password set from MASTER_INITIAL_PASSWORD environment variable.`);
  }
}

seedMaster()
  .catch((e) => {
    console.error("[SEED_MASTER_FAILED]:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
