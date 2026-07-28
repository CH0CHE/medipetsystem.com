"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/api/client";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { QuoteListResult } from "@/modules/billing/domain/entities";

const currency = (n: number) => `Q${n.toFixed(2)}`;
const PAGE_SIZE = 10;

export function QuotesTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ["quotes", debouncedSearch, page],
    queryFn: () => apiRequest<QuoteListResult>(`/api/billing/quotes?page=${page}&pageSize=${PAGE_SIZE}`),
  });

  const filtered = data?.items.filter((q) =>
    debouncedSearch ? q.ownerName.toLowerCase().includes(debouncedSearch.toLowerCase()) || q.quoteNumber.includes(debouncedSearch) : true,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por propietario o número..." className="pl-9" />
        </div>
        <Button asChild>
          <a href="/dashboard/facturacion/cotizaciones/nueva">
            <Plus className="size-4" /> Nueva cotización
          </a>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Propietario</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && filtered?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No se encontraron cotizaciones.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              filtered?.map((quote) => (
                <TableRow key={quote.quoteId}>
                  <TableCell>
                    <Badge variant="mono">{quote.quoteNumber}</Badge>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{quote.ownerName}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(quote.issueDate).toLocaleDateString("es-GT")}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{quote.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{currency(quote.total)}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {data && data.totalCount > PAGE_SIZE && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <Button variant="outline" size="sm" disabled={page * PAGE_SIZE >= data.totalCount} onClick={() => setPage((p) => p + 1)}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
