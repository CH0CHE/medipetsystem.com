import { prisma } from "@/lib/db/prisma";

export interface WriteAuditLogInput {
  tenantId: string | null;
  userId: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  targetUsername?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Toda escritura de auditoría de este repositorio pasa por `sp_write_audit_log`.
 * Las stored procedures de negocio (login, tenants, tokens) escriben su propia fila
 * de auditoría atómicamente; este método cubre casos genéricos como denegaciones
 * de permisos.
 */
export const auditRepository = {
  async write(input: WriteAuditLogInput): Promise<string> {
    const rows = await prisma.$queryRaw<{ sp_write_audit_log: string }[]>`
      SELECT sp_write_audit_log(
        ${input.tenantId}::uuid,
        ${input.userId}::uuid,
        ${input.action},
        ${input.entityType ?? null},
        ${input.entityId ?? null},
        ${input.targetUsername ?? null},
        ${input.metadata ? JSON.stringify(input.metadata) : null}::jsonb,
        ${input.ipAddress ?? null},
        ${input.userAgent ?? null}
      ) as sp_write_audit_log
    `;
    return rows[0]!.sp_write_audit_log;
  },
};
