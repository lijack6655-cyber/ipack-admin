import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
export async function productRequest(path: string, options: RequestInit = {}) {
  const { data: { session } } = await getSupabaseBrowserClient().auth.getSession();
  if (!session) throw new Error('请重新登录后重试');
  const response = await fetch(path,{ ...options, headers:{ ...options.headers, Authorization:`Bearer ${session.access_token}` }, cache:'no-store' });
  const data = await response.json().catch(() => ({ error:'服务暂时不可用，请稍后重试' }));
  if (!response.ok) throw new Error(data.error || '操作失败，请重试');
  return data;
}
