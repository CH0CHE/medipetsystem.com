import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { blogService } from "@/modules/content";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await blogService.getPublishedPostBySlug(slug);
  if (!post) return { title: "Post no encontrado" };
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await blogService.getPublishedPostBySlug(slug);
  if (!post) notFound();

  const paragraphs = post.content.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/blog" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Volver al blog
      </Link>

      {post.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverImageUrl} alt="" className="mb-8 h-72 w-full rounded-xl object-cover" />
      )}

      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{post.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {post.authorName}
        {post.publishedAt && ` · ${new Date(post.publishedAt).toLocaleDateString("es-GT", { year: "numeric", month: "long", day: "numeric" })}`}
      </p>

      <div className="mt-8 space-y-4">
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="leading-relaxed text-foreground/90">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
