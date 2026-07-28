import { z } from "zod";

export const createProductSchema = z.object({
  sku: z.string().trim().min(1, "El SKU es requerido.").max(50),
  internalCode: z.string().trim().max(50).optional().or(z.literal("")),
  name: z.string().trim().min(1, "El nombre es requerido.").max(150),
  category: z.string().trim().max(100).optional().or(z.literal("")),
  costPrice: z.coerce.number().min(0, "El costo no puede ser negativo."),
  salePrice: z.coerce.number().min(0, "El precio no puede ser negativo."),
  minStock: z.coerce.number().int().min(0).default(0),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
