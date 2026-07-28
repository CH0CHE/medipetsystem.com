"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/api/client";
import type { PurchaseOrderListResult, PurchaseOrderStatus } from "@/modules/purchases/domain/entities";

const currency = (n: number) => `Q${n.toFixed(2)}`;
const PAGE_SIZE = 10;

const STATUS_VARIANT: Record<PurchaseOrderStatus, "success" | "warning" | "destructive" | "secondary"> = {
  RECIBIDA: "success",
  RECIBIDA_PARCIAL: "warning",
  PENDIENTE: "secondary",
  CANCELADA: "destructive",
};

const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  RECIBIDA: "Recibida",
  RECIBIDA_PARCIAL: "Parcial",
  PENDIENTE: "Pendiente",
  CANCELADA: "Cancelada",
};

export function PurchaseOrdersTable() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["purchase-orders", page],
    queryFn: () => apiRequest<PurchaseOrderListResult>(`/api/purchases/orders?page=${page}&pageSize=${PAGE_SIZE}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/dashboard/compras/nueva">
            <Plus className="size-4" /> Nueva orden de compra
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Proveedor</TableHead>
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

            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No se encontraron órdenes de compra.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              data?.items.map((order) => (
                <TableRow key={order.purchaseOrderId}>
                  <TableCell>
                    <Link href={`/dashboard/compras/${order.purchaseOrderId}`} className="hover:underline">
                      <Badge variant="mono">{order.orderNumber}</Badge>
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{order.supplierName}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(order.orderDate).toLocaleDateString("es-GT")}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[order.status]}>{STATUS_LABEL[order.status]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{currency(order.totalCost)}</TableCell>
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
