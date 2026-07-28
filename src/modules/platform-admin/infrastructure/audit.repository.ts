import { prisma } from "@/lib/db/prisma";
import type { IAuditRepository } from "../domain/repositories";
import type { AuditLogEntry, SupportAccountRow, UserAccountStatus } from "../domain/entities";

type LogRow = {
  log_id: string;
  tenant_name: string | null;
  username: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: Date;
  total_count: bigint;
};

type SupportRow = {
  tenant_id: string;
  tenant_name: string;
  connector_username: string;
  connector_status: UserAccountStatus;
  connector_last_login: Date | null;
};

export const auditRepository: IAuditRepository = {
  async listAuditLogs({ tenantId, action, from, to, limit, offset }) {
    const rows = await prisma.$queryRaw<LogRow[]>`
      SELECT * FROM sp_list_audit_logs(
        ${tenantId}::uuid, ${action}, ${from}::date, ${to}::date, ${limit}::int, ${offset}::int
      )
    `;

    const items: AuditLogEntry[] = rows.map((row) => ({
      logId: row.log_id,
      tenantName: row.tenant_name,
      username: row.username,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      createdAt: row.created_at,
    }));

    return { items, totalCount: rows.length > 0 ? Number(rows[0]!.total_count) : 0 };
  },

  async listSupportAccounts() {
    const rows = await prisma.$queryRaw<SupportRow[]>`SELECT * FROM sp_list_support_accounts()`;
    const items: SupportAccountRow[] = rows.map((row) => ({
      tenantId: row.tenant_id,
      tenantName: row.tenant_name,
      connectorUsername: row.connector_username,
      connectorStatus: row.connector_status,
      connectorLastLogin: row.connector_last_login,
    }));
    return items;
  },
};
