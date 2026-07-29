import { describe, it, expect, vi } from "vitest";
import { ProductService } from "./product.service";
import type { IProductRepository } from "../domain/repositories";

const TENANT_ID = "tenant-1";
const SQLI_PAYLOAD = "'; DROP TABLE products; --";

function makeRepoMock(): IProductRepository {
  return {
    create: vi.fn().mockResolvedValue("product-1"),
    list: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    get: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(undefined),
    registerEntrada: vi.fn().mockResolvedValue("movement-1"),
    registerSalida: vi.fn().mockResolvedValue("movement-2"),
    registerAjuste: vi.fn().mockResolvedValue("movement-3"),
    registerTransferencia: vi.fn().mockResolvedValue("movement-4"),
    listMovements: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    listExpiringBatches: vi.fn().mockResolvedValue([]),
  };
}

describe("SQL injection safety — ProductService.listProducts", () => {
  it("passes a malicious search string through to the repository untouched, never concatenated into a query", async () => {
    const repo = makeRepoMock();
    const service = new ProductService(repo);

    await service.listProducts(TENANT_ID, { search: SQLI_PAYLOAD, lowStockOnly: false, page: 1, pageSize: 20 });

    // Igual que en el resto de la aplicación: el valor llega intacto al repositorio,
    // que lo liga con $queryRaw (tagged template) hacia sp_list_products — nunca se
    // concatena a mano en ninguna capa intermedia.
    const call = (repo.list as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(call.search).toBe(SQLI_PAYLOAD);
    expect(call.tenantId).toBe(TENANT_ID);
  });

  it("does the same for a payload targeting the category filter", async () => {
    const repo = makeRepoMock();
    const service = new ProductService(repo);
    const payload = "Vacunas' OR '1'='1";

    await service.listProducts(TENANT_ID, { category: payload, lowStockOnly: false, page: 1, pageSize: 20 });

    expect((repo.list as ReturnType<typeof vi.fn>).mock.calls[0]![0].category).toBe(payload);
  });
});
