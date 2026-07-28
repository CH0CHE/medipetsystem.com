import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export interface ReportColumn {
  key: string;
  label: string;
}

export type ReportRow = Record<string, unknown>;

export type ReportExportFormat = "csv" | "xlsx" | "pdf";

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildCsvBuffer<T extends object>(columns: ReportColumn[], rows: T[]): Buffer {
  const header = columns.map((c) => csvEscape(c.label)).join(",");
  const lines = rows.map((row) =>
    columns.map((c) => csvEscape((row as ReportRow)[c.key])).join(","),
  );
  return Buffer.from([header, ...lines].join("\r\n"), "utf-8");
}

export async function buildXlsxBuffer<T extends object>(title: string, columns: ReportColumn[], rows: T[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(title.slice(0, 31));
  sheet.columns = columns.map((c) => ({ header: c.label, key: c.key }));
  sheet.getRow(1).font = { bold: true };
  rows.forEach((row) => sheet.addRow(row as ReportRow));
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

export async function buildPdfBuffer<T extends object>(title: string, columns: ReportColumn[], rows: T[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 30, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).text(title, { underline: true });
    doc.moveDown();

    const columnWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / columns.length;
    const startX = doc.page.margins.left;

    function drawRow(values: string[], y: number, bold: boolean) {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9);
      values.forEach((value, i) => {
        doc.text(value, startX + i * columnWidth, y, { width: columnWidth - 5, ellipsis: true });
      });
    }

    let y = doc.y;
    drawRow(columns.map((c) => c.label), y, true);
    y += 18;
    doc.moveTo(startX, y - 4).lineTo(doc.page.width - doc.page.margins.right, y - 4).stroke();

    for (const row of rows) {
      if (y > doc.page.height - doc.page.margins.bottom - 20) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      drawRow(columns.map((c) => String((row as ReportRow)[c.key] ?? "")), y, false);
      y += 16;
    }

    if (rows.length === 0) {
      doc.font("Helvetica").fontSize(9).text("Sin datos para los filtros seleccionados.", startX, y);
    }

    doc.end();
  });
}

export async function buildReportExport<T extends object>(
  format: ReportExportFormat,
  title: string,
  columns: ReportColumn[],
  rows: T[],
): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
  if (format === "csv") {
    return { buffer: buildCsvBuffer(columns, rows), contentType: "text/csv; charset=utf-8", extension: "csv" };
  }
  if (format === "xlsx") {
    return {
      buffer: await buildXlsxBuffer(title, columns, rows),
      contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      extension: "xlsx",
    };
  }
  return { buffer: await buildPdfBuffer(title, columns, rows), contentType: "application/pdf", extension: "pdf" };
}
