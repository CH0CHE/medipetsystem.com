export type TenantPlan = "BASIC" | "PRO" | "ENTERPRISE";
export type TenantStatus = "ACTIVE" | "SUSPENDED";

export interface TenantListItem {
  tenantId: string;
  tenantCode: string;
  name: string;
  plan: TenantPlan;
  status: TenantStatus;
  branchCount: number;
  createdAt: Date;
}

export interface TenantListResult {
  items: TenantListItem[];
  totalCount: number;
}

export interface CreateTenantResult {
  tenantId: string;
  tenantCode: string;
  branchId: string;
  adminUserId: string;
  adminUsername: string;
  adminTemporaryPassword: string;
  connectorUserId: string;
  connectorUsername: string;
  connectorTemporaryPassword: string;
}
