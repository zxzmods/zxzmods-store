import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

/**
 * Returns the active BCCR Sell Exchange Rate (Colones per $1 USD)
 * from the database (LogisticsRateConfig) or persistent cache.
 */
export async function getBccrSellRate(): Promise<number> {
  try {
    const dbConfig = await prisma.logisticsRateConfig.findUnique({
      where: { id: "rates-config" },
    });
    if (dbConfig) {
      const activeRate =
        dbConfig.useManualExchangeRate && dbConfig.manualExchangeRateCRC
          ? dbConfig.manualExchangeRateCRC
          : dbConfig.cachedExchangeRateCRC;
      if (typeof activeRate === "number" && activeRate > 300 && activeRate < 1500) {
        return Number(activeRate.toFixed(2));
      }
    }
  } catch {}

  try {
    const cachePaths = [
      path.join(process.cwd(), ".cache", "live_exchange_rate.json"),
      path.join(process.cwd(), "src", "data", "live_exchange_rate.json"),
    ];
    for (const cachePath of cachePaths) {
      if (fs.existsSync(cachePath)) {
        const parsed = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
        if (typeof parsed?.rate === "number" && parsed.rate > 300 && parsed.rate < 1500) {
          return Number(parsed.rate.toFixed(2));
        }
      }
    }
  } catch {}

  return 455.21;
}

export async function getLiveExchangeRate(): Promise<{ rate: number }> {
  const rate = await getBccrSellRate();
  return { rate };
}


