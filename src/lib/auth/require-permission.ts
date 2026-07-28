import { ApiError, getRequestIp, getRequestUserAgent } from "@/lib/http/api-error";
import { auditRepository } from "@/lib/audit/audit.repository";
import { getServerAuthContext, type AuthContext } from "./server-session";
import type { SessionNamespace } from "./cookies";

/** Lanza 401 si no hay sesión válida en la cookie del namespace indicado. */
export async function requireAuthContext(namespace: SessionNamespace): Promise<AuthContext> {
  const ctx = await getServerAuthContext(namespace);
  if (!ctx) {
    throw new ApiError(401, "No autenticado.", "UNAUTHENTICATED");
  }
  return ctx;
}

/**
 * Verifica que el contexto tenga el permiso exigido. Si no lo tiene, audita la
 * denegación (`sp_write_audit_log`) y lanza 403 — nunca deja pasar silenciosamente.
 */
export async function requirePermission(
  ctx: AuthContext,
  permissionCode: string,
  request: Request,
): Promise<void> {
  if (ctx.isSuperAdmin || ctx.permissions.includes(permissionCode)) {
    return;
  }

  await auditRepository.write({
    tenantId: ctx.tenantId,
    userId: ctx.userId,
    action: "ACCESS_DENIED",
    entityType: "Permission",
    entityId: permissionCode,
    targetUsername: ctx.username,
    metadata: { requiredPermission: permissionCode, path: new URL(request.url).pathname },
    ipAddress: getRequestIp(request),
    userAgent: getRequestUserAgent(request),
  });

  throw new ApiError(403, "No tienes permisos para realizar esta acción.", "FORBIDDEN");
}
