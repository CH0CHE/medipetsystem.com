import { createFaqSchema } from "./create-faq.schema";

export const updateFaqSchema = createFaqSchema;

export type UpdateFaqInput = ReturnType<typeof updateFaqSchema.parse>;
