import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { containsSqlProbing } from "@/lib/security/inputSanitizer";

const PUBLIC_SYS_ROUTES = ["/api/sys/auth/login", "/api/sys/auth/logout"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Path traversal and malformed URI attack mitigation
  const lowerPath = pathname.toLowerCase();
  if (
    lowerPath.includes("..") ||
    lowerPath.includes("//") ||
    lowerPath.includes("%2e") ||
    lowerPath.includes("%2f") ||
    lowerPath.includes("\\")
  ) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  // 2. Edge SQL Probing / Malicious Query String Defense ("SQL Promping" Shield)
  if (search && containsSqlProbing(search)) {
    return new NextResponse("Bad Request: Prohibited query pattern detected", { status: 400 });
  }

  // 3. Edge protection for administrative endpoints (/api/sys/* and /api/finances/*)
  const isSysRoute = pathname.startsWith("/api/sys/");
  const isFinanceRoute = pathname.startsWith("/api/finances/");

  if (isSysRoute || isFinanceRoute) {
    const isPublicSysRoute = PUBLIC_SYS_ROUTES.some((route) => pathname.startsWith(route));

    if (!isPublicSysRoute) {
      // Check Cron authorization (strictly require explicit CRON_SECRET with NO fallback)
      const authHeader = request.headers.get("authorization");
      const configuredCronSecret = process.env.CRON_SECRET;
      const isAuthorizedCron =
        Boolean(configuredCronSecret && configuredCronSecret.length >= 16) &&
        authHeader === `Bearer ${configuredCronSecret}`;

      const sessionCookie = request.cookies.get("zxz_sys_session")?.value;

      if (!sessionCookie && !isAuthorizedCron) {
        // Return strict 404 to mimic non-existent route to external bots/scanners
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
      }
    }
  }

  // 4. CORS & Allowed Origin verification for mutating requests
  const origin = request.headers.get("origin");
  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS ||
    "https://zxzmods.com,https://www.zxzmods.com,http://localhost:3000"
  )
    .split(",")
    .map((o) => o.trim());

  const response = NextResponse.next();

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, x-garage-session-id, Idempotency-Key"
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (/images/, /uploads/, etc.)
     */
    "/((?!_next/static|_next/image|images/|uploads/|favicon.ico).*)",
  ],
};
