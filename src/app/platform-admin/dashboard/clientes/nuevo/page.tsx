import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreateTenantForm } from "@/components/platform-admin/create-tenant-form";

export const metadata: Metadata = { title: "Crear cliente" };

export default function NuevoClientePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <div>
        <Link
          href="/platform-admin/dashboard/clientes"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Volver al listado
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Crear cliente</h1>
        <p className="text-sm text-muted-foreground">
          Se generarán automáticamente los usuarios administrador y conector de soporte.
        </p>
      </div>
      <CreateTenantForm />
    </div>
  );
}
