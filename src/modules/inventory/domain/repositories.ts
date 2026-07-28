import type {
  ExpiringBatch,
  MovementListResult,
  ProductDetail,
  ProductListResult,
} from "./entities";

export interface CreateProductRepoInput {
  tenantId: string;
  sku: string;
  internalCode: string | null;
  name: string;
  category: string | null;
  costPrice: number;
  salePrice: number;
  minStock: number;
  actorUserId: string;
}

export interface UpdateProductRepoInput {
  tenantId: string;
  productId: string;
  name: string;
  category: string | null;
  costPrice: number;
  salePrice: number;
  minStock: number;
  actorUserId: string;
}

export interface RegisterEntradaRepoInput {
  tenantId: string;
  productId: string;
  branchId: string;
  batchNumber: string;
  expirationDate: Date | null;
  quantity: number;
  notes: string | null;
  actorUserId: string;
}

export interface RegisterSalidaRepoInput {
  tenantId: string;
  batchId: string;
  quantity: number;
  notes: string | null;
  actorUserId: string;
}

export interface RegisterAjusteRepoInput {
  tenantId: string;
  batchId: string;
  newQuantity: number;
  notes: string | null;
  actorUserId: string;
}

export interface RegisterTransferenciaRepoInput {
  tenantId: string;
  batchId: string;
  targetBranchId: string;
  quantity: number;
  notes: string | null;
  actorUserId: string;
}

export interface IProductRepository {
  create(input: CreateProductRepoInput): Promise<string>;

  list(input: {
    tenantId: string;
    search: string | null;
    category: string | null;
    lowStockOnly: boolean;
    limit: number;
    offset: number;
  }): Promise<ProductListResult>;

  get(tenantId: string, productId: string): Promise<ProductDetail | null>;

  update(input: UpdateProductRepoInput): Promise<void>;

  registerEntrada(input: RegisterEntradaRepoInput): Promise<string>;
  registerSalida(input: RegisterSalidaRepoInput): Promise<string>;
  registerAjuste(input: RegisterAjusteRepoInput): Promise<string>;
  registerTransferencia(input: RegisterTransferenciaRepoInput): Promise<string>;

  listMovements(input: { tenantId: string; productId: string; limit: number; offset: number }): Promise<MovementListResult>;

  listExpiringBatches(tenantId: string, maxDays: number, limit: number): Promise<ExpiringBatch[]>;
}
