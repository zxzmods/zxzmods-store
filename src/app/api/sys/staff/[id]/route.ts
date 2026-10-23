import { NextResponse } from "next/server";
import { requireStealthSession, hashPassword } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // STRICT SECURITY: Only ROOT MASTER can modify staff profiles or delegate master permissions
  const auth = await requireStealthSession("ROOT_MASTER");
  if (!auth.authorized) return auth.response;

  try {
    const staffId = params.id;
    const body = await request.json().catch(() => ({}));
    const { isActive, newPassword, permissions, displayName, hasMasterPermissions } = body;

    const existingStaff = await prisma.user.findUnique({
      where: { id: staffId },
    });

    if (!existingStaff) {
      return NextResponse.json({ success: false, error: "Staff member not found" }, { status: 404 });
    }

    // Safety: Master cannot deactivate their own root account
    if (staffId === auth.session.userId && isActive === false) {
      return NextResponse.json(
        { success: false, error: "Root Master account cannot be deactivated" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (displayName !== undefined) updateData.displayName = displayName;
    if (newPassword && typeof newPassword === "string" && newPassword.length >= 8) {
      updateData.passwordHash = hashPassword(newPassword);
    }

    if (hasMasterPermissions !== undefined) {
      let curPerms: any = {};
      try {
        if (existingStaff.permissionsJson) curPerms = JSON.parse(existingStaff.permissionsJson);
      } catch {}

      const isGranted = Boolean(hasMasterPermissions);
      curPerms = {
        ...curPerms,
        hasMasterPermissions: isGranted,
        isMaster: isGranted,
        canEditBasePrices: isGranted,
        canViewAuditLogs: isGranted,
        // EXCEPT staff & permissions section: strictly false for delegated profiles
        canManageStaff: false,
        maxDiscountPercent: isGranted ? 100 : 15,
      };
      updateData.permissionsJson = JSON.stringify(curPerms);
    } else if (permissions !== undefined) {
      // Ensure canManageStaff is never granted to delegated profile
      const safePerms = {
        ...permissions,
        canManageStaff: false,
      };
      updateData.permissionsJson = JSON.stringify(safePerms);
    }

    const updated = await prisma.user.update({
      where: { id: staffId },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        displayName: true,
        isActive: true,
        lastLoginAt: true,
        permissionsJson: true,
      },
    });

    await recordAuditLog({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: isActive === false ? "DEACTIVATE_STAFF" : "UPDATE_STAFF_PERMS",
      entityType: "USER",
      entityId: staffId,
      oldData: {
        isActive: existingStaff.isActive,
        displayName: existingStaff.displayName,
      },
      newData: {
        isActive: updated.isActive,
        displayName: updated.displayName,
      },
      details: `Staff member ${existingStaff.email} updated by Master`,
    });

    return NextResponse.json({ success: true, staff: updated });
  } catch (error) {
    console.error("[SYS_STAFF_PATCH_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update staff member" },
      { status: 500 }
    );
  }
}
