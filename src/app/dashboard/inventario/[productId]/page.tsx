"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { ProductForm } from "@/components/inventory/product-form";
import { RegisterMovementForm } from "@/components/inventory/register-movement-form";
import { BatchesList } from "@/components/inventory/batches-list";
import { MovementsLedger } from "@/components/inventory/movements-ledger";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/api/client";
import type { ProductDetail } from "@/modules/inventory/domain/entities";

export default function EditarProductoPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const [showMovementForm, setShowMovementForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => apiRequest<{ product: ProductDetail }>(`/api/inventory/products/${productId}`).then((r) => r.product),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <div>
        <Link
          href="/dashboard/inventario"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Volver al listado
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {data ? data.name : "Editar producto"}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Cargando...
        </div>
      ) : data ? (
        <>
          <ProductForm product={data} />

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Lotes y existencia</h2>
              <Button size="sm" variant={showMovementForm ? "outline" : "default"} onClick={() => setShowMovementForm((v) => !v)}>
                <Plus className="size-4" /> {showMovementForm ? "Cancelar" : "Registrar movimiento"}
              </Button>
            </div>

            {showMovementForm && (
              <RegisterMovementForm productId={productId} batches={data.batches} onDone={() => setShowMovementForm(false)} />
            )}

            <BatchesList batches={data.batches} />
          </div>

          <Separator />

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Movimientos</h2>
            <MovementsLedger productId={productId} />
          </div>
        </>
      ) : (
        <p className="text-destructive">No se encontró el producto.</p>
      )}
    </div>
  );
}
