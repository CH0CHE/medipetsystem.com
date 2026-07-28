import { z } from "zod";

export const suspendTenantSchema = z.object({
  reason: z.string().trim().min(3, "Indica un motivo.").max(300),
});

export type SuspendTenantInput = z.infer<typeof suspendTenantSchema>;
