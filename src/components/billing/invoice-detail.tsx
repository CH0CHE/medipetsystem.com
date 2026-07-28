"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, ApiClientError } from "@/lib/api/client";
import type { InvoiceDetail as InvoiceDetailType, InvoicePaymentStatus } from "@/modules/billing/domain/entities";

const currency = (n: number) => `Q${n.toFixed(2)}`;

const STATUS_VARIANT: Record<InvoicePaymentStatus, "success" | "warning" | "destructive"> = {
  PAGADA: "success",
  PARCIAL: "warning",
  PENDIENTE: "destructive",
};

function PaymentForm({ invoiceId, onDone }: { invoiceId: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => apiRequest(`/api/billing/invoices/${invoiceId}/payments`, { method: "POST", body: { amount, method, notes: "" } }),
    onSuccess: () => {
      toast.success("Pago registrado.");
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setAmount("");
      setMethod("");
      onDone();
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "No se pudo registrar el pago."),
  });

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Input type="number" step="0.01" placeholder="Monto" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Input placeholder="Método (efectivo, tarjeta...)" value={method} onChange={(e) => setMethod(e.target.value)} />
      </div>
      <Button size="sm" disabled={!amount || mutation.isPending} onClick={() => { setError(null); mutation.mutate(); }}>
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Registrar pago
      </Button>
    </div>
  );
}

function AdjustmentForm({ invoiceId, onDone }: { invoiceId: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<"CREDITO" | "DEBITO">("CREDITO");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => apiRequest(`/api/billing/invoices/${invoiceId}/adjustments`, { method: "POST", body: { type, amount, reason } }),
    onSuccess: () => {
      toast.success("Nota registrada.");
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      setAmount("");
      setReason("");
      onDone();
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "No se pudo registrar la nota."),
  });

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Select value={type} onValueChange={(v) => setType(v as "CREDITO" | "DEBITO")}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CREDITO">Nota de crédito</SelectItem>
            <SelectItem value="DEBITO">Nota de débito</SelectItem>
          </SelectContent>
        </Select>
        <Input type="number" step="0.01" placeholder="Monto" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <Input placeholder="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} />
      <Button size="sm" disabled={!amount || !reason || mutation.isPending} onClick={() => { setError(null); mutation.mutate(); }}>
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Agregar nota
      </Button>
    </div>
  );
}

export function InvoiceDetailView({ invoiceId }: { invoiceId: string }) {
  const [showPayment, setShowPayment] = useState(false);
  const [showAdjustment, setShowAdjustment] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => apiRequest<{ invoice: InvoiceDetailType }>(`/api/billing/invoices/${invoiceId}`).then((r) => r.invoice),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data) return <p className="text-destructive">No se encontró la factura.</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Factura {data.invoiceNumber}</CardTitle>
            <Badge variant={STATUS_VARIANT[data.paymentStatus]}>{data.paymentStatus}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.ownerName} · {data.branchName} · {new Date(data.issueDate).toLocaleDateString("es-GT")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.itemId}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{currency(item.unitPrice)}</TableCell>
                  <TableCell>{currency(item.lineTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col items-end gap-1 text-sm">
            <p className="text-muted-foreground">Subtotal: {currency(data.subtotal)}</p>
            <p className="text-lg font-semibold text-foreground">Total: {currency(data.total)}</p>
            <p className={data.balanceDue > 0 ? "font-semibold text-destructive" : "text-success"}>
              Saldo pendiente: {currency(data.balanceDue)}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pagos</CardTitle>
              {data.balanceDue > 0 && (
                <Button size="sm" variant={showPayment ? "outline" : "default"} onClick={() => setShowPayment((v) => !v)}>
                  <Plus className="size-3.5" /> {showPayment ? "Cancelar" : "Registrar pago"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {showPayment && <PaymentForm invoiceId={invoiceId} onDone={() => setShowPayment(false)} />}
            {data.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
            ) : (
              data.payments.map((p) => (
                <div key={p.paymentId} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{p.method ?? "Pago"} · {new Date(p.createdAt).toLocaleDateString("es-GT")}</span>
                  <span className="font-medium text-success">+{currency(p.amount)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Notas de crédito/débito</CardTitle>
              <Button size="sm" variant={showAdjustment ? "outline" : "default"} onClick={() => setShowAdjustment((v) => !v)}>
                <Plus className="size-3.5" /> {showAdjustment ? "Cancelar" : "Agregar nota"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {showAdjustment && <AdjustmentForm invoiceId={invoiceId} onDone={() => setShowAdjustment(false)} />}
            {data.adjustments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin notas registradas.</p>
            ) : (
              data.adjustments.map((a) => (
                <div key={a.noteId} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{a.reason}</span>
                  <span className={a.type === "CREDITO" ? "font-medium text-success" : "font-medium text-destructive"}>
                    {a.type === "CREDITO" ? "-" : "+"}{currency(a.amount)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
