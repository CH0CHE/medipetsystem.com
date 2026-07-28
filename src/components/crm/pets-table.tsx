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
import type { PetListResult } from "@/modules/pets/domain/entities";

const STATUS_LABEL: Record<string, string> = {
  ACTIVO: "Activo",
  EN_OBSERVACION: "En observación",
  HOSPITALIZADO: "Hospitalizado",
  RECUPERADO: "Recuperado",
  FALLECIDO: "Fallecido",
};

const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  ACTIVO: "success",
  EN_OBSERVACION: "warning",
  HOSPITALIZADO: "destructive",
  RECUPERADO: "secondary",
  FALLECIDO: "destructive",
};

const PAGE_SIZE = 10;

function buildQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  return search.toString();
}

export function PetsTable() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 350);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["pets", debouncedSearch, status, page],
    queryFn: () =>
      apiRequest<PetListResult>(
        `/api/crm/pets?${buildQuery({
          search: debouncedSearch || undefined,
          status: status === "all" ? undefined : status,
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
              placeholder="Buscar por nombre o propietario..."
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
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="ACTIVO">Activo</SelectItem>
              <SelectItem value="EN_OBSERVACION">En observación</SelectItem>
              <SelectItem value="HOSPITALIZADO">Hospitalizado</SelectItem>
              <SelectItem value="RECUPERADO">Recuperado</SelectItem>
              <SelectItem value="FALLECIDO">Fallecido</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button asChild>
          <Link href="/dashboard/pacientes/nuevo">
            <Plus className="size-4" /> Nuevo paciente
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Especie / Raza</TableHead>
              <TableHead>Propietario</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead>Estado</TableHead>
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
                  No se encontraron pacientes con estos filtros.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              data?.items.map((pet) => (
                <TableRow key={pet.petId}>
                  <TableCell className="font-medium text-foreground">
                    <Link href={`/dashboard/pacientes/${pet.petId}`} className="hover:underline">
                      {pet.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {pet.species}
                    {pet.breed ? ` · ${pet.breed}` : ""}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{pet.ownerName}</TableCell>
                  <TableCell className="text-muted-foreground">{pet.branchName}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[pet.status]}>{STATUS_LABEL[pet.status]}</Badge>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {data && data.totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {page} de {totalPages} · {data.totalCount} pacientes
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
