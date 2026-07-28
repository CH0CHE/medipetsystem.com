import { z } from "zod";

export const createPetSchema = z.object({
  ownerId: z.string().uuid("Selecciona un propietario."),
  name: z.string().trim().min(1, "El nombre es requerido.").max(100),
  species: z.string().trim().min(1, "La especie es requerida.").max(50),
  breed: z.string().trim().max(100).optional().or(z.literal("")),
  sex: z.enum(["MACHO", "HEMBRA"]).optional(),
  birthDate: z.string().trim().optional().or(z.literal("")),
  weightKg: z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : value),
    z.coerce.number().positive().max(999).optional(),
  ),
  color: z.string().trim().max(50).optional().or(z.literal("")),
  photoUrl: z.string().trim().url("URL inválida.").max(500).optional().or(z.literal("")),
  microchipNumber: z.string().trim().max(50).optional().or(z.literal("")),
});

export type CreatePetInput = z.infer<typeof createPetSchema>;
