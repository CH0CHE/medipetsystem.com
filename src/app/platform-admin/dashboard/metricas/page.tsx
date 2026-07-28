"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api/client";
import type { SaasMetrics } from "@/modules/platform-admin/domain/entities";

const REFRESH_PATH = "/api/platform-admin/auth/refresh";
const currency = (n: number) => `Q${n.toFixed(2)}`;

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function MetricasPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["platform-admin", "metrics"],
    queryFn: () => apiRequest<SaasMetrics>("/api/platform-admin/metrics", { refreshPath: REFRESH_PATH }),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Métricas SaaS</h1>
        <p className="text-sm text-muted-foreground">Panorama general de todas las clínicas en la plataforma.</p>
      </div>

      {isLoading || !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total de clínicas" value={data.totalTenants} />
          <MetricCard label="Activas" value={data.activeCount} />
          <MetricCard label="Suspendidas" value={data.suspendedCount} />
          <MetricCard label="Dadas de baja" value={data.cancelledCount} />
          <MetricCard label="Plan Básico" value={data.basicCount} />
          <MetricCard label="Plan Pro" value={data.proCount} />
          <MetricCard label="Plan Enterprise" value={data.enterpriseCount} />
          <MetricCard label="Nuevas este mes" value={data.newThisMonth} />
          <MetricCard label="Suscripción pendiente" value={currency(data.totalPendingSubscription)} />
        </div>
      )}
    </div>
  );
}
