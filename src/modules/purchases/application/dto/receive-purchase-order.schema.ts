import { z } from "zod";

export const receivePurchaseOrderItemSchema = z.object({
  purchaseOrderItemId: z.string().uuid(),
  quantityReceived: z.coerce.number().int().positive("La cantidad a recibir debe ser mayor a cero."),
  batchNumber: z.string().trim().min(1, "El número de lote es requerido.").max(60),
  expirationDate: z.string().trim().optional().or(z.literal("")),
});

export const receivePurchaseOrderSchema = z.object({
  items: z.array(receivePurchaseOrderItemSchema).min(1, "Agrega al menos una línea a recibir."),
});

export type ReceivePurchaseOrderInput = z.infer<typeof receivePurchaseOrderSchema>;
