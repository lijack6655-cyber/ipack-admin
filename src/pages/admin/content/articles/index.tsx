import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FileText, Plus, Search } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { useAuthStore } from '@/lib/auth/store';
import { articleRequest } from '@/lib/articles/client';

type Article = { id: string; title: string; slug: string; category: string | null; status: 'published' | 'draft' | 'archived'; source_type: string | null; verification_status: string; revision: number; has_draft: boolean };
const labels = { published: ['已发布', 'bg-green-100 text-green-700'], draft: ['草稿', 'bg-yellow-100 text-yellow-700'], archived: ['已归档', 'bg-slate-100 text-slate-500'] } as const;

function ArticlesPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | Article['status']>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { articleRequest<{ articles: Article[] }>('/api/admin/articles').then(result => setArticles(result.articles)).catch(loadError => setError(loadError instanceof Error ? loadError.message : '读取失败')).finally(() => setLoading(false)); }, []);
  const filtered = useMemo(() => articles.filter(article => article.title.toLowerCase().includes(search.toLowerCase()) && (status === 'all' || article.status === status)), [articles, search, status]);
  if (!user) return null;
  return <AdminLayout user={user} onLogout={async () => { await logout(); await router.push('/login'); }}>
    <div className="mb-6 flex items-center justify-between"><div><h1 className="text-2xl font-bold">文章列表</h1><p className="mt-1 text-sm text-slate-500">旧 front_blog_html 文章只读；CMS 文章发布到 /news/。</p></div><Link href="/admin/content/articles/new" className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" />新建文章</Link></div>
    <div className="mb-4 flex gap-3 rounded-lg border border-slate-200 bg-white p-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm" placeholder="搜索文章标题…" value={search} onChange={event => setSearch(event.target.value)} /></div><select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={status} onChange={event => setStatus(event.target.value as typeof status)}><option value="all">全部状态</option><option value="published">已发布</option><option value="draft">草稿</option><option value="archived">已归档</option></select></div>
    {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">读取失败：{error}</div>}
    {loading ? <div className="rounded-lg border bg-white p-10 text-center text-slate-500">正在读取真实数据…</div> : <div className="space-y-3">{filtered.map(article => { const [label, cls] = labels[article.status]; const readonly = article.source_type === 'front_blog_html'; return <div key={article.id} className="rounded-lg border border-slate-200 bg-white p-4"><div className="flex items-start gap-3"><FileText className="mt-1 h-5 w-5 text-slate-300" /><div className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span><span className="text-xs text-slate-500">{article.category || '未分类'}</span><span className="text-xs text-slate-500">{readonly ? '旧静态文章' : article.has_draft ? '有待发布草稿' : article.verification_status === 'verified' ? '已核验' : '待核验'}</span></div><h2 className="font-medium text-slate-900">{article.title}</h2><p className="mt-1 text-xs text-slate-500">/{article.status === 'published' ? 'news' : 'draft'} / {article.slug}</p><Link className="mt-2 inline-block text-xs text-blue-600" href={`/admin/content/articles/${article.id}`}>{readonly ? '查看详情' : '编辑文章'}</Link></div></div></div>; })}{!filtered.length && <div className="rounded-lg border bg-white py-12 text-center text-slate-400">暂无匹配数据</div>}</div>}
  </AdminLayout>;
}

export default withAuth(ArticlesPage);
