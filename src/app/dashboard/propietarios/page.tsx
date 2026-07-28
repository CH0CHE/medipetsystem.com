import type { Metadata } from "next";
import { OwnersTable } from "@/components/crm/owners-table";

export const metadata: Metadata = { title: "Propietarios" };

export default function PropietariosPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Propietarios</h1>
        <p className="text-sm text-muted-foreground">
          Dueños de las mascotas atendidas en tu clínica y su estado de cuenta.
        </p>
      </div>
      <OwnersTable />
    </div>
  );
}
