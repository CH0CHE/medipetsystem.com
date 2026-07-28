import { describe, it, expect, vi } from "vitest";
import { MetricsService } from "./metrics.service";
import type { IMetricsRepository } from "../domain/repositories";

describe("MetricsService.getSaasMetrics", () => {
  it("delegates directly to the repository", async () => {
    const metrics = {
      totalTenants: 10,
      activeCount: 8,
      suspendedCount: 1,
      cancelledCount: 1,
      basicCount: 6,
      proCount: 3,
      enterpriseCount: 1,
      newThisMonth: 2,
      totalPendingSubscription: 500,
    };
    const repo: IMetricsRepository = { getSaasMetrics: vi.fn().mockResolvedValue(metrics) };
    const service = new MetricsService(repo);

    const result = await service.getSaasMetrics();

    expect(repo.getSaasMetrics).toHaveBeenCalledOnce();
    expect(result).toEqual(metrics);
  });
});
