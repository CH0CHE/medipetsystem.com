import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getRequestIp, getRequestUserAgent, ApiError } from "@/lib/http/api-error";
import { getRefreshToken, setSessionCookies, type SessionNamespace } from "@/lib/auth/cookies";
import { authService } from "../index";

export async function handleRefreshRequest(request: Request, namespace: SessionNamespace): Promise<NextResponse> {
  const cookieStore = await cookies();
  const rawRefreshToken = getRefreshToken(cookieStore, namespace);

  if (!rawRefreshToken) {
    throw new ApiError(401, "No hay sesión activa.", "NO_REFRESH_TOKEN");
  }

  const meta = { ipAddress: getRequestIp(request), userAgent: getRequestUserAgent(request) };
  const tokens = await authService.refresh(rawRefreshToken, meta);

  const response = NextResponse.json({ ok: true });
  setSessionCookies(response, namespace, tokens);
  return response;
}
