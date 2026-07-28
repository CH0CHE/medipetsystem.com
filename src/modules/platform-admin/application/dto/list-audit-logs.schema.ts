import { z } from "zod";

export const listAuditLogsQuerySchema = z.object({
  tenantId: z.string().uuid().optional(),
  action: z.string().trim().max(100).optional(),
  from: z.string().trim().min(1).optional(),
  to: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
