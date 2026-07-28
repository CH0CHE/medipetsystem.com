import { prisma } from "@/lib/db/prisma";
import type { IOwnerRepository } from "../domain/repositories";
import type { FinancialStatus, OwnerListItem } from "../domain/entities";

type ListRow = {
  owner_id: string;
  full_name: string;
  document_id: string | null;
  phone: string | null;
  email: string | null;
  financial_status: FinancialStatus;
  pet_count: bigint;
  created_at: Date;
  total_count: bigint;
};

type DetailRow = {
  owner_id: string;
  full_name: string;
  document_id: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  financial_status: FinancialStatus;
  notes: string | null;
  pet_count: bigint;
  created_at: Date;
  updated_at: Date;
};

export const ownerRepository: IOwnerRepository = {
  async create(input) {
    const rows = await prisma.$queryRaw<{ sp_create_owner: string }[]>`
      SELECT sp_create_owner(
        ${input.tenantId}::uuid, ${input.fullName}, ${input.documentId}, ${input.phone},
        ${input.email}, ${input.address}, ${input.notes}, ${input.createdByUserId}::uuid
      ) as sp_create_owner
    `;
    return rows[0]!.sp_create_owner;
  },

  async list({ tenantId, search, financialStatus, limit, offset }) {
    const rows = await prisma.$queryRaw<ListRow[]>`
      SELECT * FROM sp_list_owners(
        ${tenantId}::uuid, ${search}, ${financialStatus}::"FinancialStatus", ${limit}::int, ${offset}::int
      )
    `;

    const items: OwnerListItem[] = rows.map((row) => ({
      ownerId: row.owner_id,
      fullName: row.full_name,
      documentId: row.document_id,
      phone: row.phone,
      email: row.email,
      financialStatus: row.financial_status,
      petCount: Number(row.pet_count),
      createdAt: row.created_at,
    }));

    return { items, totalCount: rows.length > 0 ? Number(rows[0]!.total_count) : 0 };
  },

  async get(tenantId, ownerId) {
    const rows = await prisma.$queryRaw<DetailRow[]>`
      SELECT * FROM sp_get_owner(${tenantId}::uuid, ${ownerId}::uuid)
    `;
    if (rows.length === 0) return null;
    const row = rows[0]!;
    return {
      ownerId: row.owner_id,
      fullName: row.full_name,
      documentId: row.document_id,
      phone: row.phone,
      email: row.email,
      address: row.address,
      financialStatus: row.financial_status,
      notes: row.notes,
      petCount: Number(row.pet_count),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async update(input) {
    await prisma.$executeRaw`
      SELECT sp_update_owner(
        ${input.tenantId}::uuid, ${input.ownerId}::uuid, ${input.fullName}, ${input.documentId},
        ${input.phone}, ${input.email}, ${input.address}, ${input.financialStatus}::"FinancialStatus",
        ${input.notes}, ${input.actorUserId}::uuid
      )
    `;
  },
};
