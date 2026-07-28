"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Stethoscope, Syringe, Scissors, BedDouble, Pill, ChevronDown, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import type {
  MedicalEntryDetail,
  MedicalEntryListResult,
  MedicalEntryType,
} from "@/modules/medical-records/domain/entities";
import { AttachmentList } from "./attachment-list";

const TYPE_META: Record<
  MedicalEntryType,
  { label: string; icon: typeof Stethoscope; badge: "default" | "success" | "warning" | "destructive" | "secondary" }
> = {
  CONSULTA: { label: "Consulta", icon: Stethoscope, badge: "default" },
  VACUNA: { label: "Vacuna", icon: Syringe, badge: "success" },
  CIRUGIA: { label: "Cirugía", icon: Scissors, badge: "warning" },
  HOSPITALIZACION: { label: "Hospitalización", icon: BedDouble, badge: "destructive" },
  MEDICAMENTO: { label: "Medicamento", icon: Pill, badge: "secondary" },
};

function EntryDetailFields({ entry }: { entry: MedicalEntryDetail }) {
  const rows: Array<[string, string | null]> = (() => {
    switch (entry.type) {
      case "CONSULTA":
        return [
          ["Síntomas", entry.symptoms],
          ["Diagnóstico", entry.diagnosis],
          ["Tratamiento", entry.treatment],
        ];
      case "VACUNA":
        return [
          ["Vacuna", entry.vaccineName],
          ["Próxima dosis", entry.nextDueDate ? new Date(entry.nextDueDate).toLocaleDateString("es-GT") : null],
        ];
      case "CIRUGIA":
        return [
          ["Procedimiento", entry.procedureName],
          ["Resultado", entry.outcome],
        ];
      case "HOSPITALIZACION":
        return [
          ["Ingreso", entry.admissionDate ? new Date(entry.admissionDate).toLocaleDateString("es-GT") : null],
          ["Alta", entry.dischargeDate ? new Date(entry.dischargeDate).toLocaleDateString("es-GT") : null],
        ];
      case "MEDICAMENTO":
        return [
          ["Medicamento", entry.medicationName],
          ["Dosis", entry.dosage],
          ["Frecuencia", entry.frequency],
        ];
    }
  })();

  return (
    <div className="space-y-2 text-sm">
      {rows
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <p key={label}>
            <span className="font-medium text-foreground">{label}: </span>
            <span className="text-muted-foreground">{value}</span>
          </p>
        ))}
      {entry.notes && (
        <p>
          <span className="font-medium text-foreground">Notas: </span>
          <span className="text-muted-foreground">{entry.notes}</span>
        </p>
      )}
    </div>
  );
}

export function MedicalTimeline({ petId }: { petId: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["medical-entries", petId],
    queryFn: () =>
      apiRequest<MedicalEntryListResult>(`/api/clinical/pets/${petId}/records?pageSize=50`),
  });

  const { data: detail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["medical-entry", expandedId],
    queryFn: () => apiRequest<{ entry: MedicalEntryDetail }>(`/api/clinical/records/${expandedId}`).then((r) => r.entry),
    enabled: !!expandedId,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return <p className="text-sm text-muted-foreground">Aún no hay entradas en el expediente de este paciente.</p>;
  }

  return (
    <div className="space-y-2">
      {data.items.map((item) => {
        const meta = TYPE_META[item.type];
        const Icon = meta.icon;
        const isExpanded = expandedId === item.entryId;

        return (
          <div key={item.entryId} className="rounded-lg border border-border bg-card">
            <button
              type="button"
              className="flex w-full items-center gap-3 p-3 text-left"
              onClick={() => setExpandedId(isExpanded ? null : item.entryId)}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  meta.badge === "default" && "bg-primary/10 text-primary",
                  meta.badge === "success" && "bg-success/15 text-success",
                  meta.badge === "warning" && "bg-warning/15 text-warning",
                  meta.badge === "destructive" && "bg-destructive/15 text-destructive",
                  meta.badge === "secondary" && "bg-secondary/15 text-secondary-hover",
                )}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant={meta.badge}>{meta.label}</Badge>
                  <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.entryDate).toLocaleDateString("es-GT")} · {item.veterinarianName}
                  {item.attachmentCount > 0 && (
                    <>
                      {" "}
                      · <Paperclip className="inline size-3" /> {item.attachmentCount}
                    </>
                  )}
                </p>
              </div>
              <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
            </button>

            {isExpanded && (
              <div className="border-t border-border p-3 pt-3">
                {isLoadingDetail || !detail ? (
                  <Skeleton className="h-16 w-full" />
                ) : (
                  <>
                    <EntryDetailFields entry={detail} />
                    <div className="mt-3">
                      <AttachmentList entryId={item.entryId} attachments={detail.attachments} />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
