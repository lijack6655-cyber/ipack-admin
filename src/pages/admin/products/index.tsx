import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import { productRequest } from '@/lib/products/client';
import { hasPermission } from '@/lib/auth/permissions';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import ProductActions from '@/components/products/ProductActions';
import type { Tables } from '@/types/database';

type Product = Tables<'products'> & { has_draft:boolean; draft_title?:string };
const labels = {published:'已发布',draft:'草稿',archived:'已下架'};
const button='rounded-lg border px-3 py-2 text-sm disabled:opacity-40';
function ProductsPage(){
  const router=useRouter(), {user,logout}=useAuthStore();
  const drafts=router.pathname==='/admin/products/drafts';
  const status=drafts?(router.query.tab==='archived'?'archived':'draft'):'published';
  const [products,setProducts]=useState<Product[]>([]),[urls,setUrls]=useState<Record<string,string>>({});
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [copyId,setCopyId]=useState(''),[search,setSearch]=useState(''),[category,setCategory]=useState(''),[pendingOnly,setPendingOnly]=useState(false),[page,setPage]=useState(1);
  const load=useCallback(async()=>{setLoading(true);setError('');try{const r=await productRequest('/api/admin/products');setProducts(r.products);setUrls(r.image_urls);}catch(e){setError(e instanceof Error?e.message:'读取失败');}finally{setLoading(false);}},[]);
  // Fetching synchronizes this page with the server and exposes its loading state.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{void load();},[load]);
  const query=search.trim().toLowerCase();
  const filtered=products.filter(p=>p.status===status&&(!category||p.category_name===category)&&(!pendingOnly||p.has_draft)&&(!query||[p.title,p.display_title,p.draft_title,p.sku,p.id,p.external_id,...p.oe_numbers].some(s=>s?.toLowerCase().includes(query))));
  const pages=Math.max(1,Math.ceil(filtered.length/10)), current=Math.min(page,pages);
  const categories=[...new Set(products.map(p=>p.category_name).filter(Boolean))];
  if(!user)return null;
  const writable=hasPermission(user.role?.name,'PRODUCT_WRITE');
  return <AdminLayout user={user} onLogout={async()=>{await logout();await router.push('/login');}}>
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6"><div><h1 className="text-2xl font-bold">{drafts?'产品草稿库':'产品列表'}</h1><p className="mt-2 text-sm text-slate-500">{drafts?'未发布与已下架产品集中管理；发布需进入编辑产品页面。':'管理前台展示中的产品；保存修改后须在编辑产品页面完成产品发布。'}</p></div>{writable&&<Link className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm" href="/admin/products/new">＋ 新建产品草稿</Link>}</div>
    {drafts&&<nav aria-label="产品草稿库栏目" className="flex gap-2 mb-4">{(['draft','archived'] as const).map(s=><Link key={s} onClick={()=>setPage(1)} href={`/admin/products/drafts?tab=${s}`} className={`${button} ${status===s?'bg-blue-600 text-white':'bg-white'}`} aria-current={status===s?'page':undefined}>{s==='draft'?'产品草稿':'产品下架'}（{products.filter(p=>p.status===s).length}）</Link>)}</nav>}
    {notice&&<div role="status" className="bg-green-50 text-green-800 p-4 mb-4 rounded-lg">{notice}{copyId&&<Link className="ml-3 underline" href={`/admin/products/${copyId}`}>去编辑类似品</Link>}</div>}
    {error&&<div role="alert" className="bg-red-50 text-red-800 p-4 mb-4 rounded-lg">{error}<button className="ml-3 underline" onClick={()=>void load()}>重新读取</button></div>}
    <div className="bg-white border rounded-xl p-4 flex flex-wrap gap-3 mb-4"><input aria-label="搜索产品" className="flex-1 min-w-48 border rounded-lg px-3 py-2 text-sm" placeholder="搜索产品名称、SKU、ID、OE 号" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/><select aria-label="筛选分类" className={`${button} bg-white`} value={category} onChange={e=>{setCategory(e.target.value);setPage(1);}}><option value="">全部分类</option>{categories.map(c=><option key={c!}>{c}</option>)}</select>{!drafts&&<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pendingOnly} onChange={e=>{setPendingOnly(e.target.checked);setPage(1);}}/>仅看有待发布修改</label>}</div>
    <div className="bg-white border rounded-xl"><div className="hidden lg:grid grid-cols-[minmax(0,1fr)_140px_150px_180px] gap-4 px-5 py-3 bg-slate-50 text-sm text-slate-600 rounded-t-xl"><span>产品信息</span><span>价格 / MOQ</span><span>状态 / 更新时间</span><span>操作</span></div>
      {loading?<p role="status" className="p-12 text-center text-slate-500">正在读取产品…</p>:!error&&filtered.length===0?<p className="p-12 text-center text-slate-500">{search||category||pendingOnly?'没有符合筛选条件的产品':status==='draft'?'暂无产品草稿，可新建产品或从现有产品发布类似品':status==='archived'?'暂无已下架产品':'暂无已发布产品'}</p>:!error&&filtered.slice((current-1)*10,current*10).map(p=><article key={p.id} aria-label={`产品：${p.display_title||p.title}`} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_140px_150px_180px] gap-4 p-5 border-t hover:bg-slate-50">
        <div className="flex gap-4 min-w-0"><div className="relative w-[72px] h-[72px] shrink-0 border rounded bg-white overflow-hidden">{p.image_path&&urls[p.image_path]?<Image unoptimized fill sizes="72px" className="object-contain" src={urls[p.image_path]} alt={p.display_title||p.title}/>:<span className="flex items-center justify-center h-full text-xs text-slate-400">暂无图片</span>}</div><div className="min-w-0">{writable?<Link className="text-blue-700 font-medium line-clamp-2 hover:underline" href={`/admin/products/${p.id}`}>{p.display_title||p.title}</Link>:<p className="font-medium line-clamp-2">{p.display_title||p.title}</p>}<p className="text-xs text-slate-500 mt-2">SKU：{p.sku||'待补充'} · 分类：{p.category_name||'待补充'}</p><p className="text-xs text-slate-500 mt-1">{[p.make,p.model,p.years].filter(Boolean).join(' · ')||'车型待补充'} · OE：{p.oe_numbers.join(', ')||'待补充'}</p><p className="text-xs text-slate-400 break-all mt-1">ID：{p.external_id||p.id}</p></div></div>
        <div className="text-sm"><p>{p.price_text||'价格待补充'}</p><p className="text-xs text-slate-500 mt-2">MOQ：{p.moq_text||'待补充'}</p></div>
        <div><span className={`text-xs rounded-full px-2 py-1 ${p.status==='published'?'bg-green-100 text-green-800':p.status==='draft'?'bg-amber-100 text-amber-800':'bg-slate-200 text-slate-600'}`}>{labels[p.status]}</span>{p.status==='published'&&p.has_draft&&<p className="text-xs text-amber-700 mt-2">有待发布修改</p>}<p className="text-xs text-slate-400 mt-2">{new Date(p.updated_at).toLocaleString('zh-CN')}</p></div>
        <div>{writable&&<ProductActions product={p} onComplete={(action,result)=>{setCopyId(action==='duplicate'?result.id:'');setNotice(action==='duplicate'?'类似品草稿已创建，尚未发布。':action==='archive'?'已下架，可在产品草稿库的「产品下架」栏目查看。':'产品已永久删除。');void load();}}/>}{p.status==='published'&&p.page_path&&<a className="inline-block text-xs text-slate-500 mt-2 px-2 hover:text-blue-700" href={`https://www.ipackautoparts.com${p.page_path}`} target="_blank" rel="noreferrer">查看线上页面 ↗</a>}</div>
      </article>)}
      {!loading&&!error&&<div className="flex justify-between items-center gap-2 p-4 border-t text-xs text-slate-500"><span>共 {filtered.length} 个产品 · {current} / {pages} 页</span><div className="flex gap-2"><button className={button} disabled={current===1} onClick={()=>setPage(current-1)}>上一页</button><button className={button} disabled={current===pages} onClick={()=>setPage(current+1)}>下一页</button></div></div>}
    </div>
  </AdminLayout>;
}
export default withAuth(ProductsPage);
