export type DocumentStatus = "BORRADOR" | "EMITIDA" | "ANULADA";
export type InvoicePaymentStatus = "PENDIENTE" | "PARCIAL" | "PAGADA";
export type AdjustmentType = "CREDITO" | "DEBITO";

export interface DocumentLineItem {
  itemId: string;
  productId: string;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface QuoteListItem {
  quoteId: string;
  quoteNumber: string;
  ownerName: string;
  status: DocumentStatus;
  issueDate: Date;
  total: number;
}

export interface QuoteListResult {
  items: QuoteListItem[];
  totalCount: number;
}

export interface QuoteDetail {
  quoteId: string;
  quoteNumber: string;
  ownerId: string;
  ownerName: string;
  branchName: string;
  status: DocumentStatus;
  issueDate: Date;
  expiryDate: Date | null;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  createdAt: Date;
  items: DocumentLineItem[];
}

export interface InvoiceListItem {
  invoiceId: string;
  invoiceNumber: string;
  ownerName: string;
  paymentStatus: InvoicePaymentStatus;
  issueDate: Date;
  total: number;
  balanceDue: number;
}

export interface InvoiceListResult {
  items: InvoiceListItem[];
  totalCount: number;
}

export interface PaymentSummary {
  paymentId: string;
  amount: number;
  method: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface AdjustmentSummary {
  noteId: string;
  type: AdjustmentType;
  amount: number;
  reason: string;
  createdAt: Date;
}

export interface InvoiceDetail {
  invoiceId: string;
  invoiceNumber: string;
  ownerId: string;
  ownerName: string;
  branchName: string;
  paymentStatus: InvoicePaymentStatus;
  issueDate: Date;
  subtotal: number;
  tax: number;
  total: number;
  balanceDue: number;
  notes: string | null;
  createdAt: Date;
  items: DocumentLineItem[];
  payments: PaymentSummary[];
  adjustments: AdjustmentSummary[];
}

export interface AccountStatementItem {
  invoiceId: string;
  invoiceNumber: string;
  issueDate: Date;
  total: number;
  balanceDue: number;
  paymentStatus: InvoicePaymentStatus;
}

export interface AccountStatement {
  items: AccountStatementItem[];
  totalPending: number;
}
