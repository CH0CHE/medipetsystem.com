import type { IBlogRepository } from "../domain/repositories";
import type { AdminBlogPostListResult, BlogPostDetail, PublicBlogPostDetail, PublicBlogPostListResult } from "../domain/entities";
import type { ListBlogPostsQuery } from "./dto/list-blog-posts-query.schema";
import type { CreateBlogPostInput } from "./dto/create-blog-post.schema";
import type { UpdateBlogPostInput } from "./dto/update-blog-post.schema";

function emptyToNull(value: string | undefined): string | null {
  return value ? value : null;
}

export class BlogService {
  constructor(private readonly repository: IBlogRepository) {}

  async listAdminPosts(query: ListBlogPostsQuery): Promise<AdminBlogPostListResult> {
    return this.repository.listAdmin({
      status: query.status ?? null,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
  }

  async listPublishedPosts(page: number, pageSize: number): Promise<PublicBlogPostListResult> {
    return this.repository.listPublished({ limit: pageSize, offset: (page - 1) * pageSize });
  }

  async getPost(id: string): Promise<BlogPostDetail | null> {
    return this.repository.get(id);
  }

  async getPublishedPostBySlug(slug: string): Promise<PublicBlogPostDetail | null> {
    return this.repository.getPublishedBySlug(slug);
  }

  async createPost(input: CreateBlogPostInput, actorUserId: string): Promise<string> {
    return this.repository.create({
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      content: input.content,
      coverImageUrl: emptyToNull(input.coverImageUrl),
      status: input.status,
      authorName: input.authorName,
      actorUserId,
    });
  }

  async updatePost(id: string, input: UpdateBlogPostInput, actorUserId: string): Promise<void> {
    await this.repository.update({
      id,
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      content: input.content,
      coverImageUrl: emptyToNull(input.coverImageUrl),
      status: input.status,
      authorName: input.authorName,
      actorUserId,
    });
  }

  async deletePost(id: string, actorUserId: string): Promise<void> {
    await this.repository.delete(id, actorUserId);
  }
}
