import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { useAuthStore } from '@/lib/auth/store';
import { articleRequest } from '@/lib/articles/client';
import { articleInput, articlePublishIssues, emptyArticle, type ArticleInput } from '@/lib/articles/model';
import { inspectArticleBlocks, parseArticleBlocks, serializeArticleBlocks, type ArticleBlock } from '@/lib/articles/blocks';
import { renderMarkdown } from '@/lib/articles/markdown';

type ArticleRow = { id: string; title: string; slug: string; status: string; source_type: string | null; revision: number; has_draft?: boolean };
type Media = { id: string; path: string; name: string; width: number | null; height: number | null; bytes: number | null };
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
  const [media, setMedia] = useState<Media[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const [mediaPage, setMediaPage] = useState(0);
  const [moreMedia, setMoreMedia] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [inspection, setInspection] = useState<{ snapshot: string; errors: string[]; warnings: string[] } | null>(null);
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [module, setModule] = useState('paragraph');
  const [moduleText, setModuleText] = useState('');
  const [moduleLabel, setModuleLabel] = useState('');
  const [moduleUrl, setModuleUrl] = useState('');
  const [tableHeader, setTableHeader] = useState('Option\tDetails');
  const [tableRows, setTableRows] = useState('Product A\tAdd comparison details');
  const [visualBlocks, setVisualBlocks] = useState<ArticleBlock[]>([]);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef<{ start: number; end: number } | null>(null);
  const bypass = useRef(false);
  const dirty = JSON.stringify(form) !== snapshot;
  const missing = articlePublishIssues(form);
  const formSnapshot = JSON.stringify(form);
  const blocks = visualBlocks;
  const bodyPreview = renderMarkdown(form.content_markdown, mediaUrls);
  const legacy = article?.source_type === 'front_blog_html';

  const load = useCallback(async () => {
    if (!articleId) return;
    setLoading(true); setError('');
    try {
      const result = await articleRequest<{ article: ArticleRow; draft: ArticleInput | null; form: ArticleInput; image_urls: Record<string, string> }>(`/api/admin/articles/${articleId}`);
      setArticle(result.article); setForm(result.form); setVisualBlocks(parseArticleBlocks(result.form.content_markdown)); setSnapshot(JSON.stringify(result.form)); setHasDraft(Boolean(result.draft));
      setMediaUrls(previous => ({ ...previous, ...result.image_urls }));
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : '读取失败'); }
    finally { setLoading(false); }
  }, [articleId]);

  useEffect(() => { if (!articleId) return; const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [articleId, load]);
  const loadMedia = useCallback(async (page = 0) => {
    try {
      setMediaError('');
      const result = await articleRequest<{ media: Media[]; image_urls: Record<string, string>; has_more: boolean }>(`/api/admin/article-media?page=${page}`);
      setMedia(result.media);
      setMediaUrls(previous => ({ ...previous, ...result.image_urls })); setMediaPage(page); setMoreMedia(result.has_more);
    } catch (loadError) { setMediaError(loadError instanceof Error ? loadError.message : '图片库读取失败'); }
  }, []);
  // Fetching synchronizes the editor with the server and populates the optional image picker.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadMedia(); }, [loadMedia]);
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    const leave = () => { if (dirty && !bypass.current && !window.confirm('还有未保存的修改，确定离开吗？')) { router.events.emit('routeChangeError'); throw new Error('Navigation cancelled to preserve article edits'); } };
    window.addEventListener('beforeunload', unload); router.events.on('routeChangeStart', leave);
    return () => { window.removeEventListener('beforeunload', unload); router.events.off('routeChangeStart', leave); };
  }, [dirty, router.events]);

  const change = <K extends keyof ArticleInput>(key: K, value: ArticleInput[K]) => { setForm(previous => ({ ...previous, [key]: value })); if (key === 'content_markdown') setVisualBlocks(parseArticleBlocks(String(value))); setNotice(''); setError(''); setPreview(''); setInspection(null); };
  const updateBlocks = (next: ArticleBlock[]) => { setVisualBlocks(next); setForm(previous => ({ ...previous, content_markdown: serializeArticleBlocks(next) })); setNotice(''); setError(''); setPreview(''); setInspection(null); };
  const updateBlock = (index: number, patch: Partial<ArticleBlock>) => updateBlocks(blocks.map((block, itemIndex) => itemIndex === index ? { ...block, ...patch, source: undefined } as ArticleBlock : block));
  const moveBlock = (index: number, direction: -1 | 1) => { const target = index + direction; if (target < 0 || target >= blocks.length) return; const next = [...blocks]; [next[index], next[target]] = [next[target], next[index]]; updateBlocks(next); };
  const addBlock = () => updateBlocks([...blocks, { type: 'paragraph', text: '在此输入内容' }]);
  const runInspection = () => {
    const base = articleInput.safeParse(form), blockResult = inspectArticleBlocks(blocks);
    const errors = [...missing, ...(!base.success ? base.error.issues.map(issue => issue.message) : []), ...blockResult.errors];
    const uniqueErrors = [...new Set(errors)]; setInspection({ snapshot: formSnapshot, errors: uniqueErrors, warnings: blockResult.warnings });
    setError(''); setNotice(uniqueErrors.length ? `检测发现 ${uniqueErrors.length} 项需要处理` : '检测通过，未发现阻断问题');
  };
  const insertMarkdown = (value: string) => {
    const area = bodyRef.current, start = selectionRef.current?.start ?? form.content_markdown.length;
    const before = form.content_markdown.slice(0, start), after = form.content_markdown.slice(start);
    const prefix = before && !before.endsWith('\n\n') ? before.endsWith('\n') ? '\n' : '\n\n' : '';
    const suffix = after && !after.startsWith('\n\n') ? after.startsWith('\n') ? '\n' : '\n\n' : '';
    const inserted = `${prefix}${value}${suffix}`;
    const next = `${before}${inserted}${after}`;
    change('content_markdown', next);
    const caret = start + inserted.length;
    selectionRef.current = { start: caret, end: caret };
    requestAnimationFrame(() => { area?.focus(); area?.setSelectionRange(caret, caret); });
  };
  const insertBold = () => {
    const start = selectionRef.current?.start ?? form.content_markdown.length, end = selectionRef.current?.end ?? start;
    const selected = form.content_markdown.slice(start, end), insertion = selected ? `**${selected}**` : '****';
    change('content_markdown', `${form.content_markdown.slice(0, start)}${insertion}${form.content_markdown.slice(end)}`);
    const caret = selected ? start + insertion.length : start + 2;
    selectionRef.current = { start: caret, end: caret };
    requestAnimationFrame(() => { bodyRef.current?.focus(); bodyRef.current?.setSelectionRange(caret, caret); });
  };
  const insertModule = () => {
    const text = moduleText.trim() || '在此输入内容';
    const snippet = module === 'h2' ? `## ${text}\n\n` : module === 'h3' ? `### ${text}\n\n`
      : module === 'list' ? `${text.split('\n').map(line => `- ${line}`).join('\n')}\n\n`
        : module === 'table' ? `${[tableHeader, ...tableRows.split('\n')].map((row, index) => `| ${row.split('\t').map(cell => cell.trim().replace(/\|/g, '/')).join(' | ')} |${index === 0 ? `\n| ${tableHeader.split('\t').map(() => '---').join(' | ')} |` : ''}`).join('\n')}\n\n`
              : module === 'quote' ? `> ${text.replace(/\n/g, '\n> ')}\n\n`
            : module === 'tip' ? `:::tip\n${text}\n:::\n\n`
              : module === 'faq' ? `:::faq\nQ: ${moduleLabel || '问题'}\nA: ${text}\n:::\n\n`
                : module === 'cta' ? `:::cta\n[${moduleLabel || '了解更多'}](${moduleUrl || '/contact'})\n:::\n\n`
                  : module === 'video' ? `:::video\n${text}\n:::\n\n` : `${text}\n\n`;
    insertMarkdown(snippet);
  };
  const uploadImage = async (file?: File, asFeatured = false) => {
    if (!file || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 3 * 1024 * 1024) throw new Error('请选择不超过 3 MB 的 JPG、PNG 或 WebP 图片');
      const result = await articleRequest<{ media: Media; image_urls: Record<string, string> }>('/api/admin/article-media', { method: 'POST', headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) }, body: file });
      setMedia(previous => [result.media, ...previous.filter(item => item.id !== result.media.id)]); setMediaUrls(previous => ({ ...previous, ...result.image_urls }));
      if (asFeatured) change('featured_image_path', result.media.path);
      else insertImage(result.media);
      setNotice('图片已上传到文章图片库。');
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : '图片上传失败'); }
    finally { setBusy(false); }
  };
  const insertImage = (item: Media) => {
    const imageAlt = (alt.trim() || item.name).replace(/[\]\r\n]/g, ' ');
    const title = caption.trim().replace(/["\r\n]/g, ' ');
    insertMarkdown(`![${imageAlt}](${item.path}${title ? ` "${title}"` : ''})\n\n`);
  };
  const action = async (kind: 'save' | 'preview' | 'publish') => {
    setBusy(true); setError(''); setNotice('');
    try {
      if (legacy) throw new Error('旧前台静态文章未迁移，暂不能在此编辑；请新建 CMS 文章。');
      if (kind === 'save') {
        const parsed = articleInput.safeParse(form);
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      }
      if (kind === 'publish' && (dirty || !hasDraft)) throw new Error('请先保存草稿，再预览并发布。');
      if (kind === 'publish' && (!inspection || inspection.snapshot !== formSnapshot || inspection.errors.length > 0)) throw new Error('请先点击“检测”，并处理检测发现的问题。');
      const result = await articleRequest<{ id: string; revision: number; status: string; slug: string; html?: string }>(`/api/admin/articles${article?.id ? `/${article.id}` : ''}`, {
        method: 'POST', body: JSON.stringify({ action: kind, revision: article?.revision || 0, ...(kind === 'save' ? { data: form } : {}) }),
      });
      if (kind === 'preview') { setPreview(result.html || ''); return; }
      if (kind === 'save') {
        setHasDraft(true); setSnapshot(formSnapshot);
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
      <div><h1 className="text-2xl font-bold">{articleId ? '编辑文章' : '新建文章'}</h1><p className="text-sm text-slate-500 mt-1">草稿、预览和发布统一写入文章 CMS。正文支持可视化模块，Markdown 仍可直接编辑。</p><p className={`mt-1 text-xs ${dirty ? 'text-amber-700' : 'text-green-700'}`}>{dirty ? '当前修改未保存' : '当前内容已保存'}</p></div>
      <div className="flex flex-wrap gap-2"><button className={button} onClick={() => router.push('/admin/content/articles')}>返回文章列表</button><button className={button} disabled={busy || legacy} onClick={() => void action('save')}>保存草稿</button><button className={button} disabled={busy || legacy || dirty || !hasDraft} onClick={() => void action('preview')}>{dirty ? '保存后预览' : '预览草稿'}</button><button className={button} disabled={busy || legacy} onClick={runInspection}>检测</button><button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40" disabled={busy || legacy || dirty || !hasDraft || !inspection || inspection.snapshot !== formSnapshot || inspection.errors.length > 0} onClick={() => void action('publish')}>发布文章</button></div>
    </div>
    {legacy && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">该记录来自旧前台静态文章（front_blog_html），暂不允许直接编辑；新建 CMS 文章会发布到 /news/。</div>}
    {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
    {notice && <div role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">{notice}</div>}
    {loading ? <p>正在读取文章…</p> : <fieldset disabled={busy || Boolean(articleId && !article) || legacy} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
      <div className="space-y-5"><section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"><label className="block text-sm font-medium">标题<input className={`${field} mt-1 text-lg`} value={form.title} onChange={e => change('title', e.target.value)} /></label><label className="block text-sm font-medium">Slug（发布后固定）<input className={`${field} mt-1 font-mono`} value={form.slug} onChange={e => change('slug', e.target.value)} placeholder="automechanika-shanghai-2025" /></label><label className="block text-sm font-medium">摘要<textarea className={`${field} mt-1`} rows={3} value={form.excerpt} onChange={e => change('excerpt', e.target.value)} /></label></section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div><h2 className="font-semibold">文章正文</h2><p className="text-xs text-slate-500 mt-1">用模块快速插入结构，也可以直接编辑下方 Markdown。</p></div>
          <div className="grid gap-3 sm:grid-cols-[150px_1fr_auto]">
            <select aria-label="内容模块" className={field} value={module} onChange={e => setModule(e.target.value)}><option value="paragraph">段落</option><option value="h2">二级标题</option><option value="h3">三级标题</option><option value="list">列表</option><option value="table">对比表格</option><option value="tip">提示框</option><option value="quote">引用</option><option value="faq">FAQ</option><option value="cta">导购链接</option><option value="video">视频地址</option></select>
            {['faq', 'cta'].includes(module) ? <input className={field} aria-label={module === 'faq' ? 'FAQ问题' : '按钮文字'} placeholder={module === 'faq' ? '输入问题' : '例如：查看产品目录'} value={moduleLabel} onChange={e => setModuleLabel(e.target.value)} /> : <span className="self-center text-sm text-slate-500">{module === 'table' ? '用制表符分隔单元格' : '填写模块内容后插入'}</span>}
            <button type="button" className={button} onClick={insertModule}>{module === 'table' ? '插入表格' : module === 'cta' ? '插入链接' : module === 'faq' ? '插入 FAQ' : module === 'video' ? '插入视频' : '插入模块'}</button>
          </div>
          {module === 'table' && <div className="space-y-2"><label className="block text-sm">表头<textarea className={`${field} mt-1`} rows={2} value={tableHeader} onChange={e => setTableHeader(e.target.value)} /></label><label className="block text-sm">表格内容（每行一条，单元格用 Tab 分隔）<textarea className={`${field} mt-1`} rows={3} value={tableRows} onChange={e => setTableRows(e.target.value)} /></label></div>}
          {module === 'cta' && <label className="block text-sm">链接地址<input className={`${field} mt-1`} aria-label="导购链接地址" placeholder="站内路径或 HTTPS 地址，例如 /product" value={moduleUrl} onChange={e => setModuleUrl(e.target.value)} /></label>}
          {module === 'faq' && <label className="block text-sm">回答<textarea className={`${field} mt-1`} aria-label="FAQ回答" rows={3} placeholder="输入回答" value={moduleText} onChange={e => setModuleText(e.target.value)} /></label>}
          {['paragraph', 'h2', 'h3', 'list', 'tip', 'quote', 'video'].includes(module) && <label className="block text-sm">{module === 'list' ? '列表（每行一项）' : module === 'h2' ? '二级标题文字' : module === 'h3' ? '三级标题文字' : module === 'video' ? '视频 HTTPS MP4、YouTube 或 Vimeo 地址' : '模块内容'}<textarea className={`${field} mt-1`} rows={3} placeholder={module === 'h2' ? '输入二级标题' : module === 'h3' ? '输入三级标题' : module === 'list' ? '每行一项' : module === 'video' ? 'https://...' : '输入内容'} value={moduleText} onChange={e => setModuleText(e.target.value)} /></label>}
          <label className="block text-sm font-medium"><span>正文 Markdown</span><textarea ref={bodyRef} onSelect={e => { selectionRef.current = { start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd }; }} className={`${field} mt-1 font-mono`} rows={22} value={form.content_markdown} onChange={e => change('content_markdown', e.target.value)} placeholder={'## Exhibition Highlights\n\nParagraph text...\n\n- Buyer point one'} /></label>
          <button type="button" className={button} onClick={insertBold} aria-label="加粗所选文字">B · 加粗所选文字</button>
          <section className="rounded-lg border border-blue-100 bg-blue-50/40 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2"><div><h3 className="font-semibold">可视化内容模块</h3><p className="text-xs text-slate-500">已识别模块可直接编辑和调整顺序；未识别语法会保留为源码模块。</p></div><button type="button" className={button} onClick={addBlock}>添加文本模块</button></div>
            {blocks.length === 0 && <p className="text-sm text-slate-500">还没有内容模块，请添加文本或直接编辑 Markdown。</p>}
            <div className="space-y-3">{blocks.map((block, index) => <div key={`${index}-${block.type}`} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-500">模块 {index + 1} · {block.type === 'raw' ? '保留源码' : block.type === 'video' ? '视频' : block.type === 'image' ? '图片' : block.type === 'table' ? '表格' : block.type === 'heading' ? '标题' : block.type === 'list' ? '列表' : block.type === 'quote' ? '引用' : block.type === 'tip' ? '提示' : block.type === 'faq' ? 'FAQ' : block.type === 'cta' ? '导购链接' : '文本'}</span><div className="flex gap-1"><button type="button" className="rounded border px-2 py-1 text-xs" disabled={index === 0} onClick={() => moveBlock(index, -1)}>上移</button><button type="button" className="rounded border px-2 py-1 text-xs" disabled={index === blocks.length - 1} onClick={() => moveBlock(index, 1)}>下移</button></div></div>
              {block.type === 'raw' && <pre className="max-h-28 overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-2 text-xs text-slate-600">{block.source}</pre>}
              {block.type === 'paragraph' && <textarea aria-label={`模块 ${index + 1} 文本`} className={`${field} text-sm`} rows={3} value={block.text} onChange={e => updateBlock(index, { text: e.target.value })} />}
              {block.type === 'heading' && <input aria-label={`模块 ${index + 1} 标题`} className={field} value={block.text} onChange={e => updateBlock(index, { text: e.target.value })} />}
              {block.type === 'list' && <textarea aria-label={`模块 ${index + 1} 列表`} className={`${field} text-sm`} rows={3} value={block.items.join('\n')} onChange={e => updateBlock(index, { items: e.target.value.split('\n') })} />}
              {block.type === 'quote' && <textarea aria-label={`模块 ${index + 1} 引用`} className={`${field} text-sm`} rows={3} value={block.text} onChange={e => updateBlock(index, { text: e.target.value })} />}
              {block.type === 'tip' && <textarea aria-label={`模块 ${index + 1} 提示`} className={`${field} text-sm`} rows={3} value={block.text} onChange={e => updateBlock(index, { text: e.target.value })} />}
              {block.type === 'image' && <div className="grid gap-2 sm:grid-cols-2"><input aria-label={`模块 ${index + 1} 图片地址`} className={field} value={block.src} onChange={e => updateBlock(index, { src: e.target.value })} placeholder="图片 HTTPS、/assets 或已上传地址" /><input aria-label={`模块 ${index + 1} 图片 Alt`} className={field} value={block.alt} onChange={e => updateBlock(index, { alt: e.target.value })} placeholder="图片 Alt" /><input aria-label={`模块 ${index + 1} 图片说明`} className={`${field} sm:col-span-2`} value={block.caption} onChange={e => updateBlock(index, { caption: e.target.value })} placeholder="图片说明（可选）" /></div>}
              {block.type === 'table' && <div className="space-y-2"><p className="text-xs text-slate-500">每个单元格单独编辑，空格和内容会保留。</p><div className="overflow-x-auto"><div className="grid min-w-[520px] gap-2" style={{ gridTemplateColumns: `repeat(${Math.max(block.headers.length, 1)}, minmax(120px, 1fr))` }}>{block.headers.map((header, columnIndex) => <input key={`head-${columnIndex}`} aria-label={`模块 ${index + 1} 第 ${columnIndex + 1} 列标题`} className={`${field} font-semibold`} value={header} onChange={e => updateBlock(index, { headers: block.headers.map((item, itemIndex) => itemIndex === columnIndex ? e.target.value : item) })} placeholder={`列 ${columnIndex + 1}`} />)}{block.rows.map((row, rowIndex) => block.headers.map((_, columnIndex) => <input key={`cell-${rowIndex}-${columnIndex}`} aria-label={`模块 ${index + 1} 第 ${rowIndex + 1} 行第 ${columnIndex + 1} 列`} className={field} value={row[columnIndex] || ''} onChange={e => updateBlock(index, { rows: block.rows.map((item, itemIndex) => itemIndex === rowIndex ? item.map((cell, cellIndex) => cellIndex === columnIndex ? e.target.value : cell) : item) })} placeholder="单元格内容" />))}</div></div><div className="flex gap-2"><button type="button" className={button} onClick={() => updateBlock(index, { rows: [...block.rows, block.headers.map(() => '')] })}>添加一行</button><button type="button" className={button} onClick={() => updateBlock(index, { headers: [...block.headers, '新列'], rows: block.rows.map(row => [...row, '']) })}>添加一列</button></div></div>}
              {block.type === 'faq' && <div className="space-y-2"><input aria-label={`模块 ${index + 1} 问题`} className={field} value={block.question} onChange={e => updateBlock(index, { question: e.target.value })} placeholder="问题" /><textarea aria-label={`模块 ${index + 1} 回答`} className={`${field} text-sm`} rows={3} value={block.answer} onChange={e => updateBlock(index, { answer: e.target.value })} placeholder="回答" /></div>}
              {block.type === 'cta' && <div className="grid gap-2 sm:grid-cols-2"><input aria-label={`模块 ${index + 1} 按钮文字`} className={field} value={block.label} onChange={e => updateBlock(index, { label: e.target.value })} placeholder="按钮文字" /><input aria-label={`模块 ${index + 1} 导购地址`} className={field} value={block.url} onChange={e => updateBlock(index, { url: e.target.value })} placeholder="站内路径或 HTTPS 地址" /></div>}
              {block.type === 'video' && <div><input aria-label={`模块 ${index + 1} 视频地址`} className={field} value={block.src} onChange={e => updateBlock(index, { src: e.target.value })} placeholder="HTTPS MP4、YouTube 或 Vimeo 地址" /><p className="mt-1 text-xs text-slate-500">支持 HTTPS MP4、YouTube 或 Vimeo；当前不提供本地视频上传，也不接受任意 iframe。</p></div>}
            </div>)}</div>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-4"><div className="mb-2 flex items-center justify-between"><h3 className="font-semibold">正文即时预览</h3><span className="text-xs text-slate-500">当前编辑内容</span></div><div className="prose max-w-none overflow-x-auto text-sm [&_img]:max-h-72 [&_img]:max-w-full [&_img]:rounded-lg [&_table]:border-collapse [&_td]:border [&_td]:border-slate-300 [&_td]:px-2 [&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-50 [&_th]:px-2 [&_video]:max-w-full [&_iframe]:min-h-[300px] [&_iframe]:w-full" dangerouslySetInnerHTML={{ __html: bodyPreview || '<p class="text-slate-400">输入正文后将在此显示排版效果。</p>' }} /></section>
        </section></div>
      <aside className="space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <h2 className="font-semibold">发布信息</h2>
          <label className="block text-sm">分类<input className={`${field} mt-1`} value={form.category} onChange={e => change('category', e.target.value)} /></label>
          <label className="block text-sm">作者<input className={`${field} mt-1`} value={form.author_name} onChange={e => change('author_name', e.target.value)} /></label>
          <div className="space-y-2"><label className="block text-sm">主图上传 / 图片库</label><input aria-label="上传文章主图" className="block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => { void uploadImage(e.target.files?.[0], true); e.target.value = ''; }} /><div className="flex gap-2"><input className={`${field} min-w-0 flex-1`} aria-label="主图 HTTPS 或兼容路径" value={form.featured_image_path} onChange={e => change('featured_image_path', e.target.value)} placeholder="选择上传图片，或保留 HTTPS /assets 路径" /><button type="button" className={button} disabled={!form.featured_image_path} onClick={() => change('featured_image_path', '')}>移除</button></div>{form.featured_image_path && mediaUrls[form.featured_image_path] && <img className="max-h-40 max-w-full rounded-lg object-contain" src={mediaUrls[form.featured_image_path]} alt="文章主图预览" />}</div>
          <p className="text-sm font-medium">正文图片 · Alt 与说明</p><input className={field} aria-label="正文图片替代文字" placeholder="替代文字（Alt）" value={alt} onChange={e => setAlt(e.target.value)} /><input className={field} aria-label="正文图片说明" placeholder="图片说明（可选）" value={caption} onChange={e => setCaption(e.target.value)} /><input aria-label="上传正文图片" className="block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => { void uploadImage(e.target.files?.[0]); e.target.value = ''; }} />
          <p className="text-xs text-slate-500">JPG、PNG、WebP，每张不超过 3 MB；自动优化尺寸。移除主图或正文引用不会删除图库素材。正文上传成功后会自动插入当前位置。</p>
          <p className="text-sm font-medium">可选图片库 · 第 {mediaPage + 1} 组</p>
          {mediaError && <div role="alert" className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">{mediaError}<button type="button" className="ml-2 underline" onClick={() => void loadMedia(mediaPage)}>重试</button></div>}
          <div className="grid max-h-80 grid-cols-3 gap-2 overflow-y-auto">{media.map(item => <div key={item.id} className="min-w-0 rounded border p-1"><img className="aspect-square w-full object-contain" src={mediaUrls[item.path]} alt={item.name} /><button type="button" className="mt-1 w-full truncate text-xs text-blue-700" onClick={() => change('featured_image_path', item.path)}>设为主图 · {item.name}</button><button type="button" className="w-full truncate text-xs text-indigo-700" onClick={() => insertImage(item)}>插入正文</button></div>)}</div>
          {mediaPage > 0 && <button type="button" className={`${button} w-full`} onClick={() => void loadMedia(mediaPage - 1)}>上一组图片</button>}{moreMedia && <button type="button" className={`${button} w-full`} onClick={() => void loadMedia(mediaPage + 1)}>更多图片</button>}
          <p className="text-xs text-slate-500">文章地址：/news/{form.slug || 'article-slug'}</p>{missing.length > 0 && <p className="text-xs text-amber-700">保存前待补充：{missing.join('、')}</p>}
          {inspection && <div role="status" className={`rounded-lg border p-3 text-sm ${inspection.errors.length ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`}><strong>{inspection.errors.length ? `检测发现 ${inspection.errors.length} 项需要处理` : '检测通过，未发现阻断问题'}</strong>{inspection.errors.length > 0 && <ul className="mt-2 list-disc pl-5">{inspection.errors.map(item => <li key={item}>{item}</li>)}</ul>}{inspection.warnings.length > 0 && <><p className="mt-2 font-medium">建议优化</p><ul className="list-disc pl-5">{inspection.warnings.map(item => <li key={item}>{item}</li>)}</ul></>}</div>}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"><h2 className="font-semibold">SEO</h2><label className="block text-sm">SEO 标题<input className={`${field} mt-1`} value={form.seo_title} onChange={e => change('seo_title', e.target.value)} /></label><label className="block text-sm">SEO 描述<textarea className={`${field} mt-1`} rows={4} value={form.seo_description} onChange={e => change('seo_description', e.target.value)} /></label></section>
      </aside>
    </fieldset>}
    {preview && <div role="dialog" aria-modal="true" aria-label="文章草稿预览" className="fixed inset-0 z-50 flex bg-slate-900/60 p-3 md:p-6"><div className="flex min-w-0 flex-1 flex-col rounded-xl bg-white"><div className="flex items-center justify-between p-3"><strong>文章草稿预览</strong><button className={button} onClick={() => setPreview('')}>关闭预览</button></div><iframe title="文章草稿预览" sandbox="" srcDoc={preview} className="w-full flex-1 border-0" /></div></div>}
  </AdminLayout>;
}

export default withAuth(ArticleEditor);
