import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BlogPostForm } from "@/components/platform-admin/blog-post-form";

export const metadata: Metadata = { title: "Nuevo post" };

export default function NuevoBlogPostPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <div>
        <Link
          href="/platform-admin/dashboard/blog"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Volver al blog
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nuevo post</h1>
        <p className="text-sm text-muted-foreground">Publícalo directamente o guárdalo como borrador.</p>
      </div>
      <BlogPostForm />
    </div>
  );
}
