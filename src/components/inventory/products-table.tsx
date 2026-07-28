"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/api/client";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import type { ProductListResult } from "@/modules/inventory/domain/entities";

const PAGE_SIZE = 10;
const currency = (n: number) => `Q${n.toFixed(2)}`;

function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== false) search.set(key, String(value));
  });
  return search.toString();
}

export function ProductsTable() {
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 350);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["products", debouncedSearch, lowStockOnly, page],
    queryFn: () =>
      apiRequest<ProductListResult>(
        `/api/inventory/products?${buildQuery({
          search: debouncedSearch || undefined,
          lowStockOnly,
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
              placeholder="Buscar por nombre o SKU..."
              className="pl-9"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="size-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
              checked={lowStockOnly}
              onChange={(e) => {
                setLowStockOnly(e.target.checked);
                setPage(1);
              }}
            />
            Solo existencia baja
          </label>
        </div>
        <Button asChild>
          <Link href="/dashboard/inventario/nuevo">
            <Plus className="size-4" /> Nuevo producto
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Existencia</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>Precio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No se encontraron productos con estos filtros.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              data?.items.map((product) => {
                const isLow = product.totalStock < product.minStock;
                return (
                  <TableRow key={product.productId}>
                    <TableCell>
                      <Badge variant="mono">{product.sku}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <Link href={`/dashboard/inventario/${product.productId}`} className="hover:underline">
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{product.category ?? "—"}</TableCell>
                    <TableCell>
                      <span className={cn(isLow && "font-semibold text-destructive")}>{product.totalStock}</span>
                      {isLow && (
                        <Badge variant="destructive" className="ml-2">
                          Bajo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{currency(product.costPrice)}</TableCell>
                    <TableCell className="text-muted-foreground">{currency(product.salePrice)}</TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>

      {data && data.totalCount > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {page} de {totalPages} · {data.totalCount} productos
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
