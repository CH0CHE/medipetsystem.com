import type { IPlansRepository } from "../domain/repositories";
import type { MarketingPlan } from "../domain/entities";
import type { UpdateMarketingPlanInput } from "./dto/update-marketing-plan.schema";

export class PlansService {
  constructor(private readonly repository: IPlansRepository) {}

  async listPlans(): Promise<MarketingPlan[]> {
    return this.repository.list();
  }

  async updatePlan(id: string, input: UpdateMarketingPlanInput, actorUserId: string): Promise<void> {
    await this.repository.update({ id, ...input, actorUserId });
  }
}
