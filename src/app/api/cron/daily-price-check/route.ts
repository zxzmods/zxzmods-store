import { NextRequest, NextResponse } from "next/server";
import { getStealthSession } from "@/lib/stealthAuth";
import {
  getCostaRicaClock,
  hasDailyPriceCheckRunToday,
  runDailySupplierPriceCheck,
} from "@/lib/supplierPriceSync";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorizedCronRequest(request: NextRequest): boolean {
  const expectedSecret = process.env.CRON_SECRET || process.env.SYS_CRON_SECRET || "";
  if (!expectedSecret) return false;
  const authHeader = request.headers.get("authorization") || "";
  const customHeader = request.headers.get("x-cron-secret") || "";
  const querySecret = new URL(request.url).searchParams.get("secret") || "";
  return (
    authHeader === `Bearer ${expectedSecret}` ||
    customHeader === expectedSecret ||
    querySecret === expectedSecret
  );
}

async function handlePriceCheck(request: NextRequest) {
  const isCronAuth = isAuthorizedCronRequest(request);
  const stealthSession = isCronAuth ? null : await getStealthSession();

  if (!isCronAuth && !stealthSession) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const url = new URL(request.url);
    const force = url.searchParams.get("force") === "true" || !isCronAuth;
    const crClock = getCostaRicaClock();

    if (!force) {
      const alreadyRan = await hasDailyPriceCheckRunToday(crClock.dateKey);
      if (alreadyRan) {
        return NextResponse.json({
          success: true,
          skipped: true,
          message: `Daily price check already ran for ${crClock.dateKey}.`,
          runDateCR: crClock.dateKey,
        });
      }
    }

    const triggeredBy = isCronAuth
      ? "CRON_3AM_CR"
      : stealthSession?.email || "STAFF_MANUAL";

    const summary = await runDailySupplierPriceCheck({ triggeredBy });

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("[CRON_DAILY_PRICE_CHECK_ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to run daily supplier price check" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handlePriceCheck(request);
}

export async function POST(request: NextRequest) {
  return handlePriceCheck(request);
}
