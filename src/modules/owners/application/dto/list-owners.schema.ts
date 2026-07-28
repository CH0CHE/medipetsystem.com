import { z } from "zod";

export const listOwnersQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),
  financialStatus: z.enum(["SOLVENTE", "MOROSO", "SUSPENDIDO"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListOwnersQuery = z.infer<typeof listOwnersQuerySchema>;
