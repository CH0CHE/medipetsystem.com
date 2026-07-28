import type { Metadata } from "next";
import { BlogPostsTable } from "@/components/platform-admin/blog-posts-table";

export const metadata: Metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Blog y noticias</h1>
        <p className="text-sm text-muted-foreground">
          Posts publicados en el blog público. Un post publicado también sirve como noticia — no hay un sistema separado.
        </p>
      </div>
      <BlogPostsTable />
    </div>
  );
}
