import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireStealthSession } from "@/lib/stealthAuth";
import { recordAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface ProviderDiagnostic {
  name: string;
  url: string;
  status: "ONLINE" | "OFFLINE" | "ERROR";
  sellRate?: number;
  buyRate?: number;
  date?: string;
  latencyMs: number;
  error?: string;
}

export interface ExchangeRateData {
  rate: number;
  buyRate: number;
  currency: string;
  baseCurrency: string;
  source: string;
  date: string;
  override: boolean;
  cached?: boolean;
  updatedAt: string;
  notes?: string;
  lastSyncAt?: string;
  diagnostics?: ProviderDiagnostic[];
}

interface MemoryCache {
  data: ExchangeRateData;
  fetchedAt: number;
}

// In-memory cache with 5-minute TTL to prevent rate-limiting while keeping live updates
let memoryCache: MemoryCache | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

const PERSISTENT_CACHE_PATH = path.join(process.cwd(), ".cache", "live_exchange_rate.json");
const IS_SERVERLESS = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

// Helper to read persistent cache (Database primary, local disk fallback)
async function readPersistentCache(): Promise<ExchangeRateData | null> {
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
        return {
          rate: Number(activeRate.toFixed(2)),
          buyRate: Number((activeRate - 5.21).toFixed(2)),
          currency: "USD",
          baseCurrency: "CRC",
          source:
            dbConfig.exchangeRateSource ||
            (dbConfig.useManualExchangeRate
              ? "Manual (Backdoor Admin)"
              : "Banco Central de Costa Rica (BCCR)"),
          date: getCostaRicaDateString(),
          override: Boolean(dbConfig.useManualExchangeRate),
          updatedAt: (dbConfig.exchangeRateUpdatedAt || dbConfig.updatedAt).toISOString(),
        };
      }
    }
  } catch (dbErr) {
    console.warn("Could not read exchange rate from database, trying disk fallback:", dbErr);
  }

  try {
    if (fs.existsSync(PERSISTENT_CACHE_PATH)) {
      const raw = fs.readFileSync(PERSISTENT_CACHE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (typeof parsed?.rate === "number" && parsed.rate > 300 && parsed.rate < 1500) {
        return {
          ...parsed,
          override: Boolean(parsed.override),
        };
      }
    }
  } catch (err) {
    console.error("Error reading persistent exchange rate cache:", err);
  }
  return null;
}

