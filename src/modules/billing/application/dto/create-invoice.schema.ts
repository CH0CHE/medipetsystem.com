import { z } from "zod";
import { documentItemSchema } from "./document-item.schema";

export const createInvoiceSchema = z.object({
  ownerId: z.string().uuid("Selecciona un propietario."),
  issueDate: z.string().trim().min(1, "La fecha es requerida."),
  items: z.array(documentItemSchema).min(1, "Agrega al menos una línea."),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
