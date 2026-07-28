import { describe, it, expect, vi } from "vitest";
import { InvoiceService } from "./invoice.service";
import type { IInvoiceRepository } from "../domain/repositories";

function makeRepoMock(): IInvoiceRepository {
  return {
    create: vi.fn().mockResolvedValue("invoice-1"),
    list: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    get: vi.fn().mockResolvedValue(null),
    createAdjustmentNote: vi.fn().mockResolvedValue("note-1"),
    registerPayment: vi.fn().mockResolvedValue("payment-1"),
    getAccountStatement: vi.fn().mockResolvedValue({ items: [], totalPending: 0 }),
  };
}

const TENANT_ID = "tenant-1";
const BRANCH_ID = "branch-1";
const ACTOR_ID = "actor-1";

describe("InvoiceService.createInvoice", () => {
  it("passes the branchId from the caller, never from the request body", async () => {
    const repo = makeRepoMock();
    const service = new InvoiceService(repo);

    const items = [{ productId: "p-1", description: "Amoxicilina", quantity: 3, unitPrice: 20 }];

    await service.createInvoice(TENANT_ID, BRANCH_ID, { ownerId: "owner-1", issueDate: "2026-01-15", items, notes: "" }, ACTOR_ID);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: TENANT_ID, branchId: BRANCH_ID, ownerId: "owner-1", items }),
    );
  });
});

describe("InvoiceService.registerPayment", () => {
  it("forwards amount/method/notes and normalizes empty strings to null", async () => {
    const repo = makeRepoMock();
    const service = new InvoiceService(repo);

    await service.registerPayment(TENANT_ID, "invoice-1", { amount: 50, method: "", notes: "" }, ACTOR_ID);

    expect(repo.registerPayment).toHaveBeenCalledWith({
      tenantId: TENANT_ID,
      invoiceId: "invoice-1",
      amount: 50,
      method: null,
      notes: null,
      actorUserId: ACTOR_ID,
    });
  });
});

describe("InvoiceService.createAdjustmentNote", () => {
  it("forwards the adjustment type and amount to the repository", async () => {
    const repo = makeRepoMock();
    const service = new InvoiceService(repo);

    await service.createAdjustmentNote(TENANT_ID, "invoice-1", { type: "CREDITO", amount: 15, reason: "Descuento" }, ACTOR_ID);

    expect(repo.createAdjustmentNote).toHaveBeenCalledWith({
      tenantId: TENANT_ID,
      invoiceId: "invoice-1",
      type: "CREDITO",
      amount: 15,
      reason: "Descuento",
      actorUserId: ACTOR_ID,
    });
  });
});

describe("InvoiceService.getAccountStatement", () => {
  it("delegates to the repository with tenantId and ownerId", async () => {
    const repo = makeRepoMock();
    const service = new InvoiceService(repo);

    await service.getAccountStatement(TENANT_ID, "owner-1");

    expect(repo.getAccountStatement).toHaveBeenCalledWith(TENANT_ID, "owner-1");
  });
});
