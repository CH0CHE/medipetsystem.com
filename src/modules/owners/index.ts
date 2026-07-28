import { OwnerService } from "./application/owner.service";
import { ownerRepository } from "./infrastructure/owner.repository";

export const ownerService = new OwnerService(ownerRepository);

export * from "./domain/entities";
export * from "./domain/permissions";
export { createOwnerSchema, type CreateOwnerInput } from "./application/dto/create-owner.schema";
export { updateOwnerSchema, type UpdateOwnerInput } from "./application/dto/update-owner.schema";
export { listOwnersQuerySchema, type ListOwnersQuery } from "./application/dto/list-owners.schema";
