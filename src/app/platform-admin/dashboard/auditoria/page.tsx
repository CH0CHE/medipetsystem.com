"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/api/client";
import type { AuditLogListResult } from "@/modules/platform-admin/domain/entities";

const REFRESH_PATH = "/api/platform-admin/auth/refresh";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function AuditoriaPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <AuditoriaContent />
    </Suspense>
  );
}

function AuditoriaContent() {
  const searchParams = useSearchParams();
  const tenantIdFilter = searchParams.get("tenantId");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState(() => daysAgo(29));
  const [to, setTo] = useState(() => daysAgo(0));

  const { data, isLoading } = useQuery({
    queryKey: ["platform-admin", "audit-logs", tenantIdFilter, action, from, to],
    queryFn: () => {
      const params = new URLSearchParams({ from, to, pageSize: "50" });
      if (tenantIdFilter) params.set("tenantId", tenantIdFilter);
      if (action) params.set("action", action);
      return apiRequest<AuditLogListResult>(`/api/platform-admin/audit-logs?${params.toString()}`, {
        refreshPath: REFRESH_PATH,
      });
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Auditoría global</h1>
        <p className="text-sm text-muted-foreground">Bitácora de acciones críticas de todas las clínicas y del staff de MediPet.</p>
      </div>

      {tenantIdFilter && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Filtrando por clínica:</span>
          <Badge variant="mono">{tenantIdFilter}</Badge>
          <Link href="/platform-admin/dashboard/auditoria" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <X className="size-3.5" /> Quitar filtro
          </Link>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Acción</Label>
          <Input className="h-9 w-56" placeholder="Ej. TENANT_CANCELLED" value={action} onChange={(e) => setAction(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Desde</Label>
          <Input type="date" className="h-9 w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Hasta</Label>
          <Input type="date" className="h-9 w-40" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Clínica</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Entidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Sin eventos para estos filtros.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              data?.items.map((log) => (
                <TableRow key={log.logId}>
                  <TableCell className="text-muted-foreground">{new Date(log.createdAt).toLocaleString("es-GT")}</TableCell>
                  <TableCell>{log.tenantName ?? "—"}</TableCell>
                  <TableCell>{log.username ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="mono">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.entityType ? `${log.entityType}${log.entityId ? ` (${log.entityId.slice(0, 8)}…)` : ""}` : "—"}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {data && data.totalCount > 50 && (
        <p className="text-xs text-muted-foreground">Mostrando 50 de {data.totalCount} eventos. Acota el rango de fechas para ver más detalle.</p>
      )}
    </div>
  );
}
