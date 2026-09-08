import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { useAuthStore } from '@/lib/auth/store';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Tables } from '@/types/database';

type Inquiry = Pick<Tables<'inquiries'>, 'id' | 'reference' | 'created_at' | 'product_interest' | 'oe_number' | 'subject' | 'message' | 'destination_country' | 'quantity' | 'source' | 'source_page' | 'vehicle_make' | 'vehicle_model' | 'vehicle_year'> & {
  contacts: { name: string | null; company: string | null; email: string | null; whatsapp: string | null; phone: string | null } | null;
};
const PAGE_SIZE = 25;
function InquiriesPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data, error: queryError } = await getSupabaseBrowserClient().from('inquiries')
          .select('id,reference,created_at,product_interest,oe_number,subject,message,destination_country,quantity,source,source_page,vehicle_make,vehicle_model,vehicle_year,contacts(name,company,email,whatsapp,phone)')
          .order('created_at', { ascending: false }).order('id', { ascending: false })
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
        if (queryError) throw queryError;
        if (active) { setItems((data ?? []).slice(0, PAGE_SIZE) as Inquiry[]); setHasNext((data?.length ?? 0) > PAGE_SIZE); }
      } catch { if (active) { setError('询价记录读取失败，请重试。'); setHasNext(false); } }
      finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [page, reload]);
  const beginLoad = () => { setLoading(true); setError(''); setItems([]); };
  if (!user) return null;
  return <AdminLayout user={user} onLogout={async () => { await logout(); router.push('/login'); }}>
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold">询价记录</h1><p className="text-sm text-slate-600 mt-2">核查网站收到的询价；客户沟通继续使用 WhatsApp 和邮箱。</p></div><button className="rounded border px-4 py-2" disabled={loading} onClick={() => { beginLoad(); setReload((value) => value + 1); }}>刷新记录</button></div>
    {error && <p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
    {loading ? <p role="status" className="p-8">正在读取询价记录…</p> : <div className="space-y-4">{items.map((item) => <article key={item.id} className="rounded-lg border bg-white p-5">
      <header className="flex flex-wrap justify-between gap-2 mb-4"><h2 className="font-mono text-sm font-semibold break-all">{item.reference}</h2><time className="text-sm text-slate-500">{new Date(item.created_at).toLocaleString('zh-CN')}</time></header>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
        <div className="min-w-0"><dt className="font-semibold mb-1">客户与联系方式</dt><dd className="space-y-1 break-words"><p>{item.contacts?.name || '姓名未填写'}{item.contacts?.company ? ` · ${item.contacts.company}` : ''}</p><p>邮箱：{item.contacts?.email || '未填写'}</p><p>WhatsApp：{item.contacts?.whatsapp || '未填写'}</p><p>电话：{item.contacts?.phone || '未填写'}</p></dd></div>
        <div className="min-w-0"><dt className="font-semibold mb-1">产品需求</dt><dd className="space-y-1 break-words"><p>{item.product_interest || item.subject || '未填写'}</p><p>OE：{item.oe_number || '未填写'}</p><p>车型 / 年份：{[item.vehicle_make, item.vehicle_model, item.vehicle_year].filter(Boolean).join(' / ') || '未填写'}</p><p>目的国 / 数量：{item.destination_country || '未填写'} / {item.quantity || '未填写'}</p></dd></div>
        <div className="min-w-0"><dt className="font-semibold mb-1">客户留言</dt><dd className="whitespace-pre-wrap break-words">{item.message || '未填写'}</dd></div>
        <div className="min-w-0"><dt className="font-semibold mb-1">来源</dt><dd className="break-all"><p>{item.source || '未记录'}</p><p>{item.source_page || '来源页面未记录'}</p></dd></div>
      </dl>
    </article>)}</div>}
    {!loading && !error && !items.length && <p className="p-8 text-center text-slate-500">暂无询价记录</p>}
    <nav aria-label="询价记录分页" className="mt-5 flex items-center justify-between gap-3"><button className="rounded border px-3 py-2 disabled:opacity-40" disabled={loading || page === 0} onClick={() => { beginLoad(); setPage((value) => value - 1); }}>上一页</button><span className="text-sm">第 {page + 1} 页</span><button className="rounded border px-3 py-2 disabled:opacity-40" disabled={loading || !hasNext} onClick={() => { beginLoad(); setPage((value) => value + 1); }}>下一页</button></nav>
  </AdminLayout>;
}
export default withAuth(InquiriesPage);
