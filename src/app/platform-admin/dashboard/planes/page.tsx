"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/api/client";
import type { PlatformInvoiceListResult, TenantListResult } from "@/modules/platform-admin/domain/entities";

const REFRESH_PATH = "/api/platform-admin/auth/refresh";
const PLAN_LABEL: Record<string, string> = { BASIC: "Básico", PRO: "Pro", ENTERPRISE: "Enterprise" };
const currency = (n: number) => `Q${n.toFixed(2)}`;

export default function PlanesPage() {
  const { data: tenants, isLoading } = useQuery({
    queryKey: ["platform-admin", "tenants", "planes"],
    queryFn: () => apiRequest<TenantListResult>("/api/platform-admin/tenants?pageSize=100", { refreshPath: REFRESH_PATH }),
  });

  const { data: pendingInvoices } = useQuery({
    queryKey: ["platform-admin", "invoices", "pending"],
    queryFn: () =>
      apiRequest<PlatformInvoiceListResult>("/api/platform-admin/billing?status=PENDIENTE&pageSize=200", {
        refreshPath: REFRESH_PATH,
      }),
  });

  const pendingByTenant = new Map<string, number>();
  pendingInvoices?.items.forEach((inv) => {
    pendingByTenant.set(inv.tenantId, (pendingByTenant.get(inv.tenantId) ?? 0) + inv.amount);
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Planes y facturación</h1>
        <p className="text-sm text-muted-foreground">
          Plan actual y saldo de suscripción pendiente por clínica. Cambia el plan o genera facturas desde la ficha de
          cada clínica.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Clínica</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Saldo pendiente</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 4 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading &&
              tenants?.items.map((tenant) => {
                const pending = pendingByTenant.get(tenant.tenantId) ?? 0;
                return (
                  <TableRow key={tenant.tenantId}>
                    <TableCell>
                      <Badge variant="mono">{tenant.tenantCode}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <Link href={`/platform-admin/dashboard/clientes/${tenant.tenantId}`} className="hover:underline">
                        {tenant.name}
                      </Link>
                    </TableCell>
                    <TableCell>{PLAN_LABEL[tenant.plan] ?? tenant.plan}</TableCell>
                    <TableCell className={pending > 0 ? "font-semibold text-destructive" : "text-muted-foreground"}>
                      {currency(pending)}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
