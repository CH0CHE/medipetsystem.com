import { prisma } from "@/lib/db/prisma";
import type { IQuoteRepository } from "../domain/repositories";
import type { DocumentLineItem, DocumentStatus, QuoteListItem } from "../domain/entities";

type ListRow = {
  quote_id: string;
  quote_number: string;
  owner_name: string;
  status: DocumentStatus;
  issue_date: Date;
  total: unknown;
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

type DetailRow = {
  quote_id: string;
  quote_number: string;
  owner_id: string;
  owner_name: string;
  branch_name: string;
  status: DocumentStatus;
  issue_date: Date;
  expiry_date: Date | null;
  subtotal: unknown;
  tax: unknown;
  total: unknown;
  notes: string | null;
  created_at: Date;
  items: ItemJson[];
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

export const quoteRepository: IQuoteRepository = {
  async create(input) {
    const itemsJson = JSON.stringify(toSnakeCaseItems(input.items));
    const rows = await prisma.$queryRaw<{ sp_create_quote: string }[]>`
      SELECT sp_create_quote(
        ${input.tenantId}::uuid, ${input.ownerId}::uuid, ${input.branchId}::uuid, ${input.issueDate}::date,
        ${input.expiryDate}::date, ${itemsJson}::jsonb, ${input.notes}, ${input.actorUserId}::uuid
      ) as sp_create_quote
    `;
    return rows[0]!.sp_create_quote;
  },

  async list({ tenantId, ownerId, status, limit, offset }) {
    const rows = await prisma.$queryRaw<ListRow[]>`
      SELECT * FROM sp_list_quotes(${tenantId}::uuid, ${ownerId}::uuid, ${status}::"DocumentStatus", ${limit}::int, ${offset}::int)
    `;

    const items: QuoteListItem[] = rows.map((row) => ({
      quoteId: row.quote_id,
      quoteNumber: row.quote_number,
      ownerName: row.owner_name,
      status: row.status,
      issueDate: row.issue_date,
      total: Number(row.total),
    }));

    return { items, totalCount: rows.length > 0 ? Number(rows[0]!.total_count) : 0 };
  },

  async get(tenantId, quoteId) {
    const rows = await prisma.$queryRaw<DetailRow[]>`
      SELECT * FROM sp_get_quote(${tenantId}::uuid, ${quoteId}::uuid)
    `;
    if (rows.length === 0) return null;
    const row = rows[0]!;
    return {
      quoteId: row.quote_id,
      quoteNumber: row.quote_number,
      ownerId: row.owner_id,
      ownerName: row.owner_name,
      branchName: row.branch_name,
      status: row.status,
      issueDate: row.issue_date,
      expiryDate: row.expiry_date,
      subtotal: Number(row.subtotal),
      tax: Number(row.tax),
      total: Number(row.total),
      notes: row.notes,
      createdAt: row.created_at,
      items: (row.items ?? []).map(mapItem),
    };
  },
};
