import type { FinancialStatus, OwnerDetail, OwnerListResult } from "./entities";

export interface CreateOwnerRepoInput {
  tenantId: string;
  fullName: string;
  documentId: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdByUserId: string;
}

export interface UpdateOwnerRepoInput {
  tenantId: string;
  ownerId: string;
  fullName: string;
  documentId: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  financialStatus: FinancialStatus;
  notes: string | null;
  actorUserId: string;
}

export interface IOwnerRepository {
  create(input: CreateOwnerRepoInput): Promise<string>;

  list(input: {
    tenantId: string;
    search: string | null;
    financialStatus: FinancialStatus | null;
    limit: number;
    offset: number;
  }): Promise<OwnerListResult>;

  get(tenantId: string, ownerId: string): Promise<OwnerDetail | null>;

  update(input: UpdateOwnerRepoInput): Promise<void>;
}
