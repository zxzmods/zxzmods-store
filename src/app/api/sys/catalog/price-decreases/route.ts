import { NextResponse } from "next/server";
import { requireStealthSession } from "@/lib/stealthAuth";
import { prisma } from "@/lib/prisma";
import {
  ensureSupplierPriceDecreaseTable,
  resolvePriceDecreaseAlert,
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

    return NextResponse.json({
      success: true,
      pending: pendingAlerts,
      resolved: resolvedAlerts,
      autoIncreases,
      lastRun: lastRunSummary,
      pendingCount: pendingAlerts.length,
    });
  } catch (error) {
    console.error("[SYS_PRICE_DECREASES_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Error al cargar las bajas de precio pendientes." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireStealthSession();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const { action, alertId } = body;

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
      "DISMISSED",
    ];
    if (!alertId || !validActions.includes(action)) {
      return NextResponse.json(
        { success: false, error: "Parámetros inválidos (alertId y action requeridos)." },
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
