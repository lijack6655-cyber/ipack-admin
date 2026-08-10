import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FileText, Plus, Search } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { useAuthStore } from '@/lib/auth/store';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Database } from '@/types/database';

type Article = Database['public']['Tables']['articles']['Row'];
type ArticleStatus = Database['public']['Enums']['content_status'];

const STATUS_LABELS: Record<ArticleStatus, { label: string; cls: string }> = {
  published: { label: '已发布', cls: 'bg-green-100 text-green-700' },
  draft: { label: '草稿', cls: 'bg-yellow-100 text-yellow-700' },
  archived: { label: '已归档', cls: 'bg-slate-100 text-slate-500' },
};

function ArticlesPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ArticleStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getSupabaseBrowserClient()
      .from('articles')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false })
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setError(queryError.message);
        else setArticles(data ?? []);
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => articles.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (statusFilter === 'all' || article.status === statusFilter);
  }), [articles, search, statusFilter]);

  if (!user) return null;
  const handleLogout = async () => { await logout(); router.push('/login'); };

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">文章列表</h1>
          <p className="text-sm text-slate-500 mt-1">数据库共 {articles.length} 篇，正文未迁移时显示“待补充”</p>
        </div>
        <Link href="/admin/content/articles/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> 新建文章
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg" placeholder="搜索文章标题..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <select className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | ArticleStatus)}>
          <option value="all">全部状态</option><option value="published">已发布</option><option value="draft">草稿</option><option value="archived">已归档</option>
        </select>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">读取失败：{error}</div>}
      <div className="space-y-3">
        {loading ? <div className="bg-white rounded-lg border p-10 text-center text-slate-500">正在读取真实数据...</div> : filtered.map((article) => (
          <div key={article.id} className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-slate-300 mt-1" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[article.status].cls}`}>{STATUS_LABELS[article.status].label}</span>
                  <span className="text-xs text-slate-500">{article.category || '分类待补充'}</span>
                  <span className={`text-xs ${article.verification_status === 'verified' ? 'text-green-700' : 'text-amber-700'}`}>{article.verification_status === 'verified' ? '已核验' : '待核验'}</span>
                </div>
                <h2 className="font-medium text-slate-900">{article.title}</h2>
                <p className="text-xs text-slate-500 mt-1">作者：{article.author_name || '待补充'} · 正文：{article.content_html || article.content_markdown ? '已入库' : '待补充'}</p>
                {article.source_url && <a className="text-xs text-blue-600 mt-2 inline-block" href={article.source_url} target="_blank" rel="noreferrer">查看前台原文</a>}
              </div>
            </div>
          </div>
        ))}
        {!loading && filtered.length === 0 && <div className="bg-white rounded-lg border py-12 text-center text-slate-400">暂无匹配数据</div>}
      </div>
    </AdminLayout>
  );
}

export default withAuth(ArticlesPage);
