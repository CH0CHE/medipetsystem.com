import { z } from "zod";

export const purchaseOrderItemSchema = z.object({
  productId: z.string().uuid("Selecciona un producto."),
  description: z.string().trim().min(1, "La descripción es requerida.").max(200),
  quantityOrdered: z.coerce.number().int().positive("La cantidad debe ser mayor a cero."),
  unitCost: z.coerce.number().min(0, "El costo no puede ser negativo."),
});

export type PurchaseOrderItemInput = z.infer<typeof purchaseOrderItemSchema>;
