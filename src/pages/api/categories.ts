import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control','no-store'); res.setHeader('CDN-Cache-Control','no-store');
  if (req.method !== 'GET') { res.setHeader('Allow','GET'); return res.status(405).json({ error:'Method not allowed' }); }
  try {
    const client = getSupabaseServerClient();
    const [categories,products] = await Promise.all([
      client.from('categories').select('id,name,slug,parent_id,sort_order,aliases').eq('status','published').order('sort_order').order('name'),
      client.from('products').select('category_id').eq('status','published'),
    ]);
    if (categories.error || products.error) throw categories.error || products.error;
    return res.json((categories.data || []).map(c => ({ id:c.id,name:c.name,slug:c.slug,parentId:c.parent_id,sortOrder:c.sort_order,aliases:c.aliases,
      count:(products.data || []).filter(p => p.category_id === c.id).length })));
  } catch { return res.status(503).json({ error:'Directories temporarily unavailable' }); }
}
