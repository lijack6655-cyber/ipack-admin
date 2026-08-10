import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BarChart3, FileText, Inbox, Package } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useAuthStore } from '@/lib/auth/store';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

type Counts = { products: number | null; articles: number | null; inquiries: number | null };

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isInitialized, initializeFromStorage } = useAuthStore();
  const [counts, setCounts] = useState<Counts>({ products: null, articles: null, inquiries: null });
  const [error, setError] = useState('');

  useEffect(() => { initializeFromStorage(); }, [initializeFromStorage]);
  useEffect(() => {
    if (isInitialized && (!isAuthenticated || !user)) router.push('/login');
  }, [isInitialized, isAuthenticated, user, router]);
  useEffect(() => {
    if (!user) return;
    const client = getSupabaseBrowserClient();
    Promise.all([
      client.from('products').select('*', { count: 'exact', head: true }),
      client.from('articles').select('*', { count: 'exact', head: true }),
      client.from('inquiries').select('*', { count: 'exact', head: true }),
    ]).then(([products, articles, inquiries]) => {
      const firstError = products.error || articles.error || inquiries.error;
      if (firstError) setError(firstError.message);
      setCounts({ products: products.count, articles: articles.count, inquiries: inquiries.count });
    });
  }, [user]);

  if (!user) return null;
  const handleLogout = async () => { await logout(); router.push('/login'); };
  const display = (value: number | null) => value === null ? '待接入' : String(value);

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">欢迎回来，{user.firstName || user.email}</h1>
        <p className="text-slate-600">当前仪表板只展示数据库真实统计；未接入的数据明确标记为“待接入”。</p>
      </div>
      {error && <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">部分统计暂不可读：{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard icon={Package} label="产品总数" value={display(counts.products)} note="来自 Supabase products" />
        <StatsCard icon={FileText} label="文章总数" value={display(counts.articles)} note="来自 Supabase articles" />
        <StatsCard icon={Inbox} label="询盘总数" value={display(counts.inquiries)} note="来自 Supabase inquiries" />
        <StatsCard icon={BarChart3} label="网站访问" value="待接入" note="等待 GA4 数据接口" />
      </div>
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">核心操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickLink href="/admin/products" label="管理产品" />
          <QuickLink href="/admin/content/articles" label="管理文章" />
          <QuickLink href="/admin/inquiries" label="查看询盘" />
        </div>
      </div>
    </AdminLayout>
  );
}

function StatsCard({ icon: Icon, label, value, note }: { icon: React.ElementType; label: string; value: string; note: string }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-6"><div className="flex justify-between"><div><p className="text-sm text-slate-500">{label}</p><p className="text-3xl font-bold mt-2 text-slate-900">{value}</p><p className="text-xs mt-2 text-slate-400">{note}</p></div><Icon className="w-8 h-8 text-blue-200" /></div></div>;
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="flex items-center justify-center px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg">{label}</Link>;
}
