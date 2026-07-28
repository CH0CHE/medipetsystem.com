import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SupplierForm } from "@/components/purchases/supplier-form";

export const metadata: Metadata = { title: "Nuevo proveedor" };

export default function NuevoProveedorPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <div>
        <Link
          href="/dashboard/compras/proveedores"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Volver al listado
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nuevo proveedor</h1>
      </div>
      <SupplierForm />
    </div>
  );
}
