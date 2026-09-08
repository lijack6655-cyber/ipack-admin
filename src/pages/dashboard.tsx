import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BarChart3, FileText, Inbox, Package } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { useAuthStore } from '@/lib/auth/store';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { hasPermission } from '@/lib/auth/permissions';

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
      hasPermission(user.role?.name, 'INQUIRY_READ') ? client.from('inquiries').select('*', { count: 'exact', head: true }) : Promise.resolve({ count: null, error: null }),
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
        <p className="text-slate-600">维护产品与文章，核查网站询价；客户沟通继续使用 WhatsApp 和邮箱。</p>
      </div>
      {error && <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">部分统计暂不可读：{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard icon={Package} label="产品总数" value={display(counts.products)} note="当前可见的产品记录" />
        <StatsCard icon={FileText} label="文章总数" value={display(counts.articles)} note="当前可见的文章记录" />
        {hasPermission(user.role?.name, 'INQUIRY_READ') && <StatsCard icon={Inbox} label="询价记录" value={display(counts.inquiries)} note="网站实际接收的询价" />}
        {hasPermission(user.role?.name, 'ANALYTICS_READ') && <div className="rounded-lg border bg-white p-6"><BarChart3 className="w-6 h-6 text-blue-500 mb-3" /><h2 className="font-semibold mb-3">网站数据</h2><Link className="text-blue-600 block mb-2" href="/admin/analytics/traffic">打开 GA4 入口</Link><Link className="text-blue-600" href="/admin/analytics/gsc">打开 GSC 入口</Link></div>}
      </div>
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">核心操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {hasPermission(user.role?.name, 'PRODUCT_READ') && <QuickLink href="/admin/products" label="管理产品" />}
          {hasPermission(user.role?.name, 'CONTENT_READ') && <QuickLink href="/admin/content/articles" label="管理文章" />}
          {hasPermission(user.role?.name, 'INQUIRY_READ') && <QuickLink href="/admin/inquiries" label="查看询价记录" />}
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
