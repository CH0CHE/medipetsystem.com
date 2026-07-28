import type { Metadata } from "next";
import { PricingSection } from "@/components/public/pricing-section";

export const metadata: Metadata = {
  title: "Precios",
  description: "Planes de MediPet System para clínicas veterinarias de cualquier tamaño.",
};

export default function PreciosPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Planes simples y transparentes</h1>
        <p className="mt-3 text-muted-foreground">
          Elige el plan que se ajuste al tamaño de tu clínica. Puedes cambiar de plan en cualquier momento.
        </p>
      </div>
      <div className="mt-12">
        <PricingSection />
      </div>
    </div>
  );
}
