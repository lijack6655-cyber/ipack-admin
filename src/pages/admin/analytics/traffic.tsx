import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { Users, Eye, MousePointerClick, TrendingUp } from 'lucide-react';

const SUMMARY = [
  { icon: Users, label: '独立访客', value: '2,438', trend: '+8.2% 环比', color: 'blue' },
  { icon: Eye, label: '页面浏览量', value: '9,164', trend: '+5.6% 环比', color: 'green' },
  { icon: MousePointerClick, label: '询盘表单提交', value: '37', trend: '+3 本周', color: 'purple' },
  { icon: TrendingUp, label: '平均停留时长', value: '2分14秒', trend: '+11s 环比', color: 'orange' },
] as const;

const TOP_PAGES = [
  { path: '/', views: 3120, share: 34 },
  { path: '/products/headlights-taillights', views: 1580, share: 17 },
  { path: '/products/braking-system', views: 1204, share: 13 },
  { path: '/contact.html', views: 986, share: 11 },
  { path: '/blog/led-headlight-installation-guide', views: 742, share: 8 },
];

const TRAFFIC_SOURCES = [
  { source: '自然搜索 (Organic Search)', pct: 46, color: 'bg-blue-500' },
  { source: '直接访问 (Direct)', pct: 28, color: 'bg-green-500' },
  { source: 'B2B 平台引荐 (Alibaba/1688)', pct: 15, color: 'bg-purple-500' },
  { source: '社交媒体 (Social)', pct: 7, color: 'bg-orange-500' },
  { source: '其他', pct: 4, color: 'bg-slate-400' },
];

function colorClasses(color: string) {
  const map: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  };
  return map[color];
}

function TrafficAnalyticsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [range] = useState('近 30 天');

  const handleLogout = async () => { await logout(); router.push('/login'); };

  if (!user) return null;

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">流量分析</h1>
          <p className="text-sm text-slate-500 mt-1">数据周期：{range}</p>
        </div>
      </div>

      <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        以下数据为演示数据，用于展示流量分析看板的交互形态；接入 Google Analytics 4 后将替换为真实数据。
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {SUMMARY.map((item) => (
          <div key={item.label} className={`rounded-lg border p-6 ${colorClasses(item.color)}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium opacity-75">{item.label}</p>
                <p className="text-3xl font-bold mt-2">{item.value}</p>
                <p className="text-xs mt-2 opacity-75">{item.trend}</p>
              </div>
              <item.icon className="w-8 h-8 opacity-25" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">热门页面</h2>
          <div className="space-y-3">
            {TOP_PAGES.map((page) => (
              <div key={page.path}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-mono text-slate-700 truncate">{page.path}</span>
                  <span className="text-slate-500 flex-shrink-0 ml-2">{page.views.toLocaleString()} 次</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${page.share * 2}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">流量来源</h2>
          <div className="space-y-3">
            {TRAFFIC_SOURCES.map((s) => (
              <div key={s.source}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-700">{s.source}</span>
                  <span className="text-slate-500">{s.pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(TrafficAnalyticsPage);
