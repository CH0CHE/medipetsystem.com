import { createSupplierSchema } from "./create-supplier.schema";

export const updateSupplierSchema = createSupplierSchema;

export type UpdateSupplierInput = ReturnType<typeof updateSupplierSchema.parse>;
