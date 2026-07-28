import type { Metadata } from "next";
import { LeadsTable } from "@/components/platform-admin/leads-table";

export const metadata: Metadata = { title: "Leads" };

export default function LeadsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Contactos capturados desde los formularios públicos de Contacto y Solicitud de demo.
        </p>
      </div>
      <LeadsTable />
    </div>
  );
}
