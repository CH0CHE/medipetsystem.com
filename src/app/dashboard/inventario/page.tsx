import type { Metadata } from "next";
import { ProductsTable } from "@/components/inventory/products-table";

export const metadata: Metadata = { title: "Inventario" };

export default function InventarioPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Inventario</h1>
        <p className="text-sm text-muted-foreground">Productos, existencias y movimientos de tu clínica.</p>
      </div>
      <ProductsTable />
    </div>
  );
}
