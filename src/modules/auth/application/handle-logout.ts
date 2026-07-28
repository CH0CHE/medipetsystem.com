import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRefreshToken, clearSessionCookies, type SessionNamespace } from "@/lib/auth/cookies";
import { getServerAuthContext } from "@/lib/auth/server-session";
import { authService } from "../index";

export async function handleLogoutRequest(namespace: SessionNamespace): Promise<NextResponse> {
  const cookieStore = await cookies();
  const rawRefreshToken = getRefreshToken(cookieStore, namespace);
  const ctx = await getServerAuthContext(namespace);

  await authService.logout(rawRefreshToken, ctx?.userId ?? null);

  const response = NextResponse.json({ ok: true });
  clearSessionCookies(response, namespace);
  return response;
}
