import type { PasswordPolicy } from "./entities";

export interface ISettingsRepository {
  getPasswordPolicyOverride(tenantId: string): Promise<Partial<PasswordPolicy> | null>;

  updatePasswordPolicyOverride(
    tenantId: string,
    policyOverride: Partial<PasswordPolicy>,
    actorUserId: string,
  ): Promise<void>;
}