// Helper to write persistent cache (Database primary, local disk in dev only)
async function writePersistentCache(data: ExchangeRateData) {
  try {
    await prisma.logisticsRateConfig.upsert({
      where: { id: "rates-config" },
      update: {
        cachedExchangeRateCRC: data.rate,
        ...(data.override ? { manualExchangeRateCRC: data.rate } : {}),
        useManualExchangeRate: Boolean(data.override),
        exchangeRateSource: data.source,
        exchangeRateUpdatedAt: new Date(),
      },
      create: {
        id: "rates-config",
        cachedExchangeRateCRC: data.rate,
        manualExchangeRateCRC: data.override ? data.rate : null,
        useManualExchangeRate: Boolean(data.override),
        exchangeRateSource: data.source,
        exchangeRateUpdatedAt: new Date(),
      },
    });
  } catch (dbErr) {
    console.warn("Could not write exchange rate to database:", dbErr);
  }

  if (!IS_SERVERLESS) {
    try {
      const dir = path.dirname(PERSISTENT_CACHE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(PERSISTENT_CACHE_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("Error writing persistent exchange rate cache:", err);
    }
  }
}

// Get Costa Rica date string YYYY-MM-DD
function getCostaRicaDateString(): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Costa_Rica",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(now);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

interface ProviderConfig {
  name: string;
  url: string;
  extract: (json: any) => { ventaVal: number; compraVal: number; dateVal: string } | null;
}

const PROVIDERS: ProviderConfig[] = [
  {
    name: "Ministerio de Hacienda / BCCR Dólar",
    url: "https://api.hacienda.go.cr/indicadores/tc/dolar",
    extract: (json) => {
      if (json?.venta?.valor !== undefined) {
        const v = Number(json.venta.valor);
        const c = Number(json?.compra?.valor ?? v - 4);
        const d = String(json.venta.fecha || json.compra.fecha || "").slice(0, 10);
        return { ventaVal: v, compraVal: c, dateVal: d };
      }
      return null;
    },
  },
  {
    name: "PaginasWeb CR (BCCR Feed Oficial)",
    url: "https://tipodecambio.paginasweb.cr/api",
    extract: (json) => {
      if (json?.venta !== undefined && typeof Number(json.venta) === "number") {
        const v = Number(json.venta);
        const c = Number(json.compra ?? v - 4);
        let d = getCostaRicaDateString();
        if (json.fecha && typeof json.fecha === "string") {
          // fecha may come as "14/10/2026"
          const parts = json.fecha.split("/");
          if (parts.length === 3) {
            d = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
          } else {
            d = json.fecha.slice(0, 10);
          }
        }
        return { ventaVal: v, compraVal: c, dateVal: d };
      }
      return null;
    },
  },
  {
    name: "Ministerio de Hacienda General",
    url: "https://api.hacienda.go.cr/indicadores/tc",
    extract: (json) => {
      if (json?.dolar?.venta?.valor !== undefined) {
        const v = Number(json.dolar.venta.valor);
        const c = Number(json?.dolar?.compra?.valor ?? v - 4);
        const d = String(json?.dolar?.venta?.fecha || json?.dolar?.compra?.fecha || "").slice(0, 10);
        return { ventaVal: v, compraVal: c, dateVal: d };
      }
      return null;
    },
  },
];

// Query all providers with latency tracking
async function queryProvidersDiagnostics(): Promise<{
  diagnostics: ProviderDiagnostic[];
  bestResult: { rate: number; buyRate: number; date: string; source: string } | null;
}> {
  const diagnostics: ProviderDiagnostic[] = [];
  let bestResult: { rate: number; buyRate: number; date: string; source: string } | null = null;

  for (const provider of PROVIDERS) {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5500);

      const res = await fetch(provider.url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "ZxZ-Mods/1.0 (Costa Rica BCCR Monitor)",
        },
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - start;

      if (res.ok) {
        const json = await res.json();
        const extracted = provider.extract(json);

        if (
          extracted &&
          !isNaN(extracted.ventaVal) &&
          extracted.ventaVal > 300 &&
          extracted.ventaVal < 1500
        ) {
          const sellRate = Number(extracted.ventaVal.toFixed(2));
          const buyRate = Number(extracted.compraVal.toFixed(2));
          const date = extracted.dateVal || getCostaRicaDateString();

          diagnostics.push({
            name: provider.name,
            url: provider.url,
            status: "ONLINE",
            sellRate,
            buyRate,
            date,
            latencyMs,
          });

          if (!bestResult) {
            bestResult = {
              rate: sellRate,
              buyRate,
              date,
              source: `Banco Central de Costa Rica (BCCR via ${provider.name})`,
            };
          }
          continue;
        }
      }

      diagnostics.push({
        name: provider.name,
        url: provider.url,
        status: "ERROR",
        latencyMs,
        error: `HTTP ${res.status} o respuesta de formato no reconocido`,
      });
    } catch (err: any) {
      diagnostics.push({
        name: provider.name,
        url: provider.url,
        status: "OFFLINE",
        latencyMs: Date.now() - start,
        error: err?.message || "Tiempo de espera agotado",
      });
    }
  }

  return { diagnostics, bestResult };
}

// Fetch live from official BCCR feeds with multi-endpoint fallback
async function fetchLiveBccrRate(): Promise<{ rate: number; buyRate: number; date: string; source: string; diagnostics: ProviderDiagnostic[] } | null> {
  const { diagnostics, bestResult } = await queryProvidersDiagnostics();
  if (bestResult) {
    return {
      ...bestResult,
      diagnostics,
    };
  }
  return null;
}

