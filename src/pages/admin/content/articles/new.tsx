import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { Save, X, Eye } from 'lucide-react';

const ARTICLE_CATEGORIES = ['Installation Guide', 'Product Review', 'Buying Guide', 'Maintenance', 'Industry News'];

function NewArticlePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    category: '',
    excerpt: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    tags: '',
    status: 'draft',
  });

  const handleLogout = async () => { await logout(); router.push('/login'); };
  const set = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const autoSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 60);

  const handleSave = async (status: 'draft' | 'published') => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    router.push('/admin/content/articles');
  };

  if (!user) return null;

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">新建文章</h1>
          <p className="text-sm text-slate-500 mt-1">创建 SEO 优化的汽配知识文章</p>
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
            className="px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
          >
            保存草稿
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? '发布中...' : '发布文章'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 主编辑区 */}
        <div className="lg:col-span-2 space-y-5">
          {/* 标题 */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <input
              type="text"
              className="w-full text-xl font-semibold text-slate-900 border-0 focus:outline-none placeholder-slate-300"
              placeholder="输入文章标题..."
              value={form.title}
              onChange={(e) => {
                set('title', e.target.value);
                if (!form.slug) set('slug', autoSlug(e.target.value));
              }}
            />
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-slate-400">URL: /blog/</span>
              <input
                type="text"
                className="flex-1 text-xs font-mono text-blue-600 border-b border-dashed border-slate-200 focus:outline-none focus:border-blue-400"
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
                placeholder="article-slug-here"
              />
            </div>
          </div>

          {/* 摘要 */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">文章摘要</label>
            <textarea
              className="w-full px-0 py-0 text-sm text-slate-600 border-0 focus:outline-none resize-none placeholder-slate-300"
              rows={2}
              placeholder="输入文章摘要（显示在列表页和搜索结果中）..."
              value={form.excerpt}
              onChange={(e) => set('excerpt', e.target.value)}
            />
          </div>

          {/* 正文 */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">正文内容</label>
              <button
                onClick={() => setPreview(!preview)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
              >
                <Eye className="w-3 h-3" />
                {preview ? '编辑模式' : '预览模式'}
              </button>
            </div>
            {preview ? (
              <div className="min-h-64 prose prose-sm max-w-none text-slate-700 border border-slate-100 rounded p-4 bg-slate-50">
                {form.content ? (
                  <pre className="whitespace-pre-wrap font-sans text-sm">{form.content}</pre>
                ) : (
                  <p className="text-slate-400 italic">暂无内容</p>
                )}
              </div>
            ) : (
              <textarea
                className="w-full px-3 py-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
                rows={16}
                placeholder={`# 文章标题\n\n## 第一部分\n\n在这里输入正文内容，支持 Markdown 格式...\n\n## 第二部分\n\n- 列表项 1\n- 列表项 2`}
                value={form.content}
                onChange={(e) => set('content', e.target.value)}
              />
            )}
            <p className="text-xs text-slate-400 mt-2">{form.content.length} 字符 · 支持 Markdown 格式</p>
          </div>

          {/* SEO 设置 */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">SEO 设置</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Meta 标题 <span className="text-slate-400">({form.metaTitle.length}/60)</span>
                </label>
                <input
                  type="text"
                  maxLength={60}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="留空则使用文章标题"
                  value={form.metaTitle}
                  onChange={(e) => set('metaTitle', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Meta 描述 <span className="text-slate-400">({form.metaDescription.length}/160)</span>
                </label>
                <textarea
                  maxLength={160}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="在搜索结果中显示的描述文字..."
                  value={form.metaDescription}
                  onChange={(e) => set('metaDescription', e.target.value)}
                />
              </div>
              {/* Google 预览 */}
              {(form.title || form.metaDescription) && (
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <p className="text-xs text-slate-400 mb-2">Google 搜索预览</p>
                  <p className="text-sm text-blue-700 font-medium line-clamp-1">
                    {form.metaTitle || form.title || '文章标题'}
                  </p>
                  <p className="text-xs text-green-700">https://ipackautoparts.com/blog/{form.slug || 'article-slug'}</p>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">
                    {form.metaDescription || form.excerpt || '文章描述将在这里显示...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 右侧设置 */}
        <div className="space-y-5">
          {/* 发布状态 */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">发布设置</h3>
            <select
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white mb-3"
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
            >
              <option value="draft">草稿（不公开）</option>
              <option value="published">立即发布</option>
            </select>
          </div>

          {/* 分类和标签 */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">分类 & 标签</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">文章分类</label>
                <select
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                >
                  <option value="">请选择分类</option>
                  {ARTICLE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">标签（逗号分隔）</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Toyota, Prius, LED, 车灯"
                  value={form.tags}
                  onChange={(e) => set('tags', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 写作提示 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-amber-800 mb-2">✍️ SEO 写作建议</h3>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>· 标题包含目标关键词（如车型名称）</li>
              <li>· 正文 800-1500 字最佳</li>
              <li>· 每200字配一张图片</li>
              <li>· Meta 描述控制在 120-160 字</li>
              <li>· 自然引用关联产品链接</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAuth(NewArticlePage);
