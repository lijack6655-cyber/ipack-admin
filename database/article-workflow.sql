-- Article CMS workflow. Apply after the existing articles table and access policies.
-- This migration is intentionally service-role only; the application validates and
-- renders Markdown before passing the safe HTML snapshot to this RPC.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS revision bigint NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.article_drafts (
  article_id uuid PRIMARY KEY REFERENCES public.articles(id) ON DELETE CASCADE,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  updated_by uuid NOT NULL REFERENCES public.profiles(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.article_drafts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.article_drafts FROM anon, authenticated;
GRANT ALL ON public.article_drafts TO service_role;
REVOKE INSERT, UPDATE, DELETE ON public.articles FROM authenticated;

CREATE OR REPLACE FUNCTION public.save_article_workflow(
  actor uuid, article_id uuid, expected_revision bigint, operation text, payload jsonb DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  current_article public.articles;
  draft jsonb;
  next_article public.articles;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = actor AND is_active AND role::text IN ('super_admin','operator','editor','sales')
  ) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  IF operation IS NULL OR operation NOT IN ('save','publish') OR expected_revision IS NULL OR expected_revision < 0 THEN
    RAISE EXCEPTION 'Invalid operation';
  END IF;
  IF payload IS NOT NULL AND (jsonb_typeof(payload) <> 'object' OR coalesce(length(trim(payload->>'title')), 0) NOT BETWEEN 1 AND 240
    OR coalesce(length(trim(payload->>'slug')), 0) NOT BETWEEN 1 AND 240
    OR coalesce(payload->>'slug', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    OR coalesce(length(trim(payload->>'excerpt')), 0) NOT BETWEEN 0 AND 500
    OR coalesce(length(trim(payload->>'content_markdown')), 0) NOT BETWEEN 1 AND 100000
    OR (nullif(payload->>'featured_image_path', '') IS NOT NULL AND NOT (
      (payload->>'featured_image_path') LIKE '/assets/%' AND (payload->>'featured_image_path') NOT LIKE '%..%'
      OR (payload->>'featured_image_path') ~ '^https://'
    ))) THEN
    RAISE EXCEPTION 'Invalid article draft';
  END IF;

  SELECT * INTO current_article FROM public.articles AS a
    WHERE a.id = save_article_workflow.article_id FOR UPDATE;
  IF NOT FOUND THEN
    IF operation <> 'save' OR expected_revision <> 0 OR payload IS NULL THEN
      RAISE EXCEPTION 'Article not found' USING ERRCODE = 'P0002';
    END IF;
    INSERT INTO public.articles(
      id,title,slug,excerpt,content_html,content_markdown,category,author_name,
      featured_image_path,seo_title,seo_description,status,source_type,verification_status,
      page_path,published_at,created_by,updated_by
    ) VALUES (
      article_id,payload->>'title',payload->>'slug',nullif(payload->>'excerpt',''),
      nullif(payload->>'content_html',''),payload->>'content_markdown',nullif(payload->>'category',''),
      nullif(payload->>'author_name',''),nullif(payload->>'featured_image_path',''),
      nullif(payload->>'seo_title',''),nullif(payload->>'seo_description',''),
      'draft','admin_created','imported_unverified',NULL,NULL,actor,actor
    ) RETURNING * INTO current_article;
  END IF;
  IF current_article.revision <> expected_revision THEN
    RAISE EXCEPTION 'Revision conflict' USING ERRCODE = '40001';
  END IF;
  IF current_article.source_type = 'front_blog_html' THEN
    RAISE EXCEPTION 'Legacy static article is read-only';
  END IF;
  IF current_article.status = 'published' AND payload IS NOT NULL AND payload->>'slug' <> current_article.slug THEN
    RAISE EXCEPTION 'Published article slug cannot change';
  END IF;

  IF operation = 'save' THEN
    IF payload IS NULL THEN RAISE EXCEPTION 'Missing article draft'; END IF;
    INSERT INTO public.article_drafts(article_id,data,updated_by)
    VALUES (article_id,payload,actor)
    ON CONFLICT ON CONSTRAINT article_drafts_pkey DO UPDATE SET data = excluded.data, updated_by = actor, updated_at = now();
    UPDATE public.articles SET
      revision = revision + 1,
      updated_by = actor,
      title = CASE WHEN status = 'draft' THEN payload->>'title' ELSE title END,
      slug = CASE WHEN status = 'draft' THEN payload->>'slug' ELSE slug END
    WHERE public.articles.id = save_article_workflow.article_id RETURNING * INTO next_article;
  ELSE
    SELECT data INTO draft FROM public.article_drafts WHERE article_drafts.article_id = save_article_workflow.article_id;
    IF draft IS NULL THEN RAISE EXCEPTION 'Article draft not found'; END IF;
    IF jsonb_typeof(draft) <> 'object'
      OR coalesce(length(trim(draft->>'title')), 0) NOT BETWEEN 1 AND 240
      OR coalesce(length(trim(draft->>'slug')), 0) NOT BETWEEN 1 AND 240
      OR coalesce(draft->>'slug', '') !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
      OR coalesce(length(trim(draft->>'excerpt')), 0) NOT BETWEEN 1 AND 500
      OR coalesce(length(trim(draft->>'content_markdown')), 0) NOT BETWEEN 1 AND 100000
      OR (nullif(draft->>'featured_image_path', '') IS NOT NULL AND NOT (
        (draft->>'featured_image_path') LIKE '/assets/%' AND (draft->>'featured_image_path') NOT LIKE '%..%'
        OR (draft->>'featured_image_path') ~ '^https://'
      ))
    THEN
      RAISE EXCEPTION 'Invalid article draft';
    END IF;
    UPDATE public.articles SET
      title = draft->>'title', slug = draft->>'slug', excerpt = nullif(draft->>'excerpt',''),
      content_html = nullif(draft->>'content_html',''), content_markdown = draft->>'content_markdown',
      category = nullif(draft->>'category',''), author_name = nullif(draft->>'author_name',''),
      featured_image_path = nullif(draft->>'featured_image_path',''), seo_title = nullif(draft->>'seo_title',''),
      seo_description = nullif(draft->>'seo_description',''), status = 'published',
      source_type = CASE WHEN source_type IN ('admin_created','cms') THEN source_type ELSE 'cms' END,
      verification_status = 'verified', page_path = '/news/' || (draft->>'slug'),
      published_at = now(), revision = revision + 1, updated_by = actor
    WHERE public.articles.id = save_article_workflow.article_id RETURNING * INTO next_article;
    DELETE FROM public.article_drafts WHERE article_drafts.article_id = save_article_workflow.article_id;
  END IF;

  INSERT INTO public.audit_logs(user_id,action,resource_type,resource_id,old_value,new_value)
  VALUES (
    actor,'article_' || operation,'ARTICLE',article_id::text,
    jsonb_build_object('revision',current_article.revision,'status',current_article.status),
    jsonb_build_object('revision',next_article.revision,'status',next_article.status,'slug',next_article.slug)
  );
  RETURN jsonb_build_object('id',next_article.id,'revision',next_article.revision,'status',next_article.status,'slug',next_article.slug);
END;
$$;

REVOKE ALL ON FUNCTION public.save_article_workflow(uuid,uuid,bigint,text,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_article_workflow(uuid,uuid,bigint,text,jsonb) TO service_role;
COMMIT;
