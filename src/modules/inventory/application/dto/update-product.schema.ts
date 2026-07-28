import { z } from "zod";

export const updateProductSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido.").max(150),
  category: z.string().trim().max(100).optional().or(z.literal("")),
  costPrice: z.coerce.number().min(0, "El costo no puede ser negativo."),
  salePrice: z.coerce.number().min(0, "El precio no puede ser negativo."),
  minStock: z.coerce.number().int().min(0),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
