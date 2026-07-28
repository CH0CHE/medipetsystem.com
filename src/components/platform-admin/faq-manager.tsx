"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { createFaqSchema, type CreateFaqInput } from "@/modules/content/application/dto/create-faq.schema";
import type { FaqItem } from "@/modules/content/domain/entities";

const REFRESH_PATH = "/api/platform-admin/auth/refresh";
const QUERY_KEY = ["platform-admin", "content", "faqs"];

export function FaqManager() {
  const [editing, setEditing] = useState<FaqItem | "new" | null>(null);
  const [deleting, setDeleting] = useState<FaqItem | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiRequest<{ faqs: FaqItem[] }>("/api/platform-admin/content/faqs", { refreshPath: REFRESH_PATH }),
  });

  const deleteMutation = useMutation({
    mutationFn: (faq: FaqItem) =>
      apiRequest(`/api/platform-admin/content/faqs/${faq.id}`, { method: "DELETE", refreshPath: REFRESH_PATH }),
    onSuccess: () => {
      toast.success("Pregunta eliminada.");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setDeleting(null);
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "No se pudo eliminar.");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditing("new")}>
          <Plus className="size-4" /> Nueva pregunta
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Orden</TableHead>
              <TableHead>Pregunta</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-32" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && data?.faqs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  Aún no hay preguntas frecuentes.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              data?.faqs.map((faq) => (
                <TableRow key={faq.id}>
                  <TableCell className="text-muted-foreground">{faq.displayOrder}</TableCell>
                  <TableCell className="max-w-md font-medium text-foreground">{faq.question}</TableCell>
                  <TableCell>
                    <Badge variant={faq.isPublished ? "success" : "outline"}>
                      {faq.isPublished ? "Publicada" : "Oculta"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(faq)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(faq)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          {editing && (
            <FaqForm
              faq={editing === "new" ? null : editing}
              onSaved={() => {
                queryClient.invalidateQueries({ queryKey: QUERY_KEY });
                setEditing(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar pregunta frecuente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La pregunta &quot;{deleting?.question}&quot; dejará de mostrarse en el sitio público.
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

function FaqForm({ faq, onSaved }: { faq: FaqItem | null; onSaved: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateFaqInput>({
    resolver: zodResolver(createFaqSchema),
    defaultValues: {
      question: faq?.question ?? "",
      answer: faq?.answer ?? "",
      displayOrder: faq?.displayOrder ?? 0,
      isPublished: faq?.isPublished ?? true,
    },
  });

  const isPublished = watch("isPublished");

  const mutation = useMutation({
    mutationFn: (values: CreateFaqInput) =>
      faq
        ? apiRequest(`/api/platform-admin/content/faqs/${faq.id}`, { method: "PATCH", body: values, refreshPath: REFRESH_PATH })
        : apiRequest("/api/platform-admin/content/faqs", { method: "POST", body: values, refreshPath: REFRESH_PATH }),
    onSuccess: () => {
      toast.success(faq ? "Pregunta actualizada." : "Pregunta creada.");
      onSaved();
    },
    onError: (error) => {
      setServerError(error instanceof ApiClientError ? error.message : "No se pudo guardar la pregunta.");
    },
  });

  return (
    <form
      onSubmit={handleSubmit((values) => {
        setServerError(null);
        mutation.mutate(values);
      })}
      className="space-y-4"
      noValidate
    >
      <DialogHeader>
        <DialogTitle>{faq ? "Editar pregunta" : "Nueva pregunta frecuente"}</DialogTitle>
        <DialogDescription>Se muestra en la sección de FAQ del sitio público cuando está publicada.</DialogDescription>
      </DialogHeader>

      {serverError && <p className="text-sm font-medium text-destructive">{serverError}</p>}

      <div className="space-y-1.5">
        <Label htmlFor="question">Pregunta</Label>
        <Input id="question" {...register("question")} />
        {errors.question && <p className="text-xs text-destructive">{errors.question.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="answer">Respuesta</Label>
        <Textarea id="answer" rows={4} {...register("answer")} />
        {errors.answer && <p className="text-xs text-destructive">{errors.answer.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="displayOrder">Orden</Label>
        <Input id="displayOrder" type="number" {...register("displayOrder")} />
        {errors.displayOrder && <p className="text-xs text-destructive">{errors.displayOrder.message}</p>}
      </div>

      <div className="flex items-center gap-2">
        <Switch id="isPublished" checked={isPublished} onCheckedChange={(v) => setValue("isPublished", v)} />
        <Label htmlFor="isPublished">Publicada</Label>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting || mutation.isPending}>
          {(isSubmitting || mutation.isPending) && <Loader2 className="size-4 animate-spin" />}
          Guardar
        </Button>
      </DialogFooter>
    </form>
  );
}
