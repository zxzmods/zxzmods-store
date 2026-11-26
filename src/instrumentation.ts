/**
 * Next.js Server Instrumentation Hook
 * Starts the daily 3:00 AM Costa Rica (UTC-6) supplier price check scheduler
 * strictly on the Node.js server runtime.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startDailyPriceScheduler } = await import("@/lib/dailyPriceScheduler");
    startDailyPriceScheduler();
  }
}
