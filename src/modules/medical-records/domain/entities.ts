export type MedicalEntryType = "CONSULTA" | "VACUNA" | "CIRUGIA" | "HOSPITALIZACION" | "MEDICAMENTO";
export type AttachmentType = "PDF" | "IMAGEN" | "LABORATORIO";

export interface MedicalEntryListItem {
  entryId: string;
  type: MedicalEntryType;
  entryDate: Date;
  title: string;
  veterinarianId: string;
  veterinarianName: string;
  attachmentCount: number;
  createdAt: Date;
}

export interface MedicalEntryListResult {
  items: MedicalEntryListItem[];
  totalCount: number;
}

export interface AttachmentSummary {
  attachmentId: string;
  fileUrl: string;
  fileType: AttachmentType;
  label: string | null;
  createdAt: Date;
}

export interface MedicalEntryDetail {
  entryId: string;
  petId: string;
  veterinarianId: string;
  veterinarianName: string;
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
  createdAt: Date;
  attachments: AttachmentSummary[];
}
