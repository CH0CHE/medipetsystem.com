import { describe, it, expect, vi } from "vitest";
import { ProductService } from "./product.service";
import type { IProductRepository } from "../domain/repositories";

function makeRepoMock(): IProductRepository {
  return {
    create: vi.fn().mockResolvedValue("product-1"),
    list: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    get: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(undefined),
    registerEntrada: vi.fn().mockResolvedValue("movement-1"),
    registerSalida: vi.fn().mockResolvedValue("movement-2"),
    registerAjuste: vi.fn().mockResolvedValue("movement-3"),
    registerTransferencia: vi.fn().mockResolvedValue("movement-4"),
    listMovements: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    listExpiringBatches: vi.fn().mockResolvedValue([]),
  };
}

const TENANT_ID = "tenant-1";
const PRODUCT_ID = "product-1";
const ACTOR_ID = "actor-1";

describe("ProductService.createProduct", () => {
  it("passes tenantId/actorUserId explicitly and normalizes empty optional fields to null", async () => {
    const repo = makeRepoMock();
    const service = new ProductService(repo);

    await service.createProduct(
      TENANT_ID,
      { sku: "MED-001", internalCode: "", name: "Amoxicilina", category: "", costPrice: 10, salePrice: 20, minStock: 5 },
      ACTOR_ID,
    );

    expect(repo.create).toHaveBeenCalledWith({
      tenantId: TENANT_ID,
      sku: "MED-001",
      internalCode: null,
      name: "Amoxicilina",
      category: null,
      costPrice: 10,
      salePrice: 20,
      minStock: 5,
      actorUserId: ACTOR_ID,
    });
  });
});

describe("ProductService.registerMovement", () => {
  it("routes ENTRADA to registerEntrada with the productId from the caller", async () => {
    const repo = makeRepoMock();
    const service = new ProductService(repo);

    const BRANCH_ID = "branch-1";
    await service.registerMovement(
      TENANT_ID,
      PRODUCT_ID,
      BRANCH_ID,
      { type: "ENTRADA", batchNumber: "L001", expirationDate: "2027-01-01", quantity: 100 },
      ACTOR_ID,
    );

    expect(repo.registerEntrada).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: TENANT_ID, productId: PRODUCT_ID, branchId: BRANCH_ID, batchNumber: "L001", quantity: 100 }),
    );
    expect(repo.registerSalida).not.toHaveBeenCalled();
  });

  it("routes SALIDA to registerSalida with the batchId, ignoring productId", async () => {
    const repo = makeRepoMock();
    const service = new ProductService(repo);

    await service.registerMovement(TENANT_ID, PRODUCT_ID, "branch-1", { type: "SALIDA", batchId: "batch-9", quantity: 5 }, ACTOR_ID);

    expect(repo.registerSalida).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: TENANT_ID, batchId: "batch-9", quantity: 5, actorUserId: ACTOR_ID }),
    );
  });

  it("routes AJUSTE to registerAjuste with the absolute newQuantity", async () => {
    const repo = makeRepoMock();
    const service = new ProductService(repo);

    await service.registerMovement(TENANT_ID, PRODUCT_ID, "branch-1", { type: "AJUSTE", batchId: "batch-9", newQuantity: 42 }, ACTOR_ID);

    expect(repo.registerAjuste).toHaveBeenCalledWith(
      expect.objectContaining({ batchId: "batch-9", newQuantity: 42 }),
    );
  });

  it("routes TRANSFERENCIA to registerTransferencia with the target branch", async () => {
    const repo = makeRepoMock();
    const service = new ProductService(repo);

    await service.registerMovement(
      TENANT_ID,
      PRODUCT_ID,
      "branch-1",
      { type: "TRANSFERENCIA", batchId: "batch-9", targetBranchId: "branch-2", quantity: 10 },
      ACTOR_ID,
    );

    expect(repo.registerTransferencia).toHaveBeenCalledWith(
      expect.objectContaining({ batchId: "batch-9", targetBranchId: "branch-2", quantity: 10 }),
    );
  });
});

describe("ProductService.listProducts", () => {
  it("converts page/pageSize into limit/offset scoped to the tenant", async () => {
    const repo = makeRepoMock();
    const service = new ProductService(repo);

    await service.listProducts(TENANT_ID, { lowStockOnly: true, page: 2, pageSize: 10 });

    expect(repo.list).toHaveBeenCalledWith({
      tenantId: TENANT_ID,
      search: null,
      category: null,
      lowStockOnly: true,
      limit: 10,
      offset: 10,
    });
  });
});
