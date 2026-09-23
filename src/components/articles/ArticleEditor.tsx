import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { useAuthStore } from '@/lib/auth/store';
import { articleRequest } from '@/lib/articles/client';
import { articleInput, articlePublishIssues, emptyArticle, type ArticleInput } from '@/lib/articles/model';

type ArticleRow = { id: string; title: string; slug: string; status: string; source_type: string | null; revision: number; has_draft?: boolean };
type Props = { articleId?: string };
const field = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none';
const button = 'rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40 hover:bg-slate-50';

function ArticleEditor({ articleId }: Props) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [article, setArticle] = useState<ArticleRow | null>(null);
  const [form, setForm] = useState<ArticleInput>(emptyArticle);
  const [snapshot, setSnapshot] = useState(JSON.stringify(emptyArticle));
  const [hasDraft, setHasDraft] = useState(false);
  const [loading, setLoading] = useState(Boolean(articleId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState('');
  const bypass = useRef(false);
  const dirty = JSON.stringify(form) !== snapshot;
  const missing = articlePublishIssues(form);
  const legacy = article?.source_type === 'front_blog_html';

  const load = useCallback(async () => {
    if (!articleId) return;
    setLoading(true); setError('');
    try {
      const result = await articleRequest<{ article: ArticleRow; draft: ArticleInput | null; form: ArticleInput }>(`/api/admin/articles/${articleId}`);
      setArticle(result.article); setForm(result.form); setSnapshot(JSON.stringify(result.form)); setHasDraft(Boolean(result.draft));
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : '读取失败'); }
    finally { setLoading(false); }
  }, [articleId]);

  useEffect(() => { if (!articleId) return; const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [articleId, load]);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    const leave = () => { if (dirty && !bypass.current && !window.confirm('还有未保存的修改，确定离开吗？')) { router.events.emit('routeChangeError'); throw new Error('Navigation cancelled to preserve article edits'); } };
    window.addEventListener('beforeunload', unload); router.events.on('routeChangeStart', leave);
    return () => { window.removeEventListener('beforeunload', unload); router.events.off('routeChangeStart', leave); };
  }, [dirty, router.events]);

  const change = <K extends keyof ArticleInput>(key: K, value: ArticleInput[K]) => { setForm(previous => ({ ...previous, [key]: value })); setNotice(''); setError(''); setPreview(''); };
  const action = async (kind: 'save' | 'preview' | 'publish') => {
    setBusy(true); setError(''); setNotice('');
    try {
      if (legacy) throw new Error('旧前台静态文章未迁移，暂不能在此编辑；请新建 CMS 文章。');
      if (kind === 'save') {
        const parsed = articleInput.safeParse(form);
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      }
      if (kind === 'publish' && (dirty || !hasDraft)) throw new Error('请先保存草稿，再预览并发布。');
      const result = await articleRequest<{ id: string; revision: number; status: string; slug: string; html?: string }>(`/api/admin/articles${article?.id ? `/${article.id}` : ''}`, {
        method: 'POST', body: JSON.stringify({ action: kind, revision: article?.revision || 0, ...(kind === 'save' ? { data: form } : {}) }),
      });
      if (kind === 'preview') { setPreview(result.html || ''); return; }
      if (kind === 'save') {
        setHasDraft(true); setSnapshot(JSON.stringify(form));
        if (!article?.id) { bypass.current = true; await router.replace(`/admin/content/articles/${result.id}`); bypass.current = false; }
        else setArticle(previous => previous ? { ...previous, revision: result.revision, has_draft: true } : previous);
        setNotice('草稿已保存，线上内容未改变。');
      } else { bypass.current = true; await router.replace('/admin/content/articles'); }
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : '操作失败'); }
    finally { setBusy(false); }
  };

  if (!user) return null;
  return <AdminLayout user={user} onLogout={async () => { if (!dirty || window.confirm('未保存修改会丢失，确定退出吗？')) { bypass.current = true; await logout(); await router.push('/login'); } }}>
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div><h1 className="text-2xl font-bold">{articleId ? '编辑文章' : '新建文章'}</h1><p className="text-sm text-slate-500 mt-1">草稿、预览和发布统一写入文章 CMS。</p></div>
      <div className="flex flex-wrap gap-2"><button className={button} onClick={() => router.push('/admin/content/articles')}>返回文章列表</button><button className={button} disabled={busy || legacy} onClick={() => void action('save')}>保存草稿</button><button className={button} disabled={busy || legacy || dirty || !hasDraft} onClick={() => void action('preview')}>预览草稿</button><button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" disabled={busy || legacy || dirty || !hasDraft || missing.length > 0} onClick={() => void action('publish')}>发布文章</button></div>
    </div>
    {legacy && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">该记录来自旧前台静态文章（front_blog_html），暂不允许直接编辑；新建 CMS 文章会发布到 /news/。</div>}
    {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
    {notice && <div role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">{notice}</div>}
    {loading ? <p>正在读取文章…</p> : <fieldset disabled={busy || Boolean(articleId && !article)} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
      <div className="space-y-5"><section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"><label className="block text-sm font-medium">标题<input className={`${field} mt-1 text-lg`} value={form.title} onChange={e => change('title', e.target.value)} /></label><label className="block text-sm font-medium">Slug（发布后固定）<input className={`${field} mt-1 font-mono`} value={form.slug} onChange={e => change('slug', e.target.value)} placeholder="automechanika-shanghai-2025" /></label><label className="block text-sm font-medium">摘要<textarea className={`${field} mt-1`} rows={3} value={form.excerpt} onChange={e => change('excerpt', e.target.value)} /></label></section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"><label className="block text-sm font-medium">正文 Markdown<textarea className={`${field} mt-1 font-mono`} rows={22} value={form.content_markdown} onChange={e => change('content_markdown', e.target.value)} placeholder={'## Exhibition Highlights\n\nParagraph text...\n\n- Buyer point one'} /></label><p className="text-xs text-slate-500">支持段落、## 标题、无序列表和安全 HTTPS /assets 图片链接。</p></section></div>
      <aside className="space-y-5"><section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"><h2 className="font-semibold">发布信息</h2><label className="block text-sm">分类<input className={`${field} mt-1`} value={form.category} onChange={e => change('category', e.target.value)} /></label><label className="block text-sm">作者<input className={`${field} mt-1`} value={form.author_name} onChange={e => change('author_name', e.target.value)} /></label><label className="block text-sm">主图路径 / HTTPS URL<input className={`${field} mt-1`} value={form.featured_image_path} onChange={e => change('featured_image_path', e.target.value)} placeholder="/assets/images/automechanika-shanghai-2025.jpg" /></label><p className="text-xs text-slate-500">文章地址：/news/{form.slug || 'article-slug'}</p>{missing.length > 0 && <p className="text-xs text-amber-700">发布前待补充：{missing.join('、')}</p>}</section><section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"><h2 className="font-semibold">SEO</h2><label className="block text-sm">SEO 标题<input className={`${field} mt-1`} value={form.seo_title} onChange={e => change('seo_title', e.target.value)} /></label><label className="block text-sm">SEO 描述<textarea className={`${field} mt-1`} rows={4} value={form.seo_description} onChange={e => change('seo_description', e.target.value)} /></label></section></aside>
    </fieldset>}
    {preview && <div role="dialog" aria-modal="true" aria-label="文章草稿预览" className="fixed inset-0 z-50 flex bg-slate-900/60 p-3 md:p-6"><div className="flex min-w-0 flex-1 flex-col rounded-xl bg-white"><div className="flex items-center justify-between p-3"><strong>文章草稿预览</strong><button className={button} onClick={() => setPreview('')}>关闭预览</button></div><iframe title="文章草稿预览" sandbox="" srcDoc={preview} className="w-full flex-1 border-0" /></div></div>}
  </AdminLayout>;
}

export default withAuth(ArticleEditor);
