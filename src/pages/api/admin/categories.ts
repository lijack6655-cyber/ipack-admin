import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { productStaff, ProductError, productFailure } from '@/lib/products/server';
import type { Json } from '@/types/database';

const uuid = z.string().uuid();
const revision = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const body = z.discriminatedUnion('action',[
  z.object({ action:z.literal('save'),id:uuid.optional(),revision,data:z.object({ name:z.string().trim().min(1).max(120),slug:z.string().max(120).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),parent_id:uuid.nullable(),sort_order:z.number().int().min(0).max(9999),description:z.string().max(2000) }).strict() }).strict(),
  z.object({ action:z.literal('delete'),id:uuid,revision }).strict(),
  z.object({ action:z.literal('move'),category_id:uuid,products:z.array(z.object({ id:uuid,revision }).strict()).min(1).max(500) }).strict(),
]);
export const config = { api:{ bodyParser:{ sizeLimit:'80kb' } } };
export default async function handler(req: NextApiRequest,res: NextApiResponse) {
  res.setHeader('Cache-Control','private, no-store');
  try {
    if (!['GET','POST'].includes(req.method || '')) { res.setHeader('Allow','GET, POST'); throw new ProductError(405,'不支持此操作'); }
    const { client,actor } = await productStaff(req,req.method !== 'GET');
    if (req.method === 'GET') {
      const [categories,products,drafts] = await Promise.all([
        client.from('categories').select('*').order('sort_order').order('name'),
        client.from('products').select('id,slug,title,display_title,status,category_id,revision').order('title'),
        client.from('product_drafts').select('product_id,data'),
      ]);
      if (categories.error || products.error || drafts.error) throw categories.error || products.error || drafts.error;
      return res.json({ categories:(categories.data || []).map(c => ({...c,count:(products.data || []).filter(p => p.category_id === c.id && p.status === 'published').length})),
        products:(products.data || []).map(p => { const draft = drafts.data?.find(d => d.product_id === p.id); const data = draft?.data as { title?:string;category_id?:string } | undefined;
          return {...p,title:p.status === 'draft' ? data?.title || p.title : p.display_title || p.title,has_draft:Boolean(draft),draft_category_id:data?.category_id || null}; }) });
    }
    if (!req.headers['content-type']?.includes('application/json')) throw new ProductError(415,'需要 JSON 请求');
    const parsed = body.safeParse(req.body);
    if (!parsed.success) throw new ProductError(400,parsed.error.issues[0].message);
    const { action,...payload } = parsed.data;
    if (action === 'save' && 'id' in payload && payload.id && 'data' in payload) {
      const { data:category,error } = await client.from('categories').select('slug').eq('id',payload.id).maybeSingle();
      if (error) throw error;
      if (!category) throw new ProductError(404,'目录不存在');
      if (category.slug !== payload.data.slug) throw new ProductError(400,'目录地址创建后不可修改');
    }
    const { data,error } = await client.rpc('save_directory_workflow',{actor,operation:action,payload:payload as Json});
    if (error?.code === '40001') throw new ProductError(409,'其他人已修改目录或产品，请重新载入后再操作');
    if (error?.code === '42501') throw new ProductError(403,'没有目录操作权限');
    if (error?.code === '23505') throw new ProductError(409,'目录名称或地址与现有目录或历史名称重复');
    if (error?.code === '23503') throw new ProductError(400,'目录仍有关联产品、草稿或子目录，或目标目录已不可用');
    if (error?.code === '23514') throw new ProductError(400,'目录最多两层，每层最多20项；请检查名称、层级和排序');
    if (error?.code === 'P0002') throw new ProductError(404,'目录或产品不存在，请重新载入');
    if (error) throw error;
    return res.json(data);
  } catch (error) { return productFailure(res,error); }
}
