import { prisma } from "@/lib/db/prisma";
import type { ILeadRepository } from "../domain/repositories";
import type { LeadListItem, LeadSource, LeadStatus } from "../domain/entities";

type ListRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  clinic_name: string | null;
  message: string | null;
  source: LeadSource;
  status: LeadStatus;
  created_at: Date;
  total_count: bigint;
};

function mapRow(row: ListRow): LeadListItem {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    clinicName: row.clinic_name,
    message: row.message,
    source: row.source,
    status: row.status,
    createdAt: row.created_at,
  };
}

export const leadRepository: ILeadRepository = {
  async create(input) {
    const rows = await prisma.$queryRaw<{ sp_create_lead: string }[]>`
      SELECT sp_create_lead(
        ${input.fullName}, ${input.email}, ${input.phone}, ${input.clinicName}, ${input.message},
        ${input.source}::"LeadSource"
      ) as sp_create_lead
    `;
    return rows[0]!.sp_create_lead;
  },

  async list({ status, source, limit, offset }) {
    const rows = await prisma.$queryRaw<ListRow[]>`
      SELECT * FROM sp_list_leads(
        ${status}::"LeadStatus", ${source}::"LeadSource", ${limit}::int, ${offset}::int
      )
    `;
    return { items: rows.map(mapRow), totalCount: rows.length > 0 ? Number(rows[0]!.total_count) : 0 };
  },

  async updateStatus(id, status, actorUserId) {
    await prisma.$executeRaw`
      SELECT sp_update_lead_status(${id}::uuid, ${status}::"LeadStatus", ${actorUserId}::uuid)
    `;
  },
};
