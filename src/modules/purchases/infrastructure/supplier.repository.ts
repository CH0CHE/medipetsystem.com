import { prisma } from "@/lib/db/prisma";
import type { ISupplierRepository } from "../domain/repositories";
import type { SupplierListItem } from "../domain/entities";

type ListRow = {
  supplier_id: string;
  name: string;
  tax_id: string | null;
  phone: string | null;
  email: string | null;
  created_at: Date;
  total_count: bigint;
};

type DetailRow = {
  supplier_id: string;
  name: string;
  tax_id: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

export const supplierRepository: ISupplierRepository = {
  async create(input) {
    const rows = await prisma.$queryRaw<{ sp_create_supplier: string }[]>`
      SELECT sp_create_supplier(
        ${input.tenantId}::uuid, ${input.name}, ${input.taxId}, ${input.phone},
        ${input.email}, ${input.address}, ${input.notes}, ${input.actorUserId}::uuid
      ) as sp_create_supplier
    `;
    return rows[0]!.sp_create_supplier;
  },

  async list({ tenantId, search, limit, offset }) {
    const rows = await prisma.$queryRaw<ListRow[]>`
      SELECT * FROM sp_list_suppliers(${tenantId}::uuid, ${search}, ${limit}::int, ${offset}::int)
    `;

    const items: SupplierListItem[] = rows.map((row) => ({
      supplierId: row.supplier_id,
      name: row.name,
      taxId: row.tax_id,
      phone: row.phone,
      email: row.email,
      createdAt: row.created_at,
    }));

    return { items, totalCount: rows.length > 0 ? Number(rows[0]!.total_count) : 0 };
  },

  async get(tenantId, supplierId) {
    const rows = await prisma.$queryRaw<DetailRow[]>`
      SELECT * FROM sp_get_supplier(${tenantId}::uuid, ${supplierId}::uuid)
    `;
    if (rows.length === 0) return null;
    const row = rows[0]!;
    return {
      supplierId: row.supplier_id,
      name: row.name,
      taxId: row.tax_id,
      phone: row.phone,
      email: row.email,
      address: row.address,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async update(input) {
    await prisma.$executeRaw`
      SELECT sp_update_supplier(
        ${input.tenantId}::uuid, ${input.supplierId}::uuid, ${input.name}, ${input.taxId},
        ${input.phone}, ${input.email}, ${input.address}, ${input.notes}, ${input.actorUserId}::uuid
      )
    `;
  },
};
