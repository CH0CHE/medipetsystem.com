import { hashPassword, generateTemporaryPassword } from "@/lib/security/password.service";
import type { ITenantRepository } from "../domain/repositories";
import type { CreateTenantResult, TenantListResult, TenantPlan, TenantStatus } from "../domain/entities";

export class TenantService {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async createTenant(
    input: { clinicName: string; branchName: string; plan: TenantPlan },
    createdByUserId: string,
  ): Promise<CreateTenantResult> {
    const adminTemporaryPassword = generateTemporaryPassword();
    const connectorTemporaryPassword = generateTemporaryPassword();

    const [admin, connector] = await Promise.all([
      hashPassword(adminTemporaryPassword),
      hashPassword(connectorTemporaryPassword),
    ]);

    const result = await this.tenantRepository.createTenant({
      clinicName: input.clinicName,
      branchName: input.branchName,
      plan: input.plan,
      adminPasswordHash: admin.hash,
      adminPasswordSalt: admin.salt,
      connectorPasswordHash: connector.hash,
      connectorPasswordSalt: connector.salt,
      createdByUserId,
    });

    return {
      ...result,
      adminTemporaryPassword,
      connectorTemporaryPassword,
    };
  }

  async listTenants(input: {
    search?: string;
    status?: TenantStatus;
    page: number;
    pageSize: number;
  }): Promise<TenantListResult> {
    return this.tenantRepository.listTenants({
      search: input.search ?? null,
      status: input.status ?? null,
      limit: input.pageSize,
      offset: (input.page - 1) * input.pageSize,
    });
  }

  async suspendTenant(tenantId: string, actorUserId: string, reason: string): Promise<void> {
    await this.tenantRepository.suspendTenant(tenantId, actorUserId, reason);
  }

  async reactivateTenant(tenantId: string, actorUserId: string): Promise<void> {
    await this.tenantRepository.reactivateTenant(tenantId, actorUserId);
  }
}
