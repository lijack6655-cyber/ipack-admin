import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export async function articleRequest<T = Record<string, unknown>>(url: string, init: RequestInit = {}): Promise<T> {
  const { data: { session } } = await getSupabaseBrowserClient().auth.getSession();
  const headers = new Headers(init.headers);
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(url, { ...init, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `请求失败（${response.status}）`);
  return body as T;
}
