import { PetService } from "./application/pet.service";
import { petRepository } from "./infrastructure/pet.repository";

export const petService = new PetService(petRepository);

export * from "./domain/entities";
export * from "./domain/permissions";
export { createPetSchema, type CreatePetInput } from "./application/dto/create-pet.schema";
export { updatePetSchema, type UpdatePetInput } from "./application/dto/update-pet.schema";
export { listPetsQuerySchema, type ListPetsQuery } from "./application/dto/list-pets.schema";
