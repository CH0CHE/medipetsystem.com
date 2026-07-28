import { TenantService } from "./application/tenant.service";
import { tenantRepository } from "./infrastructure/tenant.repository";

export const tenantService = new TenantService(tenantRepository);

export * from "./domain/entities";
export * from "./domain/permissions";
export { createTenantSchema, type CreateTenantInput } from "./application/dto/create-tenant.schema";
export { listTenantsQuerySchema, type ListTenantsQuery } from "./application/dto/list-tenants.schema";
export { suspendTenantSchema, type SuspendTenantInput } from "./application/dto/suspend-tenant.schema";
