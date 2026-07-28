import { prisma } from "@/lib/db/prisma";
import type { ITenantRepository } from "../domain/repositories";
import type { TenantListItem, TenantPlan, TenantStatus, UserAccountStatus } from "../domain/entities";

type ListRow = {
  tenant_id: string;
  tenant_code: string;
  name: string;
  plan: TenantPlan;
  status: TenantStatus;
  branch_count: bigint;
  created_at: Date;
  total_count: bigint;
};

type DetailRow = {
  tenant_id: string;
  tenant_code: string;
  name: string;
  plan: TenantPlan;
  status: TenantStatus;
  main_branch_name: string | null;
  user_count: bigint;
  connector_username: string | null;
  connector_status: UserAccountStatus | null;
  connector_last_login: Date | null;
  created_at: Date;
};

export const tenantRepository: ITenantRepository = {
  async createTenant(input) {
    const rows = await prisma.$queryRaw<
      {
        tenant_id: string;
        tenant_code: string;
        branch_id: string;
        admin_user_id: string;
        admin_username: string;
        connector_user_id: string;
        connector_username: string;
      }[]
    >`
      SELECT * FROM sp_create_tenant(
        ${input.clinicName},
        ${input.branchName},
        ${input.plan}::"TenantPlan",
        ${input.adminPasswordHash},
        ${input.adminPasswordSalt},
        ${input.connectorPasswordHash},
        ${input.connectorPasswordSalt},
        ${input.createdByUserId}::uuid
      )
    `;
    const row = rows[0]!;
    return {
      tenantId: row.tenant_id,
      tenantCode: row.tenant_code,
      branchId: row.branch_id,
      adminUserId: row.admin_user_id,
      adminUsername: row.admin_username,
      connectorUserId: row.connector_user_id,
      connectorUsername: row.connector_username,
    };
  },

  async listTenants({ search, status, limit, offset }) {
    const rows = await prisma.$queryRaw<ListRow[]>`
      SELECT * FROM sp_list_tenants(${search}, ${status}::"TenantStatus", ${limit}::int, ${offset}::int)
    `;

    const items: TenantListItem[] = rows.map((row) => ({
      tenantId: row.tenant_id,
      tenantCode: row.tenant_code,
      name: row.name,
      plan: row.plan,
      status: row.status,
      branchCount: Number(row.branch_count),
      createdAt: row.created_at,
    }));

    return { items, totalCount: rows.length > 0 ? Number(rows[0]!.total_count) : 0 };
  },

  async suspendTenant(tenantId, actorUserId, reason) {
    await prisma.$executeRaw`SELECT sp_suspend_tenant(${tenantId}::uuid, ${actorUserId}::uuid, ${reason})`;
  },

  async reactivateTenant(tenantId, actorUserId) {
    await prisma.$executeRaw`SELECT sp_reactivate_tenant(${tenantId}::uuid, ${actorUserId}::uuid)`;
  },

  async getTenantDetail(tenantId) {
    const rows = await prisma.$queryRaw<DetailRow[]>`
      SELECT * FROM sp_get_tenant_detail(${tenantId}::uuid)
    `;
    if (rows.length === 0) return null;
    const row = rows[0]!;
    return {
      tenantId: row.tenant_id,
      tenantCode: row.tenant_code,
      name: row.name,
      plan: row.plan,
      status: row.status,
      mainBranchName: row.main_branch_name,
      userCount: Number(row.user_count),
      connectorUsername: row.connector_username,
      connectorStatus: row.connector_status,
      connectorLastLogin: row.connector_last_login,
      createdAt: row.created_at,
    };
  },

  async cancelTenant(tenantId, actorUserId) {
    await prisma.$executeRaw`SELECT sp_cancel_tenant(${tenantId}::uuid, ${actorUserId}::uuid)`;
  },

  async updateTenantPlan(tenantId, plan, actorUserId) {
    await prisma.$executeRaw`SELECT sp_update_tenant_plan(${tenantId}::uuid, ${plan}::"TenantPlan", ${actorUserId}::uuid)`;
  },
};
