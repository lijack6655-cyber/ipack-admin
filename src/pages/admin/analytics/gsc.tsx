import React from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { Search, FileSearch, ExternalLink, Info } from 'lucide-react';

const GSC_OVERVIEW_URL = 'https://search.google.com/search-console?resource_id=https%3A%2F%2Fwww.ipackautoparts.com%2F';
const GSC_INDEX_URL = 'https://search.google.com/search-console/index?resource_id=https%3A%2F%2Fwww.ipackautoparts.com%2F';

const GSC_LINKS = [
  {
    title: '搜索效果与查询词',
    description: '从 GSC 概览进入“效果”，查看点击、展现、CTR、平均排名、热门查询词与页面。',
    href: GSC_OVERVIEW_URL,
    icon: Search,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    title: '网页索引编制',
    description: '查看已编入索引、未编入索引、重定向与已发现但尚未抓取的网页。',
    href: GSC_INDEX_URL,
    icon: FileSearch,
    className: 'bg-green-50 text-green-700 border-green-200',
  },
] as const;

function GscDataPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const handleLogout = async () => { await logout(); router.push('/login'); };

  if (!user) return null;

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Google Search Console</h1>
        <p className="text-sm text-slate-500 mt-1">打开 IPACK 已验证的网站资源，直接查看 Google 官方实时数据。</p>
      </div>

      <div className="mb-6 flex items-start gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p>搜索效果与网页索引是两类不同数据：前者反映自然搜索表现，后者反映 Google 是否发现并收录页面。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {GSC_LINKS.map((item) => (
          <a
            key={item.title}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`group rounded-lg border p-6 transition-shadow hover:shadow-md ${item.className}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <item.icon className="w-8 h-8 mb-4" />
                <h2 className="text-lg font-bold">{item.title}</h2>
                <p className="text-sm mt-2 opacity-80 leading-6">{item.description}</p>
              </div>
              <ExternalLink className="w-5 h-5 flex-shrink-0 opacity-60 group-hover:opacity-100" />
            </div>
            <span className="inline-flex items-center gap-2 mt-5 text-sm font-semibold">在 GSC 中查看</span>
          </a>
        ))}
      </div>
    </AdminLayout>
  );
}

export default withAuth(GscDataPage);
