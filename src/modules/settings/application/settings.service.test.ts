import { describe, it, expect, vi } from "vitest";
import { SettingsService } from "./settings.service";
import type { ISettingsRepository } from "../domain/repositories";
import { DEFAULT_PASSWORD_POLICY } from "@/lib/security/password-policy";

function makeRepoMock(): ISettingsRepository {
  return {
    getPasswordPolicyOverride: vi.fn().mockResolvedValue(null),
    updatePasswordPolicyOverride: vi.fn().mockResolvedValue(undefined),
  };
}

const TENANT_ID = "tenant-1";
const ACTOR_ID = "actor-1";

describe("SettingsService.getEffectivePasswordPolicy", () => {
  it("returns the application default when the tenant has no override", async () => {
    const repo = makeRepoMock();
    const service = new SettingsService(repo);

    const policy = await service.getEffectivePasswordPolicy(TENANT_ID);

    expect(policy).toEqual(DEFAULT_PASSWORD_POLICY);
  });

  it("merges a stored tenant override on top of the default", async () => {
    const repo = makeRepoMock();
    repo.getPasswordPolicyOverride = vi.fn().mockResolvedValue({ minLength: 6, requireSymbol: false });
    const service = new SettingsService(repo);

    const policy = await service.getEffectivePasswordPolicy(TENANT_ID);

    expect(policy.minLength).toBe(6);
    expect(policy.requireSymbol).toBe(false);
    expect(policy.requireUppercase).toBe(DEFAULT_PASSWORD_POLICY.requireUppercase);
  });
});

describe("SettingsService.updatePasswordPolicy", () => {
  it("delegates to the repository with tenantId, input and actor", async () => {
    const repo = makeRepoMock();
    const service = new SettingsService(repo);

    await service.updatePasswordPolicy(TENANT_ID, { minLength: 8 }, ACTOR_ID);

    expect(repo.updatePasswordPolicyOverride).toHaveBeenCalledWith(TENANT_ID, { minLength: 8 }, ACTOR_ID);
  });
});
