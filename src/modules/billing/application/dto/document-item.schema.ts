import { z } from "zod";

export const documentItemSchema = z.object({
  productId: z.string().uuid("Selecciona un producto."),
  description: z.string().trim().min(1, "La descripción es requerida.").max(200),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a cero."),
  unitPrice: z.coerce.number().min(0, "El precio no puede ser negativo."),
});

export type DocumentItemInput = z.infer<typeof documentItemSchema>;
