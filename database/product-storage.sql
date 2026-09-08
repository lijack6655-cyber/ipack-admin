INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('product-media','product-media',false,5242880,ARRAY['image/webp'])
ON CONFLICT(id) DO NOTHING;
-- Intentionally no anon/authenticated storage policy: uploads use the authenticated server.
