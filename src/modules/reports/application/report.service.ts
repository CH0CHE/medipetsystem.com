import type { IReportRepository } from "../domain/repositories";
import type {
  ActiveVeterinarianRow,
  ConsultationRow,
  InventoryReportRow,
  OverdueClientRow,
  ProfitabilityRow,
  SalesReportResult,
} from "../domain/entities";
import type { DateRangeQuery } from "./dto/date-range.schema";

const DEFAULT_RANGE_DAYS = 30;

function resolveDateRange(query: DateRangeQuery, now: Date): { from: Date; to: Date } {
  const to = query.to ? new Date(query.to) : now;
  const from = query.from ? new Date(query.from) : new Date(to.getTime() - (DEFAULT_RANGE_DAYS - 1) * 24 * 60 * 60 * 1000);
  return { from, to };
}

export class ReportService {
  constructor(private readonly repository: IReportRepository) {}

  async getSales(tenantId: string, query: DateRangeQuery, now = new Date()): Promise<SalesReportResult> {
    const { from, to } = resolveDateRange(query, now);
    return this.repository.getSales(tenantId, from, to);
  }

  async getInventory(tenantId: string): Promise<InventoryReportRow[]> {
    return this.repository.getInventory(tenantId);
  }

  async getOverdueClients(tenantId: string): Promise<OverdueClientRow[]> {
    return this.repository.getOverdueClients(tenantId);
  }

  async getConsultations(tenantId: string, query: DateRangeQuery, now = new Date()): Promise<ConsultationRow[]> {
    const { from, to } = resolveDateRange(query, now);
    return this.repository.getConsultations(tenantId, from, to);
  }

  async getProfitability(tenantId: string, query: DateRangeQuery, now = new Date()): Promise<ProfitabilityRow[]> {
    const { from, to } = resolveDateRange(query, now);
    return this.repository.getProfitability(tenantId, from, to);
  }

  async getActiveVeterinarians(tenantId: string, query: DateRangeQuery, now = new Date()): Promise<ActiveVeterinarianRow[]> {
    const { from, to } = resolveDateRange(query, now);
    return this.repository.getActiveVeterinarians(tenantId, from, to);
  }
}
