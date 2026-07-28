-- CreateEnum
CREATE TYPE "MedicalEntryType" AS ENUM ('CONSULTA', 'VACUNA', 'CIRUGIA', 'HOSPITALIZACION', 'MEDICAMENTO');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('PDF', 'IMAGEN', 'LABORATORIO');

-- CreateTable
CREATE TABLE "medical_record_entries" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "veterinarian_id" UUID NOT NULL,
    "type" "MedicalEntryType" NOT NULL,
    "entry_date" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "symptoms" TEXT,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "vaccine_name" TEXT,
    "next_due_date" DATE,
    "procedure_name" TEXT,
    "outcome" TEXT,
    "admission_date" DATE,
    "discharge_date" DATE,
    "medication_name" TEXT,
    "dosage" TEXT,
    "frequency" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_record_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "medical_record_entry_id" UUID NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" "AttachmentType" NOT NULL,
    "label" TEXT,
    "uploaded_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medical_record_entries_tenant_id_idx" ON "medical_record_entries"("tenant_id");

-- CreateIndex
CREATE INDEX "medical_record_entries_pet_id_idx" ON "medical_record_entries"("pet_id");

-- CreateIndex
CREATE INDEX "attachments_medical_record_entry_id_idx" ON "attachments"("medical_record_entry_id");

-- AddForeignKey
ALTER TABLE "medical_record_entries" ADD CONSTRAINT "medical_record_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_record_entries" ADD CONSTRAINT "medical_record_entries_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_record_entries" ADD CONSTRAINT "medical_record_entries_veterinarian_id_fkey" FOREIGN KEY ("veterinarian_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_medical_record_entry_id_fkey" FOREIGN KEY ("medical_record_entry_id") REFERENCES "medical_record_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
