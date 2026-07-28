import type { IAuditRepository } from "../domain/repositories";
import type { AuditLogListResult, SupportAccountRow } from "../domain/entities";
import type { ListAuditLogsQuery } from "./dto/list-audit-logs.schema";

const DEFAULT_RANGE_DAYS = 30;

function resolveDateRange(query: ListAuditLogsQuery, now: Date): { from: Date; to: Date } {
  const to = query.to ? new Date(query.to) : now;
  const from = query.from ? new Date(query.from) : new Date(to.getTime() - (DEFAULT_RANGE_DAYS - 1) * 24 * 60 * 60 * 1000);
  return { from, to };
}

export class AuditService {
  constructor(private readonly repository: IAuditRepository) {}

  async listAuditLogs(query: ListAuditLogsQuery, now = new Date()): Promise<AuditLogListResult> {
    const { from, to } = resolveDateRange(query, now);
    return this.repository.listAuditLogs({
      tenantId: query.tenantId ?? null,
      action: query.action ?? null,
      from,
      to,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
  }

  async listSupportAccounts(): Promise<SupportAccountRow[]> {
    return this.repository.listSupportAccounts();
  }
}
