import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { reportService, dateRangeQuerySchema, REPORTS_PERMISSIONS } from "@/modules/reports";
import { buildReportExport, type ReportExportFormat } from "@/lib/reports/export";

const COLUMNS = [
  { key: "entryDate", label: "Fecha" },
  { key: "petName", label: "Paciente" },
  { key: "ownerName", label: "Propietario" },
  { key: "veterinarianName", label: "Veterinario" },
  { key: "diagnosis", label: "Diagnóstico" },
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

    const items = await reportService.getConsultations(ctx.tenantId!, query);
    const rows = items.map((r) => ({
      entryDate: r.entryDate.toISOString().slice(0, 10),
      petName: r.petName,
      ownerName: r.ownerName,
      veterinarianName: r.veterinarianName,
      diagnosis: r.diagnosis ?? "",
    }));

    if (format === "json") {
      return NextResponse.json({ items });
    }

    const { buffer, contentType, extension } = await buildReportExport(format, "Consultas realizadas", COLUMNS, rows);
    return new NextResponse(buffer, {
      headers: { "Content-Type": contentType, "Content-Disposition": `attachment; filename="consultas.${extension}"` },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
