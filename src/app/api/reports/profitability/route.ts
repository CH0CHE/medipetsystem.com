import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { reportService, dateRangeQuerySchema, REPORTS_PERMISSIONS } from "@/modules/reports";
import { buildReportExport, type ReportExportFormat } from "@/lib/reports/export";

const COLUMNS = [
  { key: "productName", label: "Producto" },
  { key: "quantitySold", label: "Cantidad vendida" },
  { key: "revenue", label: "Ingresos" },
  { key: "cost", label: "Costo" },
  { key: "profit", label: "Rentabilidad" },
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

    const items = await reportService.getProfitability(ctx.tenantId!, query);

    if (format === "json") {
      return NextResponse.json({ items });
    }

    const { buffer, contentType, extension } = await buildReportExport(format, "Rentabilidad", COLUMNS, items);
    return new NextResponse(buffer, {
      headers: { "Content-Type": contentType, "Content-Disposition": `attachment; filename="rentabilidad.${extension}"` },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
