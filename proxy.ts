import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/supabase/proxy";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

// Note: "Access-Control-Allow-Credentials" is intentionally not sent. Browsers
// reject credentialed requests when the origin is "*", so it never worked.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,DELETE,PATCH,POST,PUT,OPTIONS",
  "Access-Control-Allow-Headers":
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
};

// API routes that read the Supabase session. Every other API route is public,
// so skip the session refresh (a Supabase round-trip) for them.
const SESSION_API_PREFIXES = ["/api/auth", "/api/profile"];

export async function proxy(request: NextRequest) {
  // Handle preflight OPTIONS requests for CORS
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
  }

  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (isApi) {
    const retryAfter = checkRateLimit(pathname, clientIp(request.headers));
    if (retryAfter !== null) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        {
          status: 429,
          headers: { ...CORS_HEADERS, "Retry-After": String(retryAfter) },
        },
      );
    }
  }

  const needsSession =
    !isApi || SESSION_API_PREFIXES.some((p) => pathname.startsWith(p));
  const response = needsSession
    ? await updateSession(request)
    : NextResponse.next({ request });

  // Inject CORS headers to all API responses
  if (isApi) {
    for (const [key, value] of Object.entries(CORS_HEADERS)) {
      response.headers.set(key, value);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
