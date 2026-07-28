import { z } from "zod";

export const createAdjustmentSchema = z.object({
  type: z.enum(["CREDITO", "DEBITO"]),
  amount: z.coerce.number().positive("El monto debe ser mayor a cero."),
  reason: z.string().trim().min(1, "El motivo es requerido.").max(300),
});

export type CreateAdjustmentInput = z.infer<typeof createAdjustmentSchema>;
