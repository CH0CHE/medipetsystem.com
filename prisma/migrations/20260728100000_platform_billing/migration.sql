-- CreateEnum
CREATE TYPE "SubscriptionInvoiceStatus" AS ENUM ('PENDIENTE', 'PAGADA');

-- AlterEnum
ALTER TYPE "TenantStatus" ADD VALUE 'CANCELADA';

-- CreateTable
CREATE TABLE "platform_invoices" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "period" TEXT NOT NULL,
    "plan" "TenantPlan" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "SubscriptionInvoiceStatus" NOT NULL DEFAULT 'PENDIENTE',
    "paid_at" TIMESTAMP(3),
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_invoices_tenant_id_idx" ON "platform_invoices"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "platform_invoices_tenant_id_period_key" ON "platform_invoices"("tenant_id", "period");

-- AddForeignKey
ALTER TABLE "platform_invoices" ADD CONSTRAINT "platform_invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_invoices" ADD CONSTRAINT "platform_invoices_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
