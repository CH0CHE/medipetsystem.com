import { describe, it, expect, vi } from "vitest";
import { SupplierService } from "./supplier.service";
import type { ISupplierRepository } from "../domain/repositories";

function makeRepoMock(): ISupplierRepository {
  return {
    create: vi.fn().mockResolvedValue("supplier-1"),
    list: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    get: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(undefined),
  };
}

const TENANT_ID = "tenant-1";
const ACTOR_ID = "actor-1";

describe("SupplierService.createSupplier", () => {
  it("normalizes empty optional fields to null", async () => {
    const repo = makeRepoMock();
    const service = new SupplierService(repo);

    await service.createSupplier(TENANT_ID, { name: "Distribuidora Vet", taxId: "", phone: "", email: "", address: "", notes: "" }, ACTOR_ID);

    expect(repo.create).toHaveBeenCalledWith({
      tenantId: TENANT_ID,
      name: "Distribuidora Vet",
      taxId: null,
      phone: null,
      email: null,
      address: null,
      notes: null,
      actorUserId: ACTOR_ID,
    });
  });
});

describe("SupplierService.listSuppliers", () => {
  it("converts page/pageSize into limit/offset", async () => {
    const repo = makeRepoMock();
    const service = new SupplierService(repo);

    await service.listSuppliers(TENANT_ID, { page: 3, pageSize: 10 });

    expect(repo.list).toHaveBeenCalledWith({ tenantId: TENANT_ID, search: null, limit: 10, offset: 20 });
  });
});
