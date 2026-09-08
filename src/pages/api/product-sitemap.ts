import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { escapeHtml } from '@/lib/products/model';
import shell from '@/lib/products/shell.json';
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control','no-store'); res.setHeader('CDN-Cache-Control','no-store');
  if (!['GET','HEAD'].includes(req.method || '')) { res.setHeader('Allow','GET, HEAD'); return res.status(405).end(); }
  try {
    const { data, error } = await getSupabaseServerClient().from('products').select('slug,published_at,updated_at').eq('status','published').order('slug');
    if (error) throw error;
    const entries = (data || []).map(p => `<url><loc>https://www.ipackautoparts.com/products/${escapeHtml(p.slug)}</loc><lastmod>${new Date(p.published_at || p.updated_at).toISOString().slice(0,10)}</lastmod></url>`).join('\n');
    res.setHeader('Content-Type','application/xml; charset=utf-8');
    return res.send(`<?xml version="1.0" encoding="utf-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${shell.sitemap_entries}${entries}</urlset>`);
  } catch { return res.status(503).end(); }
}
