import { z } from "zod";

export const createFaqSchema = z.object({
  question: z.string().trim().min(1, "La pregunta es requerida.").max(300),
  answer: z.string().trim().min(1, "La respuesta es requerida.").max(2000),
  displayOrder: z.coerce.number().int().min(0).max(1000),
  isPublished: z.boolean(),
});

export type CreateFaqInput = z.infer<typeof createFaqSchema>;
