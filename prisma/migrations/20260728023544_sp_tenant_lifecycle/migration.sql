-- Stored procedures: ciclo de vida de tenants (clínicas).
-- Reglas: nunca reciben contraseñas en texto plano (solo hashes ya calculados en Node
-- con Argon2id) y cada operación mutable escribe su propia fila de auditoría atómica.

CREATE OR REPLACE FUNCTION sp_create_tenant(
  p_clinic_name text,
  p_branch_name text,
  p_plan "TenantPlan",
  p_admin_password_hash text,
  p_admin_password_salt text,
  p_connector_password_hash text,
  p_connector_password_salt text,
  p_created_by_user_id uuid
)
RETURNS TABLE (
  tenant_id uuid,
  tenant_code text,
  branch_id uuid,
  admin_user_id uuid,
  admin_username text,
  connector_user_id uuid,
  connector_username text
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_tenant_id uuid := gen_random_uuid();
  v_tenant_code text := lpad(nextval('tenant_code_seq')::text, 7, '0');
  v_branch_id uuid := gen_random_uuid();
  v_admin_user_id uuid := gen_random_uuid();
  v_connector_user_id uuid := gen_random_uuid();
  v_admin_username text := v_tenant_code || '_ADMIN';
  v_connector_username text := v_tenant_code || '_CONECTOR';
  v_admin_role_id uuid;
  v_connector_role_id uuid;
BEGIN
  SELECT id INTO v_admin_role_id FROM roles WHERE code = 'ADMINISTRADOR' AND tenant_id IS NULL;
  SELECT id INTO v_connector_role_id FROM roles WHERE code = 'CONECTOR_SOPORTE' AND tenant_id IS NULL;

  IF v_admin_role_id IS NULL OR v_connector_role_id IS NULL THEN
    RAISE EXCEPTION 'Roles del sistema no encontrados. Ejecuta el seed antes de crear tenants.';
  END IF;

  INSERT INTO tenants (id, tenant_code, name, plan, status, created_at, updated_at)
  VALUES (v_tenant_id, v_tenant_code, p_clinic_name, p_plan, 'ACTIVE', now(), now());

  INSERT INTO branches (id, tenant_id, name, is_main, status, created_at, updated_at)
  VALUES (v_branch_id, v_tenant_id, p_branch_name, true, 'ACTIVE', now(), now());

  INSERT INTO users (
    id, tenant_id, branch_id, username, password_hash, password_salt,
    must_change_password, is_support_account, is_super_admin, status, created_at, updated_at
  ) VALUES (
    v_admin_user_id, v_tenant_id, v_branch_id, v_admin_username, p_admin_password_hash, p_admin_password_salt,
    true, false, false, 'ACTIVE', now(), now()
  );
  INSERT INTO user_roles (user_id, role_id) VALUES (v_admin_user_id, v_admin_role_id);

  INSERT INTO users (
    id, tenant_id, branch_id, username, password_hash, password_salt,
    must_change_password, is_support_account, is_super_admin, status, created_at, updated_at
  ) VALUES (
    v_connector_user_id, v_tenant_id, v_branch_id, v_connector_username, p_connector_password_hash, p_connector_password_salt,
    false, true, false, 'ACTIVE', now(), now()
  );
  INSERT INTO user_roles (user_id, role_id) VALUES (v_connector_user_id, v_connector_role_id);

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (
    gen_random_uuid(), v_tenant_id, p_created_by_user_id, 'TENANT_CREATED', 'Tenant', v_tenant_id,
    jsonb_build_object(
      'clinicName', p_clinic_name,
      'plan', p_plan,
      'branchName', p_branch_name,
      'adminUsername', v_admin_username,
      'connectorUsername', v_connector_username
    ),
    now()
  );

  RETURN QUERY SELECT v_tenant_id, v_tenant_code, v_branch_id, v_admin_user_id, v_admin_username, v_connector_user_id, v_connector_username;
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
    t.created_at,
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

CREATE OR REPLACE FUNCTION sp_suspend_tenant(
  p_tenant_id uuid,
  p_actor_user_id uuid,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tenants SET status = 'SUSPENDED', updated_at = now() WHERE id = p_tenant_id;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'TENANT_SUSPENDED', 'Tenant', p_tenant_id,
    jsonb_build_object('reason', p_reason), now());
END;
$$;

CREATE OR REPLACE FUNCTION sp_reactivate_tenant(
  p_tenant_id uuid,
  p_actor_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tenants SET status = 'ACTIVE', updated_at = now() WHERE id = p_tenant_id;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'TENANT_REACTIVATED', 'Tenant', p_tenant_id,
    '{}'::jsonb, now());
END;
$$;
