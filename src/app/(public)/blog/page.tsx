"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { PublicBlogPostListResult } from "@/modules/content/domain/entities";

const PAGE_SIZE = 9;

export default function BlogListPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["public", "blog", page],
    queryFn: async () => {
      const res = await fetch(`/api/public/blog?page=${page}&pageSize=${PAGE_SIZE}`);
      if (!res.ok) throw new Error("No se pudo cargar el blog.");
      return (await res.json()) as PublicBlogPostListResult;
    },
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE)) : 1;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Blog y noticias</h1>
        <p className="mt-3 text-muted-foreground">Novedades del producto, guías y buenas prácticas para tu clínica.</p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-xl" />)}

        {!isLoading && data?.items.length === 0 && (
          <p className="col-span-full py-10 text-center text-muted-foreground">Aún no hay posts publicados.</p>
        )}

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

      {data && data.totalCount > PAGE_SIZE && (
        <div className="mt-10 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