export async function GET(request: Request) {
  const now = Date.now();
  const url = new URL(request.url);
  const forceFresh = url.searchParams.get("fresh") === "true";
  const forceLive = url.searchParams.get("forceLive") === "true";
  const includeDiagnostics = url.searchParams.get("diagnostics") === "true";

  // 1. Read persistent cache if present
  const persisted = await readPersistentCache();

  // If MANUAL OVERRIDE is explicitly enabled by the administrator, HONOR IT UNCONDITIONALLY
  // (Do NOT expire or discard manual overrides on date roll-over: it was set intentionally by Master)
  if (persisted && persisted.override === true && !forceLive) {
    const overrideData: ExchangeRateData = {
      ...persisted,
      cached: true,
      source: persisted.source || "Manual (Backdoor Admin)",
    };

    if (includeDiagnostics) {
      const { diagnostics } = await queryProvidersDiagnostics();
      overrideData.diagnostics = diagnostics;
    }

    memoryCache = {
      data: overrideData,
      fetchedAt: now,
    };

    return NextResponse.json({
      success: true,
      data: overrideData,
    });
  }

  // 2. Return memory cache if still fresh within TTL and not forced
  if (
    !forceFresh &&
    !forceLive &&
    memoryCache &&
    now - memoryCache.fetchedAt < CACHE_TTL_MS
  ) {
    let resultData = { ...memoryCache.data, cached: true };
    if (includeDiagnostics && !resultData.diagnostics) {
      const { diagnostics } = await queryProvidersDiagnostics();
      resultData.diagnostics = diagnostics;
    }
    return NextResponse.json({
      success: true,
      data: resultData,
    });
  }

  // 3. Query official live BCCR feed (redundant providers)
  const live = await fetchLiveBccrRate();

  if (live) {
    const exchangeData: ExchangeRateData = {
      rate: live.rate,
      buyRate: live.buyRate,
      currency: "USD",
      baseCurrency: "CRC",
      source: "Banco Central de Costa Rica (BCCR)",
      date: live.date,
      override: false,
      cached: false,
      updatedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString(),
      diagnostics: live.diagnostics,
    };

    memoryCache = {
      data: exchangeData,
      fetchedAt: now,
    };
    await writePersistentCache(exchangeData);

    return NextResponse.json({
      success: true,
      data: exchangeData,
    });
  }

  // 4. If live query failed across all providers, fall back to last known persistent cache
  if (persisted) {
    const fallbackData: ExchangeRateData = {
      ...persisted,
      cached: true,
      source: persisted.source || "Banco Central de Costa Rica (BCCR)",
    };

    if (includeDiagnostics) {
      const { diagnostics } = await queryProvidersDiagnostics();
      fallbackData.diagnostics = diagnostics;
    }

    memoryCache = {
      data: fallbackData,
      fetchedAt: now,
    };

    const response = NextResponse.json({
      success: true,
      data: fallbackData,
    });
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return response;
  }

  // 5. Safe baseline if disk was also unavailable
  const baselineData: ExchangeRateData = {
    rate: 454.56,
    buyRate: 449.35,
    currency: "USD",
    baseCurrency: "CRC",
    source: "Banco Central de Costa Rica (BCCR)",
    date: getCostaRicaDateString(),
    override: false,
    cached: false,
    updatedAt: new Date().toISOString(),
    lastSyncAt: new Date().toISOString(),
  };

  const response = NextResponse.json({
    success: true,
    data: baselineData,
  });
  response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  return response;
}

