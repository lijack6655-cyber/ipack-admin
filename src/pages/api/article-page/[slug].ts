import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { renderArticle } from '@/lib/articles/render';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (!['GET', 'HEAD'].includes(req.method || '')) { res.setHeader('Allow', 'GET, HEAD'); return res.status(405).end(); }
  const slug = req.query.slug;
  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) { res.setHeader('X-Robots-Tag', 'noindex'); return res.status(404).send('Not found'); }
  try {
    const { data, error } = await getSupabaseServerClient().from('articles').select('title,slug,excerpt,content_markdown,seo_title,seo_description,featured_image_path,author_name,category,published_at').eq('slug', slug).eq('status', 'published').in('source_type', ['admin_created', 'cms']).maybeSingle();
    if (error) throw error;
    if (!data) { res.setHeader('X-Robots-Tag', 'noindex'); return res.status(404).send('Article not found'); }
    return res.status(200).send(renderArticle(data));
  } catch { res.setHeader('X-Robots-Tag', 'noindex'); return res.status(503).send('Article temporarily unavailable'); }
}
