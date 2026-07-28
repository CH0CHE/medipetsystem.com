import { z } from "zod";
import { documentItemSchema } from "./document-item.schema";

export const createQuoteSchema = z.object({
  ownerId: z.string().uuid("Selecciona un propietario."),
  issueDate: z.string().trim().min(1, "La fecha es requerida."),
  expiryDate: z.string().trim().optional().or(z.literal("")),
  items: z.array(documentItemSchema).min(1, "Agrega al menos una línea."),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
