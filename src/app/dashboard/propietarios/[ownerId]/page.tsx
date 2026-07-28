"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { OwnerForm } from "@/components/crm/owner-form";
import { AccountStatementPanel } from "@/components/billing/account-statement";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/api/client";
import type { OwnerDetail } from "@/modules/owners/domain/entities";

export default function EditarPropietarioPage({ params }: { params: Promise<{ ownerId: string }> }) {
  const { ownerId } = use(params);

  const { data, isLoading } = useQuery({
    queryKey: ["owner", ownerId],
    queryFn: () => apiRequest<{ owner: OwnerDetail }>(`/api/crm/owners/${ownerId}`).then((r) => r.owner),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <div>
        <Link
          href="/dashboard/propietarios"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Volver al listado
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {data ? data.fullName : "Editar propietario"}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Cargando...
        </div>
      ) : data ? (
        <>
          <OwnerForm owner={data} />

          <Separator />

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Estado de cuenta</h2>
            <AccountStatementPanel ownerId={ownerId} />
          </div>
        </>
      ) : (
        <p className="text-destructive">No se encontró el propietario.</p>
      )}
    </div>
  );
}
