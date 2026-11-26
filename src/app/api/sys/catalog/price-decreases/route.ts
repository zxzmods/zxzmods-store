import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import {
  ensureSupplierPriceDecreaseTable,
  resolvePriceDecreaseAlert,
  resolvePriceAlertsBatch,
  runDailySupplierPriceCheck,
  PriceDecreaseResolutionAction,
} from "@/lib/supplierPriceSync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    await ensureSupplierPriceDecreaseTable();

    const [pendingAlerts, resolvedAlerts, lastRunLog, recentAutoIncreases] = await Promise.all([
      prisma.supplierPriceDecrease.findMany({
        where: { status: "PENDING" },
        orderBy: { detectedAt: "desc" },
      }),
      prisma.supplierPriceDecrease.findMany({
        where: { status: { not: "PENDING" } },
        orderBy: { resolvedAt: "desc" },
        take: 40,
      }),
      prisma.auditLog.findFirst({
        where: { action: "DAILY_PRICE_CHECK_RUN" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.findMany({
        where: { action: "DAILY_PRICE_AUTO_INCREASE" },
        orderBy: { createdAt: "desc" },
        take: 25,
      }),
    ]);

    let lastRunSummary: any = null;
    if (lastRunLog) {
      let parsed: any = {};
      try {
        parsed = lastRunLog.newDataJson ? JSON.parse(lastRunLog.newDataJson) : {};
      } catch {}
      lastRunSummary = {
        createdAt: lastRunLog.createdAt,
        actorEmail: lastRunLog.actorEmail,
        details: lastRunLog.details,
        ...parsed,
      };
    }

    const autoIncreases = recentAutoIncreases.map((log) => {
      let oldData: any = {};
      let newData: any = {};
      try {
        oldData = log.oldDataJson ? JSON.parse(log.oldDataJson) : {};
        newData = log.newDataJson ? JSON.parse(log.newDataJson) : {};
      } catch {}
      return {
        id: log.id,
        productId: log.entityId,
        createdAt: log.createdAt,
        actorEmail: log.actorEmail,
        sku: newData.sku || oldData.sku || "",
        nameEs: newData.nameEs || oldData.nameEs || "",
        oldPPriceD: Number(oldData.processingPriceD || 0),
        newPPriceD: Number(newData.processingPriceD || 0),
        oldTPriceCRC: Number(oldData.priceCRC || 0),
        newTPriceCRC: Number(newData.priceCRC || 0),
      };
    });

    const normalizeAlert = (a: any) => {
      const dir =
        a.changeDirection === "INCREASE" || a.proposedTPriceCRC > a.oldTPriceCRC || a.newPPriceD > a.oldPPriceD
          ? "INCREASE"
          : "DECREASE";
      return { ...a, changeDirection: dir };
    };

    const normalizedPending = pendingAlerts.map(normalizeAlert);
    const normalizedResolved = resolvedAlerts.map(normalizeAlert);
    const pendingIncreasesCount = normalizedPending.filter((a) => a.changeDirection === "INCREASE").length;
    const pendingDecreasesCount = normalizedPending.filter((a) => a.changeDirection === "DECREASE").length;

    return NextResponse.json({
      success: true,
      pending: normalizedPending,
      resolved: normalizedResolved,
      autoIncreases,
      lastRun: lastRunSummary,
      pendingCount: normalizedPending.length,
      pendingIncreasesCount,
      pendingDecreasesCount,
    });
  } catch (error) {
    console.error("[SYS_PRICE_DECREASES_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al cargar los cambios de precio pendientes." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const { action, alertId, alertIds } = body;

    if (action === "RUN_CHECK") {
      const summary = await runDailySupplierPriceCheck({
        triggeredBy: auth.session.email,
      });
      return NextResponse.json({
        success: true,
        summary,
      });
    }

    const validActions: PriceDecreaseResolutionAction[] = [
      "DISCOUNT",
      "PRICE_DECREASE",
      "PRICE_INCREASE",
      "APPROVE_AS_DISCOUNT",
      "APPROVE_REGULAR",
      "DISMISSED",
    ];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: "Acción inválida para resolver cambio de precio." },
        { status: 400 }
      );
    }

    // Batch multi-select resolution
    if (Array.isArray(alertIds) && alertIds.length > 0) {
      const batchRes = await resolvePriceAlertsBatch({
        alertIds: alertIds.map((id: any) => String(id)),
        action,
        actorId: auth.session.userId,
        actorEmail: auth.session.email,
        actorRole: auth.session.role,
      });
      if (!batchRes.success && batchRes.processedCount === 0) {
        return NextResponse.json(
          {
            success: false,
            error: batchRes.errors[0]?.error || "No se pudo procesar ninguno de los productos seleccionados.",
            batch: batchRes,
          },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        batch: batchRes,
      });
    }

    if (!alertId) {
      return NextResponse.json(
        { success: false, error: "Parámetros inválidos (alertId o alertIds requeridos)." },
        { status: 400 }
      );
    }

    const res = await resolvePriceDecreaseAlert({
      alertId: String(alertId),
      action,
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
    });

    if (!res.success) {
      return NextResponse.json(
        { success: false, error: res.error || "No se pudo procesar la solicitud." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      alert: res.alert,
      product: res.product,
    });
  } catch (error) {
    console.error("[SYS_PRICE_DECREASES_POST_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al procesar la actualización de precio." },
      { status: 500 }
    );
  }
}
