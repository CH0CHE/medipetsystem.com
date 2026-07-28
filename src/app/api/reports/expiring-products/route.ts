import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/http/api-error";
import { requireAuthContext, requirePermission } from "@/lib/auth/require-permission";
import { productService, INVENTORY_PERMISSIONS } from "@/modules/inventory";
import { buildReportExport, type ReportExportFormat } from "@/lib/reports/export";

const COLUMNS = [
  { key: "productName", label: "Producto" },
  { key: "sku", label: "SKU" },
  { key: "branchName", label: "Sucursal" },
  { key: "batchNumber", label: "Lote" },
  { key: "expirationDate", label: "Vencimiento" },
  { key: "quantity", label: "Existencia" },
  { key: "daysRemaining", label: "Días restantes" },
];

export async function GET(request: Request) {
  try {
    const ctx = await requireAuthContext("tenant");
    await requirePermission(ctx, INVENTORY_PERMISSIONS.VIEW, request);

    const { searchParams } = new URL(request.url);
    const maxDays = Number(searchParams.get("maxDays") ?? 90);
    const format = (searchParams.get("format") ?? "json") as ReportExportFormat | "json";

    const items = await productService.listExpiringBatches(ctx.tenantId!, maxDays, 500);
    const rows = items.map((r) => ({
      productName: r.productName,
      sku: r.sku,
      branchName: r.branchName,
      batchNumber: r.batchNumber,
      expirationDate: r.expirationDate ? new Date(r.expirationDate).toISOString().slice(0, 10) : "",
      quantity: r.quantity,
      daysRemaining: r.daysRemaining,
    }));

    if (format === "json") {
      return NextResponse.json({ items });
    }

    const { buffer, contentType, extension } = await buildReportExport(format, "Productos por vencer", COLUMNS, rows);
    return new NextResponse(buffer, {
      headers: { "Content-Type": contentType, "Content-Disposition": `attachment; filename="productos-por-vencer.${extension}"` },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
