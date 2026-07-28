-- Stored procedures: Facturación (cotizaciones, facturas, notas, pagos) y
-- Cuentas por Cobrar (estado de cuenta). Mismo patrón: p_tenant_id explícito
-- verificado, auditoría atómica en cada mutación. Las funciones que crean
-- documentos con líneas reciben `p_items jsonb` (array de objetos snake_case:
-- product_id, description, quantity, unit_price) y usan `jsonb_to_recordset`
-- para insertar todas las líneas en una sola llamada.

CREATE SEQUENCE IF NOT EXISTS quote_number_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION sp_create_quote(
  p_tenant_id uuid,
  p_owner_id uuid,
  p_branch_id uuid,
  p_issue_date date,
  p_expiry_date date,
  p_items jsonb,
  p_notes text,
  p_actor_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_quote_id uuid := gen_random_uuid();
  v_quote_number text;
  v_tenant_code text;
  v_subtotal numeric := 0;
  v_line_total numeric;
  v_item record;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM owners WHERE id = p_owner_id AND tenant_id = p_tenant_id) THEN
    RAISE EXCEPTION 'Propietario no encontrado.' USING ERRCODE = 'P0002';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM branches WHERE id = p_branch_id AND tenant_id = p_tenant_id) THEN
    RAISE EXCEPTION 'Sucursal no encontrada.' USING ERRCODE = 'P0002';
  END IF;

  SELECT tenant_code INTO v_tenant_code FROM tenants WHERE id = p_tenant_id;
  v_quote_number := v_tenant_code || '-C-' || lpad(nextval('quote_number_seq')::text, 7, '0');

  INSERT INTO quotes (id, tenant_id, owner_id, branch_id, quote_number, issue_date, expiry_date, subtotal, tax, total, notes, created_by_user_id, created_at, updated_at)
  VALUES (v_quote_id, p_tenant_id, p_owner_id, p_branch_id, v_quote_number, p_issue_date, p_expiry_date, 0, 0, 0, p_notes, p_actor_user_id, now(), now());

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id uuid, description text, quantity int, unit_price numeric)
  LOOP
    IF NOT EXISTS(SELECT 1 FROM products WHERE id = v_item.product_id AND tenant_id = p_tenant_id) THEN
      RAISE EXCEPTION 'Producto no encontrado.' USING ERRCODE = 'P0002';
    END IF;
    IF v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'La cantidad debe ser mayor a cero.' USING ERRCODE = 'P0001';
    END IF;

    v_line_total := v_item.quantity * v_item.unit_price;
    v_subtotal := v_subtotal + v_line_total;

    INSERT INTO quote_items (id, quote_id, product_id, description, quantity, unit_price, line_total)
    VALUES (gen_random_uuid(), v_quote_id, v_item.product_id, v_item.description, v_item.quantity, v_item.unit_price, v_line_total);
  END LOOP;

  UPDATE quotes SET subtotal = v_subtotal, tax = 0, total = v_subtotal, updated_at = now() WHERE id = v_quote_id;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'QUOTE_CREATED', 'Quote', v_quote_id,
    jsonb_build_object('quoteNumber', v_quote_number, 'total', v_subtotal), now());

  RETURN v_quote_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_list_quotes(
  p_tenant_id uuid,
  p_owner_id uuid,
  p_status "DocumentStatus",
  p_limit int,
  p_offset int
)
RETURNS TABLE (
  quote_id uuid,
  quote_number text,
  owner_name text,
  status "DocumentStatus",
  issue_date date,
  total numeric,
  total_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT q.id, q.quote_number, o.full_name, q.status, q.issue_date, q.total,
    COUNT(*) OVER() AS total_count
  FROM quotes q
  JOIN owners o ON o.id = q.owner_id
  WHERE q.tenant_id = p_tenant_id
    AND (p_owner_id IS NULL OR q.owner_id = p_owner_id)
    AND (p_status IS NULL OR q.status = p_status)
  ORDER BY q.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION sp_get_quote(
  p_tenant_id uuid,
  p_quote_id uuid
)
RETURNS TABLE (
  quote_id uuid,
  quote_number text,
  owner_id uuid,
  owner_name text,
  branch_name text,
  status "DocumentStatus",
  issue_date date,
  expiry_date date,
  subtotal numeric,
  tax numeric,
  total numeric,
  notes text,
  created_at timestamptz,
  items jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT q.id, q.quote_number, q.owner_id, o.full_name, b.name, q.status, q.issue_date, q.expiry_date,
    q.subtotal, q.tax, q.total, q.notes, q.created_at::timestamptz,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
          'itemId', qi.id, 'productId', qi.product_id, 'productName', p.name,
          'description', qi.description, 'quantity', qi.quantity, 'unitPrice', qi.unit_price, 'lineTotal', qi.line_total
        ))
       FROM quote_items qi JOIN products p ON p.id = qi.product_id WHERE qi.quote_id = q.id),
      '[]'::jsonb
    )
  FROM quotes q
  JOIN owners o ON o.id = q.owner_id
  JOIN branches b ON b.id = q.branch_id
  WHERE q.id = p_quote_id AND q.tenant_id = p_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_create_invoice(
  p_tenant_id uuid,
  p_owner_id uuid,
  p_branch_id uuid,
  p_issue_date date,
  p_items jsonb,
  p_notes text,
  p_actor_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_invoice_id uuid := gen_random_uuid();
  v_invoice_number text;
  v_tenant_code text;
  v_subtotal numeric := 0;
  v_line_total numeric;
  v_item record;
  v_batch record;
  v_remaining int;
  v_deduct int;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM owners WHERE id = p_owner_id AND tenant_id = p_tenant_id) THEN
    RAISE EXCEPTION 'Propietario no encontrado.' USING ERRCODE = 'P0002';
  END IF;
  IF NOT EXISTS(SELECT 1 FROM branches WHERE id = p_branch_id AND tenant_id = p_tenant_id) THEN
    RAISE EXCEPTION 'Sucursal no encontrada.' USING ERRCODE = 'P0002';
  END IF;

  SELECT tenant_code INTO v_tenant_code FROM tenants WHERE id = p_tenant_id;
  v_invoice_number := v_tenant_code || '-F-' || lpad(nextval('invoice_number_seq')::text, 7, '0');

  INSERT INTO invoices (id, tenant_id, owner_id, branch_id, invoice_number, issue_date, subtotal, tax, total, balance_due, notes, created_by_user_id, created_at, updated_at)
  VALUES (v_invoice_id, p_tenant_id, p_owner_id, p_branch_id, v_invoice_number, p_issue_date, 0, 0, 0, 0, p_notes, p_actor_user_id, now(), now());

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id uuid, description text, quantity int, unit_price numeric)
  LOOP
    IF NOT EXISTS(SELECT 1 FROM products WHERE id = v_item.product_id AND tenant_id = p_tenant_id) THEN
      RAISE EXCEPTION 'Producto no encontrado.' USING ERRCODE = 'P0002';
    END IF;
    IF v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'La cantidad debe ser mayor a cero.' USING ERRCODE = 'P0001';
    END IF;

    v_line_total := v_item.quantity * v_item.unit_price;
    v_subtotal := v_subtotal + v_line_total;

    INSERT INTO invoice_items (id, invoice_id, product_id, description, quantity, unit_price, line_total)
    VALUES (gen_random_uuid(), v_invoice_id, v_item.product_id, v_item.description, v_item.quantity, v_item.unit_price, v_line_total);

    -- Descuento FEFO: lotes de este producto en esta sucursal, venciendo primero.
    v_remaining := v_item.quantity;
    FOR v_batch IN
      SELECT id, quantity FROM product_batches
      WHERE product_id = v_item.product_id AND branch_id = p_branch_id AND quantity > 0
      ORDER BY expiration_date ASC NULLS LAST
      FOR UPDATE
    LOOP
      EXIT WHEN v_remaining <= 0;
      v_deduct := LEAST(v_batch.quantity, v_remaining);

      UPDATE product_batches SET quantity = quantity - v_deduct, updated_at = now() WHERE id = v_batch.id;

      INSERT INTO inventory_movements (id, tenant_id, product_id, batch_id, branch_id, type, quantity, notes, performed_by_user_id, created_at)
      VALUES (gen_random_uuid(), p_tenant_id, v_item.product_id, v_batch.id, p_branch_id, 'SALIDA', v_deduct,
        'Factura ' || v_invoice_number, p_actor_user_id, now());

      v_remaining := v_remaining - v_deduct;
    END LOOP;

    IF v_remaining > 0 THEN
      RAISE EXCEPTION 'Existencia insuficiente para el producto (faltan % unidades).', v_remaining USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  UPDATE invoices SET subtotal = v_subtotal, tax = 0, total = v_subtotal, balance_due = v_subtotal, updated_at = now()
  WHERE id = v_invoice_id;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'INVOICE_CREATED', 'Invoice', v_invoice_id,
    jsonb_build_object('invoiceNumber', v_invoice_number, 'total', v_subtotal), now());

  RETURN v_invoice_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_list_invoices(
  p_tenant_id uuid,
  p_owner_id uuid,
  p_payment_status "InvoicePaymentStatus",
  p_limit int,
  p_offset int
)
RETURNS TABLE (
  invoice_id uuid,
  invoice_number text,
  owner_name text,
  payment_status "InvoicePaymentStatus",
  issue_date date,
  total numeric,
  balance_due numeric,
  total_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.invoice_number, o.full_name, i.payment_status, i.issue_date, i.total, i.balance_due,
    COUNT(*) OVER() AS total_count
  FROM invoices i
  JOIN owners o ON o.id = i.owner_id
  WHERE i.tenant_id = p_tenant_id
    AND (p_owner_id IS NULL OR i.owner_id = p_owner_id)
    AND (p_payment_status IS NULL OR i.payment_status = p_payment_status)
  ORDER BY i.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION sp_get_invoice(
  p_tenant_id uuid,
  p_invoice_id uuid
)
RETURNS TABLE (
  invoice_id uuid,
  invoice_number text,
  owner_id uuid,
  owner_name text,
  branch_name text,
  payment_status "InvoicePaymentStatus",
  issue_date date,
  subtotal numeric,
  tax numeric,
  total numeric,
  balance_due numeric,
  notes text,
  created_at timestamptz,
  items jsonb,
  payments jsonb,
  adjustments jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.invoice_number, i.owner_id, o.full_name, b.name, i.payment_status, i.issue_date,
    i.subtotal, i.tax, i.total, i.balance_due, i.notes, i.created_at::timestamptz,
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object(
          'itemId', ii.id, 'productId', ii.product_id, 'productName', p.name,
          'description', ii.description, 'quantity', ii.quantity, 'unitPrice', ii.unit_price, 'lineTotal', ii.line_total
        ))
       FROM invoice_items ii JOIN products p ON p.id = ii.product_id WHERE ii.invoice_id = i.id),
      '[]'::jsonb
    ),
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('paymentId', pay.id, 'amount', pay.amount, 'method', pay.method, 'notes', pay.notes, 'createdAt', pay.created_at) ORDER BY pay.created_at)
       FROM payments pay WHERE pay.invoice_id = i.id),
      '[]'::jsonb
    ),
    COALESCE(
      (SELECT jsonb_agg(jsonb_build_object('noteId', an.id, 'type', an.type, 'amount', an.amount, 'reason', an.reason, 'createdAt', an.created_at) ORDER BY an.created_at)
       FROM adjustment_notes an WHERE an.invoice_id = i.id),
      '[]'::jsonb
    )
  FROM invoices i
  JOIN owners o ON o.id = i.owner_id
  JOIN branches b ON b.id = i.branch_id
  WHERE i.id = p_invoice_id AND i.tenant_id = p_tenant_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_create_adjustment_note(
  p_tenant_id uuid,
  p_invoice_id uuid,
  p_type "AdjustmentType",
  p_amount numeric,
  p_reason text,
  p_actor_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_note_id uuid := gen_random_uuid();
  v_invoice invoices%ROWTYPE;
  v_new_balance numeric;
  v_new_status "InvoicePaymentStatus";
BEGIN
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id AND tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Factura no encontrada.' USING ERRCODE = 'P0002';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a cero.' USING ERRCODE = 'P0001';
  END IF;

  IF p_type = 'CREDITO' THEN
    v_new_balance := GREATEST(v_invoice.balance_due - p_amount, 0);
  ELSE
    v_new_balance := v_invoice.balance_due + p_amount;
  END IF;

  v_new_status := CASE
    WHEN v_new_balance <= 0 THEN 'PAGADA'
    WHEN v_new_balance < v_invoice.total THEN 'PARCIAL'
    ELSE 'PENDIENTE'
  END;

  UPDATE invoices SET balance_due = v_new_balance, payment_status = v_new_status, updated_at = now()
  WHERE id = p_invoice_id;

  INSERT INTO adjustment_notes (id, tenant_id, invoice_id, type, amount, reason, created_by_user_id, created_at)
  VALUES (v_note_id, p_tenant_id, p_invoice_id, p_type, p_amount, p_reason, p_actor_user_id, now());

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'ADJUSTMENT_NOTE_CREATED', 'AdjustmentNote', v_note_id,
    jsonb_build_object('invoiceId', p_invoice_id, 'type', p_type, 'amount', p_amount), now());

  RETURN v_note_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_register_payment(
  p_tenant_id uuid,
  p_invoice_id uuid,
  p_amount numeric,
  p_method text,
  p_notes text,
  p_actor_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_payment_id uuid := gen_random_uuid();
  v_invoice invoices%ROWTYPE;
  v_new_balance numeric;
  v_new_status "InvoicePaymentStatus";
BEGIN
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id AND tenant_id = p_tenant_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Factura no encontrada.' USING ERRCODE = 'P0002';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a cero.' USING ERRCODE = 'P0001';
  END IF;

  IF p_amount > v_invoice.balance_due THEN
    RAISE EXCEPTION 'El monto excede el saldo pendiente (saldo: %).', v_invoice.balance_due USING ERRCODE = 'P0001';
  END IF;

  v_new_balance := v_invoice.balance_due - p_amount;
  v_new_status := CASE WHEN v_new_balance <= 0 THEN 'PAGADA' ELSE 'PARCIAL' END;

  UPDATE invoices SET balance_due = v_new_balance, payment_status = v_new_status, updated_at = now()
  WHERE id = p_invoice_id;

  INSERT INTO payments (id, tenant_id, invoice_id, amount, method, notes, created_by_user_id, created_at)
  VALUES (v_payment_id, p_tenant_id, p_invoice_id, p_amount, p_method, p_notes, p_actor_user_id, now());

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), p_tenant_id, p_actor_user_id, 'PAYMENT_REGISTERED', 'Payment', v_payment_id,
    jsonb_build_object('invoiceId', p_invoice_id, 'amount', p_amount), now());

  RETURN v_payment_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_get_account_statement(
  p_tenant_id uuid,
  p_owner_id uuid
)
RETURNS TABLE (
  invoice_id uuid,
  invoice_number text,
  issue_date date,
  total numeric,
  balance_due numeric,
  payment_status "InvoicePaymentStatus",
  total_pending numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.invoice_number, i.issue_date, i.total, i.balance_due, i.payment_status,
    SUM(i.balance_due) OVER() AS total_pending
  FROM invoices i
  WHERE i.tenant_id = p_tenant_id AND i.owner_id = p_owner_id AND i.balance_due > 0
  ORDER BY i.issue_date ASC;
END;
$$;
