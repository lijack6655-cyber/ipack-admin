import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { Plus, Search, Edit2, Trash2, Eye, FileText } from 'lucide-react';

type ArticleStatus = 'published' | 'draft' | 'archived';

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  author: string;
  status: ArticleStatus;
  views: number;
  publishedAt: string;
}

const MOCK_ARTICLES: Article[] = [
  { id: '1', title: 'How to Replace Toyota Prius LED Headlights Step by Step', slug: 'replace-prius-led-headlights', category: 'Installation Guide', author: '李工', status: 'published', views: 1240, publishedAt: '2026-07-05' },
  { id: '2', title: 'Suzuki Swift Reversing Mirror Replacement Guide', slug: 'swift-mirror-replacement', category: 'Installation Guide', author: '王工', status: 'published', views: 860, publishedAt: '2026-07-03' },
  { id: '3', title: 'Top 5 Cooling System Parts for Toyota Prius 2015-2022', slug: 'prius-cooling-system-top5', category: 'Product Review', author: '编辑A', status: 'published', views: 520, publishedAt: '2026-07-01' },
  { id: '4', title: 'How to Choose the Right Brake Pads for Your Car', slug: 'choose-brake-pads', category: 'Buying Guide', author: '李工', status: 'draft', views: 0, publishedAt: '-' },
  { id: '5', title: 'OEM vs Aftermarket Auto Parts: What You Need to Know', slug: 'oem-vs-aftermarket', category: 'Buying Guide', author: '编辑B', status: 'published', views: 2100, publishedAt: '2026-06-28' },
  { id: '6', title: 'Common Suspension Problems and How to Fix Them', slug: 'suspension-problems-fix', category: 'Maintenance', author: '王工', status: 'draft', views: 0, publishedAt: '-' },
  { id: '7', title: 'Why Quality Auto Parts Matter for Your Safety', slug: 'quality-auto-parts-safety', category: 'Industry News', author: '编辑A', status: 'archived', views: 340, publishedAt: '2026-06-10' },
];

const STATUS_LABELS: Record<ArticleStatus, { label: string; cls: string }> = {
  published: { label: '已发布', cls: 'bg-green-100 text-green-700' },
  draft:     { label: '草稿',   cls: 'bg-yellow-100 text-yellow-700' },
  archived:  { label: '已归档', cls: 'bg-slate-100 text-slate-500' },
};

const ARTICLE_CATEGORIES = ['全部分类', 'Installation Guide', 'Product Review', 'Buying Guide', 'Maintenance', 'Industry News'];

function ArticlesPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部分类');
  const [statusFilter, setStatusFilter] = useState<'all' | ArticleStatus>('all');

  const handleLogout = async () => { await logout(); router.push('/login'); };

  const filtered = MOCK_ARTICLES.filter((a) => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === '全部分类' || a.category === category;
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  if (!user) return null;

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">文章列表</h1>
          <p className="text-sm text-slate-500 mt-1">共 {filtered.length} 篇文章</p>
        </div>
        <Link
          href="/admin/content/articles/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> 新建文章
        </Link>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="搜索文章标题..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {ARTICLE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="all">全部状态</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
          <option value="archived">已归档</option>
        </select>
      </div>

      {/* 文章卡片列表 */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 py-12 text-center text-slate-400">暂无文章数据</div>
        ) : filtered.map((article) => (
          <div key={article.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:border-blue-200 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <FileText className="w-5 h-5 text-slate-300 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[article.status].cls}`}>
                      {STATUS_LABELS[article.status].label}
                    </span>
                    <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{article.category}</span>
                  </div>
                  <h3 className="font-medium text-slate-900 truncate">{article.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    by {article.author} · {article.publishedAt}
                    {article.status === 'published' && <span className="ml-2">{article.views.toLocaleString()} 次阅读</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {article.status === 'published' && (
                  <button className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-colors" title="预览">
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                <Link
                  href={`/admin/content/articles/${article.id}/edit`}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-colors"
                  title="编辑"
                >
                  <Edit2 className="w-4 h-4" />
                </Link>
                <button className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors" title="删除">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}

export default withAuth(ArticlesPage);
