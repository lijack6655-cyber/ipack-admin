import React, { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { useAuthStore } from '@/lib/auth/store';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Database } from '@/types/database';
import { hasPermission } from '@/lib/auth/permissions';

type Profile = Database['public']['Tables']['profiles']['Row'];
function AccountsPage() {
  const router = useRouter(); const { user, logout } = useAuthStore();
  const [items, setItems] = useState<Profile[]>([]); const [error, setError] = useState('');
  const [notice, setNotice] = useState(''); const [isInviting, setIsInviting] = useState(false);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', role: 'sales' });
  const loadProfiles = async () => {
    const { data, error: queryError } = await getSupabaseBrowserClient().from('profiles').select('*').order('created_at');
    if (queryError) setError(queryError.message); else setItems(data ?? []);
  };
  useEffect(() => {
    getSupabaseBrowserClient().from('profiles').select('*').order('created_at').then(({ data, error: queryError }) => {
      if (queryError) setError(queryError.message); else setItems(data ?? []);
    });
  }, []);
  if (!user) return null;
  const handleLogout = async () => { await logout(); router.push('/login'); };
  const canInvite = hasPermission(user.role?.name, 'ACCOUNT_INVITE');
  const invite = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setNotice(''); setIsInviting(true);
    try {
      const { data: sessionData } = await getSupabaseBrowserClient().auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('登录已过期，请重新登录');
      const response = await fetch('/api/admin/invite', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '邀请发送失败');
      setNotice(`邀请已发送至 ${form.email}，链接默认约 1 小时内有效`);
      setForm({ email: '', firstName: '', lastName: '', role: 'sales' });
      await loadProfiles();
    } catch (inviteError) { setError(inviteError instanceof Error ? inviteError.message : '邀请发送失败'); }
    finally { setIsInviting(false); }
  };
  return <AdminLayout user={user} onLogout={handleLogout}>
    <div className="mb-6"><h1 className="text-2xl font-bold">账号管理</h1><p className="text-sm text-slate-500 mt-1">团队账号由超级管理员邀请，业务员无需注册 Vercel 账号</p></div>
    {canInvite && <form onSubmit={invite} className="mb-6 grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-5">
      <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="业务员邮箱" className="rounded border px-3 py-2" />
      <input value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} placeholder="名（待补充可留空）" className="rounded border px-3 py-2" />
      <input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} placeholder="姓（待补充可留空）" className="rounded border px-3 py-2" />
      <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="rounded border px-3 py-2">
        <option value="sales">业务员</option><option value="product_manager">产品管理员</option><option value="editor">内容编辑</option><option value="viewer">只读成员</option>
      </select>
      <button disabled={isInviting} className="rounded bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50">{isInviting ? '发送中……' : '发送邀请'}</button>
    </form>}
    {notice && <p className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-green-800">{notice}</p>}{error && <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-800">{error}</p>}
    <div className="overflow-x-auto rounded-lg border bg-white"><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="text-left p-3">姓名</th><th className="text-left p-3">邮箱</th><th className="text-left p-3">角色</th><th className="text-left p-3">状态</th><th className="text-left p-3">最近登录</th></tr></thead><tbody className="divide-y">{items.map((item) => <tr key={item.id}><td className="p-3">{[item.first_name, item.last_name].filter(Boolean).join(' ') || '待补充'}</td><td className="p-3">{item.email}</td><td className="p-3">{item.role}</td><td className="p-3">{item.is_active ? '启用' : '停用'}</td><td className="p-3">{item.last_login_at ? new Date(item.last_login_at).toLocaleString('zh-CN') : '暂无记录'}</td></tr>)}</tbody></table>{items.length === 0 && !error && <div className="p-12 text-center text-slate-400">暂无真实账号</div>}</div>
  </AdminLayout>;
}
export default withAuth(AccountsPage);
