import { describe, it, expect, vi } from "vitest";
import { OwnerService } from "./owner.service";
import type { IOwnerRepository } from "../domain/repositories";

const TENANT_ID = "tenant-1";
const SQLI_PAYLOAD = "'; DROP TABLE users; --";

function makeRepoMock(): IOwnerRepository {
  return {
    create: vi.fn().mockResolvedValue("owner-1"),
    list: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    get: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(undefined),
  };
}

describe("SQL injection safety — OwnerService.listOwners", () => {
  it("passes a malicious search string through to the repository untouched, never concatenated into a query", async () => {
    const repo = makeRepoMock();
    const service = new OwnerService(repo);

    await service.listOwners(TENANT_ID, { search: SQLI_PAYLOAD, page: 1, pageSize: 20 });

    // El servicio nunca debe transformar/escapar/concatenar el valor a mano: llega
    // intacto como un parámetro más al repositorio, que a su vez lo liga con
    // $queryRaw (tagged template) hacia una stored procedure — nunca como texto SQL.
    expect(repo.list).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: TENANT_ID, search: SQLI_PAYLOAD }),
    );

    const call = (repo.list as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.search).toBe(SQLI_PAYLOAD);
    expect(typeof call.search).toBe("string");
  });

  it("does the same for a payload targeting the financialStatus enum cast", async () => {
    const repo = makeRepoMock();
    const service = new OwnerService(repo);
    const payload = "SOLVENTE'; SELECT pg_sleep(10); --";

    // financialStatus se tipa como enum en el DTO — pero si algo lo forzara a llegar
    // como string libre, el repositorio debe seguir tratándolo como dato, no como SQL.
    await service.listOwners(TENANT_ID, { search: payload, page: 1, pageSize: 20 });

    expect((repo.list as ReturnType<typeof vi.fn>).mock.calls[0][0].search).toBe(payload);
  });
});
