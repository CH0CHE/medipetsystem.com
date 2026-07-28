import { z } from "zod";

export const listQuotesQuerySchema = z.object({
  ownerId: z.string().uuid().optional(),
  status: z.enum(["BORRADOR", "EMITIDA", "ANULADA"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListQuotesQuery = z.infer<typeof listQuotesQuerySchema>;
