import { describe, it, expect, vi } from "vitest";
import { PurchaseOrderService } from "./purchase-order.service";
import type { IPurchaseOrderRepository } from "../domain/repositories";

function makeRepoMock(): IPurchaseOrderRepository {
  return {
    create: vi.fn().mockResolvedValue("order-1"),
    list: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    get: vi.fn().mockResolvedValue(null),
    receive: vi.fn().mockResolvedValue(undefined),
    cancel: vi.fn().mockResolvedValue(undefined),
  };
}

const TENANT_ID = "tenant-1";
const BRANCH_ID = "branch-1";
const ACTOR_ID = "actor-1";

describe("PurchaseOrderService.createPurchaseOrder", () => {
  it("passes the branchId from the caller, never from the request body", async () => {
    const repo = makeRepoMock();
    const service = new PurchaseOrderService(repo);

    const items = [{ productId: "p-1", description: "Vacuna", quantityOrdered: 20, unitCost: 15 }];

    await service.createPurchaseOrder(
      TENANT_ID,
      BRANCH_ID,
      { supplierId: "supplier-1", orderDate: "2026-01-15", items, notes: "" },
      ACTOR_ID,
    );

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: TENANT_ID, branchId: BRANCH_ID, supplierId: "supplier-1", items }),
    );
  });
});

describe("PurchaseOrderService.receivePurchaseOrder", () => {
  it("forwards receiving lines with parsed expiration dates", async () => {
    const repo = makeRepoMock();
    const service = new PurchaseOrderService(repo);

    await service.receivePurchaseOrder(
      TENANT_ID,
      "order-1",
      { items: [{ purchaseOrderItemId: "item-1", quantityReceived: 5, batchNumber: "LOTE-1", expirationDate: "2027-01-01" }] },
      ACTOR_ID,
    );

    expect(repo.receive).toHaveBeenCalledWith(
      TENANT_ID,
      "order-1",
      [{ purchaseOrderItemId: "item-1", quantityReceived: 5, batchNumber: "LOTE-1", expirationDate: new Date("2027-01-01") }],
      ACTOR_ID,
    );
  });

  it("delegates over-receive rejection to the repository (stored procedure enforces the business rule)", async () => {
    const repo = makeRepoMock();
    repo.receive = vi.fn().mockRejectedValue(new Error("No se puede recibir más de lo ordenado"));
    const service = new PurchaseOrderService(repo);

    await expect(
      service.receivePurchaseOrder(
        TENANT_ID,
        "order-1",
        { items: [{ purchaseOrderItemId: "item-1", quantityReceived: 999, batchNumber: "LOTE-1", expirationDate: "" }] },
        ACTOR_ID,
      ),
    ).rejects.toThrow("No se puede recibir más de lo ordenado");
  });
});

describe("PurchaseOrderService.cancelPurchaseOrder", () => {
  it("delegates to the repository with tenantId, purchaseOrderId and actorUserId", async () => {
    const repo = makeRepoMock();
    const service = new PurchaseOrderService(repo);

    await service.cancelPurchaseOrder(TENANT_ID, "order-1", ACTOR_ID);

    expect(repo.cancel).toHaveBeenCalledWith(TENANT_ID, "order-1", ACTOR_ID);
  });
});
