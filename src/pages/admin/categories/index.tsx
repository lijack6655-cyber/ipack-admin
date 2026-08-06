import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { useAuthStore } from '@/lib/auth/store';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Database } from '@/types/database';

type Category = Database['public']['Tables']['categories']['Row'] & { product_count?: number };

function CategoriesPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [items, setItems] = useState<Category[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    getSupabaseBrowserClient().from('categories').select('*, products(count)').order('sort_order').then(({ data, error: queryError }) => {
      if (queryError) setError(queryError.message);
      else setItems((data ?? []).map((row) => ({ ...row, product_count: row.products?.[0]?.count ?? 0 })) as Category[]);
    });
  }, []);
  if (!user) return null;
  const handleLogout = async () => { await logout(); router.push('/login'); };
  return <AdminLayout user={user} onLogout={handleLogout}><div className="mb-6"><h1 className="text-2xl font-bold">分类管理</h1><p className="text-sm text-slate-500 mt-1">来自前台目录的真实分类；未匹配描述保留待补充</p></div>{error && <p className="text-red-700">{error}</p>}<div className="bg-white border rounded-lg overflow-hidden"><table className="w-full text-sm"><thead className="bg-slate-50"><tr><th className="text-left p-3">分类</th><th className="text-left p-3">Slug</th><th className="text-left p-3">描述</th><th className="text-left p-3">产品数</th><th className="text-left p-3">核验</th></tr></thead><tbody className="divide-y">{items.map((item) => <tr key={item.id}><td className="p-3 font-medium">{item.name}</td><td className="p-3 font-mono text-xs">{item.slug}</td><td className="p-3">{item.description || '待补充'}</td><td className="p-3">{item.product_count ?? 0}</td><td className="p-3">{item.verification_status === 'verified' ? '已核验' : '待核验'}</td></tr>)}</tbody></table></div></AdminLayout>;
}
export default withAuth(CategoriesPage);
