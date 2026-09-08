-- Product workflow, additive schema. Apply after lightweight-access.sql.
BEGIN;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS revision bigint NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cms_content jsonb;
CREATE TABLE IF NOT EXISTS public.product_drafts (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  updated_by uuid NOT NULL REFERENCES public.profiles(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.product_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) <= 180),
  storage_path text NOT NULL UNIQUE,
  width integer NOT NULL, height integer NOT NULL, bytes integer NOT NULL,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_media ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.product_drafts, public.product_media FROM anon, authenticated;
GRANT ALL ON public.product_drafts, public.product_media TO service_role;
-- All product mutations go through the authenticated server and one transaction.
REVOKE INSERT, UPDATE, DELETE ON public.products FROM authenticated;

CREATE OR REPLACE FUNCTION public.save_product_workflow(
  actor uuid, product_id uuid, expected_revision bigint, operation text, payload jsonb DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE current_product public.products; draft jsonb; cat public.categories; next_product public.products;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = actor AND is_active AND role::text IN ('super_admin','operator','product_manager','sales')) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  IF operation NOT IN ('save','publish','archive') OR expected_revision < 0 THEN RAISE EXCEPTION 'Invalid operation'; END IF;
  SELECT * INTO current_product FROM public.products WHERE id = product_id FOR UPDATE;
  IF NOT FOUND THEN
    IF operation <> 'save' OR expected_revision <> 0 THEN RAISE EXCEPTION 'Product not found' USING ERRCODE = 'P0002'; END IF;
    INSERT INTO public.products(id,title,slug,status,source_type,created_by,updated_by)
    VALUES(product_id,payload->>'title',coalesce(nullif(trim(both '-' from left(regexp_replace(lower(payload->>'title'),'[^a-z0-9]+','-','g'),65)),''),'product') || '-' || product_id::text,'draft','admin_manual',actor,actor)
    RETURNING * INTO current_product;
  END IF;
  IF current_product.revision <> expected_revision THEN RAISE EXCEPTION 'Revision conflict' USING ERRCODE = '40001'; END IF;
  IF operation = 'save' THEN
    IF payload IS NULL OR jsonb_typeof(payload) <> 'object' OR length(trim(payload->>'title')) NOT BETWEEN 1 AND 240 THEN RAISE EXCEPTION 'Invalid draft'; END IF;
    INSERT INTO public.product_drafts(product_id,data,updated_by) VALUES(product_id,payload,actor)
      ON CONFLICT ON CONSTRAINT product_drafts_pkey DO UPDATE SET data = excluded.data, updated_by = actor, updated_at = now();
    UPDATE public.products SET revision = revision + 1, updated_by = actor,
      title = CASE WHEN status = 'draft' THEN payload->>'title' ELSE title END
      WHERE id = product_id RETURNING * INTO next_product;
  ELSIF operation = 'publish' THEN
    SELECT data INTO draft FROM public.product_drafts WHERE product_drafts.product_id = save_product_workflow.product_id;
    IF draft IS NULL OR coalesce(trim(draft->>'verification_note'),'') = '' OR coalesce(trim(draft->>'sku'),'') = '' OR coalesce(trim(draft->>'description'),'') = '' OR coalesce(jsonb_array_length(draft->'images'),0) < 1 THEN RAISE EXCEPTION 'Incomplete publication'; END IF;
    SELECT * INTO cat FROM public.categories WHERE id = (draft->>'category_id')::uuid AND status = 'published';
    IF NOT FOUND THEN RAISE EXCEPTION 'Category unavailable'; END IF;
    UPDATE public.products SET title = draft->>'title', display_title = draft->>'title', sku = draft->>'sku',
      category_id = cat.id, category_name = cat.name, make = nullif(draft->>'make',''), model = nullif(draft->>'model',''), years = nullif(draft->>'years',''),
      oe_numbers = ARRAY(SELECT jsonb_array_elements_text(draft->'oe_numbers')),
      description = draft->>'description', specifications = draft->'specifications',
      price_text = nullif(draft->>'price_text',''), moq_text = nullif(draft->>'moq_text',''), featured = (draft->>'featured')::boolean,
      image_path = draft->'images'->0->>'path', hover_image_path = draft->'images'->1->>'path',
      gallery_paths = ARRAY(SELECT item->>'path' FROM jsonb_array_elements(draft->'images') WITH ORDINALITY AS img(item,n) WHERE n > 1 ORDER BY n),
      cms_content = jsonb_build_object('short_description',draft->>'short_description','seo_title',draft->>'seo_title','seo_description',draft->>'seo_description','images',draft->'images'),
      status = 'published', verification_status = 'verified', page_path = '/products/' || slug,
      search_text = concat_ws(' ',draft->>'title',draft->>'sku',draft->>'make',draft->>'model',draft->>'years',draft->>'oe_numbers'),
      revision = revision + 1, published_at = now(), updated_by = actor
      WHERE id = product_id RETURNING * INTO next_product;
    DELETE FROM public.product_drafts WHERE product_drafts.product_id = save_product_workflow.product_id;
  ELSE
    UPDATE public.products SET status = 'archived', revision = revision + 1, updated_by = actor WHERE id = product_id RETURNING * INTO next_product;
  END IF;
  INSERT INTO public.audit_logs(user_id,action,resource_type,resource_id,old_value,new_value)
    VALUES(actor,'product_' || operation,'PRODUCT',product_id::text,
      CASE WHEN operation = 'save' THEN jsonb_build_object('revision',current_product.revision) ELSE to_jsonb(current_product) END,
      jsonb_build_object('revision',next_product.revision,'status',next_product.status,'verification_note',CASE WHEN operation = 'publish' THEN draft->>'verification_note' ELSE NULL END));
  RETURN jsonb_build_object('id',next_product.id,'revision',next_product.revision,'status',next_product.status,'slug',next_product.slug);
END;
$$;
REVOKE ALL ON FUNCTION public.save_product_workflow(uuid,uuid,bigint,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_product_workflow(uuid,uuid,bigint,text,jsonb) TO service_role;
COMMIT;
-- Storage bucket provisioned separately; private and server-write only.
