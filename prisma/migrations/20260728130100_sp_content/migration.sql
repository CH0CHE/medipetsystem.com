-- Stored procedures: Portal Público — contenido del sitio (planes de
-- marketing, blog, FAQ) y captación de leads. Todas sin p_tenant_id: este
-- contenido es propiedad de MediPet, no de una clínica. 'P0002' = no
-- encontrado → 404, 'P0001' = conflicto de negocio → 409. sp_create_lead es
-- la única que puede auditar con user_id NULL (el visitante no está
-- autenticado — audit_logs.user_id ya es nullable desde Fase 1).

CREATE OR REPLACE FUNCTION sp_list_marketing_plans()
RETURNS TABLE (
  id uuid,
  plan_key "TenantPlan",
  name text,
  price numeric,
  billing_period text,
  description text,
  features text[],
  highlighted boolean,
  display_order int,
  updated_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.plan_key, p.name, p.price, p.billing_period, p.description, p.features,
    p.highlighted, p.display_order, p.updated_at::timestamptz
  FROM marketing_plans p
  ORDER BY p.display_order ASC;
END;
$$;

CREATE OR REPLACE FUNCTION sp_update_marketing_plan(
  p_id uuid,
  p_name text,
  p_price numeric,
  p_billing_period text,
  p_description text,
  p_features text[],
  p_highlighted boolean,
  p_actor_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM marketing_plans WHERE id = p_id) THEN
    RAISE EXCEPTION 'Plan de precios no encontrado.' USING ERRCODE = 'P0002';
  END IF;

  UPDATE marketing_plans SET
    name = p_name, price = p_price, billing_period = p_billing_period, description = p_description,
    features = p_features, highlighted = p_highlighted, updated_at = now()
  WHERE id = p_id;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), NULL, p_actor_user_id, 'MARKETING_PLAN_UPDATED', 'MarketingPlan', p_id,
    jsonb_build_object('name', p_name), now());
END;
$$;

CREATE OR REPLACE FUNCTION sp_list_blog_posts(
  p_status "BlogPostStatus",
  p_limit int,
  p_offset int
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  excerpt text,
  cover_image_url text,
  status "BlogPostStatus",
  author_name text,
  published_at timestamptz,
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.title, b.slug, b.excerpt, b.cover_image_url, b.status, b.author_name,
    b.published_at::timestamptz, b.created_at::timestamptz,
    COUNT(*) OVER() AS total_count
  FROM blog_posts b
  WHERE p_status IS NULL OR b.status = p_status
  ORDER BY b.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION sp_list_published_blog_posts(
  p_limit int,
  p_offset int
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  excerpt text,
  cover_image_url text,
  author_name text,
  published_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.title, b.slug, b.excerpt, b.cover_image_url, b.author_name,
    b.published_at::timestamptz,
    COUNT(*) OVER() AS total_count
  FROM blog_posts b
  WHERE b.status = 'PUBLISHED' AND b.published_at <= now()
  ORDER BY b.published_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION sp_get_blog_post(
  p_id uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  excerpt text,
  content text,
  cover_image_url text,
  status "BlogPostStatus",
  author_name text,
  published_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.title, b.slug, b.excerpt, b.content, b.cover_image_url, b.status, b.author_name,
    b.published_at::timestamptz, b.created_at::timestamptz, b.updated_at::timestamptz
  FROM blog_posts b
  WHERE b.id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_get_published_blog_post_by_slug(
  p_slug text
)
RETURNS TABLE (
  id uuid,
  title text,
  slug text,
  excerpt text,
  content text,
  cover_image_url text,
  author_name text,
  published_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.title, b.slug, b.excerpt, b.content, b.cover_image_url, b.author_name,
    b.published_at::timestamptz
  FROM blog_posts b
  WHERE b.slug = p_slug AND b.status = 'PUBLISHED' AND b.published_at <= now();
END;
$$;

CREATE OR REPLACE FUNCTION sp_create_blog_post(
  p_title text,
  p_slug text,
  p_excerpt text,
  p_content text,
  p_cover_image_url text,
  p_status "BlogPostStatus",
  p_author_name text,
  p_actor_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
  v_published_at timestamptz;
BEGIN
  IF EXISTS(SELECT 1 FROM blog_posts WHERE slug = p_slug) THEN
    RAISE EXCEPTION 'Ya existe un post con ese slug.' USING ERRCODE = 'P0001';
  END IF;

  v_published_at := CASE WHEN p_status = 'PUBLISHED' THEN now() ELSE NULL END;

  INSERT INTO blog_posts (
    id, title, slug, excerpt, content, cover_image_url, status, author_name, published_at,
    created_by_user_id, created_at, updated_at
  ) VALUES (
    v_id, p_title, p_slug, p_excerpt, p_content, p_cover_image_url, p_status, p_author_name, v_published_at,
    p_actor_user_id, now(), now()
  );

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), NULL, p_actor_user_id, 'BLOG_POST_CREATED', 'BlogPost', v_id,
    jsonb_build_object('title', p_title, 'slug', p_slug), now());

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_update_blog_post(
  p_id uuid,
  p_title text,
  p_slug text,
  p_excerpt text,
  p_content text,
  p_cover_image_url text,
  p_status "BlogPostStatus",
  p_author_name text,
  p_actor_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_post blog_posts%ROWTYPE;
  v_published_at timestamptz;
BEGIN
  SELECT * INTO v_post FROM blog_posts WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post no encontrado.' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS(SELECT 1 FROM blog_posts WHERE slug = p_slug AND id != p_id) THEN
    RAISE EXCEPTION 'Ya existe otro post con ese slug.' USING ERRCODE = 'P0001';
  END IF;

  v_published_at := CASE
    WHEN p_status = 'PUBLISHED' AND v_post.published_at IS NULL THEN now()
    ELSE v_post.published_at
  END;

  UPDATE blog_posts SET
    title = p_title, slug = p_slug, excerpt = p_excerpt, content = p_content,
    cover_image_url = p_cover_image_url, status = p_status, author_name = p_author_name,
    published_at = v_published_at, updated_at = now()
  WHERE id = p_id;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), NULL, p_actor_user_id, 'BLOG_POST_UPDATED', 'BlogPost', p_id,
    jsonb_build_object('title', p_title, 'status', p_status), now());
END;
$$;

CREATE OR REPLACE FUNCTION sp_delete_blog_post(
  p_id uuid,
  p_actor_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM blog_posts WHERE id = p_id) THEN
    RAISE EXCEPTION 'Post no encontrado.' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM blog_posts WHERE id = p_id;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), NULL, p_actor_user_id, 'BLOG_POST_DELETED', 'BlogPost', p_id, '{}'::jsonb, now());
