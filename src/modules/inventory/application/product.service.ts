import type { IProductRepository } from "../domain/repositories";
import type { ExpiringBatch, MovementListResult, MovementType, ProductDetail, ProductListResult } from "../domain/entities";
import type { CreateProductInput } from "./dto/create-product.schema";
import type { UpdateProductInput } from "./dto/update-product.schema";
import type { RegisterMovementInput } from "./dto/register-movement.schema";

function emptyToNull(value: string | undefined): string | null {
  return value ? value : null;
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export class ProductService {
  constructor(private readonly repository: IProductRepository) {}

  async createProduct(tenantId: string, input: CreateProductInput, actorUserId: string): Promise<string> {
    return this.repository.create({
      tenantId,
      sku: input.sku,
      internalCode: emptyToNull(input.internalCode),
      name: input.name,
      category: emptyToNull(input.category),
      costPrice: input.costPrice,
      salePrice: input.salePrice,
      minStock: input.minStock,
      actorUserId,
    });
  }

  async listProducts(
    tenantId: string,
    query: { search?: string; category?: string; lowStockOnly: boolean; page: number; pageSize: number },
  ): Promise<ProductListResult> {
    return this.repository.list({
      tenantId,
      search: query.search ?? null,
      category: query.category ?? null,
      lowStockOnly: query.lowStockOnly,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
  }

  async getProduct(tenantId: string, productId: string): Promise<ProductDetail | null> {
    return this.repository.get(tenantId, productId);
  }

  async updateProduct(tenantId: string, productId: string, input: UpdateProductInput, actorUserId: string): Promise<void> {
    await this.repository.update({
      tenantId,
      productId,
      name: input.name,
      category: emptyToNull(input.category),
      costPrice: input.costPrice,
      salePrice: input.salePrice,
      minStock: input.minStock,
      actorUserId,
    });
  }

  async registerMovement(
    tenantId: string,
    productId: string,
    branchId: string,
    input: RegisterMovementInput,
    actorUserId: string,
  ): Promise<string> {
    switch (input.type) {
      case "ENTRADA":
        return this.repository.registerEntrada({
          tenantId,
          productId,
          branchId,
          batchNumber: input.batchNumber,
          expirationDate: parseDate(input.expirationDate),
          quantity: input.quantity,
          notes: emptyToNull(input.notes),
          actorUserId,
        });
      case "SALIDA":
        return this.repository.registerSalida({
          tenantId,
          batchId: input.batchId,
          quantity: input.quantity,
          notes: emptyToNull(input.notes),
          actorUserId,
        });
      case "AJUSTE":
        return this.repository.registerAjuste({
          tenantId,
          batchId: input.batchId,
          newQuantity: input.newQuantity,
          notes: emptyToNull(input.notes),
          actorUserId,
        });
      case "TRANSFERENCIA":
        return this.repository.registerTransferencia({
          tenantId,
          batchId: input.batchId,
          targetBranchId: input.targetBranchId,
          quantity: input.quantity,
          notes: emptyToNull(input.notes),
          actorUserId,
        });
    }
  }

  async listMovements(
    tenantId: string,
    productId: string,
    query: { page: number; pageSize: number },
  ): Promise<MovementListResult> {
    return this.repository.listMovements({
      tenantId,
      productId,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
  }

  async listExpiringBatches(tenantId: string, maxDays = 90, limit = 20): Promise<ExpiringBatch[]> {
    return this.repository.listExpiringBatches(tenantId, maxDays, limit);
  }
}

export type { MovementType };
