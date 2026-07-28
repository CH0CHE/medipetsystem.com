import { z } from "zod";

export const registerPaymentSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser mayor a cero."),
  method: z.string().trim().max(50).optional().or(z.literal("")),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});

export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>;
