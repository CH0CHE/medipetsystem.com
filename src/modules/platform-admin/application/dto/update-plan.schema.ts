import { z } from "zod";

export const updatePlanSchema = z.object({
  plan: z.enum(["BASIC", "PRO", "ENTERPRISE"]),
});

export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
