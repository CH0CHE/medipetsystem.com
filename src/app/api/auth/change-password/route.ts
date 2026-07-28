import { NextResponse } from "next/server";
import { apiErrorResponse, getRequestIp, getRequestUserAgent, ApiError } from "@/lib/http/api-error";
import { setSessionCookies } from "@/lib/auth/cookies";
import { requireAuthContext } from "@/lib/auth/require-permission";
import { mapAuthErrorToApiError } from "@/modules/auth/application/map-auth-error";
import { authService } from "@/modules/auth";
import { changePasswordSchema } from "@/modules/auth/application/dto/change-password.schema";

export async function POST(request: Request) {
  try {
    const ctx = await requireAuthContext("tenant");
    const body = await request.json();
    const input = changePasswordSchema.parse(body);

    const meta = { ipAddress: getRequestIp(request), userAgent: getRequestUserAgent(request) };
    const tokens = await authService.changePassword(ctx.userId, input, meta);

    const response = NextResponse.json({ ok: true });
    setSessionCookies(response, "tenant", tokens);
    return response;
  } catch (error) {
    if (error instanceof ApiError) return apiErrorResponse(error);
    return apiErrorResponse(mapAuthErrorToApiError(error) ?? error);
  }
}
