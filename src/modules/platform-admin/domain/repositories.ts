import type {
  AuditLogListResult,
  PlatformInvoiceListResult,
  PlatformInvoiceStatus,
  SaasMetrics,
  SupportAccountRow,
  TenantDetail,
  TenantListResult,
  TenantPlan,
  TenantStatus,
} from "./entities";

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

  getTenantDetail(tenantId: string): Promise<TenantDetail | null>;

  cancelTenant(tenantId: string, actorUserId: string): Promise<void>;

  updateTenantPlan(tenantId: string, plan: TenantPlan, actorUserId: string): Promise<void>;
}

export interface IBillingRepository {
  createInvoice(tenantId: string, period: string, amount: number, actorUserId: string): Promise<string>;

  listInvoices(input: {
    tenantId: string | null;
    status: PlatformInvoiceStatus | null;
    limit: number;
    offset: number;
  }): Promise<PlatformInvoiceListResult>;

  markInvoicePaid(invoiceId: string, actorUserId: string): Promise<void>;
}

export interface IMetricsRepository {
  getSaasMetrics(): Promise<SaasMetrics>;
}

export interface IAuditRepository {
  listAuditLogs(input: {
    tenantId: string | null;
    action: string | null;
    from: Date;
    to: Date;
    limit: number;
    offset: number;
  }): Promise<AuditLogListResult>;

  listSupportAccounts(): Promise<SupportAccountRow[]>;
}
