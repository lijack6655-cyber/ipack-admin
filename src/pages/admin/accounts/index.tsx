import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { useAuthStore } from '@/lib/auth/store';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
function AccountsPage() {
  const router = useRouter(); const { user, logout } = useAuthStore();
  const [items, setItems] = useState<Profile[]>([]); const [error, setError] = useState('');
  const [loading, setLoading] = useState(true); const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const { data, error: queryError } = await getSupabaseBrowserClient().from('profiles').select('*').order('created_at');
        if (queryError) throw queryError;
        if (active) setItems(data ?? []);
      } catch {
        if (active) setError('账号列表暂时无法读取，请重试；仍不可读时请联系管理员核查。');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [retry]);
  if (!user) return null;
  const handleLogout = async () => { await logout(); router.push('/login'); };
  return <AdminLayout user={user} onLogout={handleLogout}>
    <div className="mb-6"><h1 className="text-2xl font-bold">账号管理</h1><p className="text-sm text-slate-500 mt-1">固定内部账号方案：老板、运营、两名业务员；以下为现有账号，不代表四个模板已创建</p></div>
    <div className="mb-5 rounded-lg border bg-white p-4 text-sm space-y-2"><p>老板和运营：维护产品、文章及公共页面外观。</p><p>业务员：维护产品、文章，查看基本询价记录。</p><p>账号与权限变更由管理员处理；不再发送成员邀请。</p></div>
    {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-red-700"><p>{error}</p><button type="button" className="rounded border border-red-300 px-3 py-2 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700" onClick={() => setRetry(value => value + 1)}>重试读取账号</button></div>}
    <div aria-busy={loading} className="overflow-x-auto rounded-lg border bg-white"><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="text-left p-3">姓名</th><th className="text-left p-3">邮箱</th><th className="text-left p-3">角色</th><th className="text-left p-3">状态</th><th className="text-left p-3">最近登录</th></tr></thead><tbody className="divide-y">{!loading && !error && items.map((item) => <tr key={item.id}><td className="p-3">{[item.first_name, item.last_name].filter(Boolean).join(' ') || '待补充'}</td><td className="p-3">{item.email}</td><td className="p-3">{item.role}</td><td className="p-3">{item.is_active ? '启用' : '停用'}</td><td className="p-3">{item.last_login_at ? new Date(item.last_login_at).toLocaleString('zh-CN') : '暂无记录'}</td></tr>)}</tbody></table>{loading ? <p role="status" className="p-12 text-center text-slate-500">正在读取账号列表…</p> : items.length === 0 && !error && <div className="p-12 text-center text-slate-500">暂无真实账号</div>}</div>
  </AdminLayout>;
}
export default withAuth(AccountsPage);
