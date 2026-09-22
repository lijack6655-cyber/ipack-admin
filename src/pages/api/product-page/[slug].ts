import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { fromProduct } from '@/lib/products/server';
import { renderProduct } from '@/lib/products/render';
import legacy from '@/lib/products/legacy.json';

function normalizeLegacyNavigation(html: string) {
  return html
    .replace('<a href="../products">Products</a>', '<a href="/product">Product</a><a href="/products">Search</a>')
    .replace('<a href="/products">Products</a>', '<a href="/product">Product</a><a href="/products">Search</a>')
    .replace('<a href="../products">Products</a>', '<a href="/product">Product</a>')
    .replace('<a href="/products">Products</a>', '<a href="/product">Product</a>')
    .replace('<a href="../products">Product Catalog</a>', '<a href="/product">Product Catalog</a>')
    .replace('<a href="/products">Product Catalog</a>', '<a href="/product">Product Catalog</a>')
    .replace(/assets\/js\/main\.js\?v=[^"']+/g, 'assets/js/main.js?v=20260922-nav');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('CDN-Cache-Control','no-store');
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('X-Content-Type-Options','nosniff');
  const fail = (status: number, message: string) => {
    res.setHeader('X-Robots-Tag','noindex');
    return res.status(status).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${message} | I-PACK</title></head><body><main><h1>${message}</h1><a href="/product">Browse products</a></main></body></html>`);
  };
  if (!['GET','HEAD'].includes(req.method || '')) { res.setHeader('Allow','GET, HEAD'); return fail(405,'Method not allowed'); }
  const slug = req.query.slug;
  if (typeof slug !== 'string' || !/^[a-z0-9-]{1,240}$/.test(slug)) return fail(404,'Product not found');
  try {
    const { data: product, error } = await getSupabaseServerClient().from('products').select('*').eq('slug',slug).maybeSingle();
    if (error) throw error;
    if (!product || product.status === 'draft') return fail(404,'Product not found');
    if (product.status !== 'published') return fail(410,'This product is no longer listed');
    const html = !product.cms_content ? normalizeLegacyNavigation((legacy as Record<string,string>)[slug] || '') : renderProduct(product,fromProduct(product));
    if (!html) return fail(503,'Product temporarily unavailable');
    return res.status(200).send(html);
  } catch { return fail(503,'Product temporarily unavailable'); }
}
