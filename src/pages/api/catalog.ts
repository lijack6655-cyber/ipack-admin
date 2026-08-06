import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { data, error } = await getSupabaseServerClient().from('products')
      .select('external_id,slug,title,display_title,category_name,make,model,years,oe_numbers,description,price_text,moq_text,image_path,hover_image_path,gallery_paths,featured,source_rank,source_url,search_text,page_path')
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('title');
    if (error) throw error;
    const products = (data ?? []).map((product) => ({
      id: product.external_id,
      slug: product.slug,
      title: product.title,
      displayTitle: product.display_title,
      category: product.category_name,
      make: product.make,
      model: product.model,
      years: product.years,
      oeNumbers: product.oe_numbers,
      description: product.description,
      price: product.price_text,
      moq: product.moq_text,
      image: product.image_path,
      hoverImage: product.hover_image_path,
      gallery: product.gallery_paths,
      featured: product.featured,
      rank: product.source_rank,
      sourceUrl: product.source_url,
      searchText: product.search_text,
      url: product.page_path,
    }));
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
    return res.status(200).json(products);
  } catch (error) {
    console.error('Catalog API failed', error instanceof Error ? error.message : 'Unknown error');
    return res.status(503).json({ error: 'Catalog temporarily unavailable' });
  }
}
