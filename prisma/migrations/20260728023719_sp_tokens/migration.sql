-- Stored procedures: emisión, rotación y revocación de refresh tokens.

CREATE OR REPLACE FUNCTION sp_issue_refresh_token(
  p_user_id uuid,
  p_token_hash text,
  p_family text,
  p_expires_at timestamptz,
  p_ip_address text,
  p_user_agent text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO refresh_tokens (id, user_id, token_hash, family, issued_at, expires_at, ip_address, user_agent, created_at)
  VALUES (v_id, p_user_id, p_token_hash, p_family, now(), p_expires_at, p_ip_address, p_user_agent, now());

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_rotate_refresh_token(
  p_old_token_hash text,
  p_new_token_hash text,
  p_new_expires_at timestamptz,
  p_ip_address text,
  p_user_agent text
)
RETURNS TABLE (
  user_id uuid,
  tenant_id uuid,
  new_token_id uuid,
  family text,
  status text
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_old refresh_tokens%ROWTYPE;
  v_tenant_id uuid;
  v_new_id uuid := gen_random_uuid();
BEGIN
  SELECT * INTO v_old FROM refresh_tokens WHERE token_hash = p_old_token_hash;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, NULL::uuid, NULL::uuid, NULL::text, 'invalid'::text;
    RETURN;
  END IF;

  IF v_old.expires_at < now() THEN
    RETURN QUERY SELECT NULL::uuid, NULL::uuid, NULL::uuid, NULL::text, 'expired'::text;
    RETURN;
  END IF;

  IF v_old.revoked_at IS NOT NULL THEN
    -- Reuso de un token ya rotado: posible robo de token. Revocar toda la family.
    UPDATE refresh_tokens SET revoked_at = now() WHERE family = v_old.family AND revoked_at IS NULL;

    SELECT tenant_id INTO v_tenant_id FROM users WHERE id = v_old.user_id;

    INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, ip_address, user_agent, created_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_old.user_id, 'SECURITY_TOKEN_REUSE_DETECTED', 'RefreshToken', v_old.id,
      jsonb_build_object('family', v_old.family), p_ip_address, p_user_agent, now());

    RETURN QUERY SELECT NULL::uuid, NULL::uuid, NULL::uuid, NULL::text, 'reused_detected'::text;
    RETURN;
  END IF;

  UPDATE refresh_tokens SET revoked_at = now(), replaced_by_token_id = v_new_id WHERE id = v_old.id;

  INSERT INTO refresh_tokens (id, user_id, token_hash, family, issued_at, expires_at, ip_address, user_agent, created_at)
  VALUES (v_new_id, v_old.user_id, p_new_token_hash, v_old.family, now(), p_new_expires_at, p_ip_address, p_user_agent, now());

  SELECT tenant_id INTO v_tenant_id FROM users WHERE id = v_old.user_id;

  RETURN QUERY SELECT v_old.user_id, v_tenant_id, v_new_id, v_old.family, 'rotated'::text;
END;
$$;

CREATE OR REPLACE FUNCTION sp_revoke_refresh_token(
  p_token_hash text,
  p_actor_user_id uuid,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = p_token_hash AND revoked_at IS NULL;

  SELECT tenant_id INTO v_tenant_id FROM users WHERE id = p_actor_user_id;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, metadata, created_at)
  VALUES (gen_random_uuid(), v_tenant_id, p_actor_user_id, 'AUTH_LOGOUT', jsonb_build_object('reason', p_reason), now());
END;
$$;

CREATE OR REPLACE FUNCTION sp_revoke_all_user_tokens(
  p_user_id uuid,
  p_reason text
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = p_user_id AND revoked_at IS NULL;

  SELECT tenant_id INTO v_tenant_id FROM users WHERE id = p_user_id;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, metadata, created_at)
  VALUES (gen_random_uuid(), v_tenant_id, p_user_id, 'AUTH_ALL_SESSIONS_REVOKED', jsonb_build_object('reason', p_reason), now());
END;
$$;
