import { NextResponse } from "next/server";

interface IdempotencyRecord {
  status: "PENDING" | "COMPLETED";
  createdAt: number;
  statusCode?: number;
  body?: any;
}

const idempotencyStore = new Map<string, IdempotencyRecord>();
const IDEMPOTENCY_TTL_MS = 2 * 60 * 1000; // 2 minutes cache

// Background cleaner for stale idempotency locks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    idempotencyStore.forEach((record, key) => {
      if (now - record.createdAt > IDEMPOTENCY_TTL_MS) {
        idempotencyStore.delete(key);
      }
    });
  }, 60 * 1000).unref?.();
}

export type IdempotencyCheckResult =
  | { state: "NEW" }
  | { state: "IN_PROGRESS"; conflictResponse: NextResponse }
  | { state: "CACHED"; cachedResponse: NextResponse };

/**
 * Checks and acquires an idempotency lock for mutation requests.
 */
export function checkAndAcquireIdempotency(
  key: string | null | undefined
): IdempotencyCheckResult {
  if (!key || typeof key !== "string" || key.trim().length === 0) {
    return { state: "NEW" };
  }

  const cleanKey = key.trim();
  const existing = idempotencyStore.get(cleanKey);
  const now = Date.now();

  if (existing) {
    if (now - existing.createdAt < IDEMPOTENCY_TTL_MS) {
      if (existing.status === "PENDING") {
        return {
          state: "IN_PROGRESS",
          conflictResponse: NextResponse.json(
            {
              success: false,
              error: "Esta operación ya se encuentra en proceso. Por favor espera un momento.",
              errorEn: "This operation is already in progress. Please wait a moment.",
            },
            { status: 409 }
          ),
        };
      }

      if (existing.status === "COMPLETED" && existing.body !== undefined) {
        const cachedRes = NextResponse.json(existing.body, {
          status: existing.statusCode || 200,
        });
        cachedRes.headers.set("X-Idempotent-Replay", "true");
        return {
          state: "CACHED",
          cachedResponse: cachedRes,
        };
      }
    } else {
      idempotencyStore.delete(cleanKey);
    }
  }

  // Acquire new lock
  idempotencyStore.set(cleanKey, {
    status: "PENDING",
    createdAt: now,
  });

  return { state: "NEW" };
}

/**
 * Marks the idempotency key as completed and caches the JSON response.
 */
export function completeIdempotency(
  key: string | null | undefined,
  body: any,
  statusCode = 200
): void {
  if (!key || typeof key !== "string" || key.trim().length === 0) return;
  const cleanKey = key.trim();
  idempotencyStore.set(cleanKey, {
    status: "COMPLETED",
    createdAt: Date.now(),
    statusCode,
    body,
  });
}

/**
 * Releases the idempotency key in case of fatal validation or rejection.
 */
export function releaseIdempotency(key: string | null | undefined): void {
  if (!key || typeof key !== "string") return;
  idempotencyStore.delete(key.trim());
}
