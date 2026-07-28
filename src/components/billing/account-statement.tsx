"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api/client";
import type { AccountStatement, InvoicePaymentStatus } from "@/modules/billing/domain/entities";

const currency = (n: number) => `Q${n.toFixed(2)}`;

const STATUS_VARIANT: Record<InvoicePaymentStatus, "success" | "warning" | "destructive"> = {
  PAGADA: "success",
  PARCIAL: "warning",
  PENDIENTE: "destructive",
};

export function AccountStatementPanel({ ownerId }: { ownerId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["account-statement", ownerId],
    queryFn: () => apiRequest<AccountStatement>(`/api/billing/owners/${ownerId}/statement`),
  });

  if (isLoading) return <Skeleton className="h-20 w-full" />;

  if (!data || data.items.length === 0) {
    return <p className="text-sm text-muted-foreground">Este propietario no tiene saldos pendientes.</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-destructive">Total pendiente: {currency(data.totalPending)}</p>
      {data.items.map((inv) => (
        <Link
          key={inv.invoiceId}
          href={`/dashboard/facturacion/facturas/${inv.invoiceId}`}
          className="flex items-center justify-between rounded-md border border-border p-2.5 text-sm hover:bg-muted"
        >
          <div className="flex items-center gap-2">
            <Badge variant="mono">{inv.invoiceNumber}</Badge>
            <span className="text-muted-foreground">{new Date(inv.issueDate).toLocaleDateString("es-GT")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[inv.paymentStatus]}>{inv.paymentStatus}</Badge>
            <span className="font-medium text-foreground">{currency(inv.balanceDue)}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
