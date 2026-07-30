import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { Plus, Edit2, Trash2, Send, FileText } from 'lucide-react';

interface Draft {
  id: string;
  title: string;
  excerpt: string;
  platforms: string[];
  updatedAt: string;
  author: string;
}

const MOCK_DRAFTS: Draft[] = [
  { id: '1', title: '新款 LED 大灯上市文案', excerpt: '面向 Toyota Prius 车主的产品发布文案初稿...', platforms: ['Instagram', 'Facebook'], updatedAt: '2026-07-28 15:20', author: '编辑B' },
  { id: '2', title: 'Suzuki Swift 悬挂系统安装小贴士', excerpt: '分步讲解安装要点，适合搭配短视频发布...', platforms: ['YouTube'], updatedAt: '2026-07-27 10:05', author: '王工' },
  { id: '3', title: '海外展会参展预告', excerpt: '介绍即将参加的汽配展会及展位信息...', platforms: ['LinkedIn', 'X (Twitter)'], updatedAt: '2026-07-25 09:40', author: '管理员' },
  { id: '4', title: '客户案例：中东经销商合作故事', excerpt: '讲述与中东经销商长期合作的案例...', platforms: ['LinkedIn'], updatedAt: '2026-07-22 17:10', author: '编辑A' },
];

function SocialDraftsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [drafts, setDrafts] = useState(MOCK_DRAFTS);

  const handleLogout = async () => { await logout(); router.push('/login'); };

  const handleDelete = (id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  if (!user) return null;

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">草稿箱</h1>
          <p className="text-sm text-slate-500 mt-1">共 {drafts.length} 篇未发布草稿</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" /> 新建草稿
        </button>
      </div>

      <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        当前草稿为演示数据，用于展示草稿箱的交互形态；尚未接入真实发布渠道。
      </div>

      <div className="space-y-3">
        {drafts.map((draft) => (
          <div key={draft.id} className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <FileText className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{draft.title}</p>
                  <p className="text-sm text-slate-500 mt-1 truncate">{draft.excerpt}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {draft.platforms.map((p) => (
                      <span key={p} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                        {p}
                      </span>
                    ))}
                    <span className="text-xs text-slate-400">· 更新于 {draft.updatedAt} · {draft.author}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded transition-colors" title="编辑">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-1.5 hover:bg-green-50 text-slate-400 hover:text-green-600 rounded transition-colors" title="加入发布计划">
                  <Send className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(draft.id)}
                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}

export default withAuth(SocialDraftsPage);
