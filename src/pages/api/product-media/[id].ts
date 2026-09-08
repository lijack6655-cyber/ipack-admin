import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('CDN-Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if (!['GET','HEAD'].includes(req.method || '')) { res.setHeader('Allow','GET, HEAD'); return res.status(405).end(); }
  if (!z.string().uuid().safeParse(req.query.id).success) return res.status(404).end();
  try {
    const client = getSupabaseServerClient();
    const id = req.query.id as string, path = `/api/product-media/${id}`;
    const { data: products, error: productError } = await client.from('products').select('id').eq('status','published').or(`image_path.eq.${path},hover_image_path.eq.${path},gallery_paths.cs.{${path}}`).limit(1);
    if (productError) throw productError;
    if (!products?.length) return res.status(404).end();
    const { data: media, error } = await client.from('product_media').select('storage_path').eq('id',id).maybeSingle();
    if (error) throw error;
    if (!media) return res.status(404).end();
    const { data, error: downloadError } = await client.storage.from('product-media').download(media.storage_path);
    if (downloadError || !data) throw downloadError;
    res.setHeader('Content-Type','image/webp');
    return res.status(200).send(Buffer.from(await data.arrayBuffer()));
  } catch { return res.status(503).end(); }
}
