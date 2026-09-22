import { z } from 'zod';

const text = (max: number) => z.string().trim().max(max);
export const imagePath = z.string().refine(value => value === '' || /^(?:\/?assets\/images\/[a-zA-Z0-9_./-]+\.(?:webp|png|jpe?g)|\/api\/product-media\/[0-9a-f-]{36})$/.test(value) && !value.includes('..'), '请选择已上传的产品图片');
export const productInput = z.object({
  title: text(240).min(1, '产品名称必填'), sku: text(100),
  category_id: z.string().uuid().or(z.literal('')), make: text(100), model: text(180), years: text(100),
  oe_numbers: z.array(text(100).min(1)).max(30), description: text(30000),
  specifications: z.array(z.object({ name: text(100).min(1), value: text(1000).min(1) }).strict()).max(50),
  price_text: text(150), moq_text: text(150), featured: z.boolean(),
  images: z.array(z.object({ path: imagePath.refine(Boolean), alt: text(240) }).strict()).max(9),
  short_description: text(1000), seo_title: text(100), seo_description: text(320),
  verification_note: text(2000),
}).strict();
export type ProductInput = z.infer<typeof productInput>;
export const emptyProduct: ProductInput = {
  title: '', sku: '', category_id: '', make: '', model: '', years: '', oe_numbers: [], description: '', specifications: [],
  price_text: '', moq_text: '', featured: false, images: [], short_description: '', seo_title: '', seo_description: '', verification_note: '',
};
export function publishIssues(data: ProductInput): string[] {
  return [!data.title.trim() && '产品名称', data.title.includes('[副本]') && '修改副本产品名称', !data.sku.trim() && 'SKU', !data.category_id && '产品分类', !data.images.length && '产品主图',
    !data.description.trim() && '产品描述', !data.verification_note.trim() && '资料核验说明'].filter((item): item is string => Boolean(item));
}
const inspectionLabels: Record<string,string> = {
  title:'产品名称', sku:'SKU', category_id:'产品分类', make:'汽车品牌', model:'适用车型', years:'适用年份',
  oe_numbers:'OE / 替换编号', description:'产品描述', specifications:'产品规格', price_text:'价格说明', moq_text:'起订量',
  images:'产品图片', short_description:'简短描述', seo_title:'SEO 标题', seo_description:'SEO 描述', verification_note:'资料核验说明',
};
export function inspectionIssues(data: ProductInput): string[] {
  const issues = publishIssues(data);
  const inspected = new Set(issues.map(issue => issue === '修改副本产品名称' ? '产品名称' : issue));
  const parsed = productInput.safeParse(data);
  if (!parsed.success) for (const issue of parsed.error.issues) {
    const label = inspectionLabels[String(issue.path[0])] || '产品资料';
    if (!inspected.has(label)) { issues.push(`${label}格式或长度有误`); inspected.add(label); }
  }
  return issues;
}
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
}
