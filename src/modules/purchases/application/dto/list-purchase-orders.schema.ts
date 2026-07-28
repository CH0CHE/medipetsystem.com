import { z } from "zod";

export const listPurchaseOrdersQuerySchema = z.object({
  supplierId: z.string().uuid().optional(),
  status: z.enum(["PENDIENTE", "RECIBIDA_PARCIAL", "RECIBIDA", "CANCELADA"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListPurchaseOrdersQuery = z.infer<typeof listPurchaseOrdersQuerySchema>;
