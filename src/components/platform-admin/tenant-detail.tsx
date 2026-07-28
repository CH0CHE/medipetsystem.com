"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Ban, RotateCcw, Trash2, Plus, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest, ApiClientError } from "@/lib/api/client";
import type { PlatformInvoiceListResult, TenantDetail as TenantDetailType, TenantPlan } from "@/modules/platform-admin/domain/entities";

const REFRESH_PATH = "/api/platform-admin/auth/refresh";
const PLAN_LABEL: Record<string, string> = { BASIC: "Básico", PRO: "Pro", ENTERPRISE: "Enterprise" };
const STATUS_LABEL: Record<string, string> = { ACTIVE: "Activa", SUSPENDED: "Suspendida", CANCELADA: "Dada de baja" };
const STATUS_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  ACTIVE: "success",
  SUSPENDED: "warning",
  CANCELADA: "destructive",
};
const currency = (n: number) => `Q${n.toFixed(2)}`;

function GenerateInvoiceForm({ tenantId, onDone }: { tenantId: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("/api/platform-admin/billing", {
        method: "POST",
        body: { tenantId, period, amount },
        refreshPath: REFRESH_PATH,
      }),
    onSuccess: () => {
      toast.success("Factura de suscripción generada.");
      queryClient.invalidateQueries({ queryKey: ["platform-admin", "invoices", tenantId] });
      setAmount("");
      onDone();
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.message : "No se pudo generar la factura."),
  });

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Input type="month" className="w-40" value={period} onChange={(e) => setPeriod(e.target.value)} />
        <Input type="number" step="0.01" placeholder="Monto" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <Button size="sm" disabled={!amount || mutation.isPending} onClick={() => { setError(null); mutation.mutate(); }}>
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        Generar factura
      </Button>
    </div>
  );
}

