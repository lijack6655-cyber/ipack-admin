import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('CDN-Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
  try {
    const { data, error } = await getSupabaseServerClient().from('articles')
      .select('title,slug,excerpt,category,author_name,featured_image_path,seo_title,seo_description,published_at,updated_at,page_path')
      .eq('status', 'published').in('source_type', ['admin_created', 'cms']).order('published_at', { ascending: false });
    if (error) throw error;
    return res.status(200).json({ articles: data || [] });
  } catch { return res.status(503).json({ error: 'Articles temporarily unavailable' }); }
}
