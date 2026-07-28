import { describe, it, expect, vi } from "vitest";
import { TenantService } from "./tenant.service";
import type { ITenantRepository } from "../domain/repositories";

function makeRepoMock(): ITenantRepository {
  return {
    createTenant: vi.fn().mockImplementation(async (input) => ({
      tenantId: "tenant-1",
      tenantCode: "0000001",
      branchId: "branch-1",
      adminUserId: "admin-1",
      adminUsername: "0000001_ADMIN",
      connectorUserId: "connector-1",
      connectorUsername: "0000001_CONECTOR",
      __input: input,
    })),
    listTenants: vi.fn(),
    suspendTenant: vi.fn().mockResolvedValue(undefined),
    reactivateTenant: vi.fn().mockResolvedValue(undefined),
  } as unknown as ITenantRepository;
}

describe("TenantService.createTenant", () => {
  it("generates ADMIN/CONECTOR usernames matching the tenant code convention", async () => {
    const repo = makeRepoMock();
    const service = new TenantService(repo);

    const result = await service.createTenant(
      { clinicName: "Clínica ABC", branchName: "Central", plan: "BASIC" },
      "creator-user-id",
    );

    expect(result.adminUsername).toBe("0000001_ADMIN");
    expect(result.connectorUsername).toBe("0000001_CONECTOR");
  });

  it("hashes admin and connector passwords with distinct salts before calling the repository", async () => {
    const repo = makeRepoMock();
    const service = new TenantService(repo);

    await service.createTenant({ clinicName: "Clínica ABC", branchName: "Central", plan: "BASIC" }, "creator-1");

    expect(repo.createTenant).toHaveBeenCalledOnce();
    const call = (repo.createTenant as ReturnType<typeof vi.fn>).mock.calls[0][0];

    expect(call.adminPasswordHash).toBeTruthy();
    expect(call.connectorPasswordHash).toBeTruthy();
    expect(call.adminPasswordHash).not.toEqual(call.connectorPasswordHash);
    expect(call.adminPasswordSalt).not.toEqual(call.connectorPasswordSalt);
    expect(call.createdByUserId).toBe("creator-1");
  });

  it("returns the plaintext temporary passwords exactly once, never persisting them", async () => {
    const repo = makeRepoMock();
    const service = new TenantService(repo);

    const result = await service.createTenant(
      { clinicName: "Clínica ABC", branchName: "Central", plan: "PRO" },
      "creator-1",
    );

    expect(result.adminTemporaryPassword).toBeTruthy();
    expect(result.connectorTemporaryPassword).toBeTruthy();
    expect(result.adminTemporaryPassword).not.toEqual(result.connectorTemporaryPassword);

    // Ninguna de las dos contraseñas en texto plano debe llegar al repositorio.
    const call = (repo.createTenant as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(JSON.stringify(call)).not.toContain(result.adminTemporaryPassword);
    expect(JSON.stringify(call)).not.toContain(result.connectorTemporaryPassword);
  });

  it("delegates suspend/reactivate to the repository with the actor and reason", async () => {
    const repo = makeRepoMock();
    const service = new TenantService(repo);

    await service.suspendTenant("tenant-1", "actor-1", "Falta de pago");
    expect(repo.suspendTenant).toHaveBeenCalledWith("tenant-1", "actor-1", "Falta de pago");

    await service.reactivateTenant("tenant-1", "actor-1");
    expect(repo.reactivateTenant).toHaveBeenCalledWith("tenant-1", "actor-1");
  });
});
