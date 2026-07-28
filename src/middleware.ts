import { NextResponse, type NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth/token.service";
import { cookieNamesFor } from "@/lib/auth/cookies";
import { csrfTokensMatch, requiresCsrfCheck, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/security/csrf";
import { createRateLimitStore, checkRateLimit } from "@/lib/security/rate-limiter";

const TENANT_COOKIES = cookieNamesFor("tenant");
const PA_COOKIES = cookieNamesFor("platform-admin");

// Límites en memoria por instancia del proceso — ver el comentario de diseño
// en rate-limiter.ts sobre por qué esto vive aquí y no en Postgres (Edge
// runtime, sin Prisma). Capa general sobre TODA la API + una capa extra, más
// estricta, específicamente sobre los endpoints de login (el lockout por
// usuario/IP en auth.service.ts sigue siendo la defensa autoritativa contra
// fuerza bruta; esto es defensa en profundidad contra flood de requests).
const GENERAL_RATE_LIMIT = { limit: 120, windowMs: 60_000 };
const LOGIN_RATE_LIMIT = { limit: 10, windowMs: 60_000 };
const generalRateLimitStore = createRateLimitStore();
const loginRateLimitStore = createRateLimitStore();

const LOGIN_PATHS = new Set(["/api/auth/login", "/api/platform-admin/auth/login"]);

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function buildCsp(nonce: string): string {
  // El bundle de desarrollo de Next.js (webpack) usa eval() para HMR/source maps —
  // 'unsafe-eval' solo se permite fuera de producción; el build de producción no lo necesita.
  const scriptSrc =
    process.env.NODE_ENV === "production"
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
      : `script-src 'self' 'unsafe-eval' 'nonce-${nonce}' 'strict-dynamic'`;

  return [
    "default-src 'self'",
    scriptSrc,
    // 'unsafe-inline' en style-src: Radix UI (Select/Tooltip/DropdownMenu/Sheet/Popover, usados
    // en todo el proyecto) posiciona elementos flotantes escribiendo `style` inline vía JS. CSS
    // injection es un riesgo muy inferior al de script injection, que sí queda cerrado arriba.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

async function readClaims(request: NextRequest, cookieName: string) {
  const token = request.cookies.get(cookieName)?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  function respond(response: NextResponse): NextResponse {
    response.headers.set("Content-Security-Policy", buildCsp(nonce));
    return response;
  }

  function next(): NextResponse {
    return respond(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  // --- Rate limiting general + extra estricto sobre login ---
  if (pathname.startsWith("/api/")) {
    const ip = getClientIp(request);

    if (LOGIN_PATHS.has(pathname)) {
      const loginResult = checkRateLimit(loginRateLimitStore, `${ip}:${pathname}`, Date.now(), LOGIN_RATE_LIMIT.limit, LOGIN_RATE_LIMIT.windowMs);
      if (!loginResult.allowed) {
        return respond(
          NextResponse.json(
            { error: "Demasiados intentos. Intenta de nuevo más tarde." },
            { status: 429, headers: { "Retry-After": String(loginResult.retryAfterSeconds) } },
          ),
        );
      }
    }

    const generalResult = checkRateLimit(generalRateLimitStore, ip, Date.now(), GENERAL_RATE_LIMIT.limit, GENERAL_RATE_LIMIT.windowMs);
    if (!generalResult.allowed) {
      return respond(
        NextResponse.json(
          { error: "Demasiadas solicitudes. Intenta de nuevo más tarde." },
          { status: 429, headers: { "Retry-After": String(generalResult.retryAfterSeconds) } },
        ),
      );
    }
  }

  // --- CSRF de doble-submit para mutaciones sobre la API ---
  if (pathname.startsWith("/api/") && requiresCsrfCheck(request.method)) {
    const exempt = pathname === "/api/auth/csrf" || pathname === "/api/auth/login" || pathname === "/api/platform-admin/auth/login";
    if (!exempt) {
      const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
      const headerToken = request.headers.get(CSRF_HEADER_NAME) ?? undefined;
      if (!csrfTokensMatch(cookieToken, headerToken)) {
        return respond(NextResponse.json({ error: "CSRF token inválido o ausente." }, { status: 403 }));
      }
    }
    return next();
  }

  // --- Portal MediPet Admin ---
  if (pathname.startsWith("/platform-admin/dashboard")) {
    const claims = await readClaims(request, PA_COOKIES.access);
    if (!claims || !claims.isSuperAdmin) {
      return respond(NextResponse.redirect(new URL("/platform-admin/login", request.url)));
    }
    return next();
  }

  if (pathname === "/platform-admin/login") {
    const claims = await readClaims(request, PA_COOKIES.access);
    if (claims?.isSuperAdmin) {
      return respond(NextResponse.redirect(new URL("/platform-admin/dashboard", request.url)));
    }
    return next();
  }

  // --- Portal de clínicas (tenant) ---
  if (pathname.startsWith("/dashboard")) {
    const claims = await readClaims(request, TENANT_COOKIES.access);
    if (!claims) {
      return respond(NextResponse.redirect(new URL("/login", request.url)));
    }
    if (claims.mustChangePassword) {
      return respond(NextResponse.redirect(new URL("/change-password", request.url)));
    }
    return next();
  }

  if (pathname === "/change-password") {
    const claims = await readClaims(request, TENANT_COOKIES.access);
    if (!claims) {
      return respond(NextResponse.redirect(new URL("/login", request.url)));
    }
    return next();
  }

  if (pathname === "/login") {
    const claims = await readClaims(request, TENANT_COOKIES.access);
    if (claims && !claims.mustChangePassword) {
      return respond(NextResponse.redirect(new URL("/dashboard", request.url)));
    }
    return next();
  }

  return next();
}

export const config = {
  matcher: [
    "/login",
    "/change-password",
    "/dashboard/:path*",
    "/platform-admin/login",
    "/platform-admin/dashboard/:path*",
    "/api/:path*",
  ],
};
