import crypto from "crypto";

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR" | "AUDIT";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  requestId?: string;
  message?: string;
  details?: Record<string, any>;
  durationMs?: number;
}

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "creditcard",
  "cardnumber",
  "cvv",
  "authorization",
  "claimtoken",
  "sessiontoken",
]);

/**
 * Recursively masks sensitive fields to prevent credentials and PII leaking into logs.
 */
function sanitizeDetails(obj: any, depth = 0): any {
  if (depth > 5 || !obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeDetails(item, depth + 1));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeDetails(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function getOrCreateRequestId(request?: Request | Headers): string {
  if (!request) return crypto.randomUUID();
  const headers = request instanceof Headers ? request : request.headers;
  return headers.get("x-request-id") || crypto.randomUUID();
}

function writeLog(entry: LogEntry): void {
  const sanitizedEntry: LogEntry = {
    ...entry,
    details: entry.details ? sanitizeDetails(entry.details) : undefined,
  };

  const formatted = JSON.stringify(sanitizedEntry);

  switch (entry.level) {
    case "ERROR":
      console.error(formatted);
      break;
    case "WARN":
      console.warn(formatted);
      break;
    case "AUDIT":
    case "INFO":
    default:
      console.log(formatted);
      break;
  }
}

export const logger = {
  info(event: string, details?: Record<string, any>, requestId?: string) {
    writeLog({
      timestamp: new Date().toISOString(),
      level: "INFO",
      event,
      requestId,
      details,
    });
  },

  warn(event: string, details?: Record<string, any>, requestId?: string) {
    writeLog({
      timestamp: new Date().toISOString(),
      level: "WARN",
      event,
      requestId,
      details,
    });
  },

  error(event: string, error: any, details?: Record<string, any>, requestId?: string) {
    writeLog({
      timestamp: new Date().toISOString(),
      level: "ERROR",
      event,
      requestId,
      message: error instanceof Error ? error.message : String(error),
      details: {
        ...details,
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
  },

  audit(event: string, actor: string, details?: Record<string, any>, requestId?: string) {
    writeLog({
      timestamp: new Date().toISOString(),
      level: "AUDIT",
      event,
      requestId,
      details: {
        actor,
        ...details,
      },
    });
  },
};
