import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireStealthSession } from "@/lib/stealthAuth";

export const dynamic = "force-dynamic";

function getExchangeRate(): number {
  try {
    const cachePath = path.join(process.cwd(), "src", "data", "live_exchange_rate.json");
    if (fs.existsSync(cachePath)) {
      const parsed = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
      if (typeof parsed?.rate === "number" && parsed.rate > 300) {
        return parsed.rate;
      }
    }
  } catch {}
  return 515;
}

export interface TimeBucketStat {
  key: string;
  labelEs: string;
  labelEn: string;
  subLabel?: string;
  grossOrdersCRC: number;
  ordersProfitCRC: number;
  partsCostCRC: number;
  grossServiceCRC: number;
  grossInstallationCRC: number;
  totalProfitCRC: number;
  totalGrossCRC: number;
  pickupGasExpenseCRC: number;
  ordersInProgress: number;
  ordersCompleted: number;
  ordersCount: number;
  unitsSold: number;
}

export async function GET() {
  const auth = await requireStealthSession("MASTER");
  if (!auth.authorized) return auth.response;

  try {
    const [
      orders,
      products,
      combos,
      packages,
      schedules,
      usersCount,
      vehiclesCount,
      auditLogs,
      ratesConfig,
    ] = await Promise.all([
      prisma.order.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.findMany({
        select: {
          id: true,
          sku: true,
          slug: true,
          nameEs: true,
          nameEn: true,
          priceCRC: true,
          profitCRC: true,
          processingPriceCRC: true,
          shippingPriceCRC: true,
          installationPriceCRC: true,
          isArchived: true,
        },
      }),
      prisma.combo.findMany({
        select: {
          id: true,
          slug: true,
          titleEs: true,
          priceCRC: true,
          installationPriceCRC: true,
          isArchived: true,
        },
      }),
      prisma.performancePackage.findMany({
        select: {
          id: true,
          slug: true,
          titleEs: true,
          priceCRC: true,
          installationPriceCRC: true,
        },
      }),
      prisma.serviceSchedule.findMany({
        where: { status: { not: "CANCELLED" } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
      prisma.garageVehicle.count(),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      prisma.logisticsRateConfig.findUnique({
        where: { id: "rates-config" },
      }),
    ]);

    const dbRate =
      ratesConfig?.useManualExchangeRate && ratesConfig?.manualExchangeRateCRC
        ? ratesConfig.manualExchangeRateCRC
        : ratesConfig?.cachedExchangeRateCRC;
    const sellRate =
      typeof dbRate === "number" && dbRate > 300 ? dbRate : getExchangeRate();

    // Build lookup map for products by id, sku, slug
    const productMap = new Map<string, (typeof products)[number]>();
    for (const p of products) {
      productMap.set(p.id, p);
      productMap.set(p.sku, p);
      productMap.set(p.slug, p);
    }

    // Build lookup map for schedules by orderId or orderNumber
    const scheduleByOrderMap = new Map<string, (typeof schedules)[number]>();
    for (const s of schedules) {
      if (s.orderId) {
        scheduleByOrderMap.set(s.orderId, s);
      }
    }

    // Global accumulators
    let grossOrdersIncomeCRC = 0;
    let ordersProfitCRC = 0;
    let totalPartsCostCRC = 0;
    let grossServiceIncomeCRC = 0;
    let totalPickupGasExpenseCRC = 0;
    let grossInstallationIncomeCRC = 0;
    let totalTaxCRC = 0;
    let totalDiscountCRC = 0;
    let totalUnitsSold = 0;

    let ordersInProgressCount = 0;
    let ordersCompletedCount = 0;
    let ordersPendingPaymentCount = 0;
    let ordersCancelledCount = 0;
    let electronicInvoicesCount = 0;

    const statusDistribution: Record<string, number> = {};
    const serviceTypeDistribution: Record<string, { count: number; revenueCRC: number }> = {
      shop_installation: { count: 0, revenueCRC: 0 },
      home_installation: { count: 0, revenueCRC: 0 },
      pickup: { count: 0, revenueCRC: 0 },
      delivery: { count: 0, revenueCRC: 0 },
    };

    // Time-series buckets initialization
    const now = new Date();
    const currentYear = now.getFullYear();

    const monthNamesEs = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const monthNamesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // 1. Monthly buckets (12 months of current year)
    const monthlyBuckets: TimeBucketStat[] = Array.from({ length: 12 }, (_, m) => ({
      key: `${currentYear}-${String(m + 1).padStart(2, "0")}`,
      labelEs: monthNamesEs[m],
      labelEn: monthNamesEn[m],
      subLabel: `${monthNamesEs[m]} ${currentYear}`,
      grossOrdersCRC: 0,
      ordersProfitCRC: 0,
      partsCostCRC: 0,
      grossServiceCRC: 0,
      grossInstallationCRC: 0,
      totalProfitCRC: 0,
      totalGrossCRC: 0,
      pickupGasExpenseCRC: 0,
      ordersInProgress: 0,
      ordersCompleted: 0,
      ordersCount: 0,
      unitsSold: 0,
    }));

    // 2. Daily buckets (last 14 days ending today)
    const dailyBuckets: TimeBucketStat[] = [];
    const dailyMap = new Map<string, TimeBucketStat>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateKey = `${yyyy}-${mm}-${dd}`;
      const bucket: TimeBucketStat = {
        key: dateKey,
        labelEs: `${d.getDate()} ${monthNamesEs[d.getMonth()]}`,
        labelEn: `${monthNamesEn[d.getMonth()]} ${d.getDate()}`,
        subLabel: dateKey,
        grossOrdersCRC: 0,
        ordersProfitCRC: 0,
        partsCostCRC: 0,
        grossServiceCRC: 0,
        grossInstallationCRC: 0,
        totalProfitCRC: 0,
        totalGrossCRC: 0,
        pickupGasExpenseCRC: 0,
        ordersInProgress: 0,
        ordersCompleted: 0,
        ordersCount: 0,
        unitsSold: 0,
      };
      dailyBuckets.push(bucket);
      dailyMap.set(dateKey, bucket);
    }

    // 3. Hourly buckets (24 hours: 00:00 to 23:00)
    const hourlyBuckets: TimeBucketStat[] = Array.from({ length: 24 }, (_, h) => {
      const hour12 = h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`;
      const hour24 = `${String(h).padStart(2, "0")}:00`;
      return {
        key: hour24,
        labelEs: hour12,
        labelEn: hour12,
        subLabel: hour24,
        grossOrdersCRC: 0,
        ordersProfitCRC: 0,
        partsCostCRC: 0,
        grossServiceCRC: 0,
        grossInstallationCRC: 0,
        totalProfitCRC: 0,
        totalGrossCRC: 0,
        pickupGasExpenseCRC: 0,
        ordersInProgress: 0,
        ordersCompleted: 0,
        ordersCount: 0,
        unitsSold: 0,
      };
    });

    // Enriched orders list for Recent Activities table
    const enrichedOrders: Array<{
      id: string;
      orderNumber: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      status: string;
      serviceType: string;
      grossOrdersCRC: number;
      ordersProfitCRC: number;
      grossServiceCRC: number;
      grossInstallationCRC: number;
      totalGrossCRC: number;
      totalProfitCRC: number;
      itemsCount: number;
      firstItemTitle: string;
      createdAt: string;
      updatedAt: string;
      isInstallationPaymentConfirmed: boolean;
    }> = [];

    for (const order of orders) {
      const statusUpper = (order.status || "PENDING").toUpperCase();
      statusDistribution[statusUpper] = (statusDistribution[statusUpper] || 0) + 1;

      const isCancelled = statusUpper === "CANCELLED" || statusUpper === "REJECTED";
      const isCompleted = statusUpper === "COMPLETED" || statusUpper === "DELIVERED";
      const isPendingVerification =
        statusUpper === "PENDING" ||
        statusUpper === "CONFIRM_SERVICE_PAYMENT" ||
        statusUpper === "CONFIRM_INSTALLATION_PAYMENT";
      const isInProgress = !isCancelled && !isCompleted;

      if (isCancelled) {
        ordersCancelledCount++;
      } else if (isCompleted) {
        ordersCompletedCount++;
      } else {
        ordersInProgressCount++;
      }

      if (isPendingVerification) {
        ordersPendingPaymentCount++;
      }

      if (order.requiresElectronicInvoice) {
        electronicInvoicesCount++;
      }

      // Parse itemsJson to compute exact product profit, cost, and units
      let itemsList: any[] = [];
      try {
        const parsed = typeof order.itemsJson === "string" ? JSON.parse(order.itemsJson) : order.itemsJson;
        if (Array.isArray(parsed)) itemsList = parsed;
      } catch {}

      let orderItemsProfitCRC = 0;
      let orderItemsCostCRC = 0;
      let orderUnitsCount = 0;
      let orderItemsInstallSumCRC = 0;

      for (const item of itemsList) {
        const qty = Math.max(1, Number(item.quantity) || 1);
        orderUnitsCount += qty;

        const rawId = String(item.id || "").split("__")[0];
        const sku = String(item.sku || "");
        const matchedProduct = productMap.get(rawId) || productMap.get(sku);

        const unitPriceCRC = Number(item.priceCRC) || matchedProduct?.priceCRC || 0;

        if (matchedProduct) {
          const unitCost = (matchedProduct.processingPriceCRC || 0) + (matchedProduct.shippingPriceCRC || 0);
          const unitProfit =
            matchedProduct.profitCRC > 0
              ? matchedProduct.profitCRC
              : unitCost > 0
              ? Math.max(0, unitPriceCRC - unitCost)
              : Math.round(unitPriceCRC * 0.28);

          orderItemsProfitCRC += unitProfit * qty;
          orderItemsCostCRC += (unitCost > 0 ? unitCost : Math.max(0, unitPriceCRC - unitProfit)) * qty;
        } else {
          const estimatedProfit = Math.round(unitPriceCRC * 0.28);
          orderItemsProfitCRC += estimatedProfit * qty;
          orderItemsCostCRC += Math.max(0, unitPriceCRC - estimatedProfit) * qty;
        }

        if (item.installationPriceCRC) {
          orderItemsInstallSumCRC += Number(item.installationPriceCRC) * qty;
        }
      }

      // Parse serviceDocumentsJson for any additional metadata
      let parsedDoc: any = {};
      if (order.serviceDocumentsJson) {
        try {
          parsedDoc =
            typeof order.serviceDocumentsJson === "string"
              ? JSON.parse(order.serviceDocumentsJson)
              : order.serviceDocumentsJson;
        } catch {}
      }

      const discountCRC = Number(order.discountCRC) || 0;
      const orderGrossPartsCRC = Math.max(
        0,
        (Number(order.partsSubtotalCRC) || Number(order.totalCRC) || 0) - discountCRC
      );

      // Support custom parts cost entered by staff in managing order
      if (typeof parsedDoc?.orderPartsCostCRC === "number" && parsedDoc.orderPartsCostCRC >= 0) {
        orderItemsCostCRC = Number(parsedDoc.orderPartsCostCRC);
        orderItemsProfitCRC = Math.max(0, orderGrossPartsCRC - orderItemsCostCRC);
      }

      const netOrderProfitCRC = Math.max(0, orderItemsProfitCRC - discountCRC);

      // Service / Transport gross income for this order
      const matchedSched =
        scheduleByOrderMap.get(order.id) || scheduleByOrderMap.get(order.orderNumber);
      const orderServiceCRC = Math.max(
        (Number(order.shippingCostCRC) || 0) + (Number(order.pickupCostCRC) || 0),
        Number(parsedDoc?.serviceCostCRC) || 0,
        Number(matchedSched?.costCRC) || 0
      );

      // Installation gross income for this order
      const orderInstallCRC = Math.max(
        (Number(order.installationCostCRC) || 0) + (Number(order.laborSubtotalCRC) || 0),
        Number(parsedDoc?.installationCostCRC) || 0,
        orderItemsInstallSumCRC
      );

      // Gasoline Expense rule for Pick-up Service:
      // "From the service the pick-up is the only one that needs to get subtracted 500 colones per km due to gasoline from the profit. Is the only non-complete profit"
      const isPickup =
        (order.serviceType || "").toUpperCase().includes("PICKUP") ||
        (matchedSched?.serviceType || "").toLowerCase() === "pickup" ||
        (Number(order.pickupCostCRC) || 0) > 0;

      let pickupKm = 0;
      if (isPickup) {
        if (typeof parsedDoc?.distanceKm === "number" && parsedDoc.distanceKm > 0) {
          pickupKm = parsedDoc.distanceKm;
        } else if (typeof matchedSched?.distanceKm === "number" && matchedSched.distanceKm > 0) {
          pickupKm = matchedSched.distanceKm;
        } else if (Number(order.pickupCostCRC) > 0) {
          const baseRate = 1500;
          pickupKm = Number(order.pickupCostCRC) > 10000
            ? Math.round((Number(order.pickupCostCRC) - 10000) / baseRate)
            : Math.round(Number(order.pickupCostCRC) / baseRate);
        }
      }

      const pickupGasExpenseCRC = isPickup && pickupKm > 0 ? Math.round(pickupKm * 500) : 0;
      const serviceProfitCRC = Math.max(0, orderServiceCRC - pickupGasExpenseCRC);

      // =====================================================================
      // STRICT PAID INCOME RULE:
      // "Don't add income that hasn't been payed. Ex, if an order is projected
      // for an installation cost, but the installation hasn't been payed
      // (installation payment proof added to order) then don't add the income
      // to the data. Only add if payment proof and payment has been confirmed."
      // =====================================================================

      // 1. Parts Payment: Requires order.paymentProofUrl and non-pending confirmed status
      const hasPartsProof = Boolean(order.paymentProofUrl && order.paymentProofUrl.trim().length > 0);
      const isPartsConfirmed =
        hasPartsProof &&
        statusUpper !== "PENDING" &&
        statusUpper !== "PAYMENT_PENDING" &&
        statusUpper !== "PAYMENT_CONFIRMATION" &&
        statusUpper !== "PAYMENT_REJECTED" &&
        statusUpper !== "CANCELLED" &&
        statusUpper !== "REJECTED";

      const effectiveGrossPartsCRC = isPartsConfirmed ? orderGrossPartsCRC : 0;
      const effectiveNetOrderProfitCRC = isPartsConfirmed ? netOrderProfitCRC : 0;
      const effectivePartsCostCRC = isPartsConfirmed ? orderItemsCostCRC : 0;
      const effectiveUnitsSold = isPartsConfirmed ? orderUnitsCount : 0;

      // 2. Service Payment: Requires servicePaymentProofUrl or schedule proof and confirmed status
      const hasServiceProof = Boolean(
        (order.servicePaymentProofUrl && order.servicePaymentProofUrl.trim().length > 0) ||
        (matchedSched?.paymentProofUrl && matchedSched.paymentProofUrl.trim().length > 0)
      );
      const isServiceConfirmed =
        hasServiceProof &&
        statusUpper !== "PENDING" &&
        statusUpper !== "PAYMENT_PENDING" &&
        statusUpper !== "PAYMENT_CONFIRMATION" &&
        statusUpper !== "PROGRAM_SERVICE" &&
        statusUpper !== "CONFIRM_SERVICE_PAYMENT" &&
        statusUpper !== "PAYMENT_REJECTED" &&
        statusUpper !== "CANCELLED" &&
        statusUpper !== "REJECTED" &&
        parsedDoc?.servicePaymentRejected !== true;

      const effectiveServiceCRC = isServiceConfirmed ? orderServiceCRC : 0;
      const effectivePickupGasExpenseCRC = isServiceConfirmed ? pickupGasExpenseCRC : 0;
      const effectiveServiceProfitCRC = isServiceConfirmed
        ? Math.max(0, orderServiceCRC - pickupGasExpenseCRC)
        : 0;

      // 3. Installation Payment: Requires installationPaymentProofUrl or explicit confirmation
      const hasInstallProof =
        Boolean(order.installationPaymentProofUrl && order.installationPaymentProofUrl.trim().length > 0) ||
        parsedDoc?.installationPaymentConfirmed === true ||
        Boolean(parsedDoc?.installationPaymentProofUrl && parsedDoc.installationPaymentProofUrl.trim().length > 0) ||
        Boolean(parsedDoc?.receiptUrl && parsedDoc.receiptUrl.trim().length > 0);

      const isInstallConfirmed =
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

      const effectiveInstallCRC = isInstallConfirmed ? orderInstallCRC : 0;

      const orderTotalProfitCRC =
        effectiveNetOrderProfitCRC + effectiveServiceProfitCRC + effectiveInstallCRC;
      const orderTotalGrossCRC =
        effectiveGrossPartsCRC + effectiveServiceCRC + effectiveInstallCRC;

      if (!isCancelled) {
        grossOrdersIncomeCRC += effectiveGrossPartsCRC;
        ordersProfitCRC += effectiveNetOrderProfitCRC;
        totalPartsCostCRC += effectivePartsCostCRC;
        grossServiceIncomeCRC += effectiveServiceCRC;
        totalPickupGasExpenseCRC += effectivePickupGasExpenseCRC;
        grossInstallationIncomeCRC += effectiveInstallCRC;
        totalTaxCRC += isPartsConfirmed ? (Number(order.taxCRC) || 0) : 0;
        totalDiscountCRC += isPartsConfirmed ? discountCRC : 0;
        totalUnitsSold += effectiveUnitsSold;

        // Service distribution (only if service or installation confirmed)
        const st = (order.serviceType || "").toUpperCase();
        if (effectiveServiceCRC > 0 || effectiveInstallCRC > 0) {
          if (st.includes("PICKUP")) {
            serviceTypeDistribution.pickup.count++;
            serviceTypeDistribution.pickup.revenueCRC += effectiveServiceCRC + effectiveInstallCRC;
          } else if (st.includes("HOME")) {
            serviceTypeDistribution.home_installation.count++;
            serviceTypeDistribution.home_installation.revenueCRC += effectiveServiceCRC + effectiveInstallCRC;
          } else if (st.includes("SHIPPING") || st.includes("DELIVERY")) {
            serviceTypeDistribution.delivery.count++;
            serviceTypeDistribution.delivery.revenueCRC += effectiveServiceCRC;
          } else {
            serviceTypeDistribution.shop_installation.count++;
            serviceTypeDistribution.shop_installation.revenueCRC += effectiveInstallCRC;
          }
        }

        // Bucket into Month, Day, Hour (using local Date of order.createdAt)
        const createdDate = new Date(order.createdAt);
        const orderYear = createdDate.getFullYear();
        const orderMonth = createdDate.getMonth();
        const orderHour = createdDate.getHours();
        const dateKey = `${orderYear}-${String(orderMonth + 1).padStart(2, "0")}-${String(
          createdDate.getDate()
        ).padStart(2, "0")}`;

        if (orderYear === currentYear && monthlyBuckets[orderMonth]) {
          const mb = monthlyBuckets[orderMonth];
          mb.grossOrdersCRC += effectiveGrossPartsCRC;
          mb.ordersProfitCRC += effectiveNetOrderProfitCRC;
          mb.partsCostCRC += effectivePartsCostCRC;
          mb.grossServiceCRC += effectiveServiceCRC;
          mb.grossInstallationCRC += effectiveInstallCRC;
          mb.pickupGasExpenseCRC += effectivePickupGasExpenseCRC;
          mb.totalProfitCRC += orderTotalProfitCRC;
          mb.totalGrossCRC += orderTotalGrossCRC;
          mb.ordersCount += 1;
          mb.unitsSold += effectiveUnitsSold;
          if (isInProgress) mb.ordersInProgress += 1;
          if (isCompleted) mb.ordersCompleted += 1;
        }

        const db = dailyMap.get(dateKey);
        if (db) {
          db.grossOrdersCRC += effectiveGrossPartsCRC;
          db.ordersProfitCRC += effectiveNetOrderProfitCRC;
          db.partsCostCRC += effectivePartsCostCRC;
          db.grossServiceCRC += effectiveServiceCRC;
          db.grossInstallationCRC += effectiveInstallCRC;
          db.pickupGasExpenseCRC += effectivePickupGasExpenseCRC;
          db.totalProfitCRC += orderTotalProfitCRC;
          db.totalGrossCRC += orderTotalGrossCRC;
          db.ordersCount += 1;
          db.unitsSold += effectiveUnitsSold;
          if (isInProgress) db.ordersInProgress += 1;
          if (isCompleted) db.ordersCompleted += 1;
        }

        if (hourlyBuckets[orderHour]) {
          const hb = hourlyBuckets[orderHour];
          hb.grossOrdersCRC += effectiveGrossPartsCRC;
          hb.ordersProfitCRC += effectiveNetOrderProfitCRC;
          hb.partsCostCRC += effectivePartsCostCRC;
          hb.grossServiceCRC += effectiveServiceCRC;
          hb.grossInstallationCRC += effectiveInstallCRC;
          hb.pickupGasExpenseCRC += effectivePickupGasExpenseCRC;
          hb.totalProfitCRC += orderTotalProfitCRC;
          hb.totalGrossCRC += orderTotalGrossCRC;
          hb.ordersCount += 1;
          hb.unitsSold += effectiveUnitsSold;
          if (isInProgress) hb.ordersInProgress += 1;
          if (isCompleted) hb.ordersCompleted += 1;
        }
      }

      enrichedOrders.push({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName:
          order.customerName ||
          order.user?.displayName ||
          order.user?.email?.split("@")[0] ||
          order.guestEmail ||
          "Cliente ZxZ",
        customerEmail: order.user?.email || order.guestEmail || "",
        customerPhone: order.customerPhone || order.user?.phoneNumber || "",
        status: order.status,
        serviceType: order.serviceType,
        grossOrdersCRC: effectiveGrossPartsCRC,
        ordersProfitCRC: effectiveNetOrderProfitCRC,
        grossServiceCRC: effectiveServiceCRC,
        grossInstallationCRC: effectiveInstallCRC,
        totalGrossCRC: orderTotalGrossCRC,
        totalProfitCRC: orderTotalProfitCRC,
        itemsCount: orderUnitsCount,
        firstItemTitle: itemsList[0]?.title || itemsList[0]?.name || `Orden #${order.orderNumber}`,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        isInstallationPaymentConfirmed: isInstallConfirmed,
      });
    }

    const totalProfitCRC =
      ordersProfitCRC + Math.max(0, grossServiceIncomeCRC - totalPickupGasExpenseCRC) + grossInstallationIncomeCRC;
    const totalConsolidatedGrossCRC =
      grossOrdersIncomeCRC + grossServiceIncomeCRC + grossInstallationIncomeCRC;
    const validOrdersCount = Math.max(0, orders.length - ordersCancelledCount);
    const averageOrderValueCRC =
      validOrdersCount > 0 ? Math.round(totalConsolidatedGrossCRC / validOrdersCount) : 0;
    const profitMarginPercent =
      totalConsolidatedGrossCRC > 0
        ? Math.round((totalProfitCRC / totalConsolidatedGrossCRC) * 1000) / 10
        : 0;

    // Month-over-month comparison
    const curMonthIdx = now.getMonth();
    const prevMonthIdx = curMonthIdx > 0 ? curMonthIdx - 1 : 11;
    const curMonthGross = monthlyBuckets[curMonthIdx]?.totalGrossCRC || 0;
    const prevMonthGross = monthlyBuckets[prevMonthIdx]?.totalGrossCRC || 0;
    const monthGrowthPercent =
      prevMonthGross > 0
        ? Math.round(((curMonthGross - prevMonthGross) / prevMonthGross) * 100)
        : curMonthGross > 0
        ? 100
        : 0;

    return NextResponse.json({
      success: true,
      exchangeRate: sellRate,
      kpis: {
        grossOrdersIncomeCRC,
        ordersProfitCRC,
        totalPartsCostCRC,
        grossServiceIncomeCRC,
        totalPickupGasExpenseCRC,
        grossInstallationIncomeCRC,
        totalProfitCRC,
        totalConsolidatedGrossCRC,
        totalTaxCRC,
        totalDiscountCRC,
        averageOrderValueCRC,
        profitMarginPercent,
        monthGrowthPercent,
        ordersInProgressCount,
        ordersCompletedCount,
        ordersPendingPaymentCount,
        ordersCancelledCount,
        totalOrdersCount: orders.length,
        scheduledServicesCount: schedules.length,
        electronicInvoicesCount,
        totalUnitsSold,
        usersCount,
        vehiclesCount,
        activeProductsCount: products.filter((p) => !p.isArchived).length,
        activeCombosCount: combos.filter((c) => !c.isArchived).length,
        packagesCount: packages.length,
      },
      statusDistribution,
      serviceTypeDistribution,
      series: {
        months: monthlyBuckets,
        days: dailyBuckets,
        hours: hourlyBuckets,
      },
      recentOrders: enrichedOrders.slice(0, 25),
      recentAuditLogs: auditLogs,
    });
  } catch (error) {
    console.error("[SYS_ANALYTICS_GET_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to compute backdoor analytics" },
      { status: 500 }
    );
  }
}
