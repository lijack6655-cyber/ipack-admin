import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/lib/auth/store';
import AdminLayout from '@/components/layout/AdminLayout';
import { LogOut, Users, Package, FileText, BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <AdminLayout user={user} onLogout={handleLogout}>
      {/* 欢迎部分 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          欢迎回来，{user.firstName || user.email}
        </h1>
        <p className="text-slate-600">
          今天是 {new Date().toLocaleDateString('zh-CN', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          icon={Package}
          label="产品总数"
          value="127"
          trend="+12 本周"
          color="blue"
        />
        <StatsCard
          icon={FileText}
          label="文章总数"
          value="47"
          trend="+3 本周"
          color="green"
        />
        <StatsCard
          icon={Users}
          label="团队成员"
          value="5"
          trend="1 新成员"
          color="purple"
        />
        <StatsCard
          icon={BarChart3}
          label="网站访问"
          value="2.4K"
          trend="+8% 本周"
          color="orange"
        />
      </div>

      {/* 快速操作 */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold text-slate-900 mb-4">快速操作</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionButton href="/admin/products" label="添加产品" />
          <QuickActionButton href="/admin/content/articles" label="发布文章" />
          <QuickActionButton href="/admin/accounts" label="管理团队" />
        </div>
      </div>

      {/* 最近活动 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">最近活动</h2>
        <ActivityList />
      </div>
    </AdminLayout>
  );
}

// 统计卡片组件
function StatsCard({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  color = 'blue' 
}: {
  icon: any;
  label: string;
  value: string;
  trend: string;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{label}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          <p className="text-xs mt-2 opacity-75">{trend}</p>
        </div>
        <Icon className="w-8 h-8 opacity-25" />
      </div>
    </div>
  );
}

// 快速操作按钮
function QuickActionButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-center px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
    >
      {label}
    </a>
  );
}

// 活动列表
function ActivityList() {
  const activities = [
    {
      id: 1,
      type: '文章发布',
      description: '发布文章：LED车灯安装指南',
      time: '2小时前',
      actor: '李工',
    },
    {
      id: 2,
      type: '产品编辑',
      description: '编辑产品：LED车灯 - Toyota Axio',
      time: '5小时前',
      actor: '王工',
    },
    {
      id: 3,
      type: '权限变更',
      description: '添加新成员：编辑权限',
      time: '1天前',
      actor: '管理员',
    },
    {
      id: 4,
      type: '视频上传',
      description: '上传视频：产品演示',
      time: '2天前',
      actor: '编辑B',
    },
  ];

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-4 pb-4 border-b border-slate-200 last:border-0"
        >
          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-900">{activity.type}</p>
                <p className="text-sm text-slate-600 mt-1">{activity.description}</p>
              </div>
              <span className="text-xs text-slate-500">{activity.time}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">by {activity.actor}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
