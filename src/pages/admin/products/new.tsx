import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { Save, X, Upload } from 'lucide-react';

const CATEGORIES = [
  'Headlights & Taillights',
  'Reversing Mirror',
  'Front and Rear Bumper Grille Brackets',
  'Cooling System',
  'Wheel Cover',
  'Suspension System',
  'Steering System',
  'Braking System',
  'Other Automotive Accessories',
];

const CAR_MODELS = ['Toyota Prius', 'Suzuki Swift', 'Toyota Axio', 'Toyota Corolla', 'Honda Fit', 'Nissan Sylphy', 'Universal'];

function NewProductPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    carModel: '',
    yearRange: '',
    price: '',
    comparePrice: '',
    stock: '',
    weight: '',
    description: '',
    specifications: '',
    status: 'draft',
  });

  const handleLogout = async () => { await logout(); router.push('/login'); };

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (status: 'draft' | 'active') => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => router.push('/admin/products'), 1000);
  };

  if (!user) return null;

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">新建产品</h1>
          <p className="text-sm text-slate-500 mt-1">填写产品信息后保存</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm"
          >
            <X className="w-4 h-4" /> 取消
          </button>
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
          >
            保存草稿
          </button>
          <button
            onClick={() => handleSave('active')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : saved ? '已保存 ✓' : '发布上架'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧主信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本信息 */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">基本信息</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">产品名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="如：LED Headlight Toyota Prius 2016-2022"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SKU 编码 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="如：HL-PRI-001"
                    value={form.sku}
                    onChange={(e) => set('sku', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">产品分类</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={form.category}
                    onChange={(e) => set('category', e.target.value)}
                  >
                    <option value="">请选择分类</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">适用车型</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={form.carModel}
                    onChange={(e) => set('carModel', e.target.value)}
                  >
                    <option value="">请选择车型</option>
                    {CAR_MODELS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">适用年份</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="如：2016-2022"
                    value={form.yearRange}
                    onChange={(e) => set('yearRange', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 产品描述 */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">产品描述</h2>
            <textarea
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={5}
              placeholder="输入产品描述（支持 Markdown 格式）..."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          {/* 产品规格 */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">产品规格</h2>
            <textarea
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
              rows={6}
              placeholder="每行一个规格，格式：规格名称: 规格值&#10;如：&#10;材质: ABS塑料&#10;灯泡类型: LED&#10;颜色: 透明"
              value={form.specifications}
              onChange={(e) => set('specifications', e.target.value)}
            />
          </div>

          {/* 图片上传区 */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">产品图片</h2>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center hover:border-blue-300 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">点击或拖拽上传图片</p>
              <p className="text-xs text-slate-400 mt-1">支持 JPG、PNG、WebP，最大 5MB</p>
            </div>
          </div>
        </div>

        {/* 右侧辅助信息 */}
        <div className="space-y-6">
          {/* 定价 */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">定价</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">售价 (USD) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    className="w-full pl-7 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">划线价 (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    className="w-full pl-7 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    value={form.comparePrice}
                    onChange={(e) => set('comparePrice', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 库存 */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">库存</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">库存数量</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  value={form.stock}
                  onChange={(e) => set('stock', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">重量 (kg)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.0"
                  value={form.weight}
                  onChange={(e) => set('weight', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 发布设置 */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">发布设置</h2>
            <select
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
            >
              <option value="draft">草稿（不公开）</option>
              <option value="active">上架（立即公开）</option>
              <option value="archived">下架</option>
            </select>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(NewProductPage);
