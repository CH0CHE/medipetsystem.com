import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PurchaseOrderForm } from "@/components/purchases/purchase-order-form";

export const metadata: Metadata = { title: "Nueva orden de compra" };

export default function NuevaOrdenCompraPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <div>
        <Link
          href="/dashboard/compras"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Volver
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nueva orden de compra</h1>
        <p className="text-sm text-muted-foreground">
          La mercancía se recibe por separado una vez que llegue a tu sucursal.
        </p>
      </div>
      <PurchaseOrderForm />
    </div>
  );
}
