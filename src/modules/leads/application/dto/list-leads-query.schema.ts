import { z } from "zod";

export const listLeadsQuerySchema = z.object({
  status: z.enum(["NUEVO", "CONTACTADO", "CONVERTIDO", "DESCARTADO"]).optional(),
  source: z.enum(["CONTACTO", "DEMO"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
