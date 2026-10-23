import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStealthSession } from "@/lib/stealthAuth";
import {
  calculateReverseVat,
  syncMonthlyClosure,
  getDistributableCashHistory,
} from "@/lib/monthlyFinance";

export const dynamic = "force-dynamic";

type ExpenseType = "EXPENSE_LOGISTICS" | "EXPENSE_OPERATIONAL";

/**
 * GET /api/finances/monthly-status?month=MM&year=YYYY
 */
export async function GET(request: Request) {
  const auth = await requireStealthSession("MASTER");
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1), 10);
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()), 10);

    if (isNaN(month) || month < 1 || month > 12 || isNaN(year) || year < 2020 || year > 2100) {
      return NextResponse.json(
        { error: "Invalid month or year query parameters" },
        { status: 400 }
      );
    }

    // Compute closure and full metrics for selected month without database write lock
    const result = await syncMonthlyClosure(month, year, false);

    // Compute full 12-month distributable cash history for the line graph
    const distributableCashHistory = await getDistributableCashHistory(year);

    const currentDay = now.getDate();
    const isCloseTo15th = currentDay >= 10 && currentDay <= 17;
    const daysUntil15th = 15 - currentDay;

    return NextResponse.json({
      success: true,
      closure: result.closure,
      metrics: {
        ...result.metrics,
        isCloseTo15th,
        daysUntil15th,
      },
      transactions: result.expenseTransactions,
      ordersPartsBreakdown: result.ordersPartsBreakdown || [],
      distributableCashHistory,
      flowBreakdown: {
        totalIncomeSubtotal: result.metrics.totalSalesSubtotal,
        grossIncomeWithVat: result.metrics.grossIncomeWithVat,
        grossProfit: result.metrics.grossProfit,
        partsCostSubtotal: result.metrics.partsCostSubtotal,
        manualExpensesSubtotal: result.metrics.manualExpensesSubtotal,
        cogsSubtotal: result.metrics.totalCogsSubtotal,
        netVatPayable: result.metrics.netIvaPayable,
        taxReserve: result.metrics.incomeTaxProvision,
        distributableCash: result.metrics.partnerDistributableCash,
        isTaxCredit: result.metrics.isTaxCredit,
        taxCreditAmount: result.metrics.taxCreditAmount,
      },
    });
  } catch (err: unknown) {
    console.error("Error fetching monthly financial status:", err);
    return NextResponse.json(
      { error: "Internal server error fetching financial status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/finances/monthly-status
 * Register a new manual expense (EXPENSE_LOGISTICS or EXPENSE_OPERATIONAL)
 * Supports `onlyVatCredit` (crédito fiscal de IVA pero no deducible de renta) and `incurredBy`
 */
export async function POST(request: Request) {
  const auth = await requireStealthSession("MASTER");
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const {
      type,
      totalAmount,
      date,
      electronicInvoiceKey,
      description,
      incurredBy,
      onlyVatCredit,
    } = body;

    const expenseType: ExpenseType =
      type === "EXPENSE_OPERATIONAL" ? "EXPENSE_OPERATIONAL" : "EXPENSE_LOGISTICS";

    const numAmount = Number(totalAmount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: "Total amount must be a positive number" },
        { status: 400 }
      );
    }

    const txDate = date ? new Date(date) : new Date();
    if (isNaN(txDate.getTime())) {
      return NextResponse.json({ error: "Invalid transaction date" }, { status: 400 });
    }

    const vat = calculateReverseVat(numAmount);

    const createdTx = await prisma.transaction.create({
      data: {
        date: txDate,
        type: expenseType,
        totalAmount: vat.totalAmount,
        subtotal: vat.subtotal,
        ivaAmount: vat.ivaAmount,
        electronicInvoiceKey: electronicInvoiceKey?.trim() || null,
        description: description?.trim() || null,
        incurredBy:
          incurredBy?.trim() ||
          auth.session.displayName ||
          auth.session.email ||
          "Master",
        onlyVatCredit: Boolean(onlyVatCredit),
      },
    });

    // Recalculate closure for that month
    const month = txDate.getUTCMonth() + 1;
    const year = txDate.getUTCFullYear();
    const syncResult = await syncMonthlyClosure(month, year);
    const distributableCashHistory = await getDistributableCashHistory(year);

    return NextResponse.json({
      success: true,
      transaction: createdTx,
      closure: syncResult.closure,
      metrics: syncResult.metrics,
      transactions: syncResult.expenseTransactions,
      distributableCashHistory,
    });
  } catch (err: unknown) {
    console.error("Error creating expense transaction:", err);
    return NextResponse.json(
      { error: "Internal server error creating transaction" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/finances/monthly-status
 * Delete an expense transaction by id and recalculate closure
 */
export async function DELETE(request: Request) {
  const auth = await requireStealthSession("MASTER");
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
    }

    // Auto generated system gasoline expenses cannot be deleted directly
    if (id.startsWith("gas-")) {
      return NextResponse.json(
        { error: "Los gastos de combustible generados automáticamente por servicio pick-up no pueden eliminarse individualmente." },
        { status: 400 }
      );
    }

    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    await prisma.transaction.delete({ where: { id } });

    const month = existing.date.getUTCMonth() + 1;
    const year = existing.date.getUTCFullYear();
    const syncResult = await syncMonthlyClosure(month, year);
    const distributableCashHistory = await getDistributableCashHistory(year);

    return NextResponse.json({
      success: true,
      deletedId: id,
      closure: syncResult.closure,
      metrics: syncResult.metrics,
      transactions: syncResult.expenseTransactions,
      distributableCashHistory,
    });
  } catch (err: unknown) {
    console.error("Error deleting transaction:", err);
    return NextResponse.json(
      { error: "Internal server error deleting transaction" },
      { status: 500 }
    );
  }
}
