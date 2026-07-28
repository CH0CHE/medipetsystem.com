import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { reportService, REPORTS_PERMISSIONS } from "@/modules/reports";
import { buildReportExport, type ReportExportFormat } from "@/lib/reports/export";

const COLUMNS = [
  { key: "ownerName", label: "Propietario" },
  { key: "phone", label: "Teléfono" },
  { key: "invoiceCount", label: "Facturas pendientes" },
  { key: "totalPending", label: "Total pendiente" },
];

export async function GET(request: Request) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, REPORTS_PERMISSIONS.VIEW, request);

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") ?? "json") as ReportExportFormat | "json";

    const items = await reportService.getOverdueClients(ctx.tenantId!);
    const rows = items.map((r) => ({ ...r, phone: r.phone ?? "" }));

    if (format === "json") {
      return NextResponse.json({ items });
    }

    const { buffer, contentType, extension } = await buildReportExport(format, "Clientes morosos", COLUMNS, rows);
    return new NextResponse(buffer, {
      headers: { "Content-Type": contentType, "Content-Disposition": `attachment; filename="clientes-morosos.${extension}"` },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
