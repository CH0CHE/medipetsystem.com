import { describe, it, expect, vi } from "vitest";
import { MedicalRecordService } from "./medical-record.service";
import type { IMedicalRecordRepository } from "../domain/repositories";

function makeRepoMock(): IMedicalRecordRepository {
  return {
    createEntry: vi.fn().mockResolvedValue("entry-1"),
    listEntries: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    getEntry: vi.fn().mockResolvedValue(null),
    addAttachment: vi.fn().mockResolvedValue("attachment-1"),
  };
}

const TENANT_ID = "tenant-1";
const PET_ID = "pet-1";
const VET_ID = "vet-1";

describe("MedicalRecordService.createEntry", () => {
  it("passes tenantId/petId/veterinarianId explicitly and only fills CONSULTA fields", async () => {
    const repo = makeRepoMock();
    const service = new MedicalRecordService(repo);

    await service.createEntry(TENANT_ID, PET_ID, VET_ID, {
      type: "CONSULTA",
      entryDate: "2026-01-15",
      title: "Chequeo anual",
      diagnosis: "Sano",
      symptoms: "",
      treatment: "",
    });

    expect(repo.createEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT_ID,
        petId: PET_ID,
        veterinarianId: VET_ID,
        type: "CONSULTA",
        diagnosis: "Sano",
        symptoms: null,
        vaccineName: null,
        medicationName: null,
      }),
    );
  });

  it("fills only VACUNA fields, leaving other type-specific fields null", async () => {
    const repo = makeRepoMock();
    const service = new MedicalRecordService(repo);

    await service.createEntry(TENANT_ID, PET_ID, VET_ID, {
      type: "VACUNA",
      entryDate: "2026-01-15",
      title: "Vacuna antirrábica",
      vaccineName: "Antirrábica",
      nextDueDate: "2027-01-15",
    });

    const call = (repo.createEntry as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.vaccineName).toBe("Antirrábica");
    expect(call.nextDueDate).toBeInstanceOf(Date);
    expect(call.diagnosis).toBeNull();
    expect(call.procedureName).toBeNull();
  });

  it("parses an empty optional date as null instead of an Invalid Date", async () => {
    const repo = makeRepoMock();
    const service = new MedicalRecordService(repo);

    await service.createEntry(TENANT_ID, PET_ID, VET_ID, {
      type: "VACUNA",
      entryDate: "2026-01-15",
      title: "Vacuna",
      vaccineName: "Antirrábica",
      nextDueDate: "",
    });

    const call = (repo.createEntry as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.nextDueDate).toBeNull();
  });
});

describe("MedicalRecordService.listEntries", () => {
  it("converts page/pageSize into limit/offset scoped to the tenant and pet", async () => {
    const repo = makeRepoMock();
    const service = new MedicalRecordService(repo);

    await service.listEntries(TENANT_ID, { petId: PET_ID, page: 2, pageSize: 5 });

    expect(repo.listEntries).toHaveBeenCalledWith({
      tenantId: TENANT_ID,
      petId: PET_ID,
      type: null,
      limit: 5,
      offset: 5,
    });
  });
});

describe("MedicalRecordService.addAttachment", () => {
  it("forwards the tenantId, entry id and uploader to the repository", async () => {
    const repo = makeRepoMock();
    const service = new MedicalRecordService(repo);

    await service.addAttachment(TENANT_ID, "entry-9", { fileUrl: "https://x.com/a.pdf", fileType: "PDF", label: "" }, "actor-1");

    expect(repo.addAttachment).toHaveBeenCalledWith({
      tenantId: TENANT_ID,
      medicalRecordEntryId: "entry-9",
      fileUrl: "https://x.com/a.pdf",
      fileType: "PDF",
      label: null,
      uploadedByUserId: "actor-1",
    });
  });
});
