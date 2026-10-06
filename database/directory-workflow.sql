-- Apply after product-library-actions.sql. No data reassignment is performed here.
BEGIN;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS parent_id uuid;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS revision bigint NOT NULL DEFAULT 0;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS aliases text[] NOT NULL DEFAULT '{}';
UPDATE public.categories SET aliases = ARRAY[name,slug] WHERE cardinality(aliases) = 0;
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_parent_id_fkey;
ALTER TABLE public.categories ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY(parent_id) REFERENCES public.categories(id) ON DELETE RESTRICT;
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE public.products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY(category_id) REFERENCES public.categories(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS categories_parent_id_idx ON public.categories(parent_id);
REVOKE INSERT, UPDATE, DELETE ON public.categories FROM anon, authenticated;
GRANT ALL ON public.categories TO service_role;

-- ponytail: one lock for this small catalog; split by tree only if write volume requires it.
-- Statement triggers take the lock BEFORE any row locks, including direct maintenance SQL.
CREATE OR REPLACE FUNCTION public.lock_product_directory() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(741004);
  RETURN NULL;
END;
$$;
CREATE OR REPLACE TRIGGER directory_categories_lock BEFORE INSERT OR UPDATE OR DELETE ON public.categories FOR EACH STATEMENT EXECUTE FUNCTION public.lock_product_directory();
CREATE OR REPLACE TRIGGER directory_products_lock BEFORE INSERT OR UPDATE OR DELETE ON public.products FOR EACH STATEMENT EXECUTE FUNCTION public.lock_product_directory();
CREATE OR REPLACE TRIGGER directory_drafts_lock BEFORE INSERT OR UPDATE OR DELETE ON public.product_drafts FOR EACH STATEMENT EXECUTE FUNCTION public.lock_product_directory();

-- Existing workflow reads FOR UPDATE before its first write: take the same lock at entry.
DO $$
DECLARE definition text;
BEGIN
  SELECT pg_catalog.pg_get_functiondef('public.save_product_workflow(uuid,uuid,bigint,text,jsonb)'::regprocedure) INTO definition;
  IF position('pg_advisory_xact_lock(741004)' IN definition) = 0 THEN
    definition := regexp_replace(definition, E'BEGIN\\s*', E'BEGIN\n  PERFORM pg_catalog.pg_advisory_xact_lock(741004);\n  IF operation IS NULL OR expected_revision IS NULL THEN RAISE EXCEPTION ''Invalid operation'' USING ERRCODE = ''23514''; END IF;\n');
    EXECUTE definition;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_product_directory() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE parent public.categories;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM public.categories WHERE parent_id = OLD.id)
      OR EXISTS (SELECT 1 FROM public.products WHERE category_id = OLD.id)
      OR EXISTS (SELECT 1 FROM public.product_drafts WHERE data->>'category_id' = OLD.id::text) THEN
      RAISE EXCEPTION 'Directory contains products, drafts or children' USING ERRCODE = '23503';
    END IF;
    RETURN OLD;
  END IF;
  IF length(trim(NEW.name)) NOT BETWEEN 1 AND 120 OR NEW.name <> trim(NEW.name)
    OR NEW.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR length(NEW.slug) > 120
    OR NEW.sort_order NOT BETWEEN 0 AND 9999 THEN RAISE EXCEPTION 'Invalid directory' USING ERRCODE = '23514'; END IF;
  IF TG_OP = 'UPDATE' THEN
    NEW.revision = OLD.revision + 1;
    IF NEW.slug <> OLD.slug THEN RAISE EXCEPTION 'Directory slug is immutable' USING ERRCODE = '23514'; END IF;
    NEW.aliases = ARRAY(SELECT DISTINCT unnest(OLD.aliases || ARRAY[OLD.name,OLD.slug,NEW.name,NEW.slug]));
  ELSE
    NEW.aliases = ARRAY[NEW.name,NEW.slug];
  END IF;
  IF EXISTS (SELECT 1 FROM public.categories c WHERE c.id <> NEW.id AND
    (lower(c.name) = lower(NEW.name) OR c.slug = NEW.slug OR
      EXISTS (SELECT 1 FROM unnest(c.aliases) a WHERE lower(a) IN (lower(NEW.name),lower(NEW.slug))))) THEN
    RAISE EXCEPTION 'Directory name or alias already used' USING ERRCODE = '23505';
  END IF;
  IF NEW.parent_id IS NOT NULL THEN
    SELECT * INTO parent FROM public.categories WHERE id = NEW.parent_id;
    IF NOT FOUND OR parent.parent_id IS NOT NULL OR NEW.parent_id = NEW.id
      OR EXISTS (SELECT 1 FROM public.categories WHERE parent_id = NEW.id) THEN
      RAISE EXCEPTION 'Only two directory levels are allowed' USING ERRCODE = '23514';
    END IF;
    IF NEW.status = 'published' AND parent.status <> 'published' THEN RAISE EXCEPTION 'Parent unavailable' USING ERRCODE = '23514'; END IF;
  END IF;
  IF (SELECT count(*) FROM public.categories WHERE parent_id IS NOT DISTINCT FROM NEW.parent_id AND id <> NEW.id) >= 20 THEN
    RAISE EXCEPTION 'Directory limit is 20 per level' USING ERRCODE = '23514';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status <> OLD.status AND
    (EXISTS (SELECT 1 FROM public.categories WHERE parent_id = NEW.id)
      OR EXISTS (SELECT 1 FROM public.products WHERE category_id = NEW.id)
      OR EXISTS (SELECT 1 FROM public.product_drafts WHERE data->>'category_id' = NEW.id::text)) THEN
    RAISE EXCEPTION 'Directory is in use' USING ERRCODE = '23503';
  END IF;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER directory_categories_guard BEFORE INSERT OR UPDATE OR DELETE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.guard_product_directory();

