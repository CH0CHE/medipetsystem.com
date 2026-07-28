import { z } from "zod";
import { createOwnerSchema } from "./create-owner.schema";

export const updateOwnerSchema = createOwnerSchema.extend({
  financialStatus: z.enum(["SOLVENTE", "MOROSO", "SUSPENDIDO"]),
});

export type UpdateOwnerInput = z.infer<typeof updateOwnerSchema>;
