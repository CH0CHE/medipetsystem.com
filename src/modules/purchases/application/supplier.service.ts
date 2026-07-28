import type { ISupplierRepository } from "../domain/repositories";
import type { SupplierDetail, SupplierListResult } from "../domain/entities";
import type { CreateSupplierInput } from "./dto/create-supplier.schema";
import type { UpdateSupplierInput } from "./dto/update-supplier.schema";

function emptyToNull(value: string | undefined): string | null {
  return value ? value : null;
}

export class SupplierService {
  constructor(private readonly repository: ISupplierRepository) {}

  async createSupplier(tenantId: string, input: CreateSupplierInput, actorUserId: string): Promise<string> {
    return this.repository.create({
      tenantId,
      name: input.name,
      taxId: emptyToNull(input.taxId),
      phone: emptyToNull(input.phone),
      email: emptyToNull(input.email),
      address: emptyToNull(input.address),
      notes: emptyToNull(input.notes),
      actorUserId,
    });
  }

  async listSuppliers(
    tenantId: string,
    query: { search?: string; page: number; pageSize: number },
  ): Promise<SupplierListResult> {
    return this.repository.list({
      tenantId,
      search: query.search ?? null,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
  }

  async getSupplier(tenantId: string, supplierId: string): Promise<SupplierDetail | null> {
    return this.repository.get(tenantId, supplierId);
  }

  async updateSupplier(tenantId: string, supplierId: string, input: UpdateSupplierInput, actorUserId: string): Promise<void> {
    await this.repository.update({
      tenantId,
      supplierId,
      name: input.name,
      taxId: emptyToNull(input.taxId),
      phone: emptyToNull(input.phone),
      email: emptyToNull(input.email),
      address: emptyToNull(input.address),
      notes: emptyToNull(input.notes),
      actorUserId,
    });
  }
}
