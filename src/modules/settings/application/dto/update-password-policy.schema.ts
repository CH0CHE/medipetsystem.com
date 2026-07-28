import { z } from "zod";

export const updatePasswordPolicySchema = z.object({
  minLength: z.coerce.number().int().min(6, "El mínimo permitido es 6 caracteres.").max(128).optional(),
  requireUppercase: z.boolean().optional(),
  requireLowercase: z.boolean().optional(),
  requireNumber: z.boolean().optional(),
  requireSymbol: z.boolean().optional(),
});

export type UpdatePasswordPolicyInput = z.infer<typeof updatePasswordPolicySchema>;
