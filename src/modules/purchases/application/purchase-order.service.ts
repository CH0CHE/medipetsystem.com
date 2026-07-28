import type { IPurchaseOrderRepository } from "../domain/repositories";
import type { PurchaseOrderDetail, PurchaseOrderListResult, PurchaseOrderStatus } from "../domain/entities";
import type { CreatePurchaseOrderInput } from "./dto/create-purchase-order.schema";
import type { ReceivePurchaseOrderInput } from "./dto/receive-purchase-order.schema";

function emptyToNull(value: string | undefined): string | null {
  return value ? value : null;
}

function requiredDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Fecha inválida.");
  return date;
}

function optionalDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Fecha inválida.");
  return date;
}

export class PurchaseOrderService {
  constructor(private readonly repository: IPurchaseOrderRepository) {}

  async createPurchaseOrder(
    tenantId: string,
    branchId: string,
    input: CreatePurchaseOrderInput,
    actorUserId: string,
  ): Promise<string> {
    return this.repository.create({
      tenantId,
      supplierId: input.supplierId,
      branchId,
      orderDate: requiredDate(input.orderDate),
      items: input.items,
      notes: emptyToNull(input.notes),
      actorUserId,
    });
  }

  async listPurchaseOrders(
    tenantId: string,
    query: { supplierId?: string; status?: PurchaseOrderStatus; page: number; pageSize: number },
  ): Promise<PurchaseOrderListResult> {
    return this.repository.list({
      tenantId,
      supplierId: query.supplierId ?? null,
      status: query.status ?? null,
      limit: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
    });
  }

  async getPurchaseOrder(tenantId: string, purchaseOrderId: string): Promise<PurchaseOrderDetail | null> {
    return this.repository.get(tenantId, purchaseOrderId);
  }

  async receivePurchaseOrder(
    tenantId: string,
    purchaseOrderId: string,
    input: ReceivePurchaseOrderInput,
    actorUserId: string,
  ): Promise<void> {
    await this.repository.receive(
      tenantId,
      purchaseOrderId,
      input.items.map((item) => ({
        purchaseOrderItemId: item.purchaseOrderItemId,
        quantityReceived: item.quantityReceived,
        batchNumber: item.batchNumber,
        expirationDate: optionalDate(item.expirationDate),
      })),
      actorUserId,
    );
  }

  async cancelPurchaseOrder(tenantId: string, purchaseOrderId: string, actorUserId: string): Promise<void> {
    await this.repository.cancel(tenantId, purchaseOrderId, actorUserId);
  }
}
