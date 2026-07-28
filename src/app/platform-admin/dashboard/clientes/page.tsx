import type { Metadata } from "next";
import { TenantsTable } from "@/components/platform-admin/tenants-table";

export const metadata: Metadata = { title: "Clientes" };

export default function ClientesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          Clínicas registradas en MediPet System. Crea, suspende o reactiva cuentas de clínica.
        </p>
      </div>
      <TenantsTable />
    </div>
  );
}
