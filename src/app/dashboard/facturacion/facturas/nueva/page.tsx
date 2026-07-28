import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DocumentForm } from "@/components/billing/document-form";

export const metadata: Metadata = { title: "Nueva factura" };

export default function NuevaFacturaPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <div>
        <Link
          href="/dashboard/facturacion"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Volver
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nueva factura</h1>
        <p className="text-sm text-muted-foreground">
          Al emitir la factura se descontará el stock automáticamente de tu sucursal.
        </p>
      </div>
      <DocumentForm kind="invoice" />
    </div>
  );
}
