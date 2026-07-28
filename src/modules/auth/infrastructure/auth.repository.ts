import { prisma } from "@/lib/db/prisma";
import type { IAuthRepository } from "../domain/repositories";
import type { LoginContext, SessionContext } from "../domain/entities";

type LoginContextRow = {
  user_id: string;
  tenant_id: string | null;
  branch_id: string | null;
  username: string;
  password_hash: string;
  password_salt: string;
  must_change_password: boolean;
  user_status: LoginContext["userStatus"];
  failed_login_attempts: number;
  locked_until: Date | null;
  is_super_admin: boolean;
  is_support_account: boolean;
  tenant_status: LoginContext["tenantStatus"];
  tenant_name: string | null;
  tenant_code: string | null;
  branch_name: string | null;
  roles: string[];
  permissions: string[];
};

type SessionContextRow = {
  user_id: string;
  tenant_id: string | null;
  branch_id: string | null;
  username: string;
  must_change_password: boolean;
  user_status: SessionContext["userStatus"];
  is_super_admin: boolean;
  is_support_account: boolean;
  tenant_status: SessionContext["tenantStatus"];
  tenant_name: string | null;
  tenant_code: string | null;
  branch_name: string | null;
  roles: string[];
  permissions: string[];
};

function mapLoginContext(row: LoginContextRow): LoginContext {
  return {
    userId: row.user_id,
    tenantId: row.tenant_id,
    branchId: row.branch_id,
    username: row.username,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    mustChangePassword: row.must_change_password,
    userStatus: row.user_status,
    failedLoginAttempts: row.failed_login_attempts,
    lockedUntil: row.locked_until,
    isSuperAdmin: row.is_super_admin,
    isSupportAccount: row.is_support_account,
    tenantStatus: row.tenant_status,
    tenantName: row.tenant_name,
    tenantCode: row.tenant_code,
    branchName: row.branch_name,
    roles: row.roles ?? [],
    permissions: row.permissions ?? [],
  };
}

export const authRepository: IAuthRepository = {
  async checkIpRateLimit(ipAddress, windowMinutes, maxAttempts) {
    const rows = await prisma.$queryRaw<{ allowed: boolean; attempts_in_window: number }[]>`
      SELECT * FROM sp_check_ip_rate_limit(${ipAddress}, ${windowMinutes}::int, ${maxAttempts}::int)
    `;
    const row = rows[0]!;
    return { allowed: row.allowed, attemptsInWindow: row.attempts_in_window };
  },

  async getLoginContext(username) {
    const rows = await prisma.$queryRaw<LoginContextRow[]>`
      SELECT * FROM sp_get_login_context(${username})
    `;
    if (rows.length === 0) return null;
    return mapLoginContext(rows[0]!);
  },

  async recordLoginResult({ userId, usernameAttempted, success, ipAddress, userAgent, maxAttempts, lockMinutes }) {
    const rows = await prisma.$queryRaw<{ locked_until: Date | null }[]>`
      SELECT * FROM sp_record_login_result(
        ${userId}::uuid, ${usernameAttempted}, ${success}, ${ipAddress}, ${userAgent}, ${maxAttempts}::int, ${lockMinutes}::int
      )
    `;
    return { lockedUntil: rows[0]?.locked_until ?? null };
  },

  async getSessionContext(userId) {
    const rows = await prisma.$queryRaw<SessionContextRow[]>`
      SELECT * FROM sp_get_user_session_context(${userId}::uuid)
    `;
    if (rows.length === 0) return null;
    const row = rows[0]!;
    return {
      userId: row.user_id,
      tenantId: row.tenant_id,
      branchId: row.branch_id,
      username: row.username,
      mustChangePassword: row.must_change_password,
      userStatus: row.user_status,
      isSuperAdmin: row.is_super_admin,
      isSupportAccount: row.is_support_account,
      tenantStatus: row.tenant_status,
      tenantName: row.tenant_name,
      tenantCode: row.tenant_code,
      branchName: row.branch_name,
      roles: row.roles ?? [],
      permissions: row.permissions ?? [],
    };
  },

  async updateUserPassword(userId, newPasswordHash, newPasswordSalt) {
    await prisma.$executeRaw`
      SELECT sp_update_user_password(${userId}::uuid, ${newPasswordHash}, ${newPasswordSalt})
    `;
  },
};
