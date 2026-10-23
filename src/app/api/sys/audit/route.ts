import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { getAuditHistory, AuditEntityType, AuditAction } from "@/lib/audit";

export async function GET(request: Request) {
  // STRICT SECURITY: Only MASTER role can view 6-month changelog audit history
  const auth = await requireStealthSession("MASTER");
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType") as AuditEntityType | undefined;
    const actorId = searchParams.get("actorId") || undefined;
    const action = searchParams.get("action") as AuditAction | undefined;
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));

    const history = await getAuditHistory({
      entityType: entityType || undefined,
      actorId,
      action: action || undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      logs: history.logs,
      totalCount: history.totalCount,
      retentionWindowStart: history.retentionWindowStart,
    });
  } catch (error) {
    console.error("[SYS_AUDIT_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch audit log history" },
      { status: 500 }
    );
  }
}
