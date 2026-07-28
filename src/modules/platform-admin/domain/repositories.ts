import type { TenantListResult, TenantPlan, TenantStatus } from "./entities";

export interface CreateTenantRepoInput {
  clinicName: string;
  branchName: string;
  plan: TenantPlan;
  adminPasswordHash: string;
  adminPasswordSalt: string;
  connectorPasswordHash: string;
  connectorPasswordSalt: string;
  createdByUserId: string;
}

export interface CreateTenantRepoResult {
  tenantId: string;
  tenantCode: string;
  branchId: string;
  adminUserId: string;
  adminUsername: string;
  connectorUserId: string;
  connectorUsername: string;
}

export interface ITenantRepository {
  createTenant(input: CreateTenantRepoInput): Promise<CreateTenantRepoResult>;

  listTenants(input: {
    search: string | null;
    status: TenantStatus | null;
    limit: number;
    offset: number;
  }): Promise<TenantListResult>;

  suspendTenant(tenantId: string, actorUserId: string, reason: string): Promise<void>;

  reactivateTenant(tenantId: string, actorUserId: string): Promise<void>;
}
