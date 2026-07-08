import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  productCount: number;
  order: number;
}

const INITIAL_CATEGORIES: Category[] = [
  { id: '1', name: 'Headlights & Taillights & Lamp Cover', slug: 'headlights-taillights', description: '车灯类配件，包括大灯、尾灯、灯罩', productCount: 32, order: 1 },
  { id: '2', name: 'Reversing Mirror', slug: 'reversing-mirror', description: '倒车镜、后视镜及相关配件', productCount: 18, order: 2 },
  { id: '3', name: 'Front and Rear Bumper Grille Brackets', slug: 'bumper-grille', description: '前后保险杠、中网、支架', productCount: 24, order: 3 },
  { id: '4', name: 'Cooling System', slug: 'cooling-system', description: '散热器、水箱、冷却液管路', productCount: 15, order: 4 },
  { id: '5', name: 'Wheel Cover', slug: 'wheel-cover', description: '轮毂盖、轮罩', productCount: 21, order: 5 },
  { id: '6', name: 'Suspension System', slug: 'suspension-system', description: '减震器、弹簧、悬挂臂', productCount: 28, order: 6 },
  { id: '7', name: 'Steering System', slug: 'steering-system', description: '方向机、转向泵、助力管路', productCount: 12, order: 7 },
  { id: '8', name: 'Braking System', slug: 'braking-system', description: '刹车片、刹车盘、卡钳', productCount: 35, order: 8 },
  { id: '9', name: 'Other Automotive Accessories', slug: 'other-accessories', description: '其他汽车配件', productCount: 9, order: 9 },
];

function CategoriesPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });

  const handleLogout = async () => { await logout(); router.push('/login'); };

  const handleAdd = () => {
    setFormData({ name: '', slug: '', description: '' });
    setEditId(null);
    setShowForm(true);
  };

  const handleEdit = (cat: Category) => {
    setFormData({ name: cat.name, slug: cat.slug, description: cat.description });
    setEditId(cat.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;
    if (editId) {
      setCategories((prev) => prev.map((c) => c.id === editId ? { ...c, ...formData } : c));
    } else {
      const newCat: Category = {
        id: String(Date.now()),
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        productCount: 0,
        order: categories.length + 1,
      };
      setCategories((prev) => [...prev, newCat]);
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  if (!user) return null;

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">分类管理</h1>
          <p className="text-sm text-slate-500 mt-1">共 {categories.length} 个分类</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> 新建分类
        </button>
      </div>

      {/* 新建/编辑表单 */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">{editId ? '编辑分类' : '新建分类'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">分类名称 *</label>
              <input
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Headlights & Taillights"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">URL Slug</label>
              <input
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="headlights-taillights"
                value={formData.slug}
                onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">描述</label>
              <input
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="简短描述"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              保存
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-1.5 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 分类列表 */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">排序</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">分类名称</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">URL Slug</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">描述</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">产品数</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-slate-400 text-xs">{cat.order}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-slate-900">{cat.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{cat.slug}</td>
                <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{cat.description}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                    {cat.productCount}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleEdit(cat)}
                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export default withAuth(CategoriesPage);
