import type { Metadata } from "next";
import { PetsTable } from "@/components/crm/pets-table";

export const metadata: Metadata = { title: "Pacientes" };

export default function PacientesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Pacientes</h1>
        <p className="text-sm text-muted-foreground">Mascotas registradas en tu clínica.</p>
      </div>
      <PetsTable />
    </div>
  );
}
