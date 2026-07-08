import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { Plus, Search, Filter, Edit2, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

type ProductStatus = 'active' | 'draft' | 'archived';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: string;
  stock: number;
  status: ProductStatus;
  updatedAt: string;
}

const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'LED Headlight Toyota Prius 2016-2022', sku: 'HL-PRI-001', category: 'Headlights & Taillights', price: '$89.99', stock: 45, status: 'active', updatedAt: '2026-07-06' },
  { id: '2', name: 'Reversing Mirror Suzuki Swift', sku: 'RM-SWF-002', category: 'Reversing Mirror', price: '$34.50', stock: 82, status: 'active', updatedAt: '2026-07-05' },
  { id: '3', name: 'Front Bumper Grille Toyota Axio', sku: 'BG-AXI-003', category: 'Bumper & Grille', price: '$56.00', stock: 23, status: 'active', updatedAt: '2026-07-04' },
  { id: '4', name: 'Cooling Radiator Prius Gen3', sku: 'CR-PRI-004', category: 'Cooling System', price: '$145.00', stock: 12, status: 'active', updatedAt: '2026-07-03' },
  { id: '5', name: 'Wheel Cover Set 14inch Universal', sku: 'WC-UNI-005', category: 'Wheel Cover', price: '$28.00', stock: 200, status: 'active', updatedAt: '2026-07-02' },
  { id: '6', name: 'Front Strut Suspension Toyota Prius', sku: 'SS-PRI-006', category: 'Suspension System', price: '$220.00', stock: 8, status: 'draft', updatedAt: '2026-07-01' },
  { id: '7', name: 'Power Steering Pump Suzuki Swift', sku: 'PS-SWF-007', category: 'Steering System', price: '$175.00', stock: 6, status: 'active', updatedAt: '2026-06-30' },
  { id: '8', name: 'Brake Pad Set Front Toyota Prius', sku: 'BP-PRI-008', category: 'Braking System', price: '$42.00', stock: 95, status: 'active', updatedAt: '2026-06-29' },
  { id: '9', name: 'Tail Light Assembly Suzuki Swift', sku: 'TL-SWF-009', category: 'Headlights & Taillights', price: '$67.00', stock: 31, status: 'archived', updatedAt: '2026-06-28' },
  { id: '10', name: 'Door Mirror Left Prius 2018', sku: 'DM-PRI-010', category: 'Reversing Mirror', price: '$55.00', stock: 18, status: 'active', updatedAt: '2026-06-27' },
];

const STATUS_LABELS: Record<ProductStatus, { label: string; cls: string }> = {
  active:   { label: '上架', cls: 'bg-green-100 text-green-700' },
  draft:    { label: '草稿', cls: 'bg-yellow-100 text-yellow-700' },
  archived: { label: '下架', cls: 'bg-slate-100 text-slate-500' },
};

const CATEGORIES = ['全部分类', 'Headlights & Taillights', 'Reversing Mirror', 'Bumper & Grille', 'Cooling System', 'Wheel Cover', 'Suspension System', 'Steering System', 'Braking System'];

function ProductsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部分类');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const handleLogout = async () => { await logout(); router.push('/login'); };

  const filtered = MOCK_PRODUCTS.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === '全部分类' || p.category === category;
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!user) return null;

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">产品列表</h1>
          <p className="text-sm text-slate-500 mt-1">共 {total} 个产品</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          新建产品
        </Link>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="搜索产品名称或 SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as any); setPage(1); }}
        >
          <option value="all">全部状态</option>
          <option value="active">上架</option>
          <option value="draft">草稿</option>
          <option value="archived">下架</option>
        </select>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">产品名称</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">SKU</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">分类</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">价格</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">库存</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">状态</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">更新时间</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-slate-400">暂无产品数据</td></tr>
            ) : paged.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate">{product.name}</td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{product.sku}</td>
                <td className="px-4 py-3 text-slate-600">{product.category}</td>
                <td className="px-4 py-3 text-slate-900 font-medium">{product.price}</td>
                <td className="px-4 py-3">
                  <span className={`font-medium ${product.stock < 10 ? 'text-red-600' : 'text-slate-700'}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_LABELS[product.status].cls}`}>
                    {STATUS_LABELS[product.status].label}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{product.updatedAt}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-colors" title="查看">
                      <Eye className="w-4 h-4" />
                    </button>
                    <Link href={`/admin/products/${product.id}/edit`} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-colors" title="编辑">
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors" title="删除">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <span className="text-xs text-slate-500">
              第 {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} 条，共 {total} 条
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-7 h-7 text-xs rounded transition-colors ${n === page ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 text-slate-600'}`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default withAuth(ProductsPage);
