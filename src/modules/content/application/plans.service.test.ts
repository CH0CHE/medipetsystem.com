import { describe, it, expect, vi } from "vitest";
import { PlansService } from "./plans.service";
import type { IPlansRepository } from "../domain/repositories";

function makeRepoMock(): IPlansRepository {
  return {
    list: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(undefined),
  };
}

describe("PlansService.listPlans", () => {
  it("delegates to the repository", async () => {
    const repo = makeRepoMock();
    const service = new PlansService(repo);

    await service.listPlans();

    expect(repo.list).toHaveBeenCalled();
  });
});

describe("PlansService.updatePlan", () => {
  it("forwards the plan id, input fields and actorUserId to the repository", async () => {
    const repo = makeRepoMock();
    const service = new PlansService(repo);

    await service.updatePlan(
      "plan-1",
      {
        name: "Pro",
        price: 599,
        billingPeriod: "mensual",
        description: "Para clínicas en crecimiento",
        features: ["Multi sucursal", "Reportes avanzados"],
        highlighted: true,
      },
      "actor-1",
    );

    expect(repo.update).toHaveBeenCalledWith({
      id: "plan-1",
      name: "Pro",
      price: 599,
      billingPeriod: "mensual",
      description: "Para clínicas en crecimiento",
      features: ["Multi sucursal", "Reportes avanzados"],
      highlighted: true,
      actorUserId: "actor-1",
    });
  });
});
