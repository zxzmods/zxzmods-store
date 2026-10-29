import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

const CACHE_MAX_AGE_MS = 4 * 60 * 60 * 1000; // 4 hours

async function fetchLiveRateFromProviders(): Promise<number | null> {
  const endpoints: Array<{
    url: string;
    extract: (json: any) => number | null;
  }> = [
    {
      url: "https://api.hacienda.go.cr/indicadores/tc/dolar",
      extract: (json) => (json?.venta?.valor !== undefined ? Number(json.venta.valor) : null),
    },
    {
      url: "https://tipodecambio.paginasweb.cr/api",
      extract: (json) => (json?.venta !== undefined ? Number(json.venta) : null),
    },
    {
      url: "https://api.hacienda.go.cr/indicadores/tc",
      extract: (json) => (json?.dolar?.venta?.valor !== undefined ? Number(json.dolar.venta.valor) : null),
    },
    {
      url: "https://open.er-api.com/v6/latest/USD",
      extract: (json) => (json?.rates?.CRC !== undefined ? Number((Number(json.rates.CRC) + 1.85).toFixed(2)) : null),
    },
  ];

  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(ep.url, {
        headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 (compatible; ZxZ-Mods/1.0)" },
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        const val = ep.extract(json);
        if (val !== null && Number.isFinite(val) && val > 300 && val < 1500) {
          return Number(val.toFixed(2));
        }
      }
    } catch {}
  }
  return null;
}

/**
 * Returns the active BCCR Sell Exchange Rate (Colones per $1 USD)
 * from the database (LogisticsRateConfig), live BCCR API, or persistent cache.
 */
export async function getBccrSellRate(): Promise<number> {
  try {
    const dbConfig = await prisma.logisticsRateConfig.findUnique({
      where: { id: "rates-config" },
    });

    // 1. Honor manual override unconditionally if enabled in the Backdoor
    if (
      dbConfig?.useManualExchangeRate &&
      typeof dbConfig.manualExchangeRateCRC === "number" &&
      dbConfig.manualExchangeRateCRC > 300 &&
      dbConfig.manualExchangeRateCRC < 1500
    ) {
      return Number(dbConfig.manualExchangeRateCRC.toFixed(2));
    }

    // 2. If cachedExchangeRateCRC was recently synced, return it
    const updatedAtMs = dbConfig?.exchangeRateUpdatedAt
      ? new Date(dbConfig.exchangeRateUpdatedAt).getTime()
      : 0;
    const isFresh = updatedAtMs > 0 && Date.now() - updatedAtMs < CACHE_MAX_AGE_MS;

    if (
      isFresh &&
      typeof dbConfig?.cachedExchangeRateCRC === "number" &&
      dbConfig.cachedExchangeRateCRC > 300 &&
      dbConfig.cachedExchangeRateCRC < 1500
    ) {
      return Number(dbConfig.cachedExchangeRateCRC.toFixed(2));
    }

    // 3. Fetch fresh live BCCR rate and persist to database
    const liveRate = await fetchLiveRateFromProviders();
    if (liveRate) {
      try {
        await prisma.logisticsRateConfig.upsert({
          where: { id: "rates-config" },
          update: {
            cachedExchangeRateCRC: liveRate,
            exchangeRateUpdatedAt: new Date(),
          },
          create: {
            id: "rates-config",
            cachedExchangeRateCRC: liveRate,
            useManualExchangeRate: false,
            exchangeRateUpdatedAt: new Date(),
          },
        });
      } catch {}
      return liveRate;
    }

    // 4. Fallback to cached DB rate if live providers timed out
    if (
      typeof dbConfig?.cachedExchangeRateCRC === "number" &&
      dbConfig.cachedExchangeRateCRC > 300 &&
      dbConfig.cachedExchangeRateCRC < 1500
    ) {
      return Number(dbConfig.cachedExchangeRateCRC.toFixed(2));
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
