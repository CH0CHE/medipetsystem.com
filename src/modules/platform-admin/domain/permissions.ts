export const PLATFORM_ADMIN_PERMISSIONS = {
  TENANTS_VIEW: "platform_admin.tenants.view",
  TENANTS_CREATE: "platform_admin.tenants.create",
  TENANTS_SUSPEND: "platform_admin.tenants.suspend",
  TENANTS_REACTIVATE: "platform_admin.tenants.reactivate",
  TENANTS_CANCEL: "platform_admin.tenants.cancel",
  PLANS_UPDATE: "platform_admin.plans.update",
  METRICS_VIEW: "platform_admin.metrics.view",
  BILLING_VIEW: "platform_admin.billing.view",
  BILLING_CREATE: "platform_admin.billing.create",
  BILLING_MARK_PAID: "platform_admin.billing.mark_paid",
  AUDIT_VIEW: "platform_admin.audit.view",
  SUPPORT_VIEW: "platform_admin.support.view",
} as const;
