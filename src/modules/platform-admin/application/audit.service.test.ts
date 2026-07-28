import { describe, it, expect, vi } from "vitest";
import { AuditService } from "./audit.service";
import type { IAuditRepository } from "../domain/repositories";

function makeRepoMock(): IAuditRepository {
  return {
    listAuditLogs: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    listSupportAccounts: vi.fn().mockResolvedValue([]),
  };
}

const NOW = new Date("2026-07-28T12:00:00.000Z");

describe("AuditService.listAuditLogs default date range", () => {
  it("defaults to the last 30 days (inclusive) ending now when no from/to given", async () => {
    const repo = makeRepoMock();
    const service = new AuditService(repo);

    await service.listAuditLogs({ page: 1, pageSize: 20 }, NOW);

    expect(repo.listAuditLogs).toHaveBeenCalledWith({
      tenantId: null,
      action: null,
      from: new Date("2026-06-29T12:00:00.000Z"),
      to: NOW,
      limit: 20,
      offset: 0,
    });
  });

  it("passes an explicit range and filters through untouched", async () => {
    const repo = makeRepoMock();
    const service = new AuditService(repo);

    await service.listAuditLogs(
      { tenantId: "tenant-1", action: "TENANT_CANCELLED", from: "2026-01-01", to: "2026-01-31", page: 1, pageSize: 20 },
      NOW,
    );

    expect(repo.listAuditLogs).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      action: "TENANT_CANCELLED",
      from: new Date("2026-01-01"),
      to: new Date("2026-01-31"),
      limit: 20,
      offset: 0,
    });
  });
});

describe("AuditService.listSupportAccounts", () => {
  it("delegates directly to the repository", async () => {
    const repo = makeRepoMock();
    const service = new AuditService(repo);

    await service.listSupportAccounts();

    expect(repo.listSupportAccounts).toHaveBeenCalledOnce();
  });
});
