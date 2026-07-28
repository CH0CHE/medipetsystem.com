import type { IOwnerRepository } from "../domain/repositories";
import type { FinancialStatus, OwnerDetail, OwnerListResult } from "../domain/entities";
import type { CreateOwnerInput } from "./dto/create-owner.schema";
import type { UpdateOwnerInput } from "./dto/update-owner.schema";

function emptyToNull(value: string | undefined): string | null {
  return value ? value : null;
}

export class OwnerService {
  constructor(private readonly ownerRepository: IOwnerRepository) {}

  async createOwner(tenantId: string, input: CreateOwnerInput, createdByUserId: string): Promise<string> {
    return this.ownerRepository.create({
      tenantId,
      fullName: input.fullName,
      documentId: emptyToNull(input.documentId),
      phone: emptyToNull(input.phone),
      email: emptyToNull(input.email),
      address: emptyToNull(input.address),
      notes: emptyToNull(input.notes),
      createdByUserId,
    });
  }

  async listOwners(
    tenantId: string,
    query: { search?: string; financialStatus?: FinancialStatus; page: number; pageSize: number },
  ): Promise<OwnerListResult> {
    return this.ownerRepository.list({
      tenantId,
      search: query.search ?? null,
      financialStatus: query.financialStatus ?? null,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
  }

  async getOwner(tenantId: string, ownerId: string): Promise<OwnerDetail | null> {
    return this.ownerRepository.get(tenantId, ownerId);
  }

  async updateOwner(
    tenantId: string,
    ownerId: string,
    input: UpdateOwnerInput,
    actorUserId: string,
  ): Promise<void> {
    await this.ownerRepository.update({
      tenantId,
      ownerId,
      fullName: input.fullName,
      documentId: emptyToNull(input.documentId),
      phone: emptyToNull(input.phone),
      email: emptyToNull(input.email),
      address: emptyToNull(input.address),
      financialStatus: input.financialStatus,
      notes: emptyToNull(input.notes),
      actorUserId,
    });
  }
}
