"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { QuotesTable } from "@/components/billing/quotes-table";
import { InvoicesTable } from "@/components/billing/invoices-table";

export default function FacturacionPage() {
  const [tab, setTab] = useState<"facturas" | "cotizaciones">("facturas");

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Facturación</h1>
        <p className="text-sm text-muted-foreground">Cotizaciones, facturas y cuentas por cobrar.</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(["facturas", "cotizaciones"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors",
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "facturas" ? <InvoicesTable /> : <QuotesTable />}
    </div>
  );
}
