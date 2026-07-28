import { z } from "zod";

export const dateRangeQuerySchema = z.object({
  from: z.string().trim().min(1).optional(),
  to: z.string().trim().min(1).optional(),
});

export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;
