import { z } from 'zod';

export function isSafeArticleImagePath(value: string): boolean {
  if (/[\\\u0000-\u001f<>"']/.test(value)) return false;
  if (value.startsWith('/assets/')) {
    try { return !decodeURIComponent(value.split(/[?#]/, 1)[0]).split('/').includes('..'); } catch { return false; }
  }
  return /^\/api\/product-media\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) || (() => {
    try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
  })();
}

const text = (max: number) => z.string().trim().max(max);
const imagePath = z.string().trim().max(500).refine(value => !value || isSafeArticleImagePath(value), '图片必须使用 /assets/ 路径、已上传图片或 HTTPS 地址');

export const articleInput = z.object({
  title: text(240).min(1, '文章标题必填'),
  slug: z.string().trim().max(240).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug 只能使用小写字母、数字和连字符'),
  category: text(120),
  author_name: text(160),
  excerpt: text(500),
  content_markdown: z.string().trim().min(1, '正文必填').max(100000),
  seo_title: text(160),
  seo_description: text(320),
  featured_image_path: imagePath,
}).strict();

export type ArticleInput = z.infer<typeof articleInput>;

export const emptyArticle: ArticleInput = {
  title: '', slug: '', category: '', author_name: '', excerpt: '', content_markdown: '',
  seo_title: '', seo_description: '', featured_image_path: '',
};

export function articlePublishIssues(data: ArticleInput): string[] {
  return [
    !data.title.trim() && '文章标题',
    !data.slug.trim() && 'Slug',
    !data.excerpt.trim() && '文章摘要',
    !data.content_markdown.trim() && '正文',
  ].filter((item): item is string => Boolean(item));
}
