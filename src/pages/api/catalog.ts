import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { categoryPath } from '@/lib/products/categories';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { data: categories,error: categoryError } = await getSupabaseServerClient().from('categories').select('id,name,slug,parent_id,sort_order').eq('status','published');
    if (categoryError) throw categoryError;
    const { data, error } = await getSupabaseServerClient().from('products')
      .select('id,external_id,slug,title,display_title,category_id,category_name,make,model,years,oe_numbers,description,price_text,moq_text,image_path,hover_image_path,gallery_paths,featured,source_rank,source_url,search_text,page_path')
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('title');
    if (error) throw error;
    const products = (data ?? []).map((product) => ({
      id: product.external_id || product.id,
      slug: product.slug,
      title: product.title,
      displayTitle: product.display_title,
      category: categories?.find(c => c.id === product.category_id)?.name || product.category_name,
      categoryId: product.category_id,
      categorySlug: categories?.find(c => c.id === product.category_id)?.slug || null,
      categoryPath: categoryPath(categories || [],product.category_id),
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
      searchText: [product.search_text,...categoryPath(categories || [],product.category_id).map(c => c.name)].filter(Boolean).join(' '),
      url: product.page_path,
    }));
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('CDN-Cache-Control', 'no-store');
    return res.status(200).json(products);
  } catch (error) {
    console.error('Catalog API failed', error instanceof Error ? error.message : 'Unknown error');
    return res.status(503).json({ error: 'Catalog temporarily unavailable' });
  }
}
