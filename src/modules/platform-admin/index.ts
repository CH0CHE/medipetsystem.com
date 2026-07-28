import { TenantService } from "./application/tenant.service";
import { BillingService } from "./application/billing.service";
import { MetricsService } from "./application/metrics.service";
import { AuditService } from "./application/audit.service";
import { tenantRepository } from "./infrastructure/tenant.repository";
import { billingRepository } from "./infrastructure/billing.repository";
import { metricsRepository } from "./infrastructure/metrics.repository";
import { auditRepository } from "./infrastructure/audit.repository";

export const tenantService = new TenantService(tenantRepository);
export const billingService = new BillingService(billingRepository);
export const metricsService = new MetricsService(metricsRepository);
export const auditService = new AuditService(auditRepository);

export * from "./domain/entities";
export * from "./domain/permissions";
export { createTenantSchema, type CreateTenantInput } from "./application/dto/create-tenant.schema";
export { listTenantsQuerySchema, type ListTenantsQuery } from "./application/dto/list-tenants.schema";
export { suspendTenantSchema, type SuspendTenantInput } from "./application/dto/suspend-tenant.schema";
export { updatePlanSchema, type UpdatePlanInput } from "./application/dto/update-plan.schema";
export { createInvoiceSchema, type CreateInvoiceInput } from "./application/dto/create-invoice.schema";
export { listInvoicesQuerySchema, type ListInvoicesQuery } from "./application/dto/list-invoices.schema";
export { listAuditLogsQuerySchema, type ListAuditLogsQuery } from "./application/dto/list-audit-logs.schema";
