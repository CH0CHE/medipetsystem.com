import { prisma } from "@/lib/db/prisma";
import type { IMetricsRepository } from "../domain/repositories";

type MetricsRow = {
  total_tenants: bigint;
  active_count: bigint;
  suspended_count: bigint;
  cancelled_count: bigint;
  basic_count: bigint;
  pro_count: bigint;
  enterprise_count: bigint;
  new_this_month: bigint;
  total_pending_subscription: unknown;
};

export const metricsRepository: IMetricsRepository = {
  async getSaasMetrics() {
    const rows = await prisma.$queryRaw<MetricsRow[]>`SELECT * FROM sp_get_saas_metrics()`;
    const row = rows[0]!;
    return {
      totalTenants: Number(row.total_tenants),
      activeCount: Number(row.active_count),
      suspendedCount: Number(row.suspended_count),
      cancelledCount: Number(row.cancelled_count),
      basicCount: Number(row.basic_count),
      proCount: Number(row.pro_count),
      enterpriseCount: Number(row.enterprise_count),
      newThisMonth: Number(row.new_this_month),
      totalPendingSubscription: Number(row.total_pending_subscription),
    };
  },
};
