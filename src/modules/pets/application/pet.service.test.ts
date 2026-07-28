import { describe, it, expect, vi } from "vitest";
import { PetService } from "./pet.service";
import type { IPetRepository } from "../domain/repositories";
import type { PetDetail } from "../domain/entities";

const EXISTING_PET: PetDetail = {
  petId: "pet-1",
  branchId: "branch-1",
  branchName: "Central",
  ownerId: "owner-1",
  ownerName: "Juan Pérez",
  name: "Firulais",
  species: "Perro",
  breed: "Labrador",
  sex: "MACHO",
  birthDate: new Date("2020-01-01"),
  weightKg: 20,
  color: "Café",
  photoUrl: null,
  microchipNumber: null,
  status: "ACTIVO",
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRepoMock(existing: PetDetail | null = EXISTING_PET): IPetRepository {
  return {
    create: vi.fn().mockResolvedValue("pet-1"),
    list: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
    get: vi.fn().mockResolvedValue(existing),
    update: vi.fn().mockResolvedValue(undefined),
  };
}

const TENANT_ID = "tenant-1";
const BRANCH_ID = "branch-1";

describe("PetService.createPet", () => {
  it("uses the branchId passed by the caller (the user's own branch), never from the client body", async () => {
    const repo = makeRepoMock();
    const service = new PetService(repo);

    await service.createPet(
      TENANT_ID,
      BRANCH_ID,
      { ownerId: "owner-1", name: "Firulais", species: "Perro", breed: "", sex: "MACHO", birthDate: "", color: "" },
      "actor-1",
    );

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: TENANT_ID, branchId: BRANCH_ID, ownerId: "owner-1" }),
    );
  });

  it("parses an empty birthDate string as null instead of an Invalid Date", async () => {
    const repo = makeRepoMock();
    const service = new PetService(repo);

    await service.createPet(
      TENANT_ID,
      BRANCH_ID,
      { ownerId: "owner-1", name: "Firulais", species: "Perro" },
      "actor-1",
    );

    const call = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.birthDate).toBeNull();
  });
});

describe("PetService.updatePet", () => {
  it("keeps the existing ownerId/branchId — this phase never exposes reassigning them", async () => {
    const repo = makeRepoMock();
    const service = new PetService(repo);

    await service.updatePet(
      TENANT_ID,
      "pet-1",
      { name: "Firulais", species: "Perro", status: "HOSPITALIZADO" },
      "actor-2",
    );

    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: EXISTING_PET.ownerId,
        branchId: EXISTING_PET.branchId,
        status: "HOSPITALIZADO",
        actorUserId: "actor-2",
      }),
    );
  });

  it("throws a 404 ApiError when the pet does not exist for this tenant", async () => {
    const repo = makeRepoMock(null);
    const service = new PetService(repo);

    await expect(
      service.updatePet(TENANT_ID, "missing-pet", { name: "X", species: "Perro", status: "ACTIVO" }, "actor-2"),
    ).rejects.toMatchObject({ status: 404 });

    expect(repo.update).not.toHaveBeenCalled();
  });
});
