import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export class ArticleError extends Error { constructor(public status: number, message: string) { super(message); } }

export async function articleStaff(req: NextApiRequest, write = true) {
  const client = getSupabaseServerClient();
  const token = req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
  if (!token) throw new ArticleError(401, '请重新登录');
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) throw new ArticleError(401, '登录已失效，请重新登录');
  const { data: profile, error: profileError } = await client.from('profiles').select('role,is_active').eq('id', user.id).single();
  if (profileError) throw new ArticleError(503, '暂时无法核验权限，请稍后重试');
  const roles = write ? ['super_admin', 'operator', 'editor', 'sales'] : ['super_admin', 'operator', 'editor', 'sales', 'viewer'];
  if (!profile?.is_active || !roles.includes(profile.role)) throw new ArticleError(403, '没有文章操作权限');
  return { client, actor: user.id };
}

export function articleFailure(res: NextApiResponse, error: unknown) {
  if (error instanceof ArticleError) return res.status(error.status).json({ error: error.message });
  if (typeof error === 'object' && error && 'code' in error && (error as { code?: string }).code === '23505') return res.status(409).json({ error: 'Slug 已存在，请更换后重试' });
  if (typeof error === 'object' && error && 'code' in error && (error as { code?: string }).code === '40001') return res.status(409).json({ error: '文章已被其他人更新，请重新载入' });
  console.error('Article operation failed', error instanceof Error ? error.message : 'Database operation failed');
  return res.status(503).json({ error: '操作未完成，请稍后重试' });
}
