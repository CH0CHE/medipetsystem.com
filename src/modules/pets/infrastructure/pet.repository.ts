import { prisma } from "@/lib/db/prisma";
import type { IPetRepository } from "../domain/repositories";
import type { PetListItem, PetSex, PetStatus } from "../domain/entities";

type ListRow = {
  pet_id: string;
  name: string;
  species: string;
  breed: string | null;
  sex: PetSex | null;
  status: PetStatus;
  owner_id: string;
  owner_name: string;
  branch_id: string;
  branch_name: string;
  created_at: Date;
  total_count: bigint;
};

type DetailRow = {
  pet_id: string;
  branch_id: string;
  branch_name: string;
  owner_id: string;
  owner_name: string;
  name: string;
  species: string;
  breed: string | null;
  sex: PetSex | null;
  birth_date: Date | null;
  weight_kg: unknown;
  color: string | null;
  photo_url: string | null;
  microchip_number: string | null;
  status: PetStatus;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

export const petRepository: IPetRepository = {
  async create(input) {
    const rows = await prisma.$queryRaw<{ sp_create_pet: string }[]>`
      SELECT sp_create_pet(
        ${input.tenantId}::uuid, ${input.branchId}::uuid, ${input.ownerId}::uuid,
        ${input.name}, ${input.species}, ${input.breed}, ${input.sex}::"PetSex",
        ${input.birthDate}::date, ${input.weightKg}, ${input.color}, ${input.photoUrl},
        ${input.microchipNumber}, ${input.createdByUserId}::uuid
      ) as sp_create_pet
    `;
    return rows[0]!.sp_create_pet;
  },

  async list({ tenantId, search, species, status, ownerId, limit, offset }) {
    const rows = await prisma.$queryRaw<ListRow[]>`
      SELECT * FROM sp_list_pets(
        ${tenantId}::uuid, ${search}, ${species}, ${status}::"PetStatus", ${ownerId}::uuid,
        ${limit}::int, ${offset}::int
      )
    `;

    const items: PetListItem[] = rows.map((row) => ({
      petId: row.pet_id,
      name: row.name,
      species: row.species,
      breed: row.breed,
      sex: row.sex,
      status: row.status,
      ownerId: row.owner_id,
      ownerName: row.owner_name,
      branchId: row.branch_id,
      branchName: row.branch_name,
      createdAt: row.created_at,
    }));

    return { items, totalCount: rows.length > 0 ? Number(rows[0]!.total_count) : 0 };
  },

  async get(tenantId, petId) {
    const rows = await prisma.$queryRaw<DetailRow[]>`
      SELECT * FROM sp_get_pet(${tenantId}::uuid, ${petId}::uuid)
    `;
    if (rows.length === 0) return null;
    const row = rows[0]!;
    return {
      petId: row.pet_id,
      branchId: row.branch_id,
      branchName: row.branch_name,
      ownerId: row.owner_id,
      ownerName: row.owner_name,
      name: row.name,
      species: row.species,
      breed: row.breed,
      sex: row.sex,
      birthDate: row.birth_date,
      weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
      color: row.color,
      photoUrl: row.photo_url,
      microchipNumber: row.microchip_number,
      status: row.status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  async update(input) {
    await prisma.$executeRaw`
      SELECT sp_update_pet(
        ${input.tenantId}::uuid, ${input.petId}::uuid, ${input.branchId}::uuid, ${input.ownerId}::uuid,
        ${input.name}, ${input.species}, ${input.breed}, ${input.sex}::"PetSex", ${input.birthDate}::date,
        ${input.weightKg}, ${input.color}, ${input.photoUrl}, ${input.microchipNumber},
        ${input.status}::"PetStatus", ${input.notes}, ${input.actorUserId}::uuid
      )
    `;
  },
};
