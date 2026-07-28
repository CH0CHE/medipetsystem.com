import { ApiError } from "@/lib/http/api-error";
import type { IPetRepository } from "../domain/repositories";
import type { PetDetail, PetListResult, PetSex, PetStatus } from "../domain/entities";
import type { CreatePetInput } from "./dto/create-pet.schema";
import type { UpdatePetInput } from "./dto/update-pet.schema";

function emptyToNull(value: string | undefined): string | null {
  return value ? value : null;
}

function parseBirthDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export class PetService {
  constructor(private readonly petRepository: IPetRepository) {}

  async createPet(tenantId: string, branchId: string, input: CreatePetInput, createdByUserId: string): Promise<string> {
    return this.petRepository.create({
      tenantId,
      branchId,
      ownerId: input.ownerId,
      name: input.name,
      species: input.species,
      breed: emptyToNull(input.breed),
      sex: (input.sex as PetSex) ?? null,
      birthDate: parseBirthDate(input.birthDate),
      weightKg: input.weightKg ?? null,
      color: emptyToNull(input.color),
      photoUrl: emptyToNull(input.photoUrl),
      microchipNumber: emptyToNull(input.microchipNumber),
      createdByUserId,
    });
  }

  async listPets(
    tenantId: string,
    query: {
      search?: string;
      species?: string;
      status?: PetStatus;
      ownerId?: string;
      page: number;
      pageSize: number;
    },
  ): Promise<PetListResult> {
    return this.petRepository.list({
      tenantId,
      search: query.search ?? null,
      species: query.species ?? null,
      status: query.status ?? null,
      ownerId: query.ownerId ?? null,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
  }

  async getPet(tenantId: string, petId: string): Promise<PetDetail | null> {
    return this.petRepository.get(tenantId, petId);
  }

  /** El propietario y la sucursal quedan fijos desde la creación — esta fase no expone reasignarlos. */
  async updatePet(tenantId: string, petId: string, input: UpdatePetInput, actorUserId: string): Promise<void> {
    const existing = await this.petRepository.get(tenantId, petId);
    if (!existing) {
      throw new ApiError(404, "Paciente no encontrado.", "NOT_FOUND");
    }

    await this.petRepository.update({
      tenantId,
      petId,
      branchId: existing.branchId,
      ownerId: existing.ownerId,
      name: input.name,
      species: input.species,
      breed: emptyToNull(input.breed),
      sex: (input.sex as PetSex) ?? null,
      birthDate: parseBirthDate(input.birthDate),
      weightKg: input.weightKg ?? null,
      color: emptyToNull(input.color),
      photoUrl: emptyToNull(input.photoUrl),
      microchipNumber: emptyToNull(input.microchipNumber),
      status: input.status,
      notes: emptyToNull(input.notes),
      actorUserId,
    });
  }
}
