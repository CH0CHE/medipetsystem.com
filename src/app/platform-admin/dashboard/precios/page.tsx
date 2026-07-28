import type { Metadata } from "next";
import { MarketingPlansEditor } from "@/components/platform-admin/marketing-plans-editor";

export const metadata: Metadata = { title: "Precios" };

export default function PreciosPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Precios públicos</h1>
        <p className="text-sm text-muted-foreground">
          Contenido de las 3 tarjetas de precio que ven los visitantes en medipetsystem.com/precios. No crean ni
          eliminan planes de suscripción — solo editan cómo se presentan al público.
        </p>
      </div>
      <MarketingPlansEditor />
    </div>
  );
}
