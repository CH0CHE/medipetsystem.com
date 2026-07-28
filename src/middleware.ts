import { NextResponse, type NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth/token.service";
import { cookieNamesFor } from "@/lib/auth/cookies";
import { csrfTokensMatch, requiresCsrfCheck, CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/security/csrf";

const TENANT_COOKIES = cookieNamesFor("tenant");
const PA_COOKIES = cookieNamesFor("platform-admin");

async function readClaims(request: NextRequest, cookieName: string) {
  const token = request.cookies.get(cookieName)?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- CSRF de doble-submit para mutaciones sobre la API ---
  if (pathname.startsWith("/api/") && requiresCsrfCheck(request.method)) {
    const exempt = pathname === "/api/auth/csrf" || pathname === "/api/auth/login" || pathname === "/api/platform-admin/auth/login";
    if (!exempt) {
      const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
      const headerToken = request.headers.get(CSRF_HEADER_NAME) ?? undefined;
      if (!csrfTokensMatch(cookieToken, headerToken)) {
        return NextResponse.json({ error: "CSRF token inválido o ausente." }, { status: 403 });
      }
    }
    return NextResponse.next();
  }

  // --- Portal MediPet Admin ---
  if (pathname.startsWith("/platform-admin/dashboard")) {
    const claims = await readClaims(request, PA_COOKIES.access);
    if (!claims || !claims.isSuperAdmin) {
      return NextResponse.redirect(new URL("/platform-admin/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/platform-admin/login") {
    const claims = await readClaims(request, PA_COOKIES.access);
    if (claims?.isSuperAdmin) {
      return NextResponse.redirect(new URL("/platform-admin/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // --- Portal de clínicas (tenant) ---
  if (pathname.startsWith("/dashboard")) {
    const claims = await readClaims(request, TENANT_COOKIES.access);
    if (!claims) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (claims.mustChangePassword) {
      return NextResponse.redirect(new URL("/change-password", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/change-password") {
    const claims = await readClaims(request, TENANT_COOKIES.access);
    if (!claims) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/login") {
    const claims = await readClaims(request, TENANT_COOKIES.access);
    if (claims && !claims.mustChangePassword) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
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
