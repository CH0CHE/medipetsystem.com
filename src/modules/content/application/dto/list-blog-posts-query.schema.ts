import { z } from "zod";

export const listBlogPostsQuerySchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListBlogPostsQuery = z.infer<typeof listBlogPostsQuerySchema>;
