import { NextResponse } from "next/server";
import { requireStealthSession, hashPassword } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function GET() {
  // STRICT SECURITY: Only ROOT MASTER profile can view staff accounts list
  const auth = await requireStealthSession("ROOT_MASTER");
  if (!auth.authorized) return auth.response;

  try {
    const staffMembers = await prisma.user.findMany({
      where: {
        role: { in: ["MASTER", "STAFF"] },
      },
      select: {
        id: true,
        email: true,
        role: true,
        displayName: true,
        phoneNumber: true,
        isActive: true,
        lastLoginAt: true,
        permissionsJson: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, staffMembers });
  } catch (error) {
    console.error("[SYS_STAFF_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch staff profiles" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // STRICT SECURITY: Only ROOT MASTER profile can create backdoor staff accounts
  const auth = await requireStealthSession("ROOT_MASTER");
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const {
      email,
      password,
      displayName = "Staff Member",
      role = "STAFF",
      hasMasterPermissions = false,
      permissions = {},
    } = body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already in use
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = hashPassword(password);

    const defaultPermissions = {
      isMaster: role === "MASTER" || Boolean(hasMasterPermissions),
      hasMasterPermissions: role === "MASTER" || Boolean(hasMasterPermissions),
      canEditBasePrices: role === "MASTER" || Boolean(hasMasterPermissions),
      canEditInstallationCosts: true, // Staff can edit installation costs
      canManageStaff: role === "MASTER", // STRICT: only root master can manage staff
      canViewAuditLogs: role === "MASTER" || Boolean(hasMasterPermissions),
      canCreateOrders: true,
      canUpdateOrderStatus: true,
      maxDiscountPercent: role === "MASTER" || Boolean(hasMasterPermissions) ? 100 : 15,
      ...permissions,
    };

    const newStaff = await prisma.user.create({
      data: {
        email: normalizedEmail,
        firebaseUid: `staff_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        displayName,
        role: role === "MASTER" ? "MASTER" : "STAFF",
        isActive: true,
        passwordHash,
        permissionsJson: JSON.stringify(defaultPermissions),
      },
      select: {
        id: true,
        email: true,
        role: true,
        displayName: true,
        isActive: true,
        createdAt: true,
        permissionsJson: true,
      },
    });

    await recordAuditLog({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: "CREATE_STAFF",
      entityType: "USER",
      entityId: newStaff.id,
      newData: {
        email: newStaff.email,
        role: newStaff.role,
        permissions: defaultPermissions,
      },
      details: `New ${newStaff.role} profile created for ${newStaff.email} by Master`,
    });

    return NextResponse.json({ success: true, staff: newStaff });
  } catch (error) {
    console.error("[SYS_STAFF_CREATE_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create staff account" },
      { status: 500 }
    );
  }
}
