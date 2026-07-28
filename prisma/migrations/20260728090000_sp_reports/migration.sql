-- Stored procedures: Reportes (Ventas, Inventario, Clientes morosos, Consultas
-- realizadas, Rentabilidad, Veterinarios más activos). Todas de solo lectura
-- (SELECT puro) — no escriben audit_logs porque no son "acción crítica" según
-- la sección de Auditoría del spec (no eliminan, no facturan, no modifican
-- expedientes). "Productos por vencer" reutiliza sp_list_expiring_batches de
-- Fase 4, no tiene SP propia aquí.

CREATE OR REPLACE FUNCTION sp_report_sales(
  p_tenant_id uuid,
  p_from date,
  p_to date
)
RETURNS TABLE (
  invoice_number text,
  owner_name text,
  issue_date date,
  total numeric,
  total_sales numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT i.invoice_number, o.full_name, i.issue_date, i.total,
    SUM(i.total) OVER() AS total_sales
  FROM invoices i
  JOIN owners o ON o.id = i.owner_id
  WHERE i.tenant_id = p_tenant_id
    AND i.status = 'EMITIDA'
    AND i.issue_date BETWEEN p_from AND p_to
  ORDER BY i.issue_date DESC;
END;
$$;

CREATE OR REPLACE FUNCTION sp_report_inventory(
  p_tenant_id uuid
)
RETURNS TABLE (
  sku text,
  name text,
  total_stock numeric,
  cost_price numeric,
  sale_price numeric,
  stock_value numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT pr.sku, pr.name, COALESCE(SUM(b.quantity), 0)::numeric AS total_stock,
    pr.cost_price, pr.sale_price, COALESCE(SUM(b.quantity), 0) * pr.cost_price AS stock_value
  FROM products pr
  LEFT JOIN product_batches b ON b.product_id = pr.id
  WHERE pr.tenant_id = p_tenant_id
  GROUP BY pr.id, pr.sku, pr.name, pr.cost_price, pr.sale_price
  ORDER BY pr.name ASC;
END;
$$;

CREATE OR REPLACE FUNCTION sp_report_overdue_clients(
  p_tenant_id uuid
)
RETURNS TABLE (
  owner_name text,
  phone text,
  invoice_count bigint,
  total_pending numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT o.full_name, o.phone, COUNT(i.id), SUM(i.balance_due)
  FROM owners o
  JOIN invoices i ON i.owner_id = o.id AND i.balance_due > 0
  WHERE o.tenant_id = p_tenant_id
  GROUP BY o.id, o.full_name, o.phone
  ORDER BY SUM(i.balance_due) DESC;
END;
$$;

CREATE OR REPLACE FUNCTION sp_report_consultations(
  p_tenant_id uuid,
  p_from date,
  p_to date
)
RETURNS TABLE (
  entry_date date,
  pet_name text,
  owner_name text,
  veterinarian_name text,
  diagnosis text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT m.entry_date, p.name, o.full_name, u.username, m.diagnosis
  FROM medical_record_entries m
  JOIN pets p ON p.id = m.pet_id
  JOIN owners o ON o.id = p.owner_id
  JOIN users u ON u.id = m.veterinarian_id
  WHERE m.tenant_id = p_tenant_id
    AND m.type = 'CONSULTA'
    AND m.entry_date BETWEEN p_from AND p_to
  ORDER BY m.entry_date DESC;
END;
$$;

CREATE OR REPLACE FUNCTION sp_report_profitability(
  p_tenant_id uuid,
  p_from date,
  p_to date
)
RETURNS TABLE (
  product_name text,
  quantity_sold numeric,
  revenue numeric,
  cost numeric,
  profit numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT pr.name, SUM(ii.quantity)::numeric AS quantity_sold, SUM(ii.line_total) AS revenue,
    SUM(ii.quantity * pr.cost_price) AS cost,
    SUM(ii.line_total) - SUM(ii.quantity * pr.cost_price) AS profit
  FROM invoice_items ii
  JOIN invoices i ON i.id = ii.invoice_id
  JOIN products pr ON pr.id = ii.product_id
  WHERE i.tenant_id = p_tenant_id
    AND i.status = 'EMITIDA'
    AND i.issue_date BETWEEN p_from AND p_to
  GROUP BY pr.id, pr.name
  ORDER BY profit DESC;
END;
$$;

CREATE OR REPLACE FUNCTION sp_report_active_veterinarians(
  p_tenant_id uuid,
  p_from date,
  p_to date
)
RETURNS TABLE (
  veterinarian_name text,
  entry_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT u.username, COUNT(m.id)
  FROM medical_record_entries m
  JOIN users u ON u.id = m.veterinarian_id
  WHERE m.tenant_id = p_tenant_id
    AND m.entry_date BETWEEN p_from AND p_to
  GROUP BY u.id, u.username
  ORDER BY COUNT(m.id) DESC;
END;
$$;
