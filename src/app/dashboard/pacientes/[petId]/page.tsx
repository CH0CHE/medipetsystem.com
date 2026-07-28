"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { PetForm } from "@/components/crm/pet-form";
import { MedicalTimeline } from "@/components/clinical/medical-timeline";
import { NewMedicalEntryForm } from "@/components/clinical/new-medical-entry-form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/api/client";
import type { PetDetail } from "@/modules/pets/domain/entities";

export default function EditarPacientePage({ params }: { params: Promise<{ petId: string }> }) {
  const { petId } = use(params);
  const [showNewEntry, setShowNewEntry] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["pet", petId],
    queryFn: () => apiRequest<{ pet: PetDetail }>(`/api/crm/pets/${petId}`).then((r) => r.pet),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-up">
      <div>
        <Link
          href="/dashboard/pacientes"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Volver al listado
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {data ? data.name : "Editar paciente"}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Cargando...
        </div>
      ) : data ? (
        <>
          <PetForm pet={data} />

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Expediente médico</h2>
              <Button size="sm" variant={showNewEntry ? "outline" : "default"} onClick={() => setShowNewEntry((v) => !v)}>
                <Plus className="size-4" /> {showNewEntry ? "Cancelar" : "Nueva entrada"}
              </Button>
            </div>

            {showNewEntry && (
              <NewMedicalEntryForm petId={petId} onCreated={() => setShowNewEntry(false)} />
            )}

            <MedicalTimeline petId={petId} />
          </div>
        </>
      ) : (
        <p className="text-destructive">No se encontró el paciente.</p>
      )}
    </div>
  );
}
