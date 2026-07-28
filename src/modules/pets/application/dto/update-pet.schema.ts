import { z } from "zod";
import { createPetSchema } from "./create-pet.schema";

export const updatePetSchema = createPetSchema.omit({ ownerId: true }).extend({
  status: z.enum(["ACTIVO", "EN_OBSERVACION", "HOSPITALIZADO", "RECUPERADO", "FALLECIDO"]),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type UpdatePetInput = z.infer<typeof updatePetSchema>;
