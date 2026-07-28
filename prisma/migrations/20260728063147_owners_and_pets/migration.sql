-- CreateEnum
CREATE TYPE "FinancialStatus" AS ENUM ('SOLVENTE', 'MOROSO', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "PetSex" AS ENUM ('MACHO', 'HEMBRA');

-- CreateEnum
CREATE TYPE "PetStatus" AS ENUM ('ACTIVO', 'EN_OBSERVACION', 'HOSPITALIZADO', 'RECUPERADO', 'FALLECIDO');

-- CreateTable
CREATE TABLE "owners" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "document_id" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "financial_status" "FinancialStatus" NOT NULL DEFAULT 'SOLVENTE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pets" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "breed" TEXT,
    "sex" "PetSex",
    "birth_date" DATE,
    "weight_kg" DECIMAL(6,2),
    "color" TEXT,
    "photo_url" TEXT,
    "microchip_number" TEXT,
    "status" "PetStatus" NOT NULL DEFAULT 'ACTIVO',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "owners_tenant_id_idx" ON "owners"("tenant_id");

-- CreateIndex
CREATE INDEX "pets_tenant_id_idx" ON "pets"("tenant_id");

-- CreateIndex
CREATE INDEX "pets_owner_id_idx" ON "pets"("owner_id");

-- CreateIndex
CREATE INDEX "pets_branch_id_idx" ON "pets"("branch_id");

-- AddForeignKey
ALTER TABLE "owners" ADD CONSTRAINT "owners_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
