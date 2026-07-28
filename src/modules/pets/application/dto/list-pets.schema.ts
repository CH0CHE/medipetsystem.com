import { z } from "zod";

export const listPetsQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),
  species: z.string().trim().max(50).optional(),
  status: z.enum(["ACTIVO", "EN_OBSERVACION", "HOSPITALIZADO", "RECUPERADO", "FALLECIDO"]).optional(),
  ownerId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListPetsQuery = z.infer<typeof listPetsQuerySchema>;