CREATE OR REPLACE FUNCTION public.sync_product_directory_name() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW.name <> OLD.name OR NEW.parent_id IS DISTINCT FROM OLD.parent_id THEN
    UPDATE public.products SET category_name = NEW.name, revision = revision + 1, updated_by = NEW.updated_by WHERE category_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER directory_categories_sync AFTER UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.sync_product_directory_name();

CREATE OR REPLACE FUNCTION public.guard_product_draft_category() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF coalesce(NEW.data->>'category_id','') <> '' AND NOT EXISTS
    (SELECT 1 FROM public.categories WHERE id::text = NEW.data->>'category_id' AND status = 'published') THEN
    RAISE EXCEPTION 'Draft directory unavailable' USING ERRCODE = '23503';
  END IF;
  RETURN NEW;
END;
$$;
CREATE OR REPLACE TRIGGER directory_draft_category_guard BEFORE INSERT OR UPDATE ON public.product_drafts FOR EACH ROW EXECUTE FUNCTION public.guard_product_draft_category();

CREATE OR REPLACE FUNCTION public.save_directory_workflow(actor uuid, operation text, payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE current_category public.categories; next_category public.categories; current_product public.products; item jsonb; target uuid; affected integer := 0;
BEGIN
  PERFORM pg_catalog.pg_advisory_xact_lock(741004);
  IF operation IS NULL OR payload IS NULL OR jsonb_typeof(payload) <> 'object' THEN RAISE EXCEPTION 'Invalid operation' USING ERRCODE = '23514'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = actor AND is_active AND role::text IN ('super_admin','operator','product_manager','sales')) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  IF operation IN ('save','delete') THEN
    IF payload->>'revision' IS NULL OR (payload->>'revision')::bigint < 0 THEN RAISE EXCEPTION 'Invalid revision' USING ERRCODE = '23514'; END IF;
    target = coalesce(nullif(payload->>'id','')::uuid,gen_random_uuid());
    SELECT * INTO current_category FROM public.categories WHERE id = target FOR UPDATE;
    IF NOT FOUND AND (operation = 'delete' OR coalesce((payload->>'revision')::bigint,-1) <> 0) THEN RAISE EXCEPTION 'Directory not found' USING ERRCODE = 'P0002'; END IF;
    IF current_category.id IS NOT NULL AND current_category.revision <> (payload->>'revision')::bigint THEN RAISE EXCEPTION 'Revision conflict' USING ERRCODE = '40001'; END IF;
    IF operation = 'delete' THEN
      DELETE FROM public.categories WHERE id = target;
    ELSE
      INSERT INTO public.categories(id,name,slug,parent_id,sort_order,description,status,verification_status,source_type,created_by,updated_by,revision)
      VALUES(target,payload->'data'->>'name',payload->'data'->>'slug',nullif(payload->'data'->>'parent_id','')::uuid,
        (payload->'data'->>'sort_order')::integer,nullif(payload->'data'->>'description',''),'published','verified','admin_manual',actor,actor,1)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, parent_id = excluded.parent_id, sort_order = excluded.sort_order,
        description = excluded.description, revision = categories.revision + 1, updated_by = actor
      RETURNING * INTO next_category;
    END IF;
    INSERT INTO public.audit_logs(user_id,action,resource_type,resource_id,old_value,new_value)
      VALUES(actor,'directory_' || operation,'CATEGORY',target::text,to_jsonb(current_category),to_jsonb(next_category));
    RETURN jsonb_build_object('id',target,'revision',next_category.revision);
  ELSIF operation = 'move' THEN
    target = (payload->>'category_id')::uuid;
    SELECT * INTO next_category FROM public.categories WHERE id = target AND status = 'published';
    IF NOT FOUND THEN RAISE EXCEPTION 'Directory unavailable' USING ERRCODE = '23503'; END IF;
    IF payload->'products' IS NULL OR jsonb_typeof(payload->'products') <> 'array' OR jsonb_array_length(payload->'products') NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Invalid product selection' USING ERRCODE = '23514'; END IF;
    IF (SELECT count(DISTINCT value->>'id') FROM jsonb_array_elements(payload->'products')) <> jsonb_array_length(payload->'products') THEN RAISE EXCEPTION 'Duplicate product selection' USING ERRCODE = '23514'; END IF;
    FOR item IN SELECT value FROM jsonb_array_elements(payload->'products') ORDER BY value->>'id' LOOP
      IF item->>'id' IS NULL OR item->>'revision' IS NULL OR (item->>'revision')::bigint < 0 THEN RAISE EXCEPTION 'Invalid product revision' USING ERRCODE = '23514'; END IF;
      SELECT * INTO current_product FROM public.products WHERE id = (item->>'id')::uuid FOR UPDATE;
      IF NOT FOUND THEN RAISE EXCEPTION 'Product not found' USING ERRCODE = 'P0002'; END IF;
      IF current_product.revision <> (item->>'revision')::bigint THEN RAISE EXCEPTION 'Revision conflict' USING ERRCODE = '40001'; END IF;
      UPDATE public.products SET category_id = target, category_name = next_category.name, revision = revision + 1, updated_by = actor,
        cms_content = CASE WHEN cms_content IS NOT NULL AND cms_content ? 'category_id' THEN jsonb_set(cms_content,'{category_id}',to_jsonb(target::text)) ELSE cms_content END
        WHERE id = current_product.id;
      -- Change ONLY category in pending drafts; do not publish unrelated draft changes.
      UPDATE public.product_drafts SET data = jsonb_set(data,'{category_id}',to_jsonb(target::text)),updated_by = actor,updated_at = now() WHERE product_id = current_product.id;
      INSERT INTO public.audit_logs(user_id,action,resource_type,resource_id,old_value,new_value)
        VALUES(actor,'directory_move','PRODUCT',current_product.id::text,jsonb_build_object('category_id',current_product.category_id,'revision',current_product.revision),jsonb_build_object('category_id',target,'revision',current_product.revision+1));
      affected := affected + 1;
    END LOOP;
    RETURN jsonb_build_object('moved',affected);
  END IF;
  RAISE EXCEPTION 'Invalid operation' USING ERRCODE = '23514';
END;
$$;
REVOKE ALL ON FUNCTION public.save_directory_workflow(uuid,text,jsonb), public.lock_product_directory(), public.guard_product_directory(), public.sync_product_directory_name(), public.guard_product_draft_category() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_directory_workflow(uuid,text,jsonb), public.lock_product_directory(), public.guard_product_directory(), public.sync_product_directory_name(), public.guard_product_draft_category() TO service_role;
COMMIT;
