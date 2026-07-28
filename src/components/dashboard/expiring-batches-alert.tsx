"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api/client";
import type { ExpiringBatch } from "@/modules/inventory/domain/entities";

function urgencyVariant(days: number): "destructive" | "warning" | "secondary" {
  if (days <= 15) return "destructive";
  if (days <= 30) return "warning";
  return "secondary";
}

export function ExpiringBatchesAlert() {
  const { data, isLoading } = useQuery({
    queryKey: ["expiring-batches"],
    queryFn: () => apiRequest<{ items: ExpiringBatch[] }>("/api/inventory/alerts/expiring?maxDays=90").then((r) => r.items),
  });

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <PackageCheck className="size-4 text-success" />
        Ningún producto vence en los próximos 90 días.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.slice(0, 6).map((batch) => (
        <div key={batch.batchId} className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="size-4 shrink-0 text-warning" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {batch.productName} <span className="text-muted-foreground">· {batch.sku}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Lote {batch.batchNumber} · {batch.branchName} · {batch.quantity} unidades
              </p>
            </div>
          </div>
          <Badge variant={urgencyVariant(batch.daysRemaining)} className="shrink-0">
            {batch.daysRemaining <= 0 ? "Vencido" : `${batch.daysRemaining} días`}
          </Badge>
        </div>
      ))}
      {data.length > 6 && (
        <p className="text-xs text-muted-foreground">y {data.length - 6} más por vencer en los próximos 90 días.</p>
      )}
    </div>
  );
}
