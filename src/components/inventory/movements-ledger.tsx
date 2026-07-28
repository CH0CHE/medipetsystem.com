"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/api/client";
import type { MovementListResult, MovementType } from "@/modules/inventory/domain/entities";

const TYPE_LABEL: Record<MovementType, string> = {
  ENTRADA: "Entrada",
  SALIDA: "Salida",
  AJUSTE: "Ajuste",
  TRANSFERENCIA: "Transferencia",
};

const TYPE_VARIANT: Record<MovementType, "success" | "destructive" | "secondary" | "warning"> = {
  ENTRADA: "success",
  SALIDA: "destructive",
  AJUSTE: "secondary",
  TRANSFERENCIA: "warning",
};

export function MovementsLedger({ productId }: { productId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["movements", productId],
    queryFn: () => apiRequest<MovementListResult>(`/api/inventory/products/${productId}/movements?pageSize=50`),
  });

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (!data || data.items.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no hay movimientos registrados.</p>;
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Sucursal</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead>Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((m) => (
            <TableRow key={m.movementId}>
              <TableCell>
                <Badge variant={TYPE_VARIANT[m.type]}>{TYPE_LABEL[m.type]}</Badge>
              </TableCell>
              <TableCell className={m.quantity < 0 ? "text-destructive" : "text-foreground"}>
                {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {m.branchName}
                {m.targetBranchName ? ` → ${m.targetBranchName}` : ""}
              </TableCell>
              <TableCell className="text-muted-foreground">{m.performedByUsername}</TableCell>
              <TableCell className="text-muted-foreground">{new Date(m.createdAt).toLocaleString("es-GT")}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
