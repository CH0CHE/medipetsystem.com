import { prisma } from "@/lib/db/prisma";
import type { IReportRepository } from "../domain/repositories";
import type {
  ActiveVeterinarianRow,
  ConsultationRow,
  InventoryReportRow,
  OverdueClientRow,
  ProfitabilityRow,
} from "../domain/entities";

type SalesRow = { invoice_number: string; owner_name: string; issue_date: Date; total: unknown; total_sales: unknown };
type InventoryRow = { sku: string; name: string; total_stock: unknown; cost_price: unknown; sale_price: unknown; stock_value: unknown };
type OverdueRow = { owner_name: string; phone: string | null; invoice_count: bigint; total_pending: unknown };
type ConsultationDbRow = { entry_date: Date; pet_name: string; owner_name: string; veterinarian_name: string; diagnosis: string | null };
type ProfitabilityDbRow = { product_name: string; quantity_sold: unknown; revenue: unknown; cost: unknown; profit: unknown };
type ActiveVeterinarianDbRow = { veterinarian_name: string; entry_count: bigint };

export const reportRepository: IReportRepository = {
  async getSales(tenantId, from, to) {
    const rows = await prisma.$queryRaw<SalesRow[]>`
      SELECT * FROM sp_report_sales(${tenantId}::uuid, ${from}::date, ${to}::date)
    `;
    return {
      items: rows.map((row) => ({
        invoiceNumber: row.invoice_number,
        ownerName: row.owner_name,
        issueDate: row.issue_date,
        total: Number(row.total),
      })),
      totalSales: rows.length > 0 ? Number(rows[0]!.total_sales) : 0,
    };
  },

  async getInventory(tenantId) {
    const rows = await prisma.$queryRaw<InventoryRow[]>`
      SELECT * FROM sp_report_inventory(${tenantId}::uuid)
    `;
    const items: InventoryReportRow[] = rows.map((row) => ({
      sku: row.sku,
      name: row.name,
      totalStock: Number(row.total_stock),
      costPrice: Number(row.cost_price),
      salePrice: Number(row.sale_price),
      stockValue: Number(row.stock_value),
    }));
    return items;
  },

  async getOverdueClients(tenantId) {
    const rows = await prisma.$queryRaw<OverdueRow[]>`
      SELECT * FROM sp_report_overdue_clients(${tenantId}::uuid)
    `;
    const items: OverdueClientRow[] = rows.map((row) => ({
      ownerName: row.owner_name,
      phone: row.phone,
      invoiceCount: Number(row.invoice_count),
      totalPending: Number(row.total_pending),
    }));
    return items;
  },

  async getConsultations(tenantId, from, to) {
    const rows = await prisma.$queryRaw<ConsultationDbRow[]>`
      SELECT * FROM sp_report_consultations(${tenantId}::uuid, ${from}::date, ${to}::date)
    `;
    const items: ConsultationRow[] = rows.map((row) => ({
      entryDate: row.entry_date,
      petName: row.pet_name,
      ownerName: row.owner_name,
      veterinarianName: row.veterinarian_name,
      diagnosis: row.diagnosis,
    }));
    return items;
  },

  async getProfitability(tenantId, from, to) {
    const rows = await prisma.$queryRaw<ProfitabilityDbRow[]>`
      SELECT * FROM sp_report_profitability(${tenantId}::uuid, ${from}::date, ${to}::date)
    `;
    const items: ProfitabilityRow[] = rows.map((row) => ({
      productName: row.product_name,
      quantitySold: Number(row.quantity_sold),
      revenue: Number(row.revenue),
      cost: Number(row.cost),
      profit: Number(row.profit),
    }));
    return items;
  },

  async getActiveVeterinarians(tenantId, from, to) {
    const rows = await prisma.$queryRaw<ActiveVeterinarianDbRow[]>`
      SELECT * FROM sp_report_active_veterinarians(${tenantId}::uuid, ${from}::date, ${to}::date)
    `;
    const items: ActiveVeterinarianRow[] = rows.map((row) => ({
      veterinarianName: row.veterinarian_name,
      entryCount: Number(row.entry_count),
    }));
    return items;
  },
};
