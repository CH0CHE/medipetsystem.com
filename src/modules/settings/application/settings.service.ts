import { resolvePasswordPolicy, type PasswordPolicy } from "@/lib/security/password-policy";
import type { ISettingsRepository } from "../domain/repositories";
import type { UpdatePasswordPolicyInput } from "./dto/update-password-policy.schema";

export class SettingsService {
  constructor(private readonly repository: ISettingsRepository) {}

  async getEffectivePasswordPolicy(tenantId: string): Promise<PasswordPolicy> {
    const override = await this.repository.getPasswordPolicyOverride(tenantId);
    return resolvePasswordPolicy(override);
  }

  async getPasswordPolicyOverride(tenantId: string): Promise<Partial<PasswordPolicy> | null> {
    return this.repository.getPasswordPolicyOverride(tenantId);
  }

  async updatePasswordPolicy(tenantId: string, input: UpdatePasswordPolicyInput, actorUserId: string): Promise<void> {
    await this.repository.updatePasswordPolicyOverride(tenantId, input, actorUserId);
  }
}
