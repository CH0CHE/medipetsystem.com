-- Stored procedures: revalidación de sesión, auditoría genérica y cambio de contraseña.

CREATE OR REPLACE FUNCTION sp_get_user_session_context(p_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  tenant_id uuid,
  branch_id uuid,
  username text,
  must_change_password boolean,
  user_status "UserStatus",
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
    u.must_change_password,
    u.status,
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
  WHERE u.id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_write_audit_log(
  p_tenant_id uuid,
  p_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_target_username text,
  p_metadata jsonb,
  p_ip_address text,
  p_user_agent text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO audit_logs (
    id, tenant_id, user_id, target_username, action, entity_type, entity_id, metadata, ip_address, user_agent, created_at
  ) VALUES (
    v_id, p_tenant_id, p_user_id, p_target_username, p_action, p_entity_type, p_entity_id, p_metadata, p_ip_address, p_user_agent, now()
  );

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_update_user_password(
  p_user_id uuid,
  p_new_password_hash text,
  p_new_password_salt text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  UPDATE users
  SET password_hash = p_new_password_hash,
      password_salt = p_new_password_salt,
      must_change_password = false,
      updated_at = now()
  WHERE id = p_user_id
  RETURNING tenant_id INTO v_tenant_id;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, created_at)
  VALUES (gen_random_uuid(), v_tenant_id, p_user_id, 'PASSWORD_CHANGED', 'User', p_user_id, now());
END;
$$;
