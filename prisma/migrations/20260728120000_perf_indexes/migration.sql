-- CreateIndex
CREATE INDEX "invoices_tenant_id_issue_date_idx" ON "invoices"("tenant_id", "issue_date");

-- CreateIndex
CREATE INDEX "medical_record_entries_tenant_id_entry_date_idx" ON "medical_record_entries"("tenant_id", "entry_date");
