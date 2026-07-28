"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { InvoiceDetailView } from "@/components/billing/invoice-detail";

export default function FacturaDetailPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = use(params);

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      <Link
        href="/dashboard/facturacion"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Volver a facturación
      </Link>
      <InvoiceDetailView invoiceId={invoiceId} />
    </div>
  );
}
