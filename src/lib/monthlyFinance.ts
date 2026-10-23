import { prisma } from "@/lib/prisma";

export const MONTH_NAMES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre",
];

export const MONTH_NAMES_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function calculateReverseVat(totalWithVat: number) {
  const roundedTotal = Math.round(totalWithVat * 100) / 100;
  const subtotal = Math.round((roundedTotal / 1.13) * 100) / 100;
  const ivaAmount = Math.round((roundedTotal - subtotal) * 100) / 100;
  return {
    totalAmount: roundedTotal,
    subtotal,
    ivaAmount,
  };
}

/**
 * Recalculate and persist Monthly Financial Closure for a given MM-YYYY.
 * - Income is dynamically aggregated from confirmed orders for this month where payment proofs are verified.
 * - Wholesale Cost of Goods Sold (COGS) is calculated from the sold product items and added to total COGS.
 * - Manual business expenses (EXPENSE_LOGISTICS & EXPENSE_OPERATIONAL) are added to total COGS.
 * - Expenses with `onlyVatCredit = true` count their 13% IVA towards tax credit in favor, but are NOT deducted from business profit/COGS.
 * - Pick-up gasoline cost is estimated for reference, but NOT injected as a phantom row (staff registers it manually).
 */
export async function syncMonthlyClosure(month: number, year: number, persist = true) {
  const formattedMonth = String(month).padStart(2, "0");
  const monthYear = `${formattedMonth}-${year}`;

  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  // 1. Fetch real orders and catalog products for this month
  const [orders, products] = await Promise.all([
    prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
        status: {
          not: "CANCELLED",
        },
      },
    }),
    prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        slug: true,
        priceCRC: true,
        profitCRC: true,
        processingPriceCRC: true,
        shippingPriceCRC: true,
      },
    }),
  ]);

  const productMap = new Map<string, (typeof products)[number]>();
  for (const p of products) {
    productMap.set(p.id, p);
    productMap.set(p.sku, p);
    productMap.set(p.slug, p);
  }

  let totalSalesSubtotal = 0;
  let incomeIvaTotal = 0;
  let grossIncomeWithVat = 0;
  let totalDiscountsCRC = 0;

  let totalPartsCostCRC = 0;
  let totalPickupGasExpenseCRC = 0;
  const ordersPartsBreakdown: Array<{
    orderId: string;
    orderNumber: string;
    customerName: string;
    itemsCount: number;
    firstItemTitle: string;
    partsSaleGrossCRC: number;
    partsSaleSubtotalCRC: number;
    partsCostCRC: number;
    isCustomCost: boolean;
    profitCRC: number;
    createdAt: string;
  }> = [];

  for (const order of orders) {
    const statusUpper = (order.status || "PENDING").toUpperCase();
    if (statusUpper === "CANCELLED" || statusUpper === "REJECTED") continue;

    // Parse service documents JSON for distance / metadata
    let parsedDoc: any = {};
    if (order.serviceDocumentsJson) {
      try {
        parsedDoc =
          typeof order.serviceDocumentsJson === "string"
            ? JSON.parse(order.serviceDocumentsJson)
            : order.serviceDocumentsJson;
      } catch {}
    }

    // A. Parts Sale Income:
    const hasPartsProof = Boolean(order.paymentProofUrl && order.paymentProofUrl.trim().length > 0);
    const isPartsPaymentConfirmed =
      hasPartsProof &&
      statusUpper !== "PENDING" &&
      statusUpper !== "PAYMENT_PENDING" &&
      statusUpper !== "PAYMENT_CONFIRMATION" &&
      statusUpper !== "PAYMENT_REJECTED" &&
      statusUpper !== "REJECTED" &&
      statusUpper !== "CANCELLED";

    if (isPartsPaymentConfirmed) {
      let discountCRC = Number(order.discountCRC) || 0;
      if (discountCRC <= 0 && order.discountValue && Number(order.discountValue) > 0) {
        const rawTotal = Number(order.partsSubtotalCRC) || Number(order.totalCRC) || 0;
        const dVal = Number(order.discountValue) || 0;
        discountCRC = order.discountType === "PERCENTAGE" ? Math.round((rawTotal * dVal) / 100) : dVal;
      }
      if (discountCRC > 0) {
        totalDiscountsCRC += discountCRC;
      }

      const partsTotalCRC = Math.max(
        0,
        (Number(order.partsSubtotalCRC) || Number(order.totalCRC) || 0) - discountCRC
      );
      if (partsTotalCRC > 0) {
        const vat = calculateReverseVat(partsTotalCRC);
        totalSalesSubtotal += vat.subtotal;
        incomeIvaTotal += vat.ivaAmount;
        grossIncomeWithVat += vat.totalAmount;
      }

      // Calculate wholesale Cost of Goods Sold (COGS) for these confirmed parts
      let itemsList: any[] = [];
      try {
        const parsed =
          typeof order.itemsJson === "string" ? JSON.parse(order.itemsJson) : order.itemsJson;
        if (Array.isArray(parsed)) itemsList = parsed;
      } catch {}

      let orderCalculatedPartsCostCRC = 0;
      for (const item of itemsList) {
        const qty = Math.max(1, Number(item.quantity) || 1);
        const rawId = String(item.id || "").split("__")[0];
        const sku = String(item.sku || "");
        const matched = productMap.get(rawId) || productMap.get(sku);
        const unitPriceCRC = Number(item.priceCRC) || matched?.priceCRC || 0;
        if (matched) {
          const unitCost =
            (matched.processingPriceCRC || 0) + (matched.shippingPriceCRC || 0);
          const unitProfit =
            matched.profitCRC > 0
              ? matched.profitCRC
              : unitCost > 0
              ? Math.max(0, unitPriceCRC - unitCost)
              : Math.round(unitPriceCRC * 0.28);
          orderCalculatedPartsCostCRC += (unitCost > 0 ? unitCost : Math.max(0, unitPriceCRC - unitProfit)) * qty;
        } else {
          const estimatedProfit = Math.round(unitPriceCRC * 0.28);
          orderCalculatedPartsCostCRC += Math.max(0, unitPriceCRC - estimatedProfit) * qty;
        }
      }

      // Check if custom parts cost was explicitly entered in managing order
      const hasCustomPartsCost =
        typeof parsedDoc?.orderPartsCostCRC === "number" && parsedDoc.orderPartsCostCRC >= 0;
      const effectiveOrderPartsCostCRC = hasCustomPartsCost
        ? Number(parsedDoc.orderPartsCostCRC)
        : orderCalculatedPartsCostCRC;

      totalPartsCostCRC += effectiveOrderPartsCostCRC;

      const orderVat = calculateReverseVat(partsTotalCRC);
      ordersPartsBreakdown.push({
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName || order.guestEmail || "Cliente",
        itemsCount: itemsList.reduce((acc, it) => acc + (Number(it.quantity) || 1), 0),
        firstItemTitle: itemsList[0]?.title || itemsList[0]?.name || (lang => "Repuestos")("es"),
        partsSaleGrossCRC: partsTotalCRC,
        partsSaleSubtotalCRC: orderVat.subtotal,
        partsCostCRC: effectiveOrderPartsCostCRC,
        isCustomCost: hasCustomPartsCost,
        profitCRC: Math.max(0, partsTotalCRC - effectiveOrderPartsCostCRC),
        createdAt: order.createdAt.toISOString(),
      });
    }

    // B. Service / Logistics Income:
    const hasServiceProof = Boolean(
      order.servicePaymentProofUrl && order.servicePaymentProofUrl.trim().length > 0
    );
    const isServicePaymentConfirmed =
      hasServiceProof &&
      statusUpper !== "PENDING" &&
      statusUpper !== "PAYMENT_PENDING" &&
      statusUpper !== "PAYMENT_CONFIRMATION" &&
      statusUpper !== "PROGRAM_SERVICE" &&
      statusUpper !== "CONFIRM_SERVICE_PAYMENT" &&
      statusUpper !== "PAYMENT_REJECTED" &&
      statusUpper !== "REJECTED" &&
      statusUpper !== "CANCELLED" &&
      parsedDoc?.servicePaymentRejected !== true;

    if (isServicePaymentConfirmed) {
      const serviceTotalCRC =
        (Number(order.shippingCostCRC) || 0) + (Number(order.pickupCostCRC) || 0);
      if (serviceTotalCRC > 0) {
        const vat = calculateReverseVat(serviceTotalCRC);
        totalSalesSubtotal += vat.subtotal;
        incomeIvaTotal += vat.ivaAmount;
        grossIncomeWithVat += vat.totalAmount;
      }

      // Calculate pickup gasoline reference cost (500 colones per km):
      const isPickup =
        (order.serviceType || "").toUpperCase().includes("PICKUP") ||
        (Number(order.pickupCostCRC) || 0) > 0;

      if (isPickup) {
        let pickupKm = 0;
        if (typeof parsedDoc?.distanceKm === "number" && parsedDoc.distanceKm > 0) {
          pickupKm = parsedDoc.distanceKm;
        } else if (Number(order.pickupCostCRC) > 0) {
          const baseRate = 1500;
          pickupKm =
            Number(order.pickupCostCRC) > 10000
              ? Math.round((Number(order.pickupCostCRC) - 10000) / baseRate)
              : Math.round(Number(order.pickupCostCRC) / baseRate);
        }

        if (pickupKm > 0) {
          totalPickupGasExpenseCRC += Math.round(pickupKm * 500);
        }
      }
    }

    // C. Installation Service Income:
    const hasInstallProof =
      Boolean(order.installationPaymentProofUrl && order.installationPaymentProofUrl.trim().length > 0) ||
      parsedDoc?.installationPaymentConfirmed === true ||
      Boolean(parsedDoc?.installationPaymentProofUrl && parsedDoc.installationPaymentProofUrl.trim().length > 0) ||
      Boolean(parsedDoc?.receiptUrl && parsedDoc.receiptUrl.trim().length > 0);

    const isInstallPaymentConfirmed =
      hasInstallProof &&
      statusUpper !== "INSTALLING" &&
      statusUpper !== "INSTALLATION_PAYMENT" &&
      statusUpper !== "CONFIRM_INSTALLATION_PAYMENT" &&
      statusUpper !== "PAYMENT_REJECTED" &&
      statusUpper !== "CANCELLED" &&
      statusUpper !== "REJECTED" &&
      parsedDoc?.installationPaymentRejected !== true &&
      (parsedDoc?.installationPaymentConfirmed === true ||
        ["READY_TO_SET_RETURN_DATE", "READY_FOR_PICKUP", "READY_TO_PICK_UP", "COMPLETED"].includes(statusUpper));

    if (isInstallPaymentConfirmed) {
      const installTotalCRC =
        (Number(order.installationCostCRC) || 0) + (Number(order.laborSubtotalCRC) || 0);
      if (installTotalCRC > 0) {
        const vat = calculateReverseVat(installTotalCRC);
        totalSalesSubtotal += vat.subtotal;
        incomeIvaTotal += vat.ivaAmount;
        grossIncomeWithVat += vat.totalAmount;
      }
    }
  }

  // 2. Fetch manual expenses registered by staff for this month from Transaction table
  const expenseTransactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: startDate,
        lt: endDate,
      },
      type: {
        in: ["EXPENSE_LOGISTICS", "EXPENSE_OPERATIONAL"],
      },
    },
    orderBy: { date: "desc" },
  });

  // Display expenses contains strictly manual expenses registered by user/staff
  const allDisplayExpenses = expenseTransactions.map((tx) => ({
    id: tx.id,
    date: tx.date,
    type: tx.type,
    totalAmount: tx.totalAmount,
    subtotal: tx.subtotal,
    ivaAmount: tx.ivaAmount,
    electronicInvoiceKey: tx.electronicInvoiceKey,
    description: tx.description,
    incurredBy: tx.incurredBy || "Master Admin",
    onlyVatCredit: Boolean(tx.onlyVatCredit),
    orderId: tx.orderId,
    isAutoSystemExpense: false,
    createdAt: tx.createdAt,
  }));

  // Wholesale cost of parts sold for confirmed orders (Separated from manual business expenses)
  const partsCostSubtotal = Math.round(totalPartsCostCRC * 100) / 100;

  let manualExpensesSubtotal = 0;
  let expenseIvaTotal = 0;
  let grossExpenseWithVat = 0;

  for (const exp of allDisplayExpenses) {
    expenseIvaTotal += exp.ivaAmount;
    grossExpenseWithVat += exp.totalAmount;

    if (!exp.onlyVatCredit) {
      manualExpensesSubtotal += exp.subtotal;
    }
  }

  // Total COGS Subtotal = Parts Wholesale Cost + Deductible Business Expenses
  const totalCogsSubtotal = Math.round((partsCostSubtotal + manualExpensesSubtotal) * 100) / 100;

  // Net IVA Payable Formula:
  // Sum(iva_amount for Income) - Sum(iva_amount for Expenses).
  // If negative, return 0 and flag as tax credit.
  const rawNetIva = incomeIvaTotal - expenseIvaTotal;
  const isTaxCredit = rawNetIva < 0;
  const netIvaPayable = isTaxCredit ? 0 : Math.round(rawNetIva * 100) / 100;
  const taxCreditAmount = isTaxCredit ? Math.round(Math.abs(rawNetIva) * 100) / 100 : 0;

  // Net Profit Formula:
  // Sum(subtotal for Income) - Sum(Parts Cost + deductible business expenses).
  const netProfitBeforeTax = Math.round((totalSalesSubtotal - totalCogsSubtotal) * 100) / 100;

  // Projected Profit (Gross Profit / Utilidad Bruta Proyectada):
  // Total Sales Subtotal (Income excl. VAT) - Parts Wholesale Cost Subtotal
  const grossProfit = Math.max(0, Math.round((totalSalesSubtotal - partsCostSubtotal) * 100) / 100);

  // Income Tax Provision Formula (30% in Costa Rica):
  const incomeTaxProvision =
    netProfitBeforeTax > 0 ? Math.round(netProfitBeforeTax * 0.3 * 100) / 100 : 0;

  // Partner Distributable Cash Formula:
  // net_profit - income_tax_provision.
  const partnerDistributableCash =
    Math.round((netProfitBeforeTax - incomeTaxProvision) * 100) / 100;

  let closure;
  if (persist) {
    closure = await prisma.monthlyFinancialClosure.upsert({
      where: { monthYear },
      update: {
        totalSalesSubtotal: Math.round(totalSalesSubtotal * 100) / 100,
        totalCogsSubtotal: Math.round(totalCogsSubtotal * 100) / 100,
        netIvaPayable,
        netProfitBeforeTax,
        incomeTaxProvision,
        partnerDistributableCash,
      },
      create: {
        monthYear,
        totalSalesSubtotal: Math.round(totalSalesSubtotal * 100) / 100,
        totalCogsSubtotal: Math.round(totalCogsSubtotal * 100) / 100,
        netIvaPayable,
        netProfitBeforeTax,
        incomeTaxProvision,
        partnerDistributableCash,
      },
    });
  } else {
    const existing = await prisma.monthlyFinancialClosure.findUnique({
      where: { monthYear },
    });
    closure = existing || {
      monthYear,
      totalSalesSubtotal: Math.round(totalSalesSubtotal * 100) / 100,
      totalCogsSubtotal: Math.round(totalCogsSubtotal * 100) / 100,
      netIvaPayable,
      netProfitBeforeTax,
      incomeTaxProvision,
      partnerDistributableCash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  return {
    closure,
    expenseTransactions: allDisplayExpenses,
    ordersPartsBreakdown,
    metrics: {
      monthYear,
      month,
      year,
      totalSalesSubtotal: Math.round(totalSalesSubtotal * 100) / 100,
      totalCogsSubtotal: Math.round(totalCogsSubtotal * 100) / 100,
      grossProfit,
      partsCostSubtotal,
      partsCogsSubtotal: partsCostSubtotal,
      manualExpensesSubtotal: Math.round(manualExpensesSubtotal * 100) / 100,
      incomeIvaTotal: Math.round(incomeIvaTotal * 100) / 100,
      expenseIvaTotal: Math.round(expenseIvaTotal * 100) / 100,
      netIvaPayable,
      isTaxCredit,
      taxCreditAmount,
      netProfitBeforeTax,
      incomeTaxProvision,
      partnerDistributableCash,
      grossIncomeWithVat: Math.round(grossIncomeWithVat * 100) / 100,
      grossExpenseWithVat: Math.round(grossExpenseWithVat * 100) / 100,
      totalPickupGasExpenseCRC,
      totalDiscountsCRC: Math.round(totalDiscountsCRC),
      rawNetIva: Math.round(rawNetIva * 100) / 100,
    },
  };
}

/**
 * Calculates distributable cash history for all 12 months of the given year
 */
export async function getDistributableCashHistory(year: number) {
  const history: Array<{
    month: number;
    monthKey: string;
    labelEs: string;
    labelEn: string;
    partnerDistributableCash: number;
    grossProfit: number;
    netProfitBeforeTax: number;
    incomeTaxProvision: number;
    totalSalesSubtotal: number;
    totalCogsSubtotal: number;
  }> = [];

  for (let m = 1; m <= 12; m++) {
    const formattedMonth = String(m).padStart(2, "0");
    const res = await syncMonthlyClosure(m, year);
    const closure = res.closure;

    history.push({
      month: m,
      monthKey: `${year}-${formattedMonth}`,
      labelEs: MONTH_NAMES_ES[m - 1],
      labelEn: MONTH_NAMES_EN[m - 1],
      partnerDistributableCash: closure.partnerDistributableCash,
      grossProfit: res.metrics.grossProfit,
      netProfitBeforeTax: closure.netProfitBeforeTax,
      incomeTaxProvision: closure.incomeTaxProvision,
      totalSalesSubtotal: closure.totalSalesSubtotal,
      totalCogsSubtotal: closure.totalCogsSubtotal,
    });
  }

  return history;
}
