-- Stored procedures: extensión del Portal MediPet Admin (Fase 8) — ficha de
-- tenant, baja permanente, gestión de planes, métricas SaaS, facturación de
-- suscripción, auditoría global y cuentas de soporte (conector). A diferencia
-- de cualquier SP de un módulo de clínica, estas NO reciben p_tenant_id como
-- filtro de aislamiento obligatorio (algunas ni siquiera lo reciben) — son del
-- propio staff de MediPet, con alcance cross-tenant intencional. Mutaciones
-- auditan atómicamente. 'P0002' = no encontrado → 404, 'P0001' = conflicto de
-- negocio → 409.

CREATE OR REPLACE FUNCTION sp_get_tenant_detail(
  p_tenant_id uuid
)
RETURNS TABLE (
  tenant_id uuid,
  tenant_code text,
  name text,
  plan "TenantPlan",
  status "TenantStatus",
  main_branch_name text,
  user_count bigint,
  connector_username text,
  connector_status "UserStatus",
  connector_last_login timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id, t.tenant_code, t.name, t.plan, t.status,
    (SELECT b.name FROM branches b WHERE b.tenant_id = t.id AND b.is_main LIMIT 1),
    (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id),
    c.username, c.status, c.last_login_at::timestamptz,
    t.created_at::timestamptz
  FROM tenants t
  LEFT JOIN users c ON c.tenant_id = t.id AND c.is_support_account = true
  WHERE t.id = p_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_cancel_tenant(
  p_tenant_id uuid,
  p_actor_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_status "TenantStatus";
BEGIN
  SELECT status INTO v_status FROM tenants WHERE id = p_tenant_id;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Clínica no encontrada.' USING ERRCODE = 'P0002';
  END IF;
  IF v_status = 'CANCELADA' THEN
    RAISE EXCEPTION 'La clínica ya está dada de baja.' USING ERRCODE = 'P0001';
  END IF;

  UPDATE tenants SET status = 'CANCELADA', updated_at = now() WHERE id = p_tenant_id;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'TENANT_CANCELLED', 'Tenant', p_tenant_id, '{}'::jsonb, now());
END;
$$;

CREATE OR REPLACE FUNCTION sp_update_tenant_plan(
  p_tenant_id uuid,
  p_plan "TenantPlan",
  p_actor_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM tenants WHERE id = p_tenant_id) THEN
    RAISE EXCEPTION 'Clínica no encontrada.' USING ERRCODE = 'P0002';
  END IF;

  UPDATE tenants SET plan = p_plan, updated_at = now() WHERE id = p_tenant_id;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'TENANT_PLAN_UPDATED', 'Tenant', p_tenant_id,
    jsonb_build_object('plan', p_plan), now());
END;
$$;

CREATE OR REPLACE FUNCTION sp_get_saas_metrics()
RETURNS TABLE (
  total_tenants bigint,
  active_count bigint,
  suspended_count bigint,
  cancelled_count bigint,
  basic_count bigint,
  pro_count bigint,
  enterprise_count bigint,
  new_this_month bigint,
  total_pending_subscription numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'ACTIVE'),
    COUNT(*) FILTER (WHERE status = 'SUSPENDED'),
    COUNT(*) FILTER (WHERE status = 'CANCELADA'),
    COUNT(*) FILTER (WHERE plan = 'BASIC'),
    COUNT(*) FILTER (WHERE plan = 'PRO'),
    COUNT(*) FILTER (WHERE plan = 'ENTERPRISE'),
    COUNT(*) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)),
    (SELECT COALESCE(SUM(amount), 0) FROM platform_invoices WHERE status = 'PENDIENTE')
  FROM tenants;
END;
$$;

