import { NextRequest, NextResponse } from "next/server";

/**
 * Password-protects the parts of the site that change things:
 *   - /admin (approve / disapprove setups, notes)
 *   - POST /api/approve (writes approvals)
 *   - /api/run-scan (starts the pipeline or the GitHub workflow)
 *
 * Uses HTTP Basic auth. Set these environment variables (Vercel: Project → Settings → Environment Variables):
 *   ADMIN_USER      (optional, defaults to "admin")
 *   ADMIN_PASSWORD  (required in production)
 *
 * If ADMIN_PASSWORD is not set, protected routes are refused in production and left open in local development.
 */

function isProtected(req: NextRequest): boolean {
  const { pathname } = req.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return true;
  if (pathname.startsWith("/api/run-scan")) return true;
  if (pathname.startsWith("/api/approve") && req.method !== "GET") return true;
  return false;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function middleware(req: NextRequest) {
  if (!isProtected(req)) return NextResponse.next();

  const password = process.env.ADMIN_PASSWORD;
  const user = process.env.ADMIN_USER || "admin";

  if (!password) {
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return new NextResponse("Admin is disabled: set ADMIN_PASSWORD in the deployment's environment variables.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const header = req.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const sep = decoded.indexOf(":");
      const u = decoded.slice(0, sep);
      const p = decoded.slice(sep + 1);
      if (sep > -1 && safeEqual(u, user) && safeEqual(p, password)) return NextResponse.next();
    } catch {
      // fall through to 401
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="CSP-Nirvana admin", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/admin", "/api/run-scan/:path*", "/api/run-scan", "/api/approve/:path*", "/api/approve"],
};
