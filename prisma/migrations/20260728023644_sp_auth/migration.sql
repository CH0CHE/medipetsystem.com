-- Stored procedures: autenticación (rate limiting por IP, contexto de login, registro de resultado).

CREATE OR REPLACE FUNCTION sp_check_ip_rate_limit(
  p_ip_address text,
  p_window_minutes int,
  p_max_attempts int
)
RETURNS TABLE (allowed boolean, attempts_in_window int)
LANGUAGE plpgsql
AS $$
DECLARE
  v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM audit_logs
  WHERE action = 'AUTH_LOGIN_FAILED'
    AND ip_address = p_ip_address
    AND created_at >= now() - (p_window_minutes || ' minutes')::interval;

  RETURN QUERY SELECT (v_count < p_max_attempts), v_count;
END;
$$;

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
    u.locked_until,
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

CREATE OR REPLACE FUNCTION sp_record_login_result(
  p_user_id uuid,
  p_username_attempted text,
  p_success boolean,
  p_ip_address text,
  p_user_agent text,
  p_max_attempts int,
  p_lock_minutes int
)
RETURNS TABLE (locked_until timestamptz)
LANGUAGE plpgsql
AS $$
DECLARE
  v_tenant_id uuid;
  v_new_attempts int;
  v_locked_until timestamptz := NULL;
BEGIN
  IF p_success THEN
    IF p_user_id IS NOT NULL THEN
      UPDATE users
      SET failed_login_attempts = 0, locked_until = NULL, last_login_at = now(), updated_at = now()
      WHERE id = p_user_id
      RETURNING tenant_id INTO v_tenant_id;
    END IF;

    INSERT INTO audit_logs (id, tenant_id, user_id, target_username, action, ip_address, user_agent, created_at)
    VALUES (gen_random_uuid(), v_tenant_id, p_user_id, p_username_attempted, 'AUTH_LOGIN_SUCCESS', p_ip_address, p_user_agent, now());
  ELSE
    IF p_user_id IS NOT NULL THEN
      UPDATE users
      SET failed_login_attempts = failed_login_attempts + 1,
          locked_until = CASE
            WHEN failed_login_attempts + 1 >= p_max_attempts THEN now() + (p_lock_minutes || ' minutes')::interval
            ELSE locked_until
          END,
          updated_at = now()
      WHERE id = p_user_id
      RETURNING tenant_id, failed_login_attempts, locked_until INTO v_tenant_id, v_new_attempts, v_locked_until;
    END IF;

    INSERT INTO audit_logs (id, tenant_id, user_id, target_username, action, ip_address, user_agent, created_at)
    VALUES (gen_random_uuid(), v_tenant_id, p_user_id, p_username_attempted, 'AUTH_LOGIN_FAILED', p_ip_address, p_user_agent, now());
  END IF;

  RETURN QUERY SELECT v_locked_until;
END;
$$;
