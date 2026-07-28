import { prisma } from "@/lib/db/prisma";
import type { IProductRepository } from "../domain/repositories";
import type { ExpiringBatch, MovementListItem, MovementType, ProductListItem } from "../domain/entities";

type ListRow = {
  product_id: string;
  sku: string;
  internal_code: string | null;
  name: string;
  category: string | null;
  cost_price: unknown;
  sale_price: unknown;
  min_stock: number;
  total_stock: bigint;
  total_count: bigint;
};

type BatchJson = {
  batchId: string;
  branchId: string;
  branchName: string;
  batchNumber: string;
  expirationDate: string | null;
  quantity: number;
};

type DetailRow = {
  product_id: string;
  sku: string;
  internal_code: string | null;
  name: string;
  category: string | null;
  cost_price: unknown;
  sale_price: unknown;
  min_stock: number;
  created_at: Date;
  updated_at: Date;
  batches: BatchJson[];
};

type MovementRow = {
  movement_id: string;
  type: MovementType;
  quantity: number;
  branch_name: string;
  target_branch_name: string | null;
  notes: string | null;
  performed_by_username: string;
  created_at: Date;
  total_count: bigint;
};

type ExpiringRow = {
  batch_id: string;
  product_name: string;
  sku: string;
  branch_name: string;
  batch_number: string;
  expiration_date: Date;
  quantity: number;
  days_remaining: number;
};

export const productRepository: IProductRepository = {
  async create(input) {
    const rows = await prisma.$queryRaw<{ sp_create_product: string }[]>`
      SELECT sp_create_product(
        ${input.tenantId}::uuid, ${input.sku}, ${input.internalCode}, ${input.name}, ${input.category},
        ${input.costPrice}, ${input.salePrice}, ${input.minStock}::int, ${input.actorUserId}::uuid
      ) as sp_create_product
    `;
    return rows[0]!.sp_create_product;
  },

  async list({ tenantId, search, category, lowStockOnly, limit, offset }) {
    const rows = await prisma.$queryRaw<ListRow[]>`
      SELECT * FROM sp_list_products(
        ${tenantId}::uuid, ${search}, ${category}, ${lowStockOnly}, ${limit}::int, ${offset}::int
      )
    `;

    const items: ProductListItem[] = rows.map((row) => ({
      productId: row.product_id,
      sku: row.sku,
      internalCode: row.internal_code,
      name: row.name,
      category: row.category,
      costPrice: Number(row.cost_price),
      salePrice: Number(row.sale_price),
      minStock: row.min_stock,
      totalStock: Number(row.total_stock),
    }));

    return { items, totalCount: rows.length > 0 ? Number(rows[0]!.total_count) : 0 };
  },

  async get(tenantId, productId) {
    const rows = await prisma.$queryRaw<DetailRow[]>`
      SELECT * FROM sp_get_product(${tenantId}::uuid, ${productId}::uuid)
    `;
    if (rows.length === 0) return null;
    const row = rows[0]!;
    return {
      productId: row.product_id,
      sku: row.sku,
      internalCode: row.internal_code,
      name: row.name,
      category: row.category,
      costPrice: Number(row.cost_price),
      salePrice: Number(row.sale_price),
      minStock: row.min_stock,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      batches: (row.batches ?? []).map((b) => ({
        batchId: b.batchId,
        branchId: b.branchId,
        branchName: b.branchName,
        batchNumber: b.batchNumber,
        expirationDate: b.expirationDate ? new Date(b.expirationDate) : null,
        quantity: b.quantity,
      })),
    };
  },

  async update(input) {
    await prisma.$executeRaw`
      SELECT sp_update_product(
        ${input.tenantId}::uuid, ${input.productId}::uuid, ${input.name}, ${input.category},
        ${input.costPrice}, ${input.salePrice}, ${input.minStock}::int, ${input.actorUserId}::uuid
      )
    `;
  },

  async registerEntrada(input) {
    const rows = await prisma.$queryRaw<{ sp_register_entrada: string }[]>`
      SELECT sp_register_entrada(
        ${input.tenantId}::uuid, ${input.productId}::uuid, ${input.branchId}::uuid, ${input.batchNumber},
        ${input.expirationDate}::date, ${input.quantity}::int, ${input.notes}, ${input.actorUserId}::uuid
      ) as sp_register_entrada
    `;
    return rows[0]!.sp_register_entrada;
  },

  async registerSalida(input) {
    const rows = await prisma.$queryRaw<{ sp_register_salida: string }[]>`
      SELECT sp_register_salida(
        ${input.tenantId}::uuid, ${input.batchId}::uuid, ${input.quantity}::int, ${input.notes}, ${input.actorUserId}::uuid
      ) as sp_register_salida
    `;
    return rows[0]!.sp_register_salida;
  },

  async registerAjuste(input) {
    const rows = await prisma.$queryRaw<{ sp_register_ajuste: string }[]>`
      SELECT sp_register_ajuste(
        ${input.tenantId}::uuid, ${input.batchId}::uuid, ${input.newQuantity}::int, ${input.notes}, ${input.actorUserId}::uuid
      ) as sp_register_ajuste
    `;
    return rows[0]!.sp_register_ajuste;
  },

  async registerTransferencia(input) {
    const rows = await prisma.$queryRaw<{ sp_register_transferencia: string }[]>`
      SELECT sp_register_transferencia(
        ${input.tenantId}::uuid, ${input.batchId}::uuid, ${input.targetBranchId}::uuid, ${input.quantity}::int,
        ${input.notes}, ${input.actorUserId}::uuid
      ) as sp_register_transferencia
    `;
    return rows[0]!.sp_register_transferencia;
  },

  async listMovements({ tenantId, productId, limit, offset }) {
    const rows = await prisma.$queryRaw<MovementRow[]>`
      SELECT * FROM sp_list_movements(${tenantId}::uuid, ${productId}::uuid, ${limit}::int, ${offset}::int)
    `;

    const items: MovementListItem[] = rows.map((row) => ({
      movementId: row.movement_id,
      type: row.type,
      quantity: row.quantity,
      branchName: row.branch_name,
      targetBranchName: row.target_branch_name,
      notes: row.notes,
      performedByUsername: row.performed_by_username,
      createdAt: row.created_at,
    }));

    return { items, totalCount: rows.length > 0 ? Number(rows[0]!.total_count) : 0 };
  },

  async listExpiringBatches(tenantId, maxDays, limit) {
    const rows = await prisma.$queryRaw<ExpiringRow[]>`
      SELECT * FROM sp_list_expiring_batches(${tenantId}::uuid, ${maxDays}::int, ${limit}::int)
    `;

    const items: ExpiringBatch[] = rows.map((row) => ({
      batchId: row.batch_id,
      productName: row.product_name,
      sku: row.sku,
      branchName: row.branch_name,
      batchNumber: row.batch_number,
      expirationDate: row.expiration_date,
      quantity: row.quantity,
      daysRemaining: row.days_remaining,
    }));

    return items;
  },
};
