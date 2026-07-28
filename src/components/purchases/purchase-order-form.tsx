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
import { SupplierCombobox } from "./supplier-combobox";
import { ProductCombobox } from "@/components/billing/product-combobox";
import { apiRequest, ApiClientError } from "@/lib/api/client";

interface LineItem {
  key: string;
  productId: string;
  productName: string;
  description: string;
  quantityOrdered: number;
  unitCost: number;
}

const today = () => new Date().toISOString().slice(0, 10);
const currency = (n: number) => `Q${n.toFixed(2)}`;

export function PurchaseOrderForm() {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [supplierLabel, setSupplierLabel] = useState("");
  const [orderDate, setOrderDate] = useState(today());
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
        quantityOrdered: 1,
        unitCost: 0,
      },
    ]);
  };

  const updateItem = (key: string, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  };

  const removeItem = (key: string) => setItems((prev) => prev.filter((item) => item.key !== key));

  const total = items.reduce((sum, item) => sum + item.quantityOrdered * item.unitCost, 0);

  const onSubmit = async () => {
    setError(null);
    if (!supplierId) {
      setError("Selecciona un proveedor.");
      return;
    }
    if (items.length === 0) {
      setError("Agrega al menos una línea.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        supplierId,
        orderDate,
        notes,
        items: items.map((i) => ({
          productId: i.productId,
          description: i.description,
          quantityOrdered: i.quantityOrdered,
          unitCost: i.unitCost,
        })),
      };

      await apiRequest("/api/purchases/orders", { method: "POST", body: payload });
      toast.success("Orden de compra creada.");
      router.push("/dashboard/compras");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "No se pudo guardar la orden de compra.");
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
            <Label>Proveedor</Label>
            <SupplierCombobox
              value={supplierId}
              onChange={(id, name) => {
                setSupplierId(id);
                setSupplierLabel(name);
              }}
            />
            {supplierLabel && <p className="text-xs text-muted-foreground">Seleccionado: {supplierLabel}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="orderDate">Fecha de orden</Label>
            <Input id="orderDate" type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Productos</Label>
          <ProductCombobox onChange={addItem} placeholder="Buscar producto por nombre o SKU..." />

          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.key} className="flex items-center gap-2 rounded-md border border-border p-2">
                  <span className="flex-1 truncate text-sm text-foreground">{item.productName}</span>
                  <Input
                    type="number"
                    className="w-24"
                    value={item.quantityOrdered}
                    onChange={(e) => updateItem(item.key, { quantityOrdered: Number(e.target.value) })}
                    min={1}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    className="w-28"
                    value={item.unitCost}
                    onChange={(e) => updateItem(item.key, { unitCost: Number(e.target.value) })}
                  />
                  <span className="w-24 text-right text-sm text-muted-foreground">
                    {currency(item.quantityOrdered * item.unitCost)}
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
          Crear orden de compra
        </Button>
      </CardContent>
    </Card>
  );
}
