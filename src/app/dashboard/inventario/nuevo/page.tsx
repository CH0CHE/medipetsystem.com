import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/inventory/product-form";

export const metadata: Metadata = { title: "Nuevo producto" };

export default function NuevoProductoPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <div>
        <Link
          href="/dashboard/inventario"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Volver al listado
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nuevo producto</h1>
      </div>
      <ProductForm />
    </div>
  );
}
