import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import ProductActions from './ProductActions';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { useAuthStore } from '@/lib/auth/store';
import { emptyProduct, inspectionIssues, productInput, publishIssues, type ProductInput } from '@/lib/products/model';
import { productRequest } from '@/lib/products/client';

type Category = { id:string; name:string };
type ProductState = { id:string; slug:string; status:string; revision:number };
type Media = { id:string; path:string; name:string; width:number|null; height:number|null };
const fieldClass = 'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none';
const buttonClass = 'rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40 hover:bg-slate-50';
const panelClass = 'rounded-xl border border-slate-200 bg-white p-5 space-y-4';

function ProductEditor() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const id = typeof router.query.id === 'string' ? router.query.id : undefined;
  const [product,setProduct] = useState<ProductState | null>(null);
  const [form,setForm] = useState<ProductInput>(emptyProduct);
  const [snapshot,setSnapshot] = useState(JSON.stringify(emptyProduct));
  const [categories,setCategories] = useState<Category[]>([]);
  const [imageUrls,setImageUrls] = useState<Record<string,string>>({});
  const [hasDraft,setHasDraft] = useState(false);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [preview,setPreview] = useState('');
  const [confirmed,setConfirmed] = useState(false);
  const [media,setMedia] = useState<Media[]>([]);
  const [library,setLibrary] = useState(false);
  const [mediaPage,setMediaPage] = useState(0);
  const [moreMedia,setMoreMedia] = useState(false);
  const [inspection,setInspection] = useState<string[] | null>(null);
  const bypassNavigation = useRef(false);
  const dirty = JSON.stringify(form) !== snapshot;
  const missing = publishIssues(form);
  const publishedUpdate = product?.status === 'published';
  const canPublish = publishedUpdate ? (dirty || hasDraft) && confirmed && missing.length === 0 : !dirty && hasDraft && confirmed && missing.length === 0;
  useEffect(() => {
    const unload = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    const leave = () => { if (dirty && !bypassNavigation.current && !window.confirm('还有未保存的修改，确定离开吗？')) { router.events.emit('routeChangeError'); throw new Error('Navigation cancelled to preserve product edits'); } };
    window.addEventListener('beforeunload',unload); router.events.on('routeChangeStart',leave);
    return () => { window.removeEventListener('beforeunload',unload); router.events.off('routeChangeStart',leave); };
  },[dirty,router.events]);
  useEffect(() => {
    if (!preview && !library) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setPreview(''); setLibrary(false); }
      if (event.key !== 'Tab' || !dialog) return;
      const nodes = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],input:not(:disabled),iframe')];
      const first = nodes[0], last = nodes[nodes.length-1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown',keydown);
    return () => { document.removeEventListener('keydown',keydown); previous?.focus(); };
  },[preview,library]);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await productRequest(`/api/admin/products${id ? `/${id}` : ''}`);
      setCategories(result.categories);
      if (id) { setProduct(result.product); setForm(result.form); setSnapshot(JSON.stringify(result.form)); setImageUrls(result.image_urls); setHasDraft(result.has_draft); }
      else { setProduct(null); setForm(emptyProduct); setSnapshot(JSON.stringify(emptyProduct)); setHasDraft(false); }
      setConfirmed(false);
    } catch (error) { setError(error instanceof Error ? error.message : '读取失败'); }
    finally { setLoading(false); }
  },[id]);
  useEffect(() => { if (router.isReady) void load(); },[router.isReady,load]);
  const change = <K extends keyof ProductInput>(key:K,value:ProductInput[K]) => { setForm(previous => ({...previous,[key]:value})); setConfirmed(false); setNotice(''); setPreview(''); setInspection(null); };
  const action = async (action:'save'|'preview'|'publish'|'archive') => {
    setBusy(true); setError(''); setNotice('');
    try {
      if (action === 'save') { const parsed=productInput.safeParse(form); if (!parsed.success) throw new Error(parsed.error.issues[0].message); }
      if (action === 'archive' && !window.confirm('确认下架？前台目录将移除此产品，详情页会显示已下架。草稿和产品记录会保留。')) return;
      let currentProduct = product;
      if (action === 'publish' && publishedUpdate && dirty && product) {
        const parsed=productInput.safeParse(form); if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        currentProduct = await productRequest(`/api/admin/products/${product.id}`,{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ action:'save',revision:product.revision,data:form }) });
        setProduct(currentProduct); setSnapshot(JSON.stringify(form)); setHasDraft(true);
      }
      const result = await productRequest(`/api/admin/products${currentProduct ? `/${currentProduct.id}` : ''}`,{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ action,revision:currentProduct?.revision || 0,...(action==='save'?{data:form}:{}),confirmed:action==='archive'||confirmed }) });
      if (action==='preview') { setPreview(result.html); return; }
      setProduct(result); setPreview(''); setConfirmed(false);
      if (action==='save') { setSnapshot(JSON.stringify(form)); setHasDraft(true); setNotice('草稿已保存，线上内容未改变。'); }
      if (action==='publish') { setHasDraft(false); setNotice('已发布。前台目录和详情页已使用本次内容。'); }
      if (action==='archive') setNotice('已下架，草稿和历史记录已保留。');
      if (!id && result.id) { bypassNavigation.current=true; await router.replace(`/admin/products/${result.id}`); bypassNavigation.current=false; }
    } catch (error) { setError(error instanceof Error ? error.message : '操作失败'); }
    finally { setBusy(false); }
  };
  const inspect = () => { const issues=inspectionIssues(form); setInspection(issues); if (publishedUpdate) setConfirmed(issues.length===0); };
  const openLibrary = async (page=0) => {
    setBusy(true); setError('');
    try { const result=await productRequest(`/api/admin/product-media?page=${page}`); setMedia(result.media); setImageUrls(previous=>({...previous,...result.image_urls})); setMoreMedia(result.has_more); setMediaPage(page); setLibrary(true); }
    catch (error) { setError(error instanceof Error?error.message:'图片库读取失败'); } finally { setBusy(false); }
  };
  const upload = async (files:FileList | null) => {
    if (!files?.length) return;
    if (files.length+form.images.length>9) { setError('每个产品最多 9 张图片（1 张主图＋8 张图库图片）'); return; }
    setBusy(true); setError('');
    try {
      for (const file of Array.from(files)) {
        if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>3*1024*1024) throw new Error(`${file.name}：请选择不超过 3 MB 的 JPG、PNG、WebP`);
        const result=await productRequest('/api/admin/product-media',{method:'POST',headers:{'Content-Type':file.type,'X-File-Name':encodeURIComponent(file.name)},body:file});
        setImageUrls(previous=>({...previous,...result.image_urls})); setForm(previous=>({...previous,images:[...previous.images,{path:result.media.path,alt:''}]})); setConfirmed(false); setPreview('');
      }
      setNotice('图片已上传，请补充图片说明并保存草稿。');
    } catch (error) { setError(error instanceof Error?error.message:'上传失败'); } finally { setBusy(false); }
  };
  const moveImage=(index:number,direction:number)=>{ const images=[...form.images]; [images[index],images[index+direction]]=[images[index+direction],images[index]]; change('images',images); };
  const requiredMark = <span className="text-red-600" aria-hidden="true">* </span>;
  const input=(key:keyof ProductInput,label:string,placeholder='',multiline=false,required=false)=><label className="block text-sm font-medium text-slate-700" key={key}>{required&&requiredMark}{label}{multiline?<textarea aria-required={required} className={`${fieldClass} mt-1`} rows={key==='description'?10:3} value={String(form[key])} onChange={e=>change(key,e.target.value)} placeholder={placeholder}/>:<input aria-required={required} className={`${fieldClass} mt-1`} value={String(form[key])} onChange={e=>change(key,e.target.value)} placeholder={placeholder}/>}</label>;
  if (!user) return null;
  return <AdminLayout user={user} onLogout={async()=>{if(!dirty||window.confirm('未保存的修改会丢失，确定退出吗？')){bypassNavigation.current=true;await logout();await router.push('/login');}}}>
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6"><div><h1 className="text-2xl font-bold">编辑产品</h1><p className="text-sm text-slate-500 mt-1">{id?'完善产品资料、选择图片，预览后发布到网站。':'新产品 · 未保存。先保存草稿，再完成产品发布。'}</p></div><div className="flex flex-wrap gap-3">{product&&<ProductActions product={{...product,title:form.title,sku:form.sku,has_draft:hasDraft}} editor disabled={dirty||busy} onComplete={(operation,result)=>{if(operation==='duplicate'){setNotice('类似品草稿已创建，尚未发布。');void router.push(`/admin/products/${result.id}`);}else if(operation==='delete'){bypassNavigation.current=true;void router.push('/admin/products/drafts');}else{setNotice('已下架，可在产品草稿库的产品下架栏目查看。');void load();}}}/>}<button className={buttonClass} onClick={()=>router.push('/admin/products')}>返回产品列表</button></div></div>
    {error&&<div role="alert" className="mb-4 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200">{error}<button className="ml-3 underline" disabled={busy} onClick={()=>{if(!dirty||window.confirm('重新载入将丢弃未保存修改，请先复制需要保留的内容。确定继续？'))void load();}}>重新载入</button></div>}
    {notice&&<div role="status" className="mb-4 p-4 rounded-lg bg-green-50 text-green-800">{notice}</div>}
    {loading?<p>正在读取产品资料…</p>:<fieldset disabled={busy||Boolean(id&&!product)} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6 min-w-0">
      <div className="space-y-6 min-w-0"><section className={panelClass}><h2 className="font-semibold">产品信息</h2>{input('title','产品名称','填写对外展示的英文产品名称',false,true)}
        <div className="grid sm:grid-cols-2 gap-4">{input('sku','SKU / 内部货号','发布前必填',false,true)}<label className="block text-sm font-medium text-slate-700">{requiredMark}产品分类<select aria-label="产品分类" aria-required="true" className={`${fieldClass} mt-1`} value={form.category_id} onChange={e=>change('category_id',e.target.value)}><option value="">选择分类</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div>
        <div className="grid sm:grid-cols-3 gap-4">{input('make','汽车品牌','如 Toyota')}{input('model','适用车型','填写已核实的车型')}{input('years','适用年份','如 2018–2020')}</div>
        <label className="block text-sm font-medium text-slate-700">OE / 替换编号<textarea className={`${fieldClass} mt-1`} rows={2} value={form.oe_numbers.join('\n')} onChange={e=>change('oe_numbers',e.target.value.split('\n'))} onBlur={()=>change('oe_numbers',form.oe_numbers.map(s=>s.trim()).filter(Boolean))} placeholder="每行一个编号"/></label>
      </section><section className={panelClass}><h2 className="font-semibold">{requiredMark}主图与产品图库 <span className="text-sm text-slate-500">{form.images.length}/9</span></h2>
        <div onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(!busy)void upload(e.dataTransfer.files);}} className="rounded-lg border-2 border-dashed border-slate-300 p-5 text-center"><label className="inline-block text-blue-700 cursor-pointer">选择或拖入图片<input type="file" multiple aria-required="true" accept="image/jpeg,image/png,image/webp" className="block mt-3 text-sm max-w-full" onChange={e=>{void upload(e.target.files);e.target.value='';}}/></label><p className="text-xs text-slate-500 mt-3">JPG、PNG、WebP · 每张最多 3 MB · 自动优化尺寸并去除照片定位信息</p></div>
        <button type="button" className={buttonClass} onClick={()=>openLibrary()}>从图片银行库选择</button><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{form.images.map((image,index)=><div key={image.path} className="border rounded-lg p-3 space-y-2"><div className="relative aspect-square"><Image unoptimized fill sizes="220px" style={{objectFit:'contain'}} src={imageUrls[image.path]||`https://www.ipackautoparts.com/${image.path.replace(/^\//,'')}`} alt={image.alt||'待填写图片说明'}/></div><p className="text-xs font-semibold text-slate-600">{index===0?'产品主图':`图库 ${index}`}</p><label className="block text-xs">图片说明（Alt）<input className={`${fieldClass} mt-1`} value={image.alt} onChange={e=>change('images',form.images.map((im,i)=>i===index?{...im,alt:e.target.value}:im))}/></label><div className="flex gap-1"><button type="button" className={buttonClass} disabled={index===0} aria-label={`前移图片 ${index+1}`} onClick={()=>moveImage(index,-1)}>←</button><button type="button" className={buttonClass} disabled={index===form.images.length-1} aria-label={`后移图片 ${index+1}`} onClick={()=>moveImage(index,1)}>→</button><button type="button" className={`${buttonClass} ml-auto`} onClick={()=>change('images',form.images.filter((_,i)=>i!==index))}>移除</button></div></div>)}</div><p className="text-xs text-slate-500">第一张作为主图；移除只解除本产品的引用，图片仍保留在图片库。</p>
      </section><section className={panelClass}><h2 className="font-semibold">产品介绍</h2>{input('short_description','简短描述','显示在详情页标题下方',true)}{input('description','详细描述','填写实际用途、适配条件及买家需要确认的信息。空行分段。',true,true)}
        <h3 className="text-sm font-medium">产品规格</h3>{form.specifications.map((spec,index)=><div key={index} className="flex gap-2"><input className={fieldClass} aria-label={`规格名称 ${index+1}`} placeholder="规格名称" value={spec.name} onChange={e=>change('specifications',form.specifications.map((s,i)=>i===index?{...s,name:e.target.value}:s))}/><input className={fieldClass} aria-label={`规格值 ${index+1}`} placeholder="规格值" value={spec.value} onChange={e=>change('specifications',form.specifications.map((s,i)=>i===index?{...s,value:e.target.value}:s))}/><button type="button" className={buttonClass} aria-label={`移除规格 ${index+1}`} onClick={()=>change('specifications',form.specifications.filter((_,i)=>i!==index))}>×</button></div>)}
        <button type="button" className={buttonClass} disabled={form.specifications.length>=50} onClick={()=>change('specifications',[...form.specifications,{name:'',value:''}])}>＋ 添加规格</button>
      </section><section className={panelClass}><h2 className="font-semibold">搜索引擎展示</h2>{input('seo_title','SEO 标题（可选）','留空时使用产品名称')}{input('seo_description','SEO 描述（可选）','准确概括产品及适用需求',true)}<p className="text-xs text-slate-500 break-all">产品地址：{product?`https://www.ipackautoparts.com/products/${product.slug}`:'首次保存后生成固定地址'}</p></section></div>
      <aside className="space-y-6 min-w-0"><section className={panelClass}><h2 className="font-semibold">发布</h2><p className="text-sm">状态：<strong>{product?.status==='published'?'已发布':product?.status==='archived'?'已下架':'草稿'}</strong>{hasDraft&&product?.status==='published'&&' · 有待发布草稿'}</p><p className="text-xs text-slate-500">{dirty?'有未保存修改':hasDraft?'草稿已保存':'当前内容已载入'}</p>
        <div className="grid grid-cols-3 gap-2"><button type="button" className={buttonClass} onClick={()=>action('save')}>保存草稿</button><button type="button" className={buttonClass} disabled={!hasDraft||dirty} onClick={()=>action('preview')}>预览草稿</button><button type="button" className={buttonClass} onClick={inspect}>检测</button></div>
        {input('verification_note','资料核验说明','填写资料来源及已核对的车型、OE、图片等信息。仅内部可见。',true,true)}<p className="text-xs text-slate-600">{missing.length?`发布前待补充：${missing.join('、')}`:'发布所需资料已齐全'}</p>
        {inspection&&<div role={inspection.length?'alert':'status'} aria-live="polite" className={`rounded-lg border p-3 text-sm ${inspection.length?'border-red-200 bg-red-50 text-red-800':'border-green-200 bg-green-50 text-green-800'}`}><p className="font-semibold">{inspection.length?`检测发现 ${inspection.length} 项待处理`:'检测通过，未发现错误或漏填项'}</p>{inspection.length>0&&<ul className="mt-2 space-y-1">{inspection.map(issue=><li key={issue}><span className="mr-2 rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold">错误项</span>{issue}</li>)}</ul>}</div>}
        <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} disabled={publishedUpdate||dirty||!hasDraft}/><span>{publishedUpdate?'检测通过后，同意将本次修改同步到线上产品。':'我已核对产品资料和图片，同意将保存的草稿公开发布。'}</span></label>
        <button type="button" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-3 text-sm font-semibold disabled:opacity-40" disabled={!canPublish} onClick={()=>action('publish')}>产品发布</button>
        {product?.status==='published'&&<><a className="block text-center text-sm text-blue-700" href={`https://www.ipackautoparts.com/products/${product.slug}`} target="_blank" rel="noreferrer">查看线上页面 ↗</a></>}{busy&&<p role="status" className="text-sm text-blue-700">正在处理，请稍候…</p>}
      </section><section className={panelClass}><h2 className="font-semibold">B2B 询价信息</h2>{input('price_text','价格说明（可选）','留空时显示 Request a quote')}{input('moq_text','起订量（可选）','留空时显示 Contact us')}<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={e=>change('featured',e.target.checked)}/>推荐产品</label></section></aside>
    </fieldset>}
    {preview&&<div role="dialog" aria-modal="true" aria-label="产品草稿预览" className="fixed inset-0 z-50 bg-slate-900/60 flex p-3 md:p-6"><div className="bg-white rounded-xl flex-1 flex flex-col min-w-0"><div className="flex justify-between items-center p-3"><strong>已保存草稿预览</strong><button autoFocus className={buttonClass} onClick={()=>setPreview('')}>关闭预览</button></div><iframe title="产品草稿预览" sandbox="" srcDoc={preview} className="flex-1 w-full border-0"/></div></div>}
    {library&&<div role="dialog" aria-modal="true" aria-label="产品图片库" className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-3"><div className="bg-white rounded-xl p-5 w-full max-w-4xl max-h-[90vh] overflow-auto"><div className="flex justify-between mb-4"><h2 className="font-semibold">图片库</h2><button autoFocus className={buttonClass} onClick={()=>setLibrary(false)}>关闭图片库</button></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{media.map(m=><button key={m.id} className="border rounded-lg p-2 text-left disabled:opacity-40" disabled={busy||form.images.length>=9||form.images.some(i=>i.path===m.path)} onClick={()=>{change('images',[...form.images,{path:m.path,alt:''}]);setLibrary(false);}}><div className="relative aspect-square"><Image unoptimized fill sizes="180px" style={{objectFit:'contain'}} src={imageUrls[m.path]} alt={m.name}/></div><p className="truncate text-xs mt-2">{m.name}</p><p className="text-xs text-slate-500">{m.width?`${m.width} × ${m.height}`:'现有产品图片'}</p></button>)}</div>{!media.length&&<p className="p-6 text-slate-500">图片库暂无图片，请先上传。</p>}<div className="flex justify-between mt-4"><button className={buttonClass} disabled={busy||mediaPage===0} onClick={()=>openLibrary(mediaPage-1)}>上一页</button><button className={buttonClass} disabled={busy||!moreMedia} onClick={()=>openLibrary(mediaPage+1)}>下一页</button></div></div></div>}
  </AdminLayout>;
}
export default withAuth(ProductEditor);
