import { z } from "zod";

const baseFields = {
  entryDate: z.string().trim().min(1, "La fecha es requerida."),
  title: z.string().trim().min(1, "El título es requerido.").max(150),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
};

const consultaSchema = z.object({
  type: z.literal("CONSULTA"),
  ...baseFields,
  symptoms: z.string().trim().max(1000).optional().or(z.literal("")),
  diagnosis: z.string().trim().min(1, "El diagnóstico es requerido.").max(1000),
  treatment: z.string().trim().max(1000).optional().or(z.literal("")),
});

const vacunaSchema = z.object({
  type: z.literal("VACUNA"),
  ...baseFields,
  vaccineName: z.string().trim().min(1, "El nombre de la vacuna es requerido.").max(150),
  nextDueDate: z.string().trim().optional().or(z.literal("")),
});

const cirugiaSchema = z.object({
  type: z.literal("CIRUGIA"),
  ...baseFields,
  procedureName: z.string().trim().min(1, "El procedimiento es requerido.").max(150),
  outcome: z.string().trim().max(1000).optional().or(z.literal("")),
});

const hospitalizacionSchema = z.object({
  type: z.literal("HOSPITALIZACION"),
  ...baseFields,
  admissionDate: z.string().trim().min(1, "La fecha de ingreso es requerida."),
  dischargeDate: z.string().trim().optional().or(z.literal("")),
});

const medicamentoSchema = z.object({
  type: z.literal("MEDICAMENTO"),
  ...baseFields,
  medicationName: z.string().trim().min(1, "El nombre del medicamento es requerido.").max(150),
  dosage: z.string().trim().max(100).optional().or(z.literal("")),
  frequency: z.string().trim().max(100).optional().or(z.literal("")),
  startDate: z.string().trim().optional().or(z.literal("")),
  endDate: z.string().trim().optional().or(z.literal("")),
});

export const createMedicalEntrySchema = z.discriminatedUnion("type", [
  consultaSchema,
  vacunaSchema,
  cirugiaSchema,
  hospitalizacionSchema,
  medicamentoSchema,
]);

export type CreateMedicalEntryInput = z.infer<typeof createMedicalEntrySchema>;