export async function POST(request: Request) {
  const auth = await requireStealthSession("MASTER");
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const { action, rate, buyRate, override, notes } = body || {};

    const current = await readPersistentCache();

    // Action 1: Force live sync with BCCR and disable manual override
    if (action === "sync_live") {
      const live = await fetchLiveBccrRate();
      if (!live) {
        return NextResponse.json(
          {
            success: false,
            error: "No se pudo conectar con los servidores oficiales del BCCR ni proveedores de respaldo.",
          },
          { status: 502 }
        );
      }

      const syncedData: ExchangeRateData = {
        rate: live.rate,
        buyRate: live.buyRate,
        currency: "USD",
        baseCurrency: "CRC",
        source: "Banco Central de Costa Rica (BCCR)",
        date: live.date,
        override: false,
        cached: false,
        updatedAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
        diagnostics: live.diagnostics,
      };

      await writePersistentCache(syncedData);
      memoryCache = {
        data: syncedData,
        fetchedAt: Date.now(),
      };

      await recordAuditLog({
        actorId: auth.session.userId,
        actorEmail: auth.session.email,
        actorRole: auth.session.role,
        action: "UPDATE_PRODUCT_PRICE" as any,
        entityType: "SYSTEM" as any,
        entityId: "live-exchange-rate",
        oldData: current ? { rate: current.rate, override: current.override } : null,
        newData: { rate: live.rate, override: false, source: syncedData.source },
        details: `Sincronización manual en vivo con BCCR ejecutada por Master: ₡${live.rate}`,
      });

      return NextResponse.json({
        success: true,
        message: "Tipo de cambio sincronizado en vivo exitosamente con el BCCR.",
        data: syncedData,
      });
    }

    // Action 2: Manual override or mode toggle
    const isOverride = override !== undefined ? Boolean(override) : true;

    let newRate = current?.rate ?? 454.56;
    if (rate !== undefined) {
      const numRate = Number(rate);
      if (isNaN(numRate) || numRate < 300 || numRate > 1500) {
        return NextResponse.json(
          { success: false, error: "Tasa de cambio de venta inválida (debe ser un número entre 300 y 1500 CRC)." },
          { status: 400 }
        );
      }
      newRate = Number(numRate.toFixed(2));
    }

    let newBuyRate = current?.buyRate ?? Number((newRate - 5.21).toFixed(2));
    if (buyRate !== undefined) {
      const numBuy = Number(buyRate);
      if (!isNaN(numBuy) && numBuy > 300 && numBuy < 1500) {
        newBuyRate = Number(numBuy.toFixed(2));
      }
    }

    const updatedData: ExchangeRateData = {
      rate: newRate,
      buyRate: newBuyRate,
      currency: "USD",
      baseCurrency: "CRC",
      source: isOverride ? "Manual (Backdoor Admin)" : "Banco Central de Costa Rica (BCCR)",
      date: getCostaRicaDateString(),
      override: isOverride,
      cached: false,
      updatedAt: new Date().toISOString(),
      notes: notes !== undefined ? String(notes).trim() : current?.notes,
    };

    await writePersistentCache(updatedData);
    memoryCache = {
      data: updatedData,
      fetchedAt: Date.now(),
    };

    await recordAuditLog({
      actorId: auth.session.userId,
      actorEmail: auth.session.email,
      actorRole: auth.session.role,
      action: "UPDATE_PRODUCT_PRICE" as any,
      entityType: "SYSTEM" as any,
      entityId: "live-exchange-rate",
      oldData: current ? { rate: current.rate, buyRate: current.buyRate, override: current.override } : null,
      newData: { rate: newRate, buyRate: newBuyRate, override: isOverride, notes: updatedData.notes },
      details: isOverride
        ? `Ajuste manual del valor del dólar por Master: ₡${newRate} (Compra: ₡${newBuyRate})`
        : `Cambio a sincronización automática BCCR por Master (₡${newRate})`,
    });

    return NextResponse.json({
      success: true,
      message: isOverride
        ? "Valor manual del dólar guardado exitosamente."
        : "Modo automático con BCCR activado exitosamente.",
      data: updatedData,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Error al actualizar tipo de cambio" },
      { status: 500 }
    );
  }
}
