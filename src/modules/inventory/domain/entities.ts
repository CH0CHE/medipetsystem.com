export type MovementType = "ENTRADA" | "SALIDA" | "AJUSTE" | "TRANSFERENCIA";

export interface ProductListItem {
  productId: string;
  sku: string;
  internalCode: string | null;
  name: string;
  category: string | null;
  costPrice: number;
  salePrice: number;
  minStock: number;
  totalStock: number;
}

export interface ProductListResult {
  items: ProductListItem[];
  totalCount: number;
}

export interface ProductBatchSummary {
  batchId: string;
  branchId: string;
  branchName: string;
  batchNumber: string;
  expirationDate: Date | null;
  quantity: number;
}

export interface ProductDetail {
  productId: string;
  sku: string;
  internalCode: string | null;
  name: string;
  category: string | null;
  costPrice: number;
  salePrice: number;
  minStock: number;
  createdAt: Date;
  updatedAt: Date;
  batches: ProductBatchSummary[];
}

export interface MovementListItem {
  movementId: string;
  type: MovementType;
  quantity: number;
  branchName: string;
  targetBranchName: string | null;
  notes: string | null;
  performedByUsername: string;
  createdAt: Date;
}

export interface MovementListResult {
  items: MovementListItem[];
  totalCount: number;
}

export interface ExpiringBatch {
  batchId: string;
  productName: string;
  sku: string;
  branchName: string;
  batchNumber: string;
  expirationDate: Date;
  quantity: number;
  daysRemaining: number;
}
