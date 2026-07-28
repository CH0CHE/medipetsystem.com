import type { IBillingRepository } from "../domain/repositories";
import type { PlatformInvoiceListResult, PlatformInvoiceStatus } from "../domain/entities";
import type { CreateInvoiceInput } from "./dto/create-invoice.schema";

export class BillingService {
  constructor(private readonly repository: IBillingRepository) {}

  async createInvoice(tenantId: string, input: CreateInvoiceInput, actorUserId: string): Promise<string> {
    return this.repository.createInvoice(tenantId, input.period, input.amount, actorUserId);
  }

  async listInvoices(
    query: { tenantId?: string; status?: PlatformInvoiceStatus; page: number; pageSize: number },
  ): Promise<PlatformInvoiceListResult> {
    return this.repository.listInvoices({
      tenantId: query.tenantId ?? null,
      status: query.status ?? null,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
  }

  async markInvoicePaid(invoiceId: string, actorUserId: string): Promise<void> {
    await this.repository.markInvoicePaid(invoiceId, actorUserId);
  }
}
