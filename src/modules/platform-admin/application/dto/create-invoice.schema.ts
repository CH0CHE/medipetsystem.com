import { z } from "zod";

export const createInvoiceSchema = z.object({
  period: z.string().trim().regex(/^\d{4}-\d{2}$/, "Formato de período inválido (usa YYYY-MM)."),
  amount: z.coerce.number().positive("El monto debe ser mayor a cero."),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
