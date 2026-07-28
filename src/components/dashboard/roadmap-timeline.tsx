import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PHASES = [
  { n: 1, label: "Arquitectura y Auth" },
  { n: 2, label: "CRM y Pacientes" },
  { n: 3, label: "Expediente clínico" },
  { n: 4, label: "Inventario" },
  { n: 5, label: "Facturación" },
  { n: 6, label: "Compras" },
  { n: 7, label: "Reportes" },
  { n: 8, label: "Portal MediPet Admin" },
  { n: 9, label: "Hardening" },
  { n: 10, label: "Escalabilidad" },
];

export function RoadmapTimeline({ currentPhase = 1 }: { currentPhase?: number }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[820px] items-start gap-0 pb-2 pt-1">
        {PHASES.map((phase, i) => {
          const done = phase.n < currentPhase;
          const active = phase.n === currentPhase;
          return (
            <div key={phase.n} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <div className={cn("h-px flex-1", i === 0 ? "opacity-0" : done || active ? "bg-primary" : "bg-border")} />
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
                    active && "border-primary bg-primary text-primary-foreground shadow-sm ring-4 ring-primary/15",
                    done && "border-primary bg-primary/10 text-primary",
                    !active && !done && "border-border bg-card text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-4" /> : phase.n}
                </div>
                <div
                  className={cn(
                    "h-px flex-1",
                    i === PHASES.length - 1 ? "opacity-0" : done ? "bg-primary" : "bg-border",
                  )}
                />
              </div>
              <p
                className={cn(
                  "mt-2 max-w-[6.5rem] text-center text-[11px] leading-tight",
                  active ? "font-semibold text-primary" : "text-muted-foreground",
                )}
              >
                {phase.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
