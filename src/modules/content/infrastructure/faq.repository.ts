import { prisma } from "@/lib/db/prisma";
import type { IFaqRepository } from "../domain/repositories";
import type { FaqItem } from "../domain/entities";

type FaqRow = {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  is_published: boolean;
  updated_at: Date;
};

function mapRow(row: FaqRow): FaqItem {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    displayOrder: row.display_order,
    isPublished: row.is_published,
    updatedAt: row.updated_at,
  };
}

export const faqRepository: IFaqRepository = {
  async list(publishedOnly) {
    const rows = await prisma.$queryRaw<FaqRow[]>`SELECT * FROM sp_list_faqs(${publishedOnly})`;
    return rows.map(mapRow);
  },

  async create(input) {
    const rows = await prisma.$queryRaw<{ sp_create_faq: string }[]>`
      SELECT sp_create_faq(
        ${input.question}, ${input.answer}, ${input.displayOrder}::int, ${input.isPublished}, ${input.actorUserId}::uuid
      ) as sp_create_faq
    `;
    return rows[0]!.sp_create_faq;
  },

  async update(input) {
    await prisma.$executeRaw`
      SELECT sp_update_faq(
        ${input.id}::uuid, ${input.question}, ${input.answer}, ${input.displayOrder}::int,
        ${input.isPublished}, ${input.actorUserId}::uuid
      )
    `;
  },

  async delete(id, actorUserId) {
    await prisma.$executeRaw`SELECT sp_delete_faq(${id}::uuid, ${actorUserId}::uuid)`;
  },
};
