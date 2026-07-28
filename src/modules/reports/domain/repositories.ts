import type {
  ActiveVeterinarianRow,
  ConsultationRow,
  InventoryReportRow,
  OverdueClientRow,
  ProfitabilityRow,
  SalesReportResult,
} from "./entities";

export interface IReportRepository {
  getSales(tenantId: string, from: Date, to: Date): Promise<SalesReportResult>;
  getInventory(tenantId: string): Promise<InventoryReportRow[]>;
  getOverdueClients(tenantId: string): Promise<OverdueClientRow[]>;
  getConsultations(tenantId: string, from: Date, to: Date): Promise<ConsultationRow[]>;
  getProfitability(tenantId: string, from: Date, to: Date): Promise<ProfitabilityRow[]>;
  getActiveVeterinarians(tenantId: string, from: Date, to: Date): Promise<ActiveVeterinarianRow[]>;
}
