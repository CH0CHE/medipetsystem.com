import { z } from "zod";
import { purchaseOrderItemSchema } from "./purchase-order-item.schema";

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid("Selecciona un proveedor."),
  orderDate: z.string().trim().min(1, "La fecha es requerida."),
  items: z.array(purchaseOrderItemSchema).min(1, "Agrega al menos una línea."),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
