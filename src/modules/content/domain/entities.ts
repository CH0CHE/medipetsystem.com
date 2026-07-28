export type MarketingPlanKey = "BASIC" | "PRO" | "ENTERPRISE";
export type BlogPostStatus = "DRAFT" | "PUBLISHED";

export interface MarketingPlan {
  id: string;
  planKey: MarketingPlanKey;
  name: string;
  price: number;
  billingPeriod: string;
  description: string;
  features: string[];
  highlighted: boolean;
  displayOrder: number;
  updatedAt: Date;
}

export interface AdminBlogPostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  status: BlogPostStatus;
  authorName: string;
  publishedAt: Date | null;
  createdAt: Date;
}

export interface AdminBlogPostListResult {
  items: AdminBlogPostListItem[];
  totalCount: number;
}

export interface PublicBlogPostListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  authorName: string;
  publishedAt: Date | null;
}

export interface PublicBlogPostListResult {
  items: PublicBlogPostListItem[];
  totalCount: number;
}

export interface BlogPostDetail {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  status: BlogPostStatus;
  authorName: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicBlogPostDetail {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  authorName: string;
  publishedAt: Date | null;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  displayOrder: number;
  isPublished: boolean;
  updatedAt: Date;
}
