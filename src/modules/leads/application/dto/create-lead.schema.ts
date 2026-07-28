import { z } from "zod";

export const createLeadSchema = z.object({
  fullName: z.string().trim().min(1, "El nombre es requerido.").max(150),
  email: z.string().trim().min(1, "El correo es requerido.").max(200).email("Correo inválido."),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  clinicName: z.string().trim().max(150).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  source: z.enum(["CONTACTO", "DEMO"]),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
