import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido.").max(150),
  taxId: z.string().trim().max(30).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email("Correo inválido.").max(150).optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
