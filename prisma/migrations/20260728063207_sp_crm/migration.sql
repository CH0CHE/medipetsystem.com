-- Stored procedures: CRM (Propietarios) y Pacientes (Mascotas).
-- Todas reciben p_tenant_id explícito y lo verifican en cada WHERE/UPDATE — el
-- aislamiento de tenant queda garantizado también a nivel de SQL, no solo en la
-- capa de servicio. Las mutaciones escriben su propia fila de auditoría atómica.

CREATE OR REPLACE FUNCTION sp_create_owner(
  p_tenant_id uuid,
  p_full_name text,
  p_document_id text,
  p_phone text,
  p_email text,
  p_address text,
  p_notes text,
  p_created_by_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_owner_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO owners (id, tenant_id, full_name, document_id, phone, email, address, notes, created_at, updated_at)
  VALUES (v_owner_id, p_tenant_id, p_full_name, p_document_id, p_phone, p_email, p_address, p_notes, now(), now());

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_created_by_user_id, 'OWNER_CREATED', 'Owner', v_owner_id,
    jsonb_build_object('fullName', p_full_name), now());

  RETURN v_owner_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_list_owners(
  p_tenant_id uuid,
  p_search text,
  p_financial_status "FinancialStatus",
  p_limit int,
  p_offset int
)
RETURNS TABLE (
  owner_id uuid,
  full_name text,
  document_id text,
  phone text,
  email text,
  financial_status "FinancialStatus",
  pet_count bigint,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.full_name,
    o.document_id,
    o.phone,
    o.email,
    o.financial_status,
    COUNT(p.id) AS pet_count,
    o.created_at,
    COUNT(*) OVER() AS total_count
  FROM owners o
  LEFT JOIN pets p ON p.owner_id = o.id
  WHERE o.tenant_id = p_tenant_id
    AND (p_search IS NULL OR p_search = '' OR o.full_name ILIKE '%' || p_search || '%' OR o.document_id ILIKE '%' || p_search || '%')
    AND (p_financial_status IS NULL OR o.financial_status = p_financial_status)
  GROUP BY o.id
  ORDER BY o.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION sp_get_owner(
  p_tenant_id uuid,
  p_owner_id uuid
)
RETURNS TABLE (
  owner_id uuid,
  full_name text,
  document_id text,
  phone text,
  email text,
  address text,
  financial_status "FinancialStatus",
  notes text,
  pet_count bigint,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.full_name, o.document_id, o.phone, o.email, o.address, o.financial_status, o.notes,
    COUNT(p.id), o.created_at, o.updated_at
  FROM owners o
  LEFT JOIN pets p ON p.owner_id = o.id
  WHERE o.id = p_owner_id AND o.tenant_id = p_tenant_id
  GROUP BY o.id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_update_owner(
  p_tenant_id uuid,
  p_owner_id uuid,
  p_full_name text,
  p_document_id text,
  p_phone text,
  p_email text,
  p_address text,
  p_financial_status "FinancialStatus",
  p_notes text,
  p_actor_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated int;
BEGIN
  UPDATE owners
  SET full_name = p_full_name,
      document_id = p_document_id,
      phone = p_phone,
      email = p_email,
      address = p_address,
      financial_status = p_financial_status,
      notes = p_notes,
      updated_at = now()
  WHERE id = p_owner_id AND tenant_id = p_tenant_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RAISE EXCEPTION 'Propietario no encontrado.' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'OWNER_UPDATED', 'Owner', p_owner_id,
    jsonb_build_object('financialStatus', p_financial_status), now());
END;
$$;

CREATE OR REPLACE FUNCTION sp_create_pet(
  p_tenant_id uuid,
  p_branch_id uuid,
  p_owner_id uuid,
  p_name text,
  p_species text,
  p_breed text,
  p_sex "PetSex",
  p_birth_date date,
  p_weight_kg numeric,
  p_color text,
  p_photo_url text,
  p_microchip_number text,
  p_created_by_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_pet_id uuid := gen_random_uuid();
  v_owner_exists boolean;
  v_branch_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM owners WHERE id = p_owner_id AND tenant_id = p_tenant_id) INTO v_owner_exists;
  IF NOT v_owner_exists THEN
    RAISE EXCEPTION 'Propietario no encontrado.' USING ERRCODE = 'P0002';
  END IF;

  SELECT EXISTS(SELECT 1 FROM branches WHERE id = p_branch_id AND tenant_id = p_tenant_id) INTO v_branch_exists;
  IF NOT v_branch_exists THEN
    RAISE EXCEPTION 'Sucursal no encontrada.' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO pets (
    id, tenant_id, branch_id, owner_id, name, species, breed, sex, birth_date, weight_kg,
    color, photo_url, microchip_number, created_at, updated_at
  ) VALUES (
    v_pet_id, p_tenant_id, p_branch_id, p_owner_id, p_name, p_species, p_breed, p_sex, p_birth_date, p_weight_kg,
    p_color, p_photo_url, p_microchip_number, now(), now()
  );

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_created_by_user_id, 'PET_CREATED', 'Pet', v_pet_id,
    jsonb_build_object('name', p_name, 'species', p_species, 'ownerId', p_owner_id), now());

  RETURN v_pet_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_list_pets(
  p_tenant_id uuid,
  p_search text,
  p_species text,
  p_status "PetStatus",
  p_owner_id uuid,
  p_limit int,
  p_offset int
)
RETURNS TABLE (
  pet_id uuid,
  name text,
  species text,
  breed text,
  sex "PetSex",
  status "PetStatus",
  owner_id uuid,
  owner_name text,
  branch_id uuid,
  branch_name text,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.id,
    pe.name,
    pe.species,
    pe.breed,
    pe.sex,
    pe.status,
    o.id,
    o.full_name,
    b.id,
    b.name,
    pe.created_at,
    COUNT(*) OVER() AS total_count
  FROM pets pe
  JOIN owners o ON o.id = pe.owner_id
  JOIN branches b ON b.id = pe.branch_id
  WHERE pe.tenant_id = p_tenant_id
    AND (p_search IS NULL OR p_search = '' OR pe.name ILIKE '%' || p_search || '%' OR o.full_name ILIKE '%' || p_search || '%')
    AND (p_species IS NULL OR p_species = '' OR pe.species ILIKE p_species)
    AND (p_status IS NULL OR pe.status = p_status)
    AND (p_owner_id IS NULL OR pe.owner_id = p_owner_id)
  ORDER BY pe.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION sp_get_pet(
  p_tenant_id uuid,
  p_pet_id uuid
)
RETURNS TABLE (
  pet_id uuid,
  branch_id uuid,
  branch_name text,
  owner_id uuid,
  owner_name text,
  name text,
  species text,
  breed text,
  sex "PetSex",
  birth_date date,
  weight_kg numeric,
  color text,
  photo_url text,
  microchip_number text,
  status "PetStatus",
  notes text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT pe.id, pe.branch_id, b.name, pe.owner_id, o.full_name, pe.name, pe.species, pe.breed, pe.sex,
    pe.birth_date, pe.weight_kg, pe.color, pe.photo_url, pe.microchip_number, pe.status, pe.notes,
    pe.created_at, pe.updated_at
  FROM pets pe
  JOIN owners o ON o.id = pe.owner_id
  JOIN branches b ON b.id = pe.branch_id
  WHERE pe.id = p_pet_id AND pe.tenant_id = p_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_update_pet(
  p_tenant_id uuid,
  p_pet_id uuid,
  p_branch_id uuid,
  p_owner_id uuid,
  p_name text,
  p_species text,
  p_breed text,
  p_sex "PetSex",
  p_birth_date date,
  p_weight_kg numeric,
  p_color text,
  p_photo_url text,
  p_microchip_number text,
  p_status "PetStatus",
  p_notes text,
  p_actor_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated int;
  v_owner_exists boolean;
  v_branch_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM owners WHERE id = p_owner_id AND tenant_id = p_tenant_id) INTO v_owner_exists;
  IF NOT v_owner_exists THEN
    RAISE EXCEPTION 'Propietario no encontrado.' USING ERRCODE = 'P0002';
  END IF;

  SELECT EXISTS(SELECT 1 FROM branches WHERE id = p_branch_id AND tenant_id = p_tenant_id) INTO v_branch_exists;
  IF NOT v_branch_exists THEN
    RAISE EXCEPTION 'Sucursal no encontrada.' USING ERRCODE = 'P0002';
  END IF;

  UPDATE pets
  SET branch_id = p_branch_id,
      owner_id = p_owner_id,
      name = p_name,
      species = p_species,
      breed = p_breed,
      sex = p_sex,
      birth_date = p_birth_date,
      weight_kg = p_weight_kg,
      color = p_color,
      photo_url = p_photo_url,
      microchip_number = p_microchip_number,
      status = p_status,
      notes = p_notes,
      updated_at = now()
  WHERE id = p_pet_id AND tenant_id = p_tenant_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RAISE EXCEPTION 'Paciente no encontrado.' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'PET_UPDATED', 'Pet', p_pet_id,
    jsonb_build_object('status', p_status), now());
END;
$$;
