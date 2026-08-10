import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let mounted = true;

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) setError('邀请链接无效或已过期，请联系管理员重新发送');
      setSessionReady(Boolean(data.session));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSessionReady(Boolean(session));
      if (session) setError(null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!sessionReady) {
      setError('邀请链接无效或已过期，请联系管理员重新发送');
      return;
    }
    if (password.length < 12) {
      setError('密码至少需要 12 位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsSaving(true);
    const { error: updateError } = await getSupabaseBrowserClient().auth.updateUser({ password });
    setIsSaving(false);

    if (updateError) {
      setError(updateError.message || '密码设置失败，请重试');
      return;
    }

    setSuccess(true);
    setTimeout(() => router.replace('/dashboard'), 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800">iPackAutoparts</h1>
          <p className="mt-2 text-slate-600">设置后台团队账号密码</p>
        </div>

        {error && (
          <div className="mb-5 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success ? (
          <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p>密码设置成功，正在进入后台……</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">新密码</label>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="至少 12 位"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">确认新密码</label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isSaving || !sessionReady}
              className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? '保存中……' : sessionReady ? '设置密码并进入后台' : '正在验证邀请链接……'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
