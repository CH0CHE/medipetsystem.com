import { describe, it, expect, vi } from "vitest";
import { BillingService } from "./billing.service";
import type { IBillingRepository } from "../domain/repositories";

function makeRepoMock(): IBillingRepository {
  return {
    createInvoice: vi.fn().mockResolvedValue("invoice-1"),
    listInvoices: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    markInvoicePaid: vi.fn().mockResolvedValue(undefined),
  };
}

describe("BillingService.createInvoice", () => {
  it("forwards tenantId, period, amount and actor to the repository", async () => {
    const repo = makeRepoMock();
    const service = new BillingService(repo);

    await service.createInvoice("tenant-1", { period: "2026-08", amount: 199 }, "actor-1");

    expect(repo.createInvoice).toHaveBeenCalledWith("tenant-1", "2026-08", 199, "actor-1");
  });
});

describe("BillingService.listInvoices", () => {
  it("converts page/pageSize into limit/offset", async () => {
    const repo = makeRepoMock();
    const service = new BillingService(repo);

    await service.listInvoices({ page: 2, pageSize: 10 });

    expect(repo.listInvoices).toHaveBeenCalledWith({ tenantId: null, status: null, limit: 10, offset: 10 });
  });
});

describe("BillingService.markInvoicePaid", () => {
  it("delegates to the repository (which enforces the not-already-paid rule)", async () => {
    const repo = makeRepoMock();
    const service = new BillingService(repo);

    await service.markInvoicePaid("invoice-1", "actor-1");

    expect(repo.markInvoicePaid).toHaveBeenCalledWith("invoice-1", "actor-1");
  });
});
