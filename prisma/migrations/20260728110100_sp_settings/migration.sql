-- Stored procedures: Configuración (política de contraseñas configurable por
-- tenant, Fase 9 — Hardening de seguridad). `password_policy = NULL` significa
-- "usa los defaults de la aplicación" (ver src/lib/security/password-policy.ts).

CREATE OR REPLACE FUNCTION sp_get_tenant_password_policy(
  p_tenant_id uuid
)
RETURNS TABLE (
  password_policy jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM tenants WHERE id = p_tenant_id) THEN
    RAISE EXCEPTION 'Clínica no encontrada.' USING ERRCODE = 'P0002';
  END IF;

  RETURN QUERY SELECT t.password_policy FROM tenants t WHERE t.id = p_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_update_tenant_password_policy(
  p_tenant_id uuid,
  p_policy jsonb,
  p_actor_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM tenants WHERE id = p_tenant_id) THEN
    RAISE EXCEPTION 'Clínica no encontrada.' USING ERRCODE = 'P0002';
  END IF;

  UPDATE tenants SET password_policy = p_policy, updated_at = now() WHERE id = p_tenant_id;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'PASSWORD_POLICY_UPDATED', 'Tenant', p_tenant_id,
    jsonb_build_object('policy', p_policy), now());
END;
$$;
