import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { emptyProduct, imagePath, type ProductInput } from './model';
import type { Tables } from '@/types/database';

export class ProductError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function productStaff(req: NextApiRequest, write = true) {
  const client = getSupabaseServerClient();
  const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
  if (!token) throw new ProductError(401, '请重新登录');
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) throw new ProductError(401, '登录已失效，请重新登录');
  const { data: profile, error: profileError } = await client.from('profiles').select('role,is_active').eq('id', user.id).single();
  if (profileError) throw new ProductError(503, '暂时无法核验权限，请稍后重试');
  const roles = write ? ['super_admin','operator','product_manager','sales'] : ['super_admin','operator','product_manager','sales','editor','viewer'];
  if (!profile?.is_active || !roles.includes(profile.role)) throw new ProductError(403, '没有产品操作权限');
  return { client, actor: user.id };
}
export function productFailure(res: NextApiResponse, error: unknown) {
  if (error instanceof ProductError) return res.status(error.status).json({ error: error.message });
  console.error('Product operation failed', error instanceof Error ? error.message : 'Database operation failed');
  return res.status(503).json({ error: '操作未完成，内容仍保留在编辑页。请稍后重试。' });
}
export function fromProduct(product: Tables<'products'>): ProductInput {
  const content = product.cms_content as Partial<ProductInput> | null;
  const specifications = Array.isArray(product.specifications) ? product.specifications as ProductInput['specifications']
    : Object.entries(product.specifications || {}).map(([name, value]) => ({ name, value: String(value) }));
  const paths = [product.image_path, ...product.gallery_paths].filter((path): path is string => Boolean(path));
  return {
    ...emptyProduct, title: product.display_title || product.title, sku: product.sku || '', category_id: product.category_id || '',
    make: product.make || '', model: product.model || '', years: product.years || '', oe_numbers: product.oe_numbers,
    description: product.description || '', specifications, price_text: product.price_text || '', moq_text: product.moq_text || '', featured: product.featured,
    images: content?.images || [...new Set(paths)].map(path => ({ path, alt: product.title })),
    short_description: content?.short_description || '', seo_title: content?.seo_title || '', seo_description: content?.seo_description || '',
  };
}
export async function imageUrls(client: ReturnType<typeof getSupabaseServerClient>, paths: string[]) {
  const urls: Record<string, string> = {};
  for (const path of [...new Set(paths)]) {
    if (!imagePath.safeParse(path).success || !path) throw new ProductError(400, '图片路径无效，请重新选择图片');
    if (!path.startsWith('/api/product-media/')) { urls[path] = `https://www.ipackautoparts.com/${path.replace(/^\//, '')}`; continue; }
    const { data: media, error } = await client.from('product_media').select('storage_path').eq('id', path.split('/').pop()!).single();
    if (error || !media) throw new ProductError(400, '图片不存在，请重新上传或选择');
    const { data, error: signingError } = await client.storage.from('product-media').createSignedUrl(media.storage_path, 900);
    if (signingError || !data) throw new ProductError(503, '图片暂时无法预览');
    urls[path] = data.signedUrl;
  }
  return urls;
}
