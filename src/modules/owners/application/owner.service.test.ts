import { describe, it, expect, vi } from "vitest";
import { OwnerService } from "./owner.service";
import type { IOwnerRepository } from "../domain/repositories";

function makeRepoMock(): IOwnerRepository {
  return {
    create: vi.fn().mockResolvedValue("owner-1"),
    list: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    get: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(undefined),
  };
}

const TENANT_ID = "tenant-1";

describe("OwnerService.createOwner", () => {
  it("passes the tenantId explicitly and normalizes empty optional fields to null", async () => {
    const repo = makeRepoMock();
    const service = new OwnerService(repo);

    await service.createOwner(
      TENANT_ID,
      { fullName: "Juan Pérez", documentId: "", phone: "", email: "", address: "", notes: "" },
      "actor-1",
    );

    expect(repo.create).toHaveBeenCalledWith({
      tenantId: TENANT_ID,
      fullName: "Juan Pérez",
      documentId: null,
      phone: null,
      email: null,
      address: null,
      notes: null,
      createdByUserId: "actor-1",
    });
  });

  it("keeps provided optional fields instead of nulling them", async () => {
    const repo = makeRepoMock();
    const service = new OwnerService(repo);

    await service.createOwner(
      TENANT_ID,
      { fullName: "Ana López", documentId: "1234-5678", phone: "5555-5555", email: "ana@example.com", address: "Zona 10", notes: "VIP" },
      "actor-1",
    );

    const call = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(call.documentId).toBe("1234-5678");
    expect(call.phone).toBe("5555-5555");
  });
});

describe("OwnerService.listOwners", () => {
  it("converts page/pageSize into limit/offset scoped to the tenant", async () => {
    const repo = makeRepoMock();
    const service = new OwnerService(repo);

    await service.listOwners(TENANT_ID, { page: 3, pageSize: 10 });

    expect(repo.list).toHaveBeenCalledWith({
      tenantId: TENANT_ID,
      search: null,
      financialStatus: null,
      limit: 10,
      offset: 20,
    });
  });
});

describe("OwnerService.updateOwner", () => {
  it("forwards the tenantId, ownerId and actorUserId to the repository", async () => {
    const repo = makeRepoMock();
    const service = new OwnerService(repo);

    await service.updateOwner(
      TENANT_ID,
      "owner-9",
      { fullName: "Juan Pérez", documentId: "", phone: "", email: "", address: "", notes: "", financialStatus: "MOROSO" },
      "actor-2",
    );

    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT_ID,
        ownerId: "owner-9",
        financialStatus: "MOROSO",
        actorUserId: "actor-2",
      }),
    );
  });
});
