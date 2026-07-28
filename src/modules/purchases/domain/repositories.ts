import type {
  PurchaseOrderDetail,
  PurchaseOrderListResult,
  PurchaseOrderStatus,
  SupplierDetail,
  SupplierListResult,
} from "./entities";

export interface CreateSupplierRepoInput {
  tenantId: string;
  name: string;
  taxId: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  actorUserId: string;
}

export interface UpdateSupplierRepoInput extends CreateSupplierRepoInput {
  supplierId: string;
}

export interface ISupplierRepository {
  create(input: CreateSupplierRepoInput): Promise<string>;
  list(input: { tenantId: string; search: string | null; limit: number; offset: number }): Promise<SupplierListResult>;
  get(tenantId: string, supplierId: string): Promise<SupplierDetail | null>;
  update(input: UpdateSupplierRepoInput): Promise<void>;
}

export interface PurchaseOrderItemRepoInput {
  productId: string;
  description: string;
  quantityOrdered: number;
  unitCost: number;
}

export interface CreatePurchaseOrderRepoInput {
  tenantId: string;
  supplierId: string;
  branchId: string;
  orderDate: Date;
  items: PurchaseOrderItemRepoInput[];
  notes: string | null;
  actorUserId: string;
}

export interface ReceivePurchaseOrderItemRepoInput {
  purchaseOrderItemId: string;
  quantityReceived: number;
  batchNumber: string;
  expirationDate: Date | null;
}

export interface IPurchaseOrderRepository {
  create(input: CreatePurchaseOrderRepoInput): Promise<string>;
  list(input: {
    tenantId: string;
    supplierId: string | null;
    status: PurchaseOrderStatus | null;
    limit: number;
    offset: number;
  }): Promise<PurchaseOrderListResult>;
  get(tenantId: string, purchaseOrderId: string): Promise<PurchaseOrderDetail | null>;
  receive(tenantId: string, purchaseOrderId: string, items: ReceivePurchaseOrderItemRepoInput[], actorUserId: string): Promise<void>;
  cancel(tenantId: string, purchaseOrderId: string, actorUserId: string): Promise<void>;
}
