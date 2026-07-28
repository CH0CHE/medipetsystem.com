import { z } from "zod";

export const listProductsQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),
  category: z.string().trim().max(100).optional(),
  lowStockOnly: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
