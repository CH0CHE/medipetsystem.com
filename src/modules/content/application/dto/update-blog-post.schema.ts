import { createBlogPostSchema } from "./create-blog-post.schema";

export const updateBlogPostSchema = createBlogPostSchema;

export type UpdateBlogPostInput = ReturnType<typeof updateBlogPostSchema.parse>;
