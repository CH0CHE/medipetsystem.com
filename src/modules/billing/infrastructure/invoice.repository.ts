import { prisma } from "@/lib/db/prisma";
import type { IInvoiceRepository } from "../domain/repositories";
import type {
  AccountStatementItem,
  AdjustmentSummary,
  DocumentLineItem,
  InvoiceListItem,
  InvoicePaymentStatus,
  PaymentSummary,
} from "../domain/entities";

type ListRow = {
  invoice_id: string;
  invoice_number: string;
  owner_name: string;
  payment_status: InvoicePaymentStatus;
  issue_date: Date;
  total: unknown;
  balance_due: unknown;
  total_count: bigint;
};

type ItemJson = {
  itemId: string;
  productId: string;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: unknown;
  lineTotal: unknown;
};

type PaymentJson = { paymentId: string; amount: unknown; method: string | null; notes: string | null; createdAt: string };
type AdjustmentJson = { noteId: string; type: "CREDITO" | "DEBITO"; amount: unknown; reason: string; createdAt: string };

type DetailRow = {
  invoice_id: string;
  invoice_number: string;
  owner_id: string;
  owner_name: string;
  branch_name: string;
  payment_status: InvoicePaymentStatus;
  issue_date: Date;
  subtotal: unknown;
  tax: unknown;
  total: unknown;
  balance_due: unknown;
  notes: string | null;
  created_at: Date;
  items: ItemJson[];
  payments: PaymentJson[];
  adjustments: AdjustmentJson[];
};

type StatementRow = {
  invoice_id: string;
  invoice_number: string;
  issue_date: Date;
  total: unknown;
  balance_due: unknown;
  payment_status: InvoicePaymentStatus;
  total_pending: unknown;
};

function mapItem(i: ItemJson): DocumentLineItem {
  return {
    itemId: i.itemId,
    productId: i.productId,
    productName: i.productName,
    description: i.description,
    quantity: i.quantity,
    unitPrice: Number(i.unitPrice),
    lineTotal: Number(i.lineTotal),
  };
}

function toSnakeCaseItems(items: { productId: string; description: string; quantity: number; unitPrice: number }[]) {
  return items.map((i) => ({
    product_id: i.productId,
    description: i.description,
    quantity: i.quantity,
    unit_price: i.unitPrice,
  }));
}

export const invoiceRepository: IInvoiceRepository = {
  async create(input) {
    const itemsJson = JSON.stringify(toSnakeCaseItems(input.items));
    const rows = await prisma.$queryRaw<{ sp_create_invoice: string }[]>`
      SELECT sp_create_invoice(
        ${input.tenantId}::uuid, ${input.ownerId}::uuid, ${input.branchId}::uuid, ${input.issueDate}::date,
        ${itemsJson}::jsonb, ${input.notes}, ${input.actorUserId}::uuid
      ) as sp_create_invoice
    `;
    return rows[0]!.sp_create_invoice;
  },

  async list({ tenantId, ownerId, paymentStatus, limit, offset }) {
    const rows = await prisma.$queryRaw<ListRow[]>`
      SELECT * FROM sp_list_invoices(
        ${tenantId}::uuid, ${ownerId}::uuid, ${paymentStatus}::"InvoicePaymentStatus", ${limit}::int, ${offset}::int
      )
    `;

    const items: InvoiceListItem[] = rows.map((row) => ({
      invoiceId: row.invoice_id,
      invoiceNumber: row.invoice_number,
      ownerName: row.owner_name,
      paymentStatus: row.payment_status,
      issueDate: row.issue_date,
      total: Number(row.total),
      balanceDue: Number(row.balance_due),
    }));

    return { items, totalCount: rows.length > 0 ? Number(rows[0]!.total_count) : 0 };
  },

  async get(tenantId, invoiceId) {
    const rows = await prisma.$queryRaw<DetailRow[]>`
      SELECT * FROM sp_get_invoice(${tenantId}::uuid, ${invoiceId}::uuid)
    `;
    if (rows.length === 0) return null;
    const row = rows[0]!;

    const payments: PaymentSummary[] = (row.payments ?? []).map((p) => ({
      paymentId: p.paymentId,
      amount: Number(p.amount),
      method: p.method,
      notes: p.notes,
      createdAt: new Date(p.createdAt),
    }));

    const adjustments: AdjustmentSummary[] = (row.adjustments ?? []).map((a) => ({
      noteId: a.noteId,
      type: a.type,
      amount: Number(a.amount),
      reason: a.reason,
      createdAt: new Date(a.createdAt),
    }));

    return {
      invoiceId: row.invoice_id,
      invoiceNumber: row.invoice_number,
      ownerId: row.owner_id,
      ownerName: row.owner_name,
      branchName: row.branch_name,
      paymentStatus: row.payment_status,
      issueDate: row.issue_date,
      subtotal: Number(row.subtotal),
      tax: Number(row.tax),
      total: Number(row.total),
      balanceDue: Number(row.balance_due),
      notes: row.notes,
      createdAt: row.created_at,
      items: (row.items ?? []).map(mapItem),
      payments,
      adjustments,
    };
  },

  async createAdjustmentNote(input) {
    const rows = await prisma.$queryRaw<{ sp_create_adjustment_note: string }[]>`
      SELECT sp_create_adjustment_note(
        ${input.tenantId}::uuid, ${input.invoiceId}::uuid, ${input.type}::"AdjustmentType",
        ${input.amount}, ${input.reason}, ${input.actorUserId}::uuid
      ) as sp_create_adjustment_note
    `;
    return rows[0]!.sp_create_adjustment_note;
  },

  async registerPayment(input) {
    const rows = await prisma.$queryRaw<{ sp_register_payment: string }[]>`
      SELECT sp_register_payment(
        ${input.tenantId}::uuid, ${input.invoiceId}::uuid, ${input.amount}, ${input.method}, ${input.notes},
        ${input.actorUserId}::uuid
      ) as sp_register_payment
    `;
    return rows[0]!.sp_register_payment;
  },

  async getAccountStatement(tenantId, ownerId) {
    const rows = await prisma.$queryRaw<StatementRow[]>`
      SELECT * FROM sp_get_account_statement(${tenantId}::uuid, ${ownerId}::uuid)
    `;

    const items: AccountStatementItem[] = rows.map((row) => ({
      invoiceId: row.invoice_id,
      invoiceNumber: row.invoice_number,
      issueDate: row.issue_date,
      total: Number(row.total),
      balanceDue: Number(row.balance_due),
      paymentStatus: row.payment_status,
    }));

    return { items, totalPending: rows.length > 0 ? Number(rows[0]!.total_pending) : 0 };
  },
};
