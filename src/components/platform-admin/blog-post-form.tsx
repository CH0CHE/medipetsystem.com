"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, ApiClientError } from "@/lib/api/client";
import { createBlogPostSchema, type CreateBlogPostInput } from "@/modules/content/application/dto/create-blog-post.schema";
import type { BlogPostDetail } from "@/modules/content/domain/entities";

const REFRESH_PATH = "/api/platform-admin/auth/refresh";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function BlogPostForm({ post }: { post?: BlogPostDetail }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(!!post);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateBlogPostInput>({
    resolver: zodResolver(createBlogPostSchema),
    defaultValues: {
      title: post?.title ?? "",
      slug: post?.slug ?? "",
      excerpt: post?.excerpt ?? "",
      content: post?.content ?? "",
      coverImageUrl: post?.coverImageUrl ?? "",
      status: post?.status ?? "DRAFT",
      authorName: post?.authorName ?? "",
    },
  });

  const status = watch("status");

  const onSubmit = async (values: CreateBlogPostInput) => {
    setServerError(null);
    try {
      if (post) {
        await apiRequest(`/api/platform-admin/content/blog/${post.id}`, {
          method: "PATCH",
          body: values,
          refreshPath: REFRESH_PATH,
        });
        toast.success("Post actualizado.");
      } else {
        await apiRequest("/api/platform-admin/content/blog", { method: "POST", body: values, refreshPath: REFRESH_PATH });
        toast.success("Post creado.");
      }
      router.push("/platform-admin/dashboard/blog");
      router.refresh();
    } catch (error) {
      setServerError(error instanceof ApiClientError ? error.message : "No se pudo guardar el post.");
    }
  };

  return (
    <Card className="max-w-3xl">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              {...register("title", {
                onChange: (e) => {
                  if (!slugTouched) setValue("slug", slugify(e.target.value));
                },
              })}
            />
            {errors.title && <p className="text-xs font-medium text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug (URL)</Label>
            <Input
              id="slug"
              {...register("slug", { onChange: () => setSlugTouched(true) })}
            />
            {errors.slug && <p className="text-xs font-medium text-destructive">{errors.slug.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="excerpt">Resumen</Label>
            <Textarea id="excerpt" rows={2} {...register("excerpt")} />
            {errors.excerpt && <p className="text-xs font-medium text-destructive">{errors.excerpt.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="content">Contenido</Label>
            <Textarea id="content" rows={10} {...register("content")} />
            <p className="text-xs text-muted-foreground">Los párrafos se separan dejando una línea en blanco entre ellos.</p>
            {errors.content && <p className="text-xs font-medium text-destructive">{errors.content.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coverImageUrl">URL de imagen de portada (opcional)</Label>
            <Input id="coverImageUrl" placeholder="https://..." {...register("coverImageUrl")} />
            {errors.coverImageUrl && <p className="text-xs font-medium text-destructive">{errors.coverImageUrl.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="authorName">Autor</Label>
              <Input id="authorName" {...register("authorName")} />
              {errors.authorName && <p className="text-xs font-medium text-destructive">{errors.authorName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Estado</Label>
              <Select value={status} onValueChange={(v) => setValue("status", v as CreateBlogPostInput["status"])}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Borrador</SelectItem>
                  <SelectItem value="PUBLISHED">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 animate-spin" />}
            {post ? "Guardar cambios" : "Crear post"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
