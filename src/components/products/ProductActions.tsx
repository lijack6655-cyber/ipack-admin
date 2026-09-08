import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { productRequest } from '@/lib/products/client';

export type ActionProduct = { id:string; revision:number; status:string; title?:string; display_title?:string|null; sku?:string|null; has_draft?:boolean };
const button = 'rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-40 hover:bg-slate-50';
export default function ProductActions({product, disabled=false, editor=false, onComplete}:{product:ActionProduct; disabled?:boolean; editor?:boolean; onComplete:(action:string,result:{id:string; status:string})=>void}) {
  const [operation,setOperation]=useState<'duplicate'|'archive'|'delete'|null>(null);
  const [source,setSource]=useState<'live'|'draft'>('live');
  const [busy,setBusy]=useState(false), [error,setError]=useState('');
  const dialog=useRef<HTMLDialogElement>(null), cancel=useRef<HTMLButtonElement>(null), lock=useRef(false);
  useEffect(()=>{if(operation){dialog.current?.showModal();cancel.current?.focus();}else dialog.current?.close();},[operation]);
  const open=(action:'duplicate'|'archive'|'delete')=>{setError('');setSource(product.status==='published'?'live':product.has_draft?'draft':'live');setOperation(action);};
  const execute=async()=>{
    if(!operation||lock.current)return;
    lock.current=true;setBusy(true);setError('');
    try {
      const key=`ipack-copy:${product.id}:${product.revision}:${source}`;
      let requestId: string|undefined;
      if(operation==='duplicate'){requestId=sessionStorage.getItem(key)||crypto.randomUUID();sessionStorage.setItem(key,requestId);}
      const result=await productRequest(`/api/admin/products/${product.id}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:operation,revision:product.revision,confirmed:true,...(operation==='duplicate'?{source,request_id:requestId}:{})})});
      if(operation==='duplicate')sessionStorage.removeItem(key);
      setOperation(null);onComplete(operation,result);
    }catch(e){setError(e instanceof Error?e.message:'操作失败，请重试；当前产品不会从列表中提前移除。');}
    finally{setBusy(false);lock.current=false;}
  };
  return <div className="flex flex-wrap items-center gap-2 text-sm">
    {!editor&&<Link className="text-blue-700 font-medium px-2 py-2 hover:underline" href={`/admin/products/${product.id}`}>编辑</Link>}
    <details className="relative"><summary className={`${button} cursor-pointer list-none`} aria-label="更多产品操作">更多操作 ▾</summary>
      <div className="absolute right-0 z-20 top-full mt-1 w-40 rounded-lg border bg-white shadow-lg p-1" onClick={e=>{const details=e.currentTarget.parentElement as HTMLDetailsElement;details.open=false;}}>
        <button className="block w-full p-2 text-left hover:bg-blue-50 rounded disabled:opacity-40" disabled={disabled} onClick={()=>open('duplicate')}>发布类似品</button>
        <button className="block w-full p-2 text-left text-amber-700 hover:bg-amber-50 rounded disabled:opacity-40" disabled={disabled||product.status!=='published'} title={product.status==='draft'?'草稿尚未发布':product.status==='archived'?'产品已经下架':''} onClick={()=>open('archive')}>下架</button>
        <button className="block w-full p-2 text-left text-red-700 hover:bg-red-50 rounded border-t disabled:opacity-40" disabled={disabled} onClick={()=>open('delete')}>删除</button>
      </div>
    </details>
    {disabled&&editor&&<span className="text-xs text-slate-500">请先保存修改，再进行其他操作</span>}
    <dialog ref={dialog} onCancel={e=>{if(busy)e.preventDefault();else setOperation(null);}} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl p-0 shadow-xl backdrop:bg-slate-900/50" aria-labelledby={`action-title-${product.id}`}>
      <div className="p-6 space-y-4"><div className="flex justify-between gap-4"><h2 id={`action-title-${product.id}`} className="font-semibold text-lg">{operation==='delete'?'永久删除产品':operation==='archive'?'确认下架产品':'发布类似品'}</h2><button aria-label="关闭确认弹窗" disabled={busy} onClick={()=>setOperation(null)}>×</button></div>
      <p className="font-medium break-words">{product.display_title||product.title||'当前产品'}</p><p className="text-xs text-slate-500 break-all">SKU：{product.sku||'待补充'} · ID：{product.id}</p>
      {operation==='delete'?<><p className="text-red-700 font-semibold">确认永久删除此产品？删除后无法恢复。</p><p className="text-sm text-slate-600">产品及其待发布草稿将被删除，前台停止展示。图片银行库中的图片和历史询价记录会保留。</p></>:operation==='archive'?<p className="text-sm text-slate-600">下架后不再在前台展示，产品和草稿将保留在「产品草稿库 → 产品下架」。可进入编辑产品页面重新发布。</p>:<><p className="text-sm text-slate-600">复制为新的产品草稿，原产品不变。SKU 与资料核验说明需重新填写；图片会复用。创建后仍须进入编辑产品页面完成产品发布。</p>{product.status==='published'&&product.has_draft&&<label className="block text-sm">复制内容<select className={`${button} w-full mt-2 bg-white`} value={source} disabled={busy} onChange={e=>setSource(e.target.value as 'live'|'draft')}><option value="live">当前线上版本</option><option value="draft">最新已保存草稿</option></select></label>}</>}
      {error&&<p role="alert" className="text-sm text-red-700">{error} 如网络中断，可重试同一次操作。</p>}
      <div className="flex justify-end gap-2"><button ref={cancel} className={button} disabled={busy} onClick={()=>setOperation(null)}>取消</button><button className={`rounded-lg px-5 py-2 text-sm text-white disabled:opacity-50 ${operation==='delete'?'bg-red-600':'bg-blue-600'}`} disabled={busy} onClick={()=>void execute()}>{busy?(operation==='delete'?'删除中…':'处理中…'):'确认'}</button></div>
      </div>
    </dialog>
  </div>;
}
