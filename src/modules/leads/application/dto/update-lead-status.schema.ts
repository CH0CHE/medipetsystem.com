import { z } from "zod";

export const updateLeadStatusSchema = z.object({
  status: z.enum(["NUEVO", "CONTACTADO", "CONVERTIDO", "DESCARTADO"]),
});

export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;
