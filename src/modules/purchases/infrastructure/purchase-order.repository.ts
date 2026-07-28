import { prisma } from "@/lib/db/prisma";
import type { IPurchaseOrderRepository } from "../domain/repositories";
import type { PurchaseOrderLineItem, PurchaseOrderListItem, PurchaseOrderStatus } from "../domain/entities";

type ListRow = {
  purchase_order_id: string;
  order_number: string;
  supplier_name: string;
  status: PurchaseOrderStatus;
  order_date: Date;
  total_cost: unknown;
  total_count: bigint;
};

type ItemJson = {
  itemId: string;
  productId: string;
  productName: string;
  description: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: unknown;
};

type DetailRow = {
  purchase_order_id: string;
  order_number: string;
  supplier_id: string;
  supplier_name: string;
  branch_name: string;
  status: PurchaseOrderStatus;
  order_date: Date;
  notes: string | null;
  created_at: Date;
  items: ItemJson[];
};

function mapItem(i: ItemJson): PurchaseOrderLineItem {
  return {
    itemId: i.itemId,
    productId: i.productId,
    productName: i.productName,
    description: i.description,
    quantityOrdered: i.quantityOrdered,
    quantityReceived: i.quantityReceived,
    unitCost: Number(i.unitCost),
  };
}

function toSnakeCaseCreateItems(items: { productId: string; description: string; quantityOrdered: number; unitCost: number }[]) {
  return items.map((i) => ({
    product_id: i.productId,
    description: i.description,
    quantity_ordered: i.quantityOrdered,
    unit_cost: i.unitCost,
  }));
}

function toSnakeCaseReceiveItems(
  items: { purchaseOrderItemId: string; quantityReceived: number; batchNumber: string; expirationDate: Date | null }[],
) {
  return items.map((i) => ({
    purchase_order_item_id: i.purchaseOrderItemId,
    quantity_received: i.quantityReceived,
    batch_number: i.batchNumber,
    expiration_date: i.expirationDate ? i.expirationDate.toISOString().slice(0, 10) : null,
  }));
}

export const purchaseOrderRepository: IPurchaseOrderRepository = {
  async create(input) {
    const itemsJson = JSON.stringify(toSnakeCaseCreateItems(input.items));
    const rows = await prisma.$queryRaw<{ sp_create_purchase_order: string }[]>`
      SELECT sp_create_purchase_order(
        ${input.tenantId}::uuid, ${input.supplierId}::uuid, ${input.branchId}::uuid, ${input.orderDate}::date,
        ${itemsJson}::jsonb, ${input.notes}, ${input.actorUserId}::uuid
      ) as sp_create_purchase_order
    `;
    return rows[0]!.sp_create_purchase_order;
  },

  async list({ tenantId, supplierId, status, limit, offset }) {
    const rows = await prisma.$queryRaw<ListRow[]>`
      SELECT * FROM sp_list_purchase_orders(
        ${tenantId}::uuid, ${supplierId}::uuid, ${status}::"PurchaseOrderStatus", ${limit}::int, ${offset}::int
      )
    `;

    const items: PurchaseOrderListItem[] = rows.map((row) => ({
      purchaseOrderId: row.purchase_order_id,
      orderNumber: row.order_number,
      supplierName: row.supplier_name,
      status: row.status,
      orderDate: row.order_date,
      totalCost: Number(row.total_cost),
    }));

    return { items, totalCount: rows.length > 0 ? Number(rows[0]!.total_count) : 0 };
  },

  async get(tenantId, purchaseOrderId) {
    const rows = await prisma.$queryRaw<DetailRow[]>`
      SELECT * FROM sp_get_purchase_order(${tenantId}::uuid, ${purchaseOrderId}::uuid)
    `;
    if (rows.length === 0) return null;
    const row = rows[0]!;

    return {
      purchaseOrderId: row.purchase_order_id,
      orderNumber: row.order_number,
      supplierId: row.supplier_id,
      supplierName: row.supplier_name,
      branchName: row.branch_name,
      status: row.status,
      orderDate: row.order_date,
      notes: row.notes,
      createdAt: row.created_at,
      items: (row.items ?? []).map(mapItem),
    };
  },

  async receive(tenantId, purchaseOrderId, items, actorUserId) {
    const itemsJson = JSON.stringify(toSnakeCaseReceiveItems(items));
    await prisma.$executeRaw`
      SELECT sp_receive_purchase_order(${tenantId}::uuid, ${purchaseOrderId}::uuid, ${itemsJson}::jsonb, ${actorUserId}::uuid)
    `;
  },

  async cancel(tenantId, purchaseOrderId, actorUserId) {
    await prisma.$executeRaw`
      SELECT sp_cancel_purchase_order(${tenantId}::uuid, ${purchaseOrderId}::uuid, ${actorUserId}::uuid)
    `;
  },
};
