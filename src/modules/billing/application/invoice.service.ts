import type { IInvoiceRepository } from "../domain/repositories";
import type { AccountStatement, InvoiceDetail, InvoiceListResult, InvoicePaymentStatus } from "../domain/entities";
import type { CreateInvoiceInput } from "./dto/create-invoice.schema";
import type { RegisterPaymentInput } from "./dto/register-payment.schema";
import type { CreateAdjustmentInput } from "./dto/create-adjustment.schema";

function emptyToNull(value: string | undefined): string | null {
  return value ? value : null;
}

function requiredDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Fecha inválida.");
  return date;
}

export class InvoiceService {
  constructor(private readonly repository: IInvoiceRepository) {}

  async createInvoice(tenantId: string, branchId: string, input: CreateInvoiceInput, actorUserId: string): Promise<string> {
    return this.repository.create({
      tenantId,
      ownerId: input.ownerId,
      branchId,
      issueDate: requiredDate(input.issueDate),
      items: input.items,
      notes: emptyToNull(input.notes),
      actorUserId,
    });
  }

  async listInvoices(
    tenantId: string,
    query: { ownerId?: string; paymentStatus?: InvoicePaymentStatus; page: number; pageSize: number },
  ): Promise<InvoiceListResult> {
    return this.repository.list({
      tenantId,
      ownerId: query.ownerId ?? null,
      paymentStatus: query.paymentStatus ?? null,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
  }

  async getInvoice(tenantId: string, invoiceId: string): Promise<InvoiceDetail | null> {
    return this.repository.get(tenantId, invoiceId);
  }

  async createAdjustmentNote(
    tenantId: string,
    invoiceId: string,
    input: CreateAdjustmentInput,
    actorUserId: string,
  ): Promise<string> {
    return this.repository.createAdjustmentNote({
      tenantId,
      invoiceId,
      type: input.type,
      amount: input.amount,
      reason: input.reason,
      actorUserId,
    });
  }

  async registerPayment(
    tenantId: string,
    invoiceId: string,
    input: RegisterPaymentInput,
    actorUserId: string,
  ): Promise<string> {
    return this.repository.registerPayment({
      tenantId,
      invoiceId,
      amount: input.amount,
      method: emptyToNull(input.method),
      notes: emptyToNull(input.notes),
      actorUserId,
    });
  }

  async getAccountStatement(tenantId: string, ownerId: string): Promise<AccountStatement> {
    return this.repository.getAccountStatement(tenantId, ownerId);
  }
}
