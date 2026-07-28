import type { Metadata } from "next";
import { LeadForm } from "@/components/public/lead-form";

export const metadata: Metadata = {
  title: "Solicitar demo",
  description: "Agenda una demostración de MediPet System para tu clínica veterinaria.",
};

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Solicita una demo</h1>
        <p className="mt-3 text-muted-foreground">
          Cuéntanos sobre tu clínica y un asesor de MediPet System te contactará para agendar una demostración
          personalizada.
        </p>
      </div>
      <div className="mt-10 flex justify-center">
        <LeadForm source="DEMO" showClinicName />
      </div>
    </div>
  );
}
