import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OwnerForm } from "@/components/crm/owner-form";

export const metadata: Metadata = { title: "Nuevo propietario" };

export default function NuevoPropietarioPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <div>
        <Link
          href="/dashboard/propietarios"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Volver al listado
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nuevo propietario</h1>
      </div>
      <OwnerForm />
    </div>
  );
}
