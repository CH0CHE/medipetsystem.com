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
import type { InvoiceListResult, InvoicePaymentStatus } from "@/modules/billing/domain/entities";

const currency = (n: number) => `Q${n.toFixed(2)}`;
const PAGE_SIZE = 10;

const STATUS_VARIANT: Record<InvoicePaymentStatus, "success" | "warning" | "destructive"> = {
  PAGADA: "success",
  PARCIAL: "warning",
  PENDIENTE: "destructive",
};

const STATUS_LABEL: Record<InvoicePaymentStatus, string> = {
  PAGADA: "Pagada",
  PARCIAL: "Parcial",
  PENDIENTE: "Pendiente",
};

export function InvoicesTable() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ["invoices", page],
    queryFn: () => apiRequest<InvoiceListResult>(`/api/billing/invoices?page=${page}&pageSize=${PAGE_SIZE}`),
  });

  const filtered = data?.items.filter((inv) =>
    debouncedSearch
      ? inv.ownerName.toLowerCase().includes(debouncedSearch.toLowerCase()) || inv.invoiceNumber.includes(debouncedSearch)
      : true,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por propietario o número..." className="pl-9" />
        </div>
        <Button asChild>
          <Link href="/dashboard/facturacion/facturas/nueva">
            <Plus className="size-4" /> Nueva factura
          </Link>
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
              <TableHead>Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && filtered?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No se encontraron facturas.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              filtered?.map((invoice) => (
                <TableRow key={invoice.invoiceId}>
                  <TableCell>
                    <Link href={`/dashboard/facturacion/facturas/${invoice.invoiceId}`} className="hover:underline">
                      <Badge variant="mono">{invoice.invoiceNumber}</Badge>
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{invoice.ownerName}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(invoice.issueDate).toLocaleDateString("es-GT")}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[invoice.paymentStatus]}>{STATUS_LABEL[invoice.paymentStatus]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{currency(invoice.total)}</TableCell>
                  <TableCell className={invoice.balanceDue > 0 ? "font-semibold text-destructive" : "text-muted-foreground"}>
                    {currency(invoice.balanceDue)}
                  </TableCell>
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
