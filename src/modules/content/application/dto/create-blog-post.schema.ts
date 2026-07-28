import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createBlogPostSchema = z.object({
  title: z.string().trim().min(1, "El título es requerido.").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "El slug es requerido.")
    .max(200)
    .regex(slugPattern, "El slug solo puede contener minúsculas, números y guiones."),
  excerpt: z.string().trim().min(1, "El resumen es requerido.").max(300),
  content: z.string().trim().min(1, "El contenido es requerido.").max(20000),
  coverImageUrl: z
    .string()
    .trim()
    .url("URL inválida.")
    .max(500)
    .refine((v) => /^https?:\/\//i.test(v), "La URL debe usar http o https.")
    .optional()
    .or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  authorName: z.string().trim().min(1, "El autor es requerido.").max(120),
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
