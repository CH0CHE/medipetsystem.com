"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/api/client";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { OwnerListResult } from "@/modules/owners/domain/entities";

const FINANCIAL_STATUS_LABEL: Record<string, string> = {
  SOLVENTE: "Solvente",
  MOROSO: "Moroso",
  SUSPENDIDO: "Suspendido",
};

const FINANCIAL_STATUS_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  SOLVENTE: "success",
  MOROSO: "warning",
  SUSPENDIDO: "destructive",
};

const PAGE_SIZE = 10;

function buildQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  return search.toString();
}

export function OwnersTable() {
  const [search, setSearch] = useState("");
  const [financialStatus, setFinancialStatus] = useState("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 350);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["owners", debouncedSearch, financialStatus, page],
    queryFn: () =>
      apiRequest<OwnerListResult>(
        `/api/crm/owners?${buildQuery({
          search: debouncedSearch || undefined,
          financialStatus: financialStatus === "all" ? undefined : financialStatus,
          page,
          pageSize: PAGE_SIZE,
        })}`,
      ),
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
              placeholder="Buscar por nombre o documento..."
              className="pl-9"
            />
          </div>
          <Select
            value={financialStatus}
            onValueChange={(v) => {
              setFinancialStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Estado financiero" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="SOLVENTE">Solvente</SelectItem>
              <SelectItem value="MOROSO">Moroso</SelectItem>
              <SelectItem value="SUSPENDIDO">Suspendido</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button asChild>
          <Link href="/dashboard/propietarios/nuevo">
            <Plus className="size-4" /> Nuevo propietario
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Estado financiero</TableHead>
              <TableHead>Mascotas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No se encontraron propietarios con estos filtros.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              data?.items.map((owner) => (
                <TableRow key={owner.ownerId} className="cursor-pointer">
                  <TableCell className="font-medium text-foreground">
                    <Link href={`/dashboard/propietarios/${owner.ownerId}`} className="hover:underline">
                      {owner.fullName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{owner.documentId ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{owner.phone ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={FINANCIAL_STATUS_VARIANT[owner.financialStatus]}>
                      {FINANCIAL_STATUS_LABEL[owner.financialStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell>{owner.petCount}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {data && data.totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {page} de {totalPages} · {data.totalCount} propietarios
            {isFetching && " · actualizando..."}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
