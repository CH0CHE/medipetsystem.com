"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/api/client";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { SupplierListResult } from "@/modules/purchases/domain/entities";

const PAGE_SIZE = 10;

export function SuppliersTable() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ["suppliers", debouncedSearch],
    queryFn: () =>
      apiRequest<SupplierListResult>(
        `/api/purchases/suppliers?search=${encodeURIComponent(debouncedSearch)}&pageSize=${PAGE_SIZE}`,
      ),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o NIT..."
            className="pl-9"
          />
        </div>
        <Button asChild>
          <Link href="/dashboard/compras/proveedores/nuevo">
            <Plus className="size-4" /> Nuevo proveedor
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>NIT / DPI</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Correo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  No se encontraron proveedores.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              data?.items.map((supplier) => (
                <TableRow key={supplier.supplierId}>
                  <TableCell className="font-medium text-foreground">{supplier.name}</TableCell>
                  <TableCell className="text-muted-foreground">{supplier.taxId ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{supplier.phone ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{supplier.email ?? "—"}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
