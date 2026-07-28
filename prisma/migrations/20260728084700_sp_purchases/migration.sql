-- Stored procedures: Compras (Proveedores, Órdenes de compra, Recepción de
-- mercancía). Mismo patrón: p_tenant_id explícito verificado, auditoría atómica
-- en cada mutación. 'P0002' = no encontrado/sin acceso (→ 404), 'P0001' =
-- conflicto de negocio (→ 409). La recepción de mercancía reutiliza el mismo
-- mecanismo de upsert de lotes + inventory_movements ENTRADA que
-- sp_register_entrada (Fase 4) para que Inventario y Compras compartan el
-- mismo stock, no tablas paralelas.

CREATE SEQUENCE IF NOT EXISTS purchase_order_number_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION sp_create_supplier(
  p_tenant_id uuid,
  p_name text,
  p_tax_id text,
  p_phone text,
  p_email text,
  p_address text,
  p_notes text,
  p_actor_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_supplier_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO suppliers (id, tenant_id, name, tax_id, phone, email, address, notes, created_at, updated_at)
  VALUES (v_supplier_id, p_tenant_id, p_name, p_tax_id, p_phone, p_email, p_address, p_notes, now(), now());

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'SUPPLIER_CREATED', 'Supplier', v_supplier_id,
    jsonb_build_object('name', p_name), now());

  RETURN v_supplier_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_list_suppliers(
  p_tenant_id uuid,
  p_search text,
  p_limit int,
  p_offset int
)
RETURNS TABLE (
  supplier_id uuid,
  name text,
  tax_id text,
  phone text,
  email text,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.name, s.tax_id, s.phone, s.email, s.created_at::timestamptz,
    COUNT(*) OVER() AS total_count
  FROM suppliers s
  WHERE s.tenant_id = p_tenant_id
    AND (p_search IS NULL OR p_search = '' OR s.name ILIKE '%' || p_search || '%' OR s.tax_id ILIKE '%' || p_search || '%')
  ORDER BY s.name ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION sp_get_supplier(
  p_tenant_id uuid,
  p_supplier_id uuid
)
RETURNS TABLE (
  supplier_id uuid,
  name text,
  tax_id text,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.name, s.tax_id, s.phone, s.email, s.address, s.notes, s.created_at::timestamptz, s.updated_at::timestamptz
  FROM suppliers s
  WHERE s.id = p_supplier_id AND s.tenant_id = p_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_update_supplier(
  p_tenant_id uuid,
  p_supplier_id uuid,
  p_name text,
  p_tax_id text,
  p_phone text,
  p_email text,
  p_address text,
  p_notes text,
  p_actor_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM suppliers WHERE id = p_supplier_id AND tenant_id = p_tenant_id) THEN
    RAISE EXCEPTION 'Proveedor no encontrado.' USING ERRCODE = 'P0002';
  END IF;

  UPDATE suppliers SET
    name = p_name, tax_id = p_tax_id, phone = p_phone, email = p_email, address = p_address, notes = p_notes,
    updated_at = now()
  WHERE id = p_supplier_id AND tenant_id = p_tenant_id;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'SUPPLIER_UPDATED', 'Supplier', p_supplier_id,
    jsonb_build_object('name', p_name), now());
END;
$$;

CREATE OR REPLACE FUNCTION sp_create_purchase_order(
  p_tenant_id uuid,
  p_supplier_id uuid,
  p_branch_id uuid,
  p_order_date date,
  p_items jsonb,
  p_notes text,
  p_actor_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id uuid := gen_random_uuid();
  v_order_number text;
  v_tenant_code text;
  v_item record;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM suppliers WHERE id = p_supplier_id AND tenant_id = p_tenant_id) THEN
    RAISE EXCEPTION 'Proveedor no encontrado.' USING ERRCODE = 'P0002';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM branches WHERE id = p_branch_id AND tenant_id = p_tenant_id) THEN
    RAISE EXCEPTION 'Sucursal no encontrada.' USING ERRCODE = 'P0002';
  END IF;

  SELECT tenant_code INTO v_tenant_code FROM tenants WHERE id = p_tenant_id;
  v_order_number := v_tenant_code || '-OC-' || lpad(nextval('purchase_order_number_seq')::text, 7, '0');

  INSERT INTO purchase_orders (id, tenant_id, supplier_id, branch_id, order_number, order_date, notes, created_by_user_id, created_at, updated_at)
  VALUES (v_order_id, p_tenant_id, p_supplier_id, p_branch_id, v_order_number, p_order_date, p_notes, p_actor_user_id, now(), now());

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id uuid, description text, quantity_ordered int, unit_cost numeric)
  LOOP
    IF NOT EXISTS(SELECT 1 FROM products WHERE id = v_item.product_id AND tenant_id = p_tenant_id) THEN
      RAISE EXCEPTION 'Producto no encontrado.' USING ERRCODE = 'P0002';
    END IF;
    IF v_item.quantity_ordered <= 0 THEN
      RAISE EXCEPTION 'La cantidad ordenada debe ser mayor a cero.' USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO purchase_order_items (id, purchase_order_id, product_id, description, quantity_ordered, quantity_received, unit_cost)
    VALUES (gen_random_uuid(), v_order_id, v_item.product_id, v_item.description, v_item.quantity_ordered, 0, v_item.unit_cost);
  END LOOP;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'PURCHASE_ORDER_CREATED', 'PurchaseOrder', v_order_id,
    jsonb_build_object('orderNumber', v_order_number), now());

  RETURN v_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_list_purchase_orders(
  p_tenant_id uuid,
  p_supplier_id uuid,
  p_status "PurchaseOrderStatus",
  p_limit int,
  p_offset int
)
RETURNS TABLE (
  purchase_order_id uuid,
  order_number text,
  supplier_name text,
  status "PurchaseOrderStatus",
  order_date date,
  total_cost numeric,
  total_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT po.id, po.order_number, s.name, po.status, po.order_date,
    COALESCE((SELECT SUM(poi.quantity_ordered * poi.unit_cost) FROM purchase_order_items poi WHERE poi.purchase_order_id = po.id), 0),
    COUNT(*) OVER() AS total_count
  FROM purchase_orders po
  JOIN suppliers s ON s.id = po.supplier_id
  WHERE po.tenant_id = p_tenant_id
    AND (p_supplier_id IS NULL OR po.supplier_id = p_supplier_id)
    AND (p_status IS NULL OR po.status = p_status)
  ORDER BY po.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION sp_get_purchase_order(
  p_tenant_id uuid,
  p_purchase_order_id uuid
)
RETURNS TABLE (
  purchase_order_id uuid,
  order_number text,
  supplier_id uuid,
  supplier_name text,
  branch_name text,
  status "PurchaseOrderStatus",
  order_date date,
  notes text,
  created_at timestamptz,
  items jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT po.id, po.order_number, po.supplier_id, s.name, b.name, po.status, po.order_date, po.notes, po.created_at::timestamptz,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
          'itemId', poi.id, 'productId', poi.product_id, 'productName', p.name,
          'description', poi.description, 'quantityOrdered', poi.quantity_ordered,
          'quantityReceived', poi.quantity_received, 'unitCost', poi.unit_cost
        ))
       FROM purchase_order_items poi JOIN products p ON p.id = poi.product_id WHERE poi.purchase_order_id = po.id),
      '[]'::jsonb
    )
  FROM purchase_orders po
  JOIN suppliers s ON s.id = po.supplier_id
  JOIN branches b ON b.id = po.branch_id
  WHERE po.id = p_purchase_order_id AND po.tenant_id = p_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_receive_purchase_order(
  p_tenant_id uuid,
  p_purchase_order_id uuid,
  p_items jsonb,
  p_actor_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_order purchase_orders%ROWTYPE;
  v_item record;
  v_order_item purchase_order_items%ROWTYPE;
  v_batch_id uuid;
  v_total_lines int;
  v_completed_lines int;
BEGIN
  SELECT * INTO v_order FROM purchase_orders WHERE id = p_purchase_order_id AND tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden de compra no encontrada.' USING ERRCODE = 'P0002';
  END IF;
  IF v_order.status = 'CANCELADA' THEN
    RAISE EXCEPTION 'La orden está cancelada, no se puede recibir mercancía.' USING ERRCODE = 'P0001';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(purchase_order_item_id uuid, quantity_received int, batch_number text, expiration_date date)
  LOOP
    SELECT * INTO v_order_item FROM purchase_order_items
    WHERE id = v_item.purchase_order_item_id AND purchase_order_id = p_purchase_order_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Línea de orden de compra no encontrada.' USING ERRCODE = 'P0002';
    END IF;

    IF v_item.quantity_received <= 0 THEN
      RAISE EXCEPTION 'La cantidad a recibir debe ser mayor a cero.' USING ERRCODE = 'P0001';
    END IF;
    IF v_order_item.quantity_received + v_item.quantity_received > v_order_item.quantity_ordered THEN
      RAISE EXCEPTION 'No se puede recibir más de lo ordenado (pendiente: %).',
        v_order_item.quantity_ordered - v_order_item.quantity_received USING ERRCODE = 'P0001';
    END IF;

    SELECT id INTO v_batch_id FROM product_batches
    WHERE product_id = v_order_item.product_id AND branch_id = v_order.branch_id AND batch_number = v_item.batch_number;

    IF v_batch_id IS NULL THEN
      v_batch_id := gen_random_uuid();
      INSERT INTO product_batches (id, tenant_id, product_id, branch_id, batch_number, expiration_date, quantity, created_at, updated_at)
      VALUES (v_batch_id, p_tenant_id, v_order_item.product_id, v_order.branch_id, v_item.batch_number, v_item.expiration_date, v_item.quantity_received, now(), now());
    ELSE
      UPDATE product_batches SET quantity = quantity + v_item.quantity_received, updated_at = now() WHERE id = v_batch_id;
    END IF;

    INSERT INTO inventory_movements (id, tenant_id, product_id, batch_id, branch_id, type, quantity, notes, performed_by_user_id, created_at)
    VALUES (gen_random_uuid(), p_tenant_id, v_order_item.product_id, v_batch_id, v_order.branch_id, 'ENTRADA', v_item.quantity_received,
      'Recepción orden ' || v_order.order_number, p_actor_user_id, now());

    UPDATE purchase_order_items SET quantity_received = quantity_received + v_item.quantity_received
    WHERE id = v_order_item.id;
  END LOOP;

  SELECT COUNT(*), COUNT(*) FILTER (WHERE quantity_received >= quantity_ordered)
  INTO v_total_lines, v_completed_lines
  FROM purchase_order_items WHERE purchase_order_id = p_purchase_order_id;

  UPDATE purchase_orders SET
    status = CASE
      WHEN v_completed_lines >= v_total_lines THEN 'RECIBIDA'
      WHEN EXISTS(SELECT 1 FROM purchase_order_items WHERE purchase_order_id = p_purchase_order_id AND quantity_received > 0) THEN 'RECIBIDA_PARCIAL'
      ELSE status
    END,
    updated_at = now()
  WHERE id = p_purchase_order_id;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'PURCHASE_ORDER_RECEIVED', 'PurchaseOrder', p_purchase_order_id,
    jsonb_build_object('items', p_items), now());
END;
$$;

CREATE OR REPLACE FUNCTION sp_cancel_purchase_order(
  p_tenant_id uuid,
  p_purchase_order_id uuid,
  p_actor_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_order purchase_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM purchase_orders WHERE id = p_purchase_order_id AND tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden de compra no encontrada.' USING ERRCODE = 'P0002';
  END IF;
  IF v_order.status = 'CANCELADA' THEN
    RAISE EXCEPTION 'La orden ya está cancelada.' USING ERRCODE = 'P0001';
  END IF;
  IF EXISTS(SELECT 1 FROM purchase_order_items WHERE purchase_order_id = p_purchase_order_id AND quantity_received > 0) THEN
    RAISE EXCEPTION 'No se puede cancelar una orden con mercancía ya recibida.' USING ERRCODE = 'P0001';
  END IF;

  UPDATE purchase_orders SET status = 'CANCELADA', updated_at = now() WHERE id = p_purchase_order_id;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'PURCHASE_ORDER_CANCELLED', 'PurchaseOrder', p_purchase_order_id,
    '{}'::jsonb, now());
END;
$$;
