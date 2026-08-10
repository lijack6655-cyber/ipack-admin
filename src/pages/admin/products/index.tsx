import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { Plus, Search, ExternalLink, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Tables } from '@/types/database';

type Product = Tables<'products'>;
type ProductStatus = Product['status'];

const STATUS_LABELS: Record<ProductStatus, { label: string; cls: string }> = {
  published: { label: '已发布', cls: 'bg-green-100 text-green-700' },
  draft: { label: '草稿', cls: 'bg-yellow-100 text-yellow-700' },
  archived: { label: '已下架', cls: 'bg-slate-100 text-slate-500' },
};

const pending = <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-xs">待补充</span>;

function ProductsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部分类');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data, error } = await getSupabaseBrowserClient()
          .from('products')
          .select('*')
          .order('featured', { ascending: false })
          .order('updated_at', { ascending: false });
        if (error) throw error;
        if (!cancelled) setProducts(data || []);
      } catch (error: unknown) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : '产品读取失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(
    () => ['全部分类', ...Array.from(new Set(products.map((p) => p.category_name).filter((v): v is string => Boolean(v)))).sort()],
    [products],
  );

  const filtered = useMemo(() => products.filter((product) => {
    const query = search.trim().toLowerCase();
    const matchSearch = !query || [product.title, product.display_title, product.sku, product.external_id, ...product.oe_numbers]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
    const matchCategory = category === '全部分类' || product.category_name === category;
    const matchStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  }), [products, search, category, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleLogout = async () => { await logout(); router.push('/login'); };
  if (!user) return null;

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">产品列表</h1>
          <p className="text-sm text-slate-500 mt-1">Supabase真实数据：{products.length}条；缺失字段显示“待补充”</p>
        </div>
        <Link href="/admin/products/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus className="w-4 h-4" />新建产品草稿
        </Link>
      </div>

      {loadError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5" />{loadError}
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg" placeholder="搜索名称、SKU、ID或OE号..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as 'all' | ProductStatus); setPage(1); }}>
          <option value="all">全部状态</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
          <option value="archived">已下架</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[1050px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {['产品名称','SKU','分类','OE号','价格文本','库存','核验','状态','更新时间','前台'].map((label) => (
                <th key={label} className="text-left px-4 py-3 font-medium text-slate-600">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={10} className="text-center py-12 text-slate-400">正在读取真实数据...</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-12 text-slate-400">暂无匹配数据</td></tr>
            ) : paged.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900 max-w-xs"><span className="line-clamp-2">{product.display_title || product.title}</span></td>
                <td className="px-4 py-3 font-mono text-xs">{product.sku || pending}</td>
                <td className="px-4 py-3 text-slate-600">{product.category_name || pending}</td>
                <td className="px-4 py-3 text-slate-600 max-w-40 truncate">{product.oe_numbers.length ? product.oe_numbers.join(', ') : pending}</td>
                <td className="px-4 py-3 text-slate-700">{product.price_text || pending}</td>
                <td className="px-4 py-3">{product.stock_quantity ?? pending}</td>
                <td className="px-4 py-3"><span className="text-xs text-amber-700">{product.verification_status === 'verified' ? '已核验' : '待核验'}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[product.status].cls}`}>{STATUS_LABELS[product.status].label}</span></td>
                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(product.updated_at).toLocaleDateString('zh-CN')}</td>
                <td className="px-4 py-3">
                  {product.page_path ? <a href={`https://www.ipackautoparts.com${product.page_path}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800"><ExternalLink className="w-4 h-4" /></a> : pending}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <span className="text-xs text-slate-500">第 {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} 条，共 {filtered.length} 条</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs text-slate-600">{currentPage} / {totalPages}</span>
              <button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default withAuth(ProductsPage);
