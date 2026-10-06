import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { useAuthStore } from '@/lib/auth/store';
import { hasPermission } from '@/lib/auth/permissions';
import { productRequest } from '@/lib/products/client';
import { categoryOptions,directoryMove } from '@/lib/products/categories';
import type { Tables } from '@/types/database';

type Category = Tables<'categories'> & { count:number };
type Product = { id:string;slug:string;title:string;status:string;category_id:string|null;revision:number;has_draft:boolean;draft_category_id:string|null };
const empty = { name:'',slug:'',parent_id:null as string|null,sort_order:0,description:'' };
const field = 'border rounded-lg px-3 py-2 text-sm w-full';
const button = 'border rounded-lg px-3 py-2 text-sm disabled:opacity-40';

function CategoriesPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [categories,setCategories] = useState<Category[]>([]),[products,setProducts] = useState<Product[]>([]);
  const [editing,setEditing] = useState<Category|null>(null),[form,setForm] = useState(empty);
  const [filter,setFilter] = useState(''),[target,setTarget] = useState(''),[selected,setSelected] = useState<string[]>([]),[search,setSearch] = useState('');
  const [move,setMove] = useState<ReturnType<typeof directoryMove>>(null);
  const confirmation = useRef<HTMLDivElement>(null);
  const [busy,setBusy] = useState(false),[loading,setLoading] = useState(true),[error,setError] = useState(''),[notice,setNotice] = useState('');
  const writable = hasPermission(user?.role?.name,'PRODUCT_WRITE');
  const locked = busy || Boolean(move);
  const options = categoryOptions(categories),roots = categories.filter(c => !c.parent_id);
  const load = useCallback(async () => {
    setLoading(true);setError('');setMove(null);
    try { const data=await productRequest('/api/admin/categories');setCategories(data.categories);setProducts(data.products);setSelected([]); }
    catch (error) { setError(error instanceof Error?error.message:'读取失败'); }
    finally { setLoading(false); }
  },[]);
  // Synchronize the directory and revision snapshots with the server.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{void load();},[load]);
  useEffect(()=>{if(move)confirmation.current?.focus();},[move]);
  const edit = (category:Category|null) => { setEditing(category);setForm(category?{name:category.name,slug:category.slug,parent_id:category.parent_id,sort_order:category.sort_order,description:category.description || ''}:empty); };
  const mutate = async (payload:unknown,message:string) => {
    setBusy(true);setError('');setNotice('');
    try { await productRequest('/api/admin/categories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});setNotice(message);edit(null);await load(); }
    catch (error) { setError(error instanceof Error?error.message:'操作失败'); }
    finally { setBusy(false); }
  };
  const relatedIds = filter ? [filter,...categories.filter(c => c.parent_id === filter).map(c => c.id)] : [];
  const visible = products.filter(p => (!filter || relatedIds.includes(p.category_id || '') || relatedIds.includes(p.draft_category_id || '')) && (!search || p.title.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search)));
  if (!user) return null;
  const handleLogout = async () => { await logout(); router.push('/login'); };
  return <AdminLayout user={user} onLogout={handleLogout}>
    <div className="flex flex-wrap justify-between gap-3 mb-6"><div><h1 className="text-2xl font-bold">产品目录管理</h1><p className="mt-2 text-sm text-slate-500">最多20个一级目录，每个一级目录最多20个二级目录。修改后直接同步前台。</p></div><Link className={button} href="/admin/products">返回产品列表</Link></div>
    {error&&<div role="alert" className="bg-red-50 text-red-800 p-4 mb-4">{error}<button disabled={busy} className="underline ml-3" onClick={()=>{if(!editing||window.confirm('重新载入将取消当前目录编辑，请先复制需要保留的内容。确定继续？')){edit(null);void load();}}}>重新载入目录和产品</button></div>}
    {notice&&<p role="status" className="bg-green-50 text-green-800 p-4 mb-4">{notice}</p>}
    {loading?<p>正在读取目录…</p>:<div className="space-y-6">
      <section className="bg-white border rounded-xl p-4 overflow-x-auto"><div className="flex items-center justify-between mb-3"><h2 className="font-semibold">目录树（一级 {roots.length}/20）</h2>{writable&&<button className={button} disabled={locked} onClick={()=>edit(null)}>新建目录</button>}</div>
        <table className="w-full text-sm"><thead><tr className="text-left"><th className="p-2">目录 / 公开地址</th><th className="p-2">排序</th><th className="p-2">已发布产品</th><th className="p-2">操作</th></tr></thead><tbody>{options.map(c=><tr key={c.id} className="border-t"><td className="p-2"><button disabled={locked} className="text-blue-700 text-left" onClick={()=>{setFilter(c.id);setSelected([]);}}>{c.parent_id?'└ ':''}{c.name}</button><p className="text-xs text-slate-500 break-all">{c.slug}{!c.parent_id&&` · 二级 ${categories.filter(child=>child.parent_id===c.id).length}/20`}</p></td><td className="p-2">{c.sort_order}</td><td className="p-2">{c.count}{!c.parent_id&&`（含二级 ${c.count+categories.filter(child=>child.parent_id===c.id).reduce((n,child)=>n+child.count,0)}）`}</td><td className="p-2">{writable&&<div className="flex gap-2"><button className={button} disabled={locked} onClick={()=>edit(c)}>编辑</button><button className={button} disabled={locked} onClick={()=>{if(window.confirm(`删除目录“${c.name}”？有产品、保存草稿或子目录时无法删除。`))void mutate({action:'delete',id:c.id,revision:c.revision},'目录已删除。');}}>删除</button></div>}</td></tr>)}</tbody></table>
      </section>
      {writable&&<form className="bg-white border rounded-xl p-4 space-y-3" onSubmit={e=>{e.preventDefault();void mutate({action:'save',...(editing?{id:editing.id}:{}),revision:editing?.revision || 0,data:form},'目录已保存并同步前台。');}}><h2 className="font-semibold">{editing?`编辑：${editing.name}`:'新建目录'}</h2><fieldset disabled={locked} className="grid md:grid-cols-2 gap-3">
        <label className="text-sm"><span className="text-red-600">* </span>目录名称<input required maxLength={120} className={field} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
        <label className="text-sm"><span className="text-red-600">* </span>目录地址（Slug）<input required disabled={Boolean(editing)} maxLength={120} pattern="[a-z0-9]+(-[a-z0-9]+)*" className={field} value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})}/><span className="text-xs text-slate-500">使用英文小写、数字和短横线；创建后地址固定，重命名保留旧名称访问。</span></label>
        <label className="text-sm">上级目录<select className={field} value={form.parent_id || ''} onChange={e=>setForm({...form,parent_id:e.target.value || null})}><option value="">无（一级目录）</option>{roots.filter(c=>c.id!==editing?.id).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="text-sm">排序（越小越靠前）<input required type="number" min={0} max={9999} className={field} value={form.sort_order} onChange={e=>setForm({...form,sort_order:Number(e.target.value)})}/></label>
        <label className="text-sm md:col-span-2">描述<textarea maxLength={2000} className={field} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><div className="flex gap-2"><button className={`${button} bg-blue-600 text-white`} type="submit">保存目录</button>{editing&&<button type="button" className={button} onClick={()=>edit(null)}>取消编辑</button>}</div>
      </fieldset></form>}
      <section className="bg-white border rounded-xl p-4 space-y-4 overflow-x-auto"><h2 className="font-semibold">关联产品与调整归属</h2><fieldset disabled={locked} className="space-y-4"><div className="flex flex-wrap gap-3"><label className="text-sm">查看目录<select className={field} value={filter} onChange={e=>{setFilter(e.target.value);setSelected([]);}}><option value="">全部产品</option>{options.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label><label className="text-sm">搜索名称 / 产品ID<input className={field} value={search} onChange={e=>setSearch(e.target.value)}/></label></div>
        {writable&&<><p className="text-sm text-slate-600">移动仅修改当前产品及已保存草稿的目录，草稿其他内容保留，不会发布草稿；产品详情地址保持固定。</p><div className="flex flex-wrap items-end gap-3"><label className="text-sm">移动到<select className={field} value={target} onChange={e=>setTarget(e.target.value)}><option value="">选择目标目录</option>{options.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></label><button className={button} disabled={busy||!target||!selected.length} onClick={()=>setMove(directoryMove(products,selected,options.find(c=>c.id===target)))}>移动选中产品（{selected.length}）</button></div></>}
        <table className="w-full text-sm"><thead><tr className="text-left"><th className="p-2">{writable&&<input type="checkbox" aria-label="选择当前显示的全部产品" checked={visible.length>0&&visible.every(p=>selected.includes(p.id))} onChange={e=>setSelected(e.target.checked?visible.map(p=>p.id):[])} disabled={busy}/>}</th><th className="p-2">产品</th><th className="p-2">状态</th><th className="p-2">当前目录 / 保存草稿目录</th></tr></thead><tbody>{visible.map(p=><tr key={p.id} className="border-t"><td className="p-2">{writable&&<input type="checkbox" aria-label={`选择 ${p.title}`} disabled={busy} checked={selected.includes(p.id)} onChange={e=>setSelected(e.target.checked?[...selected,p.id]:selected.filter(id=>id!==p.id))}/>}</td><td className="p-2">{writable?<Link className="text-blue-700" href={`/admin/products/${p.id}`}>{p.title}</Link>:p.title}<p className="text-xs text-slate-400 break-all">{p.id}</p>{p.status==='published'&&<a className="text-xs text-blue-700 underline" href={`https://www.ipackautoparts.com/products/${encodeURIComponent(p.slug)}`} target="_blank" rel="noopener noreferrer">查看前台</a>}</td><td className="p-2">{p.status==='published'?'已发布':p.status==='archived'?'已下架':'草稿'}{p.has_draft&&' · 有草稿'}</td><td className="p-2">{options.find(c=>c.id===p.category_id)?.label || '未分类'}{p.has_draft&&<p className="text-xs text-slate-500">草稿：{options.find(c=>c.id===p.draft_category_id)?.label || '未分类'}</p>}</td></tr>)}</tbody></table>{visible.length===0&&<p className="text-slate-500">没有关联产品。</p>}
        </fieldset>
        {move&&<div ref={confirmation} tabIndex={-1} role="group" aria-labelledby="directory-move-title" className="rounded-lg border border-blue-300 bg-blue-50 p-4 space-y-3">
          <h3 id="directory-move-title" className="font-semibold">确认移动 {move.payload.products.length} 个产品到“{move.label}”</h3>
          <p className="text-sm">只修改产品和已保存草稿的目录，其他内容及产品地址保持不变。</p>
          <div className="flex gap-3"><button className={`${button} bg-blue-600 text-white`} disabled={busy} onClick={()=>void mutate(move.payload,'产品目录已调整，草稿其他内容已保留。')}>确认移动</button><button className={button} disabled={busy} onClick={()=>setMove(null)}>取消</button></div>
        </div>}
      </section>
    </div>}
  </AdminLayout>;
}
export default withAuth(CategoriesPage);
