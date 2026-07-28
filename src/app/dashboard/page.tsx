import type { Metadata } from "next";
import { PawPrint, Receipt, CalendarClock, AlertTriangle } from "lucide-react";
import { getServerAuthContext } from "@/lib/auth/server-session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { RoadmapTimeline } from "@/components/dashboard/roadmap-timeline";
import { ExpiringBatchesAlert } from "@/components/dashboard/expiring-batches-alert";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const ctx = await getServerAuthContext("tenant");

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Hola, {ctx?.username} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Este es el panel de tu clínica. Los módulos operativos se irán habilitando por fases.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pacientes activos" icon={PawPrint} />
        <StatCard label="Citas de hoy" icon={CalendarClock} accent="secondary" />
        <StatCard label="Facturación del mes" icon={Receipt} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning" />
            <CardTitle>Alertas de vencimiento</CardTitle>
          </div>
          <CardDescription>Lotes de inventario próximos a vencer (90 días).</CardDescription>
        </CardHeader>
        <CardContent>
          <ExpiringBatchesAlert />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ruta de implementación</CardTitle>
          <CardDescription>MediPet System se construye por fases. Estás aquí:</CardDescription>
        </CardHeader>
        <CardContent>
          <RoadmapTimeline currentPhase={4} />
        </CardContent>
      </Card>
    </div>
  );
}
