import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ProductBatchSummary } from "@/modules/inventory/domain/entities";

function daysUntil(date: Date): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function BatchesList({ batches }: { batches: ProductBatchSummary[] }) {
  if (batches.length === 0) {
    return <p className="text-sm text-muted-foreground">Este producto aún no tiene lotes registrados.</p>;
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lote</TableHead>
            <TableHead>Sucursal</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead>Existencia</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((b) => {
            const remaining = b.expirationDate ? daysUntil(b.expirationDate) : null;
            return (
              <TableRow key={b.batchId}>
                <TableCell className="font-medium text-foreground">{b.batchNumber}</TableCell>
                <TableCell className="text-muted-foreground">{b.branchName}</TableCell>
                <TableCell>
                  {b.expirationDate ? (
                    <span className="flex items-center gap-2">
                      {new Date(b.expirationDate).toLocaleDateString("es-GT")}
                      {remaining !== null && remaining <= 30 && (
                        <Badge variant={remaining <= 7 ? "destructive" : "warning"}>
                          {remaining <= 0 ? "Vencido" : `${remaining}d`}
                        </Badge>
                      )}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{b.quantity}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
