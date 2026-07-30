import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { CheckCircle2, AlertTriangle, XCircle, Search } from 'lucide-react';

const INDEX_SUMMARY = [
  { label: '已收录', value: 23, icon: CheckCircle2, cls: 'bg-green-50 text-green-700 border-green-200' },
  { label: '未收录', value: 169, icon: XCircle, cls: 'bg-red-50 text-red-600 border-red-200' },
  { label: '已发现未收录', value: 156, icon: AlertTriangle, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
];

const TOP_QUERIES = [
  { query: 'toyota prius headlight', clicks: 42, impressions: 980, ctr: '4.3%', position: 8.2 },
  { query: 'suzuki swift suspension parts', clicks: 31, impressions: 745, ctr: '4.2%', position: 9.6 },
  { query: 'auto parts supplier guangzhou', clicks: 27, impressions: 1120, ctr: '2.4%', position: 14.1 },
  { query: 'ipack auto parts', clicks: 19, impressions: 260, ctr: '7.3%', position: 3.5 },
  { query: 'led taillight cover replacement', clicks: 15, impressions: 512, ctr: '2.9%', position: 12.7 },
];

function GscDataPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [asOf] = useState('2026-07-13');

  const handleLogout = async () => { await logout(); router.push('/login'); };

  if (!user) return null;

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">GSC 数据</h1>
          <p className="text-sm text-slate-500 mt-1">Google Search Console 收录与查询表现</p>
        </div>
      </div>

      <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        以下数据为交接记录中的历史快照（截至 {asOf}），非实时数据；后续将接入 GSC API 自动刷新。
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {INDEX_SUMMARY.map((item) => (
          <div key={item.label} className={`rounded-lg border p-6 ${item.cls}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium opacity-75">{item.label}</p>
                <p className="text-3xl font-bold mt-2">{item.value}</p>
              </div>
              <item.icon className="w-8 h-8 opacity-25" />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">热门搜索查询</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">查询词</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">点击</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">展现</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">CTR</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">平均排名</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {TOP_QUERIES.map((q) => (
              <tr key={q.query} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">{q.query}</td>
                <td className="px-4 py-3 text-slate-600">{q.clicks}</td>
                <td className="px-4 py-3 text-slate-600">{q.impressions}</td>
                <td className="px-4 py-3 text-slate-600">{q.ctr}</td>
                <td className="px-4 py-3 text-slate-600">{q.position}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export default withAuth(GscDataPage);
