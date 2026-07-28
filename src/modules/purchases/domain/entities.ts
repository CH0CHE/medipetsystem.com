export type PurchaseOrderStatus = "PENDIENTE" | "RECIBIDA_PARCIAL" | "RECIBIDA" | "CANCELADA";

export interface SupplierListItem {
  supplierId: string;
  name: string;
  taxId: string | null;
  phone: string | null;
  email: string | null;
  createdAt: Date;
}

export interface SupplierListResult {
  items: SupplierListItem[];
  totalCount: number;
}

export interface SupplierDetail {
  supplierId: string;
  name: string;
  taxId: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderLineItem {
  itemId: string;
  productId: string;
  productName: string;
  description: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
}

export interface PurchaseOrderListItem {
  purchaseOrderId: string;
  orderNumber: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  orderDate: Date;
  totalCost: number;
}

export interface PurchaseOrderListResult {
  items: PurchaseOrderListItem[];
  totalCount: number;
}

export interface PurchaseOrderDetail {
  purchaseOrderId: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  branchName: string;
  status: PurchaseOrderStatus;
  orderDate: Date;
  notes: string | null;
  createdAt: Date;
  items: PurchaseOrderLineItem[];
}
