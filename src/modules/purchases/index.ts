import { SupplierService } from "./application/supplier.service";
import { PurchaseOrderService } from "./application/purchase-order.service";
import { supplierRepository } from "./infrastructure/supplier.repository";
import { purchaseOrderRepository } from "./infrastructure/purchase-order.repository";

export const supplierService = new SupplierService(supplierRepository);
export const purchaseOrderService = new PurchaseOrderService(purchaseOrderRepository);

export * from "./domain/entities";
export * from "./domain/permissions";
export { createSupplierSchema, type CreateSupplierInput } from "./application/dto/create-supplier.schema";
export { updateSupplierSchema, type UpdateSupplierInput } from "./application/dto/update-supplier.schema";
export { listSuppliersQuerySchema, type ListSuppliersQuery } from "./application/dto/list-suppliers.schema";
export { createPurchaseOrderSchema, type CreatePurchaseOrderInput } from "./application/dto/create-purchase-order.schema";
export { receivePurchaseOrderSchema, type ReceivePurchaseOrderInput } from "./application/dto/receive-purchase-order.schema";
export { listPurchaseOrdersQuerySchema, type ListPurchaseOrdersQuery } from "./application/dto/list-purchase-orders.schema";
