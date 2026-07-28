import { describe, it, expect } from "vitest";
import { buildCsvBuffer, buildXlsxBuffer, buildPdfBuffer } from "./export";

const columns = [
  { key: "name", label: "Nombre" },
  { key: "total", label: "Total" },
];

const rows = [
  { name: "Vacuna Antirrábica", total: 360 },
  { name: 'Producto con "comillas", y coma', total: 12.5 },
];

describe("buildCsvBuffer", () => {
  it("writes a header row and one row per data entry", () => {
    const csv = buildCsvBuffer(columns, rows).toString("utf-8");
    const lines = csv.split("\r\n");

    expect(lines[0]).toBe("Nombre,Total");
    expect(lines[1]).toBe("Vacuna Antirrábica,360");
    expect(lines).toHaveLength(3);
  });

  it("quotes and escapes values containing commas or double quotes", () => {
    const csv = buildCsvBuffer(columns, rows).toString("utf-8");
    expect(csv).toContain('"Producto con ""comillas"", y coma"');
  });

  it("produces just the header when there are no rows", () => {
    const csv = buildCsvBuffer(columns, []).toString("utf-8");
    expect(csv).toBe("Nombre,Total");
  });
});

describe("buildXlsxBuffer", () => {
  it("produces a non-empty xlsx buffer", async () => {
    const buffer = await buildXlsxBuffer("Reporte", columns, rows);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 2).toString("hex")).toBe("504b"); // firma ZIP (xlsx es un zip)
  });
});

describe("buildPdfBuffer", () => {
  it("produces a non-empty PDF buffer", async () => {
    const buffer = await buildPdfBuffer("Reporte", columns, rows);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 4).toString("utf-8")).toBe("%PDF");
  });

  it("does not throw when there are no rows", async () => {
    const buffer = await buildPdfBuffer("Reporte vacío", columns, []);
    expect(buffer.subarray(0, 4).toString("utf-8")).toBe("%PDF");
  });
});
