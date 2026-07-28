import type { Metadata } from "next";
import { LeadForm } from "@/components/public/lead-form";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos y resolvemos tus dudas sobre MediPet System.",
};

export default function ContactoPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Contáctanos</h1>
        <p className="mt-3 text-muted-foreground">
          ¿Tienes preguntas sobre MediPet System? Escríbenos y te responderemos lo antes posible.
        </p>
      </div>
      <div className="mt-10 flex justify-center">
        <LeadForm source="CONTACTO" />
      </div>
    </div>
  );
}
