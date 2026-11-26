import {
  getCostaRicaClock,
  hasDailyPriceCheckRunToday,
  runDailySupplierPriceCheck,
} from "@/lib/supplierPriceSync";

/**
 * Starts a singleton Node.js background timer that checks once per minute
 * and triggers the daily supplier price check at 3:00 AM Costa Rica (UTC-6).
 * Safe across multi-instance deployments thanks to DB-backed daily idempotency.
 */
export function startDailyPriceScheduler(): void {
  const globalState = globalThis as unknown as {
    __zxzDailyPriceSchedulerStarted?: boolean;
    __zxzDailyPriceSchedulerInFlight?: boolean;
  };

  if (globalState.__zxzDailyPriceSchedulerStarted) {
    return;
  }
  globalState.__zxzDailyPriceSchedulerStarted = true;

  const CHECK_INTERVAL_MS = 60 * 1000;

  const tick = async () => {
    if (globalState.__zxzDailyPriceSchedulerInFlight) return;
    try {
      const { dateKey, hour, minute } = getCostaRicaClock();

      // Trigger window: 03:00 - 03:15 AM Costa Rica (UTC-6)
      if (hour === 3 && minute <= 15) {
        const alreadyRan = await hasDailyPriceCheckRunToday(dateKey);
        if (!alreadyRan) {
          globalState.__zxzDailyPriceSchedulerInFlight = true;
          try {
            console.log(
              `[CRON_3AM_CR] Starting scheduled daily supplier price check for ${dateKey}...`
            );
            const summary = await runDailySupplierPriceCheck({
              triggeredBy: "CRON_3AM_CR",
            });
            console.log(
              `[CRON_3AM_CR] Completed (${dateKey}): checked=${summary.totalChecked}, increaseQueued=${summary.increaseQueuedCount}, decreaseQueued=${summary.decreaseQueuedCount}, failed=${summary.failedCount}`
            );
          } finally {
            globalState.__zxzDailyPriceSchedulerInFlight = false;
          }
        }
      }
    } catch (err) {
      globalState.__zxzDailyPriceSchedulerInFlight = false;
      console.error("[CRON_3AM_CR_TICK_ERROR]:", err);
    }
  };

  const timer = setInterval(tick, CHECK_INTERVAL_MS);
  if (typeof timer.unref === "function") {
    timer.unref();
  }
}
