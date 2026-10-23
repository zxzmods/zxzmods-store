import { NextResponse } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

// Memory-efficient in-memory sliding window rate limiter
const store = new Map<string, RateLimitRecord>();

// Clean up expired records every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    store.forEach((record, key) => {
      // Remove timestamps older than 1 hour
      record.timestamps = record.timestamps.filter((ts: number) => now - ts < 3600000);
      if (record.timestamps.length === 0) {
        store.delete(key);
      }
    });
  }, 5 * 60 * 1000).unref?.();
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

export interface RateLimitOptions {
  key: string;
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

export function checkRateLimit({
  key,
  maxRequests,
  windowMs,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = store.get(key);
  if (!record) {
    record = { timestamps: [] };
    store.set(key, record);
  }

  // Filter out timestamps outside current window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0] || now;
    const resetMs = Math.max(0, oldest + windowMs - now);
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      resetMs,
    };
  }

  record.timestamps.push(now);
  return {
    success: true,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - record.timestamps.length),
    resetMs: windowMs,
  };
}

export function createRateLimitResponse(
  resetMs: number,
  customMessage?: string
): NextResponse {
  const seconds = Math.max(1, Math.ceil(resetMs / 1000));
  const res = NextResponse.json(
    {
      success: false,
      error:
        customMessage ||
        `Demasiadas solicitudes. Por favor espera ${seconds} segundo(s) antes de intentar de nuevo.`,
      errorEn: `Too many requests. Please wait ${seconds} second(s) before trying again.`,
      retryAfterSeconds: seconds,
    },
    { status: 429 }
  );
  res.headers.set("Retry-After", String(seconds));
  return res;
}
