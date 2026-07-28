import { prisma } from "@/lib/db/prisma";
import type { IPlansRepository } from "../domain/repositories";
import type { MarketingPlan, MarketingPlanKey } from "../domain/entities";

type PlanRow = {
  id: string;
  plan_key: MarketingPlanKey;
  name: string;
  price: unknown;
  billing_period: string;
  description: string;
  features: string[];
  highlighted: boolean;
  display_order: number;
  updated_at: Date;
};

function mapRow(row: PlanRow): MarketingPlan {
  return {
    id: row.id,
    planKey: row.plan_key,
    name: row.name,
    price: Number(row.price),
    billingPeriod: row.billing_period,
    description: row.description,
    features: row.features,
    highlighted: row.highlighted,
    displayOrder: row.display_order,
    updatedAt: row.updated_at,
  };
}

export const plansRepository: IPlansRepository = {
  async list() {
    const rows = await prisma.$queryRaw<PlanRow[]>`SELECT * FROM sp_list_marketing_plans()`;
    return rows.map(mapRow);
  },

  async update(input) {
    await prisma.$executeRaw`
      SELECT sp_update_marketing_plan(
        ${input.id}::uuid, ${input.name}, ${input.price}::numeric, ${input.billingPeriod}, ${input.description},
        ${input.features}::text[], ${input.highlighted}, ${input.actorUserId}::uuid
      )
    `;
  },
};
