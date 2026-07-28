import { prisma } from "@/lib/db/prisma";
import type { IBlogRepository } from "../domain/repositories";
import type {
  AdminBlogPostListItem,
  BlogPostDetail,
  BlogPostStatus,
  PublicBlogPostDetail,
  PublicBlogPostListItem,
} from "../domain/entities";

type AdminListRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string | null;
  status: BlogPostStatus;
  author_name: string;
  published_at: Date | null;
  created_at: Date;
  total_count: bigint;
};

type PublicListRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string | null;
  author_name: string;
  published_at: Date | null;
  total_count: bigint;
};

type DetailRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  status: BlogPostStatus;
  author_name: string;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type PublicDetailRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  author_name: string;
  published_at: Date | null;
};

function mapAdminListRow(row: AdminListRow): AdminBlogPostListItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    coverImageUrl: row.cover_image_url,
    status: row.status,
    authorName: row.author_name,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

function mapPublicListRow(row: PublicListRow): PublicBlogPostListItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    coverImageUrl: row.cover_image_url,
    authorName: row.author_name,
    publishedAt: row.published_at,
  };
}

export const blogRepository: IBlogRepository = {
  async listAdmin({ status, limit, offset }) {
    const rows = await prisma.$queryRaw<AdminListRow[]>`
      SELECT * FROM sp_list_blog_posts(${status}::"BlogPostStatus", ${limit}::int, ${offset}::int)
    `;
    return { items: rows.map(mapAdminListRow), totalCount: rows.length > 0 ? Number(rows[0]!.total_count) : 0 };
  },

  async listPublished({ limit, offset }) {
    const rows = await prisma.$queryRaw<PublicListRow[]>`
      SELECT * FROM sp_list_published_blog_posts(${limit}::int, ${offset}::int)
    `;
    return { items: rows.map(mapPublicListRow), totalCount: rows.length > 0 ? Number(rows[0]!.total_count) : 0 };
  },

  async get(id) {
    const rows = await prisma.$queryRaw<DetailRow[]>`SELECT * FROM sp_get_blog_post(${id}::uuid)`;
    if (rows.length === 0) return null;
    const row = rows[0]!;
    const detail: BlogPostDetail = {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      content: row.content,
      coverImageUrl: row.cover_image_url,
      status: row.status,
      authorName: row.author_name,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    return detail;
  },

  async getPublishedBySlug(slug) {
    const rows = await prisma.$queryRaw<PublicDetailRow[]>`
      SELECT * FROM sp_get_published_blog_post_by_slug(${slug})
    `;
    if (rows.length === 0) return null;
    const row = rows[0]!;
    const detail: PublicBlogPostDetail = {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      content: row.content,
      coverImageUrl: row.cover_image_url,
      authorName: row.author_name,
      publishedAt: row.published_at,
    };
    return detail;
  },

  async create(input) {
    const rows = await prisma.$queryRaw<{ sp_create_blog_post: string }[]>`
      SELECT sp_create_blog_post(
        ${input.title}, ${input.slug}, ${input.excerpt}, ${input.content}, ${input.coverImageUrl},
        ${input.status}::"BlogPostStatus", ${input.authorName}, ${input.actorUserId}::uuid
      ) as sp_create_blog_post
    `;
    return rows[0]!.sp_create_blog_post;
  },

  async update(input) {
    await prisma.$executeRaw`
      SELECT sp_update_blog_post(
        ${input.id}::uuid, ${input.title}, ${input.slug}, ${input.excerpt}, ${input.content}, ${input.coverImageUrl},
        ${input.status}::"BlogPostStatus", ${input.authorName}, ${input.actorUserId}::uuid
      )
    `;
  },

  async delete(id, actorUserId) {
    await prisma.$executeRaw`SELECT sp_delete_blog_post(${id}::uuid, ${actorUserId}::uuid)`;
  },
};
