# Product workflow release

1. Add `operator` to `public.app_role` in a separately committed migration.
2. Apply `lightweight-access.sql` after its enum statement; apply `product-workflow.sql` and `product-storage.sql`.
3. Deploy this admin and the coordinated public-site branch. Public `/products/:slug`, `/api/product-media/:id` and `/sitemap-catalog.xml` must proxy to the admin endpoints. Remove conflicting static outputs from the public deployment; original detail HTML is retained in `src/lib/products/legacy.json`.
4. Verify authenticated draft save/preview and public status responses before normal product publishing.

`SUPABASE_SECRET_KEY` stays server-only. Draft JSON and original uploaded media are private. Product mutations require a verified Auth user, an active allowed profile, and an expected revision; direct authenticated product writes are revoked. Published rows contain only live content. Each publish/archive stores the preceding live snapshot in `audit_logs`.

Rollback application deployments together; preserve new tables and content. Do not blindly drop columns or restore the old static catalog after products have been published or archived. Use saved audit snapshots for a reviewed data recovery when necessary. Existing products are unchanged until an editor explicitly publishes them.

The HTML snapshots come from public-site commit `5cc80a6c0117bc7d9327c94abef8266e08eb468a`; only the shared script cache version changes. They preserve imported public content until the product is explicitly managed and published through this editor.
