"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/api/client";
import type { SupportAccountRow } from "@/modules/platform-admin/domain/entities";

const REFRESH_PATH = "/api/platform-admin/auth/refresh";

export default function SoportePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["platform-admin", "support-accounts"],
    queryFn: () =>
      apiRequest<{ items: SupportAccountRow[] }>("/api/platform-admin/support-accounts", { refreshPath: REFRESH_PATH }).then(
        (r) => r.items,
      ),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Soporte</h1>
        <p className="text-sm text-muted-foreground">
          Usuario conector de cada clínica, usado exclusivamente por MediPet System para soporte. Todo su acceso queda
          auditado.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clínica</TableHead>
              <TableHead>Usuario conector</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Último acceso</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No hay cuentas de soporte registradas.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              data?.map((row) => (
                <TableRow key={row.tenantId}>
                  <TableCell className="font-medium text-foreground">{row.tenantName}</TableCell>
                  <TableCell>
                    <Badge variant="mono">{row.connectorUsername}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.connectorStatus === "ACTIVE" ? "success" : "destructive"}>
                      {row.connectorStatus === "ACTIVE" ? "Activo" : row.connectorStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.connectorLastLogin ? new Date(row.connectorLastLogin).toLocaleString("es-GT") : "Sin accesos"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/platform-admin/dashboard/auditoria?tenantId=${row.tenantId}`}
                      className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Ver actividad
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
