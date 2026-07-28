import { z } from "zod";

export const listMedicalEntriesQuerySchema = z.object({
  petId: z.string().uuid().optional(),
  type: z.enum(["CONSULTA", "VACUNA", "CIRUGIA", "HOSPITALIZACION", "MEDICAMENTO"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListMedicalEntriesQuery = z.infer<typeof listMedicalEntriesQuerySchema>;
