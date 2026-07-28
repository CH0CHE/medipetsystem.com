import { NextResponse } from "next/server";
import { getRequestIp, getRequestUserAgent } from "@/lib/http/api-error";
import { setSessionCookies, type SessionNamespace } from "@/lib/auth/cookies";
import { authService } from "../index";
import { loginSchema } from "./dto/login.schema";
import type { AuthPortal } from "../domain/entities";

export async function handleLoginRequest(
  request: Request,
  portal: AuthPortal,
  namespace: SessionNamespace,
): Promise<NextResponse> {
  const body = await request.json();
  const input = loginSchema.parse(body);

  const meta = { ipAddress: getRequestIp(request), userAgent: getRequestUserAgent(request) };
  const result = await authService.login(input, portal, meta);

  const response = NextResponse.json({
    user: {
      username: result.context.username,
      tenantId: result.context.tenantId,
      tenantCode: result.context.tenantCode,
      tenantName: result.context.tenantName,
      branchId: result.context.branchId,
      branchName: result.context.branchName,
      roles: result.context.roles,
      permissions: result.context.permissions,
      mustChangePassword: result.context.mustChangePassword,
      isSuperAdmin: result.context.isSuperAdmin,
    },
  });

  setSessionCookies(response, namespace, result);
  return response;
}
