-- Stored procedures: Inventario (productos, lotes, movimientos, alertas de vencimiento).
-- Mismo patrón: p_tenant_id explícito verificado en cada join/WHERE, auditoría
-- atómica en cada mutación. 'P0002' = no encontrado/sin acceso (→ 404 en la API,
-- ver src/lib/http/api-error.ts). 'P0001' = conflicto de negocio (→ 409).

CREATE OR REPLACE FUNCTION sp_create_product(
  p_tenant_id uuid,
  p_sku text,
  p_internal_code text,
  p_name text,
  p_category text,
  p_cost_price numeric,
  p_sale_price numeric,
  p_min_stock int,
  p_actor_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_product_id uuid := gen_random_uuid();
  v_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM products WHERE tenant_id = p_tenant_id AND sku = p_sku) INTO v_exists;
  IF v_exists THEN
    RAISE EXCEPTION 'Ya existe un producto con ese SKU.' USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO products (id, tenant_id, sku, internal_code, name, category, cost_price, sale_price, min_stock, created_at, updated_at)
  VALUES (v_product_id, p_tenant_id, p_sku, p_internal_code, p_name, p_category, p_cost_price, p_sale_price, p_min_stock, now(), now());

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'PRODUCT_CREATED', 'Product', v_product_id,
    jsonb_build_object('sku', p_sku, 'name', p_name), now());

  RETURN v_product_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_list_products(
  p_tenant_id uuid,
  p_search text,
  p_category text,
  p_low_stock_only boolean,
  p_limit int,
  p_offset int
)
RETURNS TABLE (
  product_id uuid,
  sku text,
  internal_code text,
  name text,
  category text,
  cost_price numeric,
  sale_price numeric,
  min_stock int,
  total_stock bigint,
  total_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM (
    SELECT
      pr.id,
      pr.sku,
      pr.internal_code,
      pr.name,
      pr.category,
      pr.cost_price,
      pr.sale_price,
      pr.min_stock,
      COALESCE(SUM(b.quantity), 0) AS total_stock,
      COUNT(*) OVER() AS total_count
    FROM products pr
    LEFT JOIN product_batches b ON b.product_id = pr.id
    WHERE pr.tenant_id = p_tenant_id
      AND (p_search IS NULL OR p_search = '' OR pr.name ILIKE '%' || p_search || '%' OR pr.sku ILIKE '%' || p_search || '%')
      AND (p_category IS NULL OR p_category = '' OR pr.category = p_category)
    GROUP BY pr.id
  ) sub
  WHERE (NOT p_low_stock_only OR sub.total_stock < sub.min_stock)
  ORDER BY sub.name
  LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION sp_get_product(
  p_tenant_id uuid,
  p_product_id uuid
)
RETURNS TABLE (
  product_id uuid,
  sku text,
  internal_code text,
  name text,
  category text,
  cost_price numeric,
  sale_price numeric,
  min_stock int,
  created_at timestamptz,
  updated_at timestamptz,
  batches jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.id, pr.sku, pr.internal_code, pr.name, pr.category, pr.cost_price, pr.sale_price, pr.min_stock,
    pr.created_at::timestamptz, pr.updated_at::timestamptz,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
          'batchId', b.id, 'branchId', b.branch_id, 'branchName', br.name,
          'batchNumber', b.batch_number, 'expirationDate', b.expiration_date, 'quantity', b.quantity
        ) ORDER BY b.expiration_date NULLS LAST)
       FROM product_batches b JOIN branches br ON br.id = b.branch_id
       WHERE b.product_id = pr.id),
      '[]'::jsonb
    )
  FROM products pr
  WHERE pr.id = p_product_id AND pr.tenant_id = p_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_update_product(
  p_tenant_id uuid,
  p_product_id uuid,
  p_name text,
  p_category text,
  p_cost_price numeric,
  p_sale_price numeric,
  p_min_stock int,
  p_actor_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated int;
BEGIN
  UPDATE products
  SET name = p_name, category = p_category, cost_price = p_cost_price, sale_price = p_sale_price,
      min_stock = p_min_stock, updated_at = now()
  WHERE id = p_product_id AND tenant_id = p_tenant_id;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RAISE EXCEPTION 'Producto no encontrado.' USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'PRODUCT_UPDATED', 'Product', p_product_id, now());
END;
$$;

