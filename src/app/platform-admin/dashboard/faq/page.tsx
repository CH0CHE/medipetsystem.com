import type { Metadata } from "next";
import { FaqManager } from "@/components/platform-admin/faq-manager";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Preguntas frecuentes</h1>
        <p className="text-sm text-muted-foreground">
          Contenido de la sección de FAQ del sitio público. Solo las preguntas publicadas son visibles.
        </p>
      </div>
      <FaqManager />
    </div>
  );
}
