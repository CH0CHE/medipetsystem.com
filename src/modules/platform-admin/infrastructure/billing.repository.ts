import { prisma } from "@/lib/db/prisma";
import type { IBillingRepository } from "../domain/repositories";
import type { PlatformInvoiceListItem, PlatformInvoiceStatus, TenantPlan } from "../domain/entities";

type ListRow = {
  invoice_id: string;
  tenant_id: string;
  tenant_name: string;
  period: string;
  plan: TenantPlan;
  amount: unknown;
  status: PlatformInvoiceStatus;
  paid_at: Date | null;
  created_at: Date;
  total_count: bigint;
};

export const billingRepository: IBillingRepository = {
  async createInvoice(tenantId, period, amount, actorUserId) {
    const rows = await prisma.$queryRaw<{ sp_create_platform_invoice: string }[]>`
      SELECT sp_create_platform_invoice(${tenantId}::uuid, ${period}, ${amount}, ${actorUserId}::uuid) as sp_create_platform_invoice
    `;
    return rows[0]!.sp_create_platform_invoice;
  },

  async listInvoices({ tenantId, status, limit, offset }) {
    const rows = await prisma.$queryRaw<ListRow[]>`
      SELECT * FROM sp_list_platform_invoices(
        ${tenantId}::uuid, ${status}::"SubscriptionInvoiceStatus", ${limit}::int, ${offset}::int
      )
    `;

    const items: PlatformInvoiceListItem[] = rows.map((row) => ({
      invoiceId: row.invoice_id,
      tenantId: row.tenant_id,
      tenantName: row.tenant_name,
      period: row.period,
      plan: row.plan,
      amount: Number(row.amount),
      status: row.status,
      paidAt: row.paid_at,
      createdAt: row.created_at,
    }));

    return { items, totalCount: rows.length > 0 ? Number(rows[0]!.total_count) : 0 };
  },

  async markInvoicePaid(invoiceId, actorUserId) {
    await prisma.$executeRaw`SELECT sp_mark_platform_invoice_paid(${invoiceId}::uuid, ${actorUserId}::uuid)`;
  },
};
