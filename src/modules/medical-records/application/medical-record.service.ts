import type { IMedicalRecordRepository } from "../domain/repositories";
import type { MedicalEntryDetail, MedicalEntryListResult, MedicalEntryType } from "../domain/entities";
import type { CreateMedicalEntryInput } from "./dto/create-entry.schema";
import type { AddAttachmentInput } from "./dto/add-attachment.schema";

function emptyToNull(value: string | undefined): string | null {
  return value ? value : null;
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function requiredDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Fecha inválida.");
  return date;
}

export class MedicalRecordService {
  constructor(private readonly repository: IMedicalRecordRepository) {}

  async createEntry(
    tenantId: string,
    petId: string,
    veterinarianId: string,
    input: CreateMedicalEntryInput,
  ): Promise<string> {
    const base = {
      tenantId,
      petId,
      veterinarianId,
      type: input.type,
      entryDate: requiredDate(input.entryDate),
      title: input.title,
      notes: emptyToNull(input.notes),
      symptoms: null,
      diagnosis: null,
      treatment: null,
      vaccineName: null,
      nextDueDate: null,
      procedureName: null,
      outcome: null,
      admissionDate: null,
      dischargeDate: null,
      medicationName: null,
      dosage: null,
      frequency: null,
      startDate: null,
      endDate: null,
    };

    switch (input.type) {
      case "CONSULTA":
        return this.repository.createEntry({
          ...base,
          symptoms: emptyToNull(input.symptoms),
          diagnosis: input.diagnosis,
          treatment: emptyToNull(input.treatment),
        });
      case "VACUNA":
        return this.repository.createEntry({
          ...base,
          vaccineName: input.vaccineName,
          nextDueDate: parseDate(input.nextDueDate),
        });
      case "CIRUGIA":
        return this.repository.createEntry({
          ...base,
          procedureName: input.procedureName,
          outcome: emptyToNull(input.outcome),
        });
      case "HOSPITALIZACION":
        return this.repository.createEntry({
          ...base,
          admissionDate: requiredDate(input.admissionDate),
          dischargeDate: parseDate(input.dischargeDate),
        });
      case "MEDICAMENTO":
        return this.repository.createEntry({
          ...base,
          medicationName: input.medicationName,
          dosage: emptyToNull(input.dosage),
          frequency: emptyToNull(input.frequency),
          startDate: parseDate(input.startDate),
          endDate: parseDate(input.endDate),
        });
    }
  }

  async listEntries(
    tenantId: string,
    query: { petId?: string; type?: MedicalEntryType; page: number; pageSize: number },
  ): Promise<MedicalEntryListResult> {
    return this.repository.listEntries({
      tenantId,
      petId: query.petId ?? null,
      type: query.type ?? null,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
  }

  async getEntry(tenantId: string, entryId: string): Promise<MedicalEntryDetail | null> {
    return this.repository.getEntry(tenantId, entryId);
  }

  async addAttachment(
    tenantId: string,
    medicalRecordEntryId: string,
    input: AddAttachmentInput,
    uploadedByUserId: string,
  ): Promise<string> {
    return this.repository.addAttachment({
      tenantId,
      medicalRecordEntryId,
      fileUrl: input.fileUrl,
      fileType: input.fileType,
      label: emptyToNull(input.label),
      uploadedByUserId,
    });
  }
}
