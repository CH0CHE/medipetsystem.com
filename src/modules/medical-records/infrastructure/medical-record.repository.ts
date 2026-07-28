import { prisma } from "@/lib/db/prisma";
import type { IMedicalRecordRepository } from "../domain/repositories";
import type { AttachmentType, MedicalEntryListItem, MedicalEntryType } from "../domain/entities";

type ListRow = {
  entry_id: string;
  type: MedicalEntryType;
  entry_date: Date;
  title: string;
  veterinarian_id: string;
  veterinarian_name: string;
  attachment_count: bigint;
  created_at: Date;
  total_count: bigint;
};

type AttachmentJson = {
  attachmentId: string;
  fileUrl: string;
  fileType: AttachmentType;
  label: string | null;
  createdAt: string;
};

type DetailRow = {
  entry_id: string;
  pet_id: string;
  veterinarian_id: string;
  veterinarian_name: string;
  type: MedicalEntryType;
  entry_date: Date;
  title: string;
  symptoms: string | null;
  diagnosis: string | null;
  treatment: string | null;
  vaccine_name: string | null;
  next_due_date: Date | null;
  procedure_name: string | null;
  outcome: string | null;
  admission_date: Date | null;
  discharge_date: Date | null;
  medication_name: string | null;
  dosage: string | null;
  frequency: string | null;
  start_date: Date | null;
  end_date: Date | null;
  notes: string | null;
  created_at: Date;
  attachments: AttachmentJson[];
};

export const medicalRecordRepository: IMedicalRecordRepository = {
  async createEntry(input) {
    const rows = await prisma.$queryRaw<{ sp_create_medical_entry: string }[]>`
      SELECT sp_create_medical_entry(
        ${input.tenantId}::uuid, ${input.petId}::uuid, ${input.veterinarianId}::uuid,
        ${input.type}::"MedicalEntryType", ${input.entryDate}::date, ${input.title},
        ${input.symptoms}, ${input.diagnosis}, ${input.treatment},
        ${input.vaccineName}, ${input.nextDueDate}::date,
        ${input.procedureName}, ${input.outcome},
        ${input.admissionDate}::date, ${input.dischargeDate}::date,
        ${input.medicationName}, ${input.dosage}, ${input.frequency}, ${input.startDate}::date, ${input.endDate}::date,
        ${input.notes}
      ) as sp_create_medical_entry
    `;
    return rows[0]!.sp_create_medical_entry;
  },

  async listEntries({ tenantId, petId, type, limit, offset }) {
    const rows = await prisma.$queryRaw<ListRow[]>`
      SELECT * FROM sp_list_medical_entries(
        ${tenantId}::uuid, ${petId}::uuid, ${type}::"MedicalEntryType", ${limit}::int, ${offset}::int
      )
    `;

    const items: MedicalEntryListItem[] = rows.map((row) => ({
      entryId: row.entry_id,
      type: row.type,
      entryDate: row.entry_date,
      title: row.title,
      veterinarianId: row.veterinarian_id,
      veterinarianName: row.veterinarian_name,
      attachmentCount: Number(row.attachment_count),
      createdAt: row.created_at,
    }));

    return { items, totalCount: rows.length > 0 ? Number(rows[0]!.total_count) : 0 };
  },

  async getEntry(tenantId, entryId) {
    const rows = await prisma.$queryRaw<DetailRow[]>`
      SELECT * FROM sp_get_medical_entry(${tenantId}::uuid, ${entryId}::uuid)
    `;
    if (rows.length === 0) return null;
    const row = rows[0]!;
    return {
      entryId: row.entry_id,
      petId: row.pet_id,
      veterinarianId: row.veterinarian_id,
      veterinarianName: row.veterinarian_name,
      type: row.type,
      entryDate: row.entry_date,
      title: row.title,
      symptoms: row.symptoms,
      diagnosis: row.diagnosis,
      treatment: row.treatment,
      vaccineName: row.vaccine_name,
      nextDueDate: row.next_due_date,
      procedureName: row.procedure_name,
      outcome: row.outcome,
      admissionDate: row.admission_date,
      dischargeDate: row.discharge_date,
      medicationName: row.medication_name,
      dosage: row.dosage,
      frequency: row.frequency,
      startDate: row.start_date,
      endDate: row.end_date,
      notes: row.notes,
      createdAt: row.created_at,
      attachments: (row.attachments ?? []).map((a) => ({
        attachmentId: a.attachmentId,
        fileUrl: a.fileUrl,
        fileType: a.fileType,
        label: a.label,
        createdAt: new Date(a.createdAt),
      })),
    };
  },

  async addAttachment(input) {
    const rows = await prisma.$queryRaw<{ sp_add_attachment: string }[]>`
      SELECT sp_add_attachment(
        ${input.tenantId}::uuid, ${input.medicalRecordEntryId}::uuid, ${input.fileUrl},
        ${input.fileType}::"AttachmentType", ${input.label}, ${input.uploadedByUserId}::uuid
      ) as sp_add_attachment
    `;
    return rows[0]!.sp_add_attachment;
  },
};
