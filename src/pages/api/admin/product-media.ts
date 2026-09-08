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
      const search=String(req.query.search||'').trim().toLowerCase();
      const usage=String(req.query.usage||'all');
      if(search.length>180||!['all','published','draft','unused'].includes(usage)) throw new ProductError(400,'筛选条件无效');
      // ponytail: inventory joins in memory; move to a paginated SQL view if the media library outgrows an admin request.
      const {data:products,error:productError}=await client.from('products').select('id,title,status,image_path,gallery_paths');
      const {data:drafts,error:draftError}=await client.from('product_drafts').select('product_id,data');
      if(productError||draftError)throw productError||draftError;
      type Item={id:string;path:string;name:string;width:number|null;height:number|null;bytes:number|null;created_at:string|null;references:{id:string;title:string;status:string}[]};
      const inventory=new Map<string,Item>();
      for(let offset=0;;offset+=500){
        const {data,error}=await client.from('product_media').select('*').order('created_at',{ascending:false}).order('id').range(offset,offset+499);
        if(error)throw error;
        for(const m of data||[]){const legacy=m.storage_path.startsWith('assets/images/');const path=legacy?m.storage_path:`/api/product-media/${m.id}`;inventory.set(path,{...m,path,created_at:legacy?null:m.created_at,references:[]});}
        if((data?.length||0)<500)break;
      }
      const reference=(path:string,p:{id:string;title:string;status:string})=>{
        if(!path)return;
        if(!inventory.has(path)){if(path.startsWith('/api/'))return;inventory.set(path,{id:path,path,name:path.split('/').pop()||path,width:null,height:null,bytes:null,created_at:null,references:[]});}
        const item=inventory.get(path)!;
        if(!item.references.some(r=>r.id===p.id&&r.status===p.status))item.references.push(p);
      };
      for(const p of products||[])for(const path of [p.image_path,...p.gallery_paths])if(path)reference(path,p);
      for(const d of drafts||[]){const p=products?.find(p=>p.id===d.product_id);const form=d.data as {title?:string;images?:{path:string}[]};if(p)for(const image of form.images||[])reference(image.path,{id:p.id,title:form.title||p.title,status:'draft'});}
      const filtered=[...inventory.values()].filter(m=>(!search||m.name.toLowerCase().includes(search))&&(usage==='all'||usage==='unused'&&!m.references.length||usage==='published'&&m.references.some(r=>r.status==='published')||usage==='draft'&&m.references.length>0&&!m.references.some(r=>r.status==='published')));
      const media=filtered.slice(page*24,page*24+24);
      return res.json({media,total:filtered.length,has_more:filtered.length>(page+1)*24,image_urls:await imageUrls(client,media.map(m=>m.path))});
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
