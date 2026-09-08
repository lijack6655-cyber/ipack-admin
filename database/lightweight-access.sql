-- Review/development script. Not applied to production; creates no accounts.
-- Run the enum addition as its own committed statement before the transaction.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operator';

BEGIN;
-- Retain legacy roles without silently reassigning existing employees.
DROP POLICY IF EXISTS products_product_insert ON public.products;
DROP POLICY IF EXISTS products_product_update ON public.products;
CREATE POLICY products_product_insert ON public.products FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.has_any_role(ARRAY['super_admin','operator','product_manager','sales']::public.app_role[])) AND status = 'draft');
CREATE POLICY products_product_update ON public.products FOR UPDATE TO authenticated
  USING ((SELECT private.has_any_role(ARRAY['super_admin','operator','product_manager','sales']::public.app_role[])) AND status = 'draft')
  WITH CHECK ((SELECT private.has_any_role(ARRAY['super_admin','operator','product_manager','sales']::public.app_role[])) AND status = 'draft');
DROP POLICY IF EXISTS articles_editor_insert ON public.articles;
DROP POLICY IF EXISTS articles_editor_update ON public.articles;
CREATE POLICY articles_editor_insert ON public.articles FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.has_any_role(ARRAY['super_admin','operator','editor','sales']::public.app_role[])) AND status = 'draft');
CREATE POLICY articles_editor_update ON public.articles FOR UPDATE TO authenticated
  USING ((SELECT private.has_any_role(ARRAY['super_admin','operator','editor','sales']::public.app_role[])) AND status = 'draft')
  WITH CHECK ((SELECT private.has_any_role(ARRAY['super_admin','operator','editor','sales']::public.app_role[])) AND status = 'draft');

-- Extend staff reads to the dedicated operator role. Disabled profiles fail the shared check.
DROP POLICY IF EXISTS products_staff_read ON public.products;
CREATE POLICY products_staff_read ON public.products FOR SELECT TO authenticated
  USING ((SELECT private.has_any_role(ARRAY['super_admin','operator','product_manager','editor','sales','viewer']::public.app_role[])));
DROP POLICY IF EXISTS articles_staff_read ON public.articles;
CREATE POLICY articles_staff_read ON public.articles FOR SELECT TO authenticated
  USING ((SELECT private.has_any_role(ARRAY['super_admin','operator','product_manager','editor','sales','viewer']::public.app_role[])));
DROP POLICY IF EXISTS categories_staff_read ON public.categories;
CREATE POLICY categories_staff_read ON public.categories FOR SELECT TO authenticated
  USING ((SELECT private.has_any_role(ARRAY['super_admin','operator','product_manager','editor','sales','viewer']::public.app_role[])));

-- Basic inquiry records are read-only; the existing server RFQ receiver still inserts them.
DROP POLICY IF EXISTS inquiries_sales_update ON public.inquiries;
DROP POLICY IF EXISTS contacts_sales_update ON public.contacts;
DROP POLICY IF EXISTS inquiries_sales_read ON public.inquiries;
CREATE POLICY inquiries_sales_read ON public.inquiries FOR SELECT TO authenticated
  USING ((SELECT private.has_any_role(ARRAY['super_admin','operator','sales']::public.app_role[])));
DROP POLICY IF EXISTS contacts_sales_read ON public.contacts;
CREATE POLICY contacts_sales_read ON public.contacts FOR SELECT TO authenticated
  USING ((SELECT private.has_any_role(ARRAY['super_admin','operator','sales']::public.app_role[])));
REVOKE INSERT, UPDATE, DELETE ON public.inquiries, public.contacts FROM authenticated;

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id AND is_active)
  WITH CHECK ((SELECT auth.uid()) = id AND is_active);
-- Keep existing column-level grants: users cannot change role, is_active, id or login email.
COMMIT;
