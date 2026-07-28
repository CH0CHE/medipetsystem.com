"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, MoreHorizontal, Ban, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { TenantListItem, TenantListResult } from "@/modules/platform-admin/domain/entities";

const PLAN_LABEL: Record<string, string> = { BASIC: "Básico", PRO: "Pro", ENTERPRISE: "Enterprise" };
const PAGE_SIZE = 10;

function buildQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  return search.toString();
}

export function TenantsTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pendingAction, setPendingAction] = useState<{ tenant: TenantListItem; type: "suspend" | "reactivate" } | null>(
    null,
  );
  const [reason, setReason] = useState("");

  const debouncedSearch = useDebouncedValue(search, 350);
  const queryClient = useQueryClient();

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["platform-admin", "tenants", debouncedSearch, status, page],
    queryFn: () =>
      apiRequest<TenantListResult>(
        `/api/platform-admin/tenants?${buildQuery({
          search: debouncedSearch || undefined,
          status: status === "all" ? undefined : status,
          page,
          pageSize: PAGE_SIZE,
        })}`,
        { refreshPath: "/api/platform-admin/auth/refresh" },
      ),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!pendingAction) return;
      const path = `/api/platform-admin/tenants/${pendingAction.tenant.tenantId}/${pendingAction.type}`;
      await apiRequest(path, {
        method: "POST",
        body: pendingAction.type === "suspend" ? { reason } : undefined,
        refreshPath: "/api/platform-admin/auth/refresh",
      });
    },
    onSuccess: () => {
      toast.success(
        pendingAction?.type === "suspend" ? "Clínica suspendida." : "Clínica reactivada.",
      );
      queryClient.invalidateQueries({ queryKey: ["platform-admin", "tenants"] });
      setPendingAction(null);
      setReason("");
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "No se pudo completar la acción.");
    },
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / PAGE_SIZE)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre o código..."
              className="pl-9"
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="ACTIVE">Activas</SelectItem>
              <SelectItem value="SUSPENDED">Suspendidas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button asChild>
          <Link href="/platform-admin/dashboard/clientes/nuevo">
            <Plus className="size-4" /> Crear cliente
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Sucursales</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No se encontraron clínicas con estos filtros.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              data?.items.map((tenant) => (
                <TableRow key={tenant.tenantId}>
                  <TableCell>
                    <Badge variant="mono">{tenant.tenantCode}</Badge>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{tenant.name}</TableCell>
                  <TableCell>{PLAN_LABEL[tenant.plan] ?? tenant.plan}</TableCell>
                  <TableCell>{tenant.branchCount}</TableCell>
                  <TableCell>
                    <Badge variant={tenant.status === "ACTIVE" ? "success" : "destructive"}>
                      {tenant.status === "ACTIVE" ? "Activa" : "Suspendida"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(tenant.createdAt).toLocaleDateString("es-GT")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {tenant.status === "ACTIVE" ? (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setPendingAction({ tenant, type: "suspend" })}
                          >
                            <Ban className="mr-2 size-4" /> Suspender
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => setPendingAction({ tenant, type: "reactivate" })}>
                            <RotateCcw className="mr-2 size-4" /> Reactivar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {data && data.totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {page} de {totalPages} · {data.totalCount} clínicas
            {isFetching && " · actualizando..."}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.type === "suspend" ? "Suspender clínica" : "Reactivar clínica"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.type === "suspend"
                ? `Los usuarios de "${pendingAction?.tenant.name}" no podrán iniciar sesión hasta reactivarla.`
                : `Los usuarios de "${pendingAction?.tenant.name}" podrán volver a iniciar sesión.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pendingAction?.type === "suspend" && (
            <div className="space-y-2">
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Motivo de la suspensión (mínimo 3 caracteres)"
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={mutation.isPending || (pendingAction?.type === "suspend" && reason.trim().length < 3)}
              onClick={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
            >
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
