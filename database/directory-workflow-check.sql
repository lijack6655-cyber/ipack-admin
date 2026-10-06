-- Run after directory-workflow.sql; all fixtures/changes roll back.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
DO $$
DECLARE actor uuid; root uuid; child uuid; other uuid; draft_only uuid; swap uuid; product uuid := gen_random_uuid(); product2 uuid := gen_random_uuid();
  suffix text := replace(gen_random_uuid()::text,'-',''); n integer; result jsonb; draft_before jsonb; product_before jsonb; current_revision bigint;
BEGIN
  -- Ensure the valid batch member is updated before the stale member fails.
  IF product > product2 THEN swap := product; product := product2; product2 := swap; END IF;
  SELECT id INTO actor FROM public.profiles WHERE is_active AND role::text = 'super_admin' LIMIT 1;
  IF actor IS NULL THEN RAISE EXCEPTION 'No active super_admin for directory regression'; END IF;
  IF has_function_privilege('anon','public.save_directory_workflow(uuid,text,jsonb)','EXECUTE')
    OR has_function_privilege('authenticated','public.save_directory_workflow(uuid,text,jsonb)','EXECUTE') THEN RAISE EXCEPTION 'Directory RPC exposed'; END IF;
  IF has_table_privilege('authenticated','public.categories','INSERT') OR has_table_privilege('authenticated','public.categories','UPDATE')
    OR has_table_privilege('authenticated','public.categories','DELETE') THEN RAISE EXCEPTION 'Direct category mutation exposed'; END IF;
  IF position('pg_advisory_xact_lock(741004)' IN pg_get_functiondef('public.save_product_workflow(uuid,uuid,bigint,text,jsonb)'::regprocedure)) = 0 THEN RAISE EXCEPTION 'Product workflow lock missing'; END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE oid IN ('public.save_directory_workflow(uuid,text,jsonb)'::regprocedure,'public.lock_product_directory()'::regprocedure) AND prosecdef) THEN RAISE EXCEPTION 'Unexpected security definer'; END IF;
  BEGIN
    PERFORM public.save_directory_workflow(gen_random_uuid(),'save','{}');
    RAISE EXCEPTION 'Unauthorized actor accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
    PERFORM public.save_product_workflow(actor,product,NULL,'save',jsonb_build_object('title','test'));
    RAISE EXCEPTION 'Null revision accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  -- Fill roots to20, then check21st blocked AND updating existing at20 succeeds.
  FOR n IN (SELECT count(*)+1 FROM public.categories WHERE parent_id IS NULL)..20 LOOP
    result := public.save_directory_workflow(actor,'save',jsonb_build_object('revision',0,'data',jsonb_build_object('name','Directory test root '||suffix||n,'slug','test-root-'||suffix||'-'||n,'parent_id',NULL,'sort_order',n,'description','')));
    IF root IS NULL THEN root := (result->>'id')::uuid; END IF;
  END LOOP;
  IF root IS NULL THEN RAISE EXCEPTION 'Test requires space for one root'; END IF;
  BEGIN
    PERFORM public.save_directory_workflow(actor,'save',jsonb_build_object('revision',0,'data',jsonb_build_object('name','Root limit '||suffix,'slug','limit-'||suffix,'parent_id',NULL,'sort_order',0,'description','')));
    RAISE EXCEPTION '21st root accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  SELECT to_jsonb(c) INTO result FROM public.categories c WHERE id=root;
  PERFORM public.save_directory_workflow(actor,'save',jsonb_build_object('id',root,'revision',result->'revision','data',result || jsonb_build_object('description','updated at limit')));
  FOR n IN 1..20 LOOP
    result := public.save_directory_workflow(actor,'save',jsonb_build_object('revision',0,'data',jsonb_build_object('name','Directory test child '||suffix||n,'slug','test-child-'||suffix||'-'||n,'parent_id',root,'sort_order',n,'description','')));
    IF n=1 THEN child := (result->>'id')::uuid; END IF;
    IF n=2 THEN other := (result->>'id')::uuid; END IF;
    IF n=3 THEN draft_only := (result->>'id')::uuid; END IF;
  END LOOP;
  BEGIN
    PERFORM public.save_directory_workflow(actor,'save',jsonb_build_object('revision',0,'data',jsonb_build_object('name','Child limit '||suffix,'slug','child-limit-'||suffix,'parent_id',root,'sort_order',0,'description','')));
    RAISE EXCEPTION '21st child accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    UPDATE public.categories SET parent_id=child WHERE id=other;
    RAISE EXCEPTION 'Third level accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    UPDATE public.categories SET parent_id=child WHERE id=root;
    RAISE EXCEPTION 'Cycle/reparent root with children accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  BEGIN
    UPDATE public.categories SET slug='mutated-'||suffix WHERE id=child;
    RAISE EXCEPTION 'Slug mutation accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
  -- Save a new draft, then simulate a live product plus pending content changes.
  PERFORM public.save_product_workflow(actor,product,0,'save',jsonb_build_object('title','Original live title','category_id',child));
  UPDATE public.products SET status='published',category_id=child,category_name=(SELECT name FROM public.categories WHERE id=child),page_path='/products/test-'||suffix,
    cms_content=jsonb_build_object('category_id',child,'short_description','Preserved content','seo_title','Preserved SEO') WHERE id=product;
  SELECT revision INTO current_revision FROM public.products WHERE id=product;
  PERFORM public.save_product_workflow(actor,product,current_revision,'save',jsonb_build_object('title','Unpublished changed title','category_id',other,'description','PRIVATE pending changes','verification_note','do not publish','sku','private-sku','extra',jsonb_build_object('preserve',true)));
  SELECT data INTO draft_before FROM public.product_drafts WHERE product_id=product;
  SELECT to_jsonb(p) INTO product_before FROM public.products p WHERE id=product;
  SELECT revision INTO current_revision FROM public.products WHERE id=product;
  PERFORM public.save_directory_workflow(actor,'move',jsonb_build_object('category_id',other,'products',jsonb_build_array(jsonb_build_object('id',product,'revision',current_revision))));
  IF (SELECT data-'category_id' FROM public.product_drafts WHERE product_id=product) IS DISTINCT FROM draft_before-'category_id' THEN RAISE EXCEPTION 'Unrelated draft fields changed'; END IF;
  IF (SELECT data->>'category_id' FROM public.product_drafts WHERE product_id=product) <> other::text THEN RAISE EXCEPTION 'Draft category not moved'; END IF;
  IF (SELECT to_jsonb(p)-ARRAY['category_id','category_name','revision','updated_by','updated_at','cms_content'] FROM public.products p WHERE id=product)
    IS DISTINCT FROM product_before-ARRAY['category_id','category_name','revision','updated_by','updated_at','cms_content'] THEN RAISE EXCEPTION 'Move changed product content/status/URL'; END IF;
  IF (SELECT cms_content-'category_id' FROM public.products WHERE id=product) IS DISTINCT FROM (product_before->'cms_content')-'category_id'
    OR (SELECT cms_content->>'category_id' FROM public.products WHERE id=product) <> other::text THEN RAISE EXCEPTION 'CMS category sync/content preservation failed'; END IF;
  IF (SELECT revision FROM public.products WHERE id=product) <> current_revision+1 THEN RAISE EXCEPTION 'Move revision missing'; END IF;
  BEGIN
    PERFORM public.save_directory_workflow(actor,'move',jsonb_build_object('category_id',child,'products',jsonb_build_array(jsonb_build_object('id',product,'revision',current_revision))));
    RAISE EXCEPTION 'Stale product revision accepted';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
  -- Rename updates current denormalized name, keeps stable slug/old alias and bumps revisions.
  SELECT to_jsonb(c) INTO result FROM public.categories c WHERE id=other;
  SELECT revision INTO current_revision FROM public.products WHERE id=product;
  PERFORM public.save_directory_workflow(actor,'save',jsonb_build_object('id',other,'revision',result->'revision','data',result || jsonb_build_object('name','Renamed directory '||suffix)));
  IF (SELECT category_name FROM public.products WHERE id=product) <> 'Renamed directory '||suffix OR (SELECT revision FROM public.products WHERE id=product) <> current_revision+1 THEN RAISE EXCEPTION 'Rename name/revision sync failed'; END IF;
  IF NOT (SELECT result->>'name'=ANY(aliases) AND slug=result->>'slug' FROM public.categories WHERE id=other) THEN RAISE EXCEPTION 'Alias/slug lost'; END IF;
  BEGIN
    PERFORM public.save_directory_workflow(actor,'save',jsonb_build_object('id',other,'revision',result->'revision','data',result));
    RAISE EXCEPTION 'Stale category revision accepted';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
  -- Draft-only reference protects deletion, and draft save rejects removed/unknown IDs.
  PERFORM public.save_product_workflow(actor,product2,0,'save',jsonb_build_object('title','Draft-only reference','category_id',draft_only));
  BEGIN
    DELETE FROM public.categories WHERE id=draft_only;
    RAISE EXCEPTION 'Draft-only referenced category deleted';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  BEGIN
    DELETE FROM public.categories WHERE id=other;
    RAISE EXCEPTION 'Live product referenced category deleted';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  BEGIN
    DELETE FROM public.categories WHERE id=root;
    RAISE EXCEPTION 'Root with children deleted';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  BEGIN
    PERFORM public.save_product_workflow(actor,product2,1,'save',jsonb_build_object('title','Invalid directory draft','category_id',gen_random_uuid()));
    RAISE EXCEPTION 'Unknown draft category accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
  SELECT to_jsonb(p) INTO product_before FROM public.products p WHERE id=product;
  BEGIN
    PERFORM public.save_directory_workflow(actor,'move',jsonb_build_object('category_id',child,'products',jsonb_build_array(jsonb_build_object('id',product,'revision',product_before->'revision'),jsonb_build_object('id',product2,'revision',999))));
    RAISE EXCEPTION 'Batch revision conflict ignored';
  EXCEPTION WHEN serialization_failure THEN NULL; END;
  IF (SELECT to_jsonb(p) FROM public.products p WHERE id=product) IS DISTINCT FROM product_before THEN RAISE EXCEPTION 'Partial batch persisted'; END IF;
  RAISE NOTICE 'Directory regression passed: permissions, limits, depth, rename, aliases, conflicts, draft preservation, URL preservation and atomic batch';
END;
$$;
ROLLBACK;
