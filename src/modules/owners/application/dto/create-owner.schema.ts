import { z } from "zod";

export const createOwnerSchema = z.object({
  fullName: z.string().trim().min(2, "El nombre es muy corto.").max(150),
  documentId: z.string().trim().max(50).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email("Correo inválido.").max(150).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type CreateOwnerInput = z.infer<typeof createOwnerSchema>;
