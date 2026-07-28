"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest, ApiClientError } from "@/lib/api/client";
import type { AdminBlogPostListItem, AdminBlogPostListResult } from "@/modules/content/domain/entities";

const REFRESH_PATH = "/api/platform-admin/auth/refresh";
const STATUS_LABEL: Record<string, string> = { DRAFT: "Borrador", PUBLISHED: "Publicado" };

export function BlogPostsTable() {
  const [status, setStatus] = useState<string>("all");
  const [deleting, setDeleting] = useState<AdminBlogPostListItem | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["platform-admin", "content", "blog", status],
    queryFn: () =>
      apiRequest<AdminBlogPostListResult>(
        `/api/platform-admin/content/blog?pageSize=50${status !== "all" ? `&status=${status}` : ""}`,
        { refreshPath: REFRESH_PATH },
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (post: AdminBlogPostListItem) =>
      apiRequest(`/api/platform-admin/content/blog/${post.id}`, { method: "DELETE", refreshPath: REFRESH_PATH }),
    onSuccess: () => {
      toast.success("Post eliminado.");
      queryClient.invalidateQueries({ queryKey: ["platform-admin", "content", "blog"] });
      setDeleting(null);
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "No se pudo eliminar el post.");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="DRAFT">Borradores</SelectItem>
            <SelectItem value="PUBLISHED">Publicados</SelectItem>
          </SelectContent>
        </Select>
        <Button asChild>
          <Link href="/platform-admin/dashboard/blog/nuevo">
            <Plus className="size-4" /> Nuevo post
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Publicado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Aún no hay posts de blog.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              data?.items.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="max-w-sm font-medium text-foreground">
                    <Link href={`/platform-admin/dashboard/blog/${post.id}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{post.authorName}</TableCell>
                  <TableCell>
                    <Badge variant={post.status === "PUBLISHED" ? "success" : "outline"}>
                      {STATUS_LABEL[post.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("es-GT") : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/platform-admin/dashboard/blog/${post.id}`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(post)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar post</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. &quot;{deleting?.title}&quot; se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (deleting) deleteMutation.mutate(deleting);
              }}
            >
              {deleteMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
