"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api/client";

export interface ReportColumn {
  key: string;
  label: string;
}

interface ReportCardProps {
  title: string;
  description?: string;
  endpoint: string;
  columns: ReportColumn[];
  withDateRange?: boolean;
  /** Etiqueta del resumen, ej. "Total de ventas". Solo se muestra si viene junto con un campo. */
  summaryLabel?: string;
  /** Lee el total directamente de la respuesta (ej. "totalSales"). */
  summaryTotalField?: string;
  /** Suma ese campo a través de todas las filas de "items" (ej. "profit"). */
  summarySumItemField?: string;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const currency = (n: number) => `Q${n.toFixed(2)}`;
const PREVIEW_ROWS = 10;

export function ReportCard({
  title,
  description,
  endpoint,
  columns,
  withDateRange,
  summaryLabel,
  summaryTotalField,
  summarySumItemField,
}: ReportCardProps) {
  const [from, setFrom] = useState(() => daysAgo(29));
  const [to, setTo] = useState(() => daysAgo(0));

  const { data, isLoading } = useQuery({
    queryKey: ["report", endpoint, withDateRange ? from : null, withDateRange ? to : null],
    queryFn: () => {
      const params = withDateRange ? `?from=${from}&to=${to}` : "";
      return apiRequest<Record<string, unknown>>(`${endpoint}${params}`);
    },
  });

  const items = (data?.items as Record<string, unknown>[] | undefined) ?? [];

  let summaryValue: number | null = null;
  if (data && summaryTotalField) {
    summaryValue = Number(data[summaryTotalField] ?? 0);
  } else if (summarySumItemField) {
    summaryValue = items.reduce((sum, row) => sum + Number(row[summarySumItemField] ?? 0), 0);
  }

  const download = (format: "csv" | "xlsx" | "pdf") => {
    const params = new URLSearchParams();
    if (withDateRange) {
      params.set("from", from);
      params.set("to", to);
    }
    params.set("format", format);
    window.open(`${endpoint}?${params.toString()}`, "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3">
        {withDateRange && (
          <div className="flex flex-wrap gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Desde</Label>
              <Input type="date" className="h-8 w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hasta</Label>
              <Input type="date" className="h-8 w-40" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        )}

        <div className="max-h-64 overflow-auto rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} className="py-6 text-center text-muted-foreground">
                    Sin datos para mostrar.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                items.slice(0, PREVIEW_ROWS).map((row, i) => (
                  <TableRow key={i}>
                    {columns.map((c) => (
                      <TableCell key={c.key}>{String(row[c.key] ?? "")}</TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>

        {items.length > PREVIEW_ROWS && (
          <p className="text-xs text-muted-foreground">
            Mostrando {PREVIEW_ROWS} de {items.length} filas. Exporta para ver el detalle completo.
          </p>
        )}

        {summaryLabel && summaryValue !== null && (
          <p className="text-sm font-semibold text-foreground">
            {summaryLabel}: {currency(summaryValue)}
          </p>
        )}

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => download("csv")}>
            <Download className="size-3.5" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={() => download("xlsx")}>
            <Download className="size-3.5" /> Excel
          </Button>
          <Button size="sm" variant="outline" onClick={() => download("pdf")}>
            <Download className="size-3.5" /> PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
