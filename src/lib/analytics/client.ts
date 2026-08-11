import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

type ApiFailure = { error?: string; code?: string };

export async function fetchAdminAnalytics<T>(path: string, signal?: AbortSignal): Promise<T> {
  const { data } = await getSupabaseBrowserClient().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('登录状态已失效，请重新登录');

  const response = await fetch(path, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
    signal,
  });
  const payload = (await response.json().catch(() => ({}))) as T & ApiFailure;
  if (!response.ok) {
    if (response.status === 403) throw new Error('仅超级管理员可查看此数据');
    throw new Error(payload.error || '数据服务暂时不可用');
  }
  return payload;
}
