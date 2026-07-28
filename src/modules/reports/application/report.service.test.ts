import { describe, it, expect, vi } from "vitest";
import { ReportService } from "./report.service";
import type { IReportRepository } from "../domain/repositories";

function makeRepoMock(): IReportRepository {
  return {
    getSales: vi.fn().mockResolvedValue({ items: [], totalSales: 0 }),
    getInventory: vi.fn().mockResolvedValue([]),
    getOverdueClients: vi.fn().mockResolvedValue([]),
    getConsultations: vi.fn().mockResolvedValue([]),
    getProfitability: vi.fn().mockResolvedValue([]),
    getActiveVeterinarians: vi.fn().mockResolvedValue([]),
  };
}

const TENANT_ID = "tenant-1";
const NOW = new Date("2026-07-28T12:00:00.000Z");

describe("ReportService default date range", () => {
  it("defaults to the last 30 days (inclusive) ending now when no from/to given", async () => {
    const repo = makeRepoMock();
    const service = new ReportService(repo);

    await service.getSales(TENANT_ID, {}, NOW);

    expect(repo.getSales).toHaveBeenCalledWith(TENANT_ID, new Date("2026-06-29T12:00:00.000Z"), NOW);
  });

  it("uses an explicit range untouched when both from and to are given", async () => {
    const repo = makeRepoMock();
    const service = new ReportService(repo);

    await service.getConsultations(TENANT_ID, { from: "2026-01-01", to: "2026-01-31" }, NOW);

    expect(repo.getConsultations).toHaveBeenCalledWith(TENANT_ID, new Date("2026-01-01"), new Date("2026-01-31"));
  });

  it("defaults only the missing side when only one of from/to is given", async () => {
    const repo = makeRepoMock();
    const service = new ReportService(repo);

    await service.getProfitability(TENANT_ID, { from: "2026-07-01" }, NOW);

    expect(repo.getProfitability).toHaveBeenCalledWith(TENANT_ID, new Date("2026-07-01"), NOW);
  });
});

describe("ReportService pass-through reports (no date range)", () => {
  it("getInventory delegates directly to the repository", async () => {
    const repo = makeRepoMock();
    const service = new ReportService(repo);

    await service.getInventory(TENANT_ID);

    expect(repo.getInventory).toHaveBeenCalledWith(TENANT_ID);
  });

  it("getOverdueClients delegates directly to the repository", async () => {
    const repo = makeRepoMock();
    const service = new ReportService(repo);

    await service.getOverdueClients(TENANT_ID);

    expect(repo.getOverdueClients).toHaveBeenCalledWith(TENANT_ID);
  });
});
