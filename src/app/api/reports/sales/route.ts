import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { reportService, dateRangeQuerySchema, REPORTS_PERMISSIONS } from "@/modules/reports";
import { buildReportExport, type ReportExportFormat } from "@/lib/reports/export";

const COLUMNS = [
  { key: "invoiceNumber", label: "Factura" },
  { key: "ownerName", label: "Propietario" },
  { key: "issueDate", label: "Fecha" },
  { key: "total", label: "Total" },
];

export async function GET(request: Request) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, REPORTS_PERMISSIONS.VIEW, request);

    const { searchParams } = new URL(request.url);
    const query = dateRangeQuerySchema.parse({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });
    const format = (searchParams.get("format") ?? "json") as ReportExportFormat | "json";

    const result = await reportService.getSales(ctx.tenantId!, query);
    const rows = result.items.map((r) => ({
      invoiceNumber: r.invoiceNumber,
      ownerName: r.ownerName,
      issueDate: r.issueDate.toISOString().slice(0, 10),
      total: r.total,
    }));

    if (format === "json") {
      return NextResponse.json({ items: rows, totalSales: result.totalSales });
    }

    const { buffer, contentType, extension } = await buildReportExport(format, "Reporte de ventas", COLUMNS, rows);
    return new NextResponse(buffer, {
      headers: { "Content-Type": contentType, "Content-Disposition": `attachment; filename="ventas.${extension}"` },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
