import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { reportService, REPORTS_PERMISSIONS } from "@/modules/reports";
import { buildReportExport, type ReportExportFormat } from "@/lib/reports/export";

const COLUMNS = [
  { key: "sku", label: "SKU" },
  { key: "name", label: "Producto" },
  { key: "totalStock", label: "Existencia" },
  { key: "costPrice", label: "Costo" },
  { key: "salePrice", label: "Precio" },
  { key: "stockValue", label: "Valor en inventario" },
];

export async function GET(request: Request) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, REPORTS_PERMISSIONS.VIEW, request);

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") ?? "json") as ReportExportFormat | "json";

    const items = await reportService.getInventory(ctx.tenantId!);

    if (format === "json") {
      return NextResponse.json({ items });
    }

    const { buffer, contentType, extension } = await buildReportExport(format, "Reporte de inventario", COLUMNS, items);
    return new NextResponse(buffer, {
      headers: { "Content-Type": contentType, "Content-Disposition": `attachment; filename="inventario.${extension}"` },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
