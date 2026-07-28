import type { AttachmentType, MedicalEntryDetail, MedicalEntryListResult, MedicalEntryType } from "./entities";

export interface CreateMedicalEntryRepoInput {
  tenantId: string;
  petId: string;
  veterinarianId: string;
  type: MedicalEntryType;
  entryDate: Date;
  title: string;
  symptoms: string | null;
  diagnosis: string | null;
  treatment: string | null;
  vaccineName: string | null;
  nextDueDate: Date | null;
  procedureName: string | null;
  outcome: string | null;
  admissionDate: Date | null;
  dischargeDate: Date | null;
  medicationName: string | null;
  dosage: string | null;
  frequency: string | null;
  startDate: Date | null;
  endDate: Date | null;
  notes: string | null;
}

export interface AddAttachmentRepoInput {
  tenantId: string;
  medicalRecordEntryId: string;
  fileUrl: string;
  fileType: AttachmentType;
  label: string | null;
  uploadedByUserId: string;
}

export interface IMedicalRecordRepository {
  createEntry(input: CreateMedicalEntryRepoInput): Promise<string>;

  listEntries(input: {
    tenantId: string;
    petId: string | null;
    type: MedicalEntryType | null;
    limit: number;
    offset: number;
  }): Promise<MedicalEntryListResult>;

  getEntry(tenantId: string, entryId: string): Promise<MedicalEntryDetail | null>;

  addAttachment(input: AddAttachmentRepoInput): Promise<string>;
}
