import { PlansService } from "./application/plans.service";
import { BlogService } from "./application/blog.service";
import { FaqService } from "./application/faq.service";
import { plansRepository } from "./infrastructure/plans.repository";
import { blogRepository } from "./infrastructure/blog.repository";
import { faqRepository } from "./infrastructure/faq.repository";

export const plansService = new PlansService(plansRepository);
export const blogService = new BlogService(blogRepository);
export const faqService = new FaqService(faqRepository);

export * from "./domain/entities";
export * from "./domain/permissions";
export { updateMarketingPlanSchema, type UpdateMarketingPlanInput } from "./application/dto/update-marketing-plan.schema";
export { createBlogPostSchema, type CreateBlogPostInput } from "./application/dto/create-blog-post.schema";
export { updateBlogPostSchema, type UpdateBlogPostInput } from "./application/dto/update-blog-post.schema";
export { listBlogPostsQuerySchema, type ListBlogPostsQuery } from "./application/dto/list-blog-posts-query.schema";
export { createFaqSchema, type CreateFaqInput } from "./application/dto/create-faq.schema";
export { updateFaqSchema, type UpdateFaqInput } from "./application/dto/update-faq.schema";
