"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { BlogPostForm } from "@/components/platform-admin/blog-post-form";
import { apiRequest } from "@/lib/api/client";
import type { BlogPostDetail } from "@/modules/content/domain/entities";

const REFRESH_PATH = "/api/platform-admin/auth/refresh";

export default function EditarBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data, isLoading } = useQuery({
    queryKey: ["platform-admin", "content", "blog", id],
    queryFn: () => apiRequest<{ post: BlogPostDetail }>(`/api/platform-admin/content/blog/${id}`, { refreshPath: REFRESH_PATH }),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <div>
        <Link
          href="/platform-admin/dashboard/blog"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Volver al blog
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Editar post</h1>
      </div>
      {isLoading && <Skeleton className="h-96 w-full max-w-3xl rounded-xl" />}
      {data && <BlogPostForm post={data.post} />}
    </div>
  );
}