CREATE OR REPLACE FUNCTION sp_register_entrada(
  p_tenant_id uuid,
  p_product_id uuid,
  p_branch_id uuid,
  p_batch_number text,
  p_expiration_date date,
  p_quantity int,
  p_notes text,
  p_actor_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_batch_id uuid;
  v_movement_id uuid := gen_random_uuid();
  v_product_exists boolean;
BEGIN
  SELECT EXISTS(SELECT 1 FROM products WHERE id = p_product_id AND tenant_id = p_tenant_id) INTO v_product_exists;
  IF NOT v_product_exists THEN
    RAISE EXCEPTION 'Producto no encontrado.' USING ERRCODE = 'P0002';
  END IF;

  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor a cero.' USING ERRCODE = 'P0001';
  END IF;

  SELECT id INTO v_batch_id FROM product_batches
  WHERE product_id = p_product_id AND branch_id = p_branch_id AND batch_number = p_batch_number;

  IF v_batch_id IS NULL THEN
    v_batch_id := gen_random_uuid();
    INSERT INTO product_batches (id, tenant_id, product_id, branch_id, batch_number, expiration_date, quantity, created_at, updated_at)
    VALUES (v_batch_id, p_tenant_id, p_product_id, p_branch_id, p_batch_number, p_expiration_date, p_quantity, now(), now());
  ELSE
    UPDATE product_batches SET quantity = quantity + p_quantity, updated_at = now() WHERE id = v_batch_id;
  END IF;

  INSERT INTO inventory_movements (id, tenant_id, product_id, batch_id, branch_id, type, quantity, notes, performed_by_user_id, created_at)
  VALUES (v_movement_id, p_tenant_id, p_product_id, v_batch_id, p_branch_id, 'ENTRADA', p_quantity, p_notes, p_actor_user_id, now());

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'INVENTORY_ENTRADA', 'InventoryMovement', v_movement_id,
    jsonb_build_object('productId', p_product_id, 'batchNumber', p_batch_number, 'quantity', p_quantity), now());

  RETURN v_movement_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_register_salida(
  p_tenant_id uuid,
  p_batch_id uuid,
  p_quantity int,
  p_notes text,
  p_actor_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_movement_id uuid := gen_random_uuid();
  v_batch product_batches%ROWTYPE;
BEGIN
  SELECT * INTO v_batch FROM product_batches WHERE id = p_batch_id AND tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lote no encontrado.' USING ERRCODE = 'P0002';
  END IF;

  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor a cero.' USING ERRCODE = 'P0001';
  END IF;

  IF v_batch.quantity < p_quantity THEN
    RAISE EXCEPTION 'Existencia insuficiente en el lote (disponible: %).', v_batch.quantity USING ERRCODE = 'P0001';
  END IF;

  UPDATE product_batches SET quantity = quantity - p_quantity, updated_at = now() WHERE id = p_batch_id;

  INSERT INTO inventory_movements (id, tenant_id, product_id, batch_id, branch_id, type, quantity, notes, performed_by_user_id, created_at)
  VALUES (v_movement_id, p_tenant_id, v_batch.product_id, p_batch_id, v_batch.branch_id, 'SALIDA', p_quantity, p_notes, p_actor_user_id, now());

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'INVENTORY_SALIDA', 'InventoryMovement', v_movement_id,
    jsonb_build_object('batchId', p_batch_id, 'quantity', p_quantity), now());

  RETURN v_movement_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_register_ajuste(
  p_tenant_id uuid,
  p_batch_id uuid,
  p_new_quantity int,
  p_notes text,
  p_actor_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_movement_id uuid := gen_random_uuid();
  v_batch product_batches%ROWTYPE;
  v_delta int;
BEGIN
  SELECT * INTO v_batch FROM product_batches WHERE id = p_batch_id AND tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lote no encontrado.' USING ERRCODE = 'P0002';
  END IF;

  IF p_new_quantity < 0 THEN
    RAISE EXCEPTION 'La existencia no puede ser negativa.' USING ERRCODE = 'P0001';
  END IF;

  v_delta := p_new_quantity - v_batch.quantity;

  UPDATE product_batches SET quantity = p_new_quantity, updated_at = now() WHERE id = p_batch_id;

  INSERT INTO inventory_movements (id, tenant_id, product_id, batch_id, branch_id, type, quantity, notes, performed_by_user_id, created_at)
  VALUES (v_movement_id, p_tenant_id, v_batch.product_id, p_batch_id, v_batch.branch_id, 'AJUSTE', v_delta, p_notes, p_actor_user_id, now());

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'INVENTORY_AJUSTE', 'InventoryMovement', v_movement_id,
    jsonb_build_object('batchId', p_batch_id, 'delta', v_delta, 'newQuantity', p_new_quantity), now());

  RETURN v_movement_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_register_transferencia(
  p_tenant_id uuid,
  p_batch_id uuid,
  p_target_branch_id uuid,
  p_quantity int,
  p_notes text,
  p_actor_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_movement_id uuid := gen_random_uuid();
  v_batch product_batches%ROWTYPE;
  v_target_batch_id uuid;
  v_target_branch_exists boolean;
BEGIN
  SELECT * INTO v_batch FROM product_batches WHERE id = p_batch_id AND tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lote no encontrado.' USING ERRCODE = 'P0002';
  END IF;

  SELECT EXISTS(SELECT 1 FROM branches WHERE id = p_target_branch_id AND tenant_id = p_tenant_id) INTO v_target_branch_exists;
  IF NOT v_target_branch_exists THEN
    RAISE EXCEPTION 'Sucursal destino no encontrada.' USING ERRCODE = 'P0002';
  END IF;

  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'La cantidad debe ser mayor a cero.' USING ERRCODE = 'P0001';
  END IF;

  IF v_batch.quantity < p_quantity THEN
    RAISE EXCEPTION 'Existencia insuficiente en el lote (disponible: %).', v_batch.quantity USING ERRCODE = 'P0001';
  END IF;

  UPDATE product_batches SET quantity = quantity - p_quantity, updated_at = now() WHERE id = p_batch_id;

  SELECT id INTO v_target_batch_id FROM product_batches
  WHERE product_id = v_batch.product_id AND branch_id = p_target_branch_id AND batch_number = v_batch.batch_number;

  IF v_target_batch_id IS NULL THEN
    v_target_batch_id := gen_random_uuid();
    INSERT INTO product_batches (id, tenant_id, product_id, branch_id, batch_number, expiration_date, quantity, created_at, updated_at)
    VALUES (v_target_batch_id, p_tenant_id, v_batch.product_id, p_target_branch_id, v_batch.batch_number, v_batch.expiration_date, p_quantity, now(), now());
  ELSE
    UPDATE product_batches SET quantity = quantity + p_quantity, updated_at = now() WHERE id = v_target_batch_id;
  END IF;

  INSERT INTO inventory_movements (id, tenant_id, product_id, batch_id, branch_id, target_branch_id, type, quantity, notes, performed_by_user_id, created_at)
  VALUES (v_movement_id, p_tenant_id, v_batch.product_id, p_batch_id, v_batch.branch_id, p_target_branch_id, 'TRANSFERENCIA', p_quantity, p_notes, p_actor_user_id, now());

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'INVENTORY_TRANSFERENCIA', 'InventoryMovement', v_movement_id,
    jsonb_build_object('batchId', p_batch_id, 'targetBranchId', p_target_branch_id, 'quantity', p_quantity), now());

  RETURN v_movement_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_list_movements(
  p_tenant_id uuid,
  p_product_id uuid,
  p_limit int,
  p_offset int
)
RETURNS TABLE (
  movement_id uuid,
  type "MovementType",
  quantity int,
  branch_name text,
  target_branch_name text,
  notes text,
  performed_by_username text,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id, m.type, m.quantity, b.name, tb.name, m.notes, u.username,
    m.created_at::timestamptz,
    COUNT(*) OVER() AS total_count
  FROM inventory_movements m
  JOIN branches b ON b.id = m.branch_id
  LEFT JOIN branches tb ON tb.id = m.target_branch_id
  JOIN users u ON u.id = m.performed_by_user_id
  WHERE m.tenant_id = p_tenant_id AND m.product_id = p_product_id
  ORDER BY m.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION sp_list_expiring_batches(
  p_tenant_id uuid,
  p_max_days int,
  p_limit int
)
RETURNS TABLE (
  batch_id uuid,
  product_name text,
  sku text,
  branch_name text,
  batch_number text,
  expiration_date date,
  quantity int,
  days_remaining int
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id, pr.name, pr.sku, br.name, b.batch_number, b.expiration_date, b.quantity,
    (b.expiration_date - CURRENT_DATE)::int AS days_remaining
  FROM product_batches b
  JOIN products pr ON pr.id = b.product_id
  JOIN branches br ON br.id = b.branch_id
  WHERE b.tenant_id = p_tenant_id
    AND b.quantity > 0
    AND b.expiration_date IS NOT NULL
    AND b.expiration_date <= CURRENT_DATE + (p_max_days || ' days')::interval
  ORDER BY b.expiration_date ASC
  LIMIT p_limit;
END;
$$;
