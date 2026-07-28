-- Fix: varias stored procedures declaraban columnas de retorno como `timestamptz`
-- mientras que las columnas reales son `TIMESTAMP(3)` sin zona horaria (el tipo
-- que Prisma genera por defecto para `DateTime`). Postgres exige que el tipo
-- exacto coincida en un `RETURN QUERY` — se agrega un cast explícito `::timestamptz`
-- en el SELECT en vez de cambiar la firma (evita tener que hacer DROP FUNCTION).
-- Bug real detectado en verificación manual de Fase 2 (login fallaba con
-- "structure of query does not match function result type").

CREATE OR REPLACE FUNCTION sp_get_login_context(p_username text)
RETURNS TABLE (
  user_id uuid,
  tenant_id uuid,
  branch_id uuid,
  username text,
  password_hash text,
  password_salt text,
  must_change_password boolean,
  user_status "UserStatus",
  failed_login_attempts int,
  locked_until timestamptz,
  is_super_admin boolean,
  is_support_account boolean,
  tenant_status "TenantStatus",
  tenant_name text,
  tenant_code text,
  branch_name text,
  roles text[],
  permissions text[]
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.tenant_id,
    u.branch_id,
    u.username,
    u.password_hash,
    u.password_salt,
    u.must_change_password,
    u.status,
    u.failed_login_attempts,
    u.locked_until::timestamptz,
    u.is_super_admin,
    u.is_support_account,
    t.status,
    t.name,
    t.tenant_code,
    b.name,
    COALESCE(
      (SELECT array_agg(DISTINCT r.code) FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = u.id),
      ARRAY[]::text[]
    ),
    COALESCE(
      (SELECT array_agg(DISTINCT p.code)
       FROM user_roles ur
       JOIN role_permissions rp ON rp.role_id = ur.role_id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE ur.user_id = u.id),
      ARRAY[]::text[]
    )
  FROM users u
  LEFT JOIN tenants t ON t.id = u.tenant_id
  LEFT JOIN branches b ON b.id = u.branch_id
  WHERE u.username = p_username;
END;
$$;

CREATE OR REPLACE FUNCTION sp_list_tenants(
  p_search text,
  p_status "TenantStatus",
  p_limit int,
  p_offset int
)
RETURNS TABLE (
  tenant_id uuid,
  tenant_code text,
  name text,
  plan "TenantPlan",
  status "TenantStatus",
  branch_count bigint,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.tenant_code,
    t.name,
    t.plan,
    t.status,
    COUNT(b.id) AS branch_count,
    t.created_at::timestamptz,
    COUNT(*) OVER() AS total_count
  FROM tenants t
  LEFT JOIN branches b ON b.tenant_id = t.id
  WHERE (p_search IS NULL OR p_search = '' OR t.name ILIKE '%' || p_search || '%' OR t.tenant_code ILIKE '%' || p_search || '%')
    AND (p_status IS NULL OR t.status = p_status)
  GROUP BY t.id
  ORDER BY t.created_at DESC
  LIMIT p_limit OFFSET p_offset;
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
    o.created_at::timestamptz,
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
    COUNT(p.id), o.created_at::timestamptz, o.updated_at::timestamptz
  FROM owners o
  LEFT JOIN pets p ON p.owner_id = o.id
  WHERE o.id = p_owner_id AND o.tenant_id = p_tenant_id
  GROUP BY o.id;
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
    pe.created_at::timestamptz,
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
    pe.created_at::timestamptz, pe.updated_at::timestamptz
  FROM pets pe
  JOIN owners o ON o.id = pe.owner_id
  JOIN branches b ON b.id = pe.branch_id
  WHERE pe.id = p_pet_id AND pe.tenant_id = p_tenant_id;
END;
$$;
