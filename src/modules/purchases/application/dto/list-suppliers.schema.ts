import { z } from "zod";

export const listSuppliersQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListSuppliersQuery = z.infer<typeof listSuppliersQuerySchema>;
