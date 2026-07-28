import { describe, it, expect, vi } from "vitest";
import { QuoteService } from "./quote.service";
import type { IQuoteRepository } from "../domain/repositories";

function makeRepoMock(): IQuoteRepository {
  return {
    create: vi.fn().mockResolvedValue("quote-1"),
    list: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    get: vi.fn().mockResolvedValue(null),
  };
}

const TENANT_ID = "tenant-1";
const BRANCH_ID = "branch-1";
const ACTOR_ID = "actor-1";

describe("QuoteService.createQuote", () => {
  it("passes tenantId/branchId explicitly and forwards the line items untouched", async () => {
    const repo = makeRepoMock();
    const service = new QuoteService(repo);

    const items = [{ productId: "p-1", description: "Vacuna", quantity: 2, unitPrice: 50 }];

    await service.createQuote(
      TENANT_ID,
      BRANCH_ID,
      { ownerId: "owner-1", issueDate: "2026-01-15", expiryDate: "", items, notes: "" },
      ACTOR_ID,
    );

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: TENANT_ID, branchId: BRANCH_ID, ownerId: "owner-1", items, notes: null }),
    );
  });

  it("parses an empty expiryDate as null instead of an Invalid Date", async () => {
    const repo = makeRepoMock();
    const service = new QuoteService(repo);

    await service.createQuote(
      TENANT_ID,
      BRANCH_ID,
      { ownerId: "owner-1", issueDate: "2026-01-15", expiryDate: "", items: [{ productId: "p-1", description: "x", quantity: 1, unitPrice: 1 }] },
      ACTOR_ID,
    );

    const call = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.expiryDate).toBeNull();
  });
});

describe("QuoteService.listQuotes", () => {
  it("converts page/pageSize into limit/offset scoped to the tenant", async () => {
    const repo = makeRepoMock();
    const service = new QuoteService(repo);

    await service.listQuotes(TENANT_ID, { page: 3, pageSize: 10 });

    expect(repo.list).toHaveBeenCalledWith({ tenantId: TENANT_ID, ownerId: null, status: null, limit: 10, offset: 20 });
  });
});
