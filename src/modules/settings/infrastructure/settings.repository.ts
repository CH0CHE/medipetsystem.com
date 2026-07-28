import { prisma } from "@/lib/db/prisma";
import type { ISettingsRepository } from "../domain/repositories";
import type { PasswordPolicy } from "../domain/entities";

export const settingsRepository: ISettingsRepository = {
  async getPasswordPolicyOverride(tenantId) {
    const rows = await prisma.$queryRaw<{ password_policy: unknown }[]>`
      SELECT * FROM sp_get_tenant_password_policy(${tenantId}::uuid)
    `;
    return (rows[0]?.password_policy as Partial<PasswordPolicy> | null) ?? null;
  },

  async updatePasswordPolicyOverride(tenantId, policyOverride, actorUserId) {
    const json = JSON.stringify(policyOverride);
    await prisma.$executeRaw`
      SELECT sp_update_tenant_password_policy(${tenantId}::uuid, ${json}::jsonb, ${actorUserId}::uuid)
    `;
  },
};
