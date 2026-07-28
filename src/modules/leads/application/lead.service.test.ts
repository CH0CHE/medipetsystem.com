import { describe, it, expect, vi } from "vitest";
import { LeadService } from "./lead.service";
import type { ILeadRepository } from "../domain/repositories";

function makeRepoMock(): ILeadRepository {
  return {
    create: vi.fn().mockResolvedValue("lead-1"),
    list: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    updateStatus: vi.fn().mockResolvedValue(undefined),
  };
}

describe("LeadService.createLead", () => {
  it("normalizes empty optional fields to null", async () => {
    const repo = makeRepoMock();
    const service = new LeadService(repo);

    const id = await service.createLead({
      fullName: "Ana Pérez",
      email: "ana@example.com",
      phone: "",
      clinicName: "",
      message: "",
      source: "CONTACTO",
    });

    expect(id).toBe("lead-1");
    expect(repo.create).toHaveBeenCalledWith({
      fullName: "Ana Pérez",
      email: "ana@example.com",
      phone: null,
      clinicName: null,
      message: null,
      source: "CONTACTO",
    });
  });

  it("preserves the clinic name for a demo request", async () => {
    const repo = makeRepoMock();
    const service = new LeadService(repo);

    await service.createLead({
      fullName: "Carlos Ruiz",
      email: "carlos@clinica.com",
      phone: "12345678",
      clinicName: "Clínica Veterinaria Norte",
      message: "Quiero una demo",
      source: "DEMO",
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ clinicName: "Clínica Veterinaria Norte", source: "DEMO" }),
    );
  });
});

describe("LeadService.listLeads", () => {
  it("converts page/pageSize into limit/offset and forwards filters", async () => {
    const repo = makeRepoMock();
    const service = new LeadService(repo);

    await service.listLeads({ status: "NUEVO", source: "DEMO", page: 3, pageSize: 15 });

    expect(repo.list).toHaveBeenCalledWith({ status: "NUEVO", source: "DEMO", limit: 15, offset: 30 });
  });
});

describe("LeadService.updateLeadStatus", () => {
  it("delegates to the repository", async () => {
    const repo = makeRepoMock();
    const service = new LeadService(repo);

    await service.updateLeadStatus("lead-1", "CONTACTADO", "actor-1");

    expect(repo.updateStatus).toHaveBeenCalledWith("lead-1", "CONTACTADO", "actor-1");
  });
});
