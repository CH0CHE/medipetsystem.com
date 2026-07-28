import type { PetDetail, PetListResult, PetSex, PetStatus } from "./entities";

export interface CreatePetRepoInput {
  tenantId: string;
  branchId: string;
  ownerId: string;
  name: string;
  species: string;
  breed: string | null;
  sex: PetSex | null;
  birthDate: Date | null;
  weightKg: number | null;
  color: string | null;
  photoUrl: string | null;
  microchipNumber: string | null;
  createdByUserId: string;
}

export interface UpdatePetRepoInput {
  tenantId: string;
  petId: string;
  branchId: string;
  ownerId: string;
  name: string;
  species: string;
  breed: string | null;
  sex: PetSex | null;
  birthDate: Date | null;
  weightKg: number | null;
  color: string | null;
  photoUrl: string | null;
  microchipNumber: string | null;
  status: PetStatus;
  notes: string | null;
  actorUserId: string;
}

export interface IPetRepository {
  create(input: CreatePetRepoInput): Promise<string>;

  list(input: {
    tenantId: string;
    search: string | null;
    species: string | null;
    status: PetStatus | null;
    ownerId: string | null;
    limit: number;
    offset: number;
  }): Promise<PetListResult>;

  get(tenantId: string, petId: string): Promise<PetDetail | null>;

  update(input: UpdatePetRepoInput): Promise<void>;
}
