import type { Metadata } from "next";
import { FaqAccordion } from "@/components/public/faq-accordion";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description: "Respuestas a las preguntas más comunes sobre MediPet System.",
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Preguntas frecuentes</h1>
        <p className="mt-3 text-muted-foreground">Todo lo que necesitas saber antes de digitalizar tu clínica.</p>
      </div>
      <FaqAccordion />
    </div>
  );
}
