"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PublicBlogPostListResult } from "@/modules/content/domain/entities";

export function BlogPreview() {
  const { data, isLoading } = useQuery({
    queryKey: ["public", "blog", "preview"],
    queryFn: async () => {
      const res = await fetch("/api/public/blog?pageSize=3");
      if (!res.ok) throw new Error("No se pudo cargar el blog.");
      return (await res.json()) as PublicBlogPostListResult;
    },
  });

  if (!isLoading && data?.items.length === 0) return null;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {isLoading &&
        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-xl" />)}

      {!isLoading &&
        data?.items.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              {post.coverImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.coverImageUrl} alt="" className="h-40 w-full rounded-t-xl object-cover" />
              )}
              <CardHeader>
                <CardTitle className="text-base">{post.title}</CardTitle>
                <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
              </CardHeader>
              <CardContent>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Leer más <ArrowRight className="size-3.5" />
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
    </div>
  );
}
