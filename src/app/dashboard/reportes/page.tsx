import type { Metadata } from "next";
import { ReportCard } from "@/components/reports/report-card";

export const metadata: Metadata = { title: "Reportes" };

export default function ReportesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Reportes gerenciales con vista previa en pantalla y exportación a PDF, Excel o CSV.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReportCard
          title="Ventas"
          description="Facturas emitidas en el rango de fechas seleccionado."
          endpoint="/api/reports/sales"
          withDateRange
          columns={[
            { key: "invoiceNumber", label: "Factura" },
            { key: "ownerName", label: "Propietario" },
            { key: "issueDate", label: "Fecha" },
            { key: "total", label: "Total" },
          ]}
          summaryLabel="Total de ventas"
          summaryTotalField="totalSales"
        />

        <ReportCard
          title="Rentabilidad"
          description="Ingresos, costo y utilidad por producto vendido."
          endpoint="/api/reports/profitability"
          withDateRange
          columns={[
            { key: "productName", label: "Producto" },
            { key: "quantitySold", label: "Cantidad" },
            { key: "revenue", label: "Ingresos" },
            { key: "cost", label: "Costo" },
            { key: "profit", label: "Utilidad" },
          ]}
          summaryLabel="Utilidad total"
          summarySumItemField="profit"
        />

        <ReportCard
          title="Inventario"
          description="Existencia y valor actual de cada producto."
          endpoint="/api/reports/inventory"
          columns={[
            { key: "sku", label: "SKU" },
            { key: "name", label: "Producto" },
            { key: "totalStock", label: "Existencia" },
            { key: "stockValue", label: "Valor" },
          ]}
          summaryLabel="Valor total en inventario"
          summarySumItemField="stockValue"
        />

        <ReportCard
          title="Productos por vencer"
          description="Lotes con vencimiento próximo (90 días)."
          endpoint="/api/reports/expiring-products"
          columns={[
            { key: "productName", label: "Producto" },
            { key: "batchNumber", label: "Lote" },
            { key: "expirationDate", label: "Vencimiento" },
            { key: "quantity", label: "Existencia" },
            { key: "daysRemaining", label: "Días" },
          ]}
        />

        <ReportCard
          title="Clientes morosos"
          description="Propietarios con saldo pendiente de pago."
          endpoint="/api/reports/overdue-clients"
          columns={[
            { key: "ownerName", label: "Propietario" },
            { key: "phone", label: "Teléfono" },
            { key: "invoiceCount", label: "Facturas" },
            { key: "totalPending", label: "Saldo" },
          ]}
          summaryLabel="Total pendiente"
          summarySumItemField="totalPending"
        />

        <ReportCard
          title="Consultas realizadas"
          description="Consultas registradas en el expediente médico."
          endpoint="/api/reports/consultations"
          withDateRange
          columns={[
            { key: "entryDate", label: "Fecha" },
            { key: "petName", label: "Paciente" },
            { key: "ownerName", label: "Propietario" },
            { key: "veterinarianName", label: "Veterinario" },
          ]}
        />

        <ReportCard
          title="Veterinarios más activos"
          description="Cantidad de entradas de expediente por veterinario."
          endpoint="/api/reports/active-veterinarians"
          withDateRange
          columns={[
            { key: "veterinarianName", label: "Veterinario" },
            { key: "entryCount", label: "Entradas" },
          ]}
        />
      </div>
    </div>
  );
}
