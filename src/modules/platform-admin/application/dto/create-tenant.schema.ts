import { z } from "zod";

export const createTenantSchema = z.object({
  clinicName: z.string().trim().min(2, "El nombre de la clínica es muy corto.").max(150),
  branchName: z.string().trim().min(2, "El nombre de la sucursal es muy corto.").max(150),
  plan: z.enum(["BASIC", "PRO", "ENTERPRISE"]),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
