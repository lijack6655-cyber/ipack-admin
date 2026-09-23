import { randomUUID } from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { articleInput, articlePublishIssues } from '@/lib/articles/model';
import { renderArticle, toArticleInput } from '@/lib/articles/render';
import { articleFailure, articleStaff, ArticleError } from '@/lib/articles/server';
import type { Json } from '@/types/database';

const bodySchema = z.object({
  action: z.enum(['save', 'preview', 'publish']),
  revision: z.number().int().nonnegative(),
  data: articleInput.optional(),
}).strict();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  try {
    if (!['GET', 'POST'].includes(req.method || '')) { res.setHeader('Allow', 'GET, POST'); throw new ArticleError(405, '不支持此操作'); }
    const segments = req.query.id;
    const id = Array.isArray(segments) && segments.length === 1 ? segments[0] : undefined;
    if (segments && (!id || !z.string().uuid().safeParse(id).success)) throw new ArticleError(404, '文章不存在');
    const { client, actor } = await articleStaff(req, req.method !== 'GET');

    if (req.method === 'GET' && !id) {
      const [{ data: articles, error }, { data: drafts, error: draftError }] = await Promise.all([
        client.from('articles').select('*').order('updated_at', { ascending: false }),
        client.from('article_drafts').select('article_id,updated_at'),
      ]);
      if (error || draftError) throw error || draftError;
      return res.json({ articles: (articles || []).map(article => ({ ...article, has_draft: Boolean(drafts?.some(draft => draft.article_id === article.id)) })) });
    }

    const { data: article, error } = id ? await client.from('articles').select('*').eq('id', id).maybeSingle() : { data: null, error: null };
    if (error) throw error;
    if (id && !article) throw new ArticleError(404, '文章不存在');
    const { data: draft, error: draftError } = id ? await client.from('article_drafts').select('*').eq('article_id', id).maybeSingle() : { data: null, error: null };
    if (draftError) throw draftError;
    if (req.method === 'GET') {
      if (!article) return res.json({ article: null, draft: null, form: null });
      return res.json({ article, draft: draft?.data || null, form: toArticleInput(article, draft?.data as Record<string, unknown> | null) });
    }

    if (!req.headers['content-type']?.includes('application/json')) throw new ArticleError(415, '需要 JSON 请求');
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) throw new ArticleError(400, parsed.error.issues[0].message);
    const { action, revision, data } = parsed.data;
    if (action === 'save') {
      if (!data) throw new ArticleError(400, '缺少文章内容');
      const payload = { ...data, content_html: renderArticle({ ...data, published_at: null }, true) } as unknown as Json;
      const { data: result, error: saveError } = await client.rpc('save_article_workflow', { actor, article_id: id || randomUUID(), expected_revision: revision, operation: 'save', payload });
      if (saveError) throw saveError;
      return res.json(result);
    }
    if (!article || !draft) throw new ArticleError(400, '请先保存草稿');
    const form = articleInput.safeParse(toArticleInput(article, draft.data as Record<string, unknown>));
    if (!form.success) throw new ArticleError(400, '草稿内容已损坏，请重新编辑');
    if (action === 'preview') return res.json({ html: renderArticle({ ...article, ...form.data }, true) });
    const missing = articlePublishIssues(form.data);
    if (missing.length) throw new ArticleError(400, `发布前请补充：${missing.join('、')}`);
    const { data: result, error: publishError } = await client.rpc('save_article_workflow', { actor, article_id: article.id, expected_revision: revision, operation: 'publish' });
    if (publishError) throw publishError;
    return res.json(result);
  } catch (error) { return articleFailure(res, error); }
}