export function TenantDetailView({ tenantId }: { tenantId: string }) {
  const queryClient = useQueryClient();
  const [showGenerateInvoice, setShowGenerateInvoice] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["platform-admin", "tenant", tenantId],
    queryFn: () =>
      apiRequest<{ tenant: TenantDetailType }>(`/api/platform-admin/tenants/${tenantId}`, { refreshPath: REFRESH_PATH }).then(
        (r) => r.tenant,
      ),
  });

  const { data: invoices } = useQuery({
    queryKey: ["platform-admin", "invoices", tenantId],
    queryFn: () =>
      apiRequest<PlatformInvoiceListResult>(`/api/platform-admin/billing?tenantId=${tenantId}&pageSize=50`, {
        refreshPath: REFRESH_PATH,
      }),
  });

  const planMutation = useMutation({
    mutationFn: (plan: TenantPlan) =>
      apiRequest(`/api/platform-admin/tenants/${tenantId}/plan`, { method: "PATCH", body: { plan }, refreshPath: REFRESH_PATH }),
    onSuccess: () => {
      toast.success("Plan actualizado.");
      queryClient.invalidateQueries({ queryKey: ["platform-admin", "tenant", tenantId] });
    },
    onError: (err) => setActionError(err instanceof ApiClientError ? err.message : "No se pudo actualizar el plan."),
  });

  const lifecycleMutation = useMutation({
    mutationFn: (action: "suspend" | "reactivate" | "cancel") => {
      const path = `/api/platform-admin/tenants/${tenantId}/${action}`;
      return apiRequest(path, {
        method: "POST",
        body: action === "suspend" ? { reason: "Gestionado desde la ficha de la clínica." } : undefined,
        refreshPath: REFRESH_PATH,
      });
    },
    onSuccess: () => {
      toast.success("Estado de la clínica actualizado.");
      queryClient.invalidateQueries({ queryKey: ["platform-admin", "tenant", tenantId] });
      setConfirmCancel(false);
    },
    onError: (err) => setActionError(err instanceof ApiClientError ? err.message : "No se pudo actualizar el estado."),
  });

  const markPaidMutation = useMutation({
    mutationFn: (invoiceId: string) =>
      apiRequest(`/api/platform-admin/billing/${invoiceId}/mark-paid`, { method: "POST", refreshPath: REFRESH_PATH }),
    onSuccess: () => {
      toast.success("Factura marcada como pagada.");
      queryClient.invalidateQueries({ queryKey: ["platform-admin", "invoices", tenantId] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "No se pudo marcar como pagada."),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!data) return <p className="text-destructive">No se encontró la clínica.</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{data.name}</CardTitle>
            <Badge variant={STATUS_VARIANT[data.status]}>{STATUS_LABEL[data.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            <Badge variant="mono">{data.tenantCode}</Badge> · {data.mainBranchName ?? "—"} · {data.userCount} usuarios ·
            creada el {new Date(data.createdAt).toLocaleDateString("es-GT")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {actionError && <p className="text-sm font-medium text-destructive">{actionError}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Plan</Label>
              <Select
                value={data.plan}
                disabled={data.status === "CANCELADA" || planMutation.isPending}
                onValueChange={(v) => { setActionError(null); planMutation.mutate(v as TenantPlan); }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASIC">Básico</SelectItem>
                  <SelectItem value="PRO">Pro</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-5">
              {data.status === "ACTIVE" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={lifecycleMutation.isPending}
                  onClick={() => { setActionError(null); lifecycleMutation.mutate("suspend"); }}
                >
                  <Ban className="size-3.5" /> Suspender
                </Button>
              )}
              {data.status === "SUSPENDED" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={lifecycleMutation.isPending}
                  onClick={() => { setActionError(null); lifecycleMutation.mutate("reactivate"); }}
                >
                  <RotateCcw className="size-3.5" /> Reactivar
                </Button>
              )}
              {data.status !== "CANCELADA" && (
                <Button size="sm" variant="destructive" onClick={() => setConfirmCancel(true)}>
                  <Trash2 className="size-3.5" /> Dar de baja
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-md border border-border p-3 text-sm">
            <p className="font-medium text-foreground">Usuario conector (soporte)</p>
            <p className="text-muted-foreground">
              {data.connectorUsername ?? "—"} ·{" "}
              {data.connectorLastLogin
                ? `último acceso ${new Date(data.connectorLastLogin).toLocaleString("es-GT")}`
                : "sin accesos registrados"}
            </p>
          </div>

          <Link
            href={`/platform-admin/dashboard/auditoria?tenantId=${tenantId}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ScrollText className="size-4" /> Ver auditoría de esta clínica
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Facturación de suscripción</CardTitle>
            {data.status !== "CANCELADA" && (
              <Button size="sm" variant={showGenerateInvoice ? "outline" : "default"} onClick={() => setShowGenerateInvoice((v) => !v)}>
                <Plus className="size-3.5" /> {showGenerateInvoice ? "Cancelar" : "Generar factura"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showGenerateInvoice && <GenerateInvoiceForm tenantId={tenantId} onDone={() => setShowGenerateInvoice(false)} />}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!invoices || invoices.items.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    Sin facturas de suscripción registradas.
                  </TableCell>
                </TableRow>
              )}
              {invoices?.items.map((inv) => (
                <TableRow key={inv.invoiceId}>
                  <TableCell>{inv.period}</TableCell>
                  <TableCell>{PLAN_LABEL[inv.plan] ?? inv.plan}</TableCell>
                  <TableCell>{currency(inv.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={inv.status === "PAGADA" ? "success" : "warning"}>
                      {inv.status === "PAGADA" ? "Pagada" : "Pendiente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {inv.status === "PENDIENTE" && (
                      <Button size="sm" variant="ghost" onClick={() => markPaidMutation.mutate(inv.invoiceId)}>
                        Marcar pagada
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dar de baja &quot;{data.name}&quot;</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente: los usuarios de la clínica no podrán volver a iniciar sesión y no hay una
              opción de reactivación desde este portal. ¿Continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={lifecycleMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                setActionError(null);
                lifecycleMutation.mutate("cancel");
              }}
            >
              {lifecycleMutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Dar de baja
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
