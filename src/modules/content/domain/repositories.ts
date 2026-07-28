import type {
  AdminBlogPostListResult,
  BlogPostDetail,
  BlogPostStatus,
  FaqItem,
  MarketingPlan,
  PublicBlogPostDetail,
  PublicBlogPostListResult,
} from "./entities";

export interface IPlansRepository {
  list(): Promise<MarketingPlan[]>;
  update(input: {
    id: string;
    name: string;
    price: number;
    billingPeriod: string;
    description: string;
    features: string[];
    highlighted: boolean;
    actorUserId: string;
  }): Promise<void>;
}

export interface IBlogRepository {
  listAdmin(input: { status: BlogPostStatus | null; limit: number; offset: number }): Promise<AdminBlogPostListResult>;
  listPublished(input: { limit: number; offset: number }): Promise<PublicBlogPostListResult>;
  get(id: string): Promise<BlogPostDetail | null>;
  getPublishedBySlug(slug: string): Promise<PublicBlogPostDetail | null>;
  create(input: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImageUrl: string | null;
    status: BlogPostStatus;
    authorName: string;
    actorUserId: string;
  }): Promise<string>;
  update(input: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImageUrl: string | null;
    status: BlogPostStatus;
    authorName: string;
    actorUserId: string;
  }): Promise<void>;
  delete(id: string, actorUserId: string): Promise<void>;
}

export interface IFaqRepository {
  list(publishedOnly: boolean): Promise<FaqItem[]>;
  create(input: {
    question: string;
    answer: string;
    displayOrder: number;
    isPublished: boolean;
    actorUserId: string;
  }): Promise<string>;
  update(input: {
    id: string;
    question: string;
    answer: string;
    displayOrder: number;
    isPublished: boolean;
    actorUserId: string;
  }): Promise<void>;
  delete(id: string, actorUserId: string): Promise<void>;
}
