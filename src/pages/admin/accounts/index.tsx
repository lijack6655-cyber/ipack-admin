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
  useEffect(() => {
    getSupabaseBrowserClient().from('profiles').select('*').order('created_at').then(({ data, error: queryError }) => {
      if (queryError) setError(queryError.message); else setItems(data ?? []);
    });
  }, []);
  if (!user) return null;
  const handleLogout = async () => { await logout(); router.push('/login'); };
  return <AdminLayout user={user} onLogout={handleLogout}>
    <div className="mb-6"><h1 className="text-2xl font-bold">账号管理</h1><p className="text-sm text-slate-500 mt-1">固定内部账号方案：老板、运营、两名业务员；以下为现有账号，不代表四个模板已创建</p></div>
    <div className="mb-5 rounded-lg border bg-white p-4 text-sm space-y-2"><p>老板和运营：维护产品、文章及公共页面外观。</p><p>业务员：维护产品、文章，查看基本询价记录。</p><p>账号与权限变更由管理员处理；不再发送成员邀请。</p></div>
    {error && <p role="alert" className="text-red-700 mb-4">{error}</p>}
    <div className="overflow-x-auto rounded-lg border bg-white"><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="text-left p-3">姓名</th><th className="text-left p-3">邮箱</th><th className="text-left p-3">角色</th><th className="text-left p-3">状态</th><th className="text-left p-3">最近登录</th></tr></thead><tbody className="divide-y">{items.map((item) => <tr key={item.id}><td className="p-3">{[item.first_name, item.last_name].filter(Boolean).join(' ') || '待补充'}</td><td className="p-3">{item.email}</td><td className="p-3">{item.role}</td><td className="p-3">{item.is_active ? '启用' : '停用'}</td><td className="p-3">{item.last_login_at ? new Date(item.last_login_at).toLocaleString('zh-CN') : '暂无记录'}</td></tr>)}</tbody></table>{items.length === 0 && !error && <div className="p-12 text-center text-slate-400">暂无真实账号</div>}</div>
  </AdminLayout>;
}
export default withAuth(AccountsPage);
