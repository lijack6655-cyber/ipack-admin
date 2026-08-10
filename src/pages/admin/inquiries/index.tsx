import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Inbox } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { useAuthStore } from '@/lib/auth/store';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Database } from '@/types/database';

type Inquiry = Database['public']['Tables']['inquiries']['Row'] & {
  contacts: { name: string | null; company: string | null; email: string | null; whatsapp: string | null } | null;
};

function InquiriesPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getSupabaseBrowserClient().from('inquiries')
      .select('*, contacts(name, company, email, whatsapp)')
      .order('created_at', { ascending: false })
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setError(queryError.message);
        else setItems((data ?? []) as Inquiry[]);
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  if (!user) return null;
  const handleLogout = async () => { await logout(); router.push('/login'); };
  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="mb-6"><h1 className="text-2xl font-bold text-slate-900">询盘管理</h1><p className="text-sm text-slate-500 mt-1">仅展示前台实际提交并写入数据库的询盘</p></div>
      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">读取失败：{error}</div>}
      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="text-left p-3">编号</th><th className="text-left p-3">客户</th><th className="text-left p-3">需求</th><th className="text-left p-3">目的国/数量</th><th className="text-left p-3">状态</th><th className="text-left p-3">时间</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.id}><td className="p-3 font-mono text-xs">{item.reference}</td><td className="p-3"><div>{item.contacts?.name || '待补充'}</div><div className="text-xs text-slate-400">{item.contacts?.company || item.contacts?.email || item.contacts?.whatsapp || '待补充'}</div></td><td className="p-3">{item.product_interest || item.oe_number || item.subject || '待补充'}</td><td className="p-3">{item.destination_country || '待补充'} / {item.quantity || '待补充'}</td><td className="p-3">{item.status}</td><td className="p-3 text-xs text-slate-500">{new Date(item.created_at).toLocaleString('zh-CN')}</td></tr>)}</tbody>
        </table>
        {!loading && items.length === 0 && <div className="py-16 text-center text-slate-400"><Inbox className="w-8 h-8 mx-auto mb-2" />暂无真实询盘，前台提交链路接通后会自动进入这里</div>}
        {loading && <div className="py-16 text-center text-slate-400">正在读取真实询盘...</div>}
      </div>
    </AdminLayout>
  );
}

export default withAuth(InquiriesPage);
