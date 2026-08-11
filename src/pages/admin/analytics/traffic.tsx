import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import { fetchAdminAnalytics } from '@/lib/analytics/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { Users, Eye, MessageSquareText, Clock3, RefreshCw } from 'lucide-react';

type TrafficData = {
  range: { startDate: string; endDate: string };
  summary: {
    activeUsers: number;
    pageViews: number;
    inquiries: number;
    ga4LeadEvents: number;
    averageSessionDurationSeconds: number;
  };
  topPages: Array<{ path: string; views: number; share: number }>;
  trafficSources: Array<{ source: string; sessions: number; share: number }>;
  generatedAt: string;
};

const colors = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-cyan-500',
  'bg-pink-500', 'bg-indigo-500', 'bg-lime-500', 'bg-amber-500', 'bg-slate-500',
];

function formatDuration(seconds: number) {
  const rounded = Math.max(0, Math.round(seconds));
  return `${Math.floor(rounded / 60)}分 ${rounded % 60}秒`;
}

function TrafficAnalyticsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [data, setData] = useState<TrafficData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchAdminAnalytics<TrafficData>('/api/admin/analytics/ga4', controller.signal)
      .then(setData)
      .catch((reason: unknown) => {
        if ((reason as { name?: string })?.name !== 'AbortError') {
          setError(reason instanceof Error ? reason.message : '数据服务暂时不可用');
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [reloadKey]);

  const cards = useMemo(() => [
    { icon: Users, label: '活跃用户', value: data?.summary.activeUsers.toLocaleString() ?? '—', note: 'GA4', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    { icon: Eye, label: '页面浏览量', value: data?.summary.pageViews.toLocaleString() ?? '—', note: 'GA4', cls: 'bg-green-50 text-green-700 border-green-200' },
    { icon: MessageSquareText, label: '真实询盘', value: data?.summary.inquiries.toLocaleString() ?? '—', note: `Supabase；GA4 generate_lead：${data?.summary.ga4LeadEvents ?? '—'}`, cls: 'bg-purple-50 text-purple-700 border-purple-200' },
    { icon: Clock3, label: '平均会话时长', value: data ? formatDuration(data.summary.averageSessionDurationSeconds) : '—', note: 'GA4', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  ], [data]);

  const handleLogout = async () => { await logout(); router.push('/login'); };
  const refresh = () => {
    setLoading(true);
    setError('');
    setData(null);
    setReloadKey((value) => value + 1);
  };
  if (!user) return null;

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">流量分析</h1>
          <p className="text-sm text-slate-500 mt-1">
            数据周期：{data ? `${data.range.startDate} 至 ${data.range.endDate}` : '近 30 天'}
          </p>
        </div>
        <button onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />刷新
        </button>
      </div>

      {loading && <div className="mb-6 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">正在读取 GA4 与 Supabase 实时数据…</div>}
      {error && <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      {!loading && !error && data && data.summary.activeUsers === 0 && data.summary.pageViews === 0 && (
        <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">接口已连接，但所选周期内 GA4 暂无数据；这是真实空数据，不是演示数字。</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((item) => (
          <div key={item.label} className={`rounded-lg border p-6 ${item.cls}`}>
            <div className="flex items-start justify-between">
              <div><p className="text-sm font-medium opacity-75">{item.label}</p><p className="text-3xl font-bold mt-2">{item.value}</p><p className="text-xs mt-2 opacity-75">{item.note}</p></div>
              <item.icon className="w-8 h-8 opacity-25" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">热门页面</h2>
          <div className="space-y-3">
            {data?.topPages.map((page) => <div key={page.path}><div className="flex items-center justify-between text-sm mb-1"><span className="font-mono text-slate-700 truncate">{page.path}</span><span className="text-slate-500 flex-shrink-0 ml-2">{page.views.toLocaleString()} 次</span></div><div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, page.share * 100)}%` }} /></div></div>)}
            {!loading && !error && (data?.topPages.length ?? 0) === 0 && <p className="py-8 text-center text-sm text-slate-400">所选周期暂无页面数据</p>}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">流量来源</h2>
          <div className="space-y-3">
            {data?.trafficSources.map((source, index) => <div key={source.source}><div className="flex items-center justify-between text-sm mb-1"><span className="text-slate-700">{source.source}</span><span className="text-slate-500">{source.sessions.toLocaleString()} 次会话 · {(source.share * 100).toFixed(1)}%</span></div><div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${colors[index % colors.length]} rounded-full`} style={{ width: `${Math.min(100, source.share * 100)}%` }} /></div></div>)}
            {!loading && !error && (data?.trafficSources.length ?? 0) === 0 && <p className="py-8 text-center text-sm text-slate-400">所选周期暂无来源数据</p>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(TrafficAnalyticsPage);
