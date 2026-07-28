import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SuppliersTable } from "@/components/purchases/suppliers-table";

export const metadata: Metadata = { title: "Proveedores" };

export default function ProveedoresPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div>
        <Link
          href="/dashboard/compras"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Volver a compras
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Proveedores</h1>
        <p className="text-sm text-muted-foreground">Proveedores registrados para tus órdenes de compra.</p>
      </div>
      <SuppliersTable />
    </div>
  );
}
