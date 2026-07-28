import { z } from "zod";

export const updateMarketingPlanSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido.").max(80),
  price: z.coerce.number().min(0, "El precio no puede ser negativo.").max(1000000),
  billingPeriod: z.string().trim().min(1, "El periodo de facturación es requerido.").max(30),
  description: z.string().trim().min(1, "La descripción es requerida.").max(300),
  features: z.array(z.string().trim().min(1).max(150)).min(1, "Agrega al menos una característica.").max(20),
  highlighted: z.boolean(),
});

export type UpdateMarketingPlanInput = z.infer<typeof updateMarketingPlanSchema>;
