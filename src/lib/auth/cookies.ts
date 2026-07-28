import type { NextResponse } from "next/server";
import { accessTokenMaxAgeSeconds, refreshTokenMaxAgeSeconds } from "./token.service";

/** Satisfecho tanto por `NextRequest.cookies` como por `cookies()` de next/headers. */
export interface ReadableCookieJar {
  get(name: string): { value: string } | undefined;
}

export type SessionNamespace = "tenant" | "platform-admin";

const COOKIE_SECURE = process.env.COOKIE_SECURE !== "false";

export function cookieNamesFor(namespace: SessionNamespace) {
  return namespace === "tenant"
    ? { access: "mp_access_token", refresh: "mp_refresh_token", refreshPath: "/api/auth" }
    : { access: "mp_pa_access_token", refresh: "mp_pa_refresh_token", refreshPath: "/api/platform-admin" };
}

export function setSessionCookies(
  response: NextResponse,
  namespace: SessionNamespace,
  tokens: { accessToken: string; refreshToken: string },
) {
  const names = cookieNamesFor(namespace);

  response.cookies.set(names.access, tokens.accessToken, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: accessTokenMaxAgeSeconds(),
  });

  response.cookies.set(names.refresh, tokens.refreshToken, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "strict",
    path: names.refreshPath,
    maxAge: refreshTokenMaxAgeSeconds(),
  });
}

export function clearSessionCookies(response: NextResponse, namespace: SessionNamespace) {
  const names = cookieNamesFor(namespace);
  response.cookies.set(names.access, "", { path: "/", maxAge: 0 });
  response.cookies.set(names.refresh, "", { path: names.refreshPath, maxAge: 0 });
}

export function getAccessToken(cookies: ReadableCookieJar, namespace: SessionNamespace): string | undefined {
  return cookies.get(cookieNamesFor(namespace).access)?.value;
}

export function getRefreshToken(cookies: ReadableCookieJar, namespace: SessionNamespace): string | undefined {
  return cookies.get(cookieNamesFor(namespace).refresh)?.value;
}
