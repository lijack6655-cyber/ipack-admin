-- Rollback regression check for article-workflow.sql.
-- Run in a transaction with service_role; all test rows and revisions are rolled back.
BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '30s';
DO $$
DECLARE
  actor uuid;
  test_article_id uuid := gen_random_uuid();
  incomplete_article_id uuid := gen_random_uuid();
  test_legacy_id uuid := gen_random_uuid();
  test_slug text := 'cms-regression-' || replace(test_article_id::text, '-', '');
  incomplete_slug text := 'cms-regression-incomplete-' || replace(incomplete_article_id::text, '-', '');
  legacy_slug text := 'legacy-cms-regression-' || replace(test_legacy_id::text, '-', '');
  result jsonb;
  live_title text;
  draft_title text;
  payload jsonb := jsonb_build_object(
    'title','CMS regression article', 'slug',test_slug, 'category','Exhibition',
    'author_name','I-Pack Team', 'excerpt','Regression summary', 'content_markdown','## Summary\n\nSafe content',
    'content_html','<h2>Summary</h2><p>Safe content</p>', 'seo_title','CMS regression article',
    'seo_description','Regression description', 'featured_image_path','/assets/images/test.jpg'
  );
BEGIN
  SELECT id INTO actor FROM public.profiles WHERE role::text = 'super_admin' AND is_active LIMIT 1;
  IF actor IS NULL THEN RAISE EXCEPTION 'No active super_admin available for regression check'; END IF;
  IF has_function_privilege('anon', 'public.save_article_workflow(uuid,uuid,bigint,text,jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon must not execute save_article_workflow';
  END IF;
  IF has_table_privilege('authenticated', 'public.articles', 'INSERT')
    OR has_table_privilege('authenticated', 'public.articles', 'UPDATE')
    OR has_table_privilege('authenticated', 'public.articles', 'DELETE') THEN
    RAISE EXCEPTION 'authenticated must not directly mutate articles';
  END IF;
  BEGIN
    PERFORM public.save_article_workflow(actor, test_article_id, NULL, NULL, payload);
    RAISE EXCEPTION 'null operation/revision was accepted';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'Invalid operation' THEN RAISE; END IF;
  END;
  BEGIN
    SELECT public.save_article_workflow(actor, incomplete_article_id, 0, 'save', payload || jsonb_build_object('slug',incomplete_slug,'excerpt','')) INTO result;
    IF result->>'status' <> 'draft' OR (result->>'revision')::bigint <> 1 THEN RAISE EXCEPTION 'empty excerpt draft save assertion failed: %', result; END IF;
    PERFORM public.save_article_workflow(actor, incomplete_article_id, 1, 'publish', NULL);
    RAISE EXCEPTION 'incomplete draft was published';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'Invalid article draft' THEN RAISE; END IF;
  END;

  SELECT public.save_article_workflow(actor, test_article_id, 0, 'save', payload) INTO result;
  IF result->>'status' <> 'draft' OR (result->>'revision')::bigint <> 1 THEN RAISE EXCEPTION 'initial save assertion failed: %', result; END IF;
  SELECT public.save_article_workflow(actor, test_article_id, 1, 'save', payload || jsonb_build_object('title','Draft revision two')) INTO result;
  IF (result->>'revision')::bigint <> 2 THEN RAISE EXCEPTION 'draft revision assertion failed: %', result; END IF;
  SELECT public.save_article_workflow(actor, test_article_id, 2, 'publish', NULL) INTO result;
  IF result->>'status' <> 'published' OR (result->>'revision')::bigint <> 3 THEN RAISE EXCEPTION 'publish assertion failed: %', result; END IF;
  SELECT title INTO live_title FROM public.articles WHERE id = test_article_id;

  SELECT public.save_article_workflow(actor, test_article_id, 3, 'save', payload || jsonb_build_object('title','Unpublished live edit')) INTO result;
  SELECT title INTO live_title FROM public.articles WHERE id = test_article_id;
  SELECT ad.data->>'title' INTO draft_title FROM public.article_drafts AS ad WHERE ad.article_id = test_article_id;
  IF live_title <> 'Draft revision two' OR draft_title <> 'Unpublished live edit' THEN RAISE EXCEPTION 'published live/draft isolation assertion failed'; END IF;

  BEGIN
    PERFORM public.save_article_workflow(actor, test_article_id, 3, 'save', payload);
    RAISE EXCEPTION 'revision conflict was not raised';
  EXCEPTION WHEN SQLSTATE '40001' THEN NULL;
  END;

  INSERT INTO public.articles(id,title,slug,status,source_type,verification_status,created_by,updated_by)
  VALUES (test_legacy_id,'Legacy article',legacy_slug,'draft','front_blog_html','imported_unverified',actor,actor);
  BEGIN
    PERFORM public.save_article_workflow(actor, test_legacy_id, 0, 'save', payload || jsonb_build_object('slug',legacy_slug));
    RAISE EXCEPTION 'legacy article was writable';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'Legacy static article is read-only' THEN RAISE; END IF;
  END;
  RAISE NOTICE 'article workflow regression checks passed';
END;
$$;
ROLLBACK;
