import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { BarChart3, Search, MessageSquareText, ExternalLink, ArrowRight } from 'lucide-react';

const GA4_URL = 'https://analytics.google.com/analytics/web/#/a404264901p549457075/reports/intelligenthome?params=_u..nav%3Dmaui&collectionId=business-objectives';
const GSC_URL = 'https://search.google.com/search-console?resource_id=https%3A%2F%2Fwww.ipackautoparts.com%2F';

const EXTERNAL_TOOLS = [
  {
    title: 'Google Analytics 4',
    description: '查看活跃用户、页面浏览、流量来源、互动时长与转化事件。',
    href: GA4_URL,
    icon: BarChart3,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    title: 'Google Search Console',
    description: '查看自然搜索点击、展现、查询词、平均排名与网页索引状态。',
    href: GSC_URL,
    icon: Search,
    className: 'bg-green-50 text-green-700 border-green-200',
  },
] as const;

function TrafficAnalyticsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const handleLogout = async () => { await logout(); router.push('/login'); };

  if (!user) return null;

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">数据分析</h1>
        <p className="text-sm text-slate-500 mt-1">通过官方后台查看实时数据，不在本站保存 Google 账号或 API 密钥。</p>
      </div>

      <div className="mb-6 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        当前采用官方平台跳转方案，无需 Google Cloud。Google 数据以 GA4 与 GSC 官方后台为准，询盘以 Supabase 业务数据为准。
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {EXTERNAL_TOOLS.map((tool) => (
          <a
            key={tool.title}
            href={tool.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`group rounded-lg border p-6 transition-shadow hover:shadow-md ${tool.className}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <tool.icon className="w-8 h-8 mb-4" />
                <h2 className="text-lg font-bold">{tool.title}</h2>
                <p className="text-sm mt-2 opacity-80 leading-6">{tool.description}</p>
              </div>
              <ExternalLink className="w-5 h-5 flex-shrink-0 opacity-60 group-hover:opacity-100" />
            </div>
            <span className="inline-flex items-center gap-2 mt-5 text-sm font-semibold">打开官方后台 <ArrowRight className="w-4 h-4" /></span>
          </a>
        ))}
      </div>

      <Link href="/admin/inquiries" className="group flex items-center justify-between gap-4 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg p-6 transition-shadow hover:shadow-md">
        <div className="flex items-start gap-4">
          <MessageSquareText className="w-8 h-8 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-bold">真实询盘数据</h2>
            <p className="text-sm mt-2 opacity-80">进入询盘管理，查看 Supabase 中实际提交的 RFQ 记录与跟进状态。</p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </AdminLayout>
  );
}

export default withAuth(TrafficAnalyticsPage);
