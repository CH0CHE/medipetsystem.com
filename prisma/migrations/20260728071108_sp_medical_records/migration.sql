-- Stored procedures: Expediente Médico (entradas de historial + adjuntos).
-- Mismo patrón que sp_crm: p_tenant_id explícito verificado en cada join/WHERE,
-- auditoría atómica en cada mutación. Las entradas son solo creación + lectura
-- (un expediente clínico no se edita ni se borra).

CREATE OR REPLACE FUNCTION sp_create_medical_entry(
  p_tenant_id uuid,
  p_pet_id uuid,
  p_veterinarian_id uuid,
  p_type "MedicalEntryType",
  p_entry_date date,
  p_title text,
  p_symptoms text,
  p_diagnosis text,
  p_treatment text,
  p_vaccine_name text,
  p_next_due_date date,
  p_procedure_name text,
  p_outcome text,
  p_admission_date date,
  p_discharge_date date,
  p_medication_name text,
  p_dosage text,
  p_frequency text,
  p_start_date date,
  p_end_date date,
  p_notes text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_entry_id uuid := gen_random_uuid();
  v_pet_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM pets WHERE id = p_pet_id AND tenant_id = p_tenant_id) INTO v_pet_exists;
  IF NOT v_pet_exists THEN
    RAISE EXCEPTION 'Paciente no encontrado.' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO medical_record_entries (
    id, tenant_id, pet_id, veterinarian_id, type, entry_date, title,
    symptoms, diagnosis, treatment,
    vaccine_name, next_due_date,
    procedure_name, outcome,
    admission_date, discharge_date,
    medication_name, dosage, frequency, start_date, end_date,
    notes, created_at, updated_at
  ) VALUES (
    v_entry_id, p_tenant_id, p_pet_id, p_veterinarian_id, p_type, p_entry_date, p_title,
    p_symptoms, p_diagnosis, p_treatment,
    p_vaccine_name, p_next_due_date,
    p_procedure_name, p_outcome,
    p_admission_date, p_discharge_date,
    p_medication_name, p_dosage, p_frequency, p_start_date, p_end_date,
    p_notes, now(), now()
  );

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_veterinarian_id, 'MEDICAL_ENTRY_CREATED', 'MedicalRecordEntry', v_entry_id,
    jsonb_build_object('petId', p_pet_id, 'type', p_type, 'title', p_title), now());

  RETURN v_entry_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_list_medical_entries(
  p_tenant_id uuid,
  p_pet_id uuid,
  p_type "MedicalEntryType",
  p_limit int,
  p_offset int
)
RETURNS TABLE (
  entry_id uuid,
  type "MedicalEntryType",
  entry_date date,
  title text,
  veterinarian_id uuid,
  veterinarian_name text,
  attachment_count bigint,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.type,
    e.entry_date,
    e.title,
    e.veterinarian_id,
    u.username,
    COUNT(a.id) AS attachment_count,
    e.created_at::timestamptz,
    COUNT(*) OVER() AS total_count
  FROM medical_record_entries e
  JOIN users u ON u.id = e.veterinarian_id
  LEFT JOIN attachments a ON a.medical_record_entry_id = e.id
  WHERE e.tenant_id = p_tenant_id
    AND (p_pet_id IS NULL OR e.pet_id = p_pet_id)
    AND (p_type IS NULL OR e.type = p_type)
  GROUP BY e.id, u.username
  ORDER BY e.entry_date DESC, e.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION sp_get_medical_entry(
  p_tenant_id uuid,
  p_entry_id uuid
)
RETURNS TABLE (
  entry_id uuid,
  pet_id uuid,
  veterinarian_id uuid,
  veterinarian_name text,
  type "MedicalEntryType",
  entry_date date,
  title text,
  symptoms text,
  diagnosis text,
  treatment text,
  vaccine_name text,
  next_due_date date,
  procedure_name text,
  outcome text,
  admission_date date,
  discharge_date date,
  medication_name text,
  dosage text,
  frequency text,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz,
  attachments jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id, e.pet_id, e.veterinarian_id, u.username, e.type, e.entry_date, e.title,
    e.symptoms, e.diagnosis, e.treatment,
    e.vaccine_name, e.next_due_date,
    e.procedure_name, e.outcome,
    e.admission_date, e.discharge_date,
    e.medication_name, e.dosage, e.frequency, e.start_date, e.end_date,
    e.notes, e.created_at::timestamptz,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
          'attachmentId', a.id, 'fileUrl', a.file_url, 'fileType', a.file_type,
          'label', a.label, 'createdAt', a.created_at
        ) ORDER BY a.created_at)
       FROM attachments a WHERE a.medical_record_entry_id = e.id),
      '[]'::jsonb
    )
  FROM medical_record_entries e
  JOIN users u ON u.id = e.veterinarian_id
  WHERE e.id = p_entry_id AND e.tenant_id = p_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_add_attachment(
  p_tenant_id uuid,
  p_medical_record_entry_id uuid,
  p_file_url text,
  p_file_type "AttachmentType",
  p_label text,
  p_uploaded_by_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_attachment_id uuid := gen_random_uuid();
  v_entry_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM medical_record_entries WHERE id = p_medical_record_entry_id AND tenant_id = p_tenant_id
  ) INTO v_entry_exists;
  IF NOT v_entry_exists THEN
    RAISE EXCEPTION 'Entrada de expediente no encontrada.' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO attachments (id, tenant_id, medical_record_entry_id, file_url, file_type, label, uploaded_by_user_id, created_at)
  VALUES (v_attachment_id, p_tenant_id, p_medical_record_entry_id, p_file_url, p_file_type, p_label, p_uploaded_by_user_id, now());

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_uploaded_by_user_id, 'ATTACHMENT_ADDED', 'Attachment', v_attachment_id,
    jsonb_build_object('medicalRecordEntryId', p_medical_record_entry_id, 'fileType', p_file_type), now());

  RETURN v_attachment_id;
END;
$$;
