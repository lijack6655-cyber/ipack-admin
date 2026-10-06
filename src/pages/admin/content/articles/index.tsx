import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FileText, Plus, Search } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { useAuthStore } from '@/lib/auth/store';
import { hasPermission } from '@/lib/auth/permissions';
import { articleRequest } from '@/lib/articles/client';
import { filterArticleCollection, type ArticleCollection, type ArticleListItem } from '@/lib/articles/model';

const labels = { published: ['已发布', 'bg-green-100 text-green-700'], draft: ['内容草稿', 'bg-yellow-100 text-yellow-700'], archived: ['已归档', 'bg-slate-100 text-slate-500'] } as const;
const libraryTabs: { key: ArticleCollection; label: string }[] = [
  { key: 'draft', label: '内容草稿' }, { key: 'pending', label: '待发布修改' }, { key: 'archived', label: '已归档' },
];

function ArticlesPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [search, setSearch] = useState('');
  const [collection, setCollection] = useState<ArticleCollection>('draft');
  const [pendingOnly, setPendingOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const draftLibrary = router.pathname.endsWith('/drafts');
  const canWrite = hasPermission(user?.role?.name, 'CONTENT_WRITE');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const result = await articleRequest<{ articles: ArticleListItem[] }>('/api/admin/articles'); setArticles(result.articles); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : '读取失败'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const counts = useMemo(() => ({
    published: filterArticleCollection(articles, 'published', '').length,
    draft: filterArticleCollection(articles, 'draft', '').length,
    pending: filterArticleCollection(articles, 'pending', '').length,
    archived: filterArticleCollection(articles, 'archived', '').length,
  }), [articles]);
  const visible = useMemo(() => draftLibrary
    ? filterArticleCollection(articles, collection, search)
    : filterArticleCollection(articles, pendingOnly ? 'pending' : 'published', search), [articles, collection, draftLibrary, pendingOnly, search]);

  if (!user) return null;
  const createLink = <Link href="/admin/content/articles/new" className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" />新建文章</Link>;
  return <AdminLayout user={user} onLogout={async () => { await logout(); await router.push('/login'); }}>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">{draftLibrary ? '内容草稿库' : '文章列表'}</h1><p className="mt-1 text-sm text-slate-500">{draftLibrary ? '草稿与待发布修改不会改变线上文章。' : '仅显示已发布文章；草稿保存后线上内容保持不变。'}</p></div>{canWrite && createLink}</div>
    {draftLibrary && <nav aria-label="文章状态" className="mb-4 flex flex-wrap gap-2">{libraryTabs.map(tab => <button key={tab.key} type="button" aria-pressed={collection === tab.key} onClick={() => setCollection(tab.key)} className={`rounded-lg border px-4 py-2 text-sm ${collection === tab.key ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'}`}>{tab.label}<span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs">{counts[tab.key]}</span></button>)}</nav>}
    <div className="mb-4 flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-white p-4"><div className="relative min-w-48 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="搜索文章标题、Slug 或草稿标题" className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm" placeholder="搜索标题、Slug 或草稿标题…" value={search} onChange={event => setSearch(event.target.value)} /></div>{!draftLibrary && <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={pendingOnly} onChange={event => setPendingOnly(event.target.checked)} />仅显示有待发布修改 <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{counts.pending}</span></label>}</div>
    {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><span>读取失败：{error}</span><button className="rounded border border-red-300 px-3 py-1.5" onClick={() => void load()}>重试</button></div>}
    {loading ? <div className="rounded-lg border bg-white p-10 text-center text-slate-500">正在读取真实数据…</div> : !error && <div className="space-y-3">{visible.map(article => {
      const legacy = article.source_type === 'front_blog_html';
      const status = article.status === 'archived' ? labels.archived : article.status === 'draft' ? labels.draft : labels.published;
      const title = (collection === 'pending' || collection === 'draft') && draftLibrary ? article.draft_title || article.title : article.title;
      const editable = canWrite && !legacy;
      return <div key={article.id} className="rounded-lg border border-slate-200 bg-white p-4"><div className="flex items-start gap-3"><FileText className="mt-1 h-5 w-5 shrink-0 text-slate-300" /><div className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${status[1]}`}>{status[0]}</span>{article.status === 'published' && article.has_draft && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">有待发布修改</span>}{article.category && <span className="text-xs text-slate-500">{article.category}</span>}<span className="text-xs text-slate-500">{legacy ? '旧静态文章 · 只读' : article.status === 'archived' ? '已归档' : article.draft_updated_at ? `草稿更新于 ${new Date(article.draft_updated_at).toLocaleString('zh-CN')}` : ''}</span></div><h2 className="font-medium text-slate-900">{title}</h2><p className="mt-1 text-xs text-slate-500">/{article.status === 'published' ? 'news' : 'draft'} / {article.slug}{article.verification_status ? ` · ${article.verification_status === 'verified' ? '已核验' : '待核验'}` : ''}</p>{editable && <Link className="mt-2 inline-block text-xs text-blue-600" href={`/admin/content/articles/${article.id}`}>{article.status === 'published' ? article.has_draft ? '编辑待发布修改' : '编辑文章' : '编辑草稿'}</Link>}{legacy && <Link className="mt-2 inline-block text-xs text-slate-600" href={`/admin/content/articles/${article.id}`}>查看详情</Link>}</div></div></div>;
    })}{!visible.length && <div className="rounded-lg border bg-white px-4 py-12 text-center text-slate-400">{search ? '暂无匹配文章' : draftLibrary && collection === 'draft' ? '暂无内容草稿' : draftLibrary && collection === 'pending' ? '暂无待发布修改' : draftLibrary ? '暂无已归档文章' : pendingOnly ? '暂无待发布修改' : '暂无已发布文章'}</div>}</div>}
  </AdminLayout>;
}

export default withAuth(ArticlesPage);
