import type { Metadata } from "next";
import Link from "next/link";
import { Truck } from "lucide-react";
import { PurchaseOrdersTable } from "@/components/purchases/purchase-orders-table";

export const metadata: Metadata = { title: "Compras" };

export default function ComprasPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Compras</h1>
          <p className="text-sm text-muted-foreground">Órdenes de compra y recepción de mercancía.</p>
        </div>
        <Link
          href="/dashboard/compras/proveedores"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Truck className="size-4" /> Proveedores
        </Link>
      </div>
      <PurchaseOrdersTable />
    </div>
  );
}
