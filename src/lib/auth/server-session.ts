import { cookies } from "next/headers";
import { getAccessToken, type SessionNamespace } from "./cookies";
import { verifyAccessToken } from "./token.service";

export interface AuthContext {
  userId: string;
  tenantId: string | null;
  tenantCode: string | null;
  branchId: string | null;
  username: string;
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
  isSupportAccount: boolean;
  mustChangePassword: boolean;
}

/**
 * Única autoridad para derivar la identidad del request en el runtime Node (Server
 * Components, Route Handlers). El tenantId SIEMPRE sale de aquí — nunca de body/query
 * del cliente — para garantizar el aislamiento multi-tenant.
 */
export async function getServerAuthContext(namespace: SessionNamespace): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const token = getAccessToken(cookieStore, namespace);
  if (!token) return null;

  const claims = await verifyAccessToken(token);
  if (!claims) return null;

  return {
    userId: claims.sub,
    tenantId: claims.tenantId,
    tenantCode: claims.tenantCode,
    branchId: claims.branchId,
    username: claims.username,
    roles: claims.roles,
    permissions: claims.permissions,
    isSuperAdmin: claims.isSuperAdmin,
    isSupportAccount: claims.isSupportAccount,
    mustChangePassword: claims.mustChangePassword,
  };
}