CREATE OR REPLACE FUNCTION sp_create_platform_invoice(
  p_tenant_id uuid,
  p_period text,
  p_amount numeric,
  p_actor_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_invoice_id uuid := gen_random_uuid();
  v_plan "TenantPlan";
BEGIN
  SELECT plan INTO v_plan FROM tenants WHERE id = p_tenant_id;
  IF v_plan IS NULL THEN
    RAISE EXCEPTION 'Clínica no encontrada.' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS(SELECT 1 FROM platform_invoices WHERE tenant_id = p_tenant_id AND period = p_period) THEN
    RAISE EXCEPTION 'Ya existe una factura de suscripción para ese período.' USING ERRCODE = 'P0001';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a cero.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO platform_invoices (id, tenant_id, period, plan, amount, status, created_by_user_id, created_at)
  VALUES (v_invoice_id, p_tenant_id, p_period, v_plan, p_amount, 'PENDIENTE', p_actor_user_id, now());

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'PLATFORM_INVOICE_CREATED', 'PlatformInvoice', v_invoice_id,
    jsonb_build_object('period', p_period, 'amount', p_amount), now());

  RETURN v_invoice_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_list_platform_invoices(
  p_tenant_id uuid,
  p_status "SubscriptionInvoiceStatus",
  p_limit int,
  p_offset int
)
RETURNS TABLE (
  invoice_id uuid,
  tenant_id uuid,
  tenant_name text,
  period text,
  plan "TenantPlan",
  amount numeric,
  status "SubscriptionInvoiceStatus",
  paid_at timestamptz,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT pi.id, pi.tenant_id, t.name, pi.period, pi.plan, pi.amount, pi.status,
    pi.paid_at::timestamptz, pi.created_at::timestamptz,
    COUNT(*) OVER() AS total_count
  FROM platform_invoices pi
  JOIN tenants t ON t.id = pi.tenant_id
  WHERE (p_tenant_id IS NULL OR pi.tenant_id = p_tenant_id)
    AND (p_status IS NULL OR pi.status = p_status)
  ORDER BY pi.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION sp_mark_platform_invoice_paid(
  p_invoice_id uuid,
  p_actor_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_invoice platform_invoices%ROWTYPE;
BEGIN
  SELECT * INTO v_invoice FROM platform_invoices WHERE id = p_invoice_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Factura de suscripción no encontrada.' USING ERRCODE = 'P0002';
  END IF;
  IF v_invoice.status = 'PAGADA' THEN
    RAISE EXCEPTION 'La factura ya está pagada.' USING ERRCODE = 'P0001';
  END IF;

  UPDATE platform_invoices SET status = 'PAGADA', paid_at = now() WHERE id = p_invoice_id;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), v_invoice.tenant_id, p_actor_user_id, 'PLATFORM_INVOICE_PAID', 'PlatformInvoice', p_invoice_id,
    '{}'::jsonb, now());
END;
$$;

CREATE OR REPLACE FUNCTION sp_list_audit_logs(
  p_tenant_id uuid,
  p_action text,
  p_from date,
  p_to date,
  p_limit int,
  p_offset int
)
RETURNS TABLE (
  log_id uuid,
  tenant_name text,
  username text,
  action text,
  entity_type text,
  entity_id text,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id, t.name, COALESCE(u.username, a.target_username), a.action, a.entity_type, a.entity_id,
    a.created_at::timestamptz,
    COUNT(*) OVER() AS total_count
  FROM audit_logs a
  LEFT JOIN tenants t ON t.id = a.tenant_id
  LEFT JOIN users u ON u.id = a.user_id
  WHERE (p_tenant_id IS NULL OR a.tenant_id = p_tenant_id)
    AND (p_action IS NULL OR p_action = '' OR a.action = p_action)
    AND a.created_at::date BETWEEN p_from AND p_to
  ORDER BY a.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION sp_list_support_accounts()
RETURNS TABLE (
  tenant_id uuid,
  tenant_name text,
  connector_username text,
  connector_status "UserStatus",
  connector_last_login timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name, c.username, c.status, c.last_login_at::timestamptz
  FROM tenants t
  JOIN users c ON c.tenant_id = t.id AND c.is_support_account = true
  ORDER BY t.name ASC;
END;
$$;
