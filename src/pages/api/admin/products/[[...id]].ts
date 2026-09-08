import { randomUUID } from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { productInput, publishIssues } from '@/lib/products/model';
import { fromProduct, imageUrls, ProductError, productFailure, productStaff } from '@/lib/products/server';
import { renderProduct } from '@/lib/products/render';
import type { Json } from '@/types/database';

export const config = { api: { bodyParser: { sizeLimit: '80kb' } } };
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  try {
    if (!['GET','POST'].includes(req.method || '')) { res.setHeader('Allow','GET, POST'); throw new ProductError(405,'不支持此操作'); }
    const { client, actor } = await productStaff(req, req.method !== 'GET');
    const segments = req.query.id;
    const id = Array.isArray(segments) && segments.length === 1 ? segments[0] : undefined;
    if (segments && (!id || !z.string().uuid().safeParse(id).success)) throw new ProductError(404, '产品不存在');
    if (req.method === 'GET' && !id) {
      const [{ data: products, error }, { data: drafts, error: draftError }, { data: categories, error: categoryError }] = await Promise.all([
        client.from('products').select('*').order('updated_at', { ascending: false }),
        client.from('product_drafts').select('product_id,data,updated_at'),
        client.from('categories').select('id,name,status').eq('status','published').order('sort_order'),
      ]);
      if (error || draftError || categoryError) throw error || draftError || categoryError;
      return res.json({ products: products?.map(p => { const d = drafts?.find(d => d.product_id === p.id); return { ...p, draft_title: (d?.data as { title?: string } | undefined)?.title, has_draft: Boolean(d) }; }), categories });
    }
    const { data: product, error } = id ? await client.from('products').select('*').eq('id',id).maybeSingle() : { data: null, error: null };
    if (error) throw error;
    if (id && !product) throw new ProductError(404, '产品不存在');
    const { data: draft, error: draftError } = id ? await client.from('product_drafts').select('*').eq('product_id',id).maybeSingle() : { data: null, error: null };
    if (draftError) throw draftError;
    if (req.method === 'GET' && product) {
      const form = draft ? productInput.parse(draft.data) : fromProduct(product);
      const { data: categories, error: categoryError } = await client.from('categories').select('id,name').eq('status','published').order('sort_order');
      if (categoryError) throw categoryError;
      return res.json({ product, form, has_draft: Boolean(draft), categories, image_urls: await imageUrls(client,form.images.map(i => i.path)) });
    }
    if (!req.headers['content-type']?.includes('application/json')) throw new ProductError(415, '需要 JSON 请求');
    const parsed = z.object({ action: z.enum(['save','preview','publish','archive']), revision: z.number().int().nonnegative(), data: productInput.optional(), confirmed: z.boolean().optional() }).strict().safeParse(req.body);
    if (!parsed.success) throw new ProductError(400, parsed.error.issues[0].message);
    const { action, revision, data, confirmed } = parsed.data;
    if (action !== 'save' && !product) throw new ProductError(400, '请先保存草稿');
    if (product && product.revision !== revision) throw new ProductError(409, '其他人已更新该产品，请复制当前修改后重新载入，避免覆盖。');
    if (action === 'preview' || action === 'publish') {
      if (!draft || !product) throw new ProductError(400, '请先保存草稿');
      const form = productInput.parse(draft.data);
      const urls = await imageUrls(client,form.images.map(i => i.path));
      if (action === 'preview') return res.json({ html: renderProduct(product,form,{ preview: true, imageUrls: urls }) });
      const missing = publishIssues(form);
      if (missing.length) throw new ProductError(400, `发布前请补充：${missing.join('、')}`);
      if (!confirmed) throw new ProductError(400, '请确认已核对资料并同意公开发布');
    }
    if (action === 'archive' && !confirmed) throw new ProductError(400, '请确认下架');
    if (action === 'save') {
      if (!data) throw new ProductError(400, '缺少产品内容');
      await imageUrls(client,data.images.map(i => i.path));
      if (data.category_id) {
        const { data: category, error: categoryError } = await client.from('categories').select('id').eq('id',data.category_id).eq('status','published').maybeSingle();
        if (categoryError) throw categoryError;
        if (!category) throw new ProductError(400, '分类已不可用，请重新选择');
      }
    }
    const { data: result, error: saveError } = await client.rpc('save_product_workflow', {
      actor, product_id: id || randomUUID(), expected_revision: revision, operation: action, ...(data && action === 'save' ? { payload: data as Json } : {}),
    });
    if (saveError?.code === '40001' || saveError?.code === '23505') throw new ProductError(409, '产品已被更新或编码发生冲突，请重新载入后检查');
    if (saveError?.code === '42501') throw new ProductError(403, '没有产品操作权限');
    if (saveError) throw saveError;
    return res.json(result);
  } catch (error) { return productFailure(res,error); }
}
