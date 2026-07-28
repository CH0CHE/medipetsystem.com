"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest, ApiClientError } from "@/lib/api/client";
import type { LeadListResult, LeadStatus } from "@/modules/leads/domain/entities";

const REFRESH_PATH = "/api/platform-admin/auth/refresh";
const QUERY_KEY = ["platform-admin", "leads"];

const STATUS_LABEL: Record<LeadStatus, string> = {
  NUEVO: "Nuevo",
  CONTACTADO: "Contactado",
  CONVERTIDO: "Convertido",
  DESCARTADO: "Descartado",
};
const STATUS_VARIANT: Record<LeadStatus, "secondary" | "warning" | "success" | "destructive"> = {
  NUEVO: "secondary",
  CONTACTADO: "warning",
  CONVERTIDO: "success",
  DESCARTADO: "destructive",
};
const SOURCE_LABEL: Record<string, string> = { CONTACTO: "Contacto", DEMO: "Solicitud de demo" };

function buildQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  return search.toString();
}

export function LeadsTable() {
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEY, status, source],
    queryFn: () =>
      apiRequest<LeadListResult>(
        `/api/platform-admin/leads?${buildQuery({
          status: status === "all" ? undefined : status,
          source: source === "all" ? undefined : source,
          pageSize: 100,
        })}`,
        { refreshPath: REFRESH_PATH },
      ),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: LeadStatus }) =>
      apiRequest(`/api/platform-admin/leads/${id}/status`, {
        method: "PATCH",
        body: { status: newStatus },
        refreshPath: REFRESH_PATH,
      }),
    onSuccess: () => {
      toast.success("Estado actualizado.");
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "No se pudo actualizar el estado.");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="NUEVO">Nuevo</SelectItem>
            <SelectItem value="CONTACTADO">Contactado</SelectItem>
            <SelectItem value="CONVERTIDO">Convertido</SelectItem>
            <SelectItem value="DESCARTADO">Descartado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Origen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los orígenes</SelectItem>
            <SelectItem value="CONTACTO">Contacto</SelectItem>
            <SelectItem value="DEMO">Solicitud de demo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Clínica</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading && data?.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No hay leads con estos filtros.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              data?.items.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="text-muted-foreground">
                    {new Date(lead.createdAt).toLocaleDateString("es-GT")}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{lead.fullName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    <div>{lead.email}</div>
                    {lead.phone && <div className="text-xs">{lead.phone}</div>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{lead.clinicName ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="mono">{SOURCE_LABEL[lead.source]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={lead.status}
                      onValueChange={(v) => statusMutation.mutate({ id: lead.id, newStatus: v as LeadStatus })}
                    >
                      <SelectTrigger className="h-8 w-40">
                        <SelectValue>
                          <Badge variant={STATUS_VARIANT[lead.status]}>{STATUS_LABEL[lead.status]}</Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NUEVO">Nuevo</SelectItem>
                        <SelectItem value="CONTACTADO">Contactado</SelectItem>
                        <SelectItem value="CONVERTIDO">Convertido</SelectItem>
                        <SelectItem value="DESCARTADO">Descartado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
