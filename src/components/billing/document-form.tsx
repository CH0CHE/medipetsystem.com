"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { OwnerCombobox } from "@/components/crm/owner-combobox";
import { ProductCombobox } from "./product-combobox";
import { apiRequest, ApiClientError } from "@/lib/api/client";

interface LineItem {
  key: string;
  productId: string;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

const today = () => new Date().toISOString().slice(0, 10);
const currency = (n: number) => `Q${n.toFixed(2)}`;

export function DocumentForm({ kind }: { kind: "quote" | "invoice" }) {
  const router = useRouter();
  const isQuote = kind === "quote";
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [ownerLabel, setOwnerLabel] = useState("");
  const [issueDate, setIssueDate] = useState(today());
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const addItem = (product: { productId: string; name: string; salePrice: number }) => {
    setItems((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        productId: product.productId,
        productName: product.name,
        description: product.name,
        quantity: 1,
        unitPrice: product.salePrice,
      },
    ]);
  };

  const updateItem = (key: string, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const removeItem = (key: string) => setItems((prev) => prev.filter((item) => item.key !== key));

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const onSubmit = async () => {
    setError(null);
    if (!ownerId) {
      setError("Selecciona un propietario.");
      return;
    }
    if (items.length === 0) {
      setError("Agrega al menos una línea.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ownerId,
        issueDate,
        ...(isQuote ? { expiryDate } : {}),
        notes,
        items: items.map((i) => ({
          productId: i.productId,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
      };

      const path = isQuote ? "/api/billing/quotes" : "/api/billing/invoices";
      await apiRequest(path, { method: "POST", body: payload });
      toast.success(isQuote ? "Cotización creada." : "Factura emitida.");
      router.push("/dashboard/facturacion");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo guardar el documento.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-3xl">
      <CardContent className="space-y-5 pt-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Propietario</Label>
            <OwnerCombobox
              value={ownerId}
              onChange={(id, name) => {
                setOwnerId(id);
                setOwnerLabel(name);
              }}
            />
            {ownerLabel && <p className="text-xs text-muted-foreground">Seleccionado: {ownerLabel}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="issueDate">Fecha de emisión</Label>
            <Input id="issueDate" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
          </div>

          {isQuote && (
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Válida hasta</Label>
              <Input id="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label>Productos</Label>
          <ProductCombobox onChange={addItem} />

          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.key} className="flex items-center gap-2 rounded-md border border-border p-2">
                  <span className="flex-1 truncate text-sm text-foreground">{item.productName}</span>
                  <Input
                    type="number"
                    className="w-20"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.key, { quantity: Number(e.target.value) })}
                    min={1}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    className="w-28"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.key, { unitPrice: Number(e.target.value) })}
                  />
                  <span className="w-24 text-right text-sm text-muted-foreground">
                    {currency(item.quantity * item.unitPrice)}
                  </span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(item.key)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end text-sm font-semibold text-foreground">Total: {currency(total)}</div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas</Label>
          <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <Button type="button" size="lg" disabled={submitting} onClick={onSubmit}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          <Plus className="size-4" />
          {isQuote ? "Crear cotización" : "Emitir factura"}
        </Button>
      </CardContent>
    </Card>
  );
}
