import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import { fetchAdminAnalytics } from '@/lib/analytics/client';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { MousePointerClick, Eye, Percent, Trophy, Search, RefreshCw } from 'lucide-react';

type SearchRow = { clicks: number; impressions: number; ctr: number; position: number };
type GscData = {
  range: { startDate: string; endDate: string };
  summary: SearchRow;
  topQueries: Array<SearchRow & { query: string }>;
  topPages: Array<SearchRow & { page: string }>;
  coverageNote: string;
};

function GscDataPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [data, setData] = useState<GscData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchAdminAnalytics<GscData>('/api/admin/analytics/gsc', controller.signal)
      .then(setData)
      .catch((reason: unknown) => {
        if ((reason as { name?: string })?.name !== 'AbortError') setError(reason instanceof Error ? reason.message : '数据服务暂时不可用');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [reloadKey]);

  const summary = [
    { label: '自然搜索点击', value: data?.summary.clicks.toLocaleString() ?? '—', icon: MousePointerClick, cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: '搜索展现', value: data?.summary.impressions.toLocaleString() ?? '—', icon: Eye, cls: 'bg-green-50 text-green-700 border-green-200' },
    { label: '点击率', value: data ? `${(data.summary.ctr * 100).toFixed(2)}%` : '—', icon: Percent, cls: 'bg-purple-50 text-purple-700 border-purple-200' },
    { label: '平均排名', value: data ? data.summary.position.toFixed(1) : '—', icon: Trophy, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  ];
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
        <div><h1 className="text-2xl font-bold text-slate-900">GSC 搜索表现</h1><p className="text-sm text-slate-500 mt-1">{data ? `${data.range.startDate} 至 ${data.range.endDate}` : '近 30 天'} · 最终数据</p></div>
        <button onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />刷新</button>
      </div>
      <div className="mb-6 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">Search Analytics API 提供点击、展现、CTR 和排名，不代表完整收录覆盖；收录状态仍以 GSC“网页索引编制”为准。</div>
      {loading && <div className="mb-6 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">正在读取 GSC 实时数据…</div>}
      {error && <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      {!loading && !error && data && data.summary.impressions === 0 && <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">接口已连接，但所选周期内暂无搜索表现数据。</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">{summary.map((item) => <div key={item.label} className={`rounded-lg border p-6 ${item.cls}`}><div className="flex items-start justify-between"><div><p className="text-sm font-medium opacity-75">{item.label}</p><p className="text-3xl font-bold mt-2">{item.value}</p></div><item.icon className="w-8 h-8 opacity-25" /></div></div>)}</div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2"><Search className="w-4 h-4 text-slate-400" /><h2 className="text-sm font-semibold text-slate-900">热门搜索查询</h2></div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="text-left px-4 py-3 font-medium text-slate-600">查询词</th><th className="text-left px-4 py-3 font-medium text-slate-600">点击</th><th className="text-left px-4 py-3 font-medium text-slate-600">展现</th><th className="text-left px-4 py-3 font-medium text-slate-600">CTR</th><th className="text-left px-4 py-3 font-medium text-slate-600">平均排名</th></tr></thead><tbody className="divide-y divide-slate-100">{data?.topQueries.map((row) => <tr key={row.query} className="hover:bg-slate-50"><td className="px-4 py-3 font-medium text-slate-900">{row.query}</td><td className="px-4 py-3 text-slate-600">{row.clicks}</td><td className="px-4 py-3 text-slate-600">{row.impressions}</td><td className="px-4 py-3 text-slate-600">{(row.ctr * 100).toFixed(2)}%</td><td className="px-4 py-3 text-slate-600">{row.position.toFixed(1)}</td></tr>)}</tbody></table></div>
        {!loading && !error && (data?.topQueries.length ?? 0) === 0 && <div className="py-10 text-center text-sm text-slate-400">所选周期暂无查询词数据</div>}
      </div>
    </AdminLayout>
  );
}

export default withAuth(GscDataPage);
