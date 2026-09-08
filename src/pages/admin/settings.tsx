import React, { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';

function SettingsPage() {
  const router = useRouter();
  const { user, logout, refreshProfile } = useAuthStore();
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  if (!user) return null;
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return;
    setBusy(true); setNotice(''); setError('');
    try {
      const { data, error } = await getSupabaseBrowserClient().from('profiles')
        .update({first_name:firstName.trim() || null,last_name:lastName.trim() || null})
        .eq('id',user.id).select('id').single();
      if (error || !data) throw new Error('资料保存失败，请重新登录后重试');
      await refreshProfile();
      setNotice('个人资料已保存');
    } catch (error) { setError(error instanceof Error ? error.message : '保存失败'); }
    finally { setBusy(false); }
  };
  const changePassword = async (event: FormEvent) => {
    event.preventDefault(); if (busy) return;
    setNotice(''); setError('');
    if (password.length < 12 || password.length > 128 || password !== confirmPassword) { setError('请输入 12 至 128 位密码，并确保两次输入一致'); return; }
    setBusy(true);
    try {
      const { error } = await getSupabaseBrowserClient().auth.updateUser({password});
      if (error) throw new Error('密码修改失败，可能需要重新登录或通过登录页重置密码');
      setPassword(''); setConfirmPassword('');
      setNotice('密码已修改，请退出后使用新密码登录');
    } catch (error) { setError(error instanceof Error ? error.message : '密码修改失败'); }
    finally { setBusy(false); }
  };
  return <AdminLayout user={user} onLogout={async () => { await logout(); router.push('/login'); }}>
    <h1 className="text-2xl font-bold mb-2">个人设置</h1><p className="text-sm text-slate-600 mb-6">修改自己的显示名称和密码；登录邮箱由管理员维护。</p>
    {notice && <p role="status" className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-green-800">{notice}</p>}
    {error && <p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
    <div className="max-w-2xl space-y-6">
      <form onSubmit={save} className="rounded-lg border bg-white p-5 space-y-4"><h2 className="font-semibold">个人资料</h2>
        <label className="block text-sm">名<input className="mt-1 block w-full rounded border p-2" maxLength={80} value={firstName} onChange={(event) => setFirstName(event.target.value)} /></label>
        <label className="block text-sm">姓<input className="mt-1 block w-full rounded border p-2" maxLength={80} value={lastName} onChange={(event) => setLastName(event.target.value)} /></label>
        <label className="block text-sm">登录邮箱<input className="mt-1 block w-full rounded border bg-slate-50 p-2" value={user.email} readOnly /></label>
        <button disabled={busy} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">保存个人资料</button>
      </form>
      <form onSubmit={changePassword} className="rounded-lg border bg-white p-5 space-y-4"><h2 className="font-semibold">修改自己的密码</h2>
        <label className="block text-sm">新密码<input className="mt-1 block w-full rounded border p-2" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <label className="block text-sm">确认新密码<input className="mt-1 block w-full rounded border p-2" type="password" autoComplete="new-password" required minLength={12} maxLength={128} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label>
        <button disabled={busy} className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">更新密码</button>
      </form>
    </div>
  </AdminLayout>;
}
export default withAuth(SettingsPage);
