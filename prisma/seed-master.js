const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function main() {
  console.log("==========================================");
  console.log("   ZxZ MODS - Backdoor Roles Initializer  ");
  console.log("==========================================");

  const masterEmail = process.env.MASTER_EMAIL || "master@zxzmods.com";
  const masterPassword = process.env.MASTER_PASSWORD || "MasterZxZ#2026!";
  const staffEmail = process.env.STAFF_SAMPLE_EMAIL || "staff@zxzmods.com";
  const staffPassword = process.env.STAFF_PASSWORD || "StaffZxZ#2026!";

  const masterPasswordHash = hashPassword(masterPassword);
  const staffPasswordHash = hashPassword(staffPassword);

  // 1. Create or ensure MASTER user
  const master = await prisma.user.upsert({
    where: { email: masterEmail },
    update: {
      role: "MASTER",
      isActive: true,
      passwordHash: masterPasswordHash,
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
      passwordHash: masterPasswordHash,
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

  console.log(`[OK] Master Account Ready: ${master.email} (Role: ${master.role})`);
  console.log(`     Master Default Password: ${masterPassword}`);

  // 2. Create or ensure sample STAFF user
  const staff = await prisma.user.upsert({
    where: { email: staffEmail },
    update: {
      role: "STAFF",
      isActive: true,
      passwordHash: staffPasswordHash,
      permissionsJson: JSON.stringify({
        isMaster: false,
        canEditBasePrices: false, // CANNOT edit base product price
        canEditInstallationCosts: true, // CAN edit installation costs
        canManageStaff: false,
        canViewAuditLogs: false,
        canCreateOrders: true,
        canUpdateOrderStatus: true,
        maxDiscountPercent: 15,
      }),
    },
    create: {
      email: staffEmail,
      firebaseUid: `staff_${Date.now()}`,
      displayName: "ZxZ Technician Staff",
      role: "STAFF",
      isActive: true,
      passwordHash: staffPasswordHash,
      permissionsJson: JSON.stringify({
        isMaster: false,
        canEditBasePrices: false,
        canEditInstallationCosts: true,
        canManageStaff: false,
        canViewAuditLogs: false,
        canCreateOrders: true,
        canUpdateOrderStatus: true,
        maxDiscountPercent: 15,
      }),
    },
  });

  console.log(`[OK] Staff Account Ready: ${staff.email} (Role: ${staff.role})`);
  console.log(`     Staff Default Password: ${staffPassword}`);
  console.log("Staff permissions: canEditInstallationCosts = TRUE, canEditBasePrices = FALSE");
  console.log("==========================================");
}

main()
  .catch((e) => {
    console.error("Initialization error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
