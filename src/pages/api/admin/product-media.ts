import { randomUUID } from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { prepareImage, MAX_IMAGE_BYTES } from '@/lib/products/image';
import { imageUrls, ProductError, productFailure, productStaff } from '@/lib/products/server';

export const config = { api: { bodyParser: false } };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control','private, no-store');
  try {
    if (!['GET','POST'].includes(req.method || '')) { res.setHeader('Allow','GET, POST'); throw new ProductError(405,'不支持此操作'); }
    const { client, actor } = await productStaff(req);
    if (req.method === 'GET') {
      const page = Number(req.query.page || 0);
      if (!Number.isInteger(page) || page < 0 || page > 10000) throw new ProductError(400,'页码无效');
      const { data, error } = await client.from('product_media').select('*').order('created_at',{ ascending:false }).order('id').range(page*24,page*24+24);
      if (error) throw error;
      const media = (data || []).slice(0,24).map(m => ({ ...m, path: `/api/product-media/${m.id}` }));
      return res.json({ media, has_more: (data?.length || 0)>24, image_urls: await imageUrls(client,media.map(m => m.path)) });
    }
    if (!['image/jpeg','image/png','image/webp'].includes(req.headers['content-type'] || '')) throw new ProductError(415,'请选择 JPG、PNG 或 WebP 图片');
    if (Number(req.headers['content-length'] || 0) > MAX_IMAGE_BYTES) throw new ProductError(413,'图片不能超过 3 MB');
    const chunks: Buffer[] = []; let size = 0;
    for await (const chunk of req) { size += chunk.length; if (size > MAX_IMAGE_BYTES) throw new ProductError(413,'图片不能超过 3 MB'); chunks.push(Buffer.from(chunk)); }
    let image;
    try { image = await prepareImage(Buffer.concat(chunks)); } catch { throw new ProductError(400,'无法读取图片，请选择完整的静态 JPG、PNG、WebP，尺寸不超过 2000 万像素'); }
    const id = randomUUID(), storagePath = `${id}.webp`;
    const { error: uploadError } = await client.storage.from('product-media').upload(storagePath,image.data,{ contentType:'image/webp', upsert:false });
    if (uploadError) throw uploadError;
    let name = 'product-image';
    try { name = decodeURIComponent(String(req.headers['x-file-name'] || name)).replace(/[\x00-\x1f/\\]/g,'').slice(0,180) || name; } catch { /* Invalid filename does not invalidate an image. */ }
    const media = { id, name, storage_path:storagePath, width:image.width, height:image.height, bytes:image.data.length, created_by:actor };
    const { error } = await client.from('product_media').insert(media);
    if (error) { await client.storage.from('product-media').remove([storagePath]); throw error; }
    const path = `/api/product-media/${id}`;
    return res.status(201).json({ media:{...media,path}, image_urls:await imageUrls(client,[path]) });
  } catch (error) { return productFailure(res,error); }
}
