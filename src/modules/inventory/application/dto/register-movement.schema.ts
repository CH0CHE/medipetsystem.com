import { z } from "zod";

const entradaSchema = z.object({
  type: z.literal("ENTRADA"),
  // branchId NO viene del cliente: se deriva de ctx.branchId en el servidor
  // (mismo patrón que la creación de pacientes en Fase 2).
  batchNumber: z.string().trim().min(1, "El número de lote es requerido.").max(50),
  expirationDate: z.string().trim().optional().or(z.literal("")),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a cero."),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

const salidaSchema = z.object({
  type: z.literal("SALIDA"),
  batchId: z.string().uuid(),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a cero."),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

const ajusteSchema = z.object({
  type: z.literal("AJUSTE"),
  batchId: z.string().uuid(),
  newQuantity: z.coerce.number().int().min(0, "La existencia no puede ser negativa."),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

const transferenciaSchema = z.object({
  type: z.literal("TRANSFERENCIA"),
  batchId: z.string().uuid(),
  targetBranchId: z.string().uuid(),
  quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a cero."),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const registerMovementSchema = z.discriminatedUnion("type", [
  entradaSchema,
  salidaSchema,
  ajusteSchema,
  transferenciaSchema,
]);

export type RegisterMovementInput = z.infer<typeof registerMovementSchema>;
