"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, PackageCheck, Ban } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, ApiClientError } from "@/lib/api/client";
import type { PurchaseOrderDetail as PurchaseOrderDetailType, PurchaseOrderStatus } from "@/modules/purchases/domain/entities";

const currency = (n: number) => `Q${n.toFixed(2)}`;

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

interface ReceiveDraftLine {
  purchaseOrderItemId: string;
  quantityReceived: string;
  batchNumber: string;
  expirationDate: string;
}

function ReceiveForm({
  order,
  onDone,
}: {
  order: PurchaseOrderDetailType;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const pendingItems = order.items.filter((item) => item.quantityReceived < item.quantityOrdered);
  const [drafts, setDrafts] = useState<Record<string, ReceiveDraftLine>>(
    Object.fromEntries(
      pendingItems.map((item) => [
        item.itemId,
        { purchaseOrderItemId: item.itemId, quantityReceived: String(item.quantityOrdered - item.quantityReceived), batchNumber: "", expirationDate: "" },
      ]),
    ),
  );

  const updateDraft = (itemId: string, patch: Partial<ReceiveDraftLine>) => {
    setDrafts((prev) => ({ ...prev, [itemId]: { ...prev[itemId]!, ...patch } }));
  };

  const mutation = useMutation({
    mutationFn: () => {
      const items = Object.values(drafts)
        .filter((d) => d.batchNumber.trim() && Number(d.quantityReceived) > 0)
        .map((d) => ({
          purchaseOrderItemId: d.purchaseOrderItemId,
          quantityReceived: d.quantityReceived,
          batchNumber: d.batchNumber,
          expirationDate: d.expirationDate,
        }));
      return apiRequest(`/api/purchases/orders/${order.purchaseOrderId}/receive`, { method: "POST", body: { items } });
    },
    onSuccess: () => {
      toast.success("Mercancía recibida.");
      queryClient.invalidateQueries({ queryKey: ["purchase-order", order.purchaseOrderId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      onDone();
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "No se pudo registrar la recepción."),
  });

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      {pendingItems.map((item) => {
        const draft = drafts[item.itemId]!;
        const pending = item.quantityOrdered - item.quantityReceived;
        return (
          <div key={item.itemId} className="flex flex-wrap items-center gap-2 border-b border-border pb-2 last:border-0 last:pb-0">
            <span className="min-w-40 flex-1 truncate text-sm text-foreground">
              {item.productName} <span className="text-muted-foreground">(pendiente: {pending})</span>
            </span>
            <Input
              type="number"
              className="w-24"
              placeholder="Cantidad"
              value={draft.quantityReceived}
              onChange={(e) => updateDraft(item.itemId, { quantityReceived: e.target.value })}
              min={0}
              max={pending}
            />
            <Input
              className="w-32"
              placeholder="Número de lote"
              value={draft.batchNumber}
              onChange={(e) => updateDraft(item.itemId, { batchNumber: e.target.value })}
            />
            <Input
              type="date"
              className="w-40"
              value={draft.expirationDate}
              onChange={(e) => updateDraft(item.itemId, { expirationDate: e.target.value })}
            />
          </div>
        );
      })}
      <Button size="sm" disabled={mutation.isPending} onClick={() => { setError(null); mutation.mutate(); }}>
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Confirmar recepción
      </Button>
    </div>
  );
}

export function PurchaseOrderDetailView({ purchaseOrderId }: { purchaseOrderId: string }) {
  const queryClient = useQueryClient();
  const [showReceive, setShowReceive] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["purchase-order", purchaseOrderId],
    queryFn: () => apiRequest<{ order: PurchaseOrderDetailType }>(`/api/purchases/orders/${purchaseOrderId}`).then((r) => r.order),
  });

  const cancelMutation = useMutation({
    mutationFn: () => apiRequest(`/api/purchases/orders/${purchaseOrderId}/cancel`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Orden cancelada.");
      queryClient.invalidateQueries({ queryKey: ["purchase-order", purchaseOrderId] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    },
    onError: (err) => setCancelError(err instanceof ApiClientError ? err.message : "No se pudo cancelar la orden."),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data) return <p className="text-destructive">No se encontró la orden de compra.</p>;

  const canReceive = data.status === "PENDIENTE" || data.status === "RECIBIDA_PARCIAL";
  const canCancel = data.status === "PENDIENTE";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Orden {data.orderNumber}</CardTitle>
            <Badge variant={STATUS_VARIANT[data.status]}>{STATUS_LABEL[data.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.supplierName} · {data.branchName} · {new Date(data.orderDate).toLocaleDateString("es-GT")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Ordenado</TableHead>
                <TableHead>Recibido</TableHead>
                <TableHead>Costo unitario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.itemId}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.quantityOrdered}</TableCell>
                  <TableCell className={item.quantityReceived < item.quantityOrdered ? "text-warning" : "text-success"}>
                    {item.quantityReceived}
                  </TableCell>
                  <TableCell>{currency(item.unitCost)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recepción de mercancía</CardTitle>
            <div className="flex gap-2">
              {canReceive && (
                <Button size="sm" variant={showReceive ? "outline" : "default"} onClick={() => setShowReceive((v) => !v)}>
                  <PackageCheck className="size-3.5" /> {showReceive ? "Cancelar" : "Recibir mercancía"}
                </Button>
              )}
              {canCancel && (
                <Button size="sm" variant="outline" disabled={cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>
                  {cancelMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Ban className="size-3.5" />}
                  Cancelar orden
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {cancelError && <p className="text-xs font-medium text-destructive">{cancelError}</p>}
          {showReceive && <ReceiveForm order={data} onDone={() => setShowReceive(false)} />}
          {!showReceive && data.status === "RECIBIDA" && (
            <p className="text-sm text-success">Orden recibida en su totalidad.</p>
          )}
          {!showReceive && data.status === "CANCELADA" && (
            <p className="text-sm text-muted-foreground">Esta orden fue cancelada.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
