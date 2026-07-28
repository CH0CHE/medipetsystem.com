export type TenantPlan = "BASIC" | "PRO" | "ENTERPRISE";
export type TenantStatus = "ACTIVE" | "SUSPENDED" | "CANCELADA";
export type PlatformInvoiceStatus = "PENDIENTE" | "PAGADA";
export type UserAccountStatus = "ACTIVE" | "DISABLED" | "LOCKED";

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

export interface TenantDetail {
  tenantId: string;
  tenantCode: string;
  name: string;
  plan: TenantPlan;
  status: TenantStatus;
  mainBranchName: string | null;
  userCount: number;
  connectorUsername: string | null;
  connectorStatus: UserAccountStatus | null;
  connectorLastLogin: Date | null;
  createdAt: Date;
}

export interface SaasMetrics {
  totalTenants: number;
  activeCount: number;
  suspendedCount: number;
  cancelledCount: number;
  basicCount: number;
  proCount: number;
  enterpriseCount: number;
  newThisMonth: number;
  totalPendingSubscription: number;
}

export interface PlatformInvoiceListItem {
  invoiceId: string;
  tenantId: string;
  tenantName: string;
  period: string;
  plan: TenantPlan;
  amount: number;
  status: PlatformInvoiceStatus;
  paidAt: Date | null;
  createdAt: Date;
}

export interface PlatformInvoiceListResult {
  items: PlatformInvoiceListItem[];
  totalCount: number;
}

export interface AuditLogEntry {
  logId: string;
  tenantName: string | null;
  username: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: Date;
}

export interface AuditLogListResult {
  items: AuditLogEntry[];
  totalCount: number;
}

export interface SupportAccountRow {
  tenantId: string;
  tenantName: string;
  connectorUsername: string;
  connectorStatus: UserAccountStatus;
  connectorLastLogin: Date | null;
}