END;
$$;

CREATE OR REPLACE FUNCTION sp_list_faqs(
  p_published_only boolean
)
RETURNS TABLE (
  id uuid,
  question text,
  answer text,
  display_order int,
  is_published boolean,
  updated_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT f.id, f.question, f.answer, f.display_order, f.is_published, f.updated_at::timestamptz
  FROM faq_items f
  WHERE NOT p_published_only OR f.is_published
  ORDER BY f.display_order ASC;
END;
$$;

CREATE OR REPLACE FUNCTION sp_create_faq(
  p_question text,
  p_answer text,
  p_display_order int,
  p_is_published boolean,
  p_actor_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO faq_items (id, question, answer, display_order, is_published, updated_at)
  VALUES (v_id, p_question, p_answer, p_display_order, p_is_published, now());

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), NULL, p_actor_user_id, 'FAQ_CREATED', 'FaqItem', v_id,
    jsonb_build_object('question', p_question), now());

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_update_faq(
  p_id uuid,
  p_question text,
  p_answer text,
  p_display_order int,
  p_is_published boolean,
  p_actor_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM faq_items WHERE id = p_id) THEN
    RAISE EXCEPTION 'Pregunta frecuente no encontrada.' USING ERRCODE = 'P0002';
  END IF;

  UPDATE faq_items SET
    question = p_question, answer = p_answer, display_order = p_display_order,
    is_published = p_is_published, updated_at = now()
  WHERE id = p_id;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), NULL, p_actor_user_id, 'FAQ_UPDATED', 'FaqItem', p_id,
    jsonb_build_object('question', p_question), now());
END;
$$;

CREATE OR REPLACE FUNCTION sp_delete_faq(
  p_id uuid,
  p_actor_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM faq_items WHERE id = p_id) THEN
    RAISE EXCEPTION 'Pregunta frecuente no encontrada.' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM faq_items WHERE id = p_id;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), NULL, p_actor_user_id, 'FAQ_DELETED', 'FaqItem', p_id, '{}'::jsonb, now());
END;
$$;

CREATE OR REPLACE FUNCTION sp_create_lead(
  p_full_name text,
  p_email text,
  p_phone text,
  p_clinic_name text,
  p_message text,
  p_source "LeadSource"
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO leads (id, full_name, email, phone, clinic_name, message, source, status, created_at)
  VALUES (v_id, p_full_name, p_email, p_phone, p_clinic_name, p_message, p_source, 'NUEVO', now());

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), NULL, NULL, 'LEAD_CREATED', 'Lead', v_id,
    jsonb_build_object('email', p_email, 'source', p_source), now());

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION sp_list_leads(
  p_status "LeadStatus",
  p_source "LeadSource",
  p_limit int,
  p_offset int
)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  phone text,
  clinic_name text,
  message text,
  source "LeadSource",
  status "LeadStatus",
  created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT l.id, l.full_name, l.email, l.phone, l.clinic_name, l.message, l.source, l.status,
    l.created_at::timestamptz,
    COUNT(*) OVER() AS total_count
  FROM leads l
  WHERE (p_status IS NULL OR l.status = p_status)
    AND (p_source IS NULL OR l.source = p_source)
  ORDER BY l.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION sp_update_lead_status(
  p_id uuid,
  p_status "LeadStatus",
  p_actor_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM leads WHERE id = p_id) THEN
    RAISE EXCEPTION 'Lead no encontrado.' USING ERRCODE = 'P0002';
  END IF;

  UPDATE leads SET status = p_status WHERE id = p_id;

  INSERT INTO audit_logs (id, tenant_id, user_id, action, entity_type, entity_id, metadata, created_at)
  VALUES (gen_random_uuid(), NULL, p_actor_user_id, 'LEAD_STATUS_UPDATED', 'Lead', p_id,
    jsonb_build_object('status', p_status), now());
END;
$$;
