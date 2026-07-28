import { MedicalRecordService } from "./application/medical-record.service";
import { medicalRecordRepository } from "./infrastructure/medical-record.repository";

export const medicalRecordService = new MedicalRecordService(medicalRecordRepository);

export * from "./domain/entities";
export * from "./domain/permissions";
export { createMedicalEntrySchema, type CreateMedicalEntryInput } from "./application/dto/create-entry.schema";
export { listMedicalEntriesQuerySchema, type ListMedicalEntriesQuery } from "./application/dto/list-entries.schema";
export { addAttachmentSchema, type AddAttachmentInput } from "./application/dto/add-attachment.schema";
