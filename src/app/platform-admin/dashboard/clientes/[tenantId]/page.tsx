"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TenantDetailView } from "@/components/platform-admin/tenant-detail";

export default function TenantDetailPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = use(params);
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-up">
      <Link
        href="/platform-admin/dashboard/clientes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Volver al listado
      </Link>
      <TenantDetailView tenantId={tenantId} />
    </div>
  );
}
