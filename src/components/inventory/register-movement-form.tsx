"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest, ApiClientError } from "@/lib/api/client";
import type { ProductBatchSummary } from "@/modules/inventory/domain/entities";

type MovementUiType = "ENTRADA" | "SALIDA" | "AJUSTE";

export function RegisterMovementForm({
  productId,
  batches,
  onDone,
}: {
  productId: string;
  batches: ProductBatchSummary[];
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<MovementUiType>("ENTRADA");
  const [error, setError] = useState<string | null>(null);

  // ENTRADA
  const [batchNumber, setBatchNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [entradaQuantity, setEntradaQuantity] = useState("");

  // SALIDA / AJUSTE
  const [batchId, setBatchId] = useState(batches[0]?.batchId ?? "");
  const [salidaQuantity, setSalidaQuantity] = useState("");
  const [newQuantity, setNewQuantity] = useState("");

  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      const payload =
        type === "ENTRADA"
          ? { type, batchNumber, expirationDate, quantity: entradaQuantity, notes }
          : type === "SALIDA"
            ? { type, batchId, quantity: salidaQuantity, notes }
            : { type, batchId, newQuantity, notes };

      return apiRequest(`/api/inventory/products/${productId}/movements`, { method: "POST", body: payload });
    },
    onSuccess: () => {
      toast.success("Movimiento registrado.");
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["movements", productId] });
      setBatchNumber("");
      setExpirationDate("");
      setEntradaQuantity("");
      setSalidaQuantity("");
      setNewQuantity("");
      setNotes("");
      onDone();
    },
    onError: (err) => {
      setError(err instanceof ApiClientError ? err.message : "No se pudo registrar el movimiento.");
    },
  });

  const canSubmit =
    type === "ENTRADA"
      ? !!batchNumber && !!entradaQuantity
      : type === "SALIDA"
        ? !!batchId && !!salidaQuantity
        : !!batchId && newQuantity !== "";

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo de movimiento</Label>
            <Select value={type} onValueChange={(v) => setType(v as MovementUiType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENTRADA">Entrada</SelectItem>
                <SelectItem value="SALIDA">Salida</SelectItem>
                <SelectItem value="AJUSTE">Ajuste</SelectItem>
              </SelectContent>
            </Select>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="cursor-help text-xs text-muted-foreground underline decoration-dotted">
                  ¿Por qué no hay &ldquo;Transferencia&rdquo;?
                </p>
              </TooltipTrigger>
              <TooltipContent>Disponible cuando tu clínica tenga más de una sucursal activa.</TooltipContent>
            </Tooltip>
          </div>

          {type === "ENTRADA" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="batchNumber">Número de lote</Label>
                <Input id="batchNumber" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expirationDate">Fecha de vencimiento</Label>
                <Input id="expirationDate" type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entradaQuantity">Cantidad</Label>
                <Input id="entradaQuantity" type="number" value={entradaQuantity} onChange={(e) => setEntradaQuantity(e.target.value)} />
              </div>
            </>
          )}

          {(type === "SALIDA" || type === "AJUSTE") && (
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="batchId">Lote</Label>
              <Select value={batchId} onValueChange={setBatchId}>
                <SelectTrigger id="batchId">
                  <SelectValue placeholder="Selecciona un lote..." />
                </SelectTrigger>
                <SelectContent>
                  {batches.map((b) => (
                    <SelectItem key={b.batchId} value={b.batchId}>
                      {b.batchNumber} · {b.branchName} · existencia {b.quantity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === "SALIDA" && (
            <div className="space-y-2">
              <Label htmlFor="salidaQuantity">Cantidad a retirar</Label>
              <Input id="salidaQuantity" type="number" value={salidaQuantity} onChange={(e) => setSalidaQuantity(e.target.value)} />
            </div>
          )}

          {type === "AJUSTE" && (
            <div className="space-y-2">
              <Label htmlFor="newQuantity">Existencia correcta</Label>
              <Input id="newQuantity" type="number" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} />
            </div>
          )}

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notas</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <Button type="button" disabled={!canSubmit || mutation.isPending} onClick={() => { setError(null); mutation.mutate(); }}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          Registrar movimiento
        </Button>
      </CardContent>
    </Card>
  );
}
