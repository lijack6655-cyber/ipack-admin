import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { escapeHtml } from '@/lib/articles/render';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('CDN-Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(req.method || '')) { res.setHeader('Allow', 'GET, HEAD'); return res.status(405).end(); }
  try {
    const { data, error } = await getSupabaseServerClient().from('articles').select('slug,published_at,updated_at').eq('status', 'published').in('source_type', ['admin_created', 'cms']).order('slug');
    if (error) throw error;
    const entries = (data || []).map(article => `<url><loc>https://www.ipackautoparts.com/news/${escapeHtml(article.slug)}</loc><lastmod>${new Date(article.published_at || article.updated_at).toISOString().slice(0, 10)}</lastmod></url>`).join('');
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send(`<?xml version="1.0" encoding="utf-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`);
  } catch { return res.status(503).end(); }
}
