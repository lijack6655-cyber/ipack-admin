import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import AdminLayout from '@/components/layout/AdminLayout';
import { withAuth } from '@/components/auth/withAuth';
import { Camera, MessagesSquare, BriefcaseBusiness, Video, MessageCircle, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

type Platform = 'INSTAGRAM' | 'FACEBOOK' | 'LINKEDIN' | 'YOUTUBE' | 'TWITTER';
type PostStatus = 'SCHEDULED' | 'PUBLISHED' | 'FAILED';

interface ScheduledPost {
  id: string;
  date: string;
  time: string;
  platform: Platform;
  title: string;
  status: PostStatus;
}

const MOCK_POSTS: ScheduledPost[] = [];

const PLATFORM_INFO: Record<Platform, { label: string; icon: React.ElementType; cls: string }> = {
  INSTAGRAM: { label: 'Instagram', icon: Camera, cls: 'bg-pink-50 text-pink-600' },
  FACEBOOK: { label: 'Facebook', icon: MessagesSquare, cls: 'bg-blue-50 text-blue-600' },
  LINKEDIN: { label: 'LinkedIn', icon: BriefcaseBusiness, cls: 'bg-sky-50 text-sky-700' },
  YOUTUBE: { label: 'YouTube', icon: Video, cls: 'bg-red-50 text-red-600' },
  TWITTER: { label: 'X (Twitter)', icon: MessageCircle, cls: 'bg-slate-100 text-slate-700' },
};

const STATUS_INFO: Record<PostStatus, { label: string; cls: string; icon: React.ElementType }> = {
  SCHEDULED: { label: '待发布', cls: 'bg-blue-50 text-blue-700', icon: Clock },
  PUBLISHED: { label: '已发布', cls: 'bg-green-50 text-green-700', icon: CheckCircle2 },
  FAILED: { label: '发布失败', cls: 'bg-red-50 text-red-600', icon: AlertCircle },
};

function SocialCalendarPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [posts] = useState(MOCK_POSTS);

  const handleLogout = async () => { await logout(); router.push('/login'); };

  if (!user) return null;

  const grouped = posts.reduce<Record<string, ScheduledPost[]>>((acc, p) => {
    (acc[p.date] = acc[p.date] || []).push(p);
    return acc;
  }, {});

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">发布日历</h1>
        <p className="text-sm text-slate-500 mt-1">按日期查看各平台的社媒发布计划</p>
      </div>

      <div className="mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        社媒发布渠道尚未接入，当前无真实排期数据；待接入后再启用发布操作。
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-700">
              {date}
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((post) => {
                const platform = PLATFORM_INFO[post.platform];
                const status = STATUS_INFO[post.status];
                const PlatformIcon = platform.icon;
                const StatusIcon = status.icon;
                return (
                  <div key={post.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${platform.cls}`}>
                        <PlatformIcon className="w-4 h-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{post.title}</p>
                        <p className="text-xs text-slate-400">{platform.label} · {post.time}</p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.cls}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}

export default withAuth(SocialCalendarPage);
