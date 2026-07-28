import { z } from "zod";

export const listTenantsQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "CANCELADA"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListTenantsQuery = z.infer<typeof listTenantsQuerySchema>;
