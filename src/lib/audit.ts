import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "CREATE_PRODUCT"
  | "UPDATE_PRODUCT"
  | "UPDATE_PRODUCT_PRICE"
  | "UPDATE_INSTALLATION_COST"
  | "DELETE_PRODUCT"
  | "CREATE_COMBO"
  | "UPDATE_COMBO"
  | "DELETE_COMBO"
  | "CREATE_ORDER"
  | "UPDATE_ORDER_STATUS"
  | "APPLY_ORDER_DISCOUNT"
  | "UPDATE_ORDER_SHIPPING"
  | "DELETE_ORDER"
  | "CREATE_STAFF"
  | "UPDATE_STAFF_PERMS"
  | "DEACTIVATE_STAFF"
  | "CREATE_HOMEPAGE_ITEM"
  | "UPDATE_HOMEPAGE_ITEM"
  | "DELETE_HOMEPAGE_ITEM"
  | "CREATE_DEALER_BRAND"
  | "UPDATE_DEALER_BRAND"
  | "DELETE_DEALER_BRAND"
  | "CREATE_DISCOUNT_CODE"
  | "UPDATE_DISCOUNT_CODE"
  | "DELETE_DISCOUNT_CODE";

export type AuditEntityType = "PRODUCT" | "COMBO" | "ORDER" | "USER" | "SYSTEM" | "HOMEPAGE_ITEM" | "DEALER_BRAND" | "DISCOUNT_CODE";
export type AuditActorRole = "MASTER" | "STAFF" | "SYSTEM";

export interface CreateAuditLogParams {
  actorId: string;
  actorEmail: string;
  actorRole: AuditActorRole;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  details?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Records an immutable audit log entry for changes made in the backdoor/admin console.
 * Strictly captures changes in products and combos (pricing, qualities, attributes, additions/deletions).
 */
export async function recordAuditLog(params: CreateAuditLogParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldDataJson: params.oldData ? JSON.stringify(params.oldData) : null,
        newDataJson: params.newData ? JSON.stringify(params.newData) : null,
        details: params.details || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    console.error("[AUDIT_LOG_ERROR] Failed to record audit log entry:", error);
    return null;
  }
}

/**
 * Retrieves audit history up to 6 months (180 days).
 * Restricted to MASTER role.
 */
export async function getAuditHistory(options: {
  entityType?: AuditEntityType;
  actorId?: string;
  action?: AuditAction;
  limit?: number;
  offset?: number;
} = {}) {
  const { entityType, actorId, action, limit = 50, offset = 0 } = options;

  // Enforce 6-month rolling window (180 days)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);

  const whereClause: any = {
    createdAt: { gte: sixMonthsAgo },
    ...(entityType ? { entityType } : {}),
  };

  if (actorId) whereClause.actorId = actorId;
  if (action) whereClause.action = action;

  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({
      where: whereClause,
    }),
  ]);

  return {
    logs,
    totalCount,
    retentionWindowStart: sixMonthsAgo.toISOString(),
  };
}

/**
 * Maintenance job: Automatically purges audit log entries older than 6 months (180 days).
 */
export async function pruneOldAuditLogs() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);

  try {
    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: sixMonthsAgo,
        },
      },
    });
    return { prunedCount: result.count };
  } catch (error) {
    console.error("[AUDIT_PRUNE_ERROR] Failed to prune audit logs:", error);
    throw error;
  }
}
