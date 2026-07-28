import type {
  AccountStatement,
  AdjustmentType,
  DocumentStatus,
  InvoiceDetail,
  InvoiceListResult,
  InvoicePaymentStatus,
  QuoteDetail,
  QuoteListResult,
} from "./entities";

export interface DocumentItemRepoInput {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateQuoteRepoInput {
  tenantId: string;
  ownerId: string;
  branchId: string;
  issueDate: Date;
  expiryDate: Date | null;
  items: DocumentItemRepoInput[];
  notes: string | null;
  actorUserId: string;
}

export interface CreateInvoiceRepoInput {
  tenantId: string;
  ownerId: string;
  branchId: string;
  issueDate: Date;
  items: DocumentItemRepoInput[];
  notes: string | null;
  actorUserId: string;
}

export interface IQuoteRepository {
  create(input: CreateQuoteRepoInput): Promise<string>;
  list(input: {
    tenantId: string;
    ownerId: string | null;
    status: DocumentStatus | null;
    limit: number;
    offset: number;
  }): Promise<QuoteListResult>;
  get(tenantId: string, quoteId: string): Promise<QuoteDetail | null>;
}

export interface IInvoiceRepository {
  create(input: CreateInvoiceRepoInput): Promise<string>;
  list(input: {
    tenantId: string;
    ownerId: string | null;
    paymentStatus: InvoicePaymentStatus | null;
    limit: number;
    offset: number;
  }): Promise<InvoiceListResult>;
  get(tenantId: string, invoiceId: string): Promise<InvoiceDetail | null>;

  createAdjustmentNote(input: {
    tenantId: string;
    invoiceId: string;
    type: AdjustmentType;
    amount: number;
    reason: string;
    actorUserId: string;
  }): Promise<string>;

  registerPayment(input: {
    tenantId: string;
    invoiceId: string;
    amount: number;
    method: string | null;
    notes: string | null;
    actorUserId: string;
  }): Promise<string>;

  getAccountStatement(tenantId: string, ownerId: string): Promise<AccountStatement>;
}
